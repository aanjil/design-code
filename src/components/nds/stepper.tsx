import { CheckCircle, Spinner } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Vertical wizard stepper (Figma Multi-payroll 89:5507):
 * 24px state icon + Label/XSmall, 24px hairline divider between steps.
 * done = brand check (label brand-text) · current = brand spinner
 * (label text-primary) · upcoming = muted check (label muted).
 * Completed steps are clickable when `onStepClick` is provided.
 */
export function Stepper({
  steps,
  current,
  onStepClick,
  className,
}: {
  steps: Array<string>
  /** Index of the in-progress step. */
  current: number
  /** Called with the step index - only completed steps are clickable. */
  onStepClick?: (index: number) => void
  className?: string
}) {
  return (
    <ol className={cn('flex flex-col', className)}>
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
        const clickable = state === 'done' && !!onStepClick
        return (
          <li key={label} className="flex flex-col">
            {i > 0 && (
              <span aria-hidden className="ml-3 h-6 w-px bg-border-base" />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(i) : undefined}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-3 text-left',
                clickable ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              {state === 'current' ? (
                <Spinner
                  className="size-6 shrink-0 animate-[spin_2.5s_linear_infinite] text-brand-primary"
                  weight="bold"
                />
              ) : (
                <CheckCircle
                  weight="fill"
                  className={cn(
                    'size-6 shrink-0',
                    state === 'done'
                      ? 'text-brand-primary'
                      : 'text-background-emphasis',
                  )}
                />
              )}
              <span
                className={cn(
                  'text-label-xs',
                  state === 'done' && 'text-brand-text',
                  state === 'current' && 'text-text-primary',
                  state === 'upcoming' && 'text-text-muted',
                )}
              >
                {label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
