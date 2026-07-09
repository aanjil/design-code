# Colors

Two layers: **primitives** (raw values, the palette) and **tokens** (semantic usage, reference primitives). Always use tokens in design and code — never raw primitives directly.

```
Primitive  →  gray-900 = #171717
Token      →  text-primary → gray-900 (light) / white (dark)
```

---

## Primitives

The raw color palette. Do not use these directly in UI. They exist to back the token system.

### Gray

| Primitive | Hex |
|-----------|-----|
| `gray-25` | `#f0f0f0` |
| `gray-50` | `#fafafa` |
| `gray-100` | `#f5f5f5` |
| `gray-150` | `#f2f2f2` |
| `gray-200` | `#e5e5e5` |
| `gray-300` | `#d4d4d4` |
| `gray-400` | `#a1a1a1` |
| `gray-500` | `#737373` |
| `gray-600` | `#525252` |
| `gray-700` | `#404040` |
| `gray-750` | `#303030` |
| `gray-800` | `#262626` |
| `gray-900` | `#171717` |
| `gray-950` | `#0d0d0d` |
| `white` | `#ffffff` |
| `black` | `#000000` |

### Green

| Primitive | Hex |
|-----------|-----|
| `green-50` | `#f0fdf4` |
| `green-100` | `#dcfce7` |
| `green-200` | `#b9f8cf` |
| `green-300` | `#7bf1a8` |
| `green-400` | `#05df72` |
| `green-500` | `#00c950` |
| `green-600` | `#00a63e` |
| `green-700` | `#008236` |
| `green-800` | `#016630` |
| `green-900` | `#0d542b` |
| `green-950` | `#032e15` |

### Yellow

| Primitive | Hex |
|-----------|-----|
| `yellow-50` | `#fefce8` |
| `yellow-100` | `#fef9c2` |
| `yellow-200` | `#fff085` |
| `yellow-300` | `#ffdf20` |
| `yellow-400` | `#fdc700` |
| `yellow-500` | `#f0b100` |
| `yellow-600` | `#d08700` |
| `yellow-700` | `#a65f00` |
| `yellow-800` | `#894b00` |
| `yellow-900` | `#733e0a` |
| `yellow-950` | `#432004` |

### Red

| Primitive | Hex |
|-----------|-----|
| `red-50` | `#fef2f2` |
| `red-100` | `#ffe2e2` |
| `red-200` | `#ffc9c9` |
| `red-300` | `#ffa2a2` |
| `red-400` | `#ff6467` |
| `red-500` | `#fb2c36` |
| `red-600` | `#e7000b` |
| `red-700` | `#c10007` |
| `red-800` | `#9f0712` |
| `red-900` | `#82181a` |
| `red-950` | `#460809` |

### Blue

| Primitive | Hex |
|-----------|-----|
| `blue-50` | `#eff6ff` |
| `blue-100` | `#dbeafe` |
| `blue-200` | `#bedbff` |
| `blue-300` | `#8ec5ff` |
| `blue-400` | `#51a2ff` |
| `blue-500` | `#2b7fff` |
| `blue-600` | `#155dfc` |
| `blue-700` | `#1447e6` |
| `blue-800` | `#193cb8` |
| `blue-900` | `#1c398e` |
| `blue-950` | `#162456` |

### Violet

| Primitive | Hex |
|-----------|-----|
| `violet-50` | `#f5f3ff` |
| `violet-100` | `#ede9fe` |
| `violet-200` | `#ddd6ff` |
| `violet-300` | `#c4b4ff` |
| `violet-400` | `#a684ff` |
| `violet-500` | `#8e51ff` |
| `violet-600` | `#7f22fe` |
| `violet-700` | `#7008e7` |
| `violet-800` | `#5d0ec0` |
| `violet-900` | `#4d179a` |
| `violet-950` | `#2f0d68` |

### Teal

| Primitive | Hex |
|-----------|-----|
| `teal-50` | `#f0fdfa` |
| `teal-100` | `#cbfbf1` |
| `teal-200` | `#96f7e4` |
| `teal-300` | `#46ecd5` |
| `teal-400` | `#00d5be` |
| `teal-500` | `#00bba7` |
| `teal-600` | `#009689` |
| `teal-700` | `#00786f` |
| `teal-800` | `#005f5a` |
| `teal-900` | `#0b4f4a` |
| `teal-950` | `#022f2e` |

### Pink

| Primitive | Hex |
|-----------|-----|
| `pink-50` | `#fdf2f8` |
| `pink-100` | `#fce7f3` |
| `pink-200` | `#fccee8` |
| `pink-300` | `#fda5d5` |
| `pink-400` | `#fb64b6` |
| `pink-500` | `#f6339a` |
| `pink-600` | `#e60076` |
| `pink-700` | `#c6005c` |
| `pink-800` | `#a3004c` |
| `pink-900` | `#861043` |
| `pink-950` | `#510424` |

### Orange

| Primitive | Hex |
|-----------|-----|
| `orange-50` | `#fff7ed` |
| `orange-100` | `#ffedd4` |
| `orange-200` | `#ffd6a7` |
| `orange-300` | `#ffb86a` |
| `orange-400` | `#ff8904` |
| `orange-500` | `#ff6900` |
| `orange-600` | `#f54900` |
| `orange-700` | `#ca3500` |
| `orange-800` | `#9f2d00` |
| `orange-900` | `#7e2a0c` |
| `orange-950` | `#441306` |

### Alpha

| Primitive | Value |
|-----------|-------|
| `alpha-black-12` | `#0000001e` |
| `alpha-black-16` | `#00000028` |
| `alpha-black-24` | `#0000003d` |
| `alpha-black-40` | `#00000066` |
| `alpha-black-56` | `#0000008e` |
| `alpha-black-72` | `#000000b7` |
| `alpha-black-90` | `#000000e5` |
| `alpha-white-8` | `#ffffff14` |
| `alpha-white-16` | `#ffffff28` |
| `alpha-white-24` | `#ffffff3d` |
| `alpha-white-40` | `#ffffff66` |
| `alpha-white-56` | `#ffffff8e` |
| `alpha-white-64` | `#ffffffa3` |
| `alpha-white-72` | `#ffffffb7` |
| `alpha-white-80` | `#ffffffcc` |
| `alpha-white-88` | `#ffffffe0` |

---

## Tokens

Semantic tokens. These are what you use in design and code.

### Background

| Token | Light | Dark |
|-------|-------|------|
| `background-base` | `white` | `gray-900` |
| `background-muted` | `gray-200` | `gray-750` |
| `background-emphasis` | `gray-300` | `gray-500` |
| `background-disabled` | `gray-100` | `gray-700` |
| `background-highlight` | `gray-100` | `gray-800` |
| `background-item` | `gray-150` | `#3d3d3d` |
| `background-success-base` | `green-500` | `green-500` |
| `background-success-emphasis` | `green-600` | `green-600` |
| `background-success-muted` | `green-100` | `green-800` |
| `background-success-muted-hover` | `green-200` | `green-900` |
| `background-success-highlight` | `#f1fdf3` | `#122d18` |
| `background-warning-base` | `yellow-500` | `yellow-500` |
| `background-warning-emphasis` | `yellow-600` | `yellow-600` |
| `background-warning-muted` | `yellow-200` | `yellow-800` |
| `background-warning-muted-hover` | `yellow-300` | `yellow-900` |
| `background-warning-highlight` | `#fdfcea` | `#3e220a` |
| `background-info-base` | `blue-500` | `blue-500` |
| `background-info-emphasis` | `blue-600` | `blue-600` |
| `background-info-muted` | `blue-100` | `blue-800` |
| `background-info-muted-hover` | `blue-200` | `blue-900` |
| `background-info-highlight` | `#f0f6fe` | `#1a2553` |
| `background-error-base` | `red-500` | `red-500` |
| `background-error-emphasis` | `red-600` | `red-600` |
| `background-error-muted` | `red-100` | `red-900` |
| `background-error-muted-hover` | `red-200` | `red-900` |
| `background-error-highlight` | `#fcf2f2` | `#3f0f0c` |

### Text

| Token | Light | Dark |
|-------|-------|------|
| `text-primary` | `gray-900` | `white` |
| `text-muted` | `gray-500` | `gray-400` |
| `text-disabled` | `gray-300` | `#71717a` |
| `text-on-color` | `white` | `white` |
| `text-success-base` | `#4aa34d` | `green-400` |
| `text-success-subtle` | `green-200` | `green-600` |
| `text-warning-base` | `#c88830` | `yellow-400` |
| `text-warning-subtle` | `yellow-200` | `yellow-600` |
| `text-info-base` | `#2c59f2` | `blue-400` |
| `text-info-subtle` | `blue-200` | `blue-600` |
| `text-error-base` | `#d32d24` | `red-500` |
| `text-error-subtle` | `red-600` | `red-600` |

### Border

| Token | Light | Dark |
|-------|-------|------|
| `border-base` | `gray-200` | `gray-800` |
| `border-muted` | `gray-300` | `gray-600` |
| `border-card` | `gray-150` | `#1c1c1c` |
| `border-hightlight` | `gray-150` | `gray-800` |
| `border-success-base` | `green-400` | `green-700` |
| `border-success-muted` | `green-300` | `green-800` |
| `border-warning-base` | `yellow-400` | `yellow-700` |
| `border-warning-muted` | `yellow-300` | `yellow-800` |
| `border-info-base` | `blue-400` | `blue-700` |
| `border-info-muted` | `blue-200` | `blue-800` |
| `border-error-base` | `red-500` | `red-700` |
| `border-error-muted` | `red-200` | `red-800` |

### Brand

| Token | Light | Dark |
|-------|-------|------|
| `brand-primary` | `#714dff` | `#714dff` |
| `brand-emphasis` | `#5e3bd4` | `#5434b9` |
| `brand-muted` | `#e3dcff` | `#301d69` |
| `brand-base` | `#f1ecff` | `#211f2b` |
| `brand-surface` | `#ac93ff` | `white` |
| `brand-text` | `#714dff` | `#ac93ff` |
| `brand-niural-wallet-primary` | `#0bc15a` | `#0bc15a` |
| `brand-niural-wallet-secondary` | `#a6fc4e` | `#a6fc4e` |

### Surface

| Token | Light | Dark |
|-------|-------|------|
| `surface-0` | `#e0e0e0` | `#0b0b0b` |
| `surface-1` | `#f6f6f6` | `#101010` |
| `surface-2` | `#fbfbfb` | `#131313` |

> `surface-0` is the deepest/darkest, `surface-2` is the lightest/most elevated. In dark mode this inverts — deeper dark = lower surface number.

### Elevation / Alpha

Used for overlays, shadows, and scrim effects. Values are RGBA — they adapt to the base color automatically.

| Token | Light | Dark |
|-------|-------|------|
| `elevation-alpha-0` | `#e4e4e700` | `#27272a00` |
| `elevation-alpha-4` | `#b9b9b90a` | `#9797970a` |
| `elevation-alpha-8` | `#b9b9b914` | `#9797971e` |
| `elevation-alpha-12` | `#1f1f231e` | `#9797971e` |
| `elevation-alpha-16` | `#b9b9b933` | `#97979728` |
| `elevation-alpha-24` | `#9393933d` | `#9797973d` |
| `elevation-alpha-60` | `#e4e4e799` | `#1f1f2399` |
| `elevation-alpha-shadow` | `#00000014` | `#00000033` |

### Overlay

| Token | Light | Dark |
|-------|-------|------|
| `overlay-background-base` | `alpha-white-72` | `#141417b7` |
| `overlay-border-base` | `#ffffff7f` | `#1414177f` |

### Accent

Accent colors for product features, tags, categories, and decorative UI. Not for status states.

| Token | Light | Dark |
|-------|-------|------|
| `accent-orange-base` | `#d45525` | `#ebba6c` |
| `accent-orange-muted` | `orange-200` | `#5b2f00` |
| `accent-orange-highlight` | `#fdf6ee` | `#3e1609` |
| `accent-pink-base` | `pink-500` | `pink-400` |
| `accent-pink-muted` | `pink-200` | `pale-pink-900` |
| `accent-pink-highlight` | `pink-100` | `pale-pink-1000` |
| `accent-teal-base` | `teal-500` | `teal-400` |
| `accent-teal-muted` | `teal-200` | `pale-teal-900` |
| `accent-teal-highlight` | `teal-100` | `pale-teal-1000` |
| `accent-violet-base` | `violet-500` | `violet-400` |
| `accent-violet-muted` | `violet-200` | `pale-violet-900` |
| `accent-violet-highlight` | `violet-100` | `pale-violet-1000` |

### Global

| Token | Light | Dark |
|-------|-------|------|
| `global-white` | `white` | `white` |
| `global-black` | `black` | `black` |

---

## Semantic color usage

Always pair background + text + border tokens from the same semantic family.

| State | Background token | Text token | Border token |
|-------|-----------------|------------|--------------|
| Success | `background-success-base` | `text-success-base` | `border-success-base` |
| Warning | `background-warning-base` | `text-warning-base` | `border-warning-base` |
| Info | `background-info-base` | `text-info-base` | `border-info-base` |
| Error | `background-error-base` | `text-error-base` | `border-error-base` |

For subtle/muted states (banners, inline alerts), use `*-muted` and `*-subtle` variants with `*-highlight` as the background.

---

## Do's

- Use tokens everywhere — design and code
- Use semantic tokens for status states — never hardcode a color
- Use `text-on-color` for text on any brand or colored background
- Pair background + text + border from the same semantic family

## Don'ts

- Don't use primitives directly in components — always go through tokens
- Don't use `background-*` tokens for text — use `text-*` tokens
- Don't mix Light/Dark values manually — token modes handle it
- Don't use accent colors for status states — those are for decoration only
