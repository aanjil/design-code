import { useEffect, useState } from 'react'
import { ArrowLineDown, ChatCircleDots, Eye, EyeSlash, Microphone, SidebarSimple, X } from '@phosphor-icons/react'
import { EmmaMark } from '@/components/nds/app-bar'
import { OrbitMenu, type OrbitAction } from '@/components/nds/orbit-menu'
import { cn } from '@/lib/utils'
import type { BezelScript } from '@/mocks/bezel'
import type { BezelHeadConfig, BezelMode } from './floating-bezel'

/**
 * Immersive Emma, Messenger-style: a chat head that sits on an edge. The
 * orb says *who* is talking (Emma), the badge says how many things are
 * waiting, and a preview bubble pops out with the latest claim - the same
 * job a chat head does when someone messages you. The bezel isn't rotated
 * or squeezed; it's a different, smaller object that opens a card when you
 * need room.
 *
 *   tap         open / close the card (finding, or Ask when there's nothing)
 *   hold        actions orbit out toward the screen - drag onto one, release
 *   drag        move the head; it snaps to the nearest edge, anywhere along it
 */

const DIRECTION = { right: 0, down: 90, left: 180, up: -90 } as const

export function ChatHead({
  style,
  head,
  mode,
  script,
  toward,
  bubble,
  onModeChange,
}: {
  style: React.CSSProperties
  head: BezelHeadConfig
  mode: BezelMode
  script: BezelScript
  toward: 'right' | 'left' | 'down' | 'up'
  /** Show the preview bubble (only while the head is alone - not with a card). */
  bubble: boolean
  onModeChange: (mode: BezelMode) => void
}) {
  const run = mode === 'run'
  const scanning = mode === 'scanning'
  /** The orb carries the AI gradient while a run is Emma's to drive. */
  const ai = run || mode === 'agent'
  const aura = ai
    ? 'working'
    : scanning
      ? 'scanning'
      : mode === 'tension'
        ? 'tension'
        : mode === 'found' || mode === 'expanded'
          ? 'attention'
          : mode === 'quiet'
            ? 'quiet'
            : 'focus'
  const preview =
    mode === 'found'
      ? { claim: script.found.claim, sub: script.found.provenance }
      : run
        ? { claim: script.run.claim, sub: script.run.sub }
        : scanning
          ? { claim: script.scanLabel, sub: 'reading - no claim yet' }
          : null

  // A new claim re-opens a dismissed bubble - the way a new message does.
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [orbitOpen, setOrbitOpen] = useState(false)
  useEffect(() => {
    if (preview && dismissed && dismissed !== preview.claim) setDismissed(null)
  }, [preview?.claim, dismissed, preview])
  const showBubble = bubble && !!preview && dismissed !== preview.claim && !orbitOpen

  const cardOpen = !['quiet', 'found', 'scanning', 'run'].includes(mode)
  const actions: Array<OrbitAction> = [
    { id: 'ask', label: 'Ask Emma', icon: <ChatCircleDots className="size-[18px]" />, done: 'Ask away' },
    mode === 'found' || mode === 'expanded'
      ? { id: 'show', label: 'Show me', icon: <Eye className="size-[18px]" />, done: 'Opened' }
      : { id: 'scan', label: 'Read this page', icon: <Eye className="size-[18px]" />, done: 'Reading' },
    { id: 'sidebar', label: 'Open sidebar', icon: <SidebarSimple className="size-[18px]" />, done: 'Docked' },
    { id: 'voice', label: 'Voice', icon: <Microphone className="size-[18px]" />, done: 'Listening' },
    { id: 'dock', label: 'Back to the bar', icon: <ArrowLineDown className="size-[18px]" />, done: 'Docked to the bar' },
    { id: 'hide', label: 'Hide for now', icon: <EyeSlash className="size-[18px]" />, done: 'Hidden' },
  ]

  function onAction(id: string) {
    if (id === 'ask') onModeChange('ask')
    else if (id === 'show') onModeChange('expanded')
    else if (id === 'scan') onModeChange('scanning')
    else if (id === 'sidebar') onModeChange('copilot')
    else if (id === 'voice') onModeChange('voice')
    else if (id === 'dock') head.onDock()
    else if (id === 'hide') onModeChange('quiet')
  }

  function onTap() {
    if (cardOpen) return onModeChange(mode === 'ask' || mode === 'voice' ? 'quiet' : 'found')
    if (mode === 'found') return onModeChange('expanded')
    if (run) return
    onModeChange('ask')
  }

  const horizontal = toward === 'right' || toward === 'left'

  return (
    <div data-bezel-head className="absolute z-40" style={style}>
      <OrbitMenu
        label="Emma"
        actions={actions}
        onAction={onAction}
        direction={DIRECTION[toward]}
        radius={96}
        spread={toward === 'up' || toward === 'down' ? 160 : 150}
        holdDelay={320}
        onTap={onTap}
        onDragAway={head.onDragAway}
        onOpenChange={setOrbitOpen}
        trigger={
          <span
            className={cn(
              'relative flex size-14 items-center justify-center rounded-full transition-transform duration-200 active:scale-95',
              ai ? 'bg-niural-ai-colors-gradient shadow-[0_10px_28px_-8px_var(--elevation-alpha-brand-48)]' : 'bg-base/90 backdrop-blur-xl shadow-[0_0_0_0.5px_var(--elevation-alpha-16),0_10px_28px_-8px_var(--elevation-alpha-24)]',
            )}
          >
            {/* Same ambience as the bar (styles.css): an aura that breathes
                behind the orb and a gradient ring; scanning sweeps the ring. */}
            <span aria-hidden data-aura={aura} className="bezel-aura bezel-aura-orb" />
            {!ai && <span aria-hidden data-aura={aura} className="bezel-ring" />}
            <EmmaMark className={cn('size-7', ai && 'brightness-0 invert')} />
            {head.badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 tabular-nums text-caption-xs font-medium text-on-color ring-2 ring-(--background-base)">
                {head.badge}
              </span>
            )}
          </span>
        }
        triggerClassName="size-14"
      />

      {showBubble && preview && (
        <div
          className={cn(
            'absolute w-[280px] animate-in fade-in zoom-in-95 duration-200',
            horizontal ? 'top-1/2 -translate-y-1/2' : 'left-1/2 -translate-x-1/2',
            toward === 'right' && 'left-full ml-3 origin-left',
            toward === 'left' && 'right-full mr-3 origin-right',
            toward === 'down' && 'top-full mt-3 origin-top',
            toward === 'up' && 'bottom-full mb-3 origin-bottom',
          )}
        >
          <button
            type="button"
            onClick={() => (mode === 'found' ? onModeChange('expanded') : undefined)}
            className={cn(
              'group block w-full rounded-2xl px-3.5 py-2.5 text-left',
              run
                ? 'bg-niural-ai-colors-gradient text-on-color shadow-[0_10px_28px_-10px_var(--elevation-alpha-brand-48)]'
                : 'bg-base/92 backdrop-blur-xl shadow-[0_0_0_0.5px_var(--elevation-alpha-16),0_12px_32px_-12px_var(--elevation-alpha-24)]',
            )}
          >
            <span className={cn('block text-caption-sm font-medium', run ? 'text-on-color/80' : 'text-brand')}>
              Emma{mode === 'found' ? ' · found something' : run ? ' · running' : ' · reading'}
            </span>
            <span className={cn('line-clamp-2 text-label-small font-normal', run ? 'text-on-color' : 'text-primary')}>{preview.claim}</span>
            <span className={cn('block truncate font-mono text-caption-xs', run ? 'text-on-color/75' : 'text-muted')}>{preview.sub}</span>
          </button>
          <button
            type="button"
            aria-label="Dismiss preview"
            onClick={() => setDismissed(preview.claim)}
            className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-base text-muted shadow-[0_0_0_0.5px_var(--elevation-alpha-16),0_2px_6px_var(--elevation-alpha-12)] transition-colors hover:text-primary"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  )
}
