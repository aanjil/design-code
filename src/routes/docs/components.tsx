import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'
import { StatusPill } from '@/components/nds/controls'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Kbd } from '@/components/playground/kbd'

export const Route = createFileRoute('/docs/components')({
  component: ComponentsDoc,
  head: () => ({ meta: [{ title: 'Components — NDS Docs' }] }),
})

const NDS_COMPONENTS = [
  ['AppBar', 'Top navigation: org switcher, nav pills, wallet, Ask Emma — activeItem prop'],
  ['Sidebar', 'Grouped left nav, active = white pill + brand text'],
  ['PageLayout / PageHeader / PageBody / PageFooter', 'Page scaffold — PageHeader takes onBack for form/detail pages'],
  ['FieldLabel / TextInput / TextArea / SelectField', 'Form primitives: 36px inputs, ring shadows, required asterisk'],
  ['EditableTable + EditableRow', 'Subgrid table, 1px-gap grid lines, 44px cells / 32px headers'],
  ['TextCell / NumberCell / SelectAndTypeCell / SelectCell / DateCell', 'Editable cells — hover highlight, editing = border-brand ring; numbers right-aligned Inter (DS spec)'],
  ['CaretCell / IconCell / ExpandedRowPanel / AddRowFooter', 'Row expansion with detail form panel, destructive row actions, ghost add-row'],
  ['SearchField', '36px search input with ⌘ hint'],
  ['ToolbarIconButton / ToolbarDivider', 'Toolbar primitives'],
  ['StatusPill', 'White pill + ring + status dot'],
  ['FilterMenu', 'Filter button → field list → nested value panel'],
  ['FilterBar / FilterChip', 'Applied filters: editable segmented chips, AI prompt, clear'],
  ['AiFilter', 'Prompt → conditions (deterministic mock parser)'],
  ['DisplayMenu', 'Table customization: group, sort, column chips'],
] as const

const UI_PRIMITIVES =
  'badge · button · card · checkbox · command · dialog · dropdown-menu · input · input-group · label · popover · scroll-area · select · separator · sheet · switch · table · tabs · textarea · toggle · toggle-group · tooltip'

function ComponentsDoc() {
  return (
    <DocPage
      title="Components"
      description="The inventory as it stands. Full per-component docs — variants, props, do/don't — are the next milestone for this section."
    >
      <DocSection
        title="Live samples"
        note="Rendered from the real components, so they always match the current tokens."
      >
        <div className="flex flex-col gap-4 rounded-xl bg-surface-1 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <span className="px-1">Primary</span>
            </Button>
            <Button variant="secondary">
              <span className="px-1">Secondary</span>
            </Button>
            <Button variant="ghost-destructive">
              <span className="px-1">Clear</span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill dotClassName="bg-background-success-base">
              Active
            </StatusPill>
            <StatusPill dotClassName="bg-background-info-base">
              Invited
            </StatusPill>
            <StatusPill dotClassName="bg-background-warning-base">
              Onboarding
            </StatusPill>
            <StatusPill dotClassName="bg-background-emphasis">
              Offboarded
            </StatusPill>
            <span className="flex items-center gap-1.5">
              <Checkbox defaultChecked aria-label="Sample checkbox" />
              <span className="text-label-sm text-text-primary">Checkbox</span>
            </span>
            <Kbd>⌘K</Kbd>
          </div>
        </div>
      </DocSection>

      <DocSection
        title="NDS compositions"
        note="src/components/nds — built from the Figma Web design system, foundation tokens only."
      >
        <div className="flex flex-col">
          {NDS_COMPONENTS.map(([name, desc]) => (
            <div
              key={name}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 border-b border-border-highlight py-2.5"
            >
              <span className="w-72 shrink-0 font-mono text-mono-xs text-text-primary">
                {name}
              </span>
              <span className="min-w-0 flex-1 text-paragraph-xs text-text-muted">
                {desc}
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="shadcn/ui primitives"
        note="src/components/ui — shadcn on Base UI, restyled to NDS. Composition via the render prop, not asChild."
      >
        <p className="font-mono text-mono-xs leading-relaxed text-text-muted">
          {UI_PRIMITIVES}
        </p>
        <p className="mt-3 text-paragraph-xs text-text-muted">
          Add more with{' '}
          <InlineCode>pnpm dlx shadcn@latest add &lt;name&gt; --yes</InlineCode>{' '}
          — then remap any default-palette classes to tokens (the palette is
          disabled, so violations fail loudly).
        </p>
      </DocSection>

      <DocSection title="Coming next">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>Per-component pages: variants, props tables, usage do/don't.</li>
          <li>Interactive prop playgrounds rendered on the canvas.</li>
          <li>Code Connect mapping back to the Figma library.</li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
