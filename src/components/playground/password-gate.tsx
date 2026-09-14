import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Casual, client-side password gate for sharing a work-in-progress
 * craft link. Two ways in:
 * - the per-craft password (VITE_CRAFT_PASSWORD_HASHES) unlocks just that
 *   craft
 * - the admin password (VITE_ADMIN_PASSWORD_HASH) unlocks every craft
 * Only SHA-256 hashes are ever embedded in the client bundle - see
 * .env.local.example for how to generate one. This keeps casual visitors
 * out; it is not real security (there's no backend to verify against).
 * Unlock state persists in localStorage until cleared.
 */

const ADMIN_KEY = 'nds-auth:admin'
const expKey = (slug: string) => `nds-auth:exp:${slug}`

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function safeParseHashes(raw: string | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

function isUnlocked(slug: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return (
      window.localStorage.getItem(ADMIN_KEY) === '1' ||
      window.localStorage.getItem(expKey(slug)) === '1'
    )
  } catch {
    return false
  }
}

export function PasswordGate({
  slug,
  title,
  children,
}: {
  /** Matches the key used in VITE_CRAFT_PASSWORD_HASHES. */
  slug: string
  title: string
  children: React.ReactNode
}) {
  const [unlocked, setUnlocked] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (isUnlocked(slug)) setUnlocked(true)
  }, [slug])

  if (unlocked) return <>{children}</>

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    const hash = await sha256Hex(value)
    const adminHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH as string | undefined
    const expHashes = safeParseHashes(
      import.meta.env.VITE_CRAFT_PASSWORD_HASHES as string | undefined,
    )
    setChecking(false)

    if (adminHash && hash === adminHash) {
      window.localStorage.setItem(ADMIN_KEY, '1')
      setUnlocked(true)
      return
    }
    if (expHashes[slug] && hash === expHashes[slug]) {
      window.localStorage.setItem(expKey(slug), '1')
      setUnlocked(true)
      return
    }
    setError(true)
  }

  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-surface-0 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            This preview is password-protected. Ask Anjil for access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`gate-password-${slug}`}>Password</Label>
              <Input
                id={`gate-password-${slug}`}
                type="password"
                autoFocus
                autoComplete="off"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(false)
                }}
              />
              {error && (
                <p className="text-caption-md text-text-error-base">
                  That password isn't right - try again.
                </p>
              )}
            </div>
            <Button type="submit" disabled={!value || checking}>
              {checking ? 'Checking...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
