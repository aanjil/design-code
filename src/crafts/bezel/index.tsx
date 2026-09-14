import { useMemo, useState } from 'react'
import { Play, X } from '@phosphor-icons/react'
import type { CanvasGroupDef, CanvasWindowDef } from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import {
  EXPLORER_PANEL_RESERVED_RIGHT,
  ExplorerPanel,
  ExplorerProvider,
  useExplorer,
} from '@/components/playground/explorer'
import { Button } from '@/components/ui/button'
import { BEZEL_STATES, CATALOG_SCREEN_IDS, EXPLORER_CATALOG } from './catalog'
import { LiveApp, ScreenFrame } from './app'

/**
 * Same shape as multi-payroll/schedule-report: one real, live-interactive
 * "App" window pinned first, a Play button to present it fullscreen; below
 * it a frozen catalog matrix - one window per bezel state instead of per
 * screen, since every state here is the same Employees page.
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
      title: 'Employees - live preview',
      url: 'nexus.niural.com/people/employees',
      x: MARGIN_X,
      y: MARGIN_Y,
      width: FRAME_W,
      height: FRAME_H,
      content: <LiveApp />,
    },
  ]
  const groups: Array<CanvasGroupDef> = [{ id: APP_ID, label: 'App', windowIds: [APP_ID], onPlay: onPlayApp }]

  let x = MARGIN_X
  const y = MARGIN_Y + FRAME_H + GROUP_GAP
  const windowIds: Array<string> = []
  for (const state of BEZEL_STATES) {
    windows.push({
      id: state.id,
      title: state.label,
      url: `nexus.niural.com/people/employees#${state.id}`,
      x,
      y,
      width: FRAME_W,
      height: FRAME_H,
      content: <ScreenFrame stateId={state.id} />,
    })
    windowIds.push(state.id)
    x += FRAME_W + FRAME_GAP
  }
  groups.push({ id: 'states', label: 'Employees + bezel', windowIds })

  return { windows, groups, surfaceW: x - FRAME_GAP + MARGIN_X, surfaceH: y + FRAME_H + MARGIN_Y }
}

function BezelCanvas() {
  const explorer = useExplorer()
  const { screenId, stateId, focusNonce } = explorer
  const [presentApp, setPresentApp] = useState<{ id: string; nonce: number } | null>(null)
  const [exitRequest, setExitRequest] = useState<{ nonce: number } | null>(null)
  const [appPresenting, setAppPresenting] = useState(false)

  const playApp = () => setPresentApp((prev) => ({ id: APP_ID, nonce: (prev?.nonce ?? 0) + 1 }))
  const exitApp = () => setExitRequest((prev) => ({ nonce: (prev?.nonce ?? 0) + 1 }))
  const canvas = useMemo(() => buildCanvas(playApp), [])

  const focusId = CATALOG_SCREEN_IDS.has(screenId) ? stateId : screenId

  return (
    <CanvasCraft
      slug="bezel"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.04}
      focusWindow={{ id: focusId, nonce: focusNonce }}
      requestFullscreen={presentApp}
      exitFullscreenRequest={exitRequest}
      onFullscreenChange={setAppPresenting}
      onFocusChange={(id) => {
        if (id === APP_ID) return
        explorer.show(screenId, id)
      }}
      reservedRight={EXPLORER_PANEL_RESERVED_RIGHT}
      overlays={
        <ExplorerPanel
          extraActions={
            <div className="flex items-center gap-1">
              {appPresenting && (
                <Button variant="ghost" size="icon-sm" aria-label="Exit App preview" title="Exit fullscreen preview" onClick={exitApp}>
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

export function Bezel() {
  return (
    <ExplorerProvider catalog={EXPLORER_CATALOG} storageKey="bezel">
      <BezelCanvas />
    </ExplorerProvider>
  )
}
