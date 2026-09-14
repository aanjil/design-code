import { Link, createFileRoute } from '@tanstack/react-router'
import { CaretRight } from '@phosphor-icons/react'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'

export const Route = createFileRoute('/docs/components/')({
  component: ComponentsIndex,
  head: () => ({ meta: [{ title: 'Components - NDS Docs' }] }),
})

const PAGES: Array<{ to: string; title: string; blurb: string }> = [
  {
    to: '/docs/components/app-bar',
    title: 'AppBar',
    blurb: 'Top navigation: org switcher, nav pills, wallet, Ask Emma. Four role variants, plus a mini icon-rail mode.',
  },
  {
    to: '/docs/components/sidebar',
    title: 'Sidebar',
    blurb: 'Grouped left nav on a translucent panel - People and Payments configs.',
  },
  {
    to: '/docs/components/stepper',
    title: 'Stepper',
    blurb: 'Vertical wizard progress: brand check, spinner, muted upcoming.',
  },
  {
    to: '/docs/components/buttons',
    title: 'Buttons',
    blurb: 'Gradient primary/secondary, ghosts, destructive - sizes and the px-1 label rule.',
  },
  {
    to: '/docs/components/inputs',
    title: 'Form controls',
    blurb: 'SearchField, TextInput, TextArea, SelectField, Checkbox, FieldLabel.',
  },
  {
    to: '/docs/components/feedback',
    title: 'Feedback',
    blurb: 'Status pills, five banner tones, and the Emma AI suggestion card.',
  },
  {
    to: '/docs/components/filters',
    title: 'Filters pattern',
    blurb: 'Filter menu → value panel → applied chips + AI prompt filtering, live.',
  },
  {
    to: '/docs/components/editable-table',
    title: 'Editable table',
    blurb: 'Subgrid rows, 44px cells, per-type editors - the invoice-table pattern.',
  },
  {
    to: '/docs/components/page-shell',
    title: 'Page shell',
    blurb: 'AppShell → MainLayout → PageLayout: header, body, footer scaffold.',
  },
]

const UI_PRIMITIVES =
  'badge · button · card · checkbox · command · dialog · dropdown-menu · input · input-group · label · popover · scroll-area · select · separator · sheet · switch · table · tabs · textarea · toggle · toggle-group · tooltip'

function ComponentsIndex() {
  return (
    <DocPage
      title="Components"
      description="Storybook-style docs for everything the playground has shipped: live specimens rendered from the real components, plus props and usage rules. Specimens always match the current tokens and theme."
    >
      <DocSection title="Component pages">
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {PAGES.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="group flex flex-col gap-1 rounded-xl bg-background-base p-4 shadow-border-base transition-shadow hover:shadow-button-gray"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-label-sm text-text-primary">{page.title}</span>
                <CaretRight className="size-3.5 text-text-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-brand-text" />
              </span>
              <span className="text-paragraph-xs text-text-muted">{page.blurb}</span>
            </Link>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="shadcn/ui primitives"
        note="src/components/ui - shadcn on Base UI, restyled to NDS. Composition via the render prop, not asChild."
      >
        <p className="font-mono text-mono-xs leading-relaxed text-text-muted">
          {UI_PRIMITIVES}
        </p>
        <p className="mt-3 text-paragraph-xs text-text-muted">
          Add more with{' '}
          <InlineCode>pnpm dlx shadcn@latest add &lt;name&gt; --yes</InlineCode> - then
          remap any default-palette classes to tokens (the palette is disabled, so
          violations fail loudly).
        </p>
      </DocSection>
    </DocPage>
  )
}
