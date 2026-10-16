import { cn } from '@/lib/utils'

export function Kbd({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded border border-base bg-highlight px-1 py-px text-caption-sm font-medium text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
