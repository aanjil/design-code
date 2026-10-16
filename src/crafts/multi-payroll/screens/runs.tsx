import { useState } from 'react'
import { CalendarBlank, CaretRight, Play, Stack } from '@phosphor-icons/react'
import type { RunDetailView, RunsView } from '../types'
import { Banner, FreqTag, ModalShell } from '../ui'
import { WORLD_TODAY, addDaysISO, fmtHuman, money, periodOf } from '../engine'
import { SCHEDULES } from '@/mocks/payroll'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { useExplorer } from '@/components/playground/explorer'
import { cn } from '@/lib/utils'
import { Button, IconButton } from '@niural/components'
import { DynamicTimeline } from '@/crafts/dynamic-timeline/timeline'

/**
 * F group: runs list per schedule + the run-type picker. `full` adds the
 * beyond-v1 “across schedules” combined run.
 */

interface RunRow {
  schedule: (typeof SCHEDULES)[number]
  window: string
  payday: string
  amount: number
  people: number
  status: 'needs-approval' | 'scheduled' | 'processing'
  deadline?: string
}

function buildRuns(
  variant: RunsView['variant'],
  live?: Array<(typeof SCHEDULES)[number]>,
): Array<RunRow> {
  // No schedules created in the live store yet = everyone is still on the
  // seeded default schedule, which still runs - never an empty runs list.
  const schedules = live?.length ? live : SCHEDULES
  return schedules.map((s, i) => {
    const period = periodOf(s.frequency, WORLD_TODAY)
    const needs = variant === 'needs-action' && i === 0
    return {
      schedule: s,
      window: `${fmtHuman(period.start)} – ${fmtHuman(period.end)}`,
      payday: fmtHuman(s.nextPayday),
      amount: [412903.18, 96412.5, 21384.0, 48210.75][i] ?? s.memberCount * 4200,
      people: s.memberCount,
      status: needs ? 'needs-approval' : 'scheduled',
      deadline: needs ? fmtHuman(addDaysISO(period.end, -3)) : undefined,
    }
  })
}

const STATUS_PILL: Record<RunRow['status'], { label: string; cls: string }> = {
  'needs-approval': {
    label: 'Needs approval',
    cls: 'bg-warning-muted text-primary',
  },
  scheduled: {
    label: 'Scheduled',
    cls: 'bg-highlight text-muted',
  },
  processing: {
    label: 'Processing',
    cls: 'bg-info-muted text-primary',
  },
}

function RunPickerModal({
  scope,
  onClose,
}: {
  scope: 'v1' | 'full'
  onClose: () => void
}) {
  const [choice, setChoice] = useState('sch-monthly')
  const options = [
    ...SCHEDULES.map((s) => ({
      id: s.id,
      title: `Regular run - ${s.name}`,
      sub: `${s.frequency} · ${s.memberCount} people · payday ${fmtHuman(s.nextPayday)}`,
      v2: false,
    })),
    { id: 'off-cycle', title: 'Off-cycle run', sub: 'Bonus, correction or termination pay', v2: false },
    ...(scope === 'full'
      ? [
          {
            id: 'across',
            title: 'Across schedules',
            sub: 'One combined approval for every schedule due this week',
            v2: true,
          },
        ]
      : []),
  ]
  return (
    <ModalShell
      title="Start a payroll run"
      onClose={onClose}
      width="w-[460px]"
      footer={
        <>
          <Button type="button" variant="solid" shade="neutral" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={onClose}>Continue</Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setChoice(o.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-shadow',
              choice === o.id
                ? 'borders-shadow'
                : 'borders-base hover:bg-highlight',
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-highlight">
              {o.id === 'across' ? (
                <Stack className="size-4 text-brand" />
              ) : (
                <CalendarBlank className="size-4 text-muted" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-label-xsmall text-primary">
                {o.title}
                {o.v2 && (
                  <span className="rounded bg-brand-muted px-1 text-caption-sm font-medium text-brand">
                    v2
                  </span>
                )}
              </span>
              <span className="block truncate text-paragraph-xsmall text-muted">
                {o.sub}
              </span>
            </span>
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

export function RunsScreen({ view }: { view: RunsView }) {
  const { show } = useExplorer()
  const runs = buildRuns(view.variant, view.schedules)
  const needsAction = runs.filter((r) => r.status === 'needs-approval')

  return (
    <>
      <PageHeader
        title="Payroll"
        actions={
          <Button
            type="button"
            onClick={() => show('F2', view.picker === 'full' ? 'full' : 'v1')}
            leftIcon={<Play className="size-4" />}
          >
            Run payroll
          </Button>
        }
      />
      <PageBody className="relative flex flex-col gap-3 bg-surface-frame">
        {needsAction.length > 0 && (
          <Banner
            tone="warning"
            title={`${needsAction.length} run needs approval by ${needsAction[0].deadline}`}
          >
            Miss the deadline and payday slips to the next working day.
          </Banner>
        )}

        <div className="flex flex-col gap-2">
          {runs.map((run) => {
            const pill = STATUS_PILL[run.status]
            return (
              <div
                key={run.schedule.id}
                className="flex items-center gap-4 rounded-xl bg-base p-4 card"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-label-small text-primary">
                      {run.schedule.name}
                    </p>
                    <FreqTag>{run.schedule.frequency}</FreqTag>
                  </div>
                  <p className="mt-0.5 text-paragraph-xsmall text-muted">
                    {run.window} · payday {run.payday} · {run.people} people
                  </p>
                </div>
                <p className="shrink-0 tabular-nums text-paragraph-xsmall text-primary">
                  {money(run.amount)}
                </p>
                <span
                  className={cn(
                    'inline-flex h-6 shrink-0 items-center rounded-full px-2 text-caption-sm font-medium',
                    pill.cls,
                  )}
                >
                  {pill.label}
                </span>
                {run.status === 'needs-approval' ? (
                  <Button type="button" size="sm" data-agent="review-run" onClick={() => show('F3')}>
                    Review & approve
                  </Button>
                ) : (
                  <IconButton variant="ghost" shade="neutral" size="small" aria-label="Open run">
                    <CaretRight className="size-4 text-muted" />
                  </IconButton>
                )}
              </div>
            )
          })}
        </div>

        {view.picker && (
          <RunPickerModal
            scope={view.picker}
            onClose={() => show('F1', 'needs-action')}
          />
        )}
      </PageBody>
    </>
  )
}

/** F3: the run the list said needs approval - Prepare ran itself, the three
 *  tensions wait in Resolve, Confirm is the one irreversible step. */
export function RunDetailScreen({ view }: { view: RunDetailView }) {
  const { show } = useExplorer()
  const run = buildRuns('needs-action', view.schedules)[0]
  return (
    <>
      <PageHeader
        title={`Run payroll · ${run.schedule.name}`}
        subtitle={`${run.window} · payday ${run.payday} · approve by ${run.deadline}`}
        onBack={() => show('F1', 'needs-action')}
      />
      <PageBody className="bg-surface-frame">
        <DynamicTimeline />
      </PageBody>
    </>
  )
}
