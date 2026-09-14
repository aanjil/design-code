import { Link, createFileRoute } from '@tanstack/react-router'
import { CaretRight } from '@phosphor-icons/react'
import { DocPage, DocSection } from '@/docs/doc-kit'

export const Route = createFileRoute('/docs/components/ai')({
  component: AiComponentsIndex,
  head: () => ({ meta: [{ title: 'AI patterns - NDS Docs' }] }),
})

const AI_PAGES: Array<{ to: string; title: string; blurb: string }> = [
  {
    to: '/docs/components/ai-agent-status',
    title: 'Agent status & reasoning',
    blurb: 'Loading State, Thinking, Streaming Text, Task Rows - what the agent is doing right now.',
  },
  {
    to: '/docs/components/ai-conversational',
    title: 'Conversational input',
    blurb: 'Chat, Prompt Bar, Selection Actions - where the user talks to the agent.',
  },
  {
    to: '/docs/components/ai-decisions',
    title: 'Decisions & human-in-the-loop',
    blurb: 'Approval Card, Recommendation Card, Fine-tune Card - points where the agent asks first.',
  },
  {
    to: '/docs/components/ai-knowledge',
    title: 'Knowledge & data',
    blurb: 'Context Cards, Diff Table, Records Table, Filter Table, Insight Cards, Code Block.',
  },
  {
    to: '/docs/components/ai-navigation',
    title: 'Navigation & discovery',
    blurb: 'Sidebar Nav, Search - getting around an AI-native workspace.',
  },
]

function AiComponentsIndex() {
  return (
    <DocPage
      title="AI patterns"
      description="Patterns for AI-native surfaces - agent status, conversational input, human-in-the-loop decisions, and how an agent surfaces knowledge or lets people navigate what it found. An older, external-reference survey."
    >
      <p className="-mt-6 max-w-[560px] rounded-lg bg-background-info-highlight px-3 py-2 text-paragraph-xs text-text-info-base">
        Looking for Niural's own AI-native design language instead? That's{' '}
        <Link to="/docs/grain" className="underline">
          Grain
        </Link>
        , a separate system not yet reconciled with this survey.
      </p>

      <DocSection
        title="Component pages"
        note="docs/foundations/ai-components.md - 19 AI-native patterns surveyed from an external reference, grouped by job. Built with mock data in src/mocks/ai-components.ts. Not yet reconciled with Grain - see docs/foundations/grain.md."
      >
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {AI_PAGES.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="group flex flex-col gap-1 rounded-xl bg-background-base p-4 shadow-border-base transition-shadow hover:shadow-button-gray"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-label-sm text-text-primary">{page.title}</span>
                <CaretRight className="size-3.5 text-text-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-brand-text" />
              </span>
              <span className="text-paragraph-xs text-text-muted">{page.blurb}</span>
            </Link>
          ))}
        </div>
      </DocSection>
    </DocPage>
  )
}
