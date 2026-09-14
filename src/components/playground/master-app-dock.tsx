import { Link } from '@tanstack/react-router'
import { ArrowSquareOut, CaretLeft, Rocket } from '@phosphor-icons/react'
import type { MasterIASection } from '@/crafts/master-ia'
import { MASTER_IA } from '@/crafts/master-ia'
import { getCraft } from '@/crafts/registry'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Minimal wayfinding chrome for the Master App (`/app/$section`) - sits
 * just below whatever real AppBar the mounted craft renders for itself
 * (every craft composes its own full AppShell, so the Master App can't
 * wrap another one around it without doubling the chrome). Lets you jump
 * between sections and reach any canvas-only craft that shares this
 * section but has no live page to mount here.
 */
export function MasterAppDock({ section }: { section: MasterIASection }) {
  const canvasOnly = section.crafts.filter((c) => c.status === 'canvas-only')

  return (
    <div className="fixed top-[70px] right-4 z-50 flex items-center gap-1 rounded-full bg-background-base/90 p-1 shadow-flyout backdrop-blur">
      <Link
        to="/"
        aria-label="Back to Crafts"
        title="Back to Crafts"
        className="flex size-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
      >
        <CaretLeft className="size-4" />
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-label-xs text-text-primary transition-colors hover:bg-background-highlight data-popup-open:bg-background-highlight">
          <Rocket className="size-3.5 text-brand-text" />
          {section.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-caption-md text-text-muted">
              Master App sections
            </DropdownMenuLabel>
            {MASTER_IA.map((s) => (
              <DropdownMenuItem
                key={s.key}
                render={<Link to="/app/$section" params={{ section: s.key }} />}
              >
                <span className="truncate">{s.label}</span>
                <span className="ml-auto text-caption text-text-muted">
                  {s.crafts.some((c) => c.status === 'live') ? 'Live' : '—'}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          {canvasOnly.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-caption-md text-text-muted">
                  Also prototyped here
                </DropdownMenuLabel>
                {canvasOnly.map((ref) => {
                  const meta = getCraft(ref.slug)
                  return (
                    <DropdownMenuItem key={ref.slug} render={<Link to={meta.to} />}>
                      <ArrowSquareOut className="size-3.5 shrink-0" />
                      <span className="truncate">{meta.title}</span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
