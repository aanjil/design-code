import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  Buildings,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Columns,
  DotsThreeVertical,
  Files,
  Money,
  Percent,
  ShieldCheck,
  Signature,
  Table,
  TreeStructure,
  Users,
  UsersFour,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import { AppBar } from '@/components/nds/app-bar'
import { Sidebar } from '@/components/nds/sidebar'
import type { SidebarGroupDef } from '@/components/nds/sidebar'
import { AppShell, MainLayout, PageLayout } from '@/components/nds/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@niural/components'
import { cn } from '@/lib/utils'

/**
 * Shared Settings > Organization pieces. Every page is a centered 768px
 * column under the same AppBar + Settings sidebar - the screenshots'
 * layout - so the shell is the one thing every page composes identically.
 */

export type SettingsPage =
  | 'overview'
  | 'documents'
  | 'tax'
  | 'users'
  | 'groups'
  | 'departments'
  | 'teams'
  | 'custom-fields'
  | 'signatory'
  | 'security'
  | 'payroll'
  | 'timesheets'

const NAV: Array<{ title?: string; items: Array<{ key: SettingsPage; label: string; icon: SidebarGroupDef['items'][number]['icon'] }> }> = [
  {
    items: [
      { key: 'overview', label: 'Overview', icon: Buildings },
      { key: 'documents', label: 'Documents', icon: Files },
      { key: 'tax', label: 'Tax Setup', icon: Percent },
      { key: 'users', label: 'Users', icon: Users },
      { key: 'groups', label: 'Groups', icon: UsersFour },
      { key: 'departments', label: 'Departments', icon: TreeStructure },
      { key: 'teams', label: 'Teams', icon: UsersThree },
      { key: 'custom-fields', label: 'Custom Fields', icon: Columns },
      { key: 'signatory', label: 'Signatory', icon: Signature },
    ],
  },
  { title: 'Administration', items: [{ key: 'security', label: 'Security', icon: ShieldCheck }] },
  {
    title: 'Feature',
    items: [
      { key: 'payroll', label: 'Payroll', icon: Money },
      { key: 'timesheets', label: 'Timesheets', icon: Table },
    ],
  },
]

const ALL_ITEMS = NAV.flatMap((g) => g.items)
export const PAGE_LABEL = Object.fromEntries(ALL_ITEMS.map((i) => [i.key, i.label])) as Record<SettingsPage, string>
export const SETTINGS_PAGES = ALL_ITEMS.map((i) => i.key)

export function SettingsShell({
  active,
  onNavigate,
  onNavItemClick,
  children,
}: {
  active: SettingsPage
  onNavigate: (page: SettingsPage) => void
  onNavItemClick?: (label: string) => void
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // New page = start at the top, like a real route change.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [active])

  return (
    <AppShell>
      <AppBar activeItem="" walletAmount="USD 224,651.00" onNavItemClick={onNavItemClick} />
      <MainLayout>
        <Sidebar
          title="Settings"
          activeItem={PAGE_LABEL[active]}
          groups={NAV.map((g) => ({ title: g.title, items: g.items }))}
          onNavigate={(label) => {
            const key = ALL_ITEMS.find((i) => i.label === label)?.key
            if (key) onNavigate(key)
          }}
        />
        <PageLayout>
          <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[800px] px-4 pt-12 pb-form-bottom">{children}</div>
          </div>
        </PageLayout>
      </MainLayout>
    </AppShell>
  )
}

/* ---------------- headings ---------------- */

export function PageTitle({
  title,
  subtitle,
  actions,
  divider,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  /** Groups/Timesheets carry a hairline under the header; the rest don't. */
  divider?: boolean
}) {
  return (
    <div className={cn('mb-8 flex items-start justify-between gap-4', divider && 'border-b border-border-highlight pb-4')}>
      <div className="min-w-0">
        <h1 className="text-title-h5 text-text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-paragraph-sm text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-label-md text-text-primary">{title}</h2>
        {subtitle && <p className="text-paragraph-xs text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}

/* ---------------- card + field grid ---------------- */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-xl bg-background-base p-5 shadow-card', className)}>{children}</div>
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-x-4 gap-y-5">{children}</div>
}

export function Field({
  label,
  labelAction,
  children,
  mono,
}: {
  label: string
  labelAction?: React.ReactNode
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-caption text-text-muted">{label}</p>
        {labelAction}
      </div>
      <div className={cn('mt-1.5 text-label-sm text-text-primary', mono && 'font-mono text-mono-sm')}>{children}</div>
    </div>
  )
}

/** Masked secret with a Show/Hide link in the label row - EIN, account numbers. */
export function useReveal() {
  const [shown, setShown] = useState(false)
  const toggle = (
    <button
      type="button"
      onClick={() => setShown((v) => !v)}
      className="text-caption-md text-text-info-base hover:underline"
    >
      {shown ? 'Hide' : 'Show'}
    </button>
  )
  return { shown, toggle }
}

export function mask(value: string) {
  const digits = value.replace(/\D/g, '')
  return `•••••${digits.slice(-4)}`
}

export function Dash() {
  return <span className="text-text-muted">—</span>
}

/* ---------------- tags ---------------- */

export type TagTone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'brand' | 'pink' | 'teal' | 'orange'

const TAG_TONE: Record<TagTone, string> = {
  neutral: 'bg-background-highlight text-text-primary',
  success: 'bg-background-success-highlight text-text-success-base',
  warning: 'bg-background-warning-highlight text-text-warning-base',
  error: 'bg-background-error-highlight text-text-error-base',
  info: 'bg-background-info-highlight text-text-info-base',
  brand: 'bg-brand-muted text-brand-text',
  // Accent tones are decorative: role tags, not status.
  pink: 'bg-accent-pink-highlight text-text-primary',
  teal: 'bg-accent-teal-highlight text-text-primary',
  orange: 'bg-accent-orange-highlight text-text-primary',
}

export function Tag({ tone = 'neutral', children, className }: { tone?: TagTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center rounded-md px-2 text-caption-md whitespace-nowrap', TAG_TONE[tone], className)}>
      {children}
    </span>
  )
}

/* ---------------- avatar ---------------- */

const AVATAR_TONES = [
  'bg-accent-pink-muted',
  'bg-accent-violet-muted',
  'bg-accent-teal-muted',
  'bg-accent-orange-muted',
]

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const tone = AVATAR_TONES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES.length]
  return (
    <span
      title={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-text-on-color',
        tone,
        size === 'sm' && 'size-6 text-[10px] leading-none font-[550]',
        size === 'md' && 'size-8 text-caption-md',
        size === 'lg' && 'size-10 text-label-sm',
      )}
    >
      {initialsOf(name)}
    </span>
  )
}

/* ---------------- table ---------------- */

export function TableCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl bg-background-base shadow-card', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}

export function Th({
  children,
  width,
  align,
  onSort,
  sorted,
}: {
  children?: React.ReactNode
  width?: string
  align?: 'right'
  onSort?: () => void
  sorted?: 'asc' | 'desc' | null
}) {
  return (
    <th
      style={width ? { width } : undefined}
      className={cn('h-10 bg-background-highlight px-3 text-left text-label-sm text-text-primary', align === 'right' && 'text-right')}
    >
      {onSort ? (
        <button type="button" onClick={onSort} className="inline-flex items-center gap-1 hover:text-brand-text">
          {children}
          <SortGlyph dir={sorted ?? null} />
        </button>
      ) : (
        children
      )}
    </th>
  )
}

function SortGlyph({ dir }: { dir: 'asc' | 'desc' | null }) {
  return (
    <span className="flex flex-col text-[8px] leading-[7px]">
      <span className={dir === 'asc' ? 'text-brand-text' : 'text-text-muted'}>▲</span>
      <span className={dir === 'desc' ? 'text-brand-text' : 'text-text-muted'}>▼</span>
    </span>
  )
}

export function Td({
  children,
  className,
  align,
}: {
  children?: React.ReactNode
  className?: string
  align?: 'right'
}) {
  return (
    <td className={cn('border-t border-border-highlight px-3 py-3 align-middle text-paragraph-sm text-text-primary', align === 'right' && 'text-right', className)}>
      {children}
    </td>
  )
}

export function EmptyTable({
  colSpan,
  icon: EmptyIcon,
  title,
  description,
  action,
}: {
  colSpan: number
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-t border-border-highlight">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-background-base text-text-muted shadow-button-gray">
            <EmptyIcon className="size-5" />
          </span>
          <p className="text-label-sm text-text-primary">{title}</p>
          {description && <p className="max-w-[360px] text-paragraph-xs text-text-muted">{description}</p>}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </td>
    </tr>
  )
}

export interface RowAction {
  label: string
  icon?: React.ElementType
  destructive?: boolean
  onClick: () => void
}

export function RowMenu({ label, actions }: { label: string; actions: Array<RowAction> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<IconButton variant="ghost" shade="neutral" size="small" className="text-text-muted" />}
        aria-label={`Actions for ${label}`}
      >
        <DotsThreeVertical weight="bold" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map(({ label: actionLabel, icon: ActionIcon, destructive, onClick }) => (
          <DropdownMenuItem key={actionLabel} onClick={onClick} className={cn(destructive && 'text-text-error-base')}>
            {ActionIcon && <ActionIcon />}
            {actionLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------------- pagination ---------------- */

export function Pagination({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number
  page: number
  pageSize: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const btn = (label: string, Icon: React.ElementType, target: number, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => onPage(target)}
      className="flex size-8 items-center justify-center rounded-full bg-background-base text-text-primary shadow-pagination transition-colors hover:bg-background-highlight disabled:text-text-disabled disabled:hover:bg-background-base"
    >
      <Icon className="size-3.5" />
    </button>
  )
  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="text-paragraph-sm text-text-muted">
        {total} {total === 1 ? 'record' : 'records'}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-paragraph-sm text-text-muted">Records per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          aria-label="Records per page"
          className="h-9 w-24 rounded-btn bg-background-base px-3 font-mono text-mono-sm text-text-primary shadow-button-gray outline-none focus:shadow-border-focus"
        >
          {[5, 10, 25, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-paragraph-sm text-text-muted">
          Page {page} of {pages}
        </span>
        <div className="flex items-center gap-1.5">
          {btn('First page', CaretDoubleLeft, 1, page <= 1)}
          {btn('Previous page', CaretLeft, page - 1, page <= 1)}
          {btn('Next page', CaretRight, page + 1, page >= pages)}
          {btn('Last page', CaretDoubleRight, pages, page >= pages)}
        </div>
      </div>
    </div>
  )
}

/** Client-side paging state that snaps back to page 1 when the list changes shape. */
export function usePaging<T>(rows: Array<T>, initialSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialSize)
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pages)
  return {
    visible: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    props: {
      total: rows.length,
      page: safePage,
      pageSize,
      onPage: setPage,
      onPageSize: (n: number) => {
        setPageSize(n)
        setPage(1)
      },
    },
  }
}

/* ---------------- modal ---------------- */

export function Modal({
  title,
  subtitle,
  onClose,
  footer,
  children,
  width = 'w-[480px]',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  footer?: React.ReactNode
  children: React.ReactNode
  width?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-overlay-background-base p-6 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-label={title} className={cn('flex max-h-full min-w-0 flex-col rounded-2xl bg-background-base shadow-flyout', width)}>
        <div className="flex shrink-0 items-start justify-between gap-3 px-6 pt-5 pb-2">
          <div>
            <p className="text-label-lg text-text-primary">{title}</p>
            {subtitle && <p className="text-paragraph-xs text-text-muted">{subtitle}</p>}
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
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-3 px-6 pt-2 pb-5">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------- toast ---------------- */

const ToastContext = createContext<(message: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

/** Positioned inside the app (absolute), so it stays in its canvas window. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const push = useCallback((message: string) => setToast({ id: Date.now(), message }), [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <ToastContext.Provider value={push}>
      <div className="relative size-full">
        {children}
        {toast && (
          <div
            key={toast.id}
            role="status"
            className="absolute bottom-20 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-2 rounded-xl bg-grain-ink px-4 py-2.5 text-label-sm text-grain-ink-foreground shadow-flyout fade-in slide-in-from-bottom-2"
          >
            <CheckCircle weight="fill" className="size-4 text-text-success-base" />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
