import { CaretDown, Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * Form select styled like TextInput (36px, rounded-btn, ring shadow).
 * Menu portals into the current window on the canvas (portal-context).
 */
export function SelectField({
  value,
  options,
  onChange,
  placeholder = 'Select',
  disabled,
  className,
  align = 'start',
}: {
  value: string | null
  options: Array<string>
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  align?: 'start' | 'end'
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            className={cn(
              'h-9 w-full justify-between px-3 font-[425] shadow-button-gray hover:bg-background-base data-popup-open:shadow-border-active',
              className,
            )}
          />
        }
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left text-paragraph-sm',
            value ? 'text-text-primary' : 'text-text-muted',
          )}
        >
          {value ?? placeholder}
        </span>
        <CaretDown className="size-4 shrink-0 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="max-h-64 w-(--anchor-width) min-w-40 bg-surface-2"
      >
        {options.map((option) => (
          <DropdownMenuItem key={option} onClick={() => onChange(option)}>
            <span className="min-w-0 flex-1 truncate">{option}</span>
            {option === value && (
              <Check className="size-4 shrink-0 text-brand-text" weight="bold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
