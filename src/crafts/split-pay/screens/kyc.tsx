import { IdentificationCard } from '@phosphor-icons/react'
import type { KycView } from '../types'
import { KYC_DYNAMIC_STEPS, SPLIT_EMPLOYEE } from '@/mocks/split-pay'
import { FlowShell, FormCard, OptionRow, ReadonlyField } from '../ui'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * B group - KYC. Details form auto-filled + editable (§2.1); dynamic
 * Transak question steps render from one generic template; Onfido is a
 * hosted handoff - only entry + return screens are ours (§2.2).
 * Total steps = 2 fixed (details, Onfido) + dynamic count.
 */

const TOTAL_STEPS = 2 + KYC_DYNAMIC_STEPS.length

export function KycScreen({ view }: { view: KycView }) {
  const { show } = useExplorer()

  if (view.step === 'details') {
    return (
      <FlowShell title="Confirm your details" progress={`Step 1 of ${TOTAL_STEPS}`}>
        <div className="flex flex-col gap-4">
          <p className="text-paragraph-xs text-text-muted">
            We've filled in what we already know. Check everything and correct anything that's
            changed.
          </p>
          <FormCard className="flex flex-col gap-3">
            <p className="text-label-xs text-text-muted">Personal</p>
            <div className="grid grid-cols-2 gap-3">
              <ReadonlyField label="Full name" value={SPLIT_EMPLOYEE.name} />
              <ReadonlyField label="Date of birth" value="18/04/1993" />
            </div>
            <p className="pt-1 text-label-xs text-text-muted">Address</p>
            <ReadonlyField label="Home address" value={SPLIT_EMPLOYEE.address} />
            <ReadonlyField label="Country" value={SPLIT_EMPLOYEE.country} />
          </FormCard>
          <div className="flex justify-end">
            <Button onClick={() => show('B1', 'dynamic-1')}>
              <span className="px-1">Continue</span>
            </Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  if (view.step === 'dynamic') {
    const idx = view.dynamicIndex ?? 0
    const q = KYC_DYNAMIC_STEPS[idx]
    return (
      <FlowShell title="Confirm your details" progress={`Step ${2 + idx} of ${TOTAL_STEPS}`}>
        <div className="flex flex-col gap-4">
          <FormCard className="flex flex-col gap-3">
            <p className="text-label-sm text-text-primary">{q.question}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <OptionRow key={opt} label={opt} selected={opt === q.answer} />
              ))}
            </div>
          </FormCard>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                idx + 1 < KYC_DYNAMIC_STEPS.length
                  ? show('B1', 'dynamic-2')
                  : show('B2', 'entry')
              }
            >
              <span className="px-1">Continue</span>
            </Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  if (view.step === 'onfido') {
    return (
      <FlowShell title="Verify with a photo ID and selfie" progress={`Step ${TOTAL_STEPS} of ${TOTAL_STEPS}`}>
        <FormCard className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-muted">
            <IdentificationCard className="size-6 text-brand-text" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-label-md text-text-primary">Verify with a photo ID and selfie</p>
            <p className="max-w-sm text-paragraph-xs text-text-muted">
              Transak uses Onfido to check your ID. Have your passport or driving licence ready.
              Takes about 5 minutes.
            </p>
          </div>
          <Button onClick={() => show('B2', 'return')}>
            <span className="px-1">Start verification</span>
          </Button>
        </FormCard>
      </FlowShell>
    )
  }

  if (view.step === 'onfido-return') {
    return (
      <FlowShell title="Verification submitted">
        <FormCard className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-background-success-muted">
            <IdentificationCard className="size-6 text-text-success-base" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-label-md text-text-primary">Documents submitted</p>
            <p className="max-w-sm text-paragraph-xs text-text-muted">
              Transak is reviewing your identity. Nothing needed from you - we'll email you as soon
              as it's done, usually within a few hours.
            </p>
          </div>
          <Button variant="secondary" onClick={() => show('A4', 'in-review')}>
            <span className="px-1">Back to payment methods</span>
          </Button>
        </FormCard>
      </FlowShell>
    )
  }

  // rejected (§2.3) - plain headline, Transak status verbatim in detail line
  return (
    <FlowShell title="Identity verification">
      <FormCard className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-background-error-highlight">
          <IdentificationCard className="size-6 text-text-error-base" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-label-md text-text-primary">We couldn't verify your identity</p>
          <p className="max-w-sm text-paragraph-xs text-text-muted">
            {view.retryBlocked
              ? "Verification can't be retried automatically. Our support team can help you finish this."
              : "This sometimes happens when a document is blurry or details don't match. You can try again."}
          </p>
          <p className="pt-1 text-caption-md text-text-muted">
            Transak status: REJECTED · Document could not be read
          </p>
        </div>
        {view.retryBlocked ? (
          <Button variant="secondary">
            <span className="px-1">Contact support</span>
          </Button>
        ) : (
          <Button onClick={() => show('B1', 'details')}>
            <span className="px-1">Restart verification</span>
          </Button>
        )}
      </FormCard>
    </FlowShell>
  )
}
