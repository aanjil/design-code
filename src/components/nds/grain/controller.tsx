import { useState } from 'react'
import { ArrowCounterClockwise, Play } from '@phosphor-icons/react'
import { VariantPills } from '@/docs/doc-kit'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Grain } from './grain'
import { Shell } from './shell'
import { densityFromConfidence, type GrainDensity, type GrainExit } from './types'
import { densityLabel, MetaPill } from './atoms'
import { GRAIN_SCENARIOS, getGrainScenario } from '@/mocks/grain'

/**
 * The dynamic Grain component, in one controllable harness - every axis
 * the spec defines (confidence/density, live vs stamped, terminal vs
 * transitional, risk, streaming, undo, docked-shell density) driving the
 * same <Grain>. Grain stays the one fundamental component; this is proof
 * it evolves by situation rather than needing ten variants.
 */

type RiskOverride = 'auto' | 'on' | 'off'
type StreamSpeed = 'slow' | 'normal' | 'fast'
type PreviewWidth = 'compact' | 'cozy' | 'wide'

const SPEED_MS: Record<StreamSpeed, number> = { slow: 42, normal: 22, fast: 9 }
const WIDTH_PX: Record<PreviewWidth, number> = { compact: 360, cozy: 480, wide: 640 }

export function GrainController() {
  const [kind, setKind] = useState(GRAIN_SCENARIOS[0].kind)
  const scenario = getGrainScenario(kind)

  const [confidence, setConfidence] = useState(Math.round((scenario.confidence ?? 0.9) * 100))
  const [densityOverride, setDensityOverride] = useState<GrainDensity | 'auto'>('auto')
  const [liveness, setLiveness] = useState<'live' | 'stamped'>(scenario.liveness.kind)
  const [risk, setRisk] = useState<RiskOverride>('auto')
  const [streaming, setStreaming] = useState(false)
  const [streamKey, setStreamKey] = useState(0)
  const [speed, setSpeed] = useState<StreamSpeed>('normal')
  const [undoDemo, setUndoDemo] = useState(false)
  const [showShell, setShowShell] = useState(false)
  const [shellOff, setShellOff] = useState(false)
  const [width, setWidth] = useState<PreviewWidth>('cozy')

  function loadScenario(nextKind: typeof kind) {
    const next = getGrainScenario(nextKind)
    setKind(nextKind)
    setConfidence(Math.round((next.confidence ?? 0.9) * 100))
    setLiveness(next.liveness.kind)
    setRisk('auto')
  }

  const confidenceFraction = confidence / 100
  const resolvedDensity = densityOverride === 'auto' ? densityFromConfidence(confidenceFraction) : densityOverride

  const exits: Array<GrainExit> | undefined = scenario.exits?.map((exit, i) => {
    const withUndo = undoDemo && i === 0
    return {
      ...exit,
      countdownSeconds: withUndo ? 20 : undefined,
      onExpire: undefined,
    }
  })

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-5 lg:w-[300px] lg:shrink-0">
        <Control label="Use case — one of the ten grains">
          <select
            value={kind}
            onChange={(e) => loadScenario(e.target.value as typeof kind)}
            className="h-8 w-full rounded-lg border border-border-base bg-background-base px-2 text-paragraph-sm text-text-primary outline-none focus:shadow-border-focus"
          >
            {GRAIN_SCENARIOS.map((s) => (
              <option key={s.kind} value={s.kind}>
                {s.title} · {s.domain}
              </option>
            ))}
          </select>
        </Control>

        <Control label={`Confidence — .${String(confidence).padStart(2, '0')}`}>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full accent-brand-primary"
          />
          <div className="mt-1 flex justify-between text-caption text-text-disabled">
            <span>low</span>
            <span>medium</span>
            <span>high</span>
          </div>
        </Control>

        <Control label="Density override">
          <VariantPills
            options={['auto', 'high', 'medium', 'low'] as const}
            value={densityOverride}
            onChange={setDensityOverride}
          />
        </Control>

        <Control label="Liveness">
          <VariantPills options={['live', 'stamped'] as const} value={liveness} onChange={setLiveness} />
        </Control>

        <Control label="Risk footer (unresolved tension)">
          <VariantPills options={['auto', 'on', 'off'] as const} value={risk} onChange={setRisk} />
        </Control>

        <Control label="Streaming claim (mocked live answer)">
          <div className="flex items-center justify-between">
            <Switch checked={streaming} onCheckedChange={setStreaming} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStreamKey((k) => k + 1)}
              disabled={!streaming}
            >
              <Play /> <span className="px-1">Replay</span>
            </Button>
          </div>
          {streaming && (
            <div className="mt-2">
              <VariantPills options={['slow', 'normal', 'fast'] as const} value={speed} onChange={setSpeed} />
            </div>
          )}
        </Control>

        <Control label="Live undo window on the first exit">
          <Switch checked={undoDemo} onCheckedChange={setUndoDemo} />
        </Control>

        <Control label="Preview width">
          <VariantPills options={['compact', 'cozy', 'wide'] as const} value={width} onChange={setWidth} />
        </Control>

        <Control label="Shell (Floater at line density)">
          <div className="flex items-center justify-between">
            <span className="text-paragraph-xs text-text-muted">Dock this grain above a prompt bar</span>
            <Switch checked={showShell} onCheckedChange={setShowShell} />
          </div>
          {showShell && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-paragraph-xs text-text-muted">Emma off (degrades to search)</span>
              <Switch checked={shellOff} onCheckedChange={setShellOff} />
            </div>
          )}
        </Control>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => loadScenario(kind)}
          className="self-start"
        >
          <ArrowCounterClockwise /> <span className="px-1">Reset to scenario defaults</span>
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-4 rounded-2xl bg-surface-1 p-8">
        <div className="flex flex-wrap items-center gap-1.5 self-start">
          <MetaPill tone="brand">{scenario.title.toUpperCase()}</MetaPill>
          <MetaPill>{densityLabel(resolvedDensity)}</MetaPill>
          <MetaPill>{scenario.terminal ? 'TERMINAL' : 'TRANSITIONAL'}</MetaPill>
          <MetaPill>{liveness.toUpperCase()}</MetaPill>
        </div>

        <div style={{ width: WIDTH_PX[width], maxWidth: '100%' }}>
          <Grain
            key={streaming ? streamKey : 'static'}
            claim={scenario.claim}
            confidence={confidenceFraction}
            density={densityOverride === 'auto' ? undefined : densityOverride}
            liveness={liveness === 'stamped' ? { kind: 'stamped', asOf: '14:20' } : { kind: 'live' }}
            badge={liveness === 'live' ? scenario.badge : undefined}
            facts={scenario.facts}
            provenance={scenario.provenance}
            exits={exits}
            risk={risk === 'auto' ? undefined : risk === 'on'}
            streaming={streaming}
            streamMsPerChar={SPEED_MS[speed]}
          />
        </div>

        {showShell && (
          <div style={{ width: WIDTH_PX[width], maxWidth: '100%' }}>
            <Shell
              off={shellOff}
              grain={
                shellOff
                  ? undefined
                  : {
                      claim: scenario.claim,
                      confidence: confidenceFraction,
                      density: densityOverride === 'auto' ? undefined : densityOverride,
                      badge: scenario.badge,
                      provenance: scenario.provenance,
                      exits: scenario.exits?.slice(0, 2),
                    }
              }
            />
          </div>
        )}
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
