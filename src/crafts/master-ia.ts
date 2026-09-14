import type { SidebarGroupDef } from '@/components/nds/sidebar'
import { PAYMENTS_SIDEBAR, PEOPLE_SIDEBAR } from '@/components/nds/sidebar'

/**
 * Single source of truth for the real product's top-level nav, and where
 * each craft in the registry would live inside it. Both the Master IA docs
 * page (`/docs/ia`) and the Master App (`/app`) read from this - so the
 * "what the product looks like" map and the "click through it" shell can't
 * drift apart.
 *
 * `status`:
 * - 'live'        - the craft has a real single-viewport component (a
 *                    `live-app.tsx`, or the page itself) that the Master App
 *                    mounts directly.
 * - 'canvas-only' - the craft only exists as a frozen multi-state canvas
 *                    with no live entry point; the Master App links out to
 *                    its existing `/crafts/<slug>` route instead.
 *
 * `demo-annotations` (the reference/meta craft, not a product feature) is
 * deliberately excluded - it has no home in the real IA.
 */

export interface MasterIACraftRef {
  slug: string
  status: 'live' | 'canvas-only'
  /** Which sidebar leaf (an item label inside this section's sidebarGroups)
   *  this craft actually implements - draws a more accurate tree than
   *  flattening every craft straight under its section. Omitted where no
   *  sidebar leaf exists yet, or the craft is cross-cutting and doesn't map
   *  to one leaf cleanly - it attaches directly to the section instead. */
  subNavLabel?: string
}

export interface MasterIASection {
  key: string
  label: string
  /** Contextual left-nav groups for this section, where one has been
   *  designed already (People, Payments) - undefined where it hasn't. */
  sidebarGroups?: Array<SidebarGroupDef>
  crafts: Array<MasterIACraftRef>
}

export const MASTER_IA: Array<MasterIASection> = [
  {
    key: 'people',
    label: 'People',
    sidebarGroups: PEOPLE_SIDEBAR,
    crafts: [{ slug: 'employee-filters', status: 'live', subNavLabel: 'Employees' }],
  },
  {
    key: 'payments',
    label: 'Payments',
    sidebarGroups: PAYMENTS_SIDEBAR,
    crafts: [
      { slug: 'multi-payroll', status: 'live', subNavLabel: 'Payroll Schedule' },
      { slug: 'split-pay', status: 'canvas-only' },
      { slug: 'dynamic-timeline', status: 'canvas-only', subNavLabel: 'Payroll' },
    ],
  },
  {
    key: 'niural-pay',
    label: 'Niural Pay',
    crafts: [
      { slug: 'editable-invoice', status: 'live' },
      { slug: 'emma-intake', status: 'canvas-only' },
    ],
  },
  {
    key: 'niural-insights',
    label: 'Niural Insights',
    crafts: [{ slug: 'schedule-report', status: 'live' }],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    crafts: [],
  },
  {
    key: 'settings',
    label: 'Settings',
    crafts: [{ slug: 'tokens-billing', status: 'live' }],
  },
  {
    key: 'emma-mobile',
    label: 'Emma Mobile (companion app)',
    /** Not a section of the desktop Sidebar - a distinct mobile surface,
     *  rendered in device frames rather than desktop browser windows. */
    crafts: [{ slug: 'emma-mobile', status: 'live' }],
  },
  {
    key: 'emma',
    label: 'Emma (Ask Emma)',
    /** Not a section of the desktop Sidebar either - Emma is reached from
     *  the AppBar's Ask Emma button (nds/app-bar.tsx's AiButton), not the
     *  left rail. That button is still decorative in the Master App; wiring
     *  its onAiClick to navigate here is a later phase (see registry.ts). */
    crafts: [{ slug: 'ask-emma', status: 'canvas-only' }],
  },
]
