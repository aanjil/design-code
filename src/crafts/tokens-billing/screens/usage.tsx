import type { UsageView } from '../types'
import { LEDGERS, num, usd } from '../engine'
import { Chip, EmptyRow, Segmented, SettingsShell, TableCard, Td, Th, settingsNavTarget } from '../ui'
import { useExplorer } from '@/components/playground/explorer'
import { useState } from 'react'

/**
 * Settings > AI > Usage - what Emma did and what each job cost, filterable
 * by job type. Never shows C/M/R (provider cost, margin multiplier,
 * exchange rate) - those are admin-only per the PRD.
 */

export function UsageScreen({ view }: { view: UsageView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  const [range, setRange] = useState<'jul' | 'jun' | '90d'>('jul')
  const rows = LEDGERS[b.ledger].filter((r) => (r.unit === 'tok' && r.amount < 0) || r.unit === 'note')

  let burned = 0
  let jobs = 0
  for (const r of rows) {
    if (r.unit === 'tok') {
      burned += Math.abs(r.amount)
      jobs++
    }
  }

  return (
    <SettingsShell
      active="usage"
      title="Usage"
      subtitle="Settings · AI"
      balances={{ tokens: b.tokens, credit: b.credit, wallet: b.wallet }}
      onNavigate={(key) => show(settingsNavTarget(key) ?? 'A3')}
    >
      <div className="rounded-2xl bg-background-base p-4.5 shadow-card">
        <div className="mb-3.5 flex items-baseline justify-between">
          <p className="text-label-md text-text-primary">July</p>
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: 'jul', label: 'July' },
              { value: 'jun', label: 'June' },
              { value: '90d', label: 'Last 90 days' },
            ]}
          />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-caption-md text-text-muted">Tokens used</p>
            <p className="mt-1 text-label-md text-text-primary">{num(burned)}</p>
          </div>
          <div>
            <p className="text-caption-md text-text-muted">Jobs Emma ran</p>
            <p className="mt-1 text-label-md text-text-primary">{num(jobs)}</p>
          </div>
          <div>
            <p className="text-caption-md text-text-muted">Busiest job</p>
            <p className="mt-1 text-label-md text-text-primary">Payroll</p>
            <p className="text-caption-md text-text-muted">most tokens per run</p>
          </div>
          <div>
            <p className="text-caption-md text-text-muted">Cost by hand</p>
            <p className="mt-1 text-label-md text-text-success-base">~{usd(Math.round(burned * 0.29 * 10) / 10)}</p>
            <p className="text-caption-md text-text-muted">Estimate, never billed</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-caption-md text-text-muted">Show</span>
        {['All jobs', 'Payroll', 'Offer letters', 'Expense review', 'Adjustments'].map((f, i) => (
          <Chip key={f} tone={i === 0 ? 'accent' : 'neutral'}>
            {f}
          </Chip>
        ))}
      </div>

      <div className="mt-3">
        <TableCard>
          <thead>
            <tr>
              <Th width="88px">Date</Th>
              <Th>Job</Th>
              <Th width="112px">Run by</Th>
              <Th align="right" width="92px">
                Tokens
              </Th>
              <Th align="right" width="88px">
                Balance
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <Td muted>{r.date}</Td>
                <Td>
                  {r.title}
                  {r.flag && (
                    <Chip tone={r.flag === 'adjustment' ? 'warning' : 'accent'} className="ml-2">
                      {r.flag}
                    </Chip>
                  )}
                  <p className="mt-0.5 text-caption-md text-text-muted">{r.sub}</p>
                </Td>
                <Td muted>{r.unit === 'note' ? 'system' : 'Anjil B.'}</Td>
                <Td align="right">{r.unit === 'note' ? '—' : `-${num(Math.abs(r.amount))}`}</Td>
                <Td align="right" muted>
                  {num(r.balance)}
                </Td>
              </tr>
            ))}
          </tbody>
          {rows.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={5}>
                  <EmptyRow
                    title="Emma hasn't run anything yet"
                    description="Ask Emma to draft an offer letter or run payroll, and the token cost appears here."
                  />
                </td>
              </tr>
            </tbody>
          )}
        </TableCard>
      </div>
      <p className="mt-2.5 text-paragraph-xs text-text-muted">
        Token cost varies with the size of the job. Payroll for 62 people costs more than payroll for 6. We bill
        actual consumption, never a flat rate per job.
      </p>
    </SettingsShell>
  )
}
