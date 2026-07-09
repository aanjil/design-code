import { useState } from 'react'
import { AnnotationsProvider } from './annotations'
import { FloatingDock } from './floating-dock'
import type { CanvasWindowDef } from './canvas'
import { PlaygroundCanvas } from './canvas'

/**
 * Full-viewport canvas experiment: the canvas takes all available space,
 * chrome lives in the FloatingDock (hidden while a window is presented
 * fullscreen). Pair with `staticData: { layout: 'canvas' }` on the route
 * so the root shell hides the top nav.
 */
export function CanvasExperiment({
  slug,
  windows,
}: {
  slug: string
  windows: Array<CanvasWindowDef>
}) {
  const [presenting, setPresenting] = useState(false)

  return (
    <AnnotationsProvider>
      <div className="relative h-full min-h-0">
        <PlaygroundCanvas
          windows={windows}
          className="h-full"
          onFullscreenChange={setPresenting}
        />
        {!presenting && <FloatingDock slug={slug} />}
      </div>
    </AnnotationsProvider>
  )
}
