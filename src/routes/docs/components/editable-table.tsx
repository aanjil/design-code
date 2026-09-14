import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import {
  EditableRow,
  EditableTable,
  HeaderCell,
  NumberCell,
  SelectCell,
  TextCell,
} from '@/components/nds/editable-table'

export const Route = createFileRoute('/docs/components/editable-table')({
  component: EditableTableDoc,
  head: () => ({ meta: [{ title: 'Editable table - NDS Docs' }] }),
})

interface DemoRow {
  item: string
  qty: number
  tax: string | null
}

function EditableTableDoc() {
  const [rows, setRows] = useState<Array<DemoRow>>([
    { item: 'Design retainer - July', qty: 1, tax: 'VAT 13%' },
    { item: 'Prototype sprint', qty: 2, tax: null },
  ])
  const patch = (i: number, p: Partial<DemoRow>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...p } : r)))

  return (
    <DocPage
      title="Editable table"
      description="Spreadsheet-style entry (create-invoice pattern): CSS grid with subgrid rows, 1px gaps over border-base paint the grid lines. Cells are 44px; hover = highlight, editing = brand ring via focus-within."
    >
      <DocSection title="Live demo" note="Click any cell and type - numbers format to 2dp on blur.">
        <Specimen>
          <EditableTable columns="2fr 100px 140px">
            <EditableRow>
              <HeaderCell>Item</HeaderCell>
              <HeaderCell align="right">Qty</HeaderCell>
              <HeaderCell>Tax</HeaderCell>
            </EditableRow>
            {rows.map((row, i) => (
              <EditableRow key={i}>
                <TextCell value={row.item} onChange={(item) => patch(i, { item })} />
                <NumberCell value={row.qty} onChange={(qty) => patch(i, { qty })} />
                <SelectCell
                  value={row.tax}
                  options={['VAT 13%', 'GST 10%', 'No tax']}
                  onChange={(tax) => patch(i, { tax })}
                />
              </EditableRow>
            ))}
          </EditableTable>
        </Specimen>
      </DocSection>

      <DocSection title="Cell inventory">
        <PropsTable
          props={[
            { name: 'TextCell', type: 'value · onChange · placeholder', description: 'Free text.' },
            { name: 'NumberCell', type: 'value · onChange', description: 'Right-aligned, 2dp on blur - Inter, not mono (DS spec).' },
            { name: 'SelectCell', type: 'value · options · onChange', description: 'Menu cell; open state = active ring.' },
            { name: 'SelectAndTypeCell', type: '+ unit · unitPosition', description: 'Unit select + numeric input (discounts, rates).' },
            { name: 'DateCell', type: 'value · onChange', description: 'Date entry.' },
            { name: 'IconCell / CaretCell', type: 'action cells', description: '48px destructive action · 40px row expander.' },
            { name: 'ExpandedRowPanel', type: 'col-span-full', description: 'Highlight surface with detail form fields.' },
            { name: 'AddRowFooter', type: 'onClick', description: 'Ghost brand “add row” footer row.' },
          ]}
        />
      </DocSection>

      <DocSection title="Rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            <InlineCode>columns</InlineCode> is a grid-template string on{' '}
            <InlineCode>EditableTable</InlineCode>; rows use{' '}
            <InlineCode>grid-cols-subgrid</InlineCode> so cells always align.
          </li>
          <li>
            Reference composition: the create-invoice craft
            (<InlineCode>src/crafts/editable-invoice</InlineCode>).
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
