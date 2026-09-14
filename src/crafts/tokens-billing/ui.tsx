import {
  ArrowUUpLeft,
  Building,
  Checks,
  ChartBar,
  Code,
  Compass,
  CreditCard,
  Flame,
  Gift,
  Repeat,
  Shield,
  Table,
  UserGear,
  Users,
  Wallet,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import type { AppBarNotification } from '@/components/nds/app-bar'
import { AppBar } from '@/components/nds/app-bar'
import { Sidebar } from '@/components/nds/sidebar'
import type { SidebarItemDef } from '@/components/nds/sidebar'
import { AppShell, MainLayout, PageBody, PageHeader, PageLayout } from '@/components/nds/layouts'
import { cn } from '@/lib/utils'
import { useExplorer } from '@/components/playground/explorer'

export { Banner } from '@/components/nds/feedback'

/**
 * Shared tokens-billing pieces. Every screen is Settings > <group> > <page>,
 * so the shell (AppBar + settings Sidebar + PageLayout) is the one thing
 * every screen composes identically - matching split-pay's per-craft
 * ui.tsx pattern rather than a generic cross-craft abstraction.
 */

interface SettingsSidebarGroup {
  title?: string
  items: Array<SidebarItemDef & { key: string }>
}

const SETTINGS_SIDEBAR: Array<SettingsSidebarGroup> = [
  {
    items: [
      { key: 'org', label: 'My organization', icon: Compass },
      { key: 'entities', label: 'All entities', icon: Building },
      { key: 'users', label: 'Users', icon: UserGear },
      { key: 'hr', label: 'HR', icon: Users },
    ],
  },
  {
    title: 'Billing',
    items: [
      { key: 'payment', label: 'Payment methods', icon: CreditCard },
      { key: 'credit', label: 'Credit', icon: Wallet },
    ],
  },
  {
    title: 'AI',
    items: [
      { key: 'tokens', label: 'Tokens', icon: Flame },
      { key: 'usage', label: 'Usage', icon: ChartBar },
    ],
  },
  {
    title: 'Products',
    items: [{ key: 'timesheets', label: 'Timesheets', icon: Table }],
  },
  {
    title: 'Administration',
    items: [
      { key: 'security', label: 'Security', icon: Shield },
      { key: 'compliance', label: 'Compliance', icon: Checks },
    ],
  },
  {
    title: 'Developer',
    items: [{ key: 'api', label: 'API keys', icon: Code }],
  },
  {
    items: [{ key: 'wallet', label: 'Niural Wallet ↗', icon: Wallet }],
  },
]

/** The navbar bell's 6 canned entries - the workbench keeps these constant
 *  across every balance preset (they're history, not live status), so no
 *  screen needs to compute or pass its own list. */
const DEFAULT_NOTIFICATIONS: Array<AppBarNotification> = [
  {
    id: 'n-returned',
    icon: ArrowUUpLeft,
    tone: 'error',
    title: 'Your $115.00 transfer was returned',
    description: "The reference code was missing, so we couldn't match it. Your bank should credit it back within 3 business days.",
    date: 'Jul 28',
  },
  {
    id: 'n-depleted',
    icon: Flame,
    tone: 'error',
    title: "You're out of tokens",
    description: 'Emma is paused. Buy tokens to start it again.',
    date: 'Jul 27',
  },
  {
    id: 'n-low',
    icon: Flame,
    tone: 'warning',
    title: '180 tokens left',
    description: 'About 1 payroll run. Auto-reload fires at 50.',
    date: 'Jul 26',
  },
  {
    id: 'n-ar-fail',
    icon: WarningCircle,
    tone: 'error',
    title: "Auto-reload couldn't complete",
    description: 'Credit short $0.00 of $50.00 · wallet short $41.80 of $50.00. Nothing was charged.',
    date: 'Jul 25',
  },
  {
    id: 'n-ar-ok',
    icon: Repeat,
    tone: 'accent',
    title: 'Auto-reload added 500 tokens',
    description: '$50.00 from credit, transaction AR-9F21.',
    date: 'Jul 24',
  },
  {
    id: 'n-credit',
    icon: Gift,
    tone: 'success',
    title: '$600.00 credit added',
    description: 'Granted by Niural - applies to your Niural fee and token purchases.',
    date: 'Jul 12',
  },
]

export type SettingsPageKey = 'payment' | 'credit' | 'tokens' | 'usage'

/** Sidebar key -> catalog/live screen id, shared by every screen's
 *  onNavigate so the decorative-vs-real distinction only lives in one
 *  place. Returns null for sidebar items with no page (org, security,
 *  etc.) - callers fall back to staying on the current screen. */
export function settingsNavTarget(key: string): string | null {
  switch (key) {
    case 'tokens':
      return 'A1'
    case 'usage':
      return 'A3'
    case 'credit':
      return 'B1'
    case 'payment':
      return 'B2'
    case 'wallet':
      return 'C1'
    default:
      return null
  }
}

const LABEL_BY_KEY = new Map(SETTINGS_SIDEBAR.flatMap((g) => g.items).map((i) => [i.key, i.label]))

/**
 * AppBar > Sidebar > PageHeader > content, identical on every screen. The
 * wallet page (its own top-level nav item, not under Settings) opts out of
 * the sidebar entirely via `wallet`.
 */
export function SettingsShell({
  active,
  title,
  subtitle,
  actions,
  onNavigate,
  onSettingsClick,
  notifications,
  balances,
  children,
}: {
  active: SettingsPageKey | 'wallet'
  title: string
  subtitle?: string
  actions?: React.ReactNode
  onNavigate?: (key: string) => void
  onSettingsClick?: () => void
  notifications?: Array<AppBarNotification>
  balances: { tokens: number; credit: number; wallet: number }
  children: React.ReactNode
}) {
  const { show } = useExplorer()
  const activeLabel = LABEL_BY_KEY.get(active)

  return (
    <AppShell>
      <AppBar
        activeItem="Payments"
        onSettingsClick={onSettingsClick}
        tokenBalance={{ tokens: balances.tokens, onClick: () => show('A1') }}
        notifications={notifications ?? DEFAULT_NOTIFICATIONS}
      />
      <MainLayout>
        <Sidebar
          title="Settings"
          activeItem={activeLabel}
          groups={SETTINGS_SIDEBAR.map((g) => ({ title: g.title, items: g.items }))}
          onNavigate={(label) => {
            const key = SETTINGS_SIDEBAR.flatMap((g) => g.items).find((i) => i.label === label)?.key
            if (key) onNavigate?.(key)
          }}
        />
        <PageLayout>
          <PageHeader title={title} subtitle={subtitle} actions={actions} />
          <PageBody className="mx-auto w-full max-w-[860px]">{children}</PageBody>
        </PageLayout>
      </MainLayout>
    </AppShell>
  )
}

/* ---------------- chip ---------------- */

export type ChipTone = 'success' | 'accent' | 'danger' | 'warning' | 'neutral'

const CHIP_TONE: Record<ChipTone, string> = {
  success: 'bg-background-success-highlight text-text-success-base',
  accent: 'bg-brand-muted text-brand-text',
  danger: 'bg-background-error-highlight text-text-error-base',
  warning: 'bg-background-warning-highlight text-text-warning-base',
  neutral: 'bg-background-highlight text-text-muted',
}

export function Chip({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: ChipTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center rounded-md px-2 text-caption-md', CHIP_TONE[tone], className)}>
      {children}
    </span>
  )
}

/* ---------------- stat card ---------------- */

export function StatCard({
  icon: StatIcon,
  iconTone = 'accent',
  label,
  value,
  sub,
  actions,
  className,
}: {
  icon?: React.ElementType
  iconTone?: ChipTone
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl bg-background-base p-4.5 shadow-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            {StatIcon && (
              <StatIcon
                weight="fill"
                className={cn('size-4', tokenToIconColor(iconTone))}
              />
            )}
            <p className="text-label-xs text-text-muted">{label}</p>
          </div>
          <p className="mt-1.5 text-title-h5 text-text-primary">{value}</p>
          {sub && <p className="mt-1.5 text-paragraph-xs text-text-muted">{sub}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

function tokenToIconColor(tone: ChipTone): string {
  switch (tone) {
    case 'success':
      return 'text-text-success-base'
    case 'danger':
      return 'text-text-error-base'
    case 'warning':
      return 'text-text-warning-base'
    case 'neutral':
      return 'text-text-muted'
    default:
      return 'text-brand-primary'
  }
}

export function MiniStat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: ChipTone }) {
  return (
    <div>
      <p className="text-caption-md text-text-muted">{label}</p>
      <p className={cn('mt-1 text-label-md', tone ? tokenToIconColor(tone) : 'text-text-primary')}>{value}</p>
    </div>
  )
}

/* ---------------- table shell ---------------- */

export function Th({ children, align, width }: { children: React.ReactNode; align?: 'right'; width?: string }) {
  return (
    <th
      style={width ? { width } : undefined}
      className={cn(
        'bg-background-highlight px-3.5 py-2.5 text-left text-caption-md font-medium text-text-muted first:rounded-tl-xl last:rounded-tr-xl',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, align, muted }: { children: React.ReactNode; align?: 'right'; muted?: boolean }) {
  return (
    <td
      className={cn(
        'border-t border-border-highlight px-3.5 py-3 align-top text-paragraph-xs',
        muted ? 'text-text-muted' : 'text-text-primary',
        align === 'right' && 'text-right font-mono tabular-nums',
      )}
    >
      {children}
    </td>
  )
}

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-background-base shadow-card">
      <table className="w-full border-collapse text-paragraph-xs">{children}</table>
    </div>
  )
}

export function EmptyRow({
  icon: EmptyIcon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      {EmptyIcon && <EmptyIcon className="mb-1 size-6 text-text-muted" />}
      <p className="text-label-sm text-text-primary">{title}</p>
      {description && <p className="max-w-[360px] text-paragraph-xs text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* ---------------- segmented control ---------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-background-highlight p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-caption-md transition-colors',
            value === opt.value ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------- modal shell (mirrors split-pay's ui.tsx) ---------------- */

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 'w-[440px]',
}: {
  title: string
  subtitle?: string
  onClose?: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]">
      <div className={cn('flex max-h-full min-w-0 flex-col rounded-2xl bg-background-base shadow-flyout', width)}>
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div>
            <p className="text-label-md text-text-primary">{title}</p>
            {subtitle && <p className="mt-0.5 text-paragraph-xs text-text-muted">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-2 px-5 pt-2 pb-4">{footer}</div>}
      </div>
    </div>
  )
}
