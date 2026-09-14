import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  CaretLeft,
  CurrencyDollar,
  LockSimple,
  Plus,
  Repeat,
  Sparkle,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import type { WizardView } from '../types'
import type {
  Frequency,
  FrequencyChangeValidation,
  Rule,
  RuleAttribute,
  RuleCondition,
  RuleEvaluation,
  RuleOperator,
} from '../engine'
import {
  RULE_ATTRIBUTE_LABELS,
  WORLD_TODAY,
  addDaysISO,
  describeRule,
  evaluateRule,
  fmtHuman,
  matchEmployees,
  nextAllowedEffectiveDate,
  periodEndsBetween,
  validateFrequencyChangeDate,
} from '../engine'
import {
  AvatarStack,
  Banner,
  Card,
  EmmaCard,
  FormCard,
  FormShell,
  ReviewChip,
  ReviewSection,
} from '../ui'
import type { PaySchedule } from '@/mocks/payroll'
import { PAYROLL_EMPLOYEES, scheduleFor } from '@/mocks/payroll'
import type { Employee } from '@/mocks/employees'
import { COMPENSATION_TYPES, EMPLOYEE_TYPES, JOB_TITLES, WORK_LOCATIONS, employees } from '@/mocks/employees'
import { useExplorer } from '@/components/playground/explorer'
import { Stepper } from '@/components/nds/stepper'
import { FieldLabel, SearchField, TextInput } from '@/components/nds/controls'
import { SelectField } from '@/components/nds/select-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

/** Starter rule for a fresh wizard run - one seeded condition (matches the
 *  old hardcoded first `RuleRow`), everything else built via "Add condition". */
const STARTER_RULE: Rule = {
  and: [{ attribute: 'compensationType', operator: 'is', values: ['Salary'] }],
}

const ATTRIBUTE_OPTIONS: Record<RuleAttribute, ReadonlyArray<string>> = {
  compensationType: COMPENSATION_TYPES,
  employeeType: EMPLOYEE_TYPES,
  workLocation: WORK_LOCATIONS,
  jobTitle: JOB_TITLES,
}

const OPERATORS: Array<RuleOperator> = ['is', 'is-not']

const OPERATOR_LABELS: Record<RuleOperator, string> = {
  is: 'is',
  'is-not': 'is not',
}

/** Attributes with many possible values get the chip multi-select value
 *  editor regardless of operator - "Work location is not CA, NY, WA" reads
 *  fine with either operator, so the value control no longer depends on
 *  which one is picked (PRD round 2: is/is-not everywhere, multi-select
 *  stays available wherever it already made sense). */
const LIST_ATTRIBUTES: ReadonlySet<RuleAttribute> = new Set(['employeeType', 'workLocation', 'jobTitle'])

/**
 * A/B group: schedule creation as a full-page form - no AppBar/Sidebar
 * (form design), left Figma stepper (89:5507), buttons actually navigate
 * between explorer screens so the flow clicks through end to end.
 */

const FIRST_FLOW = ['A2', 'A3', 'A5']
const FIRST_STEPS = ['Details', 'Membership', 'Review']
/** With a rule: Details -> Membership (rule builder) -> Resolve conflicts -> Review. */
const REGULAR_FLOW = ['B1', 'B2', 'B3', 'B4']
const REGULAR_STEPS = ['Details', 'Membership', 'Resolve conflicts', 'Review']
/** Most schedules have no rule (PRD round 2: opt-in, not mandatory) - a
 *  manual schedule can never have a rule conflict, so Resolve conflicts
 *  never appears; Review sits right after Membership. */
const NO_RULE_FLOW = ['B1', 'B2', 'B4']
const NO_RULE_STEPS = ['Details', 'Membership', 'Review']

function flowFor(view: WizardView, hasRule: boolean, hasConflicts: boolean) {
  if (view.isFirst) return { flow: FIRST_FLOW, steps: FIRST_STEPS }
  if (!hasRule) return { flow: NO_RULE_FLOW, steps: NO_RULE_STEPS }
  // Same step, different framing - no real conflict to weigh means this
  // reads as a summary, not something to resolve (PRD round 2).
  const steps = hasConflicts
    ? REGULAR_STEPS
    : [REGULAR_STEPS[0], REGULAR_STEPS[1], 'Review changes', REGULAR_STEPS[3]]
  return { flow: REGULAR_FLOW, steps }
}

function stepIndex(view: WizardView, hasRule: boolean): number {
  if (view.isFirst) {
    return view.step === 'details' ? 0 : view.step === 'membership' ? 1 : 2
  }
  switch (view.step) {
    case 'details':
      return 0
    case 'rules':
      return 1
    case 'conflicts':
      return 2
    default:
      return hasRule ? 3 : 2
  }
}

/**
 * Candidate effective dates for a pay-frequency change - real upcoming
 * period-end dates of the schedule's CURRENT cadence (PRD §1.1: mid-period
 * changes are never allowed, so every option offered is already a valid
 * period boundary - there's no invalid date to accidentally pick from this
 * list, only ones a run-state rule might still block).
 */
function frequencyChangeOptions(freq: Frequency, today: string): Array<{ iso: string; label: string }> {
  return periodEndsBetween(freq, addDaysISO(today, 1), addDaysISO(today, 400))
    .slice(0, 4)
    .map((iso) => ({ iso, label: fmtHuman(iso) }))
}

/* ---------------- step: details ---------------- */

export interface WizardDraft {
  name: string
  frequency: Frequency
  payDay: string
  firstPayday: string
  /** Opt-in (PRD round 2) - most schedules have no rule. `rule` still holds
   *  a draft so flipping the toggle back on doesn't lose earlier edits. */
  hasRule: boolean
  rule: Rule
  /** Manual mode only - real employee ids assigned by hand. */
  manualMembers: Array<string>
}

function DetailsStep({
  isFirst,
  draft,
  onChange,
  editing,
  changingFrequency,
  effectiveDateOptions,
  validation,
}: {
  isFirst: boolean
  draft: WizardDraft
  onChange: (patch: Partial<WizardDraft>) => void
  /** Present only in edit mode (PRD §1). */
  editing?: PaySchedule
  /** True once the frequency dropdown differs from `editing.frequency`. */
  changingFrequency?: boolean
  effectiveDateOptions?: Array<{ iso: string; label: string }> | null
  validation?: FrequencyChangeValidation | null
}) {
  // Reseed the effective-date field the moment a frequency change starts (or
  // the schedule's own cadence means the old value no longer lines up with a
  // real period end for the new one) - never leave the picker showing a
  // label that isn't actually one of its own options.
  useEffect(() => {
    if (changingFrequency && effectiveDateOptions && !effectiveDateOptions.some((o) => o.label === draft.firstPayday)) {
      onChange({ firstPayday: effectiveDateOptions[0].label })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changingFrequency, effectiveDateOptions])

  return (
    <FormCard>
      <h2 className="text-title-h5 text-text-primary">Schedule details</h2>
      <p className="mt-1 text-paragraph-sm text-text-muted">
        Name the schedule and set its cadence.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Schedule name</FieldLabel>
          <TextInput
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Pay frequency</FieldLabel>
            <SelectField
              value={draft.frequency}
              onChange={(frequency) => onChange({ frequency: frequency as Frequency })}
              options={['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly']}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Pay day</FieldLabel>
            <SelectField
              value={draft.payDay}
              onChange={(payDay) => onChange({ payDay })}
              options={[
                'Last working day of the month',
                '15th and last day',
                'Every Friday',
                'Every other Friday',
              ]}
            />
          </div>
        </div>
        {changingFrequency && effectiveDateOptions ? (
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Effective date</FieldLabel>
            <SelectField
              value={draft.firstPayday}
              onChange={(firstPayday) => onChange({ firstPayday })}
              options={effectiveDateOptions.map((o) => o.label)}
              className="w-1/2"
            />
            <p className="text-caption-md text-text-muted">
              A frequency change only takes effect at the end of a pay period - {editing?.frequency.toLowerCase()}{' '}
              periods can&apos;t be split mid-cycle, so only real period-end dates are offered here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>First payday</FieldLabel>
            <SelectField
              value={draft.firstPayday}
              onChange={(firstPayday) => onChange({ firstPayday })}
              options={['Jul 31, 2026', 'Aug 31, 2026', 'Sep 30, 2026']}
              className="w-1/2"
            />
          </div>
        )}
        {validation?.level === 'block' && (
          <Banner tone="error" title="Can't save this frequency change yet">
            {validation.message}
          </Banner>
        )}
        {isFirst && (
          <Banner tone="info" title="Your first payroll schedule">
            Everyone joins this schedule. You can split people into more schedules
            later - rules unlock then.
          </Banner>
        )}
      </div>
    </FormCard>
  )
}

/* ---------------- step: first membership (locked, A3) ---------------- */

function MembershipStep({ noEmployees }: { noEmployees?: boolean }) {
  const preview = PAYROLL_EMPLOYEES.slice(0, 5)
  return (
    <FormCard>
      <h2 className="text-title-h5 text-text-primary">Members</h2>
      <p className="mt-1 text-paragraph-sm text-text-muted">
        Who this schedule pays.
      </p>
      <div className="mt-6 flex items-center gap-2.5 rounded-lg bg-background-highlight p-3">
        <LockSimple weight="fill" className="size-4 shrink-0 text-text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-label-xs text-text-primary">All employees</p>
          <p className="text-paragraph-xs text-text-muted">
            The first schedule includes everyone automatically. Membership rules
            unlock with a second schedule.
          </p>
        </div>
      </div>
      {noEmployees ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-base py-8">
          <UsersThree className="size-5 text-text-disabled" />
          <p className="text-label-xs text-text-primary">No employees yet</p>
          <p className="max-w-64 text-center text-paragraph-xs text-text-muted">
            You can still create the schedule - people join it as you hire.
          </p>
          <Button variant="secondary" size="sm" className="mt-1">
            <span className="px-1">Invite employees</span>
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          {preview.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2.5 border-b border-border-highlight py-2 last:border-0"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-muted text-caption-md text-brand-text">
                {e.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </span>
              <span className="min-w-0 flex-1 truncate text-paragraph-xs text-text-primary">
                {e.name}
              </span>
              <span className="text-paragraph-xs text-text-muted">{e.jobTitle}</span>
            </div>
          ))}
          <p className="pt-2 text-paragraph-xs text-text-muted">
            + {PAYROLL_EMPLOYEES.length - preview.length + 45} more employees
          </p>
        </div>
      )}
    </FormCard>
  )
}

/* ---------------- step: rule builder (B2 / G1) ---------------- */

/** Real, editable condition row - attribute change resets operator/values to
 *  something valid for the new attribute; value editor is a chip list for
 *  list attributes (so exclusion still works with several values, e.g.
 *  "Work location is not CA, NY, WA") or a single select otherwise. */
function RuleRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: RuleCondition
  onChange: (patch: Partial<RuleCondition>) => void
  onRemove?: () => void
}) {
  const isMulti = LIST_ATTRIBUTES.has(condition.attribute)
  const options = ATTRIBUTE_OPTIONS[condition.attribute]
  const unusedOptions = options.filter((o) => !condition.values.includes(o))

  return (
    <div className="flex items-start gap-2">
      <SelectField
        value={RULE_ATTRIBUTE_LABELS[condition.attribute]}
        onChange={(label) => {
          const attribute = (Object.keys(RULE_ATTRIBUTE_LABELS) as Array<RuleAttribute>).find(
            (a) => RULE_ATTRIBUTE_LABELS[a] === label,
          )
          if (!attribute) return
          onChange({ attribute, operator: 'is', values: [] })
        }}
        options={Object.values(RULE_ATTRIBUTE_LABELS)}
        className="w-44 shrink-0"
      />
      <SelectField
        value={OPERATOR_LABELS[condition.operator]}
        onChange={(label) => {
          const operator = (Object.keys(OPERATOR_LABELS) as Array<RuleOperator>).find(
            (o) => OPERATOR_LABELS[o] === label,
          )
          if (operator) onChange({ operator, values: condition.values })
        }}
        options={OPERATORS.map((o) => OPERATOR_LABELS[o])}
        className="w-32 shrink-0"
      />
      <div className="min-w-0 flex-1">
        {isMulti ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {condition.values.map((v) => (
              <span
                key={v}
                className="flex h-7 items-center gap-1 rounded-full bg-background-highlight px-2.5 text-caption-md text-text-primary"
              >
                {v}
                <button
                  type="button"
                  aria-label={`Remove ${v}`}
                  onClick={() => onChange({ values: condition.values.filter((x) => x !== v) })}
                  className="text-text-muted hover:text-text-error-base"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {unusedOptions.length > 0 && (
              <SelectField
                value={null}
                placeholder="+ Add value"
                onChange={(v) => onChange({ values: [...condition.values, v] })}
                options={[...unusedOptions]}
                className="h-7 w-36"
              />
            )}
          </div>
        ) : (
          <SelectField
            value={condition.values[0] ?? null}
            onChange={(v) => onChange({ values: [v] })}
            options={[...options]}
          />
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove condition"
          onClick={onRemove}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background-error-highlight hover:text-text-error-base"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

function MatchRow({
  name,
  detail,
  conflictWith,
  mover,
}: {
  name: string
  detail: string
  conflictWith?: string
  mover?: string
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border-highlight py-2 last:border-0">
      <span className="min-w-0 flex-1 truncate text-paragraph-xs text-text-primary">
        {name}
      </span>
      <span className="shrink-0 text-paragraph-xs text-text-muted">{detail}</span>
      {conflictWith && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background-warning-muted px-2 py-0.5 text-caption-md text-text-primary">
          In {conflictWith}
        </span>
      )}
      {mover && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background-info-muted px-2 py-0.5 text-caption-md text-text-primary">
          <ArrowRight className="size-3" />
          from {mover}
        </span>
      )}
    </div>
  )
}

/** Groups compliance violations by state for real banner/Emma copy - each
 *  employee's `workLocation` doubles as the state key the violation was
 *  computed against. */
function groupViolationsByState(violations: RuleEvaluation['complianceViolations']) {
  const byState = new Map<string, { requiredFrequency: Frequency; count: number }>()
  for (const v of violations) {
    const state = v.employee.workLocation
    const existing = byState.get(state)
    byState.set(state, { requiredFrequency: v.requiredFrequency, count: (existing?.count ?? 0) + 1 })
  }
  return [...byState.entries()].map(([state, v]) => ({ state, ...v }))
}

/** Opt-in rule engine (PRD round 2): most schedules have no rule at all -
 *  employees join by hand, the same way a manual override always has. This
 *  mode never produces a rule conflict (there's no competing rule to fight
 *  over), so it's the reason Resolve conflicts can be skipped entirely. */
function ManualMembersStep({
  scheduleName,
  selected,
  onToggle,
  onAddRule,
}: {
  scheduleName: string
  selected: Array<string>
  onToggle: (employeeId: string) => void
  onAddRule: () => void
}) {
  const [query, setQuery] = useState('')
  const selectedSet = new Set(selected)
  const filtered = employees.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
  const selectedEmployees = employees.filter((e) => selectedSet.has(e.id))

  return (
    <div className="flex flex-col gap-3">
      <FormCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-title-h5 text-text-primary">Who's on this schedule?</h2>
            <p className="mt-1 text-paragraph-sm text-text-muted">
              Most schedules don't need a rule - check people in below. You can add one later.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 text-brand-text" onClick={onAddRule}>
            <Plus />
            <span className="px-1">Add a membership rule instead</span>
          </Button>
        </div>
        <Banner tone="info" title={`No membership rule set`} className="mt-4">
          Everyone you check below joins {scheduleName || 'this schedule'} directly. Nothing here
          reacts to future changes in the directory - add a rule if you want that.
        </Banner>
        <div className="mt-4 flex flex-col gap-1.5">
          <SearchField value={query} onChange={setQuery} placeholder="Search employees" showKbd={false} />
        </div>
        <div className="mt-3 max-h-96 overflow-y-auto rounded-lg border border-border-highlight">
          {filtered.map((e) => (
            <label
              key={e.id}
              className="group flex cursor-pointer items-center gap-2.5 border-b border-border-highlight px-3 py-2 last:border-0 hover:bg-background-highlight"
            >
              <Checkbox checked={selectedSet.has(e.id)} onCheckedChange={() => onToggle(e.id)} />
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-muted text-caption-md text-brand-text">
                {e.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </span>
              <span className="min-w-0 flex-1 truncate text-paragraph-xs text-text-primary">{e.name}</span>
              <span className="shrink-0 text-paragraph-xs text-text-muted">{e.jobTitle}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="p-4 text-center text-paragraph-xs text-text-muted">No employees match “{query}”.</p>
          )}
        </div>
      </FormCard>

      <Card title={`Assigned · ${selected.length}`}>
        {selectedEmployees.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-8">
            <UsersThree className="size-5 text-text-disabled" />
            <p className="text-label-xs text-text-primary">No one assigned yet</p>
            <p className="max-w-72 text-center text-paragraph-xs text-text-muted">
              The schedule is still valid empty - check people above whenever you're ready.
            </p>
          </div>
        ) : (
          selectedEmployees.slice(0, 8).map((e) => <MatchRow key={e.id} name={e.name} detail={e.jobTitle} />)
        )}
        {selectedEmployees.length > 8 && (
          <p className="pt-2 text-paragraph-xs text-text-muted">+ {selectedEmployees.length - 8} more</p>
        )}
      </Card>
    </div>
  )
}

function RulesStep({
  view,
  rule,
  frequency,
  evaluation,
  previousMembers,
  editingName,
  onChangeRule,
  onRemoveRule,
}: {
  view: WizardView
  rule: Rule
  frequency: Frequency
  evaluation: RuleEvaluation
  /** Edit mode only - who matched the schedule's rule BEFORE this edit. */
  previousMembers?: Array<Employee>
  editingName?: string
  onChangeRule: (rule: Rule) => void
  onRemoveRule: () => void
}) {
  const violationGroups = groupViolationsByState(evaluation.complianceViolations)
  const preview = evaluation.matched.slice(0, 6)
  const overflow = evaluation.matched.length - preview.length
  const matchedIds = new Set(evaluation.matched.map((e) => e.id))
  const noLongerMatching = (previousMembers ?? []).filter((e) => !matchedIds.has(e.id))

  function updateCondition(list: 'and' | 'orGroup', index: number, patch: Partial<RuleCondition>) {
    const conditions = [...(rule[list] ?? [])]
    conditions[index] = { ...conditions[index], ...patch }
    onChangeRule({ ...rule, [list]: conditions })
  }

  function removeCondition(list: 'and' | 'orGroup', index: number) {
    const conditions = (rule[list] ?? []).filter((_, i) => i !== index)
    onChangeRule({ ...rule, [list]: list === 'orGroup' && conditions.length === 0 ? undefined : conditions })
  }

  function addCondition(list: 'and' | 'orGroup') {
    const next: RuleCondition = { attribute: 'workLocation', operator: 'is', values: [] }
    onChangeRule({ ...rule, [list]: [...(rule[list] ?? []), next] })
  }

  return (
    <div className="flex flex-col gap-3">
      {noLongerMatching.length > 0 && (
        <Banner
          tone="info"
          title={`${noLongerMatching.length} current member${noLongerMatching.length > 1 ? 's' : ''} no longer match${noLongerMatching.length > 1 ? '' : 'es'} this rule`}
        >
          They stay on {editingName} - narrowing a rule never removes anyone automatically. New
          assignments must meet the updated rule going forward.
        </Banner>
      )}
      {violationGroups.map(({ state, requiredFrequency, count }) => (
        <Banner
          key={state}
          tone="warning"
          title={`${frequency} pay violates ${state} rules for ${count} hourly match${count > 1 ? 'es' : ''}`}
          actions={
            !view.emma && (
              <Button variant="secondary" size="sm">
                <Sparkle className="text-brand-primary" weight="fill" />
                <span className="px-1">Ask Emma</span>
              </Button>
            )
          }
        >
          {state} requires at least {requiredFrequency.toLowerCase()} pay for this group.
        </Banner>
      ))}
      {view.emma === 'compliance' && violationGroups.length > 0 && (
        <EmmaCard
          title="Compliance"
          actions={
            <>
              <Button size="sm">
                <span className="px-1">Switch to {violationGroups[0].requiredFrequency}</span>
              </Button>
              <Button variant="secondary" size="sm">
                <span className="px-1">Exclude {violationGroups[0].state} hourly</span>
              </Button>
            </>
          }
        >
          {violationGroups
            .map(
              (v) =>
                `${v.count} matched employee${v.count > 1 ? 's' : ''} ${v.count > 1 ? 'are' : 'is'} in ${v.state}. ${v.state} requires ${v.requiredFrequency.toLowerCase()} pay for this group. Your ${frequency.toLowerCase()} schedule won't cover them.`,
            )
            .join(' ')}
        </EmmaCard>
      )}

      <FormCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-title-h5 text-text-primary">Membership rules</h2>
            <p className="mt-1 text-paragraph-sm text-text-muted">
              Employees matching every condition join this schedule.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 text-brand-text" onClick={onRemoveRule}>
            <X />
            <span className="px-1">Remove rule - assign manually instead</span>
          </Button>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          {rule.and.map((condition, i) => (
            <RuleRow
              key={i}
              condition={condition}
              onChange={(patch) => updateCondition('and', i, patch)}
              onRemove={rule.and.length > 1 ? () => removeCondition('and', i) : undefined}
            />
          ))}
          {rule.orGroup && rule.orGroup.length > 0 && (
            <div className="rounded-lg border border-dashed border-border-base p-2.5">
              <p className="pb-2 text-caption-md text-text-muted">ANY of (OR)</p>
              <div className="flex flex-col gap-2">
                {rule.orGroup.map((condition, i) => (
                  <RuleRow
                    key={i}
                    condition={condition}
                    onChange={(patch) => updateCondition('orGroup', i, patch)}
                    onRemove={() => removeCondition('orGroup', i)}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-brand-text"
                onClick={() => addCondition('orGroup')}
              >
                <Plus />
                <span className="px-1">Add OR condition</span>
              </Button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-brand-text" onClick={() => addCondition('and')}>
              <Plus />
              <span className="px-1">Add condition</span>
            </Button>
            {!rule.orGroup && (
              <Button
                variant="ghost"
                size="sm"
                className="text-brand-text"
                onClick={() => onChangeRule({ ...rule, orGroup: [{ attribute: 'workLocation', operator: 'is', values: [] }] })}
              >
                <Plus />
                <span className="px-1">Add OR group</span>
              </Button>
            )}
          </div>
        </div>
      </FormCard>

      <Card
        title={`Matches · ${evaluation.matched.length}`}
        actions={
          evaluation.conflicts.length > 0 ? (
            <span className="rounded-full bg-background-warning-muted px-2 py-0.5 text-caption-md text-text-primary">
              {evaluation.conflicts.length} conflict{evaluation.conflicts.length > 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      >
        {evaluation.conflicts.length > 0 && (
          <Banner
            tone="warning"
            title={`${evaluation.conflicts.length} match${evaluation.conflicts.length > 1 ? 'es' : ''} already belong${evaluation.conflicts.length > 1 ? '' : 's'} to another schedule`}
            className="mb-2"
          >
            Resolve them on the next step before creating.
          </Banner>
        )}
        {evaluation.conflicts.length === 0 && evaluation.movers.length > 0 && (
          <Banner
            tone="info"
            title={`All ${evaluation.movers.length} match${evaluation.movers.length > 1 ? 'es' : ''} move from the default schedule`}
            className="mb-2"
          >
            No conflicts - moving is allowed when the rule fully claims them.
          </Banner>
        )}
        {evaluation.matched.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-8">
            <UsersThree className="size-5 text-text-disabled" />
            <p className="text-label-xs text-text-primary">No employees match yet</p>
            <p className="max-w-72 text-center text-paragraph-xs text-text-muted">
              The schedule is still valid - it fills automatically as employees
              match these rules.
            </p>
          </div>
        ) : (
          <>
            {preview.map((e) => {
              const conflict = evaluation.conflicts.find((c) => c.employee.id === e.id)
              return (
                <MatchRow
                  key={e.id}
                  name={e.name}
                  detail={e.jobTitle}
                  conflictWith={conflict?.currentSchedule.name}
                  mover={!conflict ? 'the default schedule' : undefined}
                />
              )
            })}
            {overflow > 0 && (
              <p className="pt-2 text-paragraph-xs text-text-muted">+ {overflow} more match{overflow > 1 ? 'es' : ''}</p>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

/* ---------------- step: resolve conflicts (B3 / G2) ---------------- */

export type ConflictResolution = 'new' | 'keep'

/** One selectable option card - "New schedule" or the employee's current
 *  schedule - each showing the specific rule text that matched them there
 *  (PRD §5: "two schedule options, each labeled 'Matched "[rule text]"'"). */
function ConflictOption({
  title,
  matchedText,
  selected,
  onSelect,
}: {
  title: string
  matchedText: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex-1 rounded-lg w-full border p-3 text-left transition-colors',
        selected ? 'border-brand-primary bg-brand-muted' : 'border-border-highlight hover:bg-background-highlight',
      )}
    >
      <p className="text-label-xs text-text-primary">{title}</p>
      <p className="mt-0.5 truncate text-paragraph-xs whitespace-pre-wrap text-text-muted">Matched &quot;{matchedText}&quot;</p>
    </button>
  )
}

function ConflictsStep({
  view,
  rule,
  evaluation,
  resolutions,
  onChangeResolution,
}: {
  view: WizardView
  rule: Rule
  evaluation: RuleEvaluation
  resolutions: Record<string, ConflictResolution>
  onChangeResolution: (employeeId: string, value: ConflictResolution) => void
}) {
  const conflicts = evaluation.conflicts
  const newRuleText = describeRule(rule)
  // No real rule-vs-rule contest to resolve - this is a plain, deterministic
  // move (the rule fully claims them, nobody else is competing for them).
  // Reads as a review/summary, not a conflict: informational tone, facts
  // instead of warnings, no amber/red (PRD round 2).
  if (conflicts.length === 0) {
    const movers = evaluation.movers
    return (
      <FormCard>
        <h2 className="text-title-h5 text-text-primary">Review changes</h2>
        <p className="mt-1 text-paragraph-sm text-text-muted">
          Nothing here needs a decision - every match is either brand new or moving cleanly, with
          no competing schedule to weigh against.
        </p>
        {movers.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2">
            {movers.slice(0, 6).map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-2.5 rounded-lg bg-background-highlight px-3 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-caption-md text-brand-text">
                  {employee.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <p className="min-w-0 flex-1 truncate text-paragraph-xs text-text-primary">
                  {employee.name} moves from the default schedule. Next run picks them up automatically.
                </p>
              </div>
            ))}
            {movers.length > 6 && (
              <p className="text-paragraph-xs text-text-muted">+ {movers.length - 6} more, same change</p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-paragraph-xs text-text-muted">
            No one matches yet - the schedule is still valid, it fills in as people match the rule.
          </p>
        )}
      </FormCard>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <Banner
        tone="warning"
        title={`${conflicts.length} ${conflicts.length > 1 ? 'people' : 'person'} match more than one schedule`}
      >
        Broadening this rule means they now match this group too, in addition to where they already are - nothing
        is reassigned automatically. Confirm where each person should land before you can save; priority order is
        pre-selected as a starting point, not a decision already made for you.
      </Banner>
      {view.emma === 'conflict' && conflicts.length > 0 && (
        <EmmaCard
          title="Conflict"
          actions={
            <>
              <Button size="sm">
                <span className="px-1">Apply suggestion</span>
              </Button>
              <Button variant="ghost" size="sm">
                <span className="px-1">Dismiss</span>
              </Button>
            </>
          }
        >
          {conflicts
            .slice(0, 2)
            .map((c) => `${c.employee.name} currently matches ${c.currentSchedule.name}.`)
            .join(' ')}{' '}
          Based on role and department, I'd suggest keeping the closest match in place and moving the rest.
        </EmmaCard>
      )}
      <div className="flex flex-col gap-3">
        {conflicts.map(({ employee, currentSchedule }) => {
          const resolution = resolutions[employee.id] ?? 'new'
          return (
            <FormCard key={employee.id} className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-label-xs text-brand-text">
                  {employee.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-label-xs text-text-primary">{employee.name}</p>
                  <p className="truncate text-paragraph-xs text-text-muted">
                    {employee.jobTitle} · {employee.employeeType}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <ConflictOption
                  title="New schedule"
                  matchedText={newRuleText}
                  selected={resolution === 'new'}
                  onSelect={() => onChangeResolution(employee.id, 'new')}
                />
                <ConflictOption
                  title={`${currentSchedule.name} · ${currentSchedule.frequency}`}
                  matchedText={describeRule(currentSchedule.rule)}
                  selected={resolution === 'keep'}
                  onSelect={() => onChangeResolution(employee.id, 'keep')}
                />
              </div>
            </FormCard>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- step: review (A5 / B4, per form design) ---------------- */

function ReviewStep({
  isFirst,
  editing,
  draft,
  evaluation,
  onEdit,
}: {
  isFirst: boolean
  editing: boolean
  draft: WizardDraft
  evaluation: RuleEvaluation
  onEdit: (screenId: string) => void
}) {
  const manualEmployees = useMemo(
    () => draft.manualMembers.map((id) => employees.find((e) => e.id === id)).filter((e): e is Employee => !!e),
    [draft.manualMembers],
  )
  const matched = isFirst ? employees : draft.hasRule ? evaluation.matched : manualEmployees
  const memberNames = matched.slice(0, 6).map((e) => e.name)
  const memberCount = matched.length
  return (
    <FormCard>
      <h2 className="text-title-h5 text-text-primary">
        {editing ? 'Review your changes' : 'Review your schedule'}
      </h2>
      <p className="mt-1 text-paragraph-sm text-text-muted">
        Check everything before saving.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <ReviewSection title="Schedule" onEdit={() => onEdit(isFirst ? 'A2' : 'B1')}>
          <div className="flex flex-wrap items-center gap-2">
            <ReviewChip icon={UsersThree}>{draft.name}</ReviewChip>
            <ReviewChip icon={Repeat}>{draft.frequency}</ReviewChip>
            <ReviewChip icon={CurrencyDollar}>{draft.payDay}</ReviewChip>
            <ReviewChip icon={CalendarCheck}>First pay {draft.firstPayday}</ReviewChip>
          </div>
        </ReviewSection>

        <ReviewSection title="Membership" onEdit={() => onEdit(isFirst ? 'A3' : 'B2')}>
          <div className="flex items-center justify-between gap-6">
            <p className="min-w-0 text-paragraph-sm text-brand-text">
              “
              {isFirst
                ? 'All employees - everyone joins the first schedule automatically'
                : draft.hasRule
                  ? describeRule(draft.rule)
                  : 'Assigned manually - no membership rule'}
              ”
            </p>
            <span className="flex shrink-0 items-center gap-3">
              <AvatarStack names={memberNames} />
              <span className="text-label-xs text-text-primary">
                {memberCount} employees
              </span>
            </span>
          </div>
        </ReviewSection>

        <ReviewSection title="When you save">
          <div className="rounded-lg bg-background-highlight p-3 text-paragraph-sm text-text-primary">
            {isFirst
              ? `${memberCount} employees assigned to ${draft.name}. Nothing is paid until you approve the first run.`
              : editing
                ? draft.hasRule
                  ? `${draft.name} updates for everyone matching the new rule at the next period start - each gets prorated transition math if they move.`
                  : `${draft.name} keeps exactly the ${memberCount} people you checked - membership only changes when you edit it again.`
                : `${memberCount} employees move into ${draft.name} at the next period start - each gets prorated transition math.`}
          </div>
        </ReviewSection>
      </div>
    </FormCard>
  )
}

/* ---------------- shell ---------------- */

export function WizardScreen({ view }: { view: WizardView }) {
  const { show } = useExplorer()
  const isReview = view.step === 'review'
  const exitTo = view.isFirst ? 'A1' : 'C1'

  const editing = view.editSchedule

  // Lifted so typed values survive between steps and reach Review/Create —
  // resets whenever the frame remounts (fresh wizard run), same "no
  // leakage between scenarios" rule the catalog frames already follow.
  // Edit mode seeds every field from the real schedule instead of Create
  // defaults - same B1-B4 flow either way, just a different starting point.
  const [draft, setDraft] = useState<WizardDraft>(() => {
    if (editing) {
      // Catalog-only: a B5 state can pass `initialFrequency` to seed the
      // wizard already mid-way through a frequency change, so its
      // consequences (PRD §1.1) are reviewable as a frozen snapshot, not
      // just something you'd discover by clicking the dropdown yourself.
      const frequency = view.initialFrequency ?? editing.frequency
      const changingFrequency = frequency !== editing.frequency
      return {
        name: editing.name,
        frequency,
        payDay: editing.payDayRule,
        firstPayday: changingFrequency
          ? fmtHuman(view.initialEffectiveDate ?? nextAllowedEffectiveDate(editing.frequency, WORLD_TODAY))
          : fmtHuman(editing.nextPayday),
        // Catalog-only: a B5 state can also pass `initialRule` to seed the
        // wizard already mid-way through an eligibility-rule edit (the
        // broaden/narrow demos) - falls back to the schedule's real current
        // rule so a plain "Edit details" open still shows what's actually
        // saved, not a stale leftover from some other catalog state.
        hasRule: !!(view.initialRule ?? editing.rule),
        rule: view.initialRule ?? editing.rule ?? STARTER_RULE,
        manualMembers: editing.rule ? [] : (view.initialManualMembers ?? []),
      }
    }
    return {
      name: view.isFirst ? 'All employees' : (view.initialName ?? 'US Salaried'),
      frequency: view.initialFrequency ?? 'Monthly',
      payDay: 'Last working day of the month',
      firstPayday: 'Jul 31, 2026',
      // Opt-in (PRD round 2): a fresh schedule starts with no rule unless a
      // catalog/AI-suggestion seed explicitly hands it one.
      hasRule: !!view.initialRule,
      rule: view.initialRule ?? STARTER_RULE,
      manualMembers: view.initialManualMembers ?? [],
    }
  })
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({})

  // Edit mode only - who's on the schedule under its CURRENT (pre-edit)
  // rule, so RulesStep can flag anyone the new rule no longer covers (PRD
  // §1.2: narrowing never auto-removes existing members).
  const previousMembers = useMemo(
    () => (editing?.rule ? matchEmployees(editing.rule, employees) : []),
    [editing],
  )

  // Real matching/conflict/compliance - computed once, shared by Rules,
  // Conflicts, and Review so they can never disagree (PRD §4/§5). Edit
  // mode only - employees already on the schedule being edited are
  // reported as its OWN default-equivalent, not a conflict against
  // itself: matching the updated rule just confirms they stay.
  const evaluation = useMemo(() => {
    const currentScheduleOf = editing
      ? (e: Employee) => {
          const s = scheduleFor(e)
          return s.id === editing.id ? { ...s, id: 'sch-default' } : s
        }
      : (e: Employee) => scheduleFor(e)
    return evaluateRule(draft.rule, employees, draft.frequency, currentScheduleOf, 'sch-default')
  }, [draft.rule, draft.frequency, editing])

  const { flow, steps } = flowFor(view, draft.hasRule, evaluation.conflicts.length > 0)
  const current = stepIndex(view, draft.hasRule)

  // PRD §1.1 - only meaningful in edit mode, and only once the frequency
  // dropdown actually differs from the schedule's current cadence. Options
  // and the run-state gate are both defined against `editing.frequency`
  // (the OLD cadence still running today), never the newly-picked one.
  const changingFrequency = !!editing && draft.frequency !== editing.frequency
  const effectiveDateOptions = useMemo(
    () => (changingFrequency && editing ? frequencyChangeOptions(editing.frequency, WORLD_TODAY) : null),
    [changingFrequency, editing],
  )
  const frequencyChangeValidation: FrequencyChangeValidation | null = useMemo(() => {
    if (!changingFrequency || !editing || !effectiveDateOptions) return null
    const selected =
      effectiveDateOptions.find((o) => o.label === draft.firstPayday) ?? effectiveDateOptions[0]
    return validateFrequencyChangeDate(selected.iso, editing.frequency, WORLD_TODAY, editing.currentRun)
  }, [changingFrequency, editing, effectiveDateOptions, draft.firstPayday])

  const goBack = () => (current > 0 ? show(flow[current - 1]) : show(exitTo))
  const detailsBlocked = view.step === 'details' && frequencyChangeValidation?.level === 'block'
  const goNext = () => {
    if (detailsBlocked) return
    return isReview
      ? show('C1', undefined, editing ? { updatedSchedule: draft } : { createdSchedule: draft })
      : show(flow[current + 1])
  }

  return (
    <FormShell
      title={editing ? `Edit ${editing.name}` : view.isFirst ? 'Set up your first schedule' : 'Create schedule'}
      rail={
        <Stepper
          steps={steps}
          current={current}
          onStepClick={(i) => show(flow[i])}
        />
      }
    >
      <div className="flex flex-col gap-3">
        {view.step === 'details' && (
          <DetailsStep
            isFirst={view.isFirst}
            draft={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            editing={editing}
            changingFrequency={changingFrequency}
            effectiveDateOptions={effectiveDateOptions}
            validation={frequencyChangeValidation}
          />
        )}
        {view.step === 'membership' && <MembershipStep noEmployees={view.noEmployees} />}
        {view.step === 'rules' &&
          (draft.hasRule ? (
            <RulesStep
              view={view}
              rule={draft.rule}
              frequency={draft.frequency}
              evaluation={evaluation}
              previousMembers={previousMembers}
              editingName={editing?.name}
              onChangeRule={(rule) => setDraft((d) => ({ ...d, rule }))}
              onRemoveRule={() => setDraft((d) => ({ ...d, hasRule: false }))}
            />
          ) : (
            <ManualMembersStep
              scheduleName={draft.name}
              selected={draft.manualMembers}
              onToggle={(id) =>
                setDraft((d) => ({
                  ...d,
                  manualMembers: d.manualMembers.includes(id)
                    ? d.manualMembers.filter((x) => x !== id)
                    : [...d.manualMembers, id],
                }))
              }
              onAddRule={() => setDraft((d) => ({ ...d, hasRule: true }))}
            />
          ))}
        {view.step === 'conflicts' && (
          <ConflictsStep
            view={view}
            rule={draft.rule}
            evaluation={evaluation}
            resolutions={resolutions}
            onChangeResolution={(id, value) => setResolutions((prev) => ({ ...prev, [id]: value }))}
          />
        )}
        {view.step === 'review' && (
          <ReviewStep isFirst={view.isFirst} editing={!!editing} draft={draft} evaluation={evaluation} onEdit={show} />
        )}

        <div className="mt-2 flex items-center justify-between">
          <Button variant="secondary" onClick={goBack}>
            <CaretLeft />
            <span className="px-1">Back</span>
          </Button>
          <Button onClick={goNext} disabled={detailsBlocked}>
            <span className="px-1">{isReview ? (editing ? 'Save changes' : 'Create schedule') : 'Continue'}</span>
          </Button>
        </div>
      </div>
    </FormShell>
  )
}
