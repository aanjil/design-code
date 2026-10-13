import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CaretLeft, GearSix, MagnifyingGlass, Ruler } from '@phosphor-icons/react'
import { useAnnotations } from './annotations'
import { CraftCommandPalette } from './command-palette'
import { Kbd } from './kbd'
import { ThemeToggle } from './theme-toggle'
import { Button, Label, Switch } from '@niural/components'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * Canvas-mode chrome: Back + a Settings popover (markers, rulers, theme,
 * search). Replaces AppNav for canvas crafts (root hides the top nav in
 * canvas layout). Deliberately minimal - no craft switcher, no
 * title/description block; just navigation back to the gallery plus the
 * handful of toggles every canvas craft shares.
 *
 * Left column, top to bottom: Mesurer's toolbar (pinned at 16,16 by the
 * library), this dock, then the canvas windows stack - stacked so none
 * of them hides another.
 */
export function FloatingDock({
  slug: _slug,
  showRulers,
  onToggleRulers,
}: {
  slug: string
  showRulers: boolean
  onToggleRulers: (next: boolean) => void
}) {
  const { enabled, setEnabled } = useAnnotations()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
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

  // `a` toggles annotation markers
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
    <>
      <div className="fixed top-16 left-4 z-50 flex items-center gap-1 rounded-full bg-background-base/90 p-1.5 shadow-flyout backdrop-blur">
        <Button
          variant="ghost"
          shade="neutral"
          size="sm"
          type="button"
          onClick={() => navigate({ to: '/' })}
          leftIcon={<CaretLeft className="size-4" />}
        >
          Back
        </Button>
        <span className="mx-0.5 h-4 w-px bg-border-muted" />
        <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
          <PopoverTrigger
            aria-label="Canvas settings"
            className="flex size-7 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-background-highlight"
          >
            <GearSix />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 gap-1 p-2">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false)
                setPaletteOpen(true)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-label-xs text-text-primary hover:bg-background-highlight"
            >
              <MagnifyingGlass className="size-4 text-text-muted" />
              <span className="flex-1">Search crafts</span>
              <Kbd>⌘K</Kbd>
            </button>

            <span className="my-1 block h-px bg-border-muted" />

            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="flex size-4 items-center justify-center text-text-muted">
                <Kbd>A</Kbd>
              </span>
              <div className="flex-1">
                <Label
                  htmlFor="dock-annotations"
                  labelType="label-xsmall"
                  textClassName="text-text-primary"
                  text="Design note markers"
                />
              </div>
              <Switch id="dock-annotations" isChecked={enabled} onChange={setEnabled} />
            </div>

            <div className="flex items-center gap-2 px-2 py-1.5">
              <Ruler className="size-4 text-text-muted" />
              <div className="flex-1">
                <Label
                  htmlFor="dock-rulers"
                  labelType="label-xsmall"
                  textClassName="text-text-primary"
                  text="Show rulers"
                />
              </div>
              <Switch id="dock-rulers" isChecked={showRulers} onChange={onToggleRulers} />
            </div>

            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="flex-1 text-label-xs text-text-primary">Theme</span>
              <ThemeToggle />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <CraftCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </>
  )
}
