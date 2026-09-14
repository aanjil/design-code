import { CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { IntakeFlowConfig, IntakeScenario } from '@/mocks/emma-intake'
import type { CapturedFile } from './floating-copilot'
import { PromptBarFloater } from './floating-copilot'
import { DocumentViewer } from './document-viewer'
import { StagingCards } from './staging-cards'

/**
 * Presentational phase renders shared by the live App (real state machine,
 * `src/crafts/emma-intake/index.tsx`) and the frozen catalog frames
 * (`app.tsx`) - same components, different props, no duplicated JSX.
 */

export function EntryPhase({
  flow,
  file,
  intent,
  onIntentChange,
  onBrowse,
  onClearFile,
  onSubmit,
  isDragActive,
}: {
  flow: IntakeFlowConfig
  file: CapturedFile | null
  intent: string
  onIntentChange: (value: string) => void
  onBrowse: (fileList: FileList | null) => void
  onClearFile: () => void
  onSubmit: () => void
  isDragActive: boolean
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-end gap-8 p-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-label-sm text-text-muted">{flow.label} entry point</p>
        <p className="max-w-[360px] text-paragraph-xs text-text-disabled">
          A real page (Add Bill, Vendors…) would already be here - drag a file
          anywhere in this area, or use the composer below.
        </p>
      </div>
      <PromptBarFloater
        file={file}
        intent={intent}
        onIntentChange={onIntentChange}
        onBrowse={onBrowse}
        onClearFile={onClearFile}
        onSubmit={onSubmit}
        isDragActive={isDragActive}
        dropHint={flow.dropHint}
        placeholder={flow.dropHint}
      />
    </div>
  )
}

export function StagingPhase({
  flow,
  scenario,
  overrides,
  activeBlockId,
  onFieldFocus,
  onFieldEdit,
  fileLabel,
  followUpIntent,
  onFollowUpChange,
  onCancel,
  onConfirm,
}: {
  flow: IntakeFlowConfig
  scenario: IntakeScenario
  overrides: Record<string, string>
  activeBlockId: string | null
  onFieldFocus: (blockId: string) => void
  onFieldEdit: (fieldId: string, value: string) => void
  fileLabel: string
  followUpIntent: string
  onFollowUpChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4 p-4 md:p-6">
      <div className="grid flex-1 gap-4 md:grid-cols-[55fr_45fr]">
        <div className="h-full min-h-[380px]">
          <DocumentViewer document={flow.document} activeBlockId={activeBlockId} />
        </div>
        <div className="h-full min-h-[380px] overflow-y-auto pr-1">
          <StagingCards
            scenario={scenario}
            overrides={overrides}
            onFieldFocus={onFieldFocus}
            onFieldEdit={onFieldEdit}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-full bg-background-base p-2 shadow-button-gray">
        <span className="hidden shrink-0 truncate pl-3 text-label-xs text-text-muted sm:block sm:max-w-[140px]">
          {fileLabel}
        </span>
        <PromptBarFloater
          compact
          file={null}
          intent={followUpIntent}
          onIntentChange={onFollowUpChange}
          onBrowse={() => {}}
          onClearFile={() => {}}
          onSubmit={() => onFollowUpChange('')}
          placeholder="Ask Emma to change terms, split line items, or update text…"
          className="flex-1"
        />
        <div className="ml-auto flex shrink-0 items-center gap-2 pr-1">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button size="sm" onClick={onConfirm}>
            <span className="px-1">Confirm &amp; Create</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmedPhase({
  summary,
  onStartOver,
}: {
  summary: string
  onStartOver: () => void
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-background-success-highlight">
        <CheckCircle weight="fill" className="size-6 text-text-success-base" />
      </span>
      <p className="max-w-[420px] text-paragraph-sm text-text-primary">{summary}</p>
      <Button variant="outline" size="sm" onClick={onStartOver}>
        <span className="px-1">Start over</span>
      </Button>
    </div>
  )
}
