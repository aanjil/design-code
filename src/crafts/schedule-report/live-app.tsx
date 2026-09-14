import { useState, useSyncExternalStore } from 'react'
import type { AppView, GeneratedRow, ScheduleConfig } from './types'
import { liveStore } from './live-store'
import { renderWithChrome } from './app'
import { FULL_WEEKDAYS, ORG_TIMEZONE_LABEL, WORLD_TODAY, computeNextRun } from './engine'
import { getReport } from '@/mocks/insights-reports'
import { ExplorerContext } from '@/components/playground/explorer'
import type { ExplorerContextValue } from '@/components/playground/explorer'

/**
 * The master "App" flow: one real, interactive instance of the whole
 * feature, backed by a persisted live store (live-store.ts) instead of
 * the deterministic catalog. Reuses every screen component unchanged -
 * it supplies its own useExplorer() value whose show() performs real
 * data mutations (create/edit/pause/resume/delete a schedule) instead of
 * looking up a fixed scenario. Mirrors multi-payroll/live-app.tsx.
 */

interface LiveNav {
  screenId: string
  stateId: string
  reportId: string
  draft: ScheduleConfig | null
  modalTargetId: string | null
  drawerFor: string | null
  menuFor: string | null
  tab: 'generated' | 'scheduled'
  /** True right after Save, until the success dialog is dismissed - keeps
   *  the create modal's screenId stable while swapping create -> success. */
  justCreated: boolean
}

const NAV_KEY = 'nds-live:schedule-report:nav'

const RUN_TIME_24H: Record<string, string> = {
  '6:00 AM': '06:00',
  '7:00 AM': '07:00',
  '8:00 AM': '08:00',
  '9:00 AM': '09:00',
  '10:00 AM': '10:00',
  '12:00 PM': '12:00',
}

function defaultDraft(reportId: string): ScheduleConfig {
  const report = getReport(reportId)
  return {
    id: 'draft',
    reportId,
    owner: 'Anna Smith',
    createdAt: WORLD_TODAY,
    cadence: 'once',
    dateRange: report.dateShape === 'range' ? { start: '2026-04-01', end: '2026-06-30' } : undefined,
    runDate: '2026-07-20',
    runTime: '9:00 AM',
    timezone: ORG_TIMEZONE_LABEL,
    delivery: { platform: true, email: false, link: false },
    emailRecipients: [],
    linkRecipients: [],
    status: 'active',
    history: [],
  }
}

function nextRunFor(draft: ScheduleConfig): string {
  const time = RUN_TIME_24H[draft.runTime] ?? '09:00'
  if (draft.cadence === 'once') return `${draft.runDate ?? WORLD_TODAY}T${time}:00`
  const frequency = draft.frequency ?? 'Monthly'
  const anchorDay = draft.anchorDay ?? (frequency === 'Weekly' ? FULL_WEEKDAYS[1] : '1')
  const { date } = computeNextRun(frequency, anchorDay, WORLD_TODAY)
  return `${date}T${time}:00`
}

function loadNav(): LiveNav {
  try {
    const raw = window.localStorage.getItem(NAV_KEY)
    if (raw) return JSON.parse(raw) as LiveNav
  } catch {
    /* first run */
  }
  return {
    screenId: 'A1',
    stateId: 'owner',
    reportId: 'master-bill',
    draft: null,
    modalTargetId: null,
    drawerFor: null,
    menuFor: null,
    tab: 'scheduled',
    justCreated: false,
  }
}

function saveNav(nav: LiveNav) {
  try {
    window.localStorage.setItem(NAV_KEY, JSON.stringify(nav))
  } catch {
    /* ignore */
  }
}

function deriveLiveView(schedules: Array<ScheduleConfig>, generated: Array<GeneratedRow>, nav: LiveNav): AppView {
  const { screenId } = nav

  if (screenId === 'A3') {
    return { kind: 'detail', detail: { reportId: nav.reportId } }
  }
  if (screenId === 'B1' || screenId === 'B4') {
    return {
      kind: 'detail',
      detail: {
        reportId: nav.draft?.reportId ?? nav.reportId,
        modal: nav.justCreated ? 'success' : 'create',
        draft: nav.draft ?? defaultDraft(nav.reportId),
      },
    }
  }
  if (screenId === 'B5') {
    return {
      kind: 'detail',
      detail: { reportId: nav.draft?.reportId ?? nav.reportId, modal: 'pii-warning', draft: nav.draft ?? undefined },
    }
  }
  if (screenId === 'B6') {
    return {
      kind: 'lists',
      lists: {
        tab: 'scheduled',
        schedules,
        generated,
        modal: 'edit',
        modalTargetId: nav.modalTargetId ?? undefined,
        draft: nav.draft ?? undefined,
      },
    }
  }
  if (screenId === 'C5' || screenId === 'C6') {
    return {
      kind: 'lists',
      lists: {
        tab: 'scheduled',
        schedules,
        generated,
        modal: screenId === 'C5' ? 'pause-confirm' : 'delete-confirm',
        modalTargetId: nav.modalTargetId ?? undefined,
      },
    }
  }
  if (screenId === 'C1' || screenId === 'C2' || screenId === 'C3' || screenId === 'C4') {
    return {
      kind: 'lists',
      lists: {
        tab: nav.tab,
        schedules,
        generated,
        drawerFor: nav.drawerFor ?? undefined,
        menuFor: nav.menuFor ?? undefined,
      },
    }
  }
  return { kind: 'landing', landing: { role: 'Org Owner', category: 'All' } }
}

export function LiveApp({
  onNavItemClick,
}: {
  /** Master App only - wires the AppBar's top-level pills to real
   *  cross-section navigation instead of just the local highlight. */
  onNavItemClick?: (label: string) => void
} = {}) {
  const data = useSyncExternalStore(liveStore.subscribe, liveStore.getSnapshot, liveStore.getServerSnapshot)
  const [nav, setNavState] = useState<LiveNav>(() => loadNav())

  function setNav(next: LiveNav) {
    setNavState(next)
    saveNav(next)
  }

  function show(screenId: string, stateId?: string, payload?: Record<string, unknown>) {
    let draft = nav.draft
    let reportId = nav.reportId
    let modalTargetId = nav.modalTargetId
    let drawerFor = nav.drawerFor
    let menuFor = nav.menuFor
    let tab = nav.tab
    let justCreated = false

    if (screenId === 'B1' && typeof payload?.reportId === 'string') {
      reportId = payload.reportId
      draft = defaultDraft(payload.reportId)
    }
    if (screenId === 'B6' && typeof payload?.scheduleId === 'string') {
      modalTargetId = payload.scheduleId
      const target = data.schedules.find((s) => s.id === payload.scheduleId)
      if (target) draft = { ...target }
    }
    if (screenId === 'C3' && typeof payload?.scheduleId === 'string') {
      drawerFor = payload.scheduleId
      menuFor = null
    }
    if (screenId === 'C4' && typeof payload?.scheduleId === 'string') {
      menuFor = payload.scheduleId
    }
    if ((screenId === 'C5' || screenId === 'C6') && typeof payload?.scheduleId === 'string') {
      modalTargetId = payload.scheduleId
    }
    if (screenId === 'C1') {
      tab = 'scheduled'
      drawerFor = null
      menuFor = null
    }
    if (screenId === 'C2') {
      tab = 'generated'
      drawerFor = null
      menuFor = null
    }

    // commits - real side effects on the live store
    if (payload?.commitCreate && payload.draft) {
      const d = payload.draft as ScheduleConfig
      liveStore.addSchedule({
        ...d,
        id: `sch-live-${data.schedules.length + 1}`,
        status: 'active',
        nextRun: nextRunFor(d),
        history: [],
      })
      // Keep `draft` around (don't null it) so the success dialog that
      // replaces the create modal can still read the report name/config.
      justCreated = true
    }
    if (payload?.commitEdit && payload.draft && typeof payload.scheduleId === 'string') {
      const d = payload.draft as ScheduleConfig
      liveStore.updateSchedule(payload.scheduleId, { ...d, nextRun: nextRunFor(d) })
      draft = null
      modalTargetId = null
    }
    if (payload?.commitPause && typeof payload.scheduleId === 'string') {
      liveStore.updateSchedule(payload.scheduleId, { status: 'paused', nextRun: undefined })
      modalTargetId = null
    }
    if (payload?.commitDelete && typeof payload.scheduleId === 'string') {
      liveStore.removeSchedule(payload.scheduleId)
      modalTargetId = null
    }
    if (typeof payload?.resumeId === 'string') {
      const target = data.schedules.find((s) => s.id === payload.resumeId)
      if (target) liveStore.updateSchedule(payload.resumeId, { status: 'active', nextRun: nextRunFor(target) })
    }

    setNav({ screenId, stateId: stateId ?? '', reportId, draft, modalTargetId, drawerFor, menuFor, tab, justCreated })
  }

  function onDraftChange(patch: Partial<ScheduleConfig>) {
    if (!nav.draft) return
    setNav({ ...nav, draft: { ...nav.draft, ...patch } })
  }

  const view = deriveLiveView(data.schedules, data.generated, nav)

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
      {renderWithChrome(view, 'live-app', onDraftChange, onNavItemClick)}
    </ExplorerContext.Provider>
  )
}
