import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Check, DotsThree, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Orbit menu - hold a button and its actions orbit out, ready to pick with a
 * drag. Recreated from the uiarc.dev "Orbit menu" spec (behaviour only; no
 * Arc Pro source): press, drag toward an action and release to fire it, or
 * tap to keep the arc open and tap again to close. Targeting goes by angle
 * like a pie menu, outside a 34px dead zone; releasing off the arc, or a hold
 * without a drag, folds it away without firing. CSS transitions only - no
 * motion library - and motion-reduce drops the swirl to plain fades.
 *
 * Extensions for the Bezel chat head (all optional, off by default):
 * `trigger` replaces the ellipsis glyph, `holdDelay` makes the arc open only
 * after a hold (so a quick drag can mean something else), `onTap` overrides
 * the tap-to-toggle, and `onDragAway` hands a pre-hold drag to the host.
 */

export interface OrbitAction {
  id: string
  label: string
  icon: React.ReactNode
  /** Short confirmation shown after firing. Defaults to the label. */
  done?: string
  tone?: 'neutral' | 'danger'
}

const DEAD_ZONE = 34
const DRAG_SLOP = 8

export function OrbitMenu({
  actions,
  onAction,
  label = 'Actions',
  radius = 104,
  spread = 150,
  direction = -90,
  disabled = false,
  announce = true,
  onOpenChange,
  className,
  trigger,
  triggerClassName,
  holdDelay = 0,
  onTap,
  onDragAway,
}: {
  actions: Array<OrbitAction>
  onAction: (id: string) => void
  label?: string
  radius?: number
  spread?: number
  /** Degrees the arc opens toward: -90 up, 0 right, 90 down, 180 left. */
  direction?: number
  disabled?: boolean
  announce?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  /** Custom trigger content (the Bezel passes the Emma orb). */
  trigger?: React.ReactNode
  triggerClassName?: string
  /** ms of hold before the arc opens; 0 = opens on press like the spec. */
  holdDelay?: number
  /** Tap (press + release, no drag, no hold) - default toggles the arc. */
  onTap?: () => void
  /** A drag that starts before `holdDelay` elapses is handed to the host. */
  onDragAway?: (startX: number, startY: number, pointerId: number) => void
}) {
  const id = useId()
  const [open, setOpenState] = useState(false)
  const [target, setTarget] = useState<number | null>(null)
  const [outside, setOutside] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [focusIdx, setFocusIdx] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const gesture = useRef<{
    x: number
    y: number
    moved: boolean
    held: boolean
    openedByPress: boolean
    timer: number | null
  } | null>(null)

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next)
      if (!next) {
        setTarget(null)
        setOutside(false)
      }
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled, setOpen])

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setDone(null), 1400)
    return () => window.clearTimeout(t)
  }, [done])

  const n = actions.length
  const angles = actions.map((_, i) => direction - spread / 2 + (n === 1 ? spread / 2 : (i * spread) / (n - 1)))
  const step = n > 1 ? spread / (n - 1) : spread

  function fire(i: number) {
    const a = actions[i]
    if (!a) return
    setDone(a.done ?? a.label)
    setOpen(false)
    onAction(a.id)
    triggerRef.current?.focus()
  }

  /** Pie-menu targeting: by heading, outside the dead zone, inside the arc. */
  function aim(clientX: number, clientY: number) {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const dx = clientX - (r.left + r.width / 2)
    const dy = clientY - (r.top + r.height / 2)
    const dist = Math.hypot(dx, dy)
    if (dist < DEAD_ZONE) {
      setTarget(null)
      setOutside(false)
      return
    }
    if (dist > radius + 70) {
      setTarget(null)
      setOutside(true)
      return
    }
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI
    let best: number | null = null
    let bestDiff = Infinity
    angles.forEach((a, i) => {
      const diff = Math.abs((((deg - a) % 360) + 540) % 360 - 180)
      if (diff < bestDiff) {
        bestDiff = diff
        best = i
      }
    })
    const inArc = bestDiff <= step / 2 + 14
    setTarget(inArc ? best : null)
    setOutside(!inArc)
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (disabled || e.button !== 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* synthetic or already-released pointer */
    }
    const wasOpen = open
    gesture.current = { x: e.clientX, y: e.clientY, moved: false, held: false, openedByPress: false, timer: null }
    if (wasOpen) return
    if (holdDelay <= 0) {
      gesture.current.openedByPress = true
      setOpen(true)
    } else {
      gesture.current.timer = window.setTimeout(() => {
        if (!gesture.current) return
        gesture.current.held = true
        gesture.current.openedByPress = true
        setOpen(true)
      }, holdDelay)
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const g = gesture.current
    if (!g) return
    if (!g.moved && Math.hypot(e.clientX - g.x, e.clientY - g.y) > DRAG_SLOP) {
      g.moved = true
      // Dragged before the hold elapsed: not ours - hand it to the host.
      if (holdDelay > 0 && !g.held && !open && onDragAway) {
        if (g.timer) window.clearTimeout(g.timer)
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          /* not captured */
        }
        gesture.current = null
        onDragAway(g.x, g.y, e.pointerId)
        return
      }
    }
    if (open) aim(e.clientX, e.clientY)
  }

  function onPointerUp() {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    if (g.timer) window.clearTimeout(g.timer)
    if (g.moved) {
      if (target != null) fire(target)
      else setOpen(false) // released off the arc: fold away, nothing fires
      return
    }
    // No drag.
    if (g.held) return setOpen(false) // a hold without a drag folds away
    if (open && !g.openedByPress) return setOpen(false) // tap again closes
    if (onTap) {
      setOpen(false)
      onTap()
      return
    }
    // Spec tap: keep the arc open for tapping.
    setOpen(true)
    setFocusIdx(0)
  }

  function onTriggerKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    const openAt = (i: number) => {
      e.preventDefault()
      setOpen(true)
      setFocusIdx(i)
      requestAnimationFrame(() => itemRefs.current[i]?.focus())
    }
    if (e.key.startsWith('Arrow')) openAt(e.key === 'ArrowUp' ? n - 1 : 0)
    else if (e.key === 'Enter' || e.key === ' ') {
      if (open) {
        e.preventDefault()
        setOpen(false)
      } else openAt(0)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }

  function onItemKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    const move = (to: number) => {
      e.preventDefault()
      const j = (to + n) % n
      setFocusIdx(j)
      itemRefs.current[j]?.focus()
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(i + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(i - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(n - 1)
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fire(i)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'Tab') setOpen(false)
  }

  // Label pill: named target > release to cancel > menu label; done wins.
  const pill = done ?? (open ? (target != null ? actions[target].label : outside ? 'Release to cancel' : label) : null)
  const rad = (direction * Math.PI) / 180
  const pillR = radius + 46

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          gesture.current = null
          setOpen(false)
        }}
        onKeyDown={onTriggerKey}
        className={cn(
          'relative z-10 flex size-12 touch-none items-center justify-center rounded-full outline-none select-none focus-visible:borders-focus',
          !trigger && 'bg-base text-primary borders-base backdrop-blur-xl',
          triggerClassName,
        )}
      >
        {trigger ?? (
          <span className="relative size-5">
            <DotsThree weight="bold" className={cn('absolute inset-0 size-5 transition-all duration-200', open || done ? 'scale-50 rotate-90 opacity-0' : '')} />
            <X className={cn('absolute inset-0 size-5 transition-all duration-200', open && !done ? '' : 'scale-50 -rotate-90 opacity-0')} />
            <Check weight="bold" className={cn('absolute inset-0 size-5 text-success transition-all duration-200', done ? '' : 'scale-50 opacity-0')} />
          </span>
        )}
      </button>

      <div
        id={`${id}-menu`}
        role="menu"
        aria-label={label}
        inert={!open}
        className="pointer-events-none absolute top-1/2 left-1/2 z-20 size-0"
      >
        {actions.map((a, i) => {
          const t = (angles[i] * Math.PI) / 180
          const x = Math.cos(t) * radius
          const y = Math.sin(t) * radius
          const hot = target === i
          // Reading order out, reverse order back.
          const delay = open ? i * 32 : (n - 1 - i) * 22
          return (
            <button
              key={a.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitem"
              aria-label={a.label}
              tabIndex={open && focusIdx === i ? 0 : -1}
              onClick={() => fire(i)}
              onKeyDown={(e) => onItemKey(e, i)}
              onPointerEnter={() => open && !gesture.current && setTarget(i)}
              onPointerLeave={() => open && !gesture.current && setTarget(null)}
              style={{
                transform: open
                  ? `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${hot ? 1.16 : 1})`
                  : `translate(-50%, -50%) rotate(-40deg) scale(.35)`,
                transitionDelay: `${delay}ms`,
              }}
              className={cn(
                'absolute top-0 left-0 flex size-11 items-center justify-center rounded-full outline-none',
                'transition-[transform,opacity,filter,box-shadow,background-color] duration-300 ease-[cubic-bezier(.22,1.4,.36,1)] motion-reduce:transition-opacity motion-reduce:duration-150',
                open ? 'pointer-events-auto opacity-100 blur-0' : 'opacity-0 blur-[2px] motion-reduce:blur-0',
                // Near-solid material: six moving items never stack blurs.
                hot
                  ? a.tone === 'danger'
                    ? 'bg-error text-on-color shadow-[0_8px_24px_-6px_var(--elevation-alpha-24)]'
                    : 'bg-(--text-base) text-(--background-base) shadow-[0_8px_24px_-6px_var(--elevation-alpha-24)]'
                  : cn('bg-base flyout focus-visible:borders-focus', a.tone === 'danger' ? 'text-error' : 'text-primary'),
              )}
            >
              {a.icon}
            </button>
          )
        })}

        {/* Label pill - springs to fit the targeted action / state. */}
        <span
          aria-hidden
          style={{
            transform: `translate(-50%, -50%) translate(${Math.cos(rad) * pillR}px, ${Math.sin(rad) * pillR}px) scale(${pill ? 1 : 0.8})`,
          }}
          className={cn(
            'absolute top-0 left-0 rounded-full bg-base/90 px-3 py-1.5 text-label-xsmall whitespace-nowrap text-primary flyout backdrop-blur-xl transition-[transform,opacity] duration-200 ease-[cubic-bezier(.22,1.4,.36,1)]',
            pill ? 'opacity-100' : 'opacity-0',
            done && 'text-success',
          )}
        >
          {pill ?? ''}
        </span>
      </div>

      {announce && (
        <span role="status" aria-live="polite" className="sr-only">
          {done ?? ''}
        </span>
      )}
    </div>
  )
}
