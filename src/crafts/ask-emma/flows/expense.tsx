import { File, UploadSimple } from '@phosphor-icons/react'
import { Grain } from '@/components/nds/grain/grain'
import { StepList, ToolChip } from '@/components/nds/grain/process'
import { EmmaChrome } from '../chrome'
import { Collapsed, Locked, Note, Step, Timeline } from './atoms'
import { TensionSequence } from './tension'
import { DROP_FILES, EXPENSE_DRAFT, EXPENSE_SUBMITTED, EXPENSE_TENSIONS, EXTRACTED } from './expense-data'

/**
 * Build an expense report (grain-flows_2.html's expense-run view) - a run
 * that starts from an artefact (dropped receipts) rather than a button,
 * but is otherwise the same top-down, system-owned shape as payroll.
 */
const CHIP = 'RUN · TOP-DOWN · STARTS FROM AN ARTEFACT'

export function ExpenseDropScreen({ state }: { state: 'empty' | 'ready' }) {
  return (
    <EmmaChrome activeId="expense-run" title="Expense report" subtitle="DROP FILES" chip={CHIP} wide>
      <h1 className="text-title-h3 text-text-primary">Drop receipts anywhere on this page</h1>
      <p className="mt-1.5 mb-6 max-w-[60ch] text-paragraph-sm text-text-muted">
        The whole screen is the drop target. A run can start from a button or from an artefact —
        dropping six receipts is the same act as pressing "run payroll".
      </p>

      <div
        className={
          state === 'ready'
            ? 'rounded-xl border-[1.5px] border-dashed border-grain-ink bg-background-base p-8 text-center'
            : 'rounded-xl border-[1.5px] border-dashed border-border-muted bg-surface-1 p-10 text-center'
        }
      >
        <UploadSimple className="mx-auto mb-2 size-6 text-text-disabled" />
        {state === 'ready' ? (
          <>
            <b className="block text-label-md text-text-primary">6 files ready</b>
            <span className="text-paragraph-xs text-text-muted">JPEG, PNG, PDF and HEIC up to 50 MB</span>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {DROP_FILES.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1.5 rounded-lg border border-border-base bg-surface-1 px-2.5 py-1.5 text-paragraph-xs text-text-primary"
                >
                  <File className="size-3.5 shrink-0 text-text-disabled" />
                  {f}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <b className="block text-label-md text-text-muted">Drag receipts here, or browse</b>
            <span className="text-paragraph-xs text-text-disabled">JPEG, PNG, PDF and HEIC up to 50 MB</span>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-border-base bg-background-base px-3 py-2.5">
        <span className="shrink-0 font-mono text-[9.5px] tracking-wide text-text-disabled">OPTIONAL</span>
        <input
          readOnly
          value={state === 'ready' ? 'all from the Berlin summit, 12–14 Aug' : ''}
          placeholder="Add context the files can't carry"
          className="min-w-0 flex-1 bg-transparent text-paragraph-sm text-text-primary outline-none placeholder:text-text-disabled"
        />
        <button
          type="button"
          disabled={state !== 'ready'}
          className="shrink-0 rounded-md bg-grain-ink px-2.5 py-1.5 text-label-xs text-grain-ink-foreground disabled:opacity-40"
        >
          Extract
        </button>
      </div>

      <Note className="mt-4">
        <b className="text-text-primary">THIS BOX IS SCOPING, NOT CONVERSATION.</b> one line, before the run, to
        give context the files can't carry. it never appears again — the run drives from here. that is the
        difference between a prompt and a chat.
      </Note>
    </EmmaChrome>
  )
}

export function ExpenseReadingScreen() {
  return (
    <EmmaChrome activeId="expense-run" title="Expense report" subtitle="READING FILES" chip={CHIP}>
      <StepList
        steps={[
          { label: 'Read 6 files · OCR', status: 'done' },
          { label: 'Matched vendors against your ledger', status: 'done' },
          { label: 'Checking policy 4.2 and duplicates…', status: 'active' },
          { label: 'Grouping into a report', status: 'pending' },
        ]}
      />
      <div className="mt-2.5 flex flex-wrap">
        <ToolChip label="OCR" value="6 files" />
        <ToolChip label="FX" value="EUR→USD 14 Aug" />
        <ToolChip label="POLICY" value="4.2, 7.1" />
        <ToolChip label="LEDGER" value="read only" />
      </div>
      <Note className="mt-4">
        <b className="text-text-primary">PROCESS LAYER — NO CLAIM BAR.</b> nothing here asserts anything. the
        moment it does, it graduates into a grain.
      </Note>
    </EmmaChrome>
  )
}

export function ExpenseExtractedScreen() {
  return (
    <EmmaChrome activeId="expense-run" title="Expense report" subtitle="STEP 2 OF 3" chip={CHIP}>
      <Timeline>
        <Step n={1} title="Extracted" summary="5 of 6 read · $2,184.60">
          <Grain
            claim={EXTRACTED.claim}
            confidence={EXTRACTED.confidence}
            facts={EXTRACTED.facts}
            provenance={EXTRACTED.provenance}
            exits={EXTRACTED.exits}
          />
          <Note className="mt-2.5">
            <b className="text-text-primary">UNREADABLE IS A CLAIM.</b> it never guesses a number off a dark
            photo. saying "I couldn't read this" is worth more than a confident wrong figure.
          </Note>
        </Step>
      </Timeline>
    </EmmaChrome>
  )
}

export function ExpenseResolveScreen({ resolvedCount }: { resolvedCount: 0 | 1 | 2 }) {
  return (
    <EmmaChrome activeId="expense-run" title="Expense report" subtitle="STEP 2 OF 3" chip={CHIP}>
      <Timeline>
        <Step n={1} title="Extracted" summary="5 of 6 read · $2,184.60">
          <Collapsed changeLabel="change">5 of 6 receipts read — one photo is too dark</Collapsed>
        </Step>
        <Step n={2} title="Resolve" summary={resolvedCount < 2 ? `${resolvedCount} of 2 resolved` : '2 of 2 resolved'}>
          <TensionSequence tensions={EXPENSE_TENSIONS} resolvedCount={resolvedCount} />
        </Step>
      </Timeline>
    </EmmaChrome>
  )
}

export function ExpenseCreateScreen({ state }: { state: 'locked' | 'open' | 'done' }) {
  return (
    <EmmaChrome
      activeId="expense-run"
      title="Expense report"
      subtitle={state === 'done' ? 'SUBMITTED · CLOSED' : 'STEP 3 OF 3'}
      chip={CHIP}
    >
      <Timeline>
        <Step n={1} title="Extracted" summary="5 of 6 read · $2,184.60">
          <Collapsed changeLabel="change">5 of 6 receipts read — one photo is too dark</Collapsed>
        </Step>
        <Step n={2} title="Resolve" summary="2 of 2 resolved">
          <div className="flex flex-col gap-2.5">
            {EXPENSE_TENSIONS.map((t, i) => (
              <Collapsed key={i}>{t.resolvedSummary}</Collapsed>
            ))}
          </div>
        </Step>
        <Step n={3} title="Create" summary={state === 'done' ? 'submitted 14:31' : 'ready'}>
          {state === 'locked' && <Locked>Resolve both to continue.</Locked>}
          {state === 'open' && (
            <div className="flex flex-col gap-2.5">
              <Grain
                claim={EXPENSE_DRAFT.claim}
                badge="DRAFT"
                facts={EXPENSE_DRAFT.facts}
                provenance={EXPENSE_DRAFT.provenance}
                exits={EXPENSE_DRAFT.exits}
              />
              <Note className="mt-1">
                <b className="text-text-primary">EDIT MODE LIVES ON THE OBJECT, NOT IN A CHAT BUBBLE.</b> one
                field is missing and it says why — "not on any receipt". the door stays open for anything
                longer.
              </Note>
            </div>
          )}
          {state === 'done' && (
            <div className="flex flex-col gap-2.5">
              <Grain
                claim={EXPENSE_SUBMITTED.claim}
                liveness={{ kind: 'stamped', asOf: '14:31' }}
                facts={EXPENSE_SUBMITTED.facts}
                provenance={EXPENSE_SUBMITTED.provenance}
                exits={EXPENSE_SUBMITTED.exits}
              />
              <Note className="mt-1">
                <b className="text-text-primary">THE UNRESOLVED ITEM SURVIVES THE STAMP.</b> a run that closes
                while something is still open must say so on the way out, or it quietly becomes a missing $180
                next month.
              </Note>
            </div>
          )}
        </Step>
      </Timeline>
    </EmmaChrome>
  )
}
