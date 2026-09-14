import { ChatCircle, FileText } from '@phosphor-icons/react'
import { AppBar } from '@/components/nds/app-bar'
import { AppShell, MainLayout, PageBody, PageHeader, PageLayout } from '@/components/nds/layouts'
import { PromptBar } from '@/components/nds/ai/conversational'
import { promptBar } from '@/mocks/ai-components'
import { BENEFITS_PROMPTS, HR_DOCUMENTS, PTO_PROMPTS } from './data'
import type { DocSuggestion } from './data'

/**
 * New chat (Figma "Niural-AI", node 6479:82938) - no sidebar, no history:
 * a brand-new session opens with a big prompt (glow treatment, the same
 * `shadow-ai` token the appbar's Ask Emma button uses) and suggestions
 * grouped by which agent would answer them. Distinct from the launcher
 * (home.tsx, grain-flows_2.html) - this is what "+ New" in the chat
 * sidebar opens into, once a thread exists (see thread.tsx).
 */
export function NewChatScreen() {
  return (
    <AppShell>
      <AppBar activeItem="People" aiSelected tokenBalance={{ tokens: 12400 }} />
      <MainLayout>
        <PageLayout>
          <PageHeader title="Ask Emma" />
          <PageBody className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-16 pt-12">
            <div className="flex flex-col items-center gap-8 text-center">
              <div>
                <p className="text-title-h5 text-text-muted">Hello, John 👋🏻</p>
                <p className="text-title-h4 text-text-primary">What do you want to do today?</p>
              </div>
              <PromptBar
                sources={promptBar.sources}
                placeholder="Ask Emma"
                className="w-full rounded-2xl p-3 shadow-ai"
              />
            </div>

            <section className="flex w-full flex-col gap-3">
              <p className="text-label-md text-text-primary">Create HR documents</p>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                {HR_DOCUMENTS.map((doc) => (
                  <DocCard key={doc.title} doc={doc} />
                ))}
              </div>
            </section>

            <section className="flex w-full flex-col gap-3">
              <div className="flex items-center gap-2">
                <ChatCircle className="size-4.5 text-text-primary" />
                <p className="text-label-md text-text-primary">Benefits Agent</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {BENEFITS_PROMPTS.map((prompt) => (
                  <PillPrompt key={prompt}>{prompt}</PillPrompt>
                ))}
              </div>
            </section>

            <section className="flex w-full flex-col gap-3">
              <p className="text-label-md text-text-primary">Time-off (PTO) agent</p>
              <div className="flex flex-wrap gap-3">
                {PTO_PROMPTS.map((prompt) => (
                  <CardPrompt key={prompt}>{prompt}</CardPrompt>
                ))}
              </div>
            </section>
          </PageBody>
        </PageLayout>
      </MainLayout>
    </AppShell>
  )
}

function DocCard({ doc }: { doc: DocSuggestion }) {
  return (
    <button
      type="button"
      className="relative flex flex-col gap-5 rounded-xl bg-background-base p-2 text-left shadow-card"
    >
      {doc.badge && (
        <span className="absolute top-1 right-1 rounded-lg bg-background-info-muted-hover px-1.5 py-0.5 text-caption-md text-text-info-base">
          {doc.badge}
        </span>
      )}
      <span className="flex size-[57px] items-center justify-center rounded-lg border border-border-base bg-background-highlight">
        <FileText className="size-6 text-brand-text" />
      </span>
      <span className="flex flex-col">
        <span className="text-label-sm text-text-primary">{doc.title}</span>
        <span className="text-paragraph-xs text-text-muted">{doc.blurb}</span>
      </span>
    </button>
  )
}

function PillPrompt({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-full border border-border-base bg-background-base px-3 py-2 text-left text-label-sm text-text-primary hover:border-text-muted"
    >
      {children}
    </button>
  )
}

function CardPrompt({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-lg bg-background-base px-3 py-2 text-left text-label-sm text-text-primary shadow-button-gray"
    >
      <span className="size-4.5 shrink-0 rounded bg-gradient-to-br from-[#714dff] to-[#e151ff]" />
      {children}
    </button>
  )
}
