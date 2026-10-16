import { createContext, useContext, useMemo, useState } from 'react'
import {
  autoSplit,
  creditEligible,
  creditMax,
  defaultOptionId,
  findOption,
  isLocalMode,
  methodOptions,
  parseAmount,
  planFromAlloc,
  quote,
  quoteSplit,
  splitWallets,
} from './engine'
import type { CreditPlan, MethodGroup, MethodOption, Quote } from './engine'
import { useFlowData, useFlowStore } from './store'
import type { FlowData, FlowStore } from './store'
import { DEFAULT_UI } from './types'
import type { FundDraft, UiState } from './types'
import { InvoicesScreen } from './screens/invoices'
import { PaymentScreen } from './screens/payment'
import { WalletScreen } from './screens/wallet'
import { ConfirmModal, SuccessModal } from './screens/confirm'
import { MethodsModal } from './screens/methods-modal'
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
  /**
   * Credit on this payment. null = panel hidden (experiment off, balance 0,
   * or no fee line credit may touch). `plan` is the live allocation when
   * on (also in `q.plan`); `usdOnlyBlocked` = USD-only rule hid it.
   */
  credit: {
    on: boolean
    plan: CreditPlan
    /** Most this batch can take, USD (balance or every eligible fee). */
    max: number
    /** Amount field as shown, USD. */
    raw: string
    /** Amount field error - blocks Confirm. */
    error?: string
  } | null
  /** Shown instead of the credit line under the USD-only rule. */
  usdOnlyBlocked: boolean
  /** Apply / remove credit. Applying starts at the max. */
  setCredit: (on: boolean) => void
  /** Edit the USD amount to apply (as typed). */
  setCreditAmount: (raw: string) => void
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
    const groups = methodOptions(payInvoices, data.local, data.wallets, { localTransfer: data.flags.localTransfer })
    // Local invoices preselect the matching wallet (PRD F4.1); everything
    // else starts on the method list - pick one, it becomes a switcher.
    const localMode = isLocalMode(payInvoices, data.local)
    const methodId = ui.methodId ?? (localMode ? defaultOptionId(payInvoices, data.wallets) : null)
    const option = findOption(groups, methodId)
    const rules = { crossCcy: data.flags.creditCrossCcy }
    const eligible = data.flags.credits && data.credit.balance > 0 ? creditEligible(payInvoices, rules) : []
    const usdOnlyBlocked =
      data.flags.credits &&
      data.credit.balance > 0 &&
      eligible.length === 0 &&
      !rules.crossCcy &&
      payInvoices.some((i) => i.ccy !== 'USD' && i.kind !== 'contractor')
    const on = eligible.length > 0 && (ui.creditOn ?? data.flags.creditDefaultOn)
    const max = creditMax(payInvoices, data.credit.balance, rules)
    const typed = ui.creditAmount === null ? max : parseAmount(ui.creditAmount)
    const error =
      Number.isNaN(typed) || typed < 0
        ? 'Enter an amount'
        : typed > max + 1e-9
          ? `You can apply up to ${fmt(max, 'USD')}`
          : undefined
    const alloc = on && !error ? autoSplit(payInvoices, typed, rules) : {}
    const built = planFromAlloc(payInvoices, data.credit, rules, alloc)
    const plan = on && error ? { ...built, invalid: true } : built
    const raw = ui.creditAmount ?? max.toFixed(2)
    const credit = eligible.length > 0 ? { on, plan, max, raw, error: on ? error : undefined } : null
    const split = splitWallets(payInvoices, data.wallets)
    const q = !payInvoices.length
      ? null
      : split
        ? quoteSplit(payInvoices, split, on ? plan : null)
        : quote(payInvoices, option, on ? plan : null)
    return {
      ui,
      set,
      data,
      store,
      payInvoices,
      groups,
      option,
      q,
      credit,
      usdOnlyBlocked,
      setCredit: (next) => set({ creditOn: next, creditAmount: null }),
      setCreditAmount: (next) => set({ creditAmount: next }),
      startPayment: (ids) =>
        set({
          screen: 'payment',
          payIds: ids,
          methodId: null,
          openGroup: null,
          creditOn: null,
          creditAmount: null,
          payFailed: false,
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
        {ui.modal?.kind === 'methods' && <MethodsModal />}
        {ui.modal?.kind === 'confirm' && <ConfirmModal />}
        {ui.modal?.kind === 'success' && <SuccessModal result={ui.modal.result} />}
        {ui.modal?.kind === 'fund' && <FundWalletModal draft={ui.modal.draft} />}
      </div>
    </Ctx.Provider>
  )
}
