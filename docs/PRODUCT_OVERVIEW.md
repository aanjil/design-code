# NDS Playground — Product Overview

*Last updated: 2026-07-10*

## What this is

NDS Playground is a **design-exploration tool**, not a product app. It's where
design and engineering prototype UX flows, patterns, and micro-interactions
against realistic mock data — so stakeholders can react to something they can
click through, before any real engineering handoff happens.

There's no backend, no live data, no auth. Every screen runs on deterministic,
seeded mock data, so the same demo looks identical every time you reload it —
safe for screenshots, recordings, and stakeholder walkthroughs.

Think of it as a living pattern library + a stakeholder-review tool, built on
top of NDS (the Niural Design System) as it's defined in Figma.

## Who uses it and how

- **Design** builds an "experiment" — a flow, screen, or component pattern —
  using real NDS components and mock data, instead of static Figma frames.
- **Engineering** gets a working reference implementation of the pattern
  (interaction states, edge cases, responsive behavior) before building the
  real thing against real APIs.
- **Product / stakeholders** open a link, click through the actual flow,
  compare alternative approaches side-by-side, and leave feedback anchored to
  specific pixels — instead of reviewing static mocks or a slide deck.

## Current features

### 1. Experiment gallery & navigation
- **Home gallery** (`/`) lists every experiment as a card: title, description,
  tags, and status (`idea` / `wip` / `review` / `ready`).
- **Top nav experiment switcher** — jump between experiments from anywhere.
- **⌘K command palette** — fuzzy-search experiments by name or tag.
- **Light/dark theme toggle**, applied instantly across all NDS tokens.

### 2. Variant comparison
Any experiment can register multiple **variants** (alternative flows or
approaches — "Option A / B / C"). The viewer gets tabs to switch between them
live, with an optional one-line note explaining each approach's rationale.
This is the primary tool for "here are 3 ways we could solve this" reviews.

### 3. Design annotations & notes panel
- Wrap any element in an `<Annotate>` marker to drop a numbered pin with a
  note (e.g. "① this chip clears all filters in one click").
- All markers for an experiment collect into a **Notes panel** (side sheet) —
  a running list of design rationale a reviewer can scan without hunting for
  pins on the screen.
- Markers toggle on/off with a switch or the `A` key, so the demo can be shown
  clean and then annotated on demand.

### 4. Canvas mode (multi-screen, Figma-style review surface)
For experiments that span multiple screens or need a spatial layout, an
experiment can opt into a large pan/zoom canvas instead of a single page:
- Each screen renders inside a **draggable, resizable browser-chrome window**
  (drag by titlebar, resize by corner, click to bring to front).
- **Zoom/pan** via on-screen controls, ⌘/Ctrl +/−/0, or pinch/scroll — matches
  the feel of navigating a Figma board.
- **"Fit all windows"** and **"Tidy up"** auto-arrange the canvas into a clean
  left-to-right row.
- **Minimap** shows all windows and the current viewport, with a draggable
  viewport box for quick navigation.
- **Windows panel** lists every window and snapshot for quick jump/focus.
- **Snapshots** — a camera button freezes a window's current on-screen state
  (including open menus/popovers) into a static, inert window. Used to
  narrate the *steps* of a flow ("before" / "after" side by side) rather than
  only the end state.
- **Present / "app view"** — double-click a titlebar (or the green traffic
  light) to blow one window up to near-fullscreen at true 1:1 pixel scale,
  preserving its live interaction state, for a focused walkthrough. Escape or
  the corners button returns to the canvas.
- **Design-note pins on canvas** — beyond the standard `<Annotate>` markers,
  reviewers can ⌘/Ctrl-click *any element inside a window* to pin that exact
  region with a highlight that tracks it live (through scrolling, dragging,
  filter changes, etc.) — useful for calling out something without the
  designer having to hand-instrument it in code first.
- **Blueprint tooling** — an optional grid, edge rulers, and a live
  width×height + position readout per window, for eyeballing responsive
  breakpoints during review.

### 5. Reference NDS components implemented
A growing set of the Figma "Web" design system rebuilt in code and available
to every experiment:
- App shell: top **AppBar**, **Sidebar** (collapsible nav), **PageLayout**
  (header/body/footer).
- **Filters**: a filter builder (`FilterMenu`) with field → value drill-down,
  search, and multi-select; applied filters render as editable chips
  (`FilterBar`) with an inline **AI prompt-to-filter** input (deterministic
  mock — turns a typed sentence into structured filter conditions) and a
  save-view action.
- **Display customization** (`DisplayMenu`) — group-by, sort-by + direction,
  and column visibility, with an explicit Apply/Reset draft flow (changes
  don't apply until confirmed).
- **Data tables** — sortable headers, status pills, monospace numeric/ID
  columns, and pagination.
- Buttons, inputs, dropdowns, dialogs, tabs, tooltips, badges, and the rest of
  the shadcn/Base UI primitive set, all restyled to NDS tokens (colors, type
  scale, spacing, shadows, radii) rather than generic Tailwind defaults.

### 6. Live experiments today
| Experiment | Status | What it shows |
|---|---|---|
| **Employee directory — filters** (`/e/employee-filters`) | WIP | Full Figma Web shell + nested filter menu + editable filter chips + AI prompt filtering + Display customization + employee table, shown as three draggable canvas windows. |
| **Playground demo** (`/e/demo-annotations`) | Ready | Reference experiment for variants, annotations, and the notes panel — the template designers copy to start a new one. |

## What this is deliberately *not*

- Not connected to any real API, database, or auth — all data is generated
  mock data (`src/mocks/`), so nothing here reflects live customer data.
- Not a production app — no deployment target is configured, and it isn't
  meant to ship to end users.
- Not a source of truth for design tokens — that's Figma; this repo consumes
  those foundations and stays in sync with them (see `docs/DESIGN.md`).

## Ideas for what we could add next

Roughly ordered by how directly they extend what already exists:

- **Stakeholder share mode** — a read-only, link-based view of an experiment
  (canvas state, active variant, annotations) that non-technical stakeholders
  can open without cloning the repo or running a dev server.
- **Guided walkthrough / presentation mode** — step through an experiment's
  numbered annotations or snapshots in order, like a slideshow, so a designer
  can narrate a flow live in a meeting instead of manually clicking around.
- **Exportable snapshots** — turn a canvas snapshot or window into a
  PNG/PDF for dropping straight into a deck or a doc, instead of a screenshot
  workaround.
- **Threaded/resolvable feedback on annotations** — let a reviewer reply to a
  pinned note and mark it resolved, turning the notes panel into a lightweight
  review-and-sign-off tool instead of a one-way notes list.
- **Figma round-trip** — push an experiment (or a specific variant) back into
  a Figma file via the Figma integration already available in this workspace,
  so a reviewed in-code prototype can become the canonical Figma spec instead
  of being redrawn by hand.
- **Component gallery** — a Storybook-style catalog of every NDS primitive in
  isolation (all states/variants), separate from full experiments, for
  engineers who just need to see "what does the error input state look like."
- **Device/breakpoint presets** — canned window sizes (mobile, tablet,
  desktop) in canvas mode, building on the existing per-window size readout,
  to review responsive behavior without manual resizing.
- **Experiment history/versioning** — keep prior variants of an experiment
  around after a decision is made, so "what did we consider and reject" isn't
  lost when the registry entry is edited.
- **Tagging/status filters on the gallery** — filter the home gallery by
  status or tag once the number of experiments grows past a handful.
- **Lightweight usability signal** — optional click/interaction tracking
  scoped to a single experiment session, to get quick directional signal in
  informal hallway testing (still no real backend — could be in-memory/local
  only).

## Technical reference

For engineering-facing details (stack, tokens, architecture, gotchas), see:
- [`AGENTS.md`](../AGENTS.md) — project conventions and architecture notes.
- [`docs/DESIGN.md`](./DESIGN.md) — the design token contract (colors, type,
  spacing, shadows, component rules).
- [`docs/foundations/`](./foundations) — long-form design foundation source
  docs synced from Figma.
