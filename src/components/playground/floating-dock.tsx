import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CaretDown,
  Check,
  MagnifyingGlass,
  NotePencil,
  SquaresFour,
  X,
} from '@phosphor-icons/react'
import { useAnnotations } from './annotations'
import { ExperimentCommandPalette } from './command-palette'
import { NotesSheet } from './experiment-frame'
import { Kbd } from './kbd'
import { StatusBadge, statusDotClass } from './status-badge'
import { ThemeToggle } from './theme-toggle'
import { experiments, getExperiment } from '@/experiments/registry'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

/**
 * Canvas-mode chrome: a floating pill (logo + experiment + status) that
 * expands into a panel with the experiment info, switcher, marker/notes
 * controls, theme toggle, and ⌘K search. Replaces AppNav + the
 * ExperimentFrame header so the canvas gets the whole viewport.
 */
export function FloatingDock({ slug }: { slug: string }) {
  const meta = getExperiment(slug)
  const { enabled, setEnabled, entries } = useAnnotations()
  const [expanded, setExpanded] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // ⌘K palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // `a` toggles annotation markers (same as ExperimentFrame)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'a' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]'))
        return
      setEnabled(!enabled)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, setEnabled])

  // collapse on Escape or outside click
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!dockRef.current?.contains(e.target as Node)) setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [expanded])

  return (
    <>
      <div ref={dockRef} className="fixed top-4 left-4 z-50">
        {expanded ? (
          <div className="w-[360px] overflow-hidden rounded-2xl bg-background-base/95 shadow-flyout backdrop-blur">
            <div className="flex items-center gap-2 p-3 pb-0">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-caption-md text-text-on-color">
                N
              </span>
              <span className="min-w-0 flex-1 truncate text-label-sm text-text-primary">
                NDS Playground
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Collapse panel"
                onClick={() => setExpanded(false)}
              >
                <X />
              </Button>
            </div>

            <div className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="min-w-0 text-label-md text-text-primary">
                  {meta.title}
                </h2>
                <StatusBadge status={meta.status} />
              </div>
              <p className="mt-1 text-paragraph-xs text-text-muted">
                {meta.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-background-highlight px-2 py-px text-caption text-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mx-3 border-t border-border-highlight" />

            <div className="p-1.5">
              <p className="px-1.5 py-1 text-caption-md text-text-muted">
                Experiments
              </p>
              {experiments.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => {
                    setExpanded(false)
                    navigate({ to: e.to })
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-label-sm text-text-primary transition-colors hover:bg-background-highlight',
                    e.slug === slug && 'bg-background-highlight',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      statusDotClass[e.status],
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  {e.slug === slug && (
                    <Check className="size-4 shrink-0 text-brand-text" weight="bold" />
                  )}
                </button>
              ))}
              <Link
                to="/"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-label-sm text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
              >
                <SquaresFour className="size-4" />
                All experiments
              </Link>
            </div>

            <div className="mx-3 border-t border-border-highlight" />

            <div className="flex items-center justify-between gap-2 p-3">
              <div className="flex items-center gap-1.5">
                <Switch
                  id="dock-annotations"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
                <Label
                  htmlFor="dock-annotations"
                  className="gap-1 text-label-xs text-text-muted"
                >
                  Markers <Kbd>A</Kbd>
                </Label>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotesOpen(true)}
                >
                  <NotePencil />
                  <span className="px-1">{entries.length}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Search experiments (⌘K)"
                  onClick={() => setPaletteOpen(true)}
                >
                  <MagnifyingGlass />
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={`${meta.title} — open playground panel`}
            className="flex h-10 items-center gap-2 rounded-full bg-background-base/90 pr-3 pl-1.5 shadow-flyout backdrop-blur transition-shadow hover:shadow-card-hover"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-caption-md text-text-on-color">
              N
            </span>
            <span
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                statusDotClass[meta.status],
              )}
            />
            <span className="max-w-[240px] truncate text-label-sm text-text-primary">
              {meta.title}
            </span>
            <CaretDown className="size-3.5 shrink-0 text-text-muted" />
          </button>
        )}
      </div>

      <ExperimentCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
      <NotesSheet open={notesOpen} onOpenChange={setNotesOpen} />
    </>
  )
}
