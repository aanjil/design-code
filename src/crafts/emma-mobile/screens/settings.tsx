import { CheckCircle, ListBullets, Sparkle } from '@phosphor-icons/react'
import type { SettingsView } from '../types'
import { MobileAppHeader, MobileHomeIndicator, MobileStatusBar, MobileToast } from '@/components/nds-mobile'
import { cn } from '@/lib/utils'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Feature 1.1 (Adaptive Mode Framework) - the explicit mode picker. Selecting
 * a mode re-renders the dashboard immediately (Live App wires this to a real
 * mutation); the toast-error state is the PRD's own failure case, "the app
 * stays in the current mode" - shown here as a frozen catalog state since a
 * real render failure isn't something this prototype can genuinely trigger.
 */

function ModeOption({
  icon: OptionIcon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon: typeof Sparkle
  title: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-xl p-3.5 text-left shadow-card',
        selected ? 'bg-brand-muted' : 'bg-background-base',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-brand-primary' : 'bg-background-highlight',
        )}
      >
        <OptionIcon weight="fill" className={cn('size-[18px]', selected ? 'text-text-on-color' : 'text-text-muted')} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-label-sm', selected ? 'text-brand-text' : 'text-text-primary')}>{title}</p>
        <p className={cn('mt-0.5 text-paragraph-xs', selected ? 'text-brand-text/80' : 'text-text-muted')}>
          {description}
        </p>
      </div>
      {selected && <CheckCircle weight="fill" className="size-5 shrink-0 text-brand-primary" />}
    </button>
  )
}

export function SettingsScreen({ view }: { view: SettingsView }) {
  const { show } = useExplorer()

  return (
    <div className="relative flex h-full flex-col bg-surface-1">
      <MobileStatusBar />
      <MobileAppHeader title="Settings" onBack={() => show(view.mode === 'traditional' ? 'B3' : 'B1')} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <p className="px-1 text-label-xs text-text-muted">EXPERIENCE MODE</p>
        <ModeOption
          icon={Sparkle}
          title="AI-native"
          description="Emma leads with a dynamic dashboard, predictive cards, and chat."
          selected={view.mode === 'ai-native'}
          onSelect={() => show('D1', 'ai-native')}
        />
        <ModeOption
          icon={ListBullets}
          title="Traditional"
          description="A conventional list-based home screen, no AI framing."
          selected={view.mode === 'traditional'}
          onSelect={() => show('D1', 'traditional')}
        />
      </div>
      {view.toastError && <MobileToast>Couldn&apos;t switch experience mode. Please try again.</MobileToast>}
      <MobileHomeIndicator />
    </div>
  )
}
