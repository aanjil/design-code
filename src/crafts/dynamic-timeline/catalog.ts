import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type { DraftState } from './types'
import { EMPTY_DRAFT } from './types'

/**
 * Single source of truth for the design checklist, the states rail, and the
 * frozen preview frames on canvas - mirrors emma-intake/multi-payroll's
 * catalog.ts. Every state is just a different seed for <DynamicTimeline>;
 * the timeline itself stays live and clickable from whatever it's seeded
 * with, same as it would be in the real product.
 */

export interface DynamicTimelineView {
  draft: DraftState
  approved?: boolean
}

interface StateDef {
  id: string
  label: string
  make: () => DynamicTimelineView
}

interface ScreenDef {
  id: string
  label: string
  states: Array<StateDef>
}

interface GroupDef {
  group: string
  screens: Array<ScreenDef>
}

export const EXPLORER_CATALOG: Array<GroupDef> = [
  {
    group: 'Run payroll',
    screens: [
      {
        id: 'timeline',
        label: 'Dynamic timeline',
        states: [
          {
            id: 'all-open',
            label: 'Resolve - nothing decided yet',
            make: () => ({ draft: EMPTY_DRAFT }),
          },
          {
            id: 'one-resolved',
            label: 'Resolve - 1 of 3 resolved',
            make: () => ({ draft: { sam: null, maya: 'approve', exp: null } }),
          },
          {
            id: 'deferred-mix',
            label: 'Confirm - ready, one deferred',
            make: () => ({ draft: { sam: 'hold', maya: 'approve', exp: 'ask' } }),
          },
          {
            id: 'wallet-costs-buffer',
            label: 'Confirm - wallet routing costs the wire buffer',
            make: () => ({ draft: { sam: 'wallet', maya: 'cap', exp: 'reject' } }),
          },
          {
            id: 'halted',
            label: 'Confirm - run paused',
            make: () => ({ draft: { sam: 'delay', maya: 'approve', exp: 'reject' } }),
          },
          {
            id: 'complete',
            label: 'Complete',
            make: () => ({ draft: { sam: 'hold', maya: 'approve', exp: 'ask' }, approved: true }),
          },
        ],
      },
    ],
  },
]

export const EXPLORER_CATALOG_DEF: Array<ExplorerGroupDef> = EXPLORER_CATALOG.map((g) => ({
  group: g.group,
  screens: g.screens.map((s) => ({
    id: s.id,
    label: s.label,
    states: s.states.map((st) => ({ id: st.id, label: st.label })),
  })),
}))

export const CATALOG_SCREEN_IDS = new Set(EXPLORER_CATALOG.flatMap((g) => g.screens.map((s) => s.id)))

export function makeView(screenId: string, stateId: string): DynamicTimelineView {
  for (const group of EXPLORER_CATALOG) {
    const screen = group.screens.find((s) => s.id === screenId)
    if (!screen) continue
    const state = screen.states.find((s) => s.id === stateId) ?? screen.states[0]
    return state.make()
  }
  throw new Error(`Unknown Dynamic Timeline screen "${screenId}"`)
}
