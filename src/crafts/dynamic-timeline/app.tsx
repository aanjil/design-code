import { useMemo } from 'react'
import { useExplorer } from '@/components/playground/explorer'
import { DynamicTimeline } from './timeline'
import type { DynamicTimelineView } from './catalog'
import { makeView } from './catalog'

/**
 * One frame per catalog state (mirrors emma-intake/multi-payroll's app.tsx).
 * The selected screen renders its selected state; every other frame shows
 * its first state. Each frame stays a real <DynamicTimeline> seeded from the
 * state's draft, so a frozen snapshot is still clickable, not a picture of one.
 */

function Screen({ view }: { view: DynamicTimelineView }) {
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background-highlight/30 p-8">
      <DynamicTimeline initialDraft={view.draft} initialApproved={view.approved} />
    </div>
  )
}

export function renderWithChrome(view: DynamicTimelineView, remountKey: string): React.ReactNode {
  return <Screen key={remountKey} view={view} />
}

export function ScreenFrame({ screenId }: { screenId: string }) {
  const { screenId: selectedId, stateId } = useExplorer()
  // '' falls back to the screen's first state inside makeView
  const stateKey = selectedId === screenId ? stateId : ''

  return useMemo(
    () => renderWithChrome(makeView(screenId, stateKey), `${screenId}:${stateKey}`),
    [screenId, stateKey],
  )
}
