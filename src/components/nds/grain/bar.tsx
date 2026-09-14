import { cn } from '@/lib/utils'
import { useCountdown } from './hooks'

/**
 * Shell bar furniture (docs/foundations/grain.md #component-taxonomy,
 * Atom layer - "Inline input" plus the small live indicators the Floater
 * needs once it's talking about work instead of hosting a grain: a
 * status dot, a reading/listening pulse, and an undo ring. None of these
 * carry a claim - they decorate the bar, they don't answer anything.
 */

export type BarDotTone = 'idle' | 'live' | 'warn'

const dotToneClass: Record<BarDotTone, string> = {
  idle: 'bg-text-disabled',
  live: 'bg-grain-ink',
  warn: 'bg-background-warning-base',
}

export function StatusDot({ tone = 'idle', pulse = false }: { tone?: BarDotTone; pulse?: boolean }) {
  return (
    <span className="relative flex size-1.5 shrink-0 items-center justify-center">
      {pulse && (
        <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', dotToneClass[tone])} />
      )}
      <span className={cn('relative inline-flex size-1.5 rounded-full', dotToneClass[tone])} />
    </span>
  )
}

/** Three bouncing dots - "reading" without a claim yet (process layer). */
export function ScanDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block size-1 rounded-full bg-text-muted animate-bar-scan"
          style={{ animationDelay: `${i * 0.14}s` }}
        />
      ))}
    </span>
  )
}

/** A heard-voice waveform - replaces the mic while listening/processing a
 *  spoken command, never while idle. */
export function Waveform({ bars = 7 }: { bars?: number }) {
  return (
    <span className="flex h-[22px] shrink-0 items-center gap-[3px]">
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="block w-[2.5px] rounded-full bg-grain-ink animate-bar-waveform"
          style={{ animationDelay: `${(i % 4) * 0.09}s` }}
        />
      ))}
    </span>
  )
}

/** A live countdown ring for an in-place "Acting… reversible for Ns" bar -
 *  the SVG analog of ExitButton's text countdown, sized for the bar
 *  rather than a footer button. */
export function UndoRing({
  seconds,
  onExpire,
  size = 26,
}: {
  seconds: number
  onExpire?: () => void
  size?: number
}) {
  const remaining = useCountdown(seconds, onExpire)
  const r = size / 2 - 2.2
  const c = 2 * Math.PI * r
  const pct = seconds > 0 ? remaining / seconds : 0
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-border-base" strokeWidth={2.2} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none stroke-grain-ink transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute font-mono text-[9px] font-semibold text-text-muted">{remaining}</span>
    </span>
  )
}
