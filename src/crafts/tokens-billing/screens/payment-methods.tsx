import { Fragment } from 'react'
import { Bank, Copy, Download, Info, Plus, Wallet as WalletIcon } from '@phosphor-icons/react'
import type { Balances, PaymentMethodsView } from '../types'
import { WIRE_DETAILS, WIRE_REFERENCE } from '../engine'
import { Chip, SettingsShell, settingsNavTarget } from '../ui'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Settings > Billing > Payment methods - global, not wallet-scoped: it
 * funds the wallet, buys Emma tokens, and will eventually collect the
 * Niural fee. Each account states what it can be used for, since three
 * accounts with no explanation of why one is Primary was a real gap the
 * source workbench's checklist called out.
 */

const ACCOUNTS = [
  { name: 'JPMorgan Chase Bank, N.A.', detail: 'Ending 8910 · USD · default for adding funds', primary: true },
  { name: 'Deutsche Bank AG', detail: 'Ending 3456 · EUR · wallet funding only', primary: false },
  { name: 'Wells Fargo Bank, N.A.', detail: 'Ending 9835 · USD', primary: false },
]

export function PaymentMethodsScreen({ view, balances }: { view: PaymentMethodsView; balances: Balances }) {
  const { show } = useExplorer()
  return (
    <SettingsShell
      active="payment"
      title="Payment methods"
      subtitle="Accounts and cards Niural uses across the product - funding your wallet, buying Emma tokens, and collecting anything you owe."
      balances={{ tokens: balances.tokens, credit: balances.credit, wallet: balances.wallet }}
      onNavigate={(key) => show(settingsNavTarget(key) ?? 'B2')}
      actions={
        <Button size="sm">
          <Plus className="size-4" />
          <span className="px-1">Add payment method</span>
        </Button>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_312px] items-start gap-5">
        <div>
          <p className="mb-2.5 text-label-sm text-text-primary">Bank accounts</p>
          <div className="flex flex-col gap-2">
            {(view.hasAccounts ? ACCOUNTS : []).map((a) => (
              <div key={a.name} className="flex items-center gap-3 rounded-xl bg-background-base p-3.5 shadow-card">
                <span
                  className={
                    a.primary
                      ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-text'
                      : 'flex size-9 shrink-0 items-center justify-center rounded-full bg-background-highlight text-text-muted'
                  }
                >
                  <Bank className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-label-sm text-text-primary">{a.name}</p>
                    {a.primary && <Chip tone="accent">Primary</Chip>}
                  </div>
                  <p className="mt-0.5 text-paragraph-xs text-text-muted">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 mb-2.5 text-label-sm text-text-primary">Crypto</p>
          <div className="rounded-xl bg-background-base p-6 text-center shadow-card">
            <p className="text-paragraph-xs text-text-muted">Connect a crypto wallet to fund in USDC or USDT.</p>
            <Button size="sm" variant="outline" className="mt-2.5">
              <WalletIcon className="size-4" />
              <span className="px-1">Connect wallet</span>
            </Button>
          </div>
        </div>

        <aside>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-label-sm text-text-primary">Send a wire to Niural</p>
            <div className="flex gap-1">
              <Button size="icon-sm" variant="ghost" aria-label="Copy details">
                <Copy className="size-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Download details">
                <Download className="size-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-background-base p-4 shadow-card">
            <dl className="grid grid-cols-[106px_minmax(0,1fr)] gap-y-1 gap-x-3 text-paragraph-xs">
              <dt className="text-text-muted">Reference</dt>
              <dd>
                <code className="rounded bg-brand-muted px-1.5 py-0.5 text-brand-text">{WIRE_REFERENCE}</code>
              </dd>
              {WIRE_DETAILS.map(([label, value]) => (
                <Fragment key={label}>
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="text-text-primary">{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
          <div className="mt-2.5 flex items-start gap-2.5 rounded-lg bg-brand-muted p-3">
            <Info weight="fill" className="mt-px size-4 shrink-0 text-brand-text" />
            <p className="text-paragraph-xs text-brand-text">
              Include the reference code so we can match your transfer to Acme Robotics. Send from an account in
              your company's name - we can't accept third-party wires.
            </p>
          </div>
          <p className="mt-2.5 text-paragraph-xs text-text-muted">
            Your details on file: Niural Employer, 4298 Pin Oak Drive, Long Beach, CA 90802.
          </p>
          <p className="mt-1.5 text-paragraph-xs text-text-muted">
            Wires usually clear the same day. We email you when funds land.
          </p>
        </aside>
      </div>
    </SettingsShell>
  )
}
