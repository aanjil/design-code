import { useEffect, useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@niural/components'
import { TaskRows } from '@/components/nds/ai/agent-status'
import type { TaskRowStatus } from '@/mocks/ai-components'
import type { DraftState, ExpResolution, MayaResolution, SamResolution } from './types'
import { EMPTY_DRAFT } from './types'
import {
  BASE_TOTAL,
  DEPRIORITIZED_NOTE,
  PRIORITY_RANKING,
  SETTLED_EMPLOYEES,
  SIGNALS,
  TOTAL_EMPLOYEES,
  computeImpact,
  consentStatement,
  expKind,
  expOutcomeText,
  fmtBuffer,
  fmtMoney,
  mayaKind,
  mayaOutcomeText,
  samKind,
  samOutcomeText,
  unresolvedNote,
} from './engine'

/**
 * The "dynamic timeline": a TaskRows list where exactly one row is open -
 * whichever one currently contains unresolved judgment - and every other row
 * is a collapsed one-line status summary. Prepare never gates behind a
 * Continue button; it's system-layer work, done before a person is involved.
 * Resolve auto-collapses the moment all three tensions have *some* answer
 * (approved, rejected, or deferred - not just "approved"), and Confirm & run
 * opens on its own. No step is ever manually advanced.
 */

function Dot({ tone }: { tone: 'open' | 'resolved' | 'deferred' }) {
  if (tone === 'resolved') {
    return <CheckCircle weight="fill" className="size-3.5 shrink-0 text-success" />
  }
  if (tone === 'deferred') {
    return <span className="size-3.5 shrink-0 rounded-full border-2 border-(--text-warning-base)" />
  }
  return <span className="size-3.5 shrink-0 rounded-full border-2 border-base" />
}

function SenseContent() {
  return (
    <div className="flex flex-col gap-0 rounded-lg border border-base bg-base p-3">
      {SIGNALS.map((s) => (
        <div
          key={s.label}
          className="flex items-baseline justify-between gap-3 border-b border-base py-2 text-paragraph-xsmall last:border-b-0"
        >
          <span className="text-primary">{s.label}</span>
          <span className="shrink-0 text-caption-sm text-muted">{s.source}</span>
          <span
            className={cn(
              'shrink-0 text-caption-sm',
              s.tone === 'stale' && 'font-semibold text-warning underline decoration-wavy',
              s.tone === 'missing' && 'font-semibold text-primary',
              !s.tone && 'text-muted',
            )}
          >
            {s.age}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Option<T extends string> {
  value: T
  label: string
  sub: string
  recommended?: boolean
}

function TensionCard<T extends string>({
  id,
  stakes,
  title,
  contradiction,
  ask,
  basis,
  options,
  selected,
  onSelect,
}: {
  /** Stable hook (data-tension) - the Bezel's agent cursor finds cards by it. */
  id: string
  stakes: 'highest' | 'medium' | 'lowest'
  title: string
  contradiction: React.ReactNode
  ask: string
  basis: string
  options: Array<Option<T>>
  selected: T | null
  onSelect: (v: T) => void
}) {
  return (
    <div
      data-tension={id}
      className={cn(
        'rounded-xl border bg-base p-4',
        stakes === 'highest' ? 'border-2 border-(--text-base) card' : 'border-base',
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-caption-sm font-semibold uppercase tracking-wide text-muted">Tension</span>
        <span className="text-caption-sm font-semibold uppercase tracking-wide text-primary">{stakes} stakes</span>
      </div>
      <h3 className="mb-1.5 text-label-small font-semibold text-primary">{title}</h3>
      <p className="mb-3 text-paragraph-small text-muted">{contradiction}</p>
      <p className="mb-2 text-label-xsmall font-semibold text-primary">{ask}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-option={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'rounded-lg border px-3 py-2 text-left text-label-xsmall transition-colors',
              selected === opt.value
                ? 'border-(--text-base) bg-(--text-base) text-(--background-base)'
                : 'border-base bg-base text-primary hover:bg-highlight',
            )}
          >
            {opt.label}
            {opt.recommended && selected !== opt.value && (
              <span className="ml-1 text-muted">- suggested</span>
            )}
            <span
              className={cn(
                'mt-0.5 block text-caption-sm font-normal',
                selected === opt.value ? 'text-(--background-base)/75' : 'text-muted',
              )}
            >
              {opt.sub}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-caption-sm text-muted">basis: {basis}</p>
    </div>
  )
}

function CompactOutcomeRow({ label, outcome, tone }: { label: string; outcome: string; tone: 'resolved' | 'deferred' }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-base px-3 py-2.5 text-paragraph-small">
      <Dot tone={tone} />
      <span className="font-semibold text-primary">{label}</span>
      <span className="text-muted">- {outcome}</span>
    </div>
  )
}

function ResolveContent({ draft, onChange }: { draft: DraftState; onChange: (next: DraftState) => void }) {
  const sam = samKind(draft.sam)
  const maya = mayaKind(draft.maya)
  const exp = expKind(draft.exp)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-base px-3 py-2.5 text-paragraph-small text-muted">
        <span>{SETTLED_EMPLOYEES} employees - timesheets, expenses, time-off all agree</span>
        <span className="shrink-0 text-caption-sm font-semibold text-success">ready - no action</span>
      </div>

      {sam === 'unresolved' ? (
        <TensionCard<SamResolution>
          id="sam"
          stakes="highest"
          title="Sam Ortiz has no way to be paid"
          contradiction={
            <>
              Payroll is ready to run, but <em className="not-italic underline decoration-(--text-base)">Sam's payment can't be delivered</em> - no bank
              account on file, expected for a day-3 new hire.
            </>
          }
          ask="How should his first paycheck be handled?"
          basis="HRIS bank field empty - consistent with new-hire timing, not flagged as an error elsewhere"
          selected={draft.sam}
          onSelect={(v) => onChange({ ...draft, sam: v })}
          options={[
            { value: 'hold', label: 'Hold Sam, run the rest', sub: 'pays 42 on schedule; his check waits for bank details', recommended: true },
            { value: 'wallet', label: 'Pay via wallet once added', sub: 'adds a settlement leg - costs wire buffer' },
            { value: 'delay', label: 'Escalate - delay the whole run', sub: 'nobody paid until this resolves' },
          ]}
        />
      ) : (
        <CompactOutcomeRow label="Sam Ortiz" outcome={samOutcomeText(draft.sam)} tone="resolved" />
      )}

      {maya === 'unresolved' ? (
        <TensionCard<MayaResolution>
          id="maya"
          stakes="medium"
          title="Maya Chen's overtime is over the policy ceiling"
          contradiction={
            <>
              Her hours are <em className="not-italic underline decoration-(--text-base)">manager-approved</em>, but exceed the{' '}
              <em className="not-italic underline decoration-(--text-base)">10h auto-approval limit</em> - policy and authority disagree, not the facts.
            </>
          }
          ask="Honor the manager's approval, cap it at policy, or send it back for reconfirmation?"
          basis="timeclock hours + manager approval event, Aug 14 - policy ceiling config"
          selected={draft.maya}
          onSelect={(v) => onChange({ ...draft, maya: v })}
          options={[
            { value: 'approve', label: 'Approve full 14.5h', sub: 'manager already signed off - this is the default reading', recommended: true },
            { value: 'cap', label: 'Cap at 10h policy limit', sub: 'remainder flagged for a separate off-cycle look' },
            { value: 'ask', label: 'Ask manager to reconfirm', sub: 'defers this line only - rest of the run proceeds' },
          ]}
        />
      ) : (
        <CompactOutcomeRow label="Maya Chen" outcome={mayaOutcomeText(draft.maya)} tone={maya === 'deferred' ? 'deferred' : 'resolved'} />
      )}

      {exp === 'unresolved' ? (
        <TensionCard<ExpResolution>
          id="exp"
          stakes="lowest"
          title="Expense #4521 looks like a duplicate - Diego Alvarez"
          contradiction={
            <>
              This $892 charge matches <em className="not-italic underline decoration-(--text-base)">#4498 from last week</em> on vendor, amount, and
              date - but no receipt has actually been compared.
            </>
          }
          ask="Duplicate, two real charges, or ask before deciding?"
          basis="vendor + amount + ±3-day window match - medium confidence, no receipt comparison run"
          selected={draft.exp}
          onSelect={(v) => onChange({ ...draft, exp: v })}
          options={[
            { value: 'reject', label: 'Reject as duplicate', sub: 'matches the pattern; reversible for 2h after approval', recommended: true },
            { value: 'approve', label: 'Approve both', sub: 'confirms they are different charges' },
            { value: 'ask', label: 'Ask Diego first', sub: 'defers this line, excludes the $892 meanwhile - does not block the run' },
          ]}
        />
      ) : (
        <CompactOutcomeRow label="Expense #4521" outcome={expOutcomeText(draft.exp)} tone={exp === 'deferred' ? 'deferred' : 'resolved'} />
      )}

      <details className="mt-1 rounded-lg border border-dashed border-base px-3 py-2.5 text-caption-sm text-muted">
        <summary className="cursor-pointer select-none font-semibold uppercase tracking-wide">Ranking - why these three, in this order</summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-4">
          {PRIORITY_RANKING.map((r) => (
            <li key={r.label}>
              <span className="text-primary">{r.label}</span> - {r.why}
            </li>
          ))}
        </ol>
        <p className="mt-2">{DEPRIORITIZED_NOTE}</p>
      </details>
    </div>
  )
}

function ConfirmContent({
  draft,
  approved,
  onApprove,
  onChangeSomething,
}: {
  draft: DraftState
  approved: boolean
  onApprove: () => void
  onChangeSomething: () => void
}) {
  const impact = computeImpact(draft)

  if (approved) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-base bg-base p-4">
        <CheckCircle weight="fill" className="size-8 shrink-0 text-success" />
        <div>
          <div className="text-label-small font-semibold text-primary">Payroll run complete</div>
          <div className="mt-0.5 text-paragraph-small text-muted">
            {draft.sam === 'hold' || draft.sam === 'delay' ? TOTAL_EMPLOYEES - 1 : TOTAL_EMPLOYEES} of {TOTAL_EMPLOYEES} paid ·{' '}
            {fmtMoney(impact.total)} · reversible for 2h
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ImpactStat dim="Financial" value={fmtMoney(impact.total)} tone={impact.total < BASE_TOTAL ? 'good' : undefined} />
        <ImpactStat dim="People" value={`${impact.affected} affected`} />
        <ImpactStat dim="Wire buffer" value={fmtBuffer(impact.wireBufferSeconds)} tone={impact.wireBufferAtRisk ? 'bad' : undefined} worse={impact.wireBufferAtRisk} />
        <ImpactStat dim="Risk" value={fmtMoney(impact.risk)} tone={impact.risk > 0 ? 'bad' : 'good'} />
      </div>
      <p className="-mt-2 text-caption-sm text-muted">
        recalculates the moment a choice above changes - wire buffer only moves because wallet routing costs it, not on a timer
      </p>

      {impact.halted && (
        <div className="rounded-lg bg-error-highlight px-3 py-2.5 text-label-xsmall font-semibold text-error">
          Entire run paused - nobody gets paid until Sam's tension is resolved differently.
        </div>
      )}

      <div className="rounded-xl border-2 border-(--text-base) p-4">
        <p className="mb-3 text-label-small leading-relaxed text-primary">{consentStatement(draft, impact)}</p>
        <p className="mb-4 border-l-2 border-(--text-base) pl-3 text-paragraph-small text-muted">{unresolvedNote(draft)}</p>
        <div className="flex flex-wrap items-center gap-3 border-t border-base pt-3.5">
          <Button type="button" data-agent="approve-run" disabled={impact.halted} onClick={onApprove}>
            Approve this reading
          </Button>
          <Button type="button" variant="solid" shade="neutral" onClick={onChangeSomething}>
            Change something
          </Button>
          <span className="text-caption-sm text-muted">Reversible for 2h before submission · final after that</span>
        </div>
      </div>
    </div>
  )
}

function ImpactStat({
  dim,
  value,
  tone,
  worse,
}: {
  dim: string
  value: string
  tone?: 'good' | 'bad'
  worse?: boolean
}) {
  return (
    <div className="rounded-lg border border-base px-3 py-2.5">
      <div className="text-caption-sm font-semibold uppercase tracking-wide text-muted">{dim}</div>
      <div
        className={cn(
          'mt-1 text-label-small font-semibold',
          tone === 'good' && 'text-success',
          tone === 'bad' && 'text-error',
          !tone && 'text-primary',
        )}
      >
        {value}
        {worse && <span className="ml-1 text-caption-sm font-normal text-muted">↓ worse</span>}
      </div>
    </div>
  )
}

export function DynamicTimeline({
  initialDraft = EMPTY_DRAFT,
  initialApproved = false,
}: {
  initialDraft?: DraftState
  initialApproved?: boolean
}) {
  const [draft, setDraft] = useState<DraftState>(initialDraft)
  const [approved, setApproved] = useState(initialApproved)
  const impact = computeImpact(draft)

  const resolvedCount = [samKind(draft.sam), mayaKind(draft.maya), expKind(draft.exp)].filter((k) => k !== 'unresolved').length

  const attentionIndex = approved ? null : impact.allSettled ? 2 : 1
  const [openIndex, setOpenIndex] = useState<number | null>(attentionIndex)
  useEffect(() => {
    setOpenIndex(attentionIndex)
  }, [attentionIndex])

  const resolveSummary = impact.allSettled
    ? `Sam ${samKind(draft.sam)} · Maya ${mayaKind(draft.maya)} · Diego ${expKind(draft.exp)}`
    : `${resolvedCount} of 3 resolved`

  const rows: Array<{ label: string; status: TaskRowStatus; meta: string; content?: React.ReactNode }> = [
    {
      label: 'Prepare',
      status: 'completed',
      meta: `${TOTAL_EMPLOYEES} employees sensed · ${fmtMoney(BASE_TOTAL)} draft · 6 signals, 1 stale`,
      content: <SenseContent />,
    },
    {
      label: 'Resolve',
      status: impact.allSettled ? 'completed' : 'running',
      meta: resolveSummary,
      content: <ResolveContent draft={draft} onChange={setDraft} />,
    },
    {
      label: 'Confirm & run',
      status: approved ? 'completed' : impact.allSettled ? 'running' : 'queued',
      meta: approved ? 'submitted ✓' : impact.allSettled ? 'ready to confirm' : 'waiting on Resolve',
      content: impact.allSettled ? (
        <ConfirmContent
          draft={draft}
          approved={approved}
          onApprove={() => setApproved(true)}
          onChangeSomething={() => setOpenIndex(1)}
        />
      ) : undefined,
    },
  ]

  return (
    <div className="mx-auto max-w-[720px]">
      <TaskRows rows={rows} openIndex={openIndex} onOpenChange={setOpenIndex} className="gap-3" />
    </div>
  )
}
