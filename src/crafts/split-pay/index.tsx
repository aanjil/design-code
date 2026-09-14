import { useMemo } from 'react'
import { EXPLORER_CATALOG, SCENARIOS } from './catalog'
import { ScreenFrame } from './app'
import type { CanvasGroupDef, CanvasWindowDef } from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import {
  EXPLORER_PANEL_RESERVED_RIGHT,
  ExplorerPanel,
  ExplorerProvider,
  useExplorer,
} from '@/components/playground/explorer'

/**
 * Split pay via Transak - flow & state explorer (UK EOR, USDC, one
 * wallet, POC). One Figma-style group per design-doc section (A wallet
 * card, B KYC, C FCA, D config, E guardrails + receipt, F emails,
 * G ops), one frame per screen. Same canvas kit as multi-payroll /
 * schedule-report.
 */

const FRAME_W = 1512
const FRAME_H = 910
const FRAME_GAP = 96
const MARGIN_X = 200
const MARGIN_Y = 220
const GROUP_GAP = 380

function buildCanvas() {
  const windows: Array<CanvasWindowDef> = []
  const groups: Array<CanvasGroupDef> = []
  let y = MARGIN_Y
  let maxRight = MARGIN_X

  for (const group of SCENARIOS) {
    let x = MARGIN_X
    const windowIds: Array<string> = []
    for (const screen of group.screens) {
      windows.push({
        id: screen.id,
        title: screen.label,
        url: `nexus.niural.com/payments/methods#${screen.id.toLowerCase()}`,
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

function SplitPayCanvas() {
  const explorer = useExplorer()
  const { screenId, focusNonce } = explorer
  const canvas = useMemo(() => buildCanvas(), [])

  return (
    <CanvasCraft
      slug="split-pay"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.04}
      focusWindow={{ id: screenId, nonce: focusNonce }}
      onFocusChange={(id) => explorer.show(id)}
      reservedRight={EXPLORER_PANEL_RESERVED_RIGHT}
      overlays={<ExplorerPanel />}
    />
  )
}

export function SplitPay() {
  return (
    <ExplorerProvider catalog={EXPLORER_CATALOG} storageKey="split-pay">
      <SplitPayCanvas />
    </ExplorerProvider>
  )
}
