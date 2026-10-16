import { cn } from '@/lib/utils'
import type { CraftStatus } from '@/crafts/registry'

export const statusLabel: Record<CraftStatus, string> = {
  idea: 'Idea',
  wip: 'In progress',
  review: 'In review',
  ready: 'Ready',
}

/* Status pairs bg + text + border from the same semantic family (colors.md). */
const badgeClass: Record<CraftStatus, string> = {
  idea: 'bg-highlight text-muted border-base',
  wip: 'bg-warning-highlight text-warning border-warning-muted',
  review: 'bg-info-highlight text-info border-info-muted',
  ready: 'bg-success-highlight text-success border-success-muted',
}

export const statusDotClass: Record<CraftStatus, string> = {
  idea: 'bg-emphasis',
  wip: 'bg-warning',
  review: 'bg-info',
  ready: 'bg-success',
}

export function StatusBadge({
  status,
  className,
}: {
  status: CraftStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-px text-caption-sm font-medium',
        badgeClass[status],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', statusDotClass[status])} />
      {statusLabel[status]}
    </span>
  )
}
