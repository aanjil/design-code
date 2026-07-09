import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * Annotation kit — numbered design notes pinned to real UI.
 * Wrap any element in <Annotate n={…} title="…" note="…"> inside an
 * ExperimentFrame. Markers toggle with the frame switch or the `a` key;
 * the notes panel lists everything and can scroll-locate each marker.
 */

export interface AnnotationEntry {
  n: number
  title: string
  note: string
}

interface AnnotationsCtx {
  enabled: boolean
  setEnabled: (value: boolean) => void
  entries: Array<AnnotationEntry>
  register: (entry: AnnotationEntry, el: HTMLElement | null) => void
  unregister: (n: number) => void
  focusNote: (n: number) => void
}

const Ctx = createContext<AnnotationsCtx | null>(null)

export function useAnnotations(): AnnotationsCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error(
      '<Annotate> and annotation controls must be rendered inside an <ExperimentFrame>.',
    )
  }
  return ctx
}

export function AnnotationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [enabled, setEnabled] = useState(true)
  const [entryMap, setEntryMap] = useState<Map<number, AnnotationEntry>>(
    () => new Map(),
  )
  const els = useRef<Map<number, HTMLElement>>(new Map())

  const register = useCallback(
    (entry: AnnotationEntry, el: HTMLElement | null) => {
      setEntryMap((prev) => new Map(prev).set(entry.n, entry))
      if (el) els.current.set(entry.n, el)
    },
    [],
  )

  const unregister = useCallback((n: number) => {
    setEntryMap((prev) => {
      const next = new Map(prev)
      next.delete(n)
      return next
    })
    els.current.delete(n)
  }, [])

  const focusNote = useCallback((n: number) => {
    const el = els.current.get(n)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.animate(
      [
        { boxShadow: 'var(--shadow-border-active)' },
        { boxShadow: 'var(--shadow-border-active)', offset: 0.7 },
        { boxShadow: '0 0 0 0 transparent' },
      ],
      { duration: 1400, easing: 'ease-out' },
    )
  }, [])

  const entries = useMemo(
    () => [...entryMap.values()].sort((a, b) => a.n - b.n),
    [entryMap],
  )

  const value = useMemo(
    () => ({ enabled, setEnabled, entries, register, unregister, focusNote }),
    [enabled, entries, register, unregister, focusNote],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const markerChipClass =
  'flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-caption-md text-text-on-color'

const markerPosition = {
  'top-right': '-top-2 -right-2',
  'top-left': '-top-2 -left-2',
  'bottom-right': '-bottom-2 -right-2',
  'bottom-left': '-bottom-2 -left-2',
} as const

export function Annotate({
  n,
  title,
  note,
  side = 'top-right',
  inline = false,
  className,
  children,
}: {
  n: number
  title: string
  note: string
  /** Which corner of the wrapped element the marker pins to. */
  side?: keyof typeof markerPosition
  /** Set for inline elements (buttons, chips) so the wrapper doesn't break flow. */
  inline?: boolean
  className?: string
  children: React.ReactNode
}) {
  const { enabled, register, unregister } = useAnnotations()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    register({ n, title, note }, ref.current)
    return () => unregister(n)
  }, [n, title, note, register, unregister])

  return (
    <div
      ref={ref}
      data-annotate={n}
      className={cn('relative', inline && 'inline-block', className)}
    >
      {children}
      {enabled && (
        <Popover>
          <PopoverTrigger
            aria-label={`Design note ${n}: ${title}`}
            className={cn(
              markerChipClass,
              'absolute z-10 cursor-pointer ring-2 ring-background-base transition-transform hover:scale-110',
              markerPosition[side],
            )}
          >
            {n}
          </PopoverTrigger>
          <PopoverContent side="top" className="w-64 p-3">
            <p className="text-caption-md text-brand-text">Note {n}</p>
            <p className="text-label-sm">{title}</p>
            <p className="text-paragraph-xs text-text-muted">{note}</p>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
