import { useState } from 'react'
import { CaretUpDown, MagnifyingGlass, Plus, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@niural/components'
import { sidebarNav, searchPanel } from '@/mocks/ai-components'

/**
 * Navigation & discovery: getting around the product itself, AI-flavored.
 * SidebarNav is a thin variant of nds/sidebar.tsx (same translucent panel,
 * hover/active language) with a workspace switcher + "New task" CTA on top
 * and badge counts per item instead of icons. Search reuses @niural/components Command
 * instead of a custom listbox - its empty state surfaces suggested agent
 * prompts rather than a blank box.
 */

type SidebarNavItem = (typeof sidebarNav.workspace)[number]

function SidebarNavGroup({
  title,
  items,
  activeItem,
  onNavigate,
}: {
  title: string
  items: Array<SidebarNavItem>
  activeItem?: string
  onNavigate?: (label: string) => void
}) {
  return (
    <div>
      <p className="px-2 pb-3 text-caption-sm font-medium text-muted uppercase">{title}</p>
      <div className="flex flex-col gap-0.5">
        {items.map(({ label, badge }) => {
          const active = label === activeItem
          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate?.(label)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg p-2 text-left text-label-small transition-colors',
                active
                  ? 'bg-base text-brand borders-base'
                  : 'text-primary hover:bg-highlight',
              )}
            >
              <span className="truncate">{label}</span>
              {badge !== undefined && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-muted px-1.5 text-label-xsmall text-muted">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SidebarNav({
  className,
  activeItem,
  onNavigate,
  onNewTask,
}: {
  className?: string
  activeItem?: string
  /** Called with an item's label when clicked - omit to leave the nav decorative. */
  onNavigate?: (label: string) => void
  onNewTask?: () => void
}) {
  return (
    <aside
      className={cn(
        'flex w-50 shrink-0 flex-col border-r border-base sidebar-background backdrop-blur-[2px]',
        className,
      )}
    >
      <div className="flex shrink-0 flex-col gap-2 p-4 pb-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-highlight"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-highlight text-label-small text-primary">
            {sidebarNav.workspaceName.charAt(0)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-label-small text-primary">
              {sidebarNav.workspaceName}
            </span>
            <span className="block truncate text-caption-sm text-muted">
              {sidebarNav.workspaceSubtitle}
            </span>
          </span>
          <CaretUpDown className="size-4 shrink-0 text-muted" />
        </button>
        <Button
          type="button"
          size="sm"
          width="full"
          leftIcon={<Plus className="size-4" />}
          onClick={onNewTask}
        >
          New task
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-8 overflow-y-auto p-4 pt-2">
        <SidebarNavGroup
          title="Workspace"
          items={sidebarNav.workspace}
          activeItem={activeItem}
          onNavigate={onNavigate}
        />
        <SidebarNavGroup
          title="Objects"
          items={sidebarNav.objects}
          activeItem={activeItem}
          onNavigate={onNavigate}
        />
      </nav>
    </aside>
  )
}

export function Search({ className }: { className?: string }) {
  const [query, setQuery] = useState('')
  const trimmed = query.trim().toLowerCase()
  const results = trimmed
    ? searchPanel.suggestedPrompts.filter((prompt) =>
        prompt.toLowerCase().includes(trimmed),
      )
    : searchPanel.suggestedPrompts

  return (
    <Command shouldFilter={false} className={cn('flyout', className)}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search or ask…"
      />
      <CommandList>
        {trimmed && results.length === 0 && (
          <CommandEmpty>No matching prompts.</CommandEmpty>
        )}
        <CommandGroup heading={trimmed ? 'Prompts' : 'Suggested'}>
          {results.map((prompt) => (
            <CommandItem
              key={prompt}
              value={prompt}
              onSelect={() => setQuery(prompt)}
              className="justify-start gap-2"
            >
              {trimmed ? (
                <MagnifyingGlass className="size-4 text-muted" />
              ) : (
                <Sparkle weight="fill" className="size-4 text-brand-primary" />
              )}
              {prompt}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
