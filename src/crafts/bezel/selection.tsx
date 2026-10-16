import { createContext, useContext, useEffect } from 'react'
import type { GrainFact } from '@/components/nds/grain/types'
import type { GrainProps } from '@/components/nds/grain/grain'

/**
 * Selection channel between a page's table and the one Bezel (Bezel doc:
 * "Bulk - selection count, actions, what the selection shares. Not a second
 * floating toolbar"). The page owns its checkboxes and describes what's
 * ticked; the Bezel owns how that reads - so any table becomes bulk-capable
 * by reporting rows, and the Bezel stays generic.
 */

export interface BezelRow {
  id: string
  /** Chip / fact label, e.g. "Anders Sato" or "Niural Pay - Sep 2026". */
  label: string
  /** Chip / fact value, e.g. "$180,000/yr" or "CAD 329.00". */
  value: string
  /** Fields the summary compares to find what the rows have in common. */
  facets: Record<string, string>
}

export interface BezelBulkAction {
  label: string
  icon?: React.ReactNode
  /** Runs the action; return the "acting" line the bar shows with its undo
   *  ring, or nothing when the action hands off to a page flow instead. */
  onSelect: () => string | void
}

export interface BezelSelection {
  /** Stable identity (kind + ids) - a change re-reads the selection. */
  key: string
  /** Singular noun for copy: "person", "invoice". */
  noun: string
  /** Plural, when it isn't noun + "s" ("people"). */
  nounPlural?: string
  rows: Array<BezelRow>
  /** Formatted total of the selection ("$412,000/yr", "USD 14,320.00"). */
  total: string
  /** What the selection shares - the line a plain bulk bar never has. */
  note: string
  actions: Array<BezelBulkAction>
  /** The grain Emma answers with when these rows travel as context. */
  answer: (question: string) => GrainProps
  clear: () => void
  remove: (id: string) => void
}

/* ---------------- shared-facet summary ---------------- */

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

/**
 * "all 3 are Remote - EU" / "2 of 3 are Niural fees" / "nothing in common
 * beyond the checkbox" - checks facets in the order given, strongest first.
 */
export function describeShared(rows: Array<BezelRow>, noun: string, phrase?: Record<string, (v: string) => string>): string {
  const n = rows.length
  if (n === 1) return `one ${noun} · ${Object.values(rows[0].facets).slice(0, 2).join(' · ')}`
  let best: { key: string; value: string; count: number } | null = null
  for (const key of Object.keys(rows[0]?.facets ?? {})) {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.facets[key], (counts.get(r.facets[key]) ?? 0) + 1)
    const [value, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    if (count === n) {
      const say = phrase?.[key]?.(value) ?? value
      return `${n === 2 ? 'both' : `all ${n}`} ${say}`
    }
    if (count > 1 && (!best || count > best.count)) best = { key, value, count }
  }
  if (best) return `${best.count} of ${n} ${phrase?.[best.key]?.(best.value) ?? best.value} · the rest differ`
  return `${plural(n, noun)} · nothing in common beyond the checkbox`
}

export function rowsAsFacts(rows: Array<BezelRow>, max = 6): Array<GrainFact> {
  const facts: Array<GrainFact> = rows.slice(0, max).map((r) => ({ label: r.label, value: r.value }))
  if (rows.length > max) facts.push({ label: `+${rows.length - max} more`, value: '', tone: 'muted' })
  return facts
}

/* ---------------- host context ---------------- */

export interface BezelHost {
  report: (selection: BezelSelection | null) => void
}

export const BezelHostContext = createContext<BezelHost | null>(null)

/**
 * A page reports its current selection (or null). Returns true when a Bezel
 * is listening - the page then hides its own bulk toolbar, since bulk is a
 * Bezel state there, not a second floating bar.
 */
export function useReportSelection(selection: BezelSelection | null): boolean {
  const host = useContext(BezelHostContext)
  // Every render: the host keeps the latest actions/closures, and only
  // re-renders itself when the selection's key changes.
  useEffect(() => {
    host?.report(selection)
  })
  useEffect(() => () => host?.report(null), [host])
  return host != null
}
