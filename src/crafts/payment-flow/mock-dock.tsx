import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
  CheckCircle,
  ClockClockwise,
  Coins,
  Flask,
  ArrowsInSimple,
  Database,
  DotsSixVertical,
  Plus,
  SlidersHorizontal,
} from '@phosphor-icons/react'
import { useEmployerConfig, useFlowData, useFlowStore } from './store'
import { ExperimentsPanel } from './experiments-panel'
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
 *
 * Draggable anywhere via the grip (double-click it to snap home). Home is
 * bottom-left, raised above the Bezel bar's lane in the Master App. The
 * panel opens toward whichever half of the screen has room.
 */

type Tab = string

/** Host-supplied panels beside Data / Time machine / Controls (Master App: Bezel). */
export interface MockDockTab {
  id: string
  label: string
  icon: typeof Database
  render: () => React.ReactNode
}

const TABS: Array<{ id: Tab; label: string; icon: typeof Database }> = [
  { id: 'data', label: 'Data', icon: Database },
  { id: 'time', label: 'Time machine', icon: ClockClockwise },
  { id: 'controls', label: 'Controls', icon: SlidersHorizontal },
  { id: 'experiments', label: 'Experiments', icon: Flask },
]

const ADD_CCYS: Array<Ccy> = ['USD', 'CAD', 'GBP', 'EUR', 'INR', 'PHP', 'NPR', 'USDC']

const MIN_KEY = 'nds-mock-dock:minimized'
const POS_KEY = 'nds-mock-dock:pos'
const EDGE = 12

type Pos = { x: number; y: number }

/**
 * Free placement inside the dock's container (the viewport when `fixed`,
 * the window when on a canvas). `pos` = top-left of the dock box in the
 * container's own (unzoomed) pixels; null = home. Pointer deltas are
 * divided by the container's render scale so dragging tracks the cursor
 * even inside a zoomed canvas window.
 */
function useDraggable(homeBottom: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const drag = useRef<{ px: number; py: number; start: Pos; scale: number } | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(POS_KEY)
      if (raw) setPos(JSON.parse(raw) as Pos)
    } catch {
      /* ignore */
    }
  }, [])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el)
    setSize({ w: el.offsetWidth, h: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  const clamp = (p: Pos): Pos => {
    const box = boxRef.current
    const bw = box?.offsetWidth ?? 0
    const bh = box?.offsetHeight ?? 0
    return {
      x: Math.min(Math.max(EDGE, p.x), Math.max(EDGE, size.w - bw - EDGE)),
      y: Math.min(Math.max(EDGE, p.y), Math.max(EDGE, size.h - bh - EDGE)),
    }
  }

  const save = (p: Pos | null) => {
    try {
      if (p) window.localStorage.setItem(POS_KEY, JSON.stringify(p))
      else window.localStorage.removeItem(POS_KEY)
    } catch {
      /* ignore */
    }
  }

  const gripProps = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      const container = containerRef.current
      const box = boxRef.current
      if (!container || !box) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      const scale = container.getBoundingClientRect().width / (container.offsetWidth || 1) || 1
      drag.current = { px: e.clientX, py: e.clientY, start: { x: box.offsetLeft, y: box.offsetTop }, scale }
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d) return
      setPos(clamp({ x: d.start.x + (e.clientX - d.px) / d.scale, y: d.start.y + (e.clientY - d.py) / d.scale }))
    },
    onPointerUp: () => {
      if (!drag.current) return
      drag.current = null
      setPos((p) => {
        save(p)
        return p
      })
    },
    onDoubleClick: () => {
      setPos(null)
      save(null)
    },
  }

  const placed = pos ? clamp(pos) : null
  const style: React.CSSProperties = placed ? { left: placed.x, top: placed.y } : { left: EDGE + 4, bottom: homeBottom }
  // Which half the dock sits in decides where the panel opens.
  const upper = placed ? placed.y + (boxRef.current?.offsetHeight ?? 0) / 2 < size.h / 2 : false
  const right = placed ? placed.x + (boxRef.current?.offsetWidth ?? 0) / 2 > size.w / 2 : false
  return { containerRef, boxRef, style, upper, right, gripProps }
}

export function MockDock({
  fixed,
  leading,
  extraTabs = [],
}: {
  fixed?: boolean
  /** Host-specific controls at the start of the pill (Master App: Go to). */
  leading?: React.ReactNode
  extraTabs?: Array<MockDockTab>
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
  // Master App (fixed): home sits above the Bezel bar's bottom-centre lane.
  const dragger = useDraggable(fixed ? 80 : EDGE)

  return (
    <div ref={dragger.containerRef} className={cn('pointer-events-none inset-0 z-40', fixed ? 'fixed' : 'absolute')}>
    <div
      ref={dragger.boxRef}
      style={dragger.style}
      className={cn(
        'absolute flex gap-2',
        dragger.upper ? 'flex-col-reverse' : 'flex-col',
        dragger.right ? 'items-end' : 'items-start',
      )}
    >
      {open && !minimized && (
        <div className="pointer-events-auto w-[600px] overflow-hidden rounded-2xl bg-surface-page flyout">
          <div className="flex items-center gap-1 border-b border-base p-1.5">
            {[...TABS, ...extraTabs].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-label-xsmall transition-colors',
                  tab === t.id ? 'bg-base text-primary borders-base' : 'text-muted hover:text-primary',
                )}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {extraTabs.find((t) => t.id === tab)?.render()}
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
                          data.dataset === d.id ? 'bg-base borders-shadow' : 'bg-base borders-base hover:card-hover',
                        )}
                      >
                        <span className="text-label-xsmall text-primary">{d.label}</span>
                        <span className="line-clamp-1 text-caption-sm text-muted">{d.hint}</span>
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
                    <p className="text-caption-sm text-muted">Today in the prototype</p>
                    <p className="text-title-h4 text-primary">{fmtDate(data.today)}</p>
                    <p className="text-caption-sm text-muted">
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
                      className="h-9 rounded-lg bg-base text-label-xsmall text-primary borders-base hover:bg-highlight"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-paragraph-xsmall text-muted">
                  Overdue days recalculate everywhere. Moving forward settles payments: wallet and crypto after 1 day, ACH after 3. Wire and local transfers wait for admin.
                </p>
              </div>
            )}

            {tab === 'experiments' && <ExperimentsPanel flash={flash} />}

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
                          'flex h-9 items-center justify-center gap-1.5 rounded-lg bg-base text-label-xsmall text-primary',
                          local === l ? 'borders-shadow' : 'borders-base hover:bg-highlight',
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
                        <div key={w.id} className="flex items-center gap-2 rounded-lg bg-base px-2.5 py-1.5 borders-base">
                          <CurrencyMark ccy={w.ccy} size="sm" />
                          <span className="w-24 truncate text-label-xsmall text-primary">{w.network ? `${w.ccy} · ${w.network}` : w.ccy}</span>
                          <Money className="flex-1 text-paragraph-xsmall text-primary">{fmt(w.available, w.ccy)}</Money>
                          {w.pending > 0 && <Money className="text-paragraph-xsmall text-muted">+{fmt(w.pending, w.ccy)} pending</Money>}
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
                              className="h-6 rounded-md px-1.5 text-label-xsmall text-muted hover:bg-highlight hover:text-primary"
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
                      store.reset(data.local, { dataset: 'realistic', today: WORLD_TODAY, full: true })
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
        <div className="pointer-events-none rounded-full bg-(--text-base) px-3 py-1.5 text-label-xsmall text-(--background-base) flyout">{note}</div>
      )}

      {minimized ? (
        /* minimized: a small handle - click to bring the dock back */
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-(--text-base) pl-1 text-(--background-base) flyout">
        <DragGrip gripProps={dragger.gripProps} />
        <button
          type="button"
          aria-label="Expand mock data dock"
          title="Mock data dock"
          onClick={() => setMinimized(false)}
          className="flex h-6 items-center gap-1 rounded-full pr-2.5 pl-1 transition-[height] hover:h-7"
        >
          <span className="h-1 w-8 rounded-full bg-(--text-muted)" />
          <CaretUp className="size-3" />
        </button>
        </div>
      ) : (
        /* pill - inverted surface so it never reads as product UI */
        <div className="pointer-events-auto flex h-10 items-center gap-1 rounded-full bg-(--text-base) p-1 text-label-xsmall text-(--background-base) flyout">
          <DragGrip gripProps={dragger.gripProps} />
          {leading && (
            <>
              {leading}
              <span className="h-4 w-px bg-(--elevation-alpha-24)" />
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            title="Mock data, time machine, controls and experiments"
            className="flex h-8 items-center gap-3 rounded-full pr-1.5 pl-2.5 hover:bg-(--elevation-alpha-12)"
          >
            <span className="flex items-center gap-1.5">
              <Database className="size-4" />
              {DATASETS.find((d) => d.id === data.dataset)?.label} · {open_.length}
            </span>
            <span className="h-4 w-px bg-(--elevation-alpha-24)" />
            <span className="flex items-center gap-1.5">
              <ClockClockwise className="size-4" />
              {fmtDate(data.today)}
              {offset !== 0 && <span className="text-muted">({offset > 0 ? '+' : ''}{offset}d)</span>}
            </span>
            <span className="h-4 w-px bg-(--elevation-alpha-24)" />
            <span className="flex items-center gap-1.5">
              <span aria-hidden>{data.local ? CCY_FLAG[data.local] : CCY_FLAG.USD}</span>
              {data.local ? `USD + ${data.local}` : 'USD only'}
            </span>
            <span className="h-4 w-px bg-(--elevation-alpha-24)" />
            <span className={cn('flex items-center gap-1.5', !data.flags.credits && 'text-muted')}>
              <Coins className="size-4" />
              {data.flags.credits ? fmt(data.credit.balance, 'USD') : 'Credits off'}
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-(--elevation-alpha-16)">
              {open ? <CaretDown className="size-3.5" /> : <CaretUp className="size-3.5" />}
            </span>
          </button>
          <button
            type="button"
            aria-label="Minimize dock"
            title="Minimize dock"
            onClick={() => setMinimized(true)}
            className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-(--elevation-alpha-12) hover:text-(--background-base)"
          >
            <ArrowsInSimple className="size-4" />
          </button>
        </div>
      )}
    </div>
    </div>
  )
}

function DragGrip({ gripProps }: { gripProps: ReturnType<typeof useDraggable>['gripProps'] }) {
  return (
    <span
      {...gripProps}
      role="button"
      tabIndex={-1}
      aria-label="Drag to move the dock"
      title="Drag to move · double-click to reset"
      className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted hover:text-(--background-base) active:cursor-grabbing"
    >
      <DotsSixVertical weight="bold" className="size-4" />
    </span>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label-small text-primary">{title}</p>
        {hint && <p className="text-caption-sm text-muted">{hint}</p>}
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
      <div className="flex flex-col gap-2 rounded-xl bg-base p-2.5 borders-base">
        <div className="flex items-center gap-1.5">
          {(['contracts', 'fees'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn('h-7 rounded-md px-2 text-label-xsmall', tab === t ? 'bg-brand-muted text-brand' : 'text-muted hover:bg-highlight')}
            >
              {t === 'contracts' ? 'Contractor' : 'Niural fee'}
            </button>
          ))}
          <span className="h-4 w-px bg-(--border-muted)" />
          <button
            type="button"
            onClick={() => setOverdue((o) => !o)}
            className={cn('h-7 rounded-md px-2 text-label-xsmall', overdue ? 'bg-error-highlight text-error' : 'text-muted hover:bg-highlight')}
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
                  'flex h-7 items-center gap-1 rounded-md px-2 text-label-xsmall',
                  ccy === c ? 'bg-highlight text-primary borders-shadow' : 'text-muted hover:bg-highlight',
                )}
              >
                <CurrencyMark ccy={c} size="sm" />
                {c}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-caption-sm text-muted">Billed in {feeCcy} - Niural fees follow the employer's currency config.</p>
        )}
      </div>
    </Section>
  )
}

