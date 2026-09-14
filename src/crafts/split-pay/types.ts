/**
 * AppView - everything a screen needs to render one exact state.
 * Mirrors multi-payroll / schedule-report: every catalog state builds a
 * fresh AppView; screens stay interactive on top of it.
 */

/** §1.4 - one card component, one state visible at a time (12 total;
 *  'no-wallet' renders as the disabled split row + add CTA on A1). */
export type WalletCardState =
  | 'no-wallet'
  | 'verify-required'
  | 'verify-in-progress'
  | 'in-review'
  | 'in-review-long'
  | 'fca-pending'
  | 'cooling-off'
  | 'activating'
  | 'ready'
  | 'active'
  | 'needs-attention'
  | 'off'

export type GuardrailModal =
  | 'verify-notice'
  | 'consent'
  | 'delete-bank-in-split'
  | 'delete-last-bank'
  | 'delete-wallet'

export interface PaymentMethodsView {
  wallet: WalletCardState
  modal?: GuardrailModal
}

export type KycStep = 'details' | 'dynamic' | 'onfido' | 'onfido-return' | 'rejected'

export interface KycView {
  step: KycStep
  /** Index into KYC_DYNAMIC_STEPS when step === 'dynamic'. */
  dynamicIndex?: number
  /** B3: terminal-retry variant swaps CTA to "Contact support". */
  retryBlocked?: boolean
}

export type FcaStep = 'categorization' | 'agreement' | 'risk' | 'risk-fail' | 'cooling-off'

export interface FcaView {
  step: FcaStep
  /** Agreement: risk disclosure scrolled to end (enables accept). */
  scrolledToEnd?: boolean
}

export type ConfigStage = 'form' | 'review' | 'confirmation'

export interface SplitConfigView {
  mode: 'create' | 'edit'
  stage: ConfigStage
  unit?: 'percent' | 'amount'
  /** §4.1.3 - no pay history: proportion-only preview. */
  noHistory?: boolean
}

export interface ReceiptView {
  /** §5.2 - crypto leg incomplete: pending state replaces download. */
  pending?: boolean
}

export type EmailKind =
  | 'kyc-review'
  | 'kyc-approved'
  | 'kyc-rejected'
  | 'cooling-off'
  | 'vba-active'
  | 'fallback'

export interface EmailView {
  kind: EmailKind
}

export interface OpsView {
  /** Row whose full timeline detail is expanded. */
  detailFor?: string
}

export type AppView =
  | { kind: 'payment-methods'; pm: PaymentMethodsView }
  | { kind: 'kyc'; kyc: KycView }
  | { kind: 'fca'; fca: FcaView }
  | { kind: 'split-config'; config: SplitConfigView }
  | { kind: 'receipt'; receipt: ReceiptView }
  | { kind: 'email'; email: EmailView }
  | { kind: 'ops'; ops: OpsView }
