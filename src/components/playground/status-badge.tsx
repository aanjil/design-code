import { cn } from '@/lib/utils'
import type { ExperimentStatus } from '@/experiments/registry'

export const statusLabel: Record<ExperimentStatus, string> = {
  idea: 'Idea',
  wip: 'In progress',
  review: 'In review',
  ready: 'Ready',
}

/* Status pairs bg + text + border from the same semantic family (colors.md). */
const badgeClass: Record<ExperimentStatus, string> = {
  idea: 'bg-background-highlight text-text-muted border-border-base',
  wip: 'bg-background-warning-highlight text-text-warning-base border-border-warning-muted',
  review: 'bg-background-info-highlight text-text-info-base border-border-info-muted',
  ready: 'bg-background-success-highlight text-text-success-base border-border-success-muted',
}

export const statusDotClass: Record<ExperimentStatus, string> = {
  idea: 'bg-background-emphasis',
  wip: 'bg-background-warning-base',
  review: 'bg-background-info-base',
  ready: 'bg-background-success-base',
}

export function StatusBadge({
  status,
  className,
}: {
  status: ExperimentStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-px text-caption-md',
        badgeClass[status],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', statusDotClass[status])} />
      {statusLabel[status]}
    </span>
  )
}
