/**
 * Selections as the Bezel reads them - pure data, computed from the rows the
 * user actually ticked (never authored). Each kind gives: the row as a chip,
 * the facets compared for "what they share", a formatted total, and the
 * grain Emma answers with when the rows travel into the copilot as context.
 * Pages add the actions (they own the flows), see crafts/bezel/selection.tsx.
 */

import type { Employee } from './employees'
import { fmtCompensation } from './employees'
import type { Invoice, WalletSeed } from './payment-flow'
import { USD_PER, fmt, fmtDate } from './payment-flow'
import type { GrainProps } from '@/components/nds/grain/grain'
import type { BezelRow } from '@/crafts/bezel/selection'
import { describeShared, rowsAsFacts } from '@/crafts/bezel/selection'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function median(nums: Array<number>): number {
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000)
}

/* ---------------- employees ---------------- */

/** Annual cost in USD - hourly at 2,080 h/yr. */
export const annualCost = (e: Employee) => (e.compensationType === 'Salary' ? e.compensation : e.compensation * 2080)
const usdYear = (n: number) => `$${Math.round(n).toLocaleString('en-US')}/yr`

export function employeeRow(e: Employee): BezelRow {
  return {
    id: e.id,
    label: `${e.name} · ${e.jobTitle}`,
    value: fmtCompensation(e),
    // Most telling shared trait first - status is last because most rows are active.
    facets: { title: e.jobTitle, location: e.workLocation, type: e.employeeType, status: e.status },
  }
}

export function employeesSummary(rows: Array<Employee>) {
  return {
    total: usdYear(rows.reduce((n, e) => n + annualCost(e), 0)),
    note: describeShared(rows.map(employeeRow), 'person', {
      status: (v) => `are ${v}`,
      title: (v) => `are ${v}s - same role, comparable pay`,
      type: (v) => `are ${v}`,
      location: (v) => `work ${v.startsWith('Remote') ? v : `in ${v}`}`,
    }),
  }
}

export function employeesAnswer(rows: Array<Employee>, all: Array<Employee>): GrainProps {
  const n = rows.length
  const titles = new Set(rows.map((e) => e.jobTitle))
  const costs = rows.map(annualCost)
  const total = costs.reduce((a, b) => a + b, 0)
  if (titles.size === 1 && n > 1) {
    const title = [...titles][0]
    const role = all.filter((e) => e.jobTitle === title).map(annualCost)
    const ratio = Math.max(...costs) / Math.min(...costs)
    return {
      claim: `${n} ${title}s, ${ratio.toFixed(1)}x apart in pay`,
      confidence: ratio > 1.6 ? 0.71 : 0.84,
      facts: [...rowsAsFacts(rows.map(employeeRow), 5), { label: `Role median (${title}, all ${role.length})`, value: usdYear(median(role)), tone: 'muted' }],
      provenance: `from the ${n} rows you attached · compared against every ${title}`,
    }
  }
  const types = new Map<string, number>()
  for (const e of rows) types.set(e.employeeType, (types.get(e.employeeType) ?? 0) + 1)
  const [topType, topCount] = [...types.entries()].sort((a, b) => b[1] - a[1])[0]
  const oldest = [...rows].sort((a, b) => a.hireDate.localeCompare(b.hireDate))[0]
  return {
    claim: `${plural(n, 'person', 'people')} cost ${usdYear(total)} - ${topCount} of ${n} are ${topType}`,
    confidence: 0.78,
    facts: [
      ...rowsAsFacts(rows.map(employeeRow), 5),
      { label: `Longest tenure · ${oldest.name}`, value: `since ${oldest.hireDate.slice(0, 4)}`, tone: 'muted' },
    ],
    provenance: `from the ${n} rows you attached`,
  }
}

/* ---------------- invoices ---------------- */

const KIND_LABEL: Record<Invoice['kind'], string> = {
  contractor: 'contractor invoices',
  'niural-pay': 'Niural Pay invoices',
  master: 'Niural fees',
  payroll: 'payroll funding',
  'cm-fee': 'contract management fees',
  'eor-fee': 'EOR fees',
}

export const invoiceTotal = (i: Invoice) => i.lines.reduce((n, l) => n + l.amount, 0)
export const invoiceUsd = (i: Invoice) => invoiceTotal(i) * USD_PER[i.ccy]

export function invoiceRow(i: Invoice, today: string): BezelRow {
  const late = i.dueDate < today
  return {
    id: i.id,
    label: `${i.person ?? i.name} · due ${fmtDate(i.dueDate)}`,
    value: fmt(invoiceTotal(i), i.ccy),
    facets: {
      timing: late ? 'past due' : daysBetween(today, i.dueDate) <= 7 ? 'due this week' : 'due later',
      kind: KIND_LABEL[i.kind],
      ccy: i.ccy,
    },
  }
}

export function invoicesSummary(rows: Array<Invoice>, today: string) {
  const usd = rows.reduce((n, i) => n + invoiceUsd(i), 0)
  const ccys = new Set(rows.map((i) => i.ccy))
  return {
    total: ccys.size === 1 ? fmt(rows.reduce((n, i) => n + invoiceTotal(i), 0), [...ccys][0]) : `≈ ${fmt(usd, 'USD')}`,
    note: describeShared(rows.map((i) => invoiceRow(i, today)), 'invoice', {
      timing: (v) => `are ${v}`,
      kind: (v) => `are ${v}`,
      ccy: (v) => `are in ${v} - one rail, one fee`,
    }),
  }
}

export function invoicesAnswer(
  rows: Array<Invoice>,
  world: { today: string; wallets: Array<WalletSeed> },
  onPay: () => void,
): GrainProps {
  const n = rows.length
  const usd = rows.reduce((t, i) => t + invoiceUsd(i), 0)
  const late = rows.filter((i) => i.dueDate < world.today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const ccys = new Set(rows.map((i) => i.ccy))
  const usdWallet = world.wallets.find((w) => w.ccy === 'USD')?.available ?? 0
  const covers = usdWallet >= usd
  const claim = late.length
    ? `${late.length === n ? (n === 1 ? 'It is' : n === 2 ? 'Both are' : `All ${n} are`) : `${late.length} of these ${n} ${late.length === 1 ? 'is' : 'are'}`} past due - the oldest by ${plural(daysBetween(late[0].dueDate, world.today), 'day')}`
    : `None of these ${n} are late yet - the first falls due ${fmtDate([...rows].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate)}`
  return {
    claim,
    confidence: covers ? 0.88 : 0.66,
    facts: [
      ...rowsAsFacts(rows.map((i) => invoiceRow(i, world.today)), 4),
      { label: `Total, converted to USD (${plural(ccys.size, 'currency', 'currencies')})`, value: fmt(usd, 'USD') },
      { label: 'USD wallet covers it', value: covers ? 'Yes' : `No - short ${fmt(usd - usdWallet, 'USD')}`, tone: covers ? 'muted' : undefined },
    ],
    provenance: `from the ${n} invoices you attached · today's mock FX`,
    exits: [{ label: `Pay these ${n}`, variant: 'primary', onSelect: onPay }],
  }
}
