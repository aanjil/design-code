import type { Dispatch, SetStateAction } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { CanvasPin } from './canvas-pins'

/**
 * Shared design-note pin state — lives above both the canvas (which
 * renders markers and captures clicks/⌘-clicks to create them) and any
 * external overlay panel (which lists/jumps/deletes them, e.g. the
 * explorer's Notes tab). One provider per CanvasCraft.
 */

interface JumpRequest {
  id: string
  nonce: number
}

interface CanvasPinsContextValue {
  pins: Array<CanvasPin>
  addPin: (pin: Omit<CanvasPin, 'id' | 'n'>) => string
  removePin: (id: string) => void
  removePinsForWindow: (windowId: string) => void
  updatePinText: (id: string, text: string) => void
  openPinId: string | null
  setOpenPinId: Dispatch<SetStateAction<string | null>>
  /** Bumped by requestJump() — canvas.tsx watches this to scroll/open a pin. */
  jumpRequest: JumpRequest | null
  requestJump: (id: string) => void
}

const Ctx = createContext<CanvasPinsContextValue | null>(null)

export function useCanvasPins(): CanvasPinsContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCanvasPins must be used inside <CanvasPinsProvider>')
  return ctx
}

export function CanvasPinsProvider({
  children,
  storageKey,
}: {
  children: React.ReactNode
  /** Namespaces persisted notes in localStorage: nds-canvas-pins:<key> */
  storageKey?: string
}) {
  const [pins, setPins] = useState<Array<CanvasPin>>([])
  const [openPinId, setOpenPinId] = useState<string | null>(null)
  const [jumpRequest, setJumpRequest] = useState<JumpRequest | null>(null)
  const counter = useRef(0)
  const nonce = useRef(0)
  const key = storageKey ? `nds-canvas-pins:${storageKey}` : null

  // hydrate once on mount
  useEffect(() => {
    if (!key) return
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const restored = JSON.parse(raw) as Array<CanvasPin>
        setPins(restored)
        counter.current = restored.reduce((max, p) => Math.max(max, p.n), 0)
      }
    } catch {
      /* first run / blocked storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // persist on every change
  useEffect(() => {
    if (!key) return
    try {
      window.localStorage.setItem(key, JSON.stringify(pins))
    } catch {
      /* ignore */
    }
  }, [key, pins])

  const addPin = useCallback((pin: Omit<CanvasPin, 'id' | 'n'>) => {
    counter.current += 1
    const n = counter.current
    const id = `pin-${n}`
    setPins((prev) => [...prev, { ...pin, id, n }])
    return id
  }, [])

  const removePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id))
    setOpenPinId((prev) => (prev === id ? null : prev))
  }, [])

  const removePinsForWindow = useCallback((windowId: string) => {
    setPins((prev) => prev.filter((p) => p.windowId !== windowId))
  }, [])

  const updatePinText = useCallback((id: string, text: string) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, text } : p)))
  }, [])

  const requestJump = useCallback((id: string) => {
    nonce.current += 1
    setJumpRequest({ id, nonce: nonce.current })
  }, [])

  const value = useMemo<CanvasPinsContextValue>(
    () => ({
      pins,
      addPin,
      removePin,
      removePinsForWindow,
      updatePinText,
      openPinId,
      setOpenPinId,
      jumpRequest,
      requestJump,
    }),
    [pins, addPin, removePin, removePinsForWindow, updatePinText, openPinId, jumpRequest, requestJump],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
