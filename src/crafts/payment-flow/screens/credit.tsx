import { Coins } from '@phosphor-icons/react'
import { Button, Input } from '@niural/components'
import { usePayment } from '../app'
import { convert, feeTotal, fmtLegs, fmtRate, invoiceTotal, round2 } from '../engine'
import { Banner, LeaderRow, Money } from '../ui'
import { fmt, fmtDate } from '@/mocks/payment-flow'
import type { Ccy, Invoice } from '@/mocks/payment-flow'

/**
 * Credit on the payment screen (spec: Apply credit in the invoice payment
 * flow). One line item in Payment summary: Apply starts at the most the
 * batch can take, and the USD amount stays editable. Credit reduces Niural
 * fee lines only (converted into each fee's currency, earliest due first)
 * and is never a payment method. Invoice cards on the left stay untouched.
 * Hidden when the balance is 0.
 */

/** The credit line item: Apply → editable USD amount + what it covers. */
export function CreditLine() {
  const { credit, usdOnlyBlocked, data, setCredit, setCreditAmount, payInvoices } = usePayment()

  if (usdOnlyBlocked) {
    return (
      <Banner
        tone="info"
        title={<>You have <Money>{fmt(data.credit.balance, 'USD')}</Money> credit. Credit can be used on USD invoices only.</>}
      />
    )
  }
  if (!credit) return null
  const { plan, on, max, raw, error } = credit
  const applied = plan.shares.filter((x) => x.applied > 0)
  const byCcy = [...new Set(applied.map((x) => x.ccy))].map((ccy) => ({
    ccy,
    amount: round2(applied.filter((x) => x.ccy === ccy).reduce((s, x) => s + x.applied, 0)),
  }))
  const fees = plan.shares.length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Coins className="size-4 shrink-0 text-brand" weight="duotone" />
        <div className="min-w-0 flex-1">
          <p className="text-label-small text-primary">Credit</p>
          <p className="text-caption-sm text-muted">
            <Money>{fmt(plan.available, 'USD')}</Money> available
            {data.credit.expiresOn && ` · expires ${fmtDate(data.credit.expiresOn)}`}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={on ? 'ghost' : 'outline'}
          shade={on ? 'neutral' : 'primary'}
          label={on ? 'Remove' : 'Apply'}
          onClick={() => setCredit(!on)}
        />
      </div>

      {on && (
        <>
          <Input
            id="credit-amount"
            aria-label="Credit to apply, USD"
            size="small"
            inputMode="decimal"
            value={raw}
            placeholder="0.00"
            error={error}
            onChange={(e) => setCreditAmount(e.target.value)}
            inputClassName="text-right tabular-nums"
            leftElement={<span className="text-label-xsmall text-muted">USD</span>}
            rightElement={
              <Button
                type="button"
                size="sm"
                variant="ghost"
                shade="primary"
                label="Max"
                disabled={raw === max.toFixed(2)}
                onClick={() => setCreditAmount(max.toFixed(2))}
              />
            }
          />
          {!error && applied.length > 0 && (
            <p className="text-caption-sm text-muted">
              Covers {plan.covered === fees ? `all ${fees}` : `${plan.covered} of ${fees}`} Niural{' '}
              {fees === 1 ? 'fee' : 'fees'}, earliest due first
              {byCcy.length > 1 && (
                <>
                  {' · '}
                  <Money>{fmtLegs(byCcy, 'USD')}</Money>
                </>
              )}
              {byCcy.length === 1 && byCcy[0].ccy !== 'USD' && (
                <>
                  {' · '}
                  <Money>{fmt(byCcy[0].amount, byCcy[0].ccy)}</Money> at 1 USD = {fmtRate(applied[0].rate)} {byCcy[0].ccy}
                </>
              )}
            </p>
          )}
          {!error && max < plan.available && (
            <p className="text-caption-sm text-muted">
              {payInvoices.length === 1 ? 'This invoice' : 'These invoices'} can take up to{' '}
              <Money>{fmt(max, 'USD')}</Money> - the rest stays for later.
            </p>
          )}
        </>
      )}
    </div>
  )
}

/** Credit on its own card - when the Payment summary breakdown is switched off. */
export function CreditCard() {
  const { credit, usdOnlyBlocked } = usePayment()
  if (!credit && !usdOnlyBlocked) return null
  if (usdOnlyBlocked) return <CreditLine />
  return (
    <div className="rounded-2xl bg-base p-4 card">
      <CreditLine />
    </div>
  )
}

/** Nothing left to pay - replaces the wallet rows. */
export function CreditCoversNote() {
  const { payInvoices } = usePayment()
  return (
    <Banner
      tone="success"
      title={`Your credit covers ${payInvoices.length === 1 ? 'this invoice' : 'every invoice'}. No payment method needed.`}
    />
  )
}

export function CreditLeft() {
  const { credit } = usePayment()
  if (!credit?.on) return null
  return (
    <p className="text-caption-sm text-muted">
      Credit left after this payment: <Money className="text-primary">{fmt(credit.plan.left, 'USD')}</Money>
    </p>
  )
}

/* ================= experiment: payment summary breakdown ================= */

/**
 * Right-column breakdown (dock → Experiments → Payment summary): invoices,
 * the Niural fee inside them, credit, amount due per currency, conversion,
 * method fees, total debit, credit left.
 */
export function SummaryPanel() {
  const { q, payInvoices, credit, usdOnlyBlocked } = usePayment()
  if (!q) return null
  const ccys = new Set(payInvoices.map((i) => i.ccy))
  const base: Ccy | null = ccys.size === 1 ? payInvoices[0].ccy : q.split ? null : q.ccy
  const sumBy = (pick: (i: Invoice) => number) => {
    if (base) return [{ ccy: base, amount: round2(payInvoices.reduce((s, i) => s + convert(pick(i), i.ccy, base), 0)) }]
    return [...ccys].map((c) => ({ ccy: c, amount: round2(payInvoices.filter((i) => i.ccy === c).reduce((s, i) => s + pick(i), 0)) }))
  }
  const applied = (i: Invoice) => q.lines.find((l) => l.invoiceId === i.id)?.credit ?? 0
  const gross = sumBy(invoiceTotal)
  const fees = sumBy(feeTotal)
  const credits = sumBy(applied).filter((x) => x.amount > 0)
  const due = sumBy((i) => invoiceTotal(i) - applied(i))
  const hasFees = fees.some((x) => x.amount > 0)
  const converts = !!base && base !== q.ccy && q.amountDue > 0
  const ccy0 = payInvoices[0]?.ccy ?? 'USD'

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-base p-4 card">
      <div className="flex items-center justify-between">
        <p className="text-label-medium text-primary">Payment summary</p>
        <span className="text-caption-sm text-muted">
          {payInvoices.length} {payInvoices.length === 1 ? 'invoice' : 'invoices'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <LeaderRow label="Invoices" value={<Money className="text-paragraph-xsmall">{fmtLegs(gross, ccy0)}</Money>} />
        {hasFees && (
          <LeaderRow muted className="pl-3" label="Niural fee" value={<Money className="text-paragraph-xsmall text-muted">{fmtLegs(fees, ccy0)}</Money>} />
        )}
      </div>
      {(credit || usdOnlyBlocked) && (
        <div className="flex flex-col gap-2 border-t border-base pt-3">
          <CreditLine />
          {credit?.on && credits.length > 0 && (
            <LeaderRow
              label="Credit applied"
              value={<Money className="text-paragraph-xsmall text-success">−{fmtLegs(credits, ccy0)}</Money>}
            />
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 border-t border-base pt-3">
        <LeaderRow strong label="Amount due" value={<Money className="text-label-small">{fmtLegs(due.filter((d) => d.amount > 0), ccy0)}</Money>} />
        {q.fxPairs.map((p) => (
          <LeaderRow
            key={p.from}
            muted
            label="Exchange rate"
            value={<Money className="text-paragraph-xsmall text-muted">1 {p.from} = {fmtRate(p.rate)} {p.to}</Money>}
          />
        ))}
        {converts && (
          <LeaderRow muted label={`Converted to ${q.ccy}`} value={<Money className="text-paragraph-xsmall">{fmt(q.amountDue, q.ccy)}</Money>} />
        )}
        {q.fees.map((f) => (
          <LeaderRow key={f.label} label={f.label} value={<Money className="text-paragraph-xsmall">{fmt(f.amount, q.ccy)}</Money>} />
        ))}
      </div>
      <div className="flex items-end justify-between gap-3 border-t border-base pt-3">
        <span className="text-label-small text-primary">Total debit amount</span>
        <Money className="text-right text-label-large text-primary">
          {/* No legs until a method is picked - show what's still due, not 0. */}
          {q.legs.length ? fmtLegs(q.legs, q.ccy) : fmt(q.total, q.ccy)}
        </Money>
      </div>
      <CreditLeft />
    </div>
  )
}
