import { useEffect, useState } from 'react'
import {
  CaretLeft,
  CaretRight,
  Pause,
  Play,
  Sparkle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const COLUMNS = 5
const HOLD_MS = 1700
const DRIFT_SECONDS = 10

/**
 * The X-ray loading state: 5 lanes of flat document icons drift top-to-bottom
 * forever (looped, out-of-phase per lane so it reads organic, not gridded).
 * A separate "scan focus" - corner brackets + a brand badge emitting a
 * light wedge - holds on one lane, then morphs to the next, cycling
 * infinitely. A debug strip below lets you drive both independently.
 */
export function ExtractionScanner({ statusText }: { statusText: string }) {
  const [activeCol, setActiveCol] = useState(0)
  const [scanPlaying, setScanPlaying] = useState(true)
  const [driftPlaying, setDriftPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!scanPlaying) return
    const id = setInterval(() => {
      setActiveCol((c) => (c + 1) % COLUMNS)
    }, HOLD_MS / speed)
    return () => clearInterval(id)
  }, [scanPlaying, speed])

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-2xl bg-surface-1">
        <div className="grid h-full grid-cols-5 gap-3 p-4">
          {Array.from({ length: COLUMNS }, (_, col) => (
            <div key={col} className="relative overflow-hidden">
              <div
                className="doc-lane flex flex-col gap-4"
                style={{
                  animationDuration: `${DRIFT_SECONDS / speed}s`,
                  animationDelay: `${(col * -DRIFT_SECONDS) / COLUMNS}s`,
                  animationPlayState: driftPlaying ? 'running' : 'paused',
                }}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <DocIcon key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <ScanFocus activeCol={activeCol} />

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-surface-1 via-surface-1/90 to-transparent px-4 pt-6 pb-3">
          <span className="scan-spinner size-4 shrink-0 rounded-full border-2 border-dashed border-brand-primary/70" />
          <p className="truncate text-label-sm text-brand-text">{statusText}</p>
        </div>

        <style>{`
          @keyframes emma-doc-lane-drift {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .doc-lane { animation-name: emma-doc-lane-drift; animation-timing-function: linear; animation-iteration-count: infinite; }

          @keyframes emma-scan-spin { to { transform: rotate(360deg); } }
          .scan-spinner { animation: emma-scan-spin 0.8s linear infinite; }
        `}</style>
      </div>

      <ScanDebugPanel
        scanPlaying={scanPlaying}
        onToggleScan={() => setScanPlaying((p) => !p)}
        onPrev={() => setActiveCol((c) => (c - 1 + COLUMNS) % COLUMNS)}
        onNext={() => setActiveCol((c) => (c + 1) % COLUMNS)}
        driftPlaying={driftPlaying}
        onToggleDrift={() => setDriftPlaying((p) => !p)}
        speed={speed}
        onSpeedChange={setSpeed}
        activeCol={activeCol}
      />
    </div>
  )
}

function ScanFocus({ activeCol }: { activeCol: number }) {
  const leftPct = ((activeCol + 0.5) / COLUMNS) * 100

  return (
    <div
      className="absolute top-[30%] h-[140px] w-[calc(100%/5-12px)] -translate-x-1/2 transition-[left] duration-500 ease-in-out"
      style={{ left: `${leftPct}%` }}
    >
      <div className="relative h-full w-full">
        {/* corner brackets */}
        <span className="absolute -top-1 -left-1 size-3 rounded-tl-sm border-t-2 border-l-2 border-brand-primary" />
        <span className="absolute -top-1 -right-1 size-3 rounded-tr-sm border-t-2 border-r-2 border-brand-primary" />
        <span className="absolute -bottom-1 -left-1 size-3 rounded-bl-sm border-b-2 border-l-2 border-brand-primary" />
        <span className="absolute -right-1 -bottom-1 size-3 rounded-br-sm border-r-2 border-b-2 border-brand-primary" />
        <span className="absolute inset-0 rounded-md ring-1 ring-brand-primary/40" />

        {/* light wedge, emitted from the badge toward the next lane */}
        <div
          className="absolute bottom-2 left-1/2 h-[130px] w-[170px] bg-gradient-to-tr from-brand-primary/35 via-brand-primary/10 to-transparent [clip-path:polygon(0%_100%,22%_100%,100%_0%,55%_0%)]"
        />

        {/* badge */}
        <span className="absolute -bottom-3 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-background-base shadow-ai">
          <Sparkle weight="fill" className="size-3.5 text-brand-primary" />
        </span>
      </div>
    </div>
  )
}

function DocIcon() {
  return (
    <svg width="100%" height="112" viewBox="0 0 100 112" preserveAspectRatio="none" className="shrink-0 text-text-muted">
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="109"
        rx="8"
        className="fill-background-base stroke-border-base"
        strokeWidth="1.5"
      />
      <rect x="12" y="14" width="40" height="6" rx="3" className="fill-current" opacity="0.25" />
      <rect x="72" y="12" width="16" height="16" rx="4" className="fill-current" opacity="0.15" />
      <rect x="12" y="34" width="76" height="5" rx="2.5" className="fill-current" opacity="0.2" />
      <rect x="12" y="46" width="60" height="5" rx="2.5" className="fill-current" opacity="0.2" />
      <rect x="12" y="58" width="70" height="5" rx="2.5" className="fill-current" opacity="0.15" />
      <rect x="12" y="80" width="76" height="4" rx="2" className="fill-current" opacity="0.12" />
      <rect x="12" y="90" width="50" height="4" rx="2" className="fill-current" opacity="0.12" />
    </svg>
  )
}

function ScanDebugPanel({
  scanPlaying,
  onToggleScan,
  onPrev,
  onNext,
  driftPlaying,
  onToggleDrift,
  speed,
  onSpeedChange,
  activeCol,
}: {
  scanPlaying: boolean
  onToggleScan: () => void
  onPrev: () => void
  onNext: () => void
  driftPlaying: boolean
  onToggleDrift: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  activeCol: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-base bg-background-highlight/60 px-2.5 py-1.5">
      <span className="text-caption-md text-text-disabled">Scanner debug</span>

      <div className="flex items-center gap-0.5">
        <DebugButton label="Previous lane" onClick={onPrev}>
          <CaretLeft className="size-3.5" />
        </DebugButton>
        <DebugButton
          label={scanPlaying ? 'Pause scan cycle' : 'Resume scan cycle'}
          onClick={onToggleScan}
        >
          {scanPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </DebugButton>
        <DebugButton label="Next lane" onClick={onNext}>
          <CaretRight className="size-3.5" />
        </DebugButton>
        <span className="px-1 font-mono text-mono-xs text-text-muted">
          {activeCol + 1}/{COLUMNS}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggleDrift}
        className={cn(
          'rounded-md px-2 py-1 text-label-xs transition-colors',
          driftPlaying
            ? 'text-text-muted hover:bg-background-base hover:text-text-primary'
            : 'bg-background-base text-brand-text shadow-button-gray',
        )}
      >
        {driftPlaying ? 'Pause drift' : 'Drift paused'}
      </button>

      <div className="ml-auto flex items-center gap-1">
        <span className="text-caption-md text-text-disabled">Speed</span>
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={cn(
              'rounded-md px-2 py-1 font-mono text-mono-xs transition-colors',
              speed === s
                ? 'bg-background-base text-brand-text shadow-button-gray'
                : 'text-text-muted hover:bg-background-base hover:text-text-primary',
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}

function DebugButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background-base hover:text-text-primary"
    >
      {children}
    </button>
  )
}
