import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/playground/status-badge'
import { experiments } from '@/experiments/registry'

export const Route = createFileRoute('/')({
  component: Gallery,
})

function Gallery() {
  return (
    <div className="mx-auto max-w-[1200px] p-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="max-w-[640px]">
          <h1 className="text-title-h4">Experiments</h1>
          <p className="mt-2 text-paragraph-sm text-text-muted">
            Design explorations on mock data — flows, variants, and annotated
            micro-details, ready to show before handoff.
          </p>
        </div>
        <p className="text-caption text-text-muted">
          {experiments.length}{' '}
          {experiments.length === 1 ? 'experiment' : 'experiments'}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-4 gap-y-5">
        {experiments.map((experiment) => (
          <Link
            key={experiment.slug}
            to={experiment.to}
            className="group flex flex-col gap-2 rounded-xl bg-background-base p-3 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={experiment.status} />
              <ArrowUpRight className="size-4 text-text-disabled transition-colors group-hover:text-text-muted" />
            </div>
            <div>
              <p className="text-label-md">{experiment.title}</p>
              <p className="line-clamp-2 text-paragraph-xs text-text-muted">
                {experiment.description}
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-1 pt-2">
              {experiment.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-background-highlight px-2 py-px text-caption text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
