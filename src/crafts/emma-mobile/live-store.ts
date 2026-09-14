import type { ChatMessage, DashboardMode, DashboardSurface, LoginStep, OnboardingStep } from './types'

/**
 * The Live App's real, mutable, localStorage-persisted state - same
 * external-store contract as multi-payroll's live-store.ts. Versioned from
 * day one (see that craft's live-store.ts for why: its shape changed
 * several times before this one existed, and an unversioned read of stale
 * localStorage crashed the app with a bare `undefined.id`).
 */

export interface LiveData {
  version: number
  loggedIn: boolean
  loginStep: LoginStep
  /** Set while walking Feature 3's account-creation chat; null the rest of
   *  the time (including once logged in). */
  onboardingStep: OnboardingStep | null
  mode: DashboardMode
  surface: DashboardSurface
  summaryDismissed: boolean
  dismissedCardIds: Array<string>
  chatMessages: Array<ChatMessage> | null
  /** Settings screen is layered over whichever mode is active, not a
   *  distinct step in the login/dashboard state machine. */
  viewingSettings: boolean
}

const CURRENT_VERSION = 2
const DATA_KEY = 'nds-live:emma-mobile:data'

/** Starts signed out, at the very first biometric-framing moment - lets the
 *  Live App walk the real first-run flow. */
function seed(): LiveData {
  return {
    version: CURRENT_VERSION,
    loggedIn: false,
    loginStep: 'biometric-framing',
    onboardingStep: null,
    mode: 'ai-native',
    surface: 'composed',
    summaryDismissed: false,
    dismissedCardIds: [],
    chatMessages: null,
    viewingSettings: false,
  }
}

function isCurrentShape(value: unknown): value is LiveData {
  return !!value && typeof value === 'object' && (value as LiveData).version === CURRENT_VERSION
}

let cached: LiveData | null = null

function read(): LiveData {
  if (cached) return cached
  try {
    const raw = window.localStorage.getItem(DATA_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    cached = isCurrentShape(parsed) ? parsed : seed()
  } catch {
    cached = seed()
  }
  return cached
}

function persist() {
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(cached))
  } catch {
    /* ignore (private mode / quota) */
  }
}

const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((l) => l())
}

function update(patch: Partial<LiveData>) {
  cached = { ...read(), ...patch }
  persist()
  emit()
}

export const liveStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  getSnapshot(): LiveData {
    return read()
  },
  /** SSR/hydration snapshot - always the empty seed (no localStorage on the server). */
  getServerSnapshot(): LiveData {
    return seed()
  },
  reset() {
    cached = seed()
    persist()
    emit()
  },
  setLoginStep(step: LoginStep) {
    update({ loginStep: step })
  },
  logIn() {
    update({ loggedIn: true, surface: 'composed' })
  },
  setSurface(surface: DashboardSurface) {
    update({ surface })
  },
  dismissSummary() {
    update({ summaryDismissed: true })
  },
  dismissCard(id: string) {
    const cur = read()
    update({ dismissedCardIds: [...cur.dismissedCardIds, id] })
  },
  setChatMessages(messages: Array<ChatMessage>) {
    update({ chatMessages: messages })
  },
  setOnboardingStep(step: OnboardingStep | null) {
    update({ onboardingStep: step })
  },
  setMode(mode: DashboardMode) {
    update({ mode })
  },
  setViewingSettings(viewing: boolean) {
    update({ viewingSettings: viewing })
  },
}
