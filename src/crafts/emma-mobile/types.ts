/**
 * AppView - everything a screen needs to render one exact state, same
 * "fresh view per state, no leakage between scenarios" contract as the
 * multi-payroll craft. Scope so far (see engine.ts's doc comment for
 * what's still deferred): Feature 1.1/1.2 (mode + fallback), Feature 2
 * (biometric + password login), Feature 3 (conversational onboarding,
 * document capture, form fallback), and Feature 4 (dashboard composition,
 * card system, dashboard<->chat, traditional mode) from the Emma Mobile PRD.
 */

export type LoginStep = 'biometric-framing' | 'biometric-prompting' | 'password'

export interface LoginView {
  step: LoginStep
  /** password step only - inline "incorrect credentials" state. */
  error?: boolean
}

export type DashboardMode = 'ai-native' | 'traditional'
export type DashboardSurface = 'composed' | 'chat'
export type SummaryState = 'has-updates' | 'nothing-new' | 'dismissed'

export interface ChatMessage {
  from: 'emma' | 'user'
  text: string
}

export interface DashboardView {
  mode: DashboardMode
  surface: DashboardSurface
  /** Emma/API health (PRD Function 1.2) - false suppresses the greeting,
   *  summary and quick-prompts and shows the non-blocking fallback banner;
   *  cards still render via the deterministic fallback order. */
  emmaHealthy: boolean
  summary: SummaryState
  /** Chat surface only - seeded conversation shown before the live input. */
  chatMessages?: Array<ChatMessage>
  /** Live App only - real, mutable dismissed-card ids. */
  dismissedCardIds?: Array<string>
}

/* ---------------- Feature 3: conversational onboarding ---------------- */

export type OnboardingStep = 'password' | 'name' | 'biometric-offer'

export interface OnboardingChatView {
  step: OnboardingStep
}

export type DocumentCaptureStage = 'requesting' | 'extracting' | 'review'

export interface DocumentCaptureView {
  stage: DocumentCaptureStage
}

export interface RegistrationFormView {
  /** Inline validation errors shown adjacent to the offending fields. */
  error?: boolean
}

/* ---------------- Feature 1.1: mode & settings ---------------- */

export interface SettingsView {
  mode: DashboardMode
  /** A failed mode-switch render - PRD 1.1's non-blocking toast, the app
   *  stays on the current mode. */
  toastError?: boolean
}

export type AppView =
  | { kind: 'login'; login: LoginView }
  | { kind: 'dashboard'; dashboard: DashboardView }
  | { kind: 'onboardingChat'; onboardingChat: OnboardingChatView }
  | { kind: 'documentCapture'; documentCapture: DocumentCaptureView }
  | { kind: 'registrationForm'; registrationForm: RegistrationFormView }
  | { kind: 'settings'; settings: SettingsView }
