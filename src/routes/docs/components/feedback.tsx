import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, PropsTable, Specimen } from '@/docs/doc-kit'
import { Banner, EmmaCard } from '@/components/nds/feedback'
import { StatusPill } from '@/components/nds/controls'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/playground/kbd'

export const Route = createFileRoute('/docs/components/feedback')({
  component: FeedbackDoc,
  head: () => ({ meta: [{ title: 'Feedback - NDS Docs' }] }),
})

function FeedbackDoc() {
  return (
    <DocPage
      title="Feedback"
      description="Status pills for table rows, five banner tones on the *-highlight surfaces, and the Emma suggestion card with the AI glow shadow."
    >
      <DocSection title="StatusPill">
        <Specimen>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill dotClassName="bg-background-success-base">Active</StatusPill>
            <StatusPill dotClassName="bg-background-info-base">Invited</StatusPill>
            <StatusPill dotClassName="bg-background-warning-base">Onboarding</StatusPill>
            <StatusPill dotClassName="bg-background-emphasis">Offboarded</StatusPill>
            <Kbd>⌘K</Kbd>
          </div>
        </Specimen>
      </DocSection>

      <DocSection
        title="Banner"
        note="Title is Label/XSmall; body Paragraph/XSmall muted; optional action row."
      >
        <Specimen>
          <div className="flex max-w-[560px] flex-col gap-2.5">
            <Banner tone="info" title="Nothing is paid yet">
              Creating a schedule never runs payroll - you approve every run.
            </Banner>
            <Banner tone="success" title="Takes effect immediately">
              Next payday on the new schedule: Jul 31, 2026.
            </Banner>
            <Banner tone="warning" title="2 matches already belong to another schedule">
              Resolve them on the next step before creating.
            </Banner>
            <Banner tone="error" title="24 members still on this schedule">
              Everyone needs a destination schedule first.
            </Banner>
            <Banner tone="pending" title="Scheduled for Jul 24, 2026">
              Stays on the current schedule until then.
            </Banner>
          </div>
        </Specimen>
        <div className="mt-4">
          <PropsTable
            props={[
              {
                name: 'tone',
                type: "'info' | 'warning' | 'error' | 'success' | 'pending'",
                description: 'Surface + icon pair. pending uses the brand surface.',
              },
              { name: 'title', type: 'string', description: 'One-line headline.' },
              { name: 'children', type: 'ReactNode', default: '-', description: 'Muted body copy.' },
              { name: 'actions', type: 'ReactNode', default: '-', description: 'Buttons row under the body.' },
            ]}
          />
        </div>
      </DocSection>

      <DocSection title="EmmaCard" note="AI suggestions: shadow-ai glow, filled Sparkle, brand header.">
        <Specimen>
          <div className="max-w-[560px]">
            <EmmaCard
              title="Compliance"
              actions={
                <>
                  <Button size="sm">
                    <span className="px-1">Switch to Semi-monthly</span>
                  </Button>
                  <Button variant="secondary" size="sm">
                    <span className="px-1">Exclude CA hourly</span>
                  </Button>
                </>
              }
            >
              Two ways to make this schedule compliant: switch its frequency to
              Semi-monthly, or add a rule excluding the 3 California hourly employees.
            </EmmaCard>
          </div>
        </Specimen>
        <div className="mt-4">
          <PropsTable
            props={[
              { name: 'title', type: 'string', description: 'Header suffix: “Emma · {title}”.' },
              { name: 'children', type: 'ReactNode', description: 'The suggestion body.' },
              { name: 'actions', type: 'ReactNode', default: '-', description: 'Apply/dismiss buttons.' },
            ]}
          />
        </div>
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>Banners inform inside a flow; blocking decisions get a modal instead.</li>
          <li>Emma always proposes, never applies - every card needs an explicit action.</li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
