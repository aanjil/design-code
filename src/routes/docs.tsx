import { useState } from 'react'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { Check, Code, Copy } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
  head: () => ({
    meta: [{ title: 'NDS Docs - NDS Playground' }],
  }),
})

interface DocsArea {
  key: string
  label: string
  /** This area's own landing/hub page. */
  indexTo: string
  items: Array<{ to: string; label: string }>
}

const AREAS: Array<DocsArea> = [
  {
    key: 'foundations',
    label: 'Foundations',
    indexTo: '/docs',
    items: [
      { to: '/docs/colors', label: 'Colors' },
      { to: '/docs/typography', label: 'Typography' },
      { to: '/docs/spacing', label: 'Spacing' },
      { to: '/docs/elevation', label: 'Elevation' },
      { to: '/docs/layout', label: 'Layout & sizes' },
    ],
  },
  {
    key: 'components',
    label: 'Components',
    indexTo: '/docs/components',
    items: [
      { to: '/docs/components/app-bar', label: 'AppBar' },
      { to: '/docs/components/sidebar', label: 'Sidebar' },
      { to: '/docs/components/stepper', label: 'Stepper' },
      { to: '/docs/components/buttons', label: 'Buttons' },
      { to: '/docs/components/inputs', label: 'Form controls' },
      { to: '/docs/components/feedback', label: 'Feedback' },
      { to: '/docs/components/filters', label: 'Filters pattern' },
      { to: '/docs/components/editable-table', label: 'Editable table' },
      { to: '/docs/components/page-shell', label: 'Page shell' },
    ],
  },
  {
    // Renamed from "Grains" (2026-08-19) - that label collided with the
    // unrelated `grain` area below and caused real confusion (someone
    // landing on this ai-* survey went looking for Grain content here and
    // found none, since the two areas don't share a sidebar). Still not
    // reconciled with Grain - see docs/foundations/grain.md and this area's
    // own overview page for the cross-link.
    key: 'ai',
    label: 'AI patterns',
    indexTo: '/docs/components/ai',
    items: [
      { to: '/docs/components/ai-agent-status', label: 'Agent status & reasoning' },
      { to: '/docs/components/ai-conversational', label: 'Conversational input' },
      { to: '/docs/components/ai-decisions', label: 'Decisions & human-in-the-loop' },
      { to: '/docs/components/ai-knowledge', label: 'Knowledge & data' },
      { to: '/docs/components/ai-navigation', label: 'Navigation & discovery' },
    ],
  },
  {
    key: 'grain',
    label: 'Grain',
    indexTo: '/docs/grain',
    items: [
      { to: '/docs/grain-catalog', label: 'The ten grains' },
      { to: '/docs/grain-component', label: 'The component' },
      { to: '/docs/floater', label: 'The Floater' },
      { to: '/docs/grain-composition', label: 'Composition' },
      { to: '/crafts/ask-emma', label: 'Ask Emma craft →' },
    ],
  },
]

/** Raw source of every docs page, keyed by absolute module path -
 *  powers the "view code" panel so each page can show the file that
 *  renders it, rareui.com-style (component list + live preview + code). */
const DOC_SOURCES = import.meta.glob('/src/routes/docs/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function fileForPath(pathname: string): { key: string; label: string } | undefined {
  const rest = pathname.replace(/^\/docs\/?/, '')
  const base = rest ? `/src/routes/docs/${rest}` : '/src/routes/docs/index'
  const direct = `${base}.tsx`
  const asIndex = `${base}/index.tsx`
  const key = DOC_SOURCES[direct] ? direct : DOC_SOURCES[asIndex] ? asIndex : undefined
  return key ? { key, label: key.slice(1) } : undefined
}

const navLinkClass =
  'block rounded-lg px-2 py-1.5 text-label-sm text-text-muted transition-colors hover:bg-background-highlight hover:text-text-primary'
const navLinkActiveProps = { className: 'bg-background-highlight text-text-primary' }

/** Which area owns the current path - checked most-specific first, since
 *  AI patterns' pages physically live under `/docs/components/ai-*` and
 *  would otherwise also match Components' `/docs/components` prefix. Returns
 *  undefined for standalone pages (Information Architecture) that don't
 *  belong to any area - nothing scoped renders under those. */
function areaForPath(pathname: string): DocsArea | undefined {
  if (pathname.startsWith('/docs/components/ai')) return AREAS.find((a) => a.key === 'ai')
  if (pathname.startsWith('/docs/components')) return AREAS.find((a) => a.key === 'components')
  // /docs/floater doesn't share the grain-* prefix (it's its own route)
  // but belongs to the Grain area in the sidebar - listed explicitly.
  if (pathname.startsWith('/docs/grain') || pathname === '/docs/floater')
    return AREAS.find((a) => a.key === 'grain')
  if (pathname === '/docs' || (pathname.startsWith('/docs/') && pathname !== '/docs/ia')) {
    return AREAS.find((a) => a.key === 'foundations')
  }
  return undefined
}

function DocsLayout() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const area = areaForPath(pathname)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const file = fileForPath(pathname)
  const source = file ? DOC_SOURCES[file.key] : undefined

  function copySource() {
    if (!source) return
    navigator.clipboard
      .writeText(source)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  return (
    <div
      className={cn(
        'mx-auto flex w-full gap-10 px-4 py-8',
        showCode && source ? 'max-w-[1560px]' : 'max-w-[1160px]',
      )}
    >
      <aside className="sticky top-8 h-fit w-44 shrink-0 max-lg:hidden">

        {area && (
          <div className="mt-5">
            <p className="px-2 pb-2 text-caption-md text-text-muted">
              {area.label}
            </p>
            <div className="flex flex-col gap-0.5">
              <Link
                to={area.indexTo}
                activeOptions={{ exact: true }}
                className={navLinkClass}
                activeProps={navLinkActiveProps}
              >
                Overview
              </Link>
              {area.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  activeProps={navLinkActiveProps}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1">
        {source && (
          <div className="mb-4 flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowCode((v) => !v)}
              aria-pressed={showCode}
              aria-label={showCode ? 'Hide code' : 'Show code'}
              title={showCode ? 'Hide code' : 'Show code'}
            >
              <Code weight={showCode ? 'fill' : 'regular'} />
            </Button>
          </div>
        )}
        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
          {showCode && source && (
            <aside className="sticky top-20 hidden w-[440px] shrink-0 xl:block">
              <div className="overflow-hidden rounded-xl border border-border-base bg-surface-1">
                <div className="flex items-center justify-between border-b border-border-highlight px-3 py-2">
                  <span className="truncate font-mono text-mono-xs text-text-muted">
                    {file?.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={copySource}
                    aria-label="Copy source"
                    title="Copy source"
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
                <pre className="max-h-[calc(100vh-8rem)] overflow-auto p-4 font-mono text-mono-xs leading-relaxed text-text-primary">
                  <code>{source}</code>
                </pre>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
