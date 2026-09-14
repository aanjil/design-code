import { useState } from 'react'
import {
  CalendarBlank,
  Clock,
  GearSix,
  House,
  Receipt,
  SpeakerSimpleSlash,
  Sparkle,
  User,
  X,
} from '@phosphor-icons/react'
import type { DashboardView } from '../types'
import { DEMO_USER_NAME, SEEDED_CHAT, SESSION_SUMMARY_ITEMS, eligibleCards } from '../engine'
import {
  MobileAppHeader,
  MobileCard,
  MobileChatBubble,
  MobileHomeIndicator,
  MobileInputBar,
  MobileStatusBar,
  MobileTabBar,
} from '@/components/nds-mobile'
import { Banner } from '@/components/nds/feedback'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Feature 4 (Dynamic AI Dashboard) - one screen component renders every
 * variant via view flags, same pattern multi-payroll uses: composed
 * (4.1/4.2/4.5), chat (4.3), traditional (1.3), and the fallback banner
 * (1.2) are all this same component reacting to `view`, never bespoke
 * screens per state.
 */

function DashboardHeader({
  muted,
  onMute,
  onSettings,
}: {
  muted: boolean
  onMute: () => void
  onSettings: () => void
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between px-4">
      <span
        className="flex size-8 items-center justify-center rounded-full"
        style={{ backgroundImage: 'linear-gradient(119.6deg, #714dff 30.8%, #e151ff 122.6%)' }}
      >
        <Sparkle weight="fill" className="size-4 text-white" />
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMute}
          aria-label={muted ? 'Unmute Emma' : 'Mute Emma'}
          className="flex size-8 items-center justify-center rounded-full text-text-muted active:bg-background-highlight"
        >
          <SpeakerSimpleSlash weight={muted ? 'fill' : 'regular'} className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={onSettings}
          aria-label="Settings"
          className="flex size-8 items-center justify-center rounded-full text-text-muted active:bg-background-highlight"
        >
          <GearSix className="size-[18px]" />
        </button>
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-muted text-caption-md text-brand-text">
          {DEMO_USER_NAME.slice(0, 2).toUpperCase()}
        </span>
      </div>
    </div>
  )
}

function SessionSummary({
  state,
  onDismiss,
}: {
  state: 'has-updates' | 'nothing-new'
  onDismiss: () => void
}) {
  return (
    <div className="rounded-2xl bg-brand-muted p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-label-sm text-brand-text">
          Let&apos;s start your day - here&apos;s what happened since you left
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss summary"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-brand-text/60"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {state === 'has-updates' ? (
        <ul className="mt-2 flex flex-col gap-1">
          {SESSION_SUMMARY_ITEMS.map((item) => (
            <li key={item} className="text-paragraph-xs text-brand-text/80">
              · {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-paragraph-xs text-brand-text/80">Nothing new since you last checked.</p>
      )}
    </div>
  )
}

function ComposedDashboard({ view }: { view: DashboardView }) {
  const { show } = useExplorer()
  const [muted, setMuted] = useState(false)
  const [input, setInput] = useState('')
  const cards = eligibleCards().filter((c) => !view.dismissedCardIds?.includes(c.id))

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <MobileStatusBar />
      <DashboardHeader muted={muted} onMute={() => setMuted((m) => !m)} onSettings={() => show('D1')} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-3">
        {!view.emmaHealthy && (
          <Banner tone="info" title="Assistant is temporarily unavailable">
            You can continue as usual.
          </Banner>
        )}

        {view.emmaHealthy && view.summary !== 'dismissed' && (
          <SessionSummary
            state={view.summary}
            onDismiss={() => show('B1', undefined, { dismissSummary: true })}
          />
        )}

        {cards.map((card) => (
          <MobileCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            details={
              <>
                <p>{card.details}</p>
                {view.emmaHealthy && <p className="mt-1 text-brand-text">{card.reason}</p>}
              </>
            }
            ctas={[{ label: card.id === 'clock-in' ? 'Clock in' : 'View' }]}
          />
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-4 pt-1">
        {view.emmaHealthy && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['How much PTO do I have?', "What's my next payday?"].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => show('B2')}
                className="shrink-0 rounded-full bg-background-highlight px-3 py-1.5 text-label-xs text-text-primary"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <MobileInputBar
          value={input}
          onChange={(v) => {
            setInput(v)
            if (v.trim().length > 0) show('B2')
          }}
          placeholder={view.emmaHealthy ? 'Message Emma' : 'Search'}
          showMic={view.emmaHealthy}
        />
      </div>
      <MobileHomeIndicator />
    </div>
  )
}

function ChatDashboard({ view }: { view: DashboardView }) {
  const { show } = useExplorer()
  const [input, setInput] = useState('')
  const messages = view.chatMessages ?? SEEDED_CHAT

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <MobileStatusBar />
      <MobileAppHeader title="Emma" onBack={() => show('B1', 'default')} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
        {messages.map((m, i) => (
          <MobileChatBubble key={i} from={m.from}>
            {m.text}
          </MobileChatBubble>
        ))}
      </div>
      <div className="shrink-0 px-4 pt-1">
        <MobileInputBar value={input} onChange={setInput} onSend={() => setInput('')} placeholder="Message Emma" />
      </div>
      <MobileHomeIndicator />
    </div>
  )
}

const TRADITIONAL_ROWS = [
  { id: 'timesheet', label: 'Timesheet', icon: Clock },
  { id: 'pto', label: 'Time off', icon: CalendarBlank },
  { id: 'pay', label: 'Pay stubs', icon: Receipt },
]

function TraditionalDashboard() {
  const { show } = useExplorer()
  return (
    <div className="flex h-full flex-col bg-surface-1">
      <MobileStatusBar />
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <p className="text-label-md text-text-primary">Home</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => show('D1')}
            aria-label="Settings"
            className="flex size-8 items-center justify-center rounded-full text-text-muted active:bg-background-highlight"
          >
            <GearSix className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => show('B2')}
            aria-label="Ask Emma"
            className="flex size-8 items-center justify-center rounded-full bg-background-highlight text-brand-text"
          >
            <Sparkle weight="fill" className="size-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 px-4 py-2">
          {TRADITIONAL_ROWS.map((row) => {
            const RowIcon = row.icon
            return (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-xl bg-background-base p-3.5 shadow-card"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-background-highlight">
                  <RowIcon className="size-[18px] text-text-primary" />
                </span>
                <span className="text-label-sm text-text-primary">{row.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      <MobileTabBar
        active="home"
        items={[
          { id: 'home', label: 'Home', icon: House },
          { id: 'timesheet', label: 'Timesheet', icon: Clock },
          { id: 'pay', label: 'Pay', icon: Receipt },
          { id: 'profile', label: 'Profile', icon: User },
        ]}
      />
      <MobileHomeIndicator />
    </div>
  )
}

export function DashboardScreen({ view }: { view: DashboardView }) {
  if (view.mode === 'traditional') return <TraditionalDashboard />
  if (view.surface === 'chat') return <ChatDashboard view={view} />
  return <ComposedDashboard view={view} />
}
