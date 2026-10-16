import { useState } from 'react'
import {
  CaretDown,
  CaretRight,
  CheckCircle,
  Clock,
  Spinner,
  WarningCircle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Badge, Tabs } from '@niural/components'
import {
  loadingState,
  streamingAnswer,
  taskRows,
  thinkingTrace,
} from '@/mocks/ai-components'
import type {
  StreamSource,
  TaskRow,
  TaskRowStatus,
  ThinkingStep,
} from '@/mocks/ai-components'

/**
 * Agent status & reasoning: the loading/progress states an agent shows while
 * it works - a live loader, an expandable thinking trace, a streamed answer
 * with sources, and a task checklist with sub-steps.
 */

const DRIVE_KEYFRAMES = `@keyframes nds-loading-drive { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`

export function LoadingState({
  label = loadingState.label,
  elapsedSeconds = loadingState.elapsedSeconds,
  variant = 'drive',
  className,
}: {
  label?: string
  elapsedSeconds?: number
  variant?: 'drive' | 'dots' | 'orbit'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {variant === 'drive' && (
        <>
          <style>{DRIVE_KEYFRAMES}</style>
          <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-brand [animation:nds-loading-drive_1.4s_ease-in-out_infinite]" />
          </div>
        </>
      )}
      {variant === 'dots' && (
        <div className="flex shrink-0 items-center gap-1">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" />
          <span className="size-1.5 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
        </div>
      )}
      {variant === 'orbit' && (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-base border-t-brand" />
      )}
      <p className="text-label-xsmall text-muted">
        <span className="text-primary">{label}</span> · {elapsedSeconds}s
      </p>
    </div>
  )
}

function StatusIcon({ status }: { status: TaskRowStatus }) {
  if (status === 'completed') {
    return (
      <CheckCircle weight="fill" className="size-4 shrink-0 text-success" />
    )
  }
  if (status === 'running') {
    return (
      <Spinner
        weight="bold"
        className="size-4 shrink-0 animate-[spin_1.5s_linear_infinite] text-info"
      />
    )
  }
  if (status === 'failed') {
    return (
      <WarningCircle weight="fill" className="size-4 shrink-0 text-error" />
    )
  }
  if (status === 'deferred') {
    return <Clock weight="bold" className="size-4 shrink-0 text-warning" />
  }
  return (
    <span className="flex size-4 shrink-0 items-center justify-center">
      <span className="size-1.5 rounded-full bg-emphasis" />
    </span>
  )
}

// Mounted only while the trace is open, so the active tab resets to the first
// one on every reopen (same as the old uncontrolled `defaultValue`).
function ThinkingTabs({
  tabs,
  steps,
}: {
  tabs: ReadonlyArray<string>
  steps: Array<ThinkingStep>
}) {
  const [tab, setTab] = useState(tabs[0] ?? '')

  return (
    <>
      <Tabs
        variant="segmented"
        tabs={tabs.map((t) => ({ label: t, value: t }))}
        value={tab}
        onChange={setTab}
      />
      {tab === 'Steps' ? (
        <ol className="mt-3 flex flex-col gap-2.5">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-emphasis" />
              <span className="flex-1 text-paragraph-xsmall text-primary">
                {step.label}
              </span>
              {step.count && (
                <Badge status="neutral" type="soft">
                  {step.count}
                </Badge>
              )}
            </li>
          ))}
        </ol>
      ) : tab ? (
        <p className="mt-3 text-paragraph-xsmall text-muted">
          No {tab.toLowerCase()} trace recorded for this run.
        </p>
      ) : null}
    </>
  )
}

export function Thinking({
  durationSeconds = thinkingTrace.durationSeconds,
  steps = thinkingTrace.steps,
  tabs = thinkingTrace.tabs,
  defaultOpen = false,
  className,
}: {
  durationSeconds?: number
  steps?: Array<ThinkingStep>
  tabs?: ReadonlyArray<string>
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('rounded-xl bg-surface-frame borders-base', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-left"
      >
        {open ? (
          <CaretDown className="size-4 shrink-0 text-muted" />
        ) : (
          <CaretRight className="size-4 shrink-0 text-muted" />
        )}
        <span className="text-label-xsmall text-primary">
          Thought for {durationSeconds} seconds
        </span>
      </button>
      {open && (
        <div className="border-t border-base px-3 py-3">
          <ThinkingTabs tabs={tabs} steps={steps} />
        </div>
      )}
    </div>
  )
}

export function StreamingText({
  text = streamingAnswer.text,
  sourceCount = streamingAnswer.sourceCount,
  sources = streamingAnswer.sources,
  followUps = streamingAnswer.followUps,
  className,
}: {
  text?: string
  sourceCount?: number
  sources?: Array<StreamSource>
  followUps?: Array<string>
  className?: string
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-paragraph-small text-primary">{text}</p>
      <div>
        <button
          type="button"
          onClick={() => setSourcesOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-label-xsmall text-muted hover:text-primary"
        >
          {sourcesOpen ? (
            <CaretDown className="size-3.5" />
          ) : (
            <CaretRight className="size-3.5" />
          )}
          {sourceCount} sources
        </button>
        {sourcesOpen && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {sources.map((source) => (
              <li
                key={source.domain}
                className="flex items-center gap-1.5 text-paragraph-xsmall text-muted"
              >
                <span className="text-primary">{source.label}</span>
                <span>· {source.domain}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {followUps.map((followUp) => (
          <button
            key={followUp}
            type="button"
            className="rounded-full border border-base px-2.5 py-1 text-label-xsmall text-primary hover:bg-highlight"
          >
            {followUp}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TaskRows({
  rows = taskRows,
  openIndex,
  onOpenChange,
  className,
}: {
  rows?: Array<TaskRow & { content?: React.ReactNode }>
  /**
   * Drives which row is expanded from outside (e.g. a dynamic timeline that
   * auto-opens whichever row currently needs attention). Omit for the default
   * uncontrolled behavior (each row toggles its own open state on click).
   */
  openIndex?: number | null
  onOpenChange?: (index: number | null) => void
  className?: string
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState<Record<number, boolean>>({})
  const isControlled = openIndex !== undefined

  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {rows.map((row, i) => {
        const isOpen = isControlled ? openIndex === i : !!uncontrolledOpen[i]
        const hasSubRows = !!row.subRows?.length
        const hasContent = !!row.content
        const expandable = hasSubRows || hasContent

        function toggle() {
          if (isControlled) {
            onOpenChange?.(isOpen ? null : i)
          } else {
            setUncontrolledOpen((prev) => ({ ...prev, [i]: !prev[i] }))
          }
        }

        return (
          <li key={row.label}>
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-highlight">
              <StatusIcon status={row.status} />
              <span className="flex-1 truncate text-label-xsmall text-primary">
                {row.label}
              </span>
              {row.meta && (
                <span className="shrink-0 text-caption-sm text-muted">{row.meta}</span>
              )}
              {expandable && (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                  className="flex size-5 shrink-0 items-center justify-center text-muted"
                >
                  {isOpen ? (
                    <CaretDown className="size-3.5" />
                  ) : (
                    <CaretRight className="size-3.5" />
                  )}
                </button>
              )}
            </div>
            {hasContent && isOpen && <div className="ml-6 mt-1 mr-1">{row.content}</div>}
            {!hasContent && hasSubRows && isOpen && (
              <ul className="ml-6 flex flex-col gap-1 border-l border-base pl-3">
                {row.subRows!.map((sub) => (
                  <li key={sub.label} className="flex items-center gap-2 py-1">
                    <StatusIcon status={sub.status} />
                    <span className="flex-1 truncate text-paragraph-xsmall text-primary">
                      {sub.label}
                    </span>
                    {sub.meta && (
                      <span className="shrink-0 text-caption-sm text-muted">{sub.meta}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}
