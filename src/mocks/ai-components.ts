/**
 * Mock data for the AI component catalog (docs/foundations/ai-components.md).
 * Deterministic, on-domain for Niural (payroll/HR), no fetch. One file so every
 * ai/* component and its docs page shares the same fixtures.
 */

/* ---------------- Agent status & reasoning ---------------- */

export const loadingState = {
  label: 'Calculating payroll',
  elapsedSeconds: 0.8,
}

export interface ThinkingStep {
  label: string
  detail?: string
  count?: string
}

export const thinkingTrace = {
  durationSeconds: 4,
  tabs: ['Steps', 'Reasoning', 'Search', 'Coding'] as const,
  steps: [
    { label: 'Reading time entries' },
    { label: 'Checking overtime rules' },
    { label: 'Cross-referencing tax tables', count: '6 states' },
    { label: 'Writing the anomaly report' },
  ] as Array<ThinkingStep>,
}

export interface StreamSource {
  label: string
  domain: string
}

export const streamingAnswer = {
  text: 'Overtime costs are up 12% this run, driven mostly by the warehouse team.',
  sourceCount: 10,
  sources: [
    { label: 'Time Tracking', domain: 'timeclock.internal' },
    { label: 'Payroll History', domain: 'payroll.internal' },
    { label: 'Compliance Rules', domain: 'compliance.internal' },
  ] as Array<StreamSource>,
  followUps: [
    'Which employees drove the increase',
    'Compare overtime to last quarter',
  ],
}

export type TaskRowStatus = 'completed' | 'running' | 'failed' | 'queued' | 'deferred'

export interface TaskSubRow {
  label: string
  meta?: string
  status: TaskRowStatus
}

export interface TaskRow {
  label: string
  meta?: string
  status: TaskRowStatus
  subRows?: Array<TaskSubRow>
}

export const taskRows: Array<TaskRow> = [
  {
    label: 'Verified contractor W-9s',
    meta: '12 contractors',
    status: 'completed',
    subRows: [
      { label: 'Matched tax and contact IDs', meta: '12/12', status: 'completed' },
      { label: 'Flagged stale records', meta: '0', status: 'completed' },
    ],
  },
  {
    label: 'Build off-cycle payment batch',
    meta: '7 payments',
    status: 'running',
    subRows: [
      { label: 'Reading time-off requests', meta: '3 files', status: 'completed' },
      { label: 'Scoring approval risk', meta: '68%', status: 'running' },
    ],
  },
  {
    label: 'Draft compliance emails',
    meta: '2 messages',
    status: 'queued',
    subRows: [
      { label: 'Overtime policy follow-up', meta: 'draft', status: 'queued' },
      { label: 'W-9 reminder note', meta: 'draft', status: 'queued' },
    ],
  },
]

/* ---------------- Conversational input ---------------- */

export interface ChatMessage {
  reasoningLabel: string
  durationSeconds: number
  body: string
}

export const chatThread = {
  tabs: ['Payroll', 'Compliance'],
  activeTab: 'Payroll',
  prompt: 'Compare overtime to last quarter',
  messages: [
    { reasoningLabel: 'Time Data', durationSeconds: 4, body: 'Pulled 2 quarters of overtime hours for comparison.' },
    { reasoningLabel: 'Anomaly Detection', durationSeconds: 2, body: 'Overtime is up 12% with heavier warehouse weekend shifts.' },
  ] as Array<ChatMessage>,
}

export interface PromptSource {
  label: string
  description: string
}

export const promptBar = {
  sources: [
    { label: 'Payroll Data', description: 'Runs, off-cycles, and adjustments' },
    { label: 'Employee Records', description: '340 people, roles, and tags' },
    { label: 'Slack', description: 'Read and manage Slack' },
    { label: 'Gmail', description: 'Read and manage Gmail' },
  ] as Array<PromptSource>,
  placeholder: 'Ask about payroll, people, or compliance…',
}

export const selectionActions = {
  text: 'Overtime pay applies once an hourly employee crosses 40 hours in a single work week, calculated at 1.5x their regular rate.',
  actions: ['Explain', 'Improve', 'Shorten', 'Tone', 'Grammar'],
}

/* ---------------- Decisions & human-in-the-loop ---------------- */

export const approvalQuestion = {
  question: 'What should new hires default to for pay schedule?',
  options: ['Bi-weekly (most common)', 'Semi-monthly', 'Weekly'],
}

export type ConfidenceLevel = 'high' | 'needs-review' | 'no-signal'

export interface RecommendationAlternative {
  label: string
  confidence: ConfidenceLevel
}

export const recommendation = {
  title: 'Want me to approve this off-cycle payment?',
  detail: 'Reimburse $1,240 to Jordan Lee for relocation, coded to the Q3 mobility budget.',
  confidence: 'high' as ConfidenceLevel,
  alternatives: [
    { label: 'Split across two pay periods', confidence: 'needs-review' },
    { label: 'Deny and request a receipt', confidence: 'no-signal' },
  ] as Array<RecommendationAlternative>,
}

export const fineTune = {
  targetLabel: 'Employee card',
  width: 320,
  height: 128,
  radius: 12,
  opacity: 100,
  types: ['Compact', 'Detailed', 'Minimal'],
}

/* ---------------- Knowledge & data ---------------- */

export interface ContextChunk {
  title: string
  chars: number
  snippet: string
  sourceLabel: string
  sourceType: 'PDF' | 'CSV'
}

export const contextChunks = {
  totalChunks: 32,
  chunks: [
    {
      title: 'Overtime policy clause',
      chars: 290,
      snippet:
        'Manager approval is required before any overtime hours beyond 5 per week are logged for payout.',
      sourceLabel: 'Employee Handbook.pdf',
      sourceType: 'PDF',
    },
    {
      title: 'Q3 payroll velocity row',
      chars: 1250,
      snippet:
        'Q3 cost table: base pay +4%, overtime +18%, bonuses -6%; flag departments over budget by more than 10%.',
      sourceLabel: 'Payroll Cost Export.csv',
      sourceType: 'CSV',
    },
  ] as Array<ContextChunk>,
}

export interface DiffRow {
  employee: string
  schedule: string
  manager: string
  changed: 'schedule' | 'manager' | null
}

export const diffTable = {
  title: 'Proposed schedule cleanup',
  columns: ['Employee', 'Schedule', 'Manager'],
  rows: [
    { employee: 'Priya Nair', schedule: 'Bi-weekly', manager: 'r-alvarez', changed: null },
    { employee: 'Sam Okafor', schedule: 'Weekly', manager: 'j-chen', changed: null },
    { employee: 'Jordan Lee', schedule: 'Semi-monthly', manager: 'r-alvarez', changed: 'schedule' },
  ] as Array<DiffRow>,
}

export type ConnectionStrength =
  | 'very strong'
  | 'strong'
  | 'weak'
  | 'very weak'
  | 'no communication'

export interface VendorRecord {
  name: string
  location: string
  categories: Array<string>
  lastInteraction: string
  strength: ConnectionStrength
  link?: string
}

export const vendorRecords: Array<VendorRecord> = [
  { name: 'Aurora Payroll Services', location: 'Denver', categories: ['Payroll', 'Benefits'], lastInteraction: '9 days ago', strength: 'very strong', link: 'aurora-payroll.example.com' },
  { name: 'Blue Fig Compliance', location: 'Austin', categories: ['Compliance'], lastInteraction: 'over 1 year ago', strength: 'very weak', link: 'blue-fig.example.com' },
  { name: 'Cascade Benefits Group', location: 'Seattle', categories: ['Benefits', 'Wellness'], lastInteraction: '15 days ago', strength: 'weak', link: 'cascade-benefits.example.com' },
  { name: 'Harborline Tax Advisors', location: 'Boston', categories: ['Tax', 'Compliance'], lastInteraction: 'no contact', strength: 'no communication' },
  { name: 'Maple Orbit Staffing', location: 'Montréal', categories: ['Contractors', 'Staffing'], lastInteraction: '15 days ago', strength: 'weak', link: 'maple-orbit.example.com' },
  { name: 'Silver Pine Insurance', location: 'Portland', categories: ['Benefits'], lastInteraction: 'about 1 month ago', strength: 'very weak', link: 'silver-pine.example.com' },
]

export type FilterTableStatus = 'To do' | 'In Progress' | 'Completed'

export interface FilterTableRow {
  task: string
  date: string
  status: FilterTableStatus
  owner: string
}

export const filterTableRows: Array<FilterTableRow> = [
  { task: 'Reconcile overtime hours', date: 'Dec 03', status: 'To do', owner: 'Payroll Ops' },
  { task: 'Approve off-cycle batch', date: 'Sep 22', status: 'In Progress', owner: 'Jordan Lee' },
  { task: 'File Q3 tax filings', date: 'Jan 02', status: 'To do', owner: 'Harborline Tax' },
  { task: 'Audit contractor W-9s', date: 'Nov 08', status: 'In Progress', owner: 'Aurora Payroll' },
  { task: 'Close November payroll', date: 'Apr 14', status: 'Completed', owner: 'Payroll Ops' },
]

export interface InsightMetric {
  label: string
  changePct: number
  changeAmount: number
}

export const insightCard = {
  totalInsights: 3,
  headline: 'The worst performer in your @Warehouse team is overtime — up 8% or $3,204.44.',
  metrics: [
    { label: 'Warehouse OT', changePct: 8.12, changeAmount: 3204.44 },
    { label: 'Office OT', changePct: -1.15, changeAmount: -412.2 },
  ] as Array<InsightMetric>,
  followUp: 'Should I flag departments over budget?',
}

export const codeBlock = {
  filename: 'overtimeCheck.ts',
  language: 'TypeScript',
  lines: [
    'export async function flagOvertimeRisk(employeeId: string) {',
    '  const hours = await timeclock.weeklyHours(employeeId);',
    '  const rate = await payroll.hourlyRate(employeeId);',
    '  if (hours > 40) return { pay: (hours - 40) * rate * 1.5 };',
    '  return null;',
    '}',
  ],
}

/* ---------------- Navigation & discovery ---------------- */

export const sidebarNav = {
  workspaceName: 'Payroll Ops',
  workspaceSubtitle: 'Production Workspace',
  workspace: [
    { label: 'Home' },
    { label: 'Agent tasks', badge: 4 },
    { label: 'Inbox' },
  ],
  objects: [{ label: 'Employees' }, { label: 'Contractors' }, { label: 'Payroll runs', badge: 15 }],
}

export const searchPanel = {
  suggestedPrompts: [
    'Forecast next payroll cost',
    'Find contractors missing a W-9',
    'Compare overtime across departments',
    'Draft an off-cycle payment summary',
    'Check compliance status by state',
  ],
}
