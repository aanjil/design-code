import { useMemo } from 'react'
import type { AppView } from './types'
import { makeView } from './catalog'
import { preset } from './engine'
import { TokensScreen } from './screens/tokens'
import { CreditScreen } from './screens/credit'
import { UsageScreen } from './screens/usage'
import { PaymentMethodsScreen } from './screens/payment-methods'
import { WalletScreen } from './screens/wallet'
import { BuyScreen } from './screens/buy'
import { DecisionsNeededScreen } from './screens/decisions-needed'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Every tokens-billing screen already renders its own full AppBar/Sidebar
 * shell (via SettingsShell) - this is just the state -> screen switch,
 * same shape as split-pay/multi-payroll's app.tsx.
 */

/** Payment methods and the wallet pointer page don't carry their own
 *  balances in AppView (they're not balance-driven screens) - the navbar
 *  pill still needs numbers, so they read the same healthy defaults the
 *  Live App starts from. */
const HEALTHY_BALANCES = preset('healthy')

export function Screen({ view }: { view: AppView }) {
  switch (view.kind) {
    case 'tokens':
      return <TokensScreen view={view.tokens} />
    case 'credit':
      return <CreditScreen view={view.credit} />
    case 'usage':
      return <UsageScreen view={view.usage} />
    case 'paymentMethods':
      return <PaymentMethodsScreen view={view.paymentMethods} balances={HEALTHY_BALANCES} />
    case 'wallet':
      return <WalletScreen balances={HEALTHY_BALANCES} />
    case 'buy':
      return <BuyScreen view={view.buy} />
    case 'decisionsNeeded':
      return <DecisionsNeededScreen />
  }
}

export function renderWithChrome(view: AppView, remountKey: string): React.ReactNode {
  return (
    <div key={remountKey} className="size-full">
      <Screen view={view} />
    </div>
  )
}

export function ScreenFrame({ screenId }: { screenId: string }) {
  const { screenId: selectedId, stateId } = useExplorer()
  const stateKey = selectedId === screenId ? stateId : ''

  return useMemo(() => renderWithChrome(makeView(screenId, stateKey), stateKey), [screenId, stateKey])
}
