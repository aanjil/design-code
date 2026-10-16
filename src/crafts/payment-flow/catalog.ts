import { findOption, methodOptions, planCredit, quote, round2 } from './engine'
import type { FlowData } from './store'
import type { UiState } from './types'
import type { ExplorerGroupDef } from '@/components/playground/explorer'
import { EMPLOYER, LOCAL_RAIL } from '@/mocks/payment-flow'
import type { EmployerLocal, LocalCcy } from '@/mocks/payment-flow'

/**
 * Scenario catalog - every screen × state the design needs, one click
 * each in the explorer panel. Each state seeds a fresh world for the
 * craft-wide employer config (USD only / CAD / GBP / EUR) and an exact
 * UiState; the frame stays interactive from there.
 */

type Ui = Partial<UiState>

export interface StateDef {
  id: string
  label: string
  scope?: 'v1' | 'full'
  /** 'local' (default) = needs a local wallet; falls back to CAD on a USD-only config. */
  config?: 'local' | 'usd-only' | 'any'
  prepare?: (d: FlowData) => void
  ui?: (ctx: { local: EmployerLocal; data: FlowData }) => Ui
  admin?: { ccy?: 'All' | 'USD' | LocalCcy }
  /** Keep the seeded USD 2,000 credit. Other states start with no credit so they keep their meaning. */
  credit?: boolean
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

/* ---------- invoice id sets ---------- */

const PAYROLL = 'inv-f01'
const MASTER = 'inv-f03'
const FEES_BATCH = ['inv-f02', 'inv-f03', 'inv-f04', 'inv-f05', 'inv-f06']
/** USD-heavy mixed batch: USD contractor + CAD contractor + PLN + NPR. */
const MIXED_USD = ['inv-c05', 'inv-c08', 'inv-c02', 'inv-c01']
/** Local-heavy mixed batch: local contractor + local master + NPR + local CM fee. */
function mixedLocal(local: EmployerLocal): Array<string> {
  const contractor = local === 'GBP' ? 'inv-c12' : local === 'EUR' ? 'inv-c13' : 'inv-c08'
  return [contractor, MASTER, 'inv-c01', 'inv-f04']
}

const pay = (payIds: Array<string>, extra: Ui = {}): Ui => ({ screen: 'payment', payIds, ...extra })
const localWallet = (local: EmployerLocal) => (local ? `w-${local.toLowerCase()}` : 'w-usd')

function addPending(d: FlowData, amount: number) {
  const w = d.wallets.find((x) => x.ccy === d.local)
  if (!w || !d.local) return
  w.pending = amount
  d.requests.unshift({
    id: 'fr-150',
    employer: EMPLOYER.name,
    reference: 'NRLQ7H2KD9WE',
    ccy: d.local,
    method: LOCAL_RAIL[d.local].methodShort,
    amount,
    fee: LOCAL_RAIL[d.local].fee,
    status: 'pending',
    createdAt: '2026-10-13T09:40:00Z',
    memo: 'Oct payroll top up',
  })
  d.txs.unshift({ id: 'tx-fr-150', type: 'Top-up', description: `${LOCAL_RAIL[d.local].methodShort} top-up · NRLQ7H2KD9WE`, status: 'pending', ccy: d.local, amount, at: '2026-10-13T09:40:00Z' })
}

const ON: Ui = { creditOn: true }

/** Credit applied with an edited USD amount (as typed). */
const amount = (raw: string): Ui => ({ creditOn: true, creditAmount: raw })

const withTransfer = (d: FlowData) => {
  d.flags.localTransfer = true
}

function setCredit(d: FlowData, balance: number) {
  d.credit.balance = balance
}

/** Enough local balance that only credit decides the state. */
function richLocal(d: FlowData) {
  const w = d.wallets.find((x) => x.ccy === d.local)
  if (w) w.available = 60_000
}

/** Success modal needs a real PayResult - computed, not mutated. */
function resultFor(data: FlowData, payIds: Array<string>, methodId: string | null, reference?: string, credit = false) {
  const invs = data.invoices.filter((i) => payIds.includes(i.id))
  const option = findOption(methodOptions(invs, data.local, data.wallets, { localTransfer: true }), methodId)
  const plan = credit && data.credit.balance > 0 ? planCredit(invs, data.credit, { crossCcy: data.flags.creditCrossCcy }) : null
  const q = quote(invs, option, plan)
  return {
    modal: {
      kind: 'success' as const,
      result: {
        ids: payIds,
        option: q.legs.length ? option : null,
        legs: q.legs.map((l) => ({ option: l.option, amount: l.amount, ccy: l.ccy })),
        total: q.total,
        ccy: q.ccy,
        creditUsd: plan?.used ?? 0,
        reference,
      },
    },
  }
}

function shortfall(data: FlowData): number {
  const inv = data.invoices.find((i) => i.id === PAYROLL)
  const w = data.wallets.find((x) => x.ccy === data.local)
  if (!inv || !w) return 0
  return round2(inv.lines.reduce((s, l) => s + l.amount, 0) - w.available)
}

const fundDraft = (data: FlowData, step: 'method' | 'amount' | 'review' | 'initiated', requestId?: string): Ui => ({
  ...pay([PAYROLL]),
  modal: {
    kind: 'fund',
    draft: {
      step,
      ccy: data.local ?? 'USD',
      method: 'rail',
      amount: shortfall(data).toFixed(2),
      memo: step === 'method' ? '' : 'Oct payroll top up',
      shortfall: shortfall(data),
      requestId,
    },
  },
})

export const SCENARIOS: Array<GroupDef> = [
  {
    group: 'A · Invoices',
    screens: [
      {
        id: 'A1',
        label: 'A1 Invoices list',
        states: [
          { id: 'fees', label: 'Niural fees tab', config: 'any', ui: () => ({ tab: 'fees' }) },
          { id: 'contracts', label: 'Contracts tab (mixed currencies)', config: 'any', ui: () => ({ tab: 'contracts' }) },
          { id: 'bulk', label: 'Bulk selected → Pay 4 invoices', config: 'any', ui: () => ({ tab: 'fees', selected: ['inv-f02', 'inv-f03', 'inv-f04', PAYROLL] }) },
          {
            id: 'after',
            label: 'After paying (processing / awaiting transfer)',
            prepare: (d) => {
              for (const i of d.invoices) {
                if (['inv-f02', 'inv-f03'].includes(i.id)) i.status = 'processing'
                if (i.id === PAYROLL) i.status = 'awaiting-transfer'
              }
            },
            ui: () => ({ tab: 'fees' }),
          },
        ],
      },
    ],
  },
  {
    group: 'B · Payment screen',
    screens: [
      {
        id: 'B1',
        label: 'B1 Single invoice',
        states: [
          { id: 'local', label: 'Local invoice → local wallet (no FX)', ui: () => pay([MASTER]) },
          { id: 'fx', label: 'NPR contractor → USD wallet (FX)', config: 'any', ui: () => pay(['inv-c01']) },
          { id: 'usd', label: 'USD contractor → USD wallet', config: 'any', ui: () => pay(['inv-c05']) },
          { id: 'usd-only', label: 'USD-only employer (unchanged)', config: 'usd-only', ui: () => pay([PAYROLL]) },
        ],
      },
      {
        id: 'B2',
        label: 'B2 Multiple invoices',
        states: [
          { id: 'same', label: 'Same currency batch (5 fees)', ui: () => pay(FEES_BATCH) },
          { id: 'mixed-local', label: 'Mixed - local currency is largest', ui: ({ local }) => pay(mixedLocal(local)) },
          { id: 'mixed-usd', label: 'Mixed - USD is largest', config: 'any', ui: () => pay(MIXED_USD) },
          { id: 'collapsed', label: 'Mixed - all collapsed', config: 'any', ui: () => pay(MIXED_USD, { collapsed: MIXED_USD }) },
        ],
      },
      {
        id: 'B3',
        label: 'B3 Payment methods',
        states: [
          { id: 'groups-all', label: 'Nothing picked - method groups', config: 'any', ui: () => pay(MIXED_USD) },
          { id: 'wallet-all', label: 'Niural wallet expanded', config: 'any', ui: () => pay(MIXED_USD, { openGroup: 'wallet' }) },
          { id: 'bank', label: 'Bank transfer expanded', config: 'any', ui: () => pay(MIXED_USD, { openGroup: 'bank' }) },
          { id: 'crypto', label: 'Crypto wallet expanded', config: 'any', ui: () => pay(MIXED_USD, { openGroup: 'crypto' }) },
          { id: 'modal-all', label: 'Switcher → Choose payment method modal', config: 'any', ui: () => pay(MIXED_USD, { methodId: 'w-usd', modal: { kind: 'methods' } }) },
          { id: 'modal-local', label: 'Modal - local invoice (wallets only, No FX / FX applies)', ui: () => pay([MASTER], { modal: { kind: 'methods' } }) },
          { id: 'ach', label: 'Bank account selected (ACH)', config: 'any', ui: () => pay(MIXED_USD, { methodId: 'b-chase' }) },
          { id: 'wire', label: 'Wire transfer - verify', config: 'any', ui: () => pay(MIXED_USD, { methodId: 'wire-usd' }) },
          { id: 'wire-ok', label: 'Wire transfer - verified', config: 'any', ui: () => pay(MIXED_USD, { methodId: 'wire-usd', wireVerify: 'verified' }) },
          { id: 'local-transfer', label: 'Local bank transfer (v1.1, on hold)', prepare: withTransfer, ui: ({ local }) => pay([PAYROLL], { methodId: `lt-${(local ?? 'CAD').toLowerCase()}` }) },
        ],
      },
      {
        id: 'B4',
        label: 'B4 Balance states',
        states: [
          { id: 'insufficient', label: 'Insufficient local balance', ui: () => pay([PAYROLL]) },
          { id: 'pending', label: 'Funds pending approval', prepare: (d) => addPending(d, 30_000), ui: () => pay([PAYROLL]) },
          { id: 'from-usd', label: 'Pay local invoice from USD (FX)', ui: () => pay([PAYROLL], { methodId: 'w-usd' }) },
          { id: 'coin-low', label: 'Stablecoin wallet - top up', config: 'any', ui: () => pay(['inv-c03'], { methodId: 'w-usdc-bsc' }) },
        ],
      },
      {
        id: 'B5',
        label: 'B5 Credit (single invoice)',
        states: [
          { id: 'off', label: 'Credit not applied (default)', credit: true, prepare: richLocal, ui: () => pay([PAYROLL]) },
          { id: 'fee-covered', label: 'On - covers the fee, net pay remains', credit: true, prepare: richLocal, ui: () => pay([PAYROLL], ON) },
          { id: 'partial', label: 'On - part of the fee', credit: true, prepare: (d) => setCredit(d, 500), ui: () => pay([MASTER], ON) },
          { id: 'whole', label: 'On - covers everything → Pay with credit', credit: true, ui: () => pay([MASTER], ON) },
          { id: 'edited', label: 'On - amount edited down', credit: true, prepare: richLocal, ui: () => pay([PAYROLL], amount('750')) },
          { id: 'short', label: 'On - wallet still short', credit: true, ui: () => pay([PAYROLL], ON) },
          { id: 'fx', label: 'On - paying from USD (credit first, then FX)', credit: true, prepare: richLocal, ui: () => pay([PAYROLL], { ...ON, methodId: 'w-usd' }) },
          { id: 'usd-only', label: 'USD-only rule (info line)', credit: true, prepare: (d) => { d.flags.creditCrossCcy = false }, ui: () => pay([MASTER]) },
          { id: 'none', label: 'Balance 0 - panel hidden', ui: () => pay([MASTER]) },
        ],
      },
      {
        id: 'B6',
        label: 'B6 Credit (batch)',
        states: [
          { id: 'runs-out', label: 'Auto split runs out (Paid / Part / No credit left)', credit: true, prepare: (d) => setCredit(d, 1_000), ui: () => pay(FEES_BATCH, ON) },
          { id: 'edited', label: 'Amount edited - fills fees by due date', credit: true, prepare: (d) => setCredit(d, 1_000), ui: () => pay(FEES_BATCH, amount('400')) },
          { id: 'over-max', label: 'Amount over the max (error)', credit: true, prepare: (d) => setCredit(d, 1_000), ui: () => pay(FEES_BATCH, amount('1500')) },
          { id: 'multi-ccy', label: 'Fees in USD, GBP and EUR', credit: true, config: 'any', ui: () => pay([...FEES_BATCH, 'inv-f08', 'inv-f09'], ON) },
          { id: 'all-covered', label: 'All fees covered → Pay with credit', credit: true, prepare: (d) => setCredit(d, 5_000), ui: () => pay(FEES_BATCH, ON) },
          { id: 'mixed-ccy', label: 'Mixed currencies - one wallet row each', credit: true, prepare: richLocal, ui: () => pay([PAYROLL, 'inv-c14'], ON) },
          { id: 'contractors', label: 'Contractors never offset (convert-all)', credit: true, config: 'any', ui: () => pay(['inv-c01', 'inv-f02', 'inv-f04'], ON) },
          { id: 'no-panel', label: 'Breakdown card off (experiment)', credit: true, prepare: (d) => { setCredit(d, 1_000); d.flags.summaryPanel = false }, ui: () => pay(FEES_BATCH, ON) },
        ],
      },
    ],
  },
  {
    group: 'C · Confirm & result',
    screens: [
      {
        id: 'C1',
        label: 'C1 Confirmation',
        states: [
          { id: 'wallet', label: 'Local wallet', ui: () => pay([MASTER], { modal: { kind: 'confirm' } }) },
          { id: 'fx', label: 'USD wallet with FX', ui: () => pay([PAYROLL], { methodId: 'w-usd', modal: { kind: 'confirm' } }) },
          { id: 'ach', label: 'Bank account (ACH mandate)', config: 'any', ui: () => pay(MIXED_USD, { methodId: 'b-chase', modal: { kind: 'confirm' } }) },
          { id: 'transfer', label: 'Local bank transfer (v1.1)', prepare: withTransfer, ui: ({ local }) => pay([PAYROLL], { methodId: `lt-${(local ?? 'CAD').toLowerCase()}`, modal: { kind: 'confirm' } }) },
          { id: 'credit', label: 'Wallet + credit', credit: true, ui: () => pay([PAYROLL], { creditOn: true, modal: { kind: 'confirm' } }) },
          { id: 'credit-only', label: 'Pay with credit', credit: true, ui: () => pay([MASTER], { creditOn: true, modal: { kind: 'confirm' } }) },
        ],
      },
      {
        id: 'C2',
        label: 'C2 Result',
        states: [
          { id: 'submitted', label: 'Payment submitted (wallet)', ui: ({ data, local }) => pay(FEES_BATCH, resultFor(data, FEES_BATCH, localWallet(local))) },
          { id: 'awaiting', label: 'Send your transfer (reference)', ui: ({ data, local }) => pay([PAYROLL], resultFor(data, [PAYROLL], `lt-${(local ?? 'CAD').toLowerCase()}`, 'NRLX4P9TQ2MB')) },
          { id: 'ach', label: 'ACH submitted', config: 'any', ui: ({ data }) => pay(MIXED_USD, resultFor(data, MIXED_USD, 'b-chase')) },
          { id: 'credit', label: 'Paid from wallet + credit', credit: true, prepare: richLocal, ui: ({ data, local }) => pay([PAYROLL], resultFor(data, [PAYROLL], localWallet(local), undefined, true)) },
          { id: 'credit-only', label: 'Paid with credit only', credit: true, ui: ({ data }) => pay([MASTER], resultFor(data, [MASTER], null, undefined, true)) },
          { id: 'failed', label: 'Payment failed - nothing moved', credit: true, prepare: richLocal, ui: () => pay([PAYROLL], { payFailed: true }) },
        ],
      },
    ],
  },
  {
    group: 'D · Fund wallet',
    screens: [
      {
        id: 'D1',
        label: 'D1 Currency + method',
        states: [
          { id: 'local', label: 'Local currency (single rail)', ui: ({ data }) => fundDraft(data, 'method') },
          {
            id: 'usd',
            label: 'USD (wire or ACH)',
            ui: ({ data }) => ({ ...fundDraft(data, 'method'), modal: { kind: 'fund', draft: { step: 'method', ccy: 'USD', method: 'rail', amount: '', memo: '' } } }),
          },
        ],
      },
      { id: 'D2', label: 'D2 Amount (prefilled shortfall)', states: [{ id: 'default', label: 'Shortfall prefilled', ui: ({ data }) => fundDraft(data, 'amount') }] },
      { id: 'D3', label: 'D3 Review + recipient details', states: [{ id: 'default', label: 'Currency-specific fields', ui: ({ data }) => fundDraft(data, 'review') }] },
      {
        id: 'D4',
        label: 'D4 Fund initiated',
        states: [
          {
            id: 'default',
            label: 'Reference + amount to send',
            prepare: (d) => addPending(d, 24_700),
            ui: ({ data }) => fundDraft(data, 'initiated', 'fr-150'),
          },
        ],
      },
    ],
  },
  {
    group: 'E · Wallet page',
    screens: [
      {
        id: 'E1',
        label: 'E1 Wallet balances',
        states: [
          { id: 'usd', label: 'USD (Primary, banners)', ui: () => ({ screen: 'wallet', walletCcy: 'USD' }) },
          { id: 'local', label: 'Local wallet', ui: ({ local }) => ({ screen: 'wallet', walletCcy: local ?? 'CAD' }) },
          { id: 'pending', label: 'Local wallet - pending top-up', prepare: (d) => addPending(d, 30_000), ui: ({ local }) => ({ screen: 'wallet', walletCcy: local ?? 'CAD' }) },
          {
            id: 'new',
            label: 'Local wallet - just enabled (zero)',
            prepare: (d) => {
              const w = d.wallets.find((x) => x.ccy === d.local)
              if (w) w.available = 0
              d.txs = d.txs.filter((t) => t.ccy !== d.local)
            },
            ui: ({ local }) => ({ screen: 'wallet', walletCcy: local ?? 'CAD' }),
          },
          { id: 'usd-only', label: 'USD-only employer (unchanged)', config: 'usd-only', ui: () => ({ screen: 'wallet', walletCcy: 'USD' }) },
        ],
      },
    ],
  },
  {
    group: 'F · Admin',
    screens: [
      {
        id: 'F1',
        label: 'F1 Funding requests',
        states: [
          { id: 'queue', label: 'Pending queue (all currencies)', prepare: (d) => addPending(d, 30_000), admin: { ccy: 'All' } },
          { id: 'local', label: 'Filtered to local currency', prepare: (d) => addPending(d, 30_000), admin: {} },
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

export function findState(screenId: string, stateId: string): StateDef {
  for (const g of SCENARIOS) {
    for (const s of g.screens) {
      if (s.id !== screenId) continue
      return s.states.find((x) => x.id === stateId) ?? s.states[0]
    }
  }
  return SCENARIOS[0].screens[0].states[0]
}

export function resolveLocal(def: StateDef, global: EmployerLocal): EmployerLocal {
  const mode = def.config ?? 'local'
  if (mode === 'usd-only') return null
  if (mode === 'any') return global
  return global ?? 'CAD'
}
