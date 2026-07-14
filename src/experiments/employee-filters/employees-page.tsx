import { useMemo, useState } from 'react'
import {
  ArrowsCounterClockwise,
  BookmarkSimple,
  BoxArrowDown,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUpDown,
  CircleDashed,
  ClipboardText,
  DotsThreeVertical,
  Export,
  FunnelSimple,
  Globe,
  MagnifyingGlass,
  MapPin,
  UsersThree,
} from '@phosphor-icons/react'
import type { Employee, EmployeeStatus } from '@/mocks/employees'
import {
  COMPENSATION_TYPES,
  EMPLOYEE_TYPES,
  JOB_TITLES,
  WORK_LOCATIONS,
  employees,
  fmtCompensation,
  fmtHireDate,
  statusLabels,
} from '@/mocks/employees'
import { AppBar } from '@/components/nds/app-bar'
import { Sidebar } from '@/components/nds/sidebar'
import {
  AppShell,
  MainLayout,
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/nds/layouts'
import {
  SearchField,
  StatusPill,
  ToolbarDivider,
  ToolbarIconButton,
} from '@/components/nds/controls'
import { FilterMenu } from '@/components/nds/filters/filter-menu'
import { FilterBar } from '@/components/nds/filters/filter-bar'
import type { FilterCondition, FilterFieldDef } from '@/components/nds/filters/types'
import {
  parsePromptToConditions,
  upsertCondition,
} from '@/components/nds/filters/types'
import type { DisplayConfig } from '@/components/nds/display-menu'
import { DisplayMenu } from '@/components/nds/display-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/* ---------- Filter fields (mirror Figma's filter menu) ---------- */

export const EMPLOYEE_FILTER_FIELDS: Array<FilterFieldDef> = [
  {
    id: 'work-location',
    label: 'Work location',
    icon: MapPin,
    options: [...WORK_LOCATIONS],
    synonyms: {
      'remote us': 'Remote — US',
      ' us ': 'Remote — US',
      'remote eu': 'Remote — EU',
      ' eu ': 'Remote — EU',
      'new york': 'New York HQ',
      'sao paulo': 'São Paulo',
    },
  },
  {
    id: 'employee-type',
    label: 'Employee type',
    icon: ClipboardText,
    options: [...EMPLOYEE_TYPES],
    synonyms: {
      'full time': 'Full-time',
      'part time': 'Part-time',
      contractors: 'Contractor',
    },
  },
  {
    id: 'job-title',
    label: 'Job title',
    icon: UsersThree,
    options: [...JOB_TITLES],
    synonyms: {
      engineers: 'Software Engineer',
      engineer: 'Software Engineer',
      designers: 'Product Designer',
      designer: 'Product Designer',
      accountants: 'Accountant',
      'account executives': 'Account Executive',
    },
  },
  {
    id: 'compensation-type',
    label: 'Compensation type',
    icon: Globe,
    options: [...COMPENSATION_TYPES],
    synonyms: { salaried: 'Salary', hourly: 'Hourly' },
  },
  {
    id: 'hire-date',
    label: 'Hire date',
    icon: CircleDashed,
    options: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
  },
]

function fieldValue(employee: Employee, fieldId: string): string {
  switch (fieldId) {
    case 'work-location':
      return employee.workLocation
    case 'employee-type':
      return employee.employeeType
    case 'job-title':
      return employee.jobTitle
    case 'compensation-type':
      return employee.compensationType
    case 'hire-date':
      return employee.hireDate.slice(0, 4)
    default:
      return ''
  }
}

/* ---------- Display config ---------- */

const COLUMNS = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Employee' },
  { value: 'jobTitle', label: 'Job title' },
  { value: 'employeeType', label: 'Type' },
  { value: 'workLocation', label: 'Work location' },
  { value: 'hireDate', label: 'Hired on' },
  { value: 'status', label: 'Status' },
  { value: 'compensation', label: 'Compensation' },
]

const GROUP_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'work-location', label: 'Work location' },
  { value: 'employee-type', label: 'Employee type' },
  { value: 'job-title', label: 'Job title' },
]

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'hireDate', label: 'Hire date' },
  { value: 'compensation', label: 'Compensation' },
]

export const DEFAULT_DISPLAY: DisplayConfig = {
  groupBy: 'none',
  sortBy: 'name',
  sortDir: 'asc',
  visibleColumns: COLUMNS.map((c) => c.value),
}

const statusDot: Record<EmployeeStatus, string> = {
  active: 'bg-background-success-base',
  invited: 'bg-background-info-base',
  onboarding: 'bg-background-warning-base',
  offboarded: 'bg-background-emphasis',
}

/* ---------- Page ---------- */

export function EmployeesPage({
  initialConditions = [],
  initialDisplay = DEFAULT_DISPLAY,
}: {
  initialConditions?: Array<FilterCondition>
  initialDisplay?: DisplayConfig
}) {
  const [search, setSearch] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [conditions, setConditions] =
    useState<Array<FilterCondition>>(initialConditions)
  const [display, setDisplay] = useState<DisplayConfig>(initialDisplay)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [savedViews, setSavedViews] = useState<
    Array<{ name: string; conditions: Array<FilterCondition> }>
  >([])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return employees.filter((employee) => {
      if (
        query &&
        !`${employee.name} ${employee.email} ${employee.id}`
          .toLowerCase()
          .includes(query)
      ) {
        return false
      }
      return conditions.every((condition) =>
        condition.values.includes(fieldValue(employee, condition.fieldId)),
      )
    })
  }, [search, conditions])

  const sorted = useMemo(() => {
    const dir = display.sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (display.sortBy === 'compensation') {
        const av = a.compensationType === 'Salary' ? a.compensation : a.compensation * 2080
        const bv = b.compensationType === 'Salary' ? b.compensation : b.compensation * 2080
        return (av - bv) * dir
      }
      if (display.sortBy === 'hireDate') {
        return a.hireDate.localeCompare(b.hireDate) * dir
      }
      return a.name.localeCompare(b.name) * dir
    })
  }, [filtered, display.sortBy, display.sortDir])

  const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const safePage = Math.min(page, pageCount)
  const pageRows = sorted.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  )

  const groups = useMemo(() => {
    if (display.groupBy === 'none') return [{ title: null, rows: pageRows }]
    const map = new Map<string, Array<Employee>>()
    for (const row of pageRows) {
      const key = fieldValue(row, display.groupBy)
      map.set(key, [...(map.get(key) ?? []), row])
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, rows]) => ({ title, rows }))
  }, [pageRows, display.groupBy])

  const visible = new Set(display.visibleColumns)
  const shownColumns = COLUMNS.filter((c) => visible.has(c.value))

  function updateConditions(next: Array<FilterCondition>) {
    setConditions(next)
    setPage(1)
  }

  const upsert = (fieldId: string, values: Array<string>) =>
    updateConditions(upsertCondition(conditions, fieldId, values))
  const remove = (fieldId: string) =>
    updateConditions(conditions.filter((c) => c.fieldId !== fieldId))

  function applyPrompt(prompt: string): number {
    const parsed = parsePromptToConditions(prompt, EMPLOYEE_FILTER_FIELDS)
    if (parsed.length === 0) return 0
    let next = conditions
    for (const condition of parsed) {
      next = upsertCondition(next, condition.fieldId, condition.values)
    }
    updateConditions(next)
    return parsed.length
  }

  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((row) => selected.has(row.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pageRows.forEach((row) => next.delete(row.id))
      else pageRows.forEach((row) => next.add(row.id))
      return next
    })
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <AppShell>
      <AppBar />
      <MainLayout>
        <Sidebar />
        <PageLayout>
          <PageHeader
            title="Employees"
            actions={
              <>
                <Button variant="secondary">
                  <span className="px-1">Bulk upload history</span>
                </Button>
                <Button>
                  <BoxArrowDown />
                  <span className="px-1">Import from ATS</span>
                  <CaretDown />
                </Button>
              </>
            }
          />
          <PageBody className="flex flex-col gap-3">
            {/* Toolbar — a container query, not a media query: windows on the
                canvas resize independent of the viewport. Button labels drop
                below 48rem; search collapses to an icon below 36rem. */}
            <div className="@container/toolbar">
              {searchExpanded ? (
                <div className="flex items-center gap-2">
                  <SearchField
                    value={search}
                    onChange={(value) => {
                      setSearch(value)
                      setPage(1)
                    }}
                    placeholder="Search in employee"
                    className="w-auto flex-1"
                    autoFocus
                    showKbd={false}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setSearchExpanded(false)
                    }}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setSearchExpanded(false)}
                  >
                    <span className="px-1">Cancel</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <SearchField
                      value={search}
                      onChange={(value) => {
                        setSearch(value)
                        setPage(1)
                      }}
                      placeholder="Search in employee"
                      className="@max-xl/toolbar:hidden"
                    />
                    <ToolbarIconButton
                      label="Search"
                      className="relative hidden @max-xl/toolbar:flex"
                      onClick={() => setSearchExpanded(true)}
                    >
                      <MagnifyingGlass className="size-4.5" />
                      {search.trim() !== '' && (
                        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-primary" />
                      )}
                    </ToolbarIconButton>
                    <ToolbarIconButton label="Refresh">
                      <ArrowsCounterClockwise className="size-4.5" />
                    </ToolbarIconButton>
                    {savedViews.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              className="text-text-muted"
                              aria-label={`Views (${savedViews.length})`}
                              title="Views"
                            />
                          }
                        >
                          <BookmarkSimple />
                          <span className="px-1 @max-3xl/toolbar:hidden">
                            Views · {savedViews.length}
                          </span>
                          <span className="hidden h-4 min-w-4 items-center justify-center rounded-full bg-brand-muted px-1 text-caption-md text-brand-text @max-3xl/toolbar:inline-flex">
                            {savedViews.length}
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80 bg-surface-2">
                          {savedViews.map((view, i) => (
                            <DropdownMenuItem
                              key={i}
                              onClick={() => updateConditions(view.conditions)}
                            >
                              <BookmarkSimple className="text-text-muted" />
                              <span className="min-w-0 flex-1 truncate">{view.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <FilterMenu
                      fields={EMPLOYEE_FILTER_FIELDS}
                      conditions={conditions}
                      onUpsert={upsert}
                      onRemove={remove}
                    />
                    <DisplayMenu
                      groupOptions={GROUP_OPTIONS}
                      sortOptions={SORT_OPTIONS}
                      columns={COLUMNS}
                      value={display}
                      defaults={DEFAULT_DISPLAY}
                      onApply={setDisplay}
                    />
                    <ToolbarDivider />
                    <Button variant="secondary" aria-label="Export" title="Export">
                      <Export />
                      <span className="px-1 @max-3xl/toolbar:hidden">Export</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <FilterBar
              fields={EMPLOYEE_FILTER_FIELDS}
              conditions={conditions}
              onUpsert={upsert}
              onRemove={remove}
              onClear={() => updateConditions([])}
              onApplyPrompt={applyPrompt}
              onSaveView={(name) =>
                setSavedViews((views) => [...views, { name, conditions }])
              }
            />

            {/* Table */}
            <div className="min-w-0 shadow-card rounded-xl overflow-x-auto">
              <table className="w-full shadow min-w-[1080px] border-collapse">
                <thead className="bg-surface-1 sticky top-0 z-10">
                  <tr className="border-b border-border-base">
                    <th className="w-14 px-5 py-2.5">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all on page"
                      />
                    </th>
                    {shownColumns.map((column) => (
                      <HeaderCell
                        key={column.value}
                        column={column}
                        display={display}
                        onSort={(sortBy, sortDir) =>
                          setDisplay((d) => ({ ...d, sortBy, sortDir }))
                        }
                      />
                    ))}
                    <th className="w-14" />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <GroupRows
                      key={group.title ?? 'all'}
                      group={group}
                      shownColumns={shownColumns}
                      colSpan={shownColumns.length + 2}
                      selected={selected}
                      onToggleRow={toggleRow}
                    />
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={shownColumns.length + 2}>
                        <div className="flex h-table-empty flex-col items-center justify-center">
                          <FunnelSimple className="size-6 text-text-disabled" />
                          <p className="mt-6 text-label-sm text-text-primary">
                            No employees match these filters
                          </p>
                          <p className="text-paragraph-xs text-text-muted">
                            Try removing a filter, or clear them all.
                          </p>
                          <Button
                            variant="secondary"
                            className="mt-5"
                            onClick={() => updateConditions([])}
                          >
                            <span className="px-1">Clear filters</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination (Figma 9131:12889) */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-label-sm text-text-muted">
                {sorted.length} {sorted.length === 1 ? 'Record' : 'Records'}
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <p className="text-label-sm text-text-muted">Rows per page</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-full bg-background-base pr-3 pl-4 text-label-sm text-text-muted shadow-pagination">
                      {rowsPerPage}
                      <CaretUpDown className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-24 ">
                      {[10, 25, 50].map((n) => (
                        <DropdownMenuItem
                          key={n}
                          onClick={() => {
                            setRowsPerPage(n)
                            setPage(1)
                          }}
                        >
                          {n}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-label-sm text-text-muted">
                    Page {safePage} of {pageCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <PageButton
                      label="First page"
                      disabled={safePage === 1}
                      onClick={() => setPage(1)}
                    >
                      <CaretDoubleLeft className="size-[18px]" />
                    </PageButton>
                    <PageButton
                      label="Previous page"
                      disabled={safePage === 1}
                      onClick={() => setPage(safePage - 1)}
                    >
                      <CaretLeft className="size-[18px]" />
                    </PageButton>
                    <PageButton
                      label="Next page"
                      disabled={safePage === pageCount}
                      onClick={() => setPage(safePage + 1)}
                    >
                      <CaretRight className="size-[18px]" />
                    </PageButton>
                    <PageButton
                      label="Last page"
                      disabled={safePage === pageCount}
                      onClick={() => setPage(pageCount)}
                    >
                      <CaretDoubleRight className="size-[18px]" />
                    </PageButton>
                  </div>
                </div>
              </div>
            </div>
          </PageBody>
        </PageLayout>
      </MainLayout>
    </AppShell>
  )
}

/* ---------- Table pieces ---------- */

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-background-base text-text-primary shadow-pagination transition-colors hover:bg-background-highlight disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}

const SORTABLE = new Set(['name', 'hireDate', 'compensation'])

function HeaderCell({
  column,
  display,
  onSort,
}: {
  column: { value: string; label: string }
  display: DisplayConfig
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void
}) {
  const sortable = SORTABLE.has(column.value)
  const active = display.sortBy === column.value
  return (
    <th
      className={cn(
        'px-5 py-2.5 text-left whitespace-nowrap text-label-sm font-[530] text-text-muted',
        column.value === 'compensation' && 'text-right',
      )}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() =>
            onSort(
              column.value,
              active && display.sortDir === 'asc' ? 'desc' : 'asc',
            )
          }
          className={cn(
            'inline-flex items-center gap-1 transition-colors hover:text-text-primary',
            active && 'text-text-primary',
          )}
        >
          {column.label}
          <CaretUpDown className="size-4" />
        </button>
      ) : (
        column.label
      )}
    </th>
  )
}

function GroupRows({
  group,
  shownColumns,
  colSpan,
  selected,
  onToggleRow,
}: {
  group: { title: string | null; rows: Array<Employee> }
  shownColumns: Array<{ value: string; label: string }>
  colSpan: number
  selected: Set<string>
  onToggleRow: (id: string) => void
}) {
  return (
    <>
      {group.title && (
        <tr className="border-b border-border-highlight bg-surface-1">
          <td colSpan={colSpan} className="px-5 py-1.5">
            <span className="text-caption-md text-text-muted">
              {group.title} · {group.rows.length}
            </span>
          </td>
        </tr>
      )}
      {group.rows.map((employee) => (
        <tr
          key={employee.id}
          className="border-b border-border-highlight transition-colors hover:bg-surface-2"
        >
          <td className="w-14 px-5 py-4">
            <Checkbox
              checked={selected.has(employee.id)}
              onCheckedChange={() => onToggleRow(employee.id)}
              aria-label={`Select ${employee.name}`}
            />
          </td>
          {shownColumns.map((column) => (
            <BodyCell key={column.value} column={column.value} employee={employee} />
          ))}
          <td className="w-14 px-3 py-4 text-right">
            <RowMenu employee={employee} />
          </td>
        </tr>
      ))}
    </>
  )
}

function BodyCell({
  column,
  employee,
}: {
  column: string
  employee: Employee
}) {
  switch (column) {
    case 'id':
      return (
        <td className="px-5 py-4 font-mono text-mono-xs text-text-muted">
          {employee.id}
        </td>
      )
    case 'name':
      return (
        <td className="px-5 py-3">
          <p className="truncate text-label-sm text-text-primary">
            {employee.name}
          </p>
          <p className="truncate text-paragraph-xs text-text-muted">
            {employee.email}
          </p>
        </td>
      )
    case 'jobTitle':
      return (
        <td className="px-5 py-4 text-paragraph-sm text-text-primary">
          {employee.jobTitle}
        </td>
      )
    case 'employeeType':
      return (
        <td className="px-5 py-4 text-paragraph-sm text-text-primary">
          {employee.employeeType}
        </td>
      )
    case 'workLocation':
      return (
        <td className="px-5 py-4 text-paragraph-sm text-text-primary">
          {employee.workLocation}
        </td>
      )
    case 'hireDate':
      return (
        <td className="px-5 py-4 text-paragraph-sm text-text-muted">
          {fmtHireDate(employee.hireDate)}
        </td>
      )
    case 'status':
      return (
        <td className="px-5 py-4">
          <StatusPill dotClassName={statusDot[employee.status]}>
            {statusLabels[employee.status]}
          </StatusPill>
        </td>
      )
    case 'compensation':
      return (
        <td className="px-5 py-4 text-right font-mono text-mono-xs text-text-primary">
          {fmtCompensation(employee)}
        </td>
      )
    default:
      return <td className="px-5 py-4" />
  }
}

function RowMenu({ employee }: { employee: Employee }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" className="text-text-muted" />}
        aria-label={`Actions for ${employee.name}`}
      >
        <DotsThreeVertical className="size-4" weight="bold" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 ">
        <DropdownMenuItem>View profile</DropdownMenuItem>
        <DropdownMenuItem>Edit details</DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Offboard</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
