import { ArrowsLeftRight, Bank, CaretLeft, CaretUpDown, Check, Info } from '@phosphor-icons/react'
import { usePayment } from '../app'
import { railInSentence, round2 } from '../engine'
import type { FundDraft } from '../types'
import { Banner, CopyButton, CurrencyMark, Money, ModalShell, RecipientDetails } from '../ui'
import { Button } from '@niural/components'
import {
  BANK_ACCOUNTS,
  CCY_NAME,
  COLLECTION_ACCOUNT,
  LOCAL_RAIL,
  USD_WIRE_FEE,
  fmt,
  fmtDateTime,
} from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Fund wallet (PRD F2): currency → single method per local currency
 * (Wire CAD / Faster Payments GBP / SEPA EUR; USD keeps wire + ACH) →
 * amount + memo → review with currency-specific recipient fields → fund
 * initiated with reference. Fee is added on top; the funding amount is
 * what lands in Pending, then Available after admin approval.
 */

function methodFor(d: FundDraft) {
  if (d.ccy === 'USD') {
    return d.method === 'ach'
      ? { label: 'Bank account (ACH)', short: 'ACH', fee: 0 }
      : { label: 'Wire transfer', short: 'Wire', fee: USD_WIRE_FEE }
  }
  const r = LOCAL_RAIL[d.ccy]
  return { label: r.method, short: r.methodShort, fee: r.fee }
}

export function FundWalletModal({ draft }: { draft: FundDraft }) {
  const { set, data, store } = usePayment()
  const update = (patch: Partial<FundDraft>) => set({ modal: { kind: 'fund', draft: { ...draft, ...patch } } })
  const close = () => set({ modal: null })
  const wallet = data.wallets.find((w) => w.ccy === draft.ccy && !w.network)
  const m = methodFor(draft)
  const amount = Number.parseFloat(draft.amount) || 0
  const toSend = round2(amount + m.fee)
  const enabled: Array<'USD' | NonNullable<typeof data.local>> = data.local ? ['USD', data.local] : ['USD']
  const req = draft.requestId ? data.requests.find((r) => r.id === draft.requestId) : undefined

  if (draft.step === 'initiated' && req) {
    return (
      <ModalShell width="w-[440px]" footer={<Button type="button" width="full" onClick={close}>Done</Button>}>
        <div className="flex flex-col items-center gap-3 pt-1 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success text-on-color"><Check weight="bold" className="size-6" /></span>
          <p className="text-title-h4 text-primary">Wallet fund initiated</p>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {draft.method !== 'ach' && (
            <div className="flex flex-col gap-2 rounded-2xl bg-base p-3 card">
              <p className="text-caption-sm text-muted">Reference</p>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-brand bg-brand-base px-3 py-2">
                <Money className="text-label-medium text-brand">{req.reference}</Money>
                <CopyButton value={req.reference} />
              </div>
              <p className="flex items-start gap-1.5 text-paragraph-xsmall text-muted">
                <Info className="mt-0.5 size-3.5 shrink-0" /> Add this reference to your transfer so we can match your payment.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-paragraph-small">
            <Kv k="Transaction ID" v={<Money className="text-paragraph-xsmall">{req.id.replace('fr-', '67fbd406…')}</Money>} />
            <Kv k="Wallet currency" v={req.ccy} />
            <Kv k="Payment method" v={m.short} />
            <Kv k="Transaction time" v={fmtDateTime(req.createdAt)} />
          </div>
          <div className="flex items-end justify-between border-t border-base pt-3">
            <span className="text-label-small text-primary">{draft.method === 'ach' ? 'Amount to debit' : 'Amount to send'}</span>
            <Money className="text-paragraph-large text-primary">{fmt(req.amount + req.fee, req.ccy)}</Money>
          </div>
          <p className="text-right text-caption-sm text-muted">
            {fmt(req.amount, req.ccy)} will be added to your wallet {draft.method === 'ach' ? 'in 3 to 5 business days' : 'once received and approved'}.
          </p>
        </div>
      </ModalShell>
    )
  }

  if (draft.step === 'review') {
    return (
      <ModalShell
        title="Review"
        onClose={close}
        width="w-[820px]"
        footer={
          <>
            <Button type="button" variant="solid" shade="neutral" leftIcon={<CaretLeft className="size-4" />} onClick={() => update({ step: 'amount' })}>Details</Button>
            <Button
              type="button"
              onClick={() => {
                const r = store.fund({ ccy: draft.ccy, amount, fee: m.fee, method: m.short, memo: draft.memo || undefined })
                update({ step: 'initiated', requestId: r.id })
              }}
            >
              Submit
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-base p-4 card">
              <div>
                <p className="text-caption-sm text-muted">Currency</p>
                <p className="flex items-center gap-1.5 text-label-small text-primary"><CurrencyMark ccy={draft.ccy} size="sm" />{CCY_NAME[draft.ccy]}</p>
              </div>
              <div>
                <p className="text-caption-sm text-muted">Payment method</p>
                <p className="text-label-small text-primary">{m.label}</p>
              </div>
            </div>
            {draft.memo && (
              <div>
                <p className="text-caption-sm text-muted">Memo</p>
                <p className="text-paragraph-small text-primary">{draft.memo}</p>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <p className="mb-1 text-label-medium text-primary">Payment summary</p>
              <Kv k="Funding amount" v={<Money className="text-paragraph-xsmall">{fmt(amount, draft.ccy)}</Money>} />
              <Kv k="Fee" v={<Money className="text-paragraph-xsmall">{fmt(m.fee, draft.ccy)}</Money>} />
              <div className="mt-1 flex items-end justify-between border-t border-base pt-3">
                <span className="text-label-small text-primary">{draft.method === 'ach' ? 'Amount to debit' : 'Amount to send'}</span>
                <Money className="text-paragraph-large text-primary">{fmt(toSend, draft.ccy)}</Money>
              </div>
              <p className="text-caption-sm text-muted">{fmt(amount, draft.ccy)} is credited to your wallet. The fee is added on top.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {draft.method === 'ach' ? (
              <>
                <p className="text-label-medium text-primary">Debit from</p>
                <p className="text-paragraph-small text-muted">{BANK_ACCOUNTS[0].name} ••{BANK_ACCOUNTS[0].last4} by ACH. Usually arrives in 3 to 5 business days.</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-label-medium text-primary">Recipient details</p>
                  <CopyButton value={COLLECTION_ACCOUNT[draft.ccy].map(([k, v]) => `${k}: ${v}`).join('\n')} label="Copy all" />
                </div>
                <RecipientDetails fields={COLLECTION_ACCOUNT[draft.ccy]} />
                <Banner
                  tone="info"
                  className="mt-2"
                  title={
                    draft.ccy === 'USD'
                      ? 'Send this by wire from your bank. Add the reference from the next screen to your transfer so we can match your payment.'
                      : LOCAL_RAIL[draft.ccy].instruction.replace('the reference', 'the reference from the next screen')
                  }
                />
              </>
            )}
          </div>
        </div>
      </ModalShell>
    )
  }

  if (draft.step === 'amount') {
    return (
      <ModalShell
        title="Fund wallet"
        onClose={close}
        footer={
          <>
            <Button type="button" variant="solid" shade="neutral" leftIcon={<CaretLeft className="size-4" />} onClick={() => update({ step: 'method' })}>Back</Button>
            <Button type="button" disabled={amount <= 0} onClick={() => update({ step: 'review' })}>Next</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-label-small text-primary">Funding amount</span>
            <span className="flex h-9 items-center gap-2 rounded-control bg-base px-3 borders-base focus-within:borders-focus">
              <span className="text-label-small text-muted">{draft.ccy}</span>
              <input
                value={draft.amount}
                inputMode="decimal"
                onChange={(e) => update({ amount: e.target.value.replace(/[^\d.]/g, '') })}
                onBlur={() => amount > 0 && update({ amount: amount.toFixed(2) })}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent tabular-nums text-label-small text-primary outline-none"
              />
            </span>
            {draft.shortfall !== undefined && (
              <span className="text-caption-sm text-muted">
                Prefilled with what you're short to pay the selected invoices. You can send more.
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-label-small text-primary">Memo <span className="text-muted">(optional)</span></span>
            <textarea
              value={draft.memo}
              onChange={(e) => update({ memo: e.target.value })}
              placeholder="e.g. Oct payroll top up"
              className="min-h-20 rounded-control bg-base px-3 py-2 text-paragraph-small text-primary borders-base outline-none placeholder:text-muted focus:borders-focus"
            />
          </label>
          <div className="flex items-center justify-between rounded-xl bg-surface-page px-3 py-2.5 text-paragraph-small">
            <span className="text-muted">{m.label} fee, added on top</span>
            <Money className="text-paragraph-xsmall text-primary">{fmt(m.fee, draft.ccy)}</Money>
          </div>
        </div>
      </ModalShell>
    )
  }

  // step: method
  return (
    <ModalShell
      title="Fund wallet"
      onClose={close}
      footer={
        <>
          <Button type="button" variant="solid" shade="neutral" onClick={close}>Cancel</Button>
          <Button type="button" onClick={() => update({ step: 'amount' })}>Next</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-label-small text-primary">Wallet</span>
          {/* One wallet, not a list: you opened Fund from a wallet, so that
              wallet is already the answer. Change is there for the rare
              case you meant another - it doesn't compete with the default. */}
          <WalletPicker
            value={draft.ccy}
            options={enabled.map((c) => ({ ccy: c, available: data.wallets.find((x) => x.ccy === c && !x.network)?.available ?? 0 }))}
            onChange={(c) => update({ ccy: c, method: 'rail' })}
          />
          {enabled.length === 1 && <span className="text-caption-sm text-muted">Only currencies enabled for your account are listed.</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-label-small text-primary">Payment method</span>
          {draft.ccy === 'USD' ? (
            <div className="flex flex-col gap-2">
              <MethodRow icon={ArrowsLeftRight} label="Wire transfer" sub={`Total fee: ${fmt(USD_WIRE_FEE, 'USD')}`} on={draft.method === 'rail'} onClick={() => update({ method: 'rail' })} />
              <MethodRow icon={Bank} label={`${BANK_ACCOUNTS[0].name} ••${BANK_ACCOUNTS[0].last4}`} sub="ACH · No fee · 3 to 5 business days" on={draft.method === 'ach'} onClick={() => update({ method: 'ach' })} />
            </div>
          ) : (
            <>
              <MethodRow icon={ArrowsLeftRight} label={m.label} sub={`Total fee: ${fmt(m.fee, draft.ccy)}`} on onClick={() => {}} />
              <span className="text-caption-sm text-muted">{CCY_NAME[draft.ccy]} wallets are funded by {railInSentence(m.label)} only.</span>
            </>
          )}
        </div>
        {wallet && wallet.pending > 0 && (
          <p className="flex items-start gap-1.5 text-paragraph-xsmall text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            You already have <Money className="text-primary">{fmt(wallet.pending, wallet.ccy)}</Money> pending approval in this wallet.
          </p>
        )}
      </div>
    </ModalShell>
  )
}

type FundCcy = FundDraft['ccy']

function WalletPicker({
  value,
  options,
  onChange,
}: {
  value: FundCcy
  options: Array<{ ccy: FundCcy; available: number }>
  onChange: (ccy: FundCcy) => void
}) {
  const current = options.find((o) => o.ccy === value) ?? options[0]
  const body = (
    <>
      <CurrencyMark ccy={current.ccy} size="lg" />
      <span className="min-w-0 flex-1">
        <span className="block text-label-medium text-primary">{CCY_NAME[current.ccy]}</span>
        <span className="block text-paragraph-xsmall text-muted">
          Available balance: <Money className="text-primary">{fmt(current.available, current.ccy)}</Money>
        </span>
      </span>
    </>
  )
  const cardClass = 'flex w-full items-center gap-3 rounded-xl bg-base p-3 text-left card'

  if (options.length < 2) return <div className={cardClass}>{body}</div>

  return (
    <DropdownMenu>
      {/* The whole card is the trigger (bigger target, and the menu takes
          the card's width); "Change" is the visible affordance. */}
      <DropdownMenuTrigger
        render={<button type="button" />}
        className={cn(cardClass, 'group transition-shadow hover:card-hover data-popup-open:borders-shadow')}
      >
        {body}
        <span className="flex shrink-0 items-center gap-1 rounded-control px-2 py-1 text-label-small text-brand transition-colors group-hover:bg-brand-base">
          Change
          <CaretUpDown className="size-3.5" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="p-1.5">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as FundCcy)}>
          <DropdownMenuLabel>Available wallets</DropdownMenuLabel>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.ccy} value={o.ccy} closeOnClick className="gap-3 py-2">
              <CurrencyMark ccy={o.ccy} />
              <span className="min-w-0 flex-1">
                <span className="block text-label-small text-primary">{CCY_NAME[o.ccy]}</span>
                <Money className="block text-paragraph-xsmall text-muted">{fmt(o.available, o.ccy)}</Money>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MethodRow({ icon: I, label, sub, on, onClick }: { icon: typeof Bank; label: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-center gap-3 rounded-xl bg-base p-3 text-left transition-shadow', on ? 'borders-shadow' : 'card hover:card-hover')}>
      <span className="flex size-8 items-center justify-center rounded-full bg-brand-muted text-brand"><I className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-label-small text-primary">{label}</span>
        <span className="block text-paragraph-xsmall text-muted">{sub}</span>
      </span>
      {on && <span className="flex size-5 items-center justify-center rounded-full bg-success text-on-color"><Check weight="bold" className="size-3" /></span>}
    </button>
  )
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-paragraph-small text-muted">{k}</span>
      <span className="text-right text-paragraph-small text-primary">{v}</span>
    </div>
  )
}
