import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type { AppView, GeneratedRow, ScheduleConfig } from './types'
import { ORG_TIMEZONE_LABEL, WORLD_TODAY, addDaysISO } from './engine'

/**
 * Scenario catalog - single source of truth for the design checklist
 * (left panel), the states rail (right panel), and the preview. Mirrors
 * multi-payroll's catalog.ts. Every state = one reproducible screen,
 * built fresh (no leakage between scenarios). Group letters follow the
 * PRD's own flow taxonomy (A-E in the UX-flow doc), collapsed to what's
 * actually screens: A entry/landing, B schedule config, C management,
 * D recipient link access.
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

const landing = (over: Partial<(AppView & { kind: 'landing' })['landing']> = {}): AppView => ({
  kind: 'landing',
  landing: { role: 'Org Owner', category: 'All', ...over },
})

const detail = (over: Partial<(AppView & { kind: 'detail' })['detail']>): AppView => ({
  kind: 'detail',
  detail: { reportId: 'master-bill', ...over },
})

const lists = (over: Partial<(AppView & { kind: 'lists' })['lists']>): AppView => ({
  kind: 'lists',
  lists: { tab: 'scheduled', ...over },
})

const recipientAccess = (
  over: Partial<(AppView & { kind: 'recipient-access' })['recipientAccess']>,
): AppView => ({
  kind: 'recipient-access',
  recipientAccess: { step: 'email-entry', ...over },
})

/** Default schedule-config draft for the B-group (Config) catalog states. */
function draft(over: Partial<ScheduleConfig> = {}): ScheduleConfig {
  return {
    id: 'draft',
    reportId: 'master-bill',
    owner: 'Anna Smith',
    createdAt: WORLD_TODAY,
    cadence: 'once',
    dateRange: { start: '2026-04-01', end: '2026-06-30' },
    runDate: '2026-07-20',
    runTime: '9:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    delivery: { platform: true, email: false, link: false },
    emailRecipients: [],
    linkRecipients: [],
    status: 'active',
    history: [],
    ...over,
  }
}

/* ---------------- seed data shared by C-group catalog states ---------------- */

function run(
  at: string,
  status: ScheduleConfig['history'][number]['status'],
  opts: Partial<ScheduleConfig['history'][number]> = {},
): ScheduleConfig['history'][number] {
  return { id: `run-${at}`, at, status, platform: true, emailCount: 0, emailFailed: 0, linkCount: 0, ...opts }
}

export const SEED_SCHEDULES: Array<ScheduleConfig> = [
  {
    id: 'sch-1',
    reportId: 'master-bill',
    owner: 'Anna Smith',
    createdAt: '2026-05-01',
    cadence: 'recurring',
    frequency: 'Monthly',
    anchorDay: '1',
    period: 'prev-month',
    runTime: '9:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    endCondition: 'never',
    delivery: { platform: true, email: true, link: false },
    emailRecipients: [
      { email: 'anna@niural.com', name: 'Anna Smith', role: 'Org Owner' },
      { email: 'brian@niural.com', name: 'Brian Stone', role: 'Admin' },
      { email: 'chen@vendorco.com', external: true },
    ],
    linkRecipients: [],
    status: 'active',
    nextRun: '2026-07-01T09:00:00',
    history: [
      run('2026-07-01T09:00:00', 'completed', { emailCount: 3 }),
      run('2026-06-01T09:00:00', 'completed', { emailCount: 3, emailFailed: 1 }),
    ],
  },
  {
    id: 'sch-2',
    reportId: 'payroll-journal-summary',
    owner: 'Anna Smith',
    createdAt: '2026-04-10',
    cadence: 'recurring',
    frequency: 'Weekly',
    anchorDay: 'Monday',
    period: 'last-7',
    runTime: '8:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    endCondition: 'never',
    delivery: { platform: true, email: false, link: false },
    emailRecipients: [],
    linkRecipients: [],
    status: 'active',
    nextRun: '2026-07-22T08:00:00',
    history: [run('2026-06-22T08:00:00', 'completed')],
  },
  {
    id: 'sch-3',
    reportId: 'cash-requirement',
    owner: 'Brian Stone',
    createdAt: '2026-03-01',
    cadence: 'recurring',
    frequency: 'Monthly',
    anchorDay: '1',
    period: 'prev-month',
    runTime: '9:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    endCondition: 'never',
    delivery: { platform: true, email: false, link: false },
    emailRecipients: [],
    linkRecipients: [],
    status: 'paused',
    pausedReason: 'Paused automatically - Insights access changed for the org.',
    history: [run('2026-07-01T09:00:00', 'completed')],
  },
  {
    id: 'sch-4',
    reportId: 'ytd-report',
    owner: 'Anna Smith',
    createdAt: '2026-04-01',
    cadence: 'once',
    runDate: '2026-06-15',
    runTime: '9:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    delivery: { platform: true, email: true, link: false },
    emailRecipients: [{ email: 'david@niural.com', name: 'David Sanders', role: 'AP Approver' }],
    linkRecipients: [],
    status: 'completed',
    history: [run('2026-06-15T09:00:00', 'completed', { emailCount: 1 })],
  },
  {
    id: 'sch-5',
    reportId: 'vendor-payments',
    owner: 'Brian Stone',
    createdAt: '2026-06-01',
    cadence: 'recurring',
    frequency: 'Daily',
    anchorDay: '',
    period: 'last-7',
    runTime: '7:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    endCondition: 'never',
    delivery: { platform: true, email: false, link: false },
    emailRecipients: [],
    linkRecipients: [],
    status: 'active',
    nextRun: addDaysISO(WORLD_TODAY, 1) + 'T07:00:00',
    history: [run('2026-07-08T07:00:00', 'completed')],
  },
  {
    id: 'sch-6',
    reportId: 'invoice-aging',
    owner: 'Catherine Stevens',
    createdAt: '2026-05-15',
    cadence: 'recurring',
    frequency: 'Weekly',
    anchorDay: 'Monday',
    period: 'on-run-date',
    runTime: '10:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    endCondition: 'on-date',
    endDate: '2026-12-31',
    delivery: { platform: true, email: true, link: true },
    emailRecipients: [{ email: 'catherine@niural.com', name: 'Catherine Stevens', role: 'Admin' }],
    linkRecipients: [{ email: 'auditor@external-firm.com', external: true }],
    status: 'active',
    nextRun: '2026-07-20T10:00:00',
    history: [run('2026-07-13T10:00:00', 'completed', { emailCount: 1, linkCount: 1 })],
  },
]

export const SEED_GENERATED: Array<GeneratedRow> = [
  { id: 'gen-1', reportId: 'master-bill', generatedAt: '2026-07-15T09:03:00', status: 'completed', delivery: { platform: true, emailCount: 3, emailFailed: 0 }, scheduleId: 'sch-1', bucket: 'Today' },
  { id: 'gen-2', reportId: 'payroll-journal-summary', generatedAt: '2026-07-13T08:00:00', status: 'completed', delivery: { platform: true, emailCount: 0, emailFailed: 0 }, scheduleId: 'sch-2', bucket: 'This week' },
  { id: 'gen-3', reportId: 'invoice-aging', generatedAt: '2026-07-13T10:01:00', status: 'in-progress', delivery: { platform: true, emailCount: 1, emailFailed: 0 }, scheduleId: 'sch-6', bucket: 'This week' },
  { id: 'gen-4', reportId: 'ytd-report', generatedAt: '2026-06-15T09:00:00', status: 'completed', delivery: { platform: true, emailCount: 1, emailFailed: 0 }, scheduleId: 'sch-4', bucket: 'Last month' },
  { id: 'gen-5', reportId: 'cash-requirement', generatedAt: '2026-06-01T09:00:00', status: 'failed', delivery: { platform: true, emailCount: 0, emailFailed: 0 }, scheduleId: 'sch-3', bucket: 'Last month' },
  { id: 'gen-6', reportId: 'bills-audit', generatedAt: '2026-06-05T14:00:00', status: 'completed', delivery: { platform: true, emailCount: 0, emailFailed: 0 }, bucket: 'Last month' },
]

export const SCENARIOS: Array<GroupDef> = [
  {
    group: 'A · Entry & landing',
    screens: [
      {
        id: 'A1',
        label: 'A1 Report gallery',
        states: [
          { id: 'owner', label: 'Org Owner', make: () => landing({ role: 'Org Owner' }) },
          { id: 'admin', label: 'Admin', make: () => landing({ role: 'Admin' }) },
        ],
      },
      {
        id: 'A2',
        label: 'A2 No access (AP/AR)',
        states: [
          { id: 'ap', label: 'AP Approver', make: () => landing({ role: 'AP Approver' }) },
        ],
      },
      {
        id: 'A3',
        label: 'A3 Report detail',
        states: [
          { id: 'view', label: 'View parameters', make: () => detail({}) },
          { id: 'edit', label: 'Adjust filter', make: () => detail({ editingParams: true }) },
          {
            id: 'as-of',
            label: 'As-of report (single date shape)',
            make: () => detail({ reportId: 'bills-aging' }),
          },
          {
            id: 'no-date',
            label: 'Snapshot report (no date param)',
            make: () => detail({ reportId: 'contractor-information' }),
          },
          {
            id: 'locked',
            label: 'Unsupported report',
            make: () => detail({ reportId: 'cash-reward' }),
          },
        ],
      },
    ],
  },
  {
    group: 'B · Schedule config',
    screens: [
      {
        id: 'B1',
        label: 'B1 Config - step 1, schedule details',
        states: [
          {
            id: 'default',
            label: 'Default (one-time)',
            make: () => detail({ modal: 'create', draft: draft(), modalStep: 1 }),
          },
        ],
      },
      {
        id: 'B2',
        label: 'B2 Config - recurring, by date shape',
        states: [
          {
            id: 'monthly',
            label: 'Range shape - Monthly',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({
                  cadence: 'recurring',
                  frequency: 'Monthly',
                  anchorDay: '1',
                  period: 'prev-month',
                  dateRange: undefined,
                  runDate: undefined,
                  endCondition: 'never',
                }),
                modalStep: 1,
              }),
          },
          {
            id: 'weekly',
            label: 'Range shape - Weekly',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({
                  cadence: 'recurring',
                  frequency: 'Weekly',
                  anchorDay: 'Monday',
                  period: 'last-7',
                  dateRange: undefined,
                  runDate: undefined,
                  endCondition: 'never',
                }),
                modalStep: 1,
              }),
          },
          {
            id: 'custom-window',
            label: 'Range shape - custom relative window',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({
                  cadence: 'recurring',
                  frequency: 'Monthly',
                  anchorDay: 'Last day',
                  period: 'custom',
                  customWindow: { n: 3, unit: 'weeks', endsOn: 'last-complete' },
                  dateRange: undefined,
                  runDate: undefined,
                  endCondition: 'on-date',
                  endDate: '2026-12-31',
                }),
                modalStep: 1,
              }),
          },
          {
            id: 'single-shape',
            label: 'Single shape - as-of date (Bills aging)',
            make: () =>
              detail({
                reportId: 'bills-aging',
                modal: 'create',
                draft: draft({
                  reportId: 'bills-aging',
                  cadence: 'recurring',
                  frequency: 'Monthly',
                  anchorDay: '1',
                  period: 'prev-month-end',
                  dateRange: undefined,
                  runDate: undefined,
                  endCondition: 'never',
                }),
                modalStep: 1,
              }),
          },
          {
            id: 'none-shape',
            label: 'None shape - snapshot (Contractor information)',
            make: () =>
              detail({
                reportId: 'contractor-information',
                modal: 'create',
                draft: draft({
                  reportId: 'contractor-information',
                  cadence: 'recurring',
                  frequency: 'Monthly',
                  anchorDay: '1',
                  period: undefined,
                  dateRange: undefined,
                  runDate: undefined,
                  endCondition: 'never',
                }),
                modalStep: 1,
              }),
          },
        ],
      },
      {
        id: 'B3',
        label: 'B3 Config - step 1 validation error',
        states: [
          {
            id: 'date-order',
            label: 'Run date before period end',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({ dateRange: { start: '2026-04-01', end: '2026-07-10' }, runDate: '2026-07-05' }),
                modalStep: 1,
              }),
          },
        ],
      },
      {
        id: 'B4',
        label: 'B4 Config - step 2, delivery setup',
        states: [
          {
            id: 'email',
            label: 'Email + internal recipients',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({
                  delivery: { platform: true, email: true, link: false },
                  emailRecipients: [
                    { email: 'anna@niural.com', name: 'Anna Smith', role: 'Org Owner' },
                    { email: 'brian@niural.com', name: 'Brian Stone', role: 'Admin' },
                  ],
                }),
                modalStep: 2,
              }),
          },
          {
            id: 'external',
            label: 'External recipient (PII flag)',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({
                  delivery: { platform: true, email: true, link: false },
                  emailRecipients: [
                    { email: 'anna@niural.com', name: 'Anna Smith', role: 'Org Owner' },
                    { email: 'chen@vendorco.com', external: true },
                  ],
                }),
                modalStep: 2,
              }),
          },
          {
            id: 'link',
            label: 'External link method',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({
                  delivery: { platform: true, email: false, link: true },
                  linkRecipients: [{ email: 'auditor@external-firm.com', external: true }],
                }),
                modalStep: 2,
              }),
          },
          {
            id: 'no-recipients',
            label: 'Email on, no recipients (error)',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({ delivery: { platform: true, email: true, link: false } }),
                modalStep: 2,
              }),
          },
        ],
      },
      {
        id: 'B5',
        label: 'B5 PII warning modal',
        states: [
          {
            id: 'default',
            label: 'Default',
            make: () =>
              detail({
                modal: 'pii-warning',
                draft: draft({
                  delivery: { platform: true, email: true, link: false },
                  emailRecipients: [{ email: 'chen@vendorco.com', external: true }],
                }),
              }),
          },
        ],
      },
      {
        id: 'B6',
        label: 'B6 Config - edit mode',
        states: [
          {
            id: 'default',
            label: 'Editing existing schedule',
            make: () => lists({ tab: 'scheduled', modal: 'edit', modalTargetId: 'sch-1' }),
          },
          {
            id: 'near-run',
            label: 'Near-run warning',
            make: () => lists({ tab: 'scheduled', modal: 'edit', modalTargetId: 'sch-2' }),
          },
        ],
      },
      {
        id: 'B7',
        label: 'B7 Payroll journal detail (After Each Run)',
        states: [
          {
            id: 'default',
            label: 'After each run trigger',
            make: () =>
              detail({
                reportId: 'payroll-journal-detail',
                modal: 'create',
                draft: draft({ reportId: 'payroll-journal-detail', afterEachRun: true, statusFilter: ['Approved', 'Paid'] }),
                modalStep: 1,
              }),
          },
        ],
      },
      {
        id: 'B8',
        label: 'B8 Config - step 3, review',
        states: [
          {
            id: 'default',
            label: 'Recurring, full delivery',
            make: () =>
              detail({
                modal: 'create',
                draft: draft({
                  cadence: 'recurring',
                  frequency: 'Monthly',
                  anchorDay: '1',
                  period: 'prev-month',
                  dateRange: undefined,
                  runDate: undefined,
                  endCondition: 'on-date',
                  endDate: '2026-12-31',
                  delivery: { platform: true, email: true, link: true },
                  emailRecipients: [
                    { email: 'anna@niural.com', name: 'Anna Smith', role: 'Org Owner' },
                    { email: 'brian@niural.com', name: 'Brian Stone', role: 'Admin' },
                    { email: 'catherine@niural.com', name: 'Catherine Stevens', role: 'Admin' },
                    { email: 'david@niural.com', name: 'David Sanders', role: 'AP Approver' },
                  ],
                  linkRecipients: [
                    { email: 'external@partner.com', external: true },
                    { email: 'vendor@company.io', external: true },
                  ],
                }),
                modalStep: 3,
              }),
          },
          {
            id: 'one-time',
            label: 'One-time',
            make: () => detail({ modal: 'create', draft: draft(), modalStep: 3 }),
          },
        ],
      },
      {
        id: 'B9',
        label: 'B9 Schedule created',
        states: [
          {
            id: 'default',
            label: 'Success dialog',
            make: () => detail({ modal: 'success', draft: draft() }),
          },
        ],
      },
    ],
  },
  {
    group: 'C · Schedule management',
    screens: [
      {
        id: 'C1',
        label: 'C1 Scheduled reports list',
        states: [
          { id: 'default', label: 'Default', make: () => lists({ tab: 'scheduled' }) },
          { id: 'empty', label: 'Empty', make: () => lists({ tab: 'scheduled', empty: true, schedules: [] }) },
          { id: 'loading', label: 'Loading', make: () => lists({ tab: 'scheduled', loading: true }) },
          { id: 'error', label: 'Error', make: () => lists({ tab: 'scheduled', error: true }) },
        ],
      },
      {
        id: 'C2',
        label: 'C2 Generated reports list',
        states: [
          { id: 'default', label: 'Default', make: () => lists({ tab: 'generated' }) },
          { id: 'empty', label: 'Empty', make: () => lists({ tab: 'generated', empty: true, generated: [] }) },
        ],
      },
      {
        id: 'C3',
        label: 'C3 Schedule detail drawer',
        states: [
          { id: 'active', label: 'Active schedule', make: () => lists({ tab: 'scheduled', drawerFor: 'sch-1' }) },
          { id: 'paused', label: 'Paused schedule', make: () => lists({ tab: 'scheduled', drawerFor: 'sch-3' }) },
        ],
      },
      {
        id: 'C4',
        label: 'C4 Action menu',
        states: [
          { id: 'active', label: 'Active row', make: () => lists({ tab: 'scheduled', menuFor: 'sch-1' }) },
          { id: 'paused', label: 'Paused row', make: () => lists({ tab: 'scheduled', menuFor: 'sch-3' }) },
          { id: 'completed', label: 'Completed row', make: () => lists({ tab: 'scheduled', menuFor: 'sch-4' }) },
        ],
      },
      {
        id: 'C5',
        label: 'C5 Pause confirm',
        states: [{ id: 'default', label: 'Default', make: () => lists({ tab: 'scheduled', modal: 'pause-confirm', modalTargetId: 'sch-1' }) }],
      },
      {
        id: 'C6',
        label: 'C6 Delete confirm',
        states: [{ id: 'default', label: 'Default', make: () => lists({ tab: 'scheduled', modal: 'delete-confirm', modalTargetId: 'sch-1' }) }],
      },
    ],
  },
  {
    group: 'D · Recipient link access',
    screens: [
      {
        id: 'D1',
        label: 'D1 Email entry',
        states: [{ id: 'default', label: 'Default', make: () => recipientAccess({ step: 'email-entry', reportName: 'Master bill report' }) }],
      },
      {
        id: 'D2',
        label: 'D2 OTP verification',
        states: [
          { id: 'sent', label: 'Code sent', make: () => recipientAccess({ step: 'otp-sent', reportName: 'Master bill report', recipientEmail: 'chen@vendorco.com' }) },
          { id: 'wrong', label: 'Wrong code', make: () => recipientAccess({ step: 'otp-wrong', reportName: 'Master bill report', recipientEmail: 'chen@vendorco.com', attemptsLeft: 3 }) },
          { id: 'locked', label: 'Locked (max attempts)', make: () => recipientAccess({ step: 'otp-locked', reportName: 'Master bill report', recipientEmail: 'chen@vendorco.com' }) },
        ],
      },
      {
        id: 'D3',
        label: 'D3 Download ready',
        states: [{ id: 'default', label: 'Default', make: () => recipientAccess({ step: 'download-ready', reportName: 'Master bill report' }) }],
      },
      {
        id: 'D4',
        label: 'D4 Expired / unavailable',
        states: [
          { id: 'expired', label: 'Link expired (7 days)', make: () => recipientAccess({ step: 'expired' }) },
          { id: 'unavailable', label: 'Report deleted', make: () => recipientAccess({ step: 'unavailable' }) },
          { id: 'revoked', label: 'Recipient access revoked', make: () => recipientAccess({ step: 'revoked' }) },
        ],
      },
    ],
  },
]

/** Every real catalog screen id - lets canvas focus events know whether a
 *  clicked window belongs to the reviewable matrix (vs. e.g. the App). */
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
