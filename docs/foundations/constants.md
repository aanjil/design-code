# Constants

Fixed values that govern layout behavior, breakpoints, and numeric rules across the system.

---

## Breakpoints

| Name | Value | Description |
|------|-------|-------------|
| `xs` | — | — |
| `sm` | — | — |
| `md` | — | — |
| `lg` | — | — |
| `xl` | — | — |

> Desktop and tablet share the same layout system. Mobile is a separate app.

---

## Z-index scale

| Token | Value | Use |
|-------|-------|-----|
| `z-base` | — | Default stacking |
| `z-dropdown` | — | Dropdowns, popovers |
| `z-sticky` | — | Sticky headers, AppBar |
| `z-drawer` | — | Side drawers |
| `z-modal` | — | Modals, dialogs |
| `z-toast` | — | Notifications, toasts |
| `z-tooltip` | — | Tooltips |

---

## Border radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | — | Inputs, small components |
| `radius-md` | — | Cards, modals |
| `radius-lg` | — | Large panels |
| `radius-full` | — | Pills, badges, avatars |

---

## Shadows / Elevation

Two categories: **Elevation** (component and interaction states) and **Shadows** (generic depth scale).

### Elevation — component states

These are semantic. Use them by name — don't reconstruct them manually.

| Token | Box shadow | Use |
|-------|-----------|-----|
| `Elevation/Card` | `0px 1px 2px -1px rgba(0,0,0,0.08), 0px 0px 0px 1px rgba(185,185,185,0.20)` | Default card |
| `Elevation/Card-Hover` | `0px 2px 10px -1px rgba(0,0,0,0.08), 0px 1px 2px -1px rgba(185,185,185,0.20), 0px 0px 0px 1px rgba(31,31,35,0.12)` | Card on hover |
| `Elevation/Tooltip` | `0px 4px 8px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.08), 0px 0px 0px 1px rgba(185,185,185,0.08)` | Tooltips |
| `Elevation/Flyout` | `0px 8px 16px rgba(0,0,0,0.08), 0px 4px 8px rgba(0,0,0,0.08), 0px 0px 0px 1px rgba(185,185,185,0.08)` | Dropdowns, popovers, menus |
| `Elevation/AI` | `0px -6px 18px -4px rgba(225,81,255,0.47), 0px 2px 3px -1px rgba(113,77,255,0.48), 0px 0px 0px 4px rgba(113,77,255,0.11)` | AI surfaces and panels |

### Elevation — border states

Used on interactive elements for focus, active, error, and default border rings.

| Token | Box shadow | Use |
|-------|-----------|-----|
| `Elevation/Borders/Base` | `0px 1px 2px rgba(0,0,0,0.08), 0px 0px 0px 1px rgba(185,185,185,0.20)` | Default input/element border |
| `Elevation/Borders/Focus` | `0px 0px 0px 4px rgba(113,77,255,0.30), 0px 0px 0px 1px #714dff, 0px 1px 2px rgba(113,77,255,0.50)` | Focused input/element |
| `Elevation/Borders/Active` | `0px 0px 0px 3px rgba(113,77,255,0.20), 0px 0px 0px 1px #714dff` | Active/selected element |
| `Elevation/Borders/Error` | `0px 0px 0px 4px rgba(255,100,103,0.20), 0px 0px 0px 1px #fb2c36` | Error state input/element |
| `Elevation/Borders/Shadow` | `0px 0px 0px 1px #5e3bd4, 0px 1px 2px rgba(94,59,212,0.60)` | Brand border with shadow |

### Shadows — depth scale

Generic depth. Use when component-specific elevation tokens don't apply.

| Token | Box shadow | Use |
|-------|-----------|-----|
| `Shadows/shadow-sm` | `0px 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `Shadows/shadow` | `0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px rgba(0,0,0,0.10)` | Default shadow |
| `Shadows/shadow-md` | `0px 2px 4px -2px rgba(0,0,0,0.10), 0px 4px 6px -1px rgba(0,0,0,0.10)` | Medium depth |
| `Shadows/shadow-lg` | `0px 4px 6px -4px rgba(0,0,0,0.10), 0px 10px 15px -3px rgba(0,0,0,0.10)` | Large panels, modals |
| `Shadows/shadow-xl` | `0px 8px 10px -6px rgba(0,0,0,0.10), 0px 20px 25px -5px rgba(0,0,0,0.10)` | Overlays |
| `Shadows/shadow-2xl` | `0px 25px 50px -12px rgba(0,0,0,0.25)` | Full-screen overlays |
| `Shadows/shadow-inner` | `0px 2px 4px rgba(0,0,0,0.05) inset` | Sunken surfaces, pressed state |
| `Shadows/ComponentShadow` | `0px 0px 0px 1px rgba(0,0,0,0.08), 0px 1px 2px rgba(0,0,0,0.12)` | Generic component border+shadow |

### Gradients / Overlays

Defined as plain styles in Figma, not shadow tokens.

| Token | Value | Use |
|-------|-------|-----|
| `Overlay/Surface` | `linear-gradient(180deg, #ac93ff 0%, #e0e0e0 90.38%)` | Brand-tinted surface overlay |
| `Border/tb` | `linear-gradient(180deg, rgba(39,39,42,0.00) 0%, #27272a 58.58%)` | Fade-to-border gradient (bottom edge) |

---

## Animation

| Token | Duration | Easing | Use |
|-------|----------|--------|-----|
| `transition-fast` | — | — | Hover states, toggles |
| `transition-default` | — | — | Most transitions |
| `transition-slow` | — | — | Modals, drawers entering |

---

## Numeric constants

> Any fixed numbers used across the system that aren't spacing or size.

| Constant | Value | Use |
|----------|-------|-----|
| Table empty state height | 400px | See spacing.md |
| Form bottom padding | 196px | See spacing.md |

---

## Do's

-

## Don'ts

-
