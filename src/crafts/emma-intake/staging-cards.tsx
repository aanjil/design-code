import { useState } from 'react'
import { CheckCircle, LinkSimple, PencilSimple, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import type { IntakeCard, IntakeField, IntakeScenario } from '@/mocks/emma-intake'

/**
 * The "receipt" - key-value cards, not a form. Confirmed/warning fields show
 * a status dot and reveal a pencil on hover (inline-edit popover);
 * empty-required fields render as an empty select right inside the card.
 * Clicking a value with a `blockId` hands off to the document viewer.
 */
export function StagingCards({
  scenario,
  overrides,
  onFieldFocus,
  onFieldEdit,
}: {
  scenario: IntakeScenario
  overrides: Record<string, string>
  onFieldFocus: (blockId: string) => void
  onFieldEdit: (fieldId: string, value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {scenario.dedupe && (
        <div className="flex items-start gap-2 rounded-lg bg-background-info-highlight p-3">
          <LinkSimple weight="fill" className="mt-px size-4 shrink-0 text-text-info-base" />
          <p className="text-paragraph-xs text-text-info-base">{scenario.dedupe.message}</p>
        </div>
      )}
      {scenario.cards.map((card) => (
        <StagingCardView
          key={card.id}
          card={card}
          overrides={overrides}
          onFieldFocus={onFieldFocus}
          onFieldEdit={onFieldEdit}
        />
      ))}
    </div>
  )
}

export function StagingCardView({
  card,
  overrides,
  onFieldFocus,
  onFieldEdit,
}: {
  card: IntakeCard
  overrides: Record<string, string>
  onFieldFocus: (blockId: string) => void
  onFieldEdit: (fieldId: string, value: string) => void
}) {
  return (
    <div className="rounded-xl bg-background-base p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-label-sm text-text-primary">{card.title}</p>
        {card.badge && (
          <span className="rounded-full bg-brand-muted px-2 py-0.5 text-caption-md text-brand-text">
            {card.badge}
          </span>
        )}
      </div>
      <div className="flex flex-col divide-y divide-border-muted">
        {card.fields.map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            value={overrides[field.id] ?? field.value}
            onFocus={() => field.blockId && onFieldFocus(field.blockId)}
            onEdit={(v) => onFieldEdit(field.id, v)}
          />
        ))}
      </div>
    </div>
  )
}

function FieldRow({
  field,
  value,
  onFocus,
  onEdit,
}: {
  field: IntakeField
  value: string
  onFocus: () => void
  onEdit: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (field.status === 'empty-required') {
    return (
      <div className="flex items-center justify-between gap-3 py-2.5">
        <span className="text-label-xs text-text-muted">{field.label}</span>
        {value ? (
          <span className="text-paragraph-sm text-text-primary">{value}</span>
        ) : (
          <select
            defaultValue=""
            onChange={(e) => onEdit(e.target.value)}
            className="h-8 rounded-md border border-dashed border-border-base bg-background-highlight px-2 text-label-xs text-text-muted outline-none focus:border-brand-primary focus:text-text-primary"
          >
            <option value="" disabled>
              Select {field.label}
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }

  return (
    <div className="group flex items-center justify-between gap-3 py-2.5">
      <span className="text-label-xs text-text-muted">{field.label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onFocus}
          disabled={!field.blockId}
          className={cn(
            'text-right text-paragraph-sm text-text-primary',
            field.mono && 'font-mono text-mono-sm',
            field.blockId && 'underline-offset-2 hover:text-brand-text hover:underline',
          )}
        >
          {value}
        </button>
        {field.status === 'warning' && (
          <span title={field.note} className="flex items-center text-text-warning-base">
            <Warning weight="fill" className="size-3.5" />
          </span>
        )}
        {field.status === 'confirmed' && (
          <CheckCircle weight="fill" className="size-3.5 shrink-0 text-text-success-base" />
        )}
        <Popover open={editing} onOpenChange={setEditing}>
          <PopoverTrigger
            aria-label={`Edit ${field.label}`}
            className="text-text-disabled opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-primary"
          >
            <PencilSimple className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="end">
            <div className="flex flex-col gap-2">
              <label className="text-label-xs text-text-primary">{field.label}</label>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-8 rounded-md bg-background-base px-2 text-paragraph-sm shadow-button-gray outline-none focus:shadow-border-focus"
              />
              <Button
                size="sm"
                onClick={() => {
                  onEdit(draft)
                  setEditing(false)
                }}
              >
                <span className="px-1">Save</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
