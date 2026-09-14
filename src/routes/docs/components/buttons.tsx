import { createFileRoute } from '@tanstack/react-router'
import { Export, Plus, TrashSimple } from '@phosphor-icons/react'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/docs/components/buttons')({
  component: ButtonsDoc,
  head: () => ({ meta: [{ title: 'Buttons - NDS Docs' }] }),
})

function ButtonsDoc() {
  return (
    <DocPage
      title="Buttons"
      description="34px default height, 9px radius (rounded-btn), Label/Small. Primary = violet radial gradient + primary ring shadow; secondary = white→highlight gradient + gray ring. Text children always get a px-1 span for optical padding."
    >
      <DocSection title="Variants">
        <Specimen>
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <span className="px-1">Primary</span>
            </Button>
            <Button variant="secondary">
              <span className="px-1">Secondary</span>
            </Button>
            <Button variant="outline">
              <span className="px-1">Outline</span>
            </Button>
            <Button variant="ghost">
              <span className="px-1">Ghost</span>
            </Button>
            <Button variant="ghost-destructive">
              <span className="px-1">Ghost destructive</span>
            </Button>
            <Button variant="destructive">
              <span className="px-1">Destructive</span>
            </Button>
            <Button variant="link">
              <span className="px-1">Link</span>
            </Button>
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Sizes & icons">
        <Specimen>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary">
              <span className="px-1">sm · 28px</span>
            </Button>
            <Button variant="secondary">
              <span className="px-1">default · 34px</span>
            </Button>
            <Button size="lg" variant="secondary">
              <span className="px-1">lg · 36px</span>
            </Button>
            <Button variant="secondary">
              <Export />
              <span className="px-1">With icon</span>
            </Button>
            <Button size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button size="icon-sm" variant="ghost-destructive" aria-label="Delete">
              <TrashSimple />
            </Button>
            <Button disabled>
              <span className="px-1">Disabled</span>
            </Button>
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          props={[
            {
              name: 'variant',
              type: "'default' | 'secondary' | 'outline' | 'ghost' | 'ghost-destructive' | 'destructive' | 'link'",
              default: "'default'",
              description: 'Visual treatment. default = brand gradient primary.',
            },
            {
              name: 'size',
              type: "'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'",
              default: "'default'",
              description: '34px default; icon sizes are square.',
            },
            {
              name: 'render',
              type: 'ReactElement',
              default: '-',
              description:
                'Base UI composition - pass an element to render as (menus/popovers use this instead of asChild).',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            Wrap text children in <InlineCode>&lt;span className="px-1"&gt;</InlineCode>{' '}
            - 4px optical label padding, icons sit outside the span.
          </li>
          <li>
            Icon-only buttons need <InlineCode>aria-label</InlineCode> (and usually{' '}
            <InlineCode>title</InlineCode>).
          </li>
          <li>
            When a toolbar collapses to icon-only (container queries), keep count
            badges visible - see the employees-page toolbar.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
