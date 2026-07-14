import { createFileRoute } from '@tanstack/react-router'
import type { SwatchDef } from '@/docs/doc-kit'
import { DocPage, DocSection, InlineCode, SwatchGrid } from '@/docs/doc-kit'

export const Route = createFileRoute('/docs/colors')({
  component: ColorsDoc,
  head: () => ({ meta: [{ title: 'Colors — NDS Docs' }] }),
})

/* Literal classes so Tailwind compiles them; names match colors.md. */

const BG_NEUTRAL: Array<SwatchDef> = [
  { name: 'background-base', cls: 'bg-background-base' },
  { name: 'background-muted', cls: 'bg-background-muted' },
  { name: 'background-emphasis', cls: 'bg-background-emphasis' },
  { name: 'background-disabled', cls: 'bg-background-disabled' },
  { name: 'background-highlight', cls: 'bg-background-highlight' },
  { name: 'background-item', cls: 'bg-background-item' },
]

const BG_STATUS: Array<SwatchDef> = [
  { name: 'success-base', cls: 'bg-background-success-base' },
  { name: 'success-emphasis', cls: 'bg-background-success-emphasis' },
  { name: 'success-muted', cls: 'bg-background-success-muted' },
  { name: 'success-muted-hover', cls: 'bg-background-success-muted-hover' },
  { name: 'success-highlight', cls: 'bg-background-success-highlight' },
  { name: 'warning-base', cls: 'bg-background-warning-base' },
  { name: 'warning-emphasis', cls: 'bg-background-warning-emphasis' },
  { name: 'warning-muted', cls: 'bg-background-warning-muted' },
  { name: 'warning-muted-hover', cls: 'bg-background-warning-muted-hover' },
  { name: 'warning-highlight', cls: 'bg-background-warning-highlight' },
  { name: 'info-base', cls: 'bg-background-info-base' },
  { name: 'info-emphasis', cls: 'bg-background-info-emphasis' },
  { name: 'info-muted', cls: 'bg-background-info-muted' },
  { name: 'info-muted-hover', cls: 'bg-background-info-muted-hover' },
  { name: 'info-highlight', cls: 'bg-background-info-highlight' },
  { name: 'error-base', cls: 'bg-background-error-base' },
  { name: 'error-emphasis', cls: 'bg-background-error-emphasis' },
  { name: 'error-muted', cls: 'bg-background-error-muted' },
  { name: 'error-muted-hover', cls: 'bg-background-error-muted-hover' },
  { name: 'error-highlight', cls: 'bg-background-error-highlight' },
]

const TEXT: Array<SwatchDef> = [
  { name: 'text-primary', cls: 'bg-text-primary' },
  { name: 'text-muted', cls: 'bg-text-muted' },
  { name: 'text-disabled', cls: 'bg-text-disabled' },
  { name: 'text-on-color', cls: 'bg-text-on-color' },
  { name: 'text-success-base', cls: 'bg-text-success-base' },
  { name: 'text-success-subtle', cls: 'bg-text-success-subtle' },
  { name: 'text-warning-base', cls: 'bg-text-warning-base' },
  { name: 'text-warning-subtle', cls: 'bg-text-warning-subtle' },
  { name: 'text-info-base', cls: 'bg-text-info-base' },
  { name: 'text-info-subtle', cls: 'bg-text-info-subtle' },
  { name: 'text-error-base', cls: 'bg-text-error-base' },
  { name: 'text-error-subtle', cls: 'bg-text-error-subtle' },
]

const BORDER: Array<SwatchDef> = [
  { name: 'border-base', cls: 'bg-border-base' },
  { name: 'border-muted', cls: 'bg-border-muted' },
  { name: 'border-card', cls: 'bg-border-card' },
  { name: 'border-highlight', cls: 'bg-border-highlight' },
  { name: 'border-success-base', cls: 'bg-border-success-base' },
  { name: 'border-success-muted', cls: 'bg-border-success-muted' },
  { name: 'border-warning-base', cls: 'bg-border-warning-base' },
  { name: 'border-warning-muted', cls: 'bg-border-warning-muted' },
  { name: 'border-info-base', cls: 'bg-border-info-base' },
  { name: 'border-info-muted', cls: 'bg-border-info-muted' },
  { name: 'border-error-base', cls: 'bg-border-error-base' },
  { name: 'border-error-muted', cls: 'bg-border-error-muted' },
]

const BRAND: Array<SwatchDef> = [
  { name: 'brand-primary', cls: 'bg-brand-primary' },
  { name: 'brand-emphasis', cls: 'bg-brand-emphasis' },
  { name: 'brand-muted', cls: 'bg-brand-muted' },
  { name: 'brand-base', cls: 'bg-brand-base' },
  { name: 'brand-surface', cls: 'bg-brand-surface' },
  { name: 'brand-text', cls: 'bg-brand-text' },
  { name: 'wallet-primary', cls: 'bg-brand-wallet-primary' },
  { name: 'wallet-secondary', cls: 'bg-brand-wallet-secondary' },
]

const SURFACE: Array<SwatchDef> = [
  { name: 'surface-0', cls: 'bg-surface-0' },
  { name: 'surface-1', cls: 'bg-surface-1' },
  { name: 'surface-2', cls: 'bg-surface-2' },
]

const ACCENT: Array<SwatchDef> = [
  { name: 'accent-orange-base', cls: 'bg-accent-orange-base' },
  { name: 'accent-orange-muted', cls: 'bg-accent-orange-muted' },
  { name: 'accent-orange-highlight', cls: 'bg-accent-orange-highlight' },
  { name: 'accent-pink-base', cls: 'bg-accent-pink-base' },
  { name: 'accent-pink-muted', cls: 'bg-accent-pink-muted' },
  { name: 'accent-pink-highlight', cls: 'bg-accent-pink-highlight' },
  { name: 'accent-teal-base', cls: 'bg-accent-teal-base' },
  { name: 'accent-teal-muted', cls: 'bg-accent-teal-muted' },
  { name: 'accent-teal-highlight', cls: 'bg-accent-teal-highlight' },
  { name: 'accent-violet-base', cls: 'bg-accent-violet-base' },
  { name: 'accent-violet-muted', cls: 'bg-accent-violet-muted' },
  { name: 'accent-violet-highlight', cls: 'bg-accent-violet-highlight' },
]

const PAIRINGS = [
  {
    label: 'Success',
    banner:
      'border-border-success-muted bg-background-success-highlight text-text-success-base',
    solid: 'bg-background-success-base',
  },
  {
    label: 'Warning',
    banner:
      'border-border-warning-muted bg-background-warning-highlight text-text-warning-base',
    solid: 'bg-background-warning-base',
  },
  {
    label: 'Info',
    banner:
      'border-border-info-muted bg-background-info-highlight text-text-info-base',
    solid: 'bg-background-info-base',
  },
  {
    label: 'Error',
    banner:
      'border-border-error-muted bg-background-error-highlight text-text-error-base',
    solid: 'bg-background-error-base',
  },
]

function ColorsDoc() {
  return (
    <DocPage
      title="Colors"
      description="Semantic tokens only — primitives are not exposed as utilities and Tailwind's default palette is disabled. Utility suffix equals the token name from colors.md. Values below are measured live, so they follow the theme."
    >
      <DocSection
        title="Backgrounds — neutral"
        note="Page and control surfaces. background-base is the page; highlight is the hover/selected wash."
      >
        <SwatchGrid tokens={BG_NEUTRAL} />
      </DocSection>

      <DocSection
        title="Backgrounds — status"
        note="base/emphasis for solid fills, muted for chips, highlight for banners. Never use accents for status."
      >
        <SwatchGrid tokens={BG_STATUS} />
      </DocSection>

      <DocSection
        title="Text"
        note="text-primary for content, muted for secondary, on-color on any brand/status fill."
      >
        <SwatchGrid tokens={TEXT} />
      </DocSection>

      <DocSection
        title="Borders"
        note="border-base is the workhorse; highlight for hairlines inside cards and tables."
      >
        <SwatchGrid tokens={BORDER} />
      </DocSection>

      <DocSection
        title="Brand"
        note="brand-primary drives primary actions and focus rings; brand-text is the accessible text/icon variant."
      >
        <SwatchGrid tokens={BRAND} />
      </DocSection>

      <DocSection
        title="Surfaces"
        note="surface-2 is the most elevated. The scale inverts in dark mode — deeper dark, lower number."
      >
        <SwatchGrid tokens={SURFACE} />
      </DocSection>

      <DocSection
        title="Accents"
        note="Decorative only — tags, categories, data viz. Never for status states."
      >
        <SwatchGrid tokens={ACCENT} />
      </DocSection>

      <DocSection
        title="Semantic pairing"
        note="Status UIs pair background + text + border from the same family. These banners are built exactly that way."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAIRINGS.map((p) => (
            <div
              key={p.label}
              className={`flex items-center gap-2 rounded-xl border p-3 ${p.banner}`}
            >
              <span className={`size-2 rounded-full ${p.solid}`} />
              <span className="text-label-sm">{p.label} banner</span>
              <span className="ml-auto text-paragraph-xs opacity-80">
                bg-highlight · text-base · border-muted
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-paragraph-xs text-text-muted">
          Rule of thumb: <InlineCode>bg-background-{'{s}'}-highlight</InlineCode> +{' '}
          <InlineCode>text-text-{'{s}'}-base</InlineCode> +{' '}
          <InlineCode>border-border-{'{s}'}-muted</InlineCode>. Solid fills use{' '}
          <InlineCode>bg-background-{'{s}'}-base</InlineCode> with{' '}
          <InlineCode>text-text-on-color</InlineCode>.
        </p>
      </DocSection>
    </DocPage>
  )
}
