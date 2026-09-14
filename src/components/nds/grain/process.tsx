import { cn } from '@/lib/utils'

/**
 * Process layer (docs/foundations/grain.md #component-catalog). Work in
 * progress. Never a claim bar - the moment something asserts, it
 * graduates into a <Grain>. Kept in its own file so that boundary is
 * structural, not just a rule someone has to remember.
 */

export function Skeleton({ widths = ['70%', '45%'], note }: { widths?: Array<string>; note?: string }) {
  return (
    <div className="rounded-lg border border-border-base bg-background-base p-3">
      {widths.map((w, i) => (
        <div
          key={i}
          className="mb-1.5 h-2.5 rounded-sm bg-[linear-gradient(90deg,var(--background-highlight),var(--background-base),var(--background-highlight))] last:mb-0"
          style={{ width: w }}
        />
      ))}
      {note && <p className="mt-1.5 text-caption text-text-muted">{note}</p>}
    </div>
  )
}

export type ProcessStepStatus = 'pending' | 'active' | 'done'

export interface ProcessStep {
  label: string
  status: ProcessStepStatus
}

export function StepList({ steps }: { steps: Array<ProcessStep> }) {
  return (
    <div className="rounded-lg border border-border-base bg-background-base p-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2 py-1 text-paragraph-sm text-text-muted">
          <span
            className={cn(
              'block size-1.5 shrink-0 rounded-full',
              s.status === 'done' && 'bg-grain-ink',
              s.status === 'active' && 'bg-background-warning-base',
              s.status === 'pending' && 'bg-border-muted',
            )}
          />
          <span className={s.status !== 'pending' ? 'text-text-primary' : undefined}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

export function ToolChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="mr-1.5 mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-border-base bg-surface-1 px-2 py-1 font-mono text-mono-xs text-text-muted">
      {label} <b className="font-semibold text-text-primary">{value}</b>
    </span>
  )
}
