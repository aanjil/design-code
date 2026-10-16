import { useContext, useEffect, useMemo, type ReactNode } from 'react'
import { EmmaBus, globalEmmaBus, pointer } from './bus'
import { EmmaBusContext } from './emma-avatar'
import type { EmmaState } from './sim'

/**
 * Ambient feedback: Emma notices what you are doing on the page without you
 * talking to her - and says so with her face, never with a popup.
 *
 *   - you go quiet          → she gets drowsy, then sleeps; any input wakes her (a startled hop)
 *   - you type in a field   → she listens, looks at the field, flicks her eyes with each keystroke
 *   - you select text       → she thinks (she could explain it)
 *   - a field fails validation → concern: a shake, amber halo, looking + pointing at it
 *   - you hover a hotspot   → `data-emma` on any element decides how she reacts:
 *       look       look at it
 *       point      look, and reach a cell toward it
 *       caution    attention (amber, wide eyes) + point - risky change ahead
 *       curious    thinking - there is something she knows about this
 *       celebrate  look; clicking it makes her celebrate
 *
 * Moods only apply while an avatar's own `state` is `idle`; the app's
 * state (working, speaking, …) always wins. Scope: the subtree under
 * `root` (default: the whole document).
 */
export function EmmaAmbient({
  children,
  root,
  sleepAfter = 45_000,
  typing = true,
  selection = true,
  hotspots = true,
  validation = true,
  isolated = false,
}: {
  children?: ReactNode
  /** Only react to things inside this element. Default: the whole document. */
  root?: React.RefObject<HTMLElement | null>
  /** ms of no input before she sleeps; 0 never. Default 45s. */
  sleepAfter?: number
  typing?: boolean
  selection?: boolean
  hotspots?: boolean
  validation?: boolean
  /** A private channel for this subtree instead of the page-wide one. */
  isolated?: boolean
}) {
  const parent = useContext(EmmaBusContext)
  const bus = useMemo(() => (isolated ? new EmmaBus() : parent), [isolated, parent])

  useEffect(() => {
    const scope = () => root?.current ?? document.documentElement
    const inScope = (n: EventTarget | null): n is Element => n instanceof Element && scope().contains(n)
    const offs: Array<() => void> = []
    const on = <K extends keyof DocumentEventMap>(type: K, fn: (e: DocumentEventMap[K]) => void, capture = true) => {
      document.addEventListener(type, fn, capture)
      offs.push(() => document.removeEventListener(type, fn, capture))
    }

    // ── idle → sleep, input → wake ───────────────────────────────────────
    let lastActive = performance.now()
    let asleep = false
    const wake = () => {
      lastActive = performance.now()
      if (asleep) {
        asleep = false
        bus.setMood('idle', null)
      }
    }
    on('pointermove', wake)
    on('pointerdown', wake)
    on('keydown', wake)
    on('wheel', wake)
    const timer = window.setInterval(() => {
      if (!sleepAfter || asleep) return
      if (performance.now() - lastActive > sleepAfter) {
        asleep = true
        bus.setMood('idle', 'sleeping')
      }
    }, 500)
    offs.push(() => window.clearInterval(timer))

    // ── typing: listen, look at the field, glimpse per keystroke ─────────
    const isField = (n: Element) => n.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, [contenteditable="true"]')
    if (typing) {
      on('focusin', (e) => {
        if (inScope(e.target) && isField(e.target)) bus.setMood('typing', 'listening', e.target)
      })
      on('focusout', (e) => {
        if (inScope(e.target) && isField(e.target)) bus.setMood('typing', null)
      })
      on('input', (e) => {
        if (inScope(e.target) && isField(e.target)) bus.react('glimpse')
      })
    }

    // ── selection: something worth explaining ────────────────────────────
    if (selection) {
      on('selectionchange', () => {
        const sel = document.getSelection()
        const text = sel?.toString().trim() ?? ''
        const node = sel?.anchorNode?.parentElement ?? null
        if (text.length > 2 && sel && sel.rangeCount && node && inScope(node) && !isField(node)) {
          const r = sel.getRangeAt(0).getBoundingClientRect()
          bus.setMood('selection', 'thinking', { x: r.left + r.width / 2, y: r.top + r.height / 2 })
        } else bus.setMood('selection', null)
      })
    }

    // ── hotspots: data-emma on any element ───────────────────────────────
    if (hotspots) {
      let current: Element | null = null
      const moodFor: Record<string, EmmaState> = { look: 'idle', point: 'idle', celebrate: 'idle', caution: 'attention', curious: 'thinking' }
      on('pointerover', (e) => {
        const hot = e.target instanceof Element ? e.target.closest('[data-emma]') : null
        if (hot === current) return
        current = hot && inScope(hot) ? hot : null
        if (!current) return bus.setMood('hotspot', null)
        const kind = current.getAttribute('data-emma') ?? 'look'
        bus.setMood('hotspot', moodFor[kind] ?? 'idle', current, kind === 'point' || kind === 'caution')
      })
      on('click', (e) => {
        const hot = e.target instanceof Element ? e.target.closest('[data-emma="celebrate"]') : null
        if (hot && inScope(hot)) bus.react('celebrate')
      })
      // Leaving the window drops the hotspot.
      const leave = () => {
        if (!pointer.inside && current) {
          current = null
          bus.setMood('hotspot', null)
        }
      }
      document.documentElement.addEventListener('pointerleave', leave)
      offs.push(() => document.documentElement.removeEventListener('pointerleave', leave))
    }

    // ── validation: a field said no ──────────────────────────────────────
    if (validation) {
      let clearAt = 0
      on('invalid', (e) => {
        if (!inScope(e.target)) return
        bus.react('concern')
        bus.setMood('app', 'attention', e.target, true)
        window.clearTimeout(clearAt)
        clearAt = window.setTimeout(() => bus.setMood('app', null), 2200)
      })
      offs.push(() => window.clearTimeout(clearAt))
    }

    return () => {
      offs.forEach((off) => off())
      bus.clear()
    }
  }, [bus, root, sleepAfter, typing, selection, hotspots, validation])

  return isolated ? <EmmaBusContext.Provider value={bus}>{children}</EmmaBusContext.Provider> : <>{children}</>
}

/**
 * Talk to every Emma on the page (or in the nearest isolated `<EmmaAmbient>`):
 *
 *   const emma = useEmma()
 *   emma.react('celebrate')               // payroll approved
 *   emma.lookAt(fieldEl)                  // "it's this one" - she looks and points
 *   emma.setMood('app', 'attention', el)  // hold a mood until you clear it
 */
export function useEmma(): EmmaBus {
  return useContext(EmmaBusContext) ?? globalEmmaBus
}
