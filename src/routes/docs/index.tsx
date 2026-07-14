import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowUpRight,
  CirclesFour,
  PaintBucket,
  Ruler,
  StackSimple,
  TextAa,
} from '@phosphor-icons/react'
import { DocPage, InlineCode } from '@/docs/doc-kit'

export const Route = createFileRoute('/docs/')({
  component: DocsOverview,
})

const SECTIONS = [
  {
    to: '/docs/colors',
    icon: PaintBucket,
    title: 'Colors',
    desc: 'Semantic tokens — backgrounds, text, borders, brand, surfaces, accents. Live values per theme.',
  },
  {
    to: '/docs/typography',
    icon: TextAa,
    title: 'Typography',
    desc: 'Inter + Geist Mono. Title, Paragraph, Label, Caption and Mono scales with usage rules.',
  },
  {
    to: '/docs/spacing',
    icon: Ruler,
    title: 'Spacing',
    desc: 'The 4px scale, the 8/12/16/20 quick reference, and the rules that keep layouts composed.',
  },
  {
    to: '/docs/elevation',
    icon: StackSimple,
    title: 'Elevation',
    desc: 'Shadow tokens: cards, flyouts, button rings, focus states and the depth scale.',
  },
  {
    to: '/docs/layout',
    icon: CirclesFour,
    title: 'Layout & sizes',
    desc: 'App shell metrics from the Figma system — AppBar, sidebar, tables, radii — plus compositions.',
  },
] as const

function DocsOverview() {
  return (
    <DocPage
      title="NDS documentation"
      description="The Niural design system as it exists in this playground — rendered live from the same tokens the experiments use, so what you see here is exactly what ships on the canvas."
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-4 gap-y-5">
        {SECTIONS.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col gap-2 rounded-xl bg-background-base p-3 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between">
              <Icon className="size-5 text-brand-text" />
              <ArrowUpRight className="size-4 text-text-disabled transition-colors group-hover:text-text-muted" />
            </div>
            <div>
              <p className="text-label-md text-text-primary">{title}</p>
              <p className="text-paragraph-xs text-text-muted">{desc}</p>
            </div>
          </Link>
        ))}
        <Link
          to="/docs/components"
          className="group flex flex-col gap-2 rounded-xl bg-brand-base p-3 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="flex items-center justify-between">
            <CirclesFour className="size-5 text-brand-text" weight="duotone" />
            <ArrowUpRight className="size-4 text-text-disabled transition-colors group-hover:text-text-muted" />
          </div>
          <div>
            <p className="text-label-md text-text-primary">Components</p>
            <p className="text-paragraph-xs text-text-muted">
              The component inventory — full variant &amp; prop docs are the
              next milestone.
            </p>
          </div>
        </Link>
      </div>

      <div className="rounded-xl bg-surface-1 p-4">
        <p className="text-label-sm text-text-primary">How this stays true</p>
        <p className="mt-1 max-w-[640px] text-paragraph-xs text-text-muted">
          Source foundations live in <InlineCode>docs/foundations/*.md</InlineCode>,
          get encoded as tokens in <InlineCode>src/styles.css</InlineCode>, and these
          pages render from those tokens directly — color values are measured from
          the DOM at runtime, so flipping the theme updates every swatch. When
          foundations change: re-copy, update tokens, and these docs follow.
        </p>
      </div>
    </DocPage>
  )
}
