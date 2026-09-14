import type { ComponentType } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MASTER_IA } from '@/crafts/master-ia'
import { MasterAppDock } from '@/components/playground/master-app-dock'
import { AppBar } from '@/components/nds/app-bar'
import { Sidebar } from '@/components/nds/sidebar'
import {
  AppShell,
  MainLayout,
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/nds/layouts'
import { EmployeesPage } from '@/crafts/employee-filters/employees-page'
import { CreateInvoicePage } from '@/crafts/editable-invoice/create-invoice-page'
import { LiveApp as MultiPayrollLiveApp } from '@/crafts/multi-payroll/live-app'
import { LiveApp as ScheduleReportLiveApp } from '@/crafts/schedule-report/live-app'
import { LiveApp as EmmaMobileLiveApp } from '@/crafts/emma-mobile/live-app'
import { LiveApp as TokensBillingLiveApp } from '@/crafts/tokens-billing/live-app'

export const Route = createFileRoute('/app/$section')({
  component: MasterAppSection,
  staticData: { layout: 'app' },
  head: ({ params }) => {
    const section = MASTER_IA.find((s) => s.key === params.section)
    return { meta: [{ title: `${section?.label ?? 'App'} - NDS Playground` }] }
  },
})

/**
 * Every craft below already composes its own full AppShell/AppBar/Sidebar
 * (that's the standing convention for every screen in this repo - see
 * docs/DESIGN.md), so it mounts directly, unwrapped. Sections with no live
 * craft fall back to a bare shell built from the Master IA below instead -
 * that fallback's AppBar is the one wired to Ask Emma (onAiClick below).
 * The LiveComponents' own embedded AppBars aren't wired yet - doing that
 * for all six would mean threading onAiClick through each craft's own
 * AppBar usage, a separate, broader change than this pass covers.
 */
interface LiveComponentProps {
  onNavItemClick?: (label: string) => void
}

const LIVE_COMPONENTS: Record<string, ComponentType<LiveComponentProps>> = {
  'employee-filters': EmployeesPage,
  'editable-invoice': CreateInvoicePage,
  'multi-payroll': MultiPayrollLiveApp,
  'schedule-report': ScheduleReportLiveApp,
  'emma-mobile': EmmaMobileLiveApp,
  'tokens-billing': TokensBillingLiveApp,
}

function MasterAppSection() {
  const { section: sectionKey } = Route.useParams()
  const navigate = useNavigate()
  const section = MASTER_IA.find((s) => s.key === sectionKey) ?? MASTER_IA[0]
  const liveRef = section.crafts.find((c) => c.status === 'live')
  const LiveComponent = liveRef ? LIVE_COMPONENTS[liveRef.slug] : undefined

  // AppBar pill labels ('People', 'Payments', ...) match Master IA section
  // labels 1:1 for the real employer nav - jump there on click.
  function handleNavItemClick(label: string) {
    const target = MASTER_IA.find((s) => s.label === label)
    if (target) navigate({ to: '/app/$section', params: { section: target.key } })
  }

  return (
    <>
      {LiveComponent ? (
        <LiveComponent onNavItemClick={handleNavItemClick} />
      ) : (
        <AppShell>
          <AppBar
            activeItem={section.label}
            onNavItemClick={handleNavItemClick}
            onAiClick={() => navigate({ to: '/crafts/ask-emma' })}
          />
          <MainLayout>
            {section.sidebarGroups && (
              <Sidebar title={section.label} groups={section.sidebarGroups} />
            )}
            <PageLayout>
              <PageHeader title={section.label} />
              <PageBody>
                <p className="text-paragraph-sm text-text-muted">
                  Nothing live in this section yet - see Information
                  Architecture (<code>/docs/ia</code>) for what's prototyped
                  elsewhere.
                </p>
              </PageBody>
            </PageLayout>
          </MainLayout>
        </AppShell>
      )}
      <MasterAppDock section={section} />
    </>
  )
}
