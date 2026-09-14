import { useState } from 'react'
import {
  ArrowSquareOut,
  Check,
  Copy,
  FileCsv,
  FilePdf,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { StatusPill } from '@/components/nds/controls'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  ConnectionStrength,
  ContextChunk,
  DiffRow,
  FilterTableRow,
  FilterTableStatus,
  InsightMetric,
  VendorRecord,
  codeBlock,
} from '@/mocks/ai-components'

type CodeBlockData = typeof codeBlock

/**
 * Knowledge & data: RAG context chunks, an AI-proposed diff table, a
 * CRM-style records grid, a status-filterable table, narrative insight
 * cards, and a streamed code block. Scouting-stage - see
 * docs/foundations/ai-components.md. Reuses `Table` (ui/table) and
 * `StatusPill` (nds/controls) rather than inventing new table chrome.
 */

/* ---------------- Context cards ---------------- */

const SOURCE_ICON = {
  PDF: FilePdf,
  CSV: FileCsv,
}

export function ContextCards({
  totalChunks,
  chunks,
  className,
}: {
  totalChunks: number
  chunks: Array<ContextChunk>
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-label-xs text-text-muted">
        All chunks · {totalChunks}
      </p>
      <div className="flex flex-col gap-2">
        {chunks.map((chunk) => {
          const SourceIcon = SOURCE_ICON[chunk.sourceType]
          return (
            <div
              key={chunk.title}
              className="rounded-xl bg-background-base p-3 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-label-sm text-text-primary">{chunk.title}</p>
                <span className="shrink-0 text-caption text-text-muted">
                  {chunk.chars} chars
                </span>
              </div>
              <p className="mt-1 text-paragraph-xs text-text-muted">
                {chunk.snippet}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-background-muted px-2 py-0.5">
                <SourceIcon className="size-3.5 text-text-muted" />
                <span className="text-caption-md text-text-muted">
                  {chunk.sourceLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Diff table ---------------- */

const DIFF_COLUMN_KEYS: Record<string, keyof DiffRow> = {
  Employee: 'employee',
  Schedule: 'schedule',
  Manager: 'manager',
}

export function DiffTable({
  columns,
  rows,
  className,
}: {
  columns: Array<string>
  rows: Array<DiffRow>
  className?: string
}) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
              className="h-8 bg-background-highlight text-label-xs text-text-muted"
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.employee} className="h-[54px]">
            {columns.map((column) => {
              const key = DIFF_COLUMN_KEYS[column]
              const isChanged = row.changed === key
              return (
                <TableCell
                  key={column}
                  className={cn(
                    'px-5 text-paragraph-sm text-text-primary',
                    isChanged && 'bg-background-success-muted',
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {row[key]}
                    {isChanged && (
                      <span className="inline-flex h-4 items-center rounded-full bg-background-success-base px-1.5 text-label-xs text-text-on-color">
                        Changed
                      </span>
                    )}
                  </span>
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/* ---------------- Records table ---------------- */

const STRENGTH_DOT: Record<ConnectionStrength, string> = {
  'very strong': 'bg-background-success-base',
  strong: 'bg-background-success-base',
  weak: 'bg-background-warning-base',
  'very weak': 'bg-background-disabled',
  'no communication': 'bg-background-disabled',
}

export function RecordsTable({
  records,
  className,
}: {
  records: Array<VendorRecord>
  className?: string
}) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
            Vendor
          </TableHead>
          <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
            Categories
          </TableHead>
          <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
            Last interaction
          </TableHead>
          <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
            Connection
          </TableHead>
          <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
            Link
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.name} className="h-[54px]">
            <TableCell className="px-5">
              <p className="text-label-sm text-text-primary">{record.name}</p>
              <p className="text-caption text-text-muted">{record.location}</p>
            </TableCell>
            <TableCell className="px-5">
              <div className="flex flex-wrap gap-1">
                {record.categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex h-5 items-center rounded-full bg-background-muted px-2 text-label-xs text-text-muted"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </TableCell>
            <TableCell className="px-5 text-paragraph-sm text-text-muted">
              {record.lastInteraction}
            </TableCell>
            <TableCell className="px-5">
              <StatusPill dotClassName={STRENGTH_DOT[record.strength]}>
                {record.strength}
              </StatusPill>
            </TableCell>
            <TableCell className="px-5">
              {record.link ? (
                <a
                  href={`https://${record.link}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-paragraph-sm text-brand-text hover:underline"
                >
                  {record.link}
                  <ArrowSquareOut className="size-3.5 shrink-0" />
                </a>
              ) : (
                <span className="text-paragraph-sm text-text-disabled">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="h-10">
          <TableCell colSpan={5} className="px-5 text-label-xs text-text-muted">
            {records.length} vendors
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

/* ---------------- Filter table ---------------- */

const FILTER_STATUS_DOT: Record<FilterTableStatus, string> = {
  'To do': 'bg-background-emphasis',
  'In Progress': 'bg-background-info-base',
  Completed: 'bg-background-success-base',
}

export function FilterTable({
  rows,
  className,
}: {
  rows: Array<FilterTableRow>
  className?: string
}) {
  const statuses = Array.from(new Set(rows.map((row) => row.status)))
  const [active, setActive] = useState<FilterTableStatus | 'All'>('All')
  const visibleRows =
    active === 'All' ? rows : rows.filter((row) => row.status === active)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={active === 'All'} onClick={() => setActive('All')}>
          All · {rows.length}
        </FilterChip>
        {statuses.map((status) => (
          <FilterChip
            key={status}
            active={active === status}
            onClick={() => setActive(status)}
          >
            {status} · {rows.filter((row) => row.status === status).length}
          </FilterChip>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
              Task
            </TableHead>
            <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
              Owner
            </TableHead>
            <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
              Date
            </TableHead>
            <TableHead className="h-8 bg-background-highlight text-label-xs text-text-muted">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row) => (
            <TableRow key={row.task} className="h-[54px]">
              <TableCell className="px-5 text-paragraph-sm text-text-primary">
                {row.task}
              </TableCell>
              <TableCell className="px-5 text-paragraph-sm text-text-muted">
                {row.owner}
              </TableCell>
              <TableCell className="px-5 font-mono text-mono-xs text-text-muted">
                {row.date}
              </TableCell>
              <TableCell className="px-5">
                <StatusPill dotClassName={FILTER_STATUS_DOT[row.status]}>
                  {row.status}
                </StatusPill>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center rounded-full px-3 text-label-xs transition-colors',
        active
          ? 'bg-background-highlight text-text-primary'
          : 'border border-border-base text-text-muted hover:bg-background-highlight hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}

/* ---------------- Insight cards ---------------- */

function formatSignedPct(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatSignedAmount(value: number) {
  const sign = value > 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

function InsightMetricRow({ metric }: { metric: InsightMetric }) {
  const positive = metric.changePct >= 0
  const tone = positive ? 'text-text-success-base' : 'text-text-error-base'
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <p className="text-paragraph-sm text-text-primary">{metric.label}</p>
      <p className={cn('font-mono text-mono-sm', tone)}>
        {formatSignedPct(metric.changePct)} · {formatSignedAmount(metric.changeAmount)}
      </p>
    </div>
  )
}

export function InsightCards({
  totalInsights,
  headline,
  metrics,
  followUp,
  className,
}: {
  totalInsights: number
  headline: string
  metrics: Array<InsightMetric>
  followUp: string
  className?: string
}) {
  return (
    <div className={cn('rounded-xl bg-background-base p-4 shadow-card', className)}>
      <p className="text-label-xs text-text-muted">Insights · {totalInsights}</p>
      <p className="mt-1.5 text-paragraph-sm text-text-primary">{headline}</p>
      <div className="mt-3 flex flex-col divide-y divide-border-highlight">
        {metrics.map((metric) => (
          <InsightMetricRow key={metric.label} metric={metric} />
        ))}
      </div>
      <button
        type="button"
        className="mt-3 inline-flex h-8 items-center rounded-full bg-background-highlight px-3 text-label-xs text-text-primary transition-colors hover:bg-background-emphasis"
      >
        {followUp}
      </button>
    </div>
  )
}

/* ---------------- Code block ---------------- */

export function CodeBlock({
  filename,
  language,
  lines,
  className,
}: CodeBlockData & { className?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard?.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn('overflow-hidden rounded-xl bg-surface-2 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border-highlight px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-mono-xs text-text-primary">{filename}</span>
          <span className="rounded-full bg-background-highlight px-2 py-0.5 text-label-xs text-text-muted">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex size-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
        >
          {copied ? (
            <Check className="size-3.5 text-text-success-base" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto px-3 py-2">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-5 shrink-0 select-none text-right font-mono text-mono-xs text-text-disabled">
              {i + 1}
            </span>
            <span className="whitespace-pre font-mono text-mono-xs text-text-primary">
              {line}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
