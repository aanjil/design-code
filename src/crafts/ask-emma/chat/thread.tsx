import { ArrowUpRight, SidebarSimple, Spinner } from '@phosphor-icons/react'
import { AppBar, EmmaMark } from '@/components/nds/app-bar'
import { AppShell, MainLayout, PageBody, PageHeader, PageLayout } from '@/components/nds/layouts'
import { PromptBar } from '@/components/nds/ai/conversational'
import { promptBar } from '@/mocks/ai-components'
import { ChatSidebar } from './sidebar'
import { THREAD_TURNS } from './data'
import type { ThreadTurn } from './data'

/**
 * Chat with sidebar and bubbles (Figma "Niural-AI", node 6479:45938) -
 * an in-progress thread once a session has real turns, sidebar visible
 * (with its own toggle). User bubbles use brand-base/brand-text (an
 * exact match to this design's own #f1ecff/#714dff); Emma's replies
 * carry no bubble at all, just her mark and plain text - the AI glow
 * only ever appears on the appbar's Ask Emma trigger, never in-thread.
 */
export function ChatThreadScreen({ state }: { state: 'reviewing' | 'followup' }) {
  const turns = state === 'followup' ? THREAD_TURNS : THREAD_TURNS.slice(0, 7)
  let userTurnCount = 0

  return (
    <AppShell>
      <AppBar activeItem="People" aiSelected tokenBalance={{ tokens: 12400 }} />
      <MainLayout>
        <ChatSidebar />
        <PageLayout>
          <PageHeader
            title="Ask Emma"
            actions={<SidebarSimple className="size-4.5 text-text-muted" />}
          />
          <PageBody className="mx-auto flex w-full max-w-[720px] flex-col gap-8 pb-6">
            {turns.map((turn, i) => {
              if (turn.kind === 'smart-action') {
                return <SmartActionCard key={i} turn={turn} />
              }
              if (turn.from === 'user') {
                userTurnCount += 1
                return <UserBubble key={i} showAvatar={userTurnCount === 1}>{turn.text}</UserBubble>
              }
              return (
                <EmmaTurn key={i} emphasis={i === 5}>
                  {turn.text}
                </EmmaTurn>
              )
            })}
          </PageBody>
          <div className="mx-auto w-full max-w-[720px] px-4 pb-6">
            <PromptBar sources={promptBar.sources} placeholder="Message Niural AI" />
          </div>
        </PageLayout>
      </MainLayout>
    </AppShell>
  )
}

function UserBubble({ children, showAvatar }: { children: React.ReactNode; showAvatar: boolean }) {
  return (
    <div className="flex items-end justify-end gap-2.5">
      <p className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-base px-3.5 py-2.5 text-paragraph-sm text-brand-text">
        {children}
      </p>
      {showAvatar ? (
        <span className="size-8 shrink-0 rounded-full bg-brand-muted" />
      ) : (
        <span className="size-8 shrink-0" />
      )}
    </div>
  )
}

function EmmaTurn({ children, emphasis }: { children: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <EmmaMark className={emphasis ? 'mt-0.5 size-7 shrink-0' : 'mt-0.5 size-6 shrink-0'} />
      <p className="min-w-0 flex-1 whitespace-pre-line text-paragraph-sm text-text-primary">{children}</p>
    </div>
  )
}

function SmartActionCard({ turn }: { turn: Extract<ThreadTurn, { kind: 'smart-action' }> }) {
  return (
    <div className="ml-[34px] flex items-center gap-3 rounded-xl bg-background-base p-3 shadow-card">
      <Spinner className="size-5 shrink-0 animate-spin text-text-muted" />
      <p className="min-w-0 flex-1 text-label-sm text-text-primary">{turn.label}</p>
      <button
        type="button"
        className="flex shrink-0 items-center gap-1 text-label-sm text-brand-text hover:underline"
      >
        {turn.buttonLabel}
        <ArrowUpRight className="size-4" />
      </button>
    </div>
  )
}
