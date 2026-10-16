import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'
import { Button } from '@niural/components'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/docs/elevation')({
  component: ElevationDoc,
  head: () => ({ meta: [{ title: 'Elevation - NDS Docs' }] }),
})

function ShadowCard({ cls, name, use }: { cls: string; name: string; use: string }) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          'flex h-20 items-center justify-center rounded-xl bg-base',
          cls,
        )}
      >
        <span className="text-caption-sm text-muted">{use}</span>
      </div>
      <p className="mt-2 truncate font-mono text-caption-sm font-medium text-primary">
        {name}
      </p>
    </div>
  )
}

const SEMANTIC = [
  { cls: 'card', name: 'card', use: 'Default card (ring built in)' },
  { cls: 'card-hover', name: 'card-hover', use: 'Card on hover' },
  { cls: 'elevation-tooltip', name: 'elevation-tooltip', use: 'Tooltips' },
  { cls: 'flyout', name: 'flyout', use: 'Menus, popovers, panels' },
  { cls: 'elevation-ai', name: 'elevation-ai', use: 'AI surfaces (Emma)' },
]

const RINGS = [
  { cls: 'borders-base', name: 'borders-base', use: 'Buttons, inputs, pills' },
  { cls: 'buttons-primary', name: 'buttons-primary', use: 'Primary button ring' },
  { cls: 'borders-focus', name: 'borders-focus', use: 'Focused input' },
  { cls: 'borders-active', name: 'borders-active', use: 'Active / selected' },
  { cls: 'borders-error', name: 'borders-error', use: 'Error state' },
  { cls: 'buttons-neutral', name: 'buttons-neutral', use: 'Pagination circles' },
]

const DEPTH = [
  { cls: 'shadow-sm', name: 'shadow-sm', use: 'Subtle lift' },
  { cls: 'shadow', name: 'shadow', use: 'Default' },
  { cls: 'shadow-md', name: 'shadow-md', use: 'Medium' },
  { cls: 'shadow-lg', name: 'shadow-lg', use: 'Large panels' },
  { cls: 'shadow-xl', name: 'shadow-xl', use: 'Overlays' },
  { cls: 'shadow-2xl', name: 'shadow-2xl', use: 'Full-screen overlays' },
]

function ElevationDoc() {
  return (
    <DocPage
      title="Elevation"
      description="Depth comes from shadow tokens, not borders - most rings are baked into the shadow (0.5–1px spread). Never add a border on top of a ring shadow."
    >
      <DocSection
        title="Semantic elevation"
        note="Use these by name - never reconstruct them manually."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
          {SEMANTIC.map((s) => (
            <ShadowCard key={s.cls} {...s} />
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Border rings"
        note="Interactive-state rings for inputs and buttons - 0.5px hairlines with soft drops."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
          {RINGS.map((s) => (
            <ShadowCard key={s.cls} {...s} />
          ))}
        </div>
      </DocSection>

      <DocSection title="Depth scale">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
          {DEPTH.map((s) => (
            <ShadowCard key={s.cls} {...s} />
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Button recipes"
        note="@niural/components Button: 34px tall (md), control radius, Label/Small. The label carries its own 4px optical pad."
      >
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-frame p-4">
          <Button variant="solid" shade="primary" type="button">
            Primary
          </Button>
          <Button variant="solid" shade="neutral" type="button">
            Secondary
          </Button>
          <Button variant="ghost" shade="neutral" type="button">
            Ghost
          </Button>
          <Button variant="ghost" shade="error" type="button">
            Reset
          </Button>
          <Button variant="solid" shade="error" type="button">
            Destructive
          </Button>
        </div>
        <p className="mt-3 text-paragraph-xsmall text-muted">
          Primary (solid + primary) = <InlineCode>bg-button-primary</InlineCode> +{' '}
          <InlineCode>buttons-primary</InlineCode>. Secondary (solid + neutral) ={' '}
          <InlineCode>bg-base</InlineCode> + <InlineCode>borders-base</InlineCode>.
        </p>
      </DocSection>
    </DocPage>
  )
}
