import { createFileRoute } from '@tanstack/react-router'
import { DocPage, PropsTable, ShowcaseSection } from '@/docs/doc-kit'
import {
  ApprovalCard,
  FineTuneCard,
  RecommendationCard,
} from '@/components/nds/ai/decisions'

export const Route = createFileRoute('/docs/components/ai-decisions')({
  component: AiDecisionsDoc,
  head: () => ({ meta: [{ title: 'Decisions & human-in-the-loop - NDS Docs' }] }),
})

function AiDecisionsDoc() {
  return (
    <DocPage
      title="Decisions & human-in-the-loop"
      description="Points where the agent asks for a decision instead of acting alone: a blocking approval, a recommendation with confidence, or a props inspector for fine-tuning."
    >
      <ShowcaseSection
        index={1}
        title="Approval Card"
        description="Blocks on a question with a list of choices; picking one confirms visually and never auto-continues."
        props={
          <PropsTable
            props={[
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the card wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[420px]">
          <ApprovalCard />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={2}
        title="Recommendation Card"
        description="Confidence badge on the headline recommendation; alternatives expand into their own confidence-scored list."
        props={
          <PropsTable
            props={[
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the card wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[420px]">
          <RecommendationCard />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={3}
        title="Fine-tune Card"
        description="Inspector-style panel for adjusting a target's layout props - steppers, numeric input, slider, and a select, all label-over-compact-input."
        props={
          <PropsTable
            props={[
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the card wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[420px]">
          <FineTuneCard />
        </div>
      </ShowcaseSection>

      <section className="border-t border-dashed border-border-muted pt-8">
        <h2 className="text-title-h5 text-text-primary">Rules</h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            The agent proposes and waits - every card resolves through an explicit
            click, never a timeout or an implicit default.
          </li>
          <li>
            Confidence is always visible next to the choice it describes, including
            on alternatives, so lower-confidence options never look equivalent to
            the primary one.
          </li>
        </ul>
      </section>
    </DocPage>
  )
}
