import { cn } from '@/lib/utils'

/**
 * App shell per layouts.md + Figma: AppBar > MainLayout(Sidebar + PageLayout).
 * MainLayout floats the content panel on the surface-2 canvas with an
 * 8px gutter (Figma frame 7517).
 */

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-2 text-text-primary">
      {children}
    </div>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 px-2 pb-2">
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-border-highlight bg-background-base">
        {children}
      </div>
    </div>
  )
}

export function PageLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
}

export function PageHeader({
  title,
  actions,
}: {
  title: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-highlight py-[11px] pr-4 pl-1">
      <div className="flex min-w-0 items-center px-3 py-1">
        <h1 className="truncate px-1 text-label-md">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}

export function PageBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto p-4', className)}>
      {children}
    </div>
  )
}

export function PageFooter({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center border-t border-border-highlight px-4 py-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
