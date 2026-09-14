import type { ExplorerGroupDef } from '@/components/playground/explorer'
import type {
  AppView,
  DashboardView,
  DocumentCaptureView,
  LoginView,
  OnboardingChatView,
  RegistrationFormView,
  SettingsView,
} from './types'

/**
 * Scenario catalog - same contract as multi-payroll's: every state is one
 * reproducible screen built fresh from its own seed, no leakage between
 * scenarios. First-slice scope only (see engine.ts's doc comment).
 */

interface StateDef {
  id: string
  label: string
  scope?: 'v1' | 'full'
  make: () => AppView
}

interface ScreenDef {
  id: string
  label: string
  states: Array<StateDef>
}

interface GroupDef {
  group: string
  screens: Array<ScreenDef>
}

const login = (view: LoginView): AppView => ({ kind: 'login', login: view })

const dashboard = (view: Partial<DashboardView>): AppView => ({
  kind: 'dashboard',
  dashboard: { mode: 'ai-native', surface: 'composed', emmaHealthy: true, summary: 'has-updates', ...view },
})

const onboardingChat = (view: OnboardingChatView): AppView => ({ kind: 'onboardingChat', onboardingChat: view })

const documentCapture = (view: DocumentCaptureView): AppView => ({ kind: 'documentCapture', documentCapture: view })

const registrationForm = (view: RegistrationFormView): AppView => ({
  kind: 'registrationForm',
  registrationForm: view,
})

const settings = (view: SettingsView): AppView => ({ kind: 'settings', settings: view })

export const SCENARIOS: Array<GroupDef> = [
  {
    group: 'A · Login (Feature 2)',
    screens: [
      {
        id: 'A1',
        label: 'A1 Biometric login',
        states: [
          {
            id: 'framing',
            label: 'Emma framing',
            make: () => login({ step: 'biometric-framing' }),
          },
          {
            id: 'prompting',
            label: 'Face ID prompting',
            make: () => login({ step: 'biometric-prompting' }),
          },
        ],
      },
      {
        id: 'A2',
        label: 'A2 Password login (fallback)',
        states: [
          { id: 'default', label: 'Default', make: () => login({ step: 'password' }) },
          { id: 'error', label: 'Incorrect credentials', make: () => login({ step: 'password', error: true }) },
        ],
      },
    ],
  },
  {
    group: 'B · Dynamic dashboard (Feature 4)',
    screens: [
      {
        id: 'B1',
        label: 'B1 Composed dashboard',
        states: [
          { id: 'default', label: 'Session summary + cards', make: () => dashboard({}) },
          {
            id: 'nothing-new',
            label: 'Nothing new since last visit',
            make: () => dashboard({ summary: 'nothing-new' }),
          },
          {
            id: 'fallback',
            label: 'Emma unavailable (fallback banner)',
            make: () => dashboard({ emmaHealthy: false, summary: 'dismissed' }),
          },
        ],
      },
      {
        id: 'B2',
        label: 'B2 Dashboard ↔ chat transition',
        states: [{ id: 'default', label: 'Mid-conversation', make: () => dashboard({ surface: 'chat' }) }],
      },
      {
        id: 'B3',
        label: 'B3 Traditional mode (Feature 1.3)',
        states: [{ id: 'default', label: 'Emma docked', make: () => dashboard({ mode: 'traditional' }) }],
      },
    ],
  },
  {
    group: 'C · Conversational onboarding (Feature 3)',
    screens: [
      {
        id: 'C1',
        label: 'C1 AI-native account creation',
        states: [
          { id: 'password', label: 'Capturing password', make: () => onboardingChat({ step: 'password' }) },
          { id: 'name', label: 'Capturing name', make: () => onboardingChat({ step: 'name' }) },
          {
            id: 'biometric-offer',
            label: 'Face ID offer',
            make: () => onboardingChat({ step: 'biometric-offer' }),
          },
        ],
      },
      {
        id: 'C2',
        label: 'C2 Document-driven capture',
        states: [
          { id: 'requesting', label: 'Requesting a photo', make: () => documentCapture({ stage: 'requesting' }) },
          { id: 'extracting', label: 'Extracting details', make: () => documentCapture({ stage: 'extracting' }) },
          {
            id: 'review',
            label: 'Review + confirm (SSN flagged)',
            make: () => documentCapture({ stage: 'review' }),
          },
        ],
      },
      {
        id: 'C3',
        label: 'C3 Form-based fallback',
        states: [
          { id: 'default', label: 'Default', make: () => registrationForm({}) },
          {
            id: 'error',
            label: 'Email already registered',
            make: () => registrationForm({ error: true }),
          },
        ],
      },
    ],
  },
  {
    group: 'D · Mode & settings (Feature 1.1)',
    screens: [
      {
        id: 'D1',
        label: 'D1 Experience mode picker',
        states: [
          { id: 'ai-native', label: 'AI-native selected', make: () => settings({ mode: 'ai-native' }) },
          { id: 'traditional', label: 'Traditional selected', make: () => settings({ mode: 'traditional' }) },
          {
            id: 'switch-failed',
            label: 'Switch failed (non-blocking toast)',
            make: () => settings({ mode: 'ai-native', toastError: true }),
          },
        ],
      },
    ],
  },
]

/** Every real catalog screen id - lets canvas focus events know whether a
 *  clicked window belongs to the reviewable matrix (vs. e.g. the App). */
export const CATALOG_SCREEN_IDS = new Set(SCENARIOS.flatMap((g) => g.screens.map((s) => s.id)))

/** Serializable catalog for the explorer panels (no make functions). */
export const EXPLORER_CATALOG: Array<ExplorerGroupDef> = SCENARIOS.map((g) => ({
  group: g.group,
  screens: g.screens.map((s) => ({
    id: s.id,
    label: s.label,
    states: s.states.map(({ id, label, scope }) => ({ id, label, scope })),
  })),
}))

const FALLBACK: AppView = SCENARIOS[0].screens[0].states[0].make()

export function makeView(screenId: string, stateId: string): AppView {
  for (const group of SCENARIOS) {
    for (const screen of group.screens) {
      if (screen.id !== screenId) continue
      const state = screen.states.find((s) => s.id === stateId) ?? screen.states[0]
      return state ? state.make() : FALLBACK
    }
  }
  return FALLBACK
}

/** Caption text: "<screen> - <state>". */
export function describeSelection(screenId: string, stateId: string): string {
  for (const group of SCENARIOS) {
    for (const screen of group.screens) {
      if (screen.id !== screenId) continue
      const state = screen.states.find((s) => s.id === stateId)
      return state ? `${screen.label} - ${state.label}` : screen.label
    }
  }
  return screenId
}
