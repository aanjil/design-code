/**
 * Mock data for the Grain catalog (docs/foundations/grain.md), ported from
 * the ten-grains spec. Deterministic, on-domain for Niural (payroll, HR,
 * compliance, payments, benefits) - no fetch. One canonical scenario per
 * grain kind; the docs pages add their own "try this" state variants on
 * top of these.
 */
import type { GrainScenario } from '@/components/nds/grain/types'

export const GRAIN_SCENARIOS: Array<GrainScenario> = [
  {
    kind: 'tension',
    title: 'Tension',
    domain: 'Payroll',
    declaration: 'LOW CONFIDENCE · TERMINAL · STAMPED · SLOT 1',
    claim: 'Priya Nair is on two payrolls this cycle',
    confidence: 0.34,
    liveness: { kind: 'live' },
    terminal: true,
    risk: true,
    facts: [
      { label: 'Anjil Crafts · New York — semi-monthly, since Jan 2024', value: '$6,250.00' },
      { label: 'Anjil Craft Nepal · Kathmandu — monthly, since Aug 1', value: 'NPR 180,000' },
      { label: 'Same work email, same tax ID', value: 'p.nair@anjilcrafts.com' },
      { label: 'Termination on the US record', value: 'none', tone: 'stop' },
    ],
    provenance: 'Transferred to Nepal on Aug 1, or a duplicate record?',
    exits: [
      { label: 'Transfer — prorate both', variant: 'default' },
      { label: 'Duplicate — pay Nepal only', variant: 'default' },
      { label: 'Ask Priya’s manager', variant: 'quiet' },
    ],
  },
  {
    kind: 'difference',
    title: 'Difference',
    domain: 'HR',
    declaration: 'HIGH · TERMINAL · LIVE · SLOT 2',
    claim: '4 things changed in People since you last approved payroll',
    badge: 'LIVE',
    liveness: { kind: 'live' },
    terminal: true,
    facts: [
      { label: 'New hires · Barcelona — start Sep 1', value: '+2', tone: 'add' },
      { label: 'David Wilson · Analyst — comp change approved by Priya', value: '+8%', tone: 'add' },
      { label: 'Emily Jones — resignation, last day Aug 29', value: 'final pay due', tone: 'stop' },
      { label: 'Kinsley Harrell — title change, no comp change', value: 'no payroll effect', tone: 'muted' },
    ],
    provenance: 'vs your approval on Aug 6 14:12 · 148 people scanned',
    exits: [
      { label: 'What does this cost?', variant: 'default' },
      { label: 'Open People →', variant: 'default' },
    ],
  },
  {
    kind: 'approval',
    title: 'Approval',
    domain: 'Payments',
    declaration: 'MED–HIGH · TERMINAL · STAMPED · IN THREAD OR SLOT 2',
    claim: 'Pay 23 contractors — $47,180 across 4 currencies',
    confidence: 0.93,
    liveness: { kind: 'live' },
    terminal: true,
    facts: [
      { label: 'USD · 12 people', value: '$28,400.00' },
      { label: 'EUR · 6 people · Barcelona', value: '€9,200.00' },
      { label: 'NPR · 3 people · Kathmandu', value: 'NPR 1,240,000' },
      { label: 'GBP · 2 people', value: '£3,100.00' },
      { label: 'Funding — Anjil Crafts operating account', value: 'confirmed', tone: 'add' },
    ],
    provenance: 'FX locked 09:00 Aug 17 · reversible until the 16:00 cutoff',
    exits: [
      { label: 'Pay 23', variant: 'primary' },
      { label: 'Review one by one', variant: 'default' },
    ],
  },
  {
    kind: 'consequence',
    title: 'Consequence',
    domain: 'Payroll · Benefits',
    declaration: 'ANY CONFIDENCE · TERMINAL · LIVE · ADJACENT TO A DECISION',
    claim: 'Approving 3 changes moves Friday’s run by $4,062',
    badge: 'LIVE',
    liveness: { kind: 'live' },
    terminal: true,
    facts: [
      { label: 'Payroll total · Aug 21', value: '$251,406 → $255,468' },
      { label: '401(k) employer match · annualised', value: '+$1,224', tone: 'add' },
      { label: 'David moves above the Analyst band ceiling', value: 'by $4,100', tone: 'stop' },
      { label: 'Nepal entity funding buffer', value: 'falls to 2.4 days', tone: 'stop' },
    ],
    provenance: 'FX at Aug 17 09:00 · buffer assumes no other outflows',
    exits: [
      { label: 'Approve selected', variant: 'primary' },
      { label: 'Exclude Nepal', variant: 'default' },
    ],
  },
  {
    kind: 'selection',
    title: 'Selection',
    domain: 'Compliance',
    declaration: 'HIGH · TERMINAL · LIVE · SLOT 2',
    claim: '7 of 148 people have a document expiring before the next run',
    confidence: 0.89,
    liveness: { kind: 'live' },
    terminal: true,
    facts: [
      { label: 'Work authorisation expires in under 30 days — blocks payroll', value: '3' },
      { label: 'I-9 reverification overdue', value: '2' },
      { label: 'Nepal SSF registration missing — new entity', value: '2' },
    ],
    provenance: 'ranked by payroll-blocking × days to expiry · 148 scanned',
    exits: [
      { label: 'Start with the 3 blockers', variant: 'primary' },
      { label: 'Open compliance →', variant: 'default' },
    ],
  },
  {
    kind: 'draft',
    title: 'Draft',
    domain: 'Benefits',
    declaration: 'MED · TRANSITIONAL · STAMPED · IN THREAD',
    claim: 'Benefits enrolment prepared for 2 Barcelona hires — 11 of 14 fields',
    badge: 'DRAFT',
    liveness: { kind: 'live' },
    terminal: false,
    facts: [
      { label: 'Copied from your Spain plan defaults — Sanitas Plan B', value: '11 fields' },
      { label: 'Dependants — no records on file', value: 'NEEDS YOU', tone: 'warn' },
      { label: 'Plan tier — Standard or Plus', value: 'NEEDS YOU', tone: 'warn' },
      { label: 'Effective date — hire date or 1st of month', value: 'NEEDS YOU', tone: 'warn' },
    ],
    provenance: 'draft saved · nothing submitted · enrolment window closes Sep 15',
    exits: [{ label: 'Finish in Benefits →', variant: 'primary' }],
  },
  {
    kind: 'evidence',
    title: 'Evidence',
    domain: 'Payments',
    declaration: 'ANY · TERMINAL · STAMPED · IN THREAD',
    claim: 'The invoice says €7,400. The payment request is €8,140.',
    confidence: 0.81,
    liveness: { kind: 'live' },
    terminal: true,
    risk: true,
    facts: [
      { label: 'Invoice INV-2291 · subtotal', value: '€6,116.00' },
      { label: 'Invoice INV-2291 · IVA 21%', value: '€1,284.00' },
      { label: 'Invoice total', value: '€7,400.00' },
      { label: 'Payment request PR-1180', value: '€8,140.00', tone: 'stop' },
      { label: 'Difference — equals 10% of subtotal, rush fee?', value: '+€740.00', tone: 'stop' },
    ],
    provenance: 'OCR .81 · totals line is handwritten · no second invoice attached',
    exits: [
      { label: 'Pay €7,400', variant: 'primary' },
      { label: 'Ask Gráficas BCN', variant: 'default' },
      { label: 'Open invoice', variant: 'quiet' },
    ],
  },
  {
    kind: 'insight',
    title: 'Insight',
    domain: 'Benefits',
    declaration: 'MED · TRANSITIONAL · LIVE · SLOT 2 OR THREAD',
    claim: 'Coverage waivers doubled after the May plan change — 31% of US staff now decline',
    badge: 'LIVE',
    liveness: { kind: 'live' },
    terminal: false,
    facts: [
      { label: 'Employee premium share, before → after May', value: '10% → 25%' },
      { label: 'Waiver rate, before → after', value: '14% → 31%', tone: 'stop' },
      { label: 'People now holding no coverage', value: '18', tone: 'stop' },
    ],
    provenance: '94 US employees · monthly enrolment records · excludes contractors',
    exits: [
      { label: 'Model a 15% share', variant: 'default' },
      { label: 'Open benefits →', variant: 'default' },
    ],
  },
  {
    kind: 'basis',
    title: 'Basis',
    domain: 'Compliance',
    declaration: 'ANY · TERMINAL · STAMPED · PULLED, NEVER PUSHED',
    claim: 'Michael Brown is owed 6.5 hours of overtime this week',
    confidence: 0.92,
    liveness: { kind: 'live' },
    terminal: true,
    facts: [
      { label: 'Hours logged · week of Aug 11 · San Francisco', value: '47.5 h' },
      { label: 'Overtime at 1.5×', value: '6.5 h · $487.50' },
    ],
    provenance: 'CA · timesheet TS-3390 · approved by his manager',
    exits: [
      { label: 'Why?', variant: 'quiet' },
      { label: 'Open timesheet →', variant: 'default' },
    ],
  },
  {
    kind: 'question',
    title: 'Question',
    domain: 'Payments',
    declaration: 'LOW · TERMINAL · LIVE · MAX ONE PER SESSION',
    claim: 'Fourth time this quarter — should contractor invoices under $500 approve themselves?',
    confidence: 0.29,
    liveness: { kind: 'live' },
    terminal: true,
    facts: [
      { label: 'Under $500, approved by you, last 90 days', value: '23 of 24' },
      { label: 'Rejected — a duplicate from Gráficas BCN', value: '1' },
      { label: 'Median time you spent on each', value: '11 seconds' },
    ],
    provenance: 'becomes a rule in Policies · editable, revocable, logged',
    exits: [
      { label: 'Auto-approve under $500', variant: 'primary' },
      { label: 'Keep asking me', variant: 'default' },
      { label: 'Not now', variant: 'quiet' },
    ],
  },
]

export function getGrainScenario(kind: GrainScenario['kind']): GrainScenario {
  const scenario = GRAIN_SCENARIOS.find((s) => s.kind === kind)
  if (!scenario) throw new Error(`No grain scenario for kind "${kind}"`)
  return scenario
}
