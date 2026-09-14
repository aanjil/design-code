import { Grain } from '@/components/nds/grain/grain'
import { PromptBar } from '@/components/nds/ai/conversational'
import { promptBar } from '@/mocks/ai-components'
import { EmmaChrome } from '../chrome'
import { Note } from './atoms'

/**
 * PTO carryover policy (grain-flows_2.html's ASK view) - same grains,
 * opposite direction from a run: the user owns what comes next, so the
 * composer is anchored at the bottom and the thread stays open, instead
 * of closing top-down like payroll/expense.
 */
const CHIP = 'ASK · BOTTOM-UP · YOU OWN SEQUENCE'

const POLICY_ANSWER = {
  claim: 'US caps carryover at 5 days. Spain carries everything.',
  facts: [
    { label: 'Anjil Crafts · New York', value: '5 days max, expires 31 Mar' },
    { label: 'Anjil Crafts Spain', value: 'unlimited, statutory' },
    { label: 'Anjil Craft Nepal', value: 'no policy set', tone: 'warn' as const },
  ],
  provenance: 'Time-off policy v3 · set 1 Jan by Priya Nair',
}

const LIVE_ANSWER = {
  claim: '7 people will lose 23 days between them on 31 March',
  facts: [
    { label: 'Over the 5-day cap', value: '7 of 31 US staff' },
    { label: 'Days that expire', value: '23', tone: 'stop' as const },
    { label: 'Largest single balance', value: 'Michael Brown · 9 days' },
  ],
  provenance: 'balances as of today · accruals synced 9 days ago',
}

export function AskThreadScreen({ state }: { state: 'q1' | 'q2' }) {
  return (
    <EmmaChrome activeId="pto-ask" title="PTO carryover policy" subtitle={state === 'q1' ? '2 MESSAGES' : '4 MESSAGES'} chip={CHIP}>
      <div className="flex flex-col gap-3.5">
        <UserBubble>what's our carryover policy for PTO?</UserBubble>
        <EmmaMessage>
          <p className="mb-2 text-paragraph-sm text-text-muted">
            Different by entity — here's the one that actually bites.
          </p>
          <Grain
            claim={POLICY_ANSWER.claim}
            badge="AS OF JAN 1"
            facts={POLICY_ANSWER.facts}
            provenance={POLICY_ANSWER.provenance}
            exits={[
              { label: 'Why?', variant: 'quiet' },
              { label: 'Open policies →', variant: 'default' },
            ]}
          />
        </EmmaMessage>

        {state === 'q2' && (
          <>
            <UserBubble>how many people are over the US cap right now?</UserBubble>
            <EmmaMessage>
              <Grain
                claim={LIVE_ANSWER.claim}
                badge="LIVE"
                facts={LIVE_ANSWER.facts}
                provenance={LIVE_ANSWER.provenance}
                exits={[
                  { label: 'Draft a reminder to the 7', variant: 'default' },
                  { label: 'Open time off →', variant: 'default' },
                ]}
              />
            </EmmaMessage>
          </>
        )}
      </div>

      <div className="mt-4">
        <PromptBar sources={promptBar.sources} placeholder="Ask a follow-up" />
      </div>
      <p className="mt-1.5 border-t border-dashed border-border-base pt-1.5 text-center font-mono text-[10px] text-text-disabled">
        ↑ NEWEST AT THE BOTTOM · THE THREAD HAS NO END
      </p>
      <Note className="mt-2.5">
        <b className="text-text-primary">SAME GRAINS, OPPOSITE DIRECTION.</b> here the user owns what comes next,
        so the composer is anchored at the bottom and the thread stays open. in a run the system owns it, so the
        sequence is visible from the top and it closes. that is the entire difference between the two surfaces.
      </Note>
    </EmmaChrome>
  )
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <p className="ml-auto max-w-[74%] rounded-2xl rounded-br-sm bg-brand-muted px-3.5 py-2 text-paragraph-sm text-brand-text">
      {children}
    </p>
  )
}

function EmmaMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 size-5 shrink-0 rounded-md bg-grain-ink" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
