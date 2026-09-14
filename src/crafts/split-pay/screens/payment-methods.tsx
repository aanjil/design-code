import { Bank, CurrencyEth, DotsThree, Plus } from '@phosphor-icons/react'
import type { PaymentMethodsView, WalletCardState } from '../types'
import { ACTIVE_SPLIT, BANK_ACCOUNTS, COOLING_OFF_ESTIMATE, WALLET } from '@/mocks/split-pay'
import type { PillTone } from '../ui'
import { ConfirmDialog, GuaranteeNote, ModalShell, StatusPill, StepTracker } from '../ui'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * A group - payment methods page: bank cards + the wallet card (§1.4,
 * one card, 12 states) + verification notice / consent / guardrail
 * modals. Waits are progress: amber, no error icons (§0).
 */

interface CardMeta {
  pill?: { tone: PillTone; label: string }
  line: string
  cta?: { label: string; to: [string, string] }
  /** 4-step tracker position (Verify=0 … Ready=3); undefined = no tracker. */
  trackerStep?: number
  nothingNeeded?: boolean
}

const CARD_META: Record<Exclude<WalletCardState, 'no-wallet'>, CardMeta> = {
  'verify-required': {
    pill: { tone: 'gray', label: 'Verification required' },
    line: 'One-time identity check needed',
    cta: { label: 'Verify now', to: ['A2', 'default'] },
    trackerStep: 0,
  },
  'verify-in-progress': {
    pill: { tone: 'amber', label: 'Verification in progress' },
    line: 'Pick up where you left off',
    cta: { label: 'Resume', to: ['B1', 'details'] },
    trackerStep: 0,
  },
  'in-review': {
    pill: { tone: 'amber', label: 'In review' },
    line: "Nothing needed from you. We'll email you.",
    trackerStep: 0,
    nothingNeeded: true,
  },
  'in-review-long': {
    pill: { tone: 'amber', label: 'In review' },
    line: 'Still being reviewed — this can take a little longer sometimes.',
    trackerStep: 0,
    nothingNeeded: true,
  },
  'fca-pending': {
    pill: { tone: 'amber', label: 'Regulatory steps' },
    line: 'Continue your regulatory steps',
    cta: { label: 'Continue', to: ['C1', 'default'] },
    trackerStep: 1,
  },
  'cooling-off': {
    pill: { tone: 'amber', label: 'Cooling off' },
    line: `Short regulatory wait. Typically ${COOLING_OFF_ESTIMATE}.`,
    trackerStep: 2,
    nothingNeeded: true,
  },
  activating: {
    pill: { tone: 'amber', label: 'Activating' },
    line: 'Setting up your account',
    trackerStep: 3,
    nothingNeeded: true,
  },
  ready: {
    pill: { tone: 'green', label: 'Ready' },
    line: 'Choose how much of your pay goes here',
    cta: { label: 'Set up split payment', to: ['D1', 'percent'] },
  },
  active: {
    pill: { tone: 'green', label: 'Active' },
    line: `${ACTIVE_SPLIT.percent}% of net pay each cycle`,
    cta: { label: 'Edit split', to: ['D2', 'form'] },
  },
  'needs-attention': {
    pill: { tone: 'red', label: 'Needs attention' },
    line: "We couldn't deliver your last crypto portion — it went to your bank instead.",
    cta: { label: 'Re-verify', to: ['B1', 'details'] },
  },
  off: {
    pill: { tone: 'gray', label: 'Off' },
    line: 'Split payment is off. Full pay goes to your bank.',
    cta: { label: 'Set up again', to: ['D1', 'percent'] },
  },
}

function BankCard({ bank }: { bank: (typeof BANK_ACCOUNTS)[number] }) {
  const { show } = useExplorer()
  return (
    <div className="flex items-center gap-3 rounded-xl bg-background-base p-4 shadow-card">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background-highlight">
        <Bank className="size-4.5 text-text-muted" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-label-sm text-text-primary">
          {bank.bank} · {bank.label}
          {bank.primary && (
            <span className="rounded bg-background-highlight px-1 text-caption-md text-text-muted">Primary</span>
          )}
        </p>
        <p className="text-paragraph-xs text-text-muted">Account ending {bank.last4}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Actions for ${bank.bank}`}
        onClick={() => show('E1', bank.primary ? 'bank-in-split' : 'last-bank')}
      >
        <DotsThree weight="bold" className="size-4" />
      </Button>
    </div>
  )
}

function WalletCard({ state }: { state: Exclude<WalletCardState, 'no-wallet'> }) {
  const { show } = useExplorer()
  const meta = CARD_META[state]
  const detail =
    state === 'needs-attention' ? 'Transak status: INACTIVE — re-verification required' : undefined

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-background-base p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background-highlight">
          <CurrencyEth className="size-4.5 text-text-muted" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-label-sm text-text-primary">
            {WALLET.label}
            {meta.pill && <StatusPill tone={meta.pill.tone}>{meta.pill.label}</StatusPill>}
          </p>
          <p className="text-paragraph-xs text-text-muted">{meta.line}</p>
          {detail && <p className="mt-0.5 text-caption-md text-text-muted">{detail}</p>}
        </div>
        {meta.cta && (
          <Button size="sm" variant={state === 'ready' || state === 'active' ? 'default' : 'secondary'} onClick={() => show(...meta.cta!.to)}>
            <span className="px-1">{meta.cta.label}</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Actions for wallet"
          onClick={() => show('E1', 'delete-wallet')}
        >
          <DotsThree weight="bold" className="size-4" />
        </Button>
      </div>
      {meta.trackerStep !== undefined && (
        <div className="border-t border-border-highlight pt-3">
          <StepTracker current={meta.trackerStep} nothingNeeded={meta.nothingNeeded} />
        </div>
      )}
    </div>
  )
}

export function PaymentMethodsScreen({ view }: { view: PaymentMethodsView }) {
  const { show } = useExplorer()
  const noWallet = view.wallet === 'no-wallet'

  return (
    <>
      <PageHeader
        title="Payment methods"
        actions={
          <Button variant="secondary" onClick={() => show('A2', 'default')}>
            <Plus />
            <span className="px-1">Add payment method</span>
          </Button>
        }
      />
      <PageBody className="relative flex flex-col gap-3 bg-surface-1">
        <div className="flex flex-col gap-2">
          {BANK_ACCOUNTS.map((b) => (
            <BankCard key={b.id} bank={b} />
          ))}
          {!noWallet && <WalletCard state={view.wallet as Exclude<WalletCardState, 'no-wallet'>} />}
        </div>

        {/* Split payment row - §1.4 "no wallet": visible, disabled. */}
        {noWallet && (
          <div className="flex items-center gap-3 rounded-xl bg-background-base p-4 opacity-70 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="text-label-sm text-text-primary">Split payment</p>
              <p className="text-paragraph-xs text-text-muted">
                Send part of your pay to a crypto wallet. Add a wallet to get started.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => show('A2', 'default')}>
              <span className="px-1">Add a crypto wallet</span>
            </Button>
          </div>
        )}

        {/* §1.2 verification notice - shows every time until KYC approved */}
        {view.modal === 'verify-notice' && (
          <ModalShell
            title="Verify your identity to add a crypto wallet"
            onClose={() => show('A1', 'no-wallet')}
            footer={
              <>
                <Button variant="secondary" onClick={() => show('A1', 'no-wallet')}>
                  <span className="px-1">Not now</span>
                </Button>
                <Button onClick={() => show('A3', 'default')}>
                  <span className="px-1">Verify now</span>
                </Button>
              </>
            }
          >
            <p className="text-paragraph-xs text-text-muted">
              Receiving part of your pay in stablecoins requires a one-time identity verification,
              handled by our partner Transak. Your regular pay is not affected.
            </p>
          </ModalShell>
        )}

        {/* §1.3 consent - deliberate accept, timestamped, no pre-ticked box */}
        {view.modal === 'consent' && (
          <ModalShell
            title="Share your details with Transak"
            onClose={() => show('A1', 'no-wallet')}
            width="w-[480px]"
            footer={
              <>
                <Button variant="secondary" onClick={() => show('A1', 'no-wallet')}>
                  <span className="px-1">Decline</span>
                </Button>
                <Button onClick={() => show('B1', 'details')}>
                  <span className="px-1">Agree and continue</span>
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-3 text-paragraph-xs text-text-muted">
              <p>To verify your identity, we'll share with Transak:</p>
              <ul className="flex flex-col gap-1.5">
                {['Full name', 'Home address', 'Date of birth', 'ID documents you provide'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-text-primary">
                    <span className="size-1 rounded-full bg-text-muted" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                This is required for UK identity verification.{' '}
                <span className="cursor-pointer text-brand-text">How Transak handles your data</span>
              </p>
              <GuaranteeNote />
            </div>
          </ModalShell>
        )}

        {/* §5.1 guardrail modals */}
        {view.modal === 'delete-bank-in-split' && (
          <ConfirmDialog
            title="This account is part of your split"
            body="Edit your split to remove it first."
            confirmLabel="Edit split"
            onCancel={() => show('A4', 'active')}
            onConfirm={() => show('D2', 'form')}
          />
        )}
        {view.modal === 'delete-last-bank' && (
          <ConfirmDialog
            title="You need at least one bank account"
            body="While split payment is active, one bank account must stay on file as a fallback."
            confirmLabel="OK"
            singleAction
            onCancel={() => show('A4', 'active')}
            onConfirm={() => show('A4', 'active')}
          />
        )}
        {view.modal === 'delete-wallet' && (
          <ConfirmDialog
            title="Removing your wallet turns off split payment"
            body="Your full pay will go to your primary bank account from the next cycle. You can set this up again anytime."
            confirmLabel="Remove wallet"
            danger
            guarantee
            onCancel={() => show('A4', 'active')}
            onConfirm={() => show('A4', 'off')}
          />
        )}
      </PageBody>
    </>
  )
}
