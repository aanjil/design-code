/**
 * Run Payroll, re-derived with the AINA framework (signal/belief/difference/
 * confidence/tension/resolution/consequence/consent) instead of a locked
 * 3-step wizard. See the delivered wireframe for the full rationale; this
 * file is the shape of the live, interactive version of it.
 *
 * Three tensions, none of them fields to edit - each is a resolution with a
 * small, closed set of readings. Sam has no "ask/defer" option because
 * deferring a payment tension doesn't remove the fact that he isn't paid
 * this cycle; Maya and Diego's tensions can genuinely be deferred without
 * blocking the run.
 */

export type SamResolution = 'hold' | 'wallet' | 'delay'
export type MayaResolution = 'approve' | 'cap' | 'ask'
export type ExpResolution = 'reject' | 'approve' | 'ask'

export interface DraftState {
  sam: SamResolution | null
  maya: MayaResolution | null
  exp: ExpResolution | null
}

export const EMPTY_DRAFT: DraftState = { sam: null, maya: null, exp: null }

export interface ImpactSummary {
  total: number
  risk: number
  affected: number
  halted: boolean
  /** Every tension has some answer - resolved or explicitly deferred. */
  allSettled: boolean
  wireBufferSeconds: number
  wireBufferAtRisk: boolean
}

/** A signal in the Sense layer - the Prepare row's inspectable content. */
export interface Signal {
  label: string
  source: string
  age: string
  tone?: 'stale' | 'missing'
}

/** A ranked reason the Prioritize layer surfaced (or held back) something. */
export interface RankedItem {
  label: string
  why: string
}
