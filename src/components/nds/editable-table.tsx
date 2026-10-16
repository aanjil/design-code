import { useState } from 'react'
import {
  CalendarBlank,
  CaretDoubleRight,
  CaretDown,
  CaretRight,
  Check,
  ListPlus,
  Trash,
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * Editable table pattern (Figma "Editable table cell component", 9738:11698).
 * A CSS grid with 1px gaps over a hairline background = the grid lines.
 * Cells are 44px (headers 32px); Paragraph/Small for values - the DS spec
 * deliberately uses Inter (not mono) inside editable cells.
 * States: hover = highlight bg · editing = borders-shadow ·
 * open select / keyboard focus = borders-active.
 */

export function EditableTable({
  columns,
  className,
  children,
}: {
  /** CSS grid-template-columns, e.g. "40px 2fr 1fr 1.2fr 1fr 1.4fr 1fr 48px" */
  columns: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="table"
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-base bg-(--border-default)',
        className,
      )}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  )
}

/** One table row - spans all columns via subgrid so cells align. */
export function EditableRow({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="row"
      className={cn('col-span-full grid grid-cols-subgrid gap-px', className)}
    >
      {children}
    </div>
  )
}

/* ---------- header cells (32px, highlight bg, Label/XSmall) ---------- */

export function HeaderCell({
  children,
  align = 'left',
  className,
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <div
      role="columnheader"
      className={cn(
        'flex h-8 items-center bg-highlight px-3 py-1.5 text-label-xsmall text-primary',
        align === 'right' && 'justify-end text-right',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function HeaderIconCell({ collapse }: { collapse?: boolean }) {
  return (
    <div
      role="columnheader"
      className="flex h-8 items-center justify-center bg-highlight px-2 py-1.5 text-muted"
    >
      {collapse && <CaretDoubleRight className="size-4" />}
    </div>
  )
}

/* ---------- cell shell ---------- */

function cellShell(interactive = true) {
  return cn(
    'relative flex h-11 min-w-0 items-center bg-base px-3 py-1.5 text-paragraph-small text-primary',
    interactive &&
      'transition-[background-color,box-shadow] hover:bg-highlight focus-within:z-10 focus-within:bg-base focus-within:borders-shadow',
  )
}

/** Free text cell. */
export function TextCell({
  value,
  onChange,
  placeholder = 'Enter',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div role="cell" className={cn(cellShell(), className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted"
      />
    </div>
  )
}

/** Right-aligned numeric cell; formats to 2dp on blur. */
export function NumberCell({
  value,
  onChange,
  className,
  readOnly,
}: {
  value: number
  onChange?: (value: number) => void
  className?: string
  readOnly?: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)

  if (readOnly) {
    return (
      <div role="cell" className={cn(cellShell(false), 'justify-end', className)}>
        <span className="truncate">{value.toFixed(2)}</span>
      </div>
    )
  }
  return (
    <div role="cell" className={cn(cellShell(), className)}>
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? value.toFixed(2)}
        onFocus={(e) => {
          setDraft(value === 0 ? '' : String(value))
          requestAnimationFrame(() => e.target.select())
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(draft ?? '')
          onChange?.(Number.isFinite(parsed) ? parsed : 0)
          setDraft(null)
        }}
        className="w-full min-w-0 bg-transparent text-right outline-none placeholder:text-muted"
        placeholder="0.00"
      />
    </div>
  )
}

/** Number + unit select. DS default puts the unit BEFORE the value (9415:1454). */
export function SelectAndTypeCell({
  value,
  onChange,
  unit,
  units,
  onUnitChange,
  unitPosition = 'start',
  className,
}: {
  value: number
  onChange: (value: number) => void
  unit: string
  units: Array<string>
  onUnitChange: (unit: string) => void
  unitPosition?: 'start' | 'end'
  className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)

  const unitSelect = (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex shrink-0 cursor-pointer items-center gap-1 text-muted outline-none hover:text-primary data-popup-open:text-primary">
        {unit}
        <CaretDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={unitPosition === 'start' ? 'start' : 'end'}
        className="min-w-20 bg-surface-page"
      >
        {units.map((u) => (
          <DropdownMenuItem key={u} onClick={() => onUnitChange(u)}>
            <span className="flex-1">{u}</span>
            {u === unit && (
              <Check className="size-4 text-brand" weight="bold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
  const divider = <span className="h-4 w-px shrink-0 bg-muted" />

  return (
    <div role="cell" className={cn(cellShell(), 'gap-2', className)}>
      {unitPosition === 'start' && (
        <>
          {unitSelect}
          {divider}
        </>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? value.toFixed(2)}
        onFocus={(e) => {
          setDraft(value === 0 ? '' : String(value))
          requestAnimationFrame(() => e.target.select())
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(draft ?? '')
          onChange(Number.isFinite(parsed) ? parsed : 0)
          setDraft(null)
        }}
        className="w-full min-w-0 flex-1 bg-transparent text-right outline-none placeholder:text-muted"
        placeholder="0.00"
      />
      {unitPosition === 'end' && (
        <>
          {divider}
          {unitSelect}
        </>
      )}
    </div>
  )
}

/** Full-cell select (e.g. tax rate). */
export function SelectCell({
  value,
  options,
  onChange,
  placeholder = 'Select',
  className,
}: {
  value: string | null
  options: Array<string>
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div role="cell" className={cn(cellShell(), 'p-0', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-full w-full cursor-pointer items-center gap-2 px-3 py-1.5 outline-none data-popup-open:borders-active">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-left',
              value ? 'text-primary' : 'text-muted',
            )}
          >
            {value ?? placeholder}
          </span>
          <CaretDown className="size-4 shrink-0 text-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-(--anchor-width) min-w-44 bg-surface-page"
        >
          {options.map((option) => (
            <DropdownMenuItem key={option} onClick={() => onChange(option)}>
              <span className="min-w-0 flex-1 truncate">{option}</span>
              {option === value && (
                <Check className="size-4 shrink-0 text-brand" weight="bold" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Date cell - text entry with calendar affordance (YYYY-MM-DD). */
export function DateCell({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div role="cell" className={cn(cellShell(), 'gap-2', className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="YYYY-MM-DD"
        className="w-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
      />
      <CalendarBlank className="size-4 shrink-0 text-muted" />
    </div>
  )
}

/** 48px icon action cell (e.g. delete row). */
export function IconCell({
  label,
  onClick,
  destructive,
  className,
  children,
}: {
  label: string
  onClick?: () => void
  destructive?: boolean
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      role="cell"
      className={cn(
        'flex h-11 items-center justify-center bg-base px-2 py-1.5',
        className,
      )}
    >
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
          'flex size-6 items-center justify-center rounded-md text-muted transition-colors',
          destructive
            ? 'hover:bg-error-highlight hover:text-error'
            : 'hover:bg-highlight hover:text-primary',
        )}
      >
        {children ?? <Trash className="size-4" />}
      </button>
    </div>
  )
}

/** 40px expand-caret cell. */
export function CaretCell({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      role="cell"
      className="flex h-11 items-center justify-center bg-base px-2 py-1.5"
    >
      <button
        type="button"
        aria-label={expanded ? 'Collapse row' : 'Expand row'}
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-highlight hover:text-primary"
      >
        {expanded ? (
          <CaretDown className="size-4" />
        ) : (
          <CaretRight className="size-4" />
        )}
      </button>
    </div>
  )
}

/** Expanded row detail panel - highlight surface, wraps form fields. */
export function ExpandedRowPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      role="cell"
      className={cn(
        'col-span-full flex flex-wrap items-start gap-x-4 gap-y-3 bg-highlight p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Footer row with the ghost brand add button. */
export function AddRowFooter({
  label = 'Add new item',
  onClick,
  align = 'start',
}: {
  label?: string
  onClick: () => void
  align?: 'start' | 'center'
}) {
  return (
    <div
      role="row"
      className={cn(
        'col-span-full flex h-11 items-center bg-base px-3 py-1.5',
        align === 'center' ? 'justify-center' : 'justify-start',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex h-8 min-w-8 items-center gap-1 rounded-md px-2 text-label-small text-brand transition-colors hover:bg-brand-base"
      >
        <ListPlus className="size-[18px]" />
        <span className="px-1">{label}</span>
      </button>
    </div>
  )
}
