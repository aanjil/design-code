import { ClockCountdown, Signature } from '@phosphor-icons/react'
import type { FcaView } from '../types'
import { COOLING_OFF_ESTIMATE, FCA_CATEGORIZATION_QUESTIONS, FCA_RISK_QUESTIONS } from '@/mocks/split-pay'
import { FlowShell, FormCard, OptionRow } from '../ui'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'
import { cn } from '@/lib/utils'

/**
 * C group - FCA sequence (§3): categorization → agreement (scroll-to-end
 * + sign, standalone) → risk assessment (fail = retry with fresh
 * questions, no shame copy) → cooling off. PASS routes to the cooling-off
 * card state, never a "done" success screen.
 */

const DISCLOSURE_PARAS = [
  'Cryptoassets are high-risk investments. The value of USDC targets the US dollar, so its value in pounds sterling changes with exchange rates.',
  'Cryptoassets are not covered by the Financial Services Compensation Scheme (FSCS). If something goes wrong, you are unlikely to get your money back.',
  'You should not invest more than 10% of your net assets in high-risk investments.',
  'The portion of your pay converted to USDC may be worth less in pounds when you spend or convert it than on the day you received it.',
  'You can turn split payment off at any time. Your full pay then goes to your bank account from the next cycle.',
  'By signing below you confirm you have read and understood these risks, and that you are choosing to receive part of your pay in cryptoassets.',
]

export function FcaScreen({ view }: { view: FcaView }) {
  const { show } = useExplorer()

  if (view.step === 'categorization') {
    const q = FCA_CATEGORIZATION_QUESTIONS[0]
    return (
      <FlowShell title="Investor categorization" progress="Regulatory steps · 1 of 3">
        <div className="flex flex-col gap-4">
          <FormCard className="flex flex-col gap-3">
            <p className="text-label-sm text-text-primary">{q.q}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => (
                <OptionRow key={opt} label={opt} selected={i === 0} />
              ))}
            </div>
          </FormCard>
          <div className="flex justify-end">
            <Button onClick={() => show('C2', 'unscrolled')}>
              <span className="px-1">Continue</span>
            </Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  if (view.step === 'agreement') {
    const scrolled = !!view.scrolledToEnd
    return (
      <FlowShell title="Risk disclosure and investor agreement" progress="Regulatory steps · 2 of 3">
        <div className="flex flex-col gap-4">
          <FormCard className="flex flex-col gap-3">
            <div className="relative max-h-64 overflow-y-auto rounded-lg border border-border-highlight p-4">
              <div className="flex flex-col gap-3 text-paragraph-xs text-text-muted">
                {DISCLOSURE_PARAS.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              {!scrolled && (
                <div className="pointer-events-none sticky right-0 -bottom-4 left-0 h-12 bg-gradient-to-t from-background-base to-transparent" />
              )}
            </div>
            {!scrolled && (
              <p className="text-caption-md text-text-muted">Read to the end to enable accept.</p>
            )}
            <div
              className={cn(
                'flex h-16 items-center justify-center rounded-lg border border-dashed',
                scrolled ? 'border-brand-primary' : 'border-border-highlight opacity-50',
              )}
            >
              {scrolled ? (
                <span className="font-serif text-lg text-text-primary italic">Amelia Clarke</span>
              ) : (
                <span className="flex items-center gap-1.5 text-caption-md text-text-muted">
                  <Signature className="size-4" />
                  Signature
                </span>
              )}
            </div>
          </FormCard>
          <div className="flex justify-end">
            <Button disabled={!scrolled} onClick={() => show('C3', 'questions')}>
              <span className="px-1">Accept and sign</span>
            </Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  if (view.step === 'risk' || view.step === 'risk-fail') {
    const failed = view.step === 'risk-fail'
    return (
      <FlowShell title="Risk assessment" progress="Regulatory steps · 3 of 3">
        <div className="flex flex-col gap-4">
          {failed && (
            <div className="rounded-xl bg-background-warning-muted px-4 py-3 text-paragraph-xs text-text-primary">
              That didn't pass this time. Have another look at the risk disclosure, then try again
              with a fresh set of questions.
            </div>
          )}
          {FCA_RISK_QUESTIONS.map((q, qi) => (
            <FormCard key={q.q} className="flex flex-col gap-3">
              <p className="text-label-sm text-text-primary">{q.q}</p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, i) => (
                  <OptionRow key={opt} label={opt} selected={!failed && i === q.correct && qi === 0} />
                ))}
              </div>
            </FormCard>
          ))}
          <div className="flex justify-end">
            <Button onClick={() => (failed ? show('C3', 'questions') : show('C4', 'default'))}>
              <span className="px-1">{failed ? 'Try again' : 'Submit answers'}</span>
            </Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  // cooling off - full-screen status (§3)
  return (
    <FlowShell title="Cooling off">
      <FormCard className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-background-warning-muted">
          <ClockCountdown className="size-6 text-text-warning-base" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-label-md text-text-primary">One short wait before you're ready</p>
          <p className="max-w-md text-paragraph-xs text-text-muted">
            UK regulation requires a short cooling-off period after your risk assessment. It applies
            to everyone - it's not about you. Typically clears within {COOLING_OFF_ESTIMATE}. We'll
            email you the moment it's done. Nothing needed from you.
          </p>
        </div>
        <Button variant="secondary" onClick={() => show('A4', 'cooling-off')}>
          <span className="px-1">Back to payment methods</span>
        </Button>
      </FormCard>
    </FlowShell>
  )
}
