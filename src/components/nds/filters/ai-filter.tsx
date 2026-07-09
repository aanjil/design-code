import { useState } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/**
 * Prompt-to-filters entry. Mock "Emma" — parsing is deterministic keyword
 * matching (see parsePromptToConditions); no network. Returns how many
 * conditions the prompt produced so the UI can react.
 */
export function AiFilter({
  onApplyPrompt,
}: {
  onApplyPrompt: (prompt: string) => number
}) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [noMatch, setNoMatch] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    const matched = onApplyPrompt(prompt)
    if (matched === 0) {
      setNoMatch(true)
      return
    }
    setPrompt('')
    setNoMatch(false)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1 rounded-md px-2 text-label-sm text-brand-text transition-colors hover:bg-brand-base"
      >
        <Sparkle className="size-4" weight="fill" />
        <span className="px-1">AI filter</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-9 w-[360px] items-center gap-1 rounded-md bg-background-base py-1 pr-1 pl-2 shadow-button-gray transition-shadow focus-within:shadow-ai"
    >
      <Sparkle className="size-4 shrink-0 text-brand-primary" weight="fill" />
      <input
        autoFocus
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value)
          setNoMatch(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder={
          noMatch
            ? 'Nothing matched — try a job title, location, type…'
            : 'Try “EOR account executives in London hired in 2024”'
        }
        className="min-w-0 flex-1 bg-transparent px-1 text-paragraph-sm text-text-primary outline-none placeholder:text-text-muted"
      />
      <Button size="sm" type="submit">
        <span className="px-1">Apply</span>
      </Button>
    </form>
  )
}
