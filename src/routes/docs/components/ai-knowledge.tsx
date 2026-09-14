import { createFileRoute } from '@tanstack/react-router'
import { DocPage, PropsTable, ShowcaseSection } from '@/docs/doc-kit'
import {
  CodeBlock,
  ContextCards,
  DiffTable,
  FilterTable,
  InsightCards,
  RecordsTable,
} from '@/components/nds/ai/knowledge'
import {
  codeBlock,
  contextChunks,
  diffTable,
  filterTableRows,
  insightCard,
  vendorRecords,
} from '@/mocks/ai-components'

export const Route = createFileRoute('/docs/components/ai-knowledge')({
  component: AiKnowledgeDoc,
  head: () => ({ meta: [{ title: 'Knowledge & data - NDS Docs' }] }),
})

function AiKnowledgeDoc() {
  return (
    <DocPage
      title="Knowledge & data"
      description="Structured or retrieved information the agent is reasoning over."
    >
      <ShowcaseSection
        index={1}
        title="Context Cards"
        description="Retrieved knowledge chunks with source badges and char counts - the RAG-citation pattern."
        props={
          <PropsTable
            props={[
              { name: 'totalChunks', type: 'number', description: 'Total chunks available, shown in the header.' },
              { name: 'chunks', type: 'Array<ContextChunk>', description: 'Retrieved chunks to render as cards.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[420px]">
          <ContextCards totalChunks={contextChunks.totalChunks} chunks={contextChunks.chunks} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={2}
        title="Diff Table"
        description="AI-proposed edits overlaid on a normal table - only the changed cell gets a diff treatment, not the full row."
        wide
        props={
          <PropsTable
            props={[
              { name: 'columns', type: 'Array<string>', description: 'Column labels, in display order.' },
              { name: 'rows', type: 'Array<DiffRow>', description: 'Row data; `changed` marks the proposed-edit field.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the table.' },
            ]}
          />
        }
      >
        <DiffTable columns={diffTable.columns} rows={diffTable.rows} />
      </ShowcaseSection>

      <ShowcaseSection
        index={3}
        title="Records Table"
        description="CRM-style grid: name + location, category chips, relative last-interaction, connection strength, external link, footer count."
        wide
        props={
          <PropsTable
            props={[
              { name: 'records', type: 'Array<VendorRecord>', description: 'Vendor/contact rows to render.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the table.' },
            ]}
          />
        }
      >
        <RecordsTable records={vendorRecords} />
      </ShowcaseSection>

      <ShowcaseSection
        index={4}
        title="Filter Table"
        description="Status-chip tabs live-filter the table below; each chip carries a count. Default filter is All."
        wide
        props={
          <PropsTable
            props={[
              { name: 'rows', type: 'Array<FilterTableRow>', description: 'Unfiltered rows; chips derive from distinct statuses.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the wrapper.' },
            ]}
          />
        }
      >
        <FilterTable rows={filterTableRows} />
      </ShowcaseSection>

      <ShowcaseSection
        index={5}
        title="Insight Cards"
        description="Narrative agent insight backed by stat rows (signed % and $, colored by sign) and a follow-up prompt suggestion."
        props={
          <PropsTable
            props={[
              { name: 'totalInsights', type: 'number', description: 'Count shown in the header.' },
              { name: 'headline', type: 'string', description: 'Narrative summary sentence.' },
              { name: 'metrics', type: 'Array<InsightMetric>', description: 'Stat rows: label, changePct, changeAmount.' },
              { name: 'followUp', type: 'string', description: 'Suggested next prompt, shown as a pill button.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the card.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[420px]">
          <InsightCards
            totalInsights={insightCard.totalInsights}
            headline={insightCard.headline}
            metrics={insightCard.metrics}
            followUp={insightCard.followUp}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={6}
        title="Code Block"
        description="Agent-authored code: filename + language tag header with copy, numbered mono lines."
        props={
          <PropsTable
            props={[
              { name: 'filename', type: 'string', description: 'Shown left of the language tag.' },
              { name: 'language', type: 'string', description: 'Shown as a small tag in the header.' },
              { name: 'lines', type: 'Array<string>', description: 'Code lines, rendered numbered.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the panel.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[480px]">
          <CodeBlock filename={codeBlock.filename} language={codeBlock.language} lines={codeBlock.lines} />
        </div>
      </ShowcaseSection>

      <section className="border-t border-dashed border-border-muted pt-8">
        <h2 className="text-title-h5 text-text-primary">Rules</h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            All four tables here sit on `ui/table` primitives and the Table recipe (54px
            rows, `px-5` cells, `StatusPill` for status/strength) - once promoted out of
            scouting they should fold into `nds/editable-table` conventions rather than
            fork a second table system.
          </li>
          <li>
            Diffs and insights should always read as proposed, not applied - the diff
            cell and the follow-up pill are suggestions, never silent mutations.
          </li>
        </ul>
      </section>
    </DocPage>
  )
}
