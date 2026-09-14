import { Grain } from '@/components/nds/grain/grain'
import type { GrainExit, GrainFact } from '@/components/nds/grain/types'
import { Collapsed } from './atoms'

/**
 * One or more Tension grains, revealed and resolved in sequence -
 * grain-flows_2.html's Resolve step asks about Sam Ortiz, then Maya Chen,
 * then Diego Alvarez, one at a time, never handing the whole list back.
 * `resolvedCount` (driven by the explorer state, e.g. "2 of 3 resolved")
 * decides how many have collapsed to their resolved summary.
 */
export interface TensionDef {
  claim: string
  confidence: number
  facts: Array<GrainFact>
  provenance: string
  exits: Array<GrainExit>
  resolvedSummary: string
}

export function TensionSequence({
  tensions,
  resolvedCount,
}: {
  tensions: Array<TensionDef>
  resolvedCount: number
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {tensions.map((t, i) => {
        if (i < resolvedCount) return <Collapsed key={i}>{t.resolvedSummary}</Collapsed>
        if (i > resolvedCount) return null
        return (
          <Grain
            key={i}
            claim={t.claim}
            confidence={t.confidence}
            facts={t.facts}
            provenance={t.provenance}
            exits={t.exits}
          />
        )
      })}
    </div>
  )
}
