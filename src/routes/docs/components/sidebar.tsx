import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import { PAYMENTS_SIDEBAR, Sidebar } from '@/components/nds/sidebar'

export const Route = createFileRoute('/docs/components/sidebar')({
  component: SidebarDoc,
  head: () => ({ meta: [{ title: 'Sidebar - NDS Docs' }] }),
})

function SidebarDoc() {
  return (
    <DocPage
      title="Sidebar"
      description="200px section nav on a translucent blurred panel. Groups with optional caption titles; the active item is a white pill with the gray ring and brand text."
    >
      <DocSection
        title="Configurations"
        note="People is the default; Payments ships as PAYMENTS_SIDEBAR (used by the multi-payroll craft)."
      >
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Specimen className="p-0" label="Default - People">
            <div className="h-[480px] overflow-hidden rounded-xl">
              <Sidebar />
            </div>
          </Specimen>
          <Specimen className="p-0" label="Payments - groups={PAYMENTS_SIDEBAR}">
            <div className="h-[480px] overflow-hidden rounded-xl">
              <Sidebar
                title="Payments"
                groups={PAYMENTS_SIDEBAR}
                activeItem="Payroll Schedule"
              />
            </div>
          </Specimen>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          props={[
            {
              name: 'title',
              type: 'string',
              default: "'People'",
              description: 'Section title above the nav (18px / 550).',
            },
            {
              name: 'groups',
              type: 'Array<{ title?: string; items: Array<{ label; icon }> }>',
              default: 'PEOPLE_SIDEBAR',
              description:
                'Nav groups. Untitled groups render without a caption; icons are Phosphor components.',
            },
            {
              name: 'activeItem',
              type: 'string',
              default: "'Employees'",
              description: 'Label of the active item (white pill + brand text).',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Usage">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            Second child of <InlineCode>MainLayout</InlineCode>, before{' '}
            <InlineCode>PageLayout</InlineCode>.
          </li>
          <li>
            Form flows (wizards, hire) drop the sidebar entirely - use{' '}
            <InlineCode>FormShell</InlineCode> with a <InlineCode>Stepper</InlineCode>{' '}
            instead.
          </li>
          <li>
            Group captions are Caption/Medium muted - keep them to one or two words.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
