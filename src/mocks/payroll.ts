import type { Employee } from './employees'
import { employees } from './employees'
import type { Frequency, Rule, ScheduleRunStatus } from '@/crafts/multi-payroll/engine'
import { WORLD_TODAY, addDaysISO, matchEmployees, periodOf } from '@/crafts/multi-payroll/engine'
import type { HireCandidateKey } from '@/crafts/multi-payroll/types'

/**
 * Deterministic pay-schedule world for the multi-payroll craft.
 * Same seed employees as the directory; assignments derived by real rule
 * matching (engine.ts's `matchEmployees`), not hand-typed counts - see the
 * priority order below for how an employee matching more than one named
 * schedule's rule gets disambiguated.
 */

export type ScheduleStatus = 'active' | 'archived'

export interface PaySchedule {
  id: string
  name: string
  frequency: Frequency
  /** Human pay-day rule, e.g. "Last working day of the month". */
  payDayRule: string
  /** Which day a pay week/period starts on - shown as metadata; doesn't
   *  currently feed back into `periodOf`'s Monday-start week math (a
   *  bigger, riskier change to a well-tested pure function than this
   *  metadata request called for). */
  workWeekStartDay: 'Sunday' | 'Monday'
  /** Structured membership rule - null only for the default schedule, which
   *  has no conditions and catches everyone not claimed by a named rule. */
  rule: Rule | null
  isDefault?: boolean
  memberCount: number
  nextPeriodEnd: string
  nextPayday: string
  status: ScheduleStatus
  hasHistory: boolean
  createdAt: string
  /** Undefined = no active run. PRD §1.1: a frequency-change save is gated
   *  by whichever of these is true for the schedule right now. */
  currentRun?: ScheduleRunStatus
}

function nextEndAfterToday(freq: Frequency): string {
  const { end } = periodOf(freq, WORLD_TODAY)
  return end
}

/** A run already processing for `freq`'s CURRENT period (the one containing
 *  WORLD_TODAY) - PRD §1.1's "run in progress" state. */
function inProgressRun(freq: Frequency): ScheduleRunStatus {
  const { start, end } = periodOf(freq, WORLD_TODAY)
  return { state: 'in-progress', periodStart: start, periodEnd: end }
}

/** A draft prepared for the NEXT period after today's (still editable/
 *  discardable) - PRD §1.1's "run in draft" state. */
function draftRun(freq: Frequency): ScheduleRunStatus {
  const { start, end } = periodOf(freq, addDaysISO(nextEndAfterToday(freq), 1))
  return { state: 'draft', periodStart: start, periodEnd: end }
}

/**
 * Base schedule records, in priority order - first rule an employee matches
 * wins (mirrors how a real product would need to disambiguate a Salaried
 * Contractor: Contractors' `employeeType` rule outranks US Salaried's
 * `compensationType` rule). Everything not claimed by a named rule falls to
 * the default (rule: null) at the end.
 */
const SCHEDULE_BASE: Array<Omit<PaySchedule, 'memberCount'>> = [
  {
    id: 'sch-weekly',
    name: 'Contractors',
    frequency: 'Weekly',
    payDayRule: 'Every Friday',
    workWeekStartDay: 'Sunday',
    rule: { and: [{ attribute: 'employeeType', operator: 'is', values: ['Contractor'] }] },
    status: 'active',
    hasHistory: false,
    createdAt: '2026-01-19',
    nextPeriodEnd: nextEndAfterToday('Weekly'),
    nextPayday: addDaysISO(nextEndAfterToday('Weekly'), 5),
  },
  {
    id: 'sch-semimonthly',
    name: 'EOR Staff',
    frequency: 'Semi-monthly',
    payDayRule: '15th and last day of the month',
    workWeekStartDay: 'Monday',
    rule: { and: [{ attribute: 'employeeType', operator: 'is', values: ['EOR'] }] },
    status: 'active',
    hasHistory: false,
    createdAt: '2026-04-14',
    nextPeriodEnd: nextEndAfterToday('Semi-monthly'),
    nextPayday: nextEndAfterToday('Semi-monthly'),
  },
  {
    id: 'sch-biweekly',
    name: 'Hourly Ops',
    frequency: 'Bi-weekly',
    payDayRule: 'Every other Friday',
    workWeekStartDay: 'Sunday',
    rule: { and: [{ attribute: 'compensationType', operator: 'is', values: ['Hourly'] }] },
    status: 'active',
    hasHistory: true,
    createdAt: '2025-06-02',
    nextPeriodEnd: nextEndAfterToday('Bi-weekly'),
    nextPayday: addDaysISO(nextEndAfterToday('Bi-weekly'), 5),
    currentRun: draftRun('Bi-weekly'),
  },
  {
    id: 'sch-monthly',
    name: 'US Salaried',
    frequency: 'Monthly',
    payDayRule: 'Last working day of the month',
    workWeekStartDay: 'Sunday',
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
    status: 'active',
    hasHistory: true,
    createdAt: '2025-02-11',
    nextPeriodEnd: nextEndAfterToday('Monthly'),
    nextPayday: nextEndAfterToday('Monthly'),
    currentRun: inProgressRun('Monthly'),
  },
  {
    id: 'sch-default',
    name: 'Default schedule',
    frequency: 'Weekly',
    payDayRule: 'Every Friday',
    workWeekStartDay: 'Sunday',
    rule: null,
    isDefault: true,
    status: 'active',
    hasHistory: true,
    createdAt: '2025-02-11',
    nextPeriodEnd: nextEndAfterToday('Weekly'),
    nextPayday: addDaysISO(nextEndAfterToday('Weekly'), 5),
  },
]

/** Real first-match-wins partition of the full 57-employee set, in the
 *  priority order above - `memberCount` is derived, never hand-typed, so it
 *  can't drift out of sync with the rules. */
function withMemberCounts(): Array<PaySchedule> {
  const claimed = new Set<string>()
  const counts = new Map<string, number>()
  for (const base of SCHEDULE_BASE) {
    if (base.rule === null) continue
    const matches = matchEmployees(base.rule, employees).filter((e) => !claimed.has(e.id))
    matches.forEach((e) => claimed.add(e.id))
    counts.set(base.id, matches.length)
  }
  counts.set('sch-default', employees.length - claimed.size)
  return SCHEDULE_BASE.map((base) => ({ ...base, memberCount: counts.get(base.id) ?? 0 }))
}

export const SCHEDULES: Array<PaySchedule> = withMemberCounts()

export const ARCHIVED_SCHEDULE: PaySchedule = {
  id: 'sch-legacy',
  name: 'Legacy Semi-monthly',
  frequency: 'Semi-monthly',
  payDayRule: '15th and last day of the month',
  workWeekStartDay: 'Sunday',
  rule: null,
  memberCount: 0,
  nextPeriodEnd: '-',
  nextPayday: '-',
  status: 'archived',
  hasHistory: true,
  createdAt: '2024-08-01',
}

/** Stable slice of the directory used across payroll screens (small enough
 *  to render as example rows - real counts/matching always run against the
 *  full `employees` set above, not this slice). */
export const PAYROLL_EMPLOYEES: Array<Employee> = employees.slice(0, 12)

/** Deterministic assignment: first schedule (in priority order) whose rule
 *  matches, falling back to the default schedule when nothing else does. */
export function scheduleFor(employee: Employee): PaySchedule {
  for (const schedule of SCHEDULES) {
    if (schedule.rule === null) continue
    if (matchEmployees(schedule.rule, [employee]).length > 0) return schedule
  }
  return SCHEDULES.find((s) => s.isDefault) ?? SCHEDULES[SCHEDULES.length - 1]
}

/**
 * Live App only — checks a real (persisted) override map first, falling
 * back to the deterministic rule. `schedules` lets a live, mutated list
 * (with newly-created schedules) resolve the override by id.
 */
export function liveScheduleFor(
  employee: Employee,
  assignments: Record<string, string> | undefined,
  schedules: Array<PaySchedule> = SCHEDULES,
): PaySchedule {
  const overrideId = assignments?.[employee.id]
  if (!overrideId) return scheduleFor(employee)
  const override =
    schedules.find((s) => s.id === overrideId) ?? SCHEDULES.find((s) => s.id === overrideId)
  return override ?? scheduleFor(employee)
}

/** The employee every move scenario uses, so numbers stay reproducible. */
export const MOVE_EMPLOYEE: Employee =
  PAYROLL_EMPLOYEES.find((e) => e.compensationType === 'Salary') ?? PAYROLL_EMPLOYEES[0]

export const MOVE_HOURLY_EMPLOYEE: Employee =
  PAYROLL_EMPLOYEES.find((e) => e.compensationType === 'Hourly') ?? PAYROLL_EMPLOYEES[1]

/**
 * H1 (hire flow) - one not-yet-hired candidate per demo state, real enough
 * to run through the same `matchEmployees`/`checkStateCompliance` every
 * other screen uses. Not part of the 57-employee directory (they haven't
 * been hired yet), so they live here rather than in employees.ts.
 */
function hireCandidate(overrides: Partial<Employee>): Employee {
  return {
    id: 'hire-draft',
    name: 'Jordan Reyes',
    email: 'jordan.reyes@nexuscorp.com',
    jobTitle: 'Payroll Specialist',
    employeeType: 'Full-time',
    workLocation: 'Remote - US',
    compensationType: 'Hourly',
    compensation: 32,
    currency: 'USD',
    hireDate: WORLD_TODAY,
    status: 'onboarding',
    ...overrides,
  }
}

export const HIRE_CANDIDATES: Record<HireCandidateKey, Employee> = {
  // Hourly + Remote - US -> matches only Hourly Ops, and Remote - US carries
  // no tracked state law, so it's a clean, single, aligned match.
  matched: hireCandidate({}),
  // Contractor AND Hourly -> genuinely matches two named rules at once
  // (Contractors' employeeType rule, Hourly Ops' compensationType rule).
  several: hireCandidate({ name: 'Sam Cole', employeeType: 'Contractor', workLocation: 'Remote - EU' }),
  // Salaried, in a location none of the named rules claim -> falls through
  // to the real default schedule.
  default: hireCandidate({
    name: 'Alex Rivera',
    compensationType: 'Salary',
    workLocation: 'Kathmandu',
    compensation: 68000,
  }),
  // Hourly in New York -> matches Hourly Ops (Bi-weekly), but New York
  // requires Weekly - a real compliance violation, not a cosmetic flag.
  compliance: hireCandidate({ name: 'Priya Chen', workLocation: 'New York' }),
}
