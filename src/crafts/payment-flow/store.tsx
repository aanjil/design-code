import { createContext, useContext, useSyncExternalStore } from 'react'
import { fmtRate, makeReference, round2 } from './engine'
import type { CreditSettings, MethodOption, Quote } from './engine'
import {
  EMPLOYER,
  OTHER_FUNDING_REQUESTS,
  WORLD_TODAY,
  addDays,
  generateInvoice,
  seedInvoices,
  seedTransactions,
  seedWallets,
} from '@/mocks/payment-flow'
import type {
  Ccy,
  Dataset,
  EmployerLocal,
  FundingRequest,
  Invoice,
  LocalCcy,
  WalletSeed,
  WalletTx,
} from '@/mocks/payment-flow'

/**
 * Data layer for one "world": invoices, wallet balances, transactions and
 * the admin funding queue. The live App + live Admin windows share ONE
 * store (fund in the app → approve in admin → balance moves from Pending
 * to Available). Every catalog frame gets its own throwaway store seeded
 * for its scenario, so states never leak between frames.
 */

/**
 * Prototype switches (dock → Experiments). Credits and the right-side
 * payment summary are experiments: either can be turned off to compare
 * against today's flow. The rest answer open questions live.
 */
export interface Flags {
  /** Experiment: credits on the payment screen (P4-P6). */
  credits: boolean
  /** Open: USD credit pays local fees (converted) - off = USD invoices only. */
  creditCrossCcy: boolean
  /** Open: credit starts applied. Off by default until PM confirms. */
  creditDefaultOn: boolean
  /** Experiment: payment summary breakdown card in the right column. */
  summaryPanel: boolean
  /** P2 on hold: Pay by bank transfer (v1.1) for local invoices. */
  localTransfer: boolean
  /** P6: the next Confirm fails atomically (one shot). */
  failNextPayment: boolean
}

export const DEFAULT_FLAGS: Flags = {
  credits: true,
  creditCrossCcy: true,
  creditDefaultOn: false,
  summaryPanel: true,
  localTransfer: false,
  failNextPayment: false,
}

export const DEFAULT_CREDIT: CreditSettings = { balance: 2_000, expiresOn: null }
export const CREDIT_EXPIRY = '2026-12-31'

/** Append-only credit ledger (Credits PRD P0-1, P0-5, P0-8). */
export interface CreditEntry {
  id: string
  type: 'grant' | 'system-usage' | 'admin-deduct' | 'restore'
  /** Signed USD. */
  amount: number
  /** Resulting balance. */
  balance: number
  note: string
  invoiceRef?: string
  target?: 'Niural fee'
  rate?: string
  at: string
}

export interface FlowData {
  local: EmployerLocal
  /** Time machine date - drives overdue days, timestamps, settlement. */
  today: string
  dataset: Dataset
  invoices: Array<Invoice>
  wallets: Array<WalletSeed>
  txs: Array<WalletTx>
  requests: Array<FundingRequest>
  seq: number
  flags: Flags
  credit: CreditSettings
  creditLedger: Array<CreditEntry>
}

export type PayResult = {
  ids: Array<string>
  /** Single-method payments; null = credit only or split by currency. */
  option: MethodOption | null
  /** What was debited, one entry per wallet / method. */
  legs: Array<{ option: MethodOption; amount: number; ccy: Ccy }>
  total: number
  ccy: Ccy
  /** USD credit drawn. */
  creditUsd: number
  reference?: string
}

export type PayOutcome = { ok: true; result: PayResult } | { ok: false }

export interface FlowStore {
  get: () => FlowData
  subscribe: (fn: () => void) => () => void
  /** Re-seed; keeps the current dataset + date unless overridden. */
  reset: (local: EmployerLocal, opts?: { dataset?: Dataset; today?: string; full?: boolean }) => void
  /** Time machine: moves today, settles processing invoices whose date passed. */
  travel: (today: string) => number
  setBalance: (walletId: string, available: number) => void
  addInvoice: (opts: { ccy?: Ccy; tab: 'contracts' | 'fees'; overdue?: boolean }) => Invoice
  approveAllPending: () => number
  mutate: (fn: (d: FlowData) => void) => void
  /** Atomic (P6): credit drawdown + wallet debit commit together or not at all. */
  pay: (ids: Array<string>, option: MethodOption | null, q: Quote) => PayOutcome
  fund: (input: { ccy: 'USD' | LocalCcy; amount: number; fee: number; method: string; memo?: string }) => FundingRequest
  approve: (id: string) => void
  reject: (id: string) => void
}

export function seedData(local: EmployerLocal, dataset: Dataset = 'realistic', today: string = WORLD_TODAY): FlowData {
  return {
    local,
    today,
    dataset,
    invoices: seedInvoices(local, dataset, today),
    wallets: seedWallets(local),
    txs: seedTransactions(local),
    requests: OTHER_FUNDING_REQUESTS.map((r) => ({ ...r })),
    seq: 1,
    flags: { ...DEFAULT_FLAGS },
    credit: { ...DEFAULT_CREDIT },
    creditLedger: [
      {
        id: 'cl-1',
        type: 'grant',
        amount: DEFAULT_CREDIT.balance,
        balance: DEFAULT_CREDIT.balance,
        note: 'Goodwill credit',
        at: '2026-10-01T09:00:00Z',
      },
    ],
  }
}

const nowOf = (d: FlowData) => `${d.today}T15:15:00Z`

/** Display invoice number - "INV-F03" from "inv-f03". */
export const invoiceRef = (id: string) => id.toUpperCase()

function settle(d: FlowData): number {
  let n = 0
  for (const inv of d.invoices) {
    if (inv.status === 'processing' && inv.settleOn && inv.settleOn <= d.today) {
      inv.status = 'paid'
      inv.paidOn = inv.settleOn
      n += 1
    }
  }
  return n
}

/**
 * `persistKey` makes a store durable + real time: saved to localStorage on
 * every change and re-read whenever another tab writes it (storage event).
 * The craft canvas's live App/Admin and the Master App all share one
 * persisted store, so a change in any of them shows up in the others.
 * Loaded lazily on first subscribe so SSR + hydration see the seed.
 */
const PERSIST_VERSION = 3

export function createFlowStore(
  local: EmployerLocal,
  prepare?: (d: FlowData) => void,
  persistKey?: string,
): FlowStore {
  let data = seedData(local)
  prepare?.(data)
  const subs = new Set<() => void>()
  let hydrated = !persistKey
  const save = () => {
    if (!persistKey || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(persistKey, JSON.stringify({ v: PERSIST_VERSION, data }))
    } catch {
      /* quota / blocked */
    }
  }
  const load = (raw: string | null) => {
    try {
      const parsed = raw ? (JSON.parse(raw) as { v: number; data: FlowData }) : null
      if (parsed?.v === PERSIST_VERSION && parsed.data.today) {
        data = parsed.data
        return true
      }
    } catch {
      /* corrupt - keep current */
    }
    return false
  }
  const emit = () => {
    save()
    subs.forEach((fn) => fn())
  }
  const mutate = (fn: (d: FlowData) => void) => {
    const next = structuredClone(data)
    fn(next)
    data = next
    emit()
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key !== persistKey) return
    if (load(e.newValue)) subs.forEach((fn) => fn())
  }

  const store: FlowStore = {
    get: () => data,
    subscribe: (fn) => {
      if (!hydrated && typeof window !== 'undefined') {
        hydrated = true
        load(window.localStorage.getItem(persistKey!))
        window.addEventListener('storage', onStorage)
      }
      subs.add(fn)
      return () => subs.delete(fn)
    },
    // Keeps the prototype switches + credit balance - only Reset all clears them.
    reset: (nextLocal, opts = {}) => {
      const keep = { flags: data.flags, credit: data.credit, creditLedger: data.creditLedger }
      data = { ...seedData(nextLocal, opts.dataset ?? data.dataset, opts.today ?? data.today), ...(opts.full ? {} : keep) }
      emit()
    },
    travel: (today) => {
      let settled = 0
      mutate((d) => {
        d.today = today
        settled = settle(d)
      })
      return settled
    },
    setBalance: (walletId, available) =>
      mutate((d) => {
        const w = d.wallets.find((x) => x.id === walletId)
        if (w) w.available = round2(Math.max(0, available))
      }),
    addInvoice: ({ ccy, tab, overdue }) => {
      const seed = 5_000 + data.seq * 13 + data.invoices.length
      const base = generateInvoice(seed, data.today, { ccy, dueIn: overdue ? -12 : 9 })
      const inv: Invoice =
        tab === 'fees'
          ? {
              ...base,
              tab: 'fees',
              kind: 'niural-pay',
              person: undefined,
              role: undefined,
              name: 'Niural Pay Invoice',
              description: 'Niural Pay - ad hoc',
              ccy: ccy ?? data.local ?? 'USD',
              lines: [{ label: 'Niural Pay Invoice', amount: base.lines[0].amount }],
            }
          : base
      mutate((d) => {
        d.seq += 1
        d.invoices.push(inv)
      })
      return inv
    },
    approveAllPending: () => {
      const ids = data.requests.filter((r) => r.status === 'pending' && r.employer === EMPLOYER.name).map((r) => r.id)
      for (const id of ids) store.approve(id)
      return ids.length
    },
    mutate,
    pay: (ids, option, q) => {
      if (data.flags.failNextPayment) {
        // All or nothing: one shot failure, no credit drawn, no wallet debited.
        mutate((d) => {
          d.flags.failNextPayment = false
        })
        return { ok: false }
      }
      // Server-side re-validation stand-in: never commit an invalid plan.
      if (q.plan?.invalid) return { ok: false }
      const awaiting = option?.group === 'wire' || option?.group === 'local-transfer'
      const reference = awaiting ? makeReference(data.seq + ids.length * 7) : undefined
      const creditUsd = q.plan?.used ?? 0
      mutate((d) => {
        d.seq += 1
        const settleDays = option?.group === 'bank' ? 3 : 1
        for (const inv of d.invoices) {
          if (!ids.includes(inv.id)) continue
          inv.status = awaiting ? 'awaiting-transfer' : 'processing'
          if (!awaiting) inv.settleOn = addDays(d.today, settleDays)
        }
        for (const share of q.plan?.shares ?? []) {
          if (share.applied <= 0) continue
          const inv = d.invoices.find((i) => i.id === share.invoiceId)
          d.credit.balance = round2(Math.max(0, d.credit.balance - share.usd))
          d.creditLedger.unshift({
            id: `cl-${d.seq}-${share.invoiceId}`,
            type: 'system-usage',
            amount: -share.usd,
            balance: d.credit.balance,
            note: `Applied to Niural fee · ${invoiceRef(share.invoiceId)}`,
            invoiceRef: inv ? `${invoiceRef(inv.id)} · ${inv.name}` : invoiceRef(share.invoiceId),
            target: 'Niural fee',
            rate: share.ccy === 'USD' ? undefined : `1 USD = ${fmtRate(share.rate)} ${share.ccy}`,
            at: nowOf(d),
          })
        }
        for (const leg of q.legs) {
          const w = leg.option.wallet && d.wallets.find((x) => x.id === leg.option.wallet?.id)
          if (!w) continue
          w.available = round2(w.available - leg.amount)
          d.txs.unshift({
            id: `tx-${d.seq}-${w.ccy}`,
            type: 'Invoice payment',
            description: ids.length === 1 ? `Invoice payment · ${d.invoices.find((i) => i.id === ids[0])?.name}` : `Invoice payment · ${ids.length} invoices`,
            status: 'completed',
            ccy: w.ccy,
            amount: -leg.amount,
            at: nowOf(d),
          })
        }
      })
      const legs = q.legs.map((l) => ({ option: l.option, amount: l.amount, ccy: l.ccy }))
      return {
        ok: true,
        result: { ids, option: q.split || q.legs.length === 0 ? null : option, legs, total: q.total, ccy: q.ccy, creditUsd, reference },
      }
    },
    fund: ({ ccy, amount, fee, method, memo }) => {
      const req: FundingRequest = {
        id: `fr-${100 + data.seq}`,
        employer: EMPLOYER.name,
        reference: makeReference(data.seq * 31 + Math.round(amount)),
        ccy,
        method,
        amount,
        fee,
        status: 'pending',
        createdAt: nowOf(data),
        memo,
      }
      mutate((d) => {
        d.seq += 1
        d.requests.unshift(req)
        const w = d.wallets.find((x) => x.ccy === ccy && !x.network)
        if (w) w.pending = round2(w.pending + amount)
        d.txs.unshift({
          id: `tx-${req.id}`,
          type: 'Top-up',
          description: `${method} top-up · ${req.reference}`,
          status: 'pending',
          ccy,
          amount,
          at: nowOf(d),
        })
      })
      return req
    },
    approve: (id) =>
      mutate((d) => {
        const req = d.requests.find((r) => r.id === id)
        if (!req || req.status !== 'pending') return
        req.status = 'approved'
        if (req.employer !== EMPLOYER.name) return
        const w = d.wallets.find((x) => x.ccy === req.ccy && !x.network)
        if (w) {
          w.pending = round2(Math.max(0, w.pending - req.amount))
          w.available = round2(w.available + req.amount)
        }
        const tx = d.txs.find((t) => t.id === `tx-${req.id}`)
        if (tx) tx.status = 'completed'
      }),
    reject: (id) =>
      mutate((d) => {
        const req = d.requests.find((r) => r.id === id)
        if (!req || req.status !== 'pending') return
        req.status = 'rejected'
        if (req.employer !== EMPLOYER.name) return
        const w = d.wallets.find((x) => x.ccy === req.ccy && !x.network)
        if (w) w.pending = round2(Math.max(0, w.pending - req.amount))
        d.txs = d.txs.filter((t) => t.id !== `tx-${req.id}`)
      }),
  }
  return store
}

/* ---------------- React wiring ---------------- */

const StoreContext = createContext<FlowStore | null>(null)
export const StoreProvider = StoreContext.Provider

export function useFlowStore(): FlowStore {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useFlowStore must be used inside <StoreProvider>')
  return s
}

export function useFlowData(): FlowData {
  const s = useFlowStore()
  return useSyncExternalStore(s.subscribe, s.get, s.get)
}

/** The shared live world (App + Admin windows). */
export const liveStore = createFlowStore('CAD', undefined, 'nds-live:payment-flow')

/* ---------------- employer config (craft-wide switcher) ---------------- */

export const EmployerConfigContext = createContext<{
  local: EmployerLocal
  setLocal: (l: EmployerLocal) => void
}>({ local: 'CAD', setLocal: () => {} })

export function useEmployerConfig() {
  return useContext(EmployerConfigContext)
}

/** Employer config backed by the live store itself - switching currencies
 *  re-seeds the shared world (keeping dataset + time machine date). */
export function LiveEmployerConfig({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(liveStore.subscribe, liveStore.get, liveStore.get)
  return (
    <EmployerConfigContext.Provider value={{ local: data.local, setLocal: (l) => liveStore.reset(l) }}>
      {children}
    </EmployerConfigContext.Provider>
  )
}
