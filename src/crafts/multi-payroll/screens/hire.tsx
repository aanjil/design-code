import { useMemo, useState } from 'react'
import { CaretLeft, Sparkle, UsersThree } from '@phosphor-icons/react'
import type { HireView } from '../types'
import { Banner, FormCard, FormShell, ScheduleRow, ScheduleTag, ShowAllToggle } from '../ui'
import { checkStateCompliance, matchEmployees } from '../engine'
import type { PaySchedule } from '@/mocks/payroll'
import { HIRE_CANDIDATES, SCHEDULES } from '@/mocks/payroll'
import { useExplorer } from '@/components/playground/explorer'
import { Stepper } from '@/components/nds/stepper'
import { Button } from '@/components/ui/button'

/**
 * H1 (beyond v1): schedule assignment inside the hire flow. Round 2: the
 * picker always lists every real schedule (not just rule-matches), each
 * tagged aligned/violating from the real state-compliance check, with a
 * toggle to narrow back down to just what the rules actually claim.
 */

const STEPS = ['Details', 'Compensation', 'Payroll schedule', 'Review']

export function HireScreen({ view }: { view: HireView }) {
  const { show } = useExplorer()
  const candidateKey = view.candidate ?? 'matched'
  const candidate = HIRE_CANDIDATES[candidateKey]

  const activeSchedules = useMemo(() => SCHEDULES.filter((s) => s.status === 'active'), [])
  const matchedSchedules = useMemo(
    () => activeSchedules.filter((s) => s.rule && matchEmployees(s.rule, [candidate]).length > 0),
    [activeSchedules, candidate],
  )
  const defaultSchedule = activeSchedules.find((s) => s.isDefault)!
  const isSeveral = matchedSchedules.length > 1

  const [showAll, setShowAll] = useState(true)
  const [resolved, setResolved] = useState<string | null>(null)
  const [override, setOverride] = useState<string | null>(null)

  const unresolvedSeveral = isSeveral && !resolved && !override

  const autoSchedule = matchedSchedules[0] ?? defaultSchedule
  const effective = override
    ? activeSchedules.find((s) => s.id === override)!
    : resolved
      ? activeSchedules.find((s) => s.id === resolved)!
      : autoSchedule
  const how: 'rule' | 'default' | 'manual' = override
    ? 'manual'
    : matchedSchedules.length > 0
      ? 'rule'
      : 'default'
  const aligned = checkStateCompliance(candidate, effective.frequency)
  const firstAligned = activeSchedules.find((s) => checkStateCompliance(candidate, s.frequency))

  if (unresolvedSeveral) {
    const rest = activeSchedules.filter((s) => !matchedSchedules.some((m) => m.id === s.id))
    return (
      <FormShell title="Add employee" rail={<Stepper steps={STEPS} current={2} />}>
        <div className="flex flex-col gap-3">
          <FormCard>
            <h2 className="text-title-h5 text-text-primary">Payroll schedule</h2>
            <p className="mt-1 text-paragraph-sm text-text-muted">
              {candidate.name.split(' ')[0]} fits {matchedSchedules.length} schedules. Choose where they belong.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {matchedSchedules.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setResolved(s.id)}
                  className="rounded-lg border border-border-highlight p-3 text-left hover:bg-background-highlight"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-label-xs text-text-primary">{s.name}</p>
                    <ScheduleTag aligned={checkStateCompliance(candidate, s.frequency)} />
                  </div>
                  <p className="mt-0.5 text-paragraph-xs text-text-muted">
                    {s.frequency} · Matched “{s.name}”
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-label-xs text-text-primary">Or choose a different schedule</p>
              <ShowAllToggle showAll={showAll} onChange={setShowAll} />
            </div>
            {showAll && rest.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-lg border border-border-highlight">
                {rest.map((s) => (
                  <ScheduleRow
                    key={s.id}
                    schedule={s}
                    detail={s.frequency}
                    selected={false}
                    aligned={checkStateCompliance(candidate, s.frequency)}
                    onSelect={() => setOverride(s.id)}
                  />
                ))}
              </div>
            )}
          </FormCard>
          <Footer disabled disabledLabel="Pick a schedule" onContinue={() => show('D1', 'full')} />
        </div>
      </FormShell>
    )
  }

  const otherSchedules = activeSchedules.filter((s) => s.id !== effective.id)
  const shownOthers = showAll ? otherSchedules : matchedSchedules.filter((s) => s.id !== effective.id)

  return (
    <FormShell title="Add employee" rail={<Stepper steps={STEPS} current={2} />}>
      <div className="flex flex-col gap-3">
        <Banner
          tone={how === 'manual' ? 'info' : aligned ? 'success' : 'warning'}
          title={
            how === 'manual'
              ? `Set manually - ${effective.name}`
              : how === 'default'
                ? `No rule matched - using ${effective.name}`
                : `Rules place ${candidate.name} in ${effective.name} · ${effective.frequency}`
          }
        >
          {how === 'rule' && `Matched “${matchedSchedules[0]?.rule ? describeMatch(matchedSchedules[0]) : ''}”. Membership follows the rule - override below if this hire is an exception.`}
          {how === 'default' && 'No membership rule claims this hire, so they land on the default schedule automatically.'}
          {how === 'manual' && 'Set by you. Rules won’t change this until you update it.'}
        </Banner>

        <FormCard>
          <h2 className="text-title-h5 text-text-primary">Payroll schedule</h2>
          <p className="mt-1 text-paragraph-sm text-text-muted">
            {how === 'default'
              ? 'Assigned to your default schedule so this hire is always paid.'
              : 'Assigned automatically from your membership rules.'}
          </p>

          <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-background-highlight p-3">
            <UsersThree className="size-4 shrink-0 text-text-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-label-xs text-text-primary">
                {effective.name} · {effective.frequency}
              </p>
              <p className="text-paragraph-xs text-text-muted">First payday {effective.nextPayday}</p>
            </div>
            <ScheduleTag aligned={aligned} />
          </div>

          {!aligned && (
            <Banner tone="warning" title="This schedule may not be compliant" className="mt-3">
              {candidate.workLocation} requires more frequent pay than {effective.frequency.toLowerCase()} allows.
              {firstAligned && ` Pick ${firstAligned.name} to pay ${candidate.name.split(' ')[0]} correctly from day one.`}
              <div className="mt-2 flex gap-2">
                {firstAligned && (
                  <Button size="sm" onClick={() => setOverride(firstAligned.id)}>
                    <span className="px-1">Pick {firstAligned.name}</span>
                  </Button>
                )}
                <Button variant="secondary" size="sm">
                  <Sparkle className="text-brand-primary" weight="fill" />
                  <span className="px-1">Ask Emma</span>
                </Button>
              </div>
            </Banner>
          )}

          <div className="mt-5 flex items-center justify-between">
            <p className="text-label-xs text-text-primary">Select schedule</p>
            <ShowAllToggle showAll={showAll} onChange={setShowAll} />
          </div>
          {shownOthers.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-border-highlight">
              {shownOthers.map((s) => (
                <ScheduleRow
                  key={s.id}
                  schedule={s}
                  detail={s.rule ? s.frequency : `${s.frequency} · Default`}
                  selected={false}
                  aligned={checkStateCompliance(candidate, s.frequency)}
                  onSelect={() => setOverride(s.id)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-paragraph-xs text-text-muted">
              No other schedules match this hire's rules.{' '}
              <button type="button" className="text-brand-text" onClick={() => setShowAll(true)}>
                Show all schedules
              </button>{' '}
              to pick a different one by hand.
            </p>
          )}
          <p className="mt-3 text-paragraph-xs text-text-muted">
            {how === 'manual'
              ? 'Set by you. Rules won’t change this until you update it.'
              : 'Pick the matched schedule to follow the rule, or choose a different one by hand. Rules won’t change a manual pick.'}
          </p>
        </FormCard>

        <Footer disabled={!aligned} onContinue={() => show('D1', 'full')} />
      </div>
    </FormShell>
  )
}

function describeMatch(schedule: PaySchedule): string {
  return schedule.rule ? schedule.name : 'No conditions'
}

function Footer({
  disabled,
  disabledLabel = 'Pick a compliant schedule',
  onContinue,
}: {
  disabled?: boolean
  disabledLabel?: string
  onContinue: () => void
}) {
  const { show } = useExplorer()
  return (
    <div className="mt-2 flex items-center justify-between">
      <Button variant="secondary" onClick={() => show('C1')}>
        <CaretLeft />
        <span className="px-1">Back</span>
      </Button>
      <Button onClick={onContinue} disabled={disabled}>
        <span className="px-1">{disabled ? disabledLabel : 'Continue'}</span>
      </Button>
    </div>
  )
}
