import { useState } from 'react'
import { Microphone, PaperPlaneRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/playground/kbd'
import { Grain, type GrainProps } from './grain'
import { StatusDot, type BarDotTone } from './bar'

export type FloaterSize = 'pill' | 'default'

/**
 * Shell (docs/foundations/grain.md #shell) - the Floater isn't a separate
 * component in this language, it is the Shell at line density, docked to a
 * page, hosting exactly one grain. Which grain depends on what was found;
 * the prompt bar underneath never moves. Two sizes, both idle-only (Figma
 * "Grain" file): `pill` collapses to a launcher ("Ask Emma ⌘E"); `default`
 * is the full composer. Once a grain docks, the shell always renders at
 * `default` regardless of `size` - a launcher can't host evidence.
 *
 * `dock`/`row` generalize the two docs/controller call sites above (which
 * only ever pass `grain`) so the same one component can also carry a
 * bulk-selection summary, a context-chip rail, a scanning/voice/run-in-
 * flight bar, or a stamped "acting" record - none of that is a new shape,
 * just different content in the same two slots. Existing callers that
 * only pass `grain` render byte-for-byte as before.
 */
export function Shell({
  size = 'default',
  grain,
  dock,
  label = 'Ask Emma',
  shortcut = 'E',
  placeholder = 'Ask a question…',
  off = false,
  onExpand,
  row,
  status,
  progress,
  tone = 'light',
  className,
}: {
  size?: FloaterSize
  /** The one grain currently docked - omit while scanning (process layer
   *  only) or when nothing was found. */
  grain?: GrainProps
  /** Non-grain content docked above the bar - a bulk-selection summary
   *  isn't a claim, so it docks as raw content instead of through
   *  `<Grain>`. Ignored when `grain` is also given. */
  dock?: React.ReactNode
  /** Pill-size launcher label, e.g. "Ask Emma". */
  label?: string
  /** Pill-size ⌘-shortcut letter shown after `label`. */
  shortcut?: string
  placeholder?: string
  /** Emma unavailable: degrades to the page's own plain search input.
   *  Nothing else about the page changes - ship-gate question 3. */
  off?: boolean
  /** Fires when the collapsed pill launcher is clicked - the caller owns
   *  size state and flips it to 'default' in response. */
  onExpand?: () => void
  /** Replaces the default input + mic/send row entirely - for scanning,
   *  voice, bulk-selection and run-in-flight bars. The row keeps its
   *  height/padding; only its content changes. Omit for the default
   *  composer input. */
  row?: React.ReactNode
  /** A small leading status dot - omitted (the default) renders nothing,
   *  matching every existing call site. */
  status?: { tone?: BarDotTone; pulse?: boolean }
  /** 0-100 - a hairline bar under the shell filling left to right, for a
   *  process-layer scan with no claim yet. */
  progress?: number
  /** 'dark' inverts the bar to `grain-ink` - the one state where the
   *  shell itself asserts something (a run in flight), not a grain. */
  tone?: 'light' | 'dark'
  className?: string
}) {
  const [value, setValue] = useState('')
  const docked = !off && (!!grain || !!dock)

  if (!off && size === 'pill' && !docked) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className={cn(
          'inline-flex shrink-0 items-center gap-2.5 rounded-full bg-background-base px-3 py-2 shadow-floater transition-shadow hover:shadow-button-gray',
          className,
        )}
      >
        <span className="text-paragraph-sm text-text-primary">{label}</span>
        <span className="flex items-center gap-1">
          <Kbd className="rounded-kbd">⌘</Kbd>
          <Kbd className="rounded-kbd">{shortcut}</Kbd>
        </span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        'w-full max-w-[420px] overflow-hidden border transition-[border-radius]',
        docked ? 'rounded-xl' : 'rounded-full',
        tone === 'dark'
          ? 'border-grain-ink bg-grain-ink shadow-card'
          : off
            ? 'border-border-base bg-background-base shadow-border-base'
            : docked
              ? 'border-grain-ink bg-background-base shadow-card'
              : 'border-transparent bg-background-base shadow-floater',
        className,
      )}
    >
      {docked && (grain ? <Grain {...grain} className="rounded-none border-0" /> : dock)}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5',
          docked && 'border-t border-border-highlight',
          tone === 'dark' && 'text-grain-ink-foreground',
        )}
      >
        {status && <StatusDot tone={status.tone} pulse={status.pulse} />}
        {row ?? (
          <>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={off ? 'Search' : placeholder}
              className="h-8 min-w-0 flex-1 bg-transparent text-paragraph-sm text-text-primary outline-none placeholder:text-text-muted"
            />
            {!off && !value.trim() ? (
              <button
                type="button"
                aria-label="Use voice"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
              >
                <Microphone className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send"
                disabled={!value.trim()}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-text-on-color disabled:opacity-40',
                  off ? 'bg-text-disabled' : 'bg-grain-ink',
                )}
              >
                <PaperPlaneRight className="size-3.5" />
              </button>
            )}
          </>
        )}
      </div>
      {progress != null && (
        <div className="h-[2px] w-full bg-transparent">
          <div
            className="h-full bg-grain-ink transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
