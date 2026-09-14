import { describe, expect, it } from 'vitest'
import {
  WORLD_TODAY,
  computeNextRun,
  resolveAsOfDate,
  resolvePeriod,
  validateOneTime,
} from './engine'

describe('resolvePeriod', () => {
  it('resolves previous calendar month against a mid-month run date', () => {
    const w = resolvePeriod('prev-month', '2026-07-15')
    expect(w.start).toBe('2026-06-01')
    expect(w.end).toBe('2026-06-30')
  })

  it('resolves previous quarter crossing a year boundary', () => {
    const w = resolvePeriod('prev-quarter', '2026-01-15')
    expect(w.start).toBe('2025-10-01')
    expect(w.end).toBe('2025-12-31')
  })

  it('resolves last-30 as a rolling window ending the day before run', () => {
    const w = resolvePeriod('last-30', '2026-07-15')
    expect(w.end).toBe('2026-07-14')
    expect(w.start).toBe('2026-06-15')
  })

  it('resolves a custom relative window (last N quarters, ending run date)', () => {
    const w = resolvePeriod('custom', '2026-07-15', { n: 2, unit: 'quarters', endsOn: 'run-date' })
    expect(w.end).toBe('2026-07-14')
    expect(w.start).toBe('2026-01-15')
    expect(w.label).toBe('last 2 quarters')
  })

  it('resolves a custom relative window ending on the last complete unit', () => {
    const w = resolvePeriod('custom', '2026-07-15', { n: 3, unit: 'weeks', endsOn: 'last-complete' })
    // 2026-07-15 is a Wednesday - the current week started Sun 07-12, so
    // the last fully-completed week ended Sat 07-11.
    expect(w.end).toBe('2026-07-11')
    expect(w.label).toBe('last 3 complete weeks')
  })
})

describe('resolveAsOfDate', () => {
  it('resolves "on the run date" to the run date itself', () => {
    const r = resolveAsOfDate('on-run-date', '2026-07-15')
    expect(r.date).toBe('2026-07-15')
  })

  it('resolves previous month-end against a mid-month run date', () => {
    const r = resolveAsOfDate('prev-month-end', '2026-07-15')
    expect(r.date).toBe('2026-06-30')
  })

  it('resolves previous quarter-end crossing a year boundary', () => {
    const r = resolveAsOfDate('prev-quarter-end', '2026-01-15')
    expect(r.date).toBe('2025-12-31')
  })

  it('resolves previous year-end', () => {
    const r = resolveAsOfDate('prev-year-end', '2026-07-15')
    expect(r.date).toBe('2025-12-31')
  })
})

describe('computeNextRun', () => {
  it('finds the next Monday on/after a Wednesday', () => {
    // 2026-07-15 is a Wednesday
    const r = computeNextRun('Weekly', 'Monday', '2026-07-15')
    expect(r.date).toBe('2026-07-20')
    expect(r.adjusted).toBe(false)
  })

  it('clamps a 31st anchor to the last day of a 30-day month', () => {
    const r = computeNextRun('Monthly', '31', '2026-04-15')
    expect(r.date).toBe('2026-04-30')
    expect(r.adjusted).toBe(true)
  })

  it('does not flag adjustment when the anchor exists in the month', () => {
    const r = computeNextRun('Monthly', '31', '2026-07-15')
    expect(r.date).toBe('2026-07-31')
    expect(r.adjusted).toBe(false)
  })

  it('rolls to next month when the anchor day already passed', () => {
    const r = computeNextRun('Monthly', '1', '2026-07-15')
    expect(r.date).toBe('2026-08-01')
  })

  it('resolves "Last day" to the actual last day of the month', () => {
    const r = computeNextRun('Monthly', 'Last day', '2026-04-15')
    expect(r.date).toBe('2026-04-30')
    expect(r.adjusted).toBe(false)
  })

  it('Daily always resolves to the given date', () => {
    const r = computeNextRun('Daily', '', '2026-07-15')
    expect(r.date).toBe('2026-07-15')
  })
})

describe('validateOneTime', () => {
  it('rejects a run date before the reporting period end', () => {
    expect(validateOneTime('2026-06-01', '2026-06-30')).toMatch(/on or after/)
  })

  it('rejects a run date in the past', () => {
    expect(validateOneTime('2026-01-01', '2025-12-31')).toMatch(/future/)
  })

  it('accepts a future run date on/after the period end', () => {
    expect(validateOneTime(WORLD_TODAY, '2026-06-30')).toBeNull()
  })
})
