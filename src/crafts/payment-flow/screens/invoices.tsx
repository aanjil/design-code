import { useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  DotsSixVertical,
  Eye,
  Plus,
  Receipt,
  SortAscending,
  ArrowsDownUp,
  Trash,
  User,
  X,
} from '@phosphor-icons/react'
import { usePayment } from '../app'
import { invoiceTotal } from '../engine'
import { Money, StatusPill } from '../ui'
import { SearchField } from '@/components/nds/controls'
import { Button, Checkbox, Tabs } from '@niural/components'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { daysFromToday, fmt } from '@/mocks/payment-flow'
import type { Ccy, Invoice, InvoiceStatus } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'
import { Export as ExportIcon, Wallet as WalletIcon } from '@phosphor-icons/react'
import { useReportSelection } from '@/crafts/bezel/selection'
import { invoiceRow, invoicesAnswer, invoicesSummary } from '@/mocks/bezel-selections'

/**
 * Payments > Invoices. Contracts / Niural fees tabs, search + currency
 * filter, row Pay link, and the floating bulk bar ("Pay N invoices").
 * Paid invoices stay in the list as Processing / Awaiting transfer.
 */

const STATUS: Record<InvoiceStatus, { label: string; dot: string }> = {
  pending: { label: 'Payment pending', dot: 'bg-warning' },
  processing: { label: 'Processing', dot: 'bg-info' },
  'awaiting-transfer': { label: 'Awaiting transfer', dot: 'bg-brand' },
  paid: { label: 'Paid', dot: 'bg-success' },
}

const COLS = 'grid-cols-[44px_44px_150px_minmax(180px,1.1fr)_minmax(200px,1.4fr)_170px_150px_56px_44px]'

export function InvoicesScreen() {
  const { ui, set, data, startPayment } = usePayment()
  const [query, setQuery] = useState('')
  const [ccyFilter, setCcyFilter] = useState<Array<Ccy>>([])

  // paid invoices move to Invoice history
  const tabRows = data.invoices.filter((i) => i.tab === ui.tab && i.status !== 'paid')
  const currencies = useMemo(() => [...new Set(tabRows.map((i) => i.ccy))].sort(), [tabRows])
  const rows = tabRows
    .filter((i) => !ccyFilter.length || ccyFilter.includes(i.ccy))
    .filter((i) => {
      const s = query.trim().toLowerCase()
      return !s || `${i.name} ${i.person ?? ''} ${i.description} ${i.ccy}`.toLowerCase().includes(s)
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const payable = rows.filter((r) => r.status === 'pending')
  const selectedRows = data.invoices.filter((i) => ui.selected.includes(i.id) && i.status === 'pending')
  const allOn = payable.length > 0 && payable.every((r) => ui.selected.includes(r.id))
  const toggle = (id: string) =>
    set((p) => ({ selected: p.selected.includes(id) ? p.selected.filter((x) => x !== id) : [...p.selected, id] }))

  // Inside the Master App the Bezel IS the bulk bar (Bezel doc: "not a
  // second floating toolbar") - Pay hands off to this page's real flow.
  const payIds = selectedRows.map((r) => r.id)
  const bezelHosted = useReportSelection(
    selectedRows.length
      ? {
          key: `invoices:${payIds.join(',')}`,
          noun: 'invoice',
          rows: selectedRows.map((i) => invoiceRow(i, data.today)),
          ...invoicesSummary(selectedRows, data.today),
          actions: [
            { label: `Pay ${selectedRows.length}`, icon: <WalletIcon className="size-3.5" />, onSelect: () => startPayment(payIds) },
            { label: 'Export', icon: <ExportIcon className="size-3.5" />, onSelect: () => `Exported ${selectedRows.length} invoices` },
          ],
          answer: () => invoicesAnswer(selectedRows, { today: data.today, wallets: data.wallets }, () => startPayment(payIds)),
          clear: () => set({ selected: [] }),
          remove: (id) => set((p) => ({ selected: p.selected.filter((x) => x !== id) })),
        }
      : null,
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* header */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-label-large text-primary">Invoices</h1>
          
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" shade="primary">Bulk invoice history</Button>
          <Button type="button" leftIcon={<Plus className="size-4" />}>
            Upload bulk invoice
          </Button>
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-col w-full shrink-0  gap-3 px-4 pb-3">
        <Tabs
            variant="pill"
            shade='brand'
            tabs={[
              { label: 'Contracts', value: 'contracts' },
              { label: 'Niural fees', value: 'fees' },
            ]}
            value={ui.tab}
            onChange={(v) => {
              setCcyFilter([])
              set({ tab: v as typeof ui.tab })
            }}
          />
          <div className="flex items-center justify-between gap-3">

          
        <div className="flex items-center gap-2">
          <SearchField value={query} onChange={setQuery} placeholder="Search" />
          <button type="button" aria-label="Refresh" className="flex size-9 items-center justify-center rounded-control bg-base text-primary borders-base hover:bg-highlight">
            <ArrowsClockwise className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <FakeFilter label="Due date" />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-control bg-base px-3 text-label-small borders-base hover:bg-highlight',
                ccyFilter.length ? 'text-brand' : 'text-primary',
              )}
            >
              Currency{ccyFilter.length ? ` · ${ccyFilter.length}` : ''}
              <CaretDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Invoice currency</DropdownMenuLabel>
                {currencies.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={ccyFilter.includes(c)}
                    onCheckedChange={(on) => setCcyFilter((p) => (on ? [...p, c] : p.filter((x) => x !== c)))}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <FakeFilter label={ui.tab === 'contracts' ? 'Contract type' : 'Invoice type'} />
        </div>
        </div>
      </div>

      {/* table */}
      <div className="min-h-0 flex-1 overflow-auto border-t border-base">
        <div className={cn('sticky top-0 z-10 grid h-11 items-center border-b border-base bg-highlight text-label-small text-primary', COLS)}>
          <span className="flex justify-center text-muted"><CaretDoubleRight className="size-4" /></span>
          <span className="flex justify-center">
            <Checkbox
              size="md"
              checked={allOn}
              onCheckedChange={(on) => set({ selected: on ? payable.map((r) => r.id) : [] })}
              aria-label="Select all payable invoices"
            />
          </span>
          <span className="flex items-center gap-1 px-3">Due date <SortAscending className="size-4 text-muted" /></span>
          <span className="px-3">Name</span>
          <span className="px-3">Description</span>
          <span className="px-3">Status</span>
          <span className="flex items-center justify-end gap-1 px-3">Amount <ArrowsDownUp className="size-4 text-muted" /></span>
          <span />
          <span />
        </div>
        {rows.map((inv) => (
          <Row key={inv.id} inv={inv} today={data.today} checked={ui.selected.includes(inv.id)} onToggle={() => toggle(inv.id)} onPay={() => startPayment([inv.id])} />
        ))}
        {rows.length === 0 && (
          <div className="flex h-table-empty flex-col items-center justify-center gap-1 text-center">
            <p className="text-label-medium text-primary">{tabRows.length ? 'No invoices match your filters' : "You're all caught up"}</p>
            <p className="text-paragraph-small text-muted">{tabRows.length ? 'Try a different search or currency.' : 'New invoices show up here when they are due.'}</p>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex h-16 shrink-0 items-center justify-between border-t border-base px-4">
        <span className="text-paragraph-small text-muted">
          {selectedRows.length ? `${selectedRows.length} of ${payable.length} records selected` : `${rows.length} records`}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-paragraph-small text-muted">Records per page</span>
          <span className="flex h-9 w-24 items-center justify-between rounded-control bg-base px-3 text-paragraph-small borders-base">
            100 <CaretDown className="size-3.5 text-muted" />
          </span>
          <span className="text-paragraph-small text-primary">Page 1 of 1</span>
          <div className="flex items-center gap-1">
            {[CaretDoubleLeft, CaretLeft, CaretRight, CaretDoubleRight].map((I, i) => (
              <span key={i} className="flex size-9 items-center justify-center rounded-full text-disabled buttons-neutral">
                <I className="size-4" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {selectedRows.length > 0 && !bezelHosted && (
        <BulkBar
          count={selectedRows.length}
          onClear={() => set({ selected: [] })}
          onPay={() => startPayment(selectedRows.map((r) => r.id))}
        />
      )}
    </div>
  )
}

function Row({ inv, today, checked, onToggle, onPay }: { inv: Invoice; today: string; checked: boolean; onToggle: () => void; onPay: () => void }) {
  const days = daysFromToday(inv.dueDate, today)
  const st = STATUS[inv.status]
  const pending = inv.status === 'pending'
  return (
    <div
      data-bezel-row={inv.id}
      className={cn(
        'grid min-h-[68px] items-center border-b border-base text-paragraph-small text-primary transition-colors hover:bg-highlight',
        COLS,
        checked && 'bg-brand-base hover:bg-brand-base',
      )}
    >
      <span className="flex justify-center text-muted"><CaretRight className="size-4" /></span>
      <span className="flex justify-center">
        <Checkbox size="md" checked={checked} disabled={!pending} onCheckedChange={onToggle} aria-label={`Select ${inv.name}`} />
      </span>
      <span className="px-3">
        <Money className="block text-label-small">{inv.dueDate}</Money>
        {pending && days < 0 && <span className="block text-caption-sm text-error">{days} days</span>}
        {pending && days >= 0 && <span className="block text-caption-sm text-muted">in {days} days</span>}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 px-3">
        {inv.tab === 'contracts' || inv.kind === 'cm-fee' ? (
          <User className="size-4 shrink-0 text-muted" />
        ) : (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand text-on-color">
            <Receipt weight="fill" className="size-2.5" />
          </span>
        )}
        <span className="truncate text-label-small">{inv.person ?? inv.name}</span>
      </span>
      <span className="truncate px-3 text-muted">{inv.description}</span>
      <span className="px-3"><StatusPill dotClassName={st.dot}>{st.label}</StatusPill></span>
      <span className="px-3 text-right"><Money className="text-label-small">{fmt(invoiceTotal(inv), inv.ccy)}</Money></span>
      <span className="flex justify-center">
        {pending && (
          <button type="button" onClick={onPay} className="text-label-small text-brand hover:underline">
            Pay
          </button>
        )}
      </span>
      <span className="flex justify-center text-muted"><Eye className="size-4" /></span>
    </div>
  )
}

function FakeFilter({ label }: { label: string }) {
  return (
    <button type="button" className="flex h-9 items-center gap-1.5 rounded-control bg-base px-3 text-label-small text-primary borders-base hover:bg-highlight">
      {label}
      <CaretDown className="size-3.5" />
    </button>
  )
}

function BulkBar({ count, onClear, onPay }: { count: number; onClear: () => void; onPay: () => void }) {
  const noun = count === 1 ? 'invoice' : 'invoices'
  return (
    <div className="absolute bottom-20 left-1/2 z-20 w-[440px] -translate-x-1/2 overflow-hidden rounded-2xl bg-base flyout">
      <div className="flex items-center gap-2 border-b border-base px-3 py-2.5">
        <DotsSixVertical className="size-4 text-muted" />
        <span className="flex-1 text-label-medium text-primary">{count} selected</span>
        <button type="button" aria-label="Clear selection" onClick={onClear} className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-highlight">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3">
        <Button type="button" variant="solid" shade="neutral" width="full" leftIcon={<Receipt className="size-4 text-brand" />} onClick={onPay} className="h-10">
          Pay {count} {noun}
        </Button>
        <Button type="button" variant="ghost" shade="error" width="full" leftIcon={<Trash className="size-4" />} disabled className="h-10 borders-base">
          Delete {count} {noun}
        </Button>
      </div>
    </div>
  )
}
