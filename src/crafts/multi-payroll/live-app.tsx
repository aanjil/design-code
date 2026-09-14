import { useEffect, useState, useSyncExternalStore } from 'react'
import type { AppView, MoveView, WizardStep } from './types'
import type { WizardDraft } from './screens/wizard'
import { liveStore } from './live-store'
import { renderWithChrome } from './app'
import { WORLD_TODAY, addDaysISO, evaluateRule, periodOf, suggestSchedules } from './engine'
import type { Frequency, Rule } from './engine'
import { PAYROLL_EMPLOYEES, SCHEDULES, liveScheduleFor, scheduleFor } from '@/mocks/payroll'
import type { PaySchedule } from '@/mocks/payroll'
import { employees } from '@/mocks/employees'
import { ExplorerContext } from '@/components/playground/explorer'
import type { ExplorerContextValue } from '@/components/playground/explorer'

/**
 * The master "App" flow: one real, interactive instance of the whole
 * feature, backed by a persisted live store (live-store.ts) instead of
 * the deterministic catalog. Reuses every screen component unchanged —
 * it supplies its own `useExplorer()` value whose `show()` performs real
 * data mutations (create schedule, move employee) instead of looking up
 * a fixed scenario, then forwards the navigation to the REAL catalog
 * explorer too, so the Flows panel stays in sync with what the App is
 * showing (per-screen A-H ids are the shared vocabulary between them).
 */

const WIZARD_STEP_FOR: Record<string, WizardStep> = {
  A2: 'details',
  A3: 'membership',
  A5: 'review',
  B1: 'details',
  B2: 'rules',
  B3: 'conflicts',
  B4: 'review',
}

const FREQ_CYCLE: Array<Frequency> = ['Monthly', 'Bi-weekly', 'Weekly', 'Semi-monthly']
function nextFrequency(freq: Frequency): Frequency {
  const i = FREQ_CYCLE.indexOf(freq)
  return FREQ_CYCLE[(i + 1) % FREQ_CYCLE.length]
}

/** Same conventions SCHEDULE_BASE (mocks/payroll.ts) uses per frequency, so
 *  a real, accepted AI suggestion looks identical to a hand-built one. */
const PAYDAY_RULE_TEXT: Record<Frequency, string> = {
  Weekly: 'Every Friday',
  'Bi-weekly': 'Every other Friday',
  'Semi-monthly': '15th and last day of the month',
  Monthly: 'Last working day of the month',
}
const PAYDAY_LAG: Record<Frequency, number> = {
  Weekly: 5,
  'Bi-weekly': 5,
  'Semi-monthly': 0,
  Monthly: 0,
}
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

interface MoveDraft {
  employeeId: string
  from: Frequency
  to: Frequency
  /** The specific schedule picked from the spacious list (round 2), when
   *  it differs from the first schedule of `to`'s frequency. */
  toScheduleId?: string
  effectiveDate: string
}

interface LiveNav {
  /** Bumped whenever a field is added/changed - see live-store.ts's
   *  CURRENT_VERSION for why stale-shaped localStorage must be discarded
   *  outright rather than partially trusted. */
  version: number
  screenId: string
  stateId: string
  moveDraft: MoveDraft | null
  /** Which schedule's own page (C8) - and, once inside the Move flow
   *  (D2-D4), which schedule to return to - is currently open. */
  scheduleId: string | null
  /** Present = the wizard (B1-B4) is in edit mode for this real schedule. */
  editScheduleId: string | null
  /** Dashboard (A1/C1) Active/Archived tab. */
  dashTab: 'active' | 'archived' | null
  /** A1's empty-state alternative: Emma's computed starter schedules. */
  aiSuggest: boolean
  /** The Ask-Emma-triggered copilot panel - null = closed. */
  copilot: 'thinking' | 'suggestions' | null
  /** Wizard (B1-B4) seed from an AI suggestion's "Customize before
   *  creating" - cleared on any return to the dashboard. */
  seedRule: Rule | null
  seedFrequency: Frequency | null
  seedName: string | null
}

const NAV_KEY = 'nds-live:multi-payroll:nav'
const NAV_VERSION = 2

function defaultNav(): LiveNav {
  return {
    version: NAV_VERSION,
    screenId: 'C1',
    stateId: 'v1',
    moveDraft: null,
    scheduleId: null,
    editScheduleId: null,
    dashTab: null,
    aiSuggest: false,
    copilot: null,
    seedRule: null,
    seedFrequency: null,
    seedName: null,
  }
}

function loadNav(): LiveNav {
  try {
    const raw = window.localStorage.getItem(NAV_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<LiveNav>) : null
    if (parsed && parsed.version === NAV_VERSION) return parsed as LiveNav
  } catch {
    /* first run */
  }
  return defaultNav()
}

function saveNav(nav: LiveNav) {
  try {
    window.localStorage.setItem(NAV_KEY, JSON.stringify(nav))
  } catch {
    /* ignore */
  }
}

function deriveLiveView(
  schedules: Array<PaySchedule>,
  assignments: Record<string, string>,
  nav: LiveNav,
): AppView {
  const { screenId } = nav

  if (screenId in WIZARD_STEP_FOR) {
    const isFirst = screenId === 'A2' || screenId === 'A3' || screenId === 'A5'
    const editSchedule = nav.editScheduleId
      ? schedules.find((s) => s.id === nav.editScheduleId)
      : undefined
    // Editing a real no-rule schedule - seed the manual checklist from who's
    // actually assigned to it right now (real overrides), not an empty list.
    const initialManualMembers =
      editSchedule && !editSchedule.rule
        ? Object.entries(assignments)
            .filter(([, scheduleId]) => scheduleId === editSchedule.id)
            .map(([employeeId]) => employeeId)
        : undefined
    return {
      kind: 'wizard',
      wizard: {
        step: WIZARD_STEP_FOR[screenId],
        isFirst,
        editSchedule,
        initialManualMembers,
        // AI-suggestion seeds only apply to a fresh create, never edit mode.
        initialRule: editSchedule ? undefined : (nav.seedRule ?? undefined),
        initialFrequency: editSchedule ? undefined : (nav.seedFrequency ?? undefined),
        initialName: editSchedule ? undefined : (nav.seedName ?? undefined),
      },
    }
  }

  if (screenId === 'C8' || screenId === 'D2' || screenId === 'D3' || screenId === 'D4') {
    const move: MoveView | undefined = nav.moveDraft
      ? {
          stage: screenId === 'D2' ? 'date' : screenId === 'D3' ? 'review' : 'confirm',
          from: nav.moveDraft.from,
          to: nav.moveDraft.to,
          toScheduleId: nav.moveDraft.toScheduleId,
          effectiveDate: nav.moveDraft.effectiveDate,
          employeeId: nav.moveDraft.employeeId,
          confirmMode: 'immediate',
        }
      : undefined
    return {
      kind: 'scheduleDetail',
      scheduleDetail: { scheduleId: nav.scheduleId ?? schedules[0]?.id ?? 'sch-default', assignments, schedules, move },
    }
  }

  if (screenId === 'F1' || screenId === 'F2') {
    return {
      kind: 'runs',
      runs: { variant: 'needs-action', picker: screenId === 'F2' ? 'v1' : undefined, schedules },
    }
  }

  // default: dashboard (also covers A1 - "back out of first-time wizard")
  return {
    kind: 'dashboard',
    dashboard: {
      vision: 'v1',
      empty: schedules.length === 0,
      schedules,
      tab: nav.dashTab ?? 'active',
      aiSuggest: nav.aiSuggest,
      copilot: nav.copilot ?? undefined,
    },
  }
}

export function LiveApp({
  onNavItemClick,
}: {
  /** Master App only - wires the AppBar's top-level pills to real
   *  cross-section navigation instead of just the local highlight. */
  onNavItemClick?: (label: string) => void
} = {}) {
  const data = useSyncExternalStore(
    liveStore.subscribe,
    liveStore.getSnapshot,
    liveStore.getServerSnapshot,
  )
  const [nav, setNav] = useState<LiveNav>(() => loadNav())

  function show(screenId: string, stateId?: string, payload?: Record<string, unknown>) {
    let nextMoveDraft = nav.moveDraft
    let nextScheduleId = nav.scheduleId
    let nextEditScheduleId = nav.editScheduleId
    let nextDashTab = nav.dashTab
    let nextAiSuggest = nav.aiSuggest
    let nextCopilot = nav.copilot
    let nextSeedRule = nav.seedRule
    let nextSeedFrequency = nav.seedFrequency
    let nextSeedName = nav.seedName

    // entering a schedule's own page, or the Move flow launched from it
    if (typeof payload?.scheduleId === 'string') {
      nextScheduleId = payload.scheduleId
    }
    // entering the wizard in edit mode (dashboard ⋯ menu's Edit details/rule)
    if (typeof payload?.editScheduleId === 'string') {
      nextEditScheduleId = payload.editScheduleId
    }
    // dashboard Active/Archived tab
    if (payload?.tab === 'active' || payload?.tab === 'archived') {
      nextDashTab = payload.tab
    }
    // A1's empty-state toggle (plain empty <-> Emma's suggested setup)
    if (typeof payload?.aiSuggest === 'boolean') {
      nextAiSuggest = payload.aiSuggest
    }
    // Ask-Emma copilot panel - explicit null closes it (backdrop/Escape/Not now)
    if (payload && 'copilot' in payload) {
      nextCopilot = payload.copilot as 'thinking' | 'suggestions' | null
    }
    // entering the wizard seeded from an AI suggestion's "Customize before creating"
    if (payload && 'initialRule' in payload) {
      nextSeedRule = (payload.initialRule as Rule | null | undefined) ?? null
    }
    if (typeof payload?.initialFrequency === 'string') {
      nextSeedFrequency = payload.initialFrequency as Frequency
    }
    if (typeof payload?.initialName === 'string') {
      nextSeedName = payload.initialName
    }
    // leaving the wizard (any non-wizard destination) - seeds don't carry over
    if (!(screenId in WIZARD_STEP_FOR)) {
      nextSeedRule = null
      nextSeedFrequency = null
      nextSeedName = null
    }

    // accept every AI-suggested schedule at once - each already
    // compliance-checked (see engine.ts's suggestSchedules), so a single
    // batch create is safe, unlike a normal one-at-a-time schedule create.
    if (screenId === 'C1' && payload?.acceptAiSuggestions) {
      for (const s of suggestSchedules(employees)) {
        const period = periodOf(s.frequency, WORLD_TODAY)
        const lag = PAYDAY_LAG[s.frequency]
        liveStore.addSchedule({
          id: s.rule ? `sch-ai-${slugify(s.name)}` : 'sch-default',
          name: s.name,
          frequency: s.frequency,
          payDayRule: PAYDAY_RULE_TEXT[s.frequency],
          workWeekStartDay: 'Sunday',
          rule: s.rule,
          isDefault: s.rule === null,
          memberCount: s.matched.length,
          nextPeriodEnd: period.end,
          nextPayday: addDaysISO(period.end, lag),
          status: 'active',
          hasHistory: false,
          createdAt: WORLD_TODAY,
        })
      }
      nextAiSuggest = false
      nextCopilot = null
    }

    // start (or restart) a move for a specific real employee
    if (screenId === 'D2' && typeof payload?.employeeId === 'string') {
      const employeeId = payload.employeeId
      const employee = PAYROLL_EMPLOYEES.find((e) => e.id === employeeId)
      const current = employee
        ? liveScheduleFor(employee, data.assignments, data.schedules)
        : undefined
      const from = current?.frequency ?? 'Monthly'
      nextMoveDraft = { employeeId, from, to: nextFrequency(from), effectiveDate: WORLD_TODAY }
    }
    // the typed date and the picked target schedule carry forward from the date step
    if (typeof payload?.moveDate === 'string' && nextMoveDraft) {
      nextMoveDraft = { ...nextMoveDraft, effectiveDate: payload.moveDate }
    }
    if (typeof payload?.moveToFrequency === 'string' && nextMoveDraft) {
      nextMoveDraft = { ...nextMoveDraft, to: payload.moveToFrequency as Frequency }
    }
    if (typeof payload?.moveToScheduleId === 'string' && nextMoveDraft) {
      nextMoveDraft = { ...nextMoveDraft, toScheduleId: payload.moveToScheduleId }
    }

    // commit: wizard review -> create or update the real schedule
    if (screenId === 'C1' && (nav.screenId === 'A5' || nav.screenId === 'B4')) {
      if (nav.editScheduleId) {
        const draft = payload?.updatedSchedule as WizardDraft | undefined
        if (draft) {
          const period = periodOf(draft.frequency, WORLD_TODAY)
          const memberCount = draft.hasRule
            ? evaluateRule(draft.rule, employees, draft.frequency, (e) => scheduleFor(e), 'sch-default').matched
                .length
            : draft.manualMembers.length
          liveStore.updateSchedule(nav.editScheduleId, {
            name: draft.name,
            frequency: draft.frequency,
            payDayRule: draft.payDay,
            rule: draft.hasRule ? draft.rule : null,
            memberCount,
            nextPeriodEnd: period.end,
            nextPayday: period.end,
          })
          if (!draft.hasRule) liveStore.setManualMembers(nav.editScheduleId, draft.manualMembers)
        }
      } else {
        const draft = payload?.createdSchedule as WizardDraft | undefined
        if (draft) {
          const isFirst = nav.screenId === 'A5'
          const period = periodOf(draft.frequency, WORLD_TODAY)
          // First schedule is always the everyone-catches-all default,
          // regardless of what the (locked, uneditable) membership step
          // showed - every other schedule's rule is opt-in (PRD round 2).
          const rule = isFirst ? null : draft.hasRule ? draft.rule : null
          const memberCount = isFirst
            ? employees.length
            : draft.hasRule
              ? evaluateRule(rule!, employees, draft.frequency, (e) => scheduleFor(e), 'sch-default').matched.length
              : draft.manualMembers.length
          const id = `sch-live-${data.schedules.length + 1}`
          liveStore.addSchedule({
            id,
            name: draft.name,
            frequency: draft.frequency,
            payDayRule: draft.payDay,
            workWeekStartDay: 'Sunday',
            rule,
            memberCount,
            nextPeriodEnd: period.end,
            nextPayday: period.end,
            status: 'active',
            hasHistory: false,
            createdAt: WORLD_TODAY,
          })
          if (!isFirst && !draft.hasRule) liveStore.setManualMembers(id, draft.manualMembers)
        }
      }
      nextEditScheduleId = null
    }

    // commit: move confirm -> really reassign the employee
    if (screenId === 'C8' && payload?.completeMove && nextMoveDraft) {
      const target = nextMoveDraft.toScheduleId
        ? (data.schedules.find((s) => s.id === nextMoveDraft!.toScheduleId) ??
          SCHEDULES.find((s) => s.id === nextMoveDraft!.toScheduleId))
        : (data.schedules.find((s) => s.frequency === nextMoveDraft!.to) ??
          SCHEDULES.find((s) => s.frequency === nextMoveDraft!.to))
      if (target) liveStore.assignEmployee(nextMoveDraft.employeeId, target.id)
      nextMoveDraft = null
    }

    const next: LiveNav = {
      version: NAV_VERSION,
      screenId,
      stateId: stateId ?? '',
      moveDraft: nextMoveDraft,
      scheduleId: nextScheduleId,
      editScheduleId: nextEditScheduleId,
      dashTab: nextDashTab,
      aiSuggest: nextAiSuggest,
      copilot: nextCopilot,
      seedRule: nextSeedRule,
      seedFrequency: nextSeedFrequency,
      seedName: nextSeedName,
    }
    setNav(next)
    saveNav(next)
    // NOTE: deliberately does NOT forward to the outer catalog explorer -
    // that also drives canvas focusWindow, which would yank the view off
    // the App (often mid-fullscreen) to the matching catalog frame.
  }

  const view = deriveLiveView(data.schedules, data.assignments, nav)

  // Real "thinking" delay before Emma's suggestions appear - the catalog
  // shows both stages as distinct frozen frames instead (no timers there).
  useEffect(() => {
    if (nav.copilot !== 'thinking') return
    const timer = setTimeout(() => show('C1', undefined, { copilot: 'suggestions' }), 900)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.copilot])

  function onSidebarNavigate(label: string) {
    if (label === 'Payroll') show('F1')
    else if (label === 'Payroll Schedule') show('C1')
    // other sidebar items have no real destination in this craft yet
  }

  const liveValue: ExplorerContextValue = {
    catalog: [],
    screenId: nav.screenId,
    stateId: nav.stateId,
    show,
    done: {},
    toggleDone: () => {},
    resetDone: () => {},
    total: 0,
    checked: 0,
    focusNonce: 0,
  }

  return (
    <ExplorerContext.Provider value={liveValue}>
      {renderWithChrome(
        view,
        'live-app',
        onSidebarNavigate,
        () => show('C1', undefined, { copilot: 'thinking' }),
        onNavItemClick,
      )}
    </ExplorerContext.Provider>
  )
}
