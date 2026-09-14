import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'
import { Grain } from '@/components/nds/grain/grain'

export const Route = createFileRoute('/docs/grain-composition')({
  component: GrainCompositionDoc,
  head: () => ({ meta: [{ title: 'Grain composition - NDS Docs' }] }),
})

function SlotColumn({
  heading,
  scanned,
  slot1,
  slot2,
  slot3,
}: {
  heading: string
  scanned: string
  slot1: React.ReactNode
  slot2: React.ReactNode
  slot3: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-base bg-background-base">
      <div className="flex items-center gap-2 border-b border-border-highlight bg-surface-1 px-3.5 py-2.5 text-label-sm text-text-primary">
        {heading}
        <span className="ml-auto font-mono text-[10px] text-text-disabled">{scanned}</span>
      </div>
      <div className="flex flex-col gap-3 p-3.5">
        <div>
          <p className="mb-1.5 font-mono text-[9.5px] tracking-wide text-text-disabled">
            SLOT 1 — TENSION · what doesn't add up
          </p>
          {slot1}
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[9.5px] tracking-wide text-text-disabled">
            SLOT 2 — DIFFERENCE · what changed
          </p>
          {slot2}
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[9.5px] tracking-wide text-text-disabled">
            SLOT 3 — THE REST · one level down
          </p>
          {slot3}
        </div>
      </div>
    </div>
  )
}

function EmptySlot({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-border-highlight px-3 py-2 text-paragraph-xs text-text-disabled">{children}</p>
}

function Stub({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-border-highlight px-3 py-2 text-paragraph-xs text-text-muted">{children}</p>
}

const MIGRATION = [
  {
    step: 'Grain the module',
    body: 'Run the three questions (is it grain-able? one claim? terminal or transitional?) over one module. Output a catalog, not designs.',
    note: 'expenses first - highest signal, highest stakes, most existing pain',
  },
  {
    step: 'Render them in the thread',
    body: 'Grains ship into Emma first, where they are additive and reversible. Nothing on the existing screens changes.',
    note: 'this is where the claims get proven true or false',
  },
  {
    step: 'Compose the page from the same grains',
    body: 'Once a module’s grains are trusted, its landing surface becomes slot 1 / 2 / 3 instead of a table.',
    note: 'the full table stays reachable one level down, always',
  },
  {
    step: 'Repeat by module',
    body: 'Each module migrates on its own timeline. ~200 screens never have to move at once.',
  },
]

function GrainCompositionDoc() {
  return (
    <DocPage
      title="Composition"
      description="Grains render in a thread today and compose a page tomorrow. Same unit, different density - which is how the product migrates instead of forking."
    >
      <DocSection title="Rendered, not static - with one correction">
        <p className="max-w-[70ch] text-paragraph-sm text-text-primary">
          AI-native shouldn't sit beside the old screens - it should <b>become</b> them. The thread is
          the highest-density arrangement of the same grains that will one day compose the page itself.
        </p>
        <p className="max-w-[70ch] text-paragraph-sm text-text-muted">
          The correction: rendered must not mean unpredictable. People navigate by spatial memory - if
          the page rearranges every visit, we trade one cognitive load for a worse one.
        </p>
        <div className="mt-3 max-w-[560px] rounded-xl bg-grain-ink px-5 py-4 text-[16px] leading-[1.45] text-grain-ink-foreground">
          The vocabulary is fixed. The composition is dynamic.
          <span className="mt-2 block font-mono text-[11px] text-grain-ink-foreground/60">
            a newspaper front page is different every day and the grid never moves
          </span>
        </div>
      </DocSection>

      <DocSection
        title="Slots are stable, contents rank"
        note="Three slot types, in this order, always. What fills them changes by the hour."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SlotColumn
            heading="Expenses · Mon · 312 pending"
            scanned="MON"
            slot1={
              <Grain
                claim="Ken and Lin claimed the same dinner"
                confidence={0.38}
                provenance="same card, same covers — I can’t tell which is real"
                risk
              />
            }
            slot2={
              <div className="flex flex-col gap-2">
                <Grain claim="4 break policy 4.2 — alcohol on receipt, prepared not sent" badge="DRAFT" />
                <Stub>Marketing is 22% over its monthly line</Stub>
              </div>
            }
            slot3={<Stub>All 312 pending →</Stub>}
          />
          <SlotColumn
            heading="Expenses · Thu · 41 pending"
            scanned="THU"
            slot1={<EmptySlot>Nothing contradictory today</EmptySlot>}
            slot2={<Grain claim="Payroll cutoff is Friday — 41 unapproved will roll to next cycle" badge="LIVE" />}
            slot3={<Stub>All 41 pending →</Stub>}
          />
        </div>
        <p className="mt-3 max-w-[70ch] font-mono text-[11px] leading-[1.55] text-text-muted">
          <b className="text-text-primary">Same page, same slots, different contents and weight.</b> Slot
          1 is allowed to be empty and say so - an empty tension slot is information, not a gap to fill.
        </p>
      </DocSection>

      <DocSection title="Migration path">
        <p className="max-w-[70ch] text-paragraph-sm text-text-primary">Nothing about this requires a rewrite. It requires a sequence.</p>
        <div className="mt-3 flex max-w-[640px] flex-col gap-2">
          {MIGRATION.map((m, i) => (
            <div key={m.step} className="rounded-xl border border-border-base bg-background-base p-4">
              <p className="text-paragraph-sm text-text-primary">
                <span className="mr-2 font-mono text-label-xs text-text-disabled">{i + 1}</span>
                <b>{m.step}</b> — {m.body}
              </p>
              {m.note && <p className="mt-1.5 font-mono text-[10.5px] text-text-muted">{m.note}</p>}
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-[70ch] border-l-2 border-text-primary py-0.5 pl-3.5 text-paragraph-sm text-text-muted">
          <b className="text-text-primary">The order matters.</b> Building the composed page before the
          grains are trusted means shipping a rearranged table and calling it AI. The thread is the
          proving ground.
        </p>
      </DocSection>

      <DocSection title="See also">
        <p className="max-w-[70ch] text-paragraph-sm text-text-muted">
          The Shell (Floater at line density, <InlineCode>src/components/nds/grain/shell.tsx</InlineCode>) is
          the same composition idea at the smallest surface - one grain, docked above a composer, picked
          by confidence and situation rather than a designer.
        </p>
      </DocSection>
    </DocPage>
  )
}
