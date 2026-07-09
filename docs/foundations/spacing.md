# Spacing

Spacing is intentional whitespace. It groups information, signals hierarchy, and makes the UI feel composed — not just pretty. Use it to organize, not decorate.

---

## Philosophy

**Optical spacing > mathematical spacing.**
The scale is a guide, not a law. If something needs 15px and you can explain why, keep it. If you can't explain it, use 16px. You are not allowed to introduce new token values — but what value you use within the system is your call.

**Group with space, not lines.**
Tighter = related. Looser = separate. (This is the Law of Proximity — use it to signal hierarchy, not aesthetics.) Use proximity before reaching for dividers or borders.

**Less code is always better.**
Avoid custom spacing that forces new tokens or utility classes. If your layout requires a value outside the scale, reconsider the layout first.

---

## Quick reference

These four values cover 99% of cases. Start here.

| Value | Primary use |
|-------|-------------|
| **8px** | Between sub-groups, tight proximity signal |
| **12px** | List items, button rows, card padding |
| **16px** | Page body padding, grid horizontal gap, section horizontal gap |
| **20px** | Item group vertical gap, grid vertical gap |

The full scale below covers the remaining 1% — component-level, layout-level, and edge cases.

---

## Scale

Base unit is `4px`.

| Value | Use |
|-------|-----|
| 4px | Icon-to-text gap |
| 6px | Label → input gap, form component gaps |
| 8px | Between sub-groups, proximity signal |
| 10px | Horizontal padding on atoms (buttons, tabs) |
| 12px | List item gaps, button row gaps, card padding |
| 16px | Page body padding, horizontal section gap, grid horizontal gap |
| 20px | Vertical grid gap, item group vertical gap |
| 24px | Sub-section gap, modal interior, horizontal page padding |
| 32px | Default section gap, modal section gap, form page top padding |
| 48px | Large/distinct section gap, settings page vertical padding |

---

## Sections

Sections are the top-level divisions of a page — form sections, detail blocks, content groups.

- **48px** — large, distinct sections that need clear separation
- **32px** — default between sections
- **24px** — sub-sections nested inside a section
- **16px** — horizontal gap between items in a section
- **20px** — vertical gap between items in a section

> When unsure between 32 and 48: does this section stand alone or flow from the one above it? Standalone → 48. Flowing → 32.

---

## Page layouts

The app structure is: `AppBar > Sidebar + PageLayout (PageHeader + PageBody + PageFooter)`.

### PageBody (default)
- `16px` all sides
- No margins — padding only

### Settings page
- `48px` vertical padding
- `24px` horizontal padding

### Form page
- `24px` horizontal
- `32px` top
- `196px` bottom — intentional scroll breathing room, prevents content from feeling stuck at the bottom

### List page
- `16px` all sides

---

## Components

### Label → input
`6px` gap

### Card
`12px` padding on all sides

### Modal
- Between sections: `32px`
- Inside a section: `24px`

### Button / tabs / atoms
- `10px` horizontal padding
- No vertical padding — height is fixed, content is centered

### Card grid / flex-wrap
- Horizontal gap: `16px`
- Vertical gap: `20px`

---

## Element groups

| Context | Gap |
|---------|-----|
| List items | 12px |
| Row of buttons | 12px |
| Multiple groups (proximity signal) | 8px |
| Form inputs in a group | 6px |

Use 8px between groups to signal "related but distinct." Don't go below 8px for groups — that's component-level spacing.

---

## Inline spacing

Icons use a `16px` bounding box but the vector is typically `13–14px`. Use `4px` text-wrap padding on the text side to optically align with the visual center of the icon.

```
[icon 16px box] [4px gap] [4px padding][text]
```

Visually reads as ~8px between icon and text. Keeps things optically balanced without manual nudging.

---

## Text stacking

Do not add gap between stacked text elements (e.g., label + value, title + subtitle).

Use line-height alone: at `150%`, stacked lines already produce natural breathing room. Adding `gap-1` or similar is redundant and creates inconsistency across the platform. Remove `gap-1` from stacked text wherever it exists.

---

## Nesting

For deeply nested layouts (3+ container levels), spacing direction matters.

**Bottom-up** (nested/dense UI):
`4px → 8px → 12px → 16px`
Start tight at the innermost element, expand outward.

Example: a form card inside a detail panel inside a page layout. The form field label-to-input gap is 6px, fields within the card are 12px apart, the card padding is 12px, and the gap between cards is 16px. Each level breathes a little more than the one inside it.

**Top-down** (page-level, content-heavy):
`32px → 24px → 20px`
Start relaxed at the page level, tighten as you go inward.

If the UI feels cluttered despite "correct" spacing, switch from top-down to bottom-up. The nesting is likely fighting the scale.

---

## Empty states

### Table
- Table body: `400px` fixed height
- Content (illustration + text + action) centered vertically and horizontally
- No padding on the container
- Illustration → text: `24px`
- Text → button: `20px`

---

## Exceptions

Gut feel is valid. Optical balance is valid. If 15px looks better than 16px, keep it — but ask yourself why. If you can answer it, ship it. If you can't, use 16px.

You cannot introduce new token values. You can choose which existing value to use.

Desktop and tablet share the same spacing system. Mobile is a separate app — not covered here.

---

## Do's

- When unsure, use `8, 12, 16, 20` — these cover 99% of cases
- Choose spacing based on proximity intent: how related are these two things?
- Use `4px` text-wrap padding on icon+text elements to correct for icon bounding box optical offset
- Let line-height handle stacked text — remove `gap-1` when you see it
- Prefer bottom-up spacing for dense, nested layouts; top-down for page-level content

## Don'ts

- Don't add multiple spacings for the same context — pick one and be consistent
- Don't use dividers or borders to separate things that spacing alone can handle
- Don't add `gap` between stacked text elements — use line-height
- Don't introduce custom values on first pass — use the defined scale, tweak only with a clear optical reason
- Don't use spacing to make things look pretty — use it to make things make sense
