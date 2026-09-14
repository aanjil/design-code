import dagre from 'dagre'
import type { Edge, Node } from '@xyflow/react'
import { MASTER_IA } from '@/crafts/master-ia'
import type { MasterIACraftRef } from '@/crafts/master-ia'
import { getCraft } from '@/crafts/registry'
import type { CraftMeta } from '@/crafts/registry'

/**
 * Builds the Master IA as a graph instead of a flat table: Master App root
 * -> section -> (sidebar leaf, where one's designed) -> craft. Positions
 * come from dagre's auto-layout, so adding a craft or a section is purely a
 * data change in master-ia.ts - nobody hand-places nodes as this grows.
 */

export type MasterIANodeData =
  | { kind: 'root' }
  | { kind: 'section'; key: string; label: string; liveCount: number; totalCount: number }
  | { kind: 'subnav'; label: string; hasCraft: boolean }
  | { kind: 'craft'; ref: MasterIACraftRef; meta: CraftMeta }

const NODE_SIZE: Record<MasterIANodeData['kind'], { width: number; height: number }> = {
  root: { width: 140, height: 40 },
  section: { width: 200, height: 48 },
  subnav: { width: 170, height: 36 },
  craft: { width: 240, height: 68 },
}

export function buildMasterIAGraph(): { nodes: Array<Node<MasterIANodeData>>; edges: Array<Edge> } {
  const nodes: Array<Node<MasterIANodeData>> = []
  const edges: Array<Edge> = []

  const rootId = 'root'
  nodes.push({
    id: rootId,
    type: 'masterIA',
    position: { x: 0, y: 0 },
    data: { kind: 'root' },
  })

  for (const section of MASTER_IA) {
    const sectionId = `section:${section.key}`
    const liveCount = section.crafts.filter((c) => c.status === 'live').length
    nodes.push({
      id: sectionId,
      type: 'masterIA',
      position: { x: 0, y: 0 },
      data: { kind: 'section', key: section.key, label: section.label, liveCount, totalCount: section.crafts.length },
    })
    edges.push({ id: `${rootId}->${sectionId}`, source: rootId, target: sectionId })

    const bySubNav = new Map<string, Array<MasterIACraftRef>>()
    const direct: Array<MasterIACraftRef> = []
    for (const ref of section.crafts) {
      if (ref.subNavLabel) {
        const list = bySubNav.get(ref.subNavLabel) ?? []
        list.push(ref)
        bySubNav.set(ref.subNavLabel, list)
      } else {
        direct.push(ref)
      }
    }

    function addCraftNode(parentId: string, ref: MasterIACraftRef) {
      const craftId = `craft:${ref.slug}`
      nodes.push({
        id: craftId,
        type: 'masterIA',
        position: { x: 0, y: 0 },
        data: { kind: 'craft', ref, meta: getCraft(ref.slug) },
      })
      edges.push({ id: `${parentId}->${craftId}`, source: parentId, target: craftId })
    }

    if (section.sidebarGroups) {
      for (const group of section.sidebarGroups) {
        for (const item of group.items) {
          const attached = bySubNav.get(item.label) ?? []
          const subId = `subnav:${section.key}:${item.label}`
          nodes.push({
            id: subId,
            type: 'masterIA',
            position: { x: 0, y: 0 },
            data: { kind: 'subnav', label: item.label, hasCraft: attached.length > 0 },
          })
          edges.push({ id: `${sectionId}->${subId}`, source: sectionId, target: subId })
          attached.forEach((ref) => addCraftNode(subId, ref))
        }
      }
    }

    direct.forEach((ref) => addCraftNode(sectionId, ref))
  }

  return { nodes: layout(nodes, edges), edges }
}

/** Left-to-right tree layout - a section's crafts fan out to the right of
 *  it, same as the real Sidebar reads top-to-bottom translated into a
 *  horizontal tree so wide sections don't collide vertically. */
function layout(
  nodes: Array<Node<MasterIANodeData>>,
  edges: Array<Edge>,
): Array<Node<MasterIANodeData>> {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 24, ranksep: 90 })

  for (const node of nodes) {
    const { width, height } = NODE_SIZE[node.data.kind]
    g.setNode(node.id, { width, height })
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }
  dagre.layout(g)

  return nodes.map((node) => {
    const { width, height } = NODE_SIZE[node.data.kind]
    const pos = g.node(node.id)
    return { ...node, position: { x: pos.x - width / 2, y: pos.y - height / 2 } }
  })
}
