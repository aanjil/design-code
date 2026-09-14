import type { GrainExit, GrainFact } from '@/components/nds/grain/types'
import type { TensionDef } from './tension'

export const WHICH_PAYROLL = {
  claim: 'Regular payroll, Aug 16–31 — that’s the one that’s due',
  confidence: 0.93,
  facts: [
    { label: '44 people · Anjil Crafts, Anjil Crafts Spain', value: 'semi-monthly' },
    { label: 'Pay date', value: 'Fri 21 Aug' },
    { label: 'Last regular run', value: 'Aug 1–15 · paid' },
  ] as Array<GrainFact>,
  provenance: 'schedule + cutoff calendar · alternatives are equal, not hidden',
  exits: [
    { label: 'Off-cycle', variant: 'default' },
    { label: 'Bonus run', variant: 'default' },
    { label: 'Contractor batch', variant: 'default' },
    { label: 'Final pay — Emily Jones', variant: 'default' },
    { label: 'Yes, regular', variant: 'primary' },
  ] as Array<GrainExit>,
  doneSummary: 'Regular payroll · Aug 16–31 · 44 people · pay date Fri 21 Aug',
}

/** Ported from grain-flows_2.html's payroll run - Prepare's two findings. */
export const PAYROLL_SELECTION: { claim: string; confidence: number; facts: Array<GrainFact>; provenance: string } = {
  claim: '3 of 44 need you — the rest are clean',
  confidence: 0.91,
  facts: [
    { label: 'Payments — Sam Ortiz, no bank on file', value: '1 · blocks pay', tone: 'stop' },
    { label: 'Timesheets — Maya Chen, overtime over ceiling', value: '1' },
    { label: 'Expenses — Diego Alvarez, possible duplicate', value: '1' },
    { label: 'Timesheets, expenses and time off all clear', value: '41 · deprioritised', tone: 'muted' },
    { label: 'Time-off requests auto-cleared under policy', value: '4 · deprioritised', tone: 'muted' },
  ],
  provenance: 'ranked by payroll-blocking × missing data · 44 scanned',
}

export const PAYROLL_DIFFERENCE = {
  claim: '$24,750 more than last run — overtime and 2 raises',
  facts: [
    { label: 'Prior run · Aug 1–15', value: '$612,400', tone: 'del' },
    { label: 'This run · draft', value: '$637,150' },
    { label: 'Overtime above the auto-approve ceiling', value: '$14,200', tone: 'warn' },
    { label: 'Comp changes approved since Aug 6', value: '2 · $10,550' },
  ] as Array<GrainFact>,
  provenance: 'vs Aug 1–15 · time-off balances synced 9 days ago, may lag accruals',
  exits: [{ label: 'Full data →', variant: 'quiet' }] as Array<GrainExit>,
}

export const PAYROLL_TENSIONS: Array<TensionDef> = [
  {
    claim: 'Sam Ortiz has no way to be paid',
    confidence: 0.68,
    facts: [
      { label: 'Bank account on file', value: 'none', tone: 'stop' },
      { label: 'Status', value: 'first cycle · new hire' },
      { label: 'Net pay held', value: '$3,072.00' },
    ],
    provenance: 'HRIS bank field empty · first cycle, not a fraud signal',
    exits: [
      { label: 'Hold Sam, run the rest', variant: 'default' },
      { label: 'Pay by wallet once added', variant: 'default' },
      { label: 'Delay the whole run', variant: 'quiet' },
    ],
    resolvedSummary: 'Sam held · 43 paid on schedule · $3,072 carried to next run',
  },
  {
    claim: 'Maya Chen’s overtime is over the policy ceiling',
    confidence: 0.35,
    facts: [
      { label: 'Hours logged · week of Aug 11', value: '54.5 h · 14.5 OT' },
      { label: 'Auto-approval ceiling', value: '10 h OT' },
      { label: 'Manager sign-off', value: 'approved, no note', tone: 'add' },
    ],
    provenance: 'at .35 there is no recommendation — three equal readings',
    exits: [
      { label: 'Approve the full 14.5 h', variant: 'default' },
      { label: 'Cap at the 10 h limit', variant: 'default' },
      { label: 'Send back to her manager', variant: 'quiet' },
    ],
    resolvedSummary: 'Capped at 10 h · 4.5 h flagged to her manager',
  },
  {
    claim: 'Expense #4521 looks like a duplicate — Diego Alvarez',
    confidence: 0.58,
    facts: [
      { label: '#4521 · Diego Alvarez · 12 Aug', value: '$892.00' },
      { label: '#4498 · same vendor · 9 Aug', value: '$892.00' },
    ],
    provenance: 'vendor + amount + ±3 day match · receipts not compared',
    exits: [
      { label: 'Reject as a duplicate', variant: 'default' },
      { label: 'Approve both', variant: 'default' },
      { label: 'Ask Diego', variant: 'quiet' },
    ],
    resolvedSummary: '#4521 rejected · duplicate of #4498 · Diego notified',
  },
]

export const PAYROLL_CONSEQUENCE = {
  claim: 'Paying 43 of 44 — $634,078, one held',
  facts: [
    { label: 'Draft total · 44 people', value: '$637,150', tone: 'del' },
    { label: 'Sam Ortiz held — no bank account', value: '−$3,072', tone: 'stop' },
    { label: 'Payroll total · 43 people', value: '$634,078' },
    { label: 'Wire cutoff buffer', value: '39h 57m', tone: 'warn' },
    { label: 'Maya’s flagged 4.5 h — carried to next run', value: '$312', tone: 'warn' },
  ] as Array<GrainFact>,
  provenance: 'recalculated from step 2 · cutoff from the banking partner feed',
  exits: [{ label: 'Open full review →', variant: 'quiet' }] as Array<GrainExit>,
}

export const PAYROLL_APPROVAL = {
  claim: 'Approve payroll for 43 people — $634,078',
  body: 'Submits to the bank on approval. Sam’s $3,072 carries to the next run and stays visible in Payments.',
  provenance: 'reversible for 2 hours after approval · then it settles',
  exits: [
    { label: 'Approve and submit', variant: 'primary' },
    { label: 'Review one by one', variant: 'default' },
  ] as Array<GrainExit>,
}

export const PAYROLL_SUBMITTED = {
  claim: 'Submitted — 43 people, $634,078',
  facts: [
    { label: 'Sent to the bank', value: 'PAY-8841' },
    { label: 'Expected settlement', value: 'Fri 21 Aug' },
    { label: 'Sam Ortiz — carried', value: '$3,072', tone: 'warn' },
  ] as Array<GrainFact>,
  provenance: 'approved 14:20 · you · reversible until 16:20',
}
