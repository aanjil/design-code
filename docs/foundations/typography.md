# Typography

Typography in Niural uses two typefaces and four style categories. All values are pulled directly from Figma variables.

---

## Typefaces

| Role | Family | Use |
|------|--------|-----|
| Heading / Body | Inter | All UI text — titles, labels, paragraphs, captions |
| Mono | Geist Mono | Code, numbers, data values, financial figures |

---

## Title

Display and page headings. Inter, weight 520, line-height 100% (tight). Used for `<h1>`–`<h5>`.

| Style | Size | Weight | Line height | Letter spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `Title/H1` | 56px | 520 | 100% | -4% | Primary page title |
| `Title/H2` | 48px | 520 | 100% | -4% | Section title |
| `Title/H3` | 40px | 520 | 100% | -3% | Sub-section title |
| `Title/H4` | 32px | 520 | 100% | -2% | Detail heading |
| `Title/H5` | 24px | 520 | 100% | -2% | Component heading, card title |

> Titles use tight line-height (100%) — they are not meant to wrap into reading text. Keep title copy short.

---

## Paragraph

Reading and body text. Inter, weight 425, line-height 150%.

| Style | Size | Weight | Line height | Letter spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `Paragraph/XLarge` | 20px | 425 | 150% | -2% | Hero descriptions |
| `Paragraph/Large` | 18px | 425 | 150% | -2% | Prominent body text |
| `Paragraph/Medium` | 16px | 425 | 150% | -2% | Standard body text |
| `Paragraph/Small` | 14px | 425 | 150% | -2% | Default body text, descriptions |
| `Paragraph/XSmall` | 13px | 425 | 150% | -2% | Fine print, helper text |

---

## Label

UI text — buttons, form labels, table headers, nav items, badges, tabs. Inter, line-height 150%. Higher weight than Paragraph at the same size.

| Style | Size | Weight | Line height | Letter spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `Label/XLarge` | 20px | 550 | 150% | -2% | Prominent UI labels |
| `Label/Large` | 18px | 550 | 150% | -2% | Large button labels |
| `Label/Medium` | 16px | 550 | 150% | -2% | Standard labels |
| `Label/Small` | 14px | 530 | 150% | -2% | Default label — most UI contexts |
| `Label/XSmall` | 13px | 550 | 150% | -2% | Small badges, tags, secondary labels |

> `Label/Small` (14px / 530) is the most used style across the platform.

---

## Caption

Fine-detail text. Inter, 12px, line-height 130%.

| Style | Size | Weight | Line height | Letter spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `Caption/medium` | 12px | 500 | 130% | -2% | Emphasized captions, timestamps |
| `Caption/regular` | 12px | 425 | 130% | -2% | Secondary captions, metadata |

---

## Mono

Numeric data, financial values, code. Geist Mono, weight 425, line-height 150%.

| Style | Size | Weight | Line height | Letter spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `Mono/XLarge` | 20px | 425 | 150% | -1% | Large data display |
| `Mono/Large` | 18px | 425 | 150% | -1% | Prominent numbers |
| `Mono/Medium` | 16px | SemiBold | 150% | -1% | Standard data values |
| `Mono/Small` | 14px | SemiBold | 150% | -1% | Table cells, financial figures |
| `Mono/XSmall` | 13px | 425 | 150% | -1% | Fine numeric detail |

> Use Mono for any value that benefits from fixed-width alignment — amounts, IDs, dates in tables, account numbers.

---

## Weight reference

Niural uses variable font weights. Not all map to standard CSS names.

| Value | Closest name | Use |
|-------|-------------|-----|
| 425 | Regular | Paragraph, body text |
| 500 | Medium | Caption/medium |
| 520 | Medium+ | Title headings |
| 530 | Medium+ | Label/Small |
| 550 | Semibold- | Labels |

---

## Line height

| Category | Line height | Reason |
|----------|-------------|--------|
| Title | 100% | Headlines don't wrap — tight looks intentional |
| Paragraph / Label / Mono | 150% | Reading comfort, stacked text breathing room |
| Caption | 130% | Compact but still legible at 12px |

> At 150% line-height, stacked text pairs (label + value) need no additional gap. See `spacing.md`.

---

## Letter spacing

All styles use negative letter spacing — tighter tracking at larger sizes, slightly looser at small.

| Size range | Tracking |
|------------|---------|
| 56–48px (H1–H2) | -4% |
| 40px (H3) | -3% |
| 32–13px (H4 downward) | -2% |
| Mono (all sizes) | -1% |

---

## Stacking (label + value pairs)

Two-line text stacks use line-height alone — no gap class needed.

```
Employee name       ← Label/Small (14px / 530)
Senior Engineer     ← Paragraph/Small (14px / 425) + Text/Muted
```

No `gap` between them. Line-height at 150% provides the natural separation.

---

## Truncation

- Single line: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- Multi-line: max 2 lines in most contexts
- Never truncate headings — wrap or shorten the copy

---

## Do's

- Use `Label/Small` as the default for most UI text
- Use Mono styles for numeric values, financial figures, account IDs
- Match Paragraph to reading content, Label to interactive/UI elements
- Keep title copy short — they're 100% line-height, not reading text

## Don'ts

- Don't use Title styles for UI labels — use Label styles
- Don't set custom font sizes outside the defined scale
- Don't add gap between stacked text — line-height handles it
- Don't use more than 2 type sizes in a single component
- Don't use Inter weight below 425 or above 560 — outside the defined range
