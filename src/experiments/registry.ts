import type { FileRoutesByTo } from '@/routeTree.gen'

export type ExperimentStatus = 'idea' | 'wip' | 'review' | 'ready'

export interface ExperimentMeta {
  slug: string
  title: string
  description: string
  status: ExperimentStatus
  /** Free-form grouping: pattern name, feature area, etc. */
  tags: Array<string>
  to: keyof FileRoutesByTo
  /** yyyy-mm-dd */
  added: string
}

/**
 * Single source of truth for every experience in the playground.
 * The nav switcher, ⌘K palette, and gallery all render from this list.
 *
 * Adding an experiment (see docs/DESIGN.md):
 * 1. src/experiments/<slug>/index.tsx — the experience itself
 * 2. src/routes/e/<slug>.tsx — thin route mounting it in <ExperimentFrame>
 * 3. Register it here
 */
export const experiments: Array<ExperimentMeta> = [
  {
    slug: 'employee-filters',
    title: 'Employee directory — filters',
    description:
      'Figma Web-design-system implementation: AppBar/Sidebar/PageLayout shell, nested filter menu, editable filter chips with AI prompt filtering, Display customization, and the employees table — three draggable browser previews on a canvas.',
    status: 'wip',
    tags: ['filters', 'table', 'canvas', 'figma'],
    to: '/e/employee-filters',
    added: '2026-07-09',
  },
  {
    slug: 'demo-annotations',
    title: 'Playground demo',
    description:
      'Reference experiment showing variants, annotations, the notes panel, and mock data. Copy this pair of files to start a new experiment.',
    status: 'ready',
    tags: ['meta', 'how-to'],
    to: '/e/demo-annotations',
    added: '2026-07-09',
  },
]

export function getExperiment(slug: string): ExperimentMeta {
  const meta = experiments.find((e) => e.slug === slug)
  if (!meta) {
    throw new Error(
      `Experiment "${slug}" is not registered in src/experiments/registry.ts`,
    )
  }
  return meta
}
