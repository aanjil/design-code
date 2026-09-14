import { useState } from 'react'
import { Camera, CheckCircle, Paperclip, WarningCircle } from '@phosphor-icons/react'
import type { DocumentCaptureView, OnboardingChatView, RegistrationFormView } from '../types'
import { EXTRACTED_DOCUMENT_FIELDS, ONBOARDING_MESSAGES } from '../engine'
import {
  MobileAppHeader,
  MobileChatBubble,
  MobileHomeIndicator,
  MobileInputBar,
  MobileStatusBar,
} from '@/components/nds-mobile'
import { Banner } from '@/components/nds/feedback'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Feature 3 (Conversational Onboarding & Registration) - 3.1's chat capture,
 * 3.2's document-driven capture, and 3.3's conventional form fallback. Each
 * is its own screen (they're reached differently - form fallback especially
 * isn't a chat at all), unlike the dashboard's one-component-many-flags shape.
 */

function OnboardingChat({ view }: { view: OnboardingChatView }) {
  const { show } = useExplorer()
  const [input, setInput] = useState('')
  const { step } = view
  const messages = ONBOARDING_MESSAGES[step]
  const isOffer = step === 'biometric-offer'

  function handleSend() {
    if (!input.trim()) return
    if (step === 'password') show('C1', 'name')
    else if (step === 'name') show('C1', 'biometric-offer')
    setInput('')
  }

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <MobileStatusBar />
      <MobileAppHeader title="Create your account" />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
        {messages.map((m, i) => (
          <MobileChatBubble key={i} from={m.from}>
            {m.text}
          </MobileChatBubble>
        ))}
      </div>
      <div className="shrink-0 px-4 pt-1">
        {isOffer ? (
          <div className="flex gap-2 pb-4">
            <Button variant="secondary" size="lg" className="h-12 flex-1 rounded-xl" onClick={() => show('B1')}>
              <span className="px-1">Skip</span>
            </Button>
            <Button size="lg" className="h-12 flex-1 rounded-xl" onClick={() => show('B1')}>
              <span className="px-1">Turn on Face ID</span>
            </Button>
          </div>
        ) : (
          <MobileInputBar
            value={input}
            onChange={setInput}
            onSend={handleSend}
            placeholder={step === 'password' ? 'Create a password' : 'Full legal name'}
            showMic={false}
          />
        )}
      </div>
      <MobileHomeIndicator />
    </div>
  )
}

function Spinner() {
  return <div className="size-8 animate-spin rounded-full border-[3px] border-brand-muted border-t-brand-primary" />
}

function DocumentCapture({ view }: { view: DocumentCaptureView }) {
  const { show } = useExplorer()
  const { stage } = view

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <MobileStatusBar />
      <MobileAppHeader title="Verify your identity" />

      {stage === 'requesting' && (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
          <MobileChatBubble from="emma">
            To finish setting up your account, take a photo of a government ID - a driver&apos;s license or
            passport works.
          </MobileChatBubble>
          <div className="mt-auto flex flex-col gap-2 pb-6">
            <Button size="lg" className="h-12 rounded-xl" onClick={() => show('C2', 'extracting')}>
              <Camera weight="fill" className="size-[18px]" />
              <span className="px-1">Take a photo</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-12 rounded-xl"
              onClick={() => show('C2', 'extracting')}
            >
              <Paperclip weight="bold" className="size-[18px]" />
              <span className="px-1">Upload from library</span>
            </Button>
          </div>
        </div>
      )}

      {stage === 'extracting' && (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <Spinner />
          <p className="text-paragraph-sm text-text-muted">Reading your ID and extracting details...</p>
        </div>
      )}

      {stage === 'review' && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
          <p className="text-label-sm text-text-primary">Confirm what we found</p>
          {EXTRACTED_DOCUMENT_FIELDS.map((field) => (
            <div
              key={field.label}
              className={
                field.needsConfirmation
                  ? 'flex items-center justify-between gap-3 rounded-xl bg-background-warning-highlight p-3.5'
                  : 'flex items-center justify-between gap-3 rounded-xl bg-background-base p-3.5 shadow-card'
              }
            >
              <div className="min-w-0">
                <p className="text-caption-md text-text-muted">{field.label}</p>
                <p className="mt-0.5 text-paragraph-sm text-text-primary">{field.value}</p>
              </div>
              {field.needsConfirmation ? (
                <WarningCircle weight="fill" className="size-5 shrink-0 text-text-warning-base" />
              ) : (
                <CheckCircle weight="fill" className="size-5 shrink-0 text-text-success-base" />
              )}
            </div>
          ))}
          <div className="mt-2 pb-6">
            <Button size="lg" className="h-12 w-full rounded-xl" onClick={() => show('B1')}>
              <span className="px-1">Looks good, continue</span>
            </Button>
          </div>
        </div>
      )}

      <MobileHomeIndicator />
    </div>
  )
}

function RegistrationForm({ view }: { view: RegistrationFormView }) {
  const { show } = useExplorer()
  const [name, setName] = useState('Jordan Alexis Reyes')
  const [email, setEmail] = useState(view.error ? 'jordan@nexuscorp.com' : '')
  const [password, setPassword] = useState('')

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <MobileStatusBar />
      <MobileAppHeader title="Create your account" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-2">
        <p className="text-paragraph-sm text-text-muted">
          Prefer a regular form? Fill in your details below.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-xs text-text-muted">Full legal name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl bg-background-highlight px-3.5 text-paragraph-sm text-text-primary outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-xs text-text-muted">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-xl bg-background-highlight px-3.5 text-paragraph-sm text-text-primary outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-xs text-text-muted">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl bg-background-highlight px-3.5 text-paragraph-sm text-text-primary outline-none"
          />
        </div>

        {view.error && (
          <Banner tone="error" title="That email is already registered">
            Log in instead, or use a different email address.
          </Banner>
        )}

        <Button size="lg" className="mt-2 h-12 rounded-xl" onClick={() => show('B1')}>
          <span className="px-1">Create account</span>
        </Button>
        <button type="button" onClick={() => show('A2')} className="text-center text-label-xs text-brand-text">
          Already have an account? Log in
        </button>
      </div>
      <MobileHomeIndicator />
    </div>
  )
}

export function OnboardingChatScreen({ view }: { view: OnboardingChatView }) {
  return <OnboardingChat view={view} />
}

export function DocumentCaptureScreen({ view }: { view: DocumentCaptureView }) {
  return <DocumentCapture view={view} />
}

export function RegistrationFormScreen({ view }: { view: RegistrationFormView }) {
  return <RegistrationForm view={view} />
}
