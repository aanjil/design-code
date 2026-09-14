import { CaretDown, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Grain, type GrainProps } from './grain'

/**
 * Thread (docs/foundations/grain.md #component-taxonomy - "Shell: Prompt
 * bar, Thread, Canvas - one component, three densities"). This is that
 * second density, built out: the Shell docked to the side of a page
 * instead of the bottom, hosting a running conversation instead of one
 * grain. It sits directly above `<Shell>`'s own bar (which keeps doing
 * the composer's job) as a sibling card, not inside Shell's dock slot -
 * a conversation isn't a claim, so it doesn't borrow the claim-bar
 * chrome. Anything an agent surfaces *unprompted* while a thread is open
 * pins above the turns instead of injecting itself into the
 * conversation (`pinned`) - the transcript stays strictly
 * you -> Emma -> you.
 */

export interface ThreadTurn {
  from: 'user' | 'emma'
  text?: string
  /** An evidence-bearing reply renders through the same `<Grain>` a line-
   *  density Shell would dock - a thread is not a second design language
   *  for findings, just a second place to show them. */
  grain?: GrainProps
  className?: string
}

export interface PinnedInitiative {
  key: string
  grain: GrainProps
}

export function Thread({
  title,
  onCollapse,
  onClose,
  pinned = [],
  pinnedOverflow = 0,
  onDismissPinned,
  turns,
  height,
  className,
}: {
  title: string
  /** Sends the whole thing back down to the line-density bar (⌄). */
  onCollapse?: () => void
  onClose?: () => void
  pinned?: Array<PinnedInitiative>
  /** Additional pinned items beyond the two shown, rendered as "+N more
   *  waiting" - the pinned rail is allowed to queue, the thread is not. */
  pinnedOverflow?: number
  onDismissPinned?: () => void
  turns: Array<ThreadTurn>
  height?: number | string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border-highlight bg-background-base shadow-flyout',
        className,
      )}
      style={height != null ? { height } : undefined}
    >
      <div className="flex flex-none items-center gap-1 border-b border-border-highlight px-3 py-2.5">
        <b className="min-w-0 flex-1 truncate text-label-sm font-medium text-text-primary">{title}</b>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            title="Send back to the bar"
            aria-label="Collapse to bar"
            className="flex size-6.5 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
          >
            <CaretDown className="size-3.5" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-6.5 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {pinned.length > 0 && (
        <div className="flex-none border-b border-border-highlight">
          <div className="flex items-center gap-2 px-3 pt-2.5">
            <span className="font-mono text-[9px] font-semibold tracking-wide text-text-disabled">
              NEEDS YOU · {pinned.length + pinnedOverflow}
            </span>
            <span className="flex-1" />
            {onDismissPinned && (
              <button
                type="button"
                onClick={onDismissPinned}
                className="font-mono text-[9px] font-semibold tracking-wide text-text-muted transition-colors hover:text-text-primary"
              >
                DISMISS ALL
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5 p-2.5">
            {pinned.map((p) => (
              <Grain key={p.key} {...p.grain} />
            ))}
            {pinnedOverflow > 0 && (
              <div className="rounded-lg border border-dashed border-border-base p-2 text-center font-mono text-[10.5px] text-text-muted">
                +{pinnedOverflow} more waiting
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {turns.map((turn, i) => (
          <Turn key={i} turn={turn} />
        ))}
      </div>
      <p className="flex-none px-3 pb-2.5 text-center font-mono text-[9px] tracking-wide text-text-disabled">
        NEWEST BELOW · YOU OWN WHAT COMES NEXT
      </p>
    </div>
  )
}

function Turn({ turn }: { turn: ThreadTurn }) {
  if (turn.from === 'user') {
    return (
      <p
        className={cn(
          'max-w-[86%] self-end rounded-2xl rounded-br-sm bg-brand-base px-3 py-2 text-paragraph-sm text-brand-text',
          turn.className,
        )}
      >
        {turn.text}
      </p>
    )
  }
  return (
    <div className={cn('flex flex-col gap-2', turn.className)}>
      {turn.text && <p className="text-paragraph-sm text-text-primary">{turn.text}</p>}
      {turn.grain && <Grain {...turn.grain} />}
    </div>
  )
}
