import { AppBar } from '@/components/nds/app-bar'
import { AppShell, MainLayout, PageBody, PageHeader, PageLayout } from '@/components/nds/layouts'
import { cn } from '@/lib/utils'
import { EmmaSidebar } from './sidebar'
import type { HistoryItem } from './mocks'

/**
 * Shared shell for every Ask Emma screen (grain-flows_2.html's `.app`
 * frame: topbar + history sidebar + canvas) - real AppBar/EmmaSidebar/
 * PageLayout, not a bespoke recreation. `chip` carries the direction
 * badge (grain-flows_2.html's `.dirchip`: LAUNCHER / RUN · TOP-DOWN ·
 * SYSTEM OWNS SEQUENCE / ASK · BOTTOM-UP · YOU OWN SEQUENCE).
 */
export function EmmaChrome({
  activeId,
  title,
  subtitle,
  chip,
  wide,
  onSelectHistory,
  children,
}: {
  activeId?: string
  title: string
  subtitle?: string
  chip: React.ReactNode
  /** Wider canvas for content that outgrows the standard 820px reading column. */
  wide?: boolean
  onSelectHistory?: (item: HistoryItem) => void
  children: React.ReactNode
}) {
  return (
    <AppShell>
      <AppBar activeItem="People" aiSelected tokenBalance={{ tokens: 12400 }} />
      <MainLayout>
        <EmmaSidebar activeId={activeId} onSelect={onSelectHistory} />
        <PageLayout>
          <PageHeader title={title} subtitle={subtitle} actions={<DirChip>{chip}</DirChip>} />
          <PageBody className={cn('mx-auto w-full', wide ? 'max-w-[1000px]' : 'max-w-[820px]')}>
            {children}
          </PageBody>
        </PageLayout>
      </MainLayout>
    </AppShell>
  )
}

function DirChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-sm border border-border-base px-1.5 py-1 font-mono text-[9.5px] tracking-wide text-text-muted">
      {children}
    </span>
  )
}
