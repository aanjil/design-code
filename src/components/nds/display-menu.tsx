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
 * "Display" button → Display options panel (Figma 9816:17483):
 * group by, sort by + direction, column visibility chips, Apply/Reset.
 * Draft state commits on Apply.
 */

/*
 * Fields and chips here sit on the flyout surface, so the form-field tokens
 * (background-base fill + shadow-button-gray ring) read as floating cutouts.
 * They need their own hairline treatment instead.
 * TODO: Fix color — rgba values below are hardcoded until proper
 * on-flyout surface/border tokens exist in foundations.
 */
const flyoutControl =
  'border border-[rgba(20,20,22,0.1)] bg-transparent hover:bg-[rgba(20,20,22,0.03)] dark:border-[rgba(255,255,255,0.12)] dark:hover:bg-[rgba(255,255,255,0.05)]'
// TODO: Fix color — chip fills on flyout surface, same story as above.
const chipOn =
  'border-transparent bg-[rgba(20,20,22,0.07)] text-text-primary hover:bg-[rgba(20,20,22,0.11)] dark:bg-[rgba(255,255,255,0.1)] dark:hover:bg-[rgba(255,255,255,0.15)]'
const chipOff =
  'border-[rgba(20,20,22,0.1)] bg-transparent text-text-muted hover:bg-[rgba(20,20,22,0.03)] hover:text-text-primary dark:border-[rgba(255,255,255,0.12)] dark:hover:bg-[rgba(255,255,255,0.05)]'

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
      <PopoverTrigger
        render={<Button variant="secondary" aria-label="Display" title="Display" />}
      >
        <SlidersHorizontal />
        {/* label drops when the toolbar container narrows (employees page toolbar) */}
        <span className="px-1 @max-3xl/toolbar:hidden">Display</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[352px] gap-7 p-5">
        <p className="text-label-lg text-text-primary">Display options</p>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-label-sm text-text-primary">
              <List className="size-4 text-text-muted" />
              Group by
            </span>
            <OptionSelect
              options={groupOptions}
              value={draft.groupBy}
              onChange={(groupBy) => setDraft((d) => ({ ...d, groupBy }))}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-label-sm text-text-primary">
              <ArrowsDownUp className="size-4 text-text-muted" />
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
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-[10px] text-text-primary transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  flyoutControl,
                )}
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

        <div className="flex flex-col gap-3">
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
                    'flex h-9 items-center rounded-full border px-3.5 text-paragraph-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    visible ? chipOn : chipOff,
                  )}
                >
                  {column.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            className="h-10 flex-1"
            onClick={() => {
              onApply(draft)
              setOpen(false)
            }}
          >
            <span className="px-1">Apply</span>
          </Button>
          <Button
            variant="ghost-destructive"
            className="h-10 flex-1"
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
      {/* TODO: Fix color — open-state fill is hardcoded like flyoutControl above */}
      <DropdownMenuTrigger
        className={cn(
          'flex h-9 items-center gap-2 rounded-[10px] pr-2.5 pl-3.5 text-paragraph-sm text-text-primary transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:bg-[rgba(20,20,22,0.05)] dark:data-[popup-open]:bg-[rgba(255,255,255,0.07)]',
          flyoutControl,
        )}
      >
        {current?.label ?? value}
        <CaretDown className="size-4 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 ">
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
