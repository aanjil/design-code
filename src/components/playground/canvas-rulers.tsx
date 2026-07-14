/**
 * Blueprint rulers along the canvas edges. Logical-pixel ticks that track
 * scroll + zoom; label density adapts so numbers never collide.
 * (10px mono is a deliberate canvas-tooling exception to the type scale.)
 */
export function CanvasRulers({
  viewport,
  zoom,
  surfaceW,
  surfaceH,
}: {
  viewport: { left: number; top: number }
  zoom: number
  surfaceW: number
  surfaceH: number
}) {
  let step = 100
  while (step * zoom < 56) step *= 2

  const cols: Array<number> = []
  for (let v = 0; v <= surfaceW; v += step) cols.push(v)
  const rows: Array<number> = []
  for (let v = 0; v <= surfaceH; v += step) rows.push(v)

  return (
    <>
      {/* top ruler */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-5 overflow-hidden border-b border-border-base bg-background-base/85 backdrop-blur-[2px]">
        <div
          className="absolute top-0 h-full"
          style={{ transform: `translateX(${-viewport.left + 24}px)` }}
        >
          {cols.map((v) => (
            <span
              key={v}
              className="absolute top-0 flex h-full items-end border-l border-border-muted pb-px pl-1 font-mono text-[8px] leading-none text-text-muted"
              style={{ left: v * zoom }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>
      {/* left ruler */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-5 overflow-hidden border-r border-border-base bg-background-base/85 backdrop-blur-[2px]">
        <div
          className="absolute left-0 w-full"
          style={{ transform: `translateY(${-viewport.top + 24}px)` }}
        >
          {rows.map((v) => (
            <span
              key={v}
              className="absolute left-0 w-full border-t border-border-muted pt-px pl-0.5 font-mono text-[8px] leading-none text-text-muted"
              style={{ top: v * zoom }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>
      {/* corner */}
      <div className="absolute top-0 left-0 z-30 size-6 border-r border-b border-border-base bg-background-base/85" />
    </>
  )
}
