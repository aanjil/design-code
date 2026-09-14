import { useMemo, useState } from 'react'
import { ArrowCounterClockwise, Play, X } from '@phosphor-icons/react'
import { CATALOG_SCREEN_IDS, EXPLORER_CATALOG, SCENARIOS } from './catalog'
import { ScreenFrame } from './app'
import { LiveApp } from './live-app'
import { liveStore } from './live-store'
import type {
  CanvasGroupDef,
  CanvasWindowDef,
} from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import {
  EXPLORER_PANEL_RESERVED_RIGHT,
  ExplorerPanel,
  ExplorerProvider,
  useExplorer,
} from '@/components/playground/explorer'
import { Button } from '@/components/ui/button'

/**
 * Multi-payroll frequencies - flow & state explorer.
 * "App" is one real, live-interactive instance of the whole feature
 * (its own group, pinned first, Play button on canvas + panel) backed by
 * a persisted store (live-store.ts) - separate from the deterministic
 * A-H catalog below it, which stays a frozen-state review matrix. Every
 * A-H flow is a Figma-style group container, one frame per screen (drag
 * the group label to move the whole flow). Clicking a screen in the
 * explorer panel focuses its frame; selecting a state drives that frame
 * to it, and focusing any catalog frame directly on canvas syncs back to
 * the Flows selection too. `reservedRight` keeps the canvas centered in
 * the gap left of the panel; the canvas background also supports
 * click-drag panning (Hand tool).
 */

const FRAME_W = 1512
const FRAME_H = 910
const FRAME_GAP = 96
const MARGIN_X = 200
const MARGIN_Y = 220
const GROUP_GAP = 380
const APP_ID = 'app'

function buildCanvas(onPlayApp: () => void) {
  const windows: Array<CanvasWindowDef> = [
    {
      id: APP_ID,
      title: 'App - live preview',
      url: 'nexus.niural.com/payments/payroll-schedule',
      x: MARGIN_X,
      y: MARGIN_Y,
      width: FRAME_W,
      height: FRAME_H,
      content: <LiveApp />,
    },
  ]
  const groups: Array<CanvasGroupDef> = [
    { id: APP_ID, label: 'App', windowIds: [APP_ID], onPlay: onPlayApp },
  ]
  let y = MARGIN_Y + FRAME_H + GROUP_GAP
  let maxRight = MARGIN_X + FRAME_W

  for (const group of SCENARIOS) {
    let x = MARGIN_X
    const windowIds: Array<string> = []
    for (const screen of group.screens) {
      windows.push({
        id: screen.id,
        title: screen.label,
        url: `nexus.niural.com/payments/payroll-schedule#${screen.id.toLowerCase()}`,
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

function MultiPayrollCanvas() {
  const explorer = useExplorer()
  const { screenId, focusNonce } = explorer
  const [presentApp, setPresentApp] = useState<{ id: string; nonce: number } | null>(null)
  const [exitRequest, setExitRequest] = useState<{ nonce: number } | null>(null)
  const [appPresenting, setAppPresenting] = useState(false)

  const playApp = () => setPresentApp((prev) => ({ id: APP_ID, nonce: (prev?.nonce ?? 0) + 1 }))
  const exitApp = () => setExitRequest((prev) => ({ nonce: (prev?.nonce ?? 0) + 1 }))
  const canvas = useMemo(() => buildCanvas(playApp), [])

  return (
    <CanvasCraft
      slug="multi-payroll"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.04}
      focusWindow={{ id: screenId, nonce: focusNonce }}
      requestFullscreen={presentApp}
      exitFullscreenRequest={exitRequest}
      onFullscreenChange={setAppPresenting}
      onFocusChange={(id) => {
        // keep the Flows selection in sync with whatever catalog frame
        // gets clicked directly on canvas (the App window has no catalog
        // entry, so focusing it is a no-op here by design)
        if (CATALOG_SCREEN_IDS.has(id)) explorer.show(id)
      }}
      reservedRight={EXPLORER_PANEL_RESERVED_RIGHT}
      overlays={
        <ExplorerPanel
          extraActions={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reset app data"
                title="Reset app data - clears the live App back to empty"
                onClick={() => liveStore.reset()}
              >
                <ArrowCounterClockwise className="size-3.5" />
              </Button>
              {appPresenting && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Exit App preview"
                  title="Exit fullscreen preview"
                  onClick={exitApp}
                >
                  <X className="size-3.5" />
                </Button>
              )}
              <Button size="sm" onClick={playApp}>
                <Play weight="fill" />
                <span className="px-1">Play</span>
              </Button>
            </div>
          }
        />
      }
    />
  )
}

export function MultiPayroll() {
  return (
    <ExplorerProvider catalog={EXPLORER_CATALOG} storageKey="multi-payroll">
      <MultiPayrollCanvas />
    </ExplorerProvider>
  )
}
