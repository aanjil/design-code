import { useState } from 'react'
import {
  ArrowLeft,
  Bank,
  Check,
  Clock,
  Gift,
  TrendDown,
  Wallet as WalletIcon,
  Warning,
  X,
} from '@phosphor-icons/react'
import type { BuyView, ReviewVariant } from '../types'
import {
  MAX_PURCHASE,
  MIN_PURCHASE,
  RUN_COST,
  TIERS,
  WIRE_DETAILS,
  WIRE_REFERENCE,
  fundPurchase,
  isPending,
  nextTier,
  num,
  perTokenRate,
  priceFor,
  usd,
} from '../engine'
import { ModalShell, Segmented, SettingsShell, settingsNavTarget } from '../ui'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Buy tokens - amount picker with volume-discount tiers, the v1 funding
 * breakdown (credit, then wallet, then whatever needs a bank transfer),
 * and the review/confirm modal's six variants. `qty` lives in local state
 * so the picker is genuinely live even inside a frozen catalog frame,
 * same convention as multi-payroll's wizard.
 */

function AmountPicker({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  const p = priceFor(qty)
  const bad = qty < MIN_PURCHASE
  const nx = nextTier(qty)
  return (
    <div className="rounded-2xl bg-background-base p-4.5 shadow-card">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-label-sm text-text-primary">Amount</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-background-success-highlight px-2 py-0.5 text-caption-md text-text-success-base">
          {p.discountPct ? `${p.discountPct}% off` : 'no discount yet'}
        </span>
      </div>
      <div className={`flex h-14 items-baseline gap-2 rounded-lg border px-3 ${bad ? 'border-text-error-base' : 'border-border-highlight'}`}>
        <input
          type="text"
          inputMode="numeric"
          value={num(qty)}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '')
            onChange(digits === '' ? 0 : Math.min(parseInt(digits, 10), MAX_PURCHASE))
          }}
          className="min-w-0 flex-1 bg-transparent text-title-h4 text-text-primary outline-none"
        />
        <span className="text-paragraph-sm text-text-muted">tokens</span>
      </div>
      <p className={`mt-1.5 text-caption-md ${bad ? 'text-text-error-base' : 'text-text-muted'}`}>
        {bad ? 'Minimum purchase is 250 tokens' : `${usd(p.total)} at $${perTokenRate(qty).toFixed(3)} per token`}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t.threshold}
            type="button"
            onClick={() => onChange(t.threshold)}
            className={`rounded-full border px-2.5 py-1 text-caption-md ${
              qty === t.threshold
                ? 'border-brand-primary bg-brand-muted text-brand-text'
                : 'border-border-highlight text-text-muted'
            }`}
          >
            {num(t.threshold)}
            {t.discountPct ? ` · ${t.discountPct}%` : ''}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-brand-muted px-3 py-2 text-caption-md text-brand-text">
        {bad ? (
          <>
            <Warning weight="fill" className="size-3.5 shrink-0" />
            <span>Enter at least 250 tokens to continue.</span>
          </>
        ) : nx ? (
          <>
            <TrendDown weight="fill" className="size-3.5 shrink-0" />
            <span>
              {num(nx.threshold - qty)} more tokens gets you {nx.discountPct}% off - ${perTokenRate(nx.threshold).toFixed(3)}{' '}
              per token instead of ${perTokenRate(qty).toFixed(3)}.
            </span>
          </>
        ) : (
          <>
            <Check weight="bold" className="size-3.5 shrink-0" />
            <span>You're at the best available rate, ${perTokenRate(qty).toFixed(3)} per token.</span>
          </>
        )}
      </div>
      <p className="mt-2 text-caption-md text-text-muted">250 - 5,000 tokens per purchase</p>
    </div>
  )
}

export function BuyScreen({ view }: { view: BuyView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  const [qty, setQty] = useState(view.qty)
  const [method, setMethod] = useState(view.method)
  const [reviewVariant, setReviewVariant] = useState<ReviewVariant | null>(view.review ?? null)
  /** Snapshot of the balance the moment the review opened - in the Live
   *  App, confirming actually mutates the store and this component
   *  re-renders with `b.tokens` already incremented, so the success
   *  message must add `qty` to the pre-purchase number, not the post-
   *  purchase one, or it double-counts. */
  const [tokensBeforePurchase, setTokensBeforePurchase] = useState(b.tokens)

  const p = priceFor(qty)
  const bad = qty < MIN_PURCHASE
  const breakdown = fundPurchase(b, qty, view.mode, view.src)
  const pending = isPending(view.mode, view.src, breakdown)

  function openReview() {
    setTokensBeforePurchase(b.tokens)
    if (breakdown.add === 0) setReviewVariant('default')
    else setReviewVariant(method)
  }

  return (
    <SettingsShell
      active="tokens"
      title="Buy tokens"
      subtitle="Settings · AI"
      balances={{ tokens: b.tokens, credit: b.credit, wallet: b.wallet }}
      onNavigate={(key) => show(settingsNavTarget(key) ?? 'A1')}
      actions={
        <Button variant="ghost" size="sm" onClick={() => show('A1')}>
          <ArrowLeft className="size-4" />
          <span className="px-1">Back to tokens</span>
        </Button>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_292px] items-start gap-5">
        <div>
          <AmountPicker qty={qty} onChange={setQty} />

          <p className="mt-4 mb-1.5 text-label-sm text-text-primary">Payment</p>
          <div className="rounded-2xl bg-background-base p-4 shadow-card">
            <div className="flex flex-col gap-2.5">
              {breakdown.credit > 0 && (
                <PaymentRow icon={Gift} tone="success" label="Credit balance" value={usd(breakdown.credit)} />
              )}
              {breakdown.credit === 0 && (
                <PaymentRow icon={Gift} tone="muted" label="Credit balance" value="none available" />
              )}
              {breakdown.wallet > 0 && (
                <PaymentRow icon={WalletIcon} tone="default" label="Wallet balance" value={usd(breakdown.wallet)} />
              )}
              {breakdown.add > 0 && (
                <PaymentRow
                  icon={Bank}
                  tone="error"
                  label={method === 'ach' ? 'ACH debit you authorise' : 'Wire transfer you send'}
                  value={usd(breakdown.add)}
                />
              )}
            </div>
            <p className={`mt-2.5 border-t border-border-highlight pt-2.5 text-paragraph-xs ${breakdown.add > 0 ? 'text-text-error-base' : 'text-text-muted'}`}>
              {breakdown.add > 0
                ? `Credit is applied first, then your wallet. You'll add the remaining ${usd(breakdown.add)}.`
                : "Credit is always applied first. Anything left over comes from your wallet."}
            </p>
          </div>

          {breakdown.add > 0 && (
            <div className="mt-2.5 flex flex-col gap-2">
              <Segmented
                value={method}
                onChange={setMethod}
                options={[
                  { value: 'ach', label: 'ACH debit' },
                  { value: 'wire', label: 'Wire transfer' },
                ]}
              />
              <p className="text-paragraph-xs text-text-muted">
                {method === 'ach'
                  ? `We debit ${usd(breakdown.add)} from your linked account. Tokens are credited when it settles.`
                  : `You send ${usd(breakdown.add)} to Niural. We show the details and a reference code on the next screen.`}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-background-base p-4 shadow-card">
            <p className="mb-2.5 text-paragraph-xs text-text-muted">After this purchase</p>
            <DeltaRow
              label="Emma tokens"
              before={num(b.tokens)}
              after={num(b.tokens + qty)}
              trail={pending ? 'once your transfer settles' : `about ${Math.floor((b.tokens + qty) / RUN_COST)} payroll runs`}
            />
            {breakdown.credit > 0 && <DeltaRow label="Credit" before={usd(b.credit)} after={usd(b.credit - breakdown.credit)} />}
            {breakdown.wallet > 0 && <DeltaRow label="Wallet" before={usd(b.wallet)} after={usd(b.wallet - breakdown.wallet)} />}
            <p className="mt-3 border-t border-border-highlight pt-2.5 text-paragraph-xs text-text-muted">
              {breakdown.credit > 0
                ? `${usd(b.credit - breakdown.credit)} credit left after this. Credit also goes toward your Niural fee, so spending it here leaves less for that.`
                : `Your credit is untouched at ${usd(b.credit)} and stays available for your Niural fee.`}
            </p>
          </div>
        </div>

        <aside className="rounded-2xl bg-background-base p-4 shadow-card">
          <p className="mb-3.5 text-label-sm text-text-primary">Summary</p>
          <SummaryRow label="Tokens" value={num(qty)} />
          <SummaryRow label="Base price" value={usd(p.base)} />
          <SummaryRow label="Volume discount" value={p.discountPct ? `-${usd(p.base - p.total)}` : '—'} success={!!p.discountPct} />
          <div className="mt-2 flex items-center justify-between border-t border-border-highlight pt-2.5 text-label-md text-text-primary">
            <span>Total</span>
            <span>{usd(p.total)}</span>
          </div>
          <Button className="mt-3.5 w-full" disabled={bad} onClick={openReview}>
            <span className="px-1">Review purchase</span>
          </Button>
        </aside>
      </div>

      {reviewVariant && (
        <ReviewModal
          variant={reviewVariant}
          qty={qty}
          balances={{ tokens: tokensBeforePurchase, credit: b.credit }}
          breakdown={breakdown}
          method={method}
          wasBlocked={tokensBeforePurchase < RUN_COST}
          onClose={() => setReviewVariant(null)}
          onConfirm={() => {
            setReviewVariant(pending ? 'pending' : 'done')
            if (!pending) {
              show('D1', 'commit', { qty, spend: { credit: breakdown.credit, wallet: breakdown.wallet } })
            }
          }}
          onExit={() => show('A1')}
        />
      )}
    </SettingsShell>
  )
}

function PaymentRow({
  icon: RowIcon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType
  tone: 'success' | 'default' | 'error' | 'muted'
  label: string
  value: string
}) {
  const color =
    tone === 'success'
      ? 'text-text-success-base'
      : tone === 'error'
        ? 'text-text-error-base'
        : tone === 'muted'
          ? 'text-text-muted'
          : 'text-text-muted'
  return (
    <div className={`flex items-center gap-2 text-paragraph-sm ${tone === 'muted' ? 'opacity-50' : ''}`}>
      <RowIcon weight="fill" className={`size-4 shrink-0 ${color}`} />
      <span className="flex-1 text-text-primary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  )
}

function DeltaRow({ label, before, after, trail }: { label: string; before: string; after: string; trail?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 py-1 text-paragraph-xs">
      <span className="w-20 shrink-0 text-text-muted">{label}</span>
      <span className="text-text-muted">{before}</span>
      <ArrowLeft className="size-3.5 rotate-180 text-text-muted" />
      <span className="font-medium text-text-primary">{after}</span>
      {trail && <span className="text-caption-md text-text-muted">{trail}</span>}
    </div>
  )
}

function SummaryRow({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-paragraph-xs">
      <span className="text-text-muted">{label}</span>
      <span className={success ? 'text-text-success-base' : 'text-text-primary'}>{value}</span>
    </div>
  )
}

function ReviewModal({
  variant,
  qty,
  balances,
  breakdown,
  method,
  wasBlocked,
  onClose,
  onConfirm,
  onExit,
}: {
  variant: ReviewVariant
  qty: number
  balances: { tokens: number; credit: number }
  breakdown: { credit: number; wallet: number; add: number; total: number }
  method: 'ach' | 'wire'
  wasBlocked: boolean
  onClose: () => void
  onConfirm: () => void
  /** The terminal "Back to credits and tokens" / "Close" buttons leave the
   *  buy flow entirely, unlike the X and pre-confirm "Back," which just
   *  dismiss the modal and leave the amount picker as it was. */
  onExit: () => void
}) {
  if (variant === 'failed') {
    return (
      <ModalShell title="Purchase didn't go through" onClose={onClose}>
        <div className="py-4 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-background-error-highlight text-text-error-base">
            <X weight="bold" className="size-5" />
          </span>
          <p className="mt-3 text-label-md text-text-primary">Your bank declined the {usd(breakdown.total)} debit</p>
          <p className="mx-auto mt-1.5 max-w-[340px] text-paragraph-xs text-text-muted">
            No tokens were added and nothing left your account. Your credit balance is untouched at {usd(balances.credit)}.
          </p>
          <dl className="mx-auto mt-3.5 max-w-[340px] rounded-lg bg-background-highlight p-3 text-left text-paragraph-xs">
            <div className="flex justify-between py-0.5">
              <dt className="text-text-muted">Reason given</dt>
              <dd>Insufficient funds at Chase ···· 4417</dd>
            </div>
            <div className="flex justify-between py-0.5">
              <dt className="text-text-muted">Reference</dt>
              <dd>
                <code className="text-caption-md">TKN-FAIL-2291</code>
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={onExit}>
            <span className="px-1">Close</span>
          </Button>
          <Button onClick={onConfirm}>
            <span className="px-1">Try again</span>
          </Button>
        </div>
      </ModalShell>
    )
  }

  if (variant === 'done' || variant === 'pending' || variant === 'resume') {
    const showPending = variant === 'pending'
    return (
      <ModalShell title={showPending ? 'Transfer pending' : 'Purchase complete'} onClose={onClose}>
        <div className="py-4 text-center">
          <span
            className={`mx-auto flex size-11 items-center justify-center rounded-full ${
              showPending ? 'bg-brand-muted text-brand-text' : 'bg-background-success-highlight text-text-success-base'
            }`}
          >
            {showPending ? <Clock weight="fill" className="size-5" /> : <Check weight="bold" className="size-5" />}
          </span>
          <p className="mt-3 text-label-md text-text-primary">
            {showPending ? 'Waiting for your funds' : `${num(qty)} tokens added`}
          </p>
          <p className="mx-auto mt-1.5 max-w-[340px] text-paragraph-xs text-text-muted">
            {showPending
              ? `We'll add ${num(qty)} tokens as soon as ${usd(breakdown.add)} arrives, and email you when it does.`
              : `Your balance is now ${num(balances.tokens + qty)} tokens.`}
          </p>
          {(wasBlocked || variant === 'resume') && !showPending && (
            <div className="mx-auto mt-3.5 max-w-[360px] rounded-lg border border-brand-primary bg-brand-muted p-3 text-left">
              <p className="text-label-xs text-brand-text">Emma was part-way through your July payroll</p>
              <p className="mt-1 text-paragraph-xs text-brand-text">
                Steps 1 and 2 are still saved. Resuming picks up at step 3 rather than starting over.
              </p>
              <Button size="sm" className="mt-2">
                <span className="px-1">Resume payroll run</span>
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={onExit}>
            <span className="px-1">Back to credits and tokens</span>
          </Button>
        </div>
      </ModalShell>
    )
  }

  const wire = method === 'wire' && breakdown.add > 0

  return (
    <ModalShell title="Review purchase" onClose={onClose} width="w-[640px]">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-caption-md text-text-muted">You're buying</p>
          <div className="my-0.5 flex items-baseline gap-1.5">
            <span className="text-title-h4 text-text-primary">{num(qty)}</span>
            <span className="text-paragraph-sm text-text-muted">tokens</span>
          </div>
          <p className="text-caption-md text-text-muted">for {usd(breakdown.total)}</p>
          <p className="mt-4 mb-1.5 text-label-xs text-text-primary">Paying with</p>
          <div className="flex flex-col gap-2">
            {breakdown.credit > 0 && <SourceLine icon={Gift} label="Credit balance" value={usd(breakdown.credit)} tone="success" />}
            {breakdown.wallet > 0 && <SourceLine icon={WalletIcon} label="Wallet balance" value={usd(breakdown.wallet)} />}
            {breakdown.add > 0 && (
              <SourceLine
                icon={Bank}
                label={wire ? 'Wire transfer you send' : 'ACH debit from linked account'}
                value={usd(breakdown.add)}
              />
            )}
          </div>
          <div className="mt-3.5 rounded-lg bg-background-error-highlight p-2.5 text-caption-md text-text-error-base">
            This purchase is final. Tokens can't be refunded to cash or moved to another account.
          </div>
        </div>
        <div>
          {wire ? (
            <div>
              <p className="mb-1.5 text-label-xs text-text-primary">Wire transfer details</p>
              <dl className="rounded-lg bg-background-highlight p-3 text-paragraph-xs">
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">Amount to send</dt>
                  <dd className="font-medium">{usd(breakdown.add)}</dd>
                </div>
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">Reference</dt>
                  <dd>
                    <code className="rounded bg-brand-muted px-1 text-brand-text">{WIRE_REFERENCE}</code>
                  </dd>
                </div>
                {WIRE_DETAILS.map(([label, value]) => (
                  <div key={label} className="flex justify-between py-0.5">
                    <dt className="text-text-muted">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2.5 rounded-lg bg-brand-muted p-2.5 text-caption-md text-brand-text">
                Include the reference code. Without it we can't match your transfer and it may be returned.
              </div>
            </div>
          ) : breakdown.add > 0 ? (
            <div>
              <p className="mb-1.5 text-label-xs text-text-primary">ACH debit</p>
              <dl className="rounded-lg bg-background-highlight p-3 text-paragraph-xs">
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">Amount</dt>
                  <dd className="font-medium">{usd(breakdown.add)}</dd>
                </div>
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">From</dt>
                  <dd>Chase ···· 4417</dd>
                </div>
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">Expected</dt>
                  <dd>1-3 business days</dd>
                </div>
              </dl>
              <div className="mt-2.5 rounded-lg bg-brand-muted p-2.5 text-caption-md text-brand-text">
                We'll complete this purchase once the debit settles.
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-1.5 text-label-xs text-text-primary">What happens next</p>
              <dl className="rounded-lg bg-background-highlight p-3 text-paragraph-xs">
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">Tokens</dt>
                  <dd>Added right away</dd>
                </div>
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">Balance</dt>
                  <dd>
                    {num(balances.tokens)} → {num(balances.tokens + qty)}
                  </dd>
                </div>
                <div className="flex justify-between py-0.5">
                  <dt className="text-text-muted">Receipt</dt>
                  <dd>In your activity log</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          <span className="px-1">Back</span>
        </Button>
        <Button onClick={onConfirm}>
          <span className="px-1">{breakdown.add === 0 ? 'Confirm purchase' : wire ? "I've sent the transfer" : 'Authorise debit'}</span>
        </Button>
      </div>
    </ModalShell>
  )
}

function SourceLine({
  icon: LineIcon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  tone?: 'success'
}) {
  return (
    <div className="flex items-center gap-2 text-paragraph-xs">
      <LineIcon weight="fill" className={`size-4 shrink-0 ${tone === 'success' ? 'text-text-success-base' : 'text-text-muted'}`} />
      <span className="flex-1 text-text-primary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  )
}
