import { useMemo } from 'react'
import { makeView } from './catalog'
import type { AppView, ScheduleConfig } from './types'
import { LandingScreen } from './screens/landing'
import { DetailScreen } from './screens/detail'
import { ListsScreen } from './screens/lists'
import { RecipientAccessScreen } from './screens/recipient-access'
import { useExplorer } from '@/components/playground/explorer'
import { AppBar } from '@/components/nds/app-bar'
import { AppShell, MainLayout, PageLayout } from '@/components/nds/layouts'

/**
 * One frame per catalog screen. The selected screen renders its selected
 * state; every other frame shows its first state. Mirrors multi-payroll's
 * app.tsx. Insights has no left sidebar (unlike Payments) - just the
 * AppBar + full-width page. Recipient-access screens (Fn 2.3) render with
 * no chrome at all - they're opened by a non-org recipient, outside Niural.
 */

export function Screen({
  view,
  onDraftChange,
}: {
  view: AppView
  /** Live App only - lets the config modal's fields actually edit the draft. */
  onDraftChange?: (patch: Partial<ScheduleConfig>) => void
}) {
  switch (view.kind) {
    case 'landing':
      return <LandingScreen view={view.landing} />
    case 'detail':
      return <DetailScreen view={view.detail} onDraftChange={onDraftChange} />
    case 'lists':
      return <ListsScreen view={view.lists} onDraftChange={onDraftChange} />
    case 'recipient-access':
      return <RecipientAccessScreen view={view.recipientAccess} />
  }
}

/**
 * The shared chrome wrapper: recipient-access renders full-page with no
 * chrome, everything else gets the Niural Insights AppBar shell.
 * `remountKey` forces a fresh mount (so screen-local state resets)
 * whenever the catalog frames switch state OR the Live App navigates.
 */
export function renderWithChrome(
  view: AppView,
  remountKey: string,
  onDraftChange?: (patch: Partial<ScheduleConfig>) => void,
  /** Master App only - wires the AppBar's top-level pills to real
   *  cross-section navigation instead of just the local highlight. */
  onAppBarNavClick?: (label: string) => void,
): React.ReactNode {
  if (view.kind === 'recipient-access') {
    return (
      <div key={remountKey} className="h-full min-h-0">
        <Screen view={view} />
      </div>
    )
  }
  return (
    <div key={remountKey} className="h-full min-h-0">
      <AppShell>
        <AppBar activeItem="Niural Insights" onNavItemClick={onAppBarNavClick} />
        <MainLayout>
          <PageLayout>
            <Screen view={view} onDraftChange={onDraftChange} />
          </PageLayout>
        </MainLayout>
      </AppShell>
    </div>
  )
}

export function ScreenFrame({ screenId }: { screenId: string }) {
  const { screenId: selectedId, stateId } = useExplorer()
  // '' falls back to the screen's first state inside makeView
  const stateKey = selectedId === screenId ? stateId : ''

  return useMemo(
    () => renderWithChrome(makeView(screenId, stateKey), stateKey),
    [screenId, stateKey],
  )
}
