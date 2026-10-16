import { useSyncExternalStore } from 'react'
import type { BezelEdge, BezelMode } from './floating-bezel'
import type { BarHome } from './placement-menu'

/**
 * Bezel director - lets prototype tooling (the Master App mock dock) put the
 * one Bezel into any mode or situation on demand, the way bezel_7.html's
 * control bar did. The live Bezel (MasterBezelLayout) registers its controls
 * and publishes what it's doing; the dock reads that and calls back. A tiny
 * external store because the two render in different trees.
 */

export interface BezelDirectorState {
  /** false until a Bezel has mounted (and when the section has none). */
  available: boolean
  section: string
  mode: BezelMode
  docked: boolean
  home: BarHome
  edge: BezelEdge
  /** Cross-section items still pinned in the thread. */
  pinsWaiting: number
  pinsDismissed: number
  /** Rows the page (or a demo) currently has selected. */
  selected: number
  agentRunning: boolean
  /** The page opens on a finding (script.attention). */
  attention: boolean
}

export interface BezelDirectorApi {
  /** Force a mode, setting up whatever it needs (a demo selection for
   *  bulk/context, a sample decision for acting, the column for copilot). */
  setMode: (mode: BezelMode) => void
  place: (next: { docked?: boolean; home?: BarHome; edge?: BezelEdge }) => void
  /** Voice -> Emma drives the run (agent cursor). */
  startAgent: () => void
  stopAgent: () => void
  restorePins: () => void
  /** Back to what this page itself would say. */
  reset: () => void
}

const OFF: BezelDirectorState = {
  available: false,
  section: '',
  mode: 'quiet',
  docked: false,
  home: 'dock',
  edge: 'bottom',
  pinsWaiting: 0,
  pinsDismissed: 0,
  selected: 0,
  agentRunning: false,
  attention: false,
}

let state: BezelDirectorState = OFF
let api: BezelDirectorApi | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const bezelDirector = {
  register(next: BezelDirectorApi) {
    api = next
    return () => {
      if (api === next) {
        api = null
        state = OFF
        emit()
      }
    }
  },
  publish(next: Omit<BezelDirectorState, 'available'>) {
    const s = { ...next, available: true }
    // Cheap structural compare - publish runs on every Bezel render.
    if ((Object.keys(s) as Array<keyof BezelDirectorState>).every((k) => s[k] === state[k])) return
    state = s
    emit()
  },
  call<K extends keyof BezelDirectorApi>(k: K, ...args: Parameters<BezelDirectorApi[K]>) {
    const fn = api?.[k] as ((...a: Parameters<BezelDirectorApi[K]>) => void) | undefined
    fn?.(...args)
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  getSnapshot: () => state,
}

export function useBezelDirector(): BezelDirectorState {
  return useSyncExternalStore(bezelDirector.subscribe, bezelDirector.getSnapshot, bezelDirector.getSnapshot)
}
