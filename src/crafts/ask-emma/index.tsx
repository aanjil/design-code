import { useMemo } from 'react'
import { HomeScreen } from './home'
import {
  ExpenseCreateScreen,
  ExpenseDropScreen,
  ExpenseExtractedScreen,
  ExpenseReadingScreen,
  ExpenseResolveScreen,
} from './flows/expense'
import {
  PayrollConfirmScreen,
  PayrollPrepareScreen,
  PayrollResolveScreen,
  PayrollWhichScreen,
} from './flows/payroll'
import { AskThreadScreen } from './flows/ask-thread'
import { NewChatScreen } from './chat/new-chat'
import { ChatThreadScreen } from './chat/thread'
import { CATALOG_SCREEN_IDS, EXPLORER_CATALOG } from './flows/catalog'
import type { CanvasGroupDef, CanvasWindowDef } from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import {
  EXPLORER_PANEL_RESERVED_RIGHT,
  ExplorerPanel,
  ExplorerProvider,
  useExplorer,
} from '@/components/playground/explorer'

/**
 * Ask Emma - the full craft. One canvas, one Explorer: the launcher
 * (Home), the payroll run and the expense run (both grain-flows_2.html
 * recreations, system-owned and top-down), and the Ask thread
 * (user-owned, bottom-up) - all rendered through <Grain>, nothing
 * bespoke. The chat page (new + with history/bubbles, two Figma refs
 * still pending authorization) is a separate later phase - see
 * registry.ts and docs/foundations/grain.md.
 */
const FRAME_W = 1512
const FRAME_H = 910
const FRAME_GAP = 96
const MARGIN_X = 200
const MARGIN_Y = 220
const GROUP_GAP = 320

function renderScreen(screenId: string, stateId: string): React.ReactNode {
  switch (screenId) {
    case 'home':
      return <HomeScreen empty={stateId === 'all-clear'} />
    case 'payroll-which':
      return <PayrollWhichScreen state={stateId as 'ask' | 'done'} />
    case 'payroll-prepare':
      return <PayrollPrepareScreen state={stateId as 'locked' | 'loading' | 'done'} />
    case 'payroll-resolve':
      return <PayrollResolveScreen resolvedCount={Number(stateId.slice(1)) as 0 | 1 | 2 | 3} />
    case 'payroll-confirm':
      return <PayrollConfirmScreen state={stateId as 'locked' | 'open' | 'done'} />
    case 'expense-drop':
      return <ExpenseDropScreen state={stateId as 'empty' | 'ready'} />
    case 'expense-reading':
      return <ExpenseReadingScreen />
    case 'expense-extracted':
      return <ExpenseExtractedScreen />
    case 'expense-resolve':
      return <ExpenseResolveScreen resolvedCount={Number(stateId.slice(1)) as 0 | 1 | 2} />
    case 'expense-create':
      return <ExpenseCreateScreen state={stateId as 'locked' | 'open' | 'done'} />
    case 'ask-thread':
      return <AskThreadScreen state={stateId as 'q1' | 'q2'} />
    case 'chat-new':
      return <NewChatScreen />
    case 'chat-thread':
      return <ChatThreadScreen state={stateId as 'reviewing' | 'followup'} />
    default:
      return null
  }
}

function ScreenFrame({ screenId }: { screenId: string }) {
  const { screenId: selectedId, stateId } = useExplorer()
  const group = EXPLORER_CATALOG.flatMap((g) => g.screens).find((s) => s.id === screenId)
  const activeState = selectedId === screenId ? stateId : ''
  const resolvedState = activeState || group?.states[0]?.id || ''
  return useMemo(() => renderScreen(screenId, resolvedState), [screenId, resolvedState])
}

function buildCanvas() {
  const windows: Array<CanvasWindowDef> = []
  const groups: Array<CanvasGroupDef> = []
  let y = MARGIN_Y
  let maxRight = MARGIN_X

  for (const group of EXPLORER_CATALOG) {
    let x = MARGIN_X
    const windowIds: Array<string> = []
    for (const screen of group.screens) {
      windows.push({
        id: screen.id,
        title: screen.label,
        url: `nexus.niural.com/emma#${screen.id}`,
        x,
        y,
        width: FRAME_W,
        height: FRAME_H,
        content: <ScreenFrame screenId={screen.id} />,
      })
      windowIds.push(screen.id)
      x += FRAME_W + FRAME_GAP
    }
    maxRight = Math.max(maxRight, x - FRAME_GAP)
    groups.push({ id: group.group, label: group.group, windowIds })
    y += FRAME_H + GROUP_GAP
  }

  return {
    windows,
    groups,
    surfaceW: maxRight + MARGIN_X,
    surfaceH: y - GROUP_GAP + MARGIN_Y,
  }
}

function AskEmmaCanvas() {
  const explorer = useExplorer()
  const { screenId, focusNonce } = explorer
  const canvas = useMemo(buildCanvas, [])

  return (
    <CanvasCraft
      slug="ask-emma"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.04}
      focusWindow={{ id: screenId, nonce: focusNonce }}
      onFocusChange={(id) => {
        if (CATALOG_SCREEN_IDS.has(id)) explorer.show(id)
      }}
      reservedRight={EXPLORER_PANEL_RESERVED_RIGHT}
      overlays={<ExplorerPanel />}
    />
  )
}

export function AskEmma() {
  return (
    <ExplorerProvider catalog={EXPLORER_CATALOG} storageKey="ask-emma">
      <AskEmmaCanvas />
    </ExplorerProvider>
  )
}
