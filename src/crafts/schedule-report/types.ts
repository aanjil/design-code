import type { ReportCategory } from '@/mocks/insights-reports'

/**
 * AppView - everything a screen needs to render one exact state.
 * Mirrors the multi-payroll craft's pattern (types.ts + catalog.ts):
 * every catalog state builds a fresh AppView; screens stay interactive
 * on top of it.
 */

export type DeliveryMethod = 'platform' | 'email' | 'link'

export type OrgRole = 'Org Owner' | 'Admin' | 'AP Approver' | 'AR Approver'

export interface Recipient {
  email: string
  name?: string
  role?: OrgRole
  external?: boolean
}

export type Cadence = 'once' | 'recurring'
export type Frequency = 'Daily' | 'Weekly' | 'Monthly'

/**
 * Reporting-period presets, split by the report's date shape (PRD Fn 1.2
 * "relative window") - mirrors the reference HTML prototype's
 * RANGE_OPTS / SINGLE_OPTS split exactly. A 'none'-shape report (a
 * point-in-time snapshot) has no period preset at all.
 */
export const RANGE_PERIOD_PRESETS = [
  'prev-month',
  'last-7',
  'last-30',
  'prev-quarter',
  'custom',
] as const
export type RangePeriodPreset = (typeof RANGE_PERIOD_PRESETS)[number]

export const SINGLE_PERIOD_PRESETS = [
  'on-run-date',
  'prev-month-end',
  'prev-quarter-end',
  'prev-year-end',
] as const
export type SinglePeriodPreset = (typeof SINGLE_PERIOD_PRESETS)[number]

export type PeriodPreset = RangePeriodPreset | SinglePeriodPreset

export type EndCondition = 'never' | 'on-date' | 'after-n'
export type ScheduleStatus = 'active' | 'paused' | 'completed'
export type RunStatus = 'completed' | 'failed' | 'in-progress' | 'empty'

export interface CustomWindow {
  n: number
  unit: 'days' | 'weeks' | 'months' | 'quarters' | 'years'
  endsOn: 'run-date' | 'last-complete'
}

export interface ScheduleRun {
  id: string
  /** ISO datetime. */
  at: string
  status: RunStatus
  platform: boolean
  emailCount: number
  emailFailed: number
  linkCount: number
  isNew?: boolean
}

export interface ScheduleConfig {
  id: string
  reportId: string
  owner: string
  createdAt: string

  // -- parameters (Fn 1.2) --
  statusFilter?: Array<string>

  // -- cadence (Fn 1.3) --
  cadence: Cadence
  frequency?: Frequency
  /** Monthly: '1'..'31'|'last'. Weekly: 'Mon'..'Sun'. */
  anchorDay?: string
  /** Recurring only - relative window preset (PRD Fn 1.2 "relative window"). */
  period?: PeriodPreset
  customWindow?: CustomWindow
  /** One-time only - literal parameter date range (mirrors the existing
   *  on-demand parameter screen; end can't be later than runDate). */
  dateRange?: { start: string; end: string }
  /** One-time only - concrete future date. */
  runDate?: string
  runTime: string
  timezone: string
  endCondition?: EndCondition
  endDate?: string
  endAfterRuns?: number
  afterEachRun?: boolean

  // -- delivery (Fn 1.4) --
  delivery: { platform: boolean; email: boolean; link: boolean }
  emailRecipients: Array<Recipient>
  linkRecipients: Array<Recipient>

  // -- lifecycle (Fn 2.1 / 3.1 / 3.2) --
  status: ScheduleStatus
  pausedReason?: string
  nextRun?: string
  history: Array<ScheduleRun>
}

export type ScheduleModal =
  | 'create'
  | 'edit'
  | 'pii-warning'
  | 'success'
  | 'pause-confirm'
  | 'resume-confirm'
  | 'delete-confirm'

/** The 3-step config modal's step (Figma 603:13584 - Schedule details /
 *  Delivery setup / Review). UI-only navigation, not part of the saved
 *  ScheduleConfig - threaded through the view so a catalog state can
 *  freeze on any step. */
export type ModalStep = 1 | 2 | 3

export interface LandingView {
  role: 'Org Owner' | 'Admin' | 'AP Approver' | 'AR Approver'
  category?: ReportCategory | 'All'
}

export interface DetailView {
  reportId: string
  editingParams?: boolean
  /** Live App only - real params carried from the detail screen into Schedule. */
  dateRange?: { start: string; end: string }
  /** Schedule modal layered on top (create flow only - Fn 1.1-1.4). */
  modal?: Extract<ScheduleModal, 'create' | 'pii-warning' | 'success'>
  /** Live App only - the draft being built while the modal is open. */
  draft?: ScheduleConfig
  /** Catalog only - freeze the create modal on a specific step. */
  modalStep?: ModalStep
}

export type ListTab = 'generated' | 'scheduled'

export interface GeneratedRow {
  id: string
  reportId: string
  generatedAt: string
  status: RunStatus
  delivery: { platform: boolean; emailCount: number; emailFailed: number }
  scheduleId?: string
  bucket: 'Today' | 'This week' | 'This month' | 'Last month'
}

export interface ListsView {
  tab: ListTab
  /** Live App only - real schedule list. Catalog scenarios use fixed mocks. */
  schedules?: Array<ScheduleConfig>
  generated?: Array<GeneratedRow>
  /** Row whose drawer is open. */
  drawerFor?: string
  /** Row whose action menu is open. */
  menuFor?: string
  modal?: Extract<ScheduleModal, 'edit' | 'pause-confirm' | 'resume-confirm' | 'delete-confirm'>
  modalTargetId?: string
  /** Live App only - the mutable copy being edited (edit modal). */
  draft?: ScheduleConfig
  /** Catalog only - freeze the edit modal on a specific step. */
  modalStep?: ModalStep
  empty?: boolean
  loading?: boolean
  error?: boolean
}

export type RecipientAccessStep =
  | 'email-entry'
  | 'otp-sent'
  | 'otp-wrong'
  | 'otp-locked'
  | 'download-ready'
  | 'expired'
  | 'unavailable'
  | 'revoked'

export interface RecipientAccessView {
  step: RecipientAccessStep
  reportName?: string
  recipientEmail?: string
  attemptsLeft?: number
}

export type AppView =
  | { kind: 'landing'; landing: LandingView }
  | { kind: 'detail'; detail: DetailView }
  | { kind: 'lists'; lists: ListsView }
  | { kind: 'recipient-access'; recipientAccess: RecipientAccessView }
