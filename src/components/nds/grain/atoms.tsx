import { cn } from '@/lib/utils'
import type { GrainDensity, GrainExit, GrainFact, GrainFactTone, GrainLiveness } from './types'
import { useCountdown } from './hooks'

/**
 * The six-part anatomy (docs/foundations/grain.md #04): Claim, Confidence,
 * Liveness, Evidence, Provenance, Exit. Evidence is whatever real product
 * UI the caller passes as <Grain>'s `body` - it has no atom of its own.
 */

/* ---------------- 2 · Confidence ---------------- */

export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  return (
    <span className="inline-flex items-center gap-1">
      <i className="relative block h-[3px] w-6 rounded-full bg-base/25">
        <b
          className="absolute inset-y-0 left-0 block rounded-full bg-base transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </i>
      <span className="tabular-nums text-paragraph-xsmall text-(--background-base)/70">
        .{String(pct).padStart(2, '0')}
      </span>
    </span>
  )
}

/* ---------------- 3 · Liveness ---------------- */

export function LivenessBadge({ liveness, badge }: { liveness: GrainLiveness; badge?: string }) {
  if (badge) {
    return (
      <span className="whitespace-nowrap rounded-sm bg-base/15 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-wide text-(--background-base)">
        {badge}
      </span>
    )
  }
  if (liveness.kind === 'stamped') {
    return (
      <span className="whitespace-nowrap rounded-sm bg-base/15 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-wide text-(--background-base)">
        AS OF {liveness.asOf}
      </span>
    )
  }
  return null
}

/* ---------------- 5 · Provenance ---------------- */

export function Provenance({ children }: { children: React.ReactNode }) {
  return (
    <span className="min-w-[130px] flex-1 font-mono text-[10.5px] leading-[1.4] text-muted">
      {children}
    </span>
  )
}

/* ---------------- 6 · Exit ---------------- */

const exitVariantClass: Record<NonNullable<GrainExit['variant']>, string> = {
  primary: 'bg-(--text-base) text-(--background-base) border-transparent hover:opacity-90',
  default: 'bg-base text-primary border-base hover:border-(--text-muted)',
  quiet: 'border-transparent bg-transparent text-muted hover:text-primary',
}

export function ExitButton({ exit }: { exit: GrainExit }) {
  const remaining = useCountdown(exit.countdownSeconds, exit.onExpire)
  const expired = exit.countdownSeconds != null && remaining <= 0
  const label =
    exit.countdownSeconds != null && !expired
      ? `${exit.label} · ${remaining}s`
      : expired
        ? 'Window closed'
        : exit.label

  return (
    <button
      type="button"
      disabled={exit.disabled || expired}
      onClick={exit.onSelect}
      className={cn(
        'whitespace-nowrap rounded-md border px-2.5 py-1.5 text-label-xsmall transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        exitVariantClass[exit.variant ?? 'default'],
      )}
    >
      {label}
    </button>
  )
}

/* ---------------- facts table (part of Evidence in the compact case) ---------------- */

const factToneClass: Record<GrainFactTone, string> = {
  default: 'text-primary',
  add: 'text-success',
  del: 'text-disabled line-through',
  warn: 'text-warning',
  stop: 'text-error',
  muted: 'text-disabled',
}

export function FactsTable({ facts, dimmedFrom }: { facts: Array<GrainFact>; dimmedFrom?: number }) {
  return (
    <table className="w-full border-collapse text-paragraph-xsmall">
      <tbody>
        {facts.map((f, i) => {
          const dimmed = dimmedFrom != null && i >= dimmedFrom
          return (
            <tr key={i} className="border-b border-base last:border-b-0">
              <td className={cn('py-1.5 pr-3 text-muted', dimmed && 'text-disabled')}>
                {f.label}
              </td>
              <td
                className={cn(
                  'py-1.5 text-right tabular-nums text-paragraph-xsmall whitespace-nowrap',
                  dimmed ? 'text-disabled' : factToneClass[f.tone ?? 'default'],
                )}
              >
                {f.value}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** Small mono badge for density/terminal/liveness read-outs in docs and the
 *  controller - not part of the grain card itself. */
export function MetaPill({ children, tone }: { children: React.ReactNode; tone?: 'default' | 'brand' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide',
        tone === 'brand'
          ? 'bg-brand-muted text-brand'
          : 'bg-highlight text-muted',
      )}
    >
      {children}
    </span>
  )
}

export function densityLabel(density: GrainDensity): string {
  return { high: 'HIGH', medium: 'MEDIUM', low: 'LOW' }[density]
}
