import type { EmmaReaction, EmmaState } from './sim'

/**
 * The ambient channel between the page and every Emma on it. The page (or
 * `<EmmaAmbient>`, which listens to the document for you) says what is
 * going on - a mood, something worth looking at, a one-shot reaction - and
 * each avatar reads it on its next frame. No React state: nothing re-renders.
 */

export type EmmaTarget = Element | { x: number; y: number } | null

export type EmmaMoodSource = 'hotspot' | 'typing' | 'selection' | 'idle' | 'app'

const PRIORITY: Record<EmmaMoodSource, number> = {
  app: 4,
  hotspot: 3,
  typing: 2,
  selection: 1,
  idle: 0,
}

interface Mood {
  state: EmmaState
  target: EmmaTarget
  /** point a cell at the target */
  point: boolean
}

export class EmmaBus {
  private moods = new Map<EmmaMoodSource, Mood>()
  private listeners = new Set<(r: EmmaReaction) => void>()
  /** bumped on every change, so readers can cache */
  version = 0

  /** The strongest mood right now, or null (the avatar's own state wins). */
  get mood(): Mood | null {
    let best: Mood | null = null
    let bestP = -1
    for (const [src, m] of this.moods) {
      if (PRIORITY[src] > bestP) {
        best = m
        bestP = PRIORITY[src]
      }
    }
    return best
  }

  /** Set (or clear, with null) a mood from one source. */
  setMood(source: EmmaMoodSource, state: EmmaState | null, target: EmmaTarget = null, point = false) {
    if (state == null) this.moods.delete(source)
    else this.moods.set(source, { state, target, point })
    this.version++
  }

  /** Look at something without a mood change (app-driven "show me"). */
  lookAt(target: EmmaTarget, point = true) {
    if (target == null) this.moods.delete('app')
    else this.moods.set('app', { state: 'idle', target, point })
    this.version++
  }

  /** Fire a one-shot reaction on every subscribed avatar. */
  react(r: EmmaReaction) {
    for (const l of this.listeners) l(r)
  }

  subscribe(l: (r: EmmaReaction) => void) {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }

  clear() {
    this.moods.clear()
    this.version++
  }
}

/** The page-wide default: `useEmma()` outside any provider talks to this one. */
export const globalEmmaBus = new EmmaBus()

// ─── shared pointer + ticker ─────────────────────────────────────────────────
// One pointer listener and one animation frame loop for every avatar on the
// page; the loop stops when nothing is subscribed and while the tab is hidden.

export const pointer = { x: -1e4, y: -1e4, at: -1e9, inside: false }

let pointerBound = false
function bindPointer() {
  if (pointerBound || typeof window === 'undefined') return
  pointerBound = true
  const move = (e: PointerEvent) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.at = performance.now()
    pointer.inside = true
  }
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerdown', move, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.inside = false
  })
}

type Tick = (dt: number, now: number) => void
const ticks = new Set<Tick>()
let raf = 0
let last = 0

function loop(now: number) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0)
  last = now
  for (const t of ticks) t(dt, now)
  raf = ticks.size ? requestAnimationFrame(loop) : 0
  if (!raf) last = 0
}

export function onTick(t: Tick) {
  bindPointer()
  ticks.add(t)
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    ticks.delete(t)
  }
}
