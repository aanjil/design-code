import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type { AppView, PaymentMethodsView, WalletCardState } from './types'

/**
 * Scenario catalog - single source of truth for the design checklist,
 * the states rail, and the preview. Groups follow the design doc's build
 * order: A wallet card, B KYC, C FCA + cooling off, D split config,
 * E guardrails + receipt, F emails, G ops.
 */

interface StateDef {
  id: string
  label: string
  scope?: 'v1' | 'full'
  make: () => AppView
}

interface ScreenDef {
  id: string
  label: string
  states: Array<StateDef>
}

interface GroupDef {
  group: string
  screens: Array<ScreenDef>
}

const pm = (over: Partial<PaymentMethodsView> = {}): AppView => ({
  kind: 'payment-methods',
  pm: { wallet: 'active', ...over },
})

const kyc = (k: (AppView & { kind: 'kyc' })['kyc']): AppView => ({ kind: 'kyc', kyc: k })
const fca = (f: (AppView & { kind: 'fca' })['fca']): AppView => ({ kind: 'fca', fca: f })
const config = (c: (AppView & { kind: 'split-config' })['config']): AppView => ({
  kind: 'split-config',
  config: c,
})

/** §1.4 card matrix - every wallet-card state, one catalog state each. */
const CARD_STATES: Array<{ id: WalletCardState; label: string }> = [
  { id: 'verify-required', label: 'Verification required' },
  { id: 'verify-in-progress', label: 'Verification in progress' },
  { id: 'in-review', label: 'In review' },
  { id: 'in-review-long', label: 'In review - extended' },
  { id: 'fca-pending', label: 'FCA step pending' },
  { id: 'cooling-off', label: 'Cooling off' },
  { id: 'activating', label: 'Activating' },
  { id: 'ready', label: 'Ready' },
  { id: 'active', label: 'Active' },
  { id: 'needs-attention', label: 'Needs attention' },
  { id: 'off', label: 'Off' },
]

export const SCENARIOS: Array<GroupDef> = [
  {
    group: 'A · Wallet & payment methods',
    screens: [
      {
        id: 'A1',
        label: 'A1 Payment methods',
        states: [
          { id: 'no-wallet', label: 'No wallet yet', make: () => pm({ wallet: 'no-wallet' }) },
        ],
      },
      {
        id: 'A2',
        label: 'A2 Verification notice',
        states: [
          {
            id: 'default',
            label: 'Default',
            make: () => pm({ wallet: 'no-wallet', modal: 'verify-notice' }),
          },
        ],
      },
      {
        id: 'A3',
        label: 'A3 Consent (Transak share)',
        states: [
          {
            id: 'default',
            label: 'Default',
            make: () => pm({ wallet: 'no-wallet', modal: 'consent' }),
          },
        ],
      },
      {
        id: 'A4',
        label: 'A4 Wallet card states',
        states: CARD_STATES.map((s) => ({
          id: s.id,
          label: s.label,
          make: () => pm({ wallet: s.id }),
        })),
      },
    ],
  },
  {
    group: 'B · KYC',
    screens: [
      {
        id: 'B1',
        label: 'B1 Details form',
        states: [
          { id: 'details', label: 'Confirm your details', make: () => kyc({ step: 'details' }) },
          {
            id: 'dynamic-1',
            label: 'Dynamic step - purpose',
            make: () => kyc({ step: 'dynamic', dynamicIndex: 0 }),
          },
          {
            id: 'dynamic-2',
            label: 'Dynamic step - income',
            make: () => kyc({ step: 'dynamic', dynamicIndex: 1 }),
          },
        ],
      },
      {
        id: 'B2',
        label: 'B2 Onfido handoff',
        states: [
          { id: 'entry', label: 'Entry', make: () => kyc({ step: 'onfido' }) },
          { id: 'return', label: 'Submitted / return', make: () => kyc({ step: 'onfido-return' }) },
        ],
      },
      {
        id: 'B3',
        label: 'B3 Rejected',
        states: [
          { id: 'retry', label: 'Retry allowed', make: () => kyc({ step: 'rejected' }) },
          {
            id: 'terminal',
            label: 'Retry blocked (support)',
            make: () => kyc({ step: 'rejected', retryBlocked: true }),
          },
        ],
      },
    ],
  },
  {
    group: 'C · FCA & cooling off',
    screens: [
      {
        id: 'C1',
        label: 'C1 Categorization',
        states: [{ id: 'default', label: 'Question set', make: () => fca({ step: 'categorization' }) }],
      },
      {
        id: 'C2',
        label: 'C2 Risk disclosure & agreement',
        states: [
          { id: 'unscrolled', label: 'Accept disabled (not scrolled)', make: () => fca({ step: 'agreement' }) },
          {
            id: 'scrolled',
            label: 'Scrolled to end + sign',
            make: () => fca({ step: 'agreement', scrolledToEnd: true }),
          },
        ],
      },
      {
        id: 'C3',
        label: 'C3 Risk assessment',
        states: [
          { id: 'questions', label: 'Questions', make: () => fca({ step: 'risk' }) },
          { id: 'fail', label: 'Fail + retry', make: () => fca({ step: 'risk-fail' }) },
        ],
      },
      {
        id: 'C4',
        label: 'C4 Cooling off (full screen)',
        states: [{ id: 'default', label: 'Default', make: () => fca({ step: 'cooling-off' }) }],
      },
    ],
  },
  {
    group: 'D · Split configuration',
    screens: [
      {
        id: 'D1',
        label: 'D1 Configure split',
        states: [
          { id: 'percent', label: 'Percent (default)', make: () => config({ mode: 'create', stage: 'form', unit: 'percent' }) },
          { id: 'amount', label: 'Fixed amount', make: () => config({ mode: 'create', stage: 'form', unit: 'amount' }) },
          {
            id: 'no-history',
            label: 'No pay history (proportion only)',
            make: () => config({ mode: 'create', stage: 'form', unit: 'percent', noHistory: true }),
          },
          { id: 'review', label: 'Review', make: () => config({ mode: 'create', stage: 'review', unit: 'percent' }) },
          { id: 'confirmation', label: 'Confirmation', make: () => config({ mode: 'create', stage: 'confirmation', unit: 'percent' }) },
        ],
      },
      {
        id: 'D2',
        label: 'D2 Edit split (cutoff banner)',
        states: [
          { id: 'form', label: 'Pre-filled + cutoff banner', make: () => config({ mode: 'edit', stage: 'form', unit: 'percent' }) },
          { id: 'confirmation', label: 'Updated confirmation', make: () => config({ mode: 'edit', stage: 'confirmation', unit: 'percent' }) },
        ],
      },
    ],
  },
  {
    group: 'E · Guardrails & receipt',
    screens: [
      {
        id: 'E1',
        label: 'E1 Guardrail modals',
        states: [
          {
            id: 'bank-in-split',
            label: 'Delete bank in split',
            make: () => pm({ wallet: 'active', modal: 'delete-bank-in-split' }),
          },
          {
            id: 'last-bank',
            label: 'Delete last bank',
            make: () => pm({ wallet: 'active', modal: 'delete-last-bank' }),
          },
          {
            id: 'delete-wallet',
            label: 'Delete wallet (destructive)',
            make: () => pm({ wallet: 'active', modal: 'delete-wallet' }),
          },
        ],
      },
      {
        id: 'E2',
        label: 'E2 Receipt',
        states: [
          { id: 'complete', label: 'Two-account receipt', make: () => ({ kind: 'receipt', receipt: {} }) },
          { id: 'pending', label: 'Crypto leg pending', make: () => ({ kind: 'receipt', receipt: { pending: true } }) },
        ],
      },
    ],
  },
  {
    group: 'F · Emails',
    screens: [
      {
        id: 'F1',
        label: 'F1 Email set',
        states: [
          { id: 'kyc-review', label: 'B.1 KYC in review', make: () => ({ kind: 'email', email: { kind: 'kyc-review' } }) },
          { id: 'kyc-approved', label: 'B.2 KYC approved', make: () => ({ kind: 'email', email: { kind: 'kyc-approved' } }) },
          { id: 'kyc-rejected', label: 'B.3 KYC rejected', make: () => ({ kind: 'email', email: { kind: 'kyc-rejected' } }) },
          { id: 'cooling-off', label: 'B.4 Cooling off starts', make: () => ({ kind: 'email', email: { kind: 'cooling-off' } }) },
          { id: 'vba-active', label: "B.5 You're all set", make: () => ({ kind: 'email', email: { kind: 'vba-active' } }) },
          { id: 'fallback', label: 'B.6 Fallback to bank', make: () => ({ kind: 'email', email: { kind: 'fallback' } }) },
        ],
      },
    ],
  },
  {
    group: 'G · Ops (internal)',
    screens: [
      {
        id: 'G1',
        label: 'G1 Transaction detail',
        states: [
          { id: 'default', label: 'Orders table + flags', make: () => ({ kind: 'ops', ops: {} }) },
          { id: 'detail', label: 'Row timeline expanded', make: () => ({ kind: 'ops', ops: { detailFor: 'ops-3' } }) },
        ],
      },
    ],
  },
]

export const CATALOG_SCREEN_IDS = new Set(SCENARIOS.flatMap((g) => g.screens.map((s) => s.id)))

export const EXPLORER_CATALOG: Array<ExplorerGroupDef> = SCENARIOS.map((g) => ({
  group: g.group,
  screens: g.screens.map((s) => ({
    id: s.id,
    label: s.label,
    states: s.states.map(({ id, label, scope }) => ({ id, label, scope })),
  })),
}))

const FALLBACK: AppView = SCENARIOS[0].screens[0].states[0].make()

export function makeView(screenId: string, stateId: string): AppView {
  for (const group of SCENARIOS) {
    for (const screen of group.screens) {
      if (screen.id !== screenId) continue
      const state = screen.states.find((s) => s.id === stateId) ?? screen.states[0]
      return state ? state.make() : FALLBACK
    }
  }
  return FALLBACK
}
