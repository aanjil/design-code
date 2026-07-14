import { createContext, useContext } from 'react'

/**
 * Where floating UI (popovers, menus) should portal to. Defaults to null →
 * document.body (normal app behavior). The canvas BrowserWindow provides its
 * content element so popups mount INSIDE the zoom-scaled layer — they scale
 * with the canvas, clip to their window like a real browser, and get captured
 * by DOM snapshots.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContainerContext)
}
