import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from '@tanstack/react-router'
import { FloatingBezel, type AgentBar, type BezelEdge, type BezelMode } from './floating-bezel'
import { useAgentCursor } from './agent-cursor'
import { STOPPED, runVoicePayroll } from './voice-run'
import type { GrainProps } from '@/components/nds/grain/grain'
import { AppBarLinksContext } from '@/components/nds/app-bar'
import { BezelHostContext, type BezelHost, type BezelSelection } from './selection'
import type { PinnedInitiative, ThreadTurn } from '@/components/nds/grain/thread'
import { DEFAULT_PLACEMENT, PlacementMenu, SIDEBAR_MAX, SIDEBAR_MIN, type Placement } from './placement-menu'
import { MASTER_IA } from '@/crafts/master-ia'
import { liveStore, useFlowData, StoreProvider } from '@/crafts/payment-flow/store'
import { bezelScriptFor } from '@/mocks/master-bezel'
import type { PaymentsWorld } from '@/mocks/master-bezel'
import type { BezelScript } from '@/mocks/bezel'
import { bezelDirector } from './director'
import { employees } from '@/mocks/employees'
import { employeeRow, employeesAnswer, employeesSummary, invoiceRow, invoicesAnswer, invoicesSummary } from '@/mocks/bezel-selections'

/**
 * The Bezel across the whole Master App - ONE Emma object that travels:
 *
 *   floating:  [ app (AppBar + section) + bar on its top/bottom edge ]
 *   docked:    [ app ][ Emma column ]   (or [ Emma ][ app ], half, full)
 *
 * Never both: docking moves the bar itself into the column (its composer
 * becomes the column's composer) via a view transition, and collapsing
 * sends it back. Where it lives is the user's call - a macOS-style
 * Move / Fill & Arrange menu (placement-menu.tsx), remembered per browser.
 * Docked, the app reflows beside it instead of being covered. Mounted once
 * above every section, so it survives navigation; a run in flight keeps
 * its origin page's words; other sections' open tensions pin into the thread.
 *
 * Presence (deliberate departure from the Bezel doc's "always"): a quiet
 * page shows NO bar. It appears on its own only when there's something -
 * the page has a finding on arrival (script.attention), a run in flight,
 * an undo window. Otherwise you summon it:
 *   ⌘E / Ctrl+E   Ask - the bar opens as an input (again, or Esc: put away)
 *   ⇧⌘E          open / close the Sidebar (copilot column)
 *   ⌃⌥ + arrows   Immersive: send the bar to that edge of the screen
 *   Esc           step back (sheet -> claim, ask -> where it was);
 *                 while Emma's cursor drives: take over
 *   AppBar "Ask Emma" = ⌘E.
 *
 * Voice (bar mic, chat-head orbit) = "run payroll for this cycle": Emma's
 * cursor drives the real app from wherever you are and stops before the
 * one irreversible click (voice-run.ts, agent-cursor.tsx).
 */

type Acting = { label: string; grain: GrainProps; onContinue?: { label: string; to: BezelMode } }

/** Sections whose tension is worth pinning elsewhere (they have real mocks). */
const PINNABLE = ['payments', 'settings', 'people'] as const

const PLACEMENT_KEY = 'nds-bezel:placement'

/** Morph old -> new layout when the browser supports it (one named element
 *  on each side = the bar visibly travels into the column and back). */
function travel(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!doc.startViewTransition) return update()
  doc.startViewTransition(() => flushSync(update))
}

export function MasterBezelLayout({
  sectionKey,
  enabled = true,
  children,
}: {
  sectionKey: string
  /** false = render the app alone (e.g. Emma Mobile draws device frames). */
  enabled?: boolean
  children: React.ReactNode
}) {
  if (!enabled) return <>{children}</>
  return (
    <StoreProvider value={liveStore}>
      <Layout sectionKey={sectionKey}>{children}</Layout>
    </StoreProvider>
  )
}

function Layout({ sectionKey, children }: { sectionKey: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  const flow = useFlowData()
  const groundRef = useRef<HTMLDivElement>(null)
  const columnRef = useRef<HTMLElement>(null)

  const payments: PaymentsWorld = useMemo(
    () => ({ today: flow.today, invoices: flow.invoices, wallets: flow.wallets }),
    [flow.today, flow.invoices, flow.wallets],
  )
  const pageScript = useMemo(() => bezelScriptFor(sectionKey, payments), [sectionKey, payments])

  const [mode, setMode] = useState<BezelMode>('quiet')
  const [placement, setPlacementState] = useState<Placement>(DEFAULT_PLACEMENT)
  const docked = placement.docked
  // A run belongs to the page that started it - keep its words when it
  // follows you somewhere else.
  const [runFrom, setRunFrom] = useState<BezelScript['run'] | null>(null)
  const [acting, setActing] = useState<Acting | null>(null)
  const [preActingMode, setPreActingMode] = useState<BezelMode>('found')
  const [threadTitle, setThreadTitle] = useState('Ask Emma')
  const [threadTurns, setThreadTurns] = useState<Array<ThreadTurn>>([])
  const [dismissedPins, setDismissedPins] = useState<Set<string>>(new Set())
  const [preAskMode, setPreAskMode] = useState<BezelMode>('quiet')

  // Voice -> agent run. The run lives here (above every section) so it
  // survives the navigations it makes itself.
  const { api: cursor, layer: cursorLayer } = useAgentCursor(groundRef)
  const [agentBar, setAgentBar] = useState<AgentBar | null>(null)
  const [assist, setAssist] = useState(false)
  const assistRef = useRef(assist)
  assistRef.current = assist
  const agentRun = useRef<{ stopped: boolean; go?: () => void } | null>(null)
  useEffect(
    () => () => {
      if (agentRun.current) agentRun.current.stopped = true
    },
    [],
  )

  // Selection channel: the page reports what's ticked; we keep the latest
  // object in a ref (fresh closures for its actions) and only re-render
  // when its identity changes.
  const selRef = useRef<BezelSelection | null>(null)
  const [selKey, setSelKey] = useState<string | null>(null)
  const host = useMemo<BezelHost>(
    () => ({
      report: (sel) => {
        selRef.current = sel && sel.rows.length ? sel : null
        const key = selRef.current?.key ?? null
        setSelKey((k) => (k === key ? k : key))
      },
    }),
    [],
  )
  const selection = selKey ? selRef.current : null
  const [preBulkMode, setPreBulkMode] = useState<BezelMode>('quiet')
  // Ticking rows turns the bar into Bulk; un-ticking puts it back.
  useEffect(() => {
    if (selKey) {
      setMode((m) => {
        if (m === 'bulk' || m === 'context') return m
        setPreBulkMode(m === 'ask' ? 'quiet' : m)
        return 'bulk'
      })
    } else {
      setMode((m) => (m === 'bulk' || m === 'context' ? preBulkMode : m))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selKey])
  const script = mode === 'run' && runFrom ? { ...pageScript, run: runFrom } : pageScript

  // Where Emma lives is remembered; whether it's docked right now is not -
  // every visit starts as the quiet bar.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLACEMENT_KEY)
      if (raw) setPlacementState({ ...DEFAULT_PLACEMENT, ...(JSON.parse(raw) as Partial<Placement>), docked: false })
    } catch {
      /* ignore */
    }
  }, [])

  function persist(next: Placement) {
    try {
      window.localStorage.setItem(PLACEMENT_KEY, JSON.stringify({ home: next.home, align: next.align, edge: next.edge, along: next.along, width: next.width }))
    } catch {
      /* ignore */
    }
  }

  function commit(next: Placement) {
    persist(next)
    if (next.docked && threadTurns.length === 0) seedThread()
    setPlacementState(next)
  }

  function place(next: Placement) {
    travel(() => commit(next))
  }

  function moveTo(edge: BezelEdge) {
    place({ ...placement, docked: false, home: 'immersive', edge })
  }

  /** Immersive: drag the bar by its grip; release snaps to the nearest edge
   *  and the view transition carries it there. */
  /** Immersive: drag the chat head anywhere; release snaps it to the
   *  nearest edge and keeps where along that edge you dropped it. */
  function startDrag(sx: number, sy: number) {
    const el = document.querySelector<HTMLElement>('[data-bezel-head]')
    const ground = groundRef.current
    if (!el || !ground) return
    el.style.transition = 'none'
    el.style.zIndex = '60'
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    const move = (ev: PointerEvent) => {
      el.style.translate = `${ev.clientX - sx}px ${ev.clientY - sy}px`
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      const rect = ground.getBoundingClientRect()
      const d: Record<BezelEdge, number> = {
        left: ev.clientX - rect.left,
        right: rect.right - ev.clientX,
        top: ev.clientY - rect.top - 58,
        bottom: rect.bottom - ev.clientY,
      }
      const edge = (Object.keys(d) as Array<BezelEdge>).reduce((a, b) => (d[a] <= d[b] ? a : b))
      const along =
        edge === 'left' || edge === 'right'
          ? (ev.clientY - rect.top - 58) / Math.max(1, rect.height - 58)
          : (ev.clientX - rect.left) / Math.max(1, rect.width)
      travel(() => {
        el.style.translate = ''
        el.style.transition = ''
        el.style.zIndex = ''
        commit({ ...placement, docked: false, home: 'immersive', edge, along: Math.min(0.96, Math.max(0.04, along)) })
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /** Sidebar: drag its inner edge to resize. Live, no transition. */
  function startResize(e: React.PointerEvent<HTMLElement>) {
    e.preventDefault()
    const startX = e.clientX
    const startW = placement.width
    const max = Math.min(SIDEBAR_MAX, Math.round(window.innerWidth * 0.6))
    let last = startW
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const move = (ev: PointerEvent) => {
      last = Math.min(max, Math.max(SIDEBAR_MIN, startW + (startX - ev.clientX)))
      setPlacementState((p) => ({ ...p, width: last }))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      persist({ ...placement, width: last })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // New section = new page context for the bar. A run in flight is the
  // exception, and an open copilot stays open (its thread is about where
  // you were - the pins already point elsewhere).
  // A page with something to say opens on its claim; a quiet one stays out
  // of sight.
  useEffect(() => {
    setMode((m) => (m === 'run' || m === 'agent' ? m : pageScript.attention ? 'found' : 'quiet'))
    setActing(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey])

  /** ⌘E: the claim yields to an input; pressing it again puts it back. */
  function summon() {
    if (docked) {
      document.querySelector<HTMLInputElement>('aside[aria-label="Emma"] [data-bezel-input]')?.focus()
      return
    }
    if (mode === 'ask') return travel(() => setMode(preAskMode))
    setPreAskMode(mode)
    travel(() => setMode('ask'))
  }

  // Hotkeys - always read the latest handlers.
  const keys = useRef({ summon, changeMode: (m: BezelMode) => changeMode(m), moveTo, mode, takeOver: () => takeOver() })
  keys.current = { summon, changeMode: (m: BezelMode) => changeMode(m), moveTo, mode, takeOver: () => takeOver() }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        if (e.shiftKey) keys.current.changeMode('copilot')
        else keys.current.summon()
        return
      }
      const arrows: Record<string, BezelEdge> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'top', ArrowDown: 'bottom' }
      if (e.ctrlKey && e.altKey && !e.metaKey && arrows[e.key]) {
        e.preventDefault()
        keys.current.moveTo(arrows[e.key])
        return
      }
      if (e.key === 'Escape') {
        const m = keys.current.mode
        if (m === 'agent') return keys.current.takeOver()
        if (m === 'expanded' || m === 'tension') keys.current.changeMode('found')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ---------- Voice: Emma drives ---------- */

  function stopAgent() {
    const run = agentRun.current
    agentRun.current = null
    if (run) {
      run.stopped = true
      run.go?.()
    }
    cursor.hide()
  }

  /** Back to whatever the page itself would say. */
  function dismissAgent() {
    stopAgent()
    setAgentBar(null)
    setMode(pageScript.attention ? 'found' : 'quiet')
  }

  /** One click, no state lost: she only ever clicked the app, so the app
   *  is exactly where she left it. */
  function takeOver() {
    if (!agentRun.current) return
    stopAgent()
    setAgentBar({ phase: 'handed', claim: 'You have the wheel', sub: 'the run is where Emma left it · nothing submitted', actions: [] })
  }

  function startVoice() {
    stopAgent()
    const run: { stopped: boolean; go?: () => void } = { stopped: false }
    agentRun.current = run
    setAgentBar(null)
    // Docked: the column travels back into the bar. Floating: switch in
    // place - no morph to wait on (a skipped transition must not eat it).
    if (docked)
      travel(() => {
        setPlacementState((p) => ({ ...p, docked: false }))
        setMode('agent')
      })
    else setMode('agent')
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => window.setTimeout(() => (run.stopped ? reject(STOPPED) : resolve()), ms))
    runVoicePayroll({
      cursor,
      ground: () => groundRef.current,
      bar: (b) => {
        if (!run.stopped) setAgentBar(b)
      },
      assist: () => assistRef.current,
      where: MASTER_IA.find((s) => s.key === sectionKey)?.label ?? 'this page',
      wait,
      hesitate: (ms) =>
        new Promise<void>((resolve, reject) => {
          const done = () => {
            window.clearTimeout(t)
            run.go = undefined
            if (run.stopped) reject(STOPPED)
            else resolve()
          }
          const t = window.setTimeout(done, ms)
          run.go = done
        }),
      takeOver,
      proceed: () => run.go?.(),
      approve: () => {
        // The user's click, not Emma's - she never presses this one.
        groundRef.current?.querySelector<HTMLElement>('[data-agent="approve-run"]')?.click()
        setAgentBar({ phase: 'handed', claim: 'Submitted - by you', sub: 'payroll approved · reversible for 2h · logged', actions: [] })
      },
      finish: () => {
        if (agentRun.current === run) agentRun.current = null
        cursor.hide()
      },
    }).catch((e: unknown) => {
      if (e !== STOPPED) throw e
    })
  }

  function changeMode(next: BezelMode) {
    if (next === 'voice') return startVoice()
    if (mode === 'agent' && next !== 'agent') {
      stopAgent()
      setAgentBar(null)
    }
    if (next === 'copilot') return place({ ...placement, docked: !docked })
    if (docked) {
      // From the docked thread: ⌄ (found) collapses back to the bar as it
      // was; × (quiet) also ends the conversation.
      return travel(() => {
        setPlacementState((p) => ({ ...p, docked: false }))
        if (next === 'quiet') {
          setThreadTurns([])
          setThreadTitle('Ask Emma')
        }
      })
    }
    if (mode === 'ask' && next === 'quiet') return travel(() => setMode(preAskMode))
    if (next === 'run' && mode !== 'run') setRunFrom(pageScript.run)
    // On a side edge a mode change can turn the rail into a card (or back) -
    // morph it like any other move instead of snapping.
    const sideEdge = placement.home === 'immersive' && (placement.edge === 'left' || placement.edge === 'right')
    if (sideEdge) travel(() => setMode(next))
    else setMode(next)
  }

  function act(label: string, grain: GrainProps, onContinue?: { label: string; to: BezelMode }) {
    // Acting needs the undo ring, which lives on the bar - so a decision
    // made in the thread sends Emma back to the bar to show it.
    const apply = () => {
      setPreActingMode(mode === 'acting' ? preActingMode : mode)
      setActing({ label, grain, onContinue })
      setMode('acting')
      setPlacementState((p) => ({ ...p, docked: false }))
    }
    if (docked) travel(apply)
    else apply()
  }

  function undoActing() {
    setMode(preActingMode)
    setActing(null)
  }

  function seedThread() {
    setThreadTitle(script.thread.title)
      setThreadTurns([{ from: 'user', text: script.thread.question }])
      window.setTimeout(() => {
        setThreadTurns((t) => [
          ...t,
          {
            from: 'emma',
            grain: {
              claim: script.tension.claim,
              confidence: script.tension.confidence,
              facts: script.tension.facts,
              provenance: script.tension.provenance,
              risk: true,
              exits: script.tension.exits((result) =>
                act(
                  result,
                  { claim: result, liveness: { kind: 'stamped', asOf: '14:22' }, provenance: 'resolved by you · logged' },
                  script.tension.continueLabel ? { label: script.tension.continueLabel, to: 'run' } : undefined,
                ),
              ),
            },
          },
        ])
      }, 520)
  }

  /** "Ask about these": the rows travel with the question as context, and
   *  the answer is computed from exactly those rows. */
  function sendContext(text: string) {
    const sel = selRef.current
    if (!sel) return sendFollowUp(text)
    const n = sel.rows.length
    const grain = sel.answer(text)
    travel(() => {
      setThreadTitle(text)
      setThreadTurns([{ from: 'user', text: `${text} · with ${n} ${n === 1 ? sel.noun : (sel.nounPlural ?? `${sel.noun}s`)} attached` }])
      setPlacementState((p) => ({ ...p, docked: true }))
    })
    window.setTimeout(() => setThreadTurns((t) => [...t, { from: 'emma', grain }]), 550)
    sel.clear()
  }

  function sendFollowUp(text: string) {
    const reply = () =>
      window.setTimeout(() => setThreadTurns((t) => [...t, { from: 'emma', text: script.thread.followUp }]), 500)
    if (!docked) {
      // Asked from the bar: the bar travels to become the copilot input,
      // carrying the question with it.
      travel(() => {
        setThreadTitle(text)
        setThreadTurns([{ from: 'user', text }])
        setMode(preAskMode)
        setPlacementState((p) => ({ ...p, docked: true }))
      })
      reply()
      return
    }
    if (threadTurns.length === 0) setThreadTitle(text)
    setThreadTurns((t) => [...t, { from: 'user', text }])
    reply()
  }

  // Cross-section initiatives: what's open elsewhere in the app.
  // Wallet speaks with the Payments script, so it must not pin Payments too.
  const ownKey = sectionKey === 'wallet' ? 'payments' : sectionKey
  const pins: Array<PinnedInitiative> = PINNABLE.filter((key) => key !== ownKey && !dismissedPins.has(key)).map((key) => {
    const other = bezelScriptFor(key, payments)
    const label = MASTER_IA.find((s) => s.key === key)?.label ?? key
    return {
      key,
      grain: {
        claim: other.tension.claim,
        confidence: other.tension.confidence,
        provenance: `in ${label}`,
        exits: [
          {
            label: `Go to ${label}`,
            variant: 'primary',
            onSelect: () => navigate({ to: '/app/$section', params: { section: key } }),
          },
          { label: 'Later', variant: 'quiet', onSelect: () => setDismissedPins((s) => new Set(s).add(key)) },
        ],
      },
    }
  })

  /* ---------- Director: the mock dock can force any mode/situation ---------- */

  /** A believable selection when the dock asks for Bulk/As context and the
   *  page has nothing ticked (bezel_7's "preselect 3"). */
  function demoSelection(): BezelSelection {
    const clear = () => {
      selRef.current = null
      setSelKey(null)
    }
    if (sectionKey === 'payments' || sectionKey === 'wallet') {
      const rows = flow.invoices.filter((i) => i.status === 'pending').slice(0, 3)
      return {
        key: `demo-invoices:${rows.map((r) => r.id).join(',')}`,
        noun: 'invoice',
        rows: rows.map((i) => invoiceRow(i, flow.today)),
        ...invoicesSummary(rows, flow.today),
        actions: [{ label: 'Export', onSelect: () => `Exported ${rows.length} invoices` }],
        answer: () => invoicesAnswer(rows, { today: flow.today, wallets: flow.wallets }, () => {}),
        clear,
        remove: clear,
      }
    }
    const rows = employees.filter((e) => e.jobTitle === 'Payroll Specialist').slice(0, 3)
    return {
      key: `demo-people:${rows.map((r) => r.id).join(',')}`,
      noun: 'person',
      nounPlural: 'people',
      rows: rows.map(employeeRow),
      ...employeesSummary(rows),
      actions: [{ label: 'Export', onSelect: () => `Exported ${rows.length} rows` }],
      answer: () => employeesAnswer(rows, employees),
      clear,
      remove: clear,
    }
  }

  function direct(next: BezelMode) {
    if (agentRun.current && next !== 'agent') dismissAgent()
    const undock = () => setPlacementState((p) => ({ ...p, docked: false }))
    switch (next) {
      case 'agent':
        return startVoice()
      case 'copilot':
        return place({ ...placement, docked: true })
      case 'acting': {
        // The first exit of this page's own tension, as if you'd picked it.
        let label = 'Decision logged'
        script.tension.exits((result) => {
          label = result
        })[0]?.onSelect?.()
        return act(label, { claim: label, liveness: { kind: 'stamped', asOf: '14:22' }, provenance: 'resolved by you · reversible for 30s' })
      }
      case 'bulk':
      case 'context': {
        if (!selRef.current) {
          const demo = demoSelection()
          selRef.current = demo
          setSelKey(demo.key)
        }
        return travel(() => {
          undock()
          setMode(next)
        })
      }
      case 'run':
        setRunFrom(pageScript.run)
        return travel(() => {
          undock()
          setMode('run')
        })
      default:
        if (next === 'ask') setPreAskMode(mode === 'ask' ? preAskMode : mode)
        return travel(() => {
          undock()
          setMode(next)
        })
    }
  }

  const directorApi = useRef({ direct, place, startVoice, dismissAgent, placement, pageScript })
  directorApi.current = { direct, place, startVoice, dismissAgent, placement, pageScript }
  useEffect(
    () =>
      bezelDirector.register({
        setMode: (m) => directorApi.current.direct(m),
        place: (n) => directorApi.current.place({ ...directorApi.current.placement, ...n }),
        startAgent: () => directorApi.current.startVoice(),
        stopAgent: () => directorApi.current.dismissAgent(),
        restorePins: () => setDismissedPins(new Set()),
        reset: () => {
          directorApi.current.dismissAgent()
          selRef.current = null
          setSelKey(null)
          setActing(null)
          travel(() => {
            setPlacementState((p) => ({ ...p, docked: false }))
            setMode(directorApi.current.pageScript.attention ? 'found' : 'quiet')
          })
        },
      }),
    [],
  )
  useEffect(() => {
    bezelDirector.publish({
      section: sectionKey,
      mode: docked ? 'copilot' : mode,
      docked,
      home: placement.home,
      edge: placement.edge,
      pinsWaiting: pins.length,
      pinsDismissed: dismissedPins.size,
      selected: selRef.current?.rows.length ?? 0,
      agentRunning: !!agentRun.current,
      attention: !!pageScript.attention,
    })
  })

  const roam = placement.home === 'immersive'
  const barEdge: BezelEdge = roam ? placement.edge : 'bottom'
  // The menu opens away from the edge the bar sits on.
  const menuSide = docked ? 'bottom' : ({ bottom: 'top', top: 'bottom', left: 'right', right: 'left' } as const)[barEdge]
  const menu = <PlacementMenu placement={placement} onChange={place} side={menuSide} />
  const bezel = (ground: React.RefObject<HTMLElement | null>) => (
    <FloatingBezel
      containerRef={ground}
      script={script}
      mode={docked ? 'copilot' : mode}
      onModeChange={changeMode}
      pinned={pins}
      onDismissPins={() => setDismissedPins(new Set(PINNABLE))}
      selection={selection?.rows ?? []}
      bulk={selection ? { noun: selection.noun, nounPlural: selection.nounPlural, total: selection.total, note: selection.note, actions: selection.actions } : undefined}
      onClearSelection={() => selRef.current?.clear()}
      onRemoveFromSelection={(id) => selRef.current?.remove(id)}
      acting={acting}
      onAct={act}
      onUndoActing={undoActing}
      threadTitle={threadTitle}
      threadTurns={threadTurns}
      onSendFollowUp={sendFollowUp}
      onSendContext={sendContext}
      agent={agentBar ? { bar: agentBar, onStop: dismissAgent, assist, onToggleAssist: () => setAssist((a) => !a) } : null}
      edge={barEdge}
      align={placement.align}
      onAlignChange={(align) => commit({ ...placement, align })}
      topInset={58}
      head={
        roam
          ? {
              along: placement.along,
              // Things waiting: this page's finding + what's open elsewhere.
              badge: (pageScript.attention ? 1 : 0) + pins.length,
              onDragAway: (x, y) => startDrag(x, y),
              onDock: () => place({ ...placement, docked: false, home: 'dock' }),
            }
          : undefined
      }
      dockFill
      accessory={menu}
      transitionName="emma-bezel"
    />
  )

  const hidden = !docked && mode === 'quiet'
  const tintIds = mode === 'found' || mode === 'expanded' ? (script.found.rowIds ?? []) : []
  const parentLinks = useContext(AppBarLinksContext)
  const column = (
    <aside ref={columnRef} aria-label="Emma" className="relative h-full shrink-0" style={{ width: placement.width }}>
      {/* Resize: drag the inner edge. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize Emma"
        title="Drag to resize"
        onPointerDown={startResize}
        className="group absolute inset-y-3 left-0 z-40 flex w-3 cursor-col-resize items-center justify-center"
      >
        <span className="h-10 w-1 rounded-full bg-(--elevation-alpha-16) transition-[height,background-color] group-hover:h-16 group-hover:bg-(--text-muted)" />
      </div>
      {/* FloatingBezel's docked geometry insets by its own gap. */}
      <div className="pointer-events-auto">{bezel(columnRef)}</div>
    </aside>
  )

  return (
    <BezelHostContext.Provider value={host}>
    <AppBarLinksContext.Provider value={{ ...parentLinks, onAiClick: summon }}>
    <div className="niural-surface flex h-full min-h-0 dark:bg-surface-app">
      {/* App column - reflows beside the Sidebar. */}
      <div
        ref={groundRef}
        className="relative h-full min-w-0 flex-1"
        style={{ viewTransitionName: 'emma-app' }}
      >
        {children}
        {cursorLayer}
        {tintIds.length > 0 && (
          // Found: the rows the claim is about tint underneath (Bezel doc).
          <style>{`${tintIds.map((id) => `[data-bezel-row="${id}"]`).join(',')}{background-color:var(--brand-base) !important;box-shadow:inset 2px 0 0 var(--brand-primary)}`}</style>
        )}
        {!docked && !hidden && (
          <div className="pointer-events-none absolute inset-0 z-30">
            <div className="pointer-events-auto">{bezel(groundRef)}</div>
          </div>
        )}
      </div>
      {docked && column}
    </div>
    </AppBarLinksContext.Provider>
    </BezelHostContext.Provider>
  )
}

