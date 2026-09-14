import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type { IntakeFlowConfig } from '@/mocks/emma-intake'
import { CONTRACT_FLOW, EXPENSE_FLOW } from '@/mocks/emma-intake'

/**
 * Scenario catalog - single source of truth for the design checklist (left
 * panel), the states rail, and the frozen preview frames on canvas. Mirrors
 * schedule-report/multi-payroll's catalog.ts. Every state is reproducible:
 * `make()` returns a plain view descriptor, `app.tsx` renders it.
 */

export type IntakeView =
  | { kind: 'entry'; flow: IntakeFlowConfig; captured: boolean }
  | { kind: 'xray'; flow: IntakeFlowConfig }
  | { kind: 'staging'; flow: IntakeFlowConfig; scenarioId: string }
  | { kind: 'confirmed'; flow: IntakeFlowConfig }

interface StateDef {
  id: string
  label: string
  make: () => IntakeView
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

function flowScreens(flow: IntakeFlowConfig, prefix: string): Array<ScreenDef> {
  return [
    {
      id: `${prefix}-entry`,
      label: 'Entry point',
      states: [
        { id: 'idle', label: 'Idle', make: () => ({ kind: 'entry', flow, captured: false }) },
        {
          id: 'captured',
          label: 'File captured',
          make: () => ({ kind: 'entry', flow, captured: true }),
        },
      ],
    },
    {
      id: `${prefix}-xray`,
      label: 'X-ray processing',
      states: [
        { id: 'processing', label: 'Processing', make: () => ({ kind: 'xray', flow }) },
      ],
    },
    {
      id: `${prefix}-staging`,
      label: 'Staging review',
      states: flow.scenarios.map((scenario) => ({
        id: scenario.id,
        label: scenario.label,
        make: (): IntakeView => ({ kind: 'staging', flow, scenarioId: scenario.id }),
      })),
    },
    {
      id: `${prefix}-confirmed`,
      label: 'Confirmed',
      states: [{ id: 'success', label: 'Created', make: () => ({ kind: 'confirmed', flow }) }],
    },
  ]
}

export const EXPLORER_CATALOG: Array<GroupDef> = [
  { group: 'Contract Intelligence', screens: flowScreens(CONTRACT_FLOW, 'contract') },
  { group: 'Expense', screens: flowScreens(EXPENSE_FLOW, 'expense') },
]

/** Satisfies ExplorerProvider's catalog prop type (states carry no `scope` here). */
export const EXPLORER_CATALOG_DEF: Array<ExplorerGroupDef> = EXPLORER_CATALOG.map((g) => ({
  group: g.group,
  screens: g.screens.map((s) => ({
    id: s.id,
    label: s.label,
    states: s.states.map((st) => ({ id: st.id, label: st.label })),
  })),
}))

export const CATALOG_SCREEN_IDS = new Set(
  EXPLORER_CATALOG.flatMap((g) => g.screens.map((s) => s.id)),
)

export function makeView(screenId: string, stateId: string): IntakeView {
  for (const group of EXPLORER_CATALOG) {
    const screen = group.screens.find((s) => s.id === screenId)
    if (!screen) continue
    const state = screen.states.find((s) => s.id === stateId) ?? screen.states[0]
    return state.make()
  }
  throw new Error(`Unknown Emma Intake screen "${screenId}"`)
}
