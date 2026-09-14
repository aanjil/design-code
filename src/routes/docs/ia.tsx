import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Background, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DocPage, DocSection, InlineCode, SpecTable } from '@/docs/doc-kit'
import { buildMasterIAGraph } from '@/docs/master-ia-graph'
import { MasterIANode } from '@/docs/master-ia-node'
import { MASTER_IA } from '@/crafts/master-ia'
import { getCraft } from '@/crafts/registry'
import { StatusBadge } from '@/components/playground/status-badge'

export const Route = createFileRoute('/docs/ia')({
  component: MasterIADoc,
  head: () => ({ meta: [{ title: 'Information Architecture - NDS Docs' }] }),
})

const CRAFT_STATUS_LABEL = {
  live: 'Live in /app',
  'canvas-only': 'Prototype only',
} as const

// Stable reference - React Flow remounts every node if this object's
// identity changes between renders.
const NODE_TYPES = { masterIA: MasterIANode }

function MasterIAGraph() {
  const { nodes, edges } = useMemo(() => buildMasterIAGraph(), [])

  return (
    <div className="h-[560px] overflow-hidden rounded-xl border border-border-base bg-surface-1">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} className="opacity-40" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

function MasterIADoc() {
  return (
    <DocPage
      title="Information Architecture"
      description="The real product's top-level nav, and where every craft in the registry lives inside it - the single map both this page and the Master App (/app) read from, so they can't drift apart. Click a section to open it in the Master App, click a craft to open its route. Dashed leaves are sidebar items with no craft yet - as crafts get curated, they fill in here automatically."
    >
      <DocSection title="Graph" note="Auto-laid-out from master-ia.ts - grows on its own as crafts and sections are added, nothing here is hand-positioned.">
        <MasterIAGraph />
      </DocSection>

      <DocSection title="Detail">
        {MASTER_IA.map((section) => (
          <div key={section.key} className="mt-8 first:mt-0">
            <p className="text-label-sm text-text-primary">{section.label}</p>
            <p className="mt-1 text-paragraph-xs text-text-muted">
              {section.sidebarGroups
                ? `Sidebar: ${section.sidebarGroups
                    .flatMap((g) => g.items.map((i) => i.label))
                    .join(', ')}`
                : 'No contextual sidebar designed yet.'}
            </p>
            {section.crafts.length === 0 ? (
              <p className="mt-2 text-paragraph-xs text-text-muted">
                No craft maps here yet.
              </p>
            ) : (
              <div className="mt-2">
                <SpecTable
                  head={['Craft', 'Registry status', 'In /app', 'Sidebar leaf', 'Tags']}
                  rows={section.crafts.map((ref) => {
                    const meta = getCraft(ref.slug)
                    return [
                      <Link
                        key="link"
                        to={meta.to}
                        className="text-label-sm text-brand-text hover:underline"
                      >
                        {meta.title}
                      </Link>,
                      <StatusBadge key="status" status={meta.status} />,
                      CRAFT_STATUS_LABEL[ref.status],
                      ref.subNavLabel ?? '—',
                      meta.tags.join(', '),
                    ]
                  })}
                />
              </div>
            )}
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Not in the Information Architecture"
        note="The reference/meta craft has no home in the real product - it's the copyable template for starting a new craft, not a feature."
      >
        <p className="text-paragraph-xs text-text-muted">
          <InlineCode>demo-annotations</InlineCode>
        </p>
      </DocSection>
    </DocPage>
  )
}
