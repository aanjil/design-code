import { useState } from 'react'
import { ScanSmiley, Sparkle } from '@phosphor-icons/react'
import type { LoginView } from '../types'
import { DEMO_USER_NAME } from '../engine'
import { MobileScreen } from '@/components/nds-mobile'
import { Banner } from '@/components/nds/feedback'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Feature 2 - login is framed as a single continuous moment, not a screen
 * the user "clears": biometric framing/prompting share one full-bleed dark
 * background (PRD 2.1's "transition should feel continuous"); only the
 * password fallback (2.2) looks like a conventional app screen, since it's
 * explicitly the traditional, non-AI-framed path.
 */

function EmmaAvatar({ pulse }: { pulse?: boolean }) {
  return (
    <span
      className="flex size-14 items-center justify-center rounded-full"
      style={{ backgroundImage: 'linear-gradient(119.6deg, #714dff 30.8%, #e151ff 122.6%)' }}
    >
      <Sparkle
        weight="fill"
        className={pulse ? 'size-6 animate-pulse text-white' : 'size-6 text-white'}
      />
    </span>
  )
}

function BiometricLogin({ step }: { step: 'biometric-framing' | 'biometric-prompting' }) {
  const { show } = useExplorer()
  return (
    <MobileScreen dark chrome={false}>
      <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
        <EmmaAvatar pulse={step === 'biometric-prompting'} />
        {step === 'biometric-framing' ? (
          <p className="text-title-h6 text-white">
            {DEMO_USER_NAME}, let&apos;s log you in - initiating Face ID
          </p>
        ) : (
          <>
            <div className="flex size-20 items-center justify-center rounded-[28px] border border-white/15 bg-white/5">
              <ScanSmiley className="size-9 text-white" />
            </div>
            <p className="text-paragraph-sm text-white/70">Look at iPhone to unlock Niural</p>
          </>
        )}
      </div>
      <div className="pb-10 text-center">
        <button
          type="button"
          onClick={() => show('A2')}
          className="text-label-sm text-white/60 underline-offset-4 hover:underline"
        >
          Use password instead
        </button>
      </div>
    </MobileScreen>
  )
}

function PasswordLogin({ error }: { error?: boolean }) {
  const { show } = useExplorer()
  const [email, setEmail] = useState('jordan@nexuscorp.com')
  const [password, setPassword] = useState(error ? 'wrongpass' : '')

  return (
    <MobileScreen>
      <div className="flex h-full flex-col px-6 pt-10">
        <p className="text-title-h5 text-text-primary">Welcome, let&apos;s log you in</p>
        <p className="mt-1 text-paragraph-sm text-text-muted">Sign in with your Niural account.</p>

        <div className="mt-8 flex flex-col gap-3">
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

          {error && (
            <Banner tone="error" title="Email or password is incorrect">
              Double check your details and try again.
            </Banner>
          )}

          <Button size="lg" className="mt-2 h-12 rounded-xl" onClick={() => show('B1')}>
            <span className="px-1">Log in</span>
          </Button>
          <button type="button" className="text-center text-label-xs text-brand-text">
            Forgot password?
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 pb-10">
          <button
            type="button"
            onClick={() => show('C1', 'password')}
            className="text-label-xs text-text-muted underline-offset-4 hover:underline"
          >
            New here? Create an account
          </button>
          <div className="flex items-center gap-1.5">
            <ScanSmiley className="size-4 text-text-muted" />
            <button
              type="button"
              onClick={() => show('A1', 'framing')}
              className="text-label-sm text-text-muted underline-offset-4 hover:underline"
            >
              Use Face ID instead
            </button>
          </div>
        </div>
      </div>
    </MobileScreen>
  )
}

export function LoginScreen({ view }: { view: LoginView }) {
  if (view.step === 'password') return <PasswordLogin error={view.error} />
  return <BiometricLogin step={view.step} />
}
