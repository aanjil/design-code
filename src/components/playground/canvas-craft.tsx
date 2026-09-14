import { createContext, useContext, useState } from 'react'
import { Mesurer } from 'mesurer'
import { AnnotationsProvider } from './annotations'
import { CanvasPinsProvider } from './canvas-pins-context'
import { FloatingDock } from './floating-dock'
import type { CanvasGroupDef, CanvasWindowDef } from './canvas'
import { PlaygroundCanvas } from './canvas'
import 'mesurer/styles.css'

/**
 * Whether the canvas is in "zen mode" (Space key) - the explorer panel
 * reads this to also collapse, matching the canvas chrome it hides.
 */
const ZenModeContext = createContext(false)
export function useZenMode(): boolean {
  return useContext(ZenModeContext)
}

/**
 * Full-viewport canvas craft: the canvas takes all available space,
 * chrome lives in the FloatingDock (hidden while a window is presented
 * fullscreen). Pair with `staticData: { layout: 'canvas' }` on the route
 * so the root shell hides the top nav.
 */
export function CanvasCraft({
  slug,
  windows,
  overlays,
  groups,
  focusWindow,
  requestFullscreen,
  exitFullscreenRequest,
  onFocusChange,
  onFullscreenChange,
  surfaceW,
  surfaceH,
  minZoom,
  reservedLeft,
  reservedRight,
}: {
  slug: string
  windows: Array<CanvasWindowDef>
  /**
   * Extra floating chrome (e.g. the explorer panel). Stays visible while
   * presenting so states can drive a fullscreen preview.
   */
  overlays?: React.ReactNode
  /** Figma-style labeled group containers (see PlaygroundCanvas). */
  groups?: Array<CanvasGroupDef>
  focusWindow?: { id: string; nonce: number } | null
  /** Imperative "present this window fullscreen" request (e.g. a Play button). */
  requestFullscreen?: { id: string; nonce: number } | null
  /** Imperative "exit whatever is presenting fullscreen" request (e.g. an Exit button). */
  exitFullscreenRequest?: { nonce: number } | null
  /** Fires whenever a window is focused directly on the canvas. */
  onFocusChange?: (id: string) => void
  /** Fires whenever a window starts/stops presenting fullscreen. */
  onFullscreenChange?: (active: boolean) => void
  surfaceW?: number
  surfaceH?: number
  minZoom?: number
  /** Keep this much fixed-chrome space clear when centering/fitting. */
  reservedLeft?: number
  reservedRight?: number
}) {
  const [presenting, setPresenting] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [showRulers, setShowRulers] = useState(true)

  return (
    <AnnotationsProvider>
      <CanvasPinsProvider storageKey={slug}>
        <ZenModeContext.Provider value={zenMode}>
          <div className="relative h-full min-h-0">
            <PlaygroundCanvas
              windows={windows}
              className="h-full"
              onFullscreenChange={(active) => {
                setPresenting(active)
                onFullscreenChange?.(active)
              }}
              groups={groups}
              focusWindow={focusWindow}
              requestFullscreen={requestFullscreen}
              exitFullscreenRequest={exitFullscreenRequest}
              onFocusChange={onFocusChange}
              onZenModeChange={setZenMode}
              showRulers={showRulers}
              surfaceW={surfaceW}
              surfaceH={surfaceH}
              minZoom={minZoom}
              reservedLeft={reservedLeft}
              reservedRight={reservedRight}
            />
            {overlays}
            {!presenting && (
              <FloatingDock slug={slug} showRulers={showRulers} onToggleRulers={setShowRulers} />
            )}
            {!presenting && <Mesurer persistOnReload={false} />}
          </div>
        </ZenModeContext.Provider>
      </CanvasPinsProvider>
    </AnnotationsProvider>
  )
}
