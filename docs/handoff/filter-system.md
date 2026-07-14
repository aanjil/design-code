# Filter system — frontend handoff

Table filtering for index pages (employees, payroll runs, invoices…): a filter
menu with nested value panels, an applied-filters bar with editable chips, and
prompt-based filtering ("AI filter"). This doc is the implementation contract:
behavior, data model, visual spec (in NDS tokens), and edge cases.

- **Live reference**: NDS Playground → `/e/employee-filters` (three interactive
  states; green traffic light or ⌘-double-click a window title for app view).
- **Reference implementation**: `src/components/nds/filters/` in the
  `design-code` repo — behavior-complete, tokens-only. Ported to Base UI;
  behavior spec below is stack-agnostic.
- **Figma**: [Web design system](https://www.figma.com/design/yY9Zail0ubfqfxDLxp9QlR/Web-design-system)
  — filter dropdowns `9816-5983` (field menu `9071-25310`, value panel
  `9074-31913`), applied bar + chip `9749-54617`, toolbar button `9071-22884`,
  page context `9080-2038`.

---

## 1. Anatomy

```
Toolbar:  [Search] [Refresh]        [Filter ▾] | [Display ▾] | [Export]
FilterBar (only when ≥1 condition):
  ┌───────────────────────────────────────────────────────────────┐
  │ [icon Field | is | Value ×] [icon Field | is any of | A +2 ×] │
  │ [✦ AI filter]                     [Save view] [Clear]         │
  └───────────────────────────────────────────────────────────────┘
Filter menu:  field list → (hover/click) → nested value panel
Value panel:  [search] [☐ option ×N scroll] [Reset Filter | Apply]
```

## 2. Data model

```ts
interface FilterFieldDef {
  id: string            // 'job-title'
  label: string         // 'Job title'
  icon: Icon            // Phosphor icon component
  options: string[]     // selectable values
  synonyms?: Record<string, string>  // AI parser: phrase → option
}

interface FilterCondition {
  fieldId: string
  operator: 'is' | 'is-any-of'   // derived: 1 value → 'is', >1 → 'is-any-of'
  values: string[]               // never empty — empty removes the condition
}
```

**Semantics**
- One condition per field, max. Applying values for a field **replaces** that
  field's condition (`upsertCondition`); applying an empty selection removes it.
- Matching: within a field → `values.includes(rowValue)` (OR); across fields →
  AND. Search input composes with filters (also AND).
- Employee fields: `work-location`, `employee-type`, `job-title`,
  `compensation-type`, `hire-date`. Hire date filters by **year** (options are
  year strings; match on `hireDate.slice(0,4)`), pending a date-range picker.
- Any filter change resets pagination to page 1. Recommended: mirror conditions
  into URL search params (`?filter[job-title]=a,b`) — playground keeps them in
  memory only.

## 3. Filter menu (entry point)

- Trigger: **secondary button** (34px, `btn-gradient-gray` +
  `shadow-button-gray`, radius 9px) with `FunnelSimple` 16px icon, label
  Label/Small; label text wrapped with 4px optical padding. With ≥1 applied
  condition the trigger shows a count badge (`brand-muted` bg, `brand-text`,
  Caption/medium). On narrow containers (toolbar < 768px) the label collapses
  to icon-only — keep the badge visible and give the button
  `aria-label`/`title`.
- Menu: 200px wide, `surface-2` bg, radius 12px, padding 4px, `shadow-flyout`.
  Items 34px, radius 8px, gap 2px: field icon 16px + Label/Small; hover/focus
  `background-highlight`. A field with an active condition shows a count badge
  (`brand-muted` bg, `brand-text`, Caption/medium).
- Hover or click a field → **nested value panel** opens as a submenu
  (270px, radius 16px, `background-base`, `shadow-flyout`, 6px offset).
- Menu closes fully after Apply/Reset in the panel.

## 4. Value panel (multi-select)

- **Search row**: 40px, `background-highlight`, radius 12px, inset 4px from
  panel edge; MagnifyingGlass 16px muted; input Label/Small; autofocus;
  case-insensitive substring filter; keystrokes must NOT leak to menu
  typeahead (stopPropagation in the reference impl).
- **Options list**: rows 40px, radius 8px, hover `background-highlight`,
  max-height 200px scroll. Checkbox visual: 14px, radius 4px, unchecked =
  `background-base` + `shadow-button-gray` ring; checked = `brand-primary`
  fill + white bold check + `shadow-button-primary`. Row label Label/Small.
  Empty search → "No options match “{query}”." (Paragraph/XSmall muted).
- Selection is **draft state** — nothing applies until Apply.
- **Footer**: top hairline `border-highlight`, padding 12px, two equal-width
  buttons (34px): **Reset Filter** = ghost-destructive (error text, error
  highlight hover) — removes the field's condition entirely; **Apply** =
  primary (violet radial gradient + `shadow-button-primary`) — commits the
  draft. Both close the whole menu.

## 5. FilterBar (applied state)

Rendered **only when ≥1 condition** exists, between the toolbar and the table.

- Container: full-width, radius 12px, padding 10px, `background-base`,
  `shadow-button-gray` ring. Chips wrap; right cluster stays pinned.
- **FilterChip** — segmented, 36px tall, radius 6px, `shadow-button-gray`,
  segments separated by 1px `border-highlight` hairlines. Segment text never
  wraps (`whitespace-nowrap` + `shrink-0` on the chip) — chips reflow in the
  bar as whole units:
  1. Field: icon 16px + Label/Small, 8px padding.
  2. Operator: Label/XSmall muted — `is` (1 value) / `is any of` (>1).
     Display-only.
  3. Values: Label/Small, hover `background-highlight`, max-width ~280px,
     truncated. Summary: 1 → `A`; 2 → `A, B`; 3+ → `A +N`. **Click reopens the
     value panel anchored to the chip** (same draft/Apply/Reset semantics) —
     chips are editable in place, not just removable.
  4. Remove: 28px round icon button (× 16px) inside a 34px slot; hover =
     error highlight + error icon. Removes just that condition.
- **AI filter** entry sits inline after the chips (see §6).
- Right cluster: **Save view** (ghost, BookmarkSimple 16px — saves the current
  condition set; saved views appear as a toolbar menu; session-only stub in the
  playground, persistence TBD) and **Clear** (28px, radius 9px,
  `background-error-highlight` bg, error-base Label/Small text, hover
  `background-error-muted`) — removes all conditions.

## 6. AI filter (prompt → conditions)

- Collapsed: ghost brand button (36px, radius 6px): filled Sparkle 16px +
  "AI filter" Label/Small in `brand-text`; hover `brand-base` bg.
- Expanded: 360px inline form, radius 6px, `shadow-button-gray`; focus-within
  swaps to **`shadow-ai`** (the violet AI glow token). Filled Sparkle in
  `brand-primary`, autofocused input (Paragraph/Small), small primary Apply.
  Esc collapses.
- Placeholder: `Try "EOR account executives in London hired in 2024"`.
- **Parsing contract** (deterministic in the playground; swap for a real
  endpoint later — keep the same output shape `FilterCondition[]`):
  - Lowercase the prompt, pad with spaces (crude word boundaries).
  - For each field: substring-match every option label; also match `synonyms`
    (e.g. `engineers → Software Engineer`, `' us ' → Remote — US`,
    `contractors → Contractor`, a bare year → hire-date option).
  - Matches merge into existing conditions via `upsertCondition` (multiple
    fields can come from one prompt).
  - Zero matches → do NOT clear the input; show inline hint placeholder
    "Nothing matched — try a job title, location, type…".

## 7. States & edge cases

- **No conditions** → FilterBar is not rendered at all (no empty container).
- **Empty result set** → table shows the 400px empty state (`h-table-empty`
  token): FunnelSimple icon, "No employees match these filters", secondary
  "Clear filters" button.
- Duplicate application of the same field replaces, never duplicates chips.
- Removing the last chip removes the bar; Clear does the same in one action.
- Filters + search + Display (sort/group/columns) all compose; none resets
  another, except page → 1.

## 8. Accessibility & keyboard

- Menu/panel/chip-popover follow standard menu/dialog keyboard behavior
  (arrows/Enter in the menu, Esc closes innermost layer first).
- Search input must trap printable keys (no menu typeahead steal).
- Remove buttons: `aria-label="Remove {field} filter"`. AI input labeled.
  Chip value trigger is a real button.
- Focus-visible on all interactive elements: 3px `ring` in brand (token
  `--ring`), consistent with the rest of NDS.

## 9. Tokens quick sheet (see docs/DESIGN.md for the full system)

| Element | Tokens |
| --- | --- |
| Filter button | `btn-gradient-gray` `shadow-button-gray` `rounded-btn`(9px) h-34 Label/Small |
| Menu | `bg-surface-2` `rounded-xl`(12) `p-1` `shadow-flyout`, items h-34 `rounded-lg` |
| Value panel | `bg-background-base` `rounded-2xl`(16) `shadow-flyout`, w-270 |
| Checkbox | 14px, checked `bg-brand-primary` + `shadow-button-primary` |
| Chip | h-36 `rounded-md`(6) `shadow-button-gray`, hairlines `border-highlight` |
| Clear | h-28 `bg-background-error-highlight` `text-text-error-base` |
| AI focus | `shadow-ai` |
| Empty state | `h-table-empty` (400px) |

All colors/type/shadows are NDS tokens — never hex. Dark mode is automatic
through the tokens; no `dark:` overrides anywhere in the feature.

## 10. Open questions / later

- Date-range picker for hire date (year filter is interim).
- Operator editing (`is` → `is not`, ranges) — chip operator segment is
  reserved for this.
- Saved views persistence + sharing (currently session-only).
- Real AI endpoint behind the prompt parser (same `FilterCondition[]` contract).
