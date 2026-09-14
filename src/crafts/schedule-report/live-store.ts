import type { GeneratedRow, ScheduleConfig } from './types'

/**
 * The Live App's real, mutable, localStorage-persisted world - separate
 * from the deterministic catalog scenarios (which never leak state).
 * Mirrors multi-payroll's live-store.ts exactly: a plain external store
 * (subscribe/getSnapshot) so both the App frame (useSyncExternalStore)
 * and the panel's Reset button can read/mutate it without threading
 * props through the memoized canvas window list.
 */

export interface LiveData {
  schedules: Array<ScheduleConfig>
  generated: Array<GeneratedRow>
}

const DATA_KEY = 'nds-live:schedule-report:data'

/** Starts empty on purpose - lets the Live App walk the real first-run
 *  flow (no schedules -> create one -> populated list). */
function seed(): LiveData {
  return { schedules: [], generated: [] }
}

let cached: LiveData | null = null

function read(): LiveData {
  if (cached) return cached
  try {
    const raw = window.localStorage.getItem(DATA_KEY)
    cached = raw ? (JSON.parse(raw) as LiveData) : seed()
  } catch {
    cached = seed()
  }
  return cached
}

function persist() {
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(cached))
  } catch {
    /* ignore (private mode / quota) */
  }
}

const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((l) => l())
}

export const liveStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  getSnapshot(): LiveData {
    return read()
  },
  /** SSR/hydration snapshot - always the empty seed (no localStorage on the server). */
  getServerSnapshot(): LiveData {
    return seed()
  },
  reset() {
    cached = seed()
    persist()
    emit()
  },
  addSchedule(schedule: ScheduleConfig) {
    const cur = read()
    cached = { ...cur, schedules: [...cur.schedules, schedule] }
    persist()
    emit()
  },
  updateSchedule(id: string, patch: Partial<ScheduleConfig>) {
    const cur = read()
    cached = {
      ...cur,
      schedules: cur.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }
    persist()
    emit()
  },
  removeSchedule(id: string) {
    const cur = read()
    cached = { ...cur, schedules: cur.schedules.filter((s) => s.id !== id) }
    persist()
    emit()
  },
  addGenerated(row: GeneratedRow) {
    const cur = read()
    cached = { ...cur, generated: [row, ...cur.generated] }
    persist()
    emit()
  },
}
