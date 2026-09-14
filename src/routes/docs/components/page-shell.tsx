import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import {
  PageBody,
  PageFooter,
  PageHeader,
} from '@/components/nds/layouts'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/docs/components/page-shell')({
  component: PageShellDoc,
  head: () => ({ meta: [{ title: 'Page shell - NDS Docs' }] }),
})

function PageShellDoc() {
  return (
    <DocPage
      title="Page shell"
      description="Every app screen composes AppShell → AppBar + MainLayout(Sidebar + PageLayout). The content panel floats on the surface-2 canvas with an 8px gutter; PageLayout stacks header, scrollable body, and optional footer."
    >
      <DocSection title="PageHeader" note="56px, hairline bottom border. onBack renders the chevron for detail/form pages.">
        <Specimen className="p-0">
          <div className="flex flex-col overflow-hidden rounded-xl bg-background-base">
            <PageHeader
              title="Payroll Schedule"
              actions={
                <Button>
                  <span className="px-1">New schedule</span>
                </Button>
              }
            />
            <PageHeader title="Create schedule" onBack={() => {}} />
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Body + footer" note="PageBody scrolls; PageFooter pins actions.">
        <Specimen className="p-0">
          <div className="flex h-64 flex-col overflow-hidden rounded-xl bg-background-base">
            <PageHeader title="Example" />
            <PageBody className="bg-surface-1">
              <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border-base text-paragraph-xs text-text-muted">
                page content
              </div>
            </PageBody>
            <PageFooter className="justify-end gap-2">
              <Button variant="secondary">
                <span className="px-1">Cancel</span>
              </Button>
              <Button>
                <span className="px-1">Save</span>
              </Button>
            </PageFooter>
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Pieces">
        <PropsTable
          props={[
            { name: 'AppShell', type: 'children', description: 'Full-height column on surface-2.' },
            { name: 'MainLayout', type: 'children', description: 'Floats the rounded content panel with the 8px gutter; holds Sidebar + PageLayout.' },
            { name: 'PageLayout', type: 'children', description: 'Column for header/body/footer.' },
            { name: 'PageHeader', type: 'title · actions? · onBack?', description: 'Title row; actions cluster right; back chevron for sub-pages.' },
            { name: 'PageBody', type: 'className? · children', description: 'The scroll container (p-4).' },
            { name: 'PageFooter', type: 'className? · children', description: 'Pinned bottom bar with hairline top border.' },
          ]}
        />
      </DocSection>

      <DocSection title="Form flows">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            Wizards and hire flows skip the shell entirely -{' '}
            <InlineCode>FormShell</InlineCode> (multi-payroll) renders a slim title bar,
            a left <InlineCode>Stepper</InlineCode> rail, and a centered card column
            with no AppBar or Sidebar.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
