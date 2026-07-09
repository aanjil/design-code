import { useState } from 'react'
import {
  ArrowsDownUp,
  CaretDown,
  Check,
  List,
  SlidersHorizontal,
  SortAscending,
  SortDescending,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * "Display" button → Table Customization panel (Figma 9816:17483):
 * group by, sort by + direction, column visibility chips, Apply/Reset.
 * Draft state commits on Apply.
 */

export interface DisplayOption {
  value: string
  label: string
}

export interface DisplayConfig {
  groupBy: string
  sortBy: string
  sortDir: 'asc' | 'desc'
  visibleColumns: Array<string>
}

export function DisplayMenu({
  groupOptions,
  sortOptions,
  columns,
  value,
  defaults,
  onApply,
}: {
  groupOptions: Array<DisplayOption>
  sortOptions: Array<DisplayOption>
  columns: Array<DisplayOption>
  value: DisplayConfig
  defaults: DisplayConfig
  onApply: (config: DisplayConfig) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DisplayConfig>(value)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setDraft(value)
      }}
    >
      <PopoverTrigger render={<Button variant="secondary" />}>
        <SlidersHorizontal />
        <span className="px-1">Display</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[352px] bg-surface-2 p-0">
        <div className="flex flex-col gap-8 p-5">
          <p className="text-label-md text-text-primary">Table customization</p>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-label-sm text-text-muted">
                  <List className="size-4" />
                  Group by
                </span>
                <OptionSelect
                  options={groupOptions}
                  value={draft.groupBy}
                  onChange={(groupBy) => setDraft((d) => ({ ...d, groupBy }))}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-label-sm text-text-muted">
                  <ArrowsDownUp className="size-4" />
                  Sort by
                </span>
                <div className="flex items-center gap-2">
                  <OptionSelect
                    options={sortOptions}
                    value={draft.sortBy}
                    onChange={(sortBy) => setDraft((d) => ({ ...d, sortBy }))}
                  />
                  <button
                    type="button"
                    aria-label={`Sort ${draft.sortDir === 'asc' ? 'ascending' : 'descending'} — click to flip`}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        sortDir: d.sortDir === 'asc' ? 'desc' : 'asc',
                      }))
                    }
                    className="flex size-[34px] items-center justify-center rounded-btn bg-background-base text-text-primary shadow-button-gray"
                  >
                    {draft.sortDir === 'asc' ? (
                      <SortAscending className="size-4" />
                    ) : (
                      <SortDescending className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-border-base" />

            <div className="flex flex-col gap-2.5">
              <p className="text-label-sm text-text-muted">Table columns</p>
              <div className="flex flex-wrap gap-2">
                {columns.map((column) => {
                  const visible = draft.visibleColumns.includes(column.value)
                  return (
                    <button
                      key={column.value}
                      type="button"
                      aria-pressed={visible}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          visibleColumns: visible
                            ? d.visibleColumns.filter((c) => c !== column.value)
                            : [...d.visibleColumns, column.value],
                        }))
                      }
                      className={cn(
                        'flex h-8 items-center rounded-full px-3 text-paragraph-sm shadow-button-gray transition-colors',
                        visible
                          ? 'bg-background-highlight text-text-primary'
                          : 'bg-background-base text-text-muted',
                      )}
                    >
                      {column.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border-base px-5 py-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              onApply(draft)
              setOpen(false)
            }}
          >
            <span className="px-1">Apply</span>
          </Button>
          <Button
            variant="ghost-destructive"
            className="flex-1"
            onClick={() => setDraft(defaults)}
          >
            <span className="px-1">Reset</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function OptionSelect({
  options,
  value,
  onChange,
}: {
  options: Array<DisplayOption>
  value: string
  onChange: (value: string) => void
}) {
  const current = options.find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-[34px] items-center gap-2 rounded-btn bg-background-base pr-3 pl-4 text-paragraph-sm text-text-muted shadow-button-gray">
        {current?.label ?? value}
        <CaretDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-surface-2">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.value === value && (
              <Check className="size-4 text-brand-text" weight="bold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
