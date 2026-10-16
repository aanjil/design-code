import {
  CalendarBlank,
  CalendarX,
  Coins,
  CreditCard,
  Files,
  Lock,
  MagnifyingGlass,
  Receipt,
  Users,
} from '@phosphor-icons/react'
import type { LandingView } from '../types'
import { REPORTS, type ReportCategory } from '@/mocks/insights-reports'
import { EmptyState } from '../ui'
import { PageHeader, PageBody } from '@/components/nds/layouts'
import { Button } from '@niural/components'
import { useExplorer } from '@/components/playground/explorer'
import { cn } from '@/lib/utils'

/**
 * A1/A2 - report gallery + role-gated no-access state (PRD Fn 1.1).
 */

const CATEGORY_ICON: Record<ReportCategory, typeof Coins> = {
  Payroll: Coins,
  Payments: CreditCard,
  People: Users,
  'Niural Pay': Receipt,
}

const CATEGORY_TINT: Record<ReportCategory, string> = {
  Payroll: 'bg-warning-muted text-warning',
  Payments: 'bg-info-muted text-primary',
  People: 'bg-success-muted text-success',
  'Niural Pay': 'bg-brand-muted text-brand',
}

const CATEGORIES: Array<ReportCategory | 'All'> = ['All', 'Payroll', 'Payments', 'People', 'Niural Pay']

export function LandingScreen({ view }: { view: LandingView }) {
  const { show } = useExplorer()

  if (view.role === 'AP Approver' || view.role === 'AR Approver') {
    return (
      <PageBody>
        <EmptyState
          icon={Lock}
          title="Niural Insights isn't available for your role"
          body={`${view.role}s can't view or schedule reports in Insights. You may still receive scheduled reports by email if an Org Owner or Admin adds you as a recipient.`}
        />
      </PageBody>
    )
  }

  return (
    <>
      <PageHeader
        title="Niural insights"
        actions={
          <>
            <Button type="button" variant="solid" shade="neutral" leftIcon={<CalendarBlank className="size-4" />} onClick={() => show('C1', 'default')}>
              Scheduled reports
            </Button>
            <Button type="button" variant="solid" shade="neutral" leftIcon={<Files className="size-4" />} onClick={() => show('C2', 'default')}>
              View generated reports
            </Button>
          </>
        }
      />
      <PageBody className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-full bg-highlight p-1">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className={cn(
                  'flex h-7 items-center rounded-full px-3 text-label-xsmall',
                  c === (view.category ?? 'All')
                    ? 'bg-base text-primary borders-base'
                    : 'text-muted',
                )}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="flex h-8 w-64 items-center gap-2 rounded-lg border border-input px-2.5 text-paragraph-xsmall text-muted">
            <MagnifyingGlass className="size-4" />
            Search in insights...
            <span className="ml-auto rounded border border-base px-1 text-caption-sm font-medium">/</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {REPORTS.map((r) => {
            const Icon = CATEGORY_ICON[r.category]
            return (
              <button
                key={r.id}
                type="button"
                disabled={!r.schedulable}
                title={!r.schedulable ? "Scheduling isn't available for this report type" : undefined}
                onClick={() => show('A3', 'view')}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border border-base p-4 text-left transition-colors',
                  r.schedulable ? 'hover:bg-highlight' : 'cursor-default opacity-70',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('flex size-8 items-center justify-center rounded-lg', CATEGORY_TINT[r.category])}>
                    <Icon weight="fill" className="size-4" />
                  </span>
                  <span className="rounded-full bg-highlight px-2 py-0.5 text-caption-sm font-medium text-muted">
                    {r.category}
                  </span>
                </div>
                <p className="text-label-small text-primary">{r.name}</p>
                <p className="text-paragraph-xsmall text-muted">{r.description}</p>
                {!r.schedulable && (
                  <p className="flex items-center gap-1 text-caption-sm font-medium text-muted">
                    <CalendarX className="size-3.5" />
                    Scheduling unavailable
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </PageBody>
    </>
  )
}
