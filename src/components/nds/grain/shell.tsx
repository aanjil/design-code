import { useState } from 'react'
import { Microphone, PaperPlaneRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/playground/kbd'
import { Grain, type GrainProps } from './grain'
import { StatusDot, type BarDotTone } from './bar'

export type FloaterSize = 'pill' | 'default'

export type BezelAmbient = 'quiet' | 'attention' | 'tension' | 'focus' | 'scanning' | 'working'

/**
 * The Bezel's surface (docs: Bezel, grain v2.0) - glass over the page with a
 * hairline ring and a soft lifted shadow, all from fe-pkg elevation vars.
 * Shared by the horizontal bar (Shell variant="bezel") and the vertical
 * rail, so both orientations read as the same object.
 */
export const BEZEL_SURFACE =
  'bg-base/88 backdrop-blur-xl backdrop-saturate-150 shadow-[0_0_0_0.5px_var(--elevation-alpha-16),0_1px_2px_var(--elevation-alpha-8),0_14px_36px_-10px_var(--elevation-alpha-24)]'

/** D-11: the AI gradient marks territory - a hairline on the bar's edge. */
export function TerritoryRule({ vertical, side }: { vertical?: boolean; side?: 'start' | 'end' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute bg-niural-ai-colors-gradient opacity-80',
        vertical ? cn('inset-y-7 w-px', side === 'end' ? 'right-0' : 'left-0') : 'inset-x-8 top-0 h-px',
      )}
    />
  )
}

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
  variant = 'default',
  ambient,
  rowClassName,
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
  tone?: 'light' | 'dark' | 'ai'
  /** 'bezel' = the polished floating surface (glass, AI territory rule,
   *  54px row, AI-gradient fill for tone 'ai'). Docs callers keep 'default'. */
  variant?: 'default' | 'bezel'
  /** Bezel only: how present the ambient aura is. quiet = barely there,
   *  attention = something found, tension = a warm, low-confidence glow,
   *  focus = you're typing/selecting, scanning = sweep, working = Emma is doing. */
  ambient?: BezelAmbient
  /** Bezel only: overrides the 54px row (e.g. the minimal pill's height). */
  rowClassName?: string
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
          'inline-flex shrink-0 items-center gap-2.5 rounded-full bg-base px-3 py-2 shadow-[0_0_0_2px_var(--elevation-alpha-brand-11),0_2px_3px_-2px_var(--elevation-alpha-brand-48)] transition-shadow hover:borders-base',
          className,
        )}
      >
        <span className="text-paragraph-small text-primary">{label}</span>
        <span className="flex items-center gap-1">
          <Kbd className="rounded-snug">⌘</Kbd>
          <Kbd className="rounded-snug">{shortcut}</Kbd>
        </span>
      </button>
    )
  }

  if (variant === 'bezel') {
    const aura = ambient ?? (tone === 'ai' ? 'working' : progress != null ? 'scanning' : 'quiet')
    return (
      // Outer box carries the ambient aura (it must spill outside the bar);
      // the inner box clips content to the bar's shape.
      <div className={cn('bezel-enter relative w-full', className)}>
        <span aria-hidden data-aura={aura} className="bezel-aura" />
        <div
          className={cn(
            'relative h-full overflow-hidden transition-[border-radius] duration-300',
            docked ? 'rounded-2xl' : 'rounded-[27px]',
            tone === 'ai' ? 'bezel-fill text-on-color shadow-[0_14px_36px_-10px_var(--elevation-alpha-brand-48)]' : BEZEL_SURFACE,
          )}
        >
          {/* Territory (Bezel doc D-11): the AI gradient as the bar's ring. */}
          {tone !== 'ai' && <span aria-hidden data-aura={aura} className="bezel-ring" />}
          {docked && (grain ? <Grain {...grain} className="rounded-none border-0" /> : dock)}
          <div
            className={cn(
              'relative flex h-[54px] items-center gap-2.5 pr-2.5 pl-4 transition-[height,padding] duration-[460ms] ease-[cubic-bezier(.22,1,.36,1)]',
              docked && 'border-t border-(--border-highlight)',
              rowClassName,
            )}
          >
            {status && <StatusDot tone={status.tone} pulse={status.pulse} />}
            {row}
          </div>
          {progress != null && (
            <div className="absolute inset-x-0 bottom-0 h-[2px]">
              <div
                className="h-full bg-niural-ai-colors-gradient transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full max-w-[420px] overflow-hidden border transition-[border-radius]',
        docked ? 'rounded-xl' : 'rounded-full',
        tone === 'dark'
          ? 'border-(--text-base) bg-(--text-base) card'
          : off
            ? 'border-base bg-base borders-base'
            : docked
              ? 'border-(--text-base) bg-base card'
              : 'border-transparent bg-base shadow-[0_0_0_2px_var(--elevation-alpha-brand-11),0_2px_3px_-2px_var(--elevation-alpha-brand-48)]',
        className,
      )}
    >
      {docked && (grain ? <Grain {...grain} className="rounded-none border-0" /> : dock)}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5',
          docked && 'border-t border-base',
          tone === 'dark' && 'text-(--background-base)',
        )}
      >
        {status && <StatusDot tone={status.tone} pulse={status.pulse} />}
        {row ?? (
          <>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={off ? 'Search' : placeholder}
              className="h-8 min-w-0 flex-1 bg-transparent text-paragraph-small text-primary outline-none placeholder:text-muted"
            />
            {!off && !value.trim() ? (
              <button
                type="button"
                aria-label="Use voice"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-highlight hover:text-primary"
              >
                <Microphone className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send"
                disabled={!value.trim()}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-on-color disabled:opacity-40',
                  off ? 'bg-(--text-disabled)' : 'bg-(--text-base)',
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
            className="h-full bg-(--text-base) transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
