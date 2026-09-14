import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import { Stepper } from '@/components/nds/stepper'

export const Route = createFileRoute('/docs/components/stepper')({
  component: StepperDoc,
  head: () => ({ meta: [{ title: 'Stepper - NDS Docs' }] }),
})

const STEPS = ['Details', 'Membership', 'Resolve conflicts', 'Review']

function StepperDoc() {
  const [current, setCurrent] = useState(2)
  return (
    <DocPage
      title="Stepper"
      description="Vertical wizard progress (Figma 89:5507): 24px state icons with Label/XSmall labels and 24px hairline connectors. Done = brand check + brand label · current = slow brand spinner · upcoming = muted check."
    >
      <DocSection title="States" note="The three positions of the same four-step flow.">
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <Specimen label="current={0} - start">
            <Stepper steps={STEPS} current={0} />
          </Specimen>
          <Specimen label="current={2} - mid-flow">
            <Stepper steps={STEPS} current={2} />
          </Specimen>
          <Specimen label="current={4} - all done">
            <Stepper steps={STEPS} current={4} />
          </Specimen>
        </div>
      </DocSection>

      <DocSection
        title="Clickable history"
        note="With onStepClick, completed steps navigate back - upcoming steps never do. Try it."
      >
        <Specimen>
          <Stepper steps={STEPS} current={current} onStepClick={setCurrent} />
        </Specimen>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          props={[
            {
              name: 'steps',
              type: 'Array<string>',
              description: 'Step labels, in order.',
            },
            {
              name: 'current',
              type: 'number',
              description:
                'Index of the in-progress step. Everything before is done; pass steps.length for all-complete.',
            },
            {
              name: 'onStepClick',
              type: '(index: number) => void',
              default: '-',
              description: 'Makes completed steps clickable (jump back to edit).',
            },
            {
              name: 'className',
              type: 'string',
              default: '-',
              description: 'Merged onto the root list.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Usage">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            Lives in the left rail of <InlineCode>FormShell</InlineCode> - form flows
            have no AppBar/Sidebar.
          </li>
          <li>
            The current-step spinner spins slowly (2.5s) - it signals “you are here”,
            not loading.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
