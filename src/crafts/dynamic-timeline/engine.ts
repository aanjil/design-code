import type {
  DraftState,
  ExpResolution,
  ImpactSummary,
  MayaResolution,
  RankedItem,
  SamResolution,
  Signal,
} from './types'

export const TOTAL_EMPLOYEES = 43
export const SETTLED_EMPLOYEES = 41
export const BASE_TOTAL = 637_150
export const PRIOR_RUN_TOTAL = 612_400
export const WIRE_BUFFER_BASELINE_SECONDS = 40 * 60
/** Wallet routing adds a settlement leg - a real cost, not a countdown. */
export const WIRE_BUFFER_WALLET_COST_SECONDS = 6 * 60

export function fmtMoney(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString()}`
}

export const SIGNALS: Array<Signal> = [
  { label: "43 employees' logged hours, this pay period", source: 'timeclock.internal', age: '6 min ago' },
  { label: '6 expense submissions pending this cycle', source: 'expense.internal', age: '6 min ago' },
  { label: "Manager sign-off on Maya Chen's logged overtime", source: 'approvals feed', age: '2 days ago' },
  { label: 'Last closed payroll run - $612,400 total', source: 'payroll.internal', age: '14 days ago' },
  { label: "Time-off balances used in this draft", source: 'time-off module sync', age: '9 days ago', tone: 'stale' },
  { label: 'Sam Ortiz - direct-deposit bank details', source: 'HRIS profile field', age: 'missing', tone: 'missing' },
]

export const PRIORITY_RANKING: Array<RankedItem> = [
  {
    label: 'Sam Ortiz - payment undeliverable',
    why: 'high confidence, but highest stakes: doing nothing means he is not paid this cycle',
  },
  {
    label: 'Maya Chen - overtime over the policy ceiling',
    why: 'high confidence in the facts, medium stakes - reversible either way',
  },
  {
    label: 'Expense #4521 - possible duplicate',
    why: 'medium confidence, lowest stakes - fully deferrable to the employee',
  },
]

export const DEPRIORITIZED_NOTE =
  '41 employees whose timesheets, expenses, and time-off all agree with expectation - high confidence, no policy conflict, no deadline pressure. The 9-day-stale time-off sync was considered as a fourth tension and held back: no specific balance is known to have actually moved.'

export function samOutcomeText(v: SamResolution | null): string {
  if (v === 'hold') return 'held until he adds a bank account'
  if (v === 'wallet') return 'paid by wallet transfer - adds a settlement leg'
  if (v === 'delay') return 'the entire run is paused until this resolves'
  return 'still needs a decision'
}

export function mayaOutcomeText(v: MayaResolution | null): string {
  if (v === 'approve') return 'approved in full, per manager sign-off'
  if (v === 'cap') return 'capped at the 10h policy limit'
  if (v === 'ask') return "deferred, pending her manager's reconfirmation"
  return 'still needs a decision'
}

export function expOutcomeText(v: ExpResolution | null): string {
  if (v === 'reject') return 'rejected as a duplicate'
  if (v === 'approve') return 'approved - both charges are real'
  if (v === 'ask') return "deferred, pending Diego's answer"
  return 'still needs a decision'
}

export type ResolutionKind = 'unresolved' | 'resolved' | 'deferred'

export function samKind(v: SamResolution | null): ResolutionKind {
  return v === null ? 'unresolved' : 'resolved'
}
export function mayaKind(v: MayaResolution | null): ResolutionKind {
  if (v === null) return 'unresolved'
  return v === 'ask' ? 'deferred' : 'resolved'
}
export function expKind(v: ExpResolution | null): ResolutionKind {
  if (v === null) return 'unresolved'
  return v === 'ask' ? 'deferred' : 'resolved'
}

export function computeImpact(draft: DraftState): ImpactSummary {
  let total = BASE_TOTAL
  let risk = 892
  let affected = 1

  if (draft.sam === 'hold') total -= 1_840
  if (draft.maya === 'cap') total -= 340
  if (draft.maya === 'ask') {
    total -= 340
    affected += 1
  }
  if (draft.exp === 'reject') {
    total -= 892
    risk = 0
  }
  if (draft.exp === 'approve') risk = 0
  if (draft.exp === 'ask') {
    total -= 892
    risk = 892
    affected += 1
  }

  const halted = draft.sam === 'delay'
  const allSettled = draft.sam !== null && draft.maya !== null && draft.exp !== null
  const wireBufferAtRisk = draft.sam === 'wallet'
  const wireBufferSeconds = wireBufferAtRisk
    ? WIRE_BUFFER_BASELINE_SECONDS - WIRE_BUFFER_WALLET_COST_SECONDS
    : WIRE_BUFFER_BASELINE_SECONDS

  return { total, risk, affected, halted, allSettled, wireBufferSeconds, wireBufferAtRisk }
}

export function fmtBuffer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function consentStatement(draft: DraftState, impact: ImpactSummary): string {
  if (impact.halted) {
    return "You're approving nothing yet - the entire run is paused until Sam's tension resolves differently. No one will be paid on this attempt."
  }
  const paidCount = draft.sam === 'hold' ? TOTAL_EMPLOYEES - 1 : TOTAL_EMPLOYEES
  return (
    `You're approving payroll for ${paidCount} of ${TOTAL_EMPLOYEES} employees totaling ${fmtMoney(impact.total)}. ` +
    `Sam Ortiz is ${samOutcomeText(draft.sam)}. Maya Chen's overtime is ${mayaOutcomeText(draft.maya)}. ` +
    `Diego's expense is ${expOutcomeText(draft.exp)}.`
  )
}

export function unresolvedNote(draft: DraftState): string {
  const open: Array<string> = []
  if (draft.sam === 'hold') open.push('Sam Ortiz will not be paid this run - a reminder is set for 48h')
  if (draft.sam === 'delay') return 'Everything is on hold - nothing will be paid while the run is paused.'
  if (draft.maya === 'ask') open.push("Maya Chen's overtime line is excluded pending her manager")
  if (draft.exp === 'ask') open.push("Diego's $892 expense is excluded pending his answer")
  if (open.length === 0) return 'Nothing else outstanding - this covers every open item.'
  return `Still unresolved: ${open.join('. ')}.`
}
