import type { FileRoutesByTo } from '@/routeTree.gen'

export type CraftStatus = 'idea' | 'wip' | 'review' | 'ready'

export interface CraftMeta {
  slug: string
  title: string
  description: string
  status: CraftStatus
  /** Free-form grouping: pattern name, feature area, etc. */
  tags: Array<string>
  to: keyof FileRoutesByTo
  /** yyyy-mm-dd */
  added: string
}

/**
 * Single source of truth for every craft in the playground - a prototype
 * for a flow, component, pattern, or feature. The nav switcher, ⌘K palette,
 * and gallery all render from this list.
 *
 * Adding a craft (see docs/DESIGN.md):
 * 1. src/crafts/<slug>/index.tsx - the craft itself
 * 2. src/routes/crafts/<slug>.tsx - thin route mounting it in <CraftFrame>
 * 3. Register it here
 */
export const crafts: Array<CraftMeta> = [
  {
    slug: 'multi-payroll',
    title: 'Multi-payroll frequencies - flow & state explorer',
    description:
      'Review harness for the multi-payroll feature: a real Payments app driven into every hidden state. Left panel = design checklist of all flows (A–H); right panel = every state/condition of the selected screen, one click each. Transition math (retro, gap/overlap, benefits true-up, PTO re-rate) is computed by a tested engine, not mocked.',
    status: 'wip',
    tags: ['payroll', 'explorer', 'states', 'wizard', 'harness'],
    to: '/crafts/multi-payroll',
    added: '2026-07-15',
  },
  {
    slug: 'editable-invoice',
    title: 'Editable table - create invoice',
    description:
      'Spreadsheet-style line items on the Niural Pay create-invoice page: editable cells (text, number, unit-select, tax select), expandable rows with detail fields, add/remove rows, and live computed totals.',
    status: 'wip',
    tags: ['editable-table', 'form', 'invoice', 'figma'],
    to: '/crafts/editable-invoice',
    added: '2026-07-10',
  },
  {
    slug: 'employee-filters',
    title: 'Employee directory - filters',
    description:
      'Figma Web-design-system implementation: AppBar/Sidebar/PageLayout shell, nested filter menu, editable filter chips with AI prompt filtering, Display customization, and the employees table - three draggable browser previews on a canvas.',
    status: 'wip',
    tags: ['filters', 'table', 'canvas', 'figma'],
    to: '/crafts/employee-filters',
    added: '2026-07-09',
  },
  {
    slug: 'split-pay',
    title: 'Split pay via Transak - flow & state explorer',
    description:
      'UK EOR employee splits net pay between a bank account and a USDC wallet via Transak. Wallet card with 12 lifecycle states, KYC + Onfido handoff, FCA categorization/agreement/risk + cooling off, split config with live preview, guardrail modals, two-account receipt, transactional email set, and the internal ops reconciliation view.',
    status: 'wip',
    tags: ['payments', 'crypto', 'transak', 'explorer', 'states'],
    to: '/crafts/split-pay',
    added: '2026-07-18',
  },
  {
    slug: 'schedule-report',
    title: 'Scheduled report generation - flow & state explorer',
    description:
      'Niural Insights: schedule a report to run once or on a recurring cadence, deliver it to the platform, email recipients, and/or an OTP-protected external link. Left panel = design checklist (entry, config, management, recipient link access); right panel = every state/condition per screen.',
    status: 'wip',
    tags: ['insights', 'reports', 'scheduling', 'explorer', 'states'],
    to: '/crafts/schedule-report',
    added: '2026-07-17',
  },
  {
    slug: 'emma-mobile',
    title: 'Emma Mobile - AI-native mobile flow explorer',
    description:
      'First slice of the AI-native adaptive mobile experience (Emma): biometric-first login with password fallback, and the dynamic dashboard - predictive Action/Details/CTA cards, session summary, dashboard↔chat transition, the automatic fallback banner, and traditional mode. Same explorer/canvas pattern as the other crafts, rendered in real iPhone 16 Pro Max (440×956pt) device frames instead of desktop browser windows.',
    status: 'wip',
    tags: ['mobile', 'ai-native', 'emma', 'explorer', 'states'],
    to: '/crafts/emma-mobile',
    added: '2026-07-28',
  },
  {
    slug: 'tokens-billing',
    title: 'Tokens & billing - Settings flow & state explorer',
    description:
      'Emma spends tokens to work; this is where employers see, buy, and auto-reload them. Settings > AI (Tokens, Usage) and Settings > Billing (Payment methods, Credit), the navbar token pill + notifications, the buy-tokens flow with volume discounts, and auto-reload. Ported from a hand-built HTML workbench that already resolved the pricing math, 18 balance presets, and every review-modal variant against the PRD - including the 13 product decisions it flagged as still blocking real design work.',
    status: 'wip',
    tags: ['billing', 'tokens', 'settings', 'explorer', 'states'],
    to: '/crafts/tokens-billing',
    added: '2026-07-30',
  },
  {
    slug: 'emma-intake',
    title: 'Emma Intake - document-to-record pattern, flow & state explorer',
    description:
      'Floating copilot is the only entry point: drop or browse a document, give an optional intent, watch an X-ray timeline stream what Emma found, then review a split-screen staging area (fake doc + key-value receipt cards, not a form) before Confirm & Create. Same explorer/canvas pattern as multi-payroll: two live "App" windows (Contract Intelligence - MSA -> vendor + recurring bill, and Expense - invoice -> merchant + expense) with real drag/drop and timers, pinned above a frozen catalog matrix (every screen x state - idle, captured, processing, clean extract, dedupe match, confirmed) driven by the Explorer panel. Clicking a receipt value scrolls/highlights the source doc; the floating composer itself expands to react to a file drag or capture, instead of a separate overlay.',
    status: 'wip',
    tags: ['ai', 'emma', 'intake', 'contracts', 'expense', 'timeline', 'explorer', 'states'],
    to: '/crafts/emma-intake',
    added: '2026-08-11',
  },
  {
    slug: 'dynamic-timeline',
    title: 'Dynamic timeline - Run Payroll, sense to consent',
    description:
      'Run Payroll re-derived with the AINA framework instead of a locked 3-step wizard: a TaskRows-driven "dynamic timeline" where Prepare is pure system layer (no Continue button), Resolve auto-expands and ranks its three tensions by stakes (not confidence), and Confirm & run opens on its own once every tension has some answer - approved, rejected, or honestly deferred. Simulate is causally linked to the actual choices (wallet routing costs the wire buffer; holding Sam does not), and Consent states what stays unresolved instead of burying it. Built from a hand-built HTML prototype plus a delivered AINA wireframe.',
    status: 'wip',
    tags: ['payroll', 'ai-native', 'aina', 'timeline', 'task-rows', 'explorer', 'states'],
    to: '/crafts/dynamic-timeline',
    added: '2026-08-15',
  },
  {
    slug: 'ask-emma',
    title: 'Ask Emma - Grain in action',
    description:
      'Two sources, one craft. The launcher, the payroll run, the expense run and the PTO ask-thread are all grain-flows_2.html recreated on the Grain component (docs/foundations/grain.md) - a claim instead of a blank composer, an explicit empty state, every finding through <Grain>/<Shell>. The new-chat and chat-with-sidebar+bubbles screens instead follow the Niural-AI Figma file directly (chat/), reusing the existing PromptBar - deliberately a second, un-reconciled sidebar/shell pattern sitting next to the first, since the two sources disagree and haven\'t been resolved into one. 13 screens, one Explorer.',
    status: 'wip',
    tags: ['ai', 'emma', 'grain', 'launcher', 'chat', 'figma', 'explorer', 'states'],
    to: '/crafts/ask-emma',
    added: '2026-08-19',
  },
  {
    slug: 'bezel',
    title: 'Bezel - one floating object for Emma',
    description:
      'A single floating claim bar (bottom-centre) that docks evidence, a bulk-selection summary, or a full-height copilot thread - never more than one of them at once. Ported from a hand-built HTML prototype onto the Grain design language: Shell gained a "dock" slot generic enough to host a bulk-action bar or context chips, and a new Thread component builds out the "Shell at thread density" the foundations doc already named but never shipped. Applied to the Employees list - row selection drives the bar into a bulk-action summary, "Ask about these" folds the selection into a copilot thread, and a real pay-equity outlier (computed from the employees mock, not authored) resolves through Grain\'s undo-in-place pattern. One live, fully-interactive window plus a frozen matrix of all 13 states.',
    status: 'wip',
    tags: ['ai', 'emma', 'grain', 'shell', 'copilot', 'selection', 'people', 'explorer', 'states'],
    to: '/crafts/bezel',
    added: '2026-08-24',
  },
  {
    slug: 'demo-annotations',
    title: 'Playground demo',
    description:
      'Reference craft showing variants, annotations, the notes panel, and mock data. Copy this pair of files to start a new craft.',
    status: 'ready',
    tags: ['meta', 'how-to'],
    to: '/crafts/demo-annotations',
    added: '2026-07-09',
  },
]

export function getCraft(slug: string): CraftMeta {
  const meta = crafts.find((e) => e.slug === slug)
  if (!meta) {
    throw new Error(
      `Craft "${slug}" is not registered in src/crafts/registry.ts`,
    )
  }
  return meta
}
