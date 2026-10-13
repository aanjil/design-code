import { Link } from '@tanstack/react-router'
import { ArrowSquareOut, CaretUp, Compass, SquaresFour } from '@phosphor-icons/react'
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
 * "Go to" - Master App wayfinding, living inside the floating mock dock
 * (bottom center) instead of its own top-right chrome. Jump between
 * sections, open any craft that belongs to the current section on its
 * own canvas, or go back to the crafts gallery.
 */
export function MasterGoToMenu({ section }: { section: MasterIASection }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-full pr-2 pl-2.5 text-label-xs text-grain-ink-foreground transition-colors hover:bg-elevation-alpha-12 data-popup-open:bg-elevation-alpha-12">
        <Compass className="size-4" />
        Go to
        <span className="text-grain-ink-muted">· {section.label}</span>
        <CaretUp className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-caption-md text-text-muted">Master App sections</DropdownMenuLabel>
          {MASTER_IA.map((s) => (
            <DropdownMenuItem key={s.key} render={<Link to="/app/$section" params={{ section: s.key }} />}>
              <span className={s.key === section.key ? 'truncate text-brand-text' : 'truncate'}>{s.label}</span>
              <span className="ml-auto text-caption text-text-muted">
                {s.crafts.some((c) => c.status === 'live') ? 'Live' : '—'}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {section.crafts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-caption-md text-text-muted">Crafts in {section.label}</DropdownMenuLabel>
              {section.crafts.map((ref) => {
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
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/" />}>
          <SquaresFour className="size-3.5 shrink-0" />
          All crafts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
