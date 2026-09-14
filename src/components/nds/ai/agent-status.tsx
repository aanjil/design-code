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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
          <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-background-muted">
            <div className="h-full w-1/3 rounded-full bg-brand-primary [animation:nds-loading-drive_1.4s_ease-in-out_infinite]" />
          </div>
        </>
      )}
      {variant === 'dots' && (
        <div className="flex shrink-0 items-center gap-1">
          <span className="size-1.5 animate-pulse rounded-full bg-brand-primary" />
          <span className="size-1.5 animate-pulse rounded-full bg-brand-primary [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-brand-primary [animation-delay:300ms]" />
        </div>
      )}
      {variant === 'orbit' && (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-border-base border-t-brand-primary" />
      )}
      <p className="text-label-xs text-text-muted">
        <span className="text-text-primary">{label}</span> · {elapsedSeconds}s
      </p>
    </div>
  )
}

function StatusIcon({ status }: { status: TaskRowStatus }) {
  if (status === 'completed') {
    return (
      <CheckCircle weight="fill" className="size-4 shrink-0 text-text-success-base" />
    )
  }
  if (status === 'running') {
    return (
      <Spinner
        weight="bold"
        className="size-4 shrink-0 animate-[spin_1.5s_linear_infinite] text-text-info-base"
      />
    )
  }
  if (status === 'failed') {
    return (
      <WarningCircle weight="fill" className="size-4 shrink-0 text-text-error-base" />
    )
  }
  if (status === 'deferred') {
    return <Clock weight="bold" className="size-4 shrink-0 text-text-warning-base" />
  }
  return (
    <span className="flex size-4 shrink-0 items-center justify-center">
      <span className="size-1.5 rounded-full bg-background-emphasis" />
    </span>
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
    <div className={cn('rounded-xl bg-surface-1 shadow-border-base', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-left"
      >
        {open ? (
          <CaretDown className="size-4 shrink-0 text-text-muted" />
        ) : (
          <CaretRight className="size-4 shrink-0 text-text-muted" />
        )}
        <span className="text-label-xs text-text-primary">
          Thought for {durationSeconds} seconds
        </span>
      </button>
      {open && (
        <div className="border-t border-border-highlight px-3 py-3">
          <Tabs defaultValue={tabs[0]}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab} value={tab}>
                {tab === 'Steps' ? (
                  <ol className="mt-3 flex flex-col gap-2.5">
                    {steps.map((step) => (
                      <li key={step.label} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-background-emphasis" />
                        <span className="flex-1 text-paragraph-xs text-text-primary">
                          {step.label}
                        </span>
                        {step.count && <Badge variant="secondary">{step.count}</Badge>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-paragraph-xs text-text-muted">
                    No {tab.toLowerCase()} trace recorded for this run.
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
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
      <p className="text-paragraph-sm text-text-primary">{text}</p>
      <div>
        <button
          type="button"
          onClick={() => setSourcesOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-label-xs text-text-muted hover:text-text-primary"
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
                className="flex items-center gap-1.5 text-paragraph-xs text-text-muted"
              >
                <span className="text-text-primary">{source.label}</span>
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
            className="rounded-full border border-border-base px-2.5 py-1 text-label-xs text-text-primary hover:bg-background-highlight"
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
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-background-highlight">
              <StatusIcon status={row.status} />
              <span className="flex-1 truncate text-label-xs text-text-primary">
                {row.label}
              </span>
              {row.meta && (
                <span className="shrink-0 text-caption text-text-muted">{row.meta}</span>
              )}
              {expandable && (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                  className="flex size-5 shrink-0 items-center justify-center text-text-muted"
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
              <ul className="ml-6 flex flex-col gap-1 border-l border-border-highlight pl-3">
                {row.subRows!.map((sub) => (
                  <li key={sub.label} className="flex items-center gap-2 py-1">
                    <StatusIcon status={sub.status} />
                    <span className="flex-1 truncate text-paragraph-xs text-text-primary">
                      {sub.label}
                    </span>
                    {sub.meta && (
                      <span className="shrink-0 text-caption text-text-muted">{sub.meta}</span>
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
