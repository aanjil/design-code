import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Broom,
  Camera,
  ChatTeardropText,
  Check,
  CornersIn,
  CornersOut,
  Cursor,
  FrameCorners,
  Hand,
  Image as ImageIcon,
  Lock,
  Minus,
  Play,
  Plus,
  Warning,
} from '@phosphor-icons/react'
import { toBlob } from 'html-to-image'
import { PinMarker } from './canvas-pins'
import { useCanvasPins } from './canvas-pins-context'
import { CanvasRulers } from './canvas-rulers'
import { WindowsPanel } from './windows-panel'
import { PortalContainerContext } from '@/components/ui/portal-context'
import { cn } from '@/lib/utils'

/**
 * Craft canvas: a zoomable, pannable blueprint surface (Figma-style)
 * holding Safari-style browser windows - drag via titlebar, resize via
 * corner, double-click the titlebar (or green light / corners button) to
 * present one window at ~98vw/98vh. Rulers + per-window dimension readouts,
 * a top-right windows panel with DOM snapshots, and click-placed design-note
 * pins that feed the dock's Notes sheet. Popovers portal INSIDE each window
 * (see ui/portal-context) so they scale with the canvas zoom.
 */

export interface CanvasWindowDef {
  id: string
  title: string
  url: string
  x: number
  y: number
  width: number
  height: number
  content: React.ReactNode
  /** 'browser' (default) - Safari-style chrome, `content` fills the window.
   *  'phone' - the title bar/drag/utility buttons stay identical, but the
   *  content area renders a device bezel + Dynamic Island around `content`
   *  instead of filling it directly. `width`/`height` must already include
   *  the bezel (see PHONE_BEZEL/phoneFrameSize) - canvas.tsx has no opinion
   *  on device screen size, only on how the bezel itself looks. */
  chrome?: 'browser' | 'phone'
}

/** Bezel thickness in px around a phone screen's real content area - the
 *  gap between a phone-chrome window's outer frame and the visible screen. */
export const PHONE_BEZEL = 14

/** Given a device's own screen size in points, the CanvasWindowDef
 *  width/height a phone-chrome window needs (screen + bezel + the header
 *  bar every window already reserves) so the rendered screen ends up
 *  pixel-accurate to the real device. */
export function phoneFrameSize(screenWidth: number, screenHeight: number): { width: number; height: number } {
  return {
    width: screenWidth + PHONE_BEZEL * 2,
    height: screenHeight + PHONE_BEZEL * 2 + 36, // 36 = the h-9 title bar every window reserves
  }
}

/** html-to-image's own promise can hang indefinitely (e.g. a blocked remote
 *  font fetch during its embed step) - race it against a hard timeout so a
 *  screenshot attempt can never permanently disable the trigger button. */
function captureWithTimeout(
  node: HTMLElement,
  options: Parameters<typeof toBlob>[1],
  timeoutMs: number,
): Promise<Blob | null> {
  return Promise.race([
    toBlob(node, options),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('screenshot capture timed out')), timeoutMs)
    }),
  ])
}

/**
 * `backdrop-filter` (the Sidebar's frosted-glass background) can hang
 * html-to-image's foreignObject-based rasterizer indefinitely - it has no
 * well-defined way to composite "blur whatever's behind me" into a still
 * SVG snapshot. Temporarily force it off on every matching descendant for
 * the duration of the capture, then restore each element's own inline
 * value exactly (most have none, so this cleanly removes the override).
 */
async function withoutBackdropFilter<T>(root: HTMLElement, run: () => Promise<T>): Promise<T> {
  const affected: Array<{ el: HTMLElement; prev: string }> = []
  for (const el of [root, ...root.querySelectorAll('*')] as Array<HTMLElement>) {
    if (getComputedStyle(el).backdropFilter !== 'none') {
      affected.push({ el, prev: el.style.backdropFilter })
      el.style.backdropFilter = 'none'
    }
  }
  try {
    return await run()
  } finally {
    for (const { el, prev } of affected) el.style.backdropFilter = prev
  }
}

/** Figma-style section: a labeled container drawn under its member windows. */
export interface CanvasGroupDef {
  id: string
  label: string
  windowIds: Array<string>
  /** Renders a Play button inline with the group label (e.g. the "App" group). */
  onPlay?: () => void
}

interface WindowGeometry {
  x: number
  y: number
  width: number
  height: number
  z: number
}

interface SnapshotDef {
  id: string
  title: string
  url: string
  html: string
}

const MIN_WIDTH = 480
const MIN_HEIGHT = 320
const SURFACE_W = 4000
const SURFACE_H = 2400
const TIDY_GAP = 48
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const ZOOM_STEP = 1.25
const MINIMAP_W = 176

const clampZoomTo = (z: number, minZoom: number) =>
  Math.min(MAX_ZOOM, Math.max(minZoom, z))

/* Blueprint grid: fine 20px lines + stronger 100px majors, token-driven. */
const BLUEPRINT_BG: React.CSSProperties = {
  backgroundImage: [
    'linear-gradient(var(--border-base) 1px, transparent 1px)',
    'linear-gradient(90deg, var(--border-base) 1px, transparent 1px)',
    'linear-gradient(var(--border-highlight) 1px, transparent 1px)',
    'linear-gradient(90deg, var(--border-highlight) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
}

export function PlaygroundCanvas({
  windows,
  className,
  onFullscreenChange,
  groups,
  focusWindow,
  requestFullscreen,
  exitFullscreenRequest,
  onFocusChange,
  onZenModeChange,
  showRulers = true,
  surfaceW = SURFACE_W,
  surfaceH = SURFACE_H,
  minZoom = MIN_ZOOM,
  reservedLeft = 0,
  reservedRight = 0,
}: {
  windows: Array<CanvasWindowDef>
  className?: string
  onFullscreenChange?: (active: boolean) => void
  /** Figma-style labeled sections drawn under (and dragging) their windows. */
  groups?: Array<CanvasGroupDef>
  /** Imperative focus request: bump `nonce` to re-fit the same window. */
  focusWindow?: { id: string; nonce: number } | null
  /** Imperative "present this window fullscreen" request (e.g. Play). */
  requestFullscreen?: { id: string; nonce: number } | null
  /** Imperative "exit whatever is presenting fullscreen" request (e.g. Exit button). */
  exitFullscreenRequest?: { nonce: number } | null
  /** Fires whenever a window is focused directly on the canvas. */
  onFocusChange?: (id: string) => void
  /** Fires whenever zen mode (Space) toggles, for chrome outside the canvas. */
  onZenModeChange?: (active: boolean) => void
  /** Show/hide the edge rulers (Settings popover toggle). */
  showRulers?: boolean
  surfaceW?: number
  surfaceH?: number
  minZoom?: number
  /**
   * Fixed-chrome width (px) to keep clear when centering/fitting, so
   * content never lands behind a floating side panel.
   */
  reservedLeft?: number
  reservedRight?: number
}) {
  const clampZoom = useCallback(
    (z: number) => clampZoomTo(z, minZoom),
    [minZoom],
  )
  const scrollerRef = useRef<HTMLDivElement>(null)
  const zCounter = useRef(windows.length)
  const [geometry, setGeometry] = useState<Record<string, WindowGeometry>>(() =>
    Object.fromEntries(
      windows.map((w, i) => [
        w.id,
        { x: w.x, y: w.y, width: w.width, height: w.height, z: i + 1 },
      ]),
    ),
  )
  const [focusedId, setFocusedId] = useState<string | null>(
    windows[0]?.id ?? null,
  )
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  zoomRef.current = zoom
  const pendingScroll = useRef<{ left: number; top: number } | null>(null)
  const [viewport, setViewport] = useState({ left: 0, top: 0, cw: 0, ch: 0 })

  /* ---------- snapshots ---------- */

  const [snapshots, setSnapshots] = useState<Array<SnapshotDef>>([])
  const snapCounter = useRef(0)
  const contentEls = useRef<Map<string, HTMLElement>>(new Map())

  /* ---------- pins (design notes) ---------- */

  const {
    pins,
    addPin,
    removePin: removePinCtx,
    removePinsForWindow,
    updatePinText,
    openPinId,
    setOpenPinId,
    jumpRequest,
  } = useCanvasPins()
  /** Figma-style exclusive tool: cursor (default) / hand (pan) / annotate. */
  const [tool, setTool] = useState<'cursor' | 'hand' | 'annotate'>('cursor')
  const annotateMode = tool === 'annotate'
  const [zenModeState, setZenModeState] = useState(false)
  const setZenMode = useCallback(
    (updater: boolean | ((prev: boolean) => boolean)) => {
      setZenModeState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        onZenModeChange?.(next)
        return next
      })
    },
    [onZenModeChange],
  )
  const zenMode = zenModeState
  const [isPanning, setIsPanning] = useState(false)
  /** Live DOM elements behind 'element' pins (⌘-click); measured each render. */
  const pinEls = useRef<Map<string, Element>>(new Map())
  const [measureTick, setMeasureTick] = useState(0)
  const surfaceRef = useRef<HTMLDivElement>(null)

  /** Windows + frozen snapshot windows, rendered identically. */
  const combined = useMemo(
    () => [
      ...windows.map((w) => ({ ...w, kind: 'window' as const })),
      ...snapshots.map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        kind: 'snapshot' as const,
        content: (
          <div
            className="pointer-events-none select-none"
            dangerouslySetInnerHTML={{ __html: s.html }}
          />
        ),
      })),
    ],
    [windows, snapshots],
  )

  /* ---------- window state ---------- */

  // Set while an external focusWindow request is driving bringToFront, so
  // that call doesn't echo back into onFocusChange - the explorer already
  // knows what it just asked for; echoing resets its stateId and creates
  // an infinite explorer <-> canvas focus loop (see focusWindow effect below).
  const suppressFocusEcho = useRef(false)

  const bringToFront = useCallback(
    (id: string) => {
      setFocusedId(id)
      zCounter.current += 1
      const z = zCounter.current
      setGeometry((prev) => ({ ...prev, [id]: { ...prev[id], z } }))
      if (!suppressFocusEcho.current) onFocusChange?.(id)
    },
    [onFocusChange],
  )

  const updateGeometry = useCallback(
    (id: string, patch: Partial<WindowGeometry>) => {
      setGeometry((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
    },
    [],
  )

  const toggleFullscreen = useCallback((id: string) => {
    setFullscreenId((prev) => (prev === id ? null : id))
  }, [])

  useEffect(() => {
    onFullscreenChange?.(fullscreenId !== null)
  }, [fullscreenId, onFullscreenChange])

  const setContentEl = useCallback((id: string, el: HTMLElement | null) => {
    if (el) contentEls.current.set(id, el)
    else contentEls.current.delete(id)
  }, [])

  /** Freeze the window's current DOM (incl. open popovers) as a new window. */
  const takeSnapshot = useCallback(
    (id: string) => {
      const el = contentEls.current.get(id)
      const src = windows.find((w) => w.id === id)
      const g = geometryRef.current[id]
      if (!el || !src || !g) return
      snapCounter.current += 1
      const snapId = `snap-${snapCounter.current}`
      setSnapshots((prev) => [
        ...prev,
        {
          id: snapId,
          title: `Snap ${snapCounter.current} · ${src.title.split('-')[0]?.trim()}`,
          url: src.url,
          html: el.innerHTML,
        },
      ])
      zCounter.current += 1
      setGeometry((prev) => ({
        ...prev,
        [snapId]: {
          x: g.x + 64,
          y: g.y + 64,
          width: g.width,
          height: g.height,
          z: zCounter.current,
        },
      }))
      setFocusedId(snapId)
    },
    [windows],
  )

  const removeSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id))
    setGeometry((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    pins.forEach((p) => {
      if (p.windowId === id) pinEls.current.delete(p.id)
    })
    removePinsForWindow(id)
    setFocusedId((prev) => (prev === id ? null : prev))
    setFullscreenId((prev) => (prev === id ? null : prev))
    setOpenPinId(null)
  }, [pins, removePinsForWindow, setOpenPinId])

  /** Bring a window to front and smooth-scroll the viewport onto it. */
  const jumpTo = useCallback(
    (id: string) => {
      bringToFront(id)
      const scroller = scrollerRef.current
      const g = geometryRef.current[id]
      if (!scroller || !g) return
      const z = zoomRef.current
      scroller.scrollTo({
        left: (g.x + g.width / 2) * z - scroller.clientWidth / 2,
        top: (g.y + g.height / 2) * z - scroller.clientHeight / 2,
        behavior: 'smooth',
      })
    },
    [bringToFront],
  )

  /* ---------- zoom ---------- */

  /** Zoom keeping a screen point (relative to scroller) fixed. */
  const zoomAt = useCallback((nextZoom: number, sx?: number, sy?: number) => {
    const scroller = scrollerRef.current
    const prevZoom = zoomRef.current
    const target = clampZoom(nextZoom)
    if (!scroller || target === prevZoom) return
    const px = sx ?? scroller.clientWidth / 2
    const py = sy ?? scroller.clientHeight / 2
    const logicalX = (scroller.scrollLeft + px) / prevZoom
    const logicalY = (scroller.scrollTop + py) / prevZoom
    pendingScroll.current = {
      left: logicalX * target - px,
      top: logicalY * target - py,
    }
    setZoom(target)
  }, [])

  // apply scroll correction after the zoomed extent has rendered
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || !pendingScroll.current) return
    scroller.scrollLeft = pendingScroll.current.left
    scroller.scrollTop = pendingScroll.current.top
    pendingScroll.current = null
    syncViewport()
  }, [zoom])

  const fitToContent = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const rects = Object.values(geometryRef.current)
    if (rects.length === 0) return
    const pad = 48
    const minX = Math.min(...rects.map((r) => r.x)) - pad
    const minY = Math.min(...rects.map((r) => r.y)) - pad
    const maxX = Math.max(...rects.map((r) => r.x + r.width)) + pad
    const maxY = Math.max(...rects.map((r) => r.y + r.height)) + pad
    const contentW = maxX - minX
    const contentH = maxY - minY
    const availW = Math.max(1, scroller.clientWidth - reservedLeft - reservedRight)
    const availH = scroller.clientHeight
    const target = clampZoom(Math.min(availW / contentW, availH / contentH))
    // center the fitted content in whichever axis has leftover space,
    // instead of pinning it to the top-left of the viewport.
    pendingScroll.current = {
      left: minX * target - reservedLeft - (availW - contentW * target) / 2,
      top: minY * target - (availH - contentH * target) / 2,
    }
    if (target === zoomRef.current) syncScrollNow()
    else setZoom(target)
  }, [reservedLeft, reservedRight])

  // fit needs latest geometry without re-creating callbacks
  const geometryRef = useRef(geometry)
  geometryRef.current = geometry

  function syncScrollNow() {
    const scroller = scrollerRef.current
    if (scroller && pendingScroll.current) {
      scroller.scrollLeft = pendingScroll.current.left
      scroller.scrollTop = pendingScroll.current.top
      pendingScroll.current = null
    }
  }

  /** Arrange windows in a centered left→right row (wraps if needed), then refit. */
  const tidyUp = useCallback(() => {
    const entries = Object.entries(geometryRef.current).sort(
      ([, a], [, b]) => a.x - b.x || a.y - b.y,
    )
    if (entries.length === 0) return
    const totalW =
      entries.reduce((sum, [, g]) => sum + g.width, 0) +
      TIDY_GAP * (entries.length - 1)
    const rowH = Math.max(...entries.map(([, g]) => g.height))
    let x = Math.max(TIDY_GAP, (surfaceW - totalW) / 2)
    let y = Math.max(TIDY_GAP, (surfaceH - rowH) / 2)
    setGeometry((prev) => {
      const next = { ...prev }
      for (const [id, g] of entries) {
        if (x > TIDY_GAP && x + g.width > surfaceW - TIDY_GAP) {
          x = TIDY_GAP
          y += rowH + TIDY_GAP
        }
        next[id] = { ...next[id], x, y }
        x += g.width + TIDY_GAP
      }
      return next
    })
    requestAnimationFrame(() => fitToContent())
  }, [fitToContent])

  /* ---------- viewport tracking (minimap + rulers) ---------- */

  const syncViewport = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    setViewport({
      left: scroller.scrollLeft,
      top: scroller.scrollTop,
      cw: scroller.clientWidth,
      ch: scroller.clientHeight,
    })
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    syncViewport()
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(syncViewport)
    }
    scroller.addEventListener('scroll', onScroll)
    const observer = new ResizeObserver(syncViewport)
    observer.observe(scroller)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [syncViewport])

  // center the initial view on the windows
  const didCenter = useRef(false)
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (didCenter.current || !scroller) return
    didCenter.current = true
    const rects = Object.values(geometryRef.current)
    if (rects.length === 0) return
    const minX = Math.min(...rects.map((r) => r.x))
    const minY = Math.min(...rects.map((r) => r.y))
    const maxX = Math.max(...rects.map((r) => r.x + r.width))
    const maxY = Math.max(...rects.map((r) => r.y + r.height))
    const z = zoomRef.current
    const availW = Math.max(1, scroller.clientWidth - reservedLeft - reservedRight)
    scroller.scrollLeft = ((minX + maxX) / 2) * z - reservedLeft - availW / 2
    scroller.scrollTop = ((minY + maxY) / 2) * z - scroller.clientHeight / 2
    syncViewport()
  }, [syncViewport, reservedLeft, reservedRight])

  /* ---------- wheel + keyboard ---------- */

  const fullscreenRef = useRef(fullscreenId)
  fullscreenRef.current = fullscreenId

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    // React's synthetic wheel handlers are passive - bind manually.
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey) || fullscreenRef.current) return
      e.preventDefault()
      const rect = scroller.getBoundingClientRect()
      const factor = Math.exp(-e.deltaY * 0.01)
      zoomAt(
        zoomRef.current * factor,
        e.clientX - rect.left,
        e.clientY - rect.top,
      )
    }
    scroller.addEventListener('wheel', onWheel, { passive: false })
    return () => scroller.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const annotateRef = useRef(annotateMode)
  annotateRef.current = annotateMode
  const openPinRef = useRef(openPinId)
  openPinRef.current = openPinId
  const zenRef = useRef(zenMode)
  zenRef.current = zenMode
  const focusedRef = useRef(focusedId)
  focusedRef.current = focusedId
  const combinedIdsRef = useRef<Array<string>>([])
  useEffect(() => {
    combinedIdsRef.current = combined.map((w) => w.id)
  }, [combined])

  /** Zoom + scroll so one window fills the viewport (with padding). */
  const fitToWindow = useCallback((id: string) => {
    const scroller = scrollerRef.current
    const g = geometryRef.current[id]
    if (!scroller || !g || scroller.clientWidth === 0) return
    const pad = 40
    const availW = Math.max(1, scroller.clientWidth - reservedLeft - reservedRight)
    const target = clampZoom(
      Math.min(
        availW / (g.width + pad * 2),
        scroller.clientHeight / (g.height + pad * 2),
      ),
    )
    pendingScroll.current = {
      left: (g.x + g.width / 2) * target - reservedLeft - availW / 2,
      top: (g.y + g.height / 2) * target - scroller.clientHeight / 2,
    }
    if (target === zoomRef.current) syncScrollNow()
    else setZoom(target)
  }, [reservedLeft, reservedRight])

  // explorer panels (or any overlay) request focus by bumping the nonce
  useEffect(() => {
    if (!focusWindow) return
    const id = focusWindow.id
    if (!geometryRef.current[id]) return
    suppressFocusEcho.current = true
    bringToFront(id)
    suppressFocusEcho.current = false
    // defer one frame: on first mount the scroller can measure 0 wide,
    // which would clamp the fit zoom to the minimum
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      const scroller = scrollerRef.current
      if (scroller && scroller.clientWidth > 0) {
        fitToWindow(id)
      } else {
        raf2 = requestAnimationFrame(() => fitToWindow(id))
      }
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusWindow?.id, focusWindow?.nonce])

  /** Drag a whole group: move every member window by the pointer delta. */
  const dragGroup = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, windowIds: Array<string>) => {
      if (e.button !== 0 || fullscreenRef.current) return
      e.preventDefault()
      e.stopPropagation()
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      const startX = e.clientX
      const startY = e.clientY
      const starts = windowIds.map((id) => ({
        id,
        g: geometryRef.current[id],
      }))
      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / zoomRef.current
        const dy = (ev.clientY - startY) / zoomRef.current
        setGeometry((prev) => {
          const next = { ...prev }
          for (const { id, g } of starts) {
            if (g) next[id] = { ...next[id], x: g.x + dx, y: g.y + dy }
          }
          return next
        })
      }
      const up = () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerup', up)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerup', up)
    },
    [],
  )

  /** `n` / `shift+n`: focus the next/previous window and fit it on screen. */
  const cycleWindow = useCallback(
    (dir: 1 | -1) => {
      const ids = combinedIdsRef.current
      if (ids.length === 0) return
      const idx = ids.indexOf(focusedRef.current ?? '')
      const next = ids[(idx + dir + ids.length) % ids.length]
      bringToFront(next)
      fitToWindow(next)
    },
    [bringToFront, fitToWindow],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inEditable = !!target?.closest(
        'input, textarea, select, [contenteditable="true"]',
      )

      if (e.code === 'Space' && !e.metaKey && !e.ctrlKey && !e.altKey && !inEditable) {
        e.preventDefault()
        setZenMode((v) => !v)
        return
      }

      // Shift+2: fit all windows (Figma-style; matches the zoom control's icon)
      if (e.key === '2' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (inEditable || fullscreenRef.current) return
        e.preventDefault()
        fitToContent()
        return
      }

      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (inEditable || fullscreenRef.current) return
        e.preventDefault()
        cycleWindow(e.shiftKey ? -1 : 1)
        return
      }
      if (e.key === 'Escape') {
        if (openPinRef.current) {
          setOpenPinId(null)
          return
        }
        if (annotateRef.current) {
          setTool('cursor')
          return
        }
        if (fullscreenRef.current) toggleFullscreen(fullscreenRef.current)
        return
      }
      if (!(e.metaKey || e.ctrlKey) || fullscreenRef.current) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        zoomAt(zoomRef.current * ZOOM_STEP)
      } else if (e.key === '-') {
        e.preventDefault()
        zoomAt(zoomRef.current / ZOOM_STEP)
      } else if (e.key === '0') {
        e.preventDefault()
        zoomAt(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cycleWindow, toggleFullscreen, zoomAt, fitToContent])

  /* ---------- pins ---------- */

  // re-measure element pins when anything scrolls inside a window
  useEffect(() => {
    const surf = surfaceRef.current
    if (!surf) return
    const onAnyScroll = () => setMeasureTick((t) => t + 1)
    surf.addEventListener('scroll', onAnyScroll, true)
    return () => surf.removeEventListener('scroll', onAnyScroll, true)
  }, [])

  const resolvedPins = useMemo(() => {
    void measureTick
    void viewport
    const surf = surfaceRef.current
    return pins.flatMap((pin) => {
      // element pins: measure the live DOM node while it exists
      if (pin.kind === 'element' && surf) {
        const el = pinEls.current.get(pin.id)
        if (el?.isConnected) {
          const rect = el.getBoundingClientRect()
          const surfRect = surf.getBoundingClientRect()
          return [
            {
              pin,
              ax: (rect.left - surfRect.left) / zoom,
              ay: (rect.top - surfRect.top) / zoom,
              rw: rect.width / zoom,
              rh: rect.height / zoom,
            },
          ]
        }
      }
      if (!pin.windowId)
        return [{ pin, ax: pin.rx, ay: pin.ry, rw: pin.rw, rh: pin.rh }]
      const g = geometry[pin.windowId]
      if (!g) return []
      return [
        { pin, ax: g.x + pin.rx, ay: g.y + pin.ry, rw: pin.rw, rh: pin.rh },
      ]
    })
  }, [pins, geometry, zoom, viewport, measureTick])

  /** ⌘/Ctrl-click a DOM element inside a window → region pin with highlight. */
  const createElementPin = useCallback(
    (windowId: string, el: Element) => {
      const surf = surfaceRef.current
      const g = geometryRef.current[windowId]
      if (!surf || !g) return
      const z = zoomRef.current
      const rect = el.getBoundingClientRect()
      const surfRect = surf.getBoundingClientRect()
      const lx = (rect.left - surfRect.left) / z
      const ly = (rect.top - surfRect.top) / z
      const id = addPin({
        kind: 'element',
        windowId,
        rx: lx - g.x,
        ry: ly - g.y,
        rw: rect.width / z,
        rh: rect.height / z,
        text: '',
      })
      pinEls.current.set(id, el)
      setOpenPinId(id)
    },
    [addPin, setOpenPinId],
  )

  /** Wraps the shared removePin so we also drop the ⌘-click DOM ref. */
  const handleRemovePin = useCallback(
    (id: string) => {
      pinEls.current.delete(id)
      removePinCtx(id)
    },
    [removePinCtx],
  )

  /** Center the viewport on a pin and open its card (panel row click). */
  const jumpToPin = useCallback(
    (id: string) => {
      const scroller = scrollerRef.current
      const resolved = resolvedPins.find((r) => r.pin.id === id)
      if (!scroller || !resolved) return
      const z = zoomRef.current
      scroller.scrollTo({
        left: resolved.ax * z - scroller.clientWidth / 2,
        top: resolved.ay * z - scroller.clientHeight / 2,
        behavior: 'smooth',
      })
      setOpenPinId(id)
    },
    [resolvedPins, setOpenPinId],
  )

  // an external panel (e.g. the explorer's Notes tab) requests a jump by
  // bumping jumpRequest — mirrors the focusWindow pattern above.
  useEffect(() => {
    if (!jumpRequest) return
    jumpToPin(jumpRequest.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpRequest?.id, jumpRequest?.nonce])

  const onSurfaceCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!(e.metaKey || e.ctrlKey) || fullscreenRef.current) return
      const target = e.target as HTMLElement
      if (!target.closest('[data-window-content]')) return
      const section = target.closest('[data-window-id]')
      if (!section) return
      e.preventDefault()
      e.stopPropagation()
      createElementPin(section.getAttribute('data-window-id')!, target)
    },
    [createElementPin],
  )

  function placePin(e: React.PointerEvent<HTMLDivElement>) {
    if (e.metaKey || e.ctrlKey) return // ⌘-clicks are element pins (capture phase)
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const lx = (e.clientX - rect.left) / zoom
    const ly = (e.clientY - rect.top) / zoom
    // clicking near an existing pin opens it instead of stacking a new one
    const near = resolvedPins.find(
      (r) => Math.hypot(r.ax - lx, r.ay - ly) < 14 / zoom,
    )
    if (near) {
      setOpenPinId(near.pin.id)
      return
    }
    // click-away from an open card closes it before placing anything new
    if (openPinId) {
      setOpenPinId(null)
      return
    }
    const hit = combined
      .map((w) => ({ id: w.id, g: geometry[w.id] }))
      .filter(
        ({ g }) =>
          g &&
          lx >= g.x &&
          lx <= g.x + g.width &&
          ly >= g.y &&
          ly <= g.y + g.height,
      )
      .sort((a, b) => b.g.z - a.g.z)[0]
    const id = addPin(
      hit
        ? { kind: 'point', windowId: hit.id, rx: lx - hit.g.x, ry: ly - hit.g.y, text: '' }
        : { kind: 'point', windowId: null, rx: lx, ry: ly, text: '' },
    )
    setOpenPinId(id)
  }

  /** Figma-style click-drag-to-pan on empty canvas background. */
  const onBackgroundPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (tool !== 'hand' || fullscreenRef.current) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey) return
      const targetEl = e.target as HTMLElement
      if (targetEl.closest('[data-window-id], [data-pin-marker]')) return
      const scroller = scrollerRef.current
      if (!scroller) return
      e.preventDefault()
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      const startX = e.clientX
      const startY = e.clientY
      const startLeft = scroller.scrollLeft
      const startTop = scroller.scrollTop
      setIsPanning(true)
      const move = (ev: PointerEvent) => {
        scroller.scrollLeft = startLeft - (ev.clientX - startX)
        scroller.scrollTop = startTop - (ev.clientY - startY)
      }
      const up = () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerup', up)
        setIsPanning(false)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerup', up)
    },
    [tool],
  )

  // an external Exit button requests leaving whatever is presenting fullscreen
  useEffect(() => {
    if (!exitFullscreenRequest) return
    setFullscreenId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitFullscreenRequest?.nonce])

  // an external Play button requests presenting a window fullscreen
  useEffect(() => {
    if (!requestFullscreen) return
    const id = requestFullscreen.id
    if (!geometryRef.current[id]) return
    bringToFront(id)
    setFullscreenId(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestFullscreen?.id, requestFullscreen?.nonce])

  /* ---------- fullscreen geometry (inside the scaled layer) ---------- */

  // The window stays mounted in the scaled layer (preserves its state);
  // an inverse transform makes it render crisp at screen scale.
  const fullscreenStyle: React.CSSProperties | undefined = fullscreenId
    ? {
        left: (viewport.left + viewport.cw * 0.01) / zoom,
        top: (viewport.top + viewport.ch * 0.01) / zoom,
        width: viewport.cw * 0.98,
        height: viewport.ch * 0.98,
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'top left',
        zIndex: zCounter.current + 3000,
      }
    : undefined

  return (
    <div className={cn('relative h-full min-h-0', className)}>
      <div
        ref={scrollerRef}
        className={cn(
          'h-full min-h-0 bg-surface-0',
          fullscreenId ? 'overflow-hidden' : 'overflow-auto',
        )}
      >
        {/* scroll extent at current zoom */}
        <div style={{ width: surfaceW * zoom, height: surfaceH * zoom }}>
          {/* scaled blueprint surface */}
          <div
            ref={surfaceRef}
            onPointerDownCapture={onSurfaceCapture}
            onPointerDown={onBackgroundPointerDown}
            className={cn(
              'relative',
              !fullscreenId &&
                tool === 'hand' &&
                (isPanning ? 'cursor-grabbing' : 'cursor-grab'),
            )}
            style={{
              ...BLUEPRINT_BG,
              width: surfaceW,
              height: surfaceH,
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {fullscreenId && (
              <div
                className="absolute bg-elevation-alpha-60 backdrop-blur-[2px]"
                style={{
                  left: viewport.left / zoom,
                  top: viewport.top / zoom,
                  width: viewport.cw / zoom,
                  height: viewport.ch / zoom,
                  zIndex: zCounter.current + 2000,
                }}
                onPointerDown={() => toggleFullscreen(fullscreenId)}
              />
            )}

            {/* Figma-style group containers, drawn under the windows.
                The label floats above the box at constant screen size
                (inverse zoom scale) and doubles as the group drag handle. */}
            {groups?.map((group) => {
              const rects = group.windowIds
                .map((id) => geometry[id])
                .filter(Boolean)
              if (rects.length === 0) return null
              const minX = Math.min(...rects.map((r) => r.x)) - 40
              const minY = Math.min(...rects.map((r) => r.y)) - 40
              const maxX = Math.max(...rects.map((r) => r.x + r.width)) + 40
              const maxY = Math.max(...rects.map((r) => r.y + r.height)) + 40
              return (
                <div
                  key={group.id}
                  className="absolute rounded-[28px] bg-background-emphasis shadow-border-base"
                  style={{
                    left: minX,
                    top: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                  }}
                >
                  <div
                    onPointerDown={(e) => dragGroup(e, group.windowIds)}
                    className="absolute left-0 flex origin-bottom-left -translate-y-full cursor-grab items-center gap-2 pb-1.5 select-none active:cursor-grabbing"
                    style={{ transform: `translateY(-100%) scale(${1 / zoom})` }}
                  >
                    <span className="text-label-xs whitespace-nowrap text-text-muted">
                      {group.label}
                    </span>
                    <span className="text-caption-md text-text-disabled">
                      {group.windowIds.length}
                    </span>
                    {group.onPlay && (
                      <button
                        type="button"
                        aria-label={`Play ${group.label}`}
                        title="Present fullscreen"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={group.onPlay}
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-text-on-color transition-transform hover:scale-110"
                      >
                        <Play weight="fill" className="size-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {combined.map((window) => {
              const g = geometry[window.id]
              if (!g) return null
              return (
                <BrowserWindow
                  key={window.id}
                  def={window}
                  kind={window.kind}
                  geometry={g}
                  zoom={zoom}
                  focused={focusedId === window.id}
                  fullscreen={fullscreenId === window.id}
                  fullscreenStyle={
                    fullscreenId === window.id ? fullscreenStyle : undefined
                  }
                  onFocus={() => bringToFront(window.id)}
                  onGeometry={(patch) => updateGeometry(window.id, patch)}
                  onToggleFullscreen={() => toggleFullscreen(window.id)}
                  onSnapshot={
                    window.kind === 'window'
                      ? () => takeSnapshot(window.id)
                      : undefined
                  }
                  onContentEl={setContentEl}
                />
              )
            })}

            {/* design-note pins */}
            {resolvedPins.map(({ pin, ax, ay, rw, rh }) => (
              <PinMarker
                key={pin.id}
                pin={pin}
                ax={ax}
                ay={ay}
                rw={rw}
                rh={rh}
                open={openPinId === pin.id}
                onToggle={() =>
                  setOpenPinId((prev) => (prev === pin.id ? null : pin.id))
                }
                onChange={(text) => updatePinText(pin.id, text)}
                onDelete={() => handleRemovePin(pin.id)}
              />
            ))}

            {/* annotate mode: click anywhere to pin a note */}
            {annotateMode && !fullscreenId && (
              <div
                className="absolute inset-0 cursor-crosshair"
                style={{ zIndex: zCounter.current + 1000 }}
                onPointerDown={placePin}
              />
            )}
          </div>
        </div>
      </div>

      {/* rulers */}
      {!fullscreenId && showRulers && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-30 transition-opacity duration-200',
            zenMode ? 'opacity-0' : 'opacity-100',
          )}
        >
          <CanvasRulers
            viewport={viewport}
            zoom={zoom}
            surfaceW={surfaceW}
            surfaceH={surfaceH}
          />
        </div>
      )}

      {/* Windows stack - top-left */}
      {!fullscreenId && (
        <CanvasWindowsStack
          windows={windows.map((w) => ({ id: w.id, title: w.title }))}
          snapshots={snapshots.map((s) => ({ id: s.id, title: s.title }))}
          notes={pins.map((p) => ({ id: p.id, n: p.n, text: p.text }))}
          focusedId={focusedId}
          onJump={jumpTo}
          onRemoveSnapshot={removeSnapshot}
          onJumpToNote={jumpToPin}
          onRemoveNote={handleRemovePin}
          zenMode={zenMode}
        />
      )}

      {/* Minimap - bottom-left */}
      {!fullscreenId && (
        <div
          className={cn(
            'absolute bottom-4 left-4 z-40 transition-opacity duration-200',
            zenMode ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
        >
          <Minimap
            windows={combined}
            geometry={geometry}
            focusedId={focusedId}
            viewport={viewport}
            zoom={zoom}
            scrollerRef={scrollerRef}
            surfaceW={surfaceW}
            surfaceH={surfaceH}
          />
        </div>
      )}

      {/* Zoom controls - bottom-center */}
      {!fullscreenId && (
        <div
          className={cn(
            'absolute bottom-4 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-200',
            zenMode ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
        >
          <div className="flex items-center gap-0.5 rounded-full bg-background-base/90 p-1 shadow-flyout backdrop-blur">
            <button
              type="button"
              aria-label="Zoom out (⌘−)"
              onClick={() => zoomAt(zoomRef.current / ZOOM_STEP)}
              className="flex size-7 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-highlight"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => zoomAt(1)}
              title="Reset to 100% (⌘0)"
              className="min-w-[46px] text-center text-label-xs text-text-muted transition-colors hover:text-text-primary"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in (⌘+)"
              onClick={() => zoomAt(zoomRef.current * ZOOM_STEP)}
              className="flex size-7 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-highlight"
            >
              <Plus className="size-3.5" />
            </button>
            <span className="mx-0.5 h-3 w-px bg-border-muted" />
            <button
              type="button"
              aria-label="Fit all windows"
              title="Fit all windows (Shift+2)"
              onClick={fitToContent}
              className="flex size-7 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-highlight"
            >
              <FrameCorners className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Tidy up windows"
              title="Tidy up - arrange left to right"
              onClick={tidyUp}
              className="flex size-7 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-highlight"
            >
              <Broom className="size-3.5" />
            </button>
            <span className="mx-0.5 h-3 w-px bg-border-muted" />
            <button
              type="button"
              aria-label="Cursor tool"
              aria-pressed={tool === 'cursor'}
              title="Cursor - click to select, drag windows"
              onClick={() => setTool('cursor')}
              className={cn(
                'flex size-7 items-center justify-center rounded-full transition-colors',
                tool === 'cursor'
                  ? 'bg-brand-primary text-text-on-color'
                  : 'text-text-primary hover:bg-background-highlight',
              )}
            >
              <Cursor weight="fill" className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Hand tool"
              aria-pressed={tool === 'hand'}
              title="Hand - drag the empty canvas to pan"
              onClick={() => setTool('hand')}
              className={cn(
                'flex size-7 items-center justify-center rounded-full transition-colors',
                tool === 'hand'
                  ? 'bg-brand-primary text-text-on-color'
                  : 'text-text-primary hover:bg-background-highlight',
              )}
            >
              <Hand className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Annotate - click anywhere to pin a design note"
              aria-pressed={tool === 'annotate'}
              title="Annotate - click anywhere to pin a note (Esc exits)"
              onClick={() => setTool((t) => (t === 'annotate' ? 'cursor' : 'annotate'))}
              className={cn(
                'flex size-7 items-center justify-center rounded-full transition-colors',
                tool === 'annotate'
                  ? 'bg-brand-primary text-text-on-color'
                  : 'text-text-primary hover:bg-background-highlight',
              )}
            >
              <ChatTeardropText className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Minimap ---------- */

function Minimap({
  windows,
  geometry,
  focusedId,
  viewport,
  zoom,
  scrollerRef,
  surfaceW,
  surfaceH,
}: {
  windows: Array<{ id: string }>
  geometry: Record<string, WindowGeometry>
  focusedId: string | null
  viewport: { left: number; top: number; cw: number; ch: number }
  zoom: number
  scrollerRef: React.RefObject<HTMLDivElement | null>
  surfaceW: number
  surfaceH: number
}) {
  const k = MINIMAP_W / surfaceW
  const height = Math.round(surfaceH * k)

  function navigate(e: React.PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current
    if (!scroller) return
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    const moveTo = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      const logicalX = (clientX - rect.left) / k
      const logicalY = (clientY - rect.top) / k
      scroller.scrollLeft = logicalX * zoom - scroller.clientWidth / 2
      scroller.scrollTop = logicalY * zoom - scroller.clientHeight / 2
    }
    moveTo(e.clientX, e.clientY)

    const move = (ev: PointerEvent) => moveTo(ev.clientX, ev.clientY)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  return (
    <div
      role="presentation"
      aria-label="Canvas minimap"
      onPointerDown={navigate}
      className="relative cursor-pointer touch-none overflow-hidden rounded-xl bg-background-base/90 shadow-flyout backdrop-blur"
      style={{ width: MINIMAP_W, height }}
    >
      {windows.map((w) => {
        const g = geometry[w.id]
        if (!g) return null
        return (
          <span
            key={w.id}
            className={cn(
              'absolute rounded-[2px]',
              focusedId === w.id
                ? 'bg-brand-surface/70'
                : 'bg-background-emphasis',
            )}
            style={{
              left: g.x * k,
              top: g.y * k,
              width: g.width * k,
              height: g.height * k,
            }}
          />
        )
      })}
      <span
        className="absolute rounded-[3px] border border-brand-primary bg-brand-primary/10"
        style={{
          left: (viewport.left / zoom) * k,
          top: (viewport.top / zoom) * k,
          width: (viewport.cw / zoom) * k,
          height: (viewport.ch / zoom) * k,
        }}
      />
    </div>
  )
}

/* ---------- Browser window ---------- */

function BrowserWindow({
  def,
  kind,
  geometry,
  zoom,
  focused,
  fullscreen,
  fullscreenStyle,
  onFocus,
  onGeometry,
  onToggleFullscreen,
  onSnapshot,
  onContentEl,
}: {
  def: CanvasWindowDef
  kind: 'window' | 'snapshot'
  geometry: WindowGeometry
  zoom: number
  focused: boolean
  fullscreen: boolean
  fullscreenStyle?: React.CSSProperties
  onFocus: () => void
  onGeometry: (patch: Partial<WindowGeometry>) => void
  onToggleFullscreen: () => void
  onSnapshot?: () => void
  onContentEl: (id: string, el: HTMLElement | null) => void
}) {
  const [interacting, setInteracting] = useState(false)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const screenshotTargetRef = useRef<HTMLElement | null>(null)
  const [screenshotState, setScreenshotState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  const contentRef = useCallback(
    (el: HTMLElement | null) => {
      setPortalEl(el)
      screenshotTargetRef.current = el
      onContentEl(def.id, el)
    },
    [def.id, onContentEl],
  )

  async function copyScreenshot() {
    const node = screenshotTargetRef.current
    if (!node || screenshotState === 'busy') return
    setScreenshotState('busy')
    try {
      // Fonts load from a remote Google Fonts @import - html-to-image's font-
      // embedding step re-fetches that stylesheet, which can hang indefinitely
      // in sandboxed/offline environments. Try full-fidelity capture first,
      // bounded by a hard timeout, then fall back to a font-less capture
      // (still correct, just system-font text) rather than ever getting
      // stuck - a hung promise here would leave the button disabled forever.
      const blob = await withoutBackdropFilter(node, async () => {
        try {
          return await captureWithTimeout(node, { pixelRatio: 2, cacheBust: true }, 5000)
        } catch {
          return await captureWithTimeout(node, { pixelRatio: 2, cacheBust: true, skipFonts: true }, 5000)
        }
      })
      if (!blob) throw new Error('capture produced no image')
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setScreenshotState('done')
    } catch {
      setScreenshotState('error')
    } finally {
      setTimeout(() => setScreenshotState('idle'), 1600)
    }
  }

  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (fullscreen) return
    // ignore drags that start on the traffic lights row buttons
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    e.preventDefault()
    onFocus()
    setInteracting(true)
    const startX = e.clientX
    const startY = e.clientY
    const { x, y } = geometry
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    const move = (ev: PointerEvent) => {
      onGeometry({
        x: Math.max(0, x + (ev.clientX - startX) / zoom),
        y: Math.max(0, y + (ev.clientY - startY) / zoom),
      })
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      setInteracting(false)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    if (fullscreen) return
    e.preventDefault()
    e.stopPropagation()
    onFocus()
    setInteracting(true)
    const startX = e.clientX
    const startY = e.clientY
    const { width, height } = geometry
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    const move = (ev: PointerEvent) => {
      onGeometry({
        width: Math.max(MIN_WIDTH, width + (ev.clientX - startX) / zoom),
        height: Math.max(MIN_HEIGHT, height + (ev.clientY - startY) / zoom),
      })
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      setInteracting(false)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  return (
    <>
      {/* blueprint readout: content viewport size + position */}
      {!fullscreen && (
        <div
          className="pointer-events-none absolute flex items-baseline gap-2 font-mono text-caption whitespace-nowrap"
          style={{
            left: geometry.x + 2,
            top: geometry.y - 22,
            zIndex: geometry.z,
          }}
        >
          <span className={focused ? 'text-brand-text' : 'text-text-muted'}>
            {Math.round(geometry.width)} × {Math.round(geometry.height - 36)}
          </span>
          <span className="text-text-muted/70">
            x{Math.round(geometry.x)} · y{Math.round(geometry.y)}
          </span>
        </div>
      )}

      <section
        aria-label={def.title}
        data-window-id={def.id}
        onPointerDown={onFocus}
        className={cn(
          'absolute flex flex-col overflow-hidden rounded-xl bg-background-base shadow-border-base',
          focused && !fullscreen && 'shadow-border-active',
          interacting && 'select-none',
        )}
        style={
          fullscreen && fullscreenStyle
            ? fullscreenStyle
            : {
                left: geometry.x,
                top: geometry.y,
                width: geometry.width,
                height: geometry.height,
                zIndex: geometry.z,
              }
        }
      >
        {/* Safari-style chrome - drag me, double-click for app view */}
        <div
          onPointerDown={startDrag}
          onDoubleClick={onToggleFullscreen}
          className={cn(
            'flex h-9 shrink-0 items-center gap-2 border-b border-border-highlight bg-surface-1 px-3 select-none',
            fullscreen
              ? 'cursor-default'
              : interacting
                ? 'cursor-grabbing'
                : 'cursor-grab',
          )}
          title={`${def.title} - double-click to toggle app view`}
        >
          <span className="flex shrink-0 items-center gap-1.5" data-no-drag>
            <span className="size-3 rounded-full bg-background-error-base" />
            <span className="size-3 rounded-full bg-background-warning-base" />
            <button
              type="button"
              aria-label={
                fullscreen ? 'Exit fullscreen preview' : 'Fullscreen preview'
              }
              title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen preview'}
              onClick={onToggleFullscreen}
              className="size-3 cursor-pointer rounded-full bg-background-success-base transition-transform hover:scale-110"
            />
          </span>
          <span className="flex min-w-0 flex-1 justify-center">
            <span className="flex h-6 max-w-[60%] min-w-[220px] items-center justify-center gap-1 truncate rounded-lg bg-background-highlight px-3 text-caption text-text-muted">
              {kind === 'snapshot' ? (
                <Camera className="size-3 shrink-0 text-brand-text" />
              ) : (
                <Lock className="size-3 shrink-0" weight="fill" />
              )}
              <span className="truncate">{def.url}</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1" data-no-drag>
            <span className="max-w-[96px] truncate text-caption text-text-muted">
              {def.title.split('-')[0]?.trim()}
            </span>
            {onSnapshot && !fullscreen && (
              <button
                type="button"
                aria-label="Snapshot this window"
                title="Snapshot - freeze this state as a new window"
                onClick={onSnapshot}
                className="flex size-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
              >
                <Camera className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              data-no-drag
              aria-label={
                screenshotState === 'error'
                  ? 'Screenshot failed - try again'
                  : screenshotState === 'done'
                    ? 'Copied to clipboard'
                    : 'Copy screenshot to clipboard'
              }
              title={
                screenshotState === 'error'
                  ? "Couldn't copy - try again"
                  : screenshotState === 'done'
                    ? 'Copied!'
                    : 'Copy a high-quality screenshot to clipboard'
              }
              onClick={copyScreenshot}
              disabled={screenshotState === 'busy'}
              className={cn(
                'flex size-6 items-center justify-center rounded-md transition-colors hover:bg-background-highlight hover:text-text-primary',
                screenshotState === 'done'
                  ? 'text-text-success-base'
                  : screenshotState === 'error'
                    ? 'text-text-error-base'
                    : 'text-text-muted',
              )}
            >
              {screenshotState === 'done' ? (
                <Check weight="bold" className="size-3.5" />
              ) : screenshotState === 'error' ? (
                <Warning weight="fill" className="size-3.5" />
              ) : (
                <ImageIcon className={cn('size-3.5', screenshotState === 'busy' && 'animate-pulse')} />
              )}
            </button>
            <button
              type="button"
              aria-label={
                fullscreen ? 'Exit app view' : 'Open as app (fills the screen)'
              }
              title={
                fullscreen
                  ? 'Exit app view (Esc)'
                  : 'Open as app - 98% of the screen'
              }
              onClick={onToggleFullscreen}
              className="flex size-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
            >
              {fullscreen ? (
                <CornersIn className="size-3.5" />
              ) : (
                <CornersOut className="size-3.5" />
              )}
            </button>
          </span>
        </div>

        {/* Preview content - popovers portal in here so they scale with zoom */}
        <div
          ref={contentRef}
          data-window-content=""
          className={cn(
            'relative min-h-0 flex-1 overflow-auto',
            def.chrome === 'phone' && 'flex items-center justify-center bg-[#0b0b0d]',
          )}
        >
          <PortalContainerContext.Provider value={portalEl}>
            {def.chrome === 'phone' ? (
              <div
                className="relative size-full shrink-0 rounded-[54px] bg-black shadow-2xl"
                style={{ padding: PHONE_BEZEL }}
              >
                <div className="relative size-full overflow-hidden rounded-[42px] bg-white">
                  {def.content}
                </div>
                {/* Dynamic Island */}
                <div className="pointer-events-none absolute left-1/2 top-[26px] h-[35px] w-[120px] -translate-x-1/2 rounded-full bg-black" />
              </div>
            ) : (
              def.content
            )}
          </PortalContainerContext.Provider>
        </div>

        {/* Resize handle */}
        {!fullscreen && (
          <div
            onPointerDown={startResize}
            aria-hidden
            className="absolute right-0 bottom-0 z-10 size-4 cursor-nwse-resize"
          >
            <span className="absolute right-1 bottom-1 block size-2 rounded-[2px] border-r-2 border-b-2 border-border-muted" />
          </div>
        )}
      </section>
    </>
  )
}

/* ---------- CanvasWindowsStack ------------------------------------------------
   Top-left collapsed widget: stacked card thumbnails → expand to full list.
   Space bar toggles zen mode (hides this + all other chrome).
-------------------------------------------------------------------------- */

function CanvasWindowsStack({
  windows,
  snapshots,
  notes,
  focusedId,
  onJump,
  onRemoveSnapshot,
  onJumpToNote,
  onRemoveNote,
  zenMode,
}: {
  windows: Array<{ id: string; title: string }>
  snapshots: Array<{ id: string; title: string }>
  notes: Array<{ id: string; n: number; text: string }>
  focusedId: string | null
  onJump: (id: string) => void
  onRemoveSnapshot: (id: string) => void
  onJumpToNote: (id: string) => void
  onRemoveNote: (id: string) => void
  zenMode: boolean
}) {
  const [open, setOpen] = useState(false)
  const count = windows.length + snapshots.length
  const stackDepth = Math.min(3, Math.max(1, count))

  return (
    <div
      className={cn(
        'absolute top-4 left-4 z-40 transition-opacity duration-200',
        zenMode ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Collapse windows list' : 'Expand windows list (Space = zen mode)'}
        className="flex items-center gap-2 rounded-xl bg-background-base/90 px-2.5 py-2 shadow-border-base backdrop-blur transition-colors hover:bg-background-base"
      >
        {/* Stacked card thumbnails */}
        <span
          className="relative shrink-0"
          style={{ width: 8 + stackDepth * 5, height: 16 }}
        >
          {Array.from({ length: stackDepth }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-[3px] border border-border-base"
              style={{
                width: 16,
                height: 12,
                left: (stackDepth - 1 - i) * 4,
                top: (stackDepth - 1 - i) * 2,
                background:
                  i === stackDepth - 1
                    ? 'var(--background-emphasis)'
                    : 'var(--surface-1)',
                opacity: 0.55 + i * 0.22,
              }}
            />
          ))}
        </span>
        <span className="tabular-nums text-label-xs text-text-muted">{count}</span>
        {open ? (
          <CornersIn className="size-3 shrink-0 text-text-muted" />
        ) : (
          <CornersOut className="size-3 shrink-0 text-text-muted" />
        )}
      </button>

      {/* Expanded panel - rendered below the trigger */}
      {open && (
        <div className="absolute top-full left-0 mt-2">
          <WindowsPanel
            windows={windows}
            snapshots={snapshots}
            notes={notes}
            focusedId={focusedId}
            onJump={(id) => { onJump(id); setOpen(false) }}
            onRemoveSnapshot={onRemoveSnapshot}
            onJumpToNote={onJumpToNote}
            onRemoveNote={onRemoveNote}
          />
        </div>
      )}
    </div>
  )
}
