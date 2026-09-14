import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Small presentational pieces the payroll/expense run recreations share -
 * everything that carries a *finding* still goes through <Grain>; these
 * are the surrounding scaffolding grain-flows_2.html itself keeps outside
 * the grain (timeline step headers, the collapsed "✓ done" line, locked
 * placeholders).
 */

export function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>
}

export function Step({
  n,
  title,
  summary,
  children,
}: {
  n: number
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="font-mono text-label-xs text-text-disabled">{n}</span>
        <b className="text-label-md text-text-primary">{title}</b>
        <span className="ml-auto font-mono text-[11px] text-text-muted">{summary}</span>
      </div>
      {children}
    </div>
  )
}

export function Locked({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] text-text-disabled">{children}</p>
}

export function Collapsed({ children, changeLabel }: { children: React.ReactNode; changeLabel?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border-base bg-background-base px-3 py-2.5 text-paragraph-xs text-text-muted">
      <Check weight="bold" className="size-3.5 shrink-0 text-text-success-base" />
      <span className="min-w-0 flex-1">{children}</span>
      {changeLabel && <span className="shrink-0 font-mono text-[10.5px] text-text-disabled">{changeLabel}</span>}
    </div>
  )
}

export function SectionLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn('mb-2.5 font-mono text-[10px] tracking-wide text-text-disabled', className)}>
      {children}
    </p>
  )
}

/** grain-flows_2.html's `.note` - the small mono rationale line under a
 *  step, always led by a bold all-caps clause. */
export function Note({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn('max-w-[80ch] font-mono text-[10.5px] leading-[1.6] text-text-muted', className)}>
      {children}
    </p>
  )
}
