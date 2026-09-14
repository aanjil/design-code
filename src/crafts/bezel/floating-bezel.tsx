import { useEffect, useState } from 'react'
import {
  CaretDown,
  CaretUp,
  Export,
  Microphone,
  PaperPlaneRight,
  Receipt,
  SidebarSimple,
  X,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Employee } from '@/mocks/employees'
import { fmtCompensation } from '@/mocks/employees'
import {
  FOUND_CLAIM,
  FOUND_CONFIDENCE,
  FOUND_FACTS,
  FOUND_PROVENANCE,
  RUN_CLAIM,
  TENSION_CLAIM,
  TENSION_CONFIDENCE,
  TENSION_FACTS,
  TENSION_PROVENANCE,
  VOICE_COMMAND,
  VOICE_RESULT,
  VOICE_SCOPE,
  describeSelection,
  tensionExits,
} from '@/mocks/bezel'
import { Shell } from '@/components/nds/grain/shell'
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

const BAR_W = 660
const PANEL_W = 400
const GAP = 14

function useContainerSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
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
  onClearSelection,
  onRemoveFromSelection,
  acting,
  onAct,
  onUndoActing,
  threadTitle,
  threadTurns,
  onSendFollowUp,
  onSendContext,
  interactive = true,
  className,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  mode: BezelMode
  onModeChange: (mode: BezelMode) => void
  pinned?: Array<PinnedInitiative>
  pinnedOverflow?: number
  onDismissPins?: () => void
  selection: Array<Employee>
  onClearSelection: () => void
  onRemoveFromSelection: (id: string) => void
  acting: { label: string; grain: GrainProps; onContinue?: { label: string; to: BezelMode } } | null
  onAct: (label: string, grain: GrainProps, onContinue?: { label: string; to: BezelMode }) => void
  onUndoActing: () => void
  threadTitle: string
  threadTurns: Array<ThreadTurn>
  onSendFollowUp: (text: string) => void
  onSendContext: (text: string) => void
  /** false for the frozen review catalog: holds a state still instead of
   *  auto-advancing (scanning -> found after 1.9s) or auto-expiring the
   *  undo countdown - a reviewer should see exactly the state they clicked. */
  interactive?: boolean
  className?: string
}) {
  const { w: containerW, h: containerH } = useContainerSize(containerRef)
  const [composer, setComposer] = useState('')
  const docked = mode === 'copilot'
  const hasSheet = mode === 'expanded' || mode === 'tension' || mode === 'acting'
  const hasDock = hasSheet || mode === 'context'

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
    return <div className={cn('absolute inset-x-0 bottom-3.5 h-0', className)} />
  }

  const width = docked ? PANEL_W : Math.min(BAR_W, containerW - 28)
  const left = docked ? containerW - width - GAP : Math.round((containerW - width) / 2)
  const style: React.CSSProperties = docked
    ? { left, width, top: GAP, bottom: GAP, height: containerH - GAP * 2 }
    : { left, width, bottom: GAP }

  function send(kind: 'followup' | 'context') {
    const text = composer.trim()
    if (!text) return
    setComposer('')
    if (kind === 'followup') onSendFollowUp(text)
    else onSendContext(text)
  }

  return (
    <div
      className={cn('absolute z-30 flex flex-col transition-[left,width,top,bottom,height] duration-[460ms] ease-[cubic-bezier(.22,1,.36,1)]', className)}
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
          className="mb-2.5 min-h-0 flex-1"
        />
      ) : null}

      <Shell
        className={cn(
          'mx-0 max-w-none shrink-0 shadow-[0_6px_22px_rgba(30,22,50,.13)]',
          hasDock ? 'h-auto' : 'h-[54px]',
        )}
        dock={hasSheet ? modeDock(mode, acting, onAct, onModeChange) : mode === 'context' ? contextDock(selection, onRemoveFromSelection) : undefined}
        grain={undefined}
        tone={mode === 'run' ? 'dark' : 'light'}
        status={statusFor(mode)}
        progress={mode === 'scanning' ? 88 : undefined}
        row={modeRow({
          mode,
          selection,
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
      />
    </div>
  )
}

function statusFor(mode: BezelMode): { tone: 'idle' | 'live' | 'warn'; pulse?: boolean } | undefined {
  if (mode === 'scanning') return { tone: 'warn' }
  if (mode === 'found' || mode === 'expanded') return { tone: 'live', pulse: true }
  if (mode === 'tension') return { tone: 'warn', pulse: true }
  if (mode === 'bulk' || mode === 'voice') return { tone: 'live' }
  return undefined
}

function modeDock(
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
        claim={FOUND_CLAIM}
        confidence={FOUND_CONFIDENCE}
        facts={FOUND_FACTS}
        provenance={FOUND_PROVENANCE}
        exits={[{ label: 'See the pay-equity flag', variant: 'quiet', onSelect: () => onModeChange('tension') }]}
      />
    )
  }
  if (mode === 'tension') {
    return (
      <Grain
        claim={TENSION_CLAIM}
        confidence={TENSION_CONFIDENCE}
        facts={TENSION_FACTS}
        provenance={TENSION_PROVENANCE}
        risk
        exits={tensionExits((result) =>
          onAct(result, { claim: result, liveness: { kind: 'stamped', asOf: '14:22' }, provenance: 'resolved by you · logged against run PR-0621' }, {
            label: 'Continue to payroll run',
            to: 'run',
          }),
        )}
      />
    )
  }
  return undefined
}

function contextDock(selection: Array<Employee>, onRemove: (id: string) => void): React.ReactNode {
  return (
    <div className="flex flex-col gap-2 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] font-semibold tracking-wide text-text-disabled">
          {selection.length} {selection.length === 1 ? 'ROW' : 'ROWS'} ADDED AS CONTEXT
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {selection.map((e) => (
          <span
            key={e.id}
            className="flex items-center gap-1.5 rounded-md border border-border-base bg-surface-1 px-2 py-1.5 text-label-xs text-text-primary"
          >
            <b className="max-w-[140px] truncate font-medium">{e.name}</b>
            <span className="font-mono text-[10px] text-text-muted">{fmtCompensation(e)}</span>
            <button
              type="button"
              onClick={() => onRemove(e.id)}
              aria-label={`Remove ${e.name}`}
              className="flex size-3.5 items-center justify-center rounded-[4px] text-text-disabled hover:bg-background-highlight hover:text-text-primary"
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
  mode: BezelMode
  selection: Array<Employee>
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
  const { mode, selection, composer, setComposer, onModeChange, onClearSelection, onAct, onUndoActing, acting, send } = args

  switch (mode) {
    case 'quiet':
      return (
        <ClaimRow
          claim="Nothing needs you on this page"
          sub="57 employees · headcount steady this week · click to ask Emma"
          onClaimClick={() => onModeChange('scanning')}
          actions={
            <>
              <DockButton onClick={() => onModeChange('copilot')} />
              <MicButton onClick={() => onModeChange('voice')} />
            </>
          }
        />
      )
    case 'scanning':
      return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 text-paragraph-sm text-text-primary">
          <ScanDots />
          <span>Reading 312 runs</span>
        </div>
      )
    case 'found':
      return (
        <ClaimRow
          claim={FOUND_CLAIM}
          sub={FOUND_PROVENANCE}
          actions={
            <>
              <ExpandButton label="Show me" onClick={() => onModeChange('expanded')} />
              <DockButton onClick={() => onModeChange('copilot')} />
              <MicButton onClick={() => onModeChange('voice')} />
            </>
          }
        />
      )
    case 'expanded':
      return (
        <ClaimRow
          claim={FOUND_CLAIM}
          sub="showing the breakdown"
          actions={
            <>
              <ExpandButton label="Hide" flipped onClick={() => onModeChange('found')} />
              <DockButton onClick={() => onModeChange('copilot')} />
            </>
          }
        />
      )
    case 'tension':
      return (
        <ClaimRow
          claim={TENSION_CLAIM}
          sub={`.${String(Math.round(0.41 * 100)).padStart(2, '0')} · pick one to resolve it`}
          actions={<ExpandButton label="Hide" flipped onClick={() => onModeChange('found')} />}
        />
      )
    case 'acting':
      return (
        <>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-paragraph-sm text-text-primary">{acting?.label}</span>
            <span className="block truncate font-mono text-[10px] text-text-muted">reversible for 30s</span>
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
            <span className="block truncate text-paragraph-sm">{RUN_CLAIM}</span>
            <span className="block truncate font-mono text-[10px] text-grain-ink-foreground/60">
              step 2 of 3 · nothing submitted · follows you across pages
            </span>
          </div>
          <button
            type="button"
            onClick={() => onModeChange('quiet')}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-grain-ink-foreground/70 hover:bg-white/10 hover:text-grain-ink-foreground"
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
            <span className="block truncate text-paragraph-sm text-text-primary">“{VOICE_COMMAND}”</span>
            <span className="block truncate font-mono text-[10px] text-text-muted">{VOICE_SCOPE}</span>
          </div>
          <Waveform />
          <BarButton
            primary
            onClick={() =>
              onAct(VOICE_RESULT, {
                claim: VOICE_RESULT,
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
      const summary = describeSelection(selection)
      const totalComp = selection.reduce((n, e) => n + (e.compensationType === 'Salary' ? e.compensation : e.compensation * 2080), 0)
      return (
        <>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-2 truncate text-paragraph-sm text-text-primary">
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] bg-grain-ink font-mono text-[9px] font-semibold text-grain-ink-foreground">
                {selection.length}
              </span>
              {selection.length} selected · {fmtCompensation({ compensationType: 'Salary', compensation: totalComp } as Employee)}
            </span>
            <span className="block truncate font-mono text-[10px] text-text-muted">{summary.note}</span>
          </div>
          <BarButton
            onClick={() =>
              onAct(`Re-billed ${selection.length} rows`, {
                claim: `Re-billed ${selection.length} rows`,
                liveness: { kind: 'stamped', asOf: '14:22' },
                provenance: 'actioned by you · logged · reversible for 30s',
              })
            }
          >
            <Receipt className="size-3.5" />
          </BarButton>
          <BarButton
            onClick={() =>
              onAct(`Exported ${selection.length} rows`, {
                claim: `Exported ${selection.length} rows`,
                liveness: { kind: 'stamped', asOf: '14:22' },
                provenance: 'actioned by you · logged · reversible for 30s',
              })
            }
          >
            <Export className="size-3.5" />
          </BarButton>
          <BarButton primary onClick={() => onModeChange('context')}>
            Ask about these ↗
          </BarButton>
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Clear selection"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-background-highlight hover:text-text-primary"
          >
            <X className="size-3.5" />
          </button>
        </>
      )
    }
    case 'context':
    case 'copilot':
      return (
        <>
          <input
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send(mode === 'context' ? 'context' : 'followup')
            }}
            placeholder={mode === 'context' ? `Ask about these ${selection.length} rows` : 'Ask a follow-up'}
            className="h-8 min-w-0 flex-1 bg-transparent text-paragraph-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          {!composer.trim() ? (
            <MicButton onClick={() => {}} />
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={() => send(mode === 'context' ? 'context' : 'followup')}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-grain-ink text-text-on-color"
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
        <span className="block truncate text-paragraph-sm text-text-primary">{claim}</span>
        {sub && <span className="block truncate font-mono text-[10px] text-text-muted">{sub}</span>}
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
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-base text-text-muted transition-colors hover:border-text-muted hover:text-text-primary"
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
        'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
        recording ? 'bg-background-error-base text-text-on-color' : 'text-text-muted hover:bg-background-highlight hover:text-text-primary',
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
      className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-base bg-background-base px-2.5 py-1.5 text-label-xs text-text-primary transition-colors hover:border-text-muted"
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
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-label-xs transition-colors',
        primary
          ? 'border-transparent bg-grain-ink text-grain-ink-foreground hover:opacity-90'
          : 'border-border-base bg-background-base text-text-primary hover:border-text-muted',
      )}
    >
      {children}
    </button>
  )
}
