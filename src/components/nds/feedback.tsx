import type { Icon } from '@phosphor-icons/react'
import {
  CheckCircle,
  ClockCountdown,
  Info,
  Sparkle,
  Warning,
  WarningOctagon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Inline feedback: status banners (5 tones on the *-highlight surfaces)
 * and the Emma AI suggestion card (elevation-ai glow). Promoted from the
 * multi-payroll craft once they proved reusable.
 */

export type BannerTone = 'info' | 'warning' | 'error' | 'success' | 'pending'

const TONES: Record<BannerTone, { icon: Icon; wrap: string; iconCls: string }> = {
  info: {
    icon: Info,
    wrap: 'bg-info-highlight',
    iconCls: 'text-info',
  },
  warning: {
    icon: Warning,
    wrap: 'bg-warning-highlight',
    iconCls: 'text-warning',
  },
  error: {
    icon: WarningOctagon,
    wrap: 'bg-error-highlight',
    iconCls: 'text-error',
  },
  success: {
    icon: CheckCircle,
    wrap: 'bg-success-highlight',
    iconCls: 'text-success',
  },
  pending: {
    icon: ClockCountdown,
    wrap: 'bg-brand-base',
    iconCls: 'text-brand',
  },
}

export function Banner({
  tone,
  title,
  children,
  actions,
  className,
}: {
  tone: BannerTone
  title: React.ReactNode
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  const t = TONES[tone]
  const ToneIcon = t.icon
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg p-3', t.wrap, className)}>
      <ToneIcon weight="fill" className={cn('mt-px size-4 shrink-0', t.iconCls)} />
      <div className="min-w-0 flex-1">
        <div className="text-label-xsmall text-primary">{title}</div>
        {children && (
          <div className="mt-0.5 text-paragraph-xsmall text-muted">{children}</div>
        )}
        {actions && <div className="mt-2 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function EmmaCard({
  title,
  children,
  actions,
  className,
}: {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl bg-base p-4 elevation-ai', className)}>
      <div className="flex items-center gap-1.5">
        <Sparkle weight="fill" className="size-4 text-brand-primary" />
        <p className="text-label-xsmall text-brand">Emma · {title}</p>
      </div>
      <div className="mt-1.5 text-paragraph-xsmall text-primary">{children}</div>
      {actions && <div className="mt-3 flex items-center gap-2">{actions}</div>}
    </div>
  )
}
