import { useState } from 'react'
import {
  CheckCircle,
  ClockCountdown,
  Download,
  FileX,
  LockKey,
  ShieldCheck,
  ShieldWarning,
  XCircle,
} from '@phosphor-icons/react'
import type { RecipientAccessView } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExplorer } from '@/components/playground/explorer'

/**
 * D group - the external recipient's secure-link journey (PRD Fn 2.3).
 * No Niural chrome at all - standalone pages a non-org recipient opens
 * from an email link. These have no Figma reference yet ("new screens
 * needed" per the UX-flow doc) - built from the PRD's copy/spec.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center bg-surface-2 p-6 text-text-primary">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-background-base p-8 text-center shadow-card">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary text-text-on-color">
          <ShieldCheck weight="fill" className="size-4" />
        </div>
        {children}
      </div>
    </div>
  )
}

function EmailEntry({ reportName }: { reportName?: string }) {
  const { show } = useExplorer()
  return (
    <Frame>
      <p className="text-label-md">Verify your email to view this report</p>
      <p className="text-paragraph-xs text-text-muted">
        {reportName ?? 'A report'} is ready. Enter the email address this link was sent to.
      </p>
      <Input type="email" placeholder="you@company.com" className="text-center" />
      <Button className="w-full" onClick={() => show('D2', 'sent')}>
        <span className="px-1">Continue</span>
      </Button>
    </Frame>
  )
}

function OtpStep({ view }: { view: RecipientAccessView }) {
  const { show } = useExplorer()
  const [cooldown] = useState(60)
  const wrong = view.step === 'otp-wrong'
  const locked = view.step === 'otp-locked'

  if (locked) {
    return (
      <Frame>
        <LockKey weight="fill" className="size-6 text-text-error-base" />
        <p className="text-label-md">Too many attempts</p>
        <p className="text-paragraph-xs text-text-muted">
          This link is temporarily locked for {view.recipientEmail}. Try again in a few minutes, or request a new
          link from the schedule owner.
        </p>
      </Frame>
    )
  }

  return (
    <Frame>
      <p className="text-label-md">Enter the code we sent you</p>
      <p className="text-paragraph-xs text-text-muted">
        We sent a 6-digit code to <strong className="text-text-primary">{view.recipientEmail}</strong>. It expires in
        10 minutes.
      </p>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex size-9 items-center justify-center rounded-lg border border-input text-label-sm"
          >
            {wrong && i === 0 ? '9' : ''}
          </div>
        ))}
      </div>
      {wrong && (
        <p className="flex items-center gap-1 text-caption-md text-text-error-base">
          <XCircle className="size-3.5" />
          Incorrect code - {view.attemptsLeft} attempts remaining
        </p>
      )}
      <Button className="w-full" onClick={() => show('D3', 'default')}>
        <span className="px-1">Verify</span>
      </Button>
      <button type="button" disabled className="flex items-center gap-1 text-caption-md text-text-muted">
        <ClockCountdown className="size-3.5" />
        Resend in {cooldown}s
      </button>
    </Frame>
  )
}

function DownloadReady({ reportName }: { reportName?: string }) {
  return (
    <Frame>
      <CheckCircle weight="fill" className="size-6 text-text-success-base" />
      <p className="text-label-md">Your report is ready</p>
      <p className="text-paragraph-xs text-text-muted">{reportName ?? 'Report'} · generated Jul 15, 2026 · .xlsx</p>
      <Button className="w-full">
        <Download />
        <span className="px-1">Download report</span>
      </Button>
      <p className="text-caption-md text-text-muted">This link stays active until it expires 7 days after generation.</p>
    </Frame>
  )
}

function ExpiredOrUnavailable({ view }: { view: RecipientAccessView }) {
  if (view.step === 'expired') {
    return (
      <Frame>
        <ClockCountdown weight="fill" className="size-6 text-text-muted" />
        <p className="text-label-md">This link has expired</p>
        <p className="text-paragraph-xs text-text-muted">
          Links expire 7 days after the report is generated. Contact the schedule owner for a new copy.
        </p>
      </Frame>
    )
  }
  if (view.step === 'unavailable') {
    return (
      <Frame>
        <FileX weight="fill" className="size-6 text-text-muted" />
        <p className="text-label-md">This report is no longer available</p>
        <p className="text-paragraph-xs text-text-muted">
          The link was valid, but the report has since been removed. Contact the schedule owner.
        </p>
      </Frame>
    )
  }
  return (
    <Frame>
      <ShieldWarning weight="fill" className="size-6 text-text-muted" />
      <p className="text-label-md">You don't have access to this report</p>
      <p className="text-paragraph-xs text-text-muted">
        Your access to this schedule has changed. Contact the schedule owner if you believe this is a mistake.
      </p>
    </Frame>
  )
}

export function RecipientAccessScreen({ view }: { view: RecipientAccessView }) {
  switch (view.step) {
    case 'email-entry':
      return <EmailEntry reportName={view.reportName} />
    case 'otp-sent':
    case 'otp-wrong':
    case 'otp-locked':
      return <OtpStep view={view} />
    case 'download-ready':
      return <DownloadReady reportName={view.reportName} />
    case 'expired':
    case 'unavailable':
    case 'revoked':
      return <ExpiredOrUnavailable view={view} />
  }
}
