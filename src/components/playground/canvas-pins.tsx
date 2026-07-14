import { useEffect, useRef } from 'react'
import { useAnnotations } from './annotations'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Design-note pins on the canvas. Two kinds:
 * - 'point': click-placed in annotate mode
 * - 'element': ⌘/Ctrl-click a DOM element inside a window — the element's
 *   region gets a dotted highlight and the pin travels with it.
 * Pins live in the scaled layer (zoom with the canvas) and register into
 * the annotations context so the dock's Notes sheet lists them. The open
 * note card is raised ABOVE the annotate-mode overlay so typing works.
 */
export interface CanvasPin {
  id: string
  n: number
  kind: 'point' | 'element'
  /** Attached window id, or null for a canvas-level pin. */
  windowId: string | null
  /** Offset within the window (or absolute canvas coords when detached). */
  rx: number
  ry: number
  /** Element-region size (element pins only, logical px). */
  rw?: number
  rh?: number
  text: string
}

export function PinMarker({
  pin,
  ax,
  ay,
  rw,
  rh,
  open,
  onToggle,
  onChange,
  onDelete,
}: {
  pin: CanvasPin
  ax: number
  ay: number
  rw?: number
  rh?: number
  open: boolean
  onToggle: () => void
  onChange: (text: string) => void
  onDelete: () => void
}) {
  const { register, unregister } = useAnnotations()
  const ref = useRef<HTMLButtonElement>(null)
  const isRegion = pin.kind === 'element' && rw !== undefined && rh !== undefined

  useEffect(() => {
    register(
      {
        n: pin.n,
        title: pin.text.trim().slice(0, 48) || `Pin ${pin.n}`,
        note: pin.text.trim() || 'Empty note — click the pin to write one.',
      },
      ref.current,
    )
    return () => unregister(pin.n)
  }, [pin.n, pin.text, register, unregister])

  return (
    <div
      className="group/pin absolute"
      style={{ left: ax, top: ay, zIndex: open ? 8000 : 7500 }}
    >
      {/* dotted element highlight */}
      {isRegion && (
        <div
          className="pointer-events-none absolute rounded-md border-2 border-dashed border-brand-primary bg-brand-primary/10"
          style={{ left: 0, top: 0, width: rw, height: rh }}
        />
      )}
      <button
        ref={ref}
        type="button"
        aria-label={`Design note ${pin.n}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onToggle}
        className={cn(
          'flex size-5 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-brand-primary text-caption-md text-text-on-color shadow-sm ring-2 ring-background-base transition-transform hover:scale-110',
          isRegion && 'absolute top-0 left-0',
        )}
      >
        {pin.n}
      </button>
      {/* hover preview (read-only) */}
      {!open && (
        <div
          className="pointer-events-none absolute hidden w-max max-w-[260px] rounded-lg bg-background-base p-2 text-paragraph-xs whitespace-pre-wrap text-text-primary shadow-flyout group-hover/pin:block"
          style={{ left: 10, top: isRegion ? (rh ?? 0) + 6 : 10 }}
        >
          {pin.text.trim() || 'Empty note — click the pin to write.'}
        </div>
      )}
      {open && (
        <div
          className="absolute w-[240px] rounded-xl bg-background-base p-2 shadow-flyout"
          style={{ left: 8, top: isRegion ? (rh ?? 0) + 8 : 8 }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <textarea
            autoFocus
            value={pin.text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Design note…"
            className="min-h-16 w-full resize-none rounded-lg bg-background-highlight p-2 text-paragraph-xs text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <Button variant="ghost-destructive" size="sm" onClick={onDelete}>
              <span className="px-1">Delete</span>
            </Button>
            <Button size="sm" onClick={onToggle}>
              <span className="px-1">Done</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
