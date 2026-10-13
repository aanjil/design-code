import { createContext, useContext, useMemo, useState } from 'react'
import { defaultOptionId, findOption, methodOptions, quote } from './engine'
import type { MethodGroup, MethodOption, Quote } from './engine'
import { useFlowData, useFlowStore } from './store'
import type { FlowData, FlowStore } from './store'
import { DEFAULT_UI } from './types'
import type { FundDraft, UiState } from './types'
import { InvoicesScreen } from './screens/invoices'
import { PaymentScreen } from './screens/payment'
import { WalletScreen } from './screens/wallet'
import { ConfirmModal, SuccessModal } from './screens/confirm'
import { FundWalletModal } from './screens/fund-wallet'
import { MockDock } from './mock-dock'
import { AppBar } from '@/components/nds/app-bar'
import { AppShell, MainLayout, PageLayout } from '@/components/nds/layouts'
import { PAYMENTS_SIDEBAR, Sidebar } from '@/components/nds/sidebar'
import { fmt } from '@/mocks/payment-flow'
import type { Invoice, LocalCcy } from '@/mocks/payment-flow'

/**
 * The employer app: Invoices list → Payment (summary + methods) →
 * Confirmation → Success, plus Wallet page and the Fund wallet modal.
 * UI state lives here; data lives in the FlowStore from context.
 */

export interface PaymentCtx {
  ui: UiState
  set: (patch: Partial<UiState> | ((ui: UiState) => Partial<UiState>)) => void
  data: FlowData
  store: FlowStore
  payInvoices: Array<Invoice>
  groups: Record<MethodGroup, Array<MethodOption>>
  option: MethodOption | null
  q: Quote | null
  startPayment: (ids: Array<string>) => void
  openFund: (ccy: 'USD' | LocalCcy, shortfall?: number) => void
}

const Ctx = createContext<PaymentCtx | null>(null)

export function usePayment(): PaymentCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePayment outside PaymentFlowApp')
  return c
}

export function PaymentFlowApp({
  initial,
  mockDock,
  onNavItemClick,
  onSidebarNavigate,
  onWalletClick,
}: {
  initial?: Partial<UiState>
  mockDock?: boolean
  /** Master App: AppBar pills navigate between sections. */
  onNavItemClick?: (label: string) => void
  /** Master App: sidebar leaves this craft doesn't own (Payroll, ...). */
  onSidebarNavigate?: (label: string) => void
  /** Master App: wallet pill routes to the Wallet section. */
  onWalletClick?: () => void
}) {
  const store = useFlowStore()
  const data = useFlowData()
  const [ui, setUi] = useState<UiState>(() => ({ ...DEFAULT_UI, ...initial }))

  const ctx = useMemo<PaymentCtx>(() => {
    const set: PaymentCtx['set'] = (patch) =>
      setUi((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
    const payInvoices = ui.payIds
      .map((id) => data.invoices.find((i) => i.id === id))
      .filter((i): i is Invoice => !!i)
    const groups = methodOptions(payInvoices, data.local, data.wallets)
    const methodId = ui.methodId ?? (payInvoices.length ? defaultOptionId(payInvoices, data.wallets) : null)
    const option = findOption(groups, methodId)
    const q = option && payInvoices.length ? quote(payInvoices, option) : null
    return {
      ui,
      set,
      data,
      store,
      payInvoices,
      groups,
      option,
      q,
      startPayment: (ids) =>
        set({
          screen: 'payment',
          payIds: ids,
          methodId: null,
          methodsOpen: false,
          openGroup: null,
          collapsed: [],
          wireVerify: 'idle',
          modal: null,
        }),
      openFund: (ccy, shortfall) => {
        const draft: FundDraft = {
          step: 'method',
          ccy,
          method: 'rail',
          amount: shortfall ? shortfall.toFixed(2) : '',
          memo: '',
          shortfall,
        }
        set({ modal: { kind: 'fund', draft } })
      },
    }
  }, [ui, data, store])

  const usd = data.wallets.find((w) => w.primary)

  return (
    <Ctx.Provider value={ctx}>
      <div className="relative h-full min-h-0">
        <AppShell>
          <AppBar
            role="employer"
            activeItem="Payments"
            walletActive={ui.screen === 'wallet'}
            walletAmount={usd ? fmt(usd.available, 'USD') : undefined}
            onWalletClick={onWalletClick ?? (() => ctx.set({ screen: 'wallet', modal: null }))}
            onNavItemClick={(l) => {
              if (onNavItemClick) onNavItemClick(l)
              else if (l === 'Payments') ctx.set({ screen: 'invoices', modal: null })
            }}
          />
          <MainLayout>
            {ui.screen === 'invoices' && (
              <>
                <Sidebar
                  title="Payments"
                  groups={PAYMENTS_SIDEBAR}
                  activeItem="Invoices"
                  onNavigate={(l) => (l === 'Invoices' ? ctx.set({ screen: 'invoices' }) : onSidebarNavigate?.(l))}
                />
                <PageLayout>
                  <InvoicesScreen />
                </PageLayout>
              </>
            )}
            {ui.screen === 'payment' && (
              <PageLayout>
                <PaymentScreen />
              </PageLayout>
            )}
            {ui.screen === 'wallet' && <WalletScreen />}
          </MainLayout>
        </AppShell>
        {mockDock && !ui.modal && <MockDock />}
        {ui.modal?.kind === 'confirm' && <ConfirmModal />}
        {ui.modal?.kind === 'success' && <SuccessModal result={ui.modal.result} />}
        {ui.modal?.kind === 'fund' && <FundWalletModal draft={ui.modal.draft} />}
      </div>
    </Ctx.Provider>
  )
}
