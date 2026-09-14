import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import {
  FieldLabel,
  SearchField,
  TextArea,
  TextInput,
} from '@/components/nds/controls'
import { SelectField } from '@/components/nds/select-field'
import { Checkbox } from '@/components/ui/checkbox'

export const Route = createFileRoute('/docs/components/inputs')({
  component: InputsDoc,
  head: () => ({ meta: [{ title: 'Form controls - NDS Docs' }] }),
})

function InputsDoc() {
  const [search, setSearch] = useState('')
  const [freq, setFreq] = useState<string | null>(null)
  return (
    <DocPage
      title="Form controls"
      description="36px fields on background-base with the gray ring shadow; focus swaps to the brand focus ring (shadow-border-focus). No borders - elevation ring shadows only."
    >
      <DocSection title="SearchField" note="Toolbar search with the ⌘ hint. Type in it.">
        <Specimen>
          <div className="flex flex-wrap items-center gap-4">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search in employee"
            />
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="showKbd={false}"
              showKbd={false}
            />
          </div>
        </Specimen>
        <div className="mt-4">
          <PropsTable
            props={[
              { name: 'value / onChange', type: 'string / (v) => void', description: 'Controlled value.' },
              { name: 'placeholder', type: 'string', default: "'Search'", description: 'Ghost text.' },
              { name: 'showKbd', type: 'boolean', default: 'true', description: 'Show the ⌘ keyboard hint.' },
              { name: 'autoFocus', type: 'boolean', default: '-', description: 'Focus on mount (collapsed-toolbar expansion).' },
              { name: 'onKeyDown', type: '(e) => void', default: '-', description: 'Escape-to-collapse etc.' },
            ]}
          />
        </div>
      </DocSection>

      <DocSection title="Text fields">
        <Specimen>
          <div className="grid max-w-[560px] grid-cols-2 gap-4 max-md:grid-cols-1">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Schedule name</FieldLabel>
              <TextInput placeholder="US Salaried" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Invalid state</FieldLabel>
              <TextInput invalid defaultValue="not-an-email" />
            </div>
            <div className="col-span-full flex flex-col gap-1.5">
              <FieldLabel>Notes</FieldLabel>
              <TextArea placeholder="Anything payroll should know…" />
            </div>
          </div>
        </Specimen>
        <div className="mt-4">
          <PropsTable
            props={[
              { name: 'TextInput invalid', type: 'boolean', default: 'false', description: 'Error ring (shadow-border-error), kept on focus.' },
              { name: 'FieldLabel required', type: 'boolean', default: 'false', description: 'Appends the red asterisk.' },
              { name: '…rest', type: "ComponentProps<'input' | 'textarea'>", description: 'Native props pass through.' },
            ]}
          />
        </div>
      </DocSection>

      <DocSection title="SelectField" note="Form select styled like TextInput; menu portals into the canvas window.">
        <Specimen>
          <div className="flex max-w-[560px] flex-col gap-1.5">
            <FieldLabel required>Pay frequency</FieldLabel>
            <SelectField
              value={freq}
              onChange={setFreq}
              placeholder="Choose frequency"
              options={['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly']}
              className="w-64"
            />
          </div>
        </Specimen>
        <div className="mt-4">
          <PropsTable
            props={[
              { name: 'value', type: 'string | null', description: 'null renders the placeholder.' },
              { name: 'options', type: 'Array<string>', description: 'Flat option list; current shows a brand check.' },
              { name: 'onChange', type: '(value: string) => void', description: 'Selection handler.' },
              { name: 'disabled / align / className', type: 'misc', default: '-', description: 'Trigger disabled state, menu align, width overrides.' },
            ]}
          />
        </div>
      </DocSection>

      <DocSection title="Checkbox" note="14px, 4px radius; checked = brand fill + primary ring.">
        <Specimen>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-label-sm text-text-primary">
              <Checkbox aria-label="Unchecked" /> Unchecked
            </label>
            <label className="flex items-center gap-2 text-label-sm text-text-primary">
              <Checkbox defaultChecked aria-label="Checked" /> Checked
            </label>
            <label className="flex items-center gap-2 text-label-sm text-text-muted">
              <Checkbox disabled aria-label="Disabled" /> Disabled
            </label>
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            Fields sitting ON a flyout surface need the hairline treatment instead of
            the white ring - see the Display menu (<InlineCode>TODO: Fix color</InlineCode>{' '}
            tokens pending).
          </li>
          <li>Labels are Label/Small above the field with a 6px gap.</li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
