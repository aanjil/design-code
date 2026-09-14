import type { PaySchedule } from '@/mocks/payroll'

/**
 * The Live App's real, mutable, localStorage-persisted world — separate
 * from the deterministic catalog scenarios (which never leak state).
 * A plain external store (subscribe/getSnapshot) so both the App frame
 * (via useSyncExternalStore) and the explorer panel's Reset button can
 * read/mutate it without threading props through the memoized canvas
 * window list.
 */

export interface LiveData {
  /** Bumped whenever PaySchedule's shape changes - lets `read()` throw away
   *  data saved under an older shape instead of handing a half-matching
   *  object to code that assumes the current one (see the version-mismatch
   *  crashes this was added to fix). */
  version: number
  schedules: Array<PaySchedule>
  /** employeeId -> scheduleId, real overrides from real Move actions. */
  assignments: Record<string, string>
}

/** Bump this any time PaySchedule (or LiveData itself) gains/changes a
 *  field a screen reads unconditionally - e.g. `currentRun`, `rule`'s
 *  structured shape. Old localStorage under a stale version is discarded,
 *  never partially trusted. */
const CURRENT_VERSION = 2

const DATA_KEY = 'nds-live:multi-payroll:data'

/** Starts empty on purpose — lets the Live App walk the real first-run
 *  flow (empty state → first schedule → populated dashboard). */
function seed(): LiveData {
  return { version: CURRENT_VERSION, schedules: [], assignments: {} }
}

function isCurrentShape(value: unknown): value is LiveData {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as LiveData).version === CURRENT_VERSION &&
    Array.isArray((value as LiveData).schedules)
  )
}

let cached: LiveData | null = null

function read(): LiveData {
  if (cached) return cached
  try {
    const raw = window.localStorage.getItem(DATA_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    cached = isCurrentShape(parsed) ? parsed : seed()
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
  /** SSR/hydration snapshot — always the empty seed (no localStorage on the server). */
  getServerSnapshot(): LiveData {
    return seed()
  },
  reset() {
    cached = seed()
    persist()
    emit()
  },
  addSchedule(schedule: PaySchedule) {
    const cur = read()
    cached = { ...cur, schedules: [...cur.schedules, schedule] }
    persist()
    emit()
  },
  updateSchedule(id: string, patch: Partial<PaySchedule>) {
    const cur = read()
    cached = {
      ...cur,
      schedules: cur.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }
    persist()
    emit()
  },
  assignEmployee(employeeId: string, scheduleId: string) {
    const cur = read()
    cached = { ...cur, assignments: { ...cur.assignments, [employeeId]: scheduleId } }
    persist()
    emit()
  },
  /** Manual (no-rule) schedule create/edit - sets `scheduleId` as the real
   *  override for exactly `employeeIds`, dropping anyone previously pointed
   *  at this schedule who's no longer checked (a plain re-check, not a
   *  merge - unlike `assignEmployee`, which only ever adds one). */
  setManualMembers(scheduleId: string, employeeIds: Array<string>) {
    const cur = read()
    const keep = new Set(employeeIds)
    const assignments = { ...cur.assignments }
    for (const [employeeId, assignedTo] of Object.entries(assignments)) {
      if (assignedTo === scheduleId && !keep.has(employeeId)) delete assignments[employeeId]
    }
    for (const employeeId of employeeIds) assignments[employeeId] = scheduleId
    cached = { ...cur, assignments }
    persist()
    emit()
  },
}
