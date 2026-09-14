import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CaretRight } from '@phosphor-icons/react'
import { DocPage, DocSection, InlineCode, SpecTable } from '@/docs/doc-kit'
import { Grain } from '@/components/nds/grain/grain'
import { densityFromConfidence } from '@/components/nds/grain/types'
import { densityLabel } from '@/components/nds/grain/atoms'

export const Route = createFileRoute('/docs/grain')({
  component: GrainLanguageDoc,
  head: () => ({ meta: [{ title: 'Grain - NDS Docs' }] }),
})

function Pull({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="max-w-[560px] rounded-xl bg-grain-ink px-5 py-4 text-[16px] leading-[1.45] text-grain-ink-foreground">
      {children}
      {note && <span className="mt-2 block font-mono text-[11px] text-grain-ink-foreground/60">{note}</span>}
    </div>
  )
}

function Callout({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <div
      className={
        'max-w-[560px] border-l-2 py-0.5 pl-3.5 text-paragraph-sm text-text-muted ' +
        (warn ? 'border-text-error-base' : 'border-text-primary')
      }
    >
      {children}
    </div>
  )
}

function DensityDemo() {
  const [confidence, setConfidence] = useState(96)
  const fraction = confidence / 100
  const density = densityFromConfidence(fraction)

  const claimByDensity = {
    high: 'Rejected 4 expenses — alcohol, policy 4.2',
    medium: "Robert's $214 dinner reads as a policy break",
    low: 'Ken’s $122 does not reconcile',
  }[density]

  const factsByDensity = {
    high: undefined,
    medium: undefined,
    low: [
      { label: 'Ken — Trattoria Sette, 12 Aug, 2 covers', value: '$122.00' },
      { label: 'Lin — Trattoria Sette, 12 Aug, 2 covers', value: '$122.00' },
      { label: 'Card used', value: 'both ••4417' },
    ],
  }[density]

  const provenanceByDensity = {
    high: 'Robert, Ana, Lin, Ken · comment attached',
    medium: undefined,
    low: 'One dinner submitted twice, or a split bill?',
  }[density]

  const exitsByDensity = {
    high: [{ label: 'Undo · 26s', variant: 'quiet' as const }],
    medium: [
      { label: 'Reject — policy break', variant: 'primary' as const },
      { label: 'Approve — client exempt', variant: 'default' as const },
    ],
    low: [
      { label: 'Reject Ken’s', variant: 'default' as const },
      { label: 'Approve both', variant: 'default' as const },
    ],
  }[density]

  return (
    <div className="max-w-[560px]">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-label-xs text-text-primary">
          .{String(confidence).padStart(2, '0')} {densityLabel(density)}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="flex-1 accent-brand-primary"
        />
      </div>
      <Grain
        claim={claimByDensity}
        confidence={fraction}
        facts={factsByDensity}
        provenance={provenanceByDensity}
        exits={exitsByDensity}
      />
      <p className="mt-2 font-mono text-[10.5px] leading-[1.55] text-text-muted">
        <b className="text-text-primary">Drag it.</b> Same finding, three geometries - the only
        structural variable in the whole language.
      </p>
    </div>
  )
}

function LiveStampedDemo() {
  return (
    <div className="grid max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Grain claim="$250 available" badge="LIVE" provenance="updates as it is spent" />
        <p className="mt-1.5 text-caption text-text-muted">Re-reads on view.</p>
      </div>
      <div>
        <Grain
          claim="$250 available"
          liveness={{ kind: 'stamped', asOf: '14:20' }}
          provenance="values at time of answer"
          exits={[{ label: 'Refresh', variant: 'quiet' }]}
        />
        <p className="mt-1.5 text-caption text-text-muted">Frozen, dated, drift shown alongside.</p>
      </div>
    </div>
  )
}

function ColorLawDemo() {
  return (
    <div className="grid max-w-[560px] grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <div
          className="flex items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-2.5 text-paragraph-sm"
          style={{ borderColor: '#c9aefb', boxShadow: 'var(--shadow-ai)' }}
        >
          <span className="flex-1 text-text-primary">Found 3 suspicious items</span>
          <span className="rounded-md bg-brand-primary px-2 py-1 text-label-xs text-text-on-color">View</span>
        </div>
        <p className="mt-1.5 text-caption text-text-error-base">
          <b>Old.</b> <code className="font-mono">shadow-ai</code> glow + brand color = the thing the law rejects.
        </p>
      </div>
      <div>
        <Grain claim="3 expenses break policy 4.2 — $9,240, all from one team" confidence={0.87} />
        <p className="mt-1.5 text-caption text-text-muted">
          <b className="text-text-primary">Grain.</b> Contrast and weight, no hue.
        </p>
      </div>
    </div>
  )
}

const PRINCIPLES: Array<{ name: string; body: string; test: string }> = [
  {
    name: 'Reactive',
    body: 'Answer the difference, not the record. "$250 left" is the page\'s job. "Gone in 18 days at this rate" is Emma\'s.',
    test: 'Does it say anything the page header doesn\'t?',
  },
  {
    name: 'Relative',
    body: 'The thread is the continuity layer - it survives navigation because it is not navigation.',
    test: 'Navigate away mid-answer. Is it gone?',
  },
  {
    name: 'Reduce',
    body: 'Reduce decisions, not steps. A shorter path with more doubt is a transfer of anxiety, not a reduction.',
    test: 'Steps dropped - did hesitation drop with them?',
  },
  {
    name: 'Reversible',
    body: 'At 95% accuracy, one in twenty money actions is wrong. Every terminal grain lands with a named reason and a live undo.',
    test: 'Find the wrong one. How many clicks to unwind it?',
  },
]

function GrainNavCard({ to, title, blurb }: { to: string; title: string; blurb: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-1 rounded-xl bg-background-base p-4 shadow-border-base transition-shadow hover:shadow-button-gray"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-label-sm text-text-primary">{title}</span>
        <CaretRight className="size-3.5 text-text-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-brand-text" />
      </span>
      <span className="text-paragraph-xs text-text-muted">{blurb}</span>
    </Link>
  )
}

function GrainLanguageDoc() {
  return (
    <DocPage
      title="Grain"
      description="Niural's AI-native design language. How Emma renders the product instead of describing it, and the rules every designer follows when adding to it."
    >
      <div className="-mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GrainNavCard
          to="/docs/grain-catalog"
          title="The ten grains"
          blurb="Full spec per grain - trigger, states, data contract, edge cases - interactive."
        />
        <GrainNavCard
          to="/docs/grain-component"
          title="The component"
          blurb="Every control - confidence, liveness, streaming, undo - on one <Grain>."
        />
        <GrainNavCard
          to="/docs/floater"
          title="The Floater"
          blurb="Pill launcher, default composer, docked grain - the Shell at line density."
        />
        <GrainNavCard
          to="/docs/grain-composition"
          title="Composition"
          blurb="Slots are stable, contents rank - the thread-to-page migration path."
        />
      </div>

      <DocSection title="The problem">
        <p className="max-w-[70ch] text-paragraph-sm text-text-primary">
          Niural has ~200 screens that already work. The obvious way to add AI is a little of it
          everywhere - an assistant panel here, a summary card there. That produces noise, and we've
          felt it: the summary card was designed once, then required on every detail page, its height
          uncontrollable and its content generic. It became debt within a quarter.
        </p>
        <Callout>
          Adding is easy. Reduction requires understanding. A design language that only tells you what
          to build is half a language - the other half is what keeps the product from inflating.
        </Callout>
      </DocSection>

      <DocSection title="The decision">
        <Pull note="the design job is not &quot;make AI components&quot; — it is &quot;decide which parts of Niural are answer-sized&quot;">
          Emma does not write about the product. Emma renders pieces of it.
        </Pull>
      </DocSection>

      <DocSection
        title="Anatomy"
        note="Six parts, every grain, every time. Miss one and it's prose with a border."
      >
        <div className="max-w-[560px]">
          <Grain
            claim="$250 left — gone in 18 days at this burn"
            confidence={0.88}
            badge="LIVE"
            facts={[
              { label: 'Spent on your Niural fee', value: '$668.75' },
              { label: 'Spent on tokens', value: '$121.25' },
            ]}
            provenance="CR-1108 · $43/day over last 30d"
            exits={[
              { label: 'Slow token spend', variant: 'default' },
              { label: 'Open credit →', variant: 'default' },
            ]}
          />
        </div>
        <div className="mt-4 max-w-[720px]">
          <SpecTable
            head={['Part', 'Rule']}
            rows={[
              ['1 · Claim', 'One sentence that answers, not a label.'],
              ['2 · Confidence', 'Sets density, not just a number.'],
              [
                '3 · Liveness',
                <span key="l">
                  <InlineCode>LIVE</InlineCode> re-reads · <InlineCode>AS OF 14:20</InlineCode> freezes.
                </span>,
              ],
              ['4 · Evidence', 'The real product component, reused - never redrawn.'],
              ['5 · Provenance', 'Where it came from. The user must be able to disagree with us.'],
              ['6 · Exit', 'One action, one door. No exit is a dead end in a scroll log.'],
            ]}
          />
        </div>
      </DocSection>

      <DocSection
        title="Density"
        note="Confidence is the only variable that changes the shape - everything else is content."
      >
        <DensityDemo />
      </DocSection>

      <DocSection title="Terminal or transitional">
        <div className="max-w-[720px]">
          <SpecTable
            head={['', 'Terminal', 'Transitional']}
            rows={[
              ['Job', 'Completes in place', 'Prepared here, finished on the screen'],
              ['Fits when', 'Bounded, reversible, few inputs', 'Long, legally binding, or needs the full page'],
              ['Must have', 'Undo window', 'State carried across, nothing submitted'],
            ]}
          />
        </div>
        <Callout>
          A grain has a height budget. When the answer outgrows it, it becomes a{' '}
          <b className="text-text-primary">door</b>, not a taller card.
        </Callout>
      </DocSection>

      <DocSection title="Live or stamped">
        <LiveStampedDemo />
        <Callout warn>
          <b className="text-text-error-base">Never</b> a grain that quietly keeps showing an old
          number - the single most likely way the system loses trust.
        </Callout>
      </DocSection>

      <DocSection title="Color - contrast, not hue">
        <ColorLawDemo />
      </DocSection>

      <DocSection title="The four principles">
        <div className="flex max-w-[720px] flex-col gap-2">
          {PRINCIPLES.map((p, i) => (
            <div key={p.name} className="rounded-xl bg-background-base p-4 shadow-border-base">
              <p className="text-paragraph-sm text-text-primary">
                <span className="mr-2 font-mono text-label-xs text-text-disabled">{i + 1}</span>
                <b>{p.name}</b> — {p.body}
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] text-text-muted">test — {p.test}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </DocPage>
  )
}
