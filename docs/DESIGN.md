# NDS - design system reference (canonical)

Read this file before ANY UI work. It is the distilled, always-current contract.
Full foundations live in `docs/foundations/*.md` - consult them only when this file
isn't enough (they cost far more tokens). Tokens are machine-enforced: Tailwind's
default palette is **disabled** in `src/styles.css` - `bg-red-500` doesn't exist,
`bg-background-error-base` does. If a color class doesn't compile, use a token.

## Colors - utility suffix == token name from colors.md

- Backgrounds: `bg-background-{base|muted|emphasis|disabled|highlight|item}`,
  `bg-background-{success|warning|info|error}-{base|emphasis|muted|muted-hover|highlight}`
- Text: `text-text-{primary|muted|disabled|on-color}`,
  `text-text-{success|warning|info|error}-{base|subtle}`
- Borders: `border-border-{base|muted|card|highlight}`,
  `border-border-{success|warning|info|error}-{base|muted}`
- Brand: `bg-brand-{primary|emphasis|muted|base|surface}`, `text-brand-text`,
  `bg-brand-wallet-{primary|secondary}`
- Surfaces: `bg-surface-{0|1|2}` (2 = most elevated; inverts in dark)
- Accents (decorative only - NEVER for status): `bg-accent-{orange|pink|teal|violet}-{base|muted|highlight}`
- Overlays: `bg-overlay-background-base`, `bg-elevation-alpha-{0|4|8|12|16|24|60}`
- `white` / `black` exist; nothing else does.

Rules: dark mode is automatic via tokens - never write `dark:` color overrides.
Status UIs pair bg + text + border from the SAME family (banner = `bg-background-warning-highlight`
+ `text-text-warning-base` + `border-border-warning-muted`). `text-text-on-color` on any
colored/brand background.

## Typography - one class sets size + weight + line-height + tracking

- Titles: `text-title-h1..h5` - Inter 520, lh 1. Short copy only, never truncate.
- Paragraph: `text-paragraph-{xl|lg|md|sm|xs}` (425) - reading text. Body default = paragraph-sm (14px).
- Labels: `text-label-{xl|lg|md|sm|xs}` (550; sm=530) - buttons, form labels, table headers,
  nav, badges, tabs. **`text-label-sm` is the platform default UI text.**
- Caption: `text-caption` (425) / `text-caption-md` (500) - 12px metadata, timestamps.
- Mono: `font-mono text-mono-{xl|lg|md|sm|xs}` - ALL numbers: money, IDs, dates in tables,
  account numbers. md/sm are semibold for data emphasis. Always pair with `font-mono`.

Rules: max 2 type sizes per component · no custom font sizes · Label for UI, Paragraph for
reading · NO `gap-*` between stacked text lines (title+subtitle, label+value) - line-height
handles it, remove `gap-1` on sight.

## Spacing (px → Tailwind unit)

Allowed: 4=`1` · 6=`1.5` · 8=`2` · 10=`2.5` · 12=`3` · 16=`4` · 20=`5` · 24=`6` · 32=`8` · 48=`12`. Nothing else.

99% of cases: **8** between sub-groups · **12** list items, button rows, card padding ·
**16** page padding, horizontal grid gap · **20** vertical grid gap.

Component specifics: label→input `gap-1.5` · icon→text `gap-1` · atom horizontal padding `px-2.5`
· card `p-3` · sections `space-y-8` (48px/`space-y-12` if section stands alone) · modal sections 32,
interior 24 · page body `p-4`. Specials: `pb-form-bottom` (196px form-page scroll room),
`h-table-empty` (400px table empty state).

Philosophy: group with space, not dividers/borders. Optical > mathematical - deviate only if
you can say why, and never invent new token values.

## Shadows / elevation

- Semantic: `shadow-card`, `shadow-card-hover`, `shadow-tooltip`, `shadow-flyout`, `shadow-ai`
- Border-rings (inputs/interactive states): `shadow-border-base`, `-focus`, `-active`, `-error`, `-brand`
- Depth scale: `shadow-sm|shadow|md|lg|xl|2xl|inner`, `shadow-component`

Card recipe: `rounded-xl bg-background-base p-3 shadow-card hover:shadow-card-hover` - the
1px ring is built into the shadow, do NOT add a border on top.

## Components

- Use `@/components/ui/*` - shadcn on **Base UI** primitives (`@base-ui/react`), style
  `base-nova`. Installed: badge button card checkbox command dialog dropdown-menu input
  input-group label popover scroll-area select separator sheet switch table tabs textarea
  toggle toggle-group tooltip.
- Composition uses Base UI's `render` prop, NOT Radix's `asChild`:
  `<DropdownMenuItem render={<Link to="…" />}>content</DropdownMenuItem>`. Triggers render a
  real `<button>` by default - often just pass `className` directly.
- State variants use Base UI data attributes: `data-open:`, `data-checked:`, `data-vertical:` …
  (provided by `shadcn/tailwind.css`), not Radix's `data-[state=open]`.
- Base UI is stricter than Radix: `DropdownMenuLabel` MUST be wrapped in
  `DropdownMenuGroup` (it renders `Menu.GroupLabel`) or the menu throws at runtime.
- `CommandDialog` does NOT wrap children in a cmdk root - always nest
  `<Command>` yourself: `<CommandDialog><Command><CommandInput/>…</Command></CommandDialog>`.
- NDS type utilities (text-label-sm, …) are registered as font-size classes in
  `src/lib/utils.ts` (extendTailwindMerge). Add any NEW `--text-*` token there too, or
  tailwind-merge will treat it as a color and silently drop it next to `text-text-*`.
- Adding one: `pnpm dlx shadcn@latest add <name> --yes`, then grep it for default-palette
  classes (e.g. `bg-neutral-*`) and remap to tokens - the palette is disabled. Also remove
  unused React imports (strict `noUnusedLocals`).
- shadcn semantic classes (`bg-primary`, `text-muted-foreground`, …) are bridged to NDS and
  belong INSIDE `src/components/ui/` only. Craft code uses foundation tokens.
- Icons: **@phosphor-icons/react** (regular weight default). 16px default, 12 inline-small,
  20 emphasis, 24 decorative. Generated ui/* components also use Phosphor
  (`iconLibrary: "phosphor"` in components.json).

## NDS app components (`src/components/nds/`) - from the Figma Web design system

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
  Menu/select item highlight (hover + arrow keys + open submenu) = `background-muted`
  via Base UI's `data-highlighted`/`data-popup-open` attributes - never `bg-accent`:
  accent maps to `background-highlight`, which IS the menu panel bg (invisible highlight).
- Sidebar nav sets: `PEOPLE_SIDEBAR` (default) and `PAYMENTS_SIDEBAR` (Payroll,
  Invoices / Monthly salary updates / Configuration → Payroll Schedule / History) -
  pass via `<Sidebar title groups activeItem>`.
- Filters (`nds/filters/`): `FilterMenu` (button → field list → nested submenu value panel
  with search + multi-select + Reset/Apply), `FilterBar` (applied container: segmented
  editable chips `[icon field | is | values | ×]` h-9 rounded-md, AI prompt entry, save-view,
  Clear), `parsePromptToConditions` = deterministic mock AI (options + synonyms).
- `DisplayMenu`: "Display options" panel (group by, sort by + direction, column chips,
  Apply/Reset draft flow). Controls ON the flyout surface (selects, sort button, chips)
  don't use form-field tokens (white fill + ring reads as a cutout) - they use hairline
  borders + faint fills, currently **hardcoded rgba marked `TODO: Fix color`** until
  on-flyout tokens exist. Chips: h-9 rounded-full pills - on = faint solid fill,
  off = hairline border + muted text.
- Responsive toolbar (employees page): the toolbar wraps in `@container/toolbar`
  (container query, NOT media query - canvas windows resize independent of viewport).
  Button labels get `@max-3xl/toolbar:hidden` (icon-only below 768px; add `aria-label`
  + `title` + keep count badges visible), search swaps to an icon button below 36rem
  (`@max-xl/toolbar`) that expands to a full-row field (autofocus, Esc/Cancel collapse,
  brand dot on the icon when a query is active).
- Editable table (`nds/editable-table.tsx`, Figma 9738:11698): CSS grid + subgrid rows
  with `gap-px` over `bg-border-base` = grid lines; cells 44px `px-3 py-1.5`
  Paragraph/Small (numbers right-aligned, **Inter not mono - pattern-level DS spec**),
  headers 32px highlight bg Label/XSmall. States: hover `bg-background-highlight`,
  editing `focus-within:shadow-border-brand`, open select `shadow-border-active`.
  Cell types: Text, Number (2dp on blur), SelectAndType (unit select, DS default
  unit-first), Select, Date, Icon (48px), Caret (40px). `ExpandedRowPanel` =
  col-span-full highlight surface with form fields; `AddRowFooter` = ghost brand
  ListPlus row. Form primitives: FieldLabel/TextInput/TextArea (controls) +
  SelectField - 36px, `shadow-button-gray`, focus `shadow-border-focus`.
- Table recipe: rows 54px, cells px-5, header Label/Small muted + CaretUpDown sort,
  IDs/amounts in `font-mono text-mono-xs`, `StatusPill` (white pill + ring + status dot),
  pagination = circular 36px buttons + rows-per-page pill (`shadow-pagination`).
- Canvas crafts: `<CanvasCraft slug windows=[…]>` + route
  `staticData: { layout: 'canvas' }`. The route fills the viewport (root hides the top
  nav), Safari-chrome `BrowserWindow`s drag via titlebar / resize via corner / click to
  front, and all chrome lives in the `FloatingDock` - a top-left pill (logo + status +
  craft title) that expands into a panel: description, tags, craft switcher,
  Markers toggle (`A`), notes, theme, ⌘K. Start window `y` ≥ 72 so the pill doesn't
  cover the first titlebar.
- Canvas navigation (Figma-style): zoom 25–200% via bottom-left controls, ⌘/Ctrl +/−/0,
  and pinch / Ctrl-scroll toward the cursor; "Fit all windows" reframes everything;
  "Tidy up" (broom) arranges windows in a centered left→right row and refits; the
  bottom-left minimap shows window rects + a draggable brand-outlined viewport. The view
  auto-centers on the windows at mount. The **green traffic light**, the **corners
  button**, or **double-clicking the titlebar** presents one window at ~98vw/98vh at
  crisp 1:1 regardless of canvas zoom, preserving that window's interaction state
  ("app view") - Escape, backdrop, corners button, or green light exits. All canvas
  chrome hides while presenting. Surface is 4000×2400.
- Blueprint tooling: 20/100px line grid, edge rulers with adaptive logical-px labels,
  and a per-window readout above each titlebar (`w × h` of the content viewport +
  `x · y`) for eyeballing responsive sizes. (Ruler/readout use 10–12px mono - a
  deliberate canvas-tooling exception to the type scale.)
- Windows panel (top-right): lists source windows and snapshots; click to jump/focus,
  `×` removes a snapshot. The **camera button** on a window's chrome freezes its
  current DOM (open popovers included) as an inert snapshot window - use snapshots to
  narrate stages/steps of a flow.
- Design-note pins: the speech-bubble toggle (bottom-left cluster) enters annotate
  mode - click anywhere (window or canvas) to drop a numbered pin with an editable
  note card; **⌘/Ctrl-click any DOM element inside a window** (works outside annotate
  mode too) pins that element's region with a dashed brand highlight that tracks the
  element live (scroll/drag/filter changes). Pins travel with their window, register
  into the dock's Notes sheet, Esc closes/exits. Popovers/menus inside windows portal
  into the window (see `ui/portal-context`), so they zoom with the canvas and appear
  in snapshots.
- Hotkeys: `n` / `shift+n` cycle focus through windows (incl. snapshots) and zoom-fit
  each one; ⌘+/−/0 zoom; `a` toggles markers; Esc exits card → annotate mode →
  app view, in that order. Default window size for new crafts: **1512×910**
  (MacBook-class viewport).

## Docs site (`/docs`)

Live, token-driven NDS documentation for designers/developers: Colors,
Typography, Spacing, Elevation, Layout & sizes + storybook-style component pages
(`/docs/components/*`: AppBar, Sidebar, Stepper, Buttons, Form controls, Feedback,
Filters pattern, Editable table, Page shell - live `Specimen` previews +
`PropsTable`, both in `src/docs/doc-kit.tsx`).
Pages render from the real tokens (`src/routes/docs/*`, primitives in
`src/docs/doc-kit.tsx`) - swatches measure resolved values at runtime, so
they follow the theme. Swatch class lists must be LITERAL strings (Tailwind
JIT can't see `bg-${x}`). When tokens change, these pages follow automatically;
when token NAMES change, update the literal lists. Full per-component
variant/prop docs are the next milestone. Crafts stay a separate catalog
(`/`), and all crafts share the same playground machinery
(`CanvasCraft` - windows/zoom/minimap/pins/snapshots are common; only the
window contents differ per craft).

## Playground structure

- A craft (prototype for a flow, component, pattern, or feature) = folder
  `src/crafts/<slug>/index.tsx` + entry in `src/crafts/registry.ts` + thin
  route `src/routes/crafts/<slug>.tsx` that mounts it inside
  `<CraftFrame slug="…">`. Nav switcher, ⌘K palette, and the gallery all read the registry.
- To add one: copy the `demo-annotations` pair (route + craft folder), register it. Done.
- Variants (`variants={[{ id, label, node, note? }]}`) = alternative flows/approaches A/B/C -
  the frame renders tabs to switch between them.
- Annotations: wrap anything in `<Annotate n={1} title="…" note="…">` → numbered marker +
  popover + entry in the notes panel. Toggle via frame switch or the `a` key.
- Mock data ONLY - no fetch, no APIs, no network. Seeded deterministic generators in
  `src/mocks/` (same data every reload, safe for screenshots/demos).
- Flow & state explorer (`playground/explorer.tsx`) - review-harness mode for
  state-heavy features: wrap the craft in `<ExplorerProvider catalog storageKey>`,
  pass `<FlowsPanel/> + <StatesPanel/>` via CanvasCraft's `overlays` prop, and have
  the app derive its view from `useExplorer()` selection (remount per state via `key`
  so scenarios never leak). Left panel = screens-to-design checklist (localStorage,
  progress bar, minimizable); right = every state of the selected screen, one click
  each; `scope: 'full'` states get v2/Beyond-v1 badges. Reference use:
  `src/crafts/multi-payroll/` (catalog.ts = A–H matrix; engine.ts = tested
  transition math - retro/gap/overlap, benefits true-up, PTO re-rate; fixed
  WORLD_TODAY 2026-07-15 keeps every state deterministic).
- Canvas flow groups: `PlaygroundCanvas`/`CanvasCraft` accept
  `groups=[{id,label,windowIds}]` (Figma-style section under member windows; the
  constant-screen-size label above the box drags the whole group), plus
  `surfaceW/surfaceH/minZoom` overrides and `focusWindow={{id,nonce}}` - the explorer
  bumps `focusNonce` on every `show()`, so panel clicks AND in-app buttons pan/fit the
  canvas to that screen's frame. Multi-payroll = one frame per screen (27), one group
  per flow; in-app buttons call `show()` so flows click through end to end.
- Form flows: `FormShell` (multi-payroll ui) = no AppBar/Sidebar - slim title bar +
  left `Stepper` rail (nds/stepper, Figma 89:5507: 24px brand check / brand spinner /
  muted check, Label/XSmall, 24px hairline connectors) + centered `FormCard` column.
  Review screens: `ReviewSection` (+Edit link), `ReviewChip` fact pills, `AvatarStack`,
  gray "when you save" box.

## AI components (`src/components/nds/ai/`)

`docs/foundations/ai-components.md` catalogs 19 AI-native UI patterns, grouped by
job and built with mock data from `src/mocks/ai-components.ts`. Docs at
`/docs/components/ai-*` (one page per group, linked from `/docs/components`).

- `agent-status.tsx` - `LoadingState`, `Thinking`, `StreamingText`, `TaskRows`.
- `conversational.tsx` - `Chat`, `PromptBar`, `SelectionActions`.
- `decisions.tsx` - `ApprovalCard`, `RecommendationCard`, `FineTuneCard` (Approval/
  Recommendation mirror `nds/feedback.tsx`'s `EmmaCard` shell: `shadow-ai` glow,
  brand Sparkle header).
- `knowledge.tsx` - `ContextCards`, `DiffTable`, `RecordsTable`, `FilterTable`,
  `InsightCards`, `CodeBlock`. The three tables reuse `ui/table` + `StatusPill`
  rather than forking table chrome.
- `navigation.tsx` - `SidebarNav` (reuses `nds/sidebar.tsx`'s panel recipe for an
  icon-less, badge-driven nav set - not the same item type as `Sidebar`, so it's a
  parallel component, not a variant prop), `Search` (built on `ui/command`, empty
  state surfaces suggested prompts instead of a blank box).

These are separate, mock-only specimens - they do not fork or replace
`nds/filters/*` or `nds/editable-table.tsx`. Feeds the "AI page layout" TBD in
`foundations/layouts.md`.

## Grain (`src/components/nds/grain/`)

`docs/foundations/grain.md` is Niural's actual AI-native design language (10
named grains, confidence-driven density, the shell/process/atom taxonomy) -
built 2026-08-19, **not yet reconciled** with the older AI components survey
above (`/docs/components/ai`, renamed "AI patterns" in the docs nav 2026-08-20
after its old "Grains" label caused real confusion with this system - Anjil is
still deciding that page's ultimate fate separately). Don't merge the two
catalogs without checking first.

- `types.ts` - `GrainKind` (the ten names), `densityFromConfidence()` (.88/.55
  thresholds - the single source, don't hardcode elsewhere), `GrainFact`/
  `GrainExit`/`GrainLiveness`/`GrainScenario`.
- `atoms.tsx` - the anatomy pieces: `ConfidenceMeter`, `LivenessBadge`,
  `Provenance`, `ExitButton` (renders a live undo countdown when given
  `countdownSeconds`), `FactsTable`.
- `grain.tsx` - **`<Grain>`, the one fundamental component.** Density, claim-bar
  color, and risk-footer tint all derive from `confidence`/`liveness`/`risk`
  props - callers never pick a "variant." Supports `streaming` (mocked
  token-by-token claim reveal via `useStreamedText`, `hooks.ts`).
  Never uses `shadow-ai` (see below).
- `process.tsx` - `Skeleton`, `StepList`, `ToolChip`. Work-in-progress only -
  no claim bar, ever; the moment something asserts it belongs in `grain.tsx`.
- `shell.tsx` - `<Shell>`, the Floater as Grain-at-line-density docked above a
  composer; `off` degrades it to a bare search input. Generalized (bezel
  craft, 2026-08-24): `dock` hosts any non-grain content (bulk-selection
  summary, context chips), `row` replaces the composer row entirely
  (scanning, voice, run-in-flight, undo ring) - additive to the original
  `grain` prop, not a rewrite.
- `thread.tsx` - `<Thread>`, Shell at **thread density** (the taxonomy's
  second density, built 2026-08-24): docked to the side instead of the
  bottom, a running conversation instead of one grain, with a `pinned`
  rail above the turns for anything Emma surfaces unprompted.
- `controller.tsx` - `<GrainController>`, the interactive harness at
  `/docs/grain-component`: use-case picker (loads a `src/mocks/grain.ts`
  scenario), confidence slider, density/liveness/risk overrides, streaming
  speed, live-undo demo, preview width, and a Shell/off preview - the proof
  that one component evolves by situation instead of needing ten.
- Mock data: `src/mocks/grain.ts` (`GRAIN_SCENARIOS`, one per grain kind, ported
  from `grain-specs.html`).
- Docs: `/docs/grain` (language), `/docs/grain-catalog` (the ten grains,
  interactive), `/docs/grain-component` (the controller), `/docs/grain-composition`
  (slots + migration path) - registered as their own "Grain" area in
  `src/routes/docs.tsx`'s `AREAS`, separate from the "AI patterns"-labeled `ai` area.
- Applied in `/crafts/ask-emma` (launcher, payroll run, expense run, PTO
  ask-thread - grain-flows_2.html on `<Grain>`/`<Shell>`). That craft's
  `chat/` subfolder is a second, Figma-sourced pair of screens that does
  NOT use Grain - see the craft note in `docs/foundations/grain.md`.
- Also applied in `/crafts/bezel` (Employees list wearing one floating
  object - bar or docked copilot thread, never both - ported from a
  hand-built `bezel.html`). This is the craft that generalized Shell and
  built Thread; every claim it shows is computed live from
  `src/mocks/employees.ts` via `src/mocks/bezel.ts`, not authored copy.

**Token note - do not use `--shadow-ai` (the purple glow, see `decisions.tsx`'s
`shadow-ai glow, brand Sparkle header` above) inside `grain/*`.** Grain's color
law is contrast, not hue; new tokens `grain-ink` / `grain-ink-foreground` /
`grain-ink-muted` (near-black in light mode, inverted to near-white in dark,
`src/styles.css`) carry the claim bar instead. This is a deliberate token
split, not an oversight - `shadow-ai` predates Grain and is what the language's
own decision log rejects.

## Gaps - TBD in foundations (flag, don't invent)

- `sizes.md`: blank in foundations, but the Figma Web design system fills most of it -
  AppBar 58, sidebar 200, buttons/inputs 34–36, table rows 54, status pill 24 (see the
  NDS app components section). Radius: buttons 9px, menus 12px, panels 16px.
- `constants.md`: z-index, breakpoints, animation durations → Tailwind defaults.
- `colors.md`: `pale-{pink|teal|violet}-{900|1000}` referenced but undefined → nearest
  defined primitive used, marked `TODO` in styles.css.
- `border-hightlight` typo in colors.md → implemented as `border-highlight`.
- `assets.md`: icon library unspecified in foundations → Phosphor chosen for the playground.
- Card/popover dark surfaces: provisional (base / gray-800) until surface usage is specified.
- On-flyout control surfaces (selects/chips/buttons sitting on popover surfaces): no
  tokens yet - hardcoded rgba hairlines/fills in `display-menu.tsx`, marked
  `TODO: Fix color`. Mint `--border-on-flyout` / `--background-on-flyout-*` style tokens
  and replace.

When foundations change: re-copy into `docs/foundations/`, update `src/styles.css` tokens,
then update this file. All three must stay in sync.
