/**
 * Multi-payroll transition engine (agent-build-instructions §5–§6).
 * Pure date + pay math so D2/D3/D4 states are computed, not mocked.
 * All dates are local-parts ISO (yyyy-mm-dd) - never Date#toISOString
 * (timezone shift bug, see AGENTS.md).
 */

import type { Employee } from '@/mocks/employees'
// Type-only - mocks/payroll.ts imports *values* from this file, so a runtime
// import here would cycle. `import type` is erased at compile time, so this
// stays safe (PaySchedule is only used in type positions below).
import type { PaySchedule } from '@/mocks/payroll'

export type Frequency = 'Weekly' | 'Bi-weekly' | 'Semi-monthly' | 'Monthly'

/** Fixed "today" so every state is deterministic and screenshot-stable. */
export const WORLD_TODAY = '2026-07-15'
export const HOURLY_EXAMPLE_RATE = 28.85
export const MONTHLY_PREMIUM = 420
export const PTO_ANNUAL_HOURS = 120
/** Payroll processing deadline: N working days before period end. */
export const DEADLINE_WORKING_DAYS = 3
/**
 * Retro lookback cap - open PM question (1 period vs 1 year), so a constant.
 * Expressed in days per old frequency ≈ one pay period.
 */
export const LOOKBACK_DAYS: Record<Frequency, number> = {
  Weekly: 7,
  'Bi-weekly': 14,
  'Semi-monthly': 15,
  Monthly: 30,
}

export const RUNS_PER_YEAR: Record<Frequency, number> = {
  Weekly: 52,
  'Bi-weekly': 26,
  'Semi-monthly': 24,
  Monthly: 12,
}

/** Bi-weekly periods anchor to this Monday. */
const BIWEEKLY_ANCHOR = '2026-01-05'

/* ---------------- date helpers (local parts) ---------------- */

interface Parts {
  y: number
  m: number // 1-12
  d: number
}

export function parseISO(iso: string): Parts {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function fmt({ y, m, d }: Parts): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

function toSerial({ y, m, d }: Parts): number {
  // Days since epoch via UTC (parts only - no local timezone involved).
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

function fromSerial(serial: number): Parts {
  const dt = new Date(serial * 86400000)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

export function addDaysISO(iso: string, n: number): string {
  return fmt(fromSerial(toSerial(parseISO(iso)) + n))
}

export function diffDays(a: string, b: string): number {
  return toSerial(parseISO(b)) - toSerial(parseISO(a))
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(iso: string): number {
  // serial 0 = 1970-01-01 (Thursday = 4)
  return (((toSerial(parseISO(iso)) + 4) % 7) + 7) % 7
}

export function isWeekend(iso: string): boolean {
  const dow = dayOfWeek(iso)
  return dow === 0 || dow === 6
}

/** Inclusive Mon–Fri count; 0 when b < a. */
export function workingDaysBetween(a: string, b: string): number {
  const start = toSerial(parseISO(a))
  const end = toSerial(parseISO(b))
  let n = 0
  for (let s = start; s <= end; s++) {
    const dow = (((s + 4) % 7) + 7) % 7
    if (dow !== 0 && dow !== 6) n++
  }
  return n
}

function subtractWorkingDays(iso: string, n: number): string {
  let cur = iso
  let left = n
  while (left > 0) {
    cur = addDaysISO(cur, -1)
    if (!isWeekend(cur)) left--
  }
  return cur
}

export function fmtHuman(iso: string): string {
  const { y, m, d } = parseISO(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} ${d}, ${y}`
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
/** Weekday name for a date - e.g. a schedule's real next payday, so "Pay
 *  day: Tuesday" is derived, never a separately hand-typed fact that could
 *  drift out of sync with `nextPayday`. */
export function weekdayName(iso: string): string {
  return WEEKDAY_NAMES[dayOfWeek(iso)]
}

export const round2 = (n: number): number => Math.round(n * 100) / 100

export const money = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* ---------------- pay periods ---------------- */

export interface Period {
  start: string
  end: string
}

/** The pay period of `freq` containing `iso`. */
export function periodOf(freq: Frequency, iso: string): Period {
  const p = parseISO(iso)
  switch (freq) {
    case 'Monthly':
      return {
        start: fmt({ ...p, d: 1 }),
        end: fmt({ ...p, d: daysInMonth(p.y, p.m) }),
      }
    case 'Semi-monthly':
      return p.d <= 15
        ? { start: fmt({ ...p, d: 1 }), end: fmt({ ...p, d: 15 }) }
        : { start: fmt({ ...p, d: 16 }), end: fmt({ ...p, d: daysInMonth(p.y, p.m) }) }
    case 'Weekly': {
      const dow = dayOfWeek(iso) // Mon-start weeks
      const back = (dow + 6) % 7
      const start = addDaysISO(iso, -back)
      return { start, end: addDaysISO(start, 6) }
    }
    case 'Bi-weekly': {
      const idx = Math.floor(diffDays(BIWEEKLY_ANCHOR, iso) / 14)
      const start = addDaysISO(BIWEEKLY_ANCHOR, idx * 14)
      return { start, end: addDaysISO(start, 13) }
    }
  }
}

/** Period ends of `freq` inside [from, to] (pay date = period end). */
export function periodEndsBetween(freq: Frequency, from: string, to: string): Array<string> {
  const ends: Array<string> = []
  let cursor = from
  for (let guard = 0; guard < 80; guard++) {
    const { end } = periodOf(freq, cursor)
    if (diffDays(from, end) >= 0 && diffDays(end, to) >= 0) ends.push(end)
    cursor = addDaysISO(end, 1)
    if (diffDays(cursor, to) < 0) break
  }
  return ends
}

/* ---------------- transition math (§5) ---------------- */

export interface Transition {
  classification: 'Clean proration' | 'Overlap' | 'Gap'
  /** Overlap: the window the old run already paid (suppressed, no retro). */
  suppressed: boolean
  gapStart: string
  gapEnd: string
  gapWorkingDays: number
  gapHours: number
  retro: number
  regularStart: string
  firstRunEnd: string
  regularDays: number
  regularHours: number
  regularPay: number
  total: number
  benefits: {
    remainingPremium: number
    checksThisMonth: number
    perCheck: number
    lastCheck: number
  }
  pto: {
    oldRate: number
    newRate: number
    accruedHours: number
    remainingHours: number
    remainingRuns: number
  }
}

export function computeTransition(
  oldFreq: Frequency,
  newFreq: Frequency,
  effectiveDate: string,
  rate: number = HOURLY_EXAMPLE_RATE,
): Transition {
  const oldPeriod = periodOf(oldFreq, effectiveDate)
  const deadline = subtractWorkingDays(oldPeriod.end, DEADLINE_WORKING_DAYS)
  const overlap =
    diffDays(deadline, effectiveDate) > 0 && diffDays(effectiveDate, oldPeriod.end) >= 0

  // Last completed old run ends the day before the old period containing eff.
  const gapStart = oldPeriod.start
  const gapEnd = addDaysISO(effectiveDate, -1)
  const rawGapDays = workingDaysBetween(gapStart, gapEnd)

  let classification: Transition['classification']
  let gapWorkingDays: number
  let regularStart: string

  if (overlap) {
    // Old run already processed through its period end - that window is paid.
    classification = 'Overlap'
    gapWorkingDays = 0
    regularStart = addDaysISO(oldPeriod.end, 1)
  } else if (rawGapDays > 0) {
    classification = 'Gap'
    gapWorkingDays = rawGapDays
    regularStart = effectiveDate
  } else {
    classification = 'Clean proration'
    gapWorkingDays = 0
    regularStart = effectiveDate
  }

  const gapHours = gapWorkingDays * 8
  const retro = round2(gapHours * rate)

  const firstRunEnd = periodOf(newFreq, regularStart).end
  const regularDays = workingDaysBetween(regularStart, firstRunEnd)
  const regularHours = regularDays * 8
  const regularPay = round2(regularHours * rate)
  const total = round2(retro + regularPay)

  // Benefits true-up: the effective month always nets to the monthly premium.
  const effParts = parseISO(effectiveDate)
  const monthStart = fmt({ ...effParts, d: 1 })
  const monthEnd = fmt({ ...effParts, d: daysInMonth(effParts.y, effParts.m) })
  const paydays = periodEndsBetween(newFreq, monthStart, monthEnd).filter(
    (end) => diffDays(effectiveDate, end) >= 0,
  )
  const checksThisMonth = paydays.length
  const remainingPremium = MONTHLY_PREMIUM
  const perCheck = checksThisMonth > 0 ? round2(remainingPremium / checksThisMonth) : 0
  const lastCheck =
    checksThisMonth > 0
      ? round2(remainingPremium - perCheck * (checksThisMonth - 1))
      : 0

  // PTO re-rate: annual cap preserved.
  const jan1 = fmt({ y: effParts.y, m: 1, d: 1 })
  const doy = diffDays(jan1, effectiveDate) + 1
  const accruedHours = round2((PTO_ANNUAL_HOURS * (doy - 1)) / 365)
  const remainingHours = round2(PTO_ANNUAL_HOURS - accruedHours)
  const dec31 = fmt({ y: effParts.y, m: 12, d: 31 })
  const remainingRuns = periodEndsBetween(newFreq, effectiveDate, dec31).length
  const pto = {
    oldRate: round2(PTO_ANNUAL_HOURS / RUNS_PER_YEAR[oldFreq]),
    newRate: remainingRuns > 0 ? round2(remainingHours / remainingRuns) : 0,
    accruedHours,
    remainingHours,
    remainingRuns,
  }

  return {
    classification,
    suppressed: overlap,
    gapStart: overlap ? effectiveDate : gapStart,
    gapEnd: overlap ? oldPeriod.end : gapEnd,
    gapWorkingDays,
    gapHours,
    retro,
    regularStart,
    firstRunEnd,
    regularDays,
    regularHours,
    regularPay,
    total,
    benefits: { remainingPremium, checksThisMonth, perCheck, lastCheck },
    pto,
  }
}

/* ---------------- effective-date validation (§6) ---------------- */

export type ValidationLevel = 'ok' | 'info' | 'warn' | 'pending' | 'block'

export interface DateValidation {
  level: ValidationLevel
  code: 'ok' | 'non-working' | 'retro' | 'future' | 'beyond-lookback' | 'pre-hire'
  message: string
  /** Set when the chosen date also falls on a weekend. */
  weekend: boolean
}

export function validateEffectiveDate(
  effectiveDate: string,
  hireDate: string,
  oldFreq: Frequency,
  today: string = WORLD_TODAY,
): DateValidation {
  const weekend = isWeekend(effectiveDate)
  if (diffDays(hireDate, effectiveDate) < 0) {
    return {
      level: 'block',
      code: 'pre-hire',
      message: `Effective date can't pre-date the hire date (${fmtHuman(hireDate)}).`,
      weekend,
    }
  }
  const lookbackFloor = addDaysISO(today, -LOOKBACK_DAYS[oldFreq])
  if (diffDays(lookbackFloor, effectiveDate) < 0) {
    return {
      level: 'block',
      code: 'beyond-lookback',
      message: `Max retro window is one pay period (back to ${fmtHuman(lookbackFloor)}).`,
      weekend,
    }
  }
  if (diffDays(effectiveDate, today) > 0) {
    return {
      level: 'warn',
      code: 'retro',
      message: 'Past date - retro pay will be calculated for the gap.',
      weekend,
    }
  }
  if (diffDays(today, effectiveDate) > 0) {
    return {
      level: 'pending',
      code: 'future',
      message: `Future date - employee stays on the current schedule until ${fmtHuman(effectiveDate)}.`,
      weekend,
    }
  }
  if (weekend) {
    return {
      level: 'info',
      code: 'non-working',
      message: 'Non-working day - proration counts the next working day.',
      weekend,
    }
  }
  return { level: 'ok', code: 'ok', message: 'Takes effect immediately.', weekend }
}

/* ---------------- membership rule matching (PRD §4) ---------------- */

/** Only attributes that exist on the mock `Employee` type. The PRD's full
 *  attribute list also has Team/Department/Manager/Cost center/Start date -
 *  none of those exist on `Employee` yet, so they're out of scope here. */
export type RuleAttribute = 'compensationType' | 'employeeType' | 'workLocation' | 'jobTitle'
export type RuleOperator = 'is' | 'is-not'

export interface RuleCondition {
  attribute: RuleAttribute
  operator: RuleOperator
  /** `is` matches when the field is one of `values`; `is-not` when it
   *  isn't. Works uniformly whether `values` holds one item (a plain
   *  enum pick) or several (a list attribute with multiple selections). */
  values: Array<string>
}

/** `and` conditions all apply; `orGroup` (if present) is a second bucket where
 *  ANY one condition applying is enough - mirrors the PRD's "Include employees
 *  where… [rows] … ANY of (OR)" rule-builder shape. */
export interface Rule {
  and: Array<RuleCondition>
  orGroup?: Array<RuleCondition>
}

export const RULE_ATTRIBUTE_LABELS: Record<RuleAttribute, string> = {
  compensationType: 'Compensation type',
  employeeType: 'Employee type',
  workLocation: 'Work location',
  jobTitle: 'Job title',
}

function conditionMatches(employee: Employee, condition: RuleCondition): boolean {
  const field = employee[condition.attribute]
  const inValues = condition.values.includes(field)
  return condition.operator === 'is-not' ? !inValues : inValues
}

export function matchEmployees(rule: Rule, employees: Array<Employee>): Array<Employee> {
  return employees.filter((e) => {
    if (!rule.and.every((c) => conditionMatches(e, c))) return false
    if (!rule.orGroup || rule.orGroup.length === 0) return true
    return rule.orGroup.some((c) => conditionMatches(e, c))
  })
}

function operatorWord(operator: RuleOperator): string {
  return operator === 'is-not' ? 'is not' : 'is'
}

function describeCondition(c: RuleCondition): string {
  return `${RULE_ATTRIBUTE_LABELS[c.attribute]} ${operatorWord(c.operator)} ${c.values.join(', ')}`
}

/** Plain-language read-back (PRD §4) - the single source of truth for what a
 *  schedule's rule says, so card copy can never drift from what's actually
 *  matched. `null` is the default schedule's empty rule. */
export function describeRule(rule: Rule | null): string {
  if (!rule) return 'No conditions'
  const parts = rule.and.map(describeCondition)
  if (rule.orGroup && rule.orGroup.length > 0) {
    parts.push(`(${rule.orGroup.map(describeCondition).join(' OR ')})`)
  }
  return parts.join(' AND ')
}

/* ---------------- state pay-frequency compliance ---------------- */

const FREQUENCY_RANK: Record<Frequency, number> = {
  Weekly: 4,
  'Bi-weekly': 3,
  'Semi-monthly': 2,
  Monthly: 1,
}

/** Minimum legally-required pay frequency by work-location state (subset of
 *  the PRD's state table - just the states seeded into mock data). */
export const STATE_MIN_FREQUENCY: Record<string, Frequency> = {
  California: 'Semi-monthly',
  'New York': 'Weekly',
  Texas: 'Semi-monthly',
  Washington: 'Monthly',
}

/** True if `targetFrequency` satisfies the employee's state minimum (or the
 *  employee's location has no tracked state law). */
export function checkStateCompliance(employee: Employee, targetFrequency: Frequency): boolean {
  const required = STATE_MIN_FREQUENCY[employee.workLocation]
  if (!required) return true
  return FREQUENCY_RANK[targetFrequency] >= FREQUENCY_RANK[required]
}

/* ---------------- rule evaluation: matches, movers, conflicts, compliance ---------------- */

export interface RuleEvaluation {
  matched: Array<Employee>
  /** Matched employees currently on the default (unruled) schedule - a clean move, no conflict. */
  movers: Array<Employee>
  /** Matched employees currently on a different named schedule - need review. */
  conflicts: Array<{ employee: Employee; currentSchedule: PaySchedule }>
  /** Matched employees whose work-location state requires a more frequent payday than `targetFrequency`. */
  complianceViolations: Array<{ employee: Employee; requiredFrequency: Frequency }>
}

/**
 * Full live-panel computation for the rule builder (PRD §4): who matches,
 * who's a clean mover vs. a conflict needing review, and who the chosen
 * frequency would leave non-compliant. `currentScheduleOf` is injected
 * (rather than imported) so this file never depends on mocks/payroll.ts -
 * see the import-cycle note at the top of this file.
 */
export function evaluateRule(
  rule: Rule,
  employees: Array<Employee>,
  targetFrequency: Frequency,
  currentScheduleOf: (employee: Employee) => PaySchedule,
  defaultScheduleId: string,
): RuleEvaluation {
  const matched = matchEmployees(rule, employees)
  const movers: Array<Employee> = []
  const conflicts: RuleEvaluation['conflicts'] = []
  const complianceViolations: RuleEvaluation['complianceViolations'] = []

  for (const employee of matched) {
    const currentSchedule = currentScheduleOf(employee)
    if (currentSchedule.id === defaultScheduleId) {
      movers.push(employee)
    } else {
      conflicts.push({ employee, currentSchedule })
    }
    if (!checkStateCompliance(employee, targetFrequency)) {
      complianceViolations.push({ employee, requiredFrequency: STATE_MIN_FREQUENCY[employee.workLocation] })
    }
  }

  return { matched, movers, conflicts, complianceViolations }
}

/* ---------------- AI-suggested starter schedules ---------------- */

export interface AiSuggestedSchedule {
  name: string
  /** `null` only for the trailing "everyone else" catch-all. */
  rule: Rule | null
  frequency: Frequency
  matched: Array<Employee>
  /** Set when the group's default frequency wouldn't satisfy every matched
   *  employee's work-location state law - the suggestion bumps frequency up
   *  rather than proposing a schedule that needs fixing on day one. */
  complianceNote?: string
}

interface SuggestionSeed {
  name: string
  rule: Rule
  baseFrequency: Frequency
}

/** Same real, first-match-wins partition the product's own seeded schedules
 *  use (mocks/payroll.ts) - defined independently here so engine.ts stays
 *  import-cycle-free (see the top-of-file note on PaySchedule). */
const SUGGESTION_SEEDS: Array<SuggestionSeed> = [
  {
    name: 'Contractors',
    rule: { and: [{ attribute: 'employeeType', operator: 'is', values: ['Contractor'] }] },
    baseFrequency: 'Weekly',
  },
  {
    name: 'EOR Staff',
    rule: { and: [{ attribute: 'employeeType', operator: 'is', values: ['EOR'] }] },
    baseFrequency: 'Semi-monthly',
  },
  {
    name: 'Hourly Ops',
    rule: { and: [{ attribute: 'compensationType', operator: 'is', values: ['Hourly'] }] },
    baseFrequency: 'Bi-weekly',
  },
  {
    name: 'US Salaried',
    rule: {
      and: [
        { attribute: 'compensationType', operator: 'is', values: ['Salary'] },
        {
          attribute: 'workLocation',
          operator: 'is',
          values: ['California', 'New York', 'Texas', 'Washington'],
        },
      ],
    },
    baseFrequency: 'Monthly',
  },
]

/** The most demanding pay frequency any matched employee's work-location
 *  state actually requires - null if none of them carry a tracked state law. */
function complianceFloor(matched: Array<Employee>): { state: string; frequency: Frequency } | null {
  let floor: { state: string; frequency: Frequency } | null = null
  for (const employee of matched) {
    const required = STATE_MIN_FREQUENCY[employee.workLocation]
    if (required && (!floor || FREQUENCY_RANK[required] > FREQUENCY_RANK[floor.frequency])) {
      floor = { state: employee.workLocation, frequency: required }
    }
  }
  return floor
}

/**
 * Emma's zero-schedules starter proposal: instead of a blank dashboard and
 * a "build it yourself" wizard, look at who's already in the directory and
 * propose a real, compliance-checked partition up front. Each group's
 * frequency is checked against every matched employee's work-location state
 * law, not just proposed on vibes - see `complianceNote`.
 */
export function suggestSchedules(allEmployees: Array<Employee>): Array<AiSuggestedSchedule> {
  const claimed = new Set<string>()
  const suggestions: Array<AiSuggestedSchedule> = []

  for (const seed of SUGGESTION_SEEDS) {
    const matched = matchEmployees(seed.rule, allEmployees).filter((e) => !claimed.has(e.id))
    matched.forEach((e) => claimed.add(e.id))
    const floor = complianceFloor(matched)
    const frequency =
      floor && FREQUENCY_RANK[floor.frequency] > FREQUENCY_RANK[seed.baseFrequency]
        ? floor.frequency
        : seed.baseFrequency
    suggestions.push({
      name: seed.name,
      rule: seed.rule,
      frequency,
      matched,
      complianceNote:
        floor && frequency !== seed.baseFrequency
          ? `${floor.state} requires at least ${frequency.toLowerCase()} pay for this group - the default ${seed.baseFrequency.toLowerCase()} cadence would have fallen short.`
          : undefined,
    })
  }

  const everyoneElse = allEmployees.filter((e) => !claimed.has(e.id))
  suggestions.push({ name: 'Default schedule', rule: null, frequency: 'Weekly', matched: everyoneElse })

  return suggestions
}

/* ---------------- frequency-change validation (PRD §1.1) ---------------- */

/** A schedule's currently-running or drafted payroll run - undefined means
 *  no active run. Only two states matter for a frequency-change save: a run
 *  already processing (`in-progress`) vs. one still editable/discardable
 *  (`draft`). */
export interface ScheduleRunStatus {
  state: 'in-progress' | 'draft'
  periodStart: string
  periodEnd: string
}

export type FrequencyChangeCode = 'mid-period' | 'not-future' | 'run-in-progress' | 'draft-in-window' | 'ok'

export interface FrequencyChangeValidation {
  /** 'block' means Save/Continue must stay disabled - this is a hard rule,
   *  never a dismissible warning (PRD: "enforce on save, not just surface
   *  it as a warning"). */
  level: 'block' | 'ok'
  code: FrequencyChangeCode
  message: string
}

function isPeriodEnd(freq: Frequency, iso: string): boolean {
  return periodOf(freq, iso).end === iso
}

/** The earliest date a frequency change is allowed to take effect - the
 *  first period end (of the schedule's CURRENT, pre-change cadence) that
 *  falls strictly after `today`. Mid-period changes are never offered:
 *  every candidate this returns/feeds is already a real period boundary. */
export function nextAllowedEffectiveDate(freq: Frequency, today: string): string {
  const [first] = periodEndsBetween(freq, addDaysISO(today, 1), addDaysISO(today, 400))
  return first
}

/**
 * PRD §1.1.1 - whether a chosen effective date can be saved for a pay-
 * frequency change. `currentFrequency` is the schedule's cadence BEFORE the
 * edit (period alignment and the run-state windows below are both defined
 * against the cadence that's actually running today, not the new one).
 */
export function validateFrequencyChangeDate(
  effectiveDate: string,
  currentFrequency: Frequency,
  today: string,
  run?: ScheduleRunStatus,
): FrequencyChangeValidation {
  if (!isPeriodEnd(currentFrequency, effectiveDate)) {
    return {
      level: 'block',
      code: 'mid-period',
      message: 'A frequency change can only take effect at the end of a pay period - pick one of the dates above.',
    }
  }

  const minDate = nextAllowedEffectiveDate(currentFrequency, today)
  if (diffDays(effectiveDate, minDate) > 0) {
    return {
      level: 'block',
      code: 'not-future',
      message: `Effective date must be in the future - the earliest is ${fmtHuman(minDate)}.`,
    }
  }

  if (run?.state === 'in-progress' && diffDays(run.periodEnd, effectiveDate) <= 0) {
    return {
      level: 'block',
      code: 'run-in-progress',
      message: `A run is in progress for the period ending ${fmtHuman(run.periodEnd)} - the effective date must be after it completes.`,
    }
  }

  if (
    run?.state === 'draft' &&
    diffDays(run.periodStart, effectiveDate) >= 0 &&
    diffDays(effectiveDate, run.periodEnd) >= 0
  ) {
    return {
      level: 'block',
      code: 'draft-in-window',
      message: `This schedule has a draft run for ${fmtHuman(run.periodStart)} – ${fmtHuman(run.periodEnd)} - discard it before saving a change that takes effect in that window.`,
    }
  }

  return { level: 'ok', code: 'ok', message: 'Takes effect as scheduled.' }
}
