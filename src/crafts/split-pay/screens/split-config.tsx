import { CaretDown, CheckCircle } from '@phosphor-icons/react'
import type { SplitConfigView } from '../types'
import { ACTIVE_SPLIT, BANK_ACCOUNTS, SPLIT_EMPLOYEE, WALLET } from '@/mocks/split-pay'
import { Banner, FieldLabel, FlowShell, FormCard, GuaranteeNote } from '../ui'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'
import { cn } from '@/lib/utils'

/**
 * D group - split configuration (§4). Field order is fixed by the doc:
 * primary bank → wallet leg (%/£ segmented) → live preview (mandatory
 * caption) → network → review → confirmation. Edit = same form,
 * pre-filled, cutoff banner above the form.
 */

const gbp = (n: number) =>
  n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

function SegUnit({ unit }: { unit: 'percent' | 'amount' }) {
  return (
    <div className="flex h-8 w-fit items-center rounded-lg bg-background-highlight p-0.5">
      {(['percent', 'amount'] as const).map((u) => (
        <span
          key={u}
          className={cn(
            'flex h-full items-center rounded-md px-3 text-label-xs',
            unit === u ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted',
          )}
        >
          {u === 'percent' ? '%' : '£'}
        </span>
      ))}
    </div>
  )
}

export function SplitConfigScreen({ view }: { view: SplitConfigView }) {
  const { show } = useExplorer()
  const editing = view.mode === 'edit'
  const unit = view.unit ?? 'percent'
  const toWallet = unit === 'percent' ? (SPLIT_EMPLOYEE.lastNetPay * ACTIVE_SPLIT.percent) / 100 : ACTIVE_SPLIT.amount
  const toBank = SPLIT_EMPLOYEE.lastNetPay - toWallet

  if (view.stage === 'confirmation') {
    return (
      <FlowShell title={editing ? 'Edit split payment' : 'Set up split payment'}>
        <FormCard className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle weight="fill" className="size-10 text-text-success-base" />
          <div className="flex flex-col gap-1">
            <p className="text-label-md text-text-primary">
              {editing ? 'Split updated' : 'Split saved'}
            </p>
            <p className="text-paragraph-xs text-text-muted">
              Applies from your {ACTIVE_SPLIT.appliesFrom} pay cycle.
            </p>
          </div>
          <Button variant="secondary" onClick={() => show('A4', 'active')}>
            <span className="px-1">Back to payment methods</span>
          </Button>
        </FormCard>
      </FlowShell>
    )
  }

  if (view.stage === 'review') {
    return (
      <FlowShell title="Review your split">
        <div className="flex flex-col gap-4">
          <FormCard className="flex flex-col gap-3">
            {[
              { label: `${BANK_ACCOUNTS[0].bank} · ${BANK_ACCOUNTS[0].label}`, value: `${gbp(toBank)} estimated · rest of net pay` },
              { label: WALLET.label, value: unit === 'percent' ? `${ACTIVE_SPLIT.percent}% · ${gbp(toWallet)} estimated` : gbp(toWallet) },
              { label: 'Network', value: ACTIVE_SPLIT.network },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border-highlight py-2 last:border-0">
                <span className="shrink-0 text-paragraph-xs text-text-muted">{row.label}</span>
                <span className="text-right text-label-xs text-text-primary">{row.value}</span>
              </div>
            ))}
            <GuaranteeNote />
          </FormCard>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => show('D1', 'percent')}>
              <span className="px-1">Back</span>
            </Button>
            <Button onClick={() => show('D1', 'confirmation')}>
              <span className="px-1">Save split</span>
            </Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  // form
  return (
    <FlowShell title={editing ? 'Edit split payment' : 'Set up split payment'}>
      <div className="flex flex-col gap-4">
        {editing && (
          <Banner tone="info" title={`Changes made after the ${ACTIVE_SPLIT.cutoffDay}th apply from the next pay cycle.`} />
        )}

        <FormCard className="flex flex-col gap-4">
          {/* 1 - primary bank (selector only if >1 bank) */}
          <div>
            <FieldLabel required>Primary bank account</FieldLabel>
            <div className="flex h-8 items-center justify-between rounded-lg border border-input px-2.5 text-paragraph-xs text-text-primary">
              {BANK_ACCOUNTS[0].bank} · {BANK_ACCOUNTS[0].label} ·· {BANK_ACCOUNTS[0].last4}
              <CaretDown className="size-3.5 text-text-muted" />
            </div>
            <p className="mt-1 text-caption-md text-text-muted">
              Receives the rest of your pay, and any amount that can't reach your wallet.
            </p>
          </div>

          {/* 2 - wallet leg */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <FieldLabel required>To your crypto wallet</FieldLabel>
              <SegUnit unit={unit} />
            </div>
            <div className="flex h-8 items-center rounded-lg border border-input px-2.5 text-paragraph-xs text-text-primary">
              {unit === 'percent' ? `${ACTIVE_SPLIT.percent} %` : `£ ${ACTIVE_SPLIT.amount.toFixed(2)}`}
            </div>
          </div>

          {/* 3 - live preview */}
          <div className="rounded-xl bg-background-highlight px-3 py-2.5">
            {view.noHistory ? (
              <p className="text-paragraph-xs text-text-primary">
                {100 - ACTIVE_SPLIT.percent}% of net pay to your primary account, {ACTIVE_SPLIT.percent}% to your wallet.
              </p>
            ) : (
              <p className="text-paragraph-xs text-text-primary">
                Estimated to your primary account: <strong>{gbp(toBank)}</strong>
              </p>
            )}
            <p className="mt-0.5 text-caption-md text-text-muted">
              {view.noHistory
                ? 'Estimates appear after your first pay cycle.'
                : 'Based on your last net pay. Actual amounts vary by cycle.'}
            </p>
          </div>

          {/* 4 - network */}
          <div>
            <FieldLabel required>Network</FieldLabel>
            <div className="flex h-8 items-center justify-between rounded-lg border border-input px-2.5 text-paragraph-xs text-text-primary">
              {ACTIVE_SPLIT.network} · recommended
              <CaretDown className="size-3.5 text-text-muted" />
            </div>
            <p className="mt-1 text-caption-md text-text-muted">
              Must match your wallet. Funds sent on the wrong network can't be recovered.
            </p>
          </div>
        </FormCard>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => show('A4', editing ? 'active' : 'ready')}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button onClick={() => (editing ? show('D2', 'confirmation') : show('D1', 'review'))}>
            <span className="px-1">{editing ? 'Save changes' : 'Review split'}</span>
          </Button>
        </div>
      </div>
    </FlowShell>
  )
}
