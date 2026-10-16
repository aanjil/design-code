import { useState } from 'react'
import { FunnelSimple } from '@phosphor-icons/react'
import type { FilterCondition, FilterFieldDef } from './types'
import { FilterValuePanel } from './value-panel'
import { Button } from '@niural/components'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Filter button → field list (Figma 9071:25310) → hover opens a nested
 * multi-select value panel (Figma 9074:31913). Apply commits and closes.
 */
export function FilterMenu({
  fields,
  conditions,
  onUpsert,
  onRemove,
}: {
  fields: Array<FilterFieldDef>
  conditions: Array<FilterCondition>
  onUpsert: (fieldId: string, values: Array<string>) => void
  onRemove: (fieldId: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="solid"
            shade="neutral"
            leftIcon={<FunnelSimple className="size-4" />}
            rightIcon={
              conditions.length > 0 ? (
                <span className="rounded-full bg-brand-muted px-1.5 text-caption-sm font-medium text-brand">
                  {conditions.length}
                </span>
              ) : undefined
            }
            aria-label="Filter"
            title="Filter"
          />
        }
      >
        {/* label drops when the toolbar container narrows (employees page toolbar) */}
        <span className="hover:cursor-pointer @max-3xl/toolbar:hidden">
          Filter
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] ">
        {fields.map((field) => {
          const current =
            conditions.find((c) => c.fieldId === field.id)?.values ?? []
          return (
            <DropdownMenuSub key={field.id}>
              <DropdownMenuSubTrigger>
                <field.icon className="text-primary" />
                <span className="min-w-0 flex-1 truncate">{field.label}</span>
                {current.length > 0 && (
                  <span className="rounded-full bg-brand-muted px-1.5 text-caption-sm font-medium text-brand">
                    {current.length}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={6}
                className="w-[270px] rounded-2xl  "
              >
                <FilterValuePanel
                  field={field}
                  initial={current}
                  onApply={(values) => {
                    onUpsert(field.id, values)
                    setOpen(false)
                  }}
                  onReset={() => {
                    onRemove(field.id)
                    setOpen(false)
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
