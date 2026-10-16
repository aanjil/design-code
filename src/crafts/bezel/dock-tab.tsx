import { useSyncExternalStore } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, Stop } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { MASTER_IA } from '@/crafts/master-ia'
import { bezelDirector, useBezelDirector } from './director'
import type { BezelEdge, BezelMode } from './floating-bezel'

/**
 * The Master App mock dock's "Bezel" tab - put the one Bezel into any mode
 * or situation on demand (bezel_7.html's control bar, living in the dock).
 * Every button calls the live Bezel through the director; the highlight is
 * what the Bezel is actually doing right now, not what was last clicked.
 */

type Btn = { mode: BezelMode; label: string; hint: string }

const GROUPS: Array<{ title: string; hint?: string; items: Array<Btn> }> = [
  {
    title: 'Bezel',
    items: [
      { mode: 'quiet', label: 'Quiet', hint: 'nothing needs you - hidden in the Master App' },
      { mode: 'scanning', label: 'Scanning', hint: 'process line, sweeps then finds' },
      { mode: 'found', label: 'Found', hint: 'the claim, rows tint underneath' },
      { mode: 'expanded', label: 'Expanded', hint: 'sheet grows from the bar' },
      { mode: 'tension', label: 'Tension', hint: 'low confidence, equal exits' },
      { mode: 'acting', label: 'Acting · undo', hint: "this page's first exit, 30s undo ring" },
      { mode: 'run', label: 'Run in flight', hint: 'full gradient, follows you across pages' },
    ],
  },
  {
    title: 'Selection',
    hint: "uses the rows you ticked - or 3 demo rows if none",
    items: [
      { mode: 'bulk', label: 'Bulk', hint: 'count, total, what they share' },
      { mode: 'context', label: 'As context', hint: 'rows travel with your question' },
    ],
  },
  {
    title: 'Talk',
    items: [
      { mode: 'ask', label: 'Ask', hint: 'the claim yields to an input · ⌘E' },
      { mode: 'voice', label: 'Voice command', hint: 'waveform, heard scope' },
      { mode: 'copilot', label: 'Sidebar thread', hint: 'the bar travels into the column · ⇧⌘E' },
    ],
  },
]

const MODE_LABEL: Partial<Record<BezelMode, string>> = {
  copilot: 'Sidebar thread',
  agent: 'Emma driving',
  context: 'As context',
  acting: 'Acting · undo',
  run: 'Run in flight',
}

/* ---------------- ▶ Play states (module-level so closing the panel doesn't stop it) ---------------- */

const TOUR: Array<[BezelMode, number]> = [
  ['quiet', 1600],
  ['scanning', 2300],
  ['found', 2400],
  ['expanded', 3000],
  ['tension', 3200],
  ['acting', 2600],
  ['bulk', 3000],
  ['context', 3000],
  ['copilot', 3200],
  ['ask', 2400],
  ['run', 2800],
]
let tourTimers: Array<number> = []
let touring = false
const tourListeners = new Set<() => void>()
const setTouring = (on: boolean) => {
  touring = on
  tourListeners.forEach((l) => l())
}
function stopTour() {
  tourTimers.forEach((t) => window.clearTimeout(t))
  tourTimers = []
  setTouring(false)
}
function playTour() {
  stopTour()
  setTouring(true)
  let t = 0
  for (const [mode, ms] of TOUR) {
    tourTimers.push(window.setTimeout(() => bezelDirector.call('setMode', mode), t))
    t += ms
  }
  tourTimers.push(
    window.setTimeout(() => {
      bezelDirector.call('reset')
      setTouring(false)
    }, t),
  )
}
function useTouring() {
  return useSyncExternalStore(
    (l) => {
      tourListeners.add(l)
      return () => tourListeners.delete(l)
    },
    () => touring,
    () => false,
  )
}

/* ---------------- tab ---------------- */

export function BezelDockTab() {
  const s = useBezelDirector()
  const playing = useTouring()

  if (!s.available) {
    return <p className="text-paragraph-small text-muted">No Bezel on this section.</p>
  }

  const section = MASTER_IA.find((x) => x.key === s.section)?.label ?? s.section
  const where = s.docked ? 'Sidebar' : s.home === 'immersive' ? `Immersive · ${s.edge}` : 'Dock'
  const set = (mode: BezelMode) => {
    stopTour()
    bezelDirector.call('setMode', mode)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* What the live Bezel is doing right now */}
      <div className="flex items-center gap-2 rounded-xl bg-base px-3 py-2 borders-base">
        <span className="size-2 shrink-0 rounded-full bg-niural-ai-colors-gradient" />
        <span className="min-w-0 flex-1 truncate text-label-xsmall text-primary">
          {section} · {MODE_LABEL[s.mode] ?? s.mode[0].toUpperCase() + s.mode.slice(1)}
          <span className="text-muted"> · {where}</span>
        </span>
        <button
          type="button"
          onClick={() => (playing ? stopTour() : playTour())}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-full px-3 text-label-xsmall transition-colors',
            playing ? 'bg-(--text-base) text-(--background-base)' : 'bg-highlight text-primary hover:bg-muted',
          )}
        >
          {playing ? <Stop weight="fill" className="size-3" /> : <Play weight="fill" className="size-3" />}
          {playing ? 'Stop' : 'Play states'}
        </button>
      </div>

      {GROUPS.map((g) => (
        <Group key={g.title} title={g.title} hint={g.hint}>
          <div className="grid grid-cols-4 gap-1.5">
            {g.items.map((b) => (
              <Chip key={b.mode} on={s.mode === b.mode} title={b.hint} onClick={() => set(b.mode)}>
                {b.label}
              </Chip>
            ))}
          </div>
        </Group>
      ))}

      <Group title="Agent" hint="voice → Emma drives the app, stops before anything commits">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              stopTour()
              bezelDirector.call('startAgent')
            }}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-niural-ai-colors-gradient px-3 text-label-xsmall text-on-color transition-opacity hover:opacity-90"
          >
            🎙 Voice · run payroll
          </button>
          {s.agentRunning && (
            <button
              type="button"
              onClick={() => bezelDirector.call('stopAgent')}
              className="h-9 rounded-xl bg-base px-3 text-label-xsmall text-primary borders-base hover:bg-highlight"
            >
              Stop
            </button>
          )}
        </div>
      </Group>

      <div className="grid grid-cols-2 gap-4">
        <Group title="Where Emma lives">
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              <Chip on={!s.docked && s.home === 'dock'} onClick={() => bezelDirector.call('place', { docked: false, home: 'dock' })}>
                Dock
              </Chip>
              <Chip on={s.docked} onClick={() => bezelDirector.call('place', { docked: true })}>
                Sidebar
              </Chip>
              <Chip on={!s.docked && s.home === 'immersive'} onClick={() => bezelDirector.call('place', { docked: false, home: 'immersive' })}>
                Immersive
              </Chip>
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  ['left', ArrowLeft],
                  ['top', ArrowUp],
                  ['bottom', ArrowDown],
                  ['right', ArrowRight],
                ] as Array<[BezelEdge, typeof ArrowUp]>
              ).map(([edge, Icon]) => (
                <button
                  key={edge}
                  type="button"
                  aria-label={`Immersive, ${edge} edge`}
                  title={`Immersive, ${edge} edge · ⌃⌥ + arrow`}
                  onClick={() => bezelDirector.call('place', { docked: false, home: 'immersive', edge })}
                  className={cn(
                    'flex h-8 flex-1 items-center justify-center rounded-lg transition-colors',
                    !s.docked && s.home === 'immersive' && s.edge === edge ? 'bg-brand-base text-brand' : 'bg-base text-muted borders-base hover:text-primary',
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Situation">
          <div className="flex flex-col gap-1.5">
            <Row label={s.attention ? 'This page opens on a finding' : 'This page is quiet on arrival'} />
            <Row label={`${s.pinsWaiting} pinned from other sections`}>
              {s.pinsDismissed > 0 && <SmallBtn onClick={() => bezelDirector.call('restorePins')}>Restore {s.pinsDismissed}</SmallBtn>}
            </Row>
            <Row label={s.selected ? `${s.selected} rows selected` : 'No rows selected'} />
            <SmallBtn
              onClick={() => {
                stopTour()
                bezelDirector.call('reset')
              }}
            >
              Reset to what this page says
            </SmallBtn>
          </div>
        </Group>
      </div>
    </div>
  )
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-caption-sm text-muted">
        <span className="font-medium text-primary">{title}</span>
        {hint && <span> · {hint}</span>}
      </p>
      {children}
    </div>
  )
}

function Chip({ on, title, onClick, children }: { on?: boolean; title?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'flex h-9 items-center justify-center rounded-xl px-2 text-label-xsmall transition-[background-color,box-shadow]',
        on ? 'bg-base text-primary borders-shadow' : 'bg-base text-muted borders-base hover:text-primary',
      )}
    >
      {children}
    </button>
  )
}

function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-7 items-center justify-between gap-2">
      <span className="truncate text-caption-sm text-primary">{label}</span>
      {children}
    </div>
  )
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 rounded-lg bg-highlight px-2.5 text-label-xsmall text-primary transition-colors hover:bg-muted"
    >
      {children}
    </button>
  )
}
