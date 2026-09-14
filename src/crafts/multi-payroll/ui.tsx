import type { Icon } from '@phosphor-icons/react'
import { CheckCircle, Warning, X } from '@phosphor-icons/react'
import type { PaySchedule } from '@/mocks/payroll'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Shared multi-payroll pieces: in-window modal, form shell, review rows.
 * Banner + EmmaCard were promoted to nds/feedback - re-exported here so
 * screens keep importing from '../ui'.
 */

export { Banner, EmmaCard } from '@/components/nds/feedback'
export type { BannerTone } from '@/components/nds/feedback'

/** Centered modal INSIDE the app window (absolute, so it scales + snapshots). */
export function ModalShell({
  title,
  onClose,
  children,
  footer,
  width = 'w-[440px]',
}: {
  title: string
  onClose?: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]">
      <div
        className={cn(
          'flex max-h-full min-w-0 flex-col rounded-2xl bg-background-base shadow-flyout',
          width,
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-1">
          <p className="text-label-md text-text-primary">{title}</p>
          {onClose && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 px-5 pt-2 pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl bg-background-base p-4 shadow-card', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-label-sm text-text-primary">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function KV({
  label,
  children,
  strong,
}: {
  label: string
  children: React.ReactNode
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-highlight py-2 last:border-0">
      <span className="shrink-0 text-paragraph-xs text-text-muted">{label}</span>
      <span
        className={cn(
          'min-w-0 text-right',
          strong ? 'text-label-sm text-text-primary' : 'text-label-xs text-text-primary',
        )}
      >
        {children}
      </span>
    </div>
  )
}

export function FreqTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-background-highlight px-2 text-label-xs text-text-primary">
      {children}
    </span>
  )
}

export function GhostAction({
  label,
  onClick,
}: {
  label: string
  onClick?: () => void
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="h-7 text-brand-text">
      <span className="px-1">{label}</span>
    </Button>
  )
}

/* ---------------- full-page form chrome (wizard / hire) ---------------- */

/**
 * Form screens drop the AppBar + Sidebar entirely (per form design):
 * slim title bar, left stepper rail, centered content column.
 */
export function FormShell({
  title,
  rail,
  children,
}: {
  title: string
  /** Left rail content - usually a <Stepper>. */
  rail: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-2 text-text-primary">
      <div className="flex h-14 shrink-0 items-center border-b border-border-highlight bg-background-base px-6">
        <h1 className="truncate text-label-md">{title}</h1>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
        <div className="overflow-y-auto py-10 pl-12">{rail}</div>
        <div className="min-w-0 overflow-y-auto px-8 py-10">
          <div className="mx-auto w-full max-w-[880px]">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** White card the form content sits in (per review design). */
export function FormCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-background-base p-6 shadow-card',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Bordered review section: header + Edit link, body below. */
export function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border-highlight p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-label-sm text-text-primary">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-label-xs text-brand-text transition-colors hover:text-brand-primary"
          >
            Edit
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

/** Pill fact chip on the review screen (icon + label). */
export function ReviewChip({
  icon: ChipIcon,
  children,
}: {
  icon: Icon
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-label-xs text-text-primary shadow-button-gray">
      <ChipIcon className="size-4 text-text-muted" />
      {children}
    </span>
  )
}

/* ---------------- schedule picker: aligned/violating tag + toggle ---------------- */
/** Shared between the hire flow (H1) and the move flow (D2/D3) - a real
 *  state-compliance verdict, not a cosmetic flag, so it reads the same way
 *  wherever a schedule is being picked for someone (PRD round 2). */

export function ScheduleTag({ aligned }: { aligned: boolean }) {
  return aligned ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background-success-highlight px-2 py-0.5 text-caption-md text-text-success-base">
      <CheckCircle weight="fill" className="size-3" />
      Aligned
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background-warning-highlight px-2 py-0.5 text-caption-md text-text-warning-base">
      <Warning weight="fill" className="size-3" />
      Violating
    </span>
  )
}

export function ScheduleRow({
  schedule,
  detail,
  selected,
  aligned,
  onSelect,
}: {
  schedule: PaySchedule
  detail: string
  selected: boolean
  aligned: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 border-b border-border-highlight px-3 py-2.5 text-left transition-colors last:border-0',
        selected ? 'bg-brand-muted' : 'hover:bg-background-highlight',
      )}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-brand-primary' : 'border-border-base',
        )}
      >
        {selected && <span className="size-2 rounded-full bg-brand-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-label-xs text-text-primary">{schedule.name}</p>
        <p className="truncate text-paragraph-xs text-text-muted">{detail}</p>
      </span>
      <ScheduleTag aligned={aligned} />
    </button>
  )
}

/** "Only matching" / "Show all schedules" - the show-all toggle every real
 *  schedule picker gets (PRD round 2). */
export function ShowAllToggle({ showAll, onChange }: { showAll: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-background-highlight p-0.5 text-caption-md">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'rounded-[6px] px-2.5 py-1 transition-colors',
          !showAll ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted',
        )}
      >
        Only matching
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'rounded-[6px] px-2.5 py-1 transition-colors',
          showAll ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted',
        )}
      >
        Show all schedules
      </button>
    </div>
  )
}

/** Overlapping initials avatars (review membership row). */
export function AvatarStack({ names, max = 6 }: { names: Array<string>; max?: number }) {
  const shown = names.slice(0, max)
  return (
    <span className="flex items-center">
      {shown.map((name, i) => (
        <span
          key={name}
          className={cn(
            'flex size-7 items-center justify-center rounded-full bg-brand-muted text-caption-md text-brand-text ring-2 ring-background-base',
            i > 0 && '-ml-2',
          )}
        >
          {name
            .split(' ')
            .map((p) => p[0])
            .join('')}
        </span>
      ))}
    </span>
  )
}
