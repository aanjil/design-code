import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  Broom,
  CornersIn,
  CornersOut,
  FrameCorners,
  Lock,
  Minus,
  Plus,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Experiment canvas: a zoomable, pannable surface (Figma-style) holding
 * Safari-style browser windows — drag via titlebar, resize via corner,
 * green traffic light maximizes one window to ~98vw/98vh for presenting.
 * Zoom: controls bottom-left (next to the minimap), ⌘/Ctrl +/−/0, and
 * pinch / Ctrl-scroll zooming toward the cursor.
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

  /* ---------- viewport tracking (minimap) ---------- */

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

  /* ---------- wheel + keyboard zoom ---------- */

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenRef.current) {
        toggleFullscreen(fullscreenRef.current)
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
  }, [toggleFullscreen, zoomAt])

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
          {/* scaled surface */}
          <div
            className="relative [background-image:radial-gradient(var(--border-base)_1px,transparent_1px)] [background-size:20px_20px]"
            style={{
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
            {windows.map((window) => (
              <BrowserWindow
                key={window.id}
                def={window}
                geometry={geometry[window.id]}
                zoom={zoom}
                focused={focusedId === window.id}
                fullscreen={fullscreenId === window.id}
                fullscreenStyle={
                  fullscreenId === window.id ? fullscreenStyle : undefined
                }
                onFocus={() => bringToFront(window.id)}
                onGeometry={(patch) => updateGeometry(window.id, patch)}
                onToggleFullscreen={() => toggleFullscreen(window.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Minimap + zoom controls */}
      {!fullscreenId && (
        <div className="absolute bottom-4 left-4 z-40 flex flex-col gap-2">
          <Minimap
            windows={windows}
            geometry={geometry}
            focusedId={focusedId}
            viewport={viewport}
            zoom={zoom}
            scrollerRef={scrollerRef}
          />
          <div className="flex items-center gap-0.5 self-start rounded-full bg-background-base/90 p-1 shadow-flyout backdrop-blur">
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
  windows: Array<CanvasWindowDef>
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
  geometry,
  zoom,
  focused,
  fullscreen,
  fullscreenStyle,
  onFocus,
  onGeometry,
  onToggleFullscreen,
}: {
  def: CanvasWindowDef
  geometry: WindowGeometry
  zoom: number
  focused: boolean
  fullscreen: boolean
  fullscreenStyle?: React.CSSProperties
  onFocus: () => void
  onGeometry: (patch: Partial<WindowGeometry>) => void
  onToggleFullscreen: () => void
}) {
  const [interacting, setInteracting] = useState(false)

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
    <section
      aria-label={def.title}
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
      {/* Safari-style chrome — drag me */}
      <div
        onPointerDown={startDrag}
        className={cn(
          'flex h-9 shrink-0 items-center gap-2 border-b border-border-highlight bg-surface-1 px-3 select-none',
          fullscreen ? 'cursor-default' : interacting ? 'cursor-grabbing' : 'cursor-grab',
        )}
        title={def.title}
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
            <Lock className="size-3 shrink-0" weight="fill" />
            <span className="truncate">{def.url}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1" data-no-drag>
          <span className="max-w-[96px] truncate text-caption text-text-muted">
            {def.title.split('—')[0]?.trim()}
          </span>
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

      {/* Preview content */}
      <div className="min-h-0 flex-1 overflow-auto">{def.content}</div>

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
  )
}
