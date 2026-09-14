import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { GrainDensity, GrainExit, GrainFact, GrainLiveness } from './types'
import { densityFromConfidence } from './types'
import { ConfidenceMeter, ExitButton, FactsTable, LivenessBadge, Provenance } from './atoms'
import { useStreamedText } from './hooks'

/**
 * The fundamental unit (docs/foundations/grain.md). One component; density,
 * color and footer treatment all follow from confidence and liveness - the
 * caller never picks a "variant". The ten named grains in the catalog are
 * situations built from this same component with different content, not
 * ten different components.
 */
export interface GrainProps {
  /** One sentence a person would say out loud. Never a bare field/count. */
  claim: string
  /** 0..1. Drives density when `density` isn't set explicitly. Omit for
   *  scenarios that don't carry a confidence read (e.g. a settled Approval). */
  confidence?: number
  density?: GrainDensity
  liveness?: GrainLiveness
  /** Overrides the liveness-derived badge, e.g. "LIVE", "DRAFT", "SENDING". */
  badge?: string
  facts?: Array<GrainFact>
  /** Free-form evidence slot - a duo document panel, a sparkline, a
   *  checklist. Anything more bespoke than a facts table lives here. */
  body?: React.ReactNode
  exits?: Array<GrainExit>
  provenance?: string
  /** Red-tinted footer for an unresolved, narrow question. Defaults to
   *  density === 'low' when confidence is given and this isn't set. */
  risk?: boolean
  /** Reveals the claim character by character, like a live answer. */
  streaming?: boolean
  onStreamDone?: () => void
  streamMsPerChar?: number
  className?: string
}

export function Grain({
  claim,
  confidence,
  density,
  liveness = { kind: 'live' },
  badge,
  facts,
  body,
  exits,
  provenance,
  risk,
  streaming = false,
  onStreamDone,
  streamMsPerChar = 22,
  className,
}: GrainProps) {
  const resolvedDensity = density ?? (confidence != null ? densityFromConfidence(confidence) : 'high')
  const resolvedRisk = risk ?? (confidence != null && resolvedDensity === 'low')
  const stamped = liveness.kind === 'stamped'
  const stream = useStreamedText(claim, streaming, streamMsPerChar)

  useEffect(() => {
    if (streaming && stream.done) onStreamDone?.()
  }, [streaming, stream.done, onStreamDone])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-background-base',
        stamped ? 'border-grain-ink-muted' : 'border-grain-ink',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2.5 px-3.5 py-2.5 text-paragraph-sm leading-[1.4]',
          stamped ? 'bg-grain-ink-muted' : 'bg-grain-ink',
          'text-grain-ink-foreground',
        )}
      >
        <span className="flex-1">
          {stream.visible}
          {streaming && !stream.done && (
            <span
              className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.1em] animate-pulse bg-grain-ink-foreground align-middle"
              aria-hidden
            />
          )}
        </span>
        {confidence != null && <ConfidenceMeter confidence={confidence} />}
        <LivenessBadge liveness={liveness} badge={badge} />
      </div>

      {(facts?.length || body) && (
        <div className="flex flex-col gap-2.5 px-3.5 py-3">
          {facts && facts.length > 0 && <FactsTable facts={facts} />}
          {body}
        </div>
      )}

      {(provenance || (exits && exits.length > 0)) && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-1.5 border-t px-3.5 py-2.5',
            resolvedRisk
              ? 'border-border-error-muted bg-background-error-highlight'
              : 'border-border-highlight bg-surface-1',
          )}
        >
          {provenance && (
            <Provenance>
              <span className={resolvedRisk ? 'text-text-error-base' : undefined}>{provenance}</span>
            </Provenance>
          )}
          {exits?.map((exit, i) => <ExitButton key={i} exit={exit} />)}
        </div>
      )}
    </div>
  )
}

export { densityFromConfidence } from './types'
export type { GrainDensity, GrainExit, GrainFact, GrainLiveness } from './types'
