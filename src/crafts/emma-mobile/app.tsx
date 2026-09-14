import { useMemo } from 'react'
import type { AppView } from './types'
import { makeView } from './catalog'
import { LoginScreen } from './screens/login'
import { DashboardScreen } from './screens/dashboard'
import { DocumentCaptureScreen, OnboardingChatScreen, RegistrationFormScreen } from './screens/onboarding'
import { SettingsScreen } from './screens/settings'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Every emma-mobile screen already renders its own full-bleed mobile chrome
 * (status bar / home indicator via nds-mobile) - unlike multi-payroll there
 * is no separate desktop AppBar/Sidebar shell to wrap content in, so this
 * is just the state -> screen switch.
 */
export function Screen({ view }: { view: AppView }) {
  switch (view.kind) {
    case 'login':
      return <LoginScreen view={view.login} />
    case 'dashboard':
      return <DashboardScreen view={view.dashboard} />
    case 'onboardingChat':
      return <OnboardingChatScreen view={view.onboardingChat} />
    case 'documentCapture':
      return <DocumentCaptureScreen view={view.documentCapture} />
    case 'registrationForm':
      return <RegistrationFormScreen view={view.registrationForm} />
    case 'settings':
      return <SettingsScreen view={view.settings} />
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
  // '' falls back to the screen's first state inside makeView
  const stateKey = selectedId === screenId ? stateId : ''

  return useMemo(
    () => renderWithChrome(makeView(screenId, stateKey), stateKey),
    [screenId, stateKey],
  )
}
