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
        'inline-flex items-center rounded border border-border-base bg-background-highlight px-1 py-px text-caption-md text-text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
