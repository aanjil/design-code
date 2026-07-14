import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode, SpecTable } from '@/docs/doc-kit'

export const Route = createFileRoute('/docs/spacing')({
  component: SpacingDoc,
  head: () => ({ meta: [{ title: 'Spacing — NDS Docs' }] }),
})

const SCALE = [
  { px: 4, cls: 'gap-1', use: 'Icon-to-text gap' },
  { px: 6, cls: 'gap-1.5', use: 'Label → input, form component gaps' },
  { px: 8, cls: 'gap-2', use: 'Between sub-groups — the proximity signal' },
  { px: 10, cls: 'px-2.5', use: 'Horizontal padding on atoms (buttons, tabs)' },
  { px: 12, cls: 'gap-3 / p-3', use: 'List items, button rows, card padding' },
  { px: 16, cls: 'p-4 / gap-x-4', use: 'Page body padding, horizontal grid gap' },
  { px: 20, cls: 'gap-y-5', use: 'Vertical grid gap, item group vertical gap' },
  { px: 24, cls: 'gap-6', use: 'Sub-section gap, modal interior' },
  { px: 32, cls: 'space-y-8', use: 'Default section gap, modal section gap' },
  { px: 48, cls: 'space-y-12', use: 'Large / standalone section gap' },
]

function SpacingDoc() {
  return (
    <DocPage
      title="Spacing"
      description="A 4px base scale. Optical beats mathematical — pick the value that groups information correctly, but never invent values outside the scale."
    >
      <DocSection
        title="Quick reference"
        note="These four cover 99% of cases. Start here before reaching for the full scale."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { px: 8, use: 'between sub-groups' },
            { px: 12, use: 'list items · card padding' },
            { px: 16, use: 'page padding · grid X' },
            { px: 20, use: 'grid Y · item groups' },
          ].map((q) => (
            <div key={q.px} className="rounded-xl bg-surface-1 p-3">
              <p className="font-mono text-mono-md text-text-primary">{q.px}px</p>
              <p className="mt-0.5 text-paragraph-xs text-text-muted">{q.use}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="The scale">
        <div className="flex flex-col gap-2.5">
          {SCALE.map((s) => (
            <div key={s.px} className="flex items-center gap-4">
              <span className="w-10 shrink-0 text-right font-mono text-mono-xs text-text-primary">
                {s.px}
              </span>
              <span
                className="h-4 shrink-0 rounded-[3px] bg-brand-muted"
                style={{ width: s.px * 4 }}
              />
              <span className="w-24 shrink-0 font-mono text-caption text-text-muted">
                {s.cls}
              </span>
              <span className="min-w-0 truncate text-paragraph-xs text-text-muted">
                {s.use}
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Specials">
        <SpecTable
          head={['Token', 'Value', 'Use']}
          rows={[
            [
              <InlineCode key="1">pb-form-bottom</InlineCode>,
              '196px',
              'Form-page bottom scroll room',
            ],
            [
              <InlineCode key="2">h-table-empty</InlineCode>,
              '400px',
              'Fixed table empty-state height',
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-primary marker:text-text-disabled">
          <li>Group with space, not dividers — proximity signals hierarchy.</li>
          <li>
            Stacked text takes no gap; line-height handles it (see Typography).
          </li>
          <li>
            Dense nested UIs: bottom-up (4 → 8 → 12 → 16). Page-level content:
            top-down (32 → 24 → 20).
          </li>
          <li>
            Standalone section → 48px; flowing section → 32px. When unsure,
            ask whether the section stands alone.
          </li>
          <li>
            15px that looks better than 16px is allowed only if you can say
            why. New token values are not.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
