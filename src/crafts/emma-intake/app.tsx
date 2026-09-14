import { useMemo, useState } from 'react'
import type { IntakeView } from './catalog'
import { makeView } from './catalog'
import { useExplorer } from '@/components/playground/explorer'
import { ConfirmedPhase, EntryPhase, StagingPhase } from './phase-views'
import { XRayView } from './xray-view'
import type { IntakeFlowConfig } from '@/mocks/emma-intake'

/**
 * One frame per catalog screen (mirrors schedule-report/multi-payroll's
 * app.tsx). The selected screen renders its selected state; every other
 * frame shows its first state. Each frame owns tiny local state so a
 * frozen snapshot still feels alive (typing, field-focus, remove-file)
 * without navigating away from the state it's meant to demonstrate.
 */

function EntryFrame({ flow, captured }: { flow: IntakeFlowConfig; captured: boolean }) {
  const [file, setFile] = useState(
    captured ? { name: flow.fileNameHint, sizeLabel: flow.fileSizeHint } : null,
  )
  const [intent, setIntent] = useState('')

  return (
    <EntryPhase
      flow={flow}
      file={file}
      intent={intent}
      onIntentChange={setIntent}
      onBrowse={(files) => {
        const picked = files?.[0]
        if (picked) {
          setFile({ name: picked.name, sizeLabel: `${Math.max(1, Math.round(picked.size / 1024))} KB` })
        }
      }}
      onClearFile={() => setFile(null)}
      onSubmit={() => {}}
      isDragActive={false}
    />
  )
}

function StagingFrame({ flow, scenarioId }: { flow: IntakeFlowConfig; scenarioId: string }) {
  const scenario = flow.scenarios.find((s) => s.id === scenarioId) ?? flow.scenarios[0]
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState('')

  return (
    <StagingPhase
      flow={flow}
      scenario={scenario}
      overrides={overrides}
      activeBlockId={activeBlockId}
      onFieldFocus={setActiveBlockId}
      onFieldEdit={(fieldId, value) => setOverrides((o) => ({ ...o, [fieldId]: value }))}
      fileLabel={flow.fileNameHint}
      followUpIntent={followUp}
      onFollowUpChange={setFollowUp}
      onCancel={() => {}}
      onConfirm={() => {}}
    />
  )
}

function ConfirmedFrame({ flow }: { flow: IntakeFlowConfig }) {
  const summary = useMemo(() => flow.createSummary(flow.scenarios[0]), [flow])
  return <ConfirmedPhase summary={summary} onStartOver={() => {}} />
}

function XRayFrame({ flow }: { flow: IntakeFlowConfig }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [, setActiveBlockId] = useState<string | null>(null)

  return (
    <div className="h-full min-h-[420px] p-8">
      <XRayView
        filename={flow.document.filename}
        timeline={flow.timeline}
        cards={flow.scenarios[0].cards}
        overrides={overrides}
        onFieldFocus={setActiveBlockId}
        onFieldEdit={(fieldId, value) => setOverrides((o) => ({ ...o, [fieldId]: value }))}
        onDone={() => {}}
      />
    </div>
  )
}

function Screen({ view }: { view: IntakeView }) {
  switch (view.kind) {
    case 'entry':
      return <EntryFrame flow={view.flow} captured={view.captured} />
    case 'xray':
      return <XRayFrame flow={view.flow} />
    case 'staging':
      return <StagingFrame flow={view.flow} scenarioId={view.scenarioId} />
    case 'confirmed':
      return <ConfirmedFrame flow={view.flow} />
  }
}

export function renderWithChrome(view: IntakeView, remountKey: string): React.ReactNode {
  return (
    <div key={remountKey} className="h-full min-h-0 overflow-hidden bg-background-highlight/30">
      <Screen view={view} />
    </div>
  )
}

export function ScreenFrame({ screenId }: { screenId: string }) {
  const { screenId: selectedId, stateId } = useExplorer()
  // '' falls back to the screen's first state inside makeView
  const stateKey = selectedId === screenId ? stateId : ''

  return useMemo(
    () => renderWithChrome(makeView(screenId, stateKey), `${screenId}:${stateKey}`),
    [screenId, stateKey],
  )
}
