/**
 * AppView - everything a screen needs to render one exact state, same
 * contract as split-pay/multi-payroll. First-pass scope (per the user's
 * choice): the Employer experience only - Settings > Billing (Payment
 * methods, Credit) and Settings > AI (Tokens, Usage), the navbar token
 * pill + notifications, the buy-tokens flow, and auto-reload. Admin and
 * the public website are out of scope for this pass.
 *
 * Ported from a hand-built HTML workbench (niural-tokens-workbench.html)
 * that already resolved 18 balance presets, the pricing/discount math,
 * and every review-modal variant against the PRD - this file mirrors its
 * `S` state shape almost exactly rather than re-deriving it.
 */

export type LedgerKey = 'base' | 'adjust' | 'multi' | 'freetier' | 'exhausted' | 'empty' | 'huge' | 'tokenonly'

/** One row in any of the three employer-visible ledgers (credit history,
 *  token purchases, usage/consumption) - `unit` decides which table it
 *  renders in; dollars and tokens never share a table (a real gap the
 *  workbench's own checklist called out and fixed by splitting Credit
 *  from Tokens entirely). */
export interface LedgerEntry {
  date: string
  title: string
  sub: string
  amount: number
  unit: 'usd' | 'tok' | 'note'
  balance: number
  /** Anchors a highlight when a catalog state points at this exact row. */
  key?: string
  /** Inline chip - a multi-source transaction id, or "adjustment". */
  flag?: string
}

export type PresetKey =
  | 'healthy'
  | 'low'
  | 'split'
  | 'zero'
  | 'zeroOff'
  | 'zeroMid'
  | 'zeroResume'
  | 'nocredit'
  | 'freetier'
  | 'freeExhausted'
  | 'empty'
  | 'loading'
  | 'error'
  | 'huge'
  | 'adjust'
  | 'multi'
  | 'pendingach'
  | 'creditused'

/** The one balances object every Settings > AI/Billing page reads from -
 *  mirrors the workbench's single `S` exactly so a preset fully determines
 *  every page's state, not just the one you happened to be looking at. */
export interface Balances {
  preset: PresetKey
  tokens: number
  credit: number
  /** All-time credit ever granted - distinguishes "never had credit" from
   *  "had it, spent it" (both render $0.00 but mean different things). */
  creditEver: number
  wallet: number
  autoOn: boolean
  arTh: number
  arAmt: number
  ledger: LedgerKey
  load: 'ok' | 'loading' | 'error'
  /** A task is mid-flight when tokens hit zero (payroll paused part-way). */
  mid: boolean
  /** Wallet funds in flight (ACH/wire) that haven't settled yet. */
  pendingWallet: number
}

export type AutoReloadFieldError = 'below-min' | 'threshold-zero' | 'threshold-negative' | 'no-source'

export interface AutoReloadModalView {
  open: boolean
  fieldError?: AutoReloadFieldError
  /** Which sources are ticked, in priority order. */
  sources: Array<'credit' | 'wallet'>
}

export interface TokensView {
  balances: Balances
  autoReload?: AutoReloadModalView
}

export interface CreditView {
  balances: Balances
}

export interface UsageView {
  balances: Balances
}

export interface PaymentMethodsView {
  /** Only state that varies here: the empty "add a method" affordance vs.
   *  the seeded 3-account list - everything else is static per the PRD's
   *  own limited scope for this screen. */
  hasAccounts: boolean
}

/** Funding model - v1 always auto-applies credit-then-wallet-then-add-funds;
 *  P1-4 (user-selectable source) is explicitly "not committed to v1" in the
 *  PRD, kept here only so a catalog state can demonstrate the deferred
 *  behavior without a live toggle in the real UI. */
export type FundingMode = 'v1' | 'p1'

export type ReviewVariant = 'default' | 'ach' | 'wire' | 'done' | 'pending' | 'failed' | 'resume'

export interface BuyView {
  balances: Balances
  qty: number
  mode: FundingMode
  /** p1-only: which single source the user picked. */
  src: 'credit' | 'wallet' | 'fund'
  method: 'ach' | 'wire'
  review?: ReviewVariant
}

export type AppView =
  | { kind: 'tokens'; tokens: TokensView }
  | { kind: 'credit'; credit: CreditView }
  | { kind: 'usage'; usage: UsageView }
  | { kind: 'paymentMethods'; paymentMethods: PaymentMethodsView }
  | { kind: 'wallet' }
  | { kind: 'buy'; buy: BuyView }
  | { kind: 'decisionsNeeded' }
