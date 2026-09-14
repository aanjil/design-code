import { useEffect, useSyncExternalStore } from 'react'
import type { AppView } from './types'
import { renderWithChrome } from './app'
import { liveStore } from './live-store'
import type { LiveData } from './live-store'
import { ExplorerContext } from '@/components/playground/explorer'
import type { ExplorerContextValue } from '@/components/playground/explorer'

/**
 * One real, interactive instance of the whole first-slice flow - same
 * "reuse every screen component unchanged, supply a `show()` that mutates
 * real state instead of looking up a fixed scenario" pattern as
 * multi-payroll's live-app.tsx. Auto-advances biometric login
 * (framing -> prompting -> logged in) on its own, demonstrating PRD 2.1's
 * "Auto-Trigger" and "Seamless Landing" acceptance criteria for real rather
 * than as a static screenshot.
 */

function deriveLiveView(data: LiveData): AppView {
  if (data.viewingSettings) {
    return { kind: 'settings', settings: { mode: data.mode } }
  }
  if (!data.loggedIn) {
    if (data.onboardingStep) return { kind: 'onboardingChat', onboardingChat: { step: data.onboardingStep } }
    if (data.loginStep === 'password') return { kind: 'login', login: { step: 'password' } }
    return { kind: 'login', login: { step: data.loginStep } }
  }
  return {
    kind: 'dashboard',
    dashboard: {
      mode: data.mode,
      surface: data.surface,
      emmaHealthy: true,
      summary: data.summaryDismissed ? 'dismissed' : 'has-updates',
      dismissedCardIds: data.dismissedCardIds,
      chatMessages: data.chatMessages ?? undefined,
    },
  }
}

export function LiveApp() {
  const data = useSyncExternalStore(liveStore.subscribe, liveStore.getSnapshot, liveStore.getServerSnapshot)

  // PRD 2.1 - biometrics auto-trigger on launch and land the user on the
  // dashboard within ~1s of confirmation, with no separate "logging in"
  // screen the user has to clear. Framing and prompting each hold briefly
  // so the transition reads, then the app signs itself in.
  useEffect(() => {
    if (data.loggedIn) return
    if (data.loginStep === 'biometric-framing') {
      const t = setTimeout(() => liveStore.setLoginStep('biometric-prompting'), 1400)
      return () => clearTimeout(t)
    }
    if (data.loginStep === 'biometric-prompting') {
      const t = setTimeout(() => liveStore.logIn(), 1400)
      return () => clearTimeout(t)
    }
  }, [data.loggedIn, data.loginStep])

  function show(screenId: string, stateId?: string, payload?: Record<string, unknown>) {
    if (screenId === 'A1') {
      liveStore.setOnboardingStep(null)
      liveStore.setLoginStep(stateId === 'prompting' ? 'biometric-prompting' : 'biometric-framing')
      return
    }
    if (screenId === 'A2') {
      liveStore.setOnboardingStep(null)
      liveStore.setLoginStep('password')
      return
    }
    if (screenId === 'C1') {
      liveStore.setOnboardingStep((stateId as 'password' | 'name' | 'biometric-offer' | undefined) ?? 'password')
      return
    }
    if (screenId === 'B1') {
      if (payload?.dismissSummary) {
        liveStore.dismissSummary()
        return
      }
      liveStore.setOnboardingStep(null)
      liveStore.setViewingSettings(false)
      liveStore.logIn()
      liveStore.setSurface('composed')
      return
    }
    if (screenId === 'B2') {
      liveStore.setSurface('chat')
      return
    }
    if (screenId === 'B3') {
      liveStore.setViewingSettings(false)
      liveStore.setMode('traditional')
      return
    }
    if (screenId === 'D1') {
      if (stateId === 'traditional' || stateId === 'ai-native') {
        liveStore.setMode(stateId)
      }
      liveStore.setViewingSettings(true)
    }
  }

  const view = deriveLiveView(data)
  const screenId = data.viewingSettings
    ? 'D1'
    : !data.loggedIn
      ? data.onboardingStep
        ? 'C1'
        : data.loginStep === 'password'
          ? 'A2'
          : 'A1'
      : data.surface === 'chat'
        ? 'B2'
        : data.mode === 'traditional'
          ? 'B3'
          : 'B1'
  const stateId = data.viewingSettings
    ? data.mode
    : !data.loggedIn
      ? data.onboardingStep ?? (data.loginStep === 'biometric-prompting' ? 'prompting' : 'default')
      : 'default'

  const liveValue: ExplorerContextValue = {
    catalog: [],
    screenId,
    stateId,
    show,
    done: {},
    toggleDone: () => {},
    resetDone: () => {},
    total: 0,
    checked: 0,
    focusNonce: 0,
  }

  return (
    <ExplorerContext.Provider value={liveValue}>
      {renderWithChrome(view, 'live-app')}
    </ExplorerContext.Provider>
  )
}
