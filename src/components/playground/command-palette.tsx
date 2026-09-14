import { useNavigate } from '@tanstack/react-router'
import { SquaresFour } from '@phosphor-icons/react'
import { statusDotClass } from './status-badge'
import { crafts } from '@/crafts/registry'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

/** ⌘K craft search - shared by the top nav and the canvas dock. */
export function CraftCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Search crafts…" />
        <CommandList>
          <CommandEmpty>No crafts found.</CommandEmpty>
          <CommandGroup heading="Crafts">
            {crafts.map((e) => (
              <CommandItem
                key={e.slug}
                value={`${e.title} ${e.tags.join(' ')}`}
                onSelect={() => {
                  onOpenChange(false)
                  navigate({ to: e.to })
                }}
              >
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    statusDotClass[e.status],
                  )}
                />
                {e.title}
                <span className="ml-auto text-caption text-text-muted">
                  {e.tags.join(' · ')}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Pages">
            <CommandItem
              onSelect={() => {
                onOpenChange(false)
                navigate({ to: '/' })
              }}
            >
              <SquaresFour />
              All crafts
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
