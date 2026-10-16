/**
 * Payment Flow mocks - invoices, wallets, payment methods, FX rates, fees
 * and collection accounts for the invoice payment + local currency wallet
 * (CAD / GBP / EUR) craft. Deterministic: the same employer config always
 * seeds the same world. WORLD_TODAY pins every "overdue by N days".
 */

export const WORLD_TODAY = '2026-10-13'

/* ---------------- currencies ---------------- */

export type LocalCcy = 'CAD' | 'GBP' | 'EUR'
export type Stablecoin = 'USDC' | 'USDT' | 'DAI'
export type Ccy = 'USD' | LocalCcy | Stablecoin | 'NPR' | 'PLN' | 'PHP' | 'INR' | 'MXN'

/** Mid-market rate: 1 unit of the currency = N USD (mock, frozen). */
export const USD_PER: Record<Ccy, number> = {
  USD: 1,
  CAD: 0.7182,
  GBP: 1.2674,
  EUR: 1.0842,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  NPR: 0.0067,
  PLN: 0.2531,
  PHP: 0.01712,
  INR: 0.01189,
  MXN: 0.0551,
}

export const CCY_NAME: Record<Ccy, string> = {
  USD: 'US Dollar',
  CAD: 'Canadian Dollar',
  GBP: 'British Pound',
  EUR: 'Euro',
  USDC: 'USDC',
  USDT: 'USDT',
  DAI: 'DAI',
  NPR: 'Nepalese Rupee',
  PLN: 'Polish Zloty',
  PHP: 'Philippine Peso',
  INR: 'Indian Rupee',
  MXN: 'Mexican Peso',
}

export const CCY_FLAG: Partial<Record<Ccy, string>> = {
  USD: '🇺🇸',
  CAD: '🇨🇦',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  NPR: '🇳🇵',
  PLN: '🇵🇱',
  PHP: '🇵🇭',
  INR: '🇮🇳',
  MXN: '🇲🇽',
}

export const LOCAL_COUNTRY: Record<LocalCcy, string> = {
  CAD: 'Canada',
  GBP: 'UK',
  EUR: 'Germany',
}

/* ---------------- employer configuration (PRD F1.1) ---------------- */

/** null = default USD-only employer (sees no change anywhere). */
export type EmployerLocal = LocalCcy | null

export const EMPLOYER = { name: 'Anjil Crafts', short: 'Anjil Crafts' }

/* ---------------- fees (config, never hardcoded in copy) ---------------- */

/** Funding / transfer fee per local rail - PRD: CAD 20, GBP 15 (+ EUR 10). */
export const LOCAL_RAIL: Record<
  LocalCcy,
  { method: string; methodShort: string; fee: number; bank: string; instruction: string }
> = {
  CAD: {
    method: 'Wire transfer',
    methodShort: 'Wire',
    fee: 20,
    bank: 'TD Bank',
    instruction:
      'Send this by wire from your bank. Add the reference to your transfer so we can match your payment.',
  },
  GBP: {
    method: 'Faster Payments',
    methodShort: 'Faster Payments',
    fee: 15,
    bank: 'Revolut',
    instruction:
      'Send this by Faster Payments from a UK bank account. Add the reference to your transfer so we can match your payment.',
  },
  EUR: {
    method: 'SEPA transfer',
    methodShort: 'SEPA',
    fee: 10,
    bank: 'Revolut',
    instruction:
      'Send this by SEPA transfer from a bank in the euro area. Add the reference to your transfer so we can match your payment.',
  },
}

export const USD_WIRE_FEE = 20
export const CRYPTO_NETWORK_FEE = 1.5

/* ---------------- collection accounts (recipient details) ---------------- */

export type RecipientField = [label: string, value: string]

/** Field set differs per currency - not the USD set with new values (F2.2). */
export const COLLECTION_ACCOUNT: Record<'USD' | LocalCcy, Array<RecipientField>> = {
  USD: [
    ['Bank name', 'i3 Bank'],
    ['Bank address', '12212 North 156th St., Bennington, NE 68007, USA'],
    ['Recipient name', 'Niural Inc.'],
    ['Account number', '1005159094'],
    ['Routing number', '812345678'],
    ['SWIFT code', 'ITHRUS33'],
  ],
  CAD: [
    ['Bank name', 'TD Bank'],
    ['Bank address', '66 Wellington St W, Toronto, ON M5K 1A2, Canada'],
    ['Account name', 'Niural Canada Inc.'],
    ['Account number', '5219 4402 118'],
    ['Institution number', '004'],
    ['Transit number', '10202'],
    ['SWIFT code', 'TDOMCATTTOR'],
  ],
  GBP: [
    ['Bank name', 'Revolut'],
    ['Bank address', '30 South Colonnade, London E14 5HX, UK'],
    ['Account name', 'Niural UK Ltd'],
    ['Account number', '48210937'],
    ['Sort code', '04-00-75'],
  ],
  EUR: [
    ['Bank name', 'Revolut Bank UAB'],
    ['Bank address', 'Konstitucijos ave. 21B, 08130 Vilnius, Lithuania'],
    ['Account name', 'Niural Europe B.V.'],
    ['IBAN', 'LT21 3250 0412 8873 2190'],
    ['BIC', 'REVOLT21'],
  ],
}

/* ---------------- wallets ---------------- */

export interface WalletSeed {
  id: string
  ccy: Ccy
  /** Network label for stablecoins, e.g. "Ethereum". */
  network?: string
  available: number
  pending: number
  primary?: boolean
}

const LOCAL_BALANCE: Record<LocalCcy, number> = {
  CAD: 18_400,
  GBP: 9_250,
  EUR: 12_800,
}

export function seedWallets(local: EmployerLocal): Array<WalletSeed> {
  const wallets: Array<WalletSeed> = [
    { id: 'w-usd', ccy: 'USD', available: 179_676.47, pending: 0, primary: true },
  ]
  if (local) wallets.push({ id: `w-${local.toLowerCase()}`, ccy: local, available: LOCAL_BALANCE[local], pending: 0 })
  wallets.push(
    { id: 'w-usdc-eth', ccy: 'USDC', network: 'Ethereum', available: 12_500, pending: 0 },
    { id: 'w-usdt-poly', ccy: 'USDT', network: 'Polygon', available: 0, pending: 0 },
    { id: 'w-dai-eth', ccy: 'DAI', network: 'Ethereum', available: 0, pending: 0 },
    { id: 'w-usdc-bsc', ccy: 'USDC', network: 'Bsc', available: 0, pending: 0 },
  )
  return wallets
}

/* ---------------- connected bank accounts (USD / ACH) ---------------- */

export interface BankAccountSeed {
  id: string
  name: string
  last4: string
  primary?: boolean
}

export const BANK_ACCOUNTS: Array<BankAccountSeed> = [
  { id: 'b-chase', name: 'Chase Bank', last4: '3210', primary: true },
  { id: 'b-rupak', name: 'Rupak Investment Bank', last4: '8904' },
  { id: 'b-usbank', name: 'U.S. Bank', last4: '1111' },
]

/* ---------------- invoices ---------------- */

export type InvoiceTab = 'contracts' | 'fees'
export type InvoiceKind = 'contractor' | 'niural-pay' | 'master' | 'payroll' | 'cm-fee' | 'eor-fee'
export type InvoiceStatus = 'pending' | 'processing' | 'awaiting-transfer' | 'paid'

export interface InvoiceLine {
  label: string
  amount: number
}

export interface Invoice {
  id: string
  tab: InvoiceTab
  kind: InvoiceKind
  dueDate: string
  /** Line-item date shown on the payment screen (service period end). */
  periodDate: string
  name: string
  /** Contractor / employee shown as a pill on the payment screen. */
  person?: string
  role?: string
  description: string
  ccy: Ccy
  lines: Array<InvoiceLine>
  status: InvoiceStatus
  /** Processing → paid on this date (time machine settles it). */
  settleOn?: string
  paidOn?: string
}

const c = (
  id: string,
  dueDate: string,
  person: string,
  role: string,
  description: string,
  ccy: Ccy,
  amount: number,
  periodDate = dueDate,
): Invoice => ({
  id,
  tab: 'contracts',
  kind: 'contractor',
  dueDate,
  periodDate,
  name: `${person.split(' ')[0]} - ${role}`,
  person,
  role,
  description,
  ccy,
  lines: [{ label: fmtLineDate(periodDate), amount }],
  status: 'pending',
})

function fmtLineDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

/** Contractor invoices are billed in the contract currency - unaffected by
 *  the employer's local wallet config. */
const CONTRACTOR_INVOICES: Array<Invoice> = [
  c('inv-c01', '2026-08-04', 'Ram Sharma', 'Product Designer', 'Payments - Aug 01, 2026 - Aug 31, 2026', 'NPR', 200, '2026-08-10'),
  c('inv-c02', '2026-08-12', 'Fernando Touma', 'Data Engineer', 'Payment On Demand', 'PLN', 4_850),
  c('inv-c03', '2026-08-25', 'David Contractor', 'Smart Contract Auditor', 'Payments - Aug 01, 2026 - Aug 31, 2026', 'USDC', 1_000),
  c('inv-c04', '2026-08-25', 'Andreas Eriksen', 'DevOps Engineer', 'Payments - Aug 01, 2026 - Aug 31, 2026', 'USDT', 5_000),
  c('inv-c05', '2026-08-31', 'David Maley', 'Engineering Manager', 'Payments - Aug 02, 2026 - Sep 01, 2026', 'USD', 15_000),
  c('inv-c06', '2026-09-03', 'Ram Sharma', 'Product Designer', 'Payments - Sep 01, 2026 - Sep 30, 2026', 'NPR', 200, '2026-09-10'),
  c('inv-c07', '2026-09-04', 'Maria Santos', 'Customer Success Lead', 'Payments - Sep 01, 2026 - Sep 30, 2026', 'PHP', 142_000),
  c('inv-c08', '2026-09-15', 'Liam Tremblay', 'Backend Engineer', 'Payments - Sep 01, 2026 - Sep 30, 2026', 'CAD', 9_800),
  c('inv-c09', '2026-09-20', 'Priya Nair', 'QA Engineer', 'Payments - Sep 01, 2026 - Sep 30, 2026', 'INR', 285_000),
  c('inv-c10', '2026-09-30', 'Sofia Herrera', 'Brand Designer', 'Payments - Sep 01, 2026 - Sep 30, 2026', 'MXN', 61_500),
  c('inv-c11', '2026-10-05', 'Ram Sharma', 'Product Designer', 'Payments - Oct 01, 2026 - Oct 31, 2026', 'NPR', 200, '2026-10-09'),
  c('inv-c12', '2026-10-10', 'Oliver Bennett', 'Content Strategist', 'Payments - Oct 01, 2026 - Oct 31, 2026', 'GBP', 3_400),
  c('inv-c13', '2026-10-15', 'Emma Fischer', 'Frontend Engineer', 'Payments - Oct 01, 2026 - Oct 31, 2026', 'EUR', 6_200),
  c('inv-c14', '2026-10-18', 'Noah Kim', 'ML Engineer', 'Payments - Oct 01, 2026 - Oct 31, 2026', 'USD', 12_750),
]

/** Round a converted fee to a clean billing number. */
function bill(usd: number, ccy: Ccy): number {
  const v = usd / USD_PER[ccy]
  return v >= 1000 ? Math.round(v / 5) * 5 : Math.round(v)
}

/**
 * Niural-billed invoices (fees + payroll funding). PRD F4.1: for a local
 * currency employer these are billed in CAD / GBP / EUR; for a USD-only
 * employer they stay in USD exactly as today.
 */
function niuralInvoices(local: EmployerLocal): Array<Invoice> {
  const ccy: Ccy = local ?? 'USD'
  const amt = (usd: number) => (local ? bill(usd, local) : usd)
  const cm = (id: string, due: string, person: string, usd: number): Invoice => ({
    id,
    tab: 'fees',
    kind: 'cm-fee',
    dueDate: due,
    periodDate: due,
    name: person,
    person,
    description: 'Contract Management fees',
    ccy,
    lines: [{ label: 'Contract management fee', amount: amt(usd) }],
    status: 'pending',
  })

  const payroll: Invoice = local
    ? {
        id: 'inv-f01',
        tab: 'fees',
        kind: 'payroll',
        dueDate: '2026-10-20',
        periodDate: '2026-10-31',
        name: `${LOCAL_COUNTRY[local]} payroll funding`,
        description: `${LOCAL_COUNTRY[local]} payroll - Oct 2026`,
        ccy,
        lines: {
          CAD: [
            { label: 'Net pay', amount: 33_960 },
            { label: 'Statutory deductions (CPP, EI, tax)', amount: 7_290 },
            { label: 'Niural platform fee', amount: 1_850 },
          ],
          GBP: [
            { label: 'Net pay', amount: 29_410 },
            { label: 'PAYE and National Insurance', amount: 7_880 },
            { label: 'Niural platform fee', amount: 1_350 },
          ],
          EUR: [
            { label: 'Net pay', amount: 36_120 },
            { label: 'Income tax and social security', amount: 14_480 },
            { label: 'Niural platform fee', amount: 1_700 },
          ],
        }[local],
        status: 'pending',
      }
    : {
        id: 'inv-f01',
        tab: 'fees',
        kind: 'payroll',
        dueDate: '2026-10-20',
        periodDate: '2026-10-31',
        name: 'Payroll invoice',
        description: 'US payroll - Oct 2026',
        ccy: 'USD',
        lines: [
          { label: 'Employee payroll fee', amount: 1_276 },
          { label: 'Niural platform fee for October, 2026', amount: 100 },
        ],
        status: 'pending',
      }

  return [
    {
      id: 'inv-f02',
      tab: 'fees',
      kind: 'niural-pay',
      dueDate: '2026-09-07',
      periodDate: '2026-09-30',
      name: 'Niural Pay Invoice',
      description: 'Niural Pay - Sep 2026',
      ccy,
      lines: [{ label: 'Niural Pay Invoice', amount: amt(118) }],
      status: 'pending',
    },
    {
      id: 'inv-f03',
      tab: 'fees',
      kind: 'master',
      dueDate: '2026-10-01',
      periodDate: '2026-10-31',
      name: 'Niural Master Invoice',
      description: 'Contracts Management - Oct 2026',
      ccy,
      lines: [
        { label: 'Contract management fees (27 contracts)', amount: amt(1_323) },
        { label: 'Niural platform fee', amount: amt(162) },
      ],
      status: 'pending',
    },
    cm('inv-f04', '2026-10-08', 'Edward Lawson', 49),
    cm('inv-f05', '2026-10-08', 'Justin Herbert', 49),
    cm('inv-f06', '2026-10-11', 'Michael Pena', 49),
    payroll,
    {
      id: 'inv-f07',
      tab: 'fees',
      kind: 'niural-pay',
      dueDate: '2026-11-07',
      periodDate: '2026-10-31',
      name: 'Niural Pay Invoice',
      description: 'Niural Pay - Oct 2026',
      ccy,
      lines: [{ label: 'Niural Pay Invoice', amount: amt(236) }],
      status: 'pending',
    },
    // EOR fees are billed in the employee's country currency - whatever the
    // employer's own billing currency is - so a fee batch can mix currencies.
    {
      id: 'inv-f08',
      tab: 'fees',
      kind: 'eor-fee',
      dueDate: '2026-10-15',
      periodDate: '2026-10-31',
      name: 'EOR fee - United Kingdom',
      description: 'EOR management - Oct 2026',
      ccy: 'GBP',
      lines: [
        { label: 'EOR management fee (2 employees)', amount: 760 },
        { label: 'Niural platform fee', amount: 85 },
      ],
      status: 'pending',
    },
    {
      id: 'inv-f09',
      tab: 'fees',
      kind: 'eor-fee',
      dueDate: '2026-10-22',
      periodDate: '2026-10-31',
      name: 'EOR fee - Germany',
      description: 'EOR management - Oct 2026',
      ccy: 'EUR',
      lines: [{ label: 'EOR management fee (1 employee)', amount: 430 }],
      status: 'pending',
    },
  ]
}

/* ---------------- datasets + seeded generator ---------------- */

export type Dataset = 'realistic' | 'heavy' | 'overdue' | 'nothing-due' | 'empty'

export const DATASETS: Array<{ id: Dataset; label: string; hint: string }> = [
  { id: 'realistic', label: 'Realistic', hint: '23 invoices, 9 currencies, a few overdue' },
  { id: 'heavy', label: 'Heavy', hint: '+60 generated contractor invoices' },
  { id: 'overdue', label: 'All overdue', hint: 'Every due date 5 to 90 days ago' },
  { id: 'nothing-due', label: 'On time', hint: 'Every due date in the next 30 days' },
  { id: 'empty', label: 'Empty', hint: 'No invoices - empty state' },
]

/** mulberry32 - tiny deterministic PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Aarav', 'Chloe', 'Mateo', 'Yuki', 'Amara', 'Lucas', 'Sana', 'Diego', 'Ingrid', 'Kwame', 'Nora', 'Ravi', 'Elena', 'Tomás', 'Hana', 'Felix', 'Zara', 'Omar', 'Lena', 'Kai']
const LAST = ['Patel', 'Martin', 'García', 'Tanaka', 'Okafor', 'Silva', 'Khan', 'López', 'Larsen', 'Mensah', 'Novak', 'Iyer', 'Rossi', 'Ferreira', 'Kim', 'Weber', 'Ali', 'Haddad', 'Schmidt', 'Nakamura']
const ROLES = ['Product Designer', 'Backend Engineer', 'Data Analyst', 'Content Writer', 'QA Engineer', 'iOS Developer', 'Growth Marketer', 'Recruiter', 'DevOps Engineer', 'Illustrator']
/** [currency, typical monthly min, max] - weighted by repetition. */
const GEN_CCY: Array<[Ccy, number, number]> = [
  ['USD', 2_500, 16_000], ['USD', 2_500, 16_000], ['USD', 2_500, 16_000],
  ['CAD', 4_000, 14_000], ['GBP', 2_500, 9_000], ['EUR', 3_000, 11_000],
  ['INR', 90_000, 420_000], ['PHP', 60_000, 220_000], ['NPR', 150, 900],
  ['PLN', 6_000, 24_000], ['MXN', 25_000, 90_000], ['USDC', 800, 9_000],
]

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function addMonths(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

function monthLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** One plausible contractor invoice - used by "Heavy" and the Add invoice control. */
export function generateInvoice(seed: number, today: string, opts: { ccy?: Ccy; dueIn?: number } = {}): Invoice {
  const r = rng(seed)
  const pick = <T,>(xs: Array<T>) => xs[Math.floor(r() * xs.length)]
  const [genCcy, lo, hi] = pick(GEN_CCY)
  const ccy = opts.ccy ?? genCcy
  const range = GEN_CCY.find((g) => g[0] === ccy) ?? [ccy, 1_000, 10_000]
  const amount = Math.round((range[1] + r() * (range[2] - range[1])) / (ccy === 'NPR' ? 1 : 50)) * (ccy === 'NPR' ? 1 : 50) || lo + hi
  const person = `${pick(FIRST)} ${pick(LAST)}`
  const role = pick(ROLES)
  const due = addDays(today, opts.dueIn ?? Math.round(r() * 105) - 75)
  const start = addDays(due, -30)
  const desc = r() < 0.2 ? 'Payment On Demand' : `Payments - ${fmtLineDate(start)} - ${fmtLineDate(addDays(due, -1))}`
  return {
    ...c(`inv-g${seed}`, due, person, role, desc, ccy, amount, addDays(due, 6)),
    description: desc,
    name: `${person.split(' ')[0]} - ${role}`,
  }
}

/** Shift every due date so the batch keeps its shape relative to `today`. */
function shiftTo(invs: Array<Invoice>, today: string): Array<Invoice> {
  const delta = daysBetween(WORLD_TODAY, today)
  if (!delta) return invs
  return invs.map((i) => ({ ...i, dueDate: addDays(i.dueDate, delta), periodDate: addDays(i.periodDate, delta) }))
}

export function seedInvoices(local: EmployerLocal, dataset: Dataset = 'realistic', today: string = WORLD_TODAY): Array<Invoice> {
  if (dataset === 'empty') return []
  let invs = shiftTo(
    [...CONTRACTOR_INVOICES, ...niuralInvoices(local)].map((inv) => ({ ...inv, lines: inv.lines.map((l) => ({ ...l })) })),
    today,
  )
  if (dataset === 'heavy') {
    invs = [...invs, ...Array.from({ length: 60 }, (_, i) => generateInvoice(1_000 + i, today))]
  }
  if (dataset === 'overdue' || dataset === 'nothing-due') {
    const r = rng(dataset === 'overdue' ? 7 : 11)
    invs = invs.map((i) => {
      const due = dataset === 'overdue' ? addDays(today, -5 - Math.round(r() * 85)) : addDays(today, 1 + Math.round(r() * 29))
      return { ...i, dueDate: due, periodDate: addDays(due, 6) }
    })
  }
  // Niural fee descriptions follow the (shifted) month
  return invs.map((i) =>
    i.kind === 'niural-pay' ? { ...i, description: `Niural Pay - ${monthLabel(i.periodDate)}` } : i,
  )
}

/* ---------------- wallet funding requests (admin queue) ---------------- */

export type FundingStatus = 'pending' | 'approved' | 'rejected'

export interface FundingRequest {
  id: string
  employer: string
  reference: string
  ccy: 'USD' | LocalCcy
  method: string
  amount: number
  fee: number
  status: FundingStatus
  createdAt: string
  memo?: string
}

/** Other employers' requests - give the admin queue realistic company. */
export const OTHER_FUNDING_REQUESTS: Array<FundingRequest> = [
  { id: 'fr-901', employer: 'Maple Robotics Inc', reference: 'NRL4K7Q2C9XM', ccy: 'CAD', method: 'Wire', amount: 25_000, fee: 20, status: 'pending', createdAt: '2026-10-12T15:10:00Z' },
  { id: 'fr-902', employer: 'Northwind Labs', reference: 'NRL2B8VK1TQE', ccy: 'GBP', method: 'Faster Payments', amount: 12_000, fee: 15, status: 'pending', createdAt: '2026-10-12T10:42:00Z' },
  { id: 'fr-903', employer: 'Bergmann Studio GmbH', reference: 'NRL7XW3PL0AD', ccy: 'EUR', method: 'SEPA', amount: 40_000, fee: 10, status: 'pending', createdAt: '2026-10-11T08:05:00Z' },
  { id: 'fr-904', employer: 'Acme Holdings', reference: 'NRL1MZ8RT4QC', ccy: 'USD', method: 'Wire', amount: 150_000, fee: 20, status: 'pending', createdAt: '2026-10-10T18:30:00Z' },
  { id: 'fr-905', employer: 'Maple Robotics Inc', reference: 'NRL9PQ71ZK3B', ccy: 'CAD', method: 'Wire', amount: 20_000, fee: 20, status: 'approved', createdAt: '2026-10-02T13:15:00Z' },
  { id: 'fr-906', employer: 'Thames Analytics Ltd', reference: 'NRL3HD6YB2WN', ccy: 'GBP', method: 'Faster Payments', amount: 8_500, fee: 15, status: 'rejected', createdAt: '2026-09-29T09:00:00Z' },
]

/* ---------------- wallet transactions ---------------- */

export interface WalletTx {
  id: string
  type: 'Top-up' | 'Invoice payment' | 'Payment'
  description: string
  status: 'pending' | 'completed'
  ccy: Ccy
  /** Signed: + credit, - debit. */
  amount: number
  at: string
}

export function seedTransactions(local: EmployerLocal): Array<WalletTx> {
  const txs: Array<WalletTx> = [
    { id: 'tx-1', type: 'Payment', description: 'Payment to contractor (David Maley)', status: 'completed', ccy: 'USD', amount: -15_000, at: '2026-10-01T10:00:00Z' },
    { id: 'tx-2', type: 'Top-up', description: 'Top-up from Chase Bank ••3210', status: 'completed', ccy: 'USD', amount: 50_000, at: '2026-09-28T10:00:00Z' },
    { id: 'tx-3', type: 'Invoice payment', description: 'Niural Master Invoice · Sep 2026', status: 'completed', ccy: 'USD', amount: -1_387, at: '2026-09-05T10:00:00Z' },
  ]
  if (local) {
    const r = LOCAL_RAIL[local]
    txs.push(
      { id: 'tx-l1', type: 'Top-up', description: `${r.methodShort} top-up · NRL8CW2QM5RA`, status: 'completed', ccy: local, amount: LOCAL_BALANCE[local] + 2_000, at: '2026-09-22T10:00:00Z' },
      { id: 'tx-l2', type: 'Invoice payment', description: 'Niural Pay Invoice · Aug 2026', status: 'completed', ccy: local, amount: -2_000, at: '2026-09-25T10:00:00Z' },
    )
  }
  return txs
}

/* ---------------- formatting ---------------- */

export function fmt(amount: number, ccy: Ccy | string, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sign = opts.sign ? (amount < 0 ? '- ' : '+ ') : amount < 0 ? '-' : ''
  return `${sign}${ccy} ${abs}`
}

export function fmtDate(iso: string): string {
  return fmtLineDate(iso.slice(0, 10))
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / 86_400_000)
}

/** Days from `today` (time machine date) to `iso`; negative = overdue. */
export function daysFromToday(iso: string, today: string = WORLD_TODAY): number {
  return daysBetween(today, iso)
}
