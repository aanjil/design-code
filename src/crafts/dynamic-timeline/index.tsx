import { useMemo } from 'react'
import type { CanvasGroupDef, CanvasWindowDef } from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import {
  EXPLORER_PANEL_RESERVED_RIGHT,
  ExplorerPanel,
  ExplorerProvider,
  useExplorer,
} from '@/components/playground/explorer'
import { CATALOG_SCREEN_IDS, EXPLORER_CATALOG, EXPLORER_CATALOG_DEF } from './catalog'
import { ScreenFrame } from './app'
import { DynamicTimeline } from './timeline'
import { EMPTY_DRAFT } from './types'

/**
 * One real, live-interactive "App" window (the Run Payroll experience,
 * seeded blank) pinned first on the canvas; below it, one frame per catalog
 * screen showing whichever state is currently selected in the Explorer
 * panel - same shape as emma-intake/multi-payroll.
 */

const FRAME_W = 900
const FRAME_H = 900
const FRAME_GAP = 96
const MARGIN_X = 200
const MARGIN_Y = 220
const GROUP_GAP = 380

function buildCanvas() {
  const windows: Array<CanvasWindowDef> = []
  const groups: Array<CanvasGroupDef> = []

  windows.push({
    id: 'run-payroll-app',
    title: 'Run Payroll - App',
    url: 'app.niural.com/payroll/run#dynamic-timeline',
    x: MARGIN_X,
    y: MARGIN_Y,
    width: FRAME_W,
    height: FRAME_H,
    content: (
      <div className="h-full min-h-0 overflow-y-auto bg-background-highlight/30 p-8">
        <DynamicTimeline initialDraft={EMPTY_DRAFT} />
      </div>
    ),
  })
  groups.push({ id: 'run-payroll-app', label: 'Run Payroll - App', windowIds: ['run-payroll-app'] })

  let y = MARGIN_Y + FRAME_H + GROUP_GAP
  let maxRight = MARGIN_X + FRAME_W
  for (const group of EXPLORER_CATALOG) {
    let gx = MARGIN_X
    const windowIds: Array<string> = []
    for (const screen of group.screens) {
      windows.push({
        id: screen.id,
        title: screen.label,
        url: `app.niural.com/payroll/run#${screen.id}`,
        x: gx,
        y,
        width: FRAME_W,
        height: FRAME_H,
        content: <ScreenFrame screenId={screen.id} />,
      })
      windowIds.push(screen.id)
      gx += FRAME_W + FRAME_GAP
    }
    maxRight = Math.max(maxRight, gx - FRAME_GAP)
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

function DynamicTimelineCanvas() {
  const explorer = useExplorer()
  const canvas = useMemo(() => buildCanvas(), [])

  return (
    <CanvasCraft
      slug="dynamic-timeline"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.08}
      focusWindow={{ id: explorer.screenId, nonce: explorer.focusNonce }}
      onFocusChange={(id) => {
        if (CATALOG_SCREEN_IDS.has(id)) explorer.show(id)
      }}
      reservedRight={EXPLORER_PANEL_RESERVED_RIGHT}
      overlays={<ExplorerPanel />}
    />
  )
}

export function DynamicTimelineCraft() {
  return (
    <ExplorerProvider catalog={EXPLORER_CATALOG_DEF} storageKey="dynamic-timeline">
      <DynamicTimelineCanvas />
    </ExplorerProvider>
  )
}
