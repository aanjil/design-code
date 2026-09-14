import { useMemo, useRef, useState } from 'react'
import type { CanvasGroupDef, CanvasWindowDef } from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import {
  EXPLORER_PANEL_RESERVED_RIGHT,
  ExplorerPanel,
  ExplorerProvider,
  useExplorer,
} from '@/components/playground/explorer'
import { CONTRACT_FLOW, EXPENSE_FLOW } from '@/mocks/emma-intake'
import type { IntakeFlowConfig } from '@/mocks/emma-intake'
import { CATALOG_SCREEN_IDS, EXPLORER_CATALOG, EXPLORER_CATALOG_DEF } from './catalog'
import { ScreenFrame } from './app'
import type { CapturedFile } from './floating-copilot'
import { ConfirmedPhase, EntryPhase, StagingPhase } from './phase-views'
import { XRayView } from './xray-view'

/**
 * Same shape as multi-payroll/schedule-report: two real, live-interactive
 * "App" windows (one per use case - Contract Intelligence, Expense), each
 * a full instance of the intake flow with real drag/drop and timers,
 * pinned first on the canvas; below them, a frozen catalog matrix (one
 * window per screen state) driven by the Explorer panel for design review.
 */

type Phase = 'idle' | 'captured' | 'xray' | 'staging' | 'confirmed'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function EmmaIntakeExperience({ config }: { config: IntakeFlowConfig }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<CapturedFile | null>(null)
  const [intent, setIntent] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const [scenarioId, setScenarioId] = useState(config.scenarios[0].id)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const dragCounter = useRef(0)

  const activeScenario =
    config.scenarios.find((s) => s.id === scenarioId) ?? config.scenarios[0]
  const canDrop = phase === 'idle' || phase === 'captured'

  function reset() {
    setPhase('idle')
    setFile(null)
    setIntent('')
    setFollowUp('')
    setOverrides({})
    setActiveBlockId(null)
    setScenarioId(config.scenarios[0].id)
    setIsDragActive(false)
    dragCounter.current = 0
  }

  function captureFile(nativeFile: File) {
    setFile({ name: nativeFile.name, sizeLabel: formatBytes(nativeFile.size) })
    setPhase('captured')
  }

  function handleConfirm() {
    setSummary(config.createSummary(activeScenario))
    setPhase('confirmed')
  }

  return (
    <div
      className="relative h-full min-h-0 overflow-hidden bg-background-highlight/30"
      onDragEnter={(e) => {
        if (!canDrop) return
        e.preventDefault()
        dragCounter.current += 1
        setIsDragActive(true)
      }}
      onDragOver={(e) => {
        if (!canDrop) return
        e.preventDefault()
      }}
      onDragLeave={(e) => {
        if (!canDrop) return
        e.preventDefault()
        dragCounter.current = Math.max(0, dragCounter.current - 1)
        if (dragCounter.current === 0) setIsDragActive(false)
      }}
      onDrop={(e) => {
        if (!canDrop) return
        e.preventDefault()
        dragCounter.current = 0
        setIsDragActive(false)
        const dropped = e.dataTransfer.files?.[0]
        if (dropped) captureFile(dropped)
      }}
    >
      {(phase === 'idle' || phase === 'captured') && (
        <EntryPhase
          flow={config}
          file={file}
          intent={intent}
          onIntentChange={setIntent}
          onBrowse={(files) => {
            const picked = files?.[0]
            if (picked) captureFile(picked)
          }}
          onClearFile={() => {
            setFile(null)
            setPhase('idle')
          }}
          onSubmit={() => file && setPhase('xray')}
          isDragActive={isDragActive}
        />
      )}

      {phase === 'xray' && (
        <div className="h-full min-h-[420px] p-8">
          <XRayView
            filename={config.document.filename}
            timeline={config.timeline}
            cards={config.scenarios[0].cards}
            overrides={overrides}
            onFieldFocus={setActiveBlockId}
            onFieldEdit={(fieldId, value) => setOverrides((o) => ({ ...o, [fieldId]: value }))}
            onDone={() => setPhase('staging')}
          />
        </div>
      )}

      {phase === 'staging' && (
        <StagingPhase
          flow={config}
          scenario={activeScenario}
          overrides={overrides}
          activeBlockId={activeBlockId}
          onFieldFocus={setActiveBlockId}
          onFieldEdit={(fieldId, value) => setOverrides((o) => ({ ...o, [fieldId]: value }))}
          fileLabel={file?.name ?? config.fileNameHint}
          followUpIntent={followUp}
          onFollowUpChange={setFollowUp}
          onCancel={reset}
          onConfirm={handleConfirm}
        />
      )}

      {phase === 'confirmed' && <ConfirmedPhase summary={summary} onStartOver={reset} />}
    </div>
  )
}

const FRAME_W = 1512
const FRAME_H = 910
const FRAME_GAP = 96
const MARGIN_X = 200
const MARGIN_Y = 220
const GROUP_GAP = 380

const APPS = [
  { id: 'contract-app', label: 'Contract Intelligence - App', config: CONTRACT_FLOW },
  { id: 'expense-app', label: 'Expense - App', config: EXPENSE_FLOW },
]

function buildCanvas() {
  const windows: Array<CanvasWindowDef> = []
  const groups: Array<CanvasGroupDef> = []

  let x = MARGIN_X
  for (const app of APPS) {
    windows.push({
      id: app.id,
      title: app.label,
      url: `nexus.niural.com/bills#${app.id}`,
      x,
      y: MARGIN_Y,
      width: FRAME_W,
      height: FRAME_H,
      content: <EmmaIntakeExperience config={app.config} />,
    })
    groups.push({ id: app.id, label: app.label, windowIds: [app.id] })
    x += FRAME_W + FRAME_GAP
  }
  const appsRight = x - FRAME_GAP

  let y = MARGIN_Y + FRAME_H + GROUP_GAP
  let maxRight = appsRight
  for (const group of EXPLORER_CATALOG) {
    let gx = MARGIN_X
    const windowIds: Array<string> = []
    for (const screen of group.screens) {
      windows.push({
        id: screen.id,
        title: screen.label,
        url: `nexus.niural.com/bills#${screen.id}`,
        x: gx,
        y,
        width: FRAME_W,
        height: FRAME_H,
        content: <ScreenFrame screenId={screen.id} />,
      })
      windowIds.push(screen.id)
      gx += FRAME_W + FRAME_GAP
    }
    maxRight = Math.max(maxRight, gx - FRAME_GAP)
    groups.push({ id: group.group, label: group.group, windowIds })
    y += FRAME_H + GROUP_GAP
  }

  return {
    windows,
    groups,
    surfaceW: maxRight + MARGIN_X,
    surfaceH: y - GROUP_GAP + MARGIN_Y,
  }
}

function EmmaIntakeCanvas() {
  const explorer = useExplorer()
  const canvas = useMemo(() => buildCanvas(), [])

  return (
    <CanvasCraft
      slug="emma-intake"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.04}
      focusWindow={{ id: explorer.screenId, nonce: explorer.focusNonce }}
      onFocusChange={(id) => {
        if (CATALOG_SCREEN_IDS.has(id)) explorer.show(id)
      }}
      reservedRight={EXPLORER_PANEL_RESERVED_RIGHT}
      overlays={<ExplorerPanel />}
    />
  )
}

export function EmmaIntake() {
  return (
    <ExplorerProvider catalog={EXPLORER_CATALOG_DEF} storageKey="emma-intake">
      <EmmaIntakeCanvas />
    </ExplorerProvider>
  )
}
