import { useState } from 'react'
import { MagnifyingGlass, ShieldStar } from '@phosphor-icons/react'
import { useFlowData, useFlowStore } from '../store'
import { Money, StatusPill } from '../ui'
import { Button } from '@/components/ui/button'
import { fmt, fmtDateTime } from '@/mocks/payment-flow'
import type { FundingRequest, FundingStatus } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'

/**
 * Admin panel - wallet funding requests (PRD F3). New Currency column +
 * currency filter; reference is searchable (it's the match key, not the
 * amount). Approve moves the funding amount from Pending to Available in
 * the wallet of the request's currency. In the live canvas this window
 * shares its store with the employer App.
 */

const CCYS = ['All', 'USD', 'CAD', 'GBP', 'EUR'] as const
const STATUSES: Array<FundingStatus | 'all'> = ['pending', 'approved', 'rejected', 'all']
const STATUS_DOT: Record<FundingStatus, string> = {
  pending: 'bg-background-warning-base',
  approved: 'bg-background-success-base',
  rejected: 'bg-background-error-base',
}

const COLS = 'grid-cols-[1.3fr_150px_96px_130px_150px_100px_150px_170px_130px_170px]'

export function AdminScreen({ initialCcy = 'All' }: { initialCcy?: (typeof CCYS)[number] }) {
  const data = useFlowData()
  const store = useFlowStore()
  const [ccy, setCcy] = useState<(typeof CCYS)[number]>(initialCcy)
  const [status, setStatus] = useState<FundingStatus | 'all'>('pending')
  const [q, setQ] = useState('')

  const rows = data.requests
    .filter((r) => ccy === 'All' || r.ccy === ccy)
    .filter((r) => status === 'all' || r.status === status)
    .filter((r) => !q.trim() || `${r.reference} ${r.employer}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-2 text-text-primary">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border-highlight bg-background-base px-5">
        <ShieldStar weight="duotone" className="size-5 text-brand-text" />
        <span className="text-label-md">Niural Admin</span>
        <span className="text-paragraph-sm text-text-muted">· Treasury</span>
        <span className="flex-1" />
        <span className="text-paragraph-xs text-text-muted">ops@niural.com</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="w-50 shrink-0 border-r border-border-highlight bg-background-base p-4">
          {['Employers', 'Wallet funding requests', 'Withdrawals', 'FX settlements', 'Audit log'].map((l) => (
            <p
              key={l}
              className={cn(
                'rounded-lg p-2 text-label-sm',
                l === 'Wallet funding requests' ? 'bg-background-highlight text-brand-text' : 'text-text-primary',
              )}
            >
              {l}
            </p>
          ))}
        </aside>
        <main className="flex min-h-0 flex-1 flex-col p-6">
          <h1 className="text-title-h5">Wallet funding requests</h1>
          <p className="mt-1.5 text-paragraph-sm text-text-muted">Match incoming transfers by reference, then approve to credit the wallet in the request's currency.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Seg value={ccy} options={CCYS} onChange={setCcy} label={(c) => (c === 'All' ? 'All currencies' : c)} />
            <Seg value={status} options={STATUSES} onChange={setStatus} label={(s) => (s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1))} />
            <span className="flex-1" />
            <label className="flex h-9 w-64 items-center gap-1.5 rounded-btn bg-background-base px-3 shadow-button-gray focus-within:shadow-border-focus">
              <MagnifyingGlass className="size-4 text-text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference or employer" className="min-w-0 flex-1 bg-transparent text-paragraph-sm outline-none placeholder:text-text-muted" />
            </label>
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-2xl bg-background-base shadow-card">
            <div className={cn('sticky top-0 grid items-center bg-background-highlight px-2 text-label-sm text-text-muted', COLS)}>
              {['Employer', 'Reference', 'Currency', 'Method', 'Funding amount', 'Fee', 'Total', 'Requested', 'Status', ''].map((h, i) => (
                <span key={i} className={cn('px-3 py-2.5', [4, 5, 6].includes(i) && 'text-right', i === 2 && 'text-brand-text')}>{h}</span>
              ))}
            </div>
            {rows.map((r) => (
              <AdminRow key={r.id} r={r} onApprove={() => store.approve(r.id)} onReject={() => store.reject(r.id)} />
            ))}
            {rows.length === 0 && <p className="p-8 text-center text-paragraph-sm text-text-muted">No requests match these filters.</p>}
          </div>
        </main>
      </div>
    </div>
  )
}

function AdminRow({ r, onApprove, onReject }: { r: FundingRequest; onApprove: () => void; onReject: () => void }) {
  const ours = r.employer === 'Anjil Crafts'
  return (
    <div className={cn('grid items-center border-t border-border-highlight px-2 text-paragraph-sm', COLS, ours && r.status === 'pending' && 'bg-brand-base')}>
      <span className="truncate px-3 py-3 text-label-sm">{r.employer}{r.memo && <span className="block truncate text-paragraph-xs text-text-muted">{r.memo}</span>}</span>
      <span className="px-3 py-3"><Money className="text-mono-xs">{r.reference}</Money></span>
      <span className="px-3 py-3 text-label-sm">{r.ccy}</span>
      <span className="px-3 py-3">{r.method}</span>
      <span className="px-3 py-3 text-right"><Money className="text-mono-xs">{fmt(r.amount, r.ccy)}</Money></span>
      <span className="px-3 py-3 text-right"><Money className="text-mono-xs">{r.fee.toFixed(2)}</Money></span>
      <span className="px-3 py-3 text-right"><Money className="text-mono-xs">{fmt(r.amount + r.fee, r.ccy)}</Money></span>
      <span className="px-3 py-3 text-paragraph-xs text-text-muted">{fmtDateTime(r.createdAt)}</span>
      <span className="px-3 py-3"><StatusPill dotClassName={STATUS_DOT[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</StatusPill></span>
      <span className="flex justify-end gap-1.5 px-3 py-2">
        {r.status === 'pending' && (
          <>
            <Button variant="ghost-destructive" size="sm" onClick={onReject}><span className="px-1">Reject</span></Button>
            <Button size="sm" onClick={onApprove}><span className="px-1">Approve</span></Button>
          </>
        )}
      </span>
    </div>
  )
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: ReadonlyArray<T>; onChange: (v: T) => void; label: (v: T) => string }) {
  return (
    <div className="flex items-center gap-0.5 rounded-btn bg-background-highlight p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn('h-8 rounded-lg px-2.5 text-label-xs transition-colors', value === o ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted hover:text-text-primary')}
        >
          {label(o)}
        </button>
      ))}
    </div>
  )
}
