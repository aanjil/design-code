import { useMemo } from 'react'
import type { CanvasGroupDef, CanvasWindowDef } from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import { SettingsApp } from './app'
import type { SettingsPage } from './ui'
import { PAGE_LABEL } from './ui'

/**
 * Settings > Organization - eight pages rebuilt from production screenshots
 * on NDS tokens + fe-pkg components, with working mock data. One live App
 * window on top (start anywhere, click through everything), and below it one
 * window per page, each its own independent instance, so reviewers can see
 * all eight side by side.
 */

const FRAME_W = 1512
const FRAME_H = 910
const GAP = 96
const MARGIN_X = 200
const MARGIN_Y = 220
const ROW_GAP = 300
const PER_ROW = 4

const PAGES: Array<{ page: SettingsPage; slug: string }> = [
  { page: 'overview', slug: 'organization/overview' },
  { page: 'documents', slug: 'organization/documents' },
  { page: 'tax', slug: 'organization/tax-setup' },
  { page: 'users', slug: 'organization/users' },
  { page: 'groups', slug: 'organization/groups' },
  { page: 'security', slug: 'organization/security' },
  { page: 'payroll', slug: 'organization/payroll' },
  { page: 'timesheets', slug: 'organization/timesheets' },
]

function buildCanvas() {
  const windows: Array<CanvasWindowDef> = [
    {
      id: 'app',
      title: 'Settings - live app',
      url: 'app.niural.com/organization/overview',
      x: MARGIN_X,
      y: MARGIN_Y,
      width: FRAME_W,
      height: FRAME_H,
      content: <SettingsApp />,
    },
  ]
  const groups: Array<CanvasGroupDef> = [{ id: 'app', label: 'Live app', windowIds: ['app'] }]

  const top = MARGIN_Y + FRAME_H + ROW_GAP
  PAGES.forEach(({ page, slug }, i) => {
    windows.push({
      id: page,
      title: PAGE_LABEL[page],
      url: `app.niural.com/${slug}`,
      x: MARGIN_X + (i % PER_ROW) * (FRAME_W + GAP),
      y: top + Math.floor(i / PER_ROW) * (FRAME_H + ROW_GAP),
      width: FRAME_W,
      height: FRAME_H,
      content: <SettingsApp initialPage={page} />,
    })
  })
  groups.push({ id: 'pages', label: 'Pages', windowIds: PAGES.map((p) => p.page) })

  const rows = Math.ceil(PAGES.length / PER_ROW)
  return {
    windows,
    groups,
    surfaceW: MARGIN_X * 2 + PER_ROW * FRAME_W + (PER_ROW - 1) * GAP,
    surfaceH: top + rows * FRAME_H + (rows - 1) * ROW_GAP + MARGIN_Y,
  }
}

export function OrgSettings() {
  const canvas = useMemo(buildCanvas, [])
  return (
    <CanvasCraft
      slug="org-settings"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.04}
    />
  )
}
