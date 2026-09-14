import { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  CirclesFour,
  Diamond,
  Flask,
  MagnifyingGlass,
  PaintBucket,
  Rocket,
  Sparkle,
  SquaresFour,
  TreeStructure,
} from '@phosphor-icons/react'
import { CraftCommandPalette } from './command-palette'
import { statusDotClass, statusLabel } from './status-badge'
import { ThemeToggle } from './theme-toggle'
import { crafts } from '@/crafts/registry'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const railIconLink =
  'flex size-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary'
const railIconLinkActive = 'bg-background-highlight text-text-primary'

const DOCS_AREAS = [
  { to: '/docs', label: 'Foundations', icon: PaintBucket },
  { to: '/docs/components', label: 'Components', icon: CirclesFour },
  { to: '/docs/components/ai', label: 'AI patterns', icon: Sparkle },
  { to: '/docs/grain', label: 'Grain', icon: Diamond },
  { to: '/docs/ia', label: 'Information Architecture', icon: TreeStructure },
] as const

/**
 * Which rail destination "owns" the current path - computed by hand rather
 * than each Link's own prefix-matching, because AI patterns' pages
 * physically live under `/docs/components/ai-*` (sharing the
 * `/docs/components` prefix with Components) and would otherwise light up
 * both icons at once. Grain (`/docs/grain*`) is a separate, unreconciled
 * system from AI patterns - see docs/foundations/grain.md.
 */
function railTargetFor(pathname: string): string {
  if (pathname.startsWith('/docs/components/ai')) return '/docs/components/ai'
  if (pathname.startsWith('/docs/components')) return '/docs/components'
  if (pathname.startsWith('/docs/grain') || pathname === '/docs/floater') return '/docs/grain'
  if (pathname.startsWith('/docs/ia')) return '/docs/ia'
  if (pathname.startsWith('/docs')) return '/docs'
  return pathname
}

/** Icon-only rail link with a floating tooltip standing in for the label.
 *  `active` is computed by the caller (see `railTargetFor`) rather than
 *  each Link's own fuzzy prefix matching. */
function RailLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string
  label: string
  icon: React.ElementType
  active: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={to}
            aria-label={label}
            className={cn(railIconLink, active && railIconLinkActive)}
          />
        }
      >
        <Icon className="size-[18px]" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Global playground shell: a 64px mini sidebar (wordmark, Crafts, the 4
 * docs areas, Run the app, craft switcher, ⌘K palette, theme toggle) fixed
 * to the left edge. Everything renders from src/crafts/registry.ts. Canvas
 * crafts hide this entirely in favor of FloatingDock (see __root.tsx).
 */
export function AppNav() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = useLocation({ select: (location) => location.pathname })
  const current = crafts.find((e) => e.to === pathname)
  const railTarget = railTargetFor(pathname)

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
      <aside className="fixed inset-y-0 left-0 z-50 flex w-16 shrink-0 flex-col items-center gap-1 border-r border-border-base bg-background-base/85 py-3 backdrop-blur">
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  to="/"
                  aria-label="NDS Playground"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-primary text-caption-md text-text-on-color"
                />
              }
            >
              N
            </TooltipTrigger>
            <TooltipContent side="right">NDS Playground</TooltipContent>
          </Tooltip>

          <span className="my-2 h-px w-8 shrink-0 bg-border-muted" />

          <nav className="flex flex-col items-center gap-1">
            <RailLink to="/" label="Crafts" icon={SquaresFour} active={railTarget === '/'} />
            {DOCS_AREAS.map((area) => (
              <RailLink
                key={area.to}
                to={area.to}
                label={area.label}
                icon={area.icon}
                active={railTarget === area.to}
              />
            ))}
            <RailLink to="/app" label="Run the app" icon={Rocket} active={railTarget === '/app'} />
          </nav>

          <span className="my-2 h-px w-8 shrink-0 bg-border-muted" />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={
                current ? `Switch craft - currently ${current.title}` : 'Switch craft'
              }
              title={
                current ? `Switch craft - currently ${current.title}` : 'Switch craft'
              }
              className={cn(railIconLink, 'data-popup-open:bg-background-highlight data-popup-open:text-text-primary')}
            >
              <Flask className="size-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-72">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-caption-md text-text-muted">
                  Switch craft
                </DropdownMenuLabel>
                {crafts.map((e) => (
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
                All crafts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Search crafts (⌘K)"
                  onClick={() => setPaletteOpen(true)}
                />
              }
            >
              <MagnifyingGlass />
            </TooltipTrigger>
            <TooltipContent side="right">Search crafts (⌘K)</TooltipContent>
          </Tooltip>

          <ThemeToggle />
        </TooltipProvider>
      </aside>

      <CraftCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </>
  )
}
