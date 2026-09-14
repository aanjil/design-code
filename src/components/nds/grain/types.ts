/**
 * Shared types for the Grain component family (docs/foundations/grain.md).
 * A grain is the smallest piece of Niural that can stand alone as an
 * answer - one unit, driven by confidence, that renders in a thread today
 * and composes a page tomorrow.
 */

/** The ten named situations a grain can be. Purely a label for the
 *  catalog/docs and mock data - it does not change how <Grain> renders.
 *  What renders is driven by confidence, liveness, facts, body and exits. */
export type GrainKind =
  | 'tension'
  | 'difference'
  | 'approval'
  | 'consequence'
  | 'selection'
  | 'draft'
  | 'evidence'
  | 'insight'
  | 'basis'
  | 'question'

export type GrainDensity = 'high' | 'medium' | 'low'

/** Confidence -> density, per docs/foundations/grain.md. */
export function densityFromConfidence(confidence: number): GrainDensity {
  if (confidence >= 0.88) return 'high'
  if (confidence >= 0.55) return 'medium'
  return 'low'
}

export type GrainLiveness =
  | { kind: 'live' }
  | { kind: 'stamped'; asOf: string; drift?: { label: string; value: string } }

export type GrainFactTone = 'default' | 'add' | 'del' | 'warn' | 'stop' | 'muted'

export interface GrainFact {
  label: string
  value: string
  tone?: GrainFactTone
}

export type GrainExitVariant = 'primary' | 'default' | 'quiet'

export interface GrainExit {
  label: string
  variant?: GrainExitVariant
  onSelect?: () => void
  /** A live undo/expiry window - "Undo · 30s" counting down in place. */
  countdownSeconds?: number
  onExpire?: () => void
  disabled?: boolean
}

export interface GrainScenario {
  kind: GrainKind
  title: string
  domain: string
  declaration: string
  claim: string
  confidence?: number
  badge?: string
  liveness: GrainLiveness
  terminal: boolean
  facts?: Array<GrainFact>
  risk?: boolean
  provenance?: string
  exits?: Array<GrainExit>
}
