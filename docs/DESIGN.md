# NDS — design system reference (canonical)

Read this file before ANY UI work. It is the distilled, always-current contract.
Full foundations live in `docs/foundations/*.md` — consult them only when this file
isn't enough (they cost far more tokens). Tokens are machine-enforced: Tailwind's
default palette is **disabled** in `src/styles.css` — `bg-red-500` doesn't exist,
`bg-background-error-base` does. If a color class doesn't compile, use a token.

## Colors — utility suffix == token name from colors.md

- Backgrounds: `bg-background-{base|muted|emphasis|disabled|highlight|item}`,
  `bg-background-{success|warning|info|error}-{base|emphasis|muted|muted-hover|highlight}`
- Text: `text-text-{primary|muted|disabled|on-color}`,
  `text-text-{success|warning|info|error}-{base|subtle}`
- Borders: `border-border-{base|muted|card|highlight}`,
  `border-border-{success|warning|info|error}-{base|muted}`
- Brand: `bg-brand-{primary|emphasis|muted|base|surface}`, `text-brand-text`,
  `bg-brand-wallet-{primary|secondary}`
- Surfaces: `bg-surface-{0|1|2}` (2 = most elevated; inverts in dark)
- Accents (decorative only — NEVER for status): `bg-accent-{orange|pink|teal|violet}-{base|muted|highlight}`
- Overlays: `bg-overlay-background-base`, `bg-elevation-alpha-{0|4|8|12|16|24|60}`
- `white` / `black` exist; nothing else does.

Rules: dark mode is automatic via tokens — never write `dark:` color overrides.
Status UIs pair bg + text + border from the SAME family (banner = `bg-background-warning-highlight`
+ `text-text-warning-base` + `border-border-warning-muted`). `text-text-on-color` on any
colored/brand background.

## Typography — one class sets size + weight + line-height + tracking

- Titles: `text-title-h1..h5` — Inter 520, lh 1. Short copy only, never truncate.
- Paragraph: `text-paragraph-{xl|lg|md|sm|xs}` (425) — reading text. Body default = paragraph-sm (14px).
- Labels: `text-label-{xl|lg|md|sm|xs}` (550; sm=530) — buttons, form labels, table headers,
  nav, badges, tabs. **`text-label-sm` is the platform default UI text.**
- Caption: `text-caption` (425) / `text-caption-md` (500) — 12px metadata, timestamps.
- Mono: `font-mono text-mono-{xl|lg|md|sm|xs}` — ALL numbers: money, IDs, dates in tables,
  account numbers. md/sm are semibold for data emphasis. Always pair with `font-mono`.

Rules: max 2 type sizes per component · no custom font sizes · Label for UI, Paragraph for
reading · NO `gap-*` between stacked text lines (title+subtitle, label+value) — line-height
handles it, remove `gap-1` on sight.

## Spacing (px → Tailwind unit)

Allowed: 4=`1` · 6=`1.5` · 8=`2` · 10=`2.5` · 12=`3` · 16=`4` · 20=`5` · 24=`6` · 32=`8` · 48=`12`. Nothing else.

99% of cases: **8** between sub-groups · **12** list items, button rows, card padding ·
**16** page padding, horizontal grid gap · **20** vertical grid gap.

Component specifics: label→input `gap-1.5` · icon→text `gap-1` · atom horizontal padding `px-2.5`
· card `p-3` · sections `space-y-8` (48px/`space-y-12` if section stands alone) · modal sections 32,
interior 24 · page body `p-4`. Specials: `pb-form-bottom` (196px form-page scroll room),
`h-table-empty` (400px table empty state).

Philosophy: group with space, not dividers/borders. Optical > mathematical — deviate only if
you can say why, and never invent new token values.

## Shadows / elevation

- Semantic: `shadow-card`, `shadow-card-hover`, `shadow-tooltip`, `shadow-flyout`, `shadow-ai`
- Border-rings (inputs/interactive states): `shadow-border-base`, `-focus`, `-active`, `-error`, `-brand`
- Depth scale: `shadow-sm|shadow|md|lg|xl|2xl|inner`, `shadow-component`

Card recipe: `rounded-xl bg-background-base p-3 shadow-card hover:shadow-card-hover` — the
1px ring is built into the shadow, do NOT add a border on top.

## Components

- Use `@/components/ui/*` — shadcn on **Base UI** primitives (`@base-ui/react`), style
  `base-nova`. Installed: badge button card checkbox command dialog dropdown-menu input
  input-group label popover scroll-area select separator sheet switch table tabs textarea
  toggle toggle-group tooltip.
- Composition uses Base UI's `render` prop, NOT Radix's `asChild`:
  `<DropdownMenuItem render={<Link to="…" />}>content</DropdownMenuItem>`. Triggers render a
  real `<button>` by default — often just pass `className` directly.
- State variants use Base UI data attributes: `data-open:`, `data-checked:`, `data-vertical:` …
  (provided by `shadcn/tailwind.css`), not Radix's `data-[state=open]`.
- Base UI is stricter than Radix: `DropdownMenuLabel` MUST be wrapped in
  `DropdownMenuGroup` (it renders `Menu.GroupLabel`) or the menu throws at runtime.
- `CommandDialog` does NOT wrap children in a cmdk root — always nest
  `<Command>` yourself: `<CommandDialog><Command><CommandInput/>…</Command></CommandDialog>`.
- NDS type utilities (text-label-sm, …) are registered as font-size classes in
  `src/lib/utils.ts` (extendTailwindMerge). Add any NEW `--text-*` token there too, or
  tailwind-merge will treat it as a color and silently drop it next to `text-text-*`.
- Adding one: `pnpm dlx shadcn@latest add <name> --yes`, then grep it for default-palette
  classes (e.g. `bg-neutral-*`) and remap to tokens — the palette is disabled. Also remove
  unused React imports (strict `noUnusedLocals`).
- shadcn semantic classes (`bg-primary`, `text-muted-foreground`, …) are bridged to NDS and
  belong INSIDE `src/components/ui/` only. Experiment code uses foundation tokens.
- Icons: **@phosphor-icons/react** (regular weight default). 16px default, 12 inline-small,
  20 emphasis, 24 decorative. Generated ui/* components also use Phosphor
  (`iconLibrary: "phosphor"` in components.json).

## NDS app components (`src/components/nds/`) — from the Figma Web design system

- Layout: `AppShell > AppBar + MainLayout(Sidebar + PageLayout(PageHeader/PageBody/PageFooter))`.
  AppBar 58px on surface-2; content panel floats with 8px gutter, rounded-xl,
  border-highlight. Sidebar 200px, translucent (`bg-overlay-background-base` + blur),
  active item = white pill + `shadow-button-gray` + `text-brand-text`.
- Buttons (ui/button restyled): h-[34px], `rounded-btn` (9px), Label/Small.
  `default` = violet radial gradient + `shadow-button-primary`; `secondary` = white→highlight
  gradient + `shadow-button-gray`; `outline` = flat white + ring; `ghost-destructive` = error
  text. Wrap text children in `<span className="px-1">` (4px optical label pad).
- New tokens: `--surface-button-{gray|primary}`, `--elevation-alpha-22`, gradients
  (`btn-gradient-primary|gray` utilities), `rounded-btn` 9px, `rounded-kbd` 6px,
  `shadow-button-{gray|primary}`, `shadow-pagination`. Flyout panels: menu `rounded-xl`
  p-1 on surface-2; combobox/value panels `rounded-2xl` on base; items h-[34px] rounded-lg.
- Filters (`nds/filters/`): `FilterMenu` (button → field list → nested submenu value panel
  with search + multi-select + Reset/Apply), `FilterBar` (applied container: segmented
  editable chips `[icon field | is | values | ×]` h-9 rounded-md, AI prompt entry, save-view,
  Clear), `parsePromptToConditions` = deterministic mock AI (options + synonyms).
- `DisplayMenu`: table customization panel (group by, sort by + direction, column chips,
  Apply/Reset draft flow).
- Table recipe: rows 54px, cells px-5, header Label/Small muted + CaretUpDown sort,
  IDs/amounts in `font-mono text-mono-xs`, `StatusPill` (white pill + ring + status dot),
  pagination = circular 36px buttons + rows-per-page pill (`shadow-pagination`).
- Canvas experiments: `<CanvasExperiment slug windows=[…]>` + route
  `staticData: { layout: 'canvas' }`. The route fills the viewport (root hides the top
  nav), Safari-chrome `BrowserWindow`s drag via titlebar / resize via corner / click to
  front, and all chrome lives in the `FloatingDock` — a top-left pill (logo + status +
  experiment title) that expands into a panel: description, tags, experiment switcher,
  Markers toggle (`A`), notes, theme, ⌘K. Start window `y` ≥ 72 so the pill doesn't
  cover the first titlebar.
- Canvas navigation (Figma-style): zoom 25–200% via bottom-left controls, ⌘/Ctrl +/−/0,
  and pinch / Ctrl-scroll toward the cursor; "Fit all windows" reframes everything;
  "Tidy up" (broom) arranges windows in a centered left→right row and refits; the
  bottom-left minimap shows window rects + a draggable brand-outlined viewport. The view
  auto-centers on the windows at mount. The **green traffic light** or the **corners
  button on the titlebar** presents one window at ~98vw/98vh at crisp 1:1 regardless of
  canvas zoom, preserving that window's interaction state ("app view") — Escape,
  backdrop, corners button, or green light exits. Dock/minimap/zoom hide while
  presenting. Surface is 4000×2400.

## Playground structure

- Experience = folder `src/experiments/<slug>/index.tsx` + entry in
  `src/experiments/registry.ts` + thin route `src/routes/e/<slug>.tsx` that mounts it inside
  `<ExperimentFrame slug="…">`. Nav switcher, ⌘K palette, and the gallery all read the registry.
- To add one: copy the `demo-annotations` pair (route + experiment folder), register it. Done.
- Variants (`variants={[{ id, label, node, note? }]}`) = alternative flows/approaches A/B/C —
  the frame renders tabs to switch between them.
- Annotations: wrap anything in `<Annotate n={1} title="…" note="…">` → numbered marker +
  popover + entry in the notes panel. Toggle via frame switch or the `a` key.
- Mock data ONLY — no fetch, no APIs, no network. Seeded deterministic generators in
  `src/mocks/` (same data every reload, safe for screenshots/demos).

## Gaps — TBD in foundations (flag, don't invent)

- `sizes.md`: blank in foundations, but the Figma Web design system fills most of it —
  AppBar 58, sidebar 200, buttons/inputs 34–36, table rows 54, status pill 24 (see the
  NDS app components section). Radius: buttons 9px, menus 12px, panels 16px.
- `constants.md`: z-index, breakpoints, animation durations → Tailwind defaults.
- `colors.md`: `pale-{pink|teal|violet}-{900|1000}` referenced but undefined → nearest
  defined primitive used, marked `TODO` in styles.css.
- `border-hightlight` typo in colors.md → implemented as `border-highlight`.
- `assets.md`: icon library unspecified in foundations → Phosphor chosen for the playground.
- Card/popover dark surfaces: provisional (base / gray-800) until surface usage is specified.

When foundations change: re-copy into `docs/foundations/`, update `src/styles.css` tokens,
then update this file. All three must stay in sync.
