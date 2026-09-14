import { useSyncExternalStore } from 'react'
import type { AppView } from './types'
import { renderWithChrome } from './app'
import { liveStore } from './live-store'
import type { LiveData, LiveScreen } from './live-store'
import { ExplorerContext } from '@/components/playground/explorer'
import type { ExplorerContextValue } from '@/components/playground/explorer'

/**
 * One real, interactive instance of the whole first-pass flow - same
 * "reuse every screen component unchanged, supply a `show()` that mutates
 * real state instead of looking up a fixed scenario" pattern as every
 * other craft's live-app.tsx. Buying tokens actually moves the
 * balance; auto-reload's status row is computed from that same real
 * balance, not a frozen preset.
 */

const SCREEN_TO_ID: Record<LiveScreen, string> = {
  tokens: 'A1',
  credit: 'B1',
  usage: 'A3',
  paymentMethods: 'B2',
  wallet: 'C1',
  buy: 'D1',
}

function deriveLiveView(data: LiveData): AppView {
  switch (data.screen) {
    case 'tokens':
      return {
        kind: 'tokens',
        tokens: {
          balances: data.balances,
          autoReload: data.autoReloadOpen ? { open: true, sources: data.autoReloadSources } : undefined,
        },
      }
    case 'credit':
      return { kind: 'credit', credit: { balances: data.balances } }
    case 'usage':
      return { kind: 'usage', usage: { balances: data.balances } }
    case 'paymentMethods':
      return { kind: 'paymentMethods', paymentMethods: { hasAccounts: true } }
    case 'wallet':
      return { kind: 'wallet' }
    case 'buy':
      return {
        kind: 'buy',
        buy: {
          balances: data.balances,
          qty: data.buyQty,
          mode: 'v1',
          src: 'credit',
          method: data.buyMethod,
          review: data.review ?? undefined,
        },
      }
  }
}

export function LiveApp() {
  const data = useSyncExternalStore(liveStore.subscribe, liveStore.getSnapshot, liveStore.getServerSnapshot)

  function show(screenId: string, stateId?: string, payload?: Record<string, unknown>) {
    if (screenId === 'A2') {
      if (stateId === 'close') liveStore.closeAutoReload()
      else liveStore.openAutoReload()
      return
    }
    if (screenId === 'D1' && stateId === 'commit' && payload) {
      const { qty, spend } = payload as { qty: number; spend: { credit: number; wallet: number } }
      liveStore.commitPurchase(qty, spend)
      return
    }
    const screen = (Object.keys(SCREEN_TO_ID) as Array<LiveScreen>).find((k) => SCREEN_TO_ID[k] === screenId)
    if (screen) liveStore.navigate(screen)
  }

  const view = deriveLiveView(data)
  const screenId = SCREEN_TO_ID[data.screen]
  const stateId = data.screen === 'tokens' && data.autoReloadOpen ? 'ok' : 'default'

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
    <ExplorerContext.Provider value={liveValue}>{renderWithChrome(view, 'live-app')}</ExplorerContext.Provider>
  )
}
