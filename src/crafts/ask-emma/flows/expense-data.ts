import type { GrainExit, GrainFact } from '@/components/nds/grain/types'
import type { TensionDef } from './tension'

export const DROP_FILES = [
  'hotel-berlin.pdf',
  'taxi-01.jpg',
  'dinner-kreuzberg.heic',
  'conference.pdf',
  'taxi-02.jpg',
  'IMG_4417.heic',
]

export const EXTRACTED = {
  claim: '5 of 6 receipts read — one photo is too dark',
  confidence: 0.84,
  facts: [
    { label: 'Hotel · Motel One Berlin · 12–14 Aug', value: '€1,140.00' },
    { label: 'Conference · Berlin Summit', value: '€620.00' },
    { label: 'Dinner · Kreuzberg · 3 covers', value: '€184.00' },
    { label: 'Taxi × 2', value: '€64.60' },
    { label: 'IMG_4417.heic — unreadable, not guessed', value: 'needs you', tone: 'stop' },
  ] as Array<GrainFact>,
  provenance: 'converted at 1.084 · EUR→USD on 14 Aug · $2,184.60 total',
  exits: [
    { label: 'Enter it manually', variant: 'default' },
    { label: 'Skip that one', variant: 'quiet' },
  ] as Array<GrainExit>,
}

export const EXPENSE_TENSIONS: Array<TensionDef> = [
  {
    claim: 'The dinner has 3 covers but you travelled alone',
    confidence: 0.44,
    facts: [
      { label: 'Kreuzberg · 13 Aug · 3 covers', value: '€184.00' },
      { label: 'Wine on the receipt', value: '€61.00', tone: 'warn' },
      { label: 'Policy 4.2 — alcohol, unless client entertainment', value: 'with a named guest' },
    ],
    provenance: 'no calendar event at that time · no guests on the receipt',
    exits: [
      { label: 'Client dinner — I’ll name the guests', variant: 'default' },
      { label: 'Team dinner', variant: 'default' },
      { label: 'Personal — don’t claim it', variant: 'quiet' },
    ],
    resolvedSummary: 'Client dinner · guests named · €184 claimable in full',
  },
  {
    claim: 'These fit an existing report — or start a new one?',
    confidence: 0.52,
    facts: [
      { label: '"August client visits" — open, 3 items, same date range', value: '$486.00' },
      { label: 'These 5 items', value: '$2,184.60' },
    ],
    provenance: 'date overlap only · your last 4 trips each got their own report',
    exits: [
      { label: 'New report — Berlin summit', variant: 'default' },
      { label: 'Add to "August client visits"', variant: 'default' },
    ],
    resolvedSummary: 'New report · Berlin summit · 12–14 Aug',
  },
]

export const EXPENSE_DRAFT = {
  claim: 'Expense report · Berlin summit',
  facts: [
    { label: 'TITLE', value: 'Berlin summit · 12–14 Aug' },
    { label: 'TOTAL', value: '$2,184.60 · 5 items' },
    { label: 'ENTITY', value: 'Anjil Crafts · New York' },
    { label: 'COST CENTRE — NEEDS YOU', value: 'not on any receipt', tone: 'warn' },
  ] as Array<GrainFact>,
  provenance: '5 line items attached · nothing submitted',
  exits: [
    { label: 'Create and submit', variant: 'primary' },
    { label: 'Open in Expenses →', variant: 'quiet' },
  ] as Array<GrainExit>,
}

export const EXPENSE_SUBMITTED = {
  claim: 'Submitted — Berlin summit, $2,184.60',
  facts: [
    { label: 'Report EXP-R-118 · 5 items', value: 'with Priya for approval' },
    { label: 'IMG_4417.heic', value: 'still unread — not included', tone: 'warn' },
  ] as Array<GrainFact>,
  provenance: 'submitted 14:31 · you · editable until Priya opens it',
  exits: [{ label: 'View report', variant: 'quiet' }] as Array<GrainExit>,
}
