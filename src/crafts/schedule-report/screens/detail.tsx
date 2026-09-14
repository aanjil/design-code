import { CalendarBlank, Play } from '@phosphor-icons/react'
import type { DetailView, ScheduleConfig } from '../types'
import { getReport } from '@/mocks/insights-reports'
import { fmtHuman } from '../engine'
import { ConfirmDialog, SuccessDialog } from '../ui'
import { ScheduleConfigModal } from './schedule-modal'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { Button } from '@/components/ui/button'
import { useExplorer } from '@/components/playground/explorer'

/**
 * A3 - report detail / parameter screen (PRD Fn 1.1/1.2). Same screen the
 * existing on-demand flow uses, with a new Schedule action alongside
 * Generate report - the entry point into the whole feature.
 */

const MOCK_ROWS = [
  { label: 'Payroll', value: 'US Payroll' },
  { label: 'Pay date', value: 'Jun 30, 2026' },
  { label: 'Month', value: 'June' },
  { label: 'Quarter', value: 'Q2 2026' },
  { label: 'Year', value: '2026' },
  { label: 'Pay frequency', value: 'Monthly' },
  { label: 'Payroll status', value: 'Approved' },
]

export function DetailScreen({
  view,
  onDraftChange,
}: {
  view: DetailView
  /** Live App only - omit for a frozen catalog config modal. */
  onDraftChange?: (patch: Partial<ScheduleConfig>) => void
}) {
  const { show } = useExplorer()
  const report = getReport(view.reportId)
  const dateRange = view.dateRange ?? { start: '2026-04-01', end: '2026-06-30' }

  return (
    <>
      <PageHeader
        title={report.name}
        onBack={() => show('A1', 'owner')}
        actions={
          <>
            <Button variant="secondary">
              <span className="px-1">Adjust filter</span>
            </Button>
            <Button
              variant="secondary"
              className="relative"
              disabled={!report.schedulable}
              title={!report.schedulable ? "Scheduling isn't available for this report type" : undefined}
              onClick={() => show('B1', 'default', { reportId: report.id })}
            >
              <CalendarBlank />
              <span className="px-1">Schedule</span>
              {report.schedulable && (
                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-brand-primary px-1.5 py-0.5 text-[9px] font-medium text-text-on-color">
                  NEW
                </span>
              )}
            </Button>
            <Button>
              <Play weight="fill" />
              <span className="px-1">Generate report</span>
            </Button>
          </>
        }
      />
      <PageBody className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-xl border border-border-highlight p-3">
          <div className="flex items-center gap-6 text-paragraph-xs">
            {report.dateShape === 'range' && (
              <span>
                <span className="text-text-muted">Date range: </span>
                <span className="text-text-primary">{fmtHuman(dateRange.start)} - {fmtHuman(dateRange.end)}</span>
              </span>
            )}
            {report.dateShape === 'single' && (
              <span>
                <span className="text-text-muted">As of: </span>
                <span className="text-text-primary">Jul 15, 2026 (run date)</span>
              </span>
            )}
            {report.dateShape === 'none' && (
              <span className="text-text-muted">Snapshot - no date param for this report.</span>
            )}
            {report.dateShape !== 'none' && (
              <span>
                <span className="text-text-muted">Status: </span>
                <span className="text-text-primary">All</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-caption-md text-text-muted">
          The same parameters power three actions - Generate now, Regenerate after adjusting, or Schedule for later.
        </p>

        <div className="overflow-hidden rounded-xl border border-border-highlight">
          <table className="w-full text-left text-paragraph-xs">
            <thead className="bg-background-highlight text-text-muted">
              <tr>
                {MOCK_ROWS.map((r) => (
                  <th key={r.label} className="px-3 py-2 font-medium">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-border-highlight text-text-primary">
                  {MOCK_ROWS.map((r) => (
                    <td key={r.label} className="px-3 py-2">{r.value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-border-highlight px-3 py-2 text-caption-md text-text-muted">
            28 records
          </div>
        </div>

        {view.modal === 'create' && view.draft && (
          <ScheduleConfigModal
            draft={view.draft}
            initialStep={view.modalStep}
            onClose={() => show('A3', 'view')}
            onChange={onDraftChange}
            onSave={() => {
              const external = [...view.draft!.emailRecipients, ...view.draft!.linkRecipients].some((r) => r.external)
              if (external) show('B5', 'default', { draft: view.draft })
              else show('B1', 'default', { draft: view.draft, commitCreate: true })
            }}
          />
        )}

        {view.modal === 'pii-warning' && view.draft && (
          <ConfirmDialog
            icon={CalendarBlank}
            title="Send to external recipients?"
            body="This report may contain PII. Recipients outside your organization will get a secure, expiring link - not a raw attachment."
            confirmLabel="Confirm & save"
            onCancel={() => show('B4', 'external')}
            onConfirm={() => show('B1', 'default', { draft: view.draft, commitCreate: true })}
          />
        )}

        {view.modal === 'success' && view.draft && (
          <SuccessDialog
            title="Schedule created"
            body={`${getReport(view.draft.reportId).name} will run ${view.draft.cadence === 'once' ? 'once' : 'automatically'} - you can pause, edit, or delete it any time.`}
            primaryLabel="View scheduled reports"
            onPrimary={() => show('C1', 'default')}
            secondaryLabel="Back to report"
            onSecondary={() => show('A3', 'view')}
          />
        )}
      </PageBody>
    </>
  )
}
