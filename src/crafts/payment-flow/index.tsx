import { useMemo, useState } from 'react'
import { ArrowCounterClockwise, CaretDown, Play, X } from '@phosphor-icons/react'
import { CATALOG_SCREEN_IDS, EXPLORER_CATALOG, SCENARIOS, findState, resolveLocal } from './catalog'
import { PaymentFlowApp } from './app'
import { AdminScreen } from './screens/admin'
import { LiveEmployerConfig, StoreProvider, createFlowStore, liveStore, useEmployerConfig } from './store'
import type { CanvasGroupDef, CanvasWindowDef } from '@/components/playground/canvas'
import { CanvasCraft } from '@/components/playground/canvas-craft'
import {
  EXPLORER_PANEL_RESERVED_RIGHT,
  ExplorerPanel,
  ExplorerProvider,
  useExplorer,
} from '@/components/playground/explorer'
import { Button, IconButton } from '@niural/components'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CCY_FLAG } from '@/mocks/payment-flow'
import type { EmployerLocal } from '@/mocks/payment-flow'

/**
 * Payment Flow - invoice payment with local currency wallets (PRD: Local
 * Currency Wallet Funding, CAD / GBP + EUR v1.2). Top group "Live" = the
 * real employer App + the Admin panel sharing ONE store: fund a wallet in
 * the App, approve it in Admin, watch Pending become Available. Below it,
 * one frame per catalog screen (A invoices … F admin), each driven by the
 * explorer's selected state. The employer config switcher in the panel
 * header re-seeds every frame (USD only / +CAD / +GBP / +EUR).
 */

const FRAME_W = 1512
const FRAME_H = 910
const FRAME_GAP = 96
const MARGIN_X = 200
const MARGIN_Y = 220
const GROUP_GAP = 380
const APP_ID = 'app'
const ADMIN_ID = 'admin-live'

function LiveApp() {
  const { local } = useEmployerConfig()
  return (
    <StoreProvider value={liveStore}>
      <PaymentFlowApp key={local ?? 'usd'} mockDock />
    </StoreProvider>
  )
}

function LiveAdmin() {
  return (
    <StoreProvider value={liveStore}>
      <AdminScreen />
    </StoreProvider>
  )
}

function ScenarioFrame({ screenId }: { screenId: string }) {
  const { screenId: selected, stateId } = useExplorer()
  const { local: global } = useEmployerConfig()
  const stateKey = selected === screenId ? stateId : ''
  const def = findState(screenId, stateKey)
  const local = resolveLocal(def, global)

  return useMemo(() => {
    const store = createFlowStore(local, (d) => {
      if (!def.credit) d.credit.balance = 0
      def.prepare?.(d)
    })
    const key = `${screenId}:${def.id}:${local ?? 'usd'}`
    if (def.admin) {
      return (
        <StoreProvider key={key} value={store}>
          <AdminScreen initialCcy={def.admin.ccy ?? local ?? 'All'} />
        </StoreProvider>
      )
    }
    const initial = def.ui?.({ local, data: store.get() }) ?? {}
    return (
      <StoreProvider key={key} value={store}>
        <PaymentFlowApp initial={initial} />
      </StoreProvider>
    )
  }, [screenId, def, local])
}

function buildCanvas(onPlay: () => void) {
  const windows: Array<CanvasWindowDef> = [
    { id: APP_ID, title: 'App - live employer', url: 'nexus.niural.com/payments/invoices', x: MARGIN_X, y: MARGIN_Y, width: FRAME_W, height: FRAME_H, content: <LiveApp /> },
    { id: ADMIN_ID, title: 'Admin - live (shares data with App)', url: 'admin.niural.com/wallet-funding', x: MARGIN_X + FRAME_W + FRAME_GAP, y: MARGIN_Y, width: FRAME_W, height: FRAME_H, content: <LiveAdmin /> },
  ]
  const groups: Array<CanvasGroupDef> = [{ id: APP_ID, label: 'Live', windowIds: [APP_ID, ADMIN_ID], onPlay }]
  let y = MARGIN_Y + FRAME_H + GROUP_GAP
  let maxRight = MARGIN_X + 2 * FRAME_W + FRAME_GAP

  for (const group of SCENARIOS) {
    let x = MARGIN_X
    const ids: Array<string> = []
    for (const screen of group.screens) {
      windows.push({
        id: screen.id,
        title: screen.label,
        url: `nexus.niural.com/payments#${screen.id.toLowerCase()}`,
        x,
        y,
        width: FRAME_W,
        height: FRAME_H,
        content: <ScenarioFrame screenId={screen.id} />,
      })
      ids.push(screen.id)
      x += FRAME_W + FRAME_GAP
    }
    maxRight = Math.max(maxRight, x - FRAME_GAP)
    groups.push({ id: group.group, label: group.group, windowIds: ids })
    y += FRAME_H + GROUP_GAP
  }
  return { windows, groups, surfaceW: maxRight + MARGIN_X, surfaceH: y - GROUP_GAP + MARGIN_Y }
}

const CONFIGS: Array<{ value: string; local: EmployerLocal; label: string }> = [
  { value: 'usd', local: null, label: 'USD only (default)' },
  { value: 'CAD', local: 'CAD', label: 'USD + CAD' },
  { value: 'GBP', local: 'GBP', label: 'USD + GBP' },
  { value: 'EUR', local: 'EUR', label: 'USD + EUR (PRD v1.2)' },
]

function ConfigSwitcher() {
  const { local, setLocal } = useEmployerConfig()
  const cur = CONFIGS.find((c) => c.local === local) ?? CONFIGS[1]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Employer currency configuration"
        className="flex h-7 items-center gap-1 rounded-lg px-1.5 text-label-xsmall text-primary borders-base hover:bg-highlight"
      >
        <span aria-hidden>{local ? CCY_FLAG[local] : CCY_FLAG.USD}</span>
        {local ?? 'USD'}
        <CaretDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56" positionerClassName="z-[90]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Employer currencies</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={cur.value}
            onValueChange={(v) => setLocal(CONFIGS.find((c) => c.value === v)?.local ?? null)}
          >
            {CONFIGS.map((c) => (
              <DropdownMenuRadioItem key={c.value} value={c.value}>
                {c.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PaymentFlowCanvas() {
  const explorer = useExplorer()
  const { local } = useEmployerConfig()
  const [present, setPresent] = useState<{ id: string; nonce: number } | null>(null)
  const [exitReq, setExitReq] = useState<{ nonce: number } | null>(null)
  const [presenting, setPresenting] = useState(false)
  const play = () => setPresent((p) => ({ id: APP_ID, nonce: (p?.nonce ?? 0) + 1 }))
  const canvas = useMemo(() => buildCanvas(play), [])

  return (
    <CanvasCraft
      slug="payment-flow"
      windows={canvas.windows}
      groups={canvas.groups}
      surfaceW={canvas.surfaceW}
      surfaceH={canvas.surfaceH}
      minZoom={0.04}
      focusWindow={{ id: explorer.screenId, nonce: explorer.focusNonce }}
      requestFullscreen={present}
      exitFullscreenRequest={exitReq}
      onFullscreenChange={setPresenting}
      // focusing the already-selected frame must not reset its state
      onFocusChange={(id) => CATALOG_SCREEN_IDS.has(id) && id !== explorer.screenId && explorer.show(id)}
      reservedRight={EXPLORER_PANEL_RESERVED_RIGHT}
      overlays={
        <ExplorerPanel
          extraActions={
            <div className="flex items-center gap-1">
              <ConfigSwitcher />
              <IconButton variant="ghost" shade="neutral" size="small" aria-label="Reset live data" title="Reset live App + Admin data" onClick={() => liveStore.reset(local)}>
                <ArrowCounterClockwise className="size-3.5" />
              </IconButton>
              {presenting && (
                <IconButton variant="ghost" shade="neutral" size="small" aria-label="Exit App preview" onClick={() => setExitReq((p) => ({ nonce: (p?.nonce ?? 0) + 1 }))}>
                  <X className="size-3.5" />
                </IconButton>
              )}
              <Button type="button" size="sm" leftIcon={<Play weight="fill" className="size-4" />} onClick={play}>
                Play
              </Button>
            </div>
          }
        />
      }
    />
  )
}

export function PaymentFlow() {
  return (
    <LiveEmployerConfig>
      <ExplorerProvider catalog={EXPLORER_CATALOG} storageKey="payment-flow">
        <PaymentFlowCanvas />
      </ExplorerProvider>
    </LiveEmployerConfig>
  )
}
