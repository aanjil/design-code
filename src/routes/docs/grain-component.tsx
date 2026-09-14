import { Link, createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'
import { GrainController } from '@/components/nds/grain/controller'

export const Route = createFileRoute('/docs/grain-component')({
  component: GrainComponentDoc,
  head: () => ({ meta: [{ title: 'The Grain component - NDS Docs' }] }),
})

function GrainComponentDoc() {
  return (
    <DocPage
      title="The Grain component"
      description="One component, driven by situation. Confidence sets density, liveness sets the footer, risk sets the tint - the caller never picks a variant. Every control below maps to a real prop on <Grain>."
    >
      <DocSection
        title="Try it"
        note="Pick a use case to load one of the ten canonical scenarios, then push every axis independently - confidence, density override, liveness, risk, a mocked streaming reveal, a live undo window, and the Shell (Floater) docked around it."
      >
        <GrainController />
      </DocSection>

      <DocSection title="Reading the controls">
        <ul className="flex max-w-[640px] list-disc flex-col gap-2 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            <b className="text-text-primary">Use case</b> loads a scenario from{' '}
            <InlineCode>src/mocks/grain.ts</InlineCode> - claim, facts, provenance, and exits all come
            from it. Confidence and liveness reset to the scenario's own values.
          </li>
          <li>
            <b className="text-text-primary">Confidence</b> drives density automatically
            (<InlineCode>densityFromConfidence()</InlineCode>: high ≥ .88, medium .55-.87, low below).
            <b className="text-text-primary"> Density override</b> forces a band regardless, to see a
            high-confidence scenario rendered as if it were low, or the reverse.
          </li>
          <li>
            <b className="text-text-primary">Risk footer</b> auto-tints red at low density (an unresolved,
            narrow question) - the override lets you force it either way.
          </li>
          <li>
            <b className="text-text-primary">Streaming</b> reveals the claim character by character via{' '}
            <InlineCode>useStreamedText</InlineCode> - the mocked "live answer" effect. Replay restarts it
            without re-loading the scenario.
          </li>
          <li>
            <b className="text-text-primary">Live undo window</b> adds a real countdown
            (<InlineCode>ExitButton</InlineCode>'s <InlineCode>countdownSeconds</InlineCode>) to the
            scenario's first exit - it disables itself and reads "Window closed" at zero, same as a real
            Approval or Tension undo.
          </li>
          <li>
            <b className="text-text-primary">Shell</b> docks the same content into{' '}
            <InlineCode>{'<Shell>'}</InlineCode> at line density, above a composer - toggling{' '}
            <b className="text-text-primary">Emma off</b> degrades it to a bare search input with nothing
            else missing (ship-gate question 3).
          </li>
        </ul>
      </DocSection>

      <DocSection title="See it composed into real screens">
        <p className="max-w-[640px] text-paragraph-sm text-text-muted">
          <Link to="/crafts/ask-emma" className="text-brand-text hover:underline">
            The Ask Emma craft
          </Link>{' '}
          runs the launcher, the payroll run, the expense run and the PTO ask-thread entirely on{' '}
          <InlineCode>{'<Grain>'}</InlineCode>/<InlineCode>{'<Shell>'}</InlineCode> - the same component this
          page controls, just fed real scenario data instead of the mock catalog. Its <InlineCode>chat/</InlineCode>{' '}
          subfolder is a separate, Figma-sourced pair of screens that deliberately does not use Grain -
          see the craft note in <InlineCode>docs/foundations/grain.md</InlineCode>.
        </p>
      </DocSection>
    </DocPage>
  )
}
