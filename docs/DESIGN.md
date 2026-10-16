# NDS - design system reference (canonical)

Read this file before ANY UI work. It is the distilled, always-current contract.
Full foundations live in `docs/foundations/*.md` - consult them only when this file
isn't enough (they cost far more tokens).

**niural-fe-pkg is the only token source.** `tailwind.config.ts` loads fe-pkg's Tailwind
preset (`@niural/components/preset`) via `@config` in `src/styles.css`, so the class names
below are fe-pkg's own - the same ones its components use. Tailwind's default palette is
**disabled**: `bg-red-500` doesn't exist, `bg-error` does. If a class doesn't compile, fe-pkg
doesn't have that token. To add or change a token, change it in niural-fe-pkg.

Lookup order: (1) fe-pkg class · (2) fe-pkg CSS variable when it has the var but no class:
`bg-(--elevation-alpha-12)`, `border-(--text-muted)` · (3) nearest fe-pkg class. Never a hex.

## Colors (fe-pkg preset: backgroundColor / textColor / borderColor / colors)

- Backgrounds: `bg-{base|muted|emphasis|disabled|highlight|item|popover}`,
  `bg-{success|warning|info|error}` (solid) + `-{emphasis|muted|muted-hover|highlight}`
- Text: `text-{primary|muted|subtle|emphasis|disabled|on-color|on-inverted}`,
  `text-{success|warning|info|error}` + `-subtle`, `text-brand` (brand text),
  `text-interactive`
- Borders: `border-{base|muted|emphasis|card|disabled}`, `border-{success|warning|info|error}`
  + `-muted`, `border-overlay`. (No `border-highlight` class - use `border-base`.)
- Brand: `bg-brand` (primary) / `bg-brand-{emphasis|muted|base|surface}`, `border-brand`,
  `ring-brand`, `text-brand-primary`. Wallet: `bg-wallet`, `bg-wallet-secondary`.
- Surfaces: `bg-surface-{app|frame|page}` (page = most elevated; inverts in dark)
- Accents (decorative only - NEVER for status): `bg-accent-{orange|pink|teal|violet}-{base|muted|highlight}`
- Overlays: `bg-overlay`; alpha tints have no class - `bg-(--elevation-alpha-12)`.
- `white` / `black` / `pureWhite` / `pureBlack` exist (fe-pkg values). Nothing else does.

Rules: dark mode is automatic via tokens - never write `dark:` color overrides.
Status UIs pair bg + text + border from the SAME family (banner = `bg-warning-highlight`
+ `text-warning` + `border-warning-muted`). `text-on-color` on any colored/brand background.
Inverted ink (Grain claim bar): `bg-(--text-base)` + `text-(--background-base)`.

## Typography - fe-pkg `<Text type>` as classes

fe-pkg only ships its type scale as the `<Text type="...">` component (textStyles in
`components/text/text.tsx`). `src/styles.css` mirrors it 1:1 as utilities, same names:
`text-label-small` == `<Text type="label-small">`. Each class sets size + line-height +
tracking + weight.

- Titles: `text-title-h1..h5` (56 / 48 / 36 / 32 / 24px, weight 520). Short copy only.
- Labels: `text-label-{xsmall|small|medium|large|xlarge}` (13/14/16/18/20px, 560, -0.03em) -
  buttons, form labels, table headers, nav, badges, tabs. **`text-label-small` is the
  platform default UI text.**
- Paragraph: `text-paragraph-{xsmall|small|medium|large}` (13/14/16/18px, 450) - reading text.
  Body default = paragraph-small (14px).
- Caption: `text-caption-sm` (12px) / `text-caption-xs` (10px). Add `font-medium` for the
  emphasized caption (badges, metadata labels).
- Numbers: money, IDs, dates in tables, account numbers stay in Inter - add `tabular-nums`
  on top of a label/paragraph size, e.g. `tabular-nums text-label-small`. Never `font-mono`
  for numbers; Geist Mono (`font-mono`) is only for code: class names, paths, snippets.
- Weights are fe-pkg's: `font-normal` 450, `font-medium` 560, `font-heading` 520,
  `font-semibold` 600.

Rules: max 2 type sizes per component · no custom font sizes · Label for UI, Paragraph for
reading · NO `gap-*` between stacked text lines (title+subtitle, label+value) - line-height
handles it, remove `gap-1` on sight. Never `text-base` (fe-pkg's `--text-base` is a color).

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

## Shadows / elevation (fe-pkg preset plugin utilities - set box-shadow directly)

- Cards: `card`, `card-hover`, `elevation-card*` (rest/info/success/warning/error)
- Floating: `flyout` (menus/popovers), `elevation-tooltip`, `elevation-modal`, `elevation-ai`
- Rings (inputs/interactive states): `borders-base`, `borders-focus`, `borders-active`,
  `borders-error`, `borders-shadow` (brand ring)
- Buttons: `buttons-primary`, `buttons-neutral`; fills `bg-button-primary` / `bg-button-neutral`
- Generic depth (no semantic meaning): `shadow-sm|shadow|md|lg|xl|2xl|inner`
- Radius (fe-pkg named scale): `rounded-{tight 4|snug 6|control 9|surface 12|panel 16|overlay 20|pill}`

Card recipe: `rounded-xl bg-base p-3 card hover:card-hover` - the 1px ring is built into the
shadow, do NOT add a border on top. These utilities replace each other (not compose) and
`cn()` knows that, so `className="shadow-none"` cleanly overrides a component's `card`.

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
- `src/lib/utils.ts` (`cn` / extendTailwindMerge) knows fe-pkg's type classes
  (font-size group), elevation utilities (shadow group) and named radii. Add any NEW
  type/shadow utility there too, or tailwind-merge silently drops or keeps the wrong one
  (e.g. `text-label-small` read as a color next to `text-muted`).
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
  AppBar 58px on surface-page; content panel floats with 8px gutter, rounded-xl,
  border-base. Sidebar 200px, translucent (`bg-overlay` + blur),
  active item = white pill + `borders-base` + `text-brand`.
- Buttons (ui/button restyled): h-[34px], `rounded-control` (9px), `text-label-small`.
  `default` = violet radial gradient + `buttons-primary`; `secondary` = white→highlight
  gradient + `borders-base`; `outline` = flat white + ring; `ghost-destructive` = error
  text. Wrap text children in `<span className="px-1">` (4px optical label pad).
- Button fills `bg-button-primary|neutral` + rings `buttons-primary|neutral`
  (all fe-pkg), `rounded-control` 9px, kbd `rounded-snug` 6px. Flyout panels: menu `rounded-xl`
  p-1 on surface-page; combobox/value panels `rounded-2xl` on base; items h-[34px] rounded-lg.
  Menu/select item highlight (hover + arrow keys + open submenu) = `bg-muted`
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
  with `gap-px` over `bg-(--border-default)` = grid lines; cells 44px `px-3 py-1.5`
  Paragraph/Small (numbers right-aligned, **Inter not mono - pattern-level DS spec**),
  headers 32px highlight bg Label/XSmall. States: hover `bg-highlight`,
  editing `focus-within:borders-shadow`, open select `borders-active`.
  Cell types: Text, Number (2dp on blur), SelectAndType (unit select, DS default
  unit-first), Select, Date, Icon (48px), Caret (40px). `ExpandedRowPanel` =
  col-span-full highlight surface with form fields; `AddRowFooter` = ghost brand
  ListPlus row. Form primitives: FieldLabel/TextInput/TextArea (controls) +
  SelectField - 36px, `borders-base`, focus `borders-focus`.
- Table recipe: rows 54px, cells px-5, header text-label-small muted + CaretUpDown sort,
  IDs/amounts in `tabular-nums text-paragraph-xsmall`, `StatusPill` (white pill + ring + status dot),
  pagination = circular 36px buttons + rows-per-page pill (`buttons-neutral`).
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
  button**, **double-clicking the titlebar**, or a craft's **Play** button presents one
  window full-bleed (no browser chrome) at crisp 1:1 regardless of canvas zoom,
  preserving that window's interaction state ("app view") - **Esc** exits (an "Exit
  preview · Esc" pill announces itself, then hides until you hover the top edge). All
  canvas chrome AND `overlays` (explorer panel) hide while presenting; only `hud`
  survives. Surface is 4000×2400.
- Left chrome column (canvas mode), top to bottom: Mesurer toolbar (library-pinned at
  16,16) → FloatingDock (Back + settings, `top-16`) → windows stack (`top-28`).
- Blueprint tooling: 20/100px line grid, edge rulers with adaptive logical-px labels,
  and a per-window readout above each titlebar (`w × h` of the content viewport +
  `x · y`) for eyeballing responsive sizes. (Ruler/readout use 10–12px tabular-nums - a
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
- Mock engine (`src/mocks/engine/`) - for data that should *mature* during a demo.
  `defineFlow({ id, initial, states })` = a state machine per kind of record; a state
  moves on time (`after: { in: '2d', to, jitter }`) or on events (`on: { EVENT: to }`).
  `MockEngineProvider config` owns a world of flow instances on a **virtual, seeded
  clock** (play / speed / +1h / +1d / jump-to-next / reset; identical every reload).
  Screens project the snapshot onto their existing mock rows (`useEngine(select)`, or
  `useOptionalMockEngine()` so frozen catalog frames fall back to static data). The
  `<Director>` HUD (`playground/director.tsx`, toggle `D`) is the presenter's remote -
  pass it via CanvasCraft's `hud` so it survives Play. Reference: `crafts/bezel/world.ts`
  (onboarding flow: Invited → Onboarding → Active drives the Employees status column).
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
- Master App (`/app/$section`): crafts are small increments; the Master App is where
  they add up. A section can host several live crafts - `?page=<sidebar leaf>` picks
  the one whose `subNavLabel` matches (Payments: Payroll Schedule → multi-payroll,
  Invoices → payment-flow), and each craft forwards sidebar leaves it doesn't own via
  `onSidebarNavigate`. Wallet is its own section, reached from the AppBar wallet pill.
  Real-time data: a craft's live store persists to localStorage + syncs across tabs
  (storage event), so the craft canvas and Master App share one world
  (`payment-flow/store.tsx` `persistKey` is the reference). The mock data dock
  (`payment-flow/mock-dock.tsx`: dataset presets, time machine, controls) floats
  bottom-center on every Master App section; its `leading` slot carries the Master
  App's "Go to" menu (sections, this section's crafts, all crafts - replaces the old
  top-right switcher). The dock minimizes to a small handle (remembered in
  localStorage) and drags anywhere by its grip (position remembered; double-click the
  grip to snap home - bottom-left, above the Bezel lane). Its panel opens toward the
  half of the screen with room.
- Bezel across the Master App (`crafts/bezel/master-bezel.tsx`, `MasterBezelLayout`): ONE
  Emma object mounted around every section (not per craft), so it survives navigation -
  a bar OR the copilot column, never both. Three homes (`placement-menu.tsx`, a popover in
  the bar and the thread header; remembered in localStorage `nds-bezel:placement`):
  **Dock** = the bar in the app's bottom ground strip (fixed, default); **Sidebar** = the
  copilot column on the right, resized by dragging its inner edge (340-760px, remembered);
  **Immersive** = Emma as a Messenger-style chat head (`chat-head.tsx`): a 56px orb on any
  edge, anywhere along it, with a badge (this page's finding + other sections' pins) and a
  preview bubble with the latest claim. Tap = open/close a card beside the head (440px;
  620px for bulk/context); hold = the Orbit menu (`components/nds/orbit-menu.tsx`, a CSS-only
  recreation of uiarc's spec: press-hold, drag toward an action, release; pie targeting with
  a 34px dead zone; label pill; done confirmation; full keyboard; motion-reduce) with Ask /
  Show me / Sidebar / Voice / Back to the bar / Hide; drag = move it, snapping to the nearest
  edge. Also **⌃⌥ + arrows** or the menu's edge pad. Every move
  and bar<->column change morphs via a view transition (`emma-bezel` / `emma-app`). Docked,
  the app (AppBar included) reflows beside the column.
- Bezel visuals (`Shell variant="bezel"` + `BEZEL_SURFACE` in grain/shell.tsx): glass surface
  (`bg-base/88` + blur + fe-pkg elevation-alpha ring/shadow), the AI gradient
  (`bg-niural-ai-colors-gradient`) as a territory hairline on the bar's edge and as the full
  fill for Run in flight (Bezel doc D-11), 54px row, label-small claim over a mono caption-xs
  sub-line, borderless 32px circular controls, pill buttons. Docs callers of `<Shell>` keep
  `variant="default"`, unchanged.
- Bezel selection channel (`crafts/bezel/selection.tsx`): a page reports its ticked rows via
  `useReportSelection` (rows as label/value/facets, a total, "what they share", its actions,
  an `answer()` grain) and the Bezel goes Bulk - inside the Master App it IS the bulk bar
  (Invoices hides its own). "Ask about these" -> chips -> the question docks the copilot with
  an answer computed from exactly those rows (`src/mocks/bezel-selections.ts`). Found claims
  tint the rows they're about (`script.found.rowIds` + `data-bezel-row` on the page's rows).
- Bezel director (`crafts/bezel/director.ts` + `dock-tab.tsx`): the Master App mock dock has a
  **Bezel** tab (via `MockDock`'s `extraTabs`) that forces any mode/situation on the live Bezel -
  every state, Bulk/As context (uses the page's ticked rows, else 3 demo rows), Ask / voice /
  sidebar thread, the voice -> agent run, placement (Dock / Sidebar / Immersive + edge), pins,
  reset to the page's own claim, and a ▶ Play states tour. MasterBezelLayout registers its
  controls and publishes its state (a small external store - the dock renders in another tree).
- Bezel presence + hotkeys (Master App; departs from the Bezel doc's "always present"): a
  quiet page shows NO bar. It shows itself only when there is something - the section's
  script sets `attention` (Payments: overdue invoices; Settings: blocked state payroll) and
  the page opens on its Found claim - or a run is in flight / an undo window is open.
  Otherwise summon it: **⌘E / Ctrl+E** = Ask (new `ask` mode: the claim yields to a focused
  input; again or Esc puts it back where it was; sending travels the bar into the copilot
  column with the question), **⇧⌘E** = open/close the Sidebar (⌘E when it's open focuses its
  composer), **⌃⌥ + arrows** = Immersive, to that edge, **Esc** = step back (sheet -> claim). The AppBar "Ask Emma" pill = ⌘E, via
  `AppBarLinksContext.onAiClick`. The Bezel craft itself still demos the always-present bar. `FloatingBezel`
  renders a `BezelScript` (`src/mocks/bezel.ts`); each section's script lives in
  `src/mocks/master-bezel.ts`, computed from that section's mocks - Payments reads the same
  live store the mock dock drives, so claims move with the dataset/time machine. A run in
  flight keeps its origin page's words as it follows you; other sections' open tensions
  pin into the copilot thread with a "Go to" exit.
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
  Recommendation mirror `nds/feedback.tsx`'s `EmmaCard` shell: `elevation-ai` glow,
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
  Never uses `elevation-ai` (see below).
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
`elevation-ai glow, brand Sparkle header` above) inside `grain/*`.** Grain's color
law is contrast, not hue; new tokens `grain-ink` / `grain-ink-foreground` /
`grain-ink-muted` (near-black in light mode, inverted to near-white in dark,
`src/styles.css`) carry the claim bar instead. This is a deliberate token
split, not an oversight - `elevation-ai` predates Grain and is what the language's
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
