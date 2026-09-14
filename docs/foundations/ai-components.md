# AI components

Reference catalog of AI-native UI patterns, surveyed from
[Beautiful UI](https://beautiful-ui-five.vercel.app) (Turbo). Grouped by job, not by
the source site's order. Built (2026-08-11) in `src/components/nds/ai/*` with mock
data in `src/mocks/ai-components.ts`, one docs page per group under
`/docs/components/ai-*` - see `docs/DESIGN.md` for the component/file map.

---

## Agent status & reasoning

> Shows what the agent is doing right now, or just did.

- **Loading State** - pixel-grid loader with shimmer + elapsed time (`Churning 0.8s`).
  Variants: Drive, Dots, Orbit.
- **Thinking** - expandable trace of agent steps (reasoning, search, coding) collapsed
  behind "Thought for Ns", e.g. "Reading flavor briefs" -> "Scanning supplier lists" ->
  final output.
- **Streaming Text** - answer that streams in with inline cited sources, action chips,
  and follow-up suggestions appended after the stream completes.
- **Task Rows** - live status list for multi-step agent work: running / completed /
  failed, nested sub-steps, progress counts (`12/12`), Capsules/List view toggle.

## Conversational input

> Where the user talks to the agent.

- **Chat** - tabbed panel (e.g. per-topic tabs) with reasoning-labeled replies
  ("Sales History", "Trend Detection", `for 4s`) inside a composer thread.
- **Prompt Bar** - composer with `@` source/file mentions, `/` commands, model picker,
  file upload, connected-source list (Slack, Gmail, Figma, web search), dictation.
- **Selection Actions** - contextual toolbar on a text selection to hand it to the
  agent: Explain, Improve, Shorten, Tone, Grammar.

## Decisions & human-in-the-loop

> Points where the agent asks for a decision instead of acting alone.

- **Approval Card** - blocking question with discrete choice buttons before the agent
  proceeds (e.g. "How many flavors should we launch?").
- **Recommendation Card** - single suggested action with a confidence meter
  (High confidence / Needs review / No signal), alternatives list, Accept/Alternatives
  actions.
- **Fine-tune Card** - inspector-style panel where the agent (or user) adjusts a
  design property directly - layout W/H, radius, opacity, type.

## Knowledge & data

> Structured or retrieved information the agent is reasoning over.

- **Context Cards** - retrieved knowledge chunks with source badges (PDF, CSV),
  character counts, and a running "all chunks" total - the RAG-citation pattern.
- **Diff Table** - proposed row/cell edits overlaid on a normal table (add/change/
  remove per cell) before the user commits.
- **Records Table** - CRM-style grid: avatar/initial, tag chips, relative-time column,
  a qualitative strength/status column, external links, footer aggregates
  (count, average, calculation row).
- **Filter Table** - status-chip tabs that live-filter table rows (`All / To do / In
  Progress / Completed`), each chip carrying a count.
- **Insight Cards** - paged, narrative agent insights ("worst performer is X, down
  Y%") backed by a scrubbable inline chart and a follow-up prompt suggestion.
- **Code Block** - agent-authored code streaming in line by line, language tag, copy
  action.

## Navigation & discovery

> Getting around the product itself.

- **Sidebar Nav** - workspace switcher + quick "new task" + grouped nav
  (Workspace / Objects) with badge counts (e.g. unread Agent tasks).
- **Search** - command-style search with live filtering and an empty state that
  surfaces suggested agent prompts instead of "no results".

---

## Notes for NDS

- All 19 patterns above are candidates for the "AI page layout" TBD in `layouts.md`.
- `RecordsTable`, `FilterTable`, and `DiffTable` reuse `ui/table` + `StatusPill`
  rather than forking table chrome; `SidebarNav` reuses `nds/sidebar.tsx`'s panel
  recipe (translucent, 200px, active pill) rather than the icon-based `Sidebar` type
  directly, since AI nav items are icon-less and badge-driven. `Search` is built on
  `ui/command`. None of these fork `nds/filters/*` or `nds/editable-table.tsx` - they
  are separate, mock-only specimens, not a replacement for those real patterns.
- Every component takes real props (see each docs page's PropsTable) and falls back
  to the matching const in `src/mocks/ai-components.ts` - no fetch, deterministic.
- File map: `src/components/nds/ai/agent-status.tsx` (Loading State, Thinking,
  Streaming Text, Task Rows) - `conversational.tsx` (Chat, Prompt Bar, Selection
  Actions) - `decisions.tsx` (Approval Card, Recommendation Card, Fine-tune Card) -
  `knowledge.tsx` (Context Cards, Diff Table, Records Table, Filter Table, Insight
  Cards, Code Block) - `navigation.tsx` (Sidebar Nav, Search).
