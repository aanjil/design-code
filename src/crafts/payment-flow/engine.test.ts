import { describe, expect, it } from 'vitest'
import {
  convert,
  defaultOptionId,
  findOption,
  floor2,
  fmtLegs,
  isLocalMode,
  makeReference,
  autoSplit,
  creditMax,
  methodOptions,
  parseAmount,
  planCredit,
  planFromAlloc,
  quote,
  quoteSplit,
  rate,
  round2,
  splitWallets,
} from './engine'
import type { Invoice } from '@/mocks/payment-flow'
import { seedInvoices, seedWallets } from '@/mocks/payment-flow'

const byIds = (local: 'CAD' | null, ids: Array<string>) => seedInvoices(local).filter((i) => ids.includes(i.id))

describe('payment engine', () => {
  it('converts at the mock mid-market rate (matches today: NPR 200 → USD 1.34)', () => {
    expect(convert(200, 'NPR', 'USD')).toBe(1.34)
    expect(convert(100, 'USD', 'USD')).toBe(100)
  })

  it('local invoices default to the matching wallet, no FX, local mode hides bank/crypto/wire', () => {
    const invs = byIds('CAD', ['inv-f03'])
    const wallets = seedWallets('CAD')
    expect(isLocalMode(invs, 'CAD')).toBe(true)
    expect(defaultOptionId(invs, wallets)).toBe('w-cad')
    const groups = methodOptions(invs, 'CAD', wallets)
    expect(groups.bank).toHaveLength(0)
    expect(groups.wire).toHaveLength(0)
    // P2: wallets only - matching first, then USD, no stablecoins; bank transfer on hold
    expect(groups.wallet.map((o) => o.id)).toEqual(['w-cad', 'w-usd'])
    expect(groups['local-transfer']).toHaveLength(0)
    expect(methodOptions(invs, 'CAD', wallets, { localTransfer: true })['local-transfer'][0].label).toBe('Wire transfer')
    const q = quote(invs, findOption(groups, 'w-cad')!)
    expect(q.fxCount).toBe(0)
    expect(q.fxPairs).toHaveLength(0)
  })

  it('mixed batch defaults to the largest-share wallet and converts the rest', () => {
    const invs = byIds('CAD', ['inv-c05', 'inv-c08', 'inv-c02', 'inv-c01'])
    const wallets = seedWallets('CAD')
    expect(defaultOptionId(invs, wallets)).toBe('w-usd')
    const q = quote(invs, findOption(methodOptions(invs, 'CAD', wallets), 'w-usd')!)
    expect(q.fxCount).toBe(3)
    expect(q.fxPairs.map((p) => p.from)).toEqual(['CAD', 'PLN', 'NPR'])
    expect(q.total).toBe(23_267.23)
  })

  it('pending balance never counts toward payment', () => {
    const invs = byIds('CAD', ['inv-f01'])
    const wallets = seedWallets('CAD').map((w) => (w.ccy === 'CAD' ? { ...w, pending: 30_000 } : w))
    const q = quote(invs, findOption(methodOptions(invs, 'CAD', wallets), 'w-cad')!)
    expect(q.total).toBe(43_100)
    expect(q.sufficient).toBe(false)
    expect(q.shortfall).toBe(24_700)
    expect(q.coveredByPending).toBe(true)
  })

  it('wire adds the fee on top', () => {
    const invs = byIds(null, ['inv-c05'])
    const q = quote(invs, findOption(methodOptions(invs, null, seedWallets(null)), 'wire-usd')!)
    expect(q.total).toBe(15_020)
  })

  it('references fit the Faster Payments 18-char limit', () => {
    for (let i = 0; i < 50; i++) expect(makeReference(i).length).toBeLessThanOrEqual(18)
  })
})

describe('credits (spec: apply credit in the payment flow)', () => {
  const credit = (balance: number) => ({ balance, expiresOn: null })
  const rules = { crossCcy: true }
  const fee = (id: string, ccy: 'CAD' | 'GBP' | 'USD', amount: number, dueDate: string): Invoice => ({
    id,
    tab: 'fees',
    kind: 'niural-pay',
    dueDate,
    periodDate: dueDate,
    name: id,
    description: 'Niural fee',
    ccy,
    lines: [{ label: 'Niural platform fee', amount }],
    status: 'pending',
  })
  const three = [
    fee('a', 'CAD', 1_850, '2026-10-31'),
    fee('b', 'CAD', 1_850, '2026-11-14'),
    fee('c', 'GBP', 1_350, '2026-11-14'),
  ]

  it('auto split: paid by credit / part of fee / no credit left, nothing left over', () => {
    const plan = planCredit(three, credit(2_000), rules)
    expect(plan.shares.map((x) => x.tag)).toEqual(['full', 'part', 'none'])
    const r = rate('USD', 'CAD')
    // 1 USD = 1.3924 CAD in the mock (the spec example uses 1.3704 → CAD 890.80)
    expect(plan.shares[1].applied).toBe(floor2((2_000 - 1_850 / r) * r))
    // credit rounds down, so up to one cent can stay unused
    expect(plan.left).toBeLessThanOrEqual(0.01)
    expect(plan.invalid).toBe(false)
  })

  it('offsets only Niural fee lines - never net pay or statutory', () => {
    const invs = byIds('CAD', ['inv-f01'])
    const plan = planCredit(invs, credit(10_000), rules)
    expect(plan.shares[0].applied).toBe(1_850)
    const q = quote(invs, findOption(methodOptions(invs, 'CAD', seedWallets('CAD')), 'w-cad')!, plan)
    expect(q.amountDue).toBe(43_100 - 1_850)
  })

  it('manual: accepts 1,900 and 1900, empty = 0, junk and over-fee error', () => {
    expect(parseAmount('1,900')).toBe(1_900)
    expect(parseAmount('1900')).toBe(1_900)
    expect(parseAmount('')).toBe(0)
    const plan = planFromAlloc(three, credit(2_000), rules, { a: 'abc', b: '1,900', c: '' })
    expect(plan.shares[0].error).toBe('Enter an amount')
    expect(plan.shares[1].error).toBe('Max CAD 1,850.00')
    expect(plan.invalid).toBe(true)
  })

  it('manual: going over the balance is flagged with the overage', () => {
    const plan = planFromAlloc(three, credit(2_000), rules, { a: '1850', b: '1850', c: '0' })
    expect(plan.over).toBeGreaterThan(0)
    expect(plan.invalid).toBe(true)
  })

  it('creditMax: the balance, or every eligible fee converted to USD if smaller', () => {
    expect(creditMax(three, credit(2_000).balance, rules)).toBe(2_000)
    const need = 1_850 / rate('USD', 'CAD') + 1_850 / rate('USD', 'CAD') + 1_350 / rate('USD', 'GBP')
    expect(creditMax(three, 100_000, rules)).toBe(round2(need))
  })

  it('applying exactly creditMax covers every fee in full, across currencies', () => {
    const max = creditMax(three, 100_000, rules)
    const plan = planFromAlloc(three, credit(100_000), rules, autoSplit(three, max, rules))
    expect(plan.shares.map((x) => x.tag)).toEqual(['full', 'full', 'full'])
  })

  it('a smaller typed amount fills fees by due date and stops', () => {
    const plan = planFromAlloc(three, credit(2_000), rules, autoSplit(three, 500, rules))
    expect(plan.shares.map((x) => x.tag)).toEqual(['part', 'none', 'none'])
    expect(plan.used).toBeLessThanOrEqual(500)
  })

  it('credit covering everything leaves no legs to pay', () => {
    const invs = byIds('CAD', ['inv-f03'])
    const q = quote(invs, null, planCredit(invs, credit(5_000), rules))
    expect(q.legs).toHaveLength(0)
    expect(q.sufficient).toBe(true)
  })

  it('mixed currencies with matching wallets pay one leg per currency', () => {
    const invs = byIds('CAD', ['inv-f01', 'inv-c14'])
    const wallets = splitWallets(invs, seedWallets('CAD'))!
    const q = quoteSplit(invs, wallets, null)
    expect(q.legs.map((l) => l.ccy).sort()).toEqual(['CAD', 'USD'])
    expect(fmtLegs(q.legs, 'USD')).toContain(' + ')
  })

  it('USD-only rule leaves local fees untouched', () => {
    const plan = planCredit(byIds('CAD', ['inv-f03']), credit(2_000), { crossCcy: false })
    expect(plan.eligible).toBe(0)
    expect(plan.blockedLocal).toBe(true)
  })

  it('pay is atomic: a failure moves nothing', async () => {
    const { createFlowStore } = await import('./store')
    const s = createFlowStore('CAD')
    s.mutate((d) => {
      d.flags.failNextPayment = true
    })
    const d = s.get()
    const invs = d.invoices.filter((i) => i.id === 'inv-f03')
    const opt = findOption(methodOptions(invs, 'CAD', d.wallets), 'w-cad')!
    const q = quote(invs, opt, planCredit(invs, credit(500), rules))
    const cad = () => s.get().wallets.find((w) => w.ccy === 'CAD')!.available
    const before = cad()
    expect(s.pay(['inv-f03'], opt, q).ok).toBe(false)
    expect(s.get().credit.balance).toBe(2_000)
    expect(cad()).toBe(before)
    expect(s.get().invoices.find((i) => i.id === 'inv-f03')!.status).toBe('pending')
    expect(s.pay(['inv-f03'], opt, q).ok).toBe(true)
    expect(cad()).toBe(before - q.legs[0].amount)
    expect(s.get().creditLedger[0].note).toBe('Applied to Niural fee · INV-F03')
  })
})

describe('live store loop', () => {
  it('fund → pending (not payable) → admin approve → available → pay debits wallet', async () => {
    const { createFlowStore } = await import('./store')
    const s = createFlowStore('CAD')
    const pick = () => {
      const d = s.get()
      const invs = d.invoices.filter((i) => i.id === 'inv-f01')
      const opt = findOption(methodOptions(invs, 'CAD', d.wallets), 'w-cad')!
      return { invs, opt, q: quote(invs, opt) }
    }
    expect(pick().q.sufficient).toBe(false)
    const req = s.fund({ ccy: 'CAD', amount: 24_700, fee: 20, method: 'Wire' })
    expect(pick().q.sufficient).toBe(false)
    expect(pick().q.coveredByPending).toBe(true)
    s.approve(req.id)
    const { invs, opt, q } = pick()
    expect(q.sufficient).toBe(true)
    s.pay(invs.map((i) => i.id), opt, q)
    const after = s.get()
    expect(after.wallets.find((w) => w.ccy === 'CAD')!.available).toBe(0)
    expect(after.invoices.find((i) => i.id === 'inv-f01')!.status).toBe('processing')
  })
})

describe('mock controls', () => {
  it('time machine settles wallet payments after 1 day and ACH after 3', async () => {
    const { createFlowStore } = await import('./store')
    const s = createFlowStore('CAD')
    const d = s.get()
    const invs = d.invoices.filter((i) => i.id === 'inv-f03')
    const opt = findOption(methodOptions(invs, 'CAD', d.wallets), 'w-cad')!
    s.pay(['inv-f03'], opt, quote(invs, opt))
    expect(s.travel('2026-10-13')).toBe(0)
    expect(s.travel('2026-10-14')).toBe(1)
    expect(s.get().invoices.find((i) => i.id === 'inv-f03')!.status).toBe('paid')
  })

  it('datasets are deterministic and keep shape relative to today', async () => {
    const { seedInvoices } = await import('@/mocks/payment-flow')
    expect(seedInvoices('CAD', 'heavy').length).toBe(seedInvoices('CAD').length + 60)
    expect(seedInvoices('CAD', 'heavy')).toEqual(seedInvoices('CAD', 'heavy'))
    expect(seedInvoices('CAD', 'empty')).toHaveLength(0)
    expect(seedInvoices('CAD', 'overdue').every((i) => i.dueDate < '2026-10-13')).toBe(true)
    const shifted = seedInvoices('CAD', 'realistic', '2026-11-13')
    expect(shifted.find((i) => i.id === 'inv-f01')!.dueDate).toBe('2026-11-20')
  })
})
