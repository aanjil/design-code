import { useMemo, useState } from 'react'
import { CalendarBlank, UploadSimple } from '@phosphor-icons/react'
import { AppBar } from '@/components/nds/app-bar'
import {
  AppShell,
  MainLayout,
  PageBody,
  PageFooter,
  PageHeader,
  PageLayout,
} from '@/components/nds/layouts'
import { FieldLabel, TextArea, TextInput } from '@/components/nds/controls'
import { SelectField } from '@/components/nds/select-field'
import {
  AddRowFooter,
  CaretCell,
  EditableRow,
  EditableTable,
  ExpandedRowPanel,
  HeaderCell,
  HeaderIconCell,
  IconCell,
  NumberCell,
  SelectAndTypeCell,
  SelectCell,
  TextCell,
} from '@/components/nds/editable-table'
import { Button } from '@/components/ui/button'

/**
 * "Create invoice" (Niural Pay) — FormLayout page hosting the editable
 * line-items table. Everything composes the shared nds components; the
 * page recomputes amounts/totals live from row state.
 */

export interface InvoiceRow {
  id: string
  item: string
  qty: number
  rate: number
  discount: number
  discountUnit: '%' | '$'
  taxRate: string | null
  description: string
  itemCode: string
}

export const TAX_RATES = ['No tax (0%)', 'GST 5%', 'VAT 13%', 'Sales tax 8.5%']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NPR']
const PAYMENT_TERMS: Record<string, number> = {
  'Due on receipt': 0,
  'One Week': 7,
  'Two Weeks': 14,
  'One Month': 30,
}

let rowSeq = 0
export function makeRow(partial: Partial<InvoiceRow> = {}): InvoiceRow {
  rowSeq += 1
  return {
    id: `row-${rowSeq}`,
    item: '',
    qty: 0,
    rate: 0,
    discount: 0,
    discountUnit: '%',
    taxRate: null,
    description: '',
    itemCode: '',
    ...partial,
  }
}

function taxPct(taxRate: string | null): number {
  const m = taxRate?.match(/([\d.]+)%/)
  return m ? parseFloat(m[1]) / 100 : 0
}

function rowMath(row: InvoiceRow) {
  const base = row.qty * row.rate
  const discount =
    row.discountUnit === '%' ? (base * row.discount) / 100 : row.discount
  const lineAmount = Math.max(0, base - discount)
  return { lineAmount, lineTax: lineAmount * taxPct(row.taxRate) }
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  // local-parts math — toISOString would shift a day in non-UTC timezones
  const date = new Date(y, m - 1, d + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 })

export function CreateInvoicePage({
  initialRows,
  initialExpandedId = null,
  initialNotes = '',
  initialAddlDiscount = 0,
}: {
  initialRows?: Array<InvoiceRow>
  initialExpandedId?: string | null
  initialNotes?: string
  initialAddlDiscount?: number
}) {
  const [entity, setEntity] = useState<string | null>('Anjil Crafts')
  const [department, setDepartment] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [currency, setCurrency] = useState<string | null>(null)
  const [invoiceDate, setInvoiceDate] = useState('2026-07-10')
  const [paymentTerm, setPaymentTerm] = useState<string | null>('One Week')
  const [rows, setRows] = useState<Array<InvoiceRow>>(
    () => initialRows ?? [makeRow()],
  )
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId)
  const [notes, setNotes] = useState(initialNotes)
  const [addlDiscount, setAddlDiscount] = useState(initialAddlDiscount)
  const [addlDiscountUnit, setAddlDiscountUnit] = useState<'%' | '$'>('%')

  const paymentDue = paymentTerm
    ? addDays(invoiceDate, PAYMENT_TERMS[paymentTerm] ?? 0)
    : ''

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, r) => sum + rowMath(r).lineAmount, 0)
    const tax = rows.reduce((sum, r) => sum + rowMath(r).lineTax, 0)
    const extra =
      addlDiscountUnit === '%' ? (subtotal * addlDiscount) / 100 : addlDiscount
    return {
      subtotal,
      tax,
      extra,
      net: Math.max(0, subtotal - extra + tax),
    }
  }, [rows, addlDiscount, addlDiscountUnit])

  function patchRow(id: string, patch: Partial<InvoiceRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <AppShell>
      <AppBar activeItem="Niural Pay" />
      <MainLayout>
        <PageLayout>
          <PageHeader title="Create invoice" onBack={() => {}} />
          <PageBody className="px-6 pt-8 pb-form-bottom">
            <div className="mx-auto flex max-w-[1300px] flex-col gap-8">
              {/* Entity row */}
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  value={entity}
                  options={['Anjil Crafts', 'Nexus Corp America', 'Nexus EU GmbH']}
                  onChange={setEntity}
                />
                <SelectField
                  value={department}
                  options={['Design', 'Engineering', 'Finance', 'Operations']}
                  onChange={setDepartment}
                  placeholder="Select department"
                />
              </div>
              <div className="border-t border-dashed border-border-base" />

              {/* Invoice details */}
              <section>
                <h2 className="text-label-lg text-text-primary">
                  Invoice details
                </h2>
                <p className="text-paragraph-sm text-text-muted">
                  Enter the details below to create a new invoice.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="inv-ref">Reference number</FieldLabel>
                    <TextInput
                      id="inv-ref"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Currency</FieldLabel>
                    <SelectField
                      value={currency}
                      options={CURRENCIES}
                      onChange={setCurrency}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="inv-code">Invoice code</FieldLabel>
                    <TextInput id="inv-code" value="DRAFT" disabled readOnly />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required htmlFor="inv-date">
                      Invoice date
                    </FieldLabel>
                    <div className="relative">
                      <CalendarBlank className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
                      <TextInput
                        id="inv-date"
                        className="pl-9"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Payment term</FieldLabel>
                    <SelectField
                      value={paymentTerm}
                      options={Object.keys(PAYMENT_TERMS)}
                      onChange={setPaymentTerm}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required htmlFor="inv-due">
                      Payment due
                    </FieldLabel>
                    <div className="relative">
                      <CalendarBlank className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
                      <TextInput
                        id="inv-due"
                        className="pl-9"
                        value={paymentDue}
                        readOnly
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Line level fields */}
              <section>
                <h2 className="text-label-lg text-text-primary">
                  Line level fields
                </h2>
                <div className="mt-4">
                  <EditableTable columns="40px minmax(180px,2fr) 1fr 1fr 1.4fr 1.4fr 1fr 48px">
                    <EditableRow>
                      <HeaderIconCell collapse />
                      <HeaderCell>Item</HeaderCell>
                      <HeaderCell align="right">Quantity</HeaderCell>
                      <HeaderCell align="right">Rate</HeaderCell>
                      <HeaderCell>Discount</HeaderCell>
                      <HeaderCell>Tax</HeaderCell>
                      <HeaderCell align="right">Amount</HeaderCell>
                      <HeaderCell />
                    </EditableRow>
                    {rows.map((row) => {
                      const { lineAmount } = rowMath(row)
                      const expanded = expandedId === row.id
                      return (
                        <EditableRow key={row.id}>
                          <CaretCell
                            expanded={expanded}
                            onToggle={() =>
                              setExpandedId(expanded ? null : row.id)
                            }
                          />
                          <TextCell
                            value={row.item}
                            onChange={(item) => patchRow(row.id, { item })}
                            placeholder=""
                          />
                          <NumberCell
                            value={row.qty}
                            onChange={(qty) => patchRow(row.id, { qty })}
                          />
                          <NumberCell
                            value={row.rate}
                            onChange={(rate) => patchRow(row.id, { rate })}
                          />
                          <SelectAndTypeCell
                            value={row.discount}
                            onChange={(discount) =>
                              patchRow(row.id, { discount })
                            }
                            unit={row.discountUnit}
                            units={['%', '$']}
                            onUnitChange={(u) =>
                              patchRow(row.id, {
                                discountUnit: u as InvoiceRow['discountUnit'],
                              })
                            }
                          />
                          <SelectCell
                            value={row.taxRate}
                            options={TAX_RATES}
                            onChange={(taxRate) =>
                              patchRow(row.id, { taxRate })
                            }
                            placeholder="Select tax rate"
                          />
                          <NumberCell value={lineAmount} readOnly />
                          <IconCell
                            label="Remove line"
                            destructive
                            onClick={() =>
                              setRows((prev) =>
                                prev.length > 1
                                  ? prev.filter((r) => r.id !== row.id)
                                  : prev,
                              )
                            }
                          />
                          {expanded && (
                            <ExpandedRowPanel>
                              <div className="flex w-[320px] flex-col gap-1.5">
                                <FieldLabel htmlFor={`${row.id}-desc`}>
                                  Description
                                </FieldLabel>
                                <TextArea
                                  id={`${row.id}-desc`}
                                  value={row.description}
                                  onChange={(e) =>
                                    patchRow(row.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Description..."
                                  className="min-h-16 bg-background-base"
                                />
                              </div>
                              <div className="flex w-[250px] flex-col gap-1.5">
                                <FieldLabel required htmlFor={`${row.id}-code`}>
                                  Item code
                                </FieldLabel>
                                <TextInput
                                  id={`${row.id}-code`}
                                  value={row.itemCode}
                                  onChange={(e) =>
                                    patchRow(row.id, {
                                      itemCode: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </ExpandedRowPanel>
                          )}
                        </EditableRow>
                      )
                    })}
                    <AddRowFooter
                      onClick={() => setRows((prev) => [...prev, makeRow()])}
                    />
                  </EditableTable>
                </div>
              </section>

              {/* Notes + totals */}
              <section className="grid grid-cols-2 gap-x-12 gap-y-5">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="inv-notes">Notes</FieldLabel>
                    <TextArea
                      id="inv-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add a note."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>
                      Additional attachment{' '}
                      <span className="text-paragraph-xs text-text-muted">
                        (Optional)
                      </span>
                    </FieldLabel>
                    <div className="flex items-center gap-3 rounded-btn p-2 shadow-button-gray">
                      <Button variant="secondary">
                        <UploadSimple />
                        <span className="px-1">Upload file</span>
                      </Button>
                      <span className="text-paragraph-xs text-text-muted">
                        or drop file to upload
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <TotalRow label="Subtotal" value={totals.subtotal} />
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-paragraph-sm text-text-muted">
                      Additional discount
                    </span>
                    <span className="flex h-8 items-center overflow-hidden rounded-lg shadow-button-gray">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={addlDiscount === 0 ? '0.00' : addlDiscount}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          setAddlDiscount(Number.isFinite(v) ? v : 0)
                        }}
                        className="w-14 bg-background-base px-2 text-right text-paragraph-sm outline-none focus:bg-background-highlight"
                        aria-label="Additional discount"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAddlDiscountUnit((u) => (u === '%' ? '$' : '%'))
                        }
                        className="flex h-full items-center border-l border-border-highlight bg-background-base px-2 text-paragraph-sm text-text-muted hover:text-text-primary"
                        aria-label="Toggle discount unit"
                      >
                        {addlDiscountUnit}
                      </button>
                    </span>
                    <span className="mx-1 min-w-6 flex-1 self-center border-b border-dotted border-border-muted" />
                    <span className="text-paragraph-sm text-text-primary">
                      {money.format(totals.extra)}
                    </span>
                  </div>
                  <TotalRow label="Tax amount" value={totals.tax} />
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="shrink-0 text-label-md text-text-primary">
                      Net amount
                    </span>
                    <span className="flex-1" />
                    <span className="text-label-md text-text-primary">
                      {money.format(totals.net)}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </PageBody>
          <PageFooter className="justify-between">
            <Button
              variant="outline"
              className="text-text-error-base shadow-[0px_0px_0px_1px_var(--border-error-base)] hover:bg-background-error-highlight"
            >
              <span className="px-1">Cancel</span>
            </Button>
            <Button>
              <span className="px-1">Submit</span>
            </Button>
          </PageFooter>
        </PageLayout>
      </MainLayout>
    </AppShell>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-paragraph-sm text-text-muted">{label}</span>
      <span className="mx-1 min-w-6 flex-1 self-center border-b border-dotted border-border-muted" />
      <span className="text-paragraph-sm text-text-primary">
        {money.format(value)}
      </span>
    </div>
  )
}
