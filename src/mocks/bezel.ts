/**
 * Content for the `bezel` craft, computed from the real `employees` mock
 * rather than authored strings - every claim below is a genuine read of
 * `src/mocks/employees.ts`'s seeded 57-row set, so the numbers move
 * together with the table instead of quietly drifting from it. Anchored
 * to a fixed "today" (multi-payroll's `WORLD_TODAY` pattern) so tenure/
 * pending-days math stays deterministic across reloads.
 */

import type { Employee } from './employees'
import { employees, fmtCompensation, fmtHireDate } from './employees'
import type { GrainExit, GrainFact } from '@/components/nds/grain/types'

export const WORLD_TODAY = '2026-08-24'

function daysSince(iso: string): number {
  const a = new Date(`${iso}T00:00:00`).getTime()
  const b = new Date(`${WORLD_TODAY}T00:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

function median(nums: Array<number>): number {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/* ---------- Found: contractor concentration ---------- */

const contractors = employees.filter((e) => e.employeeType === 'Contractor')
const euContractors = contractors.filter((e) => e.workLocation === 'Remote - EU')
export const CONTRACTOR_SHARE = contractors.length / employees.length

export const FOUND_CLAIM = `Contractors are ${Math.round(CONTRACTOR_SHARE * 100)}% of headcount, concentrated in Remote - EU`
export const FOUND_CONFIDENCE = 0.81
export const FOUND_FACTS: Array<GrainFact> = [
  { label: 'Contractors, total', value: String(contractors.length) },
  { label: 'Of those, Remote - EU', value: `${euContractors.length}` },
  { label: 'Active contractors', value: String(contractors.filter((e) => e.status === 'active').length) },
  {
    label: 'Full-time headcount, for context',
    value: String(employees.filter((e) => e.employeeType === 'Full-time').length),
    tone: 'muted',
  },
]
export const FOUND_PROVENANCE = `${employees.length} employee records · .${String(Math.round(FOUND_CONFIDENCE * 100)).padStart(2, '0')}`

/* ---------- Tension: the widest pay spread inside one role ---------- */

interface TitleSpread {
  jobTitle: string
  low: Employee
  high: Employee
  med: number
  ratio: number
}

function widestSpread(): TitleSpread {
  const byTitle = new Map<string, Array<Employee>>()
  for (const e of employees) {
    if (e.compensationType !== 'Salary') continue
    byTitle.set(e.jobTitle, [...(byTitle.get(e.jobTitle) ?? []), e])
  }
  let best: TitleSpread | null = null
  for (const [jobTitle, group] of byTitle) {
    if (group.length < 3) continue
    const sorted = [...group].sort((a, b) => a.compensation - b.compensation)
    const low = sorted[0]
    const high = sorted[sorted.length - 1]
    const ratio = high.compensation / low.compensation
    if (!best || ratio > best.ratio) {
      best = { jobTitle, low, high, med: median(sorted.map((e) => e.compensation)), ratio }
    }
  }
  if (!best) throw new Error('no salaried role has enough rows to compare')
  return best
}

export const PAY_SPREAD = widestSpread()
export const TENSION_CLAIM = `Two ${PAY_SPREAD.jobTitle}s, ${Math.round(PAY_SPREAD.ratio * 10) / 10}x apart in pay`
export const TENSION_CONFIDENCE = 0.41
export const TENSION_FACTS: Array<GrainFact> = [
  { label: `${PAY_SPREAD.high.name} · hired ${fmtHireDate(PAY_SPREAD.high.hireDate)}`, value: fmtCompensation(PAY_SPREAD.high) },
  { label: `${PAY_SPREAD.low.name} · hired ${fmtHireDate(PAY_SPREAD.low.hireDate)}`, value: fmtCompensation(PAY_SPREAD.low) },
  { label: `Role median (${PAY_SPREAD.jobTitle})`, value: `${Math.round(PAY_SPREAD.med).toLocaleString()}/yr`, tone: 'muted' },
]
export const TENSION_PROVENANCE = `Same title, same comp type · no leveling note on either record`

export function tensionExits(onResolve: (result: string) => void): Array<GrainExit> {
  return [
    {
      label: `Re-level ${PAY_SPREAD.low.name.split(' ')[0]} toward median`,
      variant: 'primary',
      onSelect: () => onResolve(`Re-leveled ${PAY_SPREAD.low.name} toward the ${PAY_SPREAD.jobTitle} median`),
    },
    {
      label: `Grandfather both`,
      onSelect: () => onResolve(`Kept both rates - flagged as grandfathered`),
    },
    {
      label: 'Send to comp review',
      variant: 'quiet',
      onSelect: () => onResolve('Sent to compensation review'),
    },
  ]
}

/* ---------- Pinned · needs you ---------- */

const offboardedByTenure = employees
  .filter((e) => e.status === 'offboarded')
  .map((e) => ({ e, tenureDays: daysSince(e.hireDate) }))
  .sort((a, b) => a.tenureDays - b.tenureDays)

export const SHORT_TENURE_EXIT = offboardedByTenure[0]

const pendingInvites = employees
  .filter((e) => e.status === 'invited')
  .map((e) => ({ e, pendingDays: daysSince(e.hireDate) }))
  .filter((row) => row.pendingDays > 30)
  .sort((a, b) => b.pendingDays - a.pendingDays)

export const PENDING_INVITES = pendingInvites

export const PIN_EXIT_CLAIM = SHORT_TENURE_EXIT
  ? `${SHORT_TENURE_EXIT.e.name} offboarded ${SHORT_TENURE_EXIT.tenureDays} days after hire`
  : undefined
export const PIN_EXIT_CONFIDENCE = 0.74

export const PIN_INVITES_CLAIM =
  pendingInvites.length > 0
    ? `${pendingInvites.length} invited employee${pendingInvites.length === 1 ? '' : 's'} pending over 30 days`
    : undefined
export const PIN_INVITES_CONFIDENCE = 0.88

/* ---------- Selection -> bulk / context (computed live off what's checked) ---------- */

export interface SelectionSummary {
  claim: string
  note: string
  facts: Array<GrainFact>
}

export function describeSelection(rows: Array<Employee>): SelectionSummary {
  const count = rows.length
  const byField = (get: (e: Employee) => string) => {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(get(r), (counts.get(get(r)) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  }
  const [statusVal, statusCount] = byField((e) => e.status)
  const [titleVal, titleCount] = byField((e) => e.jobTitle)

  let note: string
  if (statusCount === count && count > 1) {
    note = `all ${count} are ${statusVal} - same review stage`
  } else if (titleCount > 1 && titleCount === count) {
    note = `all ${count} are ${titleVal.toLowerCase()}s`
  } else if (titleCount > 1) {
    note = `${titleCount} of ${count} are ${titleVal.toLowerCase()}s - the rest don't share a field`
  } else {
    note = `${count} selected - nothing in common beyond the checkbox`
  }

  return {
    claim: `${count} selected`,
    note,
    facts: rows.slice(0, 6).map((r) => ({ label: `${r.name} · ${r.jobTitle}`, value: fmtCompensation(r) })),
  }
}

/* ---------- Voice ---------- */

export const VOICE_COMMAND = `resend invites to everyone pending over 30 days`
export const VOICE_SCOPE = `heard · affects ${pendingInvites.length} invited employee${pendingInvites.length === 1 ? '' : 's'} · nothing sent yet`
export const VOICE_RESULT = `Resent ${pendingInvites.length} pending invite${pendingInvites.length === 1 ? '' : 's'}`

/* ---------- Run in flight ---------- */

export const RUN_CLAIM = `Run payroll · Aug 16-31 - one pay-equity flag left`
