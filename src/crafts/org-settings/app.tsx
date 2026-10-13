import { useState } from 'react'
import { Wrench } from '@phosphor-icons/react'
import { SettingsWorldProvider } from './store'
import { PAGE_LABEL, SettingsShell, ToastProvider } from './ui'
import type { SettingsPage } from './ui'
import { OverviewPage } from './pages/overview'
import { DocumentsPage } from './pages/documents'
import { TaxSetupPage } from './pages/tax-setup'
import { UsersPage } from './pages/users'
import { GroupsPage } from './pages/groups'
import { SecurityPage } from './pages/security'
import { PayrollPage } from './pages/payroll'
import { TimesheetsPage } from './pages/timesheets'

function Page({ page }: { page: SettingsPage }) {
  switch (page) {
    case 'overview':
      return <OverviewPage />
    case 'documents':
      return <DocumentsPage />
    case 'tax':
      return <TaxSetupPage />
    case 'users':
      return <UsersPage />
    case 'groups':
      return <GroupsPage />
    case 'security':
      return <SecurityPage />
    case 'payroll':
      return <PayrollPage />
    case 'timesheets':
      return <TimesheetsPage />
    default:
      return <NotDesignedYet page={page} />
  }
}

/** Departments / Teams / Custom Fields / Signatory weren't in this pass's screenshots. */
function NotDesignedYet({ page }: { page: SettingsPage }) {
  return (
    <>
      <h1 className="mb-8 text-title-h5 text-text-primary">{PAGE_LABEL[page]}</h1>
      <div className="flex h-table-empty flex-col items-center justify-center rounded-xl border border-dashed border-border-base text-center">
        <Wrench className="mb-2 size-6 text-text-muted" />
        <p className="text-label-sm text-text-primary">Not in this pass</p>
        <p className="max-w-[320px] text-paragraph-xs text-text-muted">
          {PAGE_LABEL[page]} is in the nav for IA completeness - no reference screen was provided yet.
        </p>
      </div>
    </>
  )
}

/**
 * The whole Settings area as one interactive app: sidebar navigation is real,
 * every page's data lives in one in-memory world shared across pages (add a
 * user, leave, come back - it's still there).
 */
export function SettingsApp({
  initialPage = 'overview',
  onNavItemClick,
}: {
  initialPage?: SettingsPage
  onNavItemClick?: (label: string) => void
}) {
  const [page, setPage] = useState<SettingsPage>(initialPage)
  return (
    <SettingsWorldProvider>
      <ToastProvider>
        <SettingsShell active={page} onNavigate={setPage} onNavItemClick={onNavItemClick}>
          <Page key={page} page={page} />
        </SettingsShell>
      </ToastProvider>
    </SettingsWorldProvider>
  )
}

/** Master App entry - same props contract as other crafts' live apps. */
export function LiveApp({ onNavItemClick }: { onNavItemClick?: (label: string) => void }) {
  return <SettingsApp onNavItemClick={onNavItemClick} />
}
