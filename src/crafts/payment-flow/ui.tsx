import { useState } from 'react'
import { Check, Copy, X } from '@phosphor-icons/react'
import { CCY_FLAG } from '@/mocks/payment-flow'
import type { Ccy, RecipientField } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'

/**
 * Shared Payment Flow pieces: currency marks, dotted-leader rows, the
 * in-window modal shell, recipient details with per-field copy.
 */

export { StatusPill } from '@/components/nds/controls'
export { Banner } from '@/components/nds/feedback'

const COIN_TONE: Partial<Record<Ccy, string>> = {
  USDC: 'bg-accent-violet-base',
  USDT: 'bg-accent-teal-base',
  DAI: 'bg-accent-orange-base',
}
const COIN_GLYPH: Partial<Record<Ccy, string>> = { USDC: '$', USDT: '₮', DAI: '◈' }

/** Flag for fiat, colored coin for stablecoins. */
export function CurrencyMark({ ccy, size = 'md' }: { ccy: Ccy; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'size-4 text-[11px]' : size === 'lg' ? 'size-10 text-[22px]' : 'size-5 text-[14px]'
  const flag = CCY_FLAG[ccy]
  if (flag) {
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-highlight leading-none', box)} aria-hidden>
        {flag}
      </span>
    )
  }
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none text-on-color', box, COIN_TONE[ccy] ?? 'bg-emphasis')}
      aria-hidden
    >
      {COIN_GLYPH[ccy] ?? ccy[0]}
    </span>
  )
}

export function Money({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('tabular-nums', className)}>{children}</span>
}

/** "Label ........ value" row (existing payment screen pattern). */
export function LeaderRow({
  label,
  value,
  strong,
  muted,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  strong?: boolean
  muted?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className={cn('shrink-0', strong ? 'text-label-small text-primary' : muted ? 'text-paragraph-small text-muted' : 'text-paragraph-small text-primary')}>
        {label}
      </span>
      <span className="h-px min-w-6 flex-1 border-t border-dotted border-base" />
      <span className={cn('shrink-0 text-right', strong ? 'text-label-small text-primary' : 'text-paragraph-small text-primary')}>
        {value}
      </span>
    </div>
  )
}

export function PrimaryTag() {
  return (
    <span className="inline-flex h-5 items-center rounded-md border border-success-muted bg-success-muted px-1.5 text-caption-sm font-medium text-success">
      Primary
    </span>
  )
}

export function Tag({ tone = 'gray', children }: { tone?: 'gray' | 'green' | 'amber' | 'brand' | 'blue'; children: React.ReactNode }) {
  const tones = {
    gray: 'bg-highlight text-muted',
    green: 'bg-success-muted text-success',
    amber: 'bg-warning-muted text-primary',
    brand: 'bg-brand-muted text-brand',
    blue: 'bg-info-muted text-info',
  }
  return <span className={cn('inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-caption-sm font-medium', tones[tone])}>{children}</span>
}

/** Centered modal INSIDE the app window (absolute - scales + snapshots). */
export function ModalShell({
  title,
  onClose,
  children,
  footer,
  width = 'w-[480px]',
}: {
  title?: string
  onClose?: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay p-6 backdrop-blur-[2px]">
      <div className={cn('flex max-h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-base flyout', width)}>
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-base bg-surface-page px-5 py-3.5">
            <p className="text-label-large text-primary">{title}</p>
            {onClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-highlight hover:text-primary"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-base bg-surface-page px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  )
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label={`Copy ${value}`}
      onClick={() => {
        try {
          void navigator.clipboard.writeText(value)
        } catch {
          /* mock */
        }
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      }}
      className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-label-xsmall text-muted transition-colors hover:bg-highlight hover:text-primary"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export function RecipientDetails({ fields, reference }: { fields: Array<RecipientField>; reference?: string }) {
  const rows: Array<RecipientField> = reference ? [...fields, ['Reference', reference]] : fields
  return (
    <dl className="flex flex-col">
      {rows.map(([k, v]) => (
        <div key={k} className="group grid grid-cols-[140px_1fr_auto] items-start gap-3 py-1.5">
          <dt className="text-paragraph-small text-muted">{k}</dt>
          <dd className={cn('text-label-small text-primary', k === 'Reference' && 'tabular-nums')}>{v}</dd>
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            <CopyButton value={v} />
          </span>
        </div>
      ))}
    </dl>
  )
}

export function RadioDot({ on }: { on: boolean }) {
  return (
    <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-full border', on ? 'border-brand' : 'border-base')}>
      {on && <span className="size-2 rounded-full bg-brand" />}
    </span>
  )
}

export function CheckBadge() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-on-color">
      <Check weight="bold" className="size-3" />
    </span>
  )
}
