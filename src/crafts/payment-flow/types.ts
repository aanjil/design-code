import type { MethodGroup } from './engine'
import type { PayResult } from './store'
import type { Ccy, InvoiceTab, LocalCcy } from '@/mocks/payment-flow'

/**
 * UiState - everything the employer app needs to render one exact moment.
 * Catalog states build one of these (plus an optional data `prepare`);
 * the app stays fully interactive from there.
 */

export type Screen = 'invoices' | 'payment' | 'wallet'

export type FundStep = 'method' | 'amount' | 'review' | 'initiated'

export interface FundDraft {
  step: FundStep
  ccy: 'USD' | LocalCcy
  /** 'rail' = Wire / Faster Payments / SEPA / USD wire, 'ach' = USD bank debit. */
  method: 'rail' | 'ach'
  amount: string
  memo: string
  /** Set when opened from an insufficient balance message. */
  shortfall?: number
  requestId?: string
}

export type Modal =
  | null
  | { kind: 'confirm' }
  | { kind: 'success'; result: PayResult }
  | { kind: 'fund'; draft: FundDraft }

export interface UiState {
  screen: Screen
  tab: InvoiceTab
  /** Checked rows on the invoices table. */
  selected: Array<string>
  /** Invoices on the payment screen. */
  payIds: Array<string>
  methodId: string | null
  /** Method list expanded (accordion of groups) vs the compact selected card. */
  methodsOpen: boolean
  openGroup: MethodGroup | null
  /** Invoice cards collapsed on the payment screen (multi only). */
  collapsed: Array<string>
  /** USD wire: verification step done. */
  wireVerify: 'idle' | 'code' | 'verified'
  walletCcy: Ccy
  modal: Modal
}

export const DEFAULT_UI: UiState = {
  screen: 'invoices',
  tab: 'fees',
  selected: [],
  payIds: [],
  methodId: null,
  methodsOpen: false,
  openGroup: null,
  collapsed: [],
  wireVerify: 'idle',
  walletCcy: 'USD',
  modal: null,
}
