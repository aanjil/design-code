import { ArrowUp, ArrowsClockwise, ArrowsLeftRight, Bank, CurrencyCircleDollar, FileText, ShieldCheck, Coins, Info } from '@phosphor-icons/react'
import { usePayment } from '../app'
import { CurrencyMark, Money, PrimaryTag, StatusPill, Tag } from '../ui'
import { PageLayout } from '@/components/nds/layouts'
import { Button } from '@niural/components'
import { CCY_NAME, fmt, fmtDate } from '@/mocks/payment-flow'
import type { LocalCcy } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'

/**
 * Wallet page (PRD F1.2): wallet picked in the sidebar, one balance card.
 * USD stays Primary; the local wallet (CAD/GBP/EUR) sits right under it
 * with Fund wallet. Security deposit + local entity banners are USD only.
 * Recent transactions are filtered to the wallet being viewed.
 */

export function WalletScreen() {
  const { ui, set, data, openFund } = usePayment()
  const fiat = data.wallets.filter((w) => !w.network)
  const coins = data.wallets.filter((w) => w.network)
  const current = data.wallets.find((w) => w.ccy === ui.walletCcy && !w.network) ?? fiat[0]
  const isLocal = current.ccy === data.local
  const txs = data.txs.filter((t) => t.ccy === current.ccy)

  return (
    <>
      <aside className="flex w-50 shrink-0 flex-col border-r border-border-base bg-background-base/72">
        <div className="flex h-16 items-center px-6">
          <p className="text-[18px] leading-[1.6] font-[550] tracking-[-0.02em] text-text-primary">Niural wallet</p>
        </div>
        <nav className="flex flex-1 flex-col gap-8 overflow-y-auto p-4">
          <div>
            <p className="px-2 pb-3 text-caption-md text-text-muted">Wallet balances</p>
            <div className="flex flex-col gap-0.5">
              {[...fiat, ...coins.slice(0, 2)].map((w) => {
                const active = w.id === current.id
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => !w.network && set({ walletCcy: w.ccy })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-2 text-left text-label-sm transition-colors',
                      active ? 'bg-background-base text-brand-text shadow-button-gray' : 'text-text-primary hover:bg-background-highlight',
                    )}
                  >
                    <CurrencyMark ccy={w.ccy} size="sm" />
                    <span className="flex-1 truncate">{w.network ? `${w.ccy} (${w.network})` : CCY_NAME[w.ccy]}</span>
                    {w.ccy === data.local && <Tag tone="brand">New</Tag>}
                  </button>
                )
              })}
            </div>
          </div>
          <SideGroup items={[[ArrowsLeftRight, 'Wallet transactions'], [FileText, 'Account statement'], [ShieldCheck, 'Security deposits']]} />
          <SideGroup title="Settings" items={[[Bank, 'Payment methods'], [Coins, 'Wallet currencies']]} />
        </nav>
      </aside>
      <PageLayout>
        <div className="min-h-0 max-w-5xl mx-auto flex-1 overflow-y-auto px-8 py-7">
          <h1 className="mb-4 flex items-center gap-2 text-label-lg text-text-primary"><CurrencyCircleDollar className="size-5" />Wallet balance</h1>
          <div className="relative overflow-hidden rounded-2xl bg-background-base p-5 shadow-card">
            <div className="flex items-center gap-2">
              <CurrencyMark ccy={current.ccy} size="md" />
              <span className="text-title-h5 text-text-primary">{CCY_NAME[current.ccy]}</span>
              {current.primary && <PrimaryTag />}
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-x-14 gap-y-4">
              <div>
                <p className="text-paragraph-sm text-text-muted">Available balance</p>
                <Money className="text-mono-xl text-text-primary">{fmt(current.available, current.ccy)}</Money>
              </div>
              <div>
                <p className="text-paragraph-sm text-text-muted">Pending balance</p>
                <Money className="text-mono-xl text-text-primary">{fmt(current.pending, current.ccy)}</Money>
              </div>
              <Button type="button" className="ml-auto" leftIcon={<ArrowUp className="size-4" />} onClick={() => openFund(current.ccy as 'USD' | LocalCcy)}>
                Fund wallet
              </Button>
            </div>
          </div>

          {current.primary && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-background-base p-3 text-paragraph-sm shadow-card">
                <span>Looking for your security deposits? They're stored separately and earn 1.5% cash rewards, paid monthly to this wallet.</span>
                <Button type="button" variant="ghost" shade="primary" size="sm">View security deposits</Button>
              </div>
              <p className="flex items-center gap-2 rounded-xl bg-background-base p-3 text-paragraph-sm text-text-primary shadow-card">
                <Info className="size-4 text-text-muted" /> Heads up, funds in Niural wallet cannot be used for your local entity payrolls.
              </p>
            </div>
          )}
          {isLocal && current.available === 0 && current.pending === 0 && (
            <p className="mt-3 rounded-xl bg-brand-base p-3 text-paragraph-sm text-text-primary">
              Your {current.ccy} wallet is ready. Fund it to pay {current.ccy} invoices without currency conversion.
            </p>
          )}

          <div className="mt-8 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-label-md text-text-primary">Recent transactions</p>
              <span className="flex items-center gap-1 text-label-xs text-text-info-base"><ArrowsClockwise className="size-3.5" />Refresh</span>
            </div>
            <Button type="button" variant="ghost" shade="primary" size="sm">View all transactions</Button>
          </div>
          <div className="overflow-hidden rounded-2xl bg-background-base shadow-card">
            <div className="grid grid-cols-[150px_1fr_150px_120px_150px_160px] items-center bg-background-highlight px-2 text-label-sm text-text-muted">
              {['Transaction type', 'Description', 'Status', 'Currency', 'Date', 'Amount'].map((h, i) => (
                <span key={h} className={cn('px-3 py-2.5', i === 5 && 'text-right')}>{h}</span>
              ))}
            </div>
            {txs.length === 0 && <p className="p-6 text-center text-paragraph-sm text-text-muted">No transactions in this wallet yet.</p>}
            {txs.map((t) => (
              <div key={t.id} className="grid grid-cols-[150px_1fr_150px_120px_150px_160px] items-center border-t border-border-highlight px-2 text-paragraph-sm text-text-primary">
                <span className="px-3 py-3">{t.type}</span>
                <span className="truncate px-3 py-3 text-text-muted">{t.description}</span>
                <span className="px-3 py-3">
                  <StatusPill dotClassName={t.status === 'pending' ? 'bg-background-warning-base' : 'bg-background-success-base'}>
                    {t.status === 'pending' ? 'Pending approval' : 'Completed'}
                  </StatusPill>
                </span>
                <span className="px-3 py-3">{t.ccy}</span>
                <span className="px-3 py-3"><Money className="text-mono-xs">{fmtDate(t.at)}</Money></span>
                <span className={cn('px-3 py-3 text-right', t.amount > 0 && 'text-text-success-base')}>
                  <Money className="text-mono-xs">{fmt(t.amount, t.ccy, { sign: true })}</Money>
                </span>
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    </>
  )
}

function SideGroup({ title, items }: { title?: string; items: Array<[typeof Bank, string]> }) {
  return (
    <div>
      {title && <p className="px-2 pb-3 text-caption-md text-text-muted">{title}</p>}
      <div className="flex flex-col gap-0.5">
        {items.map(([I, label]) => (
          <span key={label} className="flex items-center gap-3 rounded-lg p-2 text-label-sm text-text-primary">
            <I className="size-[18px]" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
