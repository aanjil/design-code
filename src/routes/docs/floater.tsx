import { Link, createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'
import { FloaterController } from '@/components/nds/grain/floater-controller'

export const Route = createFileRoute('/docs/floater')({
  component: FloaterDoc,
  head: () => ({ meta: [{ title: 'The Floater - NDS Docs' }] }),
})

function FloaterDoc() {
  return (
    <DocPage
      title="The Floater"
      description="Not a separate component - the Shell at line density, docked to a page. Two idle sizes (pill launcher, default composer) from the Figma “Grain” file, plus the docked state once a grain is found."
    >
      <DocSection
        title="Try it"
        note="Pick a size, dock one of the ten grains or leave it empty, and toggle Emma off. Clicking the pill in the preview fires the same onExpand callback a real page would wire up."
      >
        <FloaterController />
      </DocSection>

      <DocSection title="Reading the controls">
        <ul className="flex max-w-[640px] list-disc flex-col gap-2 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            <b className="text-text-primary">Pill</b> is the collapsed launcher - "Ask Emma" plus its ⌘E
            hint, <InlineCode>shadow-floater</InlineCode> ring, nothing else. It only renders when idle;
            once a grain docks the shell always expands to <b className="text-text-primary">default</b>.
          </li>
          <li>
            <b className="text-text-primary">Default, nothing docked</b> is the full-width composer - a
            true pill shape (<InlineCode>rounded-full</InlineCode>) with a mic icon that swaps to send the
            moment there's text, matching the idle "default size" Floater in Figma.
          </li>
          <li>
            <b className="text-text-primary">Grain docked</b> switches the shape to{' '}
            <InlineCode>rounded-xl</InlineCode> and the ring to <InlineCode>border-grain-ink</InlineCode> -
            the near-black claim bar takes over as the anchor, per the color law (contrast, not hue). The
            violet <InlineCode>shadow-floater</InlineCode> ring is chrome for an idle entry point, not a
            grain, so it steps aside once one is showing.
          </li>
          <li>
            <b className="text-text-primary">Emma off</b> degrades to the page's own unstyled search input
            regardless of size or dock state - nothing else missing (ship-gate question 3).
          </li>
        </ul>
      </DocSection>

      <DocSection title="See also">
        <p className="max-w-[70ch] text-paragraph-sm text-text-muted">
          <Link to="/docs/grain-component" className="text-brand-text hover:underline">
            The Grain component
          </Link>{' '}
          controls the grain that docks inside a Floater - confidence, liveness, streaming, undo.{' '}
          <Link to="/docs/grain-composition" className="text-brand-text hover:underline">
            Composition
          </Link>{' '}
          covers how the same idea scales from one docked grain up to a full page. Source:{' '}
          <InlineCode>src/components/nds/grain/shell.tsx</InlineCode>.
        </p>
      </DocSection>
    </DocPage>
  )
}
