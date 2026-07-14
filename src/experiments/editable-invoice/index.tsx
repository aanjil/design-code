import { CreateInvoicePage, makeRow } from './create-invoice-page'
import { CanvasExperiment } from '@/components/playground/canvas-experiment'

/**
 * Editable table pattern on the Create-invoice page (Niural Pay).
 * Three states of the same flow — empty, mid-edit with an expanded row,
 * and a filled invoice with computed totals.
 */
export function EditableInvoice() {
  return (
    <CanvasExperiment
      slug="editable-invoice"
      windows={[
        {
          id: 'empty',
          title: 'Empty — first open',
          url: 'nexus.niural.com/pay/invoices/new',
          x: 700,
          y: 420,
          width: 1512,
          height: 910,
          content: <CreateInvoicePage />,
        },
        {
          id: 'expanded',
          title: 'Editing — row expanded',
          url: 'nexus.niural.com/pay/invoices/new?state=editing',
          x: 1244,
          y: 745,
          width: 1512,
          height: 910,
          content: (
            <CreateInvoicePage
              initialRows={[
                makeRow({
                  id: 'demo-a',
                  item: 'Design system audit',
                  qty: 1,
                  rate: 4800,
                  taxRate: 'No tax (0%)',
                  description: 'Foundations + component inventory review.',
                }),
                makeRow({ id: 'demo-b' }),
              ]}
              initialExpandedId="demo-a"
            />
          ),
        },
        {
          id: 'filled',
          title: 'Filled — computed totals',
          url: 'nexus.niural.com/pay/invoices/new?state=review',
          x: 1788,
          y: 1070,
          width: 1512,
          height: 910,
          content: (
            <CreateInvoicePage
              initialRows={[
                makeRow({
                  id: 'fill-a',
                  item: 'Payroll implementation — Q3',
                  qty: 1,
                  rate: 12500,
                  discount: 10,
                  discountUnit: '%',
                  taxRate: 'VAT 13%',
                }),
                makeRow({
                  id: 'fill-b',
                  item: 'EOR onboarding (5 hires)',
                  qty: 5,
                  rate: 640,
                  taxRate: 'GST 5%',
                }),
                makeRow({
                  id: 'fill-c',
                  item: 'Benefits setup workshop',
                  qty: 2,
                  rate: 950,
                  discount: 150,
                  discountUnit: '$',
                  taxRate: 'No tax (0%)',
                }),
              ]}
              initialNotes="Payable via ACH. PO #NX-2214."
              initialAddlDiscount={5}
            />
          ),
        },
      ]}
    />
  )
}
