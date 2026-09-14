import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { IntakeCard, TimelineStep } from '@/mocks/emma-intake'
import { ExtractionScanner } from './extraction-scanner'
import { StagingCardView } from './staging-cards'

/**
 * Trust-building processing state: an animated document scanner (left) next
 * to a streaming timeline (right). As each step lands, its narration fades
 * in; steps that produce data materialize that card right there in the
 * timeline - already previewable/editable - instead of waiting for a
 * separate staging screen. Auto-advances once the script finishes;
 * "Skip ahead" short-circuits for review speed.
 */
export function XRayView({
  filename,
  timeline,
  cards,
  overrides,
  onFieldFocus,
  onFieldEdit,
  onDone,
}: {
  filename: string
  timeline: Array<TimelineStep>
  cards: Array<IntakeCard>
  overrides: Record<string, string>
  onFieldFocus: (blockId: string) => void
  onFieldEdit: (fieldId: string, value: string) => void
  onDone: () => void
}) {
  const [visibleCount, setVisibleCount] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    setVisibleCount(0)
    const timers = timeline.map((step, i) =>
      setTimeout(
        () => setVisibleCount((v) => Math.max(v, i + 1)),
        step.atSeconds * 1000,
      ),
    )
    const finishAt = (timeline[timeline.length - 1]?.atSeconds ?? 0) * 1000 + 1800
    const finishTimer = setTimeout(() => {
      if (doneRef.current) return
      doneRef.current = true
      onDone()
    }, finishAt)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(finishTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename])

  function handleSkip() {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  return (
    <div className="grid h-full gap-6 md:grid-cols-2">
      <div className="min-h-[380px]">
        <ExtractionScanner
          statusText={timeline[Math.max(0, visibleCount - 1)]?.text ?? timeline[0]?.text ?? ''}
        />
      </div>

      <div className="flex min-h-[380px] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex items-center gap-1.5">
          <Sparkle weight="fill" className="size-4 text-brand-primary" />
          <p className="text-label-sm text-brand-text">Emma is reading {filename}</p>
        </div>
        <ol className="flex flex-col gap-4">
          {timeline.map((step, i) => {
            const visible = i < visibleCount
            const active = i === visibleCount - 1
            const done = i < visibleCount - 1
            return (
              <li
                key={step.text}
                className={cn(
                  'flex flex-col gap-2.5 transition-opacity duration-300',
                  visible ? 'opacity-100' : 'opacity-0',
                )}
              >
                <div className="flex items-center gap-2.5">
                  {done ? (
                    <CheckCircle
                      weight="fill"
                      className="size-4 shrink-0 text-text-success-base"
                    />
                  ) : (
                    <span
                      className={cn(
                        'size-4 shrink-0 rounded-full border-2 border-brand-primary/30',
                        active && 'animate-spin border-t-brand-primary',
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      'text-paragraph-sm',
                      active ? 'text-text-primary' : 'text-text-muted',
                    )}
                  >
                    {step.text}
                  </span>
                </div>

                {visible &&
                  (step.producesCardIds ?? []).map((cardId) => {
                    const card = cards.find((c) => c.id === cardId)
                    if (!card) return null
                    return (
                      <div
                        key={cardId}
                        className="ml-[26px] animate-in fade-in slide-in-from-top-2 duration-500"
                      >
                        <StagingCardView
                          card={card}
                          overrides={overrides}
                          onFieldFocus={onFieldFocus}
                          onFieldEdit={onFieldEdit}
                        />
                      </div>
                    )
                  })}
              </li>
            )
          })}
        </ol>
        <button
          type="button"
          onClick={handleSkip}
          className="self-start text-label-xs text-text-muted underline-offset-2 transition-colors hover:text-text-primary hover:underline"
        >
          Skip ahead
        </button>
      </div>
    </div>
  )
}
