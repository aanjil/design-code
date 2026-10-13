import { useMemo, useState } from 'react'
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CalendarBlank,
  CaretRight,
  Clock,
  PencilSimple,
  Plus,
  Prohibit,
  Timer,
} from '@phosphor-icons/react'
import { Button, Switch, Tabs } from '@niural/components'
import { FieldLabel, SearchField, TextArea, TextInput, ToolbarIconButton } from '@/components/nds/controls'
import { SelectField } from '@/components/nds/select-field'
import type { WorkSchedule } from '@/mocks/org-settings'
import { Avatar, EmptyTable, Modal, PageTitle, Pagination, RowMenu, SectionTitle, TableCard, Td, Th, usePaging, useToast } from '../ui'
import { newId, useWorld } from '../store'
import { cn } from '@/lib/utils'

type SubPage = 'timesheets' | 'tracker'

const PERMISSIONS: Record<SubPage, { title: string; rows: Array<{ label: string; detail: string; employee: boolean; contractor: boolean }> }> = {
  timesheets: {
    title: 'Timesheets settings',
    rows: [
      { label: 'Submit timesheets', detail: 'Workers log hours per pay period.', employee: true, contractor: true },
      { label: 'Edit after submission', detail: 'Until a manager approves.', employee: true, contractor: false },
      { label: 'Log overtime', detail: 'Hours over the schedule are flagged as overtime.', employee: true, contractor: false },
      { label: 'Require manager approval', detail: 'Unapproved hours are held from payroll.', employee: true, contractor: true },
    ],
  },
  tracker: {
    title: 'Time tracker settings',
    rows: [
      { label: 'Clock in / out', detail: 'Live timer from web and mobile.', employee: true, contractor: true },
      { label: 'Capture location', detail: 'Store a coarse location on clock-in.', employee: false, contractor: false },
      { label: 'Auto clock-out', detail: 'Stop timers left running after 12 hours.', employee: true, contractor: true },
    ],
  },
}

export function TimesheetsPage() {
  const [sub, setSub] = useState<SubPage | null>(null)
  if (sub) return <PermissionsSubPage sub={sub} onBack={() => setSub(null)} />

  return (
    <>
      <PageTitle title="Timesheets" subtitle="Manage your workers' timesheets settings and permissions." divider />

      <div className="space-y-4">
        <LinkCard
          icon={Clock}
          tone="bg-accent-orange-highlight text-text-warning-base"
          title="Timesheets settings"
          description="Create, update and remove permissions for each worker type."
          onClick={() => setSub('timesheets')}
        />
        <LinkCard
          icon={Timer}
          tone="bg-accent-pink-highlight text-text-error-base"
          title="Time tracker settings"
          description="Create, update and remove permissions for each worker type."
          onClick={() => setSub('tracker')}
        />
      </div>

      <div className="my-8 h-px bg-border-highlight" />

      <Schedules />
    </>
  )
}

function LinkCard({
  icon: CardIcon,
  tone,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType
  tone: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-background-base p-4 text-left shadow-card transition-shadow hover:shadow-card-hover"
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tone)}>
        <CardIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-label-md text-text-primary">{title}</span>
        <span className="block text-paragraph-xs text-text-muted">{description}</span>
      </span>
      <CaretRight className="size-4 shrink-0 text-text-muted" />
    </button>
  )
}

function PermissionsSubPage({ sub, onBack }: { sub: SubPage; onBack: () => void }) {
  const toast = useToast()
  const { title, rows } = PERMISSIONS[sub]
  return (
    <>
      <button type="button" onClick={onBack} className="mb-4 text-label-sm text-text-info-base hover:underline">
        ← Timesheets
      </button>
      <PageTitle title={title} subtitle="Turn each permission on or off per worker type. Changes apply from the next pay period." divider />
      <TableCard>
        <thead>
          <tr>
            <Th>Permission</Th>
            <Th width="120px">Employees</Th>
            <Th width="120px">Contractors</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <Td>
                <p className="text-label-sm">{r.label}</p>
                <p className="text-paragraph-xs text-text-muted">{r.detail}</p>
              </Td>
              <Td>
                <Switch isChecked={r.employee} size="small" onChange={(on) => toast(`${r.label} ${on ? 'on' : 'off'} for employees`)} />
              </Td>
              <Td>
                <Switch isChecked={r.contractor} size="small" onChange={(on) => toast(`${r.label} ${on ? 'on' : 'off'} for contractors`)} />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </>
  )
}

function Schedules() {
  const { schedules, setSchedules } = useWorld()
  const toast = useToast()
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<{ schedule?: WorkSchedule } | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return schedules.filter((s) => s.active === (status === 'active') && (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)))
  }, [schedules, status, query])
  const paging = usePaging(rows, 10)

  const setActive = (s: WorkSchedule, active: boolean) => {
    setSchedules((all) => all.map((x) => (x.id === s.id ? { ...x, active } : x)))
    toast(`${s.name} ${active ? 'reactivated' : 'deactivated'}`)
  }

  return (
    <section>
      <SectionTitle title="Work schedules and policies" subtitle="Working hours, overtime and breaks that power accurate timesheets and payroll calculations." />

      <div className="mb-3 flex items-center gap-2">
        <SearchField value={query} onChange={setQuery} showKbd={false} />
        <ToolbarIconButton label="Refresh" onClick={() => toast('Schedules are up to date')}>
          <ArrowClockwise className="size-4" />
        </ToolbarIconButton>
        <div className="flex-1" />
        <Tabs
          className="w-auto shrink-0"
          variant="segmented"
          tabs={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
        />
        <Button variant="ghost" size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setModal({})}>
          New schedule
        </Button>
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th width="22%">Name</Th>
            <Th>Description</Th>
            <Th width="110px">Workday</Th>
            <Th width="110px">Workers</Th>
            <Th width="48px" />
          </tr>
        </thead>
        <tbody>
          {paging.visible.length === 0 ? (
            <EmptyTable
              colSpan={5}
              icon={CalendarBlank}
              title={status === 'active' ? 'No active schedules' : 'No inactive schedules'}
              description="Schedules set expected hours so overtime and breaks are calculated for you."
            />
          ) : (
            paging.visible.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-background-highlight">
                <Td>
                  <p className="text-label-sm">{s.name}</p>
                  <p className="font-mono text-mono-xs text-text-muted">{s.hours}</p>
                </Td>
                <Td>{s.description}</Td>
                <Td>{s.workday}</Td>
                <Td>
                  {s.workers.length === 0 ? (
                    <span className="text-text-muted">—</span>
                  ) : (
                    <span className="flex -space-x-1.5">
                      {s.workers.map((w) => (
                        <span key={w} className="rounded-full ring-2 ring-background-base">
                          <Avatar name={w} />
                        </span>
                      ))}
                    </span>
                  )}
                </Td>
                <Td align="right">
                  <RowMenu
                    label={s.name}
                    actions={
                      s.active
                        ? [
                            { label: 'Edit schedule', icon: PencilSimple, onClick: () => setModal({ schedule: s }) },
                            { label: 'Deactivate', icon: Prohibit, destructive: true, onClick: () => setActive(s, false) },
                          ]
                        : [{ label: 'Reactivate', icon: ArrowCounterClockwise, onClick: () => setActive(s, true) }]
                    }
                  />
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
      <Pagination {...paging.props} />

      {modal && (
        <ScheduleModal
          schedule={modal.schedule}
          onClose={() => setModal(null)}
          onSave={(draft) => {
            if (modal.schedule) {
              const id = modal.schedule.id
              setSchedules((all) => all.map((x) => (x.id === id ? { ...x, ...draft } : x)))
              toast('Schedule updated')
            } else {
              setSchedules((all) => [...all, { id: newId('ws'), ...draft, workers: [], active: true }])
              setStatus('active')
              toast(`${draft.name} created`)
            }
            setModal(null)
          }}
        />
      )}
    </section>
  )
}

function ScheduleModal({
  schedule,
  onClose,
  onSave,
}: {
  schedule?: WorkSchedule
  onClose: () => void
  onSave: (draft: Pick<WorkSchedule, 'name' | 'description' | 'workday' | 'hours'>) => void
}) {
  const [name, setName] = useState(schedule?.name ?? '')
  const [description, setDescription] = useState(schedule?.description ?? '')
  const [workday, setWorkday] = useState<WorkSchedule['workday']>(schedule?.workday ?? 'Fixed')
  const [hours, setHours] = useState(schedule ? parseFloat(schedule.hours) : 40)

  return (
    <Modal
      title={schedule ? 'Edit schedule' : 'New schedule'}
      onClose={onClose}
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!name.trim() || !(hours > 0)} onClick={() => onSave({ name: name.trim(), description: description.trim(), workday, hours: `${hours} h / week` })}>
            {schedule ? 'Save' : 'Create schedule'}
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <FieldLabel htmlFor="ws-name" required>
          Name
        </FieldLabel>
        <TextInput id="ws-name" autoFocus value={name} placeholder="e.g. Night shift" onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel htmlFor="ws-desc">Description</FieldLabel>
        <TextArea id="ws-desc" value={description} placeholder="Days, hours, break rules…" onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel>Workday</FieldLabel>
          <SelectField value={workday} options={['Fixed', 'Flexible', 'Weekly']} onChange={(v) => setWorkday(v as WorkSchedule['workday'])} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="ws-hours">Hours per week</FieldLabel>
          <TextInput id="ws-hours" type="number" min={1} max={80} value={hours} className="font-mono text-mono-sm" onChange={(e) => setHours(Number(e.target.value))} />
        </div>
      </div>
    </Modal>
  )
}
