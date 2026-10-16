import type { ComponentType } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MASTER_IA } from '@/crafts/master-ia'
import { MasterGoToMenu } from '@/components/playground/master-app-dock'
import { MasterBezelLayout } from '@/crafts/bezel/master-bezel'
import { BezelDockTab } from '@/crafts/bezel/dock-tab'
import { Sparkle } from '@phosphor-icons/react'
import { AppBar, AppBarLinksContext } from '@/components/nds/app-bar'
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
import { LiveApp as OrgSettingsLiveApp } from '@/crafts/org-settings/app'
import {
  LiveApp as PaymentFlowLiveApp,
  LiveMockDock,
} from '@/crafts/payment-flow/live-app'

export const Route = createFileRoute('/app/$section')({
  component: MasterAppSection,
  staticData: { layout: 'app' },
  /** `page` = sidebar leaf inside the section (e.g. Payments → Invoices),
   *  picks which live craft mounts when a section has several. */
  validateSearch: (search: Record<string, unknown>): { page?: string } => ({
    page: typeof search.page === 'string' ? search.page : undefined,
  }),
  head: ({ params }) => {
    const section = MASTER_IA.find((s) => s.key === params.section)
    return { meta: [{ title: `${section?.label ?? 'App'} - NDS Playground` }] }
  },
})

/**
 * Every craft below already composes its own full AppShell/AppBar/Sidebar
 * (that's the standing convention for every screen in this repo - see
 * docs/DESIGN.md), so it mounts directly, unwrapped. Sections with no live
 * craft fall back to a bare shell built from the Master IA below instead.
 * Every AppBar - embedded or fallback - reaches the Master App through
 * AppBarLinksContext (settings gear here; Ask Emma = summon the Bezel, from
 * MasterBezelLayout), so no craft needs the handlers threaded through.
 */
interface LiveComponentProps {
  onNavItemClick?: (label: string) => void
  onSidebarNavigate?: (label: string) => void
  onWalletClick?: () => void
  sectionKey: string
}

/** Payment flow serves two sections: Payments → Invoices and the Wallet. */
function PaymentFlowSection({ sectionKey, ...rest }: LiveComponentProps) {
  return <PaymentFlowLiveApp screen={sectionKey === 'wallet' ? 'wallet' : 'invoices'} {...rest} />
}

const LIVE_COMPONENTS: Record<string, ComponentType<LiveComponentProps>> = {
  'employee-filters': EmployeesPage,
  'editable-invoice': CreateInvoicePage,
  'multi-payroll': MultiPayrollLiveApp,
  'schedule-report': ScheduleReportLiveApp,
  'emma-mobile': EmmaMobileLiveApp,
  'tokens-billing': TokensBillingLiveApp,
  'org-settings': OrgSettingsLiveApp,
  'payment-flow': PaymentFlowSection,
}

function MasterAppSection() {
  const { section: sectionKey } = Route.useParams()
  const { page } = Route.useSearch()
  const navigate = useNavigate()
  const section = MASTER_IA.find((s) => s.key === sectionKey) ?? MASTER_IA[0]
  const live = section.crafts.filter((c) => c.status === 'live')
  const liveRef = live.find((c) => page && c.subNavLabel === page) ?? live[0]
  const LiveComponent = liveRef ? LIVE_COMPONENTS[liveRef.slug] : undefined

  // AppBar pill labels ('People', 'Payments', ...) match Master IA section
  // labels 1:1 for the real employer nav - jump there on click.
  function handleNavItemClick(label: string) {
    const target = MASTER_IA.find((s) => s.label === label)
    if (target) navigate({ to: '/app/$section', params: { section: target.key } })
  }

  // Sidebar leaves owned by a different live craft in the same section
  // (Payments: Payroll Schedule ↔ Invoices) - route via ?page=.
  function handleSidebarNavigate(label: string) {
    const owner = section.crafts.find((c) => c.status === 'live' && c.subNavLabel === label)
    if (owner) navigate({ to: '/app/$section', params: { section: section.key }, search: { page: label } })
  }

  const goWallet = () => navigate({ to: '/app/$section', params: { section: 'wallet' } })
  // The gear lives in every craft's own AppBar - wire them all at once.
  const appBarLinks = {
    onSettingsClick: () => navigate({ to: '/app/$section', params: { section: 'settings' } }),
    settingsActive: section.key === 'settings',
  }

  return (
    <AppBarLinksContext.Provider value={appBarLinks}>
      {/* One Emma object for the whole app; the copilot is a column of the
          screen beside it (mobile renders its own device frames). */}
      <MasterBezelLayout sectionKey={section.key} enabled={section.key !== 'emma-mobile'}>
      {LiveComponent ? (
        <LiveComponent
          key={`${section.key}:${liveRef?.slug}`}
          sectionKey={section.key}
          onNavItemClick={handleNavItemClick}
          onSidebarNavigate={handleSidebarNavigate}
          onWalletClick={goWallet}
        />
      ) : (
        <AppShell>
          <AppBar
            activeItem={section.label}
            onNavItemClick={handleNavItemClick}
            onWalletClick={goWallet}
          />
          <MainLayout>
            {section.sidebarGroups && (
              <Sidebar title={section.label} groups={section.sidebarGroups} />
            )}
            <PageLayout>
              <PageHeader title={section.label} />
              <PageBody>
                <p className="text-paragraph-small text-muted">
                  Nothing live in this section yet - see Information
                  Architecture (<code>/docs/ia</code>) for what's prototyped
                  elsewhere.
                </p>
              </PageBody>
            </PageLayout>
          </MainLayout>
        </AppShell>
      )}
      </MasterBezelLayout>
      <LiveMockDock
        leading={<MasterGoToMenu section={section} />}
        extraTabs={section.key === 'emma-mobile' ? [] : [{ id: 'bezel', label: 'Bezel', icon: Sparkle, render: () => <BezelDockTab /> }]}
      />
    </AppBarLinksContext.Provider>
  )
}
