/**
 * Emma Mobile - pure data for the prototyped slice of the PRD
 * (PRD_ Niural AI-Native Mobile App (_Emma Mobile_).md):
 *   - Feature 1 (Adaptive Mode Framework): mode toggle/settings, fallback banner
 *   - Feature 2 (AI-Native Authentication): biometric-first + password fallback
 *   - Feature 3 (Conversational Onboarding): account creation chat, document
 *     capture + extraction review, form-based fallback
 *   - Feature 4 (Dynamic AI Dashboard): composition, session summary,
 *     dashboard<->chat transition, the Action/Details/CTA card system
 *   - Feature 5 (Contextual Task Surfacing): three representative cards
 *     (clock-in, pay-stub, PTO suggestion) as compose-eligible data
 *
 * Deliberately NOT in this pass (real follow-up work, not stubbed): 5.2 (bulk
 * timesheet upload), and full tap-through flows for the Feature 5 cards
 * (clock-out, PTO submission, pay-stub detail) - the cards are real,
 * computed data, but their CTAs don't yet open a dedicated result screen.
 */

import type { Icon } from '@phosphor-icons/react'
import { CalendarPlus, Clock, Receipt } from '@phosphor-icons/react'
import type { ChatMessage, OnboardingStep } from './types'

/** Fixed "today" so every state is deterministic and screenshot-stable -
 *  same convention as multi-payroll's WORLD_TODAY. */
export const WORLD_TODAY = '2026-07-28'
export const DEMO_USER_NAME = 'Jordan'

export interface DashboardCardData {
  id: 'clock-in' | 'pay-stub' | 'pto-suggestion'
  icon: Icon
  title: string
  subtitle: string
  /** PRD 4.1's "Explainability" note - the one-line reason a card is
   *  surfaced now, so predictions read as trustworthy rather than arbitrary. */
  reason: string
  details: string
}

/**
 * PRD Feature 5's three representative cards, computed as fixed demo facts
 * rather than scattered literal copy per catalog state - every catalog/Live
 * App state that shows the dashboard reads from this same source, so a card
 * can never show different numbers in two places.
 */
export function eligibleCards(): Array<DashboardCardData> {
  return [
    {
      id: 'clock-in',
      icon: Clock,
      title: 'Clock in',
      subtitle: 'Your shift usually starts about now',
      reason: 'Weekday pattern: on the clock by 9:00 AM',
      details: 'Logged 32.5h this week - 7.5h approved, 25h pending.',
    },
    {
      id: 'pay-stub',
      icon: Receipt,
      title: 'Your Jul 25 pay stub is ready',
      subtitle: 'Paid Jul 25 - $3,240.18 net',
      reason: 'Payday was yesterday',
      details: 'Direct deposit to Chase •••• 4471.',
    },
    {
      id: 'pto-suggestion',
      icon: CalendarPlus,
      title: 'Long weekend coming up',
      subtitle: 'Bridge Friday, Aug 7, for a 4-day weekend',
      reason: 'Aug 8-9 is a weekend and Aug 10 is a company holiday',
      details: '18.5 PTO hours available - this would use 8.',
    },
  ]
}

export const SESSION_SUMMARY_ITEMS: Array<string> = [
  'Your timesheet for last week was approved',
  'Emma flagged 2 hours of overtime on Thursday for review',
]

export const SEEDED_CHAT: Array<ChatMessage> = [
  { from: 'emma', text: 'What do you need?' },
  { from: 'user', text: 'How many PTO days do I have left this year?' },
  {
    from: 'emma',
    text: 'You have 18.5 hours (about 2.3 days) of PTO remaining, plus 2 more days accruing before December.',
  },
]

/* ---------------- Feature 3: conversational onboarding ---------------- */

/** Each step's transcript includes every prior message - PRD 3.1's "one
 *  field at a time" capture, replayed as a real growing conversation rather
 *  than 3 disconnected screenshots. */
export const ONBOARDING_MESSAGES: Record<OnboardingStep, Array<ChatMessage>> = {
  password: [
    { from: 'emma', text: "Let's create your Niural AI account - can you fill this in?" },
    { from: 'emma', text: 'Email: jordan@nexuscorp.com (from your employer). Set a password to continue.' },
  ],
  name: [
    { from: 'emma', text: "Let's create your Niural AI account - can you fill this in?" },
    { from: 'emma', text: 'Email: jordan@nexuscorp.com (from your employer). Set a password to continue.' },
    { from: 'user', text: '••••••••••' },
    { from: 'emma', text: "Got it. What's your full legal name?" },
  ],
  'biometric-offer': [
    { from: 'emma', text: "Let's create your Niural AI account - can you fill this in?" },
    { from: 'emma', text: 'Email: jordan@nexuscorp.com (from your employer). Set a password to continue.' },
    { from: 'user', text: '••••••••••' },
    { from: 'emma', text: "Got it. What's your full legal name?" },
    { from: 'user', text: 'Jordan Alexis Reyes' },
    {
      from: 'emma',
      text: 'Your account is set up, Jordan. Want to turn on Face ID for faster logins next time?',
    },
  ],
}

export interface ExtractedField {
  label: string
  value: string
  /** Below-confidence-threshold fields are surfaced for confirmation, never
   *  silently trusted (PRD 3.2's "Extraction Confidence Gate"). */
  needsConfirmation?: boolean
}

/** A realistic driver's-license extraction result - one field (SSN isn't on
 *  a license at all) deliberately below confidence, so the review screen has
 *  a genuine "please confirm" case to show, not just a clean success list. */
export const EXTRACTED_DOCUMENT_FIELDS: Array<ExtractedField> = [
  { label: 'Full legal name', value: 'Jordan Alexis Reyes' },
  { label: 'Date of birth', value: 'Mar 14, 1994' },
  { label: 'License number', value: 'D12345678' },
  { label: 'Address', value: '412 Bell St, Austin, TX 78701' },
  { label: 'SSN', value: '•••-••-6031', needsConfirmation: true },
]
