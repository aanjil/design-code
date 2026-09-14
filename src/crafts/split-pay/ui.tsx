import { Check, ShieldCheck, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Shared split-pay pieces. Global rules baked in (design doc §0):
 * waits read as progress - amber/neutral, never red, no error icons;
 * sentence case; the full-pay guarantee is a reusable note.
 */

export { Banner } from '@/components/nds/feedback'

export type PillTone = 'gray' | 'amber' | 'green' | 'red' | 'blue'

const PILL_TONE: Record<PillTone, string> = {
  gray: 'bg-background-highlight text-text-muted',
  amber: 'bg-background-warning-muted text-text-primary',
  green: 'bg-background-success-muted text-text-success-base',
  red: 'bg-background-error-highlight text-text-error-base',
  blue: 'bg-background-info-muted text-text-primary',
}

export function StatusPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center rounded-full px-2 text-caption-md', PILL_TONE[tone])}>
      {children}
    </span>
  )
}

/** §1.4 - 4-step tracker: Verify → Regulatory steps → Cooling off → Ready. */
const TRACKER_STEPS = ['Verify', 'Regulatory steps', 'Cooling off', 'Ready']

export function StepTracker({ current, nothingNeeded }: { current: number; nothingNeeded?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {TRACKER_STEPS.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-caption-md',
                  done && 'bg-brand-primary text-text-on-color',
                  active && 'bg-background-warning-muted text-text-primary',
                  !done && !active && 'bg-background-highlight text-text-muted',
                )}
              >
                {done ? <Check weight="bold" className="size-3" /> : i + 1}
              </span>
              <span className={cn('text-caption-md', active ? 'text-text-primary' : 'text-text-muted')}>
                {label}
              </span>
              {i < TRACKER_STEPS.length - 1 && <span className="h-px w-4 bg-border-highlight" />}
            </div>
          )
        })}
      </div>
      <p className="text-caption-md text-text-muted">
        Step {Math.min(current + 1, 4)} of 4{nothingNeeded && ' · nothing needed from you'}
      </p>
    </div>
  )
}

/** The full-pay guarantee - §0: consent, config review, wallet-delete modal. */
export function GuaranteeNote({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-paragraph-xs text-text-muted', className)}>
      <ShieldCheck weight="fill" className="mt-0.5 size-4 shrink-0 text-text-success-base" />
      Your total pay is never affected. Anything that can't reach your wallet goes to your bank.
    </p>
  )
}

/** Centered modal INSIDE the app window (absolute - scales + snapshots). */
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
      <div className={cn('flex max-h-full min-w-0 flex-col rounded-2xl bg-background-base shadow-flyout', width)}>
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
          <div className="flex shrink-0 items-center justify-end gap-2 px-5 pt-2 pb-4">{footer}</div>
        )}
      </div>
    </div>
  )
}

/** Full-page form chrome (KYC / FCA flows) - slim title bar + centered column. */
export function FlowShell({
  title,
  progress,
  children,
}: {
  title: string
  /** e.g. "Step 2 of 4" or "Regulatory steps · 1 of 3". */
  progress?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-2 text-text-primary">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-highlight bg-background-base px-6">
        <h1 className="truncate text-label-md">{title}</h1>
        {progress && <span className="text-caption-md text-text-muted">{progress}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto w-full max-w-[560px]">{children}</div>
      </div>
    </div>
  )
}

export function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-background-base p-6 shadow-card', className)}>{children}</div>
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-label-xs text-text-primary">
      {children}
      {required && <span className="text-text-error-base"> *</span>}
    </label>
  )
}

export function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex h-8 items-center rounded-lg border border-input px-2.5 text-paragraph-xs text-text-primary">
        {value}
      </div>
    </div>
  )
}

/** Radio-style option row (categorization / risk / dynamic KYC questions). */
export function OptionRow({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl p-3 text-left text-paragraph-xs transition-shadow',
        selected ? 'shadow-border-brand' : 'shadow-button-gray hover:bg-background-highlight',
      )}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-brand-primary' : 'border-border-base',
        )}
      >
        {selected && <span className="size-2 rounded-full bg-brand-primary" />}
      </span>
      <span className="text-text-primary">{label}</span>
    </button>
  )
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  guarantee,
  onCancel,
  onConfirm,
  singleAction,
}: {
  title: string
  body: React.ReactNode
  confirmLabel: string
  danger?: boolean
  /** §0 - guarantee shown on the wallet-delete modal. */
  guarantee?: boolean
  onCancel: () => void
  onConfirm: () => void
  /** "OK"-only modals (delete last bank). */
  singleAction?: boolean
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]">
      <div className="flex w-[420px] flex-col gap-4 rounded-2xl bg-background-base p-6 shadow-flyout">
        <div className="flex flex-col gap-2">
          <p className="text-label-md text-text-primary">{title}</p>
          <p className="text-paragraph-xs text-text-muted">{body}</p>
          {guarantee && <GuaranteeNote />}
        </div>
        <div className="flex items-center justify-end gap-2">
          {!singleAction && (
            <Button variant="secondary" onClick={onCancel}>
              <span className="px-1">Cancel</span>
            </Button>
          )}
          <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm}>
            <span className="px-1">{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
