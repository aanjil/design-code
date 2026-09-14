import { describe, expect, it } from 'vitest'
import type { Employee } from '@/mocks/employees'
import { employees } from '@/mocks/employees'
import { SCHEDULES, scheduleFor } from '@/mocks/payroll'
import type { Frequency, Rule } from './engine'
import {
  MONTHLY_PREMIUM,
  PTO_ANNUAL_HOURS,
  checkStateCompliance,
  computeTransition,
  describeRule,
  evaluateRule,
  matchEmployees,
  periodOf,
  validateEffectiveDate,
  workingDaysBetween,
} from './engine'

const FREQS: Array<Frequency> = ['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly']

function fixtureEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'EMP000001',
    name: 'Test Employee',
    email: 'test@nexuscorp.com',
    jobTitle: 'Software Engineer',
    employeeType: 'Full-time',
    workLocation: 'Remote - US',
    compensationType: 'Salary',
    compensation: 80000,
    currency: 'USD',
    hireDate: '2024-01-01',
    status: 'active',
    ...overrides,
  }
}

describe('computeTransition', () => {
  it('reproduces the PRD worked example (Monthly→Monthly, eff Jul 10)', () => {
    const t = computeTransition('Monthly', 'Monthly', '2026-07-10')
    expect(t.classification).toBe('Gap')
    expect(t.gapStart).toBe('2026-07-01')
    expect(t.gapEnd).toBe('2026-07-09')
    expect(t.gapWorkingDays).toBe(7)
    expect(t.retro).toBeCloseTo(1615.6, 2)
    expect(t.firstRunEnd).toBe('2026-07-31')
    expect(t.regularDays).toBe(16)
    expect(t.regularPay).toBeCloseTo(3692.8, 2)
    expect(t.total).toBeCloseTo(5308.4, 2)
  })

  it('classifies a clean start at the period boundary', () => {
    const t = computeTransition('Monthly', 'Weekly', '2026-07-01')
    expect(t.classification).toBe('Clean proration')
    expect(t.gapWorkingDays).toBe(0)
    expect(t.retro).toBe(0)
  })

  it('classifies overlap past the old deadline and suppresses retro', () => {
    // Old weekly period Jul 6–12; deadline = 3 working days before Jul 12 → Jul 8.
    const t = computeTransition('Weekly', 'Monthly', '2026-07-10')
    expect(t.classification).toBe('Overlap')
    expect(t.suppressed).toBe(true)
    expect(t.retro).toBe(0)
    expect(t.regularStart).toBe('2026-07-13')
  })

  it('holds the §5 invariants for all 16 frequency pairs', () => {
    for (const oldFreq of FREQS) {
      for (const newFreq of FREQS) {
        const t = computeTransition(oldFreq, newFreq, '2026-07-10')
        expect(t.gapWorkingDays).toBeGreaterThanOrEqual(0)
        expect(t.regularPay).toBeGreaterThan(0)
        expect(t.retro + t.regularPay).toBeCloseTo(t.total, 2)
        // Benefits: the month nets to the monthly premium.
        const { checksThisMonth, perCheck, lastCheck, remainingPremium } = t.benefits
        expect(remainingPremium).toBe(MONTHLY_PREMIUM)
        if (checksThisMonth > 0) {
          expect(perCheck * (checksThisMonth - 1) + lastCheck).toBeCloseTo(
            remainingPremium,
            2,
          )
        }
        // PTO: annual cap preserved.
        expect(t.pto.accruedHours + t.pto.remainingHours).toBeCloseTo(
          PTO_ANNUAL_HOURS,
          2,
        )
        expect(t.pto.remainingRuns).toBeGreaterThan(0)
      }
    }
  })
})

describe('validateEffectiveDate', () => {
  const hire = '2024-03-04'
  it('blocks pre-hire dates', () => {
    expect(validateEffectiveDate('2024-03-01', hire, 'Monthly').code).toBe('pre-hire')
  })
  it('blocks beyond the lookback window', () => {
    // today 2026-07-15, Monthly lookback 30d → floor Jun 15
    expect(validateEffectiveDate('2026-06-01', hire, 'Monthly').code).toBe(
      'beyond-lookback',
    )
  })
  it('warns retro for past dates inside lookback', () => {
    const v = validateEffectiveDate('2026-07-10', hire, 'Monthly')
    expect(v.level).toBe('warn')
    expect(v.code).toBe('retro')
  })
  it('marks future dates pending', () => {
    expect(validateEffectiveDate('2026-07-20', hire, 'Monthly').level).toBe('pending')
  })
  it('flags weekends', () => {
    const v = validateEffectiveDate('2026-07-18', hire, 'Monthly') // Saturday
    expect(v.weekend).toBe(true)
    const today = validateEffectiveDate('2026-07-15', hire, 'Monthly')
    expect(today.level).toBe('ok')
  })
})

describe('period helpers', () => {
  it('computes calendar-month and semi-monthly periods', () => {
    expect(periodOf('Monthly', '2026-07-10')).toEqual({
      start: '2026-07-01',
      end: '2026-07-31',
    })
    expect(periodOf('Semi-monthly', '2026-07-20')).toEqual({
      start: '2026-07-16',
      end: '2026-07-31',
    })
  })
  it('counts working days inclusively', () => {
    expect(workingDaysBetween('2026-07-01', '2026-07-09')).toBe(7)
    expect(workingDaysBetween('2026-07-10', '2026-07-31')).toBe(16)
  })
})

describe('matchEmployees', () => {
  const alice = fixtureEmployee({ id: 'a', name: 'Alice', compensationType: 'Salary', employeeType: 'Full-time', workLocation: 'New York' })
  const bob = fixtureEmployee({ id: 'b', name: 'Bob', compensationType: 'Hourly', employeeType: 'Contractor', workLocation: 'California' })
  const cleo = fixtureEmployee({ id: 'c', name: 'Cleo', compensationType: 'Hourly', employeeType: 'EOR', workLocation: 'London' })
  const fixtures = [alice, bob, cleo]

  it('"is" matches exactly one value', () => {
    const rule: Rule = { and: [{ attribute: 'compensationType', operator: 'is', values: ['Salary'] }] }
    expect(matchEmployees(rule, fixtures)).toEqual([alice])
  })
  it('"is-not" excludes exactly one value', () => {
    const rule: Rule = { and: [{ attribute: 'compensationType', operator: 'is-not', values: ['Salary'] }] }
    expect(matchEmployees(rule, fixtures)).toEqual([bob, cleo])
  })
  it('"is" with several values matches any of them (list attribute)', () => {
    const rule: Rule = { and: [{ attribute: 'workLocation', operator: 'is', values: ['California', 'London'] }] }
    expect(matchEmployees(rule, fixtures)).toEqual([bob, cleo])
  })
  it('"is-not" with several values excludes every one of them (list attribute)', () => {
    const rule: Rule = { and: [{ attribute: 'employeeType', operator: 'is-not', values: ['Contractor', 'EOR'] }] }
    expect(matchEmployees(rule, fixtures)).toEqual([alice])
  })
  it('ANDs every condition in `and`', () => {
    const rule: Rule = {
      and: [
        { attribute: 'compensationType', operator: 'is', values: ['Hourly'] },
        { attribute: 'employeeType', operator: 'is', values: ['Contractor'] },
      ],
    }
    expect(matchEmployees(rule, fixtures)).toEqual([bob])
  })
  it('ORs correctly across an `orGroup`, on top of the AND conditions', () => {
    const rule: Rule = {
      and: [{ attribute: 'compensationType', operator: 'is', values: ['Hourly'] }],
      orGroup: [
        { attribute: 'workLocation', operator: 'is', values: ['California'] },
        { attribute: 'workLocation', operator: 'is', values: ['London'] },
      ],
    }
    expect(matchEmployees(rule, fixtures)).toEqual([bob, cleo])
  })
})

describe('describeRule', () => {
  it('describes the default (null) schedule as having no conditions', () => {
    expect(describeRule(null)).toBe('No conditions')
  })
  it('joins AND conditions in plain language', () => {
    const rule: Rule = {
      and: [
        { attribute: 'compensationType', operator: 'is', values: ['Salary'] },
        { attribute: 'workLocation', operator: 'is', values: ['California', 'New York'] },
      ],
    }
    expect(describeRule(rule)).toBe('Compensation type is Salary AND Work location is California, New York')
  })
  it('appends a parenthesized OR-group', () => {
    const rule: Rule = {
      and: [{ attribute: 'compensationType', operator: 'is', values: ['Salary'] }],
      orGroup: [
        { attribute: 'workLocation', operator: 'is', values: ['London'] },
        { attribute: 'workLocation', operator: 'is', values: ['Berlin'] },
      ],
    }
    expect(describeRule(rule)).toBe(
      'Compensation type is Salary AND (Work location is London OR Work location is Berlin)',
    )
  })
})

describe('checkStateCompliance', () => {
  it('flags a violation when the target frequency is less frequent than the state minimum', () => {
    const ny = fixtureEmployee({ workLocation: 'New York' }) // requires Weekly
    expect(checkStateCompliance(ny, 'Monthly')).toBe(false)
  })
  it('passes when the target frequency meets the state minimum exactly', () => {
    const ny = fixtureEmployee({ workLocation: 'New York' })
    expect(checkStateCompliance(ny, 'Weekly')).toBe(true)
  })
  it('passes when the target frequency exceeds the state minimum', () => {
    const wa = fixtureEmployee({ workLocation: 'Washington' }) // requires Monthly
    expect(checkStateCompliance(wa, 'Weekly')).toBe(true)
  })
  it('passes for a location with no tracked state law', () => {
    const remote = fixtureEmployee({ workLocation: 'Remote - EU' })
    expect(checkStateCompliance(remote, 'Monthly')).toBe(true)
  })
})

describe('evaluateRule', () => {
  const mover = fixtureEmployee({ id: 'm', compensationType: 'Salary' })
  const conflicted = fixtureEmployee({ id: 'x', compensationType: 'Salary' })
  const nonMatch = fixtureEmployee({ id: 'n', compensationType: 'Hourly' })
  const rule: Rule = { and: [{ attribute: 'compensationType', operator: 'is', values: ['Salary'] }] }
  const currentScheduleId = (e: Employee) =>
    e.id === 'x' ? SCHEDULES.find((s) => s.id === 'sch-weekly')! : SCHEDULES.find((s) => s.isDefault)!

  it('splits matches into movers (on the default) vs conflicts (on a named schedule)', () => {
    const result = evaluateRule(rule, [mover, conflicted, nonMatch], 'Monthly', currentScheduleId, 'sch-default')
    expect(result.matched).toHaveLength(2)
    expect(result.movers.map((e) => e.id)).toEqual(['m'])
    expect(result.conflicts.map((c) => c.employee.id)).toEqual(['x'])
  })

  it('flags real compliance violations against the chosen target frequency', () => {
    const nyHourly = fixtureEmployee({ id: 'ny', compensationType: 'Hourly', workLocation: 'New York' })
    const hourlyRule: Rule = { and: [{ attribute: 'compensationType', operator: 'is', values: ['Hourly'] }] }
    const result = evaluateRule(hourlyRule, [nyHourly], 'Monthly', currentScheduleId, 'sch-default')
    expect(result.complianceViolations).toEqual([{ employee: nyHourly, requiredFrequency: 'Weekly' }])
  })
})

describe('catalog rule scenarios (regression against the real seeded set)', () => {
  // Locks in the numbers the B2/B3/G1/G2 catalog states are built on - if a
  // future change to employees.ts's seed or WORK_LOCATIONS silently breaks
  // one of these, this fails instead of a screenshot.
  const CONFLICTS_RULE: Rule = {
    and: [
      { attribute: 'compensationType', operator: 'is', values: ['Hourly'] },
      {
        attribute: 'workLocation',
        operator: 'is',
        values: ['Remote - US', 'Remote - EU', 'Kathmandu', 'London', 'Berlin', 'São Paulo'],
      },
    ],
  }
  const MOVERS_RULE: Rule = {
    and: [
      { attribute: 'compensationType', operator: 'is', values: ['Salary'] },
      { attribute: 'employeeType', operator: 'is-not', values: ['Contractor', 'EOR'] },
      {
        attribute: 'workLocation',
        operator: 'is',
        values: ['Remote - US', 'Remote - EU', 'Kathmandu', 'London', 'Berlin', 'São Paulo'],
      },
    ],
  }
  const ZERO_RULE: Rule = {
    and: [
      { attribute: 'employeeType', operator: 'is', values: ['EOR'] },
      { attribute: 'compensationType', operator: 'is', values: ['Hourly'] },
      { attribute: 'workLocation', operator: 'is', values: ['Washington'] },
    ],
  }
  const COMPLIANCE_RULE: Rule = {
    and: [
      { attribute: 'compensationType', operator: 'is', values: ['Hourly'] },
      { attribute: 'workLocation', operator: 'is', values: ['New York', 'California'] },
    ],
  }
  const OR_GROUP_RULE: Rule = {
    and: [
      { attribute: 'compensationType', operator: 'is', values: ['Salary'] },
      { attribute: 'employeeType', operator: 'is-not', values: ['Contractor', 'EOR'] },
    ],
    orGroup: [
      { attribute: 'workLocation', operator: 'is', values: ['Remote - EU'] },
      { attribute: 'workLocation', operator: 'is', values: ['London'] },
    ],
  }
  const evaluate = (rule: Rule, frequency: Frequency = 'Monthly') =>
    evaluateRule(rule, employees, frequency, (e) => scheduleFor(e), 'sch-default')

  it('"Conflicts present" - real conflicts, no movers', () => {
    const r = evaluate(CONFLICTS_RULE)
    expect(r.matched).toHaveLength(7)
    expect(r.conflicts).toHaveLength(7)
    expect(r.movers).toHaveLength(0)
  })
  it('"Movers, no conflict" - real movers, no conflicts', () => {
    const r = evaluate(MOVERS_RULE)
    expect(r.matched).toHaveLength(18)
    expect(r.movers).toHaveLength(18)
    expect(r.conflicts).toHaveLength(0)
  })
  it('"0 matches" - a genuinely empty intersection', () => {
    expect(evaluate(ZERO_RULE).matched).toHaveLength(0)
  })
  it('"Compliance warning" - real violations against Monthly', () => {
    const r = evaluate(COMPLIANCE_RULE, 'Monthly')
    expect(r.matched).toHaveLength(4)
    expect(r.complianceViolations).toHaveLength(4)
  })
  it('"OR-group" - correctly-unioned OR match, all movers', () => {
    const r = evaluate(OR_GROUP_RULE)
    expect(r.matched).toHaveLength(5)
    expect(r.movers).toHaveLength(5)
    expect(r.conflicts).toHaveLength(0)
  })
})

describe('scheduleFor (real rule-based resolution)', () => {
  it('partitions every seeded employee into exactly one schedule - no orphans, no double-counting', () => {
    const counts = new Map<string, number>()
    for (const e of employees) {
      const s = scheduleFor(e)
      counts.set(s.id, (counts.get(s.id) ?? 0) + 1)
    }
    const total = [...counts.values()].reduce((a, n) => a + n, 0)
    expect(total).toBe(employees.length)
    expect(SCHEDULES.reduce((a, s) => a + s.memberCount, 0)).toBe(employees.length)
  })
  it('resolves an EOR employee to EOR Staff, not the first schedule in the list (regression)', () => {
    const eor = employees.find((e) => e.employeeType === 'EOR')!
    expect(scheduleFor(eor).id).toBe('sch-semimonthly')
  })
})
