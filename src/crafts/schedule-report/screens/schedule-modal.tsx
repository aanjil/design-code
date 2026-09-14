import { useState } from 'react'
import { Info, PencilSimple, ShieldWarning } from '@phosphor-icons/react'
import type { CustomWindow, ModalStep, RangePeriodPreset, ScheduleConfig, SinglePeriodPreset } from '../types'
import { RANGE_PERIOD_PRESETS, SINGLE_PERIOD_PRESETS } from '../types'
import { ORG_MEMBERS, getReport } from '@/mocks/insights-reports'
import {
  FULL_WEEKDAYS,
  MONTH_ANCHORS,
  ORG_TIMEZONE_LABEL,
  RANGE_PERIOD_LABELS,
  SINGLE_PERIOD_LABELS,
  WORLD_TODAY,
  buildNextRunBanner,
  computeNextRun,
  customWindowEndsLabel,
  customWindowEndsOptions,
  endsPhrase,
  fmtHuman,
  frequencyLabel,
  resolveAsOfDate,
  resolvePeriod,
  validateOneTime,
} from '../engine'
import {
  ExternalRecipientInput,
  HorizontalStepper,
  InlineError,
  ModalShell,
  RecipientChip,
  RecipientPicker,
  WarningNote,
} from '../ui'
import { FieldLabel as ControlLabel, TextInput } from '@/components/nds/controls'
import { SelectField } from '@/components/nds/select-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

/**
 * B group - the Schedule config modal, rebuilt as a 3-step stepper per
 * Figma 603:13584 ("Schedule details" / "Delivery setup" / "Review").
 * Cadence/period logic is the reference HTML prototype's model exactly:
 * date-shape-dependent period presets, full weekday anchors, a
 * capitalized "Last day" monthly anchor, and a custom relative window
 * whose "ends" options depend on the chosen unit. `onChange` is optional -
 * omit it to render a frozen catalog state; pass it to make every field
 * real (the Live App, and any catalog frame you want to poke at).
 */

const STEP_LABELS = ['Schedule details', 'Delivery setup', 'Review']

const RUN_TIMES = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM']
const STATUS_OPTIONS = ['All', 'Approved', 'Pending', 'Paid', 'Rejected']
const TIMEZONES = [
  ORG_TIMEZONE_LABEL,
  'GMT -7:00 - Pacific Time - Los Angeles',
  'GMT +0:00 - UTC',
  'GMT +5:45 - Nepal Time - Kathmandu',
]

function tzShort(label: string): string {
  return label.split(' - ')[0]
}

/** "Eastern" / "Pacific" / "UTC" - the short word used in review-row
 *  copy ("9:00 AM Eastern"), distinct from the banner's "GMT -4:00" form. */
function tzWord(label: string): string {
  const middle = label.split(' - ')[1] ?? ''
  return middle.replace(' Time', '')
}

/** The one-line "Date range: ... · Status: ..." (or as-of / snapshot)
 *  shown in both the Report parameters card and the Review summary. */
function parametersLine(draft: ScheduleConfig, dateShape: 'range' | 'single' | 'none', nextRunIso: string): string {
  const statusSuffix = draft.statusFilter ? ` · Status: ${draft.statusFilter.join(', ')}` : ' · Status: All'
  if (dateShape === 'none') return 'Snapshot - captured at run time'
  if (draft.cadence === 'once') {
    if (dateShape === 'single') return `As of ${fmtHuman(draft.runDate ?? WORLD_TODAY)}`
    if (draft.dateRange) return `Date range: ${fmtHuman(draft.dateRange.start)} - ${fmtHuman(draft.dateRange.end)}${statusSuffix}`
    return `Date range: -${statusSuffix}`
  }
  if (dateShape === 'single') {
    const preset = (draft.period as SinglePeriodPreset) ?? 'on-run-date'
    const resolved = resolveAsOfDate(preset, nextRunIso)
    return `As of ${resolved.label.toLowerCase()}${statusSuffix}`
  }
  const preset = (draft.period as RangePeriodPreset) ?? 'prev-month'
  const window = resolvePeriod(preset, nextRunIso, draft.customWindow)
  return `Date range: ${fmtHuman(window.start)} - ${fmtHuman(window.end)}${statusSuffix}`
}

/* ---------------- step 1: Schedule details ---------------- */

function ReportParametersCard({
  draft,
  dateShape,
  nextRunIso,
  onChange,
}: {
  draft: ScheduleConfig
  dateShape: 'range' | 'single' | 'none'
  nextRunIso: string
  onChange?: (patch: Partial<ScheduleConfig>) => void
}) {
  const [editing, setEditing] = useState(false)
  const line = parametersLine(draft, dateShape, nextRunIso)

  return (
    <section className="rounded-xl bg-background-highlight p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-label-xs text-text-primary">
          Report parameters <span className="font-normal text-text-muted">(carried from the report)</span>
        </p>
        {onChange && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1 text-label-xs text-brand-text hover:text-brand-primary"
          >
            <PencilSimple className="size-3.5" />
            {editing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="grid grid-cols-2 gap-3">
          {draft.cadence === 'once' && dateShape === 'range' && (
            <div>
              <ControlLabel>Date range</ControlLabel>
              <TextInput
                value={draft.dateRange ? `${draft.dateRange.start} - ${draft.dateRange.end}` : ''}
                onChange={(e) => {
                  const [start, end] = e.target.value.split(' - ')
                  if (start && end) onChange?.({ dateRange: { start, end } })
                }}
                placeholder="YYYY-MM-DD - YYYY-MM-DD"
                className="mt-1.5"
              />
            </div>
          )}
          {dateShape !== 'none' && (
            <div>
              <ControlLabel>Status</ControlLabel>
              <SelectField
                value={draft.statusFilter?.[0] ?? 'All'}
                onChange={(v) => onChange?.({ statusFilter: v === 'All' ? undefined : [v] })}
                options={STATUS_OPTIONS}
                className="mt-1.5"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {line.split(' · ').map((part) => (
            <span
              key={part}
              className="flex h-7 items-center rounded-full bg-background-base px-2.5 text-caption-md text-text-primary shadow-button-gray"
            >
              {part}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

function HowOftenCard({
  draft,
  dateShape,
  nextRunIso,
  onChange,
}: {
  draft: ScheduleConfig
  dateShape: 'range' | 'single' | 'none'
  nextRunIso: string
  onChange?: (patch: Partial<ScheduleConfig>) => void
}) {
  const frequency = draft.frequency ?? 'Monthly'
  const anchorDay = draft.anchorDay ?? (frequency === 'Weekly' ? FULL_WEEKDAYS[1] : '1')
  const periodOptions: ReadonlyArray<string> = dateShape === 'range' ? RANGE_PERIOD_PRESETS : SINGLE_PERIOD_PRESETS
  const periodLabels: Record<string, string> = dateShape === 'range' ? RANGE_PERIOD_LABELS : SINGLE_PERIOD_LABELS

  let periodPhrase: string | undefined
  if (draft.cadence === 'recurring' && dateShape === 'range') {
    const preset = (draft.period as RangePeriodPreset) ?? 'prev-month'
    const window = resolvePeriod(preset, nextRunIso, draft.customWindow)
    periodPhrase = preset === 'custom' ? window.label : window.label.toLowerCase()
  } else if (draft.cadence === 'recurring' && dateShape === 'single') {
    const preset = (draft.period as SinglePeriodPreset) ?? 'on-run-date'
    periodPhrase = resolveAsOfDate(preset, nextRunIso).label.toLowerCase()
  }

  const ends = draft.cadence === 'recurring' ? endsPhrase(draft.endCondition, draft.endDate, draft.endAfterRuns) : ''

  const banner = buildNextRunBanner({
    dateShape,
    cadence: draft.cadence,
    frequency,
    anchorDay,
    nextRunIso: draft.cadence === 'recurring' ? nextRunIso : undefined,
    runDate: draft.runDate,
    runTime: draft.runTime,
    periodPhrase,
    endsPhrase: ends,
    tzShort: tzShort(draft.timezone),
  })

  const oneTimePeriodEnd = draft.dateRange?.end
  const dateError =
    draft.cadence === 'once' && oneTimePeriodEnd ? validateOneTime(draft.runDate ?? WORLD_TODAY, oneTimePeriodEnd) : null

  return (
    <section className="rounded-xl border border-border-highlight p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-label-xs text-text-primary">
            How often <span className="text-text-error-base">*</span>
          </p>
          <p className="text-caption-md text-text-muted">Choose whether this report runs once or repeats automatically.</p>
        </div>
        <div className="flex h-9 shrink-0 items-center rounded-lg border border-border-base bg-surface-2 p-0.5">
          {(['once', 'recurring'] as const).map((v) => (
            <button
              key={v}
              type="button"
              disabled={!onChange}
              onClick={() => onChange?.({ cadence: v })}
              className={cn(
                'flex h-full items-center rounded-md px-3 text-caption-md transition-colors',
                draft.cadence === v ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted',
              )}
            >
              {v === 'once' ? 'One-time' : 'Recurring'}
            </button>
          ))}
        </div>
      </div>

      {draft.cadence === 'once' ? (
        <div>
          <ControlLabel required>Run date</ControlLabel>
          <TextInput
            type="date"
            value={draft.runDate ?? ''}
            disabled={!onChange}
            onChange={(e) => onChange?.({ runDate: e.target.value })}
            className="mt-1.5 max-w-[232px]"
          />
          {dateError && <InlineError>{dateError}</InlineError>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <ControlLabel required>Frequency</ControlLabel>
              <SelectField
                value={frequency}
                disabled={!onChange}
                onChange={(v) => {
                  const next = v as 'Daily' | 'Weekly' | 'Monthly'
                  onChange?.({
                    frequency: next,
                    anchorDay: next === 'Weekly' ? FULL_WEEKDAYS[1] : next === 'Monthly' ? '1' : undefined,
                  })
                }}
                options={['Daily', 'Weekly', 'Monthly']}
                className="mt-1.5"
              />
            </div>
            {frequency !== 'Daily' && (
              <div>
                <ControlLabel required>{frequency === 'Weekly' ? 'On day of week' : 'On day'}</ControlLabel>
                <SelectField
                  value={anchorDay}
                  disabled={!onChange}
                  onChange={(v) => onChange?.({ anchorDay: v })}
                  options={frequency === 'Weekly' ? FULL_WEEKDAYS : MONTH_ANCHORS}
                  className="mt-1.5"
                />
              </div>
            )}
          </div>

          {dateShape === 'none' ? (
            <div className="flex items-center gap-2 rounded-lg bg-background-highlight p-2.5 text-paragraph-xs text-text-primary">
              <Info className="size-4 shrink-0 text-brand-text" />
              Captures a snapshot at run time - this report type has no reporting-period param.
            </div>
          ) : (
            <div className={cn('grid gap-3', draft.period === 'custom' && dateShape === 'range' ? 'grid-cols-3' : 'grid-cols-2')}>
              <div>
                <ControlLabel required>Reporting period (each run)</ControlLabel>
                <SelectField
                  value={(draft.period && periodLabels[draft.period]) || periodLabels[periodOptions[0]]}
                  disabled={!onChange}
                  onChange={(label) => {
                    const preset = periodOptions.find((p) => periodLabels[p] === label) ?? periodOptions[0]
                    onChange?.({
                      period: preset as ScheduleConfig['period'],
                      customWindow: preset === 'custom' ? draft.customWindow ?? { n: 1, unit: 'months', endsOn: 'run-date' } : draft.customWindow,
                    })
                  }}
                  options={periodOptions.map((p) => periodLabels[p])}
                  className="mt-1.5"
                />
              </div>
              {draft.period === 'custom' && dateShape === 'range' && draft.customWindow && (
                <>
                  <div>
                    <ControlLabel>Last</ControlLabel>
                    <div className="mt-1.5 flex items-center gap-2">
                      <TextInput
                        type="number"
                        min={1}
                        value={draft.customWindow.n}
                        disabled={!onChange}
                        onChange={(e) => onChange?.({ customWindow: { ...draft.customWindow!, n: Number(e.target.value) || 1 } })}
                        className="w-16"
                      />
                      <SelectField
                        value={draft.customWindow.unit}
                        disabled={!onChange}
                        onChange={(unit) => {
                          const nextUnit = unit as CustomWindow['unit']
                          const validEnds = customWindowEndsOptions(nextUnit)
                          onChange?.({
                            customWindow: {
                              ...draft.customWindow!,
                              unit: nextUnit,
                              endsOn: validEnds.includes(draft.customWindow!.endsOn) ? draft.customWindow!.endsOn : validEnds[0],
                            },
                          })
                        }}
                        options={['days', 'weeks', 'months', 'quarters', 'years']}
                      />
                    </div>
                  </div>
                  <div>
                    <ControlLabel required>Window ends</ControlLabel>
                    <SelectField
                      value={customWindowEndsLabel(draft.customWindow.endsOn, draft.customWindow.unit)}
                      disabled={!onChange}
                      onChange={(label) => {
                        const opt = customWindowEndsOptions(draft.customWindow!.unit).find(
                          (o) => customWindowEndsLabel(o, draft.customWindow!.unit) === label,
                        )
                        if (opt) onChange?.({ customWindow: { ...draft.customWindow!, endsOn: opt } })
                      }}
                      options={customWindowEndsOptions(draft.customWindow.unit).map((o) =>
                        customWindowEndsLabel(o, draft.customWindow!.unit),
                      )}
                      className="mt-1.5"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <ControlLabel required>Ends</ControlLabel>
              <SelectField
                value={draft.endCondition === 'after-n' ? 'After' : draft.endCondition === 'on-date' ? 'On date' : 'Never'}
                disabled={!onChange}
                onChange={(v) => {
                  const map: Record<string, 'never' | 'on-date' | 'after-n'> = { Never: 'never', 'On date': 'on-date', After: 'after-n' }
                  onChange?.({
                    endCondition: map[v],
                    endDate: draft.endDate ?? '2026-12-31',
                    endAfterRuns: draft.endAfterRuns ?? 12,
                  })
                }}
                options={['Never', 'On date', 'After']}
                className="mt-1.5"
              />
            </div>
            {draft.endCondition === 'on-date' && (
              <div>
                <ControlLabel required>End date</ControlLabel>
                <TextInput
                  type="date"
                  value={draft.endDate ?? ''}
                  disabled={!onChange}
                  onChange={(e) => onChange?.({ endDate: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            )}
            {draft.endCondition === 'after-n' && (
              <div>
                <ControlLabel required>After how many runs</ControlLabel>
                <TextInput
                  type="number"
                  min={1}
                  value={draft.endAfterRuns ?? 12}
                  disabled={!onChange}
                  onChange={(e) => onChange?.({ endAfterRuns: Number(e.target.value) || 1 })}
                  className="mt-1.5"
                />
              </div>
            )}
          </div>

          {draft.afterEachRun && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-muted p-2.5 text-paragraph-xs text-brand-text">
              <Info className="size-4 shrink-0" />
              After each run selected - runs automatically once payroll status changes to {draft.statusFilter?.join(' or ')}.
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <ControlLabel required>Run time</ControlLabel>
          <SelectField
            value={draft.runTime}
            disabled={!onChange}
            onChange={(v) => onChange?.({ runTime: v })}
            options={RUN_TIMES}
            className="mt-1.5"
          />
        </div>
        <div>
          <ControlLabel>Time zone</ControlLabel>
          <SelectField
            value={draft.timezone}
            disabled={!onChange}
            onChange={(v) => onChange?.({ timezone: v })}
            options={TIMEZONES}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-background-info-muted px-3 py-2.5 text-paragraph-xs text-text-info-base">
        <Info className="mt-0.5 size-4 shrink-0" />
        {banner}
      </div>
    </section>
  )
}

/* ---------------- step 2: Delivery setup ---------------- */

const DELIVERY_METHODS = [
  { key: 'platform' as const, label: 'Platform', desc: 'Access via Niural Insights' },
  { key: 'email' as const, label: 'Email delivery', desc: 'Send as attachment' },
  { key: 'link' as const, label: 'External link', desc: 'Secure link, verified by OTP' },
]

function DeliverySetupStep({
  draft,
  onChange,
}: {
  draft: ScheduleConfig
  onChange?: (patch: Partial<ScheduleConfig>) => void
}) {
  const externalRecipients = [...draft.emailRecipients, ...draft.linkRecipients].filter((r) => r.external)
  const noRecipientsError =
    (draft.delivery.email && draft.emailRecipients.length === 0) || (draft.delivery.link && draft.linkRecipients.length === 0)

  function toggleMethod(method: 'platform' | 'email' | 'link') {
    const isLastOn = draft.delivery[method] && Object.values(draft.delivery).filter(Boolean).length === 1
    if (isLastOn) return
    onChange?.({ delivery: { ...draft.delivery, [method]: !draft.delivery[method] } })
  }

  function toggleEmailMember(member: (typeof ORG_MEMBERS)[number]) {
    const exists = draft.emailRecipients.some((r) => r.email === member.email)
    const next = exists
      ? draft.emailRecipients.filter((r) => r.email !== member.email)
      : [...draft.emailRecipients, { email: member.email, name: member.name, role: member.role }]
    onChange?.({ emailRecipients: next })
  }

  function addExternalEmail(email: string) {
    if (draft.emailRecipients.some((r) => r.email === email)) return
    onChange?.({ emailRecipients: [...draft.emailRecipients, { email, external: true }] })
  }

  function addExternalLink(email: string) {
    if (draft.linkRecipients.some((r) => r.email === email)) return
    onChange?.({ linkRecipients: [...draft.linkRecipients, { email, external: true }] })
  }

  function removeRecipient(list: 'emailRecipients' | 'linkRecipients', email: string) {
    onChange?.({ [list]: draft[list].filter((r) => r.email !== email) } as Partial<ScheduleConfig>)
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border-highlight p-3">
        <p className="text-label-xs text-text-primary">Deliver to</p>
        <p className="mb-3 text-caption-md text-text-muted">Choose how recipients receive this report.</p>
        <div className="grid grid-cols-3 gap-2">
          {DELIVERY_METHODS.map((m) => (
            <button
              key={m.key}
              type="button"
              disabled={!onChange}
              onClick={() => toggleMethod(m.key)}
              className={cn(
                'flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors',
                draft.delivery[m.key] ? 'border-brand-primary bg-brand-base' : 'border-border-highlight',
              )}
            >
              <Checkbox checked={draft.delivery[m.key]} onCheckedChange={() => {}} className="mt-0.5" />
              <span>
                <p className="text-label-xs text-text-primary">{m.label}</p>
                <p className="text-caption-md text-text-muted">{m.desc}</p>
              </span>
            </button>
          ))}
        </div>
      </section>

      {draft.delivery.email && (
        <section className="rounded-xl border border-border-highlight p-3">
          <p className="mb-2 text-label-xs text-text-primary">Email recipients</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {draft.emailRecipients.map((r) => (
              <RecipientChip key={r.email} recipient={r} onRemove={onChange && (() => removeRecipient('emailRecipients', r.email))} />
            ))}
            {onChange && (
              <RecipientPicker
                members={ORG_MEMBERS}
                selectedEmails={draft.emailRecipients.map((r) => r.email)}
                onToggle={toggleEmailMember}
                onAddExternal={addExternalEmail}
              />
            )}
          </div>
          {draft.emailRecipients.length === 0 && <InlineError>Add at least one recipient.</InlineError>}
        </section>
      )}

      {draft.delivery.link && (
        <section className="rounded-xl border border-border-highlight p-3">
          <p className="mb-2 text-label-xs text-text-primary">External link recipients</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {draft.linkRecipients.map((r) => (
              <RecipientChip key={r.email} recipient={r} onRemove={onChange && (() => removeRecipient('linkRecipients', r.email))} />
            ))}
            {onChange && <ExternalRecipientInput onAdd={addExternalLink} />}
          </div>
          {draft.linkRecipients.length === 0 && <InlineError>Add at least one recipient.</InlineError>}
        </section>
      )}

      {noRecipientsError && (
        <InlineError>Add at least one recipient for every delivery method you've turned on.</InlineError>
      )}

      {externalRecipients.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-background-warning-muted p-2.5 text-paragraph-xs text-text-primary">
          <ShieldWarning weight="fill" className="mt-0.5 size-4 shrink-0 text-text-warning-base" />
          {externalRecipients.length} external recipient{externalRecipients.length > 1 ? 's' : ''} - this report may contain
          PII and will be sent outside the organization.
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-background-info-muted px-3 py-2.5 text-paragraph-xs text-text-info-base">
        <Info className="mt-0.5 size-4 shrink-0" />
        Recipients get a secure link. They verify with email and a one-time code, then download. Link expires in 7 days.
      </div>
    </div>
  )
}

/* ---------------- step 3: Review ---------------- */

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border-highlight px-1 py-3 last:border-0">
      <span className="text-paragraph-xs text-text-muted">{label}</span>
      <span className="text-right text-paragraph-xs text-text-primary">{value}</span>
    </div>
  )
}

function reportShortNames(list: Array<{ name?: string; email: string }>): string {
  if (list.length === 0) return '-'
  const names = list.map((r) => r.name ?? r.email)
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')}, +${names.length - 2} more`
}

function ReviewStep({
  draft,
  dateShape,
  nextRunIso,
}: {
  draft: ScheduleConfig
  dateShape: 'range' | 'single' | 'none'
  nextRunIso: string
}) {
  const report = getReport(draft.reportId)
  const frequency = draft.frequency ?? 'Monthly'
  const anchorDay = draft.anchorDay ?? (frequency === 'Weekly' ? FULL_WEEKDAYS[1] : '1')
  const scheduleLine =
    draft.cadence === 'once'
      ? `One-time · ${fmtHuman(draft.runDate ?? WORLD_TODAY)}, ${draft.runTime} ${tzWord(draft.timezone)}`
      : `${frequencyLabel(frequency, anchorDay)} · ${draft.runTime} ${tzWord(draft.timezone)}`
  const deliveryLine = [draft.delivery.platform && 'Platform', draft.delivery.email && 'Email', draft.delivery.link && 'External link']
    .filter(Boolean)
    .join(' + ')

  return (
    <div className="flex flex-col gap-3">
      <p className="text-paragraph-xs text-text-muted">Review the details below before saving.</p>
      <section className="rounded-xl border border-border-highlight px-3">
        <SummaryRow
          label="Report"
          value={
            <span className="flex items-center justify-end gap-1.5">
              {report.name}
              <span className="rounded bg-background-highlight px-1.5 py-0.5 text-caption-md text-text-muted">{report.category}</span>
            </span>
          }
        />
        <SummaryRow label="Parameters" value={parametersLine(draft, dateShape, nextRunIso)} />
        <SummaryRow label="Schedule" value={scheduleLine} />
        <SummaryRow label="Delivery" value={deliveryLine || '-'} />
        {draft.delivery.email && <SummaryRow label="Recipients (Email)" value={reportShortNames(draft.emailRecipients)} />}
        {draft.delivery.link && <SummaryRow label="Recipients (External link)" value={reportShortNames(draft.linkRecipients)} />}
      </section>
    </div>
  )
}

/* ---------------- shell ---------------- */

export function ScheduleConfigModal({
  draft,
  editing,
  nearRunWarning,
  initialStep = 1,
  onClose,
  onSave,
  onChange,
}: {
  draft: ScheduleConfig
  editing?: boolean
  nearRunWarning?: boolean
  /** Catalog only - freeze the modal on a given step. */
  initialStep?: ModalStep
  onClose: () => void
  onSave: () => void
  /** Omit for a frozen catalog state; pass to make every field real. */
  onChange?: (patch: Partial<ScheduleConfig>) => void
}) {
  const [step, setStep] = useState<ModalStep>(initialStep)
  const report = getReport(draft.reportId)
  const { date: nextRunIso } = computeNextRun(
    draft.frequency ?? 'Monthly',
    draft.anchorDay ?? ((draft.frequency ?? 'Monthly') === 'Weekly' ? FULL_WEEKDAYS[1] : '1'),
    WORLD_TODAY,
  )

  const dateError =
    draft.cadence === 'once' && draft.dateRange ? validateOneTime(draft.runDate ?? WORLD_TODAY, draft.dateRange.end) : null
  const noRecipientsError =
    (draft.delivery.email && draft.emailRecipients.length === 0) || (draft.delivery.link && draft.linkRecipients.length === 0)

  const canContinueFromStep1 = !dateError
  const canContinueFromStep2 = !noRecipientsError

  return (
    <ModalShell
      title={
        <>
          {editing ? 'Edit' : 'Schedule'} <span className="text-brand-text">{report.name}</span>
        </>
      }
      onClose={onClose}
      width="w-[794px] min-h-[70vh]"
      footer={
        <div className="flex w-full items-center justify-between">
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as ModalStep)}>
              <span className="px-1">Back</span>
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              <span className="px-1">Cancel</span>
            </Button>
          )}
          {step < 3 ? (
            <Button
              disabled={(step === 1 && !canContinueFromStep1) || (step === 2 && !canContinueFromStep2)}
              onClick={() => setStep((s) => (s + 1) as ModalStep)}
            >
              <span className="px-1">{step === 1 ? 'Continue to delivery setup' : 'Continue to review'}</span>
            </Button>
          ) : (
            <Button onClick={onSave}>
              <span className="px-1">{editing ? 'Save changes' : 'Save schedule'}</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <HorizontalStepper steps={STEP_LABELS} current={step} />

        {editing && (
          <WarningNote>
            Editing an existing schedule - changes apply from the next run. Same validations apply.
            {nearRunWarning && ' The next run may already be in progress.'}
          </WarningNote>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <ReportParametersCard draft={draft} dateShape={report.dateShape} nextRunIso={nextRunIso} onChange={onChange} />
            <HowOftenCard draft={draft} dateShape={report.dateShape} nextRunIso={nextRunIso} onChange={onChange} />
          </div>
        )}
        {step === 2 && <DeliverySetupStep draft={draft} onChange={onChange} />}
        {step === 3 && <ReviewStep draft={draft} dateShape={report.dateShape} nextRunIso={nextRunIso} />}
      </div>
    </ModalShell>
  )
}
