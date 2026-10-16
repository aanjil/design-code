import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode } from '@/docs/doc-kit'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/docs/typography')({
  component: TypographyDoc,
  head: () => ({ meta: [{ title: 'Typography - NDS Docs' }] }),
})

interface Specimen {
  cls: string
  name: string
  meta: string
  sample?: string
  mono?: boolean
}

const TITLES: Array<Specimen> = [
  { cls: 'text-title-h1', name: 'Title/H1', meta: '56 · 520 · 100% · −4%' },
  { cls: 'text-title-h2', name: 'Title/H2', meta: '48 · 520 · 100% · −4%' },
  { cls: 'text-title-h3', name: 'Title/H3', meta: '40 · 520 · 100% · −3%' },
  { cls: 'text-title-h4', name: 'Title/H4', meta: '32 · 520 · 100% · −2%' },
  { cls: 'text-title-h5', name: 'Title/H5', meta: '24 · 520 · 100% · −2%' },
]

const PARAGRAPHS: Array<Specimen> = [
  { cls: 'text-paragraph-large', name: 'Paragraph/XLarge', meta: '20 · 425 · 150% · −2%' },
  { cls: 'text-paragraph-large', name: 'Paragraph/Large', meta: '18 · 425 · 150% · −2%' },
  { cls: 'text-paragraph-medium', name: 'Paragraph/Medium', meta: '16 · 425 · 150% · −2%' },
  { cls: 'text-paragraph-small', name: 'Paragraph/Small', meta: '14 · 425 · 150% · −2%' },
  { cls: 'text-paragraph-xsmall', name: 'Paragraph/XSmall', meta: '13 · 425 · 150% · −2%' },
]

const LABELS: Array<Specimen> = [
  { cls: 'text-label-xlarge', name: 'Label/XLarge', meta: '20 · 550 · 150% · −2%' },
  { cls: 'text-label-large', name: 'Label/Large', meta: '18 · 550 · 150% · −2%' },
  { cls: 'text-label-medium', name: 'Label/Medium', meta: '16 · 550 · 150% · −2%' },
  { cls: 'text-label-small', name: 'Label/Small', meta: '14 · 530 · 150% · −2%' },
  { cls: 'text-label-xsmall', name: 'Label/XSmall', meta: '13 · 550 · 150% · −2%' },
]

const CAPTIONS: Array<Specimen> = [
  { cls: 'text-caption-sm font-medium', name: 'Caption/medium', meta: '12 · 500 · 130% · −2%' },
  { cls: 'text-caption-sm', name: 'Caption/regular', meta: '12 · 425 · 130% · −2%' },
]

const MONO: Array<Specimen> = [
  { cls: 'text-label-xlarge', name: 'Mono/XLarge', meta: '20 · 425 · 150% · −1%', mono: true },
  { cls: 'text-paragraph-large', name: 'Mono/Large', meta: '18 · 425 · 150% · −1%', mono: true },
  { cls: 'text-label-medium', name: 'Mono/Medium', meta: '16 · 600 · 150% · −1%', mono: true },
  { cls: 'text-label-small', name: 'Mono/Small', meta: '14 · 600 · 150% · −1%', mono: true },
  { cls: 'text-paragraph-xsmall', name: 'Mono/XSmall', meta: '13 · 425 · 150% · −1%', mono: true },
]

function SpecimenList({
  specimens,
  sample,
}: {
  specimens: Array<Specimen>
  sample: string
}) {
  return (
    <div className="flex flex-col">
      {specimens.map((s) => (
        <div
          key={s.cls}
          className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-base py-3"
        >
          <div className="w-44 shrink-0">
            <p className="text-label-xsmall text-primary">{s.name}</p>
            <p className="tabular-nums text-caption-sm text-muted">{s.meta}</p>
          </div>
          <p
            className={cn(
              'min-w-0 truncate text-primary',
              s.mono && 'font-mono',
              s.cls,
            )}
          >
            {s.sample ?? sample}
          </p>
        </div>
      ))}
    </div>
  )
}

function TypographyDoc() {
  return (
    <DocPage
      title="Typography"
      description="Two typefaces: Inter for all UI text, Geist Mono for numbers and data. One class sets size, weight, line-height and tracking - never compose type by hand."
    >
      <DocSection
        title="Title"
        note="Inter 520, line-height 100%. Headlines don't wrap - keep copy short, never truncate."
      >
        <SpecimenList specimens={TITLES} sample="Global payroll, simplified" />
      </DocSection>

      <DocSection
        title="Paragraph"
        note="Reading text, weight 425. Body default is Paragraph/Small (14px)."
      >
        <SpecimenList
          specimens={PARAGRAPHS}
          sample="Pay teams in 150+ countries with one approval flow."
        />
      </DocSection>

      <DocSection
        title="Label"
        note="UI text - buttons, form labels, table headers, tabs. Label/Small (14/530) is the platform default."
      >
        <SpecimenList specimens={LABELS} sample="Approve payroll" />
      </DocSection>

      <DocSection title="Caption" note="12px metadata, timestamps, helper text.">
        <SpecimenList specimens={CAPTIONS} sample="Updated 2 hours ago" />
      </DocSection>

      <DocSection
        title="Mono"
        note="Geist Mono is for code only - class names, file paths, snippets. Numbers stay in Inter with tabular-nums."
      >
        <SpecimenList specimens={MONO} sample="text-label-small · src/styles.css" />
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-small text-primary marker:text-disabled">
          <li>Max two type sizes per component.</li>
          <li>
            No custom font sizes - if a size isn't in the scale, the design
            needs revisiting, not a new size.
          </li>
          <li>
            Stacked text (name over role, label over value) takes{' '}
            <InlineCode>no gap</InlineCode> - 150% line-height provides the
            separation. Remove <InlineCode>gap-1</InlineCode> on sight.
          </li>
          <li>Label for interactive/UI text, Paragraph for reading text.</li>
          <li>
            All money, IDs, dates-in-tables: Inter with{' '}
            <InlineCode>tabular-nums</InlineCode> - never mono.
          </li>
          <li>
            New <InlineCode>--text-*</InlineCode> tokens must also be registered
            in <InlineCode>src/lib/utils.ts</InlineCode> (tailwind-merge) or
            they'll be dropped next to color classes.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
