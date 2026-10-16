import { useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, SquaresFour } from '@phosphor-icons/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { BezelAlign, BezelEdge } from './floating-bezel'

/**
 * Where the one Emma object lives - three homes, nothing to tune:
 * - Dock: the bar in the app's bottom ground strip, in the left corner,
 *   centre (default) or right corner - drag the bar, or pick here.
 * - Sidebar: the copilot column on the right. Width is set by dragging its
 *   edge, not picked from a menu.
 * - Immersive: Emma as a chat head on any edge, anywhere along it (hold for
 *   the orbit menu) - drag it, ⌃⌥ + arrows, or the pad here.
 */

export type BarHome = 'dock' | 'immersive'

export interface Placement {
  /** true = the copilot column (Sidebar) is open. */
  docked: boolean
  /** Where the bar lives when it isn't the column. */
  home: BarHome
  /** Dock: which bottom slot the bar sits in. */
  align: BezelAlign
  /** Immersive edge. */
  edge: BezelEdge
  /** Immersive: 0-1 position of the chat head along its edge. */
  along: number
  /** Sidebar width (px), set by dragging the column edge. */
  width: number
}

export const SIDEBAR_MIN = 340
export const SIDEBAR_MAX = 760
export const DEFAULT_PLACEMENT: Placement = { docked: false, home: 'dock', align: 'center', edge: 'right', along: 0.55, width: 420 }

/** A 32x22 screen with Emma's shape solid. */
function Glyph({ children }: { children: React.ReactNode }) {
  return <span className="relative block h-[22px] w-8 rounded-[5px] border-[1.5px] border-current">{children}</span>
}

const HOMES: Array<{ id: 'dock' | 'sidebar' | 'immersive'; label: string; hint: string; glyph: React.ReactNode }> = [
  {
    id: 'dock',
    label: 'Dock',
    hint: 'Bottom of the page',
    glyph: <span className="absolute inset-x-[6px] bottom-[2px] h-[4px] rounded-full bg-current" />,
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    hint: 'A column beside the app',
    glyph: <span className="absolute inset-y-[2px] right-[2px] w-[9px] rounded-[2px] bg-current" />,
  },
  {
    id: 'immersive',
    label: 'Immersive',
    hint: 'A chat head on any edge',
    glyph: (
      <>
        <span className="absolute inset-x-[9px] top-[2px] h-[3px] rounded-full bg-current opacity-40" />
        <span className="absolute inset-y-[6px] left-[2px] w-[3px] rounded-full bg-current" />
        <span className="absolute inset-y-[6px] right-[2px] w-[3px] rounded-full bg-current opacity-40" />
        <span className="absolute inset-x-[9px] bottom-[2px] h-[3px] rounded-full bg-current opacity-40" />
      </>
    ),
  },
]

const SLOTS: Array<{ align: BezelAlign; label: string; bar: string }> = [
  { align: 'left', label: 'Left corner', bar: 'left-[3px]' },
  { align: 'center', label: 'Centre', bar: 'left-1/2 -translate-x-1/2' },
  { align: 'right', label: 'Right corner', bar: 'right-[3px]' },
]

const EDGES: Array<{ edge: BezelEdge; label: string; icon: typeof ArrowUp; cell: string }> = [
  { edge: 'top', label: 'Top edge', icon: ArrowUp, cell: 'col-start-2 row-start-1' },
  { edge: 'left', label: 'Left edge', icon: ArrowLeft, cell: 'col-start-1 row-start-2' },
  { edge: 'right', label: 'Right edge', icon: ArrowRight, cell: 'col-start-3 row-start-2' },
  { edge: 'bottom', label: 'Bottom edge', icon: ArrowDown, cell: 'col-start-2 row-start-3' },
]

export function PlacementMenu({
  placement,
  onChange,
  align = 'end',
  side = 'top',
}: {
  placement: Placement
  onChange: (next: Placement) => void
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const active = placement.docked ? 'sidebar' : placement.home
  const choose = (next: Partial<Placement>) => {
    setOpen(false)
    onChange({ ...placement, ...next })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Move Emma"
        title="Move Emma"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-(--elevation-alpha-8) hover:text-primary data-popup-open:bg-(--elevation-alpha-8) data-popup-open:text-primary"
      >
        <SquaresFour className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-[272px] gap-1 p-2">
        <div className="grid grid-cols-3 gap-1">
          {HOMES.map((h) => (
            <button
              key={h.id}
              type="button"
              aria-pressed={active === h.id}
              title={h.hint}
              onClick={() =>
                choose(
                  h.id === 'sidebar'
                    ? { docked: true }
                    : { docked: false, home: h.id },
                )
              }
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl px-1 pt-3 pb-2 transition-colors',
                active === h.id ? 'bg-brand-base text-brand' : 'text-primary hover:bg-muted',
              )}
            >
              <Glyph>{h.glyph}</Glyph>
              <span className="text-label-xsmall">{h.label}</span>
            </button>
          ))}
        </div>

        {active === 'dock' && (
          <div className="mt-1 flex items-center gap-3 rounded-xl bg-muted p-2">
            <div className="flex gap-0.5">
              {SLOTS.map(({ align, label, bar }) => (
                <button
                  key={align}
                  type="button"
                  aria-label={label}
                  title={label}
                  aria-pressed={placement.align === align}
                  onClick={() => choose({ docked: false, home: 'dock', align })}
                  className={cn(
                    'flex h-7 w-9 items-center justify-center rounded-md transition-colors',
                    placement.align === align ? 'bg-base text-brand borders-base' : 'text-muted hover:bg-base hover:text-primary',
                  )}
                >
                  <span className="relative block h-[16px] w-6 rounded-[4px] border-[1.5px] border-current">
                    <span className={cn('absolute bottom-[2px] h-[3px] w-[9px] rounded-full bg-current', bar)} />
                  </span>
                </button>
              ))}
            </div>
            <p className="text-caption-sm text-muted">Or drag the bar</p>
          </div>
        )}

        {active === 'immersive' && (
          <div className="mt-1 flex items-center gap-3 rounded-xl bg-muted p-2">
            <div className="grid grid-cols-3 grid-rows-3 gap-0.5">
              {EDGES.map(({ edge, label, icon: Icon, cell }) => (
                <button
                  key={edge}
                  type="button"
                  aria-label={label}
                  aria-pressed={placement.edge === edge}
                  onClick={() => choose({ docked: false, home: 'immersive', edge })}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md transition-colors',
                    cell,
                    placement.edge === edge ? 'bg-base text-brand borders-base' : 'text-muted hover:bg-base hover:text-primary',
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
            <p className="text-caption-sm text-muted">
              Drag the head, or
              <br />
              <span className="font-mono text-primary">⌃⌥ + arrows</span>
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
