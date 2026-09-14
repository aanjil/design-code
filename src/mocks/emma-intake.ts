/**
 * Mock config for the Emma Intake craft (docs/foundations - Figma "Emma Intake").
 * One generic engine, two flows (contract intelligence, expense) driven by this
 * config: a fake source document (positioned text blocks so the receipt can
 * scroll+highlight the doc), a timeline script for the X-ray step, and staging
 * scenarios (clear / warning / dedupe / empty-required) to preview without
 * replaying the whole capture flow. Deterministic, no fetch.
 */

export type FieldStatus = 'confirmed' | 'warning' | 'empty-required'

export interface IntakeField {
  id: string
  label: string
  value: string
  status: FieldStatus
  note?: string
  /** font-mono per DESIGN.md - money, IDs, dates, percentages. */
  mono?: boolean
  /** Links this field to a DocBlock - clicking it scrolls + highlights the doc. */
  blockId?: string
  /** Choices shown when status is 'empty-required' (renders as an empty select). */
  options?: Array<string>
}

export interface IntakeCard {
  id: string
  title: string
  badge?: string
  fields: Array<IntakeField>
}

export interface TimelineStep {
  atSeconds: number
  text: string
  /** Card ids (from the default/first scenario) that materialize once this step lands. */
  producesCardIds?: Array<string>
}

export interface DocBlock {
  id: string
  page: number
  text: string
  /** Rough emphasis for the fake page render - bold heading vs. muted line. */
  kind?: 'heading' | 'line' | 'faint'
}

export interface IntakeDocument {
  filename: string
  fileSizeLabel: string
  pageCount: number
  blocks: Array<DocBlock>
}

export interface IntakeScenario {
  id: string
  label: string
  cards: Array<IntakeCard>
  dedupe?: { matchedName: string; message: string }
}

export interface IntakeFlowConfig {
  id: 'contract' | 'expense'
  label: string
  entryVerb: string
  dropHint: string
  fileNameHint: string
  fileSizeHint: string
  document: IntakeDocument
  timeline: Array<TimelineStep>
  scenarios: Array<IntakeScenario>
  createSummary: (scenario: IntakeScenario) => string
}

export const CONTRACT_FLOW: IntakeFlowConfig = {
  id: 'contract',
  label: 'Contract Intelligence',
  entryVerb: 'Create from Contract',
  dropHint: 'Drop a contract to extract vendor + billing terms',
  fileNameHint: 'CloudTech_MSA_2026.pdf',
  fileSizeHint: '412 KB',
  document: {
    filename: 'CloudTech_MSA_2026.pdf',
    fileSizeLabel: '412 KB · 2 pages',
    pageCount: 2,
    blocks: [
      { id: 'doc-heading-1', page: 1, kind: 'heading', text: 'MASTER SERVICE AGREEMENT' },
      { id: 'doc-parties', page: 1, kind: 'line', text: 'This agreement is entered into between Niural, Inc. ("Client") and:' },
      { id: 'vendor-name', page: 1, kind: 'line', text: 'CloudTech Solutions LLC' },
      { id: 'vendor-address', page: 1, kind: 'line', text: '888 Server Road, Austin, TX 78701' },
      { id: 'vendor-ein', page: 1, kind: 'faint', text: 'EIN: 98-7654321' },
      { id: 'doc-scope', page: 1, kind: 'line', text: 'Vendor shall provide cloud infrastructure hosting services as described in Exhibit A.' },
      { id: 'doc-heading-2', page: 2, kind: 'heading', text: 'FEES & PAYMENT TERMS' },
      { id: 'amount', page: 2, kind: 'line', text: 'Fees: $8,000.00 USD per month' },
      { id: 'net-terms', page: 2, kind: 'line', text: 'Payment Terms: Net 30' },
      { id: 'discount', page: 2, kind: 'line', text: 'Early Payment Discount: 5% if paid within 10 days' },
      { id: 'term-length', page: 2, kind: 'line', text: 'Initial Term: 12 months, commencing March 15, 2026' },
    ],
  },
  timeline: [
    { atSeconds: 0, text: 'Reading document…' },
    { atSeconds: 2, text: 'Classified as Master Service Agreement…' },
    { atSeconds: 4, text: 'Extracting vendor details (CloudTech Solutions)…', producesCardIds: ['vendor'] },
    {
      atSeconds: 6.5,
      text: 'Mapping $8,000 to a monthly recurring schedule…',
      producesCardIds: ['bill', 'schedule'],
    },
  ],
  scenarios: [
    {
      id: 'clear',
      label: 'Clean extract',
      cards: [
        {
          id: 'vendor',
          title: 'Vendor Profile',
          badge: '✨ New Vendor',
          fields: [
            { id: 'vendor-name', label: 'Legal Name', value: 'CloudTech Solutions LLC', status: 'confirmed', blockId: 'vendor-name' },
            { id: 'vendor-address', label: 'Address', value: '888 Server Road, Austin, TX', status: 'confirmed', blockId: 'vendor-address' },
            { id: 'vendor-ein', label: 'EIN', value: '98-7654321', status: 'warning', note: 'Low contrast in document', mono: true, blockId: 'vendor-ein' },
          ],
        },
        {
          id: 'bill',
          title: 'Draft Bill',
          fields: [
            { id: 'amount', label: 'Total Amount', value: '$8,000.00', status: 'confirmed', mono: true, blockId: 'amount' },
            { id: 'due-date', label: 'Due Date', value: 'Net 30 (Calculated: April 14, 2026)', status: 'confirmed', mono: true, blockId: 'net-terms' },
            { id: 'discount', label: 'Discount', value: '5% (10 days)', status: 'confirmed', mono: true, blockId: 'discount' },
            {
              id: 'department',
              label: 'Department',
              value: '',
              status: 'empty-required',
              options: ['Engineering', 'Operations', 'Finance', 'Sales'],
            },
          ],
        },
        {
          id: 'schedule',
          title: 'Recurring Schedule Detected',
          fields: [
            { id: 'frequency', label: 'Frequency', value: 'Monthly (12 periods)', status: 'confirmed', blockId: 'term-length' },
          ],
        },
      ],
    },
    {
      id: 'dedupe',
      label: 'Existing vendor match',
      dedupe: {
        matchedName: 'CloudTech Solutions',
        message:
          '🔗 Emma found an existing vendor: CloudTech Solutions. This bill will be linked to them.',
      },
      cards: [
        {
          id: 'vendor',
          title: 'Vendor Profile',
          fields: [
            { id: 'vendor-name', label: 'Legal Name', value: 'CloudTech Solutions LLC', status: 'confirmed', blockId: 'vendor-name' },
            { id: 'vendor-address', label: 'Address', value: '888 Server Road, Austin, TX', status: 'confirmed', blockId: 'vendor-address' },
            { id: 'vendor-ein', label: 'EIN', value: '98-7654321', status: 'confirmed', mono: true, blockId: 'vendor-ein' },
          ],
        },
        {
          id: 'bill',
          title: 'Draft Bill',
          fields: [
            { id: 'amount', label: 'Total Amount', value: '$8,000.00', status: 'confirmed', mono: true, blockId: 'amount' },
            { id: 'due-date', label: 'Due Date', value: 'Net 30 (Calculated: April 14, 2026)', status: 'confirmed', mono: true, blockId: 'net-terms' },
            { id: 'discount', label: 'Discount', value: '5% (10 days)', status: 'confirmed', mono: true, blockId: 'discount' },
          ],
        },
        {
          id: 'schedule',
          title: 'Recurring Schedule Detected',
          fields: [
            { id: 'frequency', label: 'Frequency', value: 'Monthly (12 periods)', status: 'confirmed', blockId: 'term-length' },
          ],
        },
      ],
    },
  ],
  createSummary: (scenario) =>
    scenario.dedupe
      ? `Linked to existing vendor ${scenario.dedupe.matchedName}. Bill for $8,000.00 (Net 30) scheduled monthly, starting March 15, 2026.`
      : 'Vendor CloudTech Solutions LLC created. Bill for $8,000.00 (Net 30) scheduled monthly, starting March 15, 2026.',
}

export const EXPENSE_FLOW: IntakeFlowConfig = {
  id: 'expense',
  label: 'Expense',
  entryVerb: 'Create from Receipt',
  dropHint: 'Drop a receipt or invoice to log an expense',
  fileNameHint: 'Adobe_Invoice_Feb2026.pdf',
  fileSizeHint: '96 KB',
  document: {
    filename: 'Adobe_Invoice_Feb2026.pdf',
    fileSizeLabel: '96 KB · 1 page',
    pageCount: 1,
    blocks: [
      { id: 'doc-heading-1', page: 1, kind: 'heading', text: 'INVOICE' },
      { id: 'merchant-name', page: 1, kind: 'line', text: 'Adobe Inc.' },
      { id: 'merchant-country', page: 1, kind: 'line', text: '345 Park Avenue, San Jose, CA · United States' },
      { id: 'merchant-tax-id', page: 1, kind: 'faint', text: 'Tax ID: not printed on this invoice' },
      { id: 'doc-line-item', page: 1, kind: 'line', text: 'Creative Cloud All Apps - Team plan, 1 seat' },
      { id: 'amount', page: 1, kind: 'line', text: 'Amount Due: $54.99' },
      { id: 'invoice-date', page: 1, kind: 'line', text: 'Invoice Date: Feb 3, 2026' },
      { id: 'billing-cycle', page: 1, kind: 'line', text: 'Billing Cycle: Monthly, auto-renews' },
    ],
  },
  timeline: [
    { atSeconds: 0, text: 'Reading receipt…' },
    { atSeconds: 2, text: 'Classified as a software subscription invoice…' },
    { atSeconds: 4, text: 'Extracting merchant details (Adobe Inc.)…', producesCardIds: ['merchant'] },
    {
      atSeconds: 6.5,
      text: 'Detecting recurring billing cadence…',
      producesCardIds: ['expense', 'schedule'],
    },
  ],
  scenarios: [
    {
      id: 'clear',
      label: 'Clean extract',
      cards: [
        {
          id: 'merchant',
          title: 'Merchant Profile',
          badge: '✨ New Merchant',
          fields: [
            { id: 'merchant-name', label: 'Merchant Name', value: 'Adobe Inc.', status: 'confirmed', blockId: 'merchant-name' },
            { id: 'merchant-country', label: 'Billing Country', value: 'United States', status: 'confirmed', blockId: 'merchant-country' },
            { id: 'merchant-tax-id', label: 'Tax ID', value: 'Not detected - defaulted from merchant profile', status: 'warning', note: 'Not printed on this invoice', blockId: 'merchant-tax-id' },
          ],
        },
        {
          id: 'expense',
          title: 'Draft Expense',
          fields: [
            { id: 'amount', label: 'Amount', value: '$54.99', status: 'confirmed', mono: true, blockId: 'amount' },
            { id: 'category', label: 'Category', value: 'Software & Subscriptions', status: 'warning', note: 'Low-confidence category match', blockId: 'doc-line-item' },
            { id: 'date', label: 'Date', value: 'Feb 3, 2026', status: 'confirmed', mono: true, blockId: 'invoice-date' },
            {
              id: 'cost-center',
              label: 'Cost Center',
              value: '',
              status: 'empty-required',
              options: ['Engineering', 'Design', 'Marketing', 'G&A'],
            },
          ],
        },
        {
          id: 'schedule',
          title: 'Recurring Schedule Detected',
          fields: [
            { id: 'frequency', label: 'Frequency', value: 'Monthly (auto-renews)', status: 'confirmed', blockId: 'billing-cycle' },
          ],
        },
      ],
    },
    {
      id: 'dedupe',
      label: 'Existing merchant match',
      dedupe: {
        matchedName: 'Adobe Inc.',
        message:
          '🔗 Emma found an existing merchant: Adobe Inc. This expense will be linked to them.',
      },
      cards: [
        {
          id: 'merchant',
          title: 'Merchant Profile',
          fields: [
            { id: 'merchant-name', label: 'Merchant Name', value: 'Adobe Inc.', status: 'confirmed', blockId: 'merchant-name' },
            { id: 'merchant-country', label: 'Billing Country', value: 'United States', status: 'confirmed', blockId: 'merchant-country' },
          ],
        },
        {
          id: 'expense',
          title: 'Draft Expense',
          fields: [
            { id: 'amount', label: 'Amount', value: '$54.99', status: 'confirmed', mono: true, blockId: 'amount' },
            { id: 'category', label: 'Category', value: 'Software & Subscriptions', status: 'confirmed', blockId: 'doc-line-item' },
            { id: 'date', label: 'Date', value: 'Feb 3, 2026', status: 'confirmed', mono: true, blockId: 'invoice-date' },
          ],
        },
        {
          id: 'schedule',
          title: 'Recurring Schedule Detected',
          fields: [
            { id: 'frequency', label: 'Frequency', value: 'Monthly (auto-renews)', status: 'confirmed', blockId: 'billing-cycle' },
          ],
        },
      ],
    },
  ],
  createSummary: (scenario) =>
    scenario.dedupe
      ? `Linked to existing merchant ${scenario.dedupe.matchedName}. Expense of $54.99 logged, monthly recurring.`
      : 'Merchant Adobe Inc. created. Expense of $54.99 logged, monthly recurring.',
}

export const INTAKE_FLOWS = [CONTRACT_FLOW, EXPENSE_FLOW]
