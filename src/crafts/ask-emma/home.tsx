import { Grain } from '@/components/nds/grain/grain'
import { PromptBar } from '@/components/nds/ai/conversational'
import { promptBar } from '@/mocks/ai-components'
import { EmmaChrome } from './chrome'
import { Note, SectionLabel } from './flows/atoms'
import { LAUNCHER_ALERT, START_CARDS, WORLD_TODAY_LABEL } from './mocks'
import type { StartCard } from './mocks'

/**
 * The launcher (grain-flows_2.html HOME view) - "the launcher opens with
 * a claim, not a text box." A run has a known sequence, so it gets a
 * button; a question has an unknown one, so it gets a box - present and
 * small, the exception path rather than the front door.
 */
export function HomeScreen({ empty = false }: { empty?: boolean }) {
  return (
    <EmmaChrome title="Emma" subtitle={WORLD_TODAY_LABEL} chip="LAUNCHER">
      <h1 className="text-title-h3 text-text-primary">
        {empty ? 'Nothing needs you today' : '3 things need you today'}
      </h1>
      <p className="mt-1.5 mb-6 max-w-[60ch] text-paragraph-sm text-text-muted">
        {empty
          ? 'Payroll, expenses and compliance are all clear. Start a run, or ask Emma something.'
          : 'The launcher opens with a claim, not a text box. An empty prompt at the start of a session is a blank-canvas problem the system could have solved itself.'}
      </p>

      {!empty && (
        <div className="mb-6 max-w-[560px]">
          <Grain
            claim={LAUNCHER_ALERT.claim}
            badge="LIVE"
            facts={LAUNCHER_ALERT.facts}
            provenance={LAUNCHER_ALERT.provenance}
            exits={LAUNCHER_ALERT.exits}
          />
        </div>
      )}

      <SectionLabel>START A RUN</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
        {START_CARDS.map((card) => (
          <StartCardButton key={card.id} card={card} />
        ))}
      </div>

      <SectionLabel className="mt-6">OR ASK</SectionLabel>
      <PromptBar sources={promptBar.sources} placeholder="Ask about people, payroll, benefits or policy" />

      <Note className="mt-4">
        <b className="text-text-primary">THE SPLIT.</b> a run has a known sequence, so it gets a button. a
        question has an unknown one, so it gets a box. the box is present and small — it is the exception
        path, not the front door.
      </Note>
    </EmmaChrome>
  )
}

function StartCardButton({ card }: { card: StartCard }) {
  return (
    <button
      type="button"
      className="flex items-start gap-3 rounded-xl border border-border-base bg-background-base p-3.5 text-left transition-colors hover:border-text-muted"
    >
      <span className="mt-1.5 block size-2 shrink-0 rounded-sm bg-grain-ink" />
      <span className="min-w-0 flex-1">
        <span className="block text-label-sm font-medium text-text-primary">{card.title}</span>
        <span className="mt-0.5 block text-paragraph-xs text-text-muted">{card.blurb}</span>
      </span>
      {card.due && (
        <span className="shrink-0 rounded-sm bg-background-warning-highlight px-1.5 py-1 font-mono text-[9.5px] tracking-wide text-text-warning-base">
          {card.due}
        </span>
      )}
    </button>
  )
}
