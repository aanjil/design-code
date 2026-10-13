import { createFileRoute } from '@tanstack/react-router'
import { Export, Plus, TrashSimple } from '@phosphor-icons/react'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import { Button, IconButton } from '@niural/components'

export const Route = createFileRoute('/docs/components/buttons')({
  component: ButtonsDoc,
  head: () => ({ meta: [{ title: 'Buttons - NDS Docs' }] }),
})

function ButtonsDoc() {
  return (
    <DocPage
      title="Buttons"
      description="Button and IconButton from @niural/components. 34px default height (md), control radius, Label/Small. Pick a variant (solid, ghost, outline) and a shade (primary, neutral, error). The label is padded for you; icons go in leftIcon/rightIcon."
    >
      <DocSection title="Variants">
        <Specimen>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="solid" shade="primary" type="button">
              Primary
            </Button>
            <Button variant="solid" shade="neutral" type="button">
              Secondary
            </Button>
            <Button variant="ghost" shade="neutral" type="button">
              Ghost
            </Button>
            <Button variant="ghost" shade="error" type="button">
              Ghost destructive
            </Button>
            <Button variant="solid" shade="error" type="button">
              Destructive
            </Button>
            <Button variant="ghost" shade="primary" type="button">
              Link
            </Button>
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Sizes & icons">
        <Specimen>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="solid" shade="neutral" size="sm" type="button">
              sm · 28px
            </Button>
            <Button variant="solid" shade="neutral" type="button">
              md · 34px
            </Button>
            <Button variant="solid" shade="neutral" size="lg" type="button">
              lg · 40px
            </Button>
            <Button
              variant="solid"
              shade="neutral"
              type="button"
              leftIcon={<Export className="size-4" />}
            >
              With icon
            </Button>
            <IconButton variant="solid" shade="primary" size="default" aria-label="Add">
              <Plus className="size-4" />
            </IconButton>
            <IconButton variant="ghost" shade="error" size="small" aria-label="Delete">
              <TrashSimple className="size-4" />
            </IconButton>
            <Button variant="solid" shade="primary" type="button" disabled>
              Disabled
            </Button>
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          props={[
            {
              name: 'variant',
              type: "'solid' | 'ghost' | 'outline'",
              default: "'solid'",
              description: 'Visual treatment. Combine with shade.',
            },
            {
              name: 'shade',
              type: "'primary' | 'neutral' | 'error'",
              default: "'primary'",
              description:
                'Colour family. solid + primary = brand gradient; solid + neutral = secondary; ghost + neutral = quiet toolbar button.',
            },
            {
              name: 'size',
              type: "'sm' | 'md' | 'lg'",
              default: "'md'",
              description: '28 / 34 / 40px. Icon-only buttons use IconButton (xsmall | small | default | large).',
            },
            {
              name: 'leftIcon / rightIcon',
              type: 'ReactNode',
              default: '-',
              description: 'Icons sit outside the padded label.',
            },
            {
              name: 'as',
              type: 'ElementType',
              default: "'button'",
              description: 'Polymorphic root, e.g. as={Link} to render a router link.',
            },
            {
              name: 'isLoading / loadingText',
              type: 'boolean / string',
              default: 'false',
              description: 'Shows a spinner and disables the button.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            Pass plain text as children. The label already has 4px optical padding, so
            don't wrap it in <InlineCode>&lt;span className="px-1"&gt;</InlineCode>.
          </li>
          <li>
            Always pass <InlineCode>type="button"</InlineCode> unless the button submits a
            form. Button does not default it.
          </li>
          <li>
            Icon-only buttons use <InlineCode>IconButton</InlineCode> with an{' '}
            <InlineCode>aria-label</InlineCode>; pass the icon as its child.
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
