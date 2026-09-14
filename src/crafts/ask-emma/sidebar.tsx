import { CaretRight, Circle, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { HISTORY } from './mocks'
import type { HistoryItem } from './mocks'

/**
 * Emma's own history rail - not the product's People/Payments Sidebar
 * (nds/sidebar.tsx). ▸ (filled caret) = a run, system-owned sequence ·
 * ○ (open circle) = an ask thread, user-owned. Ported from
 * grain-flows_2.html's `.side` - same 200px translucent panel language
 * as the product Sidebar, different content.
 */
export function EmmaSidebar({
  activeId,
  onNewChat,
  onSelect,
}: {
  activeId?: string
  onNewChat?: () => void
  onSelect?: (item: HistoryItem) => void
}) {
  return (
    <aside className="flex w-50 shrink-0 flex-col border-r border-border-base bg-background-base/72">
      <div className="flex flex-col gap-6 overflow-y-auto p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-border-base bg-background-base px-2.5 py-2 text-left text-label-sm text-text-primary shadow-button-gray hover:border-text-muted"
        >
          <Plus className="size-4 shrink-0" />
          New
        </button>

        {HISTORY.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 font-mono text-[9.5px] tracking-wide text-text-disabled">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect?.(item)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors',
                      active ? 'bg-background-highlight' : 'hover:bg-background-highlight/60',
                    )}
                  >
                    <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center text-text-disabled">
                      {item.kind === 'run' ? (
                        <CaretRight weight="fill" className="size-2.5 text-text-primary" />
                      ) : (
                        <Circle className="size-2" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-label-sm',
                          active ? 'font-medium text-text-primary' : 'text-text-primary',
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-text-disabled">
                        {item.meta}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-border-highlight px-3 py-3 font-mono text-[10px] leading-[1.7] text-text-disabled">
        ▸ run · system-owned
        <br />○ ask · you-owned
      </div>
    </aside>
  )
}
