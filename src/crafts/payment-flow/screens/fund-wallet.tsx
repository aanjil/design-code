import { ArrowsLeftRight, Bank, CaretLeft, Check, Info } from '@phosphor-icons/react'
import { usePayment } from '../app'
import { railInSentence, round2 } from '../engine'
import type { FundDraft } from '../types'
import { CopyButton, CurrencyMark, Money, ModalShell, RadioDot, RecipientDetails } from '../ui'
import { Button } from '@/components/ui/button'
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
      <ModalShell width="w-[440px]" footer={<Button className="w-full" onClick={close}><span className="px-1">Done</span></Button>}>
        <div className="flex flex-col items-center gap-3 pt-1 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-background-success-base text-text-on-color"><Check weight="bold" className="size-6" /></span>
          <p className="text-title-h4 text-text-primary">Wallet fund initiated</p>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {draft.method !== 'ach' && (
            <div className="flex flex-col gap-2 rounded-2xl bg-background-base p-3 shadow-card">
              <p className="text-caption text-text-muted">Reference</p>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-brand-primary bg-brand-base px-3 py-2">
                <Money className="text-mono-md text-brand-text">{req.reference}</Money>
                <CopyButton value={req.reference} />
              </div>
              <p className="flex items-start gap-1.5 text-paragraph-xs text-text-muted">
                <Info className="mt-0.5 size-3.5 shrink-0" /> Add this reference to your transfer so we can match your payment.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-paragraph-sm">
            <Kv k="Transaction ID" v={<Money className="text-mono-xs">{req.id.replace('fr-', '67fbd406…')}</Money>} />
            <Kv k="Wallet currency" v={req.ccy} />
            <Kv k="Payment method" v={m.short} />
            <Kv k="Transaction time" v={fmtDateTime(req.createdAt)} />
          </div>
          <div className="flex items-end justify-between border-t border-border-highlight pt-3">
            <span className="text-label-sm text-text-primary">{draft.method === 'ach' ? 'Amount to debit' : 'Amount to send'}</span>
            <Money className="text-mono-lg text-text-primary">{fmt(req.amount + req.fee, req.ccy)}</Money>
          </div>
          <p className="text-right text-caption text-text-muted">
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
            <Button variant="secondary" onClick={() => update({ step: 'amount' })}><CaretLeft /><span className="px-1">Details</span></Button>
            <Button
              onClick={() => {
                const r = store.fund({ ccy: draft.ccy, amount, fee: m.fee, method: m.short, memo: draft.memo || undefined })
                update({ step: 'initiated', requestId: r.id })
              }}
            >
              <span className="px-1">Submit</span>
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-background-base p-4 shadow-card">
              <div>
                <p className="text-caption text-text-muted">Currency</p>
                <p className="flex items-center gap-1.5 text-label-sm text-text-primary"><CurrencyMark ccy={draft.ccy} size="sm" />{CCY_NAME[draft.ccy]}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Payment method</p>
                <p className="text-label-sm text-text-primary">{m.label}</p>
              </div>
            </div>
            {draft.memo && (
              <div>
                <p className="text-caption text-text-muted">Memo</p>
                <p className="text-paragraph-sm text-text-primary">{draft.memo}</p>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <p className="mb-1 text-label-md text-text-primary">Payment summary</p>
              <Kv k="Funding amount" v={<Money className="text-mono-xs">{fmt(amount, draft.ccy)}</Money>} />
              <Kv k="Fee" v={<Money className="text-mono-xs">{fmt(m.fee, draft.ccy)}</Money>} />
              <div className="mt-1 flex items-end justify-between border-t border-border-highlight pt-3">
                <span className="text-label-sm text-text-primary">{draft.method === 'ach' ? 'Amount to debit' : 'Amount to send'}</span>
                <Money className="text-mono-lg text-text-primary">{fmt(toSend, draft.ccy)}</Money>
              </div>
              <p className="text-caption text-text-muted">{fmt(amount, draft.ccy)} is credited to your wallet. The fee is added on top.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {draft.method === 'ach' ? (
              <>
                <p className="text-label-md text-text-primary">Debit from</p>
                <p className="text-paragraph-sm text-text-muted">{BANK_ACCOUNTS[0].name} ••{BANK_ACCOUNTS[0].last4} by ACH. Usually arrives in 3 to 5 business days.</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-label-md text-text-primary">Recipient details</p>
                  <CopyButton value={COLLECTION_ACCOUNT[draft.ccy].map(([k, v]) => `${k}: ${v}`).join('\n')} label="Copy all" />
                </div>
                <RecipientDetails fields={COLLECTION_ACCOUNT[draft.ccy]} />
                <p className="mt-2 flex items-start gap-2 rounded-lg bg-background-info-highlight p-3 text-paragraph-xs text-text-primary">
                  <Info weight="fill" className="mt-0.5 size-4 shrink-0 text-text-info-base" />
                  {draft.ccy === 'USD'
                    ? 'Send this by wire from your bank. Add the reference from the next screen to your transfer so we can match your payment.'
                    : LOCAL_RAIL[draft.ccy].instruction.replace('the reference', 'the reference from the next screen')}
                </p>
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
            <Button variant="secondary" onClick={() => update({ step: 'method' })}><CaretLeft /><span className="px-1">Back</span></Button>
            <Button disabled={amount <= 0} onClick={() => update({ step: 'review' })}><span className="px-1">Next</span></Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-label-sm text-text-primary">Funding amount</span>
            <span className="flex h-9 items-center gap-2 rounded-btn bg-background-base px-3 shadow-button-gray focus-within:shadow-border-focus">
              <span className="text-label-sm text-text-muted">{draft.ccy}</span>
              <input
                value={draft.amount}
                inputMode="decimal"
                onChange={(e) => update({ amount: e.target.value.replace(/[^\d.]/g, '') })}
                onBlur={() => amount > 0 && update({ amount: amount.toFixed(2) })}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent font-mono text-mono-sm text-text-primary outline-none"
              />
            </span>
            {draft.shortfall !== undefined && (
              <span className="text-caption text-text-muted">
                Prefilled with what you're short to pay the selected invoices. You can send more.
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-label-sm text-text-primary">Memo <span className="text-text-muted">(optional)</span></span>
            <textarea
              value={draft.memo}
              onChange={(e) => update({ memo: e.target.value })}
              placeholder="e.g. Oct payroll top up"
              className="min-h-20 rounded-btn bg-background-base px-3 py-2 text-paragraph-sm text-text-primary shadow-button-gray outline-none placeholder:text-text-muted focus:shadow-border-focus"
            />
          </label>
          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-paragraph-sm">
            <span className="text-text-muted">{m.label} fee, added on top</span>
            <Money className="text-mono-xs text-text-primary">{fmt(m.fee, draft.ccy)}</Money>
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
          <Button variant="secondary" onClick={close}><span className="px-1">Cancel</span></Button>
          <Button onClick={() => update({ step: 'amount' })}><span className="px-1">Next</span></Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-label-sm text-text-primary">Wallet currency</span>
          <div className="flex flex-col gap-2">
            {enabled.map((c) => {
              const w = data.wallets.find((x) => x.ccy === c && !x.network)
              const on = draft.ccy === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ ccy: c, method: 'rail' })}
                  className={cn('flex items-center gap-3 rounded-xl bg-background-base p-3 text-left transition-shadow', on ? 'shadow-border-brand' : 'shadow-card hover:shadow-card-hover')}
                >
                  <CurrencyMark ccy={c} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-sm text-text-primary">{CCY_NAME[c]}</span>
                    <span className="block text-paragraph-xs text-text-muted">
                      Available balance: <Money className="text-text-primary">{fmt(w?.available ?? 0, c)}</Money>
                    </span>
                  </span>
                  <RadioDot on={on} />
                </button>
              )
            })}
          </div>
          {enabled.length === 1 && <span className="text-caption text-text-muted">Only currencies enabled for your account are listed.</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-label-sm text-text-primary">Payment method</span>
          {draft.ccy === 'USD' ? (
            <div className="flex flex-col gap-2">
              <MethodRow icon={ArrowsLeftRight} label="Wire transfer" sub={`Total fee: ${fmt(USD_WIRE_FEE, 'USD')}`} on={draft.method === 'rail'} onClick={() => update({ method: 'rail' })} />
              <MethodRow icon={Bank} label={`${BANK_ACCOUNTS[0].name} ••${BANK_ACCOUNTS[0].last4}`} sub="ACH · No fee · 3 to 5 business days" on={draft.method === 'ach'} onClick={() => update({ method: 'ach' })} />
            </div>
          ) : (
            <>
              <MethodRow icon={ArrowsLeftRight} label={m.label} sub={`Total fee: ${fmt(m.fee, draft.ccy)}`} on onClick={() => {}} />
              <span className="text-caption text-text-muted">{CCY_NAME[draft.ccy]} wallets are funded by {railInSentence(m.label)} only.</span>
            </>
          )}
        </div>
        {wallet && wallet.pending > 0 && (
          <p className="flex items-start gap-1.5 text-paragraph-xs text-text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            You already have <Money className="text-text-primary">{fmt(wallet.pending, wallet.ccy)}</Money> pending approval in this wallet.
          </p>
        )}
      </div>
    </ModalShell>
  )
}

function MethodRow({ icon: I, label, sub, on, onClick }: { icon: typeof Bank; label: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-center gap-3 rounded-xl bg-background-base p-3 text-left transition-shadow', on ? 'shadow-border-brand' : 'shadow-card hover:shadow-card-hover')}>
      <span className="flex size-8 items-center justify-center rounded-full bg-brand-muted text-brand-text"><I className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-label-sm text-text-primary">{label}</span>
        <span className="block text-paragraph-xs text-text-muted">{sub}</span>
      </span>
      {on && <span className="flex size-5 items-center justify-center rounded-full bg-background-success-base text-text-on-color"><Check weight="bold" className="size-3" /></span>}
    </button>
  )
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-paragraph-sm text-text-muted">{k}</span>
      <span className="text-right text-paragraph-sm text-text-primary">{v}</span>
    </div>
  )
}
