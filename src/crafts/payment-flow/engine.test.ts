import { describe, expect, it } from 'vitest'
import { convert, defaultOptionId, findOption, isLocalMode, makeReference, methodOptions, quote } from './engine'
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
    expect(groups['local-transfer'][0].label).toBe('Wire transfer')
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
