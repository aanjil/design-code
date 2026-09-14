/**
 * Mock data for the Ask Emma craft (docs/foundations/grain.md), ported
 * from grain-flows_2.html's HOME view. Deterministic, no fetch - the
 * playground's WORLD_TODAY-style fixed-date convention (see
 * multi-payroll/engine.ts, schedule-report/engine.ts).
 */
import type { GrainExit, GrainFact } from '@/components/nds/grain/types'

export const WORLD_TODAY_LABEL = 'MONDAY 17 AUG'

export interface HistoryItem {
  id: string
  kind: 'run' | 'ask'
  title: string
  meta: string
}

export interface HistoryGroup {
  label: string
  items: Array<HistoryItem>
}

/** ▸ run = system-owned sequence · ○ ask = user-owned thread. */
export const HISTORY: Array<HistoryGroup> = [
  {
    label: 'TODAY',
    items: [
      { id: 'payroll-run', kind: 'run', title: 'Run payroll · Aug 16–31', meta: '3 steps · in progress' },
      { id: 'expense-run', kind: 'run', title: 'Expense report · Berlin', meta: '6 files · draft' },
      { id: 'pto-ask', kind: 'ask', title: 'PTO carryover policy', meta: '4 messages' },
    ],
  },
  {
    label: 'EARLIER',
    items: [
      { id: 'payroll-prior', kind: 'run', title: 'Run payroll · Aug 1–15', meta: '3 steps · paid' },
      { id: 'vendor-run', kind: 'run', title: 'Vendor from MSA', meta: '4 steps · created' },
      { id: 'waivers-ask', kind: 'ask', title: 'Why did waivers double?', meta: '7 messages' },
    ],
  },
]

export interface LauncherAlert {
  claim: string
  facts: Array<GrainFact>
  provenance: string
  exits: Array<GrainExit>
}

/** The blocking-payroll claim grain at the top of the launcher - the
 *  "launcher opens with a claim, not a text box" rule from grain-flows.
 *  Absent entirely in the empty-state variant (see home.tsx). */
export const LAUNCHER_ALERT: LauncherAlert = {
  claim: 'Payroll closes Friday and 3 exceptions are blocking it',
  facts: [
    { label: 'Aug 16–31 payroll — wire cutoff Fri 21 Aug 16:00', value: '3 days', tone: 'warn' },
    { label: 'Sam Ortiz — no bank account on file', value: 'blocks payment', tone: 'stop' },
    { label: '2 more exceptions in timesheets and expenses', value: '2' },
  ],
  provenance: '44 employees scanned · 9 min ago',
  exits: [{ label: 'Start the run', variant: 'primary' }],
}

export interface StartCard {
  id: string
  title: string
  blurb: string
  due?: string
}

export const START_CARDS: Array<StartCard> = [
  {
    id: 'payroll',
    title: 'Run payroll',
    blurb: 'Regular, off-cycle, bonus, contractor, final pay',
    due: 'DUE FRI',
  },
  {
    id: 'expense',
    title: 'Build an expense report',
    blurb: 'Drop receipts — Emma extracts and groups them',
  },
  {
    id: 'vendor',
    title: 'Create a vendor from a contract',
    blurb: 'Upload an MSA — vendor, bill and invoice',
  },
  {
    id: 'hire',
    title: 'Onboard a new hire',
    blurb: 'Offer, contract, benefits, payroll record',
  },
]
