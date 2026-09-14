import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type { AppView, DashboardView } from './types'
import type { Rule } from './engine'
import { WORLD_TODAY, addDaysISO } from './engine'
import { MOVE_EMPLOYEE, SCHEDULES } from '@/mocks/payroll'
import { employees } from '@/mocks/employees'

/**
 * Real rules for the B2/B3/G1/G2 states - each one verified (see
 * engine.test.ts) to actually produce its labeled condition against the
 * seeded 57-employee mock set, not a cosmetic boolean flag standing in for
 * one.
 */

/** Hourly employees outside any tracked-compliance state, all currently on
 *  a named schedule (Hourly Ops/Contractors/EOR Staff) - 7 real conflicts,
 *  0 movers, 0 compliance violations (clean single-signal demo). */
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

/** Salaried, non-Contractor/EOR employees at fully-remote/international
 *  locations - everyone currently resolves to the default schedule, so
 *  every match is a clean mover with zero conflicts. */
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

/** A real 3-condition intersection that happens to match nobody in the
 *  seeded set (no EOR/Hourly employee works out of Washington). */
const ZERO_RULE: Rule = {
  and: [
    { attribute: 'employeeType', operator: 'is', values: ['EOR'] },
    { attribute: 'compensationType', operator: 'is', values: ['Hourly'] },
    { attribute: 'workLocation', operator: 'is', values: ['Washington'] },
  ],
}

/** Hourly employees in New York/California - both states require more
 *  frequent pay than this schedule's default Monthly target, so this
 *  produces real compliance violations (and, honestly, real conflicts too -
 *  all 4 are already on a named schedule, which is a correct combined
 *  signal, not a bug). */
const COMPLIANCE_RULE: Rule = {
  and: [
    { attribute: 'compensationType', operator: 'is', values: ['Hourly'] },
    { attribute: 'workLocation', operator: 'is', values: ['New York', 'California'] },
  ],
}

/** AND'd Salary/non-Contractor-non-EOR, OR'd across two work locations - a
 *  real, correctly-unioned OR-group (5 matches, all movers). */
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

/** B5 edit demos - both start from US Salaried's real rule (see
 *  mocks/payroll.ts) and edit it in one direction each, so editing flows
 *  through the exact same real conflict/compliance engine as Create. */

/** Broadened with an OR-group that also claims Salaried Contractors - a
 *  real conflict, since Contractors is checked first in schedule priority
 *  and so remains their current schedule until this edit is saved. */
const EDIT_BROADEN_RULE: Rule = {
  and: [{ attribute: 'compensationType', operator: 'is', values: ['Salary'] }],
  orGroup: [
    {
      attribute: 'workLocation',
      operator: 'is',
      values: ['California', 'New York', 'Texas', 'Washington'],
    },
    { attribute: 'employeeType', operator: 'is', values: ['Contractor'] },
  ],
}

/** Narrowed to California only - real US-Salaried members in New York,
 *  Texas or Washington no longer match; PRD §1.2.2 says they stay put. */
const EDIT_NARROW_RULE: Rule = {
  and: [
    { attribute: 'compensationType', operator: 'is', values: ['Salary'] },
    { attribute: 'workLocation', operator: 'is', values: ['California'] },
  ],
}

/**
 * Scenario catalog (agent-build-instructions §4) - the single source of
 * truth for the design checklist (left panel), the states rail (right
 * panel) and the preview. Every state = one reproducible screen, built
 * fresh (no leakage between scenarios).
 */

interface StateDef {
  id: string
  label: string
  scope?: 'v1' | 'full'
  make: () => AppView
}

interface ScreenDef {
  id: string
  label: string
  states: Array<StateDef>
}

interface GroupDef {
  group: string
  screens: Array<ScreenDef>
}

const dash = (dashboard: Partial<DashboardView>): AppView => ({
  kind: 'dashboard',
  dashboard: { vision: 'v1', ...dashboard },
})

const wiz = (wizard: (AppView & { kind: 'wizard' })['wizard']) =>
  ({ kind: 'wizard', wizard }) as AppView

const detail = (
  scheduleDetail: Partial<(AppView & { kind: 'scheduleDetail' })['scheduleDetail']> = {},
): AppView =>
  ({ kind: 'scheduleDetail', scheduleDetail: { scheduleId: 'sch-monthly', ...scheduleDetail } }) as AppView

export const SCENARIOS: Array<GroupDef> = [
  {
    group: 'A · First-time setup',
    screens: [
      {
        id: 'A1',
        label: 'A1 Empty state',
        states: [
          { id: 'zero', label: 'Zero schedules', make: () => dash({ empty: true }) },
          {
            id: 'ai-suggest',
            label: 'AI suggested setup',
            make: () => dash({ empty: true, aiSuggest: true }),
          },
        ],
      },
      {
        id: 'A2',
        label: 'A2 First schedule - details',
        states: [
          {
            id: 'form',
            label: 'Details form',
            make: () => wiz({ step: 'details', isFirst: true }),
          },
        ],
      },
      {
        id: 'A3',
        label: 'A3 First membership (locked)',
        states: [
          {
            id: 'has-employees',
            label: 'Employees exist',
            make: () => wiz({ step: 'membership', isFirst: true }),
          },
          {
            id: 'no-employees',
            label: 'No employees yet',
            make: () => wiz({ step: 'membership', isFirst: true, noEmployees: true }),
          },
        ],
      },
      {
        id: 'A5',
        label: 'A5 First review',
        states: [
          {
            id: 'review',
            label: 'Review & create',
            make: () => wiz({ step: 'review', isFirst: true }),
          },
        ],
      },
    ],
  },
  {
    group: 'B · Create schedule',
    screens: [
      {
        id: 'B1',
        label: 'B1 Details',
        states: [
          { id: 'details', label: 'Details', make: () => wiz({ step: 'details', isFirst: false }) },
        ],
      },
      {
        id: 'B2',
        label: 'B2 Rule builder',
        states: [
          {
            id: 'conflicts',
            label: 'Conflicts present',
            make: () => wiz({ step: 'rules', isFirst: false, initialRule: CONFLICTS_RULE }),
          },
          {
            id: 'movers',
            label: 'Movers, no conflict',
            make: () => wiz({ step: 'rules', isFirst: false, initialRule: MOVERS_RULE }),
          },
          {
            id: 'zero',
            label: '0 matches',
            make: () => wiz({ step: 'rules', isFirst: false, initialRule: ZERO_RULE }),
          },
          {
            id: 'compliance',
            label: 'Compliance warning',
            make: () => wiz({ step: 'rules', isFirst: false, initialRule: COMPLIANCE_RULE }),
          },
          {
            id: 'or-group',
            label: 'OR-group',
            make: () => wiz({ step: 'rules', isFirst: false, initialRule: OR_GROUP_RULE }),
          },
          {
            id: 'manual',
            label: 'No rule (manual assignment)',
            make: () => wiz({ step: 'rules', isFirst: false }),
          },
        ],
      },
      {
        id: 'B3',
        label: 'B3 Resolve conflicts',
        states: [
          {
            id: 'conflicts',
            label: 'Conflicts + Emma assist',
            make: () => wiz({ step: 'conflicts', isFirst: false, initialRule: CONFLICTS_RULE }),
          },
          {
            id: 'review',
            label: 'No conflicts - review changes',
            make: () => wiz({ step: 'conflicts', isFirst: false, initialRule: MOVERS_RULE }),
          },
        ],
      },
      {
        id: 'B4',
        label: 'B4 Review & create',
        states: [
          {
            id: 'review',
            label: 'Review - with rule',
            make: () => wiz({ step: 'review', isFirst: false, initialRule: MOVERS_RULE }),
          },
          {
            id: 'review-manual',
            label: 'Review - no rule (manual)',
            make: () =>
              wiz({
                step: 'review',
                isFirst: false,
                initialManualMembers: employees.slice(0, 5).map((e) => e.id),
              }),
          },
        ],
      },
      {
        id: 'B5',
        label: 'B5 Edit schedule',
        states: [
          {
            id: 'details',
            label: 'Edit details',
            make: () =>
              wiz({
                step: 'details',
                isFirst: false,
                editSchedule: SCHEDULES.find((s) => s.id === 'sch-monthly'),
              }),
          },
          {
            id: 'broaden',
            label: 'Edit rule - broaden (new conflicts)',
            make: () =>
              wiz({
                step: 'rules',
                isFirst: false,
                editSchedule: SCHEDULES.find((s) => s.id === 'sch-monthly'),
                initialRule: EDIT_BROADEN_RULE,
              }),
          },
          {
            id: 'narrow',
            label: 'Edit rule - narrow (members stay)',
            make: () =>
              wiz({
                step: 'rules',
                isFirst: false,
                editSchedule: SCHEDULES.find((s) => s.id === 'sch-monthly'),
                initialRule: EDIT_NARROW_RULE,
              }),
          },
          {
            id: 'freq-blocked-run',
            label: 'Edit frequency - blocked (run in progress)',
            make: () =>
              wiz({
                step: 'details',
                isFirst: false,
                editSchedule: SCHEDULES.find((s) => s.id === 'sch-monthly'),
                initialFrequency: 'Semi-monthly',
              }),
          },
          {
            id: 'freq-blocked-draft',
            label: 'Edit frequency - blocked (draft run in window)',
            make: () =>
              wiz({
                step: 'details',
                isFirst: false,
                editSchedule: SCHEDULES.find((s) => s.id === 'sch-biweekly'),
                initialFrequency: 'Weekly',
                // The naturally-next allowed date is this schedule's CURRENT
                // period end, which falls before the draft's own window even
                // starts - select the draft's exact period end instead so
                // this state actually demonstrates the block.
                initialEffectiveDate: SCHEDULES.find((s) => s.id === 'sch-biweekly')?.currentRun?.periodEnd,
              }),
          },
          {
            id: 'freq-ok',
            label: 'Edit frequency - allowed (no active run)',
            make: () =>
              wiz({
                step: 'details',
                isFirst: false,
                editSchedule: SCHEDULES.find((s) => s.id === 'sch-weekly'),
                initialFrequency: 'Monthly',
              }),
          },
        ],
      },
    ],
  },
  {
    group: 'C · Dashboard & manage',
    screens: [
      {
        id: 'C1',
        label: 'C1 Dashboard',
        states: [
          { id: 'v1', label: 'v1 scope', make: () => dash({}) },
          {
            id: 'v1-archived',
            label: 'v1 - Archived tab (empty)',
            make: () => dash({ tab: 'archived' }),
          },
          {
            id: 'full',
            label: 'Full vision',
            scope: 'full',
            make: () => dash({ vision: 'full' }),
          },
          {
            id: 'full-archived',
            label: 'Full vision - Archived tab',
            scope: 'full',
            make: () => dash({ vision: 'full', tab: 'archived' }),
          },
          {
            id: 'copilot-thinking',
            label: 'Ask Emma - thinking',
            make: () => dash({ empty: true, copilot: 'thinking' }),
          },
          {
            id: 'copilot-suggestions',
            label: 'Ask Emma - suggestions',
            make: () => dash({ empty: true, copilot: 'suggestions' }),
          },
          {
            id: 'copilot-suggestions-populated',
            label: 'Ask Emma - suggestions (schedules exist)',
            make: () => dash({ copilot: 'suggestions' }),
          },
        ],
      },
      {
        id: 'C2',
        label: 'C2 Schedule ⋯ menu',
        states: [
          { id: 'v1', label: 'v1 (edit only)', make: () => dash({ menuFor: 'sch-monthly' }) },
          {
            id: 'full',
            label: 'Full (archive / delete)',
            scope: 'full',
            make: () => dash({ vision: 'full', menuFor: 'sch-monthly' }),
          },
        ],
      },
      {
        id: 'C8',
        label: 'C8 Schedule detail',
        states: [
          { id: 'default', label: 'Named schedule', make: () => detail({ scheduleId: 'sch-monthly' }) },
          {
            id: 'default-schedule',
            label: 'Default schedule (no conditions)',
            make: () => detail({ scheduleId: 'sch-default' }),
          },
        ],
      },
      {
        id: 'C5',
        label: 'C5 Archive - blocked',
        states: [
          {
            id: 'members',
            label: 'Has members',
            scope: 'full',
            make: () => dash({ vision: 'full', modal: 'archive-blocked' }),
          },
        ],
      },
      {
        id: 'C6',
        label: 'C6 Archive - confirm',
        states: [
          {
            id: 'history',
            label: 'Has history',
            scope: 'full',
            make: () => dash({ vision: 'full', modal: 'archive-confirm' }),
          },
        ],
      },
      {
        id: 'C7',
        label: 'C7 Delete - blocked',
        states: [
          {
            id: 'blocked',
            label: 'History / members → archive instead',
            scope: 'full',
            make: () => dash({ vision: 'full', modal: 'delete-blocked' }),
          },
        ],
      },
      {
        id: 'C9',
        label: 'C9 Archived + reactivate',
        states: [
          {
            id: 'archived',
            label: 'Archived tab',
            scope: 'full',
            make: () => dash({ vision: 'full', tab: 'archived' }),
          },
          {
            id: 'reactivate',
            label: 'Reactivate modal',
            scope: 'full',
            make: () => dash({ vision: 'full', tab: 'archived', modal: 'reactivate' }),
          },
        ],
      },
    ],
  },
  {
    group: 'D · Move employee',
    screens: [
      {
        id: 'D2',
        label: 'D2 Move - date validation',
        states: [
          {
            id: 'valid',
            label: 'Valid',
            make: () =>
              detail({
                move: { stage: 'date', from: 'Monthly', to: 'Bi-weekly', effectiveDate: WORLD_TODAY },
              }),
          },
          {
            id: 'weekend',
            label: 'Non-working day',
            make: () =>
              detail({
                move: { stage: 'date', from: 'Monthly', to: 'Bi-weekly', effectiveDate: '2026-07-18' },
              }),
          },
          {
            id: 'retro',
            label: 'Past → retro',
            make: () =>
              detail({
                move: { stage: 'date', from: 'Monthly', to: 'Bi-weekly', effectiveDate: '2026-07-10' },
              }),
          },
          {
            id: 'lookback',
            label: 'Beyond lookback (block)',
            make: () =>
              detail({
                move: { stage: 'date', from: 'Monthly', to: 'Bi-weekly', effectiveDate: '2026-06-05' },
              }),
          },
          {
            id: 'pre-hire',
            label: 'Pre-hire (block)',
            make: () =>
              detail({
                move: {
                  stage: 'date',
                  from: 'Monthly',
                  to: 'Bi-weekly',
                  effectiveDate: addDaysISO(MOVE_EMPLOYEE.hireDate, -10),
                },
              }),
          },
          {
            id: 'future',
            label: 'Future → pending',
            make: () =>
              detail({
                move: { stage: 'date', from: 'Monthly', to: 'Bi-weekly', effectiveDate: '2026-07-24' },
              }),
          },
        ],
      },
      {
        id: 'D3',
        label: 'D3 Move - review (impact)',
        states: [
          {
            id: 'clean',
            label: 'Clean proration',
            make: () =>
              detail({
                // Aug 1 = both a Monthly and a Semi-monthly period boundary.
                move: { stage: 'review', from: 'Monthly', to: 'Semi-monthly', effectiveDate: '2026-08-01' },
              }),
          },
          {
            id: 'gap',
            label: 'Gap (retro)',
            make: () =>
              detail({
                move: { stage: 'review', from: 'Monthly', to: 'Bi-weekly', effectiveDate: '2026-07-10' },
              }),
          },
          {
            id: 'overlap',
            label: 'Overlap (suppress)',
            make: () =>
              detail({
                move: { stage: 'review', from: 'Weekly', to: 'Monthly', effectiveDate: '2026-07-10' },
              }),
          },
          {
            id: 'hourly',
            label: 'Hourly employee',
            make: () =>
              detail({
                move: {
                  stage: 'review',
                  from: 'Bi-weekly',
                  to: 'Weekly',
                  effectiveDate: '2026-07-13',
                  hourly: true,
                },
              }),
          },
        ],
      },
      {
        id: 'D4',
        label: 'D4 Move - confirm',
        states: [
          {
            id: 'immediate',
            label: 'Immediate',
            make: () =>
              detail({
                move: {
                  stage: 'confirm',
                  from: 'Monthly',
                  to: 'Bi-weekly',
                  effectiveDate: WORLD_TODAY,
                  confirmMode: 'immediate',
                },
              }),
          },
          {
            id: 'scheduled',
            label: 'Scheduled (future / pending)',
            make: () =>
              detail({
                move: {
                  stage: 'confirm',
                  from: 'Monthly',
                  to: 'Bi-weekly',
                  effectiveDate: '2026-07-24',
                  confirmMode: 'scheduled',
                },
              }),
          },
        ],
      },
    ],
  },
  {
    group: 'F · Payroll runs',
    screens: [
      {
        id: 'F1',
        label: 'F1 Runs list',
        states: [
          {
            id: 'needs-action',
            label: 'Needs action',
            make: () => ({ kind: 'runs', runs: { variant: 'needs-action' } }),
          },
          {
            id: 'scheduled',
            label: 'Scheduled',
            make: () => ({ kind: 'runs', runs: { variant: 'scheduled' } }),
          },
        ],
      },
      {
        id: 'F2',
        label: 'F2 Run type picker',
        states: [
          {
            id: 'v1',
            label: 'v1 (single schedule)',
            make: () => ({ kind: 'runs', runs: { variant: 'needs-action', picker: 'v1' } }),
          },
          {
            id: 'full',
            label: 'Across schedules',
            scope: 'full',
            make: () => ({ kind: 'runs', runs: { variant: 'needs-action', picker: 'full' } }),
          },
        ],
      },
    ],
  },
  {
    group: 'G · Emma (AI assist)',
    screens: [
      {
        id: 'G1',
        label: 'G1 Compliance assist',
        states: [
          {
            id: 'violation',
            label: 'State frequency violation',
            make: () =>
              wiz({ step: 'rules', isFirst: false, initialRule: COMPLIANCE_RULE, emma: 'compliance' }),
          },
        ],
      },
      {
        id: 'G2',
        label: 'G2 Conflict assist',
        states: [
          {
            id: 'suggestion',
            label: 'Resolution suggestion',
            make: () => wiz({ step: 'conflicts', isFirst: false, initialRule: CONFLICTS_RULE, emma: 'conflict' }),
          },
        ],
      },
      {
        id: 'G3',
        label: 'G3 Work-location change',
        states: [
          {
            id: 'offer',
            label: 'Reassignment offer',
            make: () => detail({ emma: 'location' }),
          },
        ],
      },
    ],
  },
  {
    group: 'H · Beyond v1',
    screens: [
      {
        id: 'H1',
        label: 'H1 Hire-flow assignment',
        states: [
          {
            id: 'matched',
            label: 'Matched one - aligned',
            scope: 'full',
            make: () => ({ kind: 'hire', hire: { candidate: 'matched' } }),
          },
          {
            id: 'several',
            label: 'Matched several',
            scope: 'full',
            make: () => ({ kind: 'hire', hire: { candidate: 'several' } }),
          },
          {
            id: 'default',
            label: 'No match - default schedule',
            scope: 'full',
            make: () => ({ kind: 'hire', hire: { candidate: 'default' } }),
          },
          {
            id: 'compliance',
            label: 'Matched but violating',
            scope: 'full',
            make: () => ({ kind: 'hire', hire: { candidate: 'compliance' } }),
          },
        ],
      },
      {
        id: 'H2',
        label: 'H2 Rule re-evaluation',
        states: [
          {
            id: 'prompt',
            label: 'Auto re-eval prompt',
            scope: 'full',
            make: () => detail({ reeval: 'prompt' }),
          },
          {
            id: 'flagged',
            label: 'Flagged a move',
            scope: 'full',
            make: () => detail({ reeval: 'flagged' }),
          },
        ],
      },
    ],
  },
]

/** Every real catalog screen id — lets canvas focus events know whether a
 *  clicked window belongs to the reviewable A–H matrix (vs. e.g. the App). */
export const CATALOG_SCREEN_IDS = new Set(
  SCENARIOS.flatMap((g) => g.screens.map((s) => s.id)),
)

/** Serializable catalog for the explorer panels (no make functions). */
export const EXPLORER_CATALOG: Array<ExplorerGroupDef> = SCENARIOS.map((g) => ({
  group: g.group,
  screens: g.screens.map((s) => ({
    id: s.id,
    label: s.label,
    states: s.states.map(({ id, label, scope }) => ({ id, label, scope })),
  })),
}))

const FALLBACK: AppView = SCENARIOS[0].screens[0].states[0].make()

export function makeView(screenId: string, stateId: string): AppView {
  for (const group of SCENARIOS) {
    for (const screen of group.screens) {
      if (screen.id !== screenId) continue
      const state = screen.states.find((s) => s.id === stateId) ?? screen.states[0]
      return state ? state.make() : FALLBACK
    }
  }
  return FALLBACK
}

/** Caption text: "<screen> - <state>". */
export function describeSelection(screenId: string, stateId: string): string {
  for (const group of SCENARIOS) {
    for (const screen of group.screens) {
      if (screen.id !== screenId) continue
      const state = screen.states.find((s) => s.id === stateId)
      return state ? `${screen.label} - ${state.label}` : screen.label
    }
  }
  return ''
}
