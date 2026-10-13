import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import type { EngineConfig, EngineSnapshot, MockEngine } from './engine'
import { createMockEngine } from './engine'

const EngineContext = createContext<MockEngine | null>(null)

/** Real-time tick while playing; virtual time = real elapsed × speed. */
const TICK_MS = 100

/**
 * Owns one engine for its subtree (created once from `config`) and drives
 * the clock while it's playing. Put it ABOVE the canvas so the live window
 * and the Director HUD outside it read the same world.
 */
export function MockEngineProvider({
  config,
  children,
}: {
  config: EngineConfig | (() => EngineConfig)
  children: React.ReactNode
}) {
  const [engine] = useState(() => createMockEngine(typeof config === 'function' ? config() : config))
  const playing = useSyncExternalStore(engine.subscribe, () => engine.get().playing, () => false)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      engine.advance((now - last) * engine.get().speed)
      last = now
    }, TICK_MS)
    return () => clearInterval(id)
  }, [engine, playing])

  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}

export function useMockEngine(): MockEngine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('useMockEngine must be used inside <MockEngineProvider>')
  return engine
}

/** Null outside a provider - lets a screen fall back to its static mocks. */
export function useOptionalMockEngine(): MockEngine | null {
  return useContext(EngineContext)
}

/**
 * Subscribe to a slice of the world. `select` must return a stable value
 * for an unchanged snapshot (a field, or something memoized by snapshot) -
 * the engine replaces the snapshot object on every change.
 */
export function useEngine<T>(select: (s: EngineSnapshot) => T): T {
  const engine = useMockEngine()
  return useSyncExternalStore(
    engine.subscribe,
    () => select(engine.get()),
    () => select(engine.get()),
  )
}
