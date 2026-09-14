import { Gift, Info } from '@phosphor-icons/react'
import type { CreditView } from '../types'
import { LEDGERS, usd } from '../engine'
import { Banner, EmptyRow, MiniStat, SettingsShell, StatCard, TableCard, Td, Th, settingsNavTarget } from '../ui'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Settings > Billing > Credit - dollars only, never mixed with the token
 * ledger. Distinguishes "never had credit" from "had it, spent it" since
 * both render $0.00 but mean different things to a finance reader.
 */

export function CreditScreen({ view }: { view: CreditView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  const rows = LEDGERS[b.ledger].filter((r) => r.unit === 'usd')

  let sub: string
  let value: string
  if (b.credit === 0 && b.creditEver === 0) {
    value = 'None yet'
    sub = "Credit is granted by Niural, usually at signing or as a promo. It can't be bought or topped up."
  } else if (b.credit === 0) {
    value = usd(0)
    sub = `All ${usd(b.creditEver)} of your credit has been applied. Emma tokens now come from your wallet.`
  } else {
    value = usd(b.credit)
    sub = 'Applied automatically to your Niural fee'
  }

  const appliedToFee = Math.min(b.creditEver, 1250)
  const spentOnTokens = Math.max(b.creditEver - 1250 - b.credit, 0)

  return (
    <SettingsShell
      active="credit"
      title="Credit"
      subtitle="Settings · Billing"
      balances={{ tokens: b.tokens, credit: b.credit, wallet: b.wallet }}
      onNavigate={(key) => show(settingsNavTarget(key) ?? 'B1')}
    >
      <StatCard
        icon={Gift}
        iconTone="success"
        label="Credit balance"
        value={value}
        sub={sub}
        actions={
          <Button size="sm" variant="outline">
            <span className="px-1">How credit is used</span>
          </Button>
        }
      />

      <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-background-success-highlight p-3">
        <Info weight="fill" className="mt-px size-4 shrink-0 text-text-success-base" />
        <p className="text-paragraph-xs text-text-success-base">
          Credit pays your Niural fee and buys Emma tokens. It can't be withdrawn, transferred, or used for payroll.
          Only Niural can grant it - there is nothing here to top up.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-background-base p-4 shadow-card">
          <MiniStat label="Applied to your Niural fee" value={usd(appliedToFee)} />
        </div>
        <div className="rounded-2xl bg-background-base p-4 shadow-card">
          <MiniStat label="Spent on Emma tokens" value={usd(spentOnTokens)} />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-label-md text-text-primary">Credit history</h3>
          <Button size="sm" variant="ghost">
            <span className="px-1">Export</span>
          </Button>
        </div>
        <TableCard>
          <thead>
            <tr>
              <Th width="84px">Date</Th>
              <Th>Entry</Th>
              <Th width="126px">Applied to</Th>
              <Th align="right" width="94px">
                Amount
              </Th>
              <Th align="right" width="94px">
                Balance
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const to = /fee/i.test(r.sub) ? 'Niural fee' : /token/i.test(r.sub) ? 'Emma tokens' : '—'
              return (
                <tr key={i}>
                  <Td muted>{r.date}</Td>
                  <Td>
                    {r.title}
                    <p className="mt-0.5 text-caption-md text-text-muted">{r.sub}</p>
                  </Td>
                  <Td muted>{to}</Td>
                  <Td align="right">
                    <span className={r.amount > 0 ? 'text-text-success-base' : undefined}>
                      {r.amount > 0 ? '+' : '−'}
                      {usd(Math.abs(r.amount))}
                    </span>
                  </Td>
                  <Td align="right" muted>
                    {usd(r.balance)}
                  </Td>
                </tr>
              )
            })}
          </tbody>
          {rows.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={5}>
                  <EmptyRow
                    title="No credit yet"
                    description="Credit is usually granted at signing or as a promo. If you were told you had credit, contact your account manager."
                  />
                </td>
              </tr>
            </tbody>
          )}
        </TableCard>
        <p className="mt-2.5 text-paragraph-xs text-text-muted">
          Entries are never edited. A correction is posted as its own line, so this history always adds up to the
          balance above.
        </p>
      </div>

      {b.load === 'error' && (
        <Banner tone="error" title="Couldn't load your balance" className="mt-4">
          Your credit is safe - we just couldn't reach the ledger.
        </Banner>
      )}
    </SettingsShell>
  )
}
