import { AppWindow, Camera, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Floating list of everything on the canvas (top-right): source windows,
 * saved snapshots, and design-note pins. Click a row to jump to it;
 * snapshots and notes can be removed.
 */
export function WindowsPanel({
  windows,
  snapshots,
  notes,
  focusedId,
  onJump,
  onRemoveSnapshot,
  onJumpToNote,
  onRemoveNote,
}: {
  windows: Array<{ id: string; title: string }>
  snapshots: Array<{ id: string; title: string }>
  notes: Array<{ id: string; n: number; text: string }>
  focusedId: string | null
  onJump: (id: string) => void
  onRemoveSnapshot: (id: string) => void
  onJumpToNote: (id: string) => void
  onRemoveNote: (id: string) => void
}) {
  return (
    <div className="max-h-[min(480px,calc(100vh-160px))] w-60 overflow-y-auto rounded-2xl bg-background-base/90 p-1.5 shadow-border-base backdrop-blur">
      <p className="px-1.5 pt-1 pb-1.5 text-caption-md text-text-muted">
        Windows
      </p>
      <div className="flex flex-col gap-0.5">
        {windows.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onJump(w.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-label-xs text-text-primary transition-colors hover:bg-background-highlight',
              focusedId === w.id && 'bg-background-highlight',
            )}
          >
            <AppWindow className="size-4 shrink-0 text-text-muted" />
            <span className="min-w-0 flex-1 truncate">{w.title}</span>
          </button>
        ))}
      </div>

      {notes.length > 0 && (
        <>
          <p className="px-1.5 pt-2.5 pb-1.5 text-caption-md text-text-muted">
            Notes
          </p>
          <div className="flex flex-col gap-0.5">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-background-highlight"
              >
                <button
                  type="button"
                  onClick={() => onJumpToNote(note.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-primary text-caption-md text-text-on-color">
                    {note.n}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-paragraph-xs',
                      note.text.trim() ? 'text-text-primary' : 'text-text-muted',
                    )}
                  >
                    {note.text.trim() || 'Empty note'}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete note ${note.n}`}
                  onClick={() => onRemoveNote(note.id)}
                  className="flex size-5 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-error-highlight hover:text-text-error-base"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {snapshots.length > 0 && (
        <>
          <p className="px-1.5 pt-2.5 pb-1.5 text-caption-md text-text-muted">
            Snapshots
          </p>
          <div className="flex flex-col gap-0.5">
            {snapshots.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-background-highlight',
                  focusedId === s.id && 'bg-background-highlight',
                )}
              >
                <button
                  type="button"
                  onClick={() => onJump(s.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-label-xs text-text-primary"
                >
                  <Camera className="size-4 shrink-0 text-brand-text" />
                  <span className="min-w-0 flex-1 truncate">{s.title}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${s.title}`}
                  onClick={() => onRemoveSnapshot(s.id)}
                  className="flex size-5 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-error-highlight hover:text-text-error-base"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
