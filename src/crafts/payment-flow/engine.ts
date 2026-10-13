import {
  BANK_ACCOUNTS,
  CCY_NAME,
  CRYPTO_NETWORK_FEE,
  LOCAL_RAIL,
  USD_PER,
  USD_WIRE_FEE,
} from '@/mocks/payment-flow'
import type { Ccy, EmployerLocal, Invoice, LocalCcy, WalletSeed } from '@/mocks/payment-flow'

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
  bank: 'Bank account',
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

export function methodOptions(
  invoices: Array<Invoice>,
  local: EmployerLocal,
  wallets: Array<WalletSeed>,
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

/* ---------------- quote ---------------- */

export interface QuoteLine {
  invoiceId: string
  amount: number
  ccy: Ccy
  converted: number
  fx: boolean
}

export interface Quote {
  ccy: Ccy
  lines: Array<QuoteLine>
  subtotal: number
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
}

export function quote(invoices: Array<Invoice>, opt: MethodOption): Quote {
  const lines = invoices.map((inv) => {
    const amount = invoiceTotal(inv)
    return {
      invoiceId: inv.id,
      amount,
      ccy: inv.ccy,
      converted: convert(amount, inv.ccy, opt.ccy),
      fx: inv.ccy !== opt.ccy,
    }
  })
  const subtotal = round2(lines.reduce((s, l) => s + l.converted, 0))
  const fees = opt.fee > 0 ? [{ label: opt.feeLabel ?? 'Fee', amount: opt.fee }] : []
  const total = round2(subtotal + fees.reduce((s, f) => s + f.amount, 0))
  const pairs = new Map<Ccy, number>()
  for (const l of lines) if (l.fx) pairs.set(l.ccy, (pairs.get(l.ccy) ?? 0) + l.amount * USD_PER[l.ccy])
  const fxPairs = [...pairs.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([from]) => ({ from, to: opt.ccy, rate: rate(from, opt.ccy) }))

  const available = opt.wallet?.available
  const pending = opt.wallet?.pending
  const sufficient = available === undefined || available >= total
  const shortfall = sufficient ? 0 : round2(total - (available ?? 0))
  return {
    ccy: opt.ccy,
    lines,
    subtotal,
    fees,
    total,
    fxPairs,
    fxCount: lines.filter((l) => l.fx).length,
    available,
    pending,
    sufficient,
    shortfall,
    coveredByPending: !sufficient && (pending ?? 0) >= shortfall,
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
