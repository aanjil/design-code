import { useEffect, useState } from 'react'
import { NotePencil } from '@phosphor-icons/react'
import {
  AnnotationsProvider,
  markerChipClass,
  useAnnotations,
} from './annotations'
import { Kbd } from './kbd'
import { getExperiment } from '@/experiments/registry'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface ExperimentVariant {
  id: string
  label: string
  node: React.ReactNode
  /** One-liner shown next to the tabs explaining this approach. */
  note?: string
}

/**
 * Standard chrome around every experiment: registry metadata, variant tabs
 * for comparing flows, the annotations toggle (`a`), and the notes panel.
 */
export function ExperimentFrame(props: {
  slug: string
  variants?: Array<ExperimentVariant>
  children?: React.ReactNode
}) {
  return (
    <AnnotationsProvider>
      <FrameInner {...props} />
    </AnnotationsProvider>
  )
}

function FrameInner({
  slug,
  variants,
  children,
}: {
  slug: string
  variants?: Array<ExperimentVariant>
  children?: React.ReactNode
}) {
  const meta = getExperiment(slug)
  const { enabled, setEnabled, entries } = useAnnotations()
  const [notesOpen, setNotesOpen] = useState(false)
  const [variantId, setVariantId] = useState(variants?.[0]?.id ?? '')
  const active = variants?.find((v) => v.id === variantId)

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 max-w-[640px]">
          <h1 className="truncate text-label-md text-text-primary">
            {meta.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Switch
              id="annotations-switch"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label
              htmlFor="annotations-switch"
              className="gap-1 text-label-xs text-text-muted"
            >
              Markers <Kbd>A</Kbd>
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)}>
            <NotePencil />
            Notes
            <span className="text-caption-md text-text-muted">
              {entries.length}
            </span>
          </Button>
        </div>
      </div>

      {variants && variants.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={variantId} onValueChange={setVariantId}>
            <TabsList>
              {variants.map((v) => (
                <TabsTrigger key={v.id} value={v.id}>
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {active?.note && (
            <p className="text-paragraph-xs text-text-muted">{active.note}</p>
          )}
        </div>
      )}

      <div className="min-h-[420px] rounded-xl bg-background-base p-4 shadow-card">
        {active ? active.node : children}
      </div>

      <NotesSheet open={notesOpen} onOpenChange={setNotesOpen} />
    </div>
  )
}

export function NotesSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { entries, focusNote } = useAnnotations()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:max-w-[360px]">
        <SheetHeader>
          <SheetTitle className="text-label-md">Design notes</SheetTitle>
          <SheetDescription className="text-paragraph-xs">
            Numbered markers on the canvas. Click a note to locate it. Press{' '}
            <Kbd>A</Kbd> to toggle markers.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
          {entries.length === 0 ? (
            <p className="text-paragraph-xs text-text-muted">
              No annotations in this experiment yet. Wrap any element in{' '}
              <code>&lt;Annotate&gt;</code> to add one.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <button
                  key={entry.n}
                  type="button"
                  onClick={() => {
                    onOpenChange(false)
                    setTimeout(() => focusNote(entry.n), 250)
                  }}
                  className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-background-highlight"
                >
                  <span className={markerChipClass}>{entry.n}</span>
                  <span className="min-w-0">
                    <span className="block text-label-sm">{entry.title}</span>
                    <span className="block text-paragraph-xs text-text-muted">
                      {entry.note}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
