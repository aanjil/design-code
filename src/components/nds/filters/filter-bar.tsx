import { useState } from 'react'
import { BookmarkSimple, X } from '@phosphor-icons/react'
import type { FilterCondition, FilterFieldDef } from './types'
import { conditionSummary } from './types'
import { FilterValuePanel } from './value-panel'
import { AiFilter } from './ai-filter'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/**
 * The applied-filters container (Figma 9749:54617): segmented chips that
 * stay editable in place, AI filter entry, save-as-view stub, and Clear.
 */
export function FilterBar({
  fields,
  conditions,
  onUpsert,
  onRemove,
  onClear,
  onApplyPrompt,
  onSaveView,
}: {
  fields: Array<FilterFieldDef>
  conditions: Array<FilterCondition>
  onUpsert: (fieldId: string, values: Array<string>) => void
  onRemove: (fieldId: string) => void
  onClear: () => void
  onApplyPrompt: (prompt: string) => number
  onSaveView?: (name: string) => void
}) {
  if (conditions.length === 0) return null

  return (
    <div className="flex items-center gap-4 rounded-xl bg-background-highlight/50 shadow-border-base p-2.5 ">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {conditions.map((condition) => {
          const field = fields.find((f) => f.id === condition.fieldId)
          if (!field) return null
          return (
            <FilterChip
              key={condition.fieldId}
              field={field}
              condition={condition}
              onUpsert={onUpsert}
              onRemove={onRemove}
            />
          )
        })}
        <AiFilter onApplyPrompt={onApplyPrompt} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onSaveView && (
          <button
            type="button"
            onClick={() =>
              onSaveView(
                conditions
                  .map((c) => `${fields.find((f) => f.id === c.fieldId)?.label}: ${conditionSummary(c)}`)
                  .join(' · '),
              )
            }
            className="flex h-7 items-center gap-1 rounded-lg px-1.5 text-label-sm text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
          >
            <BookmarkSimple className="size-4" />
            <span className="px-1">Save view</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          className="flex h-7 items-center rounded-btn bg-background-error-highlight px-1.5 text-label-sm text-text-error-base transition-colors hover:bg-background-error-muted"
        >
          <span className="px-1">Clear</span>
        </button>
      </div>
    </div>
  )
}

function ChipDivider() {
  return <span className="w-px self-stretch bg-border-highlight" />
}

function FilterChip({
  field,
  condition,
  onUpsert,
  onRemove,
}: {
  field: FilterFieldDef
  condition: FilterCondition
  onUpsert: (fieldId: string, values: Array<string>) => void
  onRemove: (fieldId: string) => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-md bg-background-muted shadow-button-gray">
      <span className="flex items-center gap-1.5 px-2 text-label-sm whitespace-nowrap text-text-primary">
        <field.icon className="size-4 shrink-0" />
        {field.label}
      </span>
      <ChipDivider />
      <span className="flex items-center px-2 text-label-xs whitespace-nowrap text-text-muted">
        {condition.operator === 'is' ? 'is' : 'is any of'}
      </span>
      <ChipDivider />
      <Popover open={editing} onOpenChange={setEditing}>
        <PopoverTrigger className="flex max-w-[280px] items-center px-2 text-label-sm text-text-primary transition-colors hover:bg-background-highlight">
          <span className="truncate">{conditionSummary(condition)}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[270px] rounded-2xl p-0"
        >
          <FilterValuePanel
            field={field}
            initial={condition.values}
            onApply={(values) => {
              onUpsert(field.id, values)
              setEditing(false)
            }}
            onReset={() => {
              onRemove(field.id)
              setEditing(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <ChipDivider />
      <span className="flex w-[34px] items-center justify-center">
        <button
          type="button"
          aria-label={`Remove ${field.label} filter`}
          onClick={() => onRemove(field.id)}
          className="flex size-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-error-highlight hover:text-text-error-base"
        >
          <X className="size-4" />
        </button>
      </span>
    </div>
  )
}
