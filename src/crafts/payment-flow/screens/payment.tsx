import { useState } from 'react'
import {
  ArrowRight,
  ArrowsLeftRight,
  ArrowsInLineVertical,
  ArrowsOutLineVertical,
  Bank,
  CaretDown,
  CaretRight,
  CaretUpDown,
  CheckCircle,
  CurrencyEth,
  DownloadSimple,
  Info,
  Lightning,
  ArrowSquareOut,
  ArrowsClockwise,
  Plus,
  Wallet,
  WarningOctagon,
  ClockCountdown,
  X,
} from '@phosphor-icons/react'
import { usePayment } from '../app'
import {
  GROUP_LABEL,
  convert,
  currencyShares,
  fmtRate,
  invoiceTotal,
  isLocalMode,
  quote,
  railInSentence,
} from '../engine'
import type { MethodGroup, MethodOption } from '../engine'
import {
  CheckBadge,
  CopyButton,
  CurrencyMark,
  LeaderRow,
  Money,
  PrimaryTag,
  RadioDot,
  RecipientDetails,
  Tag,
} from '../ui'
import { PageHeader } from '@/components/nds/layouts'
import { Button } from '@niural/components'
import {
  CCY_NAME,
  COLLECTION_ACCOUNT,
  LOCAL_RAIL,
  daysFromToday,
  fmt,
  fmtDate,
} from '@/mocks/payment-flow'
import type { Ccy, Invoice, LocalCcy } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'

/**
 * Payment screen - left: selected invoices (flat card for one, accordion
 * for many), right: payment method (compact selected card ⇄ accordion of
 * method groups that expand to their options). Footer: fees, exchange
 * rates, total debit amount, Confirm payment.
 */

export function PaymentScreen() {
  const { ui, set, payInvoices } = usePayment()
  const back = () => set({ screen: 'invoices', modal: null })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Payments"
        onBack={back}
        actions={
          <button type="button" aria-label="Close" onClick={back} className="flex size-8 items-center justify-center rounded-lg text-text-muted hover:bg-background-highlight hover:text-text-primary">
            <X className="size-4" />
          </button>
        }
      />
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 flex-1 overflow-y-auto border-r border-border-highlight">
          <div className="ml-auto w-full max-w-[780px] px-8 py-8">
            <SummaryColumn />
          </div>
        </div>
        <div className="min-h-0 w-[560px] shrink-0 overflow-y-auto">
          <div className="w-full max-w-[520px] px-8 py-8">
            <MethodColumn />
          </div>
        </div>
      </div>
      <TotalsFooter />
      {payInvoices.length === 0 && ui.screen === 'payment' && (
        <div className="absolute inset-0 grid place-items-center text-paragraph-sm text-text-muted">No invoices selected.</div>
      )}
    </div>
  )
}

/* ================= left: payment summary ================= */

function SummaryColumn() {
  const { ui, set, payInvoices, q } = usePayment()
  const multi = payInvoices.length > 1
  const allCollapsed = multi && payInvoices.every((i) => ui.collapsed.includes(i.id))
  const shares = currencyShares(payInvoices)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-title-h5 text-text-primary">Payment summary</h2>
          <p className="mt-1.5 text-paragraph-xs text-text-muted">
            {payInvoices.length} {payInvoices.length === 1 ? 'invoice' : 'invoices'}
            {shares.length > 1 && ` · ${shares.map((s) => s.ccy).join(', ')}`}
            {q && q.fxCount > 0 && ` · converted to ${q.ccy} for ${q.fxCount} of ${payInvoices.length}`}
          </p>
        </div>
        {multi && (
          <button
            type="button"
            onClick={() => set({ collapsed: allCollapsed ? [] : payInvoices.map((i) => i.id) })}
            className="flex items-center gap-1 text-label-xs text-text-primary hover:text-brand-text"
          >
            {allCollapsed ? 'Expand all' : 'Collapse all'}
            {allCollapsed ? <ArrowsOutLineVertical className="size-3.5" /> : <ArrowsInLineVertical className="size-3.5" />}
          </button>
        )}
      </div>
      {payInvoices.map((inv) => (
        <InvoiceCard key={inv.id} inv={inv} accordion={multi} />
      ))}
    </div>
  )
}

function InvoiceCard({ inv, accordion }: { inv: Invoice; accordion: boolean }) {
  const { ui, set, q, data } = usePayment()
  const collapsed = accordion && ui.collapsed.includes(inv.id)
  const line = q?.lines.find((l) => l.invoiceId === inv.id)
  const payCcy = q?.ccy ?? inv.ccy
  const total = invoiceTotal(inv)
  const days = daysFromToday(inv.dueDate, data.today)
  const toggle = () =>
    set((p) => ({ collapsed: collapsed ? p.collapsed.filter((x) => x !== inv.id) : [...p.collapsed, inv.id] }))
  const remove = () =>
    set((p) => ({ payIds: p.payIds.filter((x) => x !== inv.id), selected: p.selected.filter((x) => x !== inv.id), methodId: null }))

  return (
    <div className="overflow-hidden rounded-2xl bg-background-base shadow-card">
      <div className={cn('flex items-center gap-2 px-4', accordion ? 'h-14' : 'pt-4 pb-1')}>
        {accordion ? (
          <button type="button" onClick={toggle} className="flex min-w-0 items-center gap-1.5 text-left">
            <span className="truncate text-label-md text-text-primary">{inv.name}</span>
            {collapsed ? <CaretRight className="size-4 shrink-0" /> : <CaretDown className="size-4 shrink-0" />}
          </button>
        ) : (
          <span className="truncate text-label-md text-text-primary">{inv.name}</span>
        )}
        <span className="flex-1" />
        {inv.person && <Tag tone="blue">{inv.person}</Tag>}
        {!inv.person && <Tag tone="gray">{inv.description}</Tag>}
        {collapsed && line && (
          <>
            <span className="text-text-muted">·</span>
            <Money className="text-mono-sm text-text-primary">{fmt(line.converted, payCcy)}</Money>
          </>
        )}
        {accordion && (
          <button type="button" aria-label={`Remove ${inv.name}`} onClick={remove} className="ml-1 flex size-7 items-center justify-center rounded-lg text-text-muted hover:bg-background-highlight hover:text-text-primary">
            <X className="size-4" />
          </button>
        )}
      </div>
      {!collapsed && (
        <div className={cn('flex flex-col gap-3 px-4 pb-4', accordion && 'border-t border-border-highlight pt-3')}>
          <p className="text-paragraph-xs text-text-primary">
            Due date: {fmtDate(inv.dueDate)}
            {days < 0 && <span className="ml-2 text-text-error-base">Overdue by {-days} days</span>}
            {days >= 0 && <span className="ml-2 text-text-muted">Due in {days} days</span>}
          </p>
          <div className="flex flex-col gap-2.5">
            {inv.lines.map((l) => (
              <LeaderRow
                key={l.label}
                label={l.label}
                muted={inv.lines.length > 1}
                value={<Conv amount={l.amount} from={inv.ccy} to={payCcy} />}
              />
            ))}
          </div>
          <div className="border-t border-border-highlight pt-3">
            <LeaderRow strong label="Subtotal" value={<Conv amount={total} from={inv.ccy} to={payCcy} strong />} />
          </div>
        </div>
      )}
    </div>
  )
}

/** "CAD 200.00 → USD 143.64" when currencies differ; plain amount otherwise. */
function Conv({ amount, from, to, strong }: { amount: number; from: Ccy; to: Ccy; strong?: boolean }) {
  if (from === to) return <Money className={strong ? 'text-mono-sm' : 'text-mono-xs'}>{fmt(amount, from)}</Money>
  return (
    <span className="inline-flex items-center gap-1.5">
      <Money className="text-mono-xs text-text-muted">{fmt(amount, from)}</Money>
      <ArrowRight className="size-3.5 text-text-muted" />
      <Money className={strong ? 'text-mono-sm' : 'text-mono-xs'}>{fmt(convert(amount, from, to), to)}</Money>
    </span>
  )
}

/* ================= right: payment method ================= */

const GROUP_META: Record<MethodGroup, { icon: typeof Wallet; tint: string; desc: (local?: LocalCcy) => string }> = {
  wallet: { icon: Wallet, tint: 'bg-background-success-muted text-text-success-base', desc: () => 'Make fast, secure payments in multiple currencies using your Niural balance.' },
  bank: { icon: Bank, tint: 'bg-background-info-muted text-text-info-base', desc: () => 'Make payments directly from your connected bank account.' },
  crypto: { icon: CurrencyEth, tint: 'bg-accent-pink-muted text-accent-pink-base', desc: () => 'Easily pay with crypto: fast, secure, and hassle-free.' },
  wire: { icon: ArrowsLeftRight, tint: 'bg-accent-teal-muted text-accent-teal-base', desc: () => 'Securely send payments via wire transfer from your bank account.' },
  'local-transfer': {
    icon: Bank,
    tint: 'bg-accent-teal-muted text-accent-teal-base',
    desc: (l) => (l ? `Send ${l} by ${LOCAL_RAIL[l].method} from your own bank. Paid once we receive it.` : ''),
  },
}

const GROUP_ORDER: Array<MethodGroup> = ['wallet', 'local-transfer', 'bank', 'crypto', 'wire']

function MethodColumn() {
  const { ui, option, q, data, payInvoices } = usePayment()
  const localMode = isLocalMode(payInvoices, data.local)
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-title-h5 text-text-primary">Payment method</h2>
      {ui.methodsOpen || !option ? (
        <MethodGroups />
      ) : (
        <>
          <SelectedMethod option={option} />
          {q && <MethodDetails option={option} />}
        </>
      )}
      {localMode && !ui.methodsOpen && option?.group === 'wallet' && option.ccy === 'USD' && data.local && (
        <SwitchToLocalHint local={data.local} />
      )}
    </div>
  )
}

function SelectedMethod({ option }: { option: MethodOption }) {
  const { set, q } = usePayment()
  const insufficient = q && !q.sufficient
  return (
    <button
      type="button"
      onClick={() => set({ methodsOpen: true, openGroup: option.group })}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl bg-background-base p-4 text-left shadow-card transition-shadow hover:shadow-card-hover',
        insufficient && 'shadow-border-error hover:shadow-border-error',
      )}
    >
      <OptionIcon option={option} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-label-md text-text-primary">{option.label}</span>
          {option.sub && option.group === 'wallet' && <span className="text-label-md text-text-muted">({option.sub})</span>}
          {option.primary && <PrimaryTag />}
          {q && q.fxCount === 0 && option.group === 'wallet' && <Tag tone="green">No FX</Tag>}
        </span>
        <OptionSubline option={option} />
      </span>
      <CaretUpDown className="size-5 shrink-0 text-text-muted" />
    </button>
  )
}

function OptionIcon({ option }: { option: MethodOption }) {
  if (option.group === 'wallet') return <CurrencyMark ccy={option.ccy} size="md" />
  const I = GROUP_META[option.group].icon
  return <I className="size-5 shrink-0 text-text-muted" />
}

function OptionSubline({ option }: { option: MethodOption }) {
  if (option.wallet) {
    return (
      <span className="block text-paragraph-xs text-text-muted">
        Available balance: <Money className="text-text-primary">{fmt(option.wallet.available, option.ccy)}</Money>
        {option.wallet.pending > 0 && (
          <>
            {' · '}
            <Money>{fmt(option.wallet.pending, option.ccy)}</Money> pending
          </>
        )}
      </span>
    )
  }
  if (option.bankLast4) return <span className="block text-paragraph-xs text-text-muted">Account ending in {option.bankLast4}</span>
  if (option.fee > 0) return <span className="block text-paragraph-xs text-text-muted">{option.feeLabel ?? 'Fee'}: <Money className="text-text-primary">{fmt(option.fee, option.ccy)}</Money></span>
  return option.sub ? <span className="block text-paragraph-xs text-text-muted">{option.sub}</span> : null
}

/* ---------- accordion of method groups ---------- */

function MethodGroups() {
  const { ui, set, groups, data, payInvoices, option } = usePayment()
  const localMode = isLocalMode(payInvoices, data.local)
  const visible = GROUP_ORDER.filter((g) => groups[g].length > 0)

  return (
    <div className="flex flex-col gap-3">
      {localMode && data.local && (
        <p className="flex items-start gap-1.5 text-paragraph-xs text-text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {payInvoices.length === 1 ? 'This invoice is' : 'These invoices are'} billed in {data.local}. Pay from a Niural wallet or by {railInSentence(LOCAL_RAIL[data.local].method)} from your bank.
        </p>
      )}
      {visible.map((g) => {
        const open = ui.openGroup === g
        const meta = GROUP_META[g]
        const I = meta.icon
        const single = groups[g].length === 1 && (g === 'wire' || g === 'local-transfer')
        const selectedHere = option?.group === g
        const pick = (o: MethodOption) => set({ methodId: o.id, methodsOpen: false, openGroup: null, wireVerify: 'idle' })
        return (
          <div key={g} className={cn('overflow-hidden rounded-2xl transition-colors', open ? 'bg-background-highlight p-1 pb-3' : 'bg-background-base shadow-card')}>
            <button
              type="button"
              onClick={() => (single ? pick(groups[g][0]) : set({ openGroup: open ? null : g }))}
              className={cn('flex w-full items-center gap-3 p-3 text-left', !open && 'hover:bg-background-highlight')}
            >
              <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', meta.tint)}>
                <I className="size-5" weight="duotone" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-label-md text-text-primary">{g === 'local-transfer' ? groups[g][0].label : GROUP_LABEL[g]}</span>
                  {open && (g === 'wallet' || g === 'bank') && (
                    <span className="inline-flex items-center gap-1 text-label-xs text-text-info-base"><ArrowsClockwise className="size-3.5" />Refresh</span>
                  )}
                  {single && groups[g][0].fee > 0 && <Tag tone="gray">Fee {fmt(groups[g][0].fee, groups[g][0].ccy)}</Tag>}
                  {selectedHere && !open && <Tag tone="brand">Selected</Tag>}
                </span>
                {!open && <span className="block text-paragraph-xs text-text-muted">{meta.desc(data.local ?? undefined)}</span>}
              </span>
              {single ? <CaretRight className="size-5 text-text-muted" /> : <CaretDown className={cn('size-5 text-text-muted transition-transform', open && 'rotate-180')} />}
            </button>
            {open && (
              <div className="flex flex-col gap-2.5 px-2">
                {groups[g].map((o) => (
                  <OptionCard key={o.id} o={o} selected={option?.id === o.id} onPick={() => pick(o)} />
                ))}
                {g === 'bank' && <AddMethodRow />}
              </div>
            )}
          </div>
        )
      })}
      {option && (
        <button type="button" onClick={() => set({ methodsOpen: false, openGroup: null })} className="self-end text-label-xs text-text-muted hover:text-text-primary">
          Keep {option.label}
        </button>
      )}
    </div>
  )
}

function OptionCard({ o, selected, onPick }: { o: MethodOption; selected: boolean; onPick: () => void }) {
  const { payInvoices } = usePayment()
  const oq = quote(payInvoices, o)
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl bg-background-base p-3.5 text-left transition-shadow',
        selected ? 'shadow-border-brand' : 'shadow-card hover:shadow-card-hover',
      )}
    >
      {o.group === 'wallet' ? <CurrencyMark ccy={o.ccy} /> : <OptionIcon option={o} />}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-label-sm text-text-primary">{o.label}</span>
          {o.sub && o.group === 'wallet' && <span className="text-label-sm text-text-muted">({o.sub})</span>}
          {o.primary && <PrimaryTag />}
          {o.group === 'wallet' && oq.fxCount === 0 && <Tag tone="green">No FX</Tag>}
          {o.group === 'wallet' && oq.fxCount > 0 && o.ccy !== 'USD' && !o.sub && <Tag tone="gray">FX on {oq.fxCount}</Tag>}
        </span>
        <OptionSubline option={o} />
        {o.wallet && !oq.sufficient && (
          <span className="block text-caption text-text-error-base">Not enough to cover {fmt(oq.total, o.ccy)}</span>
        )}
      </span>
      {selected && <CheckBadge />}
    </button>
  )
}

function AddMethodRow() {
  return (
    <div className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-base text-label-sm text-text-info-base">
      <Plus className="size-4" /> Add payment method <ArrowSquareOut className="size-4" />
    </div>
  )
}

/* ---------- per-method details under the selected card ---------- */

function MethodDetails({ option }: { option: MethodOption }) {
  const { q, openFund, data } = usePayment()
  if (!q) return null

  if (option.group === 'wallet') {
    const fiat = option.wallet && !option.wallet.network && (option.ccy === 'USD' || option.ccy === data.local)
    if (!q.sufficient) {
      const fundCcy = fiat ? (option.ccy as 'USD' | LocalCcy) : null
      if (q.coveredByPending) {
        return (
          <InlineNote tone="warning" icon={ClockCountdown}>
            Not enough available balance in your {option.ccy} wallet. <Money>{fmt(q.pending ?? 0, option.ccy)}</Money> is waiting for approval and can be used once it clears.
            {fundCcy && <FundLink onClick={() => openFund(fundCcy, q.shortfall)} />}
          </InlineNote>
        )
      }
      return (
        <InlineNote tone="error" icon={WarningOctagon}>
          Not enough balance in your {option.ccy} wallet. You need <Money className="text-text-primary">{fmt(q.shortfall, option.ccy)}</Money> more to pay {q.lines.length === 1 ? 'this invoice' : 'these invoices'}.
          {fundCcy ? <FundLink onClick={() => openFund(fundCcy, q.shortfall)} /> : <FundLink label="Top up balance" external />}
        </InlineNote>
      )
    }
    if (q.fxCount > 0) {
      return (
        <p className="flex items-start gap-1.5 px-1 text-paragraph-xs text-text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {q.fxCount === q.lines.length ? 'All invoices' : `${q.fxCount} of ${q.lines.length} invoices`} will be converted to {option.ccy} at the exchange rate shown below.
        </p>
      )
    }
    return (
      <p className="flex items-start gap-1.5 px-1 text-paragraph-xs text-text-muted">
        <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-text-success-base" weight="fill" />
        Paid in {option.ccy} from your {CCY_NAME[option.ccy]} wallet. No conversion.
      </p>
    )
  }

  if (option.group === 'bank') {
    return (
      <p className="flex items-start gap-1.5 px-1 text-paragraph-xs text-text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        We'll debit {option.label} ••{option.bankLast4} by ACH. Funds usually settle in 3 to 5 business days.
      </p>
    )
  }

  if (option.group === 'crypto') {
    return (
      <p className="flex items-start gap-1.5 px-1 text-paragraph-xs text-text-muted">
        <Lightning className="mt-0.5 size-3.5 shrink-0" />
        After you confirm, you'll approve <Money className="text-text-primary">{fmt(q.total, 'USDC')}</Money> from your wallet. Includes the network fee.
      </p>
    )
  }

  if (option.group === 'wire') return <WireDetails />
  return <LocalTransferDetails local={option.ccy as LocalCcy} />
}

function InlineNote({ tone, icon: I, children }: { tone: 'error' | 'warning'; icon: typeof Info; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl p-3 text-paragraph-xs text-text-primary',
        tone === 'error' ? 'bg-background-error-highlight' : 'bg-background-warning-highlight',
      )}
    >
      <I weight="fill" className={cn('mt-0.5 size-4 shrink-0', tone === 'error' ? 'text-text-error-base' : 'text-text-warning-base')} />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  )
}

function FundLink({ onClick, label = 'Fund wallet', external }: { onClick?: () => void; label?: string; external?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="mt-1.5 flex items-center gap-1 text-label-xs text-brand-text hover:underline">
      {label}
      {external ? <ArrowSquareOut className="size-3.5" /> : <ArrowRight className="size-3.5" />}
    </button>
  )
}

function SwitchToLocalHint({ local }: { local: LocalCcy }) {
  const { set, data } = usePayment()
  const w = data.wallets.find((x) => x.ccy === local)
  if (!w) return null
  return (
    <button
      type="button"
      onClick={() => set({ methodId: w.id })}
      className="flex items-center gap-2 rounded-xl bg-background-base p-3 text-left text-paragraph-xs text-text-muted shadow-card hover:shadow-card-hover"
    >
      <CurrencyMark ccy={local} size="sm" />
      <span className="flex-1">Pay from your {local} wallet to skip currency conversion.</span>
      <span className="text-label-xs text-brand-text">Switch</span>
    </button>
  )
}

function WireDetails() {
  const { ui, set } = usePayment()
  const [method, setMethod] = useState<'sms' | null>(null)
  const [code, setCode] = useState('')
  const fields = COLLECTION_ACCOUNT.USD
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-background-base p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-label-md text-text-primary">Recipient details</p>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" shade="neutral" size="sm" leftIcon={<DownloadSimple className="size-4" />}>Download</Button>
            <CopyButton value={fields.map(([k, v]) => `${k}: ${v}`).join('\n')} label="Copy all" />
          </div>
        </div>
        <RecipientDetails fields={fields} />
        <p className="mt-1 rounded-lg bg-background-info-highlight p-2.5 text-paragraph-xs text-text-primary">
          Include the reference number we give you after confirming, or your wire may be rejected. Let us know once you've sent the funds.
        </p>
      </div>
      {ui.wireVerify === 'verified' ? (
        <p className="flex items-center gap-1.5 text-label-sm text-text-success-base">
          <CheckCircle weight="fill" className="size-4" /> Verified by SMS
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-label-md text-text-primary">Select verification method</p>
          <div className="flex flex-col rounded-xl bg-background-base p-1 shadow-card">
            <span className="flex items-center gap-2.5 p-2.5 text-paragraph-sm text-text-disabled">
              <RadioDot on={false} /> Verify using connected 2FA authenticator
            </span>
            <button type="button" onClick={() => setMethod('sms')} className="flex items-center gap-2.5 rounded-lg p-2.5 text-left text-paragraph-sm text-text-primary hover:bg-background-highlight">
              <RadioDot on={method === 'sms'} /> Verify using SMS notification
            </button>
          </div>
          {ui.wireVerify === 'code' ? (
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label-xs text-text-primary">Enter the 6-digit code sent to •••• 4821</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="h-9 rounded-btn bg-background-base px-3 font-mono text-mono-sm tracking-[0.3em] shadow-button-gray outline-none focus:shadow-border-focus"
                />
              </label>
              <Button type="button" disabled={code.length !== 6} onClick={() => set({ wireVerify: 'verified' })}>Confirm code</Button>
            </div>
          ) : (
            <Button type="button" className="self-start" disabled={!method} onClick={() => set({ wireVerify: 'code' })}>Verify</Button>
          )}
        </div>
      )}
    </div>
  )
}

function LocalTransferDetails({ local }: { local: LocalCcy }) {
  const rail = LOCAL_RAIL[local]
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-background-base p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-label-md text-text-primary">Send to</p>
        <CopyButton value={COLLECTION_ACCOUNT[local].map(([k, v]) => `${k}: ${v}`).join('\n')} label="Copy all" />
      </div>
      <RecipientDetails fields={COLLECTION_ACCOUNT[local]} />
      <p className="mt-1 rounded-lg bg-background-info-highlight p-2.5 text-paragraph-xs text-text-primary">
        {rail.instruction} You'll get the reference after you confirm. These invoices stay Awaiting transfer until we receive the funds.
      </p>
    </div>
  )
}

/* ================= footer ================= */

function TotalsFooter() {
  const { q, option, ui, set } = usePayment()
  const blocked = !q || !q.sufficient || (option?.group === 'wire' && ui.wireVerify !== 'verified') || ui.methodsOpen
  const [whole, cents] = q ? fmt(q.total, q.ccy).split('.') : ['', '']
  return (
    <div className="flex shrink-0 border-t border-border-highlight bg-background-base">
      <div className="flex-1 border-r border-border-highlight">
        <div className="ml-auto w-full max-w-[780px] px-8 py-4">
          {q && (
            <div className="flex flex-col gap-1.5">
              {q.fees.map((f) => (
                <LeaderRow key={f.label} label={f.label} value={<Money className="text-mono-xs">{fmt(f.amount, q.ccy)}</Money>} />
              ))}
              {q.fxPairs.map((p) => (
                <LeaderRow
                  key={p.from}
                  muted
                  label="Exchange rate"
                  value={<Money className="text-mono-xs text-text-muted">1 {p.from} = {fmtRate(p.rate)} {p.to}</Money>}
                />
              ))}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-label-md text-text-primary">Total debit amount</span>
                <span className="h-px flex-1 border-t border-dotted border-border-base" />
                <Money className="text-mono-lg text-text-primary">
                  {whole}
                  <span className="text-text-muted">.{cents}</span>
                </Money>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex w-[560px] shrink-0 items-end px-8 py-4">
        <div className="flex w-full max-w-[520px] items-center justify-between gap-3">
          <span className="text-paragraph-xs text-text-muted">
            {option?.group === 'wire' && ui.wireVerify !== 'verified' && 'Verify to continue'}
            {ui.methodsOpen && 'Choose a payment method'}
          </span>
          <Button type="button" size="lg" className="h-9" disabled={blocked} onClick={() => set({ modal: { kind: 'confirm' } })}>
            Confirm payment
          </Button>
        </div>
      </div>
    </div>
  )
}
