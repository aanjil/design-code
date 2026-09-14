import type { ExplorerGroupDef } from '@/components/playground/explorer'

/**
 * Explorer catalog for the Ask Emma craft - every screen ported from
 * grain-flows_2.html (Home/launcher, the payroll run, the expense run,
 * the ask thread), each with the states/conditions it actually has to
 * handle. Drives both the Flows panel and the canvas window layout in
 * index.tsx - see src/components/playground/explorer.tsx.
 */
export const EXPLORER_CATALOG: Array<ExplorerGroupDef> = [
  {
    group: 'Emma',
    screens: [
      {
        id: 'home',
        label: 'Launcher',
        states: [
          { id: 'needs-you', label: '3 things need you' },
          { id: 'all-clear', label: 'Nothing needs you' },
        ],
      },
    ],
  },
  {
    group: 'Run payroll',
    screens: [
      {
        id: 'payroll-which',
        label: '0 · Which payroll',
        states: [
          { id: 'ask', label: 'Unresolved' },
          { id: 'done', label: 'Confirmed' },
        ],
      },
      {
        id: 'payroll-prepare',
        label: '1 · Prepare',
        states: [
          { id: 'locked', label: 'Locked' },
          { id: 'loading', label: 'Pulling data' },
          { id: 'done', label: '3 of 44 need you' },
        ],
      },
      {
        id: 'payroll-resolve',
        label: '2 · Resolve',
        states: [
          { id: 'r0', label: '0 of 3 resolved' },
          { id: 'r1', label: '1 of 3 resolved' },
          { id: 'r2', label: '2 of 3 resolved' },
          { id: 'r3', label: '3 of 3 resolved' },
        ],
      },
      {
        id: 'payroll-confirm',
        label: '3 · Confirm and run',
        states: [
          { id: 'locked', label: 'Locked' },
          { id: 'open', label: 'Ready to approve' },
          { id: 'done', label: 'Submitted' },
        ],
      },
    ],
  },
  {
    group: 'Expense report',
    screens: [
      {
        id: 'expense-drop',
        label: '0 · Drop receipts',
        states: [
          { id: 'empty', label: 'Empty' },
          { id: 'ready', label: '6 files ready' },
        ],
      },
      {
        id: 'expense-reading',
        label: '1 · Reading files',
        states: [{ id: 'scanning', label: 'Scanning' }],
      },
      {
        id: 'expense-extracted',
        label: '1 · Extracted',
        states: [{ id: 'read', label: '5 of 6 read' }],
      },
      {
        id: 'expense-resolve',
        label: '2 · Resolve',
        states: [
          { id: 'r0', label: '0 of 2 resolved' },
          { id: 'r1', label: '1 of 2 resolved' },
          { id: 'r2', label: '2 of 2 resolved' },
        ],
      },
      {
        id: 'expense-create',
        label: '3 · Create report',
        states: [
          { id: 'locked', label: 'Locked' },
          { id: 'open', label: 'Draft ready' },
          { id: 'done', label: 'Submitted' },
        ],
      },
    ],
  },
  {
    group: 'Ask',
    screens: [
      {
        id: 'ask-thread',
        label: 'PTO carryover policy',
        states: [
          { id: 'q1', label: '2 messages' },
          { id: 'q2', label: '4 messages' },
        ],
      },
    ],
  },
  {
    // Figma-faithful (Niural-AI file), not the grain-flows_2.html
    // recreation above - see chat/data.ts and chat/sidebar.tsx.
    group: 'Chat (Figma)',
    screens: [
      {
        id: 'chat-new',
        label: 'New chat',
        states: [{ id: 'default', label: 'No sidebar yet' }],
      },
      {
        id: 'chat-thread',
        label: 'Chat with sidebar + bubbles',
        states: [
          { id: 'reviewing', label: 'Reviewing the draft' },
          { id: 'followup', label: 'Follow-up unanswered' },
        ],
      },
    ],
  },
]

export const CATALOG_SCREEN_IDS = new Set(
  EXPLORER_CATALOG.flatMap((g) => g.screens.map((s) => s.id)),
)
