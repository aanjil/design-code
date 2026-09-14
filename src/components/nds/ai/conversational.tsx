import { useState } from 'react'
import {
  Microphone,
  Paperclip,
  PaperPlaneRight,
  Plus,
  Sparkle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ChatMessage, PromptSource } from '@/mocks/ai-components'

/**
 * Conversational input: where the user talks to the agent. Chat (tabbed
 * reply thread with reasoning chips), PromptBar (composer with sources +
 * attach/dictate/send), SelectionActions (floating toolbar on a text pick).
 */

export function Chat({
  tabs,
  activeTab,
  prompt,
  messages,
  placeholder = 'Ask a follow-up…',
  className,
}: {
  tabs: Array<string>
  activeTab?: string
  prompt: string
  messages: Array<ChatMessage>
  placeholder?: string
  className?: string
}) {
  const [tab, setTab] = useState(activeTab ?? tabs[0])
  const [draft, setDraft] = useState('')

  return (
    <div className={cn('flex flex-col rounded-xl bg-background-base shadow-card', className)}>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="px-3 pt-3">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 p-4">
        <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-background-muted px-3 py-2 text-paragraph-sm text-text-primary">
          {prompt}
        </p>
        {messages.map((message, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-background-highlight px-2 py-0.5 text-label-xs text-text-muted">
              <Sparkle weight="fill" className="size-3 text-brand-primary" />
              {message.reasoningLabel} · for {message.durationSeconds}s
            </span>
            <p className="text-paragraph-sm text-text-primary">{message.body}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border-highlight p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="h-9 min-w-0 flex-1 rounded-btn bg-background-base px-3 text-paragraph-sm text-text-primary shadow-button-gray transition-shadow outline-none placeholder:text-text-muted focus:shadow-border-focus"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Send message"
          disabled={!draft.trim()}
        >
          <PaperPlaneRight />
        </Button>
      </div>
    </div>
  )
}

export function PromptBar({
  sources,
  placeholder = 'Ask a question…',
  className,
}: {
  sources: Array<PromptSource>
  placeholder?: string
  className?: string
}) {
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full bg-background-base p-1.5 shadow-button-gray focus-within:shadow-border-focus',
        className,
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Add sources"
          title="Add sources"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-background-highlight hover:text-text-primary"
        >
          <Plus className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sources</DropdownMenuLabel>
            {sources.map((source) => (
              <DropdownMenuCheckboxItem
                key={source.label}
                checked={selected.has(source.label)}
                onCheckedChange={(checked) =>
                  setSelected((prev) => {
                    const next = new Set(prev)
                    if (checked) next.add(source.label)
                    else next.delete(source.label)
                    return next
                  })
                }
              >
                <span className="flex flex-col">
                  <span className="text-label-sm text-text-primary">{source.label}</span>
                  <span className="text-paragraph-xs text-text-muted">{source.description}</span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-8 min-w-0 flex-1 bg-transparent px-1 text-paragraph-sm text-text-primary outline-none placeholder:text-text-muted"
      />

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          aria-label="Attach file"
          title="Attach file"
          className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-background-highlight hover:text-text-primary"
        >
          <Paperclip className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Dictate"
          title="Dictate"
          className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-background-highlight hover:text-text-primary"
        >
          <Microphone className="size-4" />
        </button>
        <Button
          type="button"
          size="icon-sm"
          aria-label="Send"
          disabled={!value.trim()}
        >
          <PaperPlaneRight />
        </Button>
      </div>
    </div>
  )
}

function splitFirstSentence(text: string): [string, string] {
  const match = text.match(/^.*?[.!?](?:\s+|$)/)
  if (!match) return [text, '']
  return [match[0], text.slice(match[0].length)]
}

export function SelectionActions({
  text,
  actions,
  className,
}: {
  text: string
  actions: Array<string>
  className?: string
}) {
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [highlighted, rest] = splitFirstSentence(text)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-paragraph-sm text-text-primary">
        <mark className="rounded-sm bg-brand-muted px-0.5 text-text-primary">
          {highlighted}
        </mark>
        {rest}
      </p>
      <div className="flex w-fit flex-wrap items-center gap-1 rounded-full bg-background-base p-1 shadow-flyout">
        <Sparkle weight="fill" className="ml-1 size-3.5 shrink-0 text-brand-primary" />
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setActiveAction((cur) => (cur === action ? null : action))}
            className={cn(
              'rounded-full px-2.5 py-1 text-label-xs transition-colors',
              activeAction === action
                ? 'bg-brand-base text-brand-text'
                : 'text-text-muted hover:bg-background-highlight hover:text-text-primary',
            )}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}
