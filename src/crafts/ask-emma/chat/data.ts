/**
 * Content ported verbatim from the two Figma references for the Ask Emma
 * chat surface (Niural-AI file, nodes 6479:82938 "new chat" and
 * 6479:45938 "chat with sidebar and bubbles"). Kept separate from
 * mocks.ts/flows/* since these two screens follow the Figma design
 * directly rather than the grain-flows_2.html recreation - see
 * docs/foundations/grain.md's craft note and registry.ts.
 */

export interface DocSuggestion {
  title: string
  blurb: string
  badge?: string
}

export const HR_DOCUMENTS: Array<DocSuggestion> = [
  {
    title: 'Create an Offer Letter',
    blurb: 'Draft a role-specific offer letter with confidence.',
    badge: 'New',
  },
  {
    title: 'Create an Employee Handbook',
    blurb: 'Draft company policies employees can rely on.',
  },
]

export const BENEFITS_PROMPTS: Array<string> = [
  'What benefits package is suitable for a 20-person startup?',
  'Help me design benefits for hourly vs salaried employees.',
  'What health insurance options balance cost and coverage?',
  'How should I structure benefits for remote employees?',
  'Compare PPO vs HDHP for a small team.',
  'How can I offer competitive benefits on a tight budget?',
]

export const PTO_PROMPTS: Array<string> = [
  'Help me design a fair PTO policy.',
  'What’s a standard PTO policy for small companies?',
  'How should PTO work for part-time employees?',
  'How should unused PTO be handled at termination?',
  'How do I manage PTO across different locations?',
  'How much PTO is competitive in my industry?',
]

export interface ChatListItem {
  id: string
  title: string
}

/** The sidebar's "Your chats" list - "New chat" (first item) is the
 *  current, unsaved session and renders selected. */
export const CHAT_LIST: Array<ChatListItem> = [
  { id: 'current', title: 'New chat' },
  { id: 'payroll-inquiry', title: 'Payroll Inquiry: When’s My Next Paycheck?' },
  { id: 'pto-policies', title: 'Understanding Paid Time Off Policies' },
  { id: 'stock-options', title: 'Exploring Stock Options Benefits' },
  { id: 'wellness-benefits', title: 'Wellness Benefits: What’s Available?' },
]

export type ThreadTurn =
  | { from: 'user'; kind: 'message'; text: string }
  | { from: 'emma'; kind: 'message'; text: string }
  | { from: 'emma'; kind: 'smart-action'; label: string; buttonLabel: string }

/** The exact turn order from the Figma node - a single linear thread,
 *  no branching. `upTo` (screen state) slices this array. */
export const THREAD_TURNS: Array<ThreadTurn> = [
  { from: 'user', kind: 'message', text: 'Create compliant offer letter' },
  {
    from: 'emma',
    kind: 'message',
    text:
      'To proceed, could you please provide the following details:\n' +
      '1. Employee’s name,\n2. position,\n3. salary,\n4. employee location,\n5. start date,\n' +
      '6. working days,\n7. working time, and\n8. office address?\n' +
      'These are required to generate the offer letter. Thank you so much!',
  },
  { from: 'user', kind: 'message', text: 'generate me an offer letter for this candidate' },
  {
    from: 'emma',
    kind: 'message',
    text:
      'I’ve reviewed the CV (johncena_cv.pdf) and prepared a draft offer letter for John Cena. Some ' +
      'details, like specific compensation and start date, need your input to complete it. You can edit ' +
      'directly in the editor or provide details here.',
  },
  {
    from: 'user',
    kind: 'message',
    text: 'i don’t want to create offer letter for john cena. but i want to use the details of joh cena. and make name different like. Cena John.',
  },
  {
    from: 'emma',
    kind: 'message',
    text: 'Oh, if that’s the case i’ll use the details of John Cena and replace with Cena John.',
  },
  {
    from: 'emma',
    kind: 'smart-action',
    label: 'Offer Letter for Cena John',
    buttonLabel: 'Open canvas',
  },
  {
    from: 'user',
    kind: 'message',
    text: 'everything looks fine but can you change the work location to Work from Home?',
  },
]
