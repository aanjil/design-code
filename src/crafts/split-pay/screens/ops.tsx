import { Fragment } from 'react'
import { CaretDown, Copy, Flag, MagnifyingGlass } from '@phosphor-icons/react'
import type { OpsView } from '../types'
import type { OpsOrder } from '@/mocks/split-pay'
import { OPS_ORDERS } from '@/mocks/split-pay'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { useExplorer } from '@/components/playground/explorer'
import { cn } from '@/lib/utils'

/**
 * G - internal ops transaction detail (§7). Ops + Treasury admin only.
 * Transak vocabulary allowed here; wallet/tx detail visible (unlike
 * every employee surface). Flags: fallback streak, cooling-off retry,
 * partial delivery.
 */

const STATUS_CLS: Record<OpsOrder['status'], string> = {
  COMPLETED: 'bg-success-muted text-success',
  PROCESSING: 'bg-info-muted text-primary',
  FAILED: 'bg-error-highlight text-error',
}

const FLAG_LABEL: Record<NonNullable<OpsOrder['flag']>, string> = {
  'fallback-streak': 'Fallback streak >30 days',
  'cooling-off-retry': 'Cooling-off retry >3 days',
  'partial-delivery': 'Partial delivery - manual reconciliation',
}

const TIMELINE = [
  { at: 'Jul 31, 06:02', label: 'Fiat wire sent to Transak', ok: true },
  { at: 'Jul 31, 06:04', label: 'Order TRK-88215 created', ok: true },
  { at: 'Jul 31, 06:31', label: 'Order failed - ORDER_FAILED_COMPLIANCE', ok: false },
  { at: 'Jul 31, 07:00', label: 'Fallback: fiat returned to payroll, paid to primary bank', ok: true },
]

export function OpsScreen({ view }: { view: OpsView }) {
  const { show } = useExplorer()

  return (
    <>
      <PageHeader title="Split pay orders" />
      <PageBody className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-8 w-80 items-center gap-2 rounded-lg border border-input px-2.5 text-paragraph-xsmall text-muted">
            <MagnifyingGlass className="size-4" />
            Search employee, pay cycle, or Transak order id
          </div>
          <span className="text-caption-sm font-medium text-muted">Ops + Treasury admin only</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-base">
          <table className="w-full text-left text-paragraph-xsmall">
            <thead className="bg-highlight text-muted">
              <tr>
                {['Employee', 'Cycle', 'Order id', 'Wallet', 'Network', 'Fiat wired', 'USDC delivered', 'Tx hash', 'Status', ''].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OPS_ORDERS.map((o) => (
                <Fragment key={o.id}>
                  <tr
                    className={cn(
                      'border-t border-base text-primary',
                      o.flag && 'shadow-[inset_3px_0_0_var(--border-warning-base,orange)]',
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        {o.employee}
                        {o.flag && (
                          <span title={FLAG_LABEL[o.flag]}>
                            <Flag weight="fill" className="size-3.5 text-warning" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{o.cycle}</td>
                    <td className="px-3 py-2.5 tabular-nums text-paragraph-xsmall">{o.orderId}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1 tabular-nums text-paragraph-xsmall">
                        {o.walletShort}
                        <Copy className="size-3 text-muted" />
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{o.network}</td>
                    <td className="px-3 py-2.5 tabular-nums text-paragraph-xsmall">{o.fiatWired}</td>
                    <td className="px-3 py-2.5 tabular-nums text-paragraph-xsmall">{o.usdcDelivered}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1 tabular-nums text-paragraph-xsmall">
                        {o.txHash}
                        {o.txHash !== '—' && <Copy className="size-3 text-muted" />}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn('inline-flex h-6 items-center rounded-full px-2 text-caption-sm font-medium', STATUS_CLS[o.status])}>
                        {o.status}
                      </span>
                      {o.fallbackReason && (
                        <p className="mt-0.5 text-caption-sm font-medium text-muted">{o.fallbackReason}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        aria-label={`Timeline for ${o.orderId}`}
                        onClick={() => show('G1', view.detailFor === o.id ? 'default' : 'detail')}
                        className="flex size-7 items-center justify-center rounded-lg hover:bg-highlight"
                      >
                        <CaretDown className={cn('size-4 text-muted transition-transform', view.detailFor === o.id && 'rotate-180')} />
                      </button>
                    </td>
                  </tr>
                  {view.detailFor === o.id && (
                    <tr className="border-t border-base bg-highlight/50">
                      <td colSpan={10} className="px-6 py-3">
                        <p className="mb-2 text-caption-sm font-medium text-muted">
                          Timeline · wire → order → delivered/failed
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {TIMELINE.map((t) => (
                            <div key={t.label} className="flex items-center gap-2 text-paragraph-xsmall">
                              <span className={cn('size-1.5 rounded-full', t.ok ? 'bg-(--text-success-base)' : 'bg-(--text-error-base)')} />
                              <span className="w-24 shrink-0 tabular-nums text-paragraph-xsmall text-muted">{t.at}</span>
                              <span className="text-primary">{t.label}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </PageBody>
    </>
  )
}
