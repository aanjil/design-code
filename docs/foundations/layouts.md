# Layouts

App shell and layout structures. These are the containers everything else lives inside.

---

## App structure

```
AppBar
└── MainLayout
    ├── Sidebar
    └── PageLayout
        ├── PageHeader
        ├── PageBody
        └── PageFooter
```

---

## AppBar

> Top-level navigation bar. Present on all pages.

- Height: see `sizes.md`
- Changes based on user role (different nav items, actions)
- Spacing: see Patterns — AppBar is finalized there

---

## Sidebar

> Left navigation. Part of MainLayout.

- Expanded width: see `sizes.md`
- Collapsed width: see `sizes.md`
- Items change based on user role
- Spacing: see Patterns — Sidebar is finalized there

---

## MainLayout

> Wrapper for Sidebar + PageLayout. Handles the split.

- No padding of its own — Sidebar and PageLayout manage their own
- Behavior on collapse/expand:

---

## PageLayout

> The main content area. Composed of PageHeader + PageBody + PageFooter.

### PageHeader

Variants:
- Default
- With actions
- With tabs
- With breadcrumb
- With filters

> Spacing: see `spacing.md` — PageHeader spacing is defined per variant.

### PageBody

- Default padding: `16px` all sides
- Scrolls vertically
- PageFooter sticks to bottom when present

### PageFooter

- Used for form submit actions, sticky CTAs
- Height: see `sizes.md`

---

## Layout compositions

### SettingsLayout

```
PageHeader (title + description)
PageBody (48px vertical, 24px horizontal padding)
```

Use for: account settings, org settings, configuration pages.

### FormLayout

```
PageHeader (title, optional description)
PageBody (24px horizontal, 32px top, 196px bottom)
PageFooter (submit actions)
```

Use for: any multi-field creation or edit flow.

### ListLayout

```
PageHeader (title + primary action)
PageBody (16px all sides)
  └── Table or list component
```

Use for: employee list, payroll runs, reports, any index page.

### DetailLayout

> Structure for record detail pages (employee profile, payroll detail, etc.)

```
PageHeader (record name + status + actions)
PageBody
  ├── Primary section (main content)
  └── Secondary section (sidebar info, metadata)
```

- Section gaps: `48px` between major sections, `32px` default
- See `spacing.md` for full section spacing rules

### AI page layout

> TBD — define when AI layout patterns are finalized.

---

## Rules

- Always use the defined layout compositions — don't create ad-hoc page structures
- PageBody handles scroll — don't add overflow on inner containers unless intentional
- Never use margins on PageLayout children — padding only
- Footer is optional — only include when there's a sticky action (form submit, bulk action)

---

## Do's

-

## Don'ts

-
