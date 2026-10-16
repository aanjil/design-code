/**
 * Emma's body, rebuilt from the Emma mark (fe-pkg `EmmaLogo`, 24×24).
 *
 * The mark is six rounded, pointy-top hexagons on a ring round (12, 12) -
 * circumradius 5, ring radius ~7.1, so neighbours overlap into one solid
 * honeycomb - with a four-point sparkle cut through the middle. Here each
 * hexagon is its own "cell" (so the ring can breathe, orbit, chase and
 * point), and the sparkle stops being a hole: it is Emma's face, a lit visor
 * that holds the eyes. At rest the avatar reads as the mark.
 *
 * Everything is in the mark's own 24-unit box.
 */

export const C = 12
/** Circumradius of one cell (centre to corner). */
export const CELL_R = 5
/** Distance from the centre of the mark to each cell's centre. */
export const RING_R = 7.1
/** Corner rounding of a cell, as a fraction of a side. */
const CELL_ROUND = 0.16

/** Cell angles, SVG degrees (0 = right, 90 = down): top first, clockwise. */
export const CELL_ANGLES = [-90, -30, 30, 90, 150, 210] as const

export const BRAND_FROM = '#714DFF'
export const BRAND_TO = '#E151FF'
/** Back of the body / extrusion sides: the brand violet in shade. */
export const BRAND_SHADE = '#4A2FC4'
export const BRAND_DEEP = '#2E1A8C'
/** Face ink: a deep brand violet, never black. */
export const INK = '#26135F'
/** Ink's lit side, for the eyes' depth. */
export const INK_LIT = '#3D2596'
/** Light, tinted with the brand magenta - highlights and sheen never go plain white. */
export const LIGHT = '#F7DDFF'

/** A rounded, pointy-top hexagon centred on the origin. */
function roundedHex(r: number, round: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180
    return [r * Math.cos(a), r * Math.sin(a)] as const
  })
  let d = ''
  for (let i = 0; i < 6; i++) {
    const [px, py] = pts[(i + 5) % 6]
    const [x, y] = pts[i]
    const [nx, ny] = pts[(i + 1) % 6]
    // Cut each corner back along both edges, then curve through the corner.
    const ax = x + (px - x) * round
    const ay = y + (py - y) * round
    const bx = x + (nx - x) * round
    const by = y + (ny - y) * round
    d += `${i === 0 ? 'M' : 'L'}${f(ax)} ${f(ay)}Q${f(x)} ${f(y)} ${f(bx)} ${f(by)}`
  }
  return d + 'Z'
}

/** One cell, centred on the origin - positioned per frame by transform. */
export const CELL_PATH = roundedHex(CELL_R, CELL_ROUND)

/**
 * The sparkle: four concave arms, tips at the mark's own (12, 3.4) /
 * (20.55, 12) / (12, 20.65) / (3.45, 12). Centred on the origin so the face
 * can scale and twinkle round its own middle.
 */
export function sparklePath(armX = 8.55, armY = 8.62, pinch = 0.22, belly = 1.2, bellyY = belly): string {
  // Control points sit near the centre, a little off-axis: the arms come in
  // thin and swell into a soft diamond in the middle, as in the mark.
  const cx = armX * pinch + belly
  const cy = armY * pinch + bellyY
  const e = Math.min(armX, armY) * 0.15
  return [
    `M0 ${f(-armY)}`,
    `C${f(e)} ${f(-cy)} ${f(cx)} ${f(-e)} ${f(armX)} 0`,
    `C${f(cx)} ${f(e)} ${f(e)} ${f(cy)} 0 ${f(armY)}`,
    `C${f(-e)} ${f(cy)} ${f(-cx)} ${f(e)} ${f(-armX)} 0`,
    `C${f(-cx)} ${f(-e)} ${f(-e)} ${f(-cy)} 0 ${f(-armY)}Z`,
  ].join('')
}

export const FACE_PATH = sparklePath()
/** A small four-point star: sparkle eyes and the burst particles. */
export const STAR_PATH = sparklePath(1, 1, 0.12, 0.06)

function f(n: number) {
  return Math.round(n * 1000) / 1000
}
