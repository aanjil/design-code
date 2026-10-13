/**
 * Settings > Organization mock world. Deterministic, hand-authored - every
 * value here is something a real US LLC on Niural would plausibly have, so
 * screenshots read as a real account rather than lorem ipsum.
 */

export const ORG = {
  name: 'Anjil Crafts',
  verified: true,
  city: 'New York',
  country: 'United States',
  legalName: 'Anjil Crafts LLC',
  natureOfBusiness: 'Arts & Entertainment',
  countryOfRegistration: 'United States',
  ein: '84-2918291',
  registeredAddress: '1500 Broadway, New York, NY 10036, United States',
  dateOfRegistration: '01-24-2023',
  website: 'https://anjil.me',
  employeeCount: 'Less than 25',
  companyType: 'Limited Liability Company (LLC)',
  taxationStatus: 'Sole Proprietorship',
  admin: { name: 'Anjil Bishowkarma', email: 'anjil+crafts@niural.com' },
}

export const TAXATION_STATUSES = [
  'Sole Proprietorship',
  'Partnership',
  'S Corporation',
  'C Corporation',
]

export interface CompanyAddress {
  id: string
  line: string
  kind: 'Registered address' | 'Mailing address' | 'Filing address'
}

export const COMPANY_ADDRESSES: Array<CompanyAddress> = [
  { id: 'reg', line: '1500 Broadway, New York, New York 10036, US', kind: 'Registered address' },
  { id: 'mail', line: '1500 Broadway, New York, New York 10036, US', kind: 'Mailing address' },
  { id: 'file', line: '1500 Broadway, Suite 234, New York, New York 10036, US', kind: 'Filing address' },
]

export interface VerificationStep {
  id: string
  label: string
  detail: string
  status: 'verified' | 'in-review' | 'needed'
  date?: string
}

export const VERIFICATION_STEPS: Array<VerificationStep> = [
  { id: 'kyb', label: 'Business identity (KYB)', detail: 'Legal name, EIN and formation date matched IRS records.', status: 'verified', date: 'Jan 30, 2023' },
  { id: 'ubo', label: 'Beneficial owners', detail: '1 owner with 25%+ ownership verified with a government ID.', status: 'verified', date: 'Jan 30, 2023' },
  { id: 'bank', label: 'Funding bank account', detail: 'Chase Business ••4410 verified via micro-deposits.', status: 'verified', date: 'Feb 02, 2023' },
  { id: 'addr', label: 'Proof of address', detail: 'Lease agreement for 1500 Broadway accepted.', status: 'verified', date: 'Feb 02, 2023' },
]

/* ---------------- documents ---------------- */

export type DocTab = 'tax-filings' | 'w2' | '1099' | 'onboarding' | 'i9' | 'others'

export interface FiledDoc {
  id: string
  name: string
  period: string
  status: string
}

export const TAX_FILINGS: Array<FiledDoc> = [
  { id: 'tf1', name: 'Form 941 - Q3 2026', period: 'Jul – Sep 2026', status: 'Filed on 2026-10-08' },
  { id: 'tf2', name: 'NY NYS-45 - Q3 2026', period: 'Jul – Sep 2026', status: 'Filed on 2026-10-09' },
  { id: 'tf3', name: 'Form 941 - Q2 2026', period: 'Apr – Jun 2026', status: 'Filed on 2026-07-11' },
  { id: 'tf4', name: 'NY NYS-45 - Q2 2026', period: 'Apr – Jun 2026', status: 'Filed on 2026-07-14' },
  { id: 'tf5', name: 'Form 940 - 2025', period: 'Jan – Dec 2025', status: 'Filed on 2026-01-29' },
  { id: 'tf6', name: 'CA DE 9 - Q4 2025', period: 'Oct – Dec 2025', status: 'Filed on 2026-01-27' },
]

export const W2S: Array<FiledDoc> = [
  { id: 'w1', name: 'W-2 - Emily Carter', period: '2025', status: 'Issued on 2026-01-24' },
  { id: 'w2', name: 'W-2 - Marcus Silva', period: '2025', status: 'Issued on 2026-01-24' },
  { id: 'w3', name: 'W-2 - Priya Raman', period: '2025', status: 'Issued on 2026-01-24' },
  { id: 'w4', name: 'W-3 Transmittal', period: '2025', status: 'Filed on 2026-01-29' },
]

export const NEC1099S: Array<FiledDoc> = [
  { id: 'n1', name: '1099-NEC - Lena Okafor', period: '2025', status: 'Issued on 2026-01-28' },
  { id: 'n2', name: '1099-NEC - Studio Haus LLC', period: '2025', status: 'Issued on 2026-01-28' },
  { id: 'n3', name: '1096 Transmittal', period: '2025', status: 'Filed on 2026-01-30' },
]

export const ONBOARDING_DOCS: Array<FiledDoc> = [
  { id: 'o1', name: 'Offer letter - Priya Raman', period: 'Signed', status: 'Signed on 2026-03-02' },
  { id: 'o2', name: 'W-4 - Priya Raman', period: 'Federal', status: 'Submitted on 2026-03-04' },
  { id: 'o3', name: 'IT-2104 - Priya Raman', period: 'New York', status: 'Submitted on 2026-03-04' },
  { id: 'o4', name: 'Direct deposit - Marcus Silva', period: 'Banking', status: 'Submitted on 2025-11-18' },
]

export const I9_DOCS: Array<FiledDoc> = [
  { id: 'i1', name: 'Form I-9 - Emily Carter', period: 'List A: US Passport', status: 'Verified on 2024-05-14' },
  { id: 'i2', name: 'Form I-9 - Marcus Silva', period: 'List B + C', status: 'Verified on 2025-11-20' },
  { id: 'i3', name: 'Form I-9 - Priya Raman', period: 'List A: Green card', status: 'Reverify by 2027-03-01' },
]

export const TAX_DOCS = [
  { id: 'td1', name: 'DDA Employer', status: 'Signed on 2025-07-10' },
  { id: 'td2', name: 'Form 8655', status: 'Signed on 2025-12-03' },
]

export const LEGAL_DOCS = [
  { id: 'ld1', name: 'MSA Document', description: 'Master Service Agreement for EOR contracts', status: 'Uploaded' },
  { id: 'ld2', name: 'AOR MSA Document (Niural Group)', description: 'Master Service Agreement for AOR contracts', status: 'Uploaded' },
  { id: 'ld3', name: 'AOR MSA Document (Niural Inc.)', description: 'Master Service Agreement for AOR contracts', status: 'Uploaded' },
  {
    id: 'ld4',
    name: 'Certificate of incorporation',
    description:
      'Certificate of incorporation, also called articles of incorporation or a corporate charter, is a legal document filed with a government agency to create your business.',
    status: 'Uploaded',
  },
  { id: 'ld5', name: 'EIN/Tax ID document', description: "This is a document issued by your government's tax agency and displays your Tax ID number.", status: 'Uploaded' },
]

export const STATEMENTS: Record<string, Array<{ id: string; name: string; description: string }>> = {
  '2026': [
    { id: 's2609', name: 'Statement - September 2026', description: 'Wallet and payroll funding activity, 47 transactions' },
    { id: 's2608', name: 'Statement - August 2026', description: 'Wallet and payroll funding activity, 43 transactions' },
    { id: 's2607', name: 'Statement - July 2026', description: 'Wallet and payroll funding activity, 45 transactions' },
  ],
  '2025': [
    { id: 's12', name: 'Statement - December 2025', description: 'Wallet and payroll funding activity, 41 transactions' },
    { id: 's11', name: 'Statement - November 2025', description: 'Wallet and payroll funding activity, 38 transactions' },
    { id: 's10', name: 'Statement - October 2025', description: 'Wallet and payroll funding activity, 44 transactions' },
    { id: 's09', name: 'Statement - September 2025', description: 'Wallet and payroll funding activity, 36 transactions' },
  ],
  '2024': [
    { id: 's24', name: 'Statement - Annual 2024', description: 'Consolidated wallet activity for 2024' },
  ],
  /** Joined Niural in 2024 - nothing to show, exercises the empty state. */
  '2023': [],
}

/* ---------------- tax setup ---------------- */

export const FEDERAL_TAX = {
  ein: '84-2918291',
  companyType: 'Limited Liability Company (LLC)',
  depositSchedule: 'Semi-weekly',
  filingForm: '941',
}

export interface StateTaxField {
  key: string
  label: string
  value: string
  mono?: boolean
}

export interface StateTaxSetup {
  code: string
  state: string
  status: 'active' | 'incomplete' | 'registering'
  fields: Array<StateTaxField>
}

export const STATE_TAX: Array<StateTaxSetup> = [
  {
    code: 'NY',
    state: 'New York',
    status: 'active',
    fields: [
      { key: 'ui', label: 'UI Employer Registration Number', value: '51-48210', mono: true },
      { key: 'wt', label: 'Withholding Tax ID', value: '842918291', mono: true },
      { key: 'rate', label: 'NY Unemployment Insurance rate (%)', value: '4.025', mono: true },
      { key: 'rsf', label: 'Re-employment Service Fund (%)', value: '0.075', mono: true },
      { key: 'freq', label: 'Withholding deposit frequency', value: 'Next business day' },
    ],
  },
  {
    code: 'CA',
    state: 'California',
    status: 'active',
    fields: [
      { key: 'edd', label: 'EDD Account Number', value: '0938-4102-7', mono: true },
      { key: 'ui', label: 'California Unemployment Tax (%)', value: '3.4', mono: true },
      { key: 'ett', label: 'Employment Training Tax (%)', value: '0.1', mono: true },
      { key: 'sdi', label: 'State Disability Insurance (%)', value: '1.2', mono: true },
    ],
  },
  {
    code: 'AL',
    state: 'Alabama',
    status: 'incomplete',
    fields: [
      { key: 'uc', label: 'UC Account Number', value: '' },
      { key: 'esa', label: 'ESA', value: '' },
      { key: 'wt', label: 'Withholding Account Number', value: '' },
      { key: 'esarate', label: 'Alabama Employment Security Assessment (%)', value: '0.06', mono: true },
      { key: 'ui', label: 'Alabama State Unemployment Tax (%)', value: '2.7', mono: true },
    ],
  },
  {
    code: 'AZ',
    state: 'Arizona',
    status: 'incomplete',
    fields: [
      { key: 'ea', label: 'Employer Account Number', value: '' },
      { key: 'dor', label: 'Arizona Department of Revenue ID', value: '' },
      { key: 'ui', label: 'Arizona State Unemployment Tax (%)', value: '2.0', mono: true },
    ],
  },
]

export const REGISTERABLE_STATES = [
  'Colorado',
  'Florida',
  'Georgia',
  'Illinois',
  'Massachusetts',
  'New Jersey',
  'Texas',
  'Washington',
]

/* ---------------- users ---------------- */

export type UserRole =
  | 'Org owner'
  | 'Entity admin'
  | 'Entity viewer'
  | 'People manager'
  | 'Payroll admin'
  | 'Finance approver'

export const USER_ROLES: Array<UserRole> = [
  'Entity admin',
  'Entity viewer',
  'People manager',
  'Payroll admin',
  'Finance approver',
]

export type UserStatus = 'active' | 'inactive' | 'pending' | 'unassigned'

export interface OrgUser {
  id: string
  name: string
  email: string
  roles: Array<UserRole>
  status: UserStatus
  /** Pending: when the invite went out. Inactive: when they were deactivated. */
  since?: string
}

export const ORG_USERS: Array<OrgUser> = [
  { id: 'u1', name: 'Anjil Bishowkarma', email: 'anjil+crafts@niural.com', roles: ['Org owner'], status: 'active' },
  { id: 'u2', name: 'Anjil Bishowkarma', email: 'anjil+adminuser@niural.com', roles: ['Entity viewer'], status: 'active' },
  { id: 'u3', name: 'Emily Carter', email: 'anjil+emily_carter@niural.com', roles: ['Entity admin', 'People manager', 'Payroll admin'], status: 'active' },
  { id: 'u4', name: 'Marcus Silva', email: 'marcus.silva@anjilcrafts.com', roles: ['Finance approver'], status: 'active' },
  { id: 'u5', name: 'Jordan Pike', email: 'jordan.pike@anjilcrafts.com', roles: ['Payroll admin'], status: 'inactive', since: 'Aug 12, 2026' },
  { id: 'u6', name: 'Priya Raman', email: 'priya.raman@anjilcrafts.com', roles: ['People manager'], status: 'pending', since: 'Oct 10, 2026' },
  { id: 'u7', name: 'Theo Lindqvist', email: 'theo@studiohaus.co', roles: [], status: 'unassigned' },
]

/* ---------------- groups ---------------- */

export interface OrgGroup {
  id: string
  name: string
  description: string
  members: number
  updated: string
  tone: 'teal' | 'violet' | 'orange' | 'pink'
}

export const ORG_GROUPS: Array<OrgGroup> = [
  { id: 'g1', name: 'Design studio', description: 'Product and brand designers - shares the design tooling stipend and studio access.', members: 4, updated: '2026-07-06', tone: 'teal' },
  { id: 'g2', name: 'New York office', description: 'Everyone who badges into 1500 Broadway - used for NY-only benefits and notices.', members: 9, updated: '2026-09-21', tone: 'violet' },
  { id: 'g3', name: 'Contractors - US', description: 'US 1099 contractors paid through Niural Pay.', members: 3, updated: '2026-08-02', tone: 'orange' },
  { id: 'g4', name: 'Leadership', description: 'Approvers for payroll runs over $50k and off-cycle payments.', members: 2, updated: '2026-05-14', tone: 'pink' },
]

/* ---------------- security ---------------- */

export interface IdentityProvider {
  id: 'jumpcloud' | 'okta' | 'google'
  name: string
  configured: boolean
  domain?: string
}

export const IDENTITY_PROVIDERS: Array<IdentityProvider> = [
  { id: 'jumpcloud', name: 'JumpCloud', configured: false },
  { id: 'okta', name: 'Okta', configured: false },
  { id: 'google', name: 'Google Workspace', configured: false },
]

/* ---------------- timesheets ---------------- */

export interface WorkSchedule {
  id: string
  name: string
  description: string
  workday: 'Fixed' | 'Flexible' | 'Weekly'
  hours: string
  workers: Array<string>
  active: boolean
}

export const WORK_SCHEDULES: Array<WorkSchedule> = [
  { id: 'ws1', name: 'Standard 9–5', description: 'Mon–Fri, 9:00 AM – 5:00 PM with a 30 min unpaid lunch.', workday: 'Fixed', hours: '37.5 h / week', workers: ['Emily Carter', 'Priya Raman'], active: true },
  { id: 'ws2', name: 'Studio flex', description: '40 hours a week, core hours 11:00 AM – 3:00 PM.', workday: 'Flexible', hours: '40 h / week', workers: ['Marcus Silva'], active: true },
  { id: 'ws3', name: 'Weekend install crew', description: 'Sat–Sun gallery installs, overtime after 8 h a day.', workday: 'Weekly', hours: '16 h / week', workers: [], active: true },
  { id: 'ws4', name: 'Holiday pop-up', description: 'Seasonal retail shifts for the December market.', workday: 'Fixed', hours: '24 h / week', workers: [], active: false },
]

/* ---------------- payroll ---------------- */

export interface CustomEarning {
  id: string
  name: string
  description: string
  overtime: boolean
  active: boolean
}

export const CUSTOM_EARNINGS: Array<CustomEarning> = [
  { id: 'ce1', name: 'Performance bonus', description: 'Quarterly discretionary bonus', overtime: false, active: true },
  { id: 'ce2', name: 'Shift differential', description: 'Extra $2.50/h for weekend install shifts', overtime: true, active: true },
  { id: 'ce3', name: 'On-call stipend', description: 'Flat $150 per on-call week', overtime: false, active: true },
  { id: 'ce4', name: 'Referral bonus', description: 'Paid after the referred hire completes 90 days', overtime: false, active: false },
]
