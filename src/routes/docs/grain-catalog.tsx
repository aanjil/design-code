import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DocPage, SpecTable } from '@/docs/doc-kit'
import { Grain } from '@/components/nds/grain/grain'
import { GRAIN_SCENARIOS } from '@/mocks/grain'
import type { GrainScenario } from '@/components/nds/grain/types'

export const Route = createFileRoute('/docs/grain-catalog')({
  component: GrainCatalogDoc,
  head: () => ({ meta: [{ title: 'The ten grains - NDS Docs' }] }),
})

interface ReqRow {
  label: string
  body: React.ReactNode
}

/** Condensed from grain-specs.html's per-grain requirement table - trigger,
 *  states, interaction, limits, edge cases, and what renders with Emma off. */
const REQUIREMENTS: Record<GrainScenario['kind'], Array<ReqRow>> = {
  tension: [
    { label: 'TRIGGER', body: 'Two beliefs that can’t both be true, confidence below .55. Above that it’s a Difference or an Approval.' },
    { label: 'STATES', body: 'Unresolved · Resolved (stamped, becomes a belief) · Superseded (someone else answered first - payroll is multiplayer) · Stale (records changed after raising it).' },
    { label: 'INTERACTION', body: 'Each exit resolves in place, re-renders stamped - no navigation, no modal. Undo restores the state and reverts the data change.' },
    { label: 'LIMITS', body: 'Max 5 fact rows, max 3 exits. 6 facts means two tensions, or a Selection.' },
    { label: 'EDGE', body: 'Resolving one tension can create another (transfer → tax residency). Identical financial effect on both readings → suppress, it isn’t a tension.' },
    { label: 'OFF', body: 'Nothing renders. The records stay visible where they always were - nothing is blocked.' },
  ],
  difference: [
    { label: 'TRIGGER', body: 'A delta against exactly one legal baseline: prior state, expected policy, or intended plan. Against nothing → suppress, it’s a summary.' },
    { label: 'STATES', body: 'Populated (1-6 rows, ranked) · Empty (states baseline + scan count, never hidden) · Overflow (top 5 + door) · Baseline missing (first session).' },
    { label: 'INTERACTION', body: 'Rows report, they don’t act - not individually clickable. The action exit converts it into the next grain, usually a Consequence.' },
    { label: 'LIMITS', body: 'Max 6 rows then overflow. Row labels truncate at one line, never wrap to three.' },
    { label: 'EDGE', body: 'A change with no payroll effect - include it, marked so. A stale baseline (>60 days) - say so, the count is meaningless otherwise.' },
    { label: 'OFF', body: 'The list renders as it always has, with its own sort and filters. No change indicator.' },
  ],
  approval: [
    { label: 'TRIGGER', body: 'A prepared action with financial/personnel consequence, confidence .6-.95. Above .95 with low blast radius it collapses to a high-density Difference with undo.' },
    { label: 'STATES', body: 'Before · Sending (live undo counter, "nothing has left yet") · Settled (stamped, partial-failure breakdown) · Partially failed (the state everyone forgets - design it first) · Expired · Blocked.' },
    { label: 'INTERACTION', body: 'Primary commits and enters Sending with a counter. "Review one by one" is a door - hands off with the batch preselected.' },
    { label: 'LIMITS', body: 'Group by currency/entity/reason, never list every person. Max 6 summary rows.' },
    { label: 'EDGE', body: 'FX moves between render and commit → re-confirm, never silently re-price. Someone else approves mid-undo → Superseded, name them.' },
    { label: 'OFF', body: 'The payments screen with its existing bulk-pay flow, unchanged. Slower, still correct.' },
  ],
  consequence: [
    { label: 'TRIGGER', body: 'Any decision with second-order effects invisible from the primary object. Never stands alone - always adjacent to an Approval or Selection.' },
    { label: 'STATES', body: 'Live (recalculating, ~250ms debounce) · Nothing selected · Uncomputable (name the missing dimension, never drop the row) · All-upside (must say so explicitly - silence reads as hiding).' },
    { label: 'INTERACTION', body: 'Selection controls live inside the grain - every toggle updates the claim and all rows. The secondary exit names the dimension it relieves ("Exclude Nepal"), never a generic Cancel.' },
    { label: 'LIMITS', body: '2-4 dimensions, max 5 toggles. More toggles → it’s a Selection with a Consequence attached.' },
    { label: 'EDGE', body: 'A dimension improves for one entity, worsens for another → show both rows, never net them.' },
    { label: 'OFF', body: 'Nothing - the approval proceeds with today’s confirmation dialog. Additive, the cleanest gate-3 pass in the set.' },
  ],
  selection: [
    { label: 'TRIGGER', body: 'A set larger than ~20 where a minority needs attention and the ranking function is one sentence. Can’t write the ranking → ship a filter instead.' },
    { label: 'STATES', body: 'Ranked (deprioritised collapsed but present) · Expanded (the bottom, with reasons) · All clear · Low confidence (say what might be missing) · Partially scanned.' },
    { label: 'INTERACTION', body: 'Reason rows narrow the grain in place, they don’t navigate. The door hands off with the same ranking applied as a saved view.' },
    { label: 'LIMITS', body: 'Max 4 active groups, max 4 deprioritised. Never render individual people - that’s the door.' },
    { label: 'EDGE', body: 'A person in two groups → count once, in the higher-severity group, note it. Everything blocking → say "all N block payroll" rather than fake a hierarchy.' },
    { label: 'OFF', body: 'The table with its existing status filters. The saved view from the ranking stays available - it’s data, not AI.' },
  ],
  draft: [
    { label: 'TRIGGER', body: 'A form Emma can fill ≥50% from existing records, and the remainder needs human judgment, attestation, or data the system doesn’t hold.' },
    { label: 'STATES', body: 'Prepared · Stale (a source changed since preparation - names the change and affected field count) · Resumed · Completed · Expired.' },
    { label: 'INTERACTION', body: 'One exit only, and it’s the door. No inline editing, ever - the moment a field is editable here it’s a form in a thread.' },
    { label: 'LIMITS', body: 'Max 5 rows. Overflow says "and N more" - the door is the answer, not a taller card.' },
    { label: 'EDGE', body: 'User completes it directly on the screen → must detect and collapse to Completed, not linger as a draft.' },
    { label: 'OFF', body: 'The form, empty, exactly as it works today.' },
  ],
  evidence: [
    { label: 'TRIGGER', body: 'An extracted value disagrees with a recorded one beyond tolerance. No disagreement, no grain - a matching invoice is silence, not a green tick.' },
    { label: 'STATES', body: 'Mismatch (hypothesis offered) · Unreadable (OCR < .5, says what it couldn’t read, never guesses) · Missing document · Multi-document · Resolved.' },
    { label: 'INTERACTION', body: 'Primary pays the evidenced figure, never the requested one - the default sides with the document.' },
    { label: 'LIMITS', body: 'Max 4 lines per document. Full document is always the door.' },
    { label: 'EDGE', body: 'Currency differs → the FX rate becomes a third column, not a footnote. Within tolerance but a new vendor → that’s a Question, not Evidence.' },
    { label: 'OFF', body: 'The payment request with its attachment link. The user does the subtraction themselves.' },
  ],
  insight: [
    { label: 'TRIGGER', body: 'A trend that crosses a threshold, changes slope after a known event, or implies a deadline. No so-what → it’s a dashboard tile.' },
    { label: 'STATES', body: 'Finding (measured) · Modelled (hatched, lower confidence, "not a quote") · Insufficient history (<6 periods, say so) · Reversed (must acknowledge, not disappear).' },
    { label: 'INTERACTION', body: 'Bars aren’t interactive - no tooltips, no drill-down. The action exit runs a model and swaps the series in place.' },
    { label: 'LIMITS', body: 'One series, 8-14 points, no legend, no axis values, no second colour.' },
    { label: 'EDGE', body: 'Two plausible causes → name both or none. Population changed mid-series → use a rate and say the denominator moved.' },
    { label: 'OFF', body: 'The analytics page with its existing charts and filters.' },
  ],
  basis: [
    { label: 'TRIGGER', body: 'User request only - never auto-renders. Every claim carries a "why?" affordance; this is what’s behind it.' },
    { label: 'STATES', body: 'Collapsed (affordance only) · Expanded (quote, then triggering facts) · Multi-source (ordered by precedence, stated) · Stale source (highest-severity - show both versions) · No source ("a pattern, not a rule").' },
    { label: 'INTERACTION', body: 'Expands inside the parent grain, doesn’t spawn a sibling. No copy, no share - this is for the person deciding right now.' },
    { label: 'LIMITS', body: 'One quote, ~45 words max. Max 5 triggering facts. The largest height budget in the set, deliberately.' },
    { label: 'EDGE', body: 'Sources conflict → show both, state which wins. Jurisdiction ambiguous → that’s a Tension, not a Basis.' },
    { label: 'OFF', body: 'The policy library and record detail page, reachable by navigation as today.' },
  ],
  question: [
    { label: 'TRIGGER', body: 'The same decision observed ≥ 3 times with a consistent outcome, no rule held yet. Never asked pre-emptively or during onboarding.' },
    { label: 'STATES', body: 'Asked · Belief created (states its exceptions before its benefits) · Deferred ("not now" - silent ≥30 days) · Contradicted (user acts against their own rule - design this) · Revoked.' },
    { label: 'INTERACTION', body: 'Answering resolves in place to the belief state. Max one Question grain per session - two is an interrogation.' },
    { label: 'LIMITS', body: '3 evidence rows, 3 options max. Never two questions in one grain.' },
    { label: 'EDGE', body: 'Inconsistent pattern (12 approved, 12 rejected) → don’t ask, there’s no belief to capture. A new rule conflicts with an existing one → surface as a Tension.' },
    { label: 'OFF', body: 'The Policies settings page. Every rule this grain creates must be visible and editable there.' },
  ],
}

function Interactive({ scenario }: { scenario: GrainScenario }) {
  const [resolved, setResolved] = useState(false)

  if (!resolved) {
    return (
      <Grain
        claim={scenario.claim}
        confidence={scenario.confidence}
        badge={scenario.badge}
        facts={scenario.facts}
        provenance={scenario.provenance}
        risk={scenario.risk}
        exits={scenario.exits?.map((exit) => ({
          ...exit,
          onSelect: () => setResolved(true),
        }))}
      />
    )
  }

  return (
    <Grain
      claim={`${scenario.exits?.[0]?.label ?? 'Resolved'} — ${scenario.title.toLowerCase()} closed`}
      liveness={{ kind: 'stamped', asOf: '14:20' }}
      provenance={`resolved 14:20 · you${scenario.terminal ? '' : ' · nothing submitted'}`}
      exits={[{ label: 'Undo', variant: 'quiet', onSelect: () => setResolved(false) }]}
    />
  )
}

function GrainSection({ index, scenario }: { index: number; scenario: GrainScenario }) {
  return (
    <section className="border-t border-dashed border-border-muted pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-mono-xs text-text-disabled">{String(index).padStart(2, '0')}</span>
        <h2 className="text-title-h5 text-text-primary">{scenario.title}</h2>
        <span className="rounded-sm bg-brand-muted px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-brand-text">
          {scenario.domain}
        </span>
        <span className="font-mono text-[10px] tracking-wide text-text-disabled">{scenario.declaration}</span>
      </div>

      <div className="mt-4 max-w-[640px]">
        <Interactive scenario={scenario} />
        <p className="mt-2 font-mono text-[10.5px] text-text-muted">click an exit to resolve it in place</p>
      </div>

      <div className="mt-4 max-w-[760px]">
        <SpecTable head={['REQUIREMENT', '']} rows={REQUIREMENTS[scenario.kind].map((r) => [r.label, r.body])} />
      </div>
    </section>
  )
}

function GrainCatalogDoc() {
  return (
    <DocPage
      title="The ten grains, specced"
      description="Every grain with real behaviour: states, interaction, data contract, and what happens when Emma is off. Domains span HR, Payroll, Compliance, Payments and Benefits."
    >
      {GRAIN_SCENARIOS.map((scenario, i) => (
        <GrainSection key={scenario.kind} index={i + 1} scenario={scenario} />
      ))}
    </DocPage>
  )
}
