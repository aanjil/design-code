import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge must be taught the NDS type-scale utilities (text-label-sm,
 * text-title-h1, …) are font-size classes — otherwise it treats them as text
 * COLORS and silently drops them when combined with text-text-* tokens.
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
            'paragraph-xl',
            'paragraph-lg',
            'paragraph-md',
            'paragraph-sm',
            'paragraph-xs',
            'label-xl',
            'label-lg',
            'label-md',
            'label-sm',
            'label-xs',
            'caption',
            'caption-md',
            'mono-xl',
            'mono-lg',
            'mono-md',
            'mono-sm',
            'mono-xs',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
