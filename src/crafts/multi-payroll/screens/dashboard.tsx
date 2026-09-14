import { useMemo, useState } from 'react'
import {
  Archive,
  ArrowCounterClockwise,
  CalendarCheck,
  DotsThreeVertical,
  Eye,
  NotePencil,
  Plus,
  Sparkle,
  Trash,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import type { DashboardModal, DashboardView } from '../types'
import { AvatarStack, Banner, EmmaCard, FreqTag, KV, ModalShell } from '../ui'
import type { AiSuggestedSchedule } from '../engine'
import {
  RULE_ATTRIBUTE_LABELS,
  WORLD_TODAY,
  describeRule,
  fmtHuman,
  periodOf,
  suggestSchedules,
  weekdayName,
} from '../engine'
import type { PaySchedule } from '@/mocks/payroll'
import { ARCHIVED_SCHEDULE, SCHEDULES, scheduleFor } from '@/mocks/payroll'
import { employees } from '@/mocks/employees'
import { useExplorer } from '@/components/playground/explorer'
import { PageBody, PageHeader } from '@/components/nds/layouts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * C group: schedules dashboard - cards, ⋯ menu, archive/delete modals,
 * archived section with reactivate. `vision: 'full'` layers the beyond-v1
 * pieces on top of the v1 scope. Card layout matches Figma 190:3475 -
 * full-width stacked cards, avatar stack + payday pill in the header row,
 * a 3x2 body grid. Edit details/rule now reopen the create wizard in edit
 * mode (see screens/wizard.tsx's `editSchedule`) instead of a bespoke
 * modal - one flow, not two.
 */

function V2Chip() {
  return (
    <span className="rounded bg-brand-muted px-1 text-caption-md text-brand-text">v2</span>
  )
}

/** Real members of a schedule - same priority resolution `memberCount` was
 *  derived from, so the avatar stack never shows someone who isn't real. */
function membersOf(schedule: PaySchedule) {
  return employees.filter((e) => scheduleFor(e).id === schedule.id)
}

function CardStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-caption-md text-text-muted">{label}</p>
      <p className="mt-0.5 truncate text-paragraph-xs text-text-primary">{value}</p>
    </div>
  )
}

function TabBar({ tab, onChange }: { tab: 'active' | 'archived'; onChange: (t: 'active' | 'archived') => void }) {
  return (
    <div className="flex h-9 w-fit items-center rounded-lg bg-background-highlight p-1">
      {(
        [
          { id: 'active', label: 'Active schedules', icon: undefined },
          { id: 'archived', label: 'Archived', icon: Archive },
        ] as const
      ).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-md px-3 text-label-xs transition-colors',
            tab === t.id ? 'bg-background-base text-text-primary shadow-button-gray' : 'text-text-muted',
          )}
        >
          {t.icon && <t.icon className="size-3.5" />}
          {t.label}
        </button>
      ))}
    </div>
  )
}

function ScheduleCard({
  schedule,
  vision,
  menuOpen,
}: {
  schedule: PaySchedule
  vision: 'v1' | 'full'
  menuOpen?: boolean
}) {
  const [open, setOpen] = useState(!!menuOpen)
  const { show } = useExplorer()
  const members = membersOf(schedule)
  const period = periodOf(schedule.frequency, WORLD_TODAY)
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-background-base p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="truncate text-label-sm text-text-primary">{schedule.name}</p>
          {schedule.isDefault && <span className="shrink-0 text-label-xs text-brand-text">Default · everyone else</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AvatarStack names={members.map((e) => e.name)} max={3} />
          <span className="text-label-xs text-text-primary">{schedule.memberCount} people</span>
          <FreqTag>{schedule.payDayRule}</FreqTag>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" className="text-text-muted" />}
              aria-label={`Actions for ${schedule.name}`}
            >
              <DotsThreeVertical weight="bold" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => show('C8', undefined, { scheduleId: schedule.id })}>
                <Eye />
                View details
              </DropdownMenuItem>
              {!schedule.isDefault && (
                <>
                  <DropdownMenuItem onClick={() => show('B1', undefined, { editScheduleId: schedule.id })}>
                    <NotePencil />
                    Edit details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => show('B2', undefined, { editScheduleId: schedule.id })}>
                    <UsersThree />
                    Edit rule
                  </DropdownMenuItem>
                </>
              )}
              {vision === 'full' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => show('C6')}>
                    <Archive />
                    <span className="min-w-0 flex-1">Archive</span>
                    <V2Chip />
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => show('C7')}>
                    <Trash />
                    <span className="min-w-0 flex-1">Delete</span>
                    <V2Chip />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <CardStat label="Members join by" value={describeRule(schedule.rule)} />
        <CardStat label="Pay frequency" value={schedule.frequency} />
        <CardStat label="Current pay period" value={`${fmtHuman(period.start)} – ${fmtHuman(period.end)}`} />
        <CardStat label="Next payday" value={fmtHuman(schedule.nextPayday)} />
        <CardStat label="Pay day" value={weekdayName(schedule.nextPayday)} />
        <CardStat label="Work week start day" value={schedule.workWeekStartDay} />
      </div>
    </div>
  )
}

/* ---------------- AI-suggested starter schedules (A1 empty-state alt) ---------------- */

/** Attributes from the PRD's fuller list that aren't tracked on the
 *  Employee record yet - named honestly as "connect these for a sharper
 *  split" rather than fabricated into the computed suggestions below. */
const AI_SIGNALS_NOT_CONNECTED = [
  'overtime status (exempt/non-exempt)',
  'team & department',
  'manager / reports-to',
  'cost center',
  'start date (e.g. "hired before 2024")',
]

function joinWithAnd(items: Array<string>): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function SuggestedScheduleCard({
  suggestion,
  onCustomize,
}: {
  suggestion: AiSuggestedSchedule
  onCustomize?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border-base bg-background-base p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <div className="flex items-baseline gap-2">
          <p className="text-label-sm text-text-primary">{suggestion.name}</p>
          <span className="shrink-0 rounded bg-brand-muted px-1 text-caption-md text-brand-text">
            Suggested
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AvatarStack names={suggestion.matched.map((e) => e.name)} max={3} />
          <span className="text-label-xs text-text-primary">{suggestion.matched.length} people</span>
          <FreqTag>{suggestion.frequency}</FreqTag>
        </div>
      </div>
      <p className="text-paragraph-xs text-text-muted">{describeRule(suggestion.rule)}</p>
      {suggestion.complianceNote && (
        <Banner tone="info" title="Frequency adjusted for compliance">
          {suggestion.complianceNote}
        </Banner>
      )}
      {onCustomize && (
        <div>
          <Button variant="secondary" size="sm" onClick={onCustomize}>
            <NotePencil />
            <span className="px-1">Customize before creating</span>
          </Button>
        </div>
      )}
    </div>
  )
}

function AiSuggestPanel() {
  const { show } = useExplorer()
  const suggestions = useMemo(() => suggestSchedules(employees), [])
  const signals = useMemo(() => {
    const set = new Set<string>()
    for (const s of suggestions) {
      if (!s.rule) continue
      for (const c of s.rule.and) set.add(RULE_ATTRIBUTE_LABELS[c.attribute].toLowerCase())
    }
    return [...set]
  }, [suggestions])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 py-6">
      <EmmaCard
        title="Suggested pay schedules"
        actions={
          <>
            <Button size="sm" onClick={() => show('C1', undefined, { acceptAiSuggestions: true })}>
              <span className="px-1">Create all {suggestions.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => show('A1', undefined, { empty: true, aiSuggest: false })}
            >
              <span className="px-1">Start from scratch instead</span>
            </Button>
          </>
        }
      >
        I looked at all {employees.length} employees' {joinWithAnd(signals)} and grouped them into{' '}
        {suggestions.length} schedules that keep everyone paid on a compliant cadence from day one. Review
        each one below, customize anything before creating, or accept the whole set.
      </EmmaCard>

      <div className="flex flex-col gap-3">
        {suggestions.map((s) => (
          <SuggestedScheduleCard
            key={s.name}
            suggestion={s}
            onCustomize={
              s.rule
                ? () =>
                    show('B1', undefined, {
                      initialRule: s.rule,
                      initialFrequency: s.frequency,
                      initialName: s.name,
                    })
                : undefined
            }
          />
        ))}
      </div>

      <Banner tone="info" title="Want an even sharper split?">
        Connect {joinWithAnd(AI_SIGNALS_NOT_CONNECTED)} and I can propose finer-grained groups next time.
      </Banner>
    </div>
  )
}

/* ---------------- AI Copilot panel (Ask Emma trigger, second variation) ---------------- */

/** Bouncing-dots "thinking" moment before Emma's suggestions render - the
 *  Live App holds this stage for ~900ms (see live-app.tsx); the catalog
 *  reviews it as its own frozen state instead of a timed transition. */
function CopilotThinking() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex items-center gap-1.5">
        <span className="size-2 animate-bounce rounded-full bg-brand-primary [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-brand-primary [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-brand-primary" />
      </div>
      <p className="max-w-56 text-paragraph-xs text-text-muted">
        Looking at work location, employee type, and compensation type across all {employees.length}{' '}
        employees…
      </p>
    </div>
  )
}

function CopilotSuggestions({
  suggestions,
  canBulkCreate,
}: {
  suggestions: Array<AiSuggestedSchedule>
  canBulkCreate: boolean
}) {
  const { show } = useExplorer()
  return (
    <div className="flex flex-col gap-3">
      <p className="text-paragraph-xs text-text-primary">
        I grouped everyone into {suggestions.length} schedules that keep pay compliant with state law from day
        one.{' '}
        {canBulkCreate
          ? 'Review each, then accept the ones you want - or customize one first.'
          : "You've already got schedules set up, so here's how I'd still group everyone - customize any of these into a new schedule."}
      </p>
      {suggestions.map((s, i) => (
        <div
          key={s.name}
          className="fill-mode-both animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <SuggestedScheduleCard
            suggestion={s}
            onCustomize={
              s.rule
                ? () =>
                    show('B1', undefined, {
                      initialRule: s.rule,
                      initialFrequency: s.frequency,
                      initialName: s.name,
                    })
                : undefined
            }
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Second variation of the same idea as AiSuggestPanel above: instead of
 * swapping the page body, Emma lives behind the AppBar's "Ask Emma" trigger
 * and slides in as a right-side panel - non-portal (same reasoning as
 * ModalShell in ui.tsx: a real Base UI Dialog portals to document.body,
 * which escapes the canvas window's scale/snapshot transform in catalog
 * mode). `stage` drives a bouncing "thinking" moment before the same real
 * suggestions stagger into view.
 */
function CopilotPanel({
  stage,
  onClose,
  canBulkCreate,
}: {
  stage: 'thinking' | 'suggestions'
  onClose: () => void
  /** False once schedules already exist - bulk-accepting all 5 would
   *  collide with real ids (sch-default, sch-ai-*), so only the per-card
   *  "Customize before creating" path (a genuine single new-schedule
   *  create) stays available then. */
  canBulkCreate: boolean
}) {
  const { show } = useExplorer()
  const suggestions = useMemo(() => suggestSchedules(employees), [])

  return (
    <div
      className="absolute inset-0 z-40 flex justify-end bg-overlay-background-base backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="animate-in flex h-full w-full max-w-[420px] flex-col bg-background-base shadow-flyout slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border-highlight px-4 py-3.5">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              stage === 'thinking' && 'animate-emma-glow',
            )}
            style={{ backgroundImage: 'linear-gradient(119.6deg, #714dff 30.8%, #e151ff 122.6%)' }}
          >
            <Sparkle weight="fill" className="size-4 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-label-sm text-text-primary">Emma</p>
            <p className="text-caption-md text-text-muted">Pay schedule copilot</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {stage === 'thinking' ? (
            <CopilotThinking />
          ) : (
            <CopilotSuggestions suggestions={suggestions} canBulkCreate={canBulkCreate} />
          )}
        </div>
        {stage === 'suggestions' && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border-highlight px-4 py-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <span className="px-1">{canBulkCreate ? 'Not now' : 'Close'}</span>
            </Button>
            {canBulkCreate && (
              <Button size="sm" onClick={() => show('C1', undefined, { acceptAiSuggestions: true })}>
                <span className="px-1">Create all {suggestions.length}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- modals ---------------- */

function ArchiveBlockedModal({ schedule, onClose }: { schedule?: PaySchedule; onClose: () => void }) {
  const { show } = useExplorer()
  return (
    <ModalShell
      title={`Can't archive ${schedule?.name ?? 'this schedule'}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button onClick={() => show('C8', undefined, { scheduleId: schedule?.id })}>
            <span className="px-1">Move employees</span>
          </Button>
        </>
      }
    >
      <Banner tone="error" title={`${schedule?.memberCount ?? 0} members still on this schedule`}>
        Everyone needs a destination schedule first - archiving never leaves an
        employee unpaid.
      </Banner>
    </ModalShell>
  )
}

function ArchiveConfirmModal({ onClose }: { onClose: () => void }) {
  const { show } = useExplorer()
  const [ack, setAck] = useState(false)
  return (
    <ModalShell
      title="Archive Hourly Ops?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button
            variant="destructive"
            disabled={!ack}
            onClick={() => show('C9', 'archived')}
          >
            <span className="px-1">Archive schedule</span>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Banner tone="warning" title="This schedule has run history">
          Archiving removes it from new runs and rules. Past runs, payslips and
          reports stay viewable.
        </Banner>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-background-highlight p-2.5">
          <Checkbox
            checked={ack}
            onCheckedChange={(v) => setAck(v === true)}
            aria-label="Acknowledge archive"
          />
          <span className="text-paragraph-xs text-text-primary">
            I understand no future runs will use this schedule.
          </span>
        </label>
      </div>
    </ModalShell>
  )
}

function DeleteBlockedModal({ onClose }: { onClose: () => void }) {
  const { show } = useExplorer()
  return (
    <ModalShell
      title="Can't delete Hourly Ops"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button onClick={() => show('C6')}>
            <Archive />
            <span className="px-1">Archive instead</span>
          </Button>
        </>
      }
    >
      <Banner tone="error" title="Schedules with history or members can't be deleted">
        Deleting would orphan payslips and reports. Archiving keeps history
        queryable while removing the schedule from daily use.
      </Banner>
    </ModalShell>
  )
}

function ReactivateModal({ onClose }: { onClose: () => void }) {
  const { show } = useExplorer()
  return (
    <ModalShell
      title="Reactivate Legacy Semi-monthly?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <span className="px-1">Cancel</span>
          </Button>
          <Button onClick={() => show('C1', 'full')}>
            <span className="px-1">Reactivate</span>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Banner tone="info" title="Comes back empty">
          Members were moved when it was archived. Reactivating restores the
          schedule and its rules - people rejoin only if rules match.
        </Banner>
        <div>
          <KV label="Frequency">Semi-monthly</KV>
          <KV label="Pay day">15th and last day of the month</KV>
          <KV label="History">14 completed runs</KV>
        </div>
      </div>
    </ModalShell>
  )
}

const MODALS: Record<
  DashboardModal,
  (props: { onClose: () => void; schedule?: PaySchedule }) => React.ReactNode
> = {
  'archive-blocked': (p) => <ArchiveBlockedModal {...p} />,
  'archive-confirm': (p) => <ArchiveConfirmModal {...p} />,
  'delete-blocked': (p) => <DeleteBlockedModal {...p} />,
  reactivate: (p) => <ReactivateModal {...p} />,
}

/* ---------------- screen ---------------- */

export function DashboardScreen({ view }: { view: DashboardView }) {
  const { show } = useExplorer()
  // Derived from `view`, not local state: the Live App keeps this screen
  // mounted while archive/delete modals open on top of it (no per-state
  // remount like the catalog frames get), so the open modal must react to
  // prop changes.
  const modal = view.modal ?? null
  const tab = view.tab ?? 'active'
  const schedules = view.schedules ?? SCHEDULES

  return (
    <>
      <PageHeader
        title="Payroll Schedule"
        subtitle={`${schedules.length} schedules · ${employees.length} employees · everyone is covered`}
        actions={
          <Button onClick={() => show('B1')}>
            <Plus />
            <span className="px-1">New pay schedule</span>
          </Button>
        }
      />
      <PageBody className="relative bg-surface-1">
        {view.empty ? (
          view.aiSuggest ? (
            <AiSuggestPanel />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <CalendarCheck className="size-6 text-text-disabled" />
              <p className="text-label-sm text-text-primary">No payroll schedules yet</p>
              <p className="max-w-80 text-center text-paragraph-xs text-text-muted">
                A schedule decides who gets paid on which cadence. Start with one
                for everyone - split later as you grow.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button onClick={() => show('A2')}>
                  <Plus />
                  <span className="px-1">Set up your first schedule</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => show('A1', undefined, { empty: true, aiSuggest: true })}
                >
                  <Sparkle className="text-brand-primary" weight="fill" />
                  <span className="px-1">See Emma's suggested setup</span>
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3">
            <TabBar tab={tab} onChange={(t) => show('C1', undefined, { tab: t })} />

            {tab === 'active' ? (
              <div className="flex flex-col gap-3">
                {schedules.map((s) => (
                  <ScheduleCard
                    key={s.id}
                    schedule={s}
                    vision={view.vision}
                    menuOpen={view.menuFor === s.id}
                  />
                ))}
              </div>
            ) : view.vision === 'full' ? (
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border-base p-4 opacity-90">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-label-sm text-text-muted">
                      {ARCHIVED_SCHEDULE.name}
                    </p>
                    <p className="mt-0.5 text-paragraph-xs text-text-disabled">
                      Archived · 14 runs of history
                    </p>
                  </div>
                  <V2Chip />
                </div>
                <div className="flex items-center gap-1.5">
                  <FreqTag>{ARCHIVED_SCHEDULE.frequency}</FreqTag>
                  <FreqTag>
                    <UsersThree className="mr-1 size-3.5 text-text-muted" />0
                  </FreqTag>
                </div>
                <div>
                  <Button variant="secondary" size="sm" onClick={() => show('C9', 'reactivate')}>
                    <ArrowCounterClockwise />
                    <span className="px-1">Reactivate</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-16">
                <Archive className="size-5 text-text-disabled" />
                <p className="text-label-xs text-text-primary">No archived schedules yet</p>
                <p className="max-w-72 text-center text-paragraph-xs text-text-muted">
                  Schedules with run history move here once they're archived instead of deleted.
                </p>
              </div>
            )}
          </div>
        )}
        {modal &&
          MODALS[modal]({ onClose: () => show('C1'), schedule: view.modalSchedule })}
        {view.copilot && (
          <CopilotPanel
            stage={view.copilot}
            canBulkCreate={!!view.empty}
            onClose={() => show('C1', undefined, { copilot: null })}
          />
        )}
      </PageBody>
    </>
  )
}
