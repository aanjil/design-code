import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/docs/elevation')({
  component: ElevationDoc,
  head: () => ({ meta: [{ title: 'Elevation — NDS Docs' }] }),
})

function ShadowCard({ cls, name, use }: { cls: string; name: string; use: string }) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          'flex h-20 items-center justify-center rounded-xl bg-background-base',
          cls,
        )}
      >
        <span className="text-caption text-text-muted">{use}</span>
      </div>
      <p className="mt-2 truncate font-mono text-caption-md text-text-primary">
        {name}
      </p>
    </div>
  )
}

const SEMANTIC = [
  { cls: 'shadow-card', name: 'shadow-card', use: 'Default card (ring built in)' },
  { cls: 'shadow-card-hover', name: 'shadow-card-hover', use: 'Card on hover' },
  { cls: 'shadow-tooltip', name: 'shadow-tooltip', use: 'Tooltips' },
  { cls: 'shadow-flyout', name: 'shadow-flyout', use: 'Menus, popovers, panels' },
  { cls: 'shadow-ai', name: 'shadow-ai', use: 'AI surfaces (Emma)' },
]

const RINGS = [
  { cls: 'shadow-button-gray', name: 'shadow-button-gray', use: 'Buttons, inputs, pills' },
  { cls: 'shadow-button-primary', name: 'shadow-button-primary', use: 'Primary button ring' },
  { cls: 'shadow-border-focus', name: 'shadow-border-focus', use: 'Focused input' },
  { cls: 'shadow-border-active', name: 'shadow-border-active', use: 'Active / selected' },
  { cls: 'shadow-border-error', name: 'shadow-border-error', use: 'Error state' },
  { cls: 'shadow-pagination', name: 'shadow-pagination', use: 'Pagination circles' },
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
      description="Depth comes from shadow tokens, not borders — most rings are baked into the shadow (0.5–1px spread). Never add a border on top of a ring shadow."
    >
      <DocSection
        title="Semantic elevation"
        note="Use these by name — never reconstruct them manually."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
          {SEMANTIC.map((s) => (
            <ShadowCard key={s.cls} {...s} />
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Border rings"
        note="Interactive-state rings for inputs and buttons — 0.5px hairlines with soft drops."
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
        note="34px tall, 9px radius (rounded-btn), Label/Small, gradient fills + ring shadows. Text children get px-1 for the 4px optical label pad."
      >
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-1 p-4">
          <Button>
            <span className="px-1">Primary</span>
          </Button>
          <Button variant="secondary">
            <span className="px-1">Secondary</span>
          </Button>
          <Button variant="outline">
            <span className="px-1">Outline</span>
          </Button>
          <Button variant="ghost">
            <span className="px-1">Ghost</span>
          </Button>
          <Button variant="ghost-destructive">
            <span className="px-1">Reset</span>
          </Button>
          <Button variant="destructive">
            <span className="px-1">Destructive</span>
          </Button>
        </div>
        <p className="mt-3 text-paragraph-xs text-text-muted">
          Primary = violet radial gradient (<InlineCode>btn-gradient-primary</InlineCode>) +{' '}
          <InlineCode>shadow-button-primary</InlineCode>. Secondary = white→highlight
          gradient (<InlineCode>btn-gradient-gray</InlineCode>) +{' '}
          <InlineCode>shadow-button-gray</InlineCode>.
        </p>
      </DocSection>
    </DocPage>
  )
}
