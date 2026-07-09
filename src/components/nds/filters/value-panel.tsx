import { useState } from 'react'
import { Check, MagnifyingGlass } from '@phosphor-icons/react'
import type { FilterFieldDef } from './types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Searchable multi-select list with Reset/Apply footer (Figma 9074:31913).
 * Rendered inside a menu submenu or a chip popover — the popup wrapper
 * provides the flyout surface; this fills it.
 */
export function FilterValuePanel({
  field,
  initial,
  onApply,
  onReset,
}: {
  field: FilterFieldDef
  initial: Array<string>
  onApply: (values: Array<string>) => void
  onReset: () => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial))
  const visible = field.options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  )

  function toggle(option: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(option)) next.delete(option)
      else next.add(option)
      return next
    })
  }

  return (
    /* stopPropagation keeps menu typeahead/navigation from stealing keys while typing */
    <div className="flex w-[270px] flex-col" onKeyDown={(e) => e.stopPropagation()}>
      <div className="p-1 pb-0">
        <label className="flex h-10 items-center gap-3 rounded-xl bg-background-highlight p-2">
          <MagnifyingGlass className="ml-0.5 size-4 shrink-0 text-text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="min-w-0 flex-1 bg-transparent text-label-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </label>
      </div>

      <div className="max-h-[200px] overflow-y-auto p-1">
        {visible.map((option) => {
          const checked = selected.has(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-background-highlight"
            >
              <span
                className={cn(
                  'flex size-3.5 shrink-0 items-center justify-center rounded-[4px] transition-colors',
                  checked
                    ? 'bg-brand-primary text-text-on-color shadow-button-primary'
                    : 'bg-background-base shadow-button-gray',
                )}
              >
                {checked && <Check className="size-3" weight="bold" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-label-sm text-text-primary">
                {option}
              </span>
            </button>
          )
        })}
        {visible.length === 0 && (
          <p className="p-3 text-paragraph-xs text-text-muted">
            No options match “{query}”.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-border-highlight p-3">
        <Button
          variant="ghost-destructive"
          className="flex-1"
          onClick={onReset}
        >
          <span className="px-1">Reset Filter</span>
        </Button>
        <Button className="flex-1" onClick={() => onApply([...selected])}>
          <span className="px-1">Apply</span>
        </Button>
      </div>
    </div>
  )
}
