import { Warning } from '@phosphor-icons/react'
import { AppBar } from '@/components/nds/app-bar'
import { AppShell } from '@/components/nds/layouts'

/**
 * Not a screen - a decision list. Ported verbatim from the source
 * workbench's "Decisions needed first" group: 13 items its own checklist
 * flagged as blocking high-fidelity design, kept visible here rather than
 * silently resolved, per the call to mirror the workbench's defaults
 * everywhere *except* where a decision was never actually made.
 */

const DECISIONS: Array<{ title: string; note?: string }> = [
  { title: 'Token scale - ~100 tokens per payroll run, or ~10,000?', note: 'The huge-numbers preset shows 234k; the PRD resolved to a 1,240-scale.' },
  { title: 'Volume discount math - pre or post discount?' },
  { title: 'Maximum single purchase - is $400 a real cap?' },
  { title: 'P0-6 was deleted but P0-14 references it three times' },
  { title: 'Credit auto-applied (v1) or user-selected (P1-4)?' },
  { title: 'Three-source manual split is unspecified' },
  { title: 'Pending-purchase model for settlement' },
  { title: 'Wire reference code - who generates and matches it?' },
  {
    title: 'Niural fee has no product surface - where does credit-to-fee application appear?',
    note: 'Sales and finance handle the fee off-platform today, so there is no read model for it.',
  },
  { title: 'Is any billing or subscription surface planned at all?', note: 'If not, invoices never exist and credit is effectively token fuel.' },
  { title: 'Does credit expire in v1?' },
  { title: 'Who owns resuming a task after a block?' },
  { title: 'Success metric targets still blank' },
]

export function DecisionsNeededScreen() {
  return (
    <AppShell>
      <AppBar activeItem="Payments" />
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto bg-surface-2 p-10">
        <div className="w-full max-w-[640px] rounded-2xl bg-background-base p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Warning weight="fill" className="size-5 text-text-warning-base" />
            <h1 className="text-label-md text-text-primary">Decisions needed before this can be designed</h1>
          </div>
          <p className="mt-2 text-paragraph-sm text-text-muted">
            These 13 items block high-fidelity design work, not just this prototype - each is a real product call
            nobody has made yet, ported as-is from the design workbench's own checklist rather than resolved here.
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {DECISIONS.map((d) => (
              <li key={d.title} className="rounded-lg bg-background-warning-highlight p-3">
                <p className="text-paragraph-sm text-text-primary">{d.title}</p>
                {d.note && <p className="mt-1 text-paragraph-xs text-text-warning-base">{d.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
