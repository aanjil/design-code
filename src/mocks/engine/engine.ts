/**
 * Mock engine - the "world" behind a demo. Flows are small state machines
 * (one per kind of thing that matures: an invite, a funding request, a
 * payroll run); instances are the concrete records moving through them.
 * Time is VIRTUAL: a seeded clock you play, pause, speed up or jump to the
 * next scheduled transition, so the same demo replays identically every
 * reload - no Date.now(), no network, no randomness that isn't seeded.
 *
 * UI never reads the engine's internals directly; a craft projects the
 * snapshot onto its own mock rows (see `useEngine(select)` in ./react).
 */

/* ---------- durations ---------- */

/** Milliseconds, or a compact string: '30m', '4h', '2d', '1w', '1d12h'. */
export type Duration = number | string

const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
}

export function ms(d: Duration): number {
  if (typeof d === 'number') return d
  const parts = d.trim().match(/(\d+(?:\.\d+)?)\s*([smhdw])/g)
  if (!parts) throw new Error(`Bad duration: "${d}"`)
  return parts.reduce((sum, part) => {
    const [, n, unit] = part.match(/(\d+(?:\.\d+)?)\s*([smhdw])/)!
    return sum + Number(n) * UNIT_MS[unit]
  }, 0)
}

/** '2d 4h', '35m', 'now' - coarse, for "next: Onboarding in 2d 4h". */
export function fmtDuration(msValue: number): string {
  if (msValue <= 0) return 'now'
  const d = Math.floor(msValue / UNIT_MS.d)
  const h = Math.floor((msValue % UNIT_MS.d) / UNIT_MS.h)
  const m = Math.floor((msValue % UNIT_MS.h) / UNIT_MS.m)
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${Math.max(1, m)}m`
}

/* ---------- flow definitions ---------- */

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'error'

export interface StateDef<S extends string, E extends string> {
  label: string
  tone?: Tone
  /** Matures on its own: moves to `to` once `in` (± seeded `jitter`) has elapsed. */
  after?: { in: Duration; to: S; jitter?: Duration }
  /** Moves when someone acts: `send(instanceId, event)`. */
  on?: Partial<Record<E, S>>
}

export interface FlowDef<S extends string = string, E extends string = string> {
  id: string
  label: string
  initial: S
  states: Record<S, StateDef<S, E>>
  /** Human labels for events, shown on the Director's action buttons. */
  events?: Record<E, string>
}

/** Identity helper that keeps state/event names literal-typed. */
export function defineFlow<const S extends string, const E extends string = never>(
  def: FlowDef<S, E>,
): FlowDef<S, E> {
  return def
}

/* ---------- engine ---------- */

export interface InstanceSeed {
  id: string
  flow: string
  label?: string
  /** Defaults to the flow's `initial`. */
  state?: string
  /** How long it has already sat in `state` when the world starts - lets a
   *  demo open mid-maturity instead of everything starting at zero. */
  enteredAgo?: Duration
}

export interface Instance {
  id: string
  flowId: string
  label: string
  state: string
  enteredAt: number
  /** When its timed transition fires, or null if it only moves on events. */
  dueAt: number | null
  visits: number
}

export interface LogEntry {
  at: number
  instanceId: string
  from: string
  to: string
  cause: 'time' | 'event' | 'force'
  event?: string
}

export interface EngineSnapshot {
  startedAt: number
  now: number
  playing: boolean
  /** Virtual ms per real ms. */
  speed: number
  instances: Record<string, Instance>
  /** Newest last. */
  log: Array<LogEntry>
}

export interface EngineConfig {
  /** ISO timestamp the world opens at (UTC). */
  start: string
  seed?: number
  flows: Array<FlowDef<any, any>>
  instances: Array<InstanceSeed>
}

export interface MockEngine {
  get: () => EngineSnapshot
  subscribe: (fn: () => void) => () => void
  flow: (flowId: string) => FlowDef
  /** Advance virtual time, firing every transition that falls due, in order. */
  advance: (by: Duration) => void
  advanceTo: (t: number) => void
  /** Jump exactly to the next scheduled transition (and fire it). */
  next: () => void
  nextDueAt: () => number | null
  send: (instanceId: string, event: string) => boolean
  force: (instanceId: string, state: string) => void
  play: () => void
  pause: () => void
  setSpeed: (speed: number) => void
  reset: () => void
}

const LOG_LIMIT = 200
const MAX_STEPS = 10_000

/** mulberry32-style hash → [0, 1); same inputs, same jitter, every reload. */
function unitHash(seed: number, key: string): number {
  let h = seed ^ 0x9e3779b9
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 15), h | 1)
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61)
  return ((h ^ (h >>> 14)) >>> 0) / 4_294_967_296
}

export function createMockEngine(config: EngineConfig): MockEngine {
  const seed = config.seed ?? 1
  const startedAt = Date.parse(config.start)
  if (Number.isNaN(startedAt)) throw new Error(`Bad start: "${config.start}"`)
  const flows = new Map(config.flows.map((f) => [f.id, f as FlowDef]))

  function flowOf(id: string): FlowDef {
    const f = flows.get(id)
    if (!f) throw new Error(`Unknown flow "${id}"`)
    return f
  }

  function dueFor(inst: Omit<Instance, 'dueAt'>): number | null {
    const after = flowOf(inst.flowId).states[inst.state]?.after
    if (!after) return null
    const jitter = after.jitter ? ms(after.jitter) : 0
    const offset = jitter ? (unitHash(seed, `${inst.id}:${inst.state}:${inst.visits}`) * 2 - 1) * jitter : 0
    return inst.enteredAt + Math.max(0, ms(after.in) + offset)
  }

  function seedSnapshot(): EngineSnapshot {
    const instances: Record<string, Instance> = {}
    for (const s of config.instances) {
      const flow = flowOf(s.flow)
      const state = s.state ?? flow.initial
      if (!flow.states[state]) throw new Error(`Flow "${flow.id}" has no state "${state}"`)
      const base = {
        id: s.id,
        flowId: flow.id,
        label: s.label ?? s.id,
        state,
        enteredAt: startedAt - (s.enteredAgo ? ms(s.enteredAgo) : 0),
        visits: 0,
      }
      // Never let a seed be "overdue" at t0 - it would fire before anyone sees it.
      const due = dueFor(base)
      instances[s.id] = { ...base, dueAt: due === null ? null : Math.max(due, startedAt + UNIT_MS.m) }
    }
    return { startedAt, now: startedAt, playing: false, speed: 3_600, instances, log: [] }
  }

  let snap = seedSnapshot()
  const subs = new Set<() => void>()
  const emit = () => subs.forEach((fn) => fn())

  function enter(
    instances: Record<string, Instance>,
    log: Array<LogEntry>,
    inst: Instance,
    to: string,
    at: number,
    cause: LogEntry['cause'],
    event?: string,
  ) {
    const base = { ...inst, state: to, enteredAt: at, visits: inst.visits + 1 }
    instances[inst.id] = { ...base, dueAt: dueFor(base) }
    log.push({ at, instanceId: inst.id, from: inst.state, to, cause, event })
  }

  function earliestDue(instances: Record<string, Instance>): Instance | null {
    let best: Instance | null = null
    for (const inst of Object.values(instances)) {
      if (inst.dueAt === null) continue
      if (!best || inst.dueAt < best.dueAt! || (inst.dueAt === best.dueAt && inst.id < best.id)) best = inst
    }
    return best
  }

  function advanceTo(t: number) {
    if (t <= snap.now) return
    const instances = { ...snap.instances }
    const log = [...snap.log]
    for (let step = 0; step < MAX_STEPS; step++) {
      const due = earliestDue(instances)
      if (!due || due.dueAt! > t) break
      const to = flowOf(due.flowId).states[due.state].after!.to
      enter(instances, log, due, to, due.dueAt!, 'time')
    }
    snap = { ...snap, now: t, instances, log: log.slice(-LOG_LIMIT) }
    emit()
  }

  return {
    get: () => snap,
    subscribe(fn) {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    flow: flowOf,
    advance: (by) => advanceTo(snap.now + ms(by)),
    advanceTo,
    nextDueAt: () => earliestDue(snap.instances)?.dueAt ?? null,
    next() {
      const due = earliestDue(snap.instances)
      if (due) advanceTo(due.dueAt!)
    },
    send(instanceId, event) {
      const inst = snap.instances[instanceId]
      const to = inst && flowOf(inst.flowId).states[inst.state].on?.[event]
      if (!inst || !to) return false
      const instances = { ...snap.instances }
      const log = [...snap.log]
      enter(instances, log, inst, to, snap.now, 'event', event)
      snap = { ...snap, instances, log: log.slice(-LOG_LIMIT) }
      emit()
      return true
    },
    force(instanceId, state) {
      const inst = snap.instances[instanceId]
      if (!inst || inst.state === state || !flowOf(inst.flowId).states[state]) return
      const instances = { ...snap.instances }
      const log = [...snap.log]
      enter(instances, log, inst, state, snap.now, 'force')
      snap = { ...snap, instances, log: log.slice(-LOG_LIMIT) }
      emit()
    },
    play() {
      if (snap.playing) return
      snap = { ...snap, playing: true }
      emit()
    },
    pause() {
      if (!snap.playing) return
      snap = { ...snap, playing: false }
      emit()
    },
    setSpeed(speed) {
      snap = { ...snap, speed }
      emit()
    },
    reset() {
      const { speed } = snap
      snap = { ...seedSnapshot(), speed }
      emit()
    },
  }
}
