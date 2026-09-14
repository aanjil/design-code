import {
  ArrowsClockwise,
  CaretDown,
  Download,
  Eye,
  MagnifyingGlass,
  NotePencil,
  PauseCircle,
  Play,
  PlusCircle,
  Trash,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react'
import type { GeneratedRow, ListsView, ScheduleConfig } from '../types'
import { getReport } from '@/mocks/insights-reports'
import { SEED_GENERATED, SEED_SCHEDULES } from '../catalog'
import { FULL_WEEKDAYS, fmtHuman, frequencyLabel } from '../engine'
import { ConfirmDialog, DeliveryChips, EmptyState, RecipientChip, RunStatusPill, ScheduleStatusBadge } from '../ui'
import { ScheduleConfigModal } from './schedule-modal'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'
import { cn } from '@/lib/utils'

/**
 * C group - Scheduled reports list (PRD Fn 3.1) + Generated reports list
 * (existing, now with a Delivery-method column) + the schedule detail
 * drawer, action menus, and Edit/Pause/Delete flows (Fn 3.2).
 */

function scheduleWhen(s: ScheduleConfig): string {
  if (s.status === 'paused') return 'Paused'
  if (s.status === 'completed') return s.history[0] ? `Ran ${fmtHuman(s.history[0].at.slice(0, 10))}` : '—'
  if (!s.nextRun) return '—'
  const [date, time] = s.nextRun.split('T')
  return `Next ${fmtHuman(date)}, ${time.slice(0, 5)}`
}

function scheduleCadenceLabel(s: ScheduleConfig): string {
  if (s.cadence === 'once') return 'One-time'
  const frequency = s.frequency ?? 'Monthly'
  return frequencyLabel(frequency, s.anchorDay ?? (frequency === 'Weekly' ? FULL_WEEKDAYS[1] : '1'))
}

function TabBar({ tab, onChange }: { tab: 'generated' | 'scheduled'; onChange: (t: 'generated' | 'scheduled') => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-border-highlight">
      {(['generated', 'scheduled'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            'px-3 pb-2 text-label-xs transition-colors',
            tab === t ? 'border-b-2 border-brand-primary text-brand-text' : 'text-text-muted hover:text-text-primary',
          )}
        >
          {t === 'generated' ? 'Generated reports' : 'Scheduled reports'}
        </button>
      ))}
    </div>
  )
}

type ScheduleAction = 'pause' | 'resume' | 'edit' | 'delete' | 'download' | 'view'

function ActionMenu({
  status,
  onClose,
  onAction,
}: {
  status: ScheduleConfig['status']
  onClose: () => void
  onAction: (action: ScheduleAction) => void
}) {
  const items: Array<{ icon: typeof PauseCircle; label: string; action: ScheduleAction }> =
    status === 'active'
      ? [
          { icon: PauseCircle, label: 'Pause', action: 'pause' },
          { icon: Download, label: 'Download', action: 'download' },
          { icon: NotePencil, label: 'Edit', action: 'edit' },
          { icon: Trash, label: 'Delete', action: 'delete' },
        ]
      : status === 'paused'
        ? [
            { icon: Play, label: 'Resume', action: 'resume' },
            { icon: Download, label: 'Download', action: 'download' },
            { icon: NotePencil, label: 'Edit', action: 'edit' },
            { icon: Trash, label: 'Delete', action: 'delete' },
          ]
        : [
            { icon: Eye, label: 'View', action: 'view' },
            { icon: Download, label: 'Download', action: 'download' },
            { icon: Trash, label: 'Delete', action: 'delete' },
          ]
  return (
    <div className="absolute inset-0 z-30" onClick={onClose}>
      <div className="absolute top-10 right-4 w-44 rounded-xl bg-background-base p-1 shadow-flyout">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAction(it.action)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-label-xs text-text-primary hover:bg-background-highlight"
          >
            <it.icon className="size-4 text-text-muted" />
            {it.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ScheduleDrawer({
  schedule,
  onClose,
  onAction,
}: {
  schedule: ScheduleConfig
  onClose: () => void
  onAction: (action: ScheduleAction) => void
}) {
  const report = getReport(schedule.reportId)
  return (
    <div className="absolute inset-0 z-40 flex justify-end bg-overlay-background-base">
      <div className="flex h-full w-[380px] flex-col gap-4 overflow-y-auto bg-background-base p-5 shadow-flyout">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-label-md text-text-primary">{report.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-caption-md text-text-muted">
              {report.category} · <ScheduleStatusBadge status={schedule.status} />
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <XCircle className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onAction('edit')}>
            <NotePencil className="size-3.5" />
            <span className="px-1">Edit</span>
          </Button>
          {schedule.status !== 'completed' && (
            <Button variant="secondary" size="sm" onClick={() => onAction(schedule.status === 'paused' ? 'resume' : 'pause')}>
              {schedule.status === 'paused' ? <Play className="size-3.5" /> : <PauseCircle className="size-3.5" />}
              <span className="px-1">{schedule.status === 'paused' ? 'Resume' : 'Pause'}</span>
            </Button>
          )}
          <Button variant="ghost-destructive" size="sm" onClick={() => onAction('delete')}>
            <Trash className="size-3.5" />
            <span className="px-1">Delete</span>
          </Button>
        </div>

        <section className="flex flex-col gap-2">
          <p className="text-caption-md text-text-muted">Configuration</p>
          <div className="flex items-baseline justify-between text-paragraph-xs">
            <span className="text-text-muted">Reporting period</span>
            <span className="text-text-primary">{scheduleCadenceLabel(schedule)}</span>
          </div>
          <div className="flex items-baseline justify-between text-paragraph-xs">
            <span className="text-text-muted">Run time</span>
            <span className="text-text-primary">{schedule.runTime} {schedule.timezone}</span>
          </div>
          <div className="flex items-baseline justify-between text-paragraph-xs">
            <span className="text-text-muted">Delivery</span>
            <span className="text-text-primary">
              {[schedule.delivery.platform && 'Platform', schedule.delivery.email && 'Email', schedule.delivery.link && 'External link']
                .filter(Boolean)
                .join(' + ')}
            </span>
          </div>
          {schedule.emailRecipients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {schedule.emailRecipients.map((r) => (
                <RecipientChip key={r.email} recipient={r} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-caption-md text-text-muted">Run history · {schedule.history.length} runs</p>
          <div className="flex flex-col gap-1.5">
            {schedule.history.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border-highlight px-2.5 py-2">
                <div className="text-paragraph-xs">
                  <p className="text-text-primary">{fmtHuman(r.at.slice(0, 10))}, {r.at.slice(11, 16)}</p>
                  <p className="text-caption-md text-text-muted">
                    {r.platform && 'Platform'}
                    {r.emailCount > 0 && ` - ${r.emailCount} Email`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RunStatusPill status={r.status} emailFailed={r.emailFailed} />
                  <Download className="size-4 text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ScheduledTable({
  view,
  schedules,
  onAction,
}: {
  view: ListsView
  schedules: Array<ScheduleConfig>
  onAction: (id: string, action: ScheduleAction) => void
}) {
  const { show } = useExplorer()
  if (view.loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-background-highlight" />
        ))}
      </div>
    )
  }
  if (view.error) {
    return (
      <EmptyState
        icon={WarningCircle}
        title="Couldn't load schedules"
        body="Something went wrong loading your scheduled reports."
        action={<Button variant="secondary" size="sm">Retry</Button>}
      />
    )
  }
  if (schedules.length === 0) {
    return (
      <EmptyState
        icon={PlusCircle}
        title="No scheduled reports yet"
        body="Open a report and choose Schedule to automate its next run."
        action={
          <Button size="sm" onClick={() => show('A1', 'owner')}>
            Browse reports
          </Button>
        }
      />
    )
  }
  return (
    <table className="w-full text-left text-paragraph-xs">
      <thead className="text-text-muted">
        <tr className="border-b border-border-highlight">
          {['Report type', 'Schedule', 'When', 'Delivery', 'Status', 'Actions'].map((h) => (
            <th key={h} className="px-3 py-2 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {schedules.map((s) => {
          const report = getReport(s.reportId)
          return (
            <tr key={s.id} className="relative border-b border-border-highlight last:border-0 hover:bg-background-highlight">
              <td className="px-3 py-2.5">
                <p className="text-label-xs text-text-primary">{report.name}</p>
                <p className="text-caption-md text-text-muted">
                  {report.category} · {s.history.length ? `Last run ${fmtHuman(s.history[0].at.slice(0, 10))}, ${s.history.length} runs` : 'No runs yet'}
                </p>
              </td>
              <td className="px-3 py-2.5">{scheduleCadenceLabel(s)}</td>
              <td className="px-3 py-2.5">{scheduleWhen(s)}</td>
              <td className="px-3 py-2.5">
                <DeliveryChips
                  platform={s.delivery.platform}
                  emailCount={s.emailRecipients.length}
                  linkCount={s.linkRecipients.length}
                  emailFailed={s.history[0]?.emailFailed}
                />
              </td>
              <td className="px-3 py-2.5"><ScheduleStatusBadge status={s.status} /></td>
              <td className="relative px-3 py-2.5">
                <button
                  type="button"
                  aria-label="Actions"
                  onClick={(e) => {
                    e.stopPropagation()
                    show('C4', s.status === 'active' ? 'active' : s.status === 'paused' ? 'paused' : 'completed', {
                      scheduleId: s.id,
                    })
                  }}
                  className="flex size-7 items-center justify-center rounded-lg hover:bg-background-base"
                >
                  <CaretDown className="size-4 text-text-muted" />
                </button>
                {view.menuFor === s.id && (
                  <ActionMenu
                    status={s.status}
                    onClose={() => show('C1', 'default')}
                    onAction={(action) => onAction(s.id, action)}
                  />
                )}
              </td>
              <td
                className="absolute inset-0 -z-10"
                onClick={() => show('C3', s.status === 'paused' ? 'paused' : 'active', { scheduleId: s.id })}
              />
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function GeneratedTable({ rows }: { rows: Array<GeneratedRow> }) {
  if (rows.length === 0) {
    return <EmptyState icon={PlusCircle} title="No reports generated yet" body="Generated reports - manual or scheduled - will show up here." />
  }
  const buckets: Array<GeneratedRow['bucket']> = ['Today', 'This week', 'This month', 'Last month']
  return (
    <div className="flex flex-col gap-4">
      {buckets
        .filter((b) => rows.some((r) => r.bucket === b))
        .map((bucket) => (
          <div key={bucket}>
            <p className="mb-1.5 px-1 text-caption-md text-text-muted">{bucket}</p>
            <div className="flex flex-col gap-1.5">
              {rows
                .filter((r) => r.bucket === bucket)
                .map((r) => {
                  const report = getReport(r.reportId)
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border border-border-highlight px-3 py-2.5',
                        (r.status === 'failed' || r.delivery.emailFailed > 0) && 'shadow-[inset_3px_0_0_var(--border-error-base)]',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-label-xs text-text-primary">
                          {report.name}
                          {r.scheduleId && (
                            <span className="rounded bg-brand-muted px-1 text-caption-md text-brand-text">Scheduled</span>
                          )}
                        </p>
                        <p className="text-caption-md text-text-muted">
                          {report.category} · {fmtHuman(r.generatedAt.slice(0, 10))}
                          {r.delivery.emailFailed > 0 && <span className="text-text-warning-base"> · {r.delivery.emailFailed} email failed</span>}
                        </p>
                      </div>
                      <DeliveryChips platform={r.delivery.platform} emailCount={r.delivery.emailCount} emailFailed={r.delivery.emailFailed} />
                      <RunStatusPill status={r.status} />
                      {r.status === 'failed' ? (
                        <Button variant="ghost" size="icon-sm" aria-label="Retry">
                          <ArrowsClockwise className="size-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon-sm" aria-label="Download" disabled={r.status === 'in-progress'}>
                          <Download className="size-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
    </div>
  )
}

export function ListsScreen({
  view,
  onDraftChange,
}: {
  view: ListsView
  /** Live App only - omit for a frozen catalog edit modal. */
  onDraftChange?: (patch: Partial<ScheduleConfig>) => void
}) {
  const { show } = useExplorer()
  const schedules = view.schedules ?? SEED_SCHEDULES
  const generated = view.generated ?? SEED_GENERATED
  const drawerSchedule = view.drawerFor ? schedules.find((s) => s.id === view.drawerFor) : undefined
  const modalTarget = view.modalTargetId ? schedules.find((s) => s.id === view.modalTargetId) : undefined
  const editDraft = view.draft ?? modalTarget

  function onAction(id: string, action: ScheduleAction) {
    switch (action) {
      case 'pause':
        show('C5', 'default', { scheduleId: id })
        return
      case 'resume':
        show('C1', 'default', { resumeId: id })
        return
      case 'edit':
        show('B6', 'default', { scheduleId: id })
        return
      case 'delete':
        show('C6', 'default', { scheduleId: id })
        return
      case 'download':
      case 'view':
        return
    }
  }

  return (
    <>
      <PageHeader title={view.tab === 'scheduled' ? 'Scheduled reports' : 'Generated reports'} onBack={() => show('A1', 'owner')} />
      <PageBody className="relative flex flex-col gap-3">
        <TabBar tab={view.tab} onChange={(t) => show(t === 'scheduled' ? 'C1' : 'C2', 'default')} />

        <div className="flex items-center justify-between gap-3">
          <div className="flex h-8 w-72 items-center gap-2 rounded-lg border border-input px-2.5 text-paragraph-xs text-text-muted">
            <MagnifyingGlass className="size-4" />
            {view.tab === 'scheduled' ? 'Search schedules' : 'Search'}
          </div>
          <div className="flex items-center gap-2">
            {(view.tab === 'scheduled' ? ['Status', 'When', 'Category'] : ['Status', 'Generated at', 'Category']).map((f) => (
              <span key={f} className="flex h-8 items-center gap-1 rounded-lg border border-input px-2.5 text-label-xs text-text-primary">
                {f}
                <CaretDown className="size-3.5 text-text-muted" />
              </span>
            ))}
          </div>
        </div>

        {view.tab === 'scheduled' ? (
          <ScheduledTable view={view} schedules={schedules} onAction={onAction} />
        ) : (
          <GeneratedTable rows={generated} />
        )}

        {view.tab === 'scheduled' && !view.loading && !view.error && schedules.length > 0 && (
          <div className="flex items-center justify-between text-caption-md text-text-muted">
            <span>{schedules.length} schedules</span>
          </div>
        )}

        {drawerSchedule && (
          <ScheduleDrawer
            schedule={drawerSchedule}
            onClose={() => show('C1', 'default')}
            onAction={(action) => onAction(drawerSchedule.id, action)}
          />
        )}

        {view.modal === 'edit' && editDraft && (
          <ScheduleConfigModal
            draft={editDraft}
            editing
            initialStep={view.modalStep}
            nearRunWarning={view.modalTargetId === 'sch-2'}
            onClose={() => show('C1', 'default')}
            onSave={() => show('C1', 'default', { scheduleId: view.modalTargetId, draft: editDraft, commitEdit: true })}
            onChange={onDraftChange}
          />
        )}

        {view.modal === 'pause-confirm' && modalTarget && (
          <ConfirmDialog
            icon={PauseCircle}
            title="Pause this schedule?"
            body="Scheduled runs will stop until you resume. Past reports are kept."
            confirmLabel="Pause"
            onCancel={() => show('C1', 'default')}
            onConfirm={() => show('C1', 'default', { scheduleId: view.modalTargetId, commitPause: true })}
          />
        )}

        {view.modal === 'delete-confirm' && modalTarget && (
          <ConfirmDialog
            icon={Trash}
            tone="danger"
            title="Delete this schedule?"
            body="Future runs will stop. Past reports are kept. A run already in progress will finish."
            confirmLabel="Delete"
            onCancel={() => show('C1', 'default')}
            onConfirm={() => show('C1', 'default', { scheduleId: view.modalTargetId, commitDelete: true })}
          />
        )}
      </PageBody>
    </>
  )
}
