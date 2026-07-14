import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
  head: () => ({
    meta: [{ title: 'NDS Docs — NDS Playground' }],
  }),
})

const NAV: Array<{
  group: string
  items: Array<{ to: string; label: string }>
}> = [
  {
    group: 'Foundations',
    items: [
      { to: '/docs/colors', label: 'Colors' },
      { to: '/docs/typography', label: 'Typography' },
      { to: '/docs/spacing', label: 'Spacing' },
      { to: '/docs/elevation', label: 'Elevation' },
      { to: '/docs/layout', label: 'Layout & sizes' },
    ],
  },
  {
    group: 'Components',
    items: [{ to: '/docs/components', label: 'Overview' }],
  },
]

function DocsLayout() {
  return (
    <div className="mx-auto flex w-full max-w-[1160px] gap-10 px-4 py-8">
      <aside className="sticky top-[72px] h-fit w-44 shrink-0 max-lg:hidden">
        <Link
          to="/docs"
          activeOptions={{ exact: true }}
          className="block rounded-lg px-2 py-1.5 text-label-sm text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
          activeProps={{
            className: 'bg-background-highlight text-text-primary',
          }}
        >
          Overview
        </Link>
        {NAV.map((group) => (
          <div key={group.group} className="mt-5">
            <p className="px-2 pb-2 text-caption-md text-text-muted">
              {group.group}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-lg px-2 py-1.5 text-label-sm text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary"
                  activeProps={{
                    className: 'bg-background-highlight text-text-primary',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
