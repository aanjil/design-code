import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  ArrowCounterClockwise,
  CaretDoubleRight,
  ListChecks,
  X,
} from '@phosphor-icons/react'
import { useCanvasPins } from './canvas-pins-context'
import { useZenMode } from './canvas-craft'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

/**
 * Flow & state explorer - playground-level review harness (see
 * docs/handoff + agent-build-instructions). One floating panel, right
 * side, two tabs:
 * - Flows: every screen to design, grouped, with persistent checkboxes
 *   (the figma-screen-checklist made interactive) — the selected screen
 *   expands inline to show its states/conditions right underneath it,
 *   one click drives the craft's preview to that exact state.
 * - Notes: the canvas's design-note pins (shared via useCanvasPins), so
 *   pinning and reviewing notes doesn't need a separate on-canvas list.
 * Minimizes to a single edge pill. The craft supplies the catalog
 * and derives its app state from the current selection via useExplorer().
 */

export interface ExplorerStateDef {
  id: string
  label: string
  /** 'full' = beyond v1 scope - tagged visually. */
  scope?: 'v1' | 'full'
}

export interface ExplorerScreenDef {
  id: string
  label: string
  states: Array<ExplorerStateDef>
}

export interface ExplorerGroupDef {
  group: string
  screens: Array<ExplorerScreenDef>
}

export interface ExplorerContextValue {
  catalog: Array<ExplorerGroupDef>
  screenId: string
  stateId: string
  /**
   * `payload` is a free-form bag of extra data for the current transition
   * (e.g. `{ employeeId }` when starting a move, `{ createdSchedule }` on
   * wizard create). The static catalog explorer ignores it; the Live App's
   * explorer reads it to perform real state changes.
   */
  show: (screenId: string, stateId?: string, payload?: Record<string, unknown>) => void
  done: Record<string, boolean>
  toggleDone: (screenId: string) => void
  resetDone: () => void
  total: number
  checked: number
  /** Bumped on every show() - lets the canvas re-focus the same screen. */
  focusNonce: number
}

/** Exported so the Live App can supply its own value (real navigation +
 *  real side effects) while reusing every screen component unchanged. */
export const ExplorerContext = createContext<ExplorerContextValue | null>(null)

export function useExplorer(): ExplorerContextValue {
  const ctx = useContext(ExplorerContext)
  if (!ctx) throw new Error('useExplorer must be used inside <ExplorerProvider>')
  return ctx
}

function findScreen(
  catalog: Array<ExplorerGroupDef>,
  id: string,
): ExplorerScreenDef | null {
  for (const group of catalog) {
    for (const screen of group.screens) if (screen.id === id) return screen
  }
  return null
}

export function ExplorerProvider({
  catalog,
  storageKey,
  initialScreen,
  children,
}: {
  catalog: Array<ExplorerGroupDef>
  /** Namespaces the checklist in localStorage: nds-explorer:<key> */
  storageKey: string
  initialScreen?: string
  children: React.ReactNode
}) {
  const firstScreen = catalog[0]?.screens[0]
  const startScreen = initialScreen ?? firstScreen?.id ?? ''
  const [screenId, setScreenId] = useState(startScreen)
  const [stateId, setStateId] = useState(
    () => findScreen(catalog, startScreen)?.states[0]?.id ?? '',
  )
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [focusNonce, setFocusNonce] = useState(0)
  const key = `nds-explorer:${storageKey}`

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) setDone(JSON.parse(raw))
    } catch {
      /* first run / blocked storage */
    }
  }, [key])

  const value = useMemo<ExplorerContextValue>(() => {
    const persist = (next: Record<string, boolean>) => {
      setDone(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* ignore */
      }
    }
    const total = catalog.reduce((n, g) => n + g.screens.length, 0)
    return {
      catalog,
      screenId,
      stateId,
      show: (nextScreen, nextState) => {
        // payload is a Live-App-only concept; the catalog explorer ignores it
        const screen = findScreen(catalog, nextScreen)
        if (!screen) return
        setScreenId(nextScreen)
        setStateId(nextState ?? screen.states[0]?.id ?? '')
        setFocusNonce((n) => n + 1)
      },
      done,
      toggleDone: (id) => persist({ ...done, [id]: !done[id] }),
      resetDone: () => persist({}),
      total,
      checked: Object.keys(done).filter((k) => done[k]).length,
      focusNonce,
    }
  }, [catalog, screenId, stateId, done, key, focusNonce])

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>
}

/* ---------------- shared panel chrome ---------------- */

/** Fixed-chrome width to pass as `reservedRight` on PlaygroundCanvas. */
export const EXPLORER_PANEL_RESERVED_RIGHT = 352

function PanelIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
    >
      {children}
    </button>
  )
}

function ScopeBadge({ label = 'v2' }: { label?: string }) {
  return (
    <span className="shrink-0 rounded bg-brand-muted px-1 text-caption-md text-brand-text">
      {label}
    </span>
  )
}

type ExplorerTab = 'flows' | 'notes'

/* ---------------- merged panel: Flows (+ inline states) / Notes ---------------- */

export function ExplorerPanel({
  extraActions,
}: {
  /** Craft-specific controls rendered in the panel header (e.g. a
   *  Play button for a master "App" flow, or a Reset-data button). */
  extraActions?: React.ReactNode
}) {
  const [userMinimized, setUserMinimized] = useState(false)
  const zenMode = useZenMode()
  const minimized = userMinimized || zenMode
  const [tab, setTab] = useState<ExplorerTab>('flows')
  const { checked, total } = useExplorer()
  const { pins } = useCanvasPins()

  if (minimized) {
    return (
      <button
        type="button"
        aria-label={`Explorer - ${checked}/${total} designed, ${pins.length} notes`}
        title="Expand explorer panel"
        onClick={() => setUserMinimized(false)}
        className="fixed top-4 right-4 z-[80] flex size-9 items-center justify-center rounded-full bg-background-base/90 text-text-primary shadow-border-base backdrop-blur transition-colors hover:bg-background-highlight"
      >
        <ListChecks className="size-4.5" />
      </button>
    )
  }

  return (
    <div className="fixed top-4 right-4 bottom-4 z-[80] flex w-80 flex-col overflow-hidden rounded-2xl bg-background-base/90 shadow-border-base backdrop-blur">
      <div className="flex shrink-0 items-center gap-1 p-2">
        <div className="flex flex-1 items-center gap-0.5 rounded-lg bg-background-highlight p-0.5">
          <button
            type="button"
            onClick={() => setTab('flows')}
            className={cn(
              'flex-1 rounded-md px-2 py-1 text-center text-label-xs transition-colors',
              tab === 'flows'
                ? 'bg-background-base text-text-primary shadow-button-gray'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            Flows
          </button>
          <button
            type="button"
            onClick={() => setTab('notes')}
            className={cn(
              'flex-1 rounded-md px-2 py-1 text-center text-label-xs transition-colors',
              tab === 'notes'
                ? 'bg-background-base text-text-primary shadow-button-gray'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            Notes{pins.length > 0 && ` · ${pins.length}`}
          </button>
        </div>
        {extraActions}
        <PanelIconButton
          label="Minimize explorer panel"
          onClick={() => setUserMinimized(true)}
        >
          <CaretDoubleRight className="size-3.5" />
        </PanelIconButton>
      </div>

      {tab === 'flows' ? <FlowsTab /> : <NotesTab />}
    </div>
  )
}

function FlowsTab() {
  const { catalog, screenId, stateId, show, done, toggleDone, resetDone, total, checked } =
    useExplorer()
  const pct = total ? Math.round((checked / total) * 100) : 0

  return (
    <>
      <div className="shrink-0 px-2.5 pb-1.5">
        <div className="flex items-center gap-1">
          <span className="flex-1 text-caption-md text-text-muted">
            {checked} / {total} designed
          </span>
          <PanelIconButton label="Reset checklist" onClick={resetDone}>
            <ArrowCounterClockwise className="size-3.5" />
          </PanelIconButton>
        </div>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-background-muted">
          <span
            className="block h-full rounded-full bg-background-success-base transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 pt-0">
        {catalog.map((group) => (
          <div key={group.group}>
            <p className="px-2 pt-2.5 pb-1 text-caption-md text-text-muted">
              {group.group}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.screens.map((screen) => {
                const isDone = !!done[screen.id]
                const selected = screen.id === screenId
                const allV2 =
                  screen.states.length > 0 &&
                  screen.states.every((s) => s.scope === 'full')
                return (
                  <div key={screen.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Show ${screen.label}`}
                      onClick={() => show(screen.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') show(screen.id)
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-background-highlight',
                        selected && 'bg-background-highlight',
                      )}
                    >
                      <span
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="flex shrink-0 items-center"
                      >
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => toggleDone(screen.id)}
                          aria-label={`Mark ${screen.label} designed`}
                        />
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-paragraph-xs',
                          selected ? 'text-brand-text' : 'text-text-primary',
                          isDone && 'text-text-muted line-through',
                        )}
                      >
                        {screen.label}
                      </span>
                      {allV2 && <ScopeBadge />}
                    </div>

                    {/* selected screen's states expand inline, right below it */}
                    {selected && screen.states.length > 0 && (
                      <div className="mt-0.5 mb-1 ml-3 flex flex-col gap-0.5 border-l border-border-highlight pl-3">
                        {screen.states.map((state) => {
                          const activeState = state.id === stateId
                          return (
                            <button
                              key={state.id}
                              type="button"
                              onClick={() => show(screen.id, state.id)}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-paragraph-xs transition-colors',
                                activeState
                                  ? 'bg-brand-muted text-brand-text'
                                  : 'text-text-muted hover:bg-background-highlight hover:text-text-primary',
                              )}
                            >
                              <span className="min-w-0 flex-1">{state.label}</span>
                              {state.scope === 'full' && <ScopeBadge label="Beyond v1" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function NotesTab() {
  const { pins, removePin, requestJump } = useCanvasPins()

  if (pins.length === 0) {
    return (
      <p className="p-4 text-center text-paragraph-xs text-text-muted">
        No design notes yet. Toggle Annotate in the canvas zoom controls,
        then click anywhere to pin one.
      </p>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
      <div className="flex flex-col gap-0.5">
        {pins.map((pin) => (
          <div
            key={pin.id}
            className="group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-background-highlight"
          >
            <button
              type="button"
              onClick={() => requestJump(pin.id)}
              className="flex min-w-0 flex-1 items-start gap-2 text-left"
            >
              <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-primary text-caption-md text-text-on-color">
                {pin.n}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-paragraph-xs',
                  pin.text.trim() ? 'text-text-primary' : 'text-text-muted',
                )}
              >
                {pin.text.trim() || 'Empty note'}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Delete note ${pin.n}`}
              onClick={() => removePin(pin.id)}
              className="flex size-5 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-error-highlight hover:text-text-error-base"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
