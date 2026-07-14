import { createFileRoute } from '@tanstack/react-router'
import { DocPage, DocSection, InlineCode, SpecTable } from '@/docs/doc-kit'

export const Route = createFileRoute('/docs/layout')({
  component: LayoutDoc,
  head: () => ({ meta: [{ title: 'Layout & sizes — NDS Docs' }] }),
})

function LayoutDoc() {
  return (
    <DocPage
      title="Layout & sizes"
      description="App shell structure from layouts.md plus the concrete metrics extracted from the Figma Web design system (sizes.md is still TBD in foundations — these values are the working truth)."
    >
      <DocSection title="App structure">
        <pre className="overflow-x-auto rounded-xl bg-surface-1 p-4 font-mono text-mono-xs leading-relaxed text-text-primary">
          {`AppBar (58px, surface-2)
└── MainLayout (8px gutter, rounded panel)
    ├── Sidebar (200px, translucent + blur)
    └── PageLayout
        ├── PageHeader (56px, border-b highlight)
        ├── PageBody   (p-4, scrolls)
        └── PageFooter (optional, sticky actions)`}
        </pre>
        <p className="mt-3 text-paragraph-xs text-text-muted">
          Components live in <InlineCode>src/components/nds/</InlineCode>:
          AppShell, AppBar, Sidebar, MainLayout, PageLayout, PageHeader,
          PageBody, PageFooter — compose pages from these, never ad-hoc shells.
        </p>
      </DocSection>

      <DocSection title="Component metrics">
        <SpecTable
          head={['Element', 'Size', 'Radius', 'Notes']}
          rows={[
            ['AppBar', '58px', '—', 'surface-2, pill nav items h-36'],
            ['Sidebar', '200px', '—', 'items p-2, active = white pill + ring'],
            ['PageHeader', '56px', '—', 'title Label/Medium'],
            ['Button', '34px', '9px (rounded-btn)', 'px-2.5 + label px-1'],
            ['Search input', '36px', '9px', 'w-[250px], ⌘ kbd hint'],
            ['Icon button', '34–36px', '9px / full', 'toolbar / appbar'],
            ['Table row', '54px', '—', 'cells px-5'],
            ['Table header', '40px', '—', 'Label/Small muted'],
            ['Status pill', '24px', 'full', 'dot 6px + Label/XSmall'],
            ['Kbd', '20px', '6px (rounded-kbd)', 'caption-md muted'],
            ['Column chip', '32px', 'full', 'Display panel'],
            ['Filter chip', '36px', '6px', 'segmented, hairline dividers'],
            ['Pagination circle', '36px', 'full', 'shadow-pagination'],
            ['Menus', '—', '12px', 'p-1, items 34px rounded-lg'],
            ['Panels / combobox', '—', '16px', 'flyout shadow'],
            ['Browser window (canvas)', '1512×910', '12px', 'default experiment viewport'],
          ]}
        />
      </DocSection>

      <DocSection title="Page compositions">
        <SpecTable
          head={['Layout', 'Padding', 'Use']}
          rows={[
            ['ListLayout', 'p-4 all sides', 'Index pages: employees, payroll runs'],
            ['SettingsLayout', '48px vertical · 24px horizontal', 'Account & org settings'],
            [
              'FormLayout',
              '24px horizontal · 32px top · pb-form-bottom',
              'Create/edit flows, sticky footer actions',
            ],
            ['DetailLayout', 'sections 32/48px', 'Record detail with side metadata'],
          ]}
        />
      </DocSection>

      <DocSection
        title="Icons"
        note="Phosphor, regular weight. 16px default, 12 inline-small, 20 emphasis, 24 decorative."
      >
        <p className="text-paragraph-sm text-text-primary">
          Icon boxes are 16px with ~13–14px vectors — pair icon + text with{' '}
          <InlineCode>gap-1</InlineCode> and give the label{' '}
          <InlineCode>px-1</InlineCode> for optical balance.
        </p>
      </DocSection>

      <DocSection title="Still TBD in foundations">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>Breakpoints, z-index scale, animation durations — Tailwind defaults stand.</li>
          <li>Modal & drawer widths — unspecified; shadcn defaults.</li>
          <li>
            When sizes.md gets filled in, reconcile it with this table and
            update <InlineCode>docs/DESIGN.md</InlineCode>.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
