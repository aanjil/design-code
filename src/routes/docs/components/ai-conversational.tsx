import { createFileRoute } from '@tanstack/react-router'
import { DocPage, PropsTable, ShowcaseSection } from '@/docs/doc-kit'
import { Chat, PromptBar, SelectionActions } from '@/components/nds/ai/conversational'
import { chatThread, promptBar, selectionActions } from '@/mocks/ai-components'

export const Route = createFileRoute('/docs/components/ai-conversational')({
  component: AiConversationalDoc,
  head: () => ({ meta: [{ title: 'Conversational input - NDS Docs' }] }),
})

function AiConversationalDoc() {
  return (
    <DocPage
      title="Conversational input"
      description="Where the user talks to the agent - tabbed chat, composer bar, and a floating toolbar on a text selection."
    >
      <ShowcaseSection
        index={1}
        title="Chat"
        description="Tab row switches topic threads; the active prompt reads like a sent message; each reply carries a reasoning chip above its body."
        props={
          <PropsTable
            props={[
              { name: 'tabs', type: 'Array<string>', description: 'Topic tabs rendered above the thread.' },
              { name: 'activeTab', type: 'string', default: 'tabs[0]', description: 'Initially selected tab.' },
              { name: 'prompt', type: 'string', description: 'User message shown at the top of the thread.' },
              { name: 'messages', type: 'Array<ChatMessage>', description: 'Reasoning-labeled agent replies.' },
              { name: 'placeholder', type: 'string', default: "'Ask a follow-up…'", description: 'Composer input placeholder.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the panel.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[560px]">
          <Chat
            tabs={chatThread.tabs}
            activeTab={chatThread.activeTab}
            prompt={chatThread.prompt}
            messages={chatThread.messages}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={2}
        title="Prompt Bar"
        description="Pill composer: left trigger opens a source picker, right side holds attach/dictate/send."
        props={
          <PropsTable
            props={[
              { name: 'sources', type: 'Array<PromptSource>', description: 'Connected sources listed in the add-sources menu.' },
              { name: 'placeholder', type: 'string', default: "'Ask a question…'", description: 'Composer input placeholder.' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the bar.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[560px]">
          <PromptBar sources={promptBar.sources} placeholder={promptBar.placeholder} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={3}
        title="Selection Actions"
        description="First sentence of the selection gets a brand tint; the toolbar below hands it to the agent."
        props={
          <PropsTable
            props={[
              { name: 'text', type: 'string', description: 'Selected passage; its first sentence is tinted.' },
              { name: 'actions', type: 'Array<string>', description: 'Toolbar action labels (Explain, Improve, …).' },
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the wrapper.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[560px]">
          <SelectionActions text={selectionActions.text} actions={selectionActions.actions} />
        </div>
      </ShowcaseSection>

      <section className="border-t border-dashed border-border-muted pt-8">
        <h2 className="text-title-h5 text-text-primary">Rules</h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>Reasoning chips explain what the agent did, not just that it thought - keep them specific ("Time Data", not "Thinking").</li>
          <li>Selection actions never mutate text directly - they hand the selection to the agent, which proposes a change elsewhere.</li>
        </ul>
      </section>
    </DocPage>
  )
}
