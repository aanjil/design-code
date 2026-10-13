import { PaymentFlowApp } from './app'
import { MockDock } from './mock-dock'
import { LiveEmployerConfig, StoreProvider, liveStore } from './store'
import type { Screen } from './types'

/**
 * Master App entry points. Both read the ONE persisted live store the
 * craft canvas's live App/Admin windows use - so funding a wallet here,
 * approving it on the canvas, or time-travelling from the dock shows up
 * everywhere at once (same tab via subscribe, other tabs via storage).
 */

export function LiveApp({
  screen = 'invoices',
  onNavItemClick,
  onSidebarNavigate,
  onWalletClick,
}: {
  screen?: Screen
  onNavItemClick?: (label: string) => void
  onSidebarNavigate?: (label: string) => void
  onWalletClick?: () => void
}) {
  return (
    <StoreProvider value={liveStore}>
      <LiveEmployerConfig>
        <PaymentFlowApp
          key={screen}
          initial={{ screen }}
          onNavItemClick={onNavItemClick}
          onSidebarNavigate={onSidebarNavigate}
          onWalletClick={onWalletClick}
        />
      </LiveEmployerConfig>
    </StoreProvider>
  )
}

/** The mock data dock, floating bottom-center over any Master App page. */
export function LiveMockDock({ leading }: { leading?: React.ReactNode }) {
  return (
    <StoreProvider value={liveStore}>
      <LiveEmployerConfig>
        <MockDock fixed leading={leading} />
      </LiveEmployerConfig>
    </StoreProvider>
  )
}
