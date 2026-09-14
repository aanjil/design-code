import { Grain } from '@/components/nds/grain/grain'
import { Skeleton } from '@/components/nds/grain/process'
import { EmmaChrome } from '../chrome'
import { Collapsed, Locked, Note, Step, Timeline } from './atoms'
import { TensionSequence } from './tension'
import {
  PAYROLL_APPROVAL,
  PAYROLL_CONSEQUENCE,
  PAYROLL_DIFFERENCE,
  PAYROLL_SELECTION,
  PAYROLL_SUBMITTED,
  PAYROLL_TENSIONS,
  WHICH_PAYROLL,
} from './payroll-data'

/**
 * Run payroll (grain-flows_2.html's payroll-run view): system owns the
 * sequence, so the timeline is visible top-down and closes on submit -
 * the opposite of the Ask thread, which the user owns bottom-up.
 */
const CHIP = 'RUN · TOP-DOWN · SYSTEM OWNS SEQUENCE'

export function PayrollWhichScreen({ state }: { state: 'ask' | 'done' }) {
  return (
    <EmmaChrome activeId="payroll-run" title="Run payroll · Aug 16–31" subtitle="STEP 0 OF 3" chip={CHIP}>
      <Timeline>
        <Step n={0} title="Which payroll" summary={state === 'done' ? WHICH_PAYROLL.doneSummary : 'choosing'}>
          {state === 'ask' ? (
            <Grain
              claim={WHICH_PAYROLL.claim}
              confidence={WHICH_PAYROLL.confidence}
              facts={WHICH_PAYROLL.facts}
              provenance={WHICH_PAYROLL.provenance}
              exits={WHICH_PAYROLL.exits}
            />
          ) : (
            <Collapsed changeLabel="change">{WHICH_PAYROLL.doneSummary}</Collapsed>
          )}
        </Step>
      </Timeline>
      <Note className="mt-4">
        <b className="text-text-primary">NOT A CHAT TURN.</b> the system knows which payroll is due and says so;
        the other four are one click, priced. typing "run the january payroll" would be slower and could be
        misparsed.
      </Note>
    </EmmaChrome>
  )
}

export function PayrollPrepareScreen({ state }: { state: 'locked' | 'loading' | 'done' }) {
  return (
    <EmmaChrome activeId="payroll-run" title="Run payroll · Aug 16–31" subtitle="STEP 1 OF 3" chip={CHIP}>
      <Timeline>
        <Step n={0} title="Which payroll" summary="regular · Aug 16–31 · 44 people">
          <Collapsed changeLabel="change">{WHICH_PAYROLL.doneSummary}</Collapsed>
        </Step>
        <Step
          n={1}
          title="Prepare"
          summary={state === 'locked' ? 'waiting' : state === 'loading' ? 'pulling data…' : '3 of 44 need you'}
        >
          {state === 'locked' && <Locked>Pick the payroll type to continue.</Locked>}
          {state === 'loading' && (
            <Skeleton widths={['64%', '41%']} note="Pulling timesheets, expenses, time off and balances…" />
          )}
          {state === 'done' && (
            <div className="flex flex-col gap-2.5">
              <Grain
                claim={PAYROLL_SELECTION.claim}
                confidence={PAYROLL_SELECTION.confidence}
                facts={PAYROLL_SELECTION.facts}
                provenance={PAYROLL_SELECTION.provenance}
              />
              <Grain
                claim={PAYROLL_DIFFERENCE.claim}
                badge="LIVE"
                facts={PAYROLL_DIFFERENCE.facts}
                provenance={PAYROLL_DIFFERENCE.provenance}
                exits={PAYROLL_DIFFERENCE.exits}
              />
              <div className="mt-1 flex items-center gap-2.5">
                <button
                  type="button"
                  className="rounded-md bg-grain-ink px-2.5 py-1.5 text-label-xs text-grain-ink-foreground"
                >
                  Start with the 3 →
                </button>
                <span className="font-mono text-[10.5px] text-text-muted">41 people need nothing from you</span>
              </div>
              <Note className="mt-1">
                <b className="text-text-primary">SEVEN STEPS COLLAPSED TO ZERO.</b> gross pay, taxes, earnings and
                deductions all ran. none needed you, so none got a step. the traditional flow is this same run
                with every step forced open.
              </Note>
            </div>
          )}
        </Step>
      </Timeline>
    </EmmaChrome>
  )
}

export function PayrollResolveScreen({ resolvedCount }: { resolvedCount: 0 | 1 | 2 | 3 }) {
  return (
    <EmmaChrome activeId="payroll-run" title="Run payroll · Aug 16–31" subtitle="STEP 2 OF 3" chip={CHIP}>
      <Timeline>
        <Step n={0} title="Which payroll" summary="regular · Aug 16–31 · 44 people">
          <Collapsed changeLabel="change">{WHICH_PAYROLL.doneSummary}</Collapsed>
        </Step>
        <Step n={1} title="Prepare" summary="3 of 44 need you">
          <Collapsed changeLabel="change">3 of 44 need you — the rest are clean</Collapsed>
        </Step>
        <Step
          n={2}
          title="Resolve"
          summary={resolvedCount < 3 ? `${resolvedCount} of 3 resolved` : '3 of 3 resolved'}
        >
          <TensionSequence tensions={PAYROLL_TENSIONS} resolvedCount={resolvedCount} />
          {resolvedCount === 3 && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <button
                type="button"
                className="rounded-md bg-grain-ink px-2.5 py-1.5 text-label-xs text-grain-ink-foreground"
              >
                Confirm and run →
              </button>
              <span className="font-mono text-[10.5px] text-text-muted">3 resolved · nothing submitted yet</span>
            </div>
          )}
        </Step>
      </Timeline>
    </EmmaChrome>
  )
}

export function PayrollConfirmScreen({ state }: { state: 'locked' | 'open' | 'done' }) {
  return (
    <EmmaChrome
      activeId="payroll-run"
      title="Run payroll · Aug 16–31"
      subtitle={state === 'done' ? 'SUBMITTED · CLOSED' : 'STEP 3 OF 3'}
      chip={CHIP}
    >
      <Timeline>
        <Step n={0} title="Which payroll" summary="regular · Aug 16–31 · 44 people">
          <Collapsed changeLabel="change">{WHICH_PAYROLL.doneSummary}</Collapsed>
        </Step>
        <Step n={1} title="Prepare" summary="3 of 44 need you">
          <Collapsed changeLabel="change">3 of 44 need you — the rest are clean</Collapsed>
        </Step>
        <Step n={2} title="Resolve" summary="3 of 3 resolved">
          <div className="flex flex-col gap-2.5">
            {PAYROLL_TENSIONS.map((t, i) => (
              <Collapsed key={i}>{t.resolvedSummary}</Collapsed>
            ))}
          </div>
        </Step>
        <Step n={3} title="Confirm and run" summary={state === 'done' ? 'submitted 14:20' : 'ready to approve'}>
          {state === 'locked' && <Locked>Finish step 2 to continue.</Locked>}
          {state === 'open' && (
            <div className="flex flex-col gap-2.5">
              <Grain
                claim={PAYROLL_CONSEQUENCE.claim}
                badge="LIVE"
                facts={PAYROLL_CONSEQUENCE.facts}
                provenance={PAYROLL_CONSEQUENCE.provenance}
                exits={PAYROLL_CONSEQUENCE.exits}
              />
              <Grain
                claim={PAYROLL_APPROVAL.claim}
                badge="READY"
                body={<p className="text-paragraph-xs text-text-muted">{PAYROLL_APPROVAL.body}</p>}
                provenance={PAYROLL_APPROVAL.provenance}
                exits={PAYROLL_APPROVAL.exits}
              />
              <Note className="mt-1">
                <b className="text-text-primary">ONE TOTAL, RECONCILED IN PUBLIC.</b> the consequence grain shows
                637,150 → 634,078 with the reason on its own row, and the approval repeats the same number. two
                adjacent totals that disagree is the fastest way to lose a payroll manager.
              </Note>
            </div>
          )}
          {state === 'done' && (
            <div className="flex flex-col gap-2.5">
              <Grain
                claim={PAYROLL_SUBMITTED.claim}
                liveness={{ kind: 'stamped', asOf: '14:20' }}
                facts={PAYROLL_SUBMITTED.facts}
                provenance={PAYROLL_SUBMITTED.provenance}
                exits={[
                  { label: 'Reverse', variant: 'quiet', countdownSeconds: 45 },
                  { label: 'View audit', variant: 'quiet' },
                ]}
              />
              <Note className="mt-1">
                <b className="text-text-primary">THE RUN IS NOW CLOSED.</b> returns, failures and settlement land
                as new items in the history — not as new rows at the bottom of this timeline. an open-ended
                timeline slowly becomes a chat log, which is the thing we were escaping.
              </Note>
            </div>
          )}
        </Step>
      </Timeline>
    </EmmaChrome>
  )
}
