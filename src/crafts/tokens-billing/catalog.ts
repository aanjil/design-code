import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type { AppView, BuyView, PaymentMethodsView, PresetKey, ReviewVariant, TokensView } from './types'
import { preset } from './engine'

/**
 * Scenario catalog - same contract as multi-payroll/split-pay: every state
 * is one reproducible screen built fresh from its own preset, no leakage
 * between scenarios.
 */

interface StateDef {
  id: string
  label: string
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

const tokens = (key: PresetKey, extra?: Partial<TokensView>): AppView => ({
  kind: 'tokens',
  tokens: { balances: preset(key), ...extra },
})

const credit = (key: PresetKey): AppView => ({ kind: 'credit', credit: { balances: preset(key) } })

const usage = (key: PresetKey): AppView => ({ kind: 'usage', usage: { balances: preset(key) } })

const paymentMethods = (view: PaymentMethodsView): AppView => ({ kind: 'paymentMethods', paymentMethods: view })

const wallet = (): AppView => ({ kind: 'wallet' })

const buy = (partial: Partial<BuyView> & { qty: number }): AppView => ({
  kind: 'buy',
  buy: {
    balances: preset('healthy'),
    mode: 'v1',
    src: 'credit',
    method: 'ach',
    ...partial,
  },
})

const review = (
  variant: ReviewVariant,
  opts: { qty?: number; preset?: PresetKey; method?: 'ach' | 'wire' } = {},
): AppView =>
  buy({
    qty: opts.qty ?? 1250,
    balances: preset(opts.preset ?? 'healthy'),
    method: opts.method ?? 'ach',
    review: variant,
  })

const decisionsNeeded = (): AppView => ({ kind: 'decisionsNeeded' })

export const SCENARIOS: Array<GroupDef> = [
  {
    group: 'A · Settings > AI (Tokens, Usage)',
    screens: [
      {
        id: 'A1',
        label: 'A1 Tokens overview',
        states: [
          { id: 'healthy', label: 'Healthy balance', make: () => tokens('healthy') },
          { id: 'low', label: 'Low balance, above threshold', make: () => tokens('low') },
          { id: 'zero', label: 'Zero tokens, blocked', make: () => tokens('zero') },
          { id: 'zeroOff', label: 'Blocked, auto-reload off', make: () => tokens('zeroOff') },
          { id: 'zeroMid', label: 'Paused mid-task', make: () => tokens('zeroMid') },
          { id: 'nocredit', label: 'Never had credit', make: () => tokens('nocredit') },
          { id: 'creditused', label: 'Credit used up', make: () => tokens('creditused') },
          { id: 'freetier', label: 'Free tier only', make: () => tokens('freetier') },
          { id: 'freeExhausted', label: 'Free tier used up', make: () => tokens('freeExhausted') },
          { id: 'empty', label: 'No activity yet', make: () => tokens('empty') },
          { id: 'loading', label: 'Loading skeletons', make: () => tokens('loading') },
          { id: 'error', label: 'Balance fetch failed', make: () => tokens('error') },
          { id: 'huge', label: 'Very large numbers', make: () => tokens('huge') },
          { id: 'adjust', label: 'Delayed-COGS adjustment row', make: () => tokens('adjust') },
          { id: 'multi', label: 'Multi-source auto-reload fill', make: () => tokens('multi') },
          { id: 'pendingach', label: 'Wallet has unsettled inbound funds', make: () => tokens('pendingach') },
        ],
      },
      {
        id: 'A2',
        label: 'A2 Auto-reload settings',
        states: [
          {
            id: 'ok',
            label: 'On, protected',
            make: () => tokens('healthy', { autoReload: { open: true, sources: ['credit', 'wallet'] } }),
          },
          {
            id: 'off',
            label: 'Off - reactive block applies instead',
            make: () => tokens('zeroOff', { autoReload: { open: true, sources: [] } }),
          },
          {
            id: 'risk',
            label: 'On, but sources cannot cover the next top-up',
            make: () => tokens('low', { autoReload: { open: true, sources: ['credit'] } }),
          },
          {
            id: 'below-min',
            label: 'Validation - top-up below 250',
            make: () => tokens('healthy', { autoReload: { open: true, sources: ['credit', 'wallet'], fieldError: 'below-min' } }),
          },
          {
            id: 'threshold-zero',
            label: 'Validation - threshold 0, permitted but flagged',
            make: () => tokens('healthy', { autoReload: { open: true, sources: ['credit', 'wallet'], fieldError: 'threshold-zero' } }),
          },
          {
            id: 'no-source',
            label: 'Validation - on with no source selected',
            make: () => tokens('healthy', { autoReload: { open: true, sources: [], fieldError: 'no-source' } }),
          },
        ],
      },
      {
        id: 'A3',
        label: 'A3 Usage',
        states: [
          { id: 'default', label: 'Default', make: () => usage('healthy') },
          { id: 'empty', label: 'Emma hasn’t run anything yet', make: () => usage('empty') },
          { id: 'huge', label: 'Very large numbers', make: () => usage('huge') },
          { id: 'adjust', label: 'Delayed-COGS adjustment row', make: () => usage('adjust') },
        ],
      },
    ],
  },
  {
    group: 'B · Settings > Billing (Credit, Payment methods)',
    screens: [
      {
        id: 'B1',
        label: 'B1 Credit',
        states: [
          { id: 'healthy', label: 'Has credit', make: () => credit('healthy') },
          { id: 'nocredit', label: 'No credit ever granted', make: () => credit('nocredit') },
          { id: 'creditused', label: 'Credit granted but fully used', make: () => credit('creditused') },
          { id: 'empty', label: 'No credit history', make: () => credit('empty') },
          { id: 'huge', label: 'Very large numbers', make: () => credit('huge') },
        ],
      },
      {
        id: 'B2',
        label: 'B2 Payment methods',
        states: [{ id: 'default', label: 'Default', make: () => paymentMethods({ hasAccounts: true }) }],
      },
    ],
  },
  {
    group: 'C · Wallet (pointer)',
    screens: [{ id: 'C1', label: 'C1 Wallet', states: [{ id: 'default', label: 'Default', make: () => wallet() }] }],
  },
  {
    group: 'D · Buy tokens flow',
    screens: [
      {
        id: 'D1',
        label: 'D1 Amount + payment breakdown',
        states: [
          { id: 'default', label: 'Default', make: () => buy({ qty: 1250 }) },
          { id: 'below-min', label: 'Below the 250 minimum', make: () => buy({ qty: 100 }) },
          { id: 'boundary', label: 'Exactly on a discount threshold', make: () => buy({ qty: 3000 }) },
          { id: 'ceiling', label: 'At the 5,000 ceiling', make: () => buy({ qty: 5000 }) },
          { id: 'split', label: 'Credit partial, wallet covers remainder', make: () => buy({ qty: 1250, balances: preset('split') }) },
          {
            id: 'addfunds',
            label: 'Credit and wallet both short - needs ACH/wire',
            make: () => buy({ qty: 5000, balances: preset('zero'), method: 'ach' }),
          },
          { id: 'nocredit', label: 'No credit available', make: () => buy({ qty: 1250, balances: preset('nocredit') }) },
        ],
      },
      {
        id: 'D2',
        label: 'D2 Review and confirm',
        states: [
          { id: 'standard', label: 'Credit or wallet payment', make: () => review('default') },
          { id: 'ach', label: 'ACH debit variant', make: () => review('ach', { qty: 5000, preset: 'zero', method: 'ach' }) },
          { id: 'wire', label: 'Wire transfer variant', make: () => review('wire', { qty: 5000, preset: 'zero', method: 'wire' }) },
          { id: 'done', label: 'Success - tokens added', make: () => review('done') },
          {
            id: 'pending',
            label: 'Pending - waiting on settlement',
            make: () => review('pending', { qty: 5000, preset: 'zero', method: 'wire' }),
          },
          { id: 'failed', label: 'Failure - declined at confirm', make: () => review('failed') },
          { id: 'resume', label: 'Resume the blocked task after topping up', make: () => review('resume', { preset: 'zeroResume' }) },
        ],
      },
    ],
  },
  {
    group: 'E · Decisions needed first',
    screens: [
      { id: 'E1', label: 'E1 Open PRD decisions', states: [{ id: 'default', label: 'Default', make: () => decisionsNeeded() }] },
    ],
  },
]

/** Every real catalog screen id - lets canvas focus events know whether a
 *  clicked window belongs to the reviewable matrix (vs. e.g. the App). */
export const CATALOG_SCREEN_IDS = new Set(SCENARIOS.flatMap((g) => g.screens.map((s) => s.id)))

/** Serializable catalog for the explorer panels (no make functions). */
export const EXPLORER_CATALOG: Array<ExplorerGroupDef> = SCENARIOS.map((g) => ({
  group: g.group,
  screens: g.screens.map((s) => ({
    id: s.id,
    label: s.label,
    states: s.states.map(({ id, label }) => ({ id, label })),
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

/** Caption text: "<screen> - <state>". */
export function describeSelection(screenId: string, stateId: string): string {
  for (const group of SCENARIOS) {
    for (const screen of group.screens) {
      if (screen.id !== screenId) continue
      const state = screen.states.find((s) => s.id === stateId)
      return state ? `${screen.label} - ${state.label}` : screen.label
    }
  }
  return screenId
}
