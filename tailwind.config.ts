import preset from '@niural/components/preset'

/**
 * niural-fe-pkg's Tailwind preset is the ONLY design-token source for this
 * app. Loaded into Tailwind v4 via `@config` in src/styles.css, so every
 * fe-pkg class (bg-base, text-muted, border-muted, borders-focus, card,
 * rounded-control, ...) works here with all variants, exactly as it does
 * inside fe-pkg. To change a token, change it in niural-fe-pkg.
 */
export default {
  presets: [preset],
}
