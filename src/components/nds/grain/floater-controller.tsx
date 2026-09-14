import { useState } from 'react'
import { VariantPills } from '@/docs/doc-kit'
import { Switch } from '@/components/ui/switch'
import { Shell, type FloaterSize } from './shell'
import type { GrainExit } from './types'
import { GRAIN_SCENARIOS, getGrainScenario } from '@/mocks/grain'

type DockedOption = 'none' | (typeof GRAIN_SCENARIOS)[number]['kind']
type PreviewWidth = 'compact' | 'cozy' | 'wide'

const WIDTH_PX: Record<PreviewWidth, number> = { compact: 320, cozy: 420, wide: 560 }

/**
 * The Floater in one controllable harness (docs/foundations/grain.md
 * "Shell - the Floater, aligned"). Same component as the docked Shell in
 * the Grain controller - this harness isolates the two idle sizes the
 * Figma "Grain" file specs (pill launcher, default composer) and the
 * dock/undock transition between them.
 */
export function FloaterController() {
  const [size, setSize] = useState<FloaterSize>('pill')
  const [docked, setDocked] = useState<DockedOption>('none')
  const [off, setOff] = useState(false)
  const [width, setWidth] = useState<PreviewWidth>('cozy')

  const scenario = docked === 'none' ? undefined : getGrainScenario(docked)
  const exits: Array<GrainExit> | undefined = scenario?.exits?.slice(0, 2)

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-5 lg:w-[300px] lg:shrink-0">
        <Control label="Size">
          <VariantPills options={['pill', 'default'] as const} value={size} onChange={setSize} />
          <p className="mt-1.5 text-paragraph-xs text-text-muted">
            Click the pill in the preview to expand it - that's the real{' '}
            <code className="text-[11px]">onExpand</code> callback, not a separate demo path.
          </p>
        </Control>

        <Control label="Grain docked">
          <select
            value={docked}
            onChange={(e) => setDocked(e.target.value as DockedOption)}
            className="h-8 w-full rounded-lg border border-border-base bg-background-base px-2 text-paragraph-sm text-text-primary outline-none focus:shadow-border-focus"
          >
            <option value="none">Nothing found yet</option>
            {GRAIN_SCENARIOS.map((s) => (
              <option key={s.kind} value={s.kind}>
                {s.title} · {s.domain}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-paragraph-xs text-text-muted">
            Once a grain docks, the shell always renders at default size - a launcher can't host
            evidence, so <code className="text-[11px]">size="pill"</code> is ignored while docked.
          </p>
        </Control>

        <Control label="Emma off">
          <div className="flex items-center justify-between">
            <span className="text-paragraph-xs text-text-muted">Degrades to a plain search input</span>
            <Switch checked={off} onCheckedChange={setOff} />
          </div>
        </Control>

        <Control label="Preview width">
          <VariantPills options={['compact', 'cozy', 'wide'] as const} value={width} onChange={setWidth} />
        </Control>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-surface-1 p-8">
        <div style={{ width: WIDTH_PX[width], maxWidth: '100%' }} className="flex justify-center">
          <Shell
            size={size}
            off={off}
            grain={
              scenario && {
                claim: scenario.claim,
                confidence: scenario.confidence,
                badge: scenario.badge,
                provenance: scenario.provenance,
                exits,
              }
            }
            onExpand={() => setSize('default')}
          />
        </div>
      </div>
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-label-xs text-text-muted">{label}</p>
      {children}
    </div>
  )
}
