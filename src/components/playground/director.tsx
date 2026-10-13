import { useEffect, useState } from 'react'
import {
  ArrowCounterClockwise,
  CaretDown,
  ClockClockwise,
  FastForward,
  Pause,
  Play,
  SkipForward,
} from '@phosphor-icons/react'
import { Kbd } from './kbd'
import type { Instance, Tone } from '@/mocks/engine'
import { fmtDuration, useEngine, useMockEngine } from '@/mocks/engine'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Director - the presenter's remote for a mock-engine world. Lives outside
 * the app window (and survives Play mode) so you can mature the data mid-
 * demo: play the clock, jump to the next thing that happens, or push one
 * record along by hand. Collapsed it's one pill; `D` toggles it open.
 */

const SPEEDS: Array<{ value: number; label: string; title: string }> = [
  { value: 60, label: '1m/s', title: '1 minute per second' },
  { value: 3_600, label: '1h/s', title: '1 hour per second' },
  { value: 86_400, label: '1d/s', title: '1 day per second' },
]

const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-background-emphasis',
  info: 'bg-background-info-base',
  warning: 'bg-background-warning-base',
  success: 'bg-background-success-base',
  error: 'bg-background-error-base',
}

const clockFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})

function fmtClock(t: number): string {
  return clockFmt.format(t).replace(/,(?=[^,]*$)/, ' ·')
}

export function Director({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const engine = useMockEngine()
  const now = useEngine((s) => s.now)
  const startedAt = useEngine((s) => s.startedAt)
  const playing = useEngine((s) => s.playing)
  const speed = useEngine((s) => s.speed)
  const instances = useEngine((s) => s.instances)
  const log = useEngine((s) => s.log)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      setOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const nextDue = engine.nextDueAt()
  const elapsed = now - startedAt
  const list = Object.values(instances)

  return (
    <div
      className={cn(
        'z-[85] w-80 overflow-hidden rounded-2xl bg-background-base/90 shadow-flyout backdrop-blur',
        className,
      )}
      style={style}
    >
      {/* Clock row - always visible */}
      <div className="flex items-center gap-1 p-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={playing ? 'Pause clock' : 'Play clock'}
          title={playing ? 'Pause' : 'Play - let the data mature'}
          onClick={playing ? engine.pause : engine.play}
        >
          {playing ? <Pause weight="fill" /> : <Play weight="fill" />}
        </Button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          title="Director (D)"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-background-highlight"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-mono-xs text-text-primary">{fmtClock(now)}</span>
            <span className="block truncate text-caption text-text-muted">
              {elapsed > 0 ? `+${fmtDuration(elapsed)} since start` : 'World start'}
              {nextDue !== null && ` · next in ${fmtDuration(nextDue - now)}`}
            </span>
          </span>
          <CaretDown className={cn('size-3 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Jump to next event"
          title="Jump to the next thing that happens"
          disabled={nextDue === null}
          onClick={engine.next}
        >
          <SkipForward weight="fill" />
        </Button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border-muted p-3">
          {/* Time controls */}
          <div className="flex items-center gap-1">
            <FastForward className="size-3 shrink-0 text-text-muted" />
            {SPEEDS.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.title}
                aria-pressed={speed === s.value}
                onClick={() => engine.setSpeed(s.value)}
                className={cn(
                  'h-6 rounded-md px-1.5 font-mono text-mono-xs transition-colors',
                  speed === s.value
                    ? 'bg-brand-primary text-text-on-color'
                    : 'text-text-muted hover:bg-background-highlight hover:text-text-primary',
                )}
              >
                {s.label}
              </button>
            ))}
            <span className="flex-1" />
            {(['1h', '1d'] as const).map((step) => (
              <button
                key={step}
                type="button"
                title={`Advance ${step}`}
                onClick={() => engine.advance(step)}
                className="flex h-6 items-center gap-1 rounded-md px-1.5 font-mono text-mono-xs text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
              >
                <ClockClockwise className="size-3" />+{step}
              </button>
            ))}
            <Button variant="ghost" size="icon-sm" aria-label="Reset world" title="Reset to world start" onClick={engine.reset}>
              <ArrowCounterClockwise />
            </Button>
          </div>

          {/* Instances */}
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {list.map((inst) => (
              <InstanceRow key={inst.id} inst={inst} now={now} />
            ))}
          </ul>

          {/* Recent log */}
          {log.length > 0 && (
            <ol className="max-h-24 overflow-y-auto">
              {log
                .slice(-6)
                .reverse()
                .map((l, i) => {
                  const flow = engine.flow(instances[l.instanceId].flowId)
                  return (
                    <li key={`${l.at}-${l.instanceId}-${i}`} className="flex gap-2 truncate text-caption text-text-muted">
                      <span className="shrink-0 font-mono">{fmtClock(l.at).split(' · ')[1]}</span>
                      <span className="truncate">
                        {instances[l.instanceId].label} → {flow.states[l.to].label}
                        {l.cause !== 'time' && ` (${l.event ? (flow.events?.[l.event] ?? l.event) : 'forced'})`}
                      </span>
                    </li>
                  )
                })}
            </ol>
          )}

          <p className="text-caption text-text-muted">
            <Kbd>D</Kbd> toggles · data is virtual time, same every reload
          </p>
        </div>
      )}
    </div>
  )
}

function InstanceRow({ inst, now }: { inst: Instance; now: number }) {
  const engine = useMockEngine()
  const flow = engine.flow(inst.flowId)
  const state = flow.states[inst.state]
  const events = Object.keys(state.on ?? {})
  const nextLabel = state.after ? flow.states[state.after.to].label : null

  return (
    <li className="rounded-lg px-2 py-1.5 hover:bg-background-highlight">
      <div className="flex items-center gap-2">
        <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT[state.tone ?? 'neutral'])} />
        <span className="min-w-0 flex-1 truncate text-label-xs text-text-primary">{inst.label}</span>
        <select
          aria-label={`${inst.label} state`}
          value={inst.state}
          onChange={(e) => engine.force(inst.id, e.target.value)}
          className="h-6 shrink-0 rounded-md bg-transparent px-1 text-caption-md text-text-muted hover:bg-background-base"
        >
          {Object.entries(flow.states).map(([id, s]) => (
            <option key={id} value={id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {(nextLabel || events.length > 0) && (
        <div className="flex items-center gap-1 pl-4">
          {nextLabel && inst.dueAt !== null && (
            <span className="min-w-0 flex-1 truncate text-caption text-text-muted">
              {nextLabel} in {fmtDuration(inst.dueAt - now)}
            </span>
          )}
          {!nextLabel && <span className="flex-1" />}
          {events.map((ev) => (
            <button
              key={ev}
              type="button"
              onClick={() => engine.send(inst.id, ev)}
              className="h-5 shrink-0 rounded-md px-1.5 text-caption-md text-brand-text transition-colors hover:bg-background-base"
            >
              {flow.events?.[ev] ?? ev}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
