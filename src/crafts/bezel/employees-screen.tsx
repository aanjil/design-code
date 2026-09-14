import { useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import type { EmployeeStatus } from '@/mocks/employees'
import { employees, fmtCompensation, fmtHireDate, statusLabels } from '@/mocks/employees'
import {
  PAY_SPREAD,
  PENDING_INVITES,
  PIN_EXIT_CLAIM,
  PIN_EXIT_CONFIDENCE,
  PIN_INVITES_CLAIM,
  PIN_INVITES_CONFIDENCE,
  SHORT_TENURE_EXIT,
  TENSION_CLAIM,
  TENSION_CONFIDENCE,
  TENSION_FACTS,
  TENSION_PROVENANCE,
  VOICE_RESULT,
  describeSelection,
  tensionExits,
} from '@/mocks/bezel'
import { AppBar } from '@/components/nds/app-bar'
import { Sidebar } from '@/components/nds/sidebar'
import { AppShell, MainLayout, PageBody, PageHeader, PageLayout } from '@/components/nds/layouts'
import { SearchField, StatusPill } from '@/components/nds/controls'
import { Checkbox } from '@/components/ui/checkbox'
import type { GrainProps } from '@/components/nds/grain/grain'
import type { PinnedInitiative, ThreadTurn } from '@/components/nds/grain/thread'
import { FloatingBezel, type BezelMode } from './floating-bezel'
import { cn } from '@/lib/utils'

const statusDot: Record<EmployeeStatus, string> = {
  active: 'bg-background-success-base',
  invited: 'bg-background-info-base',
  onboarding: 'bg-background-warning-base',
  offboarded: 'bg-background-emphasis',
}

/**
 * The Employees list, wearing the bezel (bezel.html, ported): one
 * floating object drives everything - proactive findings, row
 * selection, and the copilot thread - instead of a assistant panel
 * bolted on the side. State machine lives here so both the live,
 * fully-interactive window and the frozen per-state catalog windows
 * (see app.tsx) can seed the same screen at a different starting point.
 */
export function EmployeesBezelScreen({
  initialMode = 'quiet',
  initialPins = 0,
  interactive = true,
}: {
  initialMode?: BezelMode
  initialPins?: number
  interactive?: boolean
}) {
  const needsSelection = initialMode === 'bulk' || initialMode === 'context'
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<BezelMode>(initialMode)
  const [pinCount, setPinCount] = useState(initialPins)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(needsSelection ? employees.slice(1, 4).map((e) => e.id) : []),
  )
  const [acting, setActing] = useState<{
    label: string
    grain: GrainProps
    onContinue?: { label: string; to: BezelMode }
  } | null>(() =>
    initialMode === 'acting'
      ? {
          label: `Re-leveled ${PAY_SPREAD.low.name} toward the ${PAY_SPREAD.jobTitle} median`,
          grain: {
            claim: `Re-leveled ${PAY_SPREAD.low.name} toward the ${PAY_SPREAD.jobTitle} median`,
            liveness: { kind: 'stamped', asOf: '14:22' },
            provenance: 'resolved by you · logged against run PR-0621',
          },
          onContinue: { label: 'Continue to payroll run', to: 'run' },
        }
      : null,
  )
  const [preActingMode, setPreActingMode] = useState<BezelMode>('found')
  const [threadTurns, setThreadTurns] = useState<Array<ThreadTurn>>([])
  const [threadTitle, setThreadTitle] = useState('Ask Emma')
  const groundRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => `${e.name} ${e.email} ${e.id}`.toLowerCase().includes(q))
  }, [search])

  const pageRows = filtered.slice(0, 10)
  const selection = useMemo(() => employees.filter((e) => selectedIds.has(e.id)), [selectedIds])

  function toggleRow(id: string) {
    // Compute the next set directly rather than inside setSelectedIds's
    // updater - an updater must stay a pure function of its previous
    // value, and calling setMode from within one is the same anti-pattern
    // useCountdown had (see hooks.ts).
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
    if (next.size > 0 && mode !== 'bulk' && mode !== 'context' && mode !== 'copilot') setMode('bulk')
    if (next.size === 0 && mode === 'bulk') setMode('quiet')
  }

  function clearSelection() {
    setSelectedIds(new Set())
    setMode('quiet')
  }

  function removeFromSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function act(label: string, grain: GrainProps, onContinue?: { label: string; to: BezelMode }) {
    setPreActingMode(mode === 'acting' ? preActingMode : mode)
    setActing({ label, grain, onContinue })
    setMode('acting')
  }

  function undoActing() {
    setMode(preActingMode)
    setActing(null)
  }

  // Frozen catalog windows mount straight into 'copilot' - seed the same
  // thread the live app would build lazily on first open.
  useEffect(() => {
    if (initialMode === 'copilot') openCopilot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCopilot() {
    if (threadTurns.length === 0) {
      setThreadTitle('Why is pay so spread out?')
      setThreadTurns([{ from: 'user', text: 'why is pay so spread out for product designers?' }])
      window.setTimeout(() => {
        setThreadTurns((t) => [
          ...t,
          {
            from: 'emma',
            grain: {
              claim: TENSION_CLAIM,
              confidence: TENSION_CONFIDENCE,
              facts: TENSION_FACTS,
              provenance: TENSION_PROVENANCE,
              risk: true,
              exits: tensionExits((result) =>
                act(
                  result,
                  { claim: result, liveness: { kind: 'stamped', asOf: '14:22' }, provenance: 'resolved by you · logged' },
                  { label: 'Continue to payroll run', to: 'run' },
                ),
              ),
            },
          },
        ])
      }, 520)
    }
    setMode('copilot')
  }

  function sendFollowUp(text: string) {
    setThreadTurns((t) => [...t, { from: 'user', text }])
    window.setTimeout(() => {
      setThreadTurns((t) => [
        ...t,
        {
          from: 'emma',
          text: `Role median lands in the low six figures - most reports are within 12% of it. This pair is the only outlier I found.`,
        },
      ])
    }, 500)
  }

  function sendContext(text: string) {
    const rows = selection
    setThreadTitle('New chat')
    setThreadTurns([{ from: 'user', text: `${text} · with ${rows.length} row${rows.length === 1 ? '' : 's'} attached` }])
    window.setTimeout(() => {
      const summary = describeSelection(rows)
      setThreadTurns((t) => [
        ...t,
        {
          from: 'emma',
          grain: {
            claim: summary.note,
            confidence: 0.76,
            facts: summary.facts,
            provenance: `from the ${rows.length} rows you attached`,
          },
        },
      ])
    }, 550)
    setSelectedIds(new Set())
    setMode('copilot')
  }

  const pins: Array<PinnedInitiative> = []
  if (pinCount >= 1 && SHORT_TENURE_EXIT && PIN_EXIT_CLAIM) {
    pins.push({
      key: 'exit',
      grain: {
        claim: PIN_EXIT_CLAIM,
        confidence: PIN_EXIT_CONFIDENCE,
        provenance: `${SHORT_TENURE_EXIT.tenureDays} days tenure · flagged for HR review`,
        exits: [
          { label: 'Open the record', variant: 'primary', onSelect: () => {} },
          { label: 'Later', variant: 'quiet', onSelect: () => setPinCount((n) => Math.max(0, n - 1)) },
        ],
      },
    })
  }
  if (pinCount >= 2 && PIN_INVITES_CLAIM) {
    pins.push({
      key: 'invites',
      grain: {
        claim: PIN_INVITES_CLAIM,
        confidence: PIN_INVITES_CONFIDENCE,
        facts: PENDING_INVITES.slice(0, 3).map((r) => ({ label: r.e.name, value: `${r.pendingDays}d pending` })),
        exits: [
          {
            label: 'Resend invites',
            variant: 'primary',
            onSelect: () =>
              act(VOICE_RESULT, {
                claim: VOICE_RESULT,
                liveness: { kind: 'stamped', asOf: '14:22' },
                provenance: 'actioned by you · logged',
              }),
          },
          { label: 'Later', variant: 'quiet', onSelect: () => setPinCount((n) => Math.max(0, n - 1)) },
        ],
      },
    })
  }

  const docked = mode === 'copilot'

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <AppShell>
      <AppBar activeItem="People" />
      <MainLayout>
        <Sidebar />
        <PageLayout>
          <PageHeader title="Employees" />
          <PageBody
            className={cn(
              // pb-[92px]: room for the floating bar (54px) + its 14px gap - a
              // bespoke reserve like pb-form-bottom, not a generic spacing pick.
              'relative flex flex-col gap-3 pb-[92px] transition-[padding-right] duration-[460ms] ease-[cubic-bezier(.22,1,.36,1)]',
              docked ? 'pr-[438px]' : 'pr-4',
            )}
          >
            <div className="flex items-center gap-3">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search in employee"
                className="max-w-[290px]"
              />
              {selectedIds.size > 0 && (
                <span className="text-label-sm text-text-muted">{selectedIds.size} selected</span>
              )}
            </div>

            <div className="min-w-0 shadow-card rounded-xl overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-paragraph-sm">
                <thead className="bg-surface-1 sticky top-0 z-10">
                  <tr className="border-b border-border-base">
                    <th className="w-12 px-5 py-2.5" />
                    <th className="px-5 py-2.5 text-left text-label-sm font-[530] text-text-muted">Employee</th>
                    <th className="px-5 py-2.5 text-left text-label-sm font-[530] text-text-muted">Job title</th>
                    <th className="px-5 py-2.5 text-left text-label-sm font-[530] text-text-muted">Status</th>
                    <th className="px-5 py-2.5 text-right text-label-sm font-[530] text-text-muted">Compensation</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex h-table-empty flex-col items-center justify-center">
                          <MagnifyingGlass className="size-6 text-text-disabled" />
                          <p className="mt-6 text-label-sm text-text-primary">No employees match this search</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {pageRows.map((employee) => (
                    <tr
                      key={employee.id}
                      className={cn(
                        'border-b border-border-highlight transition-colors hover:bg-surface-2',
                        selectedIds.has(employee.id) && 'bg-surface-1',
                      )}
                    >
                      <td className="w-12 px-5 py-4">
                        <Checkbox
                          checked={selectedIds.has(employee.id)}
                          onCheckedChange={() => toggleRow(employee.id)}
                          aria-label={`Select ${employee.name}`}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <p className="truncate text-label-sm text-text-primary">{employee.name}</p>
                        <p className="truncate text-paragraph-xs text-text-muted">{employee.email}</p>
                      </td>
                      <td className="px-5 py-4 text-paragraph-sm text-text-primary">{employee.jobTitle}</td>
                      <td className="px-5 py-4">
                        <StatusPill dotClassName={statusDot[employee.status]}>{statusLabels[employee.status]}</StatusPill>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-mono-xs text-text-primary">
                        {fmtCompensation(employee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-label-sm text-text-muted">
                {filtered.length} {filtered.length === 1 ? 'Record' : 'Records'}
              </p>
              <p className="font-mono text-mono-xs text-text-disabled">
                hired {fmtHireDate(pageRows[0]?.hireDate ?? employees[0].hireDate)} and onward
              </p>
            </div>
          </PageBody>
        </PageLayout>
      </MainLayout>
      </AppShell>

      <div ref={groundRef} className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto">
          <FloatingBezel
            containerRef={groundRef}
            mode={mode}
            onModeChange={(next) => {
              if (next === 'copilot') openCopilot()
              else setMode(next)
            }}
            pinned={pins}
            onDismissPins={() => setPinCount(0)}
            selection={selection}
            onClearSelection={clearSelection}
            onRemoveFromSelection={removeFromSelection}
            acting={acting}
            onAct={act}
            onUndoActing={undoActing}
            threadTitle={threadTitle}
            threadTurns={threadTurns}
            onSendFollowUp={sendFollowUp}
            onSendContext={sendContext}
            interactive={interactive}
          />
        </div>
      </div>
    </div>
  )
}
