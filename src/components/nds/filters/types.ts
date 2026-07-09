import type { Icon } from '@phosphor-icons/react'

/** A filterable attribute: drives the Filter menu, chips, and AI parsing. */
export interface FilterFieldDef {
  id: string
  label: string
  icon: Icon
  options: Array<string>
  /** Extra lowercase synonyms the AI prompt parser maps to an option. */
  synonyms?: Record<string, string>
}

export interface FilterCondition {
  fieldId: string
  /** 'is' for one value, 'is-any-of' when several are selected */
  operator: 'is' | 'is-any-of'
  values: Array<string>
}

export function makeCondition(
  fieldId: string,
  values: Array<string>,
): FilterCondition {
  return {
    fieldId,
    operator: values.length > 1 ? 'is-any-of' : 'is',
    values,
  }
}

export function conditionSummary(condition: FilterCondition): string {
  const [first, ...rest] = condition.values
  if (!first) return '—'
  if (rest.length === 0) return first
  if (rest.length === 1) return `${first}, ${rest[0]}`
  return `${first} +${rest.length}`
}

/** Merge/replace one field's condition inside a condition list. */
export function upsertCondition(
  conditions: Array<FilterCondition>,
  fieldId: string,
  values: Array<string>,
): Array<FilterCondition> {
  const without = conditions.filter((c) => c.fieldId !== fieldId)
  if (values.length === 0) return without
  const existing = conditions.find((c) => c.fieldId === fieldId)
  const next = makeCondition(fieldId, values)
  if (!existing) return [...without, next]
  return conditions.map((c) => (c.fieldId === fieldId ? next : c))
}

/**
 * Deterministic mock "AI" — maps prompt words onto field options and
 * synonyms. No network; good enough to demo the interaction.
 */
export function parsePromptToConditions(
  prompt: string,
  fields: Array<FilterFieldDef>,
): Array<FilterCondition> {
  const text = ` ${prompt.toLowerCase()} `
  const conditions: Array<FilterCondition> = []

  for (const field of fields) {
    const hits = new Set<string>()
    for (const option of field.options) {
      if (text.includes(option.toLowerCase())) hits.add(option)
    }
    for (const [synonym, option] of Object.entries(field.synonyms ?? {})) {
      if (text.includes(synonym.toLowerCase())) hits.add(option)
    }
    if (hits.size > 0) conditions.push(makeCondition(field.id, [...hits]))
  }
  return conditions
}
