import {
  CaretUpDown,
  ChartLineUp,
  CirclesThreePlus,
  CreditCard,
  Gear,
  House,
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  Users,
  Wallet,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * AppBar per Figma (node 9071:22826): 58px, surface-2, pill nav items,
 * org switcher + wallet + Ask Emma + icon buttons + avatar.
 * Presentational — playground previews only.
 */

const NAV_ITEMS = [
  { label: 'Dashboard', icon: House },
  { label: 'People', icon: Users },
  { label: 'Payments', icon: CreditCard },
  { label: 'Niural Pay', icon: ShieldCheck },
  { label: 'Niural Insights', icon: ChartLineUp },
  { label: 'Integrations', icon: CirclesThreePlus },
]

function AppBarDivider() {
  return <span className="h-4 w-px shrink-0 bg-border-muted" />
}

export function AppBar({ activeItem = 'People' }: { activeItem?: string }) {
  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between gap-3 bg-surface-2 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-primary text-label-xs text-text-on-color">
          n
        </span>
        <AppBarDivider />

        {/* Org switcher */}
        <button
          type="button"
          className="flex h-9 w-[190px] shrink-0 items-center gap-2 rounded-btn bg-background-base py-1 pr-2 pl-2 shadow-button-gray"
        >
          <span className="min-w-0 flex-1 truncate text-left text-label-xs text-text-muted">
            Nexus Corp Corp America
          </span>
          <span className="rounded-full border border-border-success-muted bg-background-success-muted px-[7px] py-px text-[10px] leading-[1.6] tracking-[-0.02em] text-text-success-base">
            HQ
          </span>
          <CaretUpDown className="size-4 shrink-0 text-text-muted" />
        </button>
        <AppBarDivider />

        {/* Nav pills */}
        <nav className="flex min-w-0 items-center overflow-x-auto">
          {NAV_ITEMS.map(({ label, icon: Icon }) => {
            const active = label === activeItem
            return (
              <button
                key={label}
                type="button"
                className={cn(
                  'flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-label-sm text-text-primary transition-colors',
                  active
                    ? 'bg-background-base shadow-button-gray'
                    : 'hover:bg-background-highlight',
                )}
              >
                <Icon className="size-4" />
                <span className="px-1">{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        {/* Wallet */}
        <button
          type="button"
          className="flex h-9 items-center gap-1 rounded-full bg-background-base px-3 shadow-button-gray"
        >
          <Wallet className="size-[18px] text-brand-wallet-primary" weight="duotone" />
          <span className="px-1 text-label-sm text-text-primary">$ 28,043.34</span>
          <span className="h-2.5 w-px bg-border-muted" />
          <CaretUpDown className="size-[18px] text-text-muted" />
        </button>
        <AppBarDivider />

        <div className="flex items-center gap-3">
          {/* Ask Emma */}
          <button
            type="button"
            className="flex h-9 items-center gap-1 rounded-full bg-background-base px-3 shadow-button-gray"
          >
            <Sparkle className="size-5 text-brand-primary" weight="fill" />
            <span className="px-1 text-label-sm text-text-primary">Ask Emma</span>
          </button>
          <button
            type="button"
            aria-label="Search"
            className="flex size-9 items-center justify-center rounded-full bg-background-base shadow-button-gray"
          >
            <MagnifyingGlass className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="flex size-9 items-center justify-center rounded-full bg-background-base shadow-button-gray"
          >
            <Gear className="size-[18px]" />
          </button>
        </div>
        <AppBarDivider />

        {/* Avatar */}
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-label-xs text-brand-text shadow-[0px_0px_0px_1px_var(--elevation-alpha-16)]">
          SB
        </span>
      </div>
    </header>
  )
}
