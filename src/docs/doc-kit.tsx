import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { cn } from '@/lib/utils'

/**
 * Primitives for the NDS docs pages. Swatches measure their own resolved
 * color at runtime, so values stay truthful per theme (light/dark).
 */

/* one shared observer for html.class theme flips */
let themeVersion = 0
const themeListeners = new Set<() => void>()
let observerStarted = false
function subscribeTheme(cb: () => void) {
  themeListeners.add(cb)
  if (!observerStarted && typeof window !== 'undefined') {
    observerStarted = true
    new MutationObserver(() => {
      themeVersion++
      themeListeners.forEach((l) => l())
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }
  return () => {
    themeListeners.delete(cb)
  }
}
export function useThemeVersion(): number {
  return useSyncExternalStore(
    subscribeTheme,
    () => themeVersion,
    () => 0,
  )
}

function fmtColor(c: string): string {
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) return c
  const parts = m[1].split(',').map((s) => parseFloat(s))
  const [r, g, b] = parts
  const a = parts[3]
  const hex = `#${[r, g, b]
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')}`
  return a !== undefined && a < 1 ? `${hex} · ${Math.round(a * 100)}%` : hex
}

export function DocPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <article className="pb-16">
      <h1 className="text-title-h4 text-text-primary">{title}</h1>
      <p className="mt-2 max-w-[560px] text-paragraph-sm text-text-muted">
        {description}
      </p>
      <div className="mt-10 flex flex-col gap-12">{children}</div>
    </article>
  )
}

export function DocSection({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-title-h5 text-text-primary">{title}</h2>
      {note && (
        <p className="mt-1 max-w-[560px] text-paragraph-xs text-text-muted">
          {note}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export interface SwatchDef {
  /** Token name as written in colors.md, e.g. "background-muted" */
  name: string
  /** Literal utility class painting the token, e.g. "bg-background-muted" */
  cls: string
}

export function Swatch({ name, cls }: SwatchDef) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const version = useThemeVersion()

  useLayoutEffect(() => {
    if (!ref.current) return
    setValue(fmtColor(getComputedStyle(ref.current).backgroundColor))
  }, [version, cls])

  return (
    <div className="min-w-0">
      <div
        ref={ref}
        className={cn('h-14 rounded-lg shadow-button-gray', cls)}
      />
      <p className="mt-1.5 truncate text-caption-md text-text-primary">
        {name}
      </p>
      <p className="truncate font-mono text-caption text-text-muted">
        {value}
      </p>
    </div>
  )
}

export function SwatchGrid({ tokens }: { tokens: Array<SwatchDef> }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-5">
      {tokens.map((t) => (
        <Swatch key={t.name} {...t} />
      ))}
    </div>
  )
}

export function SpecTable({
  head,
  rows,
}: {
  head: Array<string>
  rows: Array<Array<React.ReactNode>>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-base">
            {head.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-label-xs text-text-muted first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border-highlight">
              {cells.map((c, j) => (
                <td
                  key={j}
                  className="px-3 py-2.5 text-paragraph-sm text-text-primary first:pl-0"
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-background-highlight px-1.5 py-px font-mono text-mono-xs text-text-primary">
      {children}
    </code>
  )
}

/* ---------------- component docs (storybook-style) ---------------- */

/** Live preview box. `wide` scrolls horizontally for full-width comps. */
export function Specimen({
  label,
  wide,
  className,
  children,
}: {
  label?: string
  /** Content wider than the docs column scrolls inside the box. */
  wide?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <figure className="min-w-0">
      <div

        className={cn(
          'rounded-xl bg-surface-1 p-5 shadow-border-base',
          wide && 'overflow-x-auto',
          className,
        )}
      >
        {children}
      </div>
      {label && (
        <figcaption className="mt-1.5 text-caption-md text-text-muted">
          {label}
        </figcaption>
      )}
    </figure>
  )
}

export interface PropDef {
  name: string
  type: string
  default?: string
  description: string
}

/**
 * Numbered showcase section - one component per full-width bordered panel,
 * index + title + inline description above it. Distinct from DocSection/Specimen
 * (grid-of-cards docs) for pages that read as a sequential catalog instead.
 */
export function ShowcaseSection({
  index,
  title,
  description,
  wide,
  variants,
  props,
  children,
}: {
  index: number
  title: string
  description: string
  /** Demo content fills the panel width instead of centering (wide tables). */
  wide?: boolean
  /** Centered control row in its own strip under the demo (e.g. variant pills). */
  variants?: React.ReactNode
  /** Rendered below the panel - typically a PropsTable. */
  props?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-dashed border-border-muted pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-mono-xs text-text-disabled">
          {String(index).padStart(2, '0')}
        </span>
        <h2 className="text-title-h5 text-text-primary">{title}</h2>
        <span className="text-paragraph-xs text-text-muted">{description}</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border-base bg-surface-1">
        <div
          className={cn(
            'min-h-[220px] p-8',
            wide ? 'overflow-x-auto' : 'flex items-center justify-center',
          )}
        >
          {children}
        </div>
        {variants && (
          <div className="flex justify-center border-t border-border-muted p-3">
            {variants}
          </div>
        )}
      </div>
      {props && <div className="mt-4">{props}</div>}
    </section>
  )
}

export function VariantPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<T>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-background-base p-1 shadow-button-gray">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-full px-3 py-1 text-label-xs capitalize transition-colors',
            opt === value
              ? 'bg-background-highlight text-text-primary shadow-button-gray'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function PropsTable({ props }: { props: Array<PropDef> }) {
  return (
    <SpecTable
      head={['Prop', 'Type', 'Default', 'Description']}
      rows={props.map((p) => [
        <InlineCode key="n">{p.name}</InlineCode>,
        <span key="t" className="font-mono text-mono-xs text-text-muted">
          {p.type}
        </span>,
        p.default ? <InlineCode key="d">{p.default}</InlineCode> : '-',
        <span key="x" className="text-paragraph-xs">
          {p.description}
        </span>,
      ])}
    />
  )
}
