import type { Balances, FundingMode, LedgerEntry, LedgerKey, PresetKey } from './types'

/**
 * Pricing, funding, and ledger math - ported near-verbatim from the
 * workbench's `P` engine (the tier table, `price()`, `fund()`, the 18
 * balance presets) rather than re-derived, since that's where the PRD's
 * discount/threshold arithmetic was already worked out and checked.
 */

export const MIN_PURCHASE = 250
export const MAX_PURCHASE = 5000
/** Tokens a payroll run costs - the number every "about N runs left" and
 *  "you need ~100 tokens" line is computed from. */
export const RUN_COST = 100

export interface Tier {
  threshold: number
  discountPct: number
}

export const TIERS: Array<Tier> = [
  { threshold: 250, discountPct: 0 },
  { threshold: 750, discountPct: 5 },
  { threshold: 1250, discountPct: 8 },
  { threshold: 3000, discountPct: 15 },
  { threshold: 5000, discountPct: 20 },
]

export function discountFor(tokens: number): number {
  let d = 0
  for (const t of TIERS) if (tokens >= t.threshold) d = t.discountPct
  return d
}

/** $1 = 10 tokens (R = 10 in the admin's pricing config, out of scope here
 *  but this is the customer-facing result of it). */
export function priceFor(tokens: number): { base: number; discountPct: number; total: number } {
  const base = tokens / 10
  const discountPct = discountFor(tokens)
  return { base, discountPct, total: base * (1 - discountPct / 100) }
}

export function perTokenRate(tokens: number): number {
  return priceFor(tokens).total / tokens
}

export function nextTier(tokens: number): Tier | null {
  for (const t of TIERS) if (t.threshold > tokens) return t
  return null
}

export interface FundBreakdown {
  credit: number
  wallet: number
  /** What's left to add via ACH/wire once credit + wallet are exhausted. */
  add: number
  total: number
}

/** v1: credit first, then wallet, then whatever's left needs funding.
 *  p1 (deferred, "not committed to v1"): a single user-picked source, no
 *  fallback to the others even if they'd cover it. */
export function fundPurchase(
  balances: Balances,
  qty: number,
  mode: FundingMode,
  src: 'credit' | 'wallet' | 'fund',
): FundBreakdown {
  const { total } = priceFor(qty)
  if (mode === 'v1') {
    const credit = Math.min(balances.credit, total)
    const wallet = Math.min(balances.wallet, total - credit)
    const add = Math.max(total - credit - wallet, 0)
    return { credit, wallet, add, total }
  }
  if (src === 'credit') {
    const credit = Math.min(balances.credit, total)
    return { credit, wallet: 0, add: Math.max(total - credit, 0), total }
  }
  if (src === 'wallet') {
    const wallet = Math.min(balances.wallet, total)
    return { credit: 0, wallet, add: Math.max(total - wallet, 0), total }
  }
  return { credit: 0, wallet: 0, add: total, total }
}

/** True once any part of the purchase needs settlement (ACH/wire) rather
 *  than clearing instantly from credit/wallet. */
export function isPending(mode: FundingMode, src: string, breakdown: FundBreakdown): boolean {
  return mode === 'v1' ? breakdown.add > 0 : src === 'fund'
}

export type AutoReloadState = 'ok' | 'off' | 'risk'

export function autoReloadState(balances: Balances): AutoReloadState {
  if (!balances.autoOn) return 'off'
  const topupCost = priceFor(balances.arAmt).total
  return balances.credit + balances.wallet >= topupCost ? 'ok' : 'risk'
}

export function isBlocked(balances: Balances): boolean {
  return balances.tokens < RUN_COST && balances.load === 'ok' && balances.preset !== 'freeExhausted'
}

export const WIRE_DETAILS: Array<[label: string, value: string]> = [
  ['Account name', 'Niural Inc.'],
  ['Account number', '529300660'],
  ['Routing number', '021000021'],
  ['Bank name', 'JP Morgan Chase Bank, N.A.'],
  ['Swift code', 'CHASU33'],
  ['Wire type', 'Standard wire'],
]

export const WIRE_REFERENCE = 'NIU-TKN-4821'

/* ---------------- ledgers ---------------- */

export const LEDGERS: Record<LedgerKey, Array<LedgerEntry>> = {
  base: [
    { date: 'Jul 27', title: 'Payroll run', sub: 'Emma task', amount: -104, unit: 'tok', balance: 1240 },
    { date: 'Jul 26', title: 'Offer letters · 3', sub: 'Emma task', amount: -9, unit: 'tok', balance: 1344 },
    {
      date: 'Jul 24',
      title: 'Auto-reload purchase',
      sub: 'Paid with credit · $50.00',
      amount: 500,
      unit: 'tok',
      balance: 1353,
    },
    {
      date: 'Jul 20',
      title: 'Credit applied',
      sub: 'Niural fee · July invoice',
      amount: -180,
      unit: 'usd',
      balance: 470,
    },
    {
      date: 'Jul 12',
      title: 'Promotional credit',
      sub: 'Granted by Niural',
      amount: 600,
      unit: 'usd',
      balance: 650,
    },
  ],
  adjust: [
    { date: 'Jul 27', title: 'Payroll run', sub: 'Emma task', amount: -104, unit: 'tok', balance: 1240, key: 'us-adjust' },
    {
      date: 'Jul 26',
      title: 'Cost adjustment',
      sub: "Payroll run of Jul 25 · our provider billed us late, so this run was estimated at 98 tokens and actually cost 103",
      amount: -5,
      unit: 'tok',
      balance: 1344,
      key: 'us-adjust',
      flag: 'adjustment',
    },
    { date: 'Jul 25', title: 'Payroll run', sub: 'Emma task · estimated', amount: -98, unit: 'tok', balance: 1349 },
    {
      date: 'Jul 24',
      title: 'Auto-reload purchase',
      sub: 'Paid with credit · $50.00',
      amount: 500,
      unit: 'tok',
      balance: 1447,
    },
  ],
  multi: [
    {
      date: 'Jul 24',
      title: 'Auto-reload purchase',
      sub: 'Paid with credit · $60.00 · transaction AR-9F21',
      amount: 600,
      unit: 'tok',
      balance: 1240,
      key: 'tk-multi',
      flag: 'AR-9F21',
    },
    {
      date: 'Jul 24',
      title: 'Auto-reload purchase',
      sub: 'Paid with wallet · $40.00 · transaction AR-9F21',
      amount: 400,
      unit: 'tok',
      balance: 640,
      key: 'tk-multi',
      flag: 'AR-9F21',
    },
    {
      date: 'Jul 24',
      title: 'Balance hit 50 tokens',
      sub: 'Auto-reload triggered once for this crossing',
      amount: 0,
      unit: 'note',
      balance: 240,
    },
    { date: 'Jul 22', title: 'Payroll run', sub: 'Emma task', amount: -104, unit: 'tok', balance: 240 },
  ],
  freetier: [
    {
      date: 'Jul 01',
      title: 'Monthly free tokens',
      sub: 'Free tier · 5 tokens every month',
      amount: 5,
      unit: 'tok',
      balance: 100,
      key: 'tk-grant',
    },
    {
      date: 'Jun 28',
      title: 'Welcome tokens',
      sub: 'Free tier · one-time grant on signup',
      amount: 100,
      unit: 'tok',
      balance: 95,
      key: 'tk-grant',
    },
  ],
  exhausted: [
    { date: 'Jul 27', title: 'Expense review · 40 receipts', sub: 'Emma task', amount: -41, unit: 'tok', balance: 0 },
    { date: 'Jul 26', title: 'Offer letters · 12', sub: 'Emma task', amount: -36, unit: 'tok', balance: 41 },
    { date: 'Jul 01', title: 'Monthly free tokens', sub: 'Free tier', amount: 5, unit: 'tok', balance: 77, key: 'tk-grant' },
    {
      date: 'Jun 28',
      title: 'Welcome tokens',
      sub: 'Free tier · one-time grant',
      amount: 100,
      unit: 'tok',
      balance: 72,
      key: 'tk-grant',
    },
  ],
  empty: [],
  /** Same token activity as `base`, minus the two credit rows - for
   *  employers who buy tokens from their wallet alone because they've
   *  never had credit (creditEver: 0). Keeps the Tokens page's purchase
   *  history real without implying a credit history that doesn't exist. */
  tokenonly: [
    { date: 'Jul 27', title: 'Payroll run', sub: 'Emma task', amount: -104, unit: 'tok', balance: 640 },
    { date: 'Jul 26', title: 'Offer letters · 3', sub: 'Emma task', amount: -9, unit: 'tok', balance: 744 },
    {
      date: 'Jul 24',
      title: 'Wallet purchase',
      sub: 'Paid with wallet · $50.00',
      amount: 500,
      unit: 'tok',
      balance: 753,
    },
  ],
  huge: [
    {
      date: 'Jul 27',
      title: 'Payroll run · 1,840 employees',
      sub: 'Emma task',
      amount: -2480,
      unit: 'tok',
      balance: 148220,
    },
    {
      date: 'Jul 26',
      title: 'Token purchase',
      sub: 'Credit $12,500.00 + wallet $7,500.00 · 20% volume discount',
      amount: 200000,
      unit: 'tok',
      balance: 150700,
    },
    {
      date: 'Jul 20',
      title: 'Credit applied',
      sub: 'Niural fee · July invoice',
      amount: -14800,
      unit: 'usd',
      balance: 125400,
    },
  ],
}

/* ---------------- presets ---------------- */

const BASE: Omit<Balances, 'preset'> = {
  tokens: 1240,
  credit: 420,
  creditEver: 1850,
  wallet: 28043.34,
  autoOn: true,
  arTh: 50,
  arAmt: 500,
  ledger: 'base',
  load: 'ok',
  mid: false,
  pendingWallet: 0,
}

export const PRESETS: Record<PresetKey, Balances> = {
  healthy: { ...BASE, preset: 'healthy' },
  low: { ...BASE, preset: 'low', tokens: 180, credit: 12.4 },
  split: { ...BASE, preset: 'split', tokens: 640, credit: 60 },
  zero: { ...BASE, preset: 'zero', tokens: 0, credit: 0, wallet: 8.2 },
  zeroOff: { ...BASE, preset: 'zeroOff', tokens: 0, credit: 0, wallet: 8.2, autoOn: false },
  zeroMid: { ...BASE, preset: 'zeroMid', tokens: 0, credit: 0, wallet: 8.2, mid: true },
  zeroResume: { ...BASE, preset: 'zeroResume', tokens: 0, mid: true },
  nocredit: { ...BASE, preset: 'nocredit', tokens: 640, credit: 0, autoOn: false, creditEver: 0, ledger: 'tokenonly' },
  freetier: {
    ...BASE,
    preset: 'freetier',
    tokens: 100,
    credit: 0,
    wallet: 0,
    autoOn: false,
    creditEver: 0,
    ledger: 'freetier',
  },
  freeExhausted: {
    ...BASE,
    preset: 'freeExhausted',
    tokens: 0,
    credit: 0,
    wallet: 0,
    autoOn: false,
    creditEver: 0,
    ledger: 'exhausted',
  },
  empty: { ...BASE, preset: 'empty', tokens: 0, credit: 0, wallet: 0, autoOn: false, creditEver: 0, ledger: 'empty' },
  loading: { ...BASE, preset: 'loading', load: 'loading' },
  error: { ...BASE, preset: 'error', load: 'error', ledger: 'empty' },
  huge: { ...BASE, preset: 'huge', tokens: 148220, credit: 125400, wallet: 842900.5, ledger: 'huge' },
  adjust: { ...BASE, preset: 'adjust', ledger: 'adjust' },
  multi: { ...BASE, preset: 'multi', credit: 0, ledger: 'multi' },
  pendingach: { ...BASE, preset: 'pendingach', tokens: 640, credit: 0, wallet: 8.2, pendingWallet: 400 },
  creditused: { ...BASE, preset: 'creditused', tokens: 640, credit: 0 },
}

export function preset(key: PresetKey): Balances {
  return PRESETS[key]
}

/* ---------------- formatting ---------------- */

export function usd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function num(n: number): string {
  return n.toLocaleString('en-US')
}

export function runsLeft(tokens: number): number {
  return Math.floor(tokens / RUN_COST)
}
