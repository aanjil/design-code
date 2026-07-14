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
  CornersIn,
  CornersOut,
  FrameCorners,
  Lock,
  Minus,
  Plus,
} from '@phosphor-icons/react'
import type { CanvasPin } from './canvas-pins'
import { PinMarker } from './canvas-pins'
import { CanvasRulers } from './canvas-rulers'
import { WindowsPanel } from './windows-panel'
import { PortalContainerContext } from '@/components/ui/portal-context'
import { cn } from '@/lib/utils'

/**
 * Experiment canvas: a zoomable, pannable blueprint surface (Figma-style)
 * holding Safari-style browser windows — drag via titlebar, resize via
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

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

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
}: {
  windows: Array<CanvasWindowDef>
  className?: string
  onFullscreenChange?: (active: boolean) => void
}) {
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

  const [pins, setPins] = useState<Array<CanvasPin>>([])
  const pinCounter = useRef(0)
  const [annotateMode, setAnnotateMode] = useState(false)
  const [openPinId, setOpenPinId] = useState<string | null>(null)
  const [zenMode, setZenMode] = useState(false)
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

  const bringToFront = useCallback((id: string) => {
    setFocusedId(id)
    zCounter.current += 1
    const z = zCounter.current
    setGeometry((prev) => ({ ...prev, [id]: { ...prev[id], z } }))
  }, [])

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
          title: `Snap ${snapCounter.current} · ${src.title.split('—')[0]?.trim()}`,
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
    setPins((prev) => prev.filter((p) => p.windowId !== id))
    setFocusedId((prev) => (prev === id ? null : prev))
    setFullscreenId((prev) => (prev === id ? null : prev))
    setOpenPinId(null)
  }, [])

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
    const target = clampZoom(
      Math.min(
        scroller.clientWidth / (maxX - minX),
        scroller.clientHeight / (maxY - minY),
      ),
    )
    pendingScroll.current = { left: minX * target, top: minY * target }
    if (target === zoomRef.current) syncScrollNow()
    else setZoom(target)
  }, [])

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
    let x = Math.max(TIDY_GAP, (SURFACE_W - totalW) / 2)
    let y = Math.max(TIDY_GAP, (SURFACE_H - rowH) / 2)
    setGeometry((prev) => {
      const next = { ...prev }
      for (const [id, g] of entries) {
        if (x > TIDY_GAP && x + g.width > SURFACE_W - TIDY_GAP) {
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
    scroller.scrollLeft = ((minX + maxX) / 2) * z - scroller.clientWidth / 2
    scroller.scrollTop = ((minY + maxY) / 2) * z - scroller.clientHeight / 2
    syncViewport()
  }, [syncViewport])

  /* ---------- wheel + keyboard ---------- */

  const fullscreenRef = useRef(fullscreenId)
  fullscreenRef.current = fullscreenId

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    // React's synthetic wheel handlers are passive — bind manually.
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
    if (!scroller || !g) return
    const pad = 40
    const target = clampZoom(
      Math.min(
        scroller.clientWidth / (g.width + pad * 2),
        scroller.clientHeight / (g.height + pad * 2),
      ),
    )
    pendingScroll.current = {
      left: (g.x + g.width / 2) * target - scroller.clientWidth / 2,
      top: (g.y + g.height / 2) * target - scroller.clientHeight / 2,
    }
    if (target === zoomRef.current) syncScrollNow()
    else setZoom(target)
  }, [])

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
          setAnnotateMode(false)
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
  }, [cycleWindow, toggleFullscreen, zoomAt])

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
  const createElementPin = useCallback((windowId: string, el: Element) => {
    const surf = surfaceRef.current
    const g = geometryRef.current[windowId]
    if (!surf || !g) return
    const z = zoomRef.current
    const rect = el.getBoundingClientRect()
    const surfRect = surf.getBoundingClientRect()
    const lx = (rect.left - surfRect.left) / z
    const ly = (rect.top - surfRect.top) / z
    pinCounter.current += 1
    const id = `pin-${pinCounter.current}`
    pinEls.current.set(id, el)
    setPins((prev) => [
      ...prev,
      {
        id,
        n: pinCounter.current,
        kind: 'element',
        windowId,
        rx: lx - g.x,
        ry: ly - g.y,
        rw: rect.width / z,
        rh: rect.height / z,
        text: '',
      },
    ])
    setOpenPinId(id)
  }, [])

  const removePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id))
    pinEls.current.delete(id)
    setOpenPinId((prev) => (prev === id ? null : prev))
  }, [])

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
    [resolvedPins],
  )

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
    pinCounter.current += 1
    const id = `pin-${pinCounter.current}`
    setPins((prev) => [
      ...prev,
      hit
        ? {
            id,
            n: pinCounter.current,
            kind: 'point' as const,
            windowId: hit.id,
            rx: lx - hit.g.x,
            ry: ly - hit.g.y,
            text: '',
          }
        : {
            id,
            n: pinCounter.current,
            kind: 'point' as const,
            windowId: null,
            rx: lx,
            ry: ly,
            text: '',
          },
    ])
    setOpenPinId(id)
  }

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
        zIndex: 9999,
      }
    : undefined

  return (
    <div className={cn('relative h-full min-h-0', className)}>
      <div
        ref={scrollerRef}
        className={cn(
          'h-full min-h-0 bg-surface-1',
          fullscreenId ? 'overflow-hidden' : 'overflow-auto',
        )}
      >
        {/* scroll extent at current zoom */}
        <div style={{ width: SURFACE_W * zoom, height: SURFACE_H * zoom }}>
          {/* scaled blueprint surface */}
          <div
            ref={surfaceRef}
            onPointerDownCapture={onSurfaceCapture}
            className="relative"
            style={{
              ...BLUEPRINT_BG,
              width: SURFACE_W,
              height: SURFACE_H,
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
                  zIndex: 9998,
                }}
                onPointerDown={() => toggleFullscreen(fullscreenId)}
              />
            )}

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
                onChange={(text) =>
                  setPins((prev) =>
                    prev.map((p) => (p.id === pin.id ? { ...p, text } : p)),
                  )
                }
                onDelete={() => removePin(pin.id)}
              />
            ))}

            {/* annotate mode: click anywhere to pin a note */}
            {annotateMode && !fullscreenId && (
              <div
                className="absolute inset-0 cursor-crosshair"
                style={{ zIndex: 7000 }}
                onPointerDown={placePin}
              />
            )}
          </div>
        </div>
      </div>

      {/* rulers */}
      {!fullscreenId && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-30 transition-opacity duration-200',
            zenMode ? 'opacity-0' : 'opacity-100',
          )}
        >
          <CanvasRulers
            viewport={viewport}
            zoom={zoom}
            surfaceW={SURFACE_W}
            surfaceH={SURFACE_H}
          />
        </div>
      )}

      {/* Windows stack — top-left */}
      {!fullscreenId && (
        <CanvasWindowsStack
          windows={windows.map((w) => ({ id: w.id, title: w.title }))}
          snapshots={snapshots.map((s) => ({ id: s.id, title: s.title }))}
          notes={pins.map((p) => ({ id: p.id, n: p.n, text: p.text }))}
          focusedId={focusedId}
          onJump={jumpTo}
          onRemoveSnapshot={removeSnapshot}
          onJumpToNote={jumpToPin}
          onRemoveNote={removePin}
          zenMode={zenMode}
        />
      )}

      {/* Minimap — bottom-left */}
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
          />
        </div>
      )}

      {/* Zoom controls — bottom-center */}
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
              title="Fit all windows"
              onClick={fitToContent}
              className="flex size-7 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-highlight"
            >
              <FrameCorners className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Tidy up windows"
              title="Tidy up — arrange left to right"
              onClick={tidyUp}
              className="flex size-7 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-highlight"
            >
              <Broom className="size-3.5" />
            </button>
            <span className="mx-0.5 h-3 w-px bg-border-muted" />
            <button
              type="button"
              aria-label="Annotate — click anywhere to pin a design note"
              aria-pressed={annotateMode}
              title="Annotate — click anywhere to pin a note (Esc exits)"
              onClick={() => setAnnotateMode((m) => !m)}
              className={cn(
                'flex size-7 items-center justify-center rounded-full transition-colors',
                annotateMode
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
}: {
  windows: Array<{ id: string }>
  geometry: Record<string, WindowGeometry>
  focusedId: string | null
  viewport: { left: number; top: number; cw: number; ch: number }
  zoom: number
  scrollerRef: React.RefObject<HTMLDivElement | null>
}) {
  const k = MINIMAP_W / SURFACE_W
  const height = Math.round(SURFACE_H * k)

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

  const contentRef = useCallback(
    (el: HTMLElement | null) => {
      setPortalEl(el)
      onContentEl(def.id, el)
    },
    [def.id, onContentEl],
  )

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
          'absolute flex flex-col overflow-hidden rounded-xl bg-background-base shadow-flyout',
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
        {/* Safari-style chrome — drag me, double-click for app view */}
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
          title={`${def.title} — double-click to toggle app view`}
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
              {def.title.split('—')[0]?.trim()}
            </span>
            {onSnapshot && !fullscreen && (
              <button
                type="button"
                aria-label="Snapshot this window"
                title="Snapshot — freeze this state as a new window"
                onClick={onSnapshot}
                className="flex size-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
              >
                <Camera className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              aria-label={
                fullscreen ? 'Exit app view' : 'Open as app (fills the screen)'
              }
              title={
                fullscreen
                  ? 'Exit app view (Esc)'
                  : 'Open as app — 98% of the screen'
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

        {/* Preview content — popovers portal in here so they scale with zoom */}
        <div
          ref={contentRef}
          data-window-content=""
          className="relative min-h-0 flex-1 overflow-auto"
        >
          <PortalContainerContext.Provider value={portalEl}>
            {def.content}
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

      {/* Expanded panel — rendered below the trigger */}
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
