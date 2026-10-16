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
  /** Big "Choose payment method" modal - opened from the method switcher. */
  | { kind: 'methods' }
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
  /** Inline accordion (nothing picked yet): which method group is expanded. */
  openGroup: MethodGroup | null
  /** Credit Apply/Remove: null = follow the default-on config (off unless PM flips it). */
  creditOn: boolean | null
  /** Credit to apply as typed, USD. null = as much as the batch can take. */
  creditAmount: string | null
  /** Last Confirm failed atomically (P6) - nothing moved. */
  payFailed: boolean
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
  openGroup: null,
  creditOn: null,
  creditAmount: null,
  payFailed: false,
  collapsed: [],
  wireVerify: 'idle',
  walletCcy: 'USD',
  modal: null,
}
