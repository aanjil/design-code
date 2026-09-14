import type { Frequency, Rule } from './engine'
import type { PaySchedule } from '@/mocks/payroll'

/**
 * AppView - everything a screen needs to render one exact state.
 * Each catalog state builds a fresh AppView from the seed (no leakage
 * between scenarios); screens stay interactive on top of it.
 */

export type DashboardModal = 'archive-blocked' | 'archive-confirm' | 'delete-blocked' | 'reactivate'

export interface DashboardView {
  /** Empty = A1 zero-schedules state. */
  empty?: boolean
  vision: 'v1' | 'full'
  /** Active/Archived tab - the tab itself always renders (matches Figma
   *  190:3475); only `vision: 'full'` populates Archived with real data
   *  and exposes the archive/delete actions. */
  tab?: 'active' | 'archived'
  /** A1's empty-state alternative: Emma's computed starter schedules
   *  instead of the plain "set up your first schedule" panel. Only
   *  meaningful when `empty` is true. */
  aiSuggest?: boolean
  /** The AppBar's "Ask Emma" button, opened as a right-side copilot panel
   *  instead of inline page content - a second variation of the same idea
   *  (real suggestions from suggestSchedules), reached by a global trigger
   *  instead of a link inside the page. `undefined` = closed. `'thinking'`
   *  auto-advances to `'suggestions'` (Live App: a real timer; catalog:
   *  two distinct frozen states for review). */
  copilot?: 'thinking' | 'suggestions'
  /** Schedule id whose ⋯ menu starts open (C2). */
  menuFor?: string
  modal?: DashboardModal
  /** Live App only — the real schedule the open modal targets. */
  modalSchedule?: PaySchedule
  /** Live App only — real, mutable schedule list. Falls back to the
   *  static mock SCHEDULES when absent (every catalog scenario). */
  schedules?: Array<PaySchedule>
}

export type WizardStep = 'details' | 'membership' | 'rules' | 'conflicts' | 'review'

export interface WizardView {
  step: WizardStep
  /** First-time setup (A group): membership locked to “All employees”. */
  isFirst: boolean
  /** A3: org has no employees yet. */
  noEmployees?: boolean
  /** Catalog only - seeds the wizard's lifted draft with a real starting
   *  rule, so each B2/B3/G1/G2 state shows a genuinely different, really-
   *  computed membership outcome instead of a cosmetic boolean flag. Absent
   *  in Live App - the wizard's own draft state is the source of truth there. */
  initialRule?: Rule
  initialFrequency?: Frequency
  /** Catalog + Live App - seeds the wizard's starting name (e.g. from an
   *  accepted/customized AI suggestion) instead of the Create default. */
  initialName?: string
  /** Present = edit mode. The wizard seeds its draft from this real schedule
   *  instead of Create defaults, retitles itself, and on Review commits an
   *  update instead of a new schedule - the same B1-B4 flow either way ("it
   *  just needs edit flow", not a second flow). */
  editSchedule?: PaySchedule
  /** Live App only - real employee ids currently assigned (by override) to
   *  `editSchedule`, when it has no rule. Lets editing a manual schedule
   *  seed its checklist from what's actually assigned instead of starting
   *  empty - catalog scenarios never edit a no-rule schedule, so this stays
   *  unset there. */
  initialManualMembers?: Array<string>
  /** Catalog only - when editing AND `initialFrequency` differs from the
   *  schedule's own, seeds the effective-date field to this exact ISO date
   *  instead of the naturally-next one (PRD §1.1: the next allowed date and
   *  a schedule's draft-run window aren't the same date, so demonstrating
   *  the draft-in-window block needs a specific later option selected). */
  initialEffectiveDate?: string
  /** Emma assist panel open on this step (G1/G2). */
  emma?: 'compliance' | 'conflict'
}

export type MoveStage = 'date' | 'review' | 'confirm'

export interface MoveView {
  stage: MoveStage
  from: Frequency
  to: Frequency
  /** Real schedule id for `to`, when a specific one was picked from the
   *  spacious schedule list (round 2) rather than just a frequency - lets
   *  two schedules sharing a frequency (e.g. Contractors and the default,
   *  both Weekly) resolve to the one actually chosen. Catalog scenarios
   *  omit this and fall back to the first schedule matching `to`. */
  toScheduleId?: string
  /** Preset effective date; the field stays editable (validation is live). */
  effectiveDate: string
  hourly?: boolean
  confirmMode?: 'immediate' | 'scheduled'
  /** Live App only — which real employee this move applies to. Catalog
   *  scenarios omit this and fall back to the fixed MOVE_EMPLOYEE. */
  employeeId?: string
}

/**
 * C8 - one schedule's own page: metadata, its real rule, its real member
 * list, and the Move flow (D2-D4) layered on top. Replaces the old
 * cross-schedule "Employees" list - membership is only ever viewed scoped
 * to a schedule now, not as one global directory.
 */
export interface ScheduleDetailView {
  scheduleId: string
  move?: MoveView
  emma?: 'location'
  reeval?: 'prompt' | 'flagged'
  /** Live App only — real per-employee schedule overrides. */
  assignments?: Record<string, string>
  /** Live App only — real, mutable schedule list. */
  schedules?: Array<PaySchedule>
}

export interface RunsView {
  variant: 'needs-action' | 'scheduled'
  picker?: 'v1' | 'full'
  /** Live App only — real, mutable schedule list. */
  schedules?: Array<PaySchedule>
}

/** Which real seeded hire candidate H1 is demonstrating - each produces a
 *  genuinely different, really-matched outcome against the real schedules
 *  (see mocks/payroll.ts's HIRE_CANDIDATES), not a cosmetic label. */
export type HireCandidateKey = 'matched' | 'several' | 'default' | 'compliance'

export interface HireView {
  candidate?: HireCandidateKey
}

export type AppView =
  | { kind: 'dashboard'; dashboard: DashboardView }
  | { kind: 'wizard'; wizard: WizardView }
  | { kind: 'scheduleDetail'; scheduleDetail: ScheduleDetailView }
  | { kind: 'runs'; runs: RunsView }
  | { kind: 'hire'; hire: HireView }
