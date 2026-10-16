import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  CaretDown,
  CaretUp,
  Microphone,
  PaperPlaneRight,
  SidebarSimple,
  X,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { EMPLOYEES_BEZEL } from '@/mocks/bezel'
import type { BezelBulkAction, BezelRow } from './selection'
import type { BezelScript } from '@/mocks/bezel'
import { Shell, type BezelAmbient } from '@/components/nds/grain/shell'
import { ChatHead } from './chat-head'
import { EmmaBot } from './emma-bot'
import type { EmmaState } from '@/components/emma-avatar'
import { Thread, type PinnedInitiative, type ThreadTurn } from '@/components/nds/grain/thread'
import { Grain, type GrainProps } from '@/components/nds/grain/grain'
import { ScanDots, UndoRing, Waveform } from '@/components/nds/grain/bar'

/**
 * The one floating object (bezel.html, ported): bottom-centre bar or
 * docked-right copilot column, never both, never a second overlay.
 * Purely presentational + local composer/measurement state - the state
 * machine itself (mode, selection, acting record, thread) lives in the
 * host screen so it can also drive the checkbox table and the frozen
 * catalog windows from the same source of truth.
 */

export type BezelMode =
  | 'quiet'
  | 'scanning'
  | 'found'
  | 'expanded'
  | 'tension'
  | 'acting'
  | 'run'
  | 'voice'
  | 'bulk'
  | 'context'
  | 'copilot'
  /** Bezel doc: the only state where the claim yields to an input (⌘E). */
  | 'ask'
  /** Voice -> Emma drives the app with her own cursor (voice-run.ts). */
  | 'agent'

/** What the bar says while Emma's cursor drives. listening/heard = your
 *  voice (light, waveform); driving/hesitating = her hands on the app (the
 *  bar fills with the AI gradient); ready/handed = she let go. */
export type AgentPhase = 'listening' | 'heard' | 'driving' | 'hesitating' | 'ready' | 'handed'

export interface AgentBar {
  phase: AgentPhase
  claim: string
  sub: string
  actions: Array<{ label: string; primary?: boolean; onSelect: () => void }>
}

/** Agent mode controls the host owns (stop, assist toggle). */
export interface AgentControls {
  bar: AgentBar
  /** Stop listening / dismiss what she handed back. */
  onStop: () => void
  /** Assist = stop at the first judgment; offered before she starts. */
  assist: boolean
  onToggleAssist: () => void
}

export type BezelEdge = 'bottom' | 'top' | 'left' | 'right'
/** Where the bar sits along its edge - three snap slots, nothing finer. */
export type BezelAlign = 'left' | 'center' | 'right'

const BAR_W = 660
/** Wide states (a sheet, ask, undo) on a side edge - a card off the edge. */
const SIDE_CARD_W = 440
/** Immersive: Emma as a chat head - a 56px orb on an edge. */
const HEAD = 56
const PANEL_W = 400
const GAP = 14
/** Pointer travel before a press on the bar becomes a drag (taps stay taps). */
const DRAG_SLOP = 5

/** States the head carries alone (with a preview bubble); anything that
 *  needs room opens a card beside the head, like a chat window. */
const HEAD_MODES: ReadonlyArray<BezelMode> = ['quiet', 'found', 'scanning', 'run']

/** Minimal pill: avatar + one glance line. States that need the full bar
 *  (you're speaking, selecting, typing, or Emma is driving) can't shrink -
 *  the pill steps aside for them and comes back after. */
const NO_MINI: ReadonlyArray<BezelMode> = ['voice', 'bulk', 'context', 'ask', 'agent']
/** pl-1.5 + 36px avatar + gap-2 + pr-4 around the glance text. */
const MINI_CHROME = 6 + 36 + 8 + 16
const MINI_MAX = 340

/** The pill's one line - the claim's headline, without the detail clause. */
function glanceFor(mode: BezelMode, script: BezelScript, acting: { label: string } | null): string {
  const head = (s: string) => s.split(' - ')[0]
  switch (mode) {
    case 'scanning':
      return script.scanLabel
    case 'found':
    case 'expanded':
      return head(script.found.claim)
    case 'tension':
      return head(script.tension.claim)
    case 'acting':
      return acting?.label ?? head(script.found.claim)
    case 'run':
      return head(script.run.claim)
    default:
      return head(script.quiet.claim)
  }
}

export interface BezelHeadConfig {
  /** 0-1 position along the edge (Messenger-style: heads sit anywhere on it). */
  along: number
  /** Things waiting - the badge on the orb. */
  badge: number
  /** A drag on the orb (before the hold opens the orbit) moves it. */
  onDragAway: (startX: number, startY: number, pointerId: number) => void
  /** Orbit "Dock": go back to the bar. */
  onDock: () => void
}

function useContainerSize(ref: React.RefObject<HTMLElement | null>, selfRef: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  // Layout effect: measured in the same commit, so a view transition's
  // "after" snapshot already contains the laid-out bezel. Refs attach
  // child-first, so when the host's container ref isn't set yet, measure
  // our own positioned parent - the same box the bezel lays out in.
  useLayoutEffect(() => {
    const el = ref.current ?? (selfRef.current?.offsetParent as HTMLElement | null)
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])
  return size
}

export function FloatingBezel({
  containerRef,
  mode,
  onModeChange,
  pinned = [],
  pinnedOverflow = 0,
  onDismissPins,
  selection,
  bulk,
  onClearSelection,
  onRemoveFromSelection,
  acting,
  onAct,
  onUndoActing,
  threadTitle,
  threadTurns,
  onSendFollowUp,
  onSendContext,
  agent,
  interactive = true,
  script = EMPLOYEES_BEZEL,
  edge = 'bottom',
  align,
  onAlignChange,
  topInset = 0,
  head,
  dockFill = false,
  accessory,
  transitionName,
  className,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  mode: BezelMode
  onModeChange: (mode: BezelMode) => void
  pinned?: Array<PinnedInitiative>
  pinnedOverflow?: number
  onDismissPins?: () => void
  /** Ticked rows, described by the page (selection.tsx). */
  selection: Array<BezelRow>
  /** How the bulk bar reads the selection: total, what it shares, actions. */
  bulk?: { noun: string; nounPlural?: string; total: string; note: string; actions: Array<BezelBulkAction> }
  onClearSelection: () => void
  onRemoveFromSelection: (id: string) => void
  acting: { label: string; grain: GrainProps; onContinue?: { label: string; to: BezelMode } } | null
  onAct: (label: string, grain: GrainProps, onContinue?: { label: string; to: BezelMode }) => void
  onUndoActing: () => void
  threadTitle: string
  threadTurns: Array<ThreadTurn>
  onSendFollowUp: (text: string) => void
  onSendContext: (text: string) => void
  /** Required for mode 'agent'. */
  agent?: AgentControls | null
  /** false for the frozen review catalog: holds a state still instead of
   *  auto-advancing (scanning -> found after 1.9s) or auto-expiring the
   *  undo countdown - a reviewer should see exactly the state they clicked. */
  interactive?: boolean
  /** What the bar says - the Employees page by default; the Master App
   *  passes one per section (src/mocks/master-bezel.ts). */
  script?: BezelScript
  /** Which edge the bar (Dock) or the head (Immersive) sits on. */
  edge?: BezelEdge
  /** Bar slot along its edge. Uncontrolled (local state) when omitted. */
  align?: BezelAlign
  /** Drag the bar sideways; release snaps it to the nearest slot. */
  onAlignChange?: (align: BezelAlign) => void
  /** Chrome to clear when floating on top (e.g. a 58px AppBar). */
  topInset?: number
  /** Immersive: render as a chat head on `edge` (orbit menu on hold). */
  head?: BezelHeadConfig
  /** Docked thread fills the container's width instead of a 400px column -
   *  for hosts that size the container themselves (Master App columns). */
  dockFill?: boolean
  /** Extra control beside the copilot button (bar) and in the thread header. */
  accessory?: React.ReactNode
  /** CSS view-transition-name, so a host can morph bar <-> column. */
  transitionName?: string
  className?: string
}) {
  const selfRef = useRef<HTMLDivElement>(null)
  const { w: containerW, h: containerH } = useContainerSize(containerRef, selfRef)
  const [composer, setComposer] = useState('')
  const [minimal, setMinimal] = useState(false)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [glanceW, setGlanceW] = useState(200)
  const [ownAlign, setOwnAlign] = useState<BezelAlign>(align ?? 'center')
  const slot = align ?? ownAlign
  /** Live horizontal offset while the bar is being dragged; null at rest. */
  const [dragDx, setDragDx] = useState<number | null>(null)
  const docked = mode === 'copilot'
  const canMini = !head && !docked && !NO_MINI.includes(mode)
  const mini = minimal && canMini
  const glance = glanceFor(mode, script, acting)
  const hasSheet = !mini && (mode === 'expanded' || mode === 'tension' || mode === 'acting')
  const hasDock = hasSheet || mode === 'context'

  // Observed, not read once: the webfont can land after the first measure.
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setGlanceW(Math.ceil(el.offsetWidth)))
    ro.observe(el)
    setGlanceW(Math.ceil(el.offsetWidth))
    return () => ro.disconnect()
  }, [containerW > 0])

  // Scanning is a timed process, not a state the user picks - auto-advance.
  useEffect(() => {
    if (mode !== 'scanning' || !interactive) return
    const t = window.setTimeout(() => onModeChange('found'), 1900)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, interactive])

  useEffect(() => {
    setComposer('')
  }, [mode])

  if (!containerW) {
    return <div ref={selfRef} className={cn('absolute inset-x-0 bottom-3.5 h-0', className)} />
  }

  let style: React.CSSProperties
  let headStyle: React.CSSProperties | null = null
  /** Which side of the head things open toward (toward the screen). */
  let toward: 'right' | 'left' | 'down' | 'up' = 'up'
  if (docked) {
    const width = dockFill ? containerW - GAP * 2 : PANEL_W
    style = { left: containerW - width - GAP, width, top: GAP, bottom: GAP, height: containerH - GAP * 2 }
  } else if (head) {
    // Chat head: the orb on its edge, at `along`; a card opens beside it.
    const top0 = topInset + GAP
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
    const cx =
      edge === 'left' ? GAP + HEAD / 2 : edge === 'right' ? containerW - GAP - HEAD / 2 : clamp(head.along * containerW, GAP + HEAD / 2, containerW - GAP - HEAD / 2)
    const cy =
      edge === 'top'
        ? top0 + HEAD / 2
        : edge === 'bottom'
          ? containerH - GAP - HEAD / 2
          : clamp(top0 + head.along * (containerH - top0 - GAP), top0 + HEAD / 2, containerH - GAP - HEAD / 2)
    headStyle = { left: cx - HEAD / 2, top: cy - HEAD / 2, width: HEAD, height: HEAD, viewTransitionName: 'emma-head' }
    toward = edge === 'left' ? 'right' : edge === 'right' ? 'left' : edge === 'top' ? 'down' : 'up'
    // Bulk carries a claim plus several actions - give it bar width.
    const width = Math.min(mode === 'bulk' || mode === 'context' ? 620 : SIDE_CARD_W, containerW - 28)
    const off = HEAD / 2 + 10
    if (toward === 'right' || toward === 'left') {
      const mid = clamp(cy, top0 + 140, containerH - GAP - 140)
      style = { width, top: mid, transform: 'translateY(-50%)', left: toward === 'right' ? cx + off : cx - off - width }
    } else {
      const left = clamp(cx - width / 2, GAP, containerW - GAP - width)
      style = toward === 'down' ? { width, left, top: cy + off } : { width, left, bottom: containerH - cy + off }
    }
  } else {
    const width = mini ? Math.min(MINI_CHROME + glanceW, MINI_MAX, containerW - 28) : Math.min(BAR_W, containerW - 28)
    const left = barLeft(slot, width, containerW) + (dragDx ?? 0)
    style = edge === 'top' ? { left, width, top: GAP + topInset } : { left, width, bottom: GAP }
  }
  if (transitionName) style.viewTransitionName = transitionName
  const headOnly = !!head && !docked && HEAD_MODES.includes(mode)
  const canSlide = interactive && !head && !docked && (edge === 'bottom' || edge === 'top')

  /** Sideways drag: follows the pointer, release snaps to left / centre /
   *  right by where the bar's middle landed. Buttons still tap - a press
   *  only becomes a drag past DRAG_SLOP, and the click it ends on is eaten. */
  function startSlide(e: React.PointerEvent<HTMLDivElement>) {
    if (!canSlide || e.button !== 0) return
    if ((e.target as HTMLElement).closest('input, textarea')) return
    const width = typeof style.width === 'number' ? style.width : BAR_W
    const rest = barLeft(slot, width, containerW)
    const lo = GAP - rest
    const hi = containerW - GAP - width - rest
    const sx = e.clientX
    const sy = e.clientY
    let dragging = false
    let dx = 0
    const move = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) < DRAG_SLOP) return
      if (!dragging) {
        dragging = true
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
      }
      dx = Math.min(hi, Math.max(lo, ev.clientX - sx))
      setDragDx(dx)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (!dragging) return
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      const eat = (ev: MouseEvent) => {
        ev.stopPropagation()
        ev.preventDefault()
      }
      window.addEventListener('click', eat, { capture: true, once: true })
      window.setTimeout(() => window.removeEventListener('click', eat, { capture: true }), 0)
      const mid = (rest + dx + width / 2) / containerW
      const next: BezelAlign = mid < 1 / 3 ? 'left' : mid > 2 / 3 ? 'right' : 'center'
      setOwnAlign(next)
      onAlignChange?.(next)
      setDragDx(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function send(kind: 'followup' | 'context') {
    const text = composer.trim()
    if (!text) return
    setComposer('')
    if (kind === 'followup') onSendFollowUp(text)
    else onSendContext(text)
  }

  const headEl =
    head && headStyle && !docked ? (
      <ChatHead
        style={headStyle}
        head={head}
        mode={mode}
        script={script}
        toward={toward}
        bubble={headOnly}
        onModeChange={onModeChange}
      />
    ) : null

  if (headOnly) return headEl

  return (
    <>
    {headEl}
    <div
      data-bezel-root
      onPointerDown={canSlide ? startSlide : undefined}
      className={cn(
        'absolute z-30 flex flex-col transition-[left,width,top,bottom,height] duration-[460ms] ease-[cubic-bezier(.22,1,.36,1)]',
        canSlide && 'cursor-grab',
        dragDx !== null && 'transition-none cursor-grabbing',
        className,
      )}
      style={style}
    >
      {docked ? (
        <Thread
          title={threadTitle}
          onCollapse={() => onModeChange('found')}
          onClose={() => onModeChange('quiet')}
          pinned={pinned}
          pinnedOverflow={pinnedOverflow}
          onDismissPinned={onDismissPins}
          turns={threadTurns}
          actions={accessory}
          className="mb-2.5 min-h-0 flex-1"
        />
      ) : null}

      <Shell
        variant="bezel"
        ambient={ambientFor(mode)}
        className={cn(
          'mx-0 max-w-none shrink-0 transition-[height] duration-[460ms] ease-[cubic-bezier(.22,1,.36,1)]',
          hasDock ? 'h-auto' : mini ? 'h-[44px]' : 'h-[54px]',
        )}
        rowClassName={mini ? 'h-[44px] gap-2 pl-1.5 pr-4' : undefined}
        dock={hasSheet ? modeDock(script, mode, acting, onAct, onModeChange) : mode === 'context' ? contextDock(selection, bulk?.noun ?? 'row', bulk?.nounPlural, onRemoveFromSelection) : undefined}
        grain={undefined}
        tone={mode === 'run' || (mode === 'agent' && (agent?.bar.phase === 'driving' || agent?.bar.phase === 'hesitating')) ? 'ai' : 'light'}
        progress={mode === 'scanning' ? 88 : undefined}
        row={
          <>
            {/* Off-screen twin of the glance line - the pill's width hugs it. */}
            <span ref={measureRef} aria-hidden className="pointer-events-none invisible absolute whitespace-nowrap text-label-small font-normal">
              {glance}
            </span>
            {/* The avatar is the toggle: tap Emma to tuck the bar into a pill,
                tap again to bring it back. She stays put; everything else moves. */}
            <button
              type="button"
              onClick={() => setMinimal((v) => !v)}
              disabled={!canMini}
              aria-label={mini ? 'Expand Emma' : 'Minimize Emma'}
              aria-expanded={!mini}
              title={canMini ? (mini ? 'Expand' : 'Minimize') : undefined}
              className={cn(
                '-my-1 flex shrink-0 rounded-full transition-[margin,transform] duration-[460ms] ease-[cubic-bezier(.22,1,.36,1)] enabled:cursor-pointer enabled:hover:scale-[1.06] enabled:active:scale-95',
                mini ? 'ml-0 scale-[.86] enabled:hover:scale-[.92]' : '-ml-1.5',
              )}
            >
              <EmmaBot
                mode={mode}
                // Agent: listens to your voice, works while it drives, needs you
                // when it hesitates, awake once it has handed back.
                state={mode === 'agent' && agent ? agentEmmaState(agent.bar.phase) : undefined}
              />
            </button>
            <div key={mini ? 'mini' : 'full'} className="bezel-swap flex min-w-0 flex-1 items-center gap-2.5">
            {mini ? (
              <button
                type="button"
                onClick={() => setMinimal(false)}
                className={cn(
                  'min-w-0 flex-1 truncate text-left text-label-small font-normal',
                  mode === 'run' ? 'text-on-color' : 'text-primary',
                )}
              >
                {glance}
              </button>
            ) : mode === 'agent' && agent ? agentRow(agent) : modeRow({
          script,
          accessory,
          mode,
          selection,
          bulk,
          composer,
          setComposer,
          onModeChange,
          onClearSelection,
          onRemoveFromSelection,
          onAct,
          onUndoActing: interactive ? onUndoActing : undefined,
          acting,
          send,
        })}
            </div>
          </>
        }
      />
    </div>
    </>
  )
}

/** The bar's resting x for a slot - corners sit one GAP in from the edge. */
function barLeft(slot: BezelAlign, width: number, containerW: number): number {
  if (slot === 'left') return GAP
  if (slot === 'right') return containerW - GAP - width
  return Math.round((containerW - width) / 2)
}

/** Agent mode: your voice -> her hands -> handed back. */
function agentRow({ bar, onStop, assist, onToggleAssist }: AgentControls): React.ReactNode {
  const onAi = bar.phase === 'driving' || bar.phase === 'hesitating'
  const voice = bar.phase === 'listening' || bar.phase === 'heard'
  return (
    <>
      <div className="min-w-0 flex-1">
        <span className={cn('block truncate text-label-small font-normal', onAi ? 'text-on-color' : 'text-primary')}>{bar.claim}</span>
        <span className={cn('block truncate font-mono text-caption-xs', onAi ? 'text-on-color/75' : 'text-muted')}>{bar.sub}</span>
      </div>
      {voice && <Waveform bars={bar.phase === 'listening' ? 7 : 4} />}
      {voice && (
        // Assist vs full run - decided before she touches anything.
        <button
          type="button"
          onClick={onToggleAssist}
          aria-pressed={assist}
          title={assist ? 'Stop at the first decision' : 'Drive to the last reversible step'}
          className="flex h-8 shrink-0 items-center rounded-full bg-(--elevation-alpha-8) px-3 font-mono text-caption-xs text-muted transition-colors hover:bg-(--elevation-alpha-12) hover:text-primary"
        >
          {assist ? 'assist only' : 'full run'}
        </button>
      )}
      {bar.actions.map((a) =>
        onAi ? (
          <button
            key={a.label}
            type="button"
            onClick={a.onSelect}
            className={cn(
              'flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-label-xsmall transition-[background-color,transform] active:scale-[.97]',
              a.primary ? 'bg-white text-brand hover:opacity-90' : 'bg-white/15 text-on-color hover:bg-white/25',
            )}
          >
            {a.label}
          </button>
        ) : (
          <BarButton key={a.label} primary={a.primary} onClick={a.onSelect}>
            {a.label}
          </BarButton>
        ),
      )}
      {voice ? (
        <MicButton recording onClick={onStop} />
      ) : (
        !onAi && (
          <button
            type="button"
            onClick={onStop}
            aria-label="Dismiss"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-(--elevation-alpha-8) hover:text-primary"
          >
            <X className="size-3.5" />
          </button>
        )
      )}
    </>
  )
}

function modeDock(
  script: BezelScript,
  mode: BezelMode,
  acting: { label: string; grain: GrainProps; onContinue?: { label: string; to: BezelMode } } | null,
  onAct: (label: string, grain: GrainProps, onContinue?: { label: string; to: BezelMode }) => void,
  onModeChange: (mode: BezelMode) => void,
): React.ReactNode {
  if (mode === 'acting' && acting) {
    return <Grain {...acting.grain} liveness={{ kind: 'stamped', asOf: '14:22' }} />
  }
  if (mode === 'expanded') {
    return (
      <Grain
        claim={script.found.claim}
        confidence={script.found.confidence}
        facts={script.found.facts}
        provenance={script.found.provenance}
        exits={[{ label: script.found.nextLabel, variant: 'quiet', onSelect: () => onModeChange('tension') }]}
      />
    )
  }
  if (mode === 'tension') {
    return (
      <Grain
        claim={script.tension.claim}
        confidence={script.tension.confidence}
        facts={script.tension.facts}
        provenance={script.tension.provenance}
        risk
        exits={script.tension.exits((result) =>
          onAct(
            result,
            { claim: result, liveness: { kind: 'stamped', asOf: '14:22' }, provenance: 'resolved by you · logged' },
            script.tension.continueLabel ? { label: script.tension.continueLabel, to: 'run' } : undefined,
          ),
        )}
      />
    )
  }
  return undefined
}

function contextDock(selection: Array<BezelRow>, noun: string, nounPlural: string | undefined, onRemove: (id: string) => void): React.ReactNode {
  return (
    <div className="flex flex-col gap-2 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] font-semibold tracking-wide text-disabled">
          {selection.length} {(selection.length === 1 ? noun : (nounPlural ?? `${noun}s`)).toUpperCase()} ATTACHED · THEY TRAVEL WITH YOUR QUESTION
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {selection.map((e) => (
          <span
            key={e.id}
            className="flex items-center gap-1.5 rounded-md border border-base bg-surface-frame px-2 py-1.5 text-label-xsmall text-primary"
          >
            <b className="max-w-[160px] truncate font-medium">{e.label}</b>
            <span className="tabular-nums text-[10px] text-muted">{e.value}</span>
            <button
              type="button"
              onClick={() => onRemove(e.id)}
              aria-label={`Remove ${e.label}`}
              className="flex size-3.5 items-center justify-center rounded-[4px] text-disabled hover:bg-highlight hover:text-primary"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function modeRow(args: {
  script: BezelScript
  accessory?: React.ReactNode
  mode: BezelMode
  selection: Array<BezelRow>
  bulk?: { noun: string; nounPlural?: string; total: string; note: string; actions: Array<BezelBulkAction> }
  composer: string
  setComposer: (v: string) => void
  onModeChange: (mode: BezelMode) => void
  onClearSelection: () => void
  onRemoveFromSelection: (id: string) => void
  onAct: (label: string, grain: GrainProps, onContinue?: { label: string; to: BezelMode }) => void
  onUndoActing: (() => void) | undefined
  acting: { label: string; grain: GrainProps; onContinue?: { label: string; to: BezelMode } } | null
  send: (kind: 'followup' | 'context') => void
}): React.ReactNode {
  const { script, accessory, mode, selection, bulk, composer, setComposer, onModeChange, onClearSelection, onAct, onUndoActing, acting, send } = args

  switch (mode) {
    case 'quiet':
      return (
        <ClaimRow
          claim={script.quiet.claim}
          sub={script.quiet.sub}
          onClaimClick={() => onModeChange('scanning')}
          actions={
            <>
              <DockButton onClick={() => onModeChange('copilot')} />
              {accessory}
              <MicButton onClick={() => onModeChange('voice')} />
            </>
          }
        />
      )
    case 'scanning':
      return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 text-label-small font-normal text-primary">
          <ScanDots />
          <span>{script.scanLabel}</span>
        </div>
      )
    case 'found':
      return (
        <ClaimRow
          claim={script.found.claim}
          sub={script.found.provenance}
          actions={
            <>
              <ExpandButton label="Show me" onClick={() => onModeChange('expanded')} />
              <DockButton onClick={() => onModeChange('copilot')} />
              {accessory}
              <MicButton onClick={() => onModeChange('voice')} />
            </>
          }
        />
      )
    case 'expanded':
      return (
        <ClaimRow
          claim={script.found.claim}
          sub="showing the breakdown"
          actions={
            <>
              <ExpandButton label="Hide" flipped onClick={() => onModeChange('found')} />
              <DockButton onClick={() => onModeChange('copilot')} />
              {accessory}
            </>
          }
        />
      )
    case 'tension':
      return (
        <ClaimRow
          claim={script.tension.claim}
          sub={`.${String(Math.round(script.tension.confidence * 100)).padStart(2, '0')} · pick one to resolve it`}
          actions={<ExpandButton label="Hide" flipped onClick={() => onModeChange('found')} />}
        />
      )
    case 'acting':
      return (
        <>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-label-small font-normal text-primary">{acting?.label}</span>
            <span className="block truncate font-mono text-caption-xs text-muted">reversible for 30s</span>
          </div>
          <UndoRing seconds={30} onExpire={onUndoActing} />
          <BarButton onClick={onUndoActing ?? (() => {})}>Undo</BarButton>
          {acting?.onContinue && (
            <BarButton primary onClick={() => onModeChange(acting.onContinue!.to)}>
              {acting.onContinue.label}
            </BarButton>
          )}
        </>
      )
    case 'run':
      return (
        <>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-label-small">{script.run.claim}</span>
            <span className="block truncate font-mono text-caption-xs text-on-color/75">
              {script.run.sub}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onModeChange('quiet')}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-on-color/80 transition-colors hover:bg-white/15 hover:text-on-color"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </>
      )
    case 'voice':
      return (
        <>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-label-small font-normal text-primary">“{script.voice.command}”</span>
            <span className="block truncate font-mono text-caption-xs text-muted">{script.voice.scope}</span>
          </div>
          <Waveform />
          <BarButton
            primary
            onClick={() =>
              onAct(script.voice.result, {
                claim: script.voice.result,
                liveness: { kind: 'stamped', asOf: '14:22' },
                provenance: 'heard command · logged',
              })
            }
          >
            Do it
          </BarButton>
          <MicButton recording onClick={() => onModeChange('quiet')} />
        </>
      )
    case 'bulk': {
      const n = selection.length
      return (
        <>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-2 truncate text-label-small font-normal text-primary">
              <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-(--text-base) px-1 tabular-nums text-caption-xs font-medium text-(--background-base)">
                {n}
              </span>
              <span className="truncate">
                {n} {n === 1 ? (bulk?.noun ?? 'row') : (bulk?.nounPlural ?? `${bulk?.noun ?? 'row'}s`)} selected{bulk?.total ? ` · ${bulk.total}` : ''}
              </span>
            </span>
            {bulk?.note && <span className="block truncate font-mono text-caption-xs text-muted">{bulk.note}</span>}
          </div>
          {bulk?.actions.map((a) => (
            <BarButton
              key={a.label}
              onClick={() => {
                const result = a.onSelect()
                if (result)
                  onAct(result, {
                    claim: result,
                    liveness: { kind: 'stamped', asOf: '14:22' },
                    provenance: 'actioned by you · logged · reversible for 30s',
                  })
              }}
            >
              {a.icon}
              {a.label}
            </BarButton>
          ))}
          <BarButton primary onClick={() => onModeChange('context')}>
            Ask about these ↗
          </BarButton>
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Clear selection"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-(--elevation-alpha-8) hover:text-primary"
          >
            <X className="size-3.5" />
          </button>
        </>
      )
    }
    case 'ask':
    case 'context':
    case 'copilot':
      return (
        <>
          <input
            data-bezel-input
            autoFocus={mode === 'ask'}
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send(mode === 'context' ? 'context' : 'followup')
              if (e.key === 'Escape' && mode === 'ask') {
                e.stopPropagation()
                onModeChange('quiet')
              }
            }}
            placeholder={
              mode === 'context'
                ? `Ask about these ${selection.length} ${selection.length === 1 ? (bulk?.noun ?? 'row') : (bulk?.nounPlural ?? `${bulk?.noun ?? 'row'}s`)}`
                : mode === 'ask'
                  ? `Ask Emma about ${script.askAbout ?? 'this page'}`
                  : 'Ask a follow-up'
            }
            className="h-9 min-w-0 flex-1 bg-transparent text-paragraph-small text-primary outline-none placeholder:text-muted"
          />
          {!composer.trim() ? (
            <MicButton onClick={() => (mode === 'context' ? undefined : onModeChange('voice'))} />
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={() => send(mode === 'context' ? 'context' : 'followup')}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--text-base) text-(--background-base) transition-transform active:scale-95"
            >
              <PaperPlaneRight className="size-3.5" />
            </button>
          )}
        </>
      )
    default:
      return null
  }
}

function ClaimRow({
  claim,
  sub,
  actions,
  onClaimClick,
}: {
  claim: string
  sub?: string
  actions?: React.ReactNode
  onClaimClick?: () => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClaimClick}
        disabled={!onClaimClick}
        className={cn('min-w-0 flex-1 text-left', onClaimClick && 'cursor-pointer')}
      >
        <span className="block truncate text-label-small font-normal text-primary">{claim}</span>
        {sub && <span className="block truncate font-mono text-caption-xs text-muted">{sub}</span>}
      </button>
      {actions}
    </>
  )
}

function DockButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open copilot"
      title="Open copilot"
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-(--elevation-alpha-8) hover:text-primary"
    >
      <SidebarSimple className="size-3.5" />
    </button>
  )
}

function MicButton({ onClick, recording }: { onClick: () => void; recording?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Use voice"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
        recording ? 'bg-error text-on-color' : 'text-muted hover:bg-(--elevation-alpha-8) hover:text-primary',
      )}
    >
      <Microphone className="size-3.5" />
    </button>
  )
}

function ExpandButton({ label, flipped, onClick }: { label: string; flipped?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-1 flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-(--elevation-alpha-8) pr-2.5 pl-3.5 text-label-xsmall text-primary transition-colors hover:bg-(--elevation-alpha-12)"
    >
      {label}
      {flipped ? <CaretDown className="size-3" /> : <CaretUp className="size-3" />}
    </button>
  )
}

function BarButton({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-label-xsmall transition-[background-color,transform] active:scale-[.97]',
        primary
          ? 'bg-(--text-base) text-(--background-base) hover:opacity-90'
          : 'bg-(--elevation-alpha-8) text-primary hover:bg-(--elevation-alpha-12)',
      )}
    >
      {children}
    </button>
  )
}

/** How present the Bezel's ambient light is in each state (styles.css). */
function ambientFor(mode: BezelMode): BezelAmbient {
  switch (mode) {
    case 'found':
    case 'expanded':
      return 'attention'
    case 'tension':
      return 'tension'
    case 'scanning':
      return 'scanning'
    case 'run':
    case 'voice':
    case 'acting':
    case 'agent':
      return 'working'
    case 'ask':
    case 'bulk':
    case 'context':
    case 'copilot':
      return 'focus'
    default:
      return 'quiet'
  }
}

function agentEmmaState(phase: AgentPhase): EmmaState {
  if (phase === 'listening' || phase === 'heard') return 'listening'
  if (phase === 'driving') return 'working'
  if (phase === 'hesitating') return 'attention'
  return 'idle'
}
