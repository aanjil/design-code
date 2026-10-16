import { useCallback, useMemo, useRef, useState } from 'react'

/**
 * Emma's cursor (bezel_7.html "agent cursor", ported): a second pointer that
 * drives the real app - moves to a target, haloes it, presses it with a
 * ripple, and the app responds exactly as if you had clicked. It carries the
 * AI gradient so it can never be mistaken for yours.
 *
 * Coordinates are relative to `ground` (the app column). While it drives, a
 * transparent veil sits over the app (under the bar) so your stray clicks
 * can't race it - "Take over" in the bar is the way in.
 */

export interface AgentCursorApi {
  show: () => void
  hide: () => void
  /** Bottom-centre, just above the bar - where the cursor appears from. */
  park: () => void
  /** Glide to an element (halo it) - or to `at` inside it, so the pointer
   *  never rests on an option it isn't choosing. */
  moveTo: (el: Element, label?: string, ms?: number, at?: Element | null) => void
  /** Press: tap animation + ripple, then the element's real click(). */
  press: (el: HTMLElement) => void
  /** Bring a target into view the way a person would - before moving. */
  scrollTo: (el: Element) => void
  clearHalo: () => void
}

interface CursorState {
  on: boolean
  x: number
  y: number
  label: string
  ms: number
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

const HALO = 'data-agent-halo'
/** Pointer shape (the prototype's path), shared by the outline and the fill. */
const POINTER = '2px 1.5px, 2px 18px, 6.2px 14.2px, 9px 20.5px, 12px 19.2px, 9.2px 13px, 15px 12.6px'

export function useAgentCursor(groundRef: React.RefObject<HTMLElement | null>) {
  const [cursor, setCursor] = useState<CursorState>({ on: false, x: -100, y: -100, label: 'Emma', ms: 900 })
  const [ripples, setRipples] = useState<Array<Ripple>>([])
  const ptrRef = useRef<HTMLDivElement>(null)
  const rippleId = useRef(0)

  const rel = useCallback(
    (el: Element) => {
      const r = el.getBoundingClientRect()
      const g = groundRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
      return { r, x: r.left - g.left, y: r.top - g.top }
    },
    [groundRef],
  )

  const clearHalo = useCallback(() => {
    document.querySelectorAll(`[${HALO}]`).forEach((n) => n.removeAttribute(HALO))
  }, [])

  const api = useMemo<AgentCursorApi>(
    () => ({
      show: () => setCursor((c) => ({ ...c, on: true })),
      hide: () => {
        setCursor((c) => ({ ...c, on: false }))
        clearHalo()
      },
      park: () => {
        const g = groundRef.current
        if (!g) return
        setCursor((c) => ({ ...c, ms: 0, x: g.clientWidth / 2 - 20, y: g.clientHeight - 120, label: 'Emma' }))
      },
      moveTo: (el, label, ms = 850, at) => {
        const { r, x, y } = rel(at ?? el)
        clearHalo()
        el.setAttribute(HALO, '')
        setCursor((c) => ({ ...c, ms, x: x + Math.min(r.width * 0.5, 26), y: y + r.height * 0.5, label: label ?? c.label }))
      },
      press: (el) => {
        ptrRef.current?.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(.74)' }, { transform: 'scale(1)' }],
          { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' },
        )
        const { r, x, y } = rel(el)
        const size = Math.max(r.width, r.height)
        const id = ++rippleId.current
        setRipples((rs) => [...rs, { id, x: x + r.width / 2 - size / 2, y: y + r.height / 2 - size / 2, size }])
        window.setTimeout(() => setRipples((rs) => rs.filter((p) => p.id !== id)), 640)
        window.setTimeout(() => {
          el.click()
          clearHalo()
        }, 220)
      },
      scrollTo: (el) => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setCursor((c) => ({ ...c, label: 'scrolling' }))
      },
      clearHalo,
    }),
    [groundRef, rel, clearHalo],
  )

  const layer = (
    <>
      <style>{`[${HALO}]{outline:2px solid var(--brand-primary) !important;outline-offset:2px;transition:outline-color .3s}`}</style>
      {/* Veil: under the bar (z-30), over the app. */}
      {cursor.on && <div aria-hidden className="absolute inset-0 z-[25] cursor-progress" />}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
        {ripples.map((p) => (
          <span
            key={p.id}
            ref={(n) => {
              n?.animate(
                [
                  { transform: 'scale(.3)', opacity: 0.85 },
                  { transform: 'scale(2.4)', opacity: 0 },
                ],
                { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' },
              )
            }}
            className="absolute rounded-full border-2 border-brand"
            style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          />
        ))}
        <div
          className="absolute top-0 left-0"
          style={{
            opacity: cursor.on ? 1 : 0,
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            transition: `transform ${cursor.ms}ms cubic-bezier(.5,.02,.24,1), opacity 300ms ease`,
          }}
        >
          <div ref={ptrRef} className="relative size-5" style={{ filter: 'drop-shadow(0 3px 6px var(--elevation-alpha-brand-48))' }}>
            {/* Halo: a soft gradient glow under the tip - Emma is here. */}
            <span className="absolute -top-2.5 -left-2.5 size-6 animate-pulse rounded-full bg-niural-ai-colors-gradient opacity-30 blur-[6px]" />
            {/* White outline, then the AI gradient clipped to the pointer. */}
            <svg width="20" height="22" viewBox="0 0 20 22" className="absolute top-0 left-0 overflow-visible">
              <path d="M2 1.5 L2 18 L6.2 14.2 L9 20.5 L12 19.2 L9.2 13 L15 12.6 Z" strokeWidth="2.8" strokeLinejoin="round" className="fill-white stroke-white" />
            </svg>
            <span className="absolute inset-0 bg-niural-ai-colors-gradient" style={{ clipPath: `polygon(${POINTER})` }} />
            <span className="absolute top-4 left-[18px] rounded-snug bg-niural-ai-colors-gradient px-1.5 py-1 font-mono text-caption-xs font-medium whitespace-nowrap text-on-color elevation-tooltip">
              {cursor.label}
            </span>
          </div>
        </div>
      </div>
    </>
  )

  return { api, layer, driving: cursor.on }
}
