import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DocPage, PropsTable, ShowcaseSection, VariantPills } from '@/docs/doc-kit'
import {
  LoadingState,
  StreamingText,
  TaskRows,
  Thinking,
} from '@/components/nds/ai/agent-status'

export const Route = createFileRoute('/docs/components/ai-agent-status')({
  component: AgentStatusDoc,
  head: () => ({ meta: [{ title: 'Agent status & reasoning - NDS Docs' }] }),
})

const LOADING_VARIANTS = ['drive', 'dots', 'orbit'] as const

function AgentStatusDoc() {
  const [variant, setVariant] = useState<(typeof LOADING_VARIANTS)[number]>('drive')

  return (
    <DocPage
      title="Agent status & reasoning"
      description="The states an agent shows while it works: a live loader, an expandable thinking trace, a streamed answer with sources, and a task checklist with sub-steps."
    >
      <ShowcaseSection
        index={1}
        title="Loading State"
        description="Label + elapsed seconds, paired with one of three visual styles."
        variants={
          <VariantPills options={LOADING_VARIANTS} value={variant} onChange={setVariant} />
        }
        props={
          <PropsTable
            props={[
              { name: 'label', type: 'string', default: 'loadingState.label', description: 'What the agent is doing.' },
              { name: 'elapsedSeconds', type: 'number', default: 'loadingState.elapsedSeconds', description: 'Elapsed time shown after the label.' },
              { name: 'variant', type: "'drive' | 'dots' | 'orbit'", default: "'drive'", description: 'Visual style of the loading indicator.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the wrapper.' },
            ]}
          />
        }
      >
        <LoadingState variant={variant} />
      </ShowcaseSection>

      <ShowcaseSection
        index={2}
        title="Thinking"
        description="Collapsed by default - click the header to expand the trace and switch tabs."
        props={
          <PropsTable
            props={[
              { name: 'durationSeconds', type: 'number', default: 'thinkingTrace.durationSeconds', description: 'Shown in the "Thought for {n} seconds" header.' },
              { name: 'steps', type: 'Array<ThinkingStep>', default: 'thinkingTrace.steps', description: 'Rows in the Steps tab, each with an optional count badge.' },
              { name: 'tabs', type: 'ReadonlyArray<string>', default: 'thinkingTrace.tabs', description: 'Tab labels; only Steps renders real content.' },
              { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Whether the trace starts expanded.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[420px]">
          <Thinking />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={3}
        title="Streaming Text"
        description="Static rendered answer - the source list and follow-ups are the point, not the streaming motion."
        props={
          <PropsTable
            props={[
              { name: 'text', type: 'string', default: 'streamingAnswer.text', description: 'The rendered answer body.' },
              { name: 'sourceCount', type: 'number', default: 'streamingAnswer.sourceCount', description: 'Count shown on the sources toggle.' },
              { name: 'sources', type: 'Array<StreamSource>', default: 'streamingAnswer.sources', description: 'Revealed when the sources toggle is open.' },
              { name: 'followUps', type: 'Array<string>', default: 'streamingAnswer.followUps', description: 'Pill buttons rendered under the answer.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[480px]">
          <StreamingText />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={4}
        title="Task Rows"
        description="Status indicator per row - completed, running, queued, failed, deferred - with expandable sub-rows or rich content."
        props={
          <PropsTable
            props={[
              { name: 'rows', type: 'Array<TaskRow & { content?: ReactNode }>', default: 'taskRows', description: 'Rows to render. subRows renders a plain sub-list; content (if present) renders instead, for rich expanded UI - e.g. the dynamic-timeline craft expands a row into full tension cards.' },
              { name: 'openIndex', type: 'number | null', default: 'undefined (uncontrolled)', description: 'Drives which row is expanded from outside - e.g. an attention-driven timeline that auto-opens whichever row needs a decision. Omit for default click-to-toggle behavior.' },
              { name: 'onOpenChange', type: '(index: number | null) => void', default: '-', description: 'Fires when a row is toggled while openIndex is controlled.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[480px]">
          <TaskRows />
        </div>
      </ShowcaseSection>

      <section className="border-t border-dashed border-border-muted pt-8">
        <h2 className="text-title-h5 text-text-primary">Rules</h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>Thinking traces start collapsed - reasoning is scaffolding, not the answer.</li>
          <li>Task row status colors always pair with the same icon (check / spinner / dot / warning / clock for deferred) so state reads without color alone.</li>
          <li>Deferred is not completed - a row someone explicitly punted on ("asked, moved on") should never collapse into the same look as one that was resolved.</li>
        </ul>
      </section>
    </DocPage>
  )
}
