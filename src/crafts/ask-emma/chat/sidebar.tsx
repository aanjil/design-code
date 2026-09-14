import { NotePencil, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { CHAT_LIST } from './data'

/**
 * Sidebar for the Figma "chat with sidebar and bubbles" node - a flat
 * "Your chats" history list, distinct from EmmaSidebar's run/ask-grouped
 * rail (../sidebar.tsx, the grain-flows_2.html recreation). Two sidebars
 * exist deliberately: this pair of screens follows the Figma reference
 * directly, the launcher/payroll/expense/ask screens follow Grain.
 */
export function ChatSidebar({ activeId = 'current' }: { activeId?: string }) {
  return (
    <aside className="flex w-65 shrink-0 flex-col gap-5 border-r border-border-base bg-background-base/72 p-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border-muted bg-background-base px-3 py-2 text-label-sm text-brand-text shadow-button-gray"
        >
          <Plus className="size-4" />
          New chat
        </button>
        <button
          type="button"
          aria-label="Notes"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-muted bg-background-base text-text-muted shadow-button-gray"
        >
          <NotePencil className="size-4" />
        </button>
      </div>

      <div>
        <p className="mb-1.5 px-2 text-caption-md text-text-muted">Your chats</p>
        <div className="flex flex-col gap-0.5">
          {CHAT_LIST.map((item) => {
            const active = item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'truncate rounded-lg px-2 py-2 text-left text-label-sm',
                  active ? 'bg-background-highlight font-medium text-text-primary' : 'text-text-primary hover:bg-background-highlight/60',
                )}
              >
                {item.title}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
