import { Coins, Flask, Receipt, Warning } from '@phosphor-icons/react'
import { round2 } from './engine'
import { CREDIT_EXPIRY, DEFAULT_CREDIT, DEFAULT_FLAGS, useFlowData, useFlowStore } from './store'
import type { CreditEntry, Flags, FlowData } from './store'
import { Money } from './ui'
import { Switch } from '@niural/components'
import { fmt, fmtDate, fmtDateTime } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'

/**
 * Dock → Experiments. Credits and the right-column payment summary are
 * experiments: each switches off to compare with today's flow. Under
 * Credits: the balance, the open-question rules (cross-currency, auto vs
 * opt-in), live-change + failure simulators (P6) and the append-only
 * ledger the Credits area would show.
 */

const BALANCES = [0, 500, 2_000, 10_000, 50_000]

export function ExperimentsPanel({ flash }: { flash: (msg: string) => void }) {
  const data = useFlowData()
  const store = useFlowStore()
  const { flags, credit } = data
  const setFlag = (k: keyof Flags, v: boolean) =>
    store.mutate((d) => {
      d.flags[k] = v
    })

  const adjust = (type: CreditEntry['type'], amount: number, note: string) =>
    store.mutate((d) => {
      d.seq += 1
      d.credit.balance = round2(Math.max(0, d.credit.balance + amount))
      d.creditLedger.unshift({
        id: `cl-${d.seq}`,
        type,
        amount,
        balance: d.credit.balance,
        note,
        at: `${d.today}T15:15:00Z`,
      })
    })

  const setBalance = (v: number) => {
    const delta = round2(v - credit.balance)
    if (!delta) return
    adjust(delta > 0 ? 'grant' : 'admin-deduct', delta, delta > 0 ? 'Credit granted (admin)' : 'Credit deducted (admin)')
    flash(`Credit balance is now ${fmt(v, 'USD')}`)
  }

  return (
    <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1">
      <Experiment
        icon={Coins}
        title="Credits"
        hint="Flag payment-credit-apply. Opt-in credit line in Payment summary, editable amount, Niural fee lines only."
        on={flags.credits}
        onChange={(v) => setFlag('credits', v)}
      >
        <Row label="Balance" value={<Money className="text-label-small text-primary">{fmt(credit.balance, 'USD')}</Money>}>
          <div className="grid grid-cols-5 gap-1">
            {BALANCES.map((b) => (
              <Chip key={b} on={credit.balance === b} onClick={() => setBalance(b)}>
                {b === 0 ? 'None' : b.toLocaleString('en-US')}
              </Chip>
            ))}
          </div>
          <div className="flex gap-1">
            <Chip
              disabled={credit.balance <= 0}
              onClick={() => {
                adjust('admin-deduct', -Math.min(250, credit.balance), 'Credit deducted (admin)')
                flash('Deducted USD 250 - open screens recalc, Confirm asks again')
              }}
            >
              Admin deduct 250
            </Chip>
            <Chip
              onClick={() => {
                adjust('grant', 250, 'Credit granted (admin)')
                flash('Granted USD 250')
              }}
            >
              Grant 250
            </Chip>
          </div>
        </Row>

        <Toggle
          label="Expiry date stored"
          hint={`Shows "Expires ${fmtDate(CREDIT_EXPIRY)}" on the credit sub-line`}
          on={!!credit.expiresOn}
          onChange={(v) =>
            store.mutate((d) => {
              d.credit.expiresOn = v ? CREDIT_EXPIRY : null
            })
          }
        />

        <Row label="Rules" value={<span className="text-caption-sm text-muted">Open - behind config until PM confirms</span>}>
          <Segmented
            value={flags.creditCrossCcy ? 'convert' : 'usd'}
            options={[
              ['convert', 'Converts to invoice currency'],
              ['usd', 'USD invoices only'],
            ]}
            onChange={(v) => setFlag('creditCrossCcy', v === 'convert')}
          />
          <Segmented
            value={flags.creditDefaultOn ? 'on' : 'off'}
            options={[
              ['off', 'Credit starts off'],
              ['on', 'Starts on'],
            ]}
            onChange={(v) => setFlag('creditDefaultOn', v === 'on')}
          />
        </Row>

        <Toggle
          label="Next payment fails"
          hint="One shot. Nothing moves: no credit drawn, no wallet debited (P6)"
          icon={Warning}
          on={flags.failNextPayment}
          onChange={(v) => setFlag('failNextPayment', v)}
        />

        <Ledger data={data} />
      </Experiment>

      <Experiment
        icon={Receipt}
        title="Payment summary breakdown"
        hint="Card under Payment method: invoices, Niural fee, credit, amount due, FX, fees, total. Off = today's footer totals."
        on={flags.summaryPanel}
        onChange={(v) => setFlag('summaryPanel', v)}
      />

      <Experiment
        icon={Flask}
        title="Pay by bank transfer (v1.1)"
        hint="On hold until PM defines the rail per currency (P2). Local invoices only."
        on={flags.localTransfer}
        onChange={(v) => setFlag('localTransfer', v)}
      />

      <button
        type="button"
        onClick={() => {
          store.mutate((d) => {
            d.flags = { ...DEFAULT_FLAGS }
            d.credit = { ...DEFAULT_CREDIT }
          })
          flash('Experiments reset')
        }}
        className="self-end text-label-xsmall text-muted hover:text-primary"
      >
        Reset experiments
      </button>
    </div>
  )
}

function Experiment({
  icon: I,
  title,
  hint,
  on,
  onChange,
  children,
}: {
  icon: typeof Coins
  title: string
  hint: string
  on: boolean
  onChange: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-base borders-base">
      <div className="flex items-start gap-2.5 p-3">
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', on ? 'bg-brand-muted text-brand' : 'bg-highlight text-muted')}>
          <I className="size-4" weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-label-small text-primary">
            {title}
            <span className="rounded-md bg-highlight px-1.5 text-caption-sm text-muted">Experiment</span>
          </p>
          <p className="text-caption-sm text-muted">{hint}</p>
        </div>
        <Switch isChecked={on} onChange={onChange} size="small" disableInternalStateManagement />
      </div>
      {on && children && <div className="flex flex-col gap-3 border-t border-base p-3">{children}</div>}
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label-xsmall text-primary">{label}</p>
        {value}
      </div>
      {children}
    </div>
  )
}

function Toggle({
  label,
  hint,
  on,
  onChange,
  icon: I,
}: {
  label: string
  hint: string
  on: boolean
  onChange: (v: boolean) => void
  icon?: typeof Coins
}) {
  return (
    <div className="flex items-center gap-2">
      {I && <I className={cn('size-4 shrink-0', on ? 'text-warning' : 'text-muted')} />}
      <div className="min-w-0 flex-1">
        <p className="text-label-xsmall text-primary">{label}</p>
        <p className="text-caption-sm text-muted">{hint}</p>
      </div>
      <Switch isChecked={on} onChange={onChange} size="small" disableInternalStateManagement />
    </div>
  )
}

function Chip({ on, disabled, onClick, children }: { on?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-7 rounded-md px-2 text-label-xsmall disabled:text-disabled',
        on ? 'bg-highlight text-primary borders-shadow' : 'text-muted borders-base hover:bg-highlight hover:text-primary',
      )}
    >
      {children}
    </button>
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: Array<[string, string]>
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-highlight p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn('h-7 rounded-md text-label-xsmall', value === v ? 'bg-base text-primary borders-base' : 'text-muted hover:text-primary')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Ledger({ data }: { data: FlowData }) {
  const rows = data.creditLedger.slice(0, 5)
  return (
    <Row label="Credit history" value={<span className="text-caption-sm text-muted">Append-only ledger</span>}>
      <div className="flex flex-col divide-y divide-(--border-muted) rounded-lg borders-base">
        {rows.map((e) => (
          <div key={e.id} className="flex items-center gap-2 px-2.5 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-label-xsmall text-primary">{e.note}</p>
              <p className="truncate text-caption-sm text-muted">
                {fmtDateTime(e.at)}
                {e.rate && ` · ${e.rate}`}
              </p>
            </div>
            <Money className={cn('text-paragraph-xsmall', e.amount < 0 ? 'text-primary' : 'text-success')}>{fmt(e.amount, 'USD', { sign: true })}</Money>
            <Money className="w-24 text-right text-caption-sm text-muted">{fmt(e.balance, 'USD')}</Money>
          </div>
        ))}
      </div>
    </Row>
  )
}
