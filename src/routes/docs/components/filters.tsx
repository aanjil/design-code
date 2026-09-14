import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardText, MapPin } from '@phosphor-icons/react'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import type {
  FilterCondition,
  FilterFieldDef,
} from '@/components/nds/filters/types'
import { upsertCondition } from '@/components/nds/filters/types'
import { FilterMenu } from '@/components/nds/filters/filter-menu'
import { FilterBar } from '@/components/nds/filters/filter-bar'

export const Route = createFileRoute('/docs/components/filters')({
  component: FiltersDoc,
  head: () => ({ meta: [{ title: 'Filters - NDS Docs' }] }),
})

const FIELDS: Array<FilterFieldDef> = [
  {
    id: 'work-location',
    label: 'Work location',
    icon: MapPin,
    options: ['Remote - US', 'Remote - EU', 'New York HQ', 'Berlin', 'London'],
    synonyms: { 'new york': 'New York HQ' },
  },
  {
    id: 'employee-type',
    label: 'Employee type',
    icon: ClipboardText,
    options: ['Full-time', 'Part-time', 'Contractor', 'EOR'],
    synonyms: { contractors: 'Contractor' },
  },
]

function FiltersDoc() {
  const [conditions, setConditions] = useState<Array<FilterCondition>>([
    { fieldId: 'employee-type', operator: 'is-any-of', values: ['Contractor', 'EOR'] },
  ])
  const upsert = (fieldId: string, values: Array<string>) =>
    setConditions((prev) => upsertCondition(prev, fieldId, values))
  const remove = (fieldId: string) =>
    setConditions((prev) => prev.filter((c) => c.fieldId !== fieldId))

  return (
    <DocPage
      title="Filters pattern"
      description="Filter button → field menu → nested multi-select value panel; applied conditions render as editable segmented chips with AI prompt filtering. This page is fully live - open the menu, edit a chip, try the prompt."
    >
      <DocSection
        title="Live demo"
        note='Try: open Filter → Work location; click a chip value to edit in place; prompt “contractors in new york”.'
      >
        <Specimen>
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <FilterMenu
                fields={FIELDS}
                conditions={conditions}
                onUpsert={upsert}
                onRemove={remove}
              />
            </div>
            <FilterBar
              fields={FIELDS}
              conditions={conditions}
              onUpsert={upsert}
              onRemove={remove}
              onClear={() => setConditions([])}
              onApplyPrompt={(prompt) => {
                let hits = 0
                let next = conditions
                for (const field of FIELDS) {
                  const values = field.options.filter((option) =>
                    prompt.toLowerCase().includes(option.toLowerCase()),
                  )
                  const synonymHits = Object.entries(field.synonyms ?? {})
                    .filter(([phrase]) => prompt.toLowerCase().includes(phrase))
                    .map(([, option]) => option)
                  const merged = [...new Set([...values, ...synonymHits])]
                  if (merged.length > 0) {
                    next = upsertCondition(next, field.id, merged)
                    hits++
                  }
                }
                setConditions(next)
                return hits
              }}
              onSaveView={() => {}}
            />
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Data model">
        <PropsTable
          props={[
            {
              name: 'FilterFieldDef',
              type: '{ id; label; icon: Icon; options: string[]; synonyms? }',
              description: 'One filterable field; synonyms feed the AI prompt parser.',
            },
            {
              name: 'FilterCondition',
              type: "{ fieldId; operator: 'is' | 'is-any-of'; values: string[] }",
              description:
                'One condition per field max - applying replaces (upsertCondition); empty values removes.',
            },
            {
              name: 'Matching',
              type: 'OR within a field · AND across fields',
              description: 'Any filter change resets pagination to page 1.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Pieces">
        <PropsTable
          props={[
            {
              name: 'FilterMenu',
              type: 'fields · conditions · onUpsert · onRemove',
              description:
                '34px secondary trigger (count badge when active) → 200px field menu → 270px value panel with search, draft selection, Reset/Apply.',
            },
            {
              name: 'FilterBar',
              type: '…same + onClear · onApplyPrompt · onSaveView',
              description:
                'Applied container: segmented chips (field | operator | values | ×), chips reopen the panel in place, AI prompt entry, Save view, Clear.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>The bar only renders with ≥1 condition - no empty container.</li>
          <li>
            Chip segments never wrap (<InlineCode>whitespace-nowrap</InlineCode>); chips
            reflow as whole units.
          </li>
          <li>
            Full contract for engineering:{' '}
            <InlineCode>docs/handoff/filter-system.md</InlineCode>.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
