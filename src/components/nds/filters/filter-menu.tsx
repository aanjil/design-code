import { useState } from 'react'
import { FunnelSimple } from '@phosphor-icons/react'
import type { FilterCondition, FilterFieldDef } from './types'
import { FilterValuePanel } from './value-panel'
import { Button } from '@/components/ui/button'
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
      <DropdownMenuTrigger render={<Button variant="secondary" />}>
        <FunnelSimple />
        <span className="px-1 hover:cursor-pointer">Filter</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-surface-2">
        {fields.map((field) => {
          const current =
            conditions.find((c) => c.fieldId === field.id)?.values ?? []
          return (
            <DropdownMenuSub key={field.id}>
              <DropdownMenuSubTrigger>
                <field.icon className="text-text-primary" />
                <span className="min-w-0 flex-1 truncate">{field.label}</span>
                {current.length > 0 && (
                  <span className="rounded-full bg-brand-muted px-1.5 text-caption-md text-brand-text">
                    {current.length}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={6}
                className="w-[270px] rounded-2xl bg-background-base p-0"
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
