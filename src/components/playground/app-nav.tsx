import { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  CaretUpDown,
  Flask,
  MagnifyingGlass,
  SquaresFour,
} from '@phosphor-icons/react'
import { ExperimentCommandPalette } from './command-palette'
import { Kbd } from './kbd'
import { statusDotClass, statusLabel } from './status-badge'
import { ThemeToggle } from './theme-toggle'
import { experiments } from '@/experiments/registry'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * Global playground shell: wordmark, experiment switcher, ⌘K palette,
 * theme toggle. Everything renders from src/experiments/registry.ts.
 */
export function AppNav() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = useLocation({ select: (location) => location.pathname })
  const current = experiments.find((e) => e.to === pathname)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-border-base bg-background-base/85 backdrop-blur">
        <nav className="flex h-full items-center gap-3 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-brand-primary text-caption-md text-text-on-color">
              N
            </span>
            <span className="text-label-sm">NDS Playground</span>
          </Link>

          <Separator
            orientation="vertical"
            className="data-vertical:h-5 data-vertical:self-center"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" className="min-w-0" />}
            >
              <Flask className="text-text-muted" />
              <span className="truncate">
                {current ? current.title : 'Experiments'}
              </span>
              <CaretUpDown className="text-text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-caption-md text-text-muted">
                  Switch experiment
                </DropdownMenuLabel>
                {experiments.map((e) => (
                  <DropdownMenuItem key={e.slug} render={<Link to={e.to} />}>
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        statusDotClass[e.status],
                      )}
                    />
                    <span className="truncate">{e.title}</span>
                    <span className="ml-auto text-caption text-text-muted">
                      {statusLabel[e.status]}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link to="/" />}>
                <SquaresFour />
                All experiments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-text-muted"
              onClick={() => setPaletteOpen(true)}
            >
              <MagnifyingGlass />
              <span className="hidden sm:inline">Search</span>
              <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
            </Button>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <ExperimentCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </>
  )
}
