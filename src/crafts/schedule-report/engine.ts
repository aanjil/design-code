/**
 * Schedule-report engine: pure date math so cadence/period/next-run are
 * computed, not mocked (PRD Fn 1.2/1.3, Fn 2.1). Local-parts ISO dates
 * only - never Date#toISOString (timezone shift bug, see AGENTS.md).
 */

import type { Cadence, CustomWindow, EndCondition, Frequency, RangePeriodPreset, SinglePeriodPreset } from './types'
import type { DateShape } from '@/mocks/insights-reports'

/** Fixed "today" so every state is deterministic and screenshot-stable. */
export const WORLD_TODAY = '2026-07-15'
export const ORG_TIMEZONE = 'America/New_York'
export const ORG_TIMEZONE_LABEL = 'GMT -4:00 - Eastern Time - New York'

/** Full weekday names - the reference HTML prototype's `dows` list. The
 *  Weekly anchor is stored as one of these ("Monday", not "Mon"); display
 *  contexts that want the abbreviated form call `.slice(0, 3)` themselves
 *  (mirrors the HTML's own `cadenceLabel()`). */
export const FULL_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** Monthly anchor options: '1'..'31' plus the literal "Last day". */
export const MONTH_ANCHORS = [...Array.from({ length: 31 }, (_, i) => String(i + 1)), 'Last day']

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
  return Date.UTC(y, m - 1, d) / 86400000
}

function fromSerial(serial: number): Parts {
  const d = new Date(serial * 86400000)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }
}

export function addDaysISO(iso: string, n: number): string {
  return fmt(fromSerial(toSerial(parseISO(iso)) + n))
}

export function dayOfWeek(iso: string): number {
  // 0 = Sunday
  return new Date(toSerial(parseISO(iso)) * 86400000).getUTCDay()
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function weekdayName(iso: string): string {
  return WEEKDAY_NAMES[dayOfWeek(iso)]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function fmtHuman(iso: string): string {
  const { y, m, d } = parseISO(iso)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

/** First day of the month containing `iso`. */
function monthStart(iso: string): string {
  const { y, m } = parseISO(iso)
  return fmt({ y, m, d: 1 })
}

/** Last day of the month containing `iso`. */
function monthEnd(iso: string): string {
  const { y, m } = parseISO(iso)
  return fmt({ y, m, d: daysInMonth(y, m) })
}

function addMonths(iso: string, n: number): string {
  const { y, m, d } = parseISO(iso)
  const total = m - 1 + n
  const ny = y + Math.floor(total / 12)
  const nm = ((total % 12) + 12) % 12
  return fmt({ y: ny, m: nm + 1, d: Math.min(d, daysInMonth(ny, nm + 1)) })
}

/* ---------------- reporting-period resolution (Fn 1.2) ---------------- */

export interface ResolvedWindow {
  start: string
  end: string
  label: string
}

/**
 * Resolve a relative period preset (or custom window) into concrete dates,
 * anchored to `runIso` (the date the report actually generates). This is
 * what turns "previous calendar month" into real start/end dates each run.
 * Range-shape reports only (PRD Fn 1.2) - see `resolveAsOfDate` for the
 * single-date-shape presets.
 */
export function resolvePeriod(
  preset: RangePeriodPreset,
  runIso: string,
  custom?: CustomWindow,
): ResolvedWindow {
  switch (preset) {
    case 'last-7':
      return { start: addDaysISO(runIso, -7), end: addDaysISO(runIso, -1), label: 'Last 7 days' }
    case 'last-30':
      return { start: addDaysISO(runIso, -30), end: addDaysISO(runIso, -1), label: 'Last 30 days' }
    case 'prev-month': {
      const prevMonthAnyDay = addMonths(monthStart(runIso), -1)
      return {
        start: monthStart(prevMonthAnyDay),
        end: monthEnd(prevMonthAnyDay),
        label: 'Previous calendar month',
      }
    }
    case 'prev-quarter': {
      const { y, m } = parseISO(runIso)
      const q = Math.floor((m - 1) / 3) // 0-3, current quarter
      const prevQStartMonth = q === 0 ? 10 : (q - 1) * 3 + 1
      const prevQYear = q === 0 ? y - 1 : y
      const start = fmt({ y: prevQYear, m: prevQStartMonth, d: 1 })
      const end = monthEnd(addMonths(start, 2))
      return { start, end, label: 'Previous quarter' }
    }
    case 'custom': {
      const c = custom ?? { n: 1, unit: 'months', endsOn: 'run-date' }
      const end = c.endsOn === 'run-date' ? addDaysISO(runIso, -1) : lastCompleteUnitEnd(c.unit, runIso)
      const start = subtractUnit(addDaysISO(end, 1), c.n, c.unit)
      return { start, end, label: customWindowLabel(c) }
    }
  }
}

/** "last 3 weeks" / "last 2 complete quarters" - mirrors the HTML
 *  prototype's `periodLabel()` exactly (unit singularized when n===1,
 *  "complete " only when the window ends on the last complete unit). */
export function customWindowLabel(c: CustomWindow): string {
  const complete = c.endsOn === 'last-complete'
  const unitLabel = c.n === 1 ? c.unit.slice(0, -1) : c.unit
  return `last ${c.n} ${complete ? 'complete ' : ''}${unitLabel}`
}

/** The 1-2 valid "window ends" options for a given custom-window unit -
 *  mirrors the HTML's `onUnitChange()`: always "On the run date", plus
 *  "On the last complete {unit}" when the unit isn't days. */
export function customWindowEndsOptions(unit: CustomWindow['unit']): Array<CustomWindow['endsOn']> {
  return unit === 'days' ? ['run-date'] : ['run-date', 'last-complete']
}

export function customWindowEndsLabel(endsOn: CustomWindow['endsOn'], unit: CustomWindow['unit']): string {
  if (endsOn === 'run-date') return 'On the run date'
  const singular = unit.slice(0, -1)
  return `On the last complete ${singular}`
}

/* ---------------- single-date-shape resolution (Fn 1.2) ---------------- */

export interface ResolvedAsOf {
  date: string
  label: string
}

export const SINGLE_PERIOD_LABELS: Record<SinglePeriodPreset, string> = {
  'on-run-date': 'On the run date',
  'prev-month-end': 'Previous month-end',
  'prev-quarter-end': 'Previous quarter-end',
  'prev-year-end': 'Previous year-end',
}

/** Resolve a single-date-shape preset (a report with one as-of date, no
 *  window) into a concrete date, anchored to `runIso`. */
export function resolveAsOfDate(preset: SinglePeriodPreset, runIso: string): ResolvedAsOf {
  switch (preset) {
    case 'on-run-date':
      return { date: runIso, label: SINGLE_PERIOD_LABELS[preset] }
    case 'prev-month-end':
      return { date: monthEnd(addMonths(monthStart(runIso), -1)), label: SINGLE_PERIOD_LABELS[preset] }
    case 'prev-quarter-end': {
      const { y, m } = parseISO(runIso)
      const q = Math.floor((m - 1) / 3)
      const prevQStartMonth = q === 0 ? 10 : (q - 1) * 3 + 1
      const prevQYear = q === 0 ? y - 1 : y
      const end = monthEnd(addMonths(fmt({ y: prevQYear, m: prevQStartMonth, d: 1 }), 2))
      return { date: end, label: SINGLE_PERIOD_LABELS[preset] }
    }
    case 'prev-year-end': {
      const { y } = parseISO(runIso)
      return { date: fmt({ y: y - 1, m: 12, d: 31 }), label: SINGLE_PERIOD_LABELS[preset] }
    }
  }
}

function subtractUnit(iso: string, n: number, unit: CustomWindow['unit']): string {
  switch (unit) {
    case 'days':
      return addDaysISO(iso, -n)
    case 'weeks':
      return addDaysISO(iso, -n * 7)
    case 'months':
      return addMonths(iso, -n)
    case 'quarters':
      return addMonths(iso, -n * 3)
    case 'years':
      return addMonths(iso, -n * 12)
  }
}

/** Start of the calendar unit (week/month/quarter/year) containing `iso`. */
function periodStart(unit: CustomWindow['unit'], iso: string): string {
  switch (unit) {
    case 'days':
      return iso
    case 'weeks':
      return addDaysISO(iso, -dayOfWeek(iso))
    case 'months':
      return monthStart(iso)
    case 'quarters': {
      const { y, m } = parseISO(iso)
      const q = Math.floor((m - 1) / 3)
      return fmt({ y, m: q * 3 + 1, d: 1 })
    }
    case 'years': {
      const { y } = parseISO(iso)
      return fmt({ y, m: 1, d: 1 })
    }
  }
}

/** The end of the most recently *fully completed* unit before `runIso`
 *  (e.g. "last complete week" = the Saturday before this week started). */
function lastCompleteUnitEnd(unit: CustomWindow['unit'], runIso: string): string {
  return addDaysISO(periodStart(unit, runIso), -1)
}

/* ---------------- next-run computation (Fn 1.3 / 2.1) ---------------- */

export interface NextRunResult {
  date: string
  /** True when a Monthly anchor day (e.g. 31) got clamped to the month's last day. */
  adjusted: boolean
}

/**
 * Compute the next occurrence on/after `fromIso` for a recurring cadence.
 * Monthly anchors beyond the month's length clamp to the last day (PRD
 * edge case: "31st in a 30-day month").
 */
export function computeNextRun(
  frequency: Frequency,
  anchorDay: string,
  fromIso: string,
): NextRunResult {
  if (frequency === 'Daily') return { date: fromIso, adjusted: false }

  if (frequency === 'Weekly') {
    const targetDow = FULL_WEEKDAYS.indexOf(anchorDay)
    let cursor = fromIso
    for (let i = 0; i < 7; i++) {
      if (dayOfWeek(cursor) === targetDow) return { date: cursor, adjusted: false }
      cursor = addDaysISO(cursor, 1)
    }
    return { date: fromIso, adjusted: false }
  }

  // Monthly
  const { y, m } = parseISO(fromIso)
  const wantsLast = anchorDay === 'Last day'
  const dim = daysInMonth(y, m)
  const targetDay = wantsLast ? dim : Math.min(Number(anchorDay), dim)
  const adjusted = !wantsLast && Number(anchorDay) > dim
  let candidate = fmt({ y, m, d: targetDay })
  if (candidate < fromIso) {
    const next = addMonths(fmt({ y, m, d: 1 }), 1)
    const { y: ny, m: nm } = parseISO(next)
    const ndim = daysInMonth(ny, nm)
    const nDay = wantsLast ? ndim : Math.min(Number(anchorDay), ndim)
    candidate = fmt({ y: ny, m: nm, d: nDay })
    return { date: candidate, adjusted: !wantsLast && Number(anchorDay) > ndim }
  }
  return { date: candidate, adjusted }
}

/* ---------------- validation (Fn 1.2 / 1.3) ---------------- */

/**
 * A one-time run can't land before its own reporting period has finished
 * (the HTML prototype checks this same condition from both directions -
 * `runDate < periodEnd` and `periodEnd > runDate` - each with its own
 * error copy on a different field; one comparison covers both here).
 */
export function validateOneTime(runDate: string, periodEnd: string): string | null {
  if (runDate < periodEnd) {
    return 'The report can only run on or after the end of its reporting period.'
  }
  if (runDate < WORLD_TODAY) {
    return 'Pick a date in the future.'
  }
  return null
}

/* ---------------- labels + preview banner (Fn 1.3) ---------------- */

export const RANGE_PERIOD_LABELS: Record<RangePeriodPreset, string> = {
  'prev-month': 'Previous calendar month',
  'last-7': 'Last 7 days',
  'last-30': 'Last 30 days',
  'prev-quarter': 'Previous quarter',
  custom: 'Custom relative window',
}

/** "Weekly — Mon" / "Monthly — Day 1" / "Monthly — Last day" - the list
 *  and drawer display form. Weekly abbreviates the full day name to 3
 *  letters (the HTML prototype's `cadenceLabel()` does the same). */
export function frequencyLabel(frequency: Frequency, anchorDay: string): string {
  if (frequency === 'Daily') return 'Daily'
  if (frequency === 'Weekly') return `Weekly — ${anchorDay.slice(0, 3)}`
  return `Monthly — ${anchorDay === 'Last day' ? 'Last day' : `Day ${anchorDay}`}`
}

export function endsPhrase(
  endCondition: EndCondition | undefined,
  endDate: string | undefined,
  endAfterRuns: number | undefined,
): string {
  if (endCondition === 'on-date' && endDate) return `Ends ${endDate}.`
  if (endCondition === 'after-n' && endAfterRuns) return `Ends after ${endAfterRuns} runs.`
  return ''
}

/**
 * The live-updating info banner at the bottom of the "How often" card -
 * mirrors the HTML prototype's `updatePreview()` branches (snapshot /
 * recurring-with-period / one-time), each producing one grammatical
 * sentence instead of three separately-formatted fragments.
 */
export function buildNextRunBanner(opts: {
  dateShape: DateShape
  cadence: Cadence
  frequency?: Frequency
  anchorDay?: string
  /** Recurring only - the resolved next occurrence. */
  nextRunIso?: string
  /** One-time only. */
  runDate?: string
  runTime: string
  /** Range/single shape only - e.g. "last 3 complete weeks" or "the previous month-end". */
  periodPhrase?: string
  endsPhrase?: string
  tzShort: string
}): string {
  const tz = opts.tzShort
  if (opts.cadence === 'once') {
    return `Runs once on ${opts.runDate ? fmtHuman(opts.runDate) : '—'}, ${opts.runTime}, then completes. · ${tz}`
  }
  const freqLower = (opts.frequency ?? 'Monthly').toLowerCase()
  const ends = opts.endsPhrase ? ` ${opts.endsPhrase}` : ''
  if (opts.dateShape === 'none') {
    return `Captures a snapshot at run time. Repeats ${freqLower}.${ends} · ${tz}`
  }
  const when = opts.nextRunIso ? fmtHuman(opts.nextRunIso) : '—'
  const covers = opts.periodPhrase ? ` — covers ${opts.periodPhrase}.` : '.'
  return `Next run: ${when}, ${opts.runTime}${covers} Repeats ${freqLower}.${ends} · ${tz}`
}
