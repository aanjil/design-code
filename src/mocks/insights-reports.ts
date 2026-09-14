/**
 * Report catalog + org recipient directory for the schedule-report
 * craft. Deterministic, no PRNG - fixed list matching the Niural
 * Insights report gallery (Figma 508:10318 + PRD appendix).
 */

export type ReportCategory = 'Payroll' | 'Payments' | 'People' | 'Niural Pay'

/**
 * How a report's reporting period works (reference HTML prototype's
 * `metaFor(report).date`) - this is what the "How often" step branches
 * on, NOT a simple has-a-date-range boolean:
 *  - 'range'  - a start/end window (relative presets: previous month,
 *               last 7 days, etc, or a custom relative window)
 *  - 'single' - one as-of date (previous month-end, previous year-end...)
 *  - 'none'   - a point-in-time snapshot, no date param at all
 */
export type DateShape = 'range' | 'single' | 'none'

export interface ReportMeta {
  id: string
  name: string
  category: ReportCategory
  description: string
  /** false = the one locked "Cash reward report" case (PRD edge case). */
  schedulable: boolean
  dateShape: DateShape
  /** Payroll journal detail only - PRD's "After Each Run" trigger. */
  supportsAfterEachRun?: boolean
}

export const REPORTS: Array<ReportMeta> = [
  { id: 'master-bill', name: 'Master bill report', category: 'Niural Pay', description: 'Every bill issued across pay periods, by status.', schedulable: true, dateShape: 'range' },
  { id: 'vendor-payments', name: 'Vendor payments', category: 'Payments', description: 'Payments made to vendors in the selected window.', schedulable: true, dateShape: 'range' },
  { id: 'bills-aging', name: 'Bills aging', category: 'Payments', description: 'Outstanding bills grouped by how overdue they are.', schedulable: true, dateShape: 'single' },
  { id: 'bills-audit', name: 'Bills audit report', category: 'Payments', description: 'Full edit history on every bill in the window.', schedulable: true, dateShape: 'range' },
  { id: 'invoice-aging', name: 'Invoice aging', category: 'Payments', description: 'Outstanding invoices grouped by age interval.', schedulable: true, dateShape: 'single' },
  { id: 'customer-receivables', name: 'Customer receivables', category: 'Payments', description: 'Amounts owed by customers in the selected window.', schedulable: true, dateShape: 'range' },
  { id: 'voided-invoices', name: 'Voided invoices', category: 'Payments', description: 'Invoices voided in the selected window.', schedulable: true, dateShape: 'range' },
  { id: 'invoices-audit', name: 'Invoices audit report', category: 'Payments', description: 'Full edit history on every invoice in the window.', schedulable: true, dateShape: 'range' },
  { id: 'payroll-journal-detail', name: 'Payroll journal detail', category: 'Payroll', description: 'Line-by-line payroll journal entries for the window.', schedulable: true, dateShape: 'range', supportsAfterEachRun: true },
  { id: 'payroll-journal-summary', name: 'Payroll journal summary', category: 'Payroll', description: 'Payroll journal entries rolled up by account.', schedulable: true, dateShape: 'range' },
  { id: 'cash-requirement', name: 'Cash requirement', category: 'Payroll', description: 'Cash needed to cover upcoming payroll runs.', schedulable: true, dateShape: 'range' },
  { id: 'expense-report', name: 'Expense report', category: 'Payroll', description: 'Employee expenses submitted in the window.', schedulable: true, dateShape: 'range' },
  { id: 'paystubs', name: 'Paystubs', category: 'Payroll', description: 'Generated paystubs for the selected pay periods.', schedulable: true, dateShape: 'range' },
  { id: 'ytd-report', name: 'Year to date report', category: 'Payroll', description: 'Year-to-date payroll totals per employee.', schedulable: true, dateShape: 'range' },
  { id: 'qtd-report', name: 'Quarter to date report', category: 'Payroll', description: 'Quarter-to-date payroll totals per employee.', schedulable: true, dateShape: 'range' },
  { id: 'contractor-information', name: 'Contractor information', category: 'People', description: 'Active contractor roster and terms.', schedulable: true, dateShape: 'none' },
  { id: 'time-off-balances', name: 'Time off balances', category: 'People', description: 'Accrued and used time off per employee.', schedulable: true, dateShape: 'none' },
  { id: 'cash-reward', name: 'Cash reward report', category: 'Niural Pay', description: 'Cash rewards issued to employees.', schedulable: false, dateShape: 'range' },
]

export function getReport(id: string): ReportMeta {
  const r = REPORTS.find((x) => x.id === id)
  if (!r) throw new Error(`Unknown report id "${id}"`)
  return r
}

export type OrgRole = 'Org Owner' | 'Admin' | 'AP Approver' | 'AR Approver'

export interface OrgMember {
  name: string
  email: string
  role: OrgRole
}

/** Org directory the recipient picker searches - PRD Fn 1.4. */
export const ORG_MEMBERS: Array<OrgMember> = [
  { name: 'Anna Smith', email: 'anna@niural.com', role: 'Org Owner' },
  { name: 'Brian Stone', email: 'brian@niural.com', role: 'Admin' },
  { name: 'Catherine Stevens', email: 'catherine@niural.com', role: 'Admin' },
  { name: 'David Sanders', email: 'david@niural.com', role: 'AP Approver' },
  { name: 'Elena Cross', email: 'elena@niural.com', role: 'AR Approver' },
  { name: 'Farid Haddad', email: 'farid@niural.com', role: 'Admin' },
]

export function findMember(email: string): OrgMember | undefined {
  return ORG_MEMBERS.find((m) => m.email.toLowerCase() === email.toLowerCase())
}
