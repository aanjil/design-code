import { useState } from 'react'
import {
  Briefcase,
  CaretUpDown,
  ChartLineUp,
  CirclesThreePlus,
  CreditCard,
  CurrencyEth,
  DotsThree,
  Files,
  Gear,
  Heart,
  House,
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  Users,
  Wallet,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// ─── types ────────────────────────────────────────────────────────────────────

export type AppBarRole = 'employer' | 'multi-entity' | 'contractor' | 'employee'

type NavItem = {
  label: string
  icon: React.ElementType
  muted?: boolean
}

// ─── nav item definitions per role ───────────────────────────────────────────

const NAV_ITEMS: Record<AppBarRole, NavItem[]> = {
  employer: [
    { label: 'People', icon: Users },
    { label: 'Payments', icon: CreditCard },
    { label: 'Niural Pay', icon: ShieldCheck },
    { label: 'Niural Insights', icon: ChartLineUp },
    { label: 'Integrations', icon: CirclesThreePlus },
  ],
  'multi-entity': [
    { label: 'Dashboard', icon: House },
    { label: 'People', icon: Users },
    { label: 'Payments', icon: CreditCard },
    { label: 'Niural Pay', icon: ShieldCheck },
    { label: 'Niural Insights', icon: ChartLineUp },
    { label: 'Integrations', icon: CirclesThreePlus },
  ],
  contractor: [
    { label: 'My Work', icon: Briefcase, muted: true },
    { label: 'Payments', icon: CreditCard },
    { label: 'Documents', icon: Files, muted: true },
  ],
  employee: [
    { label: 'My Work', icon: Briefcase, muted: true },
    { label: 'Payments', icon: CreditCard },
    { label: 'Benefits', icon: Heart, muted: true },
    { label: 'Documents', icon: Files, muted: true },
  ],
}

// ─── AppBarNavItem ─────────────────────────────────────────────────────────────
// Individual nav pill. Three states: default / hover (CSS) / selected (prop).

export function AppBarNavItem({
  label,
  icon: Icon,
  active,
  muted,
  onClick,
}: {
  label: string
  icon: React.ElementType
  active?: boolean
  muted?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[34px] shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 text-label-sm transition-colors',
        active
          ? 'bg-brand-base font-[530] text-brand-text'
          : cn(
              'hover:bg-background-highlight',
              muted
                ? 'text-text-muted hover:text-text-primary'
                : 'text-text-primary',
            ),
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  )
}

// ─── WalletButton ─────────────────────────────────────────────────────────────
// Default: white pill with shadow + dark amount text.
// Active: green pill with white text + inner highlight ring.

export function WalletButton({
  amount = '$ 28,043.34',
  active = false,
}: {
  amount?: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-9 shrink-0 items-center gap-1 rounded-full px-3 transition-all',
        active
          ? 'bg-brand-wallet-primary shadow-[0px_3px_4px_0px_rgba(11,193,90,0.11),inset_0px_1px_1px_rgba(255,255,255,0.25)]'
          : 'bg-background-base shadow-button-gray hover:shadow-button-gray',
      )}
    >
      <Wallet
        className={cn('size-5 shrink-0', active ? 'text-white' : 'text-brand-wallet-primary')}
        weight="duotone"
      />
      <span className={cn('px-1 text-label-sm', active ? 'text-text-on-color' : 'text-text-primary')}>
        {amount}
      </span>
      <span className={cn('h-2.5 w-px shrink-0', active ? 'bg-white/30' : 'bg-border-muted')} />
      <CaretUpDown
        className={cn('size-[18px] shrink-0', active ? 'text-white' : 'text-text-muted')}
      />
    </button>
  )
}

// ─── AiButton ─────────────────────────────────────────────────────────────────
// Default: white pill with branded icon + dark text.
// Hover: same pill but text renders as a purple→pink gradient.
// Selected: purple→pink gradient pill with white text + glow shadow.

export function AiButton({
  selected = false,
  onClick,
}: {
  selected?: boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex h-9 shrink-0 items-center gap-1 overflow-hidden rounded-full px-3 transition-all',
        selected
          ? 'shadow-[0px_3px_4px_0px_rgba(113,77,255,0.2),inset_0px_3px_4px_rgba(255,255,255,0.25)]'
          : 'bg-background-base shadow-button-gray',
      )}
      style={
        selected
          ? { backgroundImage: 'linear-gradient(119.6deg, #714dff 30.8%, #e151ff 122.6%)' }
          : undefined
      }
    >
      <Sparkle
        className={cn('size-5 shrink-0', selected ? 'text-white' : 'text-brand-primary')}
        weight="fill"
      />
      <span
        className="px-1 text-label-sm font-[530]"
        style={
          selected
            ? { color: 'white' }
            : hovered
            ? {
                backgroundImage: 'linear-gradient(20deg, #714dff 52.9%, #e151ff 87.7%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }
            : { color: 'var(--text-primary)' }
        }
      >
        Ask Emma
      </span>
    </button>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function AppBarDivider() {
  return <span className="h-4 w-px shrink-0 bg-border-muted" />
}

function AppBarLogo({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-primary text-label-xs font-semibold text-text-on-color">
        N
      </span>
    )
  }
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-primary text-label-xs font-semibold text-text-on-color">
        N
      </span>
      <span className="text-label-sm font-[550] text-text-primary">Niural AI</span>
    </div>
  )
}

function AppBarAvatar({ square }: { square?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center bg-brand-muted text-label-xs text-brand-text shadow-[0px_0px_0px_1px_var(--elevation-alpha-16)]',
        square ? 'rounded-[8px]' : 'rounded-full',
      )}
    >
      SB
    </span>
  )
}

function OrgSwitcher({ name = 'Nexus Corp Corp America' }: { name?: string }) {
  return (
    <button
      type="button"
      className="flex h-9 w-[190px] shrink-0 items-center gap-2 rounded-btn bg-background-base px-2 py-1 shadow-button-gray"
    >
      <span className="min-w-0 flex-1 truncate text-left text-label-xs text-text-muted">
        {name}
      </span>
      <span className="shrink-0 rounded-full border border-border-success-muted bg-background-success-muted px-[7px] py-px text-[10px] leading-[1.6] tracking-tight text-text-success-base">
        HQ
      </span>
      <CaretUpDown className="size-4 shrink-0 text-text-muted" />
    </button>
  )
}

function IconBtn({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
    >
      <Icon className="size-[18px]" />
    </button>
  )
}

// ─── AppBar ───────────────────────────────────────────────────────────────────
/**
 * Top navigation bar — 4 role variants from the Figma Web design system.
 *
 * Roles:
 *  employer      → full logo | People, Payments, Niural Pay, Niural Insights, Integrations
 *  multi-entity  → icon | org switcher | Dashboard … Integrations
 *  contractor    → full logo | My Work, Payments, Documents
 *  employee      → full logo | My Work, Payments, Benefits, Documents
 *
 * Exported sub-components: AppBarNavItem, WalletButton, AiButton
 */
export function AppBar({
  role = 'employer',
  activeItem,
  walletActive = false,
  aiSelected = false,
}: {
  role?: AppBarRole
  activeItem?: string
  walletActive?: boolean
  aiSelected?: boolean
}) {
  const navItems = NAV_ITEMS[role]
  const [active, setActive] = useState(activeItem ?? navItems[0]?.label ?? '')
  const [aiOn, setAiOn] = useState(aiSelected)

  const isEmployee = role === 'employee'
  const isEmployer = role === 'employer'
  const isMultiEntity = role === 'multi-entity'

  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between gap-3 bg-surface-2 px-4">

      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 items-center gap-3">
        <AppBarLogo compact={isMultiEntity} />

        {isMultiEntity && (
          <>
            <AppBarDivider />
            <OrgSwitcher />
          </>
        )}

        <AppBarDivider />

        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ label, icon, muted }) => (
            <AppBarNavItem
              key={label}
              label={label}
              icon={icon}
              active={active === label}
              muted={muted}
              onClick={() => setActive(label)}
            />
          ))}
        </nav>
      </div>

      {/* ── RIGHT ────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-5">

        {/* Primary actions */}
        <div className="flex shrink-0 items-center gap-3">
          {isEmployee ? (
            <>
              <button
                type="button"
                className="flex h-9 shrink-0 items-center gap-2 rounded-btn bg-background-base px-3 shadow-button-gray"
              >
                <CurrencyEth className="size-[18px]" />
                <span className="text-label-sm text-text-primary">Connect Wallet</span>
              </button>
              <button
                type="button"
                aria-label="Menu"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
              >
                <DotsThree className="size-4" weight="bold" />
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
              >
                <DotsThree className="size-4" weight="bold" />
              </button>
            </>
          ) : (
            <>
              <WalletButton active={walletActive} />
              {isEmployer && (
                <AiButton selected={aiOn} onClick={() => setAiOn((v) => !v)} />
              )}
            </>
          )}
        </div>

        {/* Secondary actions — hidden for employee */}
        {!isEmployee && (
          <>
            <AppBarDivider />
            <div className="flex shrink-0 items-center gap-2">
              {isMultiEntity && (
                <AiButton selected={aiOn} onClick={() => setAiOn((v) => !v)} />
              )}
              <IconBtn icon={MagnifyingGlass} label="Search" />
              {(isEmployer || isMultiEntity) && (
                <IconBtn icon={Gear} label="Settings" />
              )}
            </div>
          </>
        )}

        <AppBarDivider />
        <AppBarAvatar square={isEmployee} />
      </div>
    </header>
  )
}
