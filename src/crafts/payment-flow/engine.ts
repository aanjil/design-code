import {
  BANK_ACCOUNTS,
  CCY_NAME,
  CRYPTO_NETWORK_FEE,
  LOCAL_RAIL,
  fmt,
  USD_PER,
  USD_WIRE_FEE,
} from '@/mocks/payment-flow'
import type { Ccy, EmployerLocal, Invoice, InvoiceLine, LocalCcy, WalletSeed } from '@/mocks/payment-flow'

/**
 * Payment math - pure, no React. One method pays the whole batch ("convert
 * all"): every invoice converts into the method's currency at the mock
 * mid-market rate, fees are added on top, and Available balance (never
 * Pending - PRD F4.2) is compared to the total.
 */

export const round2 = (n: number) => Math.round(n * 100) / 100

export function rate(from: Ccy, to: Ccy): number {
  return USD_PER[from] / USD_PER[to]
}

export function convert(amount: number, from: Ccy, to: Ccy): number {
  return from === to ? amount : round2(amount * rate(from, to))
}

export function invoiceTotal(inv: Invoice): number {
  return round2(inv.lines.reduce((s, l) => s + l.amount, 0))
}

/* ---------------- methods ---------------- */

export type MethodGroup = 'wallet' | 'bank' | 'crypto' | 'wire' | 'local-transfer'

export interface MethodOption {
  id: string
  group: MethodGroup
  label: string
  /** Secondary label, e.g. network "(Ethereum)". */
  sub?: string
  /** Currency the batch is paid in. */
  ccy: Ccy
  fee: number
  feeLabel?: string
  /** Wallet options only. */
  wallet?: WalletSeed
  bankLast4?: string
  primary?: boolean
}

export const GROUP_LABEL: Record<MethodGroup, string> = {
  wallet: 'Niural wallet',
  bank: 'Bank transfer',
  crypto: 'Crypto wallet',
  wire: 'Wire transfer',
  'local-transfer': 'Bank transfer',
}

/**
 * Local mode (PRD F4.1 "wallet and fund transfer only"): every selected
 * invoice is billed in the employer's local currency. Connected bank
 * accounts, crypto and USD wire are hidden; the local rail
 * (Wire CAD / Faster Payments GBP / SEPA EUR) is added instead.
 */
export function isLocalMode(invoices: Array<Invoice>, local: EmployerLocal): local is LocalCcy {
  return !!local && invoices.length > 0 && invoices.every((i) => i.ccy === local)
}

export function walletOption(w: WalletSeed): MethodOption {
  return {
    id: w.id,
    group: 'wallet',
    label: w.network ? w.ccy : CCY_NAME[w.ccy],
    sub: w.network,
    ccy: w.ccy,
    fee: 0,
    wallet: w,
    primary: w.primary,
  }
}

/**
 * Local invoices (P2): Niural wallets only - USD plus enabled local
 * wallets, matching wallet first, then USD (Primary), then other locals
 * A to Z. Stablecoin wallets, bank accounts, crypto and USD wire are
 * hidden. Pay by bank transfer (v1.1) stays behind `localTransfer` until
 * PM defines the rail per currency.
 */
export function methodOptions(
  invoices: Array<Invoice>,
  local: EmployerLocal,
  wallets: Array<WalletSeed>,
  opts: { localTransfer?: boolean } = {},
): Record<MethodGroup, Array<MethodOption>> {
  const localMode = isLocalMode(invoices, local)
  const out: Record<MethodGroup, Array<MethodOption>> = {
    wallet: wallets.map(walletOption),
    bank: [],
    crypto: [],
    wire: [],
    'local-transfer': [],
  }
  if (localMode) {
    const rank = (w: WalletSeed) => (w.ccy === local ? 0 : w.primary ? 1 : 2)
    out.wallet = wallets
      .filter((w) => !w.network)
      .sort((a, b) => rank(a) - rank(b) || a.ccy.localeCompare(b.ccy))
      .map(walletOption)
    if (!opts.localTransfer) return out
    const rail = LOCAL_RAIL[local]
    out['local-transfer'].push({
      id: `lt-${local.toLowerCase()}`,
      group: 'local-transfer',
      label: rail.method,
      sub: rail.bank,
      ccy: local,
      fee: rail.fee,
      feeLabel: `${rail.method} fee`,
    })
    return out
  }
  out.bank = BANK_ACCOUNTS.map((b) => ({
    id: b.id,
    group: 'bank',
    label: b.name,
    ccy: 'USD',
    fee: 0,
    bankLast4: b.last4,
    primary: b.primary,
  }))
  out.crypto = [
    { id: 'cr-self', group: 'crypto', label: 'Crypto wallet', sub: 'Link your self custody crypto wallet', ccy: 'USDC', fee: CRYPTO_NETWORK_FEE, feeLabel: 'Network fee' },
    { id: 'cr-custodial', group: 'crypto', label: 'Custodial services', sub: 'Provide custodial wallet transaction hash', ccy: 'USDC', fee: CRYPTO_NETWORK_FEE, feeLabel: 'Network fee' },
    { id: 'cr-exchange', group: 'crypto', label: 'Exchange payments', sub: 'Connect and pay directly from your exchange account', ccy: 'USDC', fee: CRYPTO_NETWORK_FEE, feeLabel: 'Network fee' },
  ]
  out.wire = [
    { id: 'wire-usd', group: 'wire', label: 'Wire transfer', sub: 'Send from your bank account', ccy: 'USD', fee: USD_WIRE_FEE, feeLabel: 'Wire processing fee' },
  ]
  return out
}

export function findOption(
  groups: Record<MethodGroup, Array<MethodOption>>,
  id: string | null,
): MethodOption | null {
  if (!id) return null
  for (const list of Object.values(groups)) {
    const hit = list.find((o) => o.id === id)
    if (hit) return hit
  }
  return null
}

/* ---------------- default selection ---------------- */

/** USD value per invoice currency - drives "largest share" default. */
export function currencyShares(invoices: Array<Invoice>): Array<{ ccy: Ccy; usd: number; count: number }> {
  const map = new Map<Ccy, { usd: number; count: number }>()
  for (const inv of invoices) {
    const cur = map.get(inv.ccy) ?? { usd: 0, count: 0 }
    cur.usd += invoiceTotal(inv) * USD_PER[inv.ccy]
    cur.count += 1
    map.set(inv.ccy, cur)
  }
  return [...map.entries()]
    .map(([ccy, v]) => ({ ccy, ...v }))
    .sort((a, b) => b.usd - a.usd)
}

/**
 * Default method: the fiat wallet in the currency carrying the largest
 * share of the batch (minimises FX). Falls back to the USD Primary wallet
 * when no wallet exists in that currency (e.g. a PLN-heavy batch).
 * Stablecoin wallets are never auto-picked.
 */
export function defaultOptionId(invoices: Array<Invoice>, wallets: Array<WalletSeed>): string {
  const top = currencyShares(invoices)[0]?.ccy
  const fiat = wallets.filter((w) => !w.network)
  const match = fiat.find((w) => w.ccy === top)
  return (match ?? fiat.find((w) => w.primary) ?? wallets[0]).id
}

/* ---------------- credit ---------------- */

/**
 * Credits (spec "Apply credit in the invoice payment flow"): USD credit
 * offsets Niural fee lines only - never net pay, statutory or contractor
 * amounts. Opt-in. The user picks one USD amount (default: as much as
 * possible); it is split across fees by due date (ties by creation order),
 * converted into each fee's currency. Credit always rounds DOWN so it can
 * never exceed the balance.
 */

export interface CreditSettings {
  /** USD balance. */
  balance: number
  /** Optional stored expiry - shown on the meter. */
  expiresOn: string | null
}

export interface CreditRules {
  /** Open question: USD credit pays CAD/EUR/GBP fees (converted) vs USD invoices only. */
  crossCcy: boolean
}

/** Round down to cents (credit never goes over the balance). */
export const floor2 = (n: number) => Math.floor(n * 100 + 1e-7) / 100

export function isFeeLine(inv: Invoice, line: InvoiceLine): boolean {
  if (inv.kind === 'contractor') return false
  // Payroll funding: only the fee lines - net pay + statutory never.
  if (inv.kind === 'payroll') return /fee/i.test(line.label)
  return true
}

export function feeTotal(inv: Invoice): number {
  return round2(inv.lines.filter((l) => isFeeLine(inv, l)).reduce((s, l) => s + l.amount, 0))
}

/** Invoices credit may touch under the current rules, in split order. */
export function creditEligible(invoices: Array<Invoice>, rules: CreditRules): Array<Invoice> {
  return invoices
    .filter((i) => feeTotal(i) > 0 && (rules.crossCcy || i.ccy === 'USD'))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
}

/** Allocation per invoice id, in that invoice's currency. */
export type CreditAlloc = Record<string, number>

export function autoSplit(invoices: Array<Invoice>, balanceUsd: number, rules: CreditRules): CreditAlloc {
  let left = Math.max(0, balanceUsd)
  const alloc: CreditAlloc = {}
  for (const inv of creditEligible(invoices, rules)) {
    const fee = feeTotal(inv)
    const r = rate('USD', inv.ccy)
    const needUsd = fee / r
    const takeUsd = Math.min(left, needUsd)
    left -= takeUsd
    // Half-cent slack: applying exactly creditMax() covers the last fee in full.
    alloc[inv.id] = takeUsd >= needUsd - 0.005 ? fee : floor2(takeUsd * r)
  }
  return alloc
}

/** Most credit this batch can take, USD: min(balance, every eligible fee converted). */
export function creditMax(invoices: Array<Invoice>, balanceUsd: number, rules: CreditRules): number {
  const needUsd = creditEligible(invoices, rules).reduce((s, inv) => s + feeTotal(inv) / rate('USD', inv.ccy), 0)
  return round2(Math.max(0, Math.min(balanceUsd, needUsd)))
}

/** Parse a typed amount: "1,900" and "1900" both work, empty = 0, junk = NaN. */
export function parseAmount(raw: string | undefined): number {
  const t = (raw ?? '').replace(/,/g, '').trim()
  if (t === '') return 0
  if (!/^\d*\.?\d*$/.test(t)) return Number.NaN
  return Number(t)
}

export type CreditTag = 'full' | 'part' | 'none'

export interface CreditShare {
  invoiceId: string
  ccy: Ccy
  fee: number
  /** Offset in the invoice currency (0 when invalid). */
  applied: number
  /** USD equivalent. */
  usd: number
  /** 1 USD = rate {ccy}. */
  rate: number
  tag: CreditTag
  /** Inline validation message (manual mode). */
  error?: string
}

export interface CreditPlan {
  available: number
  used: number
  left: number
  shares: Array<CreditShare>
  /** Fee lines credit may cover / did fully cover. */
  eligible: number
  covered: number
  /** USD-only rule: there are local fees credit can't touch. */
  blockedLocal: boolean
  /** usedUsd − balance when over (manual mode). */
  over: number
  /** Any inline error - blocks Confirm. */
  invalid: boolean
}

/**
 * Build the plan from an allocation. Manual values arrive as raw strings
 * so validation can report "Enter an amount" for junk.
 */
export function planFromAlloc(
  invoices: Array<Invoice>,
  credit: CreditSettings,
  rules: CreditRules,
  alloc: Record<string, number | string>,
): CreditPlan {
  const eligible = creditEligible(invoices, rules)
  const shares: Array<CreditShare> = eligible.map((inv) => {
    const fee = feeTotal(inv)
    const r = rate('USD', inv.ccy)
    const raw = alloc[inv.id]
    const amount = typeof raw === 'string' ? parseAmount(raw) : (raw ?? 0)
    let error: string | undefined
    if (Number.isNaN(amount) || amount < 0) error = 'Enter an amount'
    else if (amount > fee + 1e-9) error = `Max ${fmt(fee, inv.ccy)}`
    const applied = error ? 0 : round2(amount)
    return {
      invoiceId: inv.id,
      ccy: inv.ccy,
      fee,
      applied,
      usd: round2(applied / r),
      rate: r,
      tag: applied <= 0 ? 'none' : applied < fee ? 'part' : 'full',
      error,
    }
  })
  const used = round2(shares.reduce((s, x) => s + x.applied / x.rate, 0))
  const over = round2(Math.max(0, used - credit.balance))
  return {
    available: credit.balance,
    used,
    left: round2(Math.max(0, credit.balance - used)),
    shares,
    eligible: shares.length,
    covered: shares.filter((x) => x.tag === 'full').length,
    blockedLocal: !rules.crossCcy && invoices.some((i) => i.ccy !== 'USD' && feeTotal(i) > 0),
    over,
    invalid: over > 0 || shares.some((x) => x.error),
  }
}

/** Auto mode in one call. */
export function planCredit(invoices: Array<Invoice>, credit: CreditSettings, rules: CreditRules): CreditPlan {
  return planFromAlloc(invoices, credit, rules, autoSplit(invoices, credit.balance, rules))
}


/* ---------------- quote ---------------- */

export interface QuoteLine {
  invoiceId: string
  amount: number
  ccy: Ccy
  converted: number
  /** Credit offset, invoice currency. */
  credit: number
  /** (amount − credit) converted into the paying currency. */
  due: number
  fx: boolean
}

export interface Quote {
  ccy: Ccy
  lines: Array<QuoteLine>
  /** Gross, converted. */
  subtotal: number
  /** Credit applied, converted into the paying currency. */
  credit: number
  plan: CreditPlan | null
  /** subtotal − credit: what the payment method has to cover. */
  amountDue: number
  fees: Array<{ label: string; amount: number }>
  total: number
  /** One rate row per foreign currency pair, sorted by share. */
  fxPairs: Array<{ from: Ccy; to: Ccy; rate: number }>
  fxCount: number
  available?: number
  pending?: number
  sufficient: boolean
  shortfall: number
  /** Pending would cover it once approved - drives the amber "waiting" message. */
  coveredByPending: boolean
  /**
   * What actually gets debited: one leg per paying method/wallet with
   * something left to pay. Single-method batches have ≤ 1 leg; a batch
   * split by currency has one wallet leg per currency still due.
   */
  legs: Array<Leg>
  /** Paid per currency from matching wallets (see splitWallets). */
  split: boolean
}

export interface Leg {
  option: MethodOption
  /** Amount in the leg's currency (incl. method fees). */
  amount: number
  ccy: Ccy
  available?: number
  pending?: number
  sufficient: boolean
  shortfall: number
  coveredByPending: boolean
}

function legOf(option: MethodOption, amount: number): Leg {
  const available = option.wallet?.available
  const pending = option.wallet?.pending
  const sufficient = available === undefined || available >= amount
  const shortfall = sufficient ? 0 : round2(amount - (available ?? 0))
  return {
    option,
    amount,
    ccy: option.ccy,
    available,
    pending,
    sufficient,
    shortfall,
    coveredByPending: !sufficient && (pending ?? 0) >= shortfall,
  }
}

/** "CAD 42,209.20 + GBP 27,850.00" */
export function fmtLegs(legs: Array<{ amount: number; ccy: Ccy }>, zeroCcy: Ccy): string {
  if (legs.length === 0) return fmt(0, zeroCcy)
  return legs.map((l) => fmt(l.amount, l.ccy)).join(' + ')
}

/**
 * Split by currency: a batch in 2+ currencies where every currency has its
 * own fiat Niural wallet (USD or an enabled local) pays each currency from
 * its matching wallet - no FX. Anything else (NPR, PLN, stablecoins) keeps
 * the single-method convert-all flow.
 */
export function splitWallets(invoices: Array<Invoice>, wallets: Array<WalletSeed>): Map<Ccy, WalletSeed> | null {
  const ccys = [...new Set(invoices.map((i) => i.ccy))]
  if (ccys.length < 2) return null
  const map = new Map<Ccy, WalletSeed>()
  for (const c of ccys) {
    const w = wallets.find((x) => x.ccy === c && !x.network)
    if (!w) return null
    map.set(c, w)
  }
  return map
}

export function quoteSplit(invoices: Array<Invoice>, wallets: Map<Ccy, WalletSeed>, plan: CreditPlan | null): Quote {
  const lines = invoices.map((inv) => {
    const amount = invoiceTotal(inv)
    const credit = plan?.shares.find((x) => x.invoiceId === inv.id)?.applied ?? 0
    return { invoiceId: inv.id, amount, ccy: inv.ccy, converted: amount, credit, due: round2(amount - credit), fx: false }
  })
  const legs: Array<Leg> = []
  for (const [ccy, w] of wallets) {
    const due = round2(lines.filter((l) => l.ccy === ccy).reduce((s, l) => s + l.due, 0))
    if (due > 0) legs.push(legOf(walletOption(w), due))
  }
  const first = legs[0]
  return {
    ccy: first?.ccy ?? invoices[0]?.ccy ?? 'USD',
    lines,
    subtotal: 0,
    credit: 0,
    plan,
    amountDue: round2(legs.reduce((s, l) => s + l.amount, 0)),
    fees: [],
    // Mixed currencies: only `legs` is meaningful for display - total is a
    // raw sum used for "anything left to pay?" checks.
    total: round2(legs.reduce((s, l) => s + l.amount, 0)),
    split: true,
    fxPairs: [],
    fxCount: 0,
    sufficient: legs.every((l) => l.sufficient),
    shortfall: 0,
    coveredByPending: legs.some((l) => l.coveredByPending),
    legs,
  }
}

/**
 * `opt` null = nothing picked yet (or nothing needed): amounts show in the
 * batch's largest-share currency, no fees, no balance check.
 * Credit is applied first in the invoice currency; only the remainder is
 * converted (P4 FX rule).
 */
export function quote(invoices: Array<Invoice>, opt: MethodOption | null, plan: CreditPlan | null = null): Quote {
  const payCcy: Ccy = opt?.ccy ?? currencyShares(invoices)[0]?.ccy ?? 'USD'
  const lines = invoices.map((inv) => {
    const amount = invoiceTotal(inv)
    const credit = plan?.shares.find((x) => x.invoiceId === inv.id)?.applied ?? 0
    return {
      invoiceId: inv.id,
      amount,
      ccy: inv.ccy,
      converted: convert(amount, inv.ccy, payCcy),
      credit,
      due: convert(round2(amount - credit), inv.ccy, payCcy),
      fx: inv.ccy !== payCcy,
    }
  })
  const subtotal = round2(lines.reduce((s, l) => s + l.converted, 0))
  const amountDue = round2(lines.reduce((s, l) => s + l.due, 0))
  const credit = round2(subtotal - amountDue)
  const fees = opt && opt.fee > 0 && amountDue > 0 ? [{ label: opt.feeLabel ?? 'Fee', amount: opt.fee }] : []
  const total = round2(amountDue + fees.reduce((s, f) => s + f.amount, 0))
  const fxLines = lines.filter((l) => l.fx && l.due > 0)
  const pairs = new Map<Ccy, number>()
  for (const l of fxLines) pairs.set(l.ccy, (pairs.get(l.ccy) ?? 0) + l.amount * USD_PER[l.ccy])
  const fxPairs = [...pairs.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([from]) => ({ from, to: payCcy, rate: rate(from, payCcy) }))

  const available = opt?.wallet?.available
  const pending = opt?.wallet?.pending
  const sufficient = available === undefined || available >= total
  const shortfall = sufficient ? 0 : round2(total - (available ?? 0))
  return {
    ccy: payCcy,
    lines,
    subtotal,
    credit,
    plan,
    amountDue,
    fees,
    total,
    fxPairs,
    fxCount: fxLines.length,
    available,
    pending,
    sufficient,
    shortfall,
    coveredByPending: !sufficient && (pending ?? 0) >= shortfall,
    legs: opt && total > 0 ? [legOf(opt, total)] : [],
    split: false,
  }
}

/** Display rate with sensible precision (0.0067 vs 1.2674). */
export function fmtRate(r: number): string {
  return r >= 1 ? r.toFixed(4) : r.toPrecision(4)
}

/** Rail name mid-sentence: "wire transfer" but "Faster Payments" (scheme name). */
export function railInSentence(method: string): string {
  return method.startsWith('Faster') ? method : method.toLowerCase()
}

/* ---------------- references ---------------- */

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** ≤ 18 chars (Faster Payments limit). Deterministic per seed. */
export function makeReference(seed: number): string {
  let x = (seed * 2654435761) >>> 0
  let s = 'NRL'
  for (let i = 0; i < 9; i++) {
    x = (x * 1103515245 + 12345) >>> 0
    s += REF_ALPHABET[x % REF_ALPHABET.length]
  }
  return s
}
