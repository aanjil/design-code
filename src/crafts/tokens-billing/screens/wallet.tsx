import { ArrowRight, Coin, CurrencyDollar } from '@phosphor-icons/react'
import type { Balances } from '../types'
import { usd } from '../engine'
import { Button } from '@/components/ui/button'
import { SettingsShell, settingsNavTarget } from '../ui'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Niural Wallet - its own top-level nav item, not under Settings. Only
 * carries the pointer banner: credit and Emma tokens moved to Settings
 * because neither is withdrawable money, so they don't belong beside a
 * real USD/USDC balance. Payment methods moved too, since it's used
 * across the product, not just here.
 */

export function WalletScreen({ balances }: { balances: Balances }) {
  const { show } = useExplorer()
  return (
    <SettingsShell
      active="wallet"
      title="Niural Wallet"
      subtitle="Money you own. Fund payroll, pay vendors, withdraw to your bank."
      balances={{ tokens: balances.tokens, credit: balances.credit, wallet: balances.wallet }}
      onNavigate={(key) => show(settingsNavTarget(key) ?? 'C1')}
    >
      <div className="flex items-start gap-2.5 rounded-lg bg-brand-muted p-3.5">
        <ArrowRight className="mt-px size-4 shrink-0 text-brand-text" />
        <p className="text-paragraph-xs text-brand-text">
          <b className="font-medium">Credit and Emma tokens are in Settings now.</b> Neither can be withdrawn or
          transferred, so they sit with your Niural relationship rather than with your own money. Payment methods
          moved too - the same accounts are used across the product, not just here.{' '}
          <button type="button" onClick={() => show('B1')} className="ml-1 underline underline-offset-2">
            Credit
          </button>{' '}
          <button type="button" onClick={() => show('A1')} className="ml-1 underline underline-offset-2">
            Tokens
          </button>
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-background-base p-4.5 shadow-card">
          <div className="flex items-center gap-1.5 text-text-primary">
            <CurrencyDollar className="size-4" />
            <span className="text-label-xs text-text-muted">US Dollar</span>
          </div>
          <p className="mt-1.5 text-title-h5 text-text-primary">{usd(balances.wallet)}</p>
          <p className="mt-1.5 text-paragraph-xs text-text-muted">Withdrawable · funds payroll and vendor payments</p>
        </div>
        <div className="rounded-2xl bg-background-base p-4.5 shadow-card">
          <div className="flex items-center gap-1.5 text-text-primary">
            <Coin className="size-4" />
            <span className="text-label-xs text-text-muted">USDC</span>
          </div>
          <p className="mt-1.5 text-title-h5 text-text-primary">$4,100.00</p>
          <p className="mt-1.5 text-paragraph-xs text-text-muted">Withdrawable</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => show('B1')}>
          <span className="px-1">Credit</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => show('A1')}>
          <span className="px-1">Tokens</span>
        </Button>
      </div>
    </SettingsShell>
  )
}
