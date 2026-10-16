import type { Icon } from '@phosphor-icons/react'
import {
  CheckCircle,
  Minus,
  MinusCircle,
  Plus,
  Sliders,
  Sparkle,
  Warning,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { SelectField } from '@/components/nds/select-field'
import { Button } from '@niural/components'
import { cn } from '@/lib/utils'
import {
  approvalQuestion,
  fineTune,
  recommendation,
  type ConfidenceLevel,
} from '@/mocks/ai-components'

/**
 * Decisions & human-in-the-loop: cards where the agent blocks on a human
 * call instead of acting alone. Siblings of `EmmaCard` (feedback.tsx) -
 * same elevation-ai glow + brand Sparkle header, different bodies.
 */

export function ApprovalCard({ className }: { className?: string }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className={cn('rounded-xl bg-base p-4 elevation-ai', className)}>
      <div className="flex items-center gap-1.5">
        <Sparkle weight="fill" className="size-4 text-brand-primary" />
        <p className="text-label-xsmall text-brand">Emma · Needs your call</p>
      </div>
      <p className="mt-1.5 text-paragraph-small text-primary">
        {approvalQuestion.question}
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {approvalQuestion.options.map((option) => {
          const isSelected = option === selected
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              className={cn(
                'flex h-9 items-center justify-between rounded-lg px-3 text-left text-label-small transition-colors',
                isSelected
                  ? 'bg-brand-base text-brand borders-shadow'
                  : 'bg-base text-primary borders-base hover:bg-highlight',
                selected && !isSelected && 'opacity-60',
              )}
            >
              <span className="truncate">{option}</span>
              {isSelected && (
                <CheckCircle
                  weight="fill"
                  className="size-4 shrink-0 text-brand-primary"
                />
              )}
            </button>
          )
        })}
      </div>
      {selected && (
        <p className="mt-3 text-paragraph-xsmall text-muted">
          Got it - defaulting new hires to {selected}.
        </p>
      )}
    </div>
  )
}

const CONFIDENCE: Record<
  ConfidenceLevel,
  { label: string; wrap: string; text: string; icon: Icon }
> = {
  high: {
    label: 'High confidence',
    wrap: 'bg-success-highlight',
    text: 'text-success',
    icon: CheckCircle,
  },
  'needs-review': {
    label: 'Needs review',
    wrap: 'bg-warning-highlight',
    text: 'text-warning',
    icon: Warning,
  },
  'no-signal': {
    label: 'No signal',
    wrap: 'bg-muted',
    text: 'text-muted',
    icon: MinusCircle,
  },
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const c = CONFIDENCE[level]
  const ConfidenceIcon = c.icon
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2',
        c.wrap,
        c.text,
      )}
    >
      <ConfidenceIcon weight="fill" className="size-3.5" />
      <span className="text-label-xsmall">{c.label}</span>
    </span>
  )
}

export function RecommendationCard({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [accepted, setAccepted] = useState(false)

  return (
    <div className={cn('rounded-xl bg-base p-4 elevation-ai', className)}>
      <div className="flex items-center gap-1.5">
        <Sparkle weight="fill" className="size-4 text-brand-primary" />
        <p className="text-label-xsmall text-brand">Emma · Recommendation</p>
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className="text-paragraph-small text-primary">{recommendation.title}</p>
        <ConfidenceBadge level={recommendation.confidence} />
      </div>
      <p className="mt-1 text-paragraph-xsmall text-muted">{recommendation.detail}</p>

      {expanded && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-base pt-3">
          {recommendation.alternatives.map((alt) => (
            <div
              key={alt.label}
              className="flex items-center justify-between gap-3 rounded-lg bg-highlight px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-paragraph-xsmall text-primary">
                {alt.label}
              </span>
              <ConfidenceBadge level={alt.confidence} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={accepted}
          onClick={() => setAccepted(true)}
        >
          {accepted ? 'Accepted' : 'Accept'}
        </Button>
        <Button
          type="button"
          variant="solid"
          shade="neutral"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Hide alternatives' : 'Alternatives'}
        </Button>
      </div>
    </div>
  )
}

function NumberStepper({
  label,
  value,
  onChange,
  step = 4,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-caption-sm text-muted">{label}</label>
      <div className="flex h-8 items-center rounded-lg bg-highlight borders-base">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, value - step))}
          className="flex h-full w-7 shrink-0 items-center justify-center text-muted hover:text-primary"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="flex-1 text-center tabular-nums text-paragraph-xsmall text-primary">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + step)}
          className="flex h-full w-7 shrink-0 items-center justify-center text-muted hover:text-primary"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function FineTuneCard({ className }: { className?: string }) {
  const [width, setWidth] = useState(fineTune.width)
  const [height, setHeight] = useState(fineTune.height)
  const [radius, setRadius] = useState(fineTune.radius)
  const [opacity, setOpacity] = useState(fineTune.opacity)
  const [type, setType] = useState(fineTune.types[0])

  return (
    <div className={cn('rounded-xl bg-base p-4 card', className)}>
      <div className="flex items-center gap-1.5">
        <Sliders weight="bold" className="size-4 text-muted" />
        <p className="text-label-xsmall text-primary">{fineTune.targetLabel}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <p className="text-label-xsmall text-muted">Layout</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <NumberStepper label="W" value={width} onChange={setWidth} />
            <NumberStepper label="H" value={height} onChange={setHeight} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-label-xsmall text-muted">Radius</label>
          <input
            type="number"
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            className="h-8 w-20 rounded-lg bg-highlight px-2.5 text-right tabular-nums text-paragraph-xsmall text-primary borders-base outline-none focus:borders-focus [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-label-xsmall text-muted">Opacity</label>
            <span className="tabular-nums text-paragraph-xsmall text-primary">{opacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
            className="mt-1.5 w-full accent-brand"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-label-xsmall text-muted">Type</label>
          <SelectField
            value={type}
            options={fineTune.types}
            onChange={setType}
            className="w-32"
          />
        </div>
      </div>
    </div>
  )
}
