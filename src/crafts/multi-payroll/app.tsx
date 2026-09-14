import { useMemo } from 'react'
import { makeView } from './catalog'
import type { AppView } from './types'
import { DashboardScreen } from './screens/dashboard'
import { WizardScreen } from './screens/wizard'
import { ScheduleDetailScreen } from './screens/schedule-detail'
import { RunsScreen } from './screens/runs'
import { HireScreen } from './screens/hire'
import { useExplorer } from '@/components/playground/explorer'
import { AppBar } from '@/components/nds/app-bar'
import { PAYMENTS_SIDEBAR, Sidebar } from '@/components/nds/sidebar'
import { AppShell, MainLayout, PageLayout } from '@/components/nds/layouts'

/**
 * One frame per catalog screen. The selected screen renders its selected
 * state; every other frame shows its first state. Form screens (wizard,
 * hire) render full-page - no AppBar/Sidebar; app screens keep the
 * Payments shell. Memoized so a state click only re-renders one frame.
 */

export function Screen({ view }: { view: AppView }) {
  switch (view.kind) {
    case 'dashboard':
      return <DashboardScreen view={view.dashboard} />
    case 'wizard':
      return <WizardScreen view={view.wizard} />
    case 'scheduleDetail':
      return <ScheduleDetailScreen view={view.scheduleDetail} />
    case 'runs':
      return <RunsScreen view={view.runs} />
    case 'hire':
      return <HireScreen view={view.hire} />
  }
}

/**
 * The shared chrome wrapper: form screens (wizard/hire) render full-page,
 * everything else gets the Payments AppBar/Sidebar shell. `remountKey`
 * forces a fresh mount (so screen-local state resets) whenever the
 * catalog frames switch state OR the Live App navigates.
 */
export function renderWithChrome(
  view: AppView,
  remountKey: string,
  /** Live App only - lets the sidebar drive real navigation (Payroll <-> Payroll Schedule). */
  onSidebarNavigate?: (label: string) => void,
  /** Wires the AppBar's "Ask Emma" button to something real - the AI
   *  copilot panel. Available any time the dashboard is showing (not just
   *  the zero-schedules first-run moment) so the trigger stays discoverable;
   *  the panel itself hides the bulk "Create all" action once schedules
   *  already exist (see CopilotPanel's canBulkCreate). */
  onAskEmma?: () => void,
  /** Master App only - wires the AppBar's top-level pills to real
   *  cross-section navigation instead of just the local highlight. */
  onAppBarNavClick?: (label: string) => void,
): React.ReactNode {
  // Move (D2-D4) is a spacious full-page step now, not a cramped modal over
  // the schedule page (PRD round 2) - same chrome-free treatment as the
  // wizard/hire forms while it's active.
  const isForm =
    view.kind === 'wizard' || view.kind === 'hire' || (view.kind === 'scheduleDetail' && !!view.scheduleDetail.move)
  if (isForm) {
    return (
      <div key={remountKey} className="h-full min-h-0">
        <Screen view={view} />
      </div>
    )
  }
  const askEmmaEnabled = view.kind === 'dashboard'
  return (
    <div key={remountKey} className="h-full min-h-0">
      <AppShell>
        <AppBar
          activeItem="Payments"
          onAiClick={askEmmaEnabled ? onAskEmma : undefined}
          onNavItemClick={onAppBarNavClick}
        />
        <MainLayout>
          <Sidebar
            title="Payments"
            groups={PAYMENTS_SIDEBAR}
            activeItem={view.kind === 'runs' ? 'Payroll' : 'Payroll Schedule'}
            onNavigate={onSidebarNavigate}
          />
          <PageLayout>
            <Screen view={view} />
          </PageLayout>
        </MainLayout>
      </AppShell>
    </div>
  )
}

export function ScreenFrame({ screenId }: { screenId: string }) {
  const { screenId: selectedId, stateId, show } = useExplorer()
  // '' falls back to the screen's first state inside makeView
  const stateKey = selectedId === screenId ? stateId : ''

  return useMemo(
    () =>
      renderWithChrome(makeView(screenId, stateKey), stateKey, undefined, () =>
        // catalog mode navigates by screenId+stateId (payload is Live-App-only) -
        // land directly on the dedicated review state for this moment.
        show('C1', 'copilot-thinking'),
      ),
    [screenId, stateKey, show],
  )
}
