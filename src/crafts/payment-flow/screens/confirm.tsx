import { useState } from 'react'
import { Bank, Check, ClockCountdown, Coins, CurrencyEth, ArrowsLeftRight, Table } from '@phosphor-icons/react'
import { usePayment } from '../app'
import type { PayResult } from '../store'
import { Banner, CopyButton, CurrencyMark, Money, ModalShell, PrimaryTag } from '../ui'
import { Button } from '@niural/components'
import { COLLECTION_ACCOUNT, LOCAL_RAIL, fmt } from '@/mocks/payment-flow'
import type { LocalCcy } from '@/mocks/payment-flow'
import { fmtLegs, railInSentence, round2 } from '../engine'
import type { MethodOption } from '../engine'

/**
 * Confirmation (method + total + authorization copy per method) and the
 * result modal. Wallet / ACH / crypto → "Payment submitted"; wire and
 * local transfers → "Send your transfer" with the reference to quote.
 */

function authCopy(o: MethodOption, total: string): string {
  switch (o.group) {
    case 'wallet':
      return `By clicking Submit, you authorize Niural Inc. to debit ${total} from your ${o.label}${o.sub ? ` (${o.sub})` : ''} wallet to pay the selected invoices. This can't be undone once processed.`
    case 'bank':
      return 'By clicking "Submit", you authorize Niural Inc. to debit your bank account via ACH. You authorize, if necessary, adjustments for any debit entries made in error to your account. This authority will remain in effect until your Niural Inc. account has been terminated or you update your payment preferences.'
    case 'crypto':
      return `You'll be asked to approve ${total} from your crypto wallet. Network fees are included and can't be refunded.`
    default:
      return `You'll send ${total} from your own bank. We mark the invoices paid once the funds arrive and match your reference.`
  }
}

export function MethodSummaryCard({ o }: { o: MethodOption }) {
  const Icon = o.group === 'bank' ? Bank : o.group === 'crypto' ? CurrencyEth : ArrowsLeftRight
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-base p-4 card">
      {o.group === 'wallet' ? (
        <CurrencyMark ccy={o.ccy} size="lg" />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-full bg-highlight"><Icon className="size-5" /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-label-medium text-primary">
          {o.label}
          {o.sub && o.group === 'wallet' && <span className="text-muted">({o.sub})</span>}
          {o.primary && <PrimaryTag />}
        </p>
        {o.wallet && (
          <p className="text-paragraph-xsmall text-muted">
            Available balance: <Money className="text-primary">{fmt(o.wallet.available, o.ccy)}</Money>
          </p>
        )}
        {o.bankLast4 && <p className="text-paragraph-xsmall text-muted">Account ending in {o.bankLast4}</p>}
        {!o.wallet && !o.bankLast4 && o.sub && <p className="text-paragraph-xsmall text-muted">{o.sub}</p>}
      </div>
      <span className="flex size-5 items-center justify-center rounded-full bg-brand text-on-color">
        <Check weight="bold" className="size-3" />
      </span>
    </div>
  )
}

/**
 * P6: before committing, amounts are re-checked against live balances and
 * rates. The modal snapshots what it showed; if anything moved (admin
 * deducted credit, a top-up cleared) Submit shows the new amounts and
 * asks again instead of paying.
 */
export function ConfirmModal() {
  const { option, q, set, store, payInvoices } = usePayment()
  // Re-check against live balances + rates: anything that moved shows up here.
  const fingerprint = q
    ? `${q.legs.map((l) => `${l.ccy}:${l.amount}:${l.available ?? ''}`).join(',')}|${q.plan?.used ?? 0}|${q.plan?.available ?? 0}`
    : ''
  const [seen, setSeen] = useState(fingerprint)
  const creditUsed = !!q && q.lines.some((l) => l.credit > 0)
  const creditOnly = !!q && q.amountDue <= 0 && creditUsed
  if (!q || (!option && !q.split && !creditOnly)) return null
  const changed = seen !== fingerprint
  const total = fmtLegs(q.legs, q.ccy)
  const single = q.legs.length <= 1
  const [whole, cents] = single ? total.split('.') : [total, null]
  const gross = q.split
    ? [...new Set(q.lines.map((l) => l.ccy))].map((c) => ({ ccy: c, amount: round2(q.lines.filter((l) => l.ccy === c).reduce((s, l) => s + l.amount, 0)) }))
    : [{ ccy: q.ccy, amount: q.subtotal }]
  const creditShown = q.split
    ? q.plan?.shares.filter((x) => x.applied > 0).map((x) => ({ ccy: x.ccy, amount: x.applied })) ?? []
    : [{ ccy: q.ccy, amount: round2(q.subtotal - q.amountDue) }]
  const close = () => set({ modal: null })
  const submit = () => {
    if (changed) return setSeen(fingerprint)
    const out = store.pay(payInvoices.map((i) => i.id), option, q)
    if (!out.ok) return set({ modal: null, payFailed: true })
    set({ modal: { kind: 'success', result: out.result }, selected: [] })
  }
  return (
    <ModalShell
      title="Confirmation"
      onClose={close}
      width="w-[520px]"
      footer={
        <>
          <Button type="button" variant="solid" shade="neutral" onClick={close}>Cancel</Button>
          <Button type="button" onClick={submit}>
            {changed ? 'Confirm new amounts' : creditOnly ? 'Pay with credit' : 'Submit'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {changed && (
          <Banner tone="warning" title="Your balances changed while this was open. Review the updated amounts and confirm again." />
        )}
        {!creditOnly && (
          <section className="flex flex-col gap-3">
            <p className="text-label-medium text-primary">Payment method</p>
            {q.split ? q.legs.map((l) => <MethodSummaryCard key={l.ccy} o={l.option} />) : option && <MethodSummaryCard o={option} />}
          </section>
        )}
        {!creditOnly && <div className="border-t border-dashed border-base" />}
        <section className="flex flex-col gap-3">
          <p className="text-label-medium text-primary">Payment summary</p>
          <div className="flex flex-col gap-1.5 rounded-2xl bg-base p-4 card">
            <div className="flex items-center justify-between text-paragraph-small text-muted">
              <span>{payInvoices.length} {payInvoices.length === 1 ? 'invoice' : 'invoices'}</span>
              <Money className="text-paragraph-xsmall">{fmtLegs(gross, q.ccy)}</Money>
            </div>
            {q.plan && creditUsed && (
              <div className="flex items-center justify-between gap-3 text-paragraph-small text-muted">
                <span className="flex shrink-0 items-center gap-1.5"><Coins className="size-4 text-success" weight="duotone" />Credit applied</span>
                <Money className="text-right text-paragraph-xsmall text-success">−{fmtLegs(creditShown, q.ccy)}</Money>
              </div>
            )}
            {q.fees.map((f) => (
              <div key={f.label} className="flex items-center justify-between text-paragraph-small text-muted">
                <span>{f.label}</span>
                <Money className="text-paragraph-xsmall">{fmt(f.amount, q.ccy)}</Money>
              </div>
            ))}
            {q.fxCount > 0 && (
              <p className="text-paragraph-xsmall text-muted">Includes conversion of {q.fxCount} {q.fxCount === 1 ? 'invoice' : 'invoices'} to {q.ccy}.</p>
            )}
            <div className="mt-2 flex items-end justify-between border-t border-base pt-3">
              <span className="text-label-small text-primary">Total debit amount</span>
              <Money className={single ? 'text-label-xlarge text-primary' : 'text-right text-label-medium text-primary'}>
                {whole}
                {cents !== null && <span className="text-muted">.{cents}</span>}
              </Money>
            </div>
            {q.plan && creditUsed && (
              <p className="text-caption-sm text-muted">
                Uses <Money className="text-primary">{fmt(q.plan.used, 'USD')}</Money> credit. Credit left after this payment: <Money className="text-primary">{fmt(q.plan.left, 'USD')}</Money>
              </p>
            )}
          </div>
        </section>
        <p className="text-paragraph-xsmall text-muted">
          {creditOnly
            ? `By clicking Pay with credit, you use ${fmt(q.plan?.used ?? 0, 'USD')} of your Niural credit to pay the Niural fees on ${payInvoices.length === 1 ? 'this invoice' : 'these invoices'}. Credit and wallet move together: if anything fails, nothing is used.`
            : option && !q.split
              ? authCopy(option, total)
              : `By clicking Submit, you authorize Niural Inc. to debit ${total} from your Niural wallets to pay the selected invoices. This can't be undone once processed.`}
          {!creditOnly && creditUsed && ' Credit and wallets move together: credit is only used if the payment succeeds.'}
        </p>
      </div>
    </ModalShell>
  )
}

export function SuccessModal({ result }: { result: PayResult }) {
  const { set } = usePayment()
  const n = result.ids.length
  const invoices = `${n} ${n === 1 ? 'invoice' : 'invoices'}`
  const done = () => set({ modal: null, screen: 'invoices', payIds: [], methodId: null })
  const option = result.option
  const transfer = option?.group === 'wire' || option?.group === 'local-transfer'
  const total = fmt(result.total, result.ccy)
  const credit = result.creditUsd > 0 ? fmt(result.creditUsd, 'USD') : null

  if (transfer && option) {
    const local = option.group === 'local-transfer' ? (result.ccy as LocalCcy) : null
    const rail = local ? LOCAL_RAIL[local].method : 'Wire transfer'
    return (
      <ModalShell width="w-[520px]" footer={<Button type="button" width="full" onClick={done}>Done</Button>}>
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-muted text-brand"><ClockCountdown className="size-7" weight="duotone" /></span>
          <p className="text-title-h4 text-primary">Send your transfer</p>
          <p className="max-w-[380px] text-paragraph-small text-muted">
            Your {invoices} {n === 1 ? 'is' : 'are'} awaiting transfer. Send <Money className="text-primary">{total}</Money> by {railInSentence(rail)} and add this reference so we can match your payment.
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-dashed border-brand bg-brand-base px-3 py-2.5">
            <div>
              <p className="text-caption-sm text-muted">Reference</p>
              <Money className="text-label-medium text-brand">{result.reference}</Money>
            </div>
            <CopyButton value={result.reference ?? ''} />
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-surface-page p-3">
            {(local ? COLLECTION_ACCOUNT[local] : COLLECTION_ACCOUNT.USD).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-paragraph-xsmall">
                <span className="text-muted">{k}</span>
                <span className="text-right text-primary">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-label-small text-primary">Amount to send</span>
            <Money className="text-paragraph-large text-primary">{total}</Money>
          </div>
        </div>
      </ModalShell>
    )
  }

  // Names every part: "Paid CAD 41,250.00 from your CAD wallet and USD 1,349.96 credit."
  const fromOf = (o: MethodOption) =>
    o.group === 'wallet'
      ? `your ${o.sub ? `${o.ccy} (${o.sub})` : o.ccy} wallet`
      : o.group === 'bank'
        ? `${o.label} ••${o.bankLast4} by ACH`
        : 'your crypto wallet'
  const parts = result.legs.map((l, i) => (
    <span key={l.ccy}>
      {i > 0 && ' + '}
      <Money className="text-primary">{fmt(l.amount, l.ccy)}</Money> from {fromOf(l.option)}
    </span>
  ))
  const message =
    result.legs.length === 0 ? (
      <>Paid with <Money className="text-primary">{credit}</Money> credit. Nothing was taken from your wallets.</>
    ) : credit ? (
      <>Paid {parts} and <Money className="text-primary">{credit}</Money> credit.</>
    ) : (
      <>Paid {parts} for {invoices}.</>
    )
  return (
    <ModalShell width="w-[480px]" footer={<Button type="button" width="full" onClick={done}>Continue</Button>}>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand text-on-color"><Check weight="bold" className="size-7" /></span>
        <p className="text-title-h4 text-primary">Payment submitted</p>
        <p className="max-w-[380px] text-paragraph-small text-muted">{message}</p>
        <div className="mt-2 w-full border-t border-dashed border-base" />
        <p className="text-paragraph-small text-muted">
          Review invoice details in{' '}
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-muted px-1.5 text-label-small text-brand"><Table className="size-3.5" />Invoice history</span>{' '}
          and find the reference in{' '}
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-muted px-1.5 text-label-small text-brand"><Table className="size-3.5" />{result.legs[0]?.option.group === 'wallet' ? 'Wallet transactions' : result.legs.length === 0 ? 'Credits' : 'Transactions'}</span>.
        </p>
      </div>
    </ModalShell>
  )
}
