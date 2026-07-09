import { useNavigate } from '@tanstack/react-router'
import { SquaresFour } from '@phosphor-icons/react'
import { statusDotClass } from './status-badge'
import { experiments } from '@/experiments/registry'
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

/** ⌘K experiment search — shared by the top nav and the canvas dock. */
export function ExperimentCommandPalette({
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
        <CommandInput placeholder="Search experiments…" />
        <CommandList>
          <CommandEmpty>No experiments found.</CommandEmpty>
          <CommandGroup heading="Experiments">
            {experiments.map((e) => (
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
              All experiments
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
