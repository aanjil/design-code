import type { Icon } from '@phosphor-icons/react'
import {
  AddressBook,
  CalendarDots,
  ClockCountdown,
  Compass,
  Heart,
  IdentificationBadge,
  Receipt,
  Timer,
  TreeStructure,
  UserCirclePlus,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Sidebar per Figma (node 9071:22830): 200px translucent panel with
 * blur, grouped items, active = white pill + ring + brand text.
 */

export interface SidebarItemDef {
  label: string
  icon: Icon
}

interface SidebarGroupDef {
  title?: string
  items: Array<SidebarItemDef>
}

const PEOPLE_SIDEBAR: Array<SidebarGroupDef> = [
  {
    items: [
      { label: 'Employees', icon: IdentificationBadge },
      { label: 'Contracts', icon: AddressBook },
      { label: 'Org Chart', icon: TreeStructure },
      { label: 'Hire', icon: UserCirclePlus },
      { label: 'Benefits', icon: Heart },
    ],
  },
  {
    title: 'Tracking',
    items: [
      { label: 'Overview', icon: Compass },
      { label: 'Timesheets', icon: CalendarDots },
      { label: 'Time Tracker', icon: Timer },
      { label: 'Time Off', icon: ClockCountdown },
    ],
  },
  {
    title: 'Reimburse',
    items: [{ label: 'Expense', icon: Receipt }],
  },
]

export function Sidebar({
  title = 'People',
  groups = PEOPLE_SIDEBAR,
  activeItem = 'Employees',
}: {
  title?: string
  groups?: Array<SidebarGroupDef>
  activeItem?: string
}) {
  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-border-base bg-overlay-background-base backdrop-blur-[2px]">
      <div className="flex h-16 shrink-0 items-center px-4 py-2">
        <p className="px-2 text-[18px] leading-[1.6] font-[550] tracking-[-0.02em] text-text-primary">
          {title}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-8 overflow-y-auto p-4">
        {groups.map((group, gi) => (
          <div key={group.title ?? gi}>
            {group.title && (
              <p className="px-2 pb-3 text-caption-md text-text-muted">
                {group.title}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ label, icon: ItemIcon }) => {
                const active = label === activeItem
                return (
                  <button
                    key={label}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-2 text-left text-label-sm transition-colors',
                      active
                        ? 'bg-background-base text-brand-text shadow-button-gray'
                        : 'text-text-primary hover:bg-background-highlight',
                    )}
                  >
                    <ItemIcon className="size-[18px] shrink-0" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
