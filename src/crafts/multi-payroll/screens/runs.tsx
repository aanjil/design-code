import { useState } from 'react'
import { CalendarBlank, CaretRight, Play, Stack } from '@phosphor-icons/react'
import type { RunsView } from '../types'
import { Banner, FreqTag, ModalShell } from '../ui'
import { WORLD_TODAY, addDaysISO, fmtHuman, money, periodOf } from '../engine'
import { SCHEDULES } from '@/mocks/payroll'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { useExplorer } from '@/components/playground/explorer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  schedules: Array<(typeof SCHEDULES)[number]> = SCHEDULES,
): Array<RunRow> {
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
    cls: 'bg-background-warning-muted text-text-primary',
  },
  scheduled: {
    label: 'Scheduled',
    cls: 'bg-background-highlight text-text-muted',
  },
  processing: {
    label: 'Processing',
    cls: 'bg-background-info-muted text-text-primary',
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
          <Button variant="secondary" onClick={onClose}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button onClick={onClose}>
            <span className="px-1">Continue</span>
          </Button>
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
                ? 'shadow-border-brand'
                : 'shadow-button-gray hover:bg-background-highlight',
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-highlight">
              {o.id === 'across' ? (
                <Stack className="size-4 text-brand-text" />
              ) : (
                <CalendarBlank className="size-4 text-text-muted" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-label-xs text-text-primary">
                {o.title}
                {o.v2 && (
                  <span className="rounded bg-brand-muted px-1 text-caption-md text-brand-text">
                    v2
                  </span>
                )}
              </span>
              <span className="block truncate text-paragraph-xs text-text-muted">
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
          <Button onClick={() => show('F2', view.picker === 'full' ? 'full' : 'v1')}>
            <Play />
            <span className="px-1">Run payroll</span>
          </Button>
        }
      />
      <PageBody className="relative flex flex-col gap-3 bg-surface-1">
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
                className="flex items-center gap-4 rounded-xl bg-background-base p-4 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-label-sm text-text-primary">
                      {run.schedule.name}
                    </p>
                    <FreqTag>{run.schedule.frequency}</FreqTag>
                  </div>
                  <p className="mt-0.5 text-paragraph-xs text-text-muted">
                    {run.window} · payday {run.payday} · {run.people} people
                  </p>
                </div>
                <p className="shrink-0 font-mono text-mono-xs text-text-primary">
                  {money(run.amount)}
                </p>
                <span
                  className={cn(
                    'inline-flex h-6 shrink-0 items-center rounded-full px-2 text-caption-md',
                    pill.cls,
                  )}
                >
                  {pill.label}
                </span>
                {run.status === 'needs-approval' ? (
                  <Button size="sm">
                    <span className="px-1">Review & approve</span>
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon-sm" aria-label="Open run">
                    <CaretRight className="size-4 text-text-muted" />
                  </Button>
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
