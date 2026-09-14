import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type { BezelMode } from './floating-bezel'

/**
 * One screen (Employees), every bezel state - not a multi-screen catalog
 * like multi-payroll's, because every state here is the same page. Mirrors
 * bezel.html's own control-bar groups (BEZEL / SELECTION / COPILOT).
 */

export interface BezelStateDef {
  id: string
  label: string
  mode: BezelMode
  pins?: number
}

export const BEZEL_STATES: Array<BezelStateDef> = [
  { id: 'quiet', label: 'Quiet', mode: 'quiet' },
  { id: 'scanning', label: 'Scanning', mode: 'scanning' },
  { id: 'found', label: 'Found', mode: 'found' },
  { id: 'expanded', label: 'Expanded', mode: 'expanded' },
  { id: 'tension', label: 'Tension', mode: 'tension' },
  { id: 'acting', label: 'Acting · undo', mode: 'acting' },
  { id: 'run', label: 'Run in flight', mode: 'run' },
  { id: 'voice', label: 'Voice', mode: 'voice' },
  { id: 'bulk', label: 'Bulk action', mode: 'bulk' },
  { id: 'context', label: 'As context', mode: 'context' },
  { id: 'copilot', label: 'Copilot thread', mode: 'copilot' },
  { id: 'copilot-pin-1', label: 'Copilot · 1 pinned', mode: 'copilot', pins: 1 },
  { id: 'copilot-pin-2', label: 'Copilot · 2 pinned', mode: 'copilot', pins: 2 },
]

export const CATALOG_SCREEN_ID = 'employees-bezel'

export const EXPLORER_CATALOG: Array<ExplorerGroupDef> = [
  {
    group: 'Employees + bezel',
    screens: [
      {
        id: CATALOG_SCREEN_ID,
        label: 'Employees',
        states: BEZEL_STATES.map((s) => ({ id: s.id, label: s.label })),
      },
    ],
  },
]

export const CATALOG_SCREEN_IDS = new Set([CATALOG_SCREEN_ID])

export function bezelStateFor(stateId: string): BezelStateDef {
  return BEZEL_STATES.find((s) => s.id === stateId) ?? BEZEL_STATES[0]
}
