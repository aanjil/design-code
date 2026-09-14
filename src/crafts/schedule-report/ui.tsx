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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]">
      <div
        className={cn(
          'flex max-h-full min-w-0 flex-col rounded-2xl bg-background-base shadow-flyout',
          width,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-1">
          <div className="min-w-0">
            <p className="text-label-md text-text-primary">{title}</p>
            {subtitle && <p className="mt-0.5 text-paragraph-xs text-text-muted">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border-highlight px-5 py-3">
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
    <section className={cn('rounded-xl border border-border-highlight bg-background-base p-4', className)}>
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

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-label-xs text-text-primary">
      {children}
      {required && <span className="text-text-error-base"> *</span>}
    </label>
  )
}

export function InlineError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-caption-md text-text-error-base">{children}</p>
}

const SCHEDULE_STATUS_META: Record<ScheduleStatus, { label: string; icon: typeof CheckCircle; cls: string }> = {
  active: { label: 'Active', icon: Clock, cls: 'text-brand-text' },
  paused: { label: 'Paused', icon: PauseCircle, cls: 'text-text-muted' },
  completed: { label: 'Completed', icon: CheckCircle, cls: 'text-text-success-base' },
}

export function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  const m = SCHEDULE_STATUS_META[status]
  const Icon = m.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-label-xs', m.cls)}>
      <Icon weight={status === 'completed' ? 'fill' : 'regular'} className="size-3.5" />
      {m.label}
    </span>
  )
}

const RUN_STATUS_META: Record<RunStatus, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-background-success-muted text-text-success-base' },
  failed: { label: 'Failed', cls: 'bg-background-error-highlight text-text-error-base' },
  'in-progress': { label: 'In progress', cls: 'bg-background-info-muted text-text-primary' },
  empty: { label: 'Empty', cls: 'bg-background-highlight text-text-muted' },
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
  const cls = status === 'completed' && emailFailed ? 'bg-background-warning-muted text-text-primary' : m.cls
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full px-2 text-caption-md', cls)}>{label}</span>
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
        <span className="flex size-6 items-center justify-center rounded-full bg-background-highlight text-text-muted">
          <Desktop className="size-3.5" />
        </span>
      )}
      {emailCount > 0 && (
        <span
          className={cn(
            'flex h-6 items-center gap-1 rounded-full px-1.5 text-caption-md',
            emailFailed ? 'bg-background-warning-muted text-text-primary' : 'bg-background-highlight text-text-muted',
          )}
        >
          <EnvelopeSimple className="size-3.5" />
          {emailCount}
        </span>
      )}
      {!!linkCount && linkCount > 0 && (
        <span className="flex h-6 items-center gap-1 rounded-full bg-background-highlight px-1.5 text-caption-md text-text-muted">
          <LinkSimple className="size-3.5" />
          {linkCount}
        </span>
      )}
    </span>
  )
}

export function RecipientChip({ recipient, onRemove }: { recipient: Recipient; onRemove?: () => void }) {
  return (
    <span className="flex h-7 items-center gap-1.5 rounded-full bg-background-highlight py-0.5 pr-1 pl-2.5 text-label-xs text-text-primary">
      {recipient.name ?? recipient.email}
      {recipient.external ? (
        <span className="rounded bg-background-warning-muted px-1 text-caption-md text-text-primary">External</span>
      ) : (
        recipient.role && (
          <span className="rounded bg-background-base px-1 text-caption-md text-text-muted">{recipient.role}</span>
        )
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${recipient.email}`}
          onClick={onRemove}
          className="flex size-4 items-center justify-center rounded-full text-text-muted hover:bg-background-error-highlight hover:text-text-error-base"
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  )
}

export function PreviewBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-background-info-muted px-3 py-2.5 text-paragraph-xs text-text-primary">
      <CalendarBlank className="mt-0.5 size-4 shrink-0 text-brand-text" />
      {children}
    </div>
  )
}

export function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-background-warning-muted px-3 py-2.5 text-paragraph-xs text-text-primary">
      <Warning weight="fill" className="mt-0.5 size-4 shrink-0 text-text-warning-base" />
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
      <Icon className="size-8 text-text-muted" />
      <p className="text-label-sm text-text-primary">{title}</p>
      <p className="max-w-sm text-paragraph-xs text-text-muted">{body}</p>
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
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]">
      <div className="flex w-[420px] flex-col gap-4 rounded-2xl bg-background-base p-6 shadow-flyout">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-full',
              tone === 'danger' ? 'bg-background-error-highlight text-text-error-base' : 'bg-background-warning-muted text-text-warning-base',
            )}
          >
            <Icon weight="fill" className="size-5" />
          </span>
          <p className="text-label-md text-text-primary">{title}</p>
          <p className="text-paragraph-xs text-text-muted">{body}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" onClick={onCancel}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button variant={tone === 'danger' ? 'destructive' : 'default'} onClick={onConfirm}>
            <span className="px-1">{confirmLabel}</span>
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
                    state === 'done' ? 'bg-brand-primary text-text-on-color' : 'bg-background-emphasis text-text-muted',
                  )}
                >
                  {n}
                </span>
              )}
              <span className={cn('text-label-xs', state === 'upcoming' ? 'text-text-muted' : 'text-text-primary')}>
                {label}
              </span>
            </span>
            {i < steps.length - 1 && <span aria-hidden className="mx-3 h-px flex-1 bg-border-base" />}
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
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]">
      <div className="flex w-[412px] flex-col items-center gap-5 rounded-2xl bg-background-base p-6 text-center shadow-flyout">
        <span className="flex size-10 items-center justify-center rounded-full bg-background-success-muted text-text-success-base">
          <CheckCircle weight="fill" className="size-5" />
        </span>
        <div>
          <p className="text-label-md text-text-primary">{title}</p>
          <p className="mt-1 text-paragraph-xs text-text-muted">{body}</p>
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <Button className="w-full" onClick={onPrimary}>
            <span className="px-1">{primaryLabel}</span>
          </Button>
          <button
            type="button"
            onClick={onSecondary}
            className="text-label-xs text-brand-text transition-colors hover:text-brand-primary"
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
            className="flex h-7 items-center gap-1 rounded-full border border-dashed border-border-highlight px-2.5 text-caption-md text-text-muted transition-colors hover:border-brand-primary hover:text-brand-text"
          />
        }
      >
        <Plus className="size-3" />
        Add recipient
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <label className="flex h-10 items-center gap-2 border-b border-border-highlight px-3">
          <MagnifyingGlass className="size-4 shrink-0 text-text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="min-w-0 flex-1 bg-transparent text-paragraph-xs text-text-primary outline-none placeholder:text-text-muted"
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
              <Plus className="size-3.5 text-text-muted" />
              <span className="text-label-xs text-text-primary">
                Add <strong className="font-medium">{trimmed}</strong> as external
              </span>
            </DropdownMenuItem>
          )}
          {filtered.length === 0 && !offerExternal && (
            <p className="px-2 py-3 text-center text-paragraph-xs text-text-muted">No matches</p>
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
                <Checkbox checked={selectedEmails.includes(m.email)} onCheckedChange={() => {}} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-label-xs text-text-primary">{m.name}</span>
                  <span className="truncate text-caption-md text-text-muted">{m.email}</span>
                </span>
              </span>
              <span className="shrink-0 rounded bg-background-base px-1 text-caption-md text-text-muted">{m.role}</span>
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
    <div className="flex h-7 items-center gap-1.5 rounded-full border border-dashed border-border-highlight px-2.5">
      <Plus className="size-3 text-text-muted" />
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
        className="w-40 bg-transparent text-caption-md text-text-primary outline-none placeholder:text-text-muted"
      />
    </div>
  )
}
