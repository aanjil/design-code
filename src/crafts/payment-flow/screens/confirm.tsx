import { Bank, Check, ClockCountdown, CurrencyEth, ArrowsLeftRight, Table } from '@phosphor-icons/react'
import { usePayment } from '../app'
import type { PayResult } from '../store'
import { CopyButton, CurrencyMark, Money, ModalShell, PrimaryTag } from '../ui'
import { Button } from '@niural/components'
import { COLLECTION_ACCOUNT, LOCAL_RAIL, fmt } from '@/mocks/payment-flow'
import type { LocalCcy } from '@/mocks/payment-flow'
import { railInSentence } from '../engine'
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
    <div className="flex items-center gap-3 rounded-2xl bg-background-base p-4 shadow-card">
      {o.group === 'wallet' ? (
        <CurrencyMark ccy={o.ccy} size="lg" />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-full bg-background-highlight"><Icon className="size-5" /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-label-md text-text-primary">
          {o.label}
          {o.sub && o.group === 'wallet' && <span className="text-text-muted">({o.sub})</span>}
          {o.primary && <PrimaryTag />}
        </p>
        {o.wallet && (
          <p className="text-paragraph-xs text-text-muted">
            Available balance: <Money className="text-text-primary">{fmt(o.wallet.available, o.ccy)}</Money>
          </p>
        )}
        {o.bankLast4 && <p className="text-paragraph-xs text-text-muted">Account ending in {o.bankLast4}</p>}
        {!o.wallet && !o.bankLast4 && o.sub && <p className="text-paragraph-xs text-text-muted">{o.sub}</p>}
      </div>
      <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-text-on-color">
        <Check weight="bold" className="size-3" />
      </span>
    </div>
  )
}

export function ConfirmModal() {
  const { option, q, set, store, payInvoices } = usePayment()
  if (!option || !q) return null
  const total = fmt(q.total, q.ccy)
  const [whole, cents] = total.split('.')
  const close = () => set({ modal: null })
  return (
    <ModalShell
      title="Confirmation"
      onClose={close}
      width="w-[520px]"
      footer={
        <>
          <Button type="button" variant="solid" shade="neutral" onClick={close}>Cancel</Button>
          <Button
            type="button"
            onClick={() => {
              const result = store.pay(payInvoices.map((i) => i.id), option, q)
              set({ modal: { kind: 'success', result }, selected: [] })
            }}
          >
            Submit
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <p className="text-label-md text-text-primary">Payment method</p>
          <MethodSummaryCard o={option} />
        </section>
        <div className="border-t border-dashed border-border-base" />
        <section className="flex flex-col gap-3">
          <p className="text-label-md text-text-primary">Payment summary</p>
          <div className="flex flex-col gap-1.5 rounded-2xl bg-background-base p-4 shadow-card">
            <div className="flex items-center justify-between text-paragraph-sm text-text-muted">
              <span>{payInvoices.length} {payInvoices.length === 1 ? 'invoice' : 'invoices'}</span>
              <Money className="text-mono-xs">{fmt(q.subtotal, q.ccy)}</Money>
            </div>
            {q.fees.map((f) => (
              <div key={f.label} className="flex items-center justify-between text-paragraph-sm text-text-muted">
                <span>{f.label}</span>
                <Money className="text-mono-xs">{fmt(f.amount, q.ccy)}</Money>
              </div>
            ))}
            {q.fxCount > 0 && (
              <p className="text-paragraph-xs text-text-muted">Includes conversion of {q.fxCount} {q.fxCount === 1 ? 'invoice' : 'invoices'} to {q.ccy}.</p>
            )}
            <div className="mt-2 flex items-end justify-between border-t border-border-highlight pt-3">
              <span className="text-label-sm text-text-primary">Total debit amount</span>
              <Money className="text-mono-xl text-text-primary">{whole}<span className="text-text-muted">.{cents}</span></Money>
            </div>
          </div>
        </section>
        <p className="text-paragraph-xs text-text-muted">{authCopy(option, total)}</p>
      </div>
    </ModalShell>
  )
}

export function SuccessModal({ result }: { result: PayResult }) {
  const { set } = usePayment()
  const n = result.ids.length
  const invoices = `${n} ${n === 1 ? 'invoice' : 'invoices'}`
  const done = () => set({ modal: null, screen: 'invoices', payIds: [], methodId: null })
  const transfer = result.option.group === 'wire' || result.option.group === 'local-transfer'
  const total = fmt(result.total, result.ccy)

  if (transfer) {
    const local = result.option.group === 'local-transfer' ? (result.ccy as LocalCcy) : null
    const rail = local ? LOCAL_RAIL[local].method : 'Wire transfer'
    return (
      <ModalShell width="w-[520px]" footer={<Button type="button" width="full" onClick={done}>Done</Button>}>
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-muted text-brand-text"><ClockCountdown className="size-7" weight="duotone" /></span>
          <p className="text-title-h4 text-text-primary">Send your transfer</p>
          <p className="max-w-[380px] text-paragraph-sm text-text-muted">
            Your {invoices} {n === 1 ? 'is' : 'are'} awaiting transfer. Send <Money className="text-text-primary">{total}</Money> by {railInSentence(rail)} and add this reference so we can match your payment.
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-dashed border-brand-primary bg-brand-base px-3 py-2.5">
            <div>
              <p className="text-caption text-text-muted">Reference</p>
              <Money className="text-mono-md text-brand-text">{result.reference}</Money>
            </div>
            <CopyButton value={result.reference ?? ''} />
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-surface-2 p-3">
            {(local ? COLLECTION_ACCOUNT[local] : COLLECTION_ACCOUNT.USD).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-paragraph-xs">
                <span className="text-text-muted">{k}</span>
                <span className="text-right text-text-primary">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-label-sm text-text-primary">Amount to send</span>
            <Money className="text-mono-lg text-text-primary">{total}</Money>
          </div>
        </div>
      </ModalShell>
    )
  }

  const via =
    result.option.group === 'wallet'
      ? `Niural wallet (${result.option.label}${result.option.sub ? ` · ${result.option.sub}` : ''})`
      : result.option.group === 'bank'
        ? `ACH from ${result.option.label} ••${result.option.bankLast4}`
        : 'crypto wallet'
  return (
    <ModalShell width="w-[480px]" footer={<Button type="button" width="full" onClick={done}>Continue</Button>}>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-primary text-text-on-color"><Check weight="bold" className="size-7" /></span>
        <p className="text-title-h4 text-text-primary">Payment submitted</p>
        <p className="max-w-[380px] text-paragraph-sm text-text-muted">
          Your payment of <Money className="text-text-primary">{total}</Money> for {invoices} via {via} has been submitted.
        </p>
        <div className="mt-2 w-full border-t border-dashed border-border-base" />
        <p className="text-paragraph-sm text-text-muted">
          Review invoice details in{' '}
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-muted px-1.5 text-label-sm text-brand-text"><Table className="size-3.5" />Invoice history</span>{' '}
          and find the reference in{' '}
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-muted px-1.5 text-label-sm text-brand-text"><Table className="size-3.5" />{result.option.group === 'wallet' ? 'Wallet transactions' : 'Transactions'}</span>.
        </p>
      </div>
    </ModalShell>
  )
}
