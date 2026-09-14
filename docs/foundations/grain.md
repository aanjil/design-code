# Grain — Niural's AI-native design language

Source: `grain.html` + `grain-specs.html` + `grain-flows_2.html` (Anjil, 2026-08-19).
Built (2026-08-19) in `src/components/nds/grain/*` with mock data in
`src/mocks/grain.ts`. Docs at `/docs/grain`, `/docs/grain-catalog`,
`/docs/grain-component`, `/docs/grain-composition` - see `docs/DESIGN.md`
for the file map. This is a **separate system** from
`docs/foundations/ai-components.md` (the older 19-pattern survey at
`/docs/components/ai`) - the two have not yet been reconciled; don't merge
them without checking with Anjil.

**Applied in the `ask-emma` craft** (`/crafts/ask-emma`, `src/crafts/ask-emma/`) -
the launcher, the payroll run, the expense run and the PTO ask-thread are all
`grain-flows_2.html` recreated on `<Grain>`/`<Shell>`, one Explorer catalog per
screen and state. That craft *also* contains two Figma-sourced chat screens
(`ask-emma/chat/`) that do not use Grain at all - a different design source,
deliberately not reconciled with this one yet (same posture as the
`ai-components.md` split above). Read the craft's own file before assuming
everything under `/crafts/ask-emma` is a Grain example.

**Also applied in the `bezel` craft** (`/crafts/bezel`, `src/crafts/bezel/`,
built 2026-08-24 from a hand-built `bezel.html` prototype) - the Employees
list wearing one floating object (bottom-centre bar or docked-right copilot
column, never both) that docks a `<Grain>` when something's found, a bulk-
selection summary or context-chip rail when rows are checked, or the new
`<Thread>` (below) when the copilot opens. This is the craft that pushed
Shell from "docks one grain" to the generalized `dock`/`row` slots described
below, and built out Thread density for the first time. All of its claims
(contractor concentration, a pay-equity outlier, stale invites) are computed
live from `src/mocks/employees.ts`, not authored - see `src/mocks/bezel.ts`.

## The problem

Niural has ~200 screens that already work. The obvious way to add AI is a
little of it everywhere - an assistant panel here, a summary card there, a
sparkle on every table header. That produces noise: the summary card was
designed once, then required on every detail page, its height uncontrollable
and its content generic. It became debt within a quarter.

The opposite mistake is declaring the product AI-native and rebuilding it.
We can't - the existing product is correct and not going away.

## The decision

Define **one unit** that renders in a thread today and composes a page
tomorrow, so the product migrates screen by screen instead of forking into
two products. Emma does not write about the product - **Emma renders
pieces of it.** The design job is not "make AI components," it is "decide
which parts of Niural are answer-sized."

## What a grain is

**A grain is the smallest piece of Niural that can stand alone in an
answer.** Not new UI - existing UI, cut small enough to be a response.

Grain is a **unit system, not a material** - it doesn't redefine surface,
elevation, motion or type (the visual system stands); it defines what size
piece of the product can be an answer, and how it behaves once loose.

## Anatomy - six parts, every grain, every time

| Part | Rule |
| --- | --- |
| 1 · Claim | The dark bar. One sentence that *answers*, not a label. "$250.00" is a field; "gone in 18 days at this rate" is a claim. If it could be a column header, it's not a claim. |
| 2 · Confidence | Sets density, not just a number (see below). |
| 3 · Liveness | `LIVE` re-reads on view · `AS OF 14:20` freezes and shows drift. |
| 4 · Evidence | The actual product component, reused. If you had to design something new, it isn't a grain yet. |
| 5 · Provenance | Where it came from, computed on what. Small, monospace, always present - the user must be able to disagree with us. |
| 6 · Exit | One action, one door to the real screen. Always both. A grain with no exit is a dead end in a scroll log. |

Component map: Claim/Confidence/Liveness → `ClaimBar` region inside
`<Grain>`; Provenance/Exit → `ExitButton`/`Provenance` atoms
(`src/components/nds/grain/atoms.tsx`); Evidence → whatever the caller
passes as `<Grain body>` or `facts`.

## Density - confidence is the only variable that changes the shape

One property deforms every grain: how confident the system is. It does not
show as a percentage badge beside identical rows - it changes how much room
the grain takes.

| Band | Threshold | Shape |
| --- | --- | --- |
| High | ≥ .88 | One line, already done. Asking for approval here is the old work with extra reading - the undo *is* the consent. |
| Medium | .55–.87 | The other reading is an equal button, never an override hidden in a menu. |
| Low | < .55 | Expands into evidence, asks the narrowest possible question. Never hands the whole list back. |

`densityFromConfidence()` in `src/components/nds/grain/types.ts` is the
single source of these thresholds - don't hardcode .88/.55 elsewhere.

**The test:** strip every confidence value and provenance line off a
screen. If it looks the same, you built a better table, not an AI-native
surface.

## Terminal or transitional

Declare, per grain, whether the job **ends here** or **ends there**. This
is the brake against the agentic-UI failure mode: rebuilding the whole
product inside a scroll log with no back button, no deep links.

| | Terminal | Transitional |
| --- | --- | --- |
| Job | Completes in place | Prepared here, finished on the screen |
| Fits when | Bounded, reversible, few inputs | Long, legally binding, or needs the full page |
| Example | Approve a timesheet | Nepal tax setup - 9 of 13 prefilled, then hand off |
| Must have | Undo window | State carried across, nothing submitted |

A grain has a height budget. When the answer outgrows it, it becomes a
**door**, not a taller card - this is the actual fix for the summary-card
debt, not a rule against summary cards existing.

## Live or stamped

A thread is a transcript - scroll up twenty minutes later and old numbers
read as if they're still true. On a payroll product that's a wrong
decision on scroll, not a papercut.

- **Live** - re-reads on view. Balances, counts, statuses, anything that moves.
- **Stamped** - frozen and dated, current value alongside if it drifted.
  The record of what the user saw when they decided.

**Never** a grain that quietly keeps showing an old number - the single
most likely way the system loses trust.

## Color - contrast, not hue

The product's ambient palette is soft and low-contrast. In a quiet room
the loudest thing isn't the most colorful thing, it's the **darkest**
thing. A grain earns attention with contrast and weight, not color.

| Role | Treatment |
| --- | --- |
| Brand | Purple, ambient. Navigation, links, identity. Never a status. |
| Grain | Near-black claim bar + border (`grain-ink` token). Prominent by weight - survives dark mode, colorblindness, a screenshot. |
| State | `success`/`warning`/`error` tokens. Nothing else gets color. |
| AI-ness | Has no color. Nothing is tinted or sparkled for being AI. |

**Token note:** `--shadow-ai` in `src/styles.css` is a **purple glow**
(pre-Grain "stardust" era). It is exactly what the color law above
rejects. Grain components use `grain-ink` / `grain-ink-foreground` /
`grain-ink-muted` instead - near-black in light mode, inverted to
near-white in dark mode, so the claim bar stays the loudest neutral either
way. Do not reach for `shadow-ai` inside `src/components/nds/grain/*`.

## The four principles

1. **Reactive** - answer the difference, not the record. "$250 left" is
   the page's job; "gone in 18 days at this rate" is Emma's.
   *Test: does it say anything the page header doesn't?*
2. **Relative** - the thread is the continuity layer, not navigation. An
   unfinished answer survives a page change and a reload.
   *Test: navigate away mid-answer. Is it gone?*
3. **Reduce** - reduce decisions, not steps. A shorter path with more
   doubt is a transfer of anxiety, not a reduction.
   *Test: steps dropped - did hesitation drop with them?*
4. **Reversible** - at 95% accuracy, one in twenty money actions is
   wrong. Every terminal grain lands with a named reason and a live undo,
   never a confirmation modal.
   *Test: find the wrong one. How many clicks to unwind it?*

Retired: **Replace** (the old principle - absorb existing components into
AI). Grain solves the same problem more completely, since nothing is
bolted onto the 200 screens in the first place.

## The component taxonomy

Four layers. Only one carries meaning.

| Layer | Job | Members |
| --- | --- | --- |
| Shell | Where it happens | Prompt bar, Thread, Canvas - one component, three densities |
| Process | What it's doing | Loading, Thinking, Streaming text, Tool chips, Task rows - **no claim bar, ever** |
| **Grain** | **What it found** | Tension, Difference, Approval, Consequence, Selection, Draft, Evidence, Insight, Basis, Question |
| Atom | What they're made of | Claim bar, Confidence, Provenance, Exit, Liveness, Inline input |

## The ten grains

One row each - full spec (states, interaction, data contract, edge cases)
lives in the interactive catalog at `/docs/grain-catalog` and in
`src/mocks/grain.ts`.

| # | Grain | Domain | Band · terminal · liveness | Trigger |
| - | --- | --- | --- | --- |
| 01 | Tension | Payroll | Low · terminal · stamped | Two beliefs contradict, neither has enough evidence to win (confidence < .55) |
| 02 | Difference | HR | High · terminal · live | A delta against one of three legal baselines: prior state, policy, or plan |
| 03 | Approval | Payments | Med–high · terminal · stamped | Emma prepared a financial/personnel action, confidence .6–.95 |
| 04 | Consequence | Payroll/Benefits | Any · terminal · live | A decision has second-order effects invisible from the primary object |
| 05 | Selection | Compliance | High · terminal · live | A set > ~20 where a minority needs attention and the ranking is explainable in one line |
| 06 | Draft | Benefits | Med · transitional · stamped | Emma can fill ≥50% of a form from existing records |
| 07 | Evidence | Payments | Any · terminal · stamped | An extracted value disagrees with a recorded one beyond tolerance |
| 08 | Insight | Benefits | Med · transitional · live | A trend crosses a threshold, changes slope, or implies a deadline |
| 09 | Basis | Compliance | Any · terminal · stamped | User asks "why?" - never auto-renders |
| 10 | Question | Payments | Low · terminal · live | The same decision observed ≥3 times with a consistent outcome, no rule held yet |

Missing from every off-the-shelf AI component gallery: **Tension** and
**Consequence** - no library ships a piece for "this doesn't add up" or
"here's what breaks if you do that," because they assume an assistant that
*helps*, not a system that *judges*.

## Composition - slots are stable, contents rank

Three slot types, in this order, always:

1. **Tension** - what doesn't add up (allowed to be empty, and say so)
2. **Difference** - what changed
3. **The rest** - one level down, the full list/table, always reachable

The vocabulary is fixed, the composition is dynamic - like a newspaper
front page: different every day, grid never moves. Migration path:
grain a module → render its grains in the thread (additive, reversible) →
once trusted, compose the module's landing surface from the same three
slots instead of a table → repeat per module. Building the composed page
before the grains are trusted just ships a rearranged table wearing an AI
label.

## Shell - the Floater, aligned

The Floater isn't a separate component - it's the **Shell at line
density**, docked to a page, hosting exactly one grain. Confidence and
situation pick which grain (contradiction → Tension, found a set →
Selection, already acted → Difference with undo, nothing found →
Difference empty state) - the dock never renders a bespoke shape. Grows
upward from the prompt bar, which stays anchored; max height ~40% of
viewport. With Emma off, it degrades to the page's own unstyled search
bar - nothing missing. See `src/components/nds/grain/shell.tsx`.

`<Shell>`'s dock/bar slots generalized (bezel craft, 2026-08-24) beyond
"hosts one grain": `dock` accepts any non-grain content (a bulk-selection
summary, a context-chip rail) for situations that aren't a claim; `row`
replaces the default composer input entirely (a scanning indicator, a
voice waveform, a dark run-in-flight bar, an undo ring) while keeping the
bar's height/chrome. `grain` is still the common case and renders exactly
as before - these are additive slots, not a rewrite.

**Thread density**, the second of the taxonomy's "Prompt bar, Thread,
Canvas" (`src/components/nds/grain/thread.tsx`, built 2026-08-24) - the
Shell docked to the side of a page instead of the bottom, hosting a running
conversation instead of one grain. Sits as a sibling card directly above
Shell's own bar, which keeps doing the composer's job - a conversation
isn't a claim, so it doesn't borrow the claim-bar chrome. Anything an agent
surfaces unprompted while a thread is open pins above the turns instead of
injecting itself into the conversation - the transcript stays strictly
you → Emma → you. Canvas density (composing a full page from grains) is
still unbuilt - that's the eventual migration path in "Composition" above,
not needed yet.

## Ship gate

Nothing ships as Grain until all three are yes:

1. Does it carry a claim, evidence, provenance and an exit? *No → it's a sparkle, delete it.*
2. Is it declared terminal/transitional, live/stamped? *No → it will become debt, declare it first.*
3. With Emma switched off, does the underlying screen still do its job? *No → it's a demo, not shippable.*

## States marked "design this"

The ones that break first in production, called out explicitly in the
spec rather than left to be discovered in QA: **partial failure**
(Approval), **superseded** (Tension, resolved by someone else first -
payroll is multiplayer), **stale source** (Draft, Basis), **contradicted
rule** (Question, the user acts against their own belief).
