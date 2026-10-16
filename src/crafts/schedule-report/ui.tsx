import { useState } from 'react'
import {
  CalendarBlank,
  CheckCircle,
  Clock,
  Desktop,
  EnvelopeSimple,
  LinkSimple,
  MagnifyingGlass,
  PauseCircle,
  Plus,
  Spinner,
  Warning,
  X,
  XCircle,
} from '@phosphor-icons/react'
import { Button, Checkbox } from '@niural/components'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { OrgMember } from '@/mocks/insights-reports'
import type { Recipient, RunStatus, ScheduleStatus } from './types'

export { Banner } from '@/components/nds/feedback'

/** Centered modal INSIDE the app window (absolute, so it scales + snapshots). */
export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 'w-[440px]',
}: {
  title: React.ReactNode
  subtitle?: string
  onClose?: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay p-6 backdrop-blur-[2px]">
      <div
        className={cn(
          'flex max-h-full min-w-0 flex-col rounded-2xl bg-base flyout',
          width,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-1">
          <div className="min-w-0">
            <p className="text-label-medium text-primary">{title}</p>
            {subtitle && <p className="mt-0.5 text-paragraph-xsmall text-muted">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-highlight hover:text-primary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-base px-5 py-3">
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
  title?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-base bg-base p-4', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-label-small text-primary">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-label-xsmall text-primary">
      {children}
      {required && <span className="text-error"> *</span>}
    </label>
  )
}

export function InlineError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-caption-sm font-medium text-error">{children}</p>
}

const SCHEDULE_STATUS_META: Record<ScheduleStatus, { label: string; icon: typeof CheckCircle; cls: string }> = {
  active: { label: 'Active', icon: Clock, cls: 'text-brand' },
  paused: { label: 'Paused', icon: PauseCircle, cls: 'text-muted' },
  completed: { label: 'Completed', icon: CheckCircle, cls: 'text-success' },
}

export function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  const m = SCHEDULE_STATUS_META[status]
  const Icon = m.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-label-xsmall', m.cls)}>
      <Icon weight={status === 'completed' ? 'fill' : 'regular'} className="size-3.5" />
      {m.label}
    </span>
  )
}

const RUN_STATUS_META: Record<RunStatus, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-success-muted text-success' },
  failed: { label: 'Failed', cls: 'bg-error-highlight text-error' },
  'in-progress': { label: 'In progress', cls: 'bg-info-muted text-primary' },
  empty: { label: 'Empty', cls: 'bg-highlight text-muted' },
}

export function RunStatusPill({
  status,
  emailFailed,
}: {
  status: RunStatus
  emailFailed?: number
}) {
  const m = RUN_STATUS_META[status]
  const label = status === 'completed' && emailFailed ? `Sent - ${emailFailed} failed` : m.label
  const cls = status === 'completed' && emailFailed ? 'bg-warning-muted text-primary' : m.cls
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full px-2 text-caption-sm font-medium', cls)}>{label}</span>
  )
}

export function DeliveryChips({
  platform,
  emailCount,
  linkCount,
  emailFailed,
}: {
  platform: boolean
  emailCount: number
  linkCount?: number
  emailFailed?: number
}) {
  return (
    <span className="flex items-center gap-1.5">
      {platform && (
        <span className="flex size-6 items-center justify-center rounded-full bg-highlight text-muted">
          <Desktop className="size-3.5" />
        </span>
      )}
      {emailCount > 0 && (
        <span
          className={cn(
            'flex h-6 items-center gap-1 rounded-full px-1.5 text-caption-sm font-medium',
            emailFailed ? 'bg-warning-muted text-primary' : 'bg-highlight text-muted',
          )}
        >
          <EnvelopeSimple className="size-3.5" />
          {emailCount}
        </span>
      )}
      {!!linkCount && linkCount > 0 && (
        <span className="flex h-6 items-center gap-1 rounded-full bg-highlight px-1.5 text-caption-sm font-medium text-muted">
          <LinkSimple className="size-3.5" />
          {linkCount}
        </span>
      )}
    </span>
  )
}

export function RecipientChip({ recipient, onRemove }: { recipient: Recipient; onRemove?: () => void }) {
  return (
    <span className="flex h-7 items-center gap-1.5 rounded-full bg-highlight py-0.5 pr-1 pl-2.5 text-label-xsmall text-primary">
      {recipient.name ?? recipient.email}
      {recipient.external ? (
        <span className="rounded bg-warning-muted px-1 text-caption-sm font-medium text-primary">External</span>
      ) : (
        recipient.role && (
          <span className="rounded bg-base px-1 text-caption-sm font-medium text-muted">{recipient.role}</span>
        )
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${recipient.email}`}
          onClick={onRemove}
          className="flex size-4 items-center justify-center rounded-full text-muted hover:bg-error-highlight hover:text-error"
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  )
}

export function PreviewBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-info-muted px-3 py-2.5 text-paragraph-xsmall text-primary">
      <CalendarBlank className="mt-0.5 size-4 shrink-0 text-brand" />
      {children}
    </div>
  )
}

export function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-warning-muted px-3 py-2.5 text-paragraph-xsmall text-primary">
      <Warning weight="fill" className="mt-0.5 size-4 shrink-0 text-warning" />
      {children}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof XCircle
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <Icon className="size-8 text-muted" />
      <p className="text-label-small text-primary">{title}</p>
      <p className="max-w-sm text-paragraph-xsmall text-muted">{body}</p>
      {action}
    </div>
  )
}

export function ConfirmDialog({
  icon: Icon,
  tone = 'neutral',
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  icon: typeof Warning
  tone?: 'neutral' | 'danger'
  title: string
  body: React.ReactNode
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay p-6 backdrop-blur-[2px]">
      <div className="flex w-[420px] flex-col gap-4 rounded-2xl bg-base p-6 flyout">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-full',
              tone === 'danger' ? 'bg-error-highlight text-error' : 'bg-warning-muted text-warning',
            )}
          >
            <Icon weight="fill" className="size-5" />
          </span>
          <p className="text-label-medium text-primary">{title}</p>
          <p className="text-paragraph-xsmall text-muted">{body}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="solid" shade="neutral" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="solid" shade={tone === 'danger' ? 'error' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Horizontal step row for the 3-step schedule modal (Figma 603:13037) -
 *  numbered circle for done/upcoming steps, spinner ring for the current
 *  one, a hairline connector stretching between each label. */
export function HorizontalStepper({
  steps,
  current,
}: {
  steps: Array<string>
  /** 1-indexed - matches ModalStep. */
  current: number
}) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'current' : 'upcoming'
        return (
          <li key={label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <span className="flex shrink-0 items-center gap-1.5">
              {state === 'current' ? (
                <Spinner
                  className="size-4 shrink-0 animate-[spin_2.5s_linear_infinite] text-brand-primary"
                  weight="bold"
                />
              ) : (
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-medium',
                    state === 'done' ? 'bg-brand text-on-color' : 'bg-emphasis text-muted',
                  )}
                >
                  {n}
                </span>
              )}
              <span className={cn('text-label-xsmall', state === 'upcoming' ? 'text-muted' : 'text-primary')}>
                {label}
              </span>
            </span>
            {i < steps.length - 1 && <span aria-hidden className="mx-3 h-px flex-1 bg-(--border-default)" />}
          </li>
        )
      })}
    </ol>
  )
}

/** "Schedule created" success dialog (Figma 604:4445). */
export function SuccessDialog({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string
  body: React.ReactNode
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay p-6 backdrop-blur-[2px]">
      <div className="flex w-[412px] flex-col items-center gap-5 rounded-2xl bg-base p-6 text-center flyout">
        <span className="flex size-10 items-center justify-center rounded-full bg-success-muted text-success">
          <CheckCircle weight="fill" className="size-5" />
        </span>
        <div>
          <p className="text-label-medium text-primary">{title}</p>
          <p className="mt-1 text-paragraph-xsmall text-muted">{body}</p>
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <Button type="button" width="full" onClick={onPrimary}>
            {primaryLabel}
          </Button>
          <button
            type="button"
            onClick={onSecondary}
            className="text-label-xsmall text-brand transition-colors hover:text-brand-primary"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Mirrors the reference HTML prototype's external-email check. */
const EXTERNAL_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Search-and-check recipient picker (Figma 603:14249) - "+ Add recipient"
 *  pill opens a searchable checklist of org members with role badges.
 *  Typing a full email that doesn't match a member offers to add it as
 *  an external recipient (the HTML prototype's `pickFreeText`). */
export function RecipientPicker({
  members,
  selectedEmails,
  onToggle,
  onAddExternal,
}: {
  members: Array<OrgMember>
  selectedEmails: Array<string>
  onToggle: (member: OrgMember) => void
  onAddExternal?: (email: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = members.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()))
  const trimmed = query.trim()
  const offerExternal =
    onAddExternal && EXTERNAL_EMAIL_RE.test(trimmed) && !members.some((m) => m.email.toLowerCase() === trimmed.toLowerCase())
  return (
    <DropdownMenu onOpenChange={(open) => !open && setQuery('')}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-7 items-center gap-1 rounded-full border border-dashed border-base px-2.5 text-caption-sm font-medium text-muted transition-colors hover:border-brand hover:text-brand"
          />
        }
      >
        <Plus className="size-3" />
        Add recipient
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <label className="flex h-10 items-center gap-2 border-b border-base px-3">
          <MagnifyingGlass className="size-4 shrink-0 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="min-w-0 flex-1 bg-transparent text-paragraph-xsmall text-primary outline-none placeholder:text-muted"
          />
        </label>
        <div className="max-h-64 overflow-y-auto p-1">
          {offerExternal && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                onAddExternal?.(trimmed)
                setQuery('')
              }}
            >
              <Plus className="size-3.5 text-muted" />
              <span className="text-label-xsmall text-primary">
                Add <strong className="font-medium">{trimmed}</strong> as external
              </span>
            </DropdownMenuItem>
          )}
          {filtered.length === 0 && !offerExternal && (
            <p className="px-2 py-3 text-center text-paragraph-xsmall text-muted">No matches</p>
          )}
          {filtered.map((m) => (
            <DropdownMenuItem
              key={m.email}
              onClick={(e) => {
                e.preventDefault()
                onToggle(m)
              }}
              className="justify-between"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Checkbox size="md" tabIndex={-1} className="pointer-events-none" checked={selectedEmails.includes(m.email)} onCheckedChange={() => {}} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-label-xsmall text-primary">{m.name}</span>
                  <span className="truncate text-caption-sm font-medium text-muted">{m.email}</span>
                </span>
              </span>
              <span className="shrink-0 rounded bg-base px-1 text-caption-sm font-medium text-muted">{m.role}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Free-text "Add external email..." pill for link recipients (Figma
 *  603:13220) - not an org-directory lookup, just an email + Enter. */
export function ExternalRecipientInput({ onAdd }: { onAdd: (email: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex h-7 items-center gap-1.5 rounded-full border border-dashed border-base px-2.5">
      <Plus className="size-3 text-muted" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onAdd(value.trim())
            setValue('')
          }
        }}
        placeholder="Add external email..."
        className="w-40 bg-transparent text-caption-sm font-medium text-primary outline-none placeholder:text-muted"
      />
    </div>
  )
}
