import { useEffect, useState } from 'react'
import {
  CaretLeft,
  CaretRight,
  Check,
  Desktop,
  GearSix,
  GlobeHemisphereWest,
  Headset,
  MoonStars,
  Palette,
  SignOut,
  Sun,
} from '@phosphor-icons/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useThemeMode } from '@/components/playground/theme-toggle'
import type { ThemeMode } from '@/components/playground/theme-toggle'
import { cn } from '@/lib/utils'

/**
 * Profile menu - opens from the AppBar avatar. Identity header (who + role
 * + org), Account settings, Appearance (system / dark / light - the real
 * playground theme), Language (BETA, mock: persisted choice, UI stays
 * English), Support, Logout. Language opens as an in-panel sub-view so
 * the flyout never stacks a second popover.
 */

export type ProfileRole = 'employer' | 'multi-entity' | 'contractor' | 'employee'

const PROFILE: Record<ProfileRole, { name: string; role: string; org: string; email: string }> = {
  employer: { name: 'Sam Bennett', role: 'Org owner', org: 'Nexus Corp', email: 'sam.bennett@nexuscorp.com' },
  'multi-entity': { name: 'Sam Bennett', role: 'Org owner · 3 entities', org: 'Nexus Corp Corp America', email: 'sam.bennett@nexuscorp.com' },
  contractor: { name: 'Sam Bennett', role: 'Contractor', org: 'Nexus Corp', email: 'sam.bennett@hey.com' },
  employee: { name: 'Sam Bennett', role: 'Employee · Product Designer', org: 'Nexus Corp', email: 'sam.bennett@nexuscorp.com' },
}

/** Mirrors the i18n locales the product ships (en/es/fr/de/ja/zh). */
const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'zh', label: 'Chinese', native: '中文' },
] as const

const LANG_KEY = 'nds-profile:language'

const THEMES: Array<{ mode: ThemeMode; icon: typeof Sun; label: string }> = [
  { mode: 'auto', icon: Desktop, label: 'System' },
  { mode: 'dark', icon: MoonStars, label: 'Dark' },
  { mode: 'light', icon: Sun, label: 'Light' },
]

export function ProfileAvatar({ square, size = 'md' }: { square?: boolean; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-brand-muted text-brand-text shadow-[0px_0px_0px_1px_var(--elevation-alpha-16)]',
        size === 'lg' ? 'size-10 text-label-sm' : 'size-9 text-label-xs',
        square ? 'rounded-[8px]' : 'rounded-full',
      )}
    >
      SB
    </span>
  )
}

export function ProfileMenu({
  role = 'employer',
  square,
  side = 'bottom',
  onAccountSettings,
}: {
  role?: ProfileRole
  square?: boolean
  /** 'right' for the mini rail AppBar. */
  side?: 'bottom' | 'right'
  onAccountSettings?: () => void
}) {
  const p = PROFILE[role]
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'main' | 'language'>('main')
  const [mode, setMode] = useThemeMode()
  const [lang, setLang] = useState<string>('en')

  useEffect(() => {
    try {
      setLang(window.localStorage.getItem(LANG_KEY) ?? 'en')
    } catch {
      /* ignore */
    }
  }, [])

  const pickLang = (code: string) => {
    setLang(code)
    try {
      window.localStorage.setItem(LANG_KEY, code)
    } catch {
      /* ignore */
    }
    setView('main')
  }
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setView('main')
      }}
    >
      <PopoverTrigger
        aria-label="Profile menu"
        className={cn(
          'shrink-0 transition-shadow focus-visible:shadow-border-focus data-popup-open:shadow-border-brand',
          square ? 'rounded-[8px]' : 'rounded-full',
        )}
      >
        <ProfileAvatar square={square} />
      </PopoverTrigger>
      <PopoverContent side={side} align="end" sideOffset={8} className="w-80 gap-0 p-0">
        {view === 'main' ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <ProfileAvatar square={square} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-label-md text-text-primary">{p.name}</p>
                <p className="truncate text-paragraph-xs text-text-muted">{p.role} · {p.org}</p>
              </div>
            </div>
            <Divider />
            <div className="flex flex-col p-1.5">
              <Row
                icon={GearSix}
                label="Account settings"
                onClick={() => {
                  onAccountSettings?.()
                  setOpen(false)
                }}
              />
              <div className="flex h-11 items-center gap-3 rounded-lg px-2.5">
                <Palette className="size-[18px] shrink-0 text-text-primary" />
                <span className="flex-1 text-label-sm text-text-primary">Appearance</span>
                <div role="radiogroup" aria-label="Appearance" className="flex items-center gap-0.5 rounded-full bg-background-highlight p-0.5">
                  {THEMES.map((t) => (
                    <button
                      key={t.mode}
                      type="button"
                      role="radio"
                      aria-checked={mode === t.mode}
                      aria-label={t.label}
                      title={t.label}
                      onClick={() => setMode(t.mode)}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full transition-colors',
                        mode === t.mode ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted hover:text-text-primary',
                      )}
                    >
                      <t.icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setView('language')}
                className="flex h-11 items-center gap-3 rounded-lg px-2.5 text-left transition-colors hover:bg-background-highlight"
              >
                <GlobeHemisphereWest className="size-[18px] shrink-0 text-text-primary" />
                <span className="text-label-sm text-text-primary">Language</span>
                <span className="rounded-md bg-background-success-muted px-1.5 text-caption-md text-text-success-base">BETA</span>
                <span className="ml-auto text-paragraph-sm text-text-muted">{current.native}</span>
                <CaretRight className="size-4 text-text-muted" />
              </button>
            </div>
            <Divider />
            <div className="p-1.5">
              <Row icon={Headset} label="Support" onClick={() => setOpen(false)} />
            </div>
            <Divider />
            <div className="p-1.5">
              <Row icon={SignOut} label="Logout" onClick={() => setOpen(false)} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 px-1.5 pt-1.5 pb-1">
              <button
                type="button"
                aria-label="Back"
                onClick={() => setView('main')}
                className="flex size-8 items-center justify-center rounded-lg text-text-primary hover:bg-background-highlight"
              >
                <CaretLeft className="size-4" />
              </button>
              <p className="text-label-sm text-text-primary">Language</p>
              <span className="rounded-md bg-background-success-muted px-1.5 text-caption-md text-text-success-base">BETA</span>
            </div>
            <div className="flex flex-col p-1.5 pt-0">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => pickLang(l.code)}
                  className="flex h-10 items-center gap-3 rounded-lg px-2.5 text-left transition-colors hover:bg-background-highlight"
                >
                  <span className="flex-1 text-label-sm text-text-primary">{l.native}</span>
                  {l.code !== 'en' && <span className="text-paragraph-xs text-text-muted">{l.label}</span>}
                  <span className="flex w-4 justify-center">{lang === l.code && <Check weight="bold" className="size-4 text-brand-text" />}</span>
                </button>
              ))}
            </div>
            <Divider />
            <p className="px-4 py-3 text-paragraph-xs text-text-muted">
              Translations are in beta. Some screens and emails may still show in English.
            </p>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function Row({ icon: I, label, onClick }: { icon: typeof Sun; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left text-label-sm text-text-primary transition-colors hover:bg-background-highlight"
    >
      <I className="size-[18px] shrink-0" />
      {label}
    </button>
  )
}

function Divider() {
  return <span className="h-px shrink-0 bg-border-highlight" />
}
