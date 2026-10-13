import { useEffect, useState } from 'react'
import {
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
  CheckCircle,
  ClockClockwise,
  ArrowsInSimple,
  Database,
  Plus,
  SlidersHorizontal,
} from '@phosphor-icons/react'
import { useEmployerConfig, useFlowData, useFlowStore } from './store'
import { CurrencyMark, Money } from './ui'
import { Button } from '@niural/components'
import {
  CCY_FLAG,
  DATASETS,
  WORLD_TODAY,
  addDays,
  addMonths,
  daysBetween,
  fmt,
  fmtDate,
} from '@/mocks/payment-flow'
import type { Ccy, EmployerLocal } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'

/**
 * Mock data dock - floating, bottom center of the live App. Prototype
 * controls, not product UI: Data (dataset presets + add invoice), Time
 * machine (move "today": overdue days recompute, wallet payments settle
 * after 1 day, ACH after 3), Controls (employer currencies, wallet
 * balances, approve pending funding, reset). Visually a dark pill so it
 * never reads as part of the product.
 */

type Tab = 'data' | 'time' | 'controls'

const TABS: Array<{ id: Tab; label: string; icon: typeof Database }> = [
  { id: 'data', label: 'Data', icon: Database },
  { id: 'time', label: 'Time machine', icon: ClockClockwise },
  { id: 'controls', label: 'Controls', icon: SlidersHorizontal },
]

const ADD_CCYS: Array<Ccy> = ['USD', 'CAD', 'GBP', 'EUR', 'INR', 'PHP', 'NPR', 'USDC']

const MIN_KEY = 'nds-mock-dock:minimized'

export function MockDock({
  fixed,
  leading,
}: {
  fixed?: boolean
  /** Host-specific controls at the start of the pill (Master App: Go to). */
  leading?: React.ReactNode
} = {}) {
  const data = useFlowData()
  const store = useFlowStore()
  const { local, setLocal } = useEmployerConfig()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('data')
  const [note, setNote] = useState<string | null>(null)
  const [minimized, setMinimizedState] = useState(false)
  useEffect(() => {
    try {
      setMinimizedState(window.localStorage.getItem(MIN_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [])
  const setMinimized = (m: boolean) => {
    setMinimizedState(m)
    if (m) setOpen(false)
    try {
      window.localStorage.setItem(MIN_KEY, m ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  const flash = (msg: string) => {
    setNote(msg)
    window.setTimeout(() => setNote((n) => (n === msg ? null : n)), 2600)
  }
  const travel = (to: string) => {
    const n = store.travel(to)
    flash(n ? `${n} ${n === 1 ? 'payment' : 'payments'} settled · moved to Invoice history` : `Today is ${fmtDate(to)}`)
  }

  const open_ = data.invoices.filter((i) => i.status !== 'paid')
  const pending = open_.filter((i) => i.status === 'pending')
  const overdue = pending.filter((i) => i.dueDate < data.today)
  const offset = daysBetween(WORLD_TODAY, data.today)

  return (
    <div className={cn('pointer-events-none inset-x-0 bottom-3 z-30 flex flex-col items-center gap-2', fixed ? 'fixed' : 'absolute')}>
      {open && !minimized && (
        <div className="pointer-events-auto w-[600px] overflow-hidden rounded-2xl bg-surface-2 shadow-flyout">
          <div className="flex items-center gap-1 border-b border-border-highlight p-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-label-xs transition-colors',
                  tab === t.id ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted hover:text-text-primary',
                )}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === 'data' && (
              <div className="flex flex-col gap-4">
                <Section title="Dataset" hint={`${open_.length} open · ${pending.length} payable · ${overdue.length} overdue`}>
                  <div className="grid grid-cols-5 gap-1.5">
                    {DATASETS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        title={d.hint}
                        onClick={() => {
                          store.reset(data.local, { dataset: d.id })
                          flash(d.hint)
                        }}
                        className={cn(
                          'flex h-14 flex-col items-start justify-center rounded-xl px-2.5 text-left transition-shadow',
                          data.dataset === d.id ? 'bg-background-base shadow-border-brand' : 'bg-background-base shadow-button-gray hover:shadow-card-hover',
                        )}
                      >
                        <span className="text-label-xs text-text-primary">{d.label}</span>
                        <span className="line-clamp-1 text-caption text-text-muted">{d.hint}</span>
                      </button>
                    ))}
                  </div>
                </Section>
                <AddInvoice
                  local={data.local}
                  onAdd={(ccy, tab, overdue) => {
                    const inv = store.addInvoice({ ccy, tab, overdue })
                    flash(`Added ${inv.name} · ${fmt(inv.lines[0].amount, inv.ccy)}`)
                  }}
                />
              </div>
            )}

            {tab === 'time' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-caption text-text-muted">Today in the prototype</p>
                    <p className="text-title-h4 text-text-primary">{fmtDate(data.today)}</p>
                    <p className="text-caption text-text-muted">
                      {offset === 0 ? 'Real mock date' : `${offset > 0 ? '+' : ''}${offset} days from ${fmtDate(WORLD_TODAY)}`}
                    </p>
                  </div>
                  <Button type="button" variant="solid" shade="neutral" size="sm" leftIcon={<ArrowCounterClockwise className="size-4" />} disabled={offset === 0} onClick={() => travel(WORLD_TODAY)}>
                    Back to today
                  </Button>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {(
                    [
                      ['−1 month', () => addMonths(data.today, -1)],
                      ['−1 week', () => addDays(data.today, -7)],
                      ['−1 day', () => addDays(data.today, -1)],
                      ['+1 day', () => addDays(data.today, 1)],
                      ['+1 week', () => addDays(data.today, 7)],
                      ['+1 month', () => addMonths(data.today, 1)],
                    ] as Array<[string, () => string]>
                  ).map(([label, to]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => travel(to())}
                      className="h-9 rounded-lg bg-background-base text-label-xs text-text-primary shadow-button-gray hover:bg-background-highlight"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-paragraph-xs text-text-muted">
                  Overdue days recalculate everywhere. Moving forward settles payments: wallet and crypto after 1 day, ACH after 3. Wire and local transfers wait for admin.
                </p>
              </div>
            )}

            {tab === 'controls' && (
              <div className="flex flex-col gap-4">
                <Section title="Employer currencies">
                  <div className="grid grid-cols-4 gap-1.5">
                    {([null, 'CAD', 'GBP', 'EUR'] as Array<EmployerLocal>).map((l) => (
                      <button
                        key={l ?? 'usd'}
                        type="button"
                        onClick={() => setLocal(l)}
                        className={cn(
                          'flex h-9 items-center justify-center gap-1.5 rounded-lg bg-background-base text-label-xs text-text-primary',
                          local === l ? 'shadow-border-brand' : 'shadow-button-gray hover:bg-background-highlight',
                        )}
                      >
                        <span aria-hidden>{l ? CCY_FLAG[l] : CCY_FLAG.USD}</span>
                        {l ? `USD + ${l}` : 'USD only'}
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="Wallet balances" hint="Available only - pending never pays invoices">
                  <div className="flex flex-col gap-1.5">
                    {data.wallets
                      .filter((w) => !w.network || w.available > 0)
                      .map((w) => (
                        <div key={w.id} className="flex items-center gap-2 rounded-lg bg-background-base px-2.5 py-1.5 shadow-button-gray">
                          <CurrencyMark ccy={w.ccy} size="sm" />
                          <span className="w-24 truncate text-label-xs text-text-primary">{w.network ? `${w.ccy} · ${w.network}` : w.ccy}</span>
                          <Money className="flex-1 text-mono-xs text-text-primary">{fmt(w.available, w.ccy)}</Money>
                          {w.pending > 0 && <Money className="text-mono-xs text-text-muted">+{fmt(w.pending, w.ccy)} pending</Money>}
                          {(
                            [
                              ['0', 0],
                              ['−10k', w.available - 10_000],
                              ['+10k', w.available + 10_000],
                              ['+100k', w.available + 100_000],
                            ] as Array<[string, number]>
                          ).map(([label, v]) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => store.setBalance(w.id, v)}
                              className="h-6 rounded-md px-1.5 text-label-xs text-text-muted hover:bg-background-highlight hover:text-text-primary"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ))}
                  </div>
                </Section>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="solid"
                    shade="neutral"
                    size="sm"
                    leftIcon={<CheckCircle className="size-4" />}
                    onClick={() => {
                      const n = store.approveAllPending()
                      flash(n ? `Approved ${n} funding ${n === 1 ? 'request' : 'requests'}` : 'No pending funding to approve')
                    }}
                  >
                    Approve pending funding
                  </Button>
                  <span className="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    shade="error"
                    size="sm"
                    leftIcon={<ArrowCounterClockwise className="size-4" />}
                    onClick={() => {
                      store.reset(data.local, { dataset: 'realistic', today: WORLD_TODAY })
                      flash('Reset to the realistic dataset')
                    }}
                  >
                    Reset all
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {note && (
        <div className="pointer-events-none rounded-full bg-grain-ink px-3 py-1.5 text-label-xs text-grain-ink-foreground shadow-flyout">{note}</div>
      )}

      {minimized ? (
        /* minimized: a small handle - click to bring the dock back */
        <button
          type="button"
          aria-label="Expand mock data dock"
          title="Mock data dock"
          onClick={() => setMinimized(false)}
          className="pointer-events-auto flex h-6 items-center gap-1 rounded-full bg-grain-ink px-2.5 text-grain-ink-foreground shadow-flyout transition-[height] hover:h-7"
        >
          <span className="h-1 w-8 rounded-full bg-grain-ink-muted" />
          <CaretUp className="size-3" />
        </button>
      ) : (
        /* pill - inverted surface so it never reads as product UI */
        <div className="pointer-events-auto flex h-10 items-center gap-1 rounded-full bg-grain-ink p-1 text-label-xs text-grain-ink-foreground shadow-flyout">
          {leading && (
            <>
              {leading}
              <span className="h-4 w-px bg-elevation-alpha-24" />
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            title="Mock data, time machine and controls"
            className="flex h-8 items-center gap-3 rounded-full pr-1.5 pl-2.5 hover:bg-elevation-alpha-12"
          >
            <span className="flex items-center gap-1.5">
              <Database className="size-4" />
              {DATASETS.find((d) => d.id === data.dataset)?.label} · {open_.length}
            </span>
            <span className="h-4 w-px bg-elevation-alpha-24" />
            <span className="flex items-center gap-1.5">
              <ClockClockwise className="size-4" />
              {fmtDate(data.today)}
              {offset !== 0 && <span className="text-grain-ink-muted">({offset > 0 ? '+' : ''}{offset}d)</span>}
            </span>
            <span className="h-4 w-px bg-elevation-alpha-24" />
            <span className="flex items-center gap-1.5">
              <span aria-hidden>{data.local ? CCY_FLAG[data.local] : CCY_FLAG.USD}</span>
              {data.local ? `USD + ${data.local}` : 'USD only'}
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-elevation-alpha-16">
              {open ? <CaretDown className="size-3.5" /> : <CaretUp className="size-3.5" />}
            </span>
          </button>
          <button
            type="button"
            aria-label="Minimize dock"
            title="Minimize dock"
            onClick={() => setMinimized(true)}
            className="flex size-8 items-center justify-center rounded-full text-grain-ink-muted hover:bg-elevation-alpha-12 hover:text-grain-ink-foreground"
          >
            <ArrowsInSimple className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label-sm text-text-primary">{title}</p>
        {hint && <p className="text-caption text-text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function AddInvoice({ local, onAdd }: { local: EmployerLocal; onAdd: (ccy: Ccy, tab: 'contracts' | 'fees', overdue: boolean) => void }) {
  const [tab, setTab] = useState<'contracts' | 'fees'>('contracts')
  const [ccy, setCcy] = useState<Ccy>('USD')
  const [overdue, setOverdue] = useState(false)
  // Niural fees bill in the employer's currency - not user-pickable
  const feeCcy: Ccy = local ?? 'USD'
  return (
    <Section title="Add invoice" hint="Generated, seeded - same output every time">
      <div className="flex flex-col gap-2 rounded-xl bg-background-base p-2.5 shadow-button-gray">
        <div className="flex items-center gap-1.5">
          {(['contracts', 'fees'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn('h-7 rounded-md px-2 text-label-xs', tab === t ? 'bg-brand-muted text-brand-text' : 'text-text-muted hover:bg-background-highlight')}
            >
              {t === 'contracts' ? 'Contractor' : 'Niural fee'}
            </button>
          ))}
          <span className="h-4 w-px bg-border-muted" />
          <button
            type="button"
            onClick={() => setOverdue((o) => !o)}
            className={cn('h-7 rounded-md px-2 text-label-xs', overdue ? 'bg-background-error-highlight text-text-error-base' : 'text-text-muted hover:bg-background-highlight')}
          >
            {overdue ? 'Overdue' : 'Due soon'}
          </button>
          <span className="flex-1" />
          <Button type="button" size="sm" leftIcon={<Plus className="size-4" />} onClick={() => onAdd(tab === 'fees' ? feeCcy : ccy, tab, overdue)}>
            Add
          </Button>
        </div>
        {tab === 'contracts' ? (
          <div className="flex flex-wrap gap-1">
            {ADD_CCYS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCcy(c)}
                className={cn(
                  'flex h-7 items-center gap-1 rounded-md px-2 text-label-xs',
                  ccy === c ? 'bg-background-highlight text-text-primary shadow-border-brand' : 'text-text-muted hover:bg-background-highlight',
                )}
              >
                <CurrencyMark ccy={c} size="sm" />
                {c}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-caption text-text-muted">Billed in {feeCcy} - Niural fees follow the employer's currency config.</p>
        )}
      </div>
    </Section>
  )
}

