import { useNavigate } from '@tanstack/react-router'
import { Handle, Position } from '@xyflow/react'
import { Rocket } from '@phosphor-icons/react'
import type { MasterIANodeData } from './master-ia-graph'
import { StatusBadge } from '@/components/playground/status-badge'
import { cn } from '@/lib/utils'

const CRAFT_STATUS_LABEL = {
  live: 'Live in /app',
  'canvas-only': 'Prototype only',
} as const

/** One component for every kind in MasterIANodeData - dispatches on
 *  `data.kind` so `nodeTypes = { masterIA: MasterIANode }` stays a single
 *  stable reference (React Flow warns/re-mounts everything if this object
 *  changes identity between renders). */
export function MasterIANode({ data }: { data: MasterIANodeData }) {
  const navigate = useNavigate()
  const handles = (
    <>
      <Handle type="target" position={Position.Left} className="!bg-border-base" />
      <Handle type="source" position={Position.Right} className="!bg-border-base" />
    </>
  )

  if (data.kind === 'root') {
    return (
      <div className="flex h-10 items-center gap-1.5 rounded-full bg-brand-primary px-3.5 text-label-sm text-text-on-color shadow-button-primary">
        {handles}
        <Rocket className="size-4" />
        Master App
      </div>
    )
  }

  if (data.kind === 'section') {
    return (
      <button
        type="button"
        onClick={() => navigate({ to: '/app/$section', params: { section: data.key } })}
        className="flex h-12 w-[200px] flex-col items-start justify-center gap-0.5 rounded-xl bg-background-base px-3 text-left shadow-border-base transition-shadow hover:shadow-button-gray"
      >
        {handles}
        <span className="text-label-sm text-text-primary">{data.label}</span>
        <span className="text-caption-md text-text-muted">
          {data.liveCount}/{data.totalCount} craft{data.totalCount === 1 ? '' : 's'} live
        </span>
      </button>
    )
  }

  if (data.kind === 'subnav') {
    return (
      <div
        className={cn(
          'flex h-9 w-[170px] items-center rounded-lg border px-2.5 text-label-xs',
          data.hasCraft
            ? 'border-border-base bg-background-base text-text-primary'
            : 'border-dashed border-border-muted text-text-disabled',
        )}
      >
        {handles}
        <span className="truncate">{data.label}</span>
      </div>
    )
  }

  // craft
  const { ref, meta } = data
  return (
    <button
      type="button"
      onClick={() => navigate({ to: meta.to })}
      className="flex h-[68px] w-60 flex-col justify-center gap-1 rounded-xl border border-border-base bg-background-base px-3 text-left shadow-border-base transition-shadow hover:shadow-button-gray"
    >
      {handles}
      <span className="truncate text-label-xs text-text-primary">{meta.title}</span>
      <span className="flex items-center gap-1.5">
        <StatusBadge status={meta.status} />
        <span
          className={cn(
            'text-caption text-text-muted',
            ref.status === 'live' && 'text-brand-text',
          )}
        >
          {CRAFT_STATUS_LABEL[ref.status]}
        </span>
      </span>
    </button>
  )
}
