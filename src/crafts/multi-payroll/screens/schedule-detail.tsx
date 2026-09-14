import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowsLeftRight,
  CaretLeft,
  Flag,
  NotePencil,
  UsersThree,
} from '@phosphor-icons/react'
import type { MoveView, ScheduleDetailView } from '../types'
import {
  AvatarStack,
  Banner,
  Card,
  EmmaCard,
  FormCard,
  FormShell,
  FreqTag,
  KV,
  ScheduleRow,
  ScheduleTag,
  ShowAllToggle,
} from '../ui'
import type { DateValidation, Frequency, Period, Transition } from '../engine'
import {
  WORLD_TODAY,
  checkStateCompliance,
  computeTransition,
  describeRule,
  diffDays,
  fmtHuman,
  matchEmployees,
  money,
  periodOf,
  round2,
  validateEffectiveDate,
  weekdayName,
} from '../engine'
import type { Employee } from '@/mocks/employees'
import { employees, fmtCompensation, fmtHireDate } from '@/mocks/employees'
import type { PaySchedule } from '@/mocks/payroll'
import {
  ARCHIVED_SCHEDULE,
  MOVE_EMPLOYEE,
  MOVE_HOURLY_EMPLOYEE,
  PAYROLL_EMPLOYEES,
  SCHEDULES,
  liveScheduleFor,
} from '@/mocks/payroll'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { FieldLabel } from '@/components/nds/controls'
import { Stepper } from '@/components/nds/stepper'
import { useExplorer } from '@/components/playground/explorer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * C8 - one schedule's own page (metadata + real rule + real members),
 * replacing the old cross-schedule D1 "Employees" list - the Move flow
 * (D2-D4) now layers on top of THIS screen instead of a global directory,
 * since membership only ever needs to be reviewed one schedule at a time.
 */

/** Resolves a real PaySchedule for a move endpoint - prefers the specific
 *  schedule picked from the list (`scheduleId`), falling back to the first
 *  schedule of that frequency for catalog scenarios that only specify a
 *  frequency. Two schedules can share a frequency (e.g. Contractors and the
 *  default, both Weekly) - `scheduleId` is what disambiguates a real pick. */
function resolveSchedule(freq: Frequency, schedules: Array<PaySchedule>, scheduleId?: string): PaySchedule {
  if (scheduleId) {
    const byId = schedules.find((s) => s.id === scheduleId) ?? SCHEDULES.find((s) => s.id === scheduleId)
    if (byId) return byId
  }
  return schedules.find((s) => s.frequency === freq) ?? SCHEDULES.find((s) => s.frequency === freq) ?? ARCHIVED_SCHEDULE
}

const VALIDATION_TONE: Record<
  DateValidation['level'],
  'success' | 'info' | 'warning' | 'error' | 'pending'
> = {
  ok: 'success',
  info: 'info',
  warn: 'warning',
  block: 'error',
  pending: 'pending',
}

/* ---------------- corrected collision timeline ---------------- */

function fmtShort(iso: string): string {
  return fmtHuman(iso).replace(/, \d{4}$/, '')
}

function MoveTimeline({
  oldSchedule,
  newSchedule,
  oldPeriod,
  newPeriod,
  effectiveDate,
  transition,
}: {
  oldSchedule: PaySchedule
  newSchedule: PaySchedule
  oldPeriod: Period
  newPeriod: Period
  effectiveDate: string
  transition: Transition
}) {
  const spanStart = diffDays(oldPeriod.start, newPeriod.start) < 0 ? oldPeriod.start : newPeriod.start
  const spanEnd = diffDays(oldPeriod.end, newPeriod.end) > 0 ? oldPeriod.end : newPeriod.end
  const totalDays = diffDays(spanStart, spanEnd) + 1
  const pct = (iso: string) => (diffDays(spanStart, iso) / totalDays) * 100
  const widthPct = (a: string, b: string) => ((diffDays(a, b) + 1) / totalDays) * 100
  const effLeft = pct(effectiveDate)
  const isGap = transition.classification === 'Gap'
  const isOverlap = transition.classification === 'Overlap'
  const bandLeft = pct(transition.gapStart)
  const bandWidth = widthPct(transition.gapStart, transition.gapEnd)

  return (
    <div className="mt-3">
      <div className="relative h-4 text-caption-md text-text-muted">
        <span className="absolute left-0">{fmtShort(spanStart)}</span>
        <span
          className="absolute font-medium text-brand-text"
          style={{ left: `${effLeft}%`, transform: 'translateX(-50%)' }}
        >
          {fmtShort(effectiveDate)} · effective
        </span>
        <span className="absolute right-0">{fmtShort(spanEnd)}</span>
      </div>
      <p className="mt-3 text-caption-md text-text-muted">
        Current · {oldSchedule.name} ({oldSchedule.frequency})
      </p>
      <div className="relative mt-1 h-9 rounded-lg bg-background-highlight">
        <div
          className="absolute inset-y-1 flex items-center justify-center overflow-hidden rounded-md border border-border-base bg-background-base px-1 text-caption-md text-text-muted"
          style={{ left: `${pct(oldPeriod.start)}%`, width: `${widthPct(oldPeriod.start, oldPeriod.end)}%` }}
        >
          {fmtShort(oldPeriod.start)}–{fmtShort(oldPeriod.end)}
        </div>
        {isGap && (
          <div
            className="absolute -top-1 -bottom-1 rounded-md bg-background-warning-highlight"
            style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
          />
        )}
        {isOverlap && (
          <div
            className="absolute -top-1 -bottom-1 rounded-md bg-brand-muted"
            style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
          />
        )}
        <div className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-brand-primary" style={{ left: `${effLeft}%` }} />
      </div>
      <p className="mt-3 text-caption-md text-text-muted">
        New · {newSchedule.name} ({newSchedule.frequency})
      </p>
      <div className="relative mt-1 h-9 rounded-lg bg-background-highlight">
        <div
          className="absolute inset-y-1 flex items-center justify-center overflow-hidden rounded-md border border-brand-primary/40 bg-brand-muted px-1 text-caption-md text-brand-text"
          style={{ left: `${pct(newPeriod.start)}%`, width: `${widthPct(newPeriod.start, newPeriod.end)}%` }}
        >
          {fmtShort(newPeriod.start)}–{fmtShort(newPeriod.end)}
        </div>
        {isOverlap && (
          <div
            className="absolute -top-1 -bottom-1 rounded-md bg-brand-primary/40"
            style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
          />
        )}
        <div className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-brand-primary" style={{ left: `${effLeft}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-caption-md text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm border border-border-base bg-background-base" /> period
        </span>
        {isGap && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm bg-background-warning-highlight" /> uncovered → becomes
            retro
          </span>
        )}
        {isOverlap && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm bg-brand-muted" /> already paid → suppressed
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-brand-primary" /> effective date
        </span>
      </div>
    </div>
  )
}

/* ---------------- move flow (spacious full-page step, not a modal) ---------------- */

const MOVE_STEPS = ['Date', 'Review', 'Confirm']
const MOVE_FLOW = ['D2', 'D3', 'D4']

function MoveFlowScreen({
  view,
  fromScheduleId,
}: {
  view: MoveView
  /** Where Cancel/Confirm return to - the schedule detail page you moved from. */
  fromScheduleId: string
}) {
  const { show } = useExplorer()
  const employee =
    (view.employeeId && PAYROLL_EMPLOYEES.find((e) => e.id === view.employeeId)) ||
    (view.hourly ? MOVE_HOURLY_EMPLOYEE : MOVE_EMPLOYEE)
  const [date, setDate] = useState(view.effectiveDate)
  const [toOverride, setToOverride] = useState<string | null>(view.toScheduleId ?? null)
  const [showAll, setShowAll] = useState(true)
  const [retroOverride, setRetroOverride] = useState<number | null>(null)
  const [editingRetro, setEditingRetro] = useState(false)
  const [retroSkipped, setRetroSkipped] = useState(false)
  const [confirmingSkip, setConfirmingSkip] = useState(false)
  const rate = view.hourly ? employee.compensation : round2(employee.compensation / 2080)

  const fromSchedule = resolveSchedule(view.from, SCHEDULES, fromScheduleId)
  const toSchedule = resolveSchedule(view.to, SCHEDULES, toOverride ?? undefined)
  const aligned = checkStateCompliance(employee, toSchedule.frequency)

  const validation = validateEffectiveDate(date, employee.hireDate, view.from)
  const impact = useMemo(
    () =>
      validation.level === 'block' ? null : computeTransition(view.from, toSchedule.frequency, date, rate),
    [view.from, toSchedule.frequency, date, rate, validation.level],
  )
  const effectiveRetro = impact ? (retroSkipped ? 0 : (retroOverride ?? impact.retro)) : 0

  const current = view.stage === 'date' ? 0 : view.stage === 'review' ? 1 : 2
  const goBack = () => (current > 0 ? show(MOVE_FLOW[current - 1], undefined, { scheduleId: fromScheduleId }) : show('C8', undefined, { scheduleId: fromScheduleId }))

  // Only-matching = schedules whose own rule genuinely claims this employee
  // (consistent with the hire flow's aligned/violating picker) - manual and
  // non-matching schedules only show up once "Show all" is on.
  const activeSchedules = SCHEDULES.filter((s) => s.status === 'active' && s.id !== fromSchedule.id)
  const matchedSchedules = activeSchedules.filter((s) => s.rule && matchEmployees(s.rule, [employee]).length > 0)
  const shownSchedules = showAll ? activeSchedules : matchedSchedules

  return (
    <FormShell
      title={view.stage === 'confirm' ? `Confirm move - ${employee.name}` : `Move ${employee.name}`}
      rail={<Stepper steps={MOVE_STEPS} current={current} onStepClick={(i) => show(MOVE_FLOW[i], undefined, { scheduleId: fromScheduleId })} />}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FreqTag>
            {fromSchedule.name} · {view.from}
          </FreqTag>
          <ArrowRight className="size-3.5 shrink-0 text-text-muted" />
          <FreqTag>
            {toSchedule.name} · {toSchedule.frequency}
          </FreqTag>
          {view.stage !== 'confirm' && <ScheduleTag aligned={aligned} />}
        </div>

        {view.stage === 'date' && (
          <FormCard>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required htmlFor="move-date">
                Effective date
              </FieldLabel>
              <input
                id="move-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-56 rounded-btn bg-background-base px-3 text-paragraph-sm text-text-primary shadow-button-gray transition-shadow outline-none focus:shadow-border-focus"
              />
              <p className="text-paragraph-xs text-text-muted">
                Hired {fmtHireDate(employee.hireDate)} · validation runs as you type.
              </p>
            </div>
            <Banner tone={VALIDATION_TONE[validation.level]} title={validation.message} className="mt-3">
              {validation.weekend && validation.code !== 'non-working' && (
                <p>Also a non-working day - proration counts the next working day.</p>
              )}
            </Banner>
            {!aligned && (
              <Banner tone="warning" title="Target schedule may not be compliant" className="mt-3">
                {employee.workLocation} requires more frequent pay than {toSchedule.frequency.toLowerCase()} allows.
              </Banner>
            )}

            <div className="mt-5 flex items-center justify-between">
              <p className="text-label-xs text-text-primary">Move to schedule</p>
              <ShowAllToggle showAll={showAll} onChange={setShowAll} />
            </div>
            {shownSchedules.length > 0 ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-border-highlight">
                {shownSchedules.map((s) => (
                  <ScheduleRow
                    key={s.id}
                    schedule={s}
                    detail={s.rule ? describeRule(s.rule) : `${s.frequency} · No conditions`}
                    selected={s.id === toSchedule.id}
                    aligned={checkStateCompliance(employee, s.frequency)}
                    onSelect={() => setToOverride(s.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-paragraph-xs text-text-muted">
                No other schedule's rule matches this employee.{' '}
                <button type="button" className="text-brand-text" onClick={() => setShowAll(true)}>
                  Show all schedules
                </button>
                .
              </p>
            )}
          </FormCard>
        )}

        {view.stage === 'review' && impact && (
          <>
            <FormCard>
              <Banner
                tone={
                  impact.classification === 'Gap' ? 'warning' : impact.classification === 'Overlap' ? 'info' : 'success'
                }
                title={
                  impact.classification === 'Gap'
                    ? 'Gap - retro pay fills the unpaid days'
                    : impact.classification === 'Overlap'
                      ? 'Overlap - old run already paid this window'
                      : 'Clean proration - no gap, no overlap'
                }
              >
                {impact.classification === 'Gap' &&
                  `${fmtHuman(impact.gapStart)} – ${fmtHuman(impact.gapEnd)} (${impact.gapWorkingDays} working days) hasn't been paid by any run.`}
                {impact.classification === 'Overlap' &&
                  `${fmtHuman(impact.gapStart)} – ${fmtHuman(impact.gapEnd)} is suppressed from the first new run so nothing is paid twice.`}
                {impact.classification === 'Clean proration' && 'The move lands exactly on a period boundary.'}
              </Banner>
              <MoveTimeline
                oldSchedule={fromSchedule}
                newSchedule={toSchedule}
                oldPeriod={periodOf(view.from, date)}
                newPeriod={periodOf(toSchedule.frequency, impact.regularStart)}
                effectiveDate={date}
                transition={impact}
              />
            </FormCard>

            <div className="grid grid-cols-[1.3fr_1fr] gap-3">
              <div className="flex flex-col gap-3">
                <Card title="Benefits true-up">
                  <KV label="Premium remaining">{money(impact.benefits.remainingPremium)}</KV>
                  <KV label="Checks this month">{impact.benefits.checksThisMonth}</KV>
                  <KV label="Per check">
                    {money(impact.benefits.perCheck)}
                    {impact.benefits.checksThisMonth > 1 && ` (last ${money(impact.benefits.lastCheck)})`}
                  </KV>
                </Card>
                <Card title="PTO accrual">
                  <KV label="Rate">
                    {impact.pto.oldRate}h → {impact.pto.newRate}h / run
                  </KV>
                  <KV label="Accrued">{impact.pto.accruedHours}h</KV>
                  <KV label={`Remaining (${impact.pto.remainingRuns} runs)`}>{impact.pto.remainingHours}h</KV>
                </Card>
              </div>
              <div className="flex flex-col gap-3">
                <Card title="What changes">
                  <KV label="Payrolls skipped">{impact.classification === 'Gap' ? '1 run (filled by retro)' : '0'}</KV>
                  <KV label="Next payday">{fmtHuman(impact.firstRunEnd)}</KV>
                  <KV label="Retro or proration">
                    {impact.retro > 0
                      ? `${impact.gapHours} hrs`
                      : impact.classification === 'Overlap'
                        ? 'None - already paid'
                        : 'None - clean start'}
                  </KV>
                </Card>
                <Card title="First paycheck on the new schedule">
                  <KV
                    label={`Regular ${fmtHuman(impact.regularStart)} – ${fmtHuman(impact.firstRunEnd)} (${impact.regularDays}d)`}
                  >
                    {money(impact.regularPay)}
                  </KV>
                  {impact.retro > 0 && !retroSkipped && (
                    <div className="flex items-baseline justify-between gap-4 border-b border-border-highlight py-2">
                      <span className="shrink-0 text-paragraph-xs text-text-muted">
                        Retro pay · {fmtShort(impact.gapStart)} to {fmtHuman(impact.gapEnd)}
                      </span>
                      <span className="flex items-center gap-2">
                        {!editingRetro ? (
                          <span className="text-label-xs text-text-primary">{money(retroOverride ?? impact.retro)}</span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={retroOverride ?? impact.retro}
                            onChange={(e) => setRetroOverride(Number(e.target.value))}
                            className="h-7 w-24 rounded-lg bg-background-base px-2 text-right text-label-xs text-text-primary shadow-button-gray outline-none focus:shadow-border-focus"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-brand-text"
                          onClick={() => setEditingRetro((v) => !v)}
                        >
                          {editingRetro ? 'Done' : 'Edit'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-text-error-base"
                          onClick={() => setConfirmingSkip(true)}
                        >
                          Skip
                        </Button>
                      </span>
                    </div>
                  )}
                  {impact.retro > 0 && retroSkipped && (
                    <div className="flex items-baseline justify-between gap-4 border-b border-border-highlight py-2">
                      <span className="shrink-0 text-paragraph-xs text-text-disabled line-through">
                        Retro pay · {fmtShort(impact.gapStart)} to {fmtHuman(impact.gapEnd)}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-label-xs text-text-disabled">Skipped</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-brand-text"
                          onClick={() => setRetroSkipped(false)}
                        >
                          Undo
                        </Button>
                      </span>
                    </div>
                  )}
                  <KV label="Total" strong>
                    {money(round2(effectiveRetro + impact.regularPay))}
                  </KV>
                </Card>
                <p className="text-paragraph-xs text-text-muted">
                  {view.hourly
                    ? `Hourly employee - computed at ${money(rate)}/h from timesheets.`
                    : `Salaried - hourly equivalent ${money(rate)}/h (annual ÷ 2080).`}
                </p>
              </div>
            </div>

            {confirmingSkip && (
              <div className="fixed inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]">
                <div className="w-full max-w-[420px] rounded-2xl bg-background-base p-5 shadow-flyout">
                  <p className="text-label-md text-text-primary">Skip retro pay?</p>
                  <Banner tone="error" title="This can't be undone after you confirm the move" className="mt-3">
                    Skipping retro advances {employee.name}&apos;s paid-through date to {fmtHuman(impact.gapEnd)}{' '}
                    permanently. The {impact.gapHours} hrs ({money(impact.retro)}) for {fmtShort(impact.gapStart)} to{' '}
                    {fmtHuman(impact.gapEnd)} will not be paid.
                  </Banner>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="secondary" onClick={() => setConfirmingSkip(false)}>
                      <span className="px-1">Cancel</span>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setRetroSkipped(true)
                        setRetroOverride(null)
                        setConfirmingSkip(false)
                      }}
                    >
                      <span className="px-1">Skip retro</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {view.stage === 'confirm' && impact && (
          <FormCard>
            {view.confirmMode === 'scheduled' ? (
              <Banner tone="pending" title={`Scheduled for ${fmtHuman(date)}`}>
                {employee.name.split(' ')[0]} stays on {fromSchedule.name} and its runs until then. You can
                cancel any time before it takes effect.
              </Banner>
            ) : (
              <Banner tone="success" title="Takes effect immediately">
                Next payday on the new schedule: {fmtHuman(impact.firstRunEnd)}.
              </Banner>
            )}
            <div className="mt-3">
              <KV label="Employee">{employee.name}</KV>
              <KV label="Effective">{fmtHuman(date)}</KV>
              {impact.retro > 0 && (
                <KV label={`Retro pay · ${fmtShort(impact.gapStart)} to ${fmtHuman(impact.gapEnd)}`}>
                  {retroSkipped ? 'Skipped' : money(effectiveRetro)}
                </KV>
              )}
              <KV label="First new-run pay" strong>
                {money(round2(effectiveRetro + impact.regularPay))}
              </KV>
            </div>
          </FormCard>
        )}

        <div className="mt-2 flex items-center justify-between">
          <Button variant="secondary" onClick={goBack}>
            <CaretLeft />
            <span className="px-1">{current === 0 ? 'Cancel' : 'Back'}</span>
          </Button>
          {view.stage === 'date' && (
            <Button
              disabled={validation.level === 'block'}
              onClick={() =>
                show('D3', validation.level === 'ok' ? 'clean' : 'gap', {
                  moveDate: date,
                  moveToFrequency: toSchedule.frequency,
                  moveToScheduleId: toSchedule.id,
                  scheduleId: fromScheduleId,
                })
              }
            >
              <span className="px-1">Continue</span>
            </Button>
          )}
          {view.stage === 'review' && (
            <Button
              onClick={() =>
                show('D4', validation.level === 'pending' ? 'scheduled' : 'immediate', {
                  scheduleId: fromScheduleId,
                })
              }
            >
              <span className="px-1">Continue</span>
            </Button>
          )}
          {view.stage === 'confirm' && (
            <Button onClick={() => show('C8', undefined, { scheduleId: fromScheduleId, completeMove: true })}>
              <span className="px-1">{view.confirmMode === 'scheduled' ? 'Schedule move' : 'Confirm move'}</span>
            </Button>
          )}
        </div>
      </div>
    </FormShell>
  )
}

/* ---------------- membership row ---------------- */

function MemberRow({
  employee,
  flagged,
  assignments,
  schedules,
}: {
  employee: Employee
  flagged?: boolean
  /** Live App only — real per-employee overrides + mutable schedule list. */
  assignments?: Record<string, string>
  schedules?: Array<PaySchedule>
}) {
  const { show } = useExplorer()
  const schedule = liveScheduleFor(employee, assignments, schedules)
  return (
    <tr
      className={cn(
        'border-b border-border-highlight transition-colors hover:bg-surface-2',
        flagged && 'bg-background-warning-highlight',
      )}
    >
      <td className="px-4 py-3">
        <p className="truncate text-label-xs text-text-primary">{employee.name}</p>
        <p className="truncate text-paragraph-xs text-text-muted">{employee.jobTitle}</p>
      </td>
      <td className="px-4 py-3 text-paragraph-xs text-text-primary">{fmtCompensation(employee)}</td>
      <td className="px-4 py-3 text-paragraph-xs text-text-muted">{fmtHireDate(employee.hireDate)}</td>
      <td className="px-4 py-3">
        {flagged && (
          <span className="inline-flex items-center gap-1 rounded-full bg-background-warning-muted px-2 py-0.5 text-caption-md text-text-primary">
            <Flag className="size-3" />
            Re-eval flagged
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-brand-text"
          onClick={() => show('D2', 'valid', { employeeId: employee.id, from: schedule.frequency })}
        >
          <ArrowsLeftRight />
          <span className="px-1">Move</span>
        </Button>
      </td>
    </tr>
  )
}

/* ---------------- screen ---------------- */

export function ScheduleDetailScreen({ view }: { view: ScheduleDetailView }) {
  const { show } = useExplorer()
  const schedules = view.schedules ?? SCHEDULES
  const schedule = schedules.find((s) => s.id === view.scheduleId) ?? schedules[0]
  // Move (D2-D4) takes over the whole screen as a spacious step, not a
  // modal layered on top of it (PRD round 2) - see app.tsx's isForm check.
  if (view.move) return <MoveFlowScreen view={view.move} fromScheduleId={schedule.id} />
  const members = useMemo(
    () => employees.filter((e) => liveScheduleFor(e, view.assignments, schedules).id === schedule.id),
    [schedule.id, view.assignments, schedules],
  )
  const period = periodOf(schedule.frequency, WORLD_TODAY)
  const flaggedId = view.reeval === 'flagged' ? members[2]?.id ?? null : null

  return (
    <>
      <PageHeader
        title={schedule.name}
        onBack={() => show('C1')}
        actions={
          !schedule.isDefault ? (
            <>
              <Button
                variant="secondary"
                onClick={() => show('B2', undefined, { editScheduleId: schedule.id })}
              >
                <UsersThree />
                <span className="px-1">Edit rule</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => show('B1', undefined, { editScheduleId: schedule.id })}
              >
                <NotePencil />
                <span className="px-1">Edit details</span>
              </Button>
            </>
          ) : undefined
        }
      />
      <PageBody className="relative flex flex-col gap-3 bg-surface-1">
        {view.reeval === 'prompt' && (
          <Banner
            tone="info"
            title="Rules changed - re-evaluate memberships?"
            actions={
              <>
                <Button size="sm" onClick={() => show('H2', 'flagged')}>
                  <span className="px-1">Re-evaluate {members.length} employees</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => show('C8', undefined, { scheduleId: schedule.id })}>
                  <span className="px-1">Later</span>
                </Button>
              </>
            }
          >
            You edited this schedule's rule. Memberships aren't re-checked until you run
            re-evaluation.
          </Banner>
        )}
        {view.reeval === 'flagged' && members[2] && (
          <Banner
            tone="warning"
            title="Re-evaluation flagged 1 move"
            actions={
              <Button size="sm" onClick={() => show('D3', 'gap', { scheduleId: schedule.id })}>
                <span className="px-1">Review move</span>
              </Button>
            }
          >
            {members[2].name} no longer matches this schedule's rule. Nothing moves without your
            confirmation.
          </Banner>
        )}
        {view.emma === 'location' && (
          <EmmaCard
            title="Work-location change"
            actions={
              <>
                <Button size="sm" onClick={() => show('D2', 'valid', { scheduleId: schedule.id })}>
                  <span className="px-1">Review move</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => show('C8', undefined, { scheduleId: schedule.id })}>
                  <span className="px-1">Dismiss</span>
                </Button>
              </>
            }
          >
            {MOVE_EMPLOYEE.name}'s work location changed to Berlin. Berlin employees are paid
            Monthly - want to move them from Bi-weekly?
          </EmmaCard>
        )}

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-label-sm text-text-primary">{schedule.name}</p>
                {schedule.isDefault && (
                  <span className="shrink-0 text-label-xs text-brand-text">Default · everyone else</span>
                )}
              </div>
              <p className="mt-1 text-paragraph-xs text-text-muted">{describeRule(schedule.rule)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AvatarStack names={members.map((e) => e.name)} max={4} />
              <span className="text-label-xs text-text-primary">{members.length} people</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border-highlight pt-4">
            <KV label="Pay frequency">{schedule.frequency}</KV>
            <KV label="Current pay period">
              {fmtHuman(period.start)} – {fmtHuman(period.end)}
            </KV>
            <KV label="Next payday">{fmtHuman(schedule.nextPayday)}</KV>
            <KV label="Pay day">{weekdayName(schedule.nextPayday)}</KV>
            <KV label="Work week start day">{schedule.workWeekStartDay}</KV>
            <KV label="History">{schedule.hasHistory ? 'Has completed runs' : 'No runs yet'}</KV>
          </div>
        </Card>

        <Card title={`Members · ${members.length}`}>
          {members.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-8">
              <UsersThree className="size-5 text-text-disabled" />
              <p className="text-label-xs text-text-primary">No members yet</p>
              <p className="max-w-72 text-center text-paragraph-xs text-text-muted">
                People join automatically once they match this schedule's rule.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border-highlight">
              <table className="w-full border-collapse bg-background-base">
                <thead className="bg-surface-1">
                  <tr className="border-b border-border-base text-left">
                    <th className="px-4 py-2 text-label-xs font-[530] text-text-muted">Employee</th>
                    <th className="px-4 py-2 text-label-xs font-[530] text-text-muted">Compensation</th>
                    <th className="px-4 py-2 text-label-xs font-[530] text-text-muted">Hired on</th>
                    <th className="px-4 py-2" />
                    <th className="w-24 px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((e) => (
                    <MemberRow
                      key={e.id}
                      employee={e}
                      flagged={e.id === flaggedId}
                      assignments={view.assignments}
                      schedules={schedules}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  )
}
