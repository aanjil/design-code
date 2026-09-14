import { useMemo } from 'react'
import { makeView } from './catalog'
import type { AppView } from './types'
import { PaymentMethodsScreen } from './screens/payment-methods'
import { KycScreen } from './screens/kyc'
import { FcaScreen } from './screens/fca'
import { SplitConfigScreen } from './screens/split-config'
import { ReceiptScreen } from './screens/receipt'
import { EmailScreen } from './screens/email'
import { OpsScreen } from './screens/ops'
import { useExplorer } from '@/components/playground/explorer'
import { AppBar } from '@/components/nds/app-bar'
import { AppShell, MainLayout, PageLayout } from '@/components/nds/layouts'

/**
 * One frame per catalog screen. Chrome per surface: employee screens get
 * the employee AppBar; KYC/FCA/config flows render full-page (FlowShell
 * brings its own chrome); emails render as a mail-client mock (no app
 * chrome); ops gets the employer AppBar.
 */

export function Screen({ view }: { view: AppView }) {
  switch (view.kind) {
    case 'payment-methods':
      return <PaymentMethodsScreen view={view.pm} />
    case 'kyc':
      return <KycScreen view={view.kyc} />
    case 'fca':
      return <FcaScreen view={view.fca} />
    case 'split-config':
      return <SplitConfigScreen view={view.config} />
    case 'receipt':
      return <ReceiptScreen view={view.receipt} />
    case 'email':
      return <EmailScreen view={view.email} />
    case 'ops':
      return <OpsScreen view={view.ops} />
  }
}

export function renderWithChrome(view: AppView, remountKey: string): React.ReactNode {
  // full-page flows + emails: no app shell
  if (view.kind === 'kyc' || view.kind === 'fca' || view.kind === 'split-config' || view.kind === 'email') {
    return (
      <div key={remountKey} className="h-full min-h-0">
        <Screen view={view} />
      </div>
    )
  }
  const role = view.kind === 'ops' ? 'employer' : 'employee'
  return (
    <div key={remountKey} className="h-full min-h-0">
      <AppShell>
        <AppBar role={role} activeItem="Payments" />
        <MainLayout>
          <PageLayout>
            <Screen view={view} />
          </PageLayout>
        </MainLayout>
      </AppShell>
    </div>
  )
}

export function ScreenFrame({ screenId }: { screenId: string }) {
  const { screenId: selectedId, stateId } = useExplorer()
  const stateKey = selectedId === screenId ? stateId : ''

  return useMemo(
    () => renderWithChrome(makeView(screenId, stateKey), stateKey),
    [screenId, stateKey],
  )
}
