import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's built-in names. Teach it fe-pkg's:
 * - type scale (text-label-small, text-title-h5, ...) are font SIZES -
 *   otherwise it reads them as text colors and drops them next to text-muted.
 * - elevation utilities (card, flyout, borders-*, buttons-*, elevation-*) set
 *   box-shadow - so `shadow-none` passed in a className beats a default `card`.
 * - named radii (rounded-control, rounded-surface, ...) - fe-pkg radius.ts.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'title-h1',
            'title-h2',
            'title-h3',
            'title-h4',
            'title-h5',
            'label-xlarge',
            'label-large',
            'label-medium',
            'label-small',
            'label-xsmall',
            'paragraph-large',
            'paragraph-medium',
            'paragraph-small',
            'paragraph-xsmall',
            'caption-sm',
            'caption-xs',
          ],
        },
      ],
      shadow: [
        'card',
        'card-hover',
        'flyout',
        {
          borders: ['base', 'focus', 'error', 'active', 'shadow', 'interactive-with-shadow'],
          buttons: ['primary', 'neutral', 'danger'],
          elevation: [
            'card',
            'card-hover',
            'card-rest',
            'card-info',
            'card-success',
            'card-warning',
            'card-error',
            'ai',
            'flyout',
            'tooltip',
            'modal',
          ],
        },
      ],
      rounded: [{ rounded: ['tight', 'snug', 'control', 'surface', 'panel', 'overlay', 'pill'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
