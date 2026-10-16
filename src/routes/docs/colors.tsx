import { createFileRoute } from '@tanstack/react-router'
import type { SwatchDef } from '@/docs/doc-kit'
import { DocPage, DocSection, InlineCode, SwatchGrid } from '@/docs/doc-kit'

export const Route = createFileRoute('/docs/colors')({
  component: ColorsDoc,
  head: () => ({ meta: [{ title: 'Colors - NDS Docs' }] }),
})

/* Literal classes so Tailwind compiles them; names match colors.md. */

const BG_NEUTRAL: Array<SwatchDef> = [
  { name: 'background-base', cls: 'bg-base' },
  { name: 'background-muted', cls: 'bg-muted' },
  { name: 'background-emphasis', cls: 'bg-emphasis' },
  { name: 'background-disabled', cls: 'bg-disabled' },
  { name: 'background-highlight', cls: 'bg-highlight' },
  { name: 'background-item', cls: 'bg-item' },
]

const BG_STATUS: Array<SwatchDef> = [
  { name: 'success-base', cls: 'bg-success' },
  { name: 'success-emphasis', cls: 'bg-success-emphasis' },
  { name: 'success-muted', cls: 'bg-success-muted' },
  { name: 'success-muted-hover', cls: 'bg-success-muted-hover' },
  { name: 'success-highlight', cls: 'bg-success-highlight' },
  { name: 'warning-base', cls: 'bg-warning' },
  { name: 'warning-emphasis', cls: 'bg-warning-emphasis' },
  { name: 'warning-muted', cls: 'bg-warning-muted' },
  { name: 'warning-muted-hover', cls: 'bg-warning-muted-hover' },
  { name: 'warning-highlight', cls: 'bg-warning-highlight' },
  { name: 'info-base', cls: 'bg-info' },
  { name: 'info-emphasis', cls: 'bg-info-emphasis' },
  { name: 'info-muted', cls: 'bg-info-muted' },
  { name: 'info-muted-hover', cls: 'bg-info-muted-hover' },
  { name: 'info-highlight', cls: 'bg-info-highlight' },
  { name: 'error-base', cls: 'bg-error' },
  { name: 'error-emphasis', cls: 'bg-error-emphasis' },
  { name: 'error-muted', cls: 'bg-error-muted' },
  { name: 'error-muted-hover', cls: 'bg-error-muted-hover' },
  { name: 'error-highlight', cls: 'bg-error-highlight' },
]

const TEXT: Array<SwatchDef> = [
  { name: 'text-primary', cls: 'bg-(--text-base)' },
  { name: 'text-muted', cls: 'bg-(--text-muted)' },
  { name: 'text-disabled', cls: 'bg-(--text-disabled)' },
  { name: 'text-on-color', cls: 'bg-(--text-on-color)' },
  { name: 'text-success-base', cls: 'bg-(--text-success-base)' },
  { name: 'text-success-subtle', cls: 'bg-(--text-success-subtle)' },
  { name: 'text-warning-base', cls: 'bg-(--text-warning-base)' },
  { name: 'text-warning-subtle', cls: 'bg-(--text-warning-subtle)' },
  { name: 'text-info-base', cls: 'bg-(--text-info-base)' },
  { name: 'text-info-subtle', cls: 'bg-(--text-info-subtle)' },
  { name: 'text-error-base', cls: 'bg-(--text-error-base)' },
  { name: 'text-error-subtle', cls: 'bg-(--text-error-subtle)' },
]

const BORDER: Array<SwatchDef> = [
  { name: 'border-base', cls: 'bg-(--border-default)' },
  { name: 'border-muted', cls: 'bg-(--border-muted)' },
  { name: 'border-card', cls: 'bg-(--border-card)' },
  { name: 'border-highlight', cls: 'bg-(--border-highlight)' },
  { name: 'border-success-base', cls: 'bg-(--border-success-base)' },
  { name: 'border-success-muted', cls: 'bg-(--border-success-muted)' },
  { name: 'border-warning-base', cls: 'bg-(--border-warning-base)' },
  { name: 'border-warning-muted', cls: 'bg-(--border-warning-muted)' },
  { name: 'border-info-base', cls: 'bg-(--border-info-base)' },
  { name: 'border-info-muted', cls: 'bg-(--border-info-muted)' },
  { name: 'border-error-base', cls: 'bg-(--border-error-base)' },
  { name: 'border-error-muted', cls: 'bg-(--border-error-muted)' },
]

const BRAND: Array<SwatchDef> = [
  { name: 'brand-primary', cls: 'bg-brand' },
  { name: 'brand-emphasis', cls: 'bg-brand-emphasis' },
  { name: 'brand-muted', cls: 'bg-brand-muted' },
  { name: 'brand-base', cls: 'bg-brand-base' },
  { name: 'brand-surface', cls: 'bg-brand-surface' },
  { name: 'brand-text', cls: 'bg-(--brand-text)' },
  { name: 'wallet-primary', cls: 'bg-wallet' },
  { name: 'wallet-secondary', cls: 'bg-wallet-secondary' },
]

const SURFACE: Array<SwatchDef> = [
  { name: 'surface-0', cls: 'bg-surface-app' },
  { name: 'surface-1', cls: 'bg-surface-frame' },
  { name: 'surface-2', cls: 'bg-surface-page' },
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
      'border-success-muted bg-success-highlight text-success',
    solid: 'bg-success',
  },
  {
    label: 'Warning',
    banner:
      'border-warning-muted bg-warning-highlight text-warning',
    solid: 'bg-warning',
  },
  {
    label: 'Info',
    banner:
      'border-info-muted bg-info-highlight text-info',
    solid: 'bg-info',
  },
  {
    label: 'Error',
    banner:
      'border-error-muted bg-error-highlight text-error',
    solid: 'bg-error',
  },
]

function ColorsDoc() {
  return (
    <DocPage
      title="Colors"
      description="Semantic tokens only - primitives are not exposed as utilities and Tailwind's default palette is disabled. Classes come from niural-fe-pkg's Tailwind preset. Values below are measured live, so they follow the theme."
    >
      <DocSection
        title="Backgrounds - neutral"
        note="Page and control surfaces. background-base is the page; highlight is the hover/selected wash."
      >
        <SwatchGrid tokens={BG_NEUTRAL} />
      </DocSection>

      <DocSection
        title="Backgrounds - status"
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
        note="surface-2 is the most elevated. The scale inverts in dark mode - deeper dark, lower number."
      >
        <SwatchGrid tokens={SURFACE} />
      </DocSection>

      <DocSection
        title="Accents"
        note="Decorative only - tags, categories, data viz. Never for status states."
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
              <span className="text-label-small">{p.label} banner</span>
              <span className="ml-auto text-paragraph-xsmall opacity-80">
                bg-highlight · text-base · border-muted
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-paragraph-xsmall text-muted">
          Rule of thumb: <InlineCode>bg-background-{'{s}'}-highlight</InlineCode> +{' '}
          <InlineCode>text-text-{'{s}'}-base</InlineCode> +{' '}
          <InlineCode>border-border-{'{s}'}-muted</InlineCode>. Solid fills use{' '}
          <InlineCode>bg-background-{'{s}'}-base</InlineCode> with{' '}
          <InlineCode>text-on-color</InlineCode>.
        </p>
      </DocSection>
    </DocPage>
  )
}
