import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Rocket } from '@phosphor-icons/react'
import { crafts } from '@/crafts/registry'
import { Button, type ButtonProps } from '@niural/components'

export const Route = createFileRoute('/')({
  component: Gallery,
})

/** yyyy-mm-dd -> "Today" / "3d ago" / "2w ago" / "4mo ago" / "1y ago" */
function formatUpdated(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function Gallery() {
  const sorted = [...crafts].sort((a, b) => b.added.localeCompare(a.added))

  return (
    <div className="mx-auto max-w-[900px] p-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="max-w-[640px]">
          <h1 className="text-title-h4">Crafts</h1>
          <p className="mt-2 text-paragraph-small text-muted">
            Flow explorers, components, and patterns on mock data - most
            recently touched first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-caption-sm text-muted">
            {crafts.length}{' '}
            {crafts.length === 1 ? 'craft' : 'crafts'}
          </p>
          <Button
            // fe-pkg's `as` is typed against its own React types and doesn't know
            // the target's props, so cast Link and spread `to` past the excess-prop check.
            as={Link as unknown as ButtonProps['as']}
            {...{ to: '/app' }}
            variant="solid"
            shade="primary"
            leftIcon={<Rocket className="size-4" />}
          >
            Run the app
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col">
        {sorted.map((craft) => (
          <Link
            key={craft.slug}
            to={craft.to}
            className="group -mx-3 flex items-center gap-4 rounded-lg border-b border-base px-3 py-4 transition-colors last:border-b-0 hover:bg-highlight"
          >
            <div className="min-w-0 flex-1">
              <p className="text-label-medium">{craft.title}</p>
              <p className="mt-0.5 line-clamp-1 text-paragraph-xsmall text-muted">
                {craft.description}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {craft.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-highlight px-2 py-px text-caption-sm text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 pl-2">
              <span className="whitespace-nowrap text-caption-sm text-muted">
                {formatUpdated(craft.added)}
              </span>
              <ArrowUpRight className="size-4 text-disabled transition-colors group-hover:text-muted" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
