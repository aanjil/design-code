import { useEffect, useState } from 'react'
import { Desktop, Moon, Sun } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_EVENT = 'nds-theme-change'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  return stored === 'light' || stored === 'dark' || stored === 'auto'
    ? stored
    : 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
  document.documentElement.style.colorScheme = resolved
}

/**
 * Shared theme state - every consumer (rail toggle, floating dock, the
 * AppBar profile menu's Appearance switch) stays in sync via a window
 * event, and the choice persists in localStorage ('theme').
 */
export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setModeState] = useState<ThemeMode>('auto')

  useEffect(() => {
    const initial = getInitialMode()
    setModeState(initial)
    applyThemeMode(initial)
    const onChange = (e: Event) => setModeState((e as CustomEvent<ThemeMode>).detail)
    window.addEventListener(THEME_EVENT, onChange)
    return () => window.removeEventListener(THEME_EVENT, onChange)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  const setMode = (next: ThemeMode) => {
    applyThemeMode(next)
    try {
      window.localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }))
  }

  return [mode, setMode]
}

const icons: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Desktop,
}

export function ThemeToggle() {
  const [mode, setMode] = useThemeMode()

  function cycle() {
    setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light')
  }

  const Icon = icons[mode]
  const label = `Theme: ${mode}. Click to cycle light → dark → auto.`

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      <Icon />
    </Button>
  )
}
