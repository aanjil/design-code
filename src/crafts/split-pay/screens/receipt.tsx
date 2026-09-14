import { Bank, ClockCountdown, DownloadSimple, Wallet } from '@phosphor-icons/react'
import type { ReceiptView } from '../types'
import { ACTIVE_SPLIT, BANK_ACCOUNTS, SPLIT_EMPLOYEE } from '@/mocks/split-pay'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { Button } from '@/components/ui/button'

/**
 * E2 - paystub receipt (§5.2). Existing multi-account layout: two rows,
 * fiat only. Never: wallet address, network, USDC, hash. Pending state
 * replaces the download action - never a blank receipt. Snapshot rule:
 * figures frozen at generation.
 */

const gbp = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

export function ReceiptScreen({ view }: { view: ReceiptView }) {
  const toWallet = (SPLIT_EMPLOYEE.lastNetPay * ACTIVE_SPLIT.percent) / 100
  const toBank = SPLIT_EMPLOYEE.lastNetPay - toWallet

  return (
    <>
      <PageHeader
        title="Pay statement · Jul 2026"
        actions={
          view.pending ? undefined : (
            <Button variant="secondary">
              <DownloadSimple />
              <span className="px-1">Download</span>
            </Button>
          )
        }
      />
      <PageBody className="flex flex-col gap-3 bg-surface-1">
        <div className="rounded-xl bg-background-base p-5 shadow-card">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-label-md text-text-primary">{SPLIT_EMPLOYEE.name}</p>
              <p className="text-paragraph-xs text-text-muted">Pay period Jul 1 - Jul 31, 2026 · paid Jul 31</p>
            </div>
            <div className="text-right">
              <p className="text-caption-md text-text-muted">Net pay</p>
              <p className="font-mono text-mono-md text-text-primary">{gbp(SPLIT_EMPLOYEE.lastNetPay)}</p>
            </div>
          </div>

          <p className="mb-2 text-caption-md text-text-muted">Paid to</p>
          <div className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border-highlight py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-highlight">
                <Bank className="size-4 text-text-muted" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-xs text-text-primary">Primary account</p>
                <p className="text-caption-md text-text-muted">
                  {BANK_ACCOUNTS[0].bank} ·· {BANK_ACCOUNTS[0].last4}
                </p>
              </div>
              <span className="font-mono text-mono-xs text-text-primary">{gbp(toBank)}</span>
            </div>
            <div className="flex items-center gap-3 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-highlight">
                <Wallet className="size-4 text-text-muted" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-xs text-text-primary">Virtual account</p>
                <p className="text-caption-md text-text-muted">Used to deliver your crypto payout</p>
              </div>
              <span className="font-mono text-mono-xs text-text-primary">{gbp(toWallet)}</span>
            </div>
          </div>
        </div>

        {view.pending && (
          <div className="flex items-start gap-2 rounded-xl bg-background-info-muted px-4 py-3">
            <ClockCountdown className="mt-0.5 size-4 shrink-0 text-text-primary" />
            <p className="text-paragraph-xs text-text-primary">
              Receipt available once all payments complete. Your crypto portion is processing.
            </p>
          </div>
        )}
      </PageBody>
    </>
  )
}
