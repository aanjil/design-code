import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { IntakeDocument } from '@/mocks/emma-intake'

/**
 * Fake source-document panel (no real PDF rendering) - pages stacked in a
 * scroll container, blocks positioned in reading order. Clicking a receipt
 * field elsewhere sets `activeBlockId`, which scrolls here and drops a
 * translucent purple highlight - the bi-directional link in the spec.
 */
export function DocumentViewer({
  document,
  activeBlockId,
}: {
  document: IntakeDocument
  activeBlockId: string | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeBlockId || !containerRef.current) return
    const el = containerRef.current.querySelector(
      `[data-block-id="${activeBlockId}"]`,
    )
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeBlockId])

  const pages = Array.from({ length: document.pageCount }, (_, i) => i + 1)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2 text-label-xs text-text-muted">
        <span className="truncate">{document.filename}</span>
        <span className="text-text-disabled">·</span>
        <span className="shrink-0">{document.fileSizeLabel}</span>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-background-highlight/40 p-4"
      >
        <div className="flex flex-col gap-4">
          {pages.map((page) => (
            <div key={page} className="rounded-xl bg-background-base p-6 shadow-card">
              <div className="flex flex-col gap-2.5">
                {document.blocks
                  .filter((b) => b.page === page)
                  .map((block) => {
                    const active = block.id === activeBlockId
                    return (
                      <p
                        key={block.id}
                        data-block-id={block.id}
                        className={cn(
                          '-mx-1 rounded-md px-1 py-0.5 transition-colors duration-300',
                          block.kind === 'heading' && 'text-title-h5 text-text-primary',
                          block.kind === 'line' && 'text-paragraph-sm text-text-primary',
                          block.kind === 'faint' && 'text-paragraph-sm text-text-disabled',
                          active && 'bg-brand-primary/15 ring-2 ring-brand-primary/50',
                        )}
                      >
                        {block.text}
                      </p>
                    )
                  })}
              </div>
              <p className="mt-6 text-right text-caption text-text-disabled">
                Page {page} of {document.pageCount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
