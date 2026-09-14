import type { EmailKind, EmailView } from '../types'
import { COOLING_OFF_ESTIMATE, SPLIT_EMPLOYEE } from '@/mocks/split-pay'
import { Button } from '@/components/ui/button'

/**
 * F group - transactional emails (§6). One template, six bodies.
 * Subjects sentence case; CTAs verb-first; B.6 leads with the guarantee.
 */

interface EmailDef {
  subject: string
  paragraphs: Array<string>
  cta?: string
}

const EMAILS: Record<EmailKind, EmailDef> = {
  'kyc-review': {
    subject: 'Split payment | Identity verification in progress',
    paragraphs: [
      `Hi ${SPLIT_EMPLOYEE.name.split(' ')[0]},`,
      "Your identity documents are with Transak for review. Nothing needed from you — we'll email you the moment it's done.",
    ],
    cta: 'View status',
  },
  'kyc-approved': {
    subject: 'Split payment | Identity verification approved',
    paragraphs: [
      `Hi ${SPLIT_EMPLOYEE.name.split(' ')[0]},`,
      'Good news — your identity verification is approved.',
      "Next up: a few short regulatory steps required for UK accounts. They take about ten minutes, and you can pick them up any time from Payment methods.",
    ],
  },
  'kyc-rejected': {
    subject: 'Split payment | Identity verification not approved',
    paragraphs: [
      `Hi ${SPLIT_EMPLOYEE.name.split(' ')[0]},`,
      "We couldn't verify your identity this time. This sometimes happens when a document is blurry or details don't match.",
      "You can restart verification whenever you're ready.",
    ],
    cta: 'Restart verification',
  },
  'cooling-off': {
    subject: "Split payment | One short step before you're ready",
    paragraphs: [
      `Hi ${SPLIT_EMPLOYEE.name.split(' ')[0]},`,
      `Your regulatory steps are done. UK regulation requires a short cooling-off period — typically ${COOLING_OFF_ESTIMATE} — before your account activates. It applies to everyone.`,
      "Nothing needed from you. We'll email you the moment you're ready.",
    ],
  },
  'vba-active': {
    subject: "Split payment | You're all set",
    paragraphs: [
      `Hi ${SPLIT_EMPLOYEE.name.split(' ')[0]},`,
      'Your crypto wallet is ready to receive part of your pay. Choose how much of each pay cycle goes there — the rest continues to your bank as usual.',
    ],
    cta: 'Set up split payment',
  },
  fallback: {
    subject: 'Split payment | Crypto portion sent to your bank instead',
    paragraphs: [
      `Hi ${SPLIT_EMPLOYEE.name.split(' ')[0]},`,
      'Your total pay was not affected.',
      "We couldn't deliver this cycle's crypto portion to your wallet, so it was paid to your primary bank account instead, in full.",
      'No action is needed for this cycle. If this keeps happening, we may ask you to re-verify your wallet.',
    ],
    cta: 'View payment methods',
  },
}

export function EmailScreen({ view }: { view: EmailView }) {
  const email = EMAILS[view.kind]
  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-y-auto bg-surface-2 px-6 py-10">
      <div className="w-full max-w-[520px]">
        {/* client chrome */}
        <div className="mb-3 rounded-xl bg-background-base p-4 shadow-card">
          <p className="text-caption-md text-text-muted">
            From: Niural &lt;no-reply@niural.com&gt; · To: {SPLIT_EMPLOYEE.email}
          </p>
          <p className="mt-1 text-label-sm text-text-primary">{email.subject}</p>
        </div>

        {/* template body */}
        <div className="overflow-hidden rounded-xl bg-background-base shadow-card">
          <div className="flex h-14 items-center border-b border-border-highlight px-6">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-primary text-label-sm text-text-on-color">
              N
            </span>
          </div>
          <div className="flex flex-col gap-3 px-6 py-6">
            {email.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-paragraph-sm text-text-primary">
                {p}
              </p>
            ))}
            {email.cta && (
              <div className="pt-2">
                <Button>
                  <span className="px-1">{email.cta}</span>
                </Button>
              </div>
            )}
          </div>
          <div className="border-t border-border-highlight px-6 py-4">
            <p className="text-caption-md text-text-muted">
              Niural · 447 Broadway, New York, NY · You're receiving this because split payment is
              set up on your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
