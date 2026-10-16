/**
 * Emma's rig: a resting pose per state, eased between on a timed curve, with
 * motion layered on top (breath, blinks, glances, hops, spins, shakes,
 * reactions). Pure maths - no DOM - so the renderer, a test or a sprite sheet
 * can drive it the same way. Built around what Emma does in Niural: she
 * listens, thinks, works a payroll run, speaks, lands a result, needs you,
 * or rests.
 */

export type EmmaState =
  /** Awake, nothing asked of her: breathes, blinks, glances, follows you. */
  | 'idle'
  /** You are talking or typing to her: leans in, eyes wide, ring pulled tight. */
  | 'listening'
  /** Working something out: the ring orbits, eyes drift up, head tilts. */
  | 'thinking'
  /** Doing (a run in flight): a chase round the ring, eyes down on the work. */
  | 'working'
  /** Answering: the face pulses with each syllable, the ring ripples. */
  | 'speaking'
  /** It landed: happy eyes, a hop and a turn, a burst of sparkles. */
  | 'success'
  /** Needs you: wide eyes, a shake, the nearest cell points at the problem. */
  | 'attention'
  /** Nothing needs you: lids shut, face dimmed, the ring loosens, slow breaths. */
  | 'sleeping'
  /** On the move: flies between places on an arc - banks, stretches, blurs, trails. */
  | 'flying'

export const EMMA_STATES: EmmaState[] = [
  'idle',
  'listening',
  'thinking',
  'working',
  'speaking',
  'success',
  'attention',
  'sleeping',
  'flying',
]

/** One-shot reactions, on top of whatever state she is in. */
export type EmmaReaction =
  | 'hop'
  | 'spin'
  | 'nod'
  | 'shake'
  | 'celebrate'
  | 'insight'
  | 'wink'
  | 'startle'
  | 'concern'
  /** a tiny eye flick - "reading along" while you type */
  | 'glimpse'

export const EMMA_REACTIONS: EmmaReaction[] = [
  'hop',
  'spin',
  'nod',
  'shake',
  'celebrate',
  'insight',
  'wink',
  'startle',
  'concern',
  'glimpse',
]

export interface EmmaParticle {
  x: number
  y: number
  s: number
  o: number
  r: number
}

export interface EmmaPose {
  /** body offset and squash, in mark units (the mark is 24 tall) */
  x: number
  y: number
  sx: number
  sy: number
  /** radians: roll tilts, yaw turns to the viewer's right, pitch > 0 looks up */
  roll: number
  yaw: number
  pitch: number
  /** where the eyes look, −1 … 1 */
  lookX: number
  lookY: number
  /** 0 shut … 1 open (past 1 = wide), before blinks */
  eyeOpen: number
  blinkL: number
  blinkR: number
  /** eye expression weights, 0 … 1: ^ ^ arcs, ✦ stars */
  happy: number
  star: number
  mouthOpen: number
  smile: number
  /** face (visor) brightness 0 … 1, its scale and twist */
  visor: number
  /** the face swelling out of the sparkle to make room, 0 (the mark) … 1 */
  faceOpen: number
  faceScale: number
  faceTwist: number
  /** per cell: radial offset (units), scale */
  spread: number[]
  cellScale: number[]
  /** the ring's rotation round the face, radians */
  orbit: number
  /** ambient halo: strength, size, and its tint weights */
  halo: number
  haloScale: number
  /** outline ripples emitted from the silhouette: phase 0 … 1 (loops) and strength */
  ripple: number
  rippleK: number
  tintSuccess: number
  tintWarning: number
  /** 0 … 1, sleep's desaturation */
  dim: number
  particles: EmmaParticle[]
  /** flight: where she is relative to home on the floor (mark units), her height
   *  above it, how much nearer the camera she is, and the motion read-outs */
  travelX: number
  travelY: number
  alt: number
  depth: number
  /** 0 … 1, how fast she is moving right now, and which way (unit vector) */
  flyN: number
  flyDX: number
  flyDY: number
  /** after-images behind her, newest first */
  trail: { x: number; y: number; o: number }[]
}

const TAU = Math.PI * 2
const PARTICLES = 7

interface Rest {
  eyeOpen: number
  lookY: number
  pitch: number
  roll: number
  y: number
  lean: number
  spread: number
  visor: number
  halo: number
  happy: number
  smile: number
  orbitVel: number
  dim: number
  tintSuccess: number
  tintWarning: number
  /** how far the face swells out of the mark's sparkle, 0 … 1 */
  faceOpen: number
}

const REST: Record<EmmaState, Rest> = {
  idle: { eyeOpen: 1, lookY: 0, pitch: 0, roll: 0, y: 0, lean: 1, spread: 0, visor: 1, halo: 0.25, happy: 0, smile: 0, orbitVel: 0, dim: 0, tintSuccess: 0, tintWarning: 0, faceOpen: 0.15 },
  listening: { eyeOpen: 1.12, lookY: -0.1, pitch: 0.1, roll: 0, y: -0.3, lean: 1.04, spread: -0.35, visor: 1, halo: 0.5, happy: 0.15, smile: 0, orbitVel: 0, dim: 0, tintSuccess: 0, tintWarning: 0, faceOpen: 0.45 },
  thinking: { eyeOpen: 0.86, lookY: -0.75, pitch: 0.06, roll: 0.1, y: 0, lean: 1, spread: 0.15, visor: 0.92, halo: 0.42, happy: 0, smile: 0, orbitVel: 1.1, dim: 0, tintSuccess: 0, tintWarning: 0, faceOpen: 0.2 },
  working: { eyeOpen: 0.8, lookY: 0.55, pitch: -0.08, roll: 0, y: 0, lean: 1, spread: 0.1, visor: 1, halo: 0.38, happy: 0, smile: 0, orbitVel: 0, dim: 0, tintSuccess: 0, tintWarning: 0, faceOpen: 0.2 },
  speaking: { eyeOpen: 1, lookY: 0, pitch: 0.04, roll: 0, y: 0, lean: 1.02, spread: 0, visor: 1, halo: 0.48, happy: 0.1, smile: 0.2, orbitVel: 0, dim: 0, tintSuccess: 0, tintWarning: 0, faceOpen: 0.8 },
  success: { eyeOpen: 1, lookY: 0, pitch: 0.06, roll: 0, y: 0, lean: 1.02, spread: 0, visor: 1, halo: 0.62, happy: 1, smile: 1, orbitVel: 0, dim: 0, tintSuccess: 1, tintWarning: 0, faceOpen: 0.7 },
  attention: { eyeOpen: 1.2, lookY: 0, pitch: 0.04, roll: 0, y: 0, lean: 1.03, spread: -0.1, visor: 1, halo: 0.6, happy: 0, smile: 0, orbitVel: 0, dim: 0, tintSuccess: 0, tintWarning: 1, faceOpen: 0.55 },
  flying: { eyeOpen: 1.05, lookY: 0, pitch: 0.04, roll: 0, y: -0.6, lean: 1.02, spread: 0.1, visor: 1, halo: 0.42, happy: 0.25, smile: 0.35, orbitVel: 0, dim: 0, tintSuccess: 0, tintWarning: 0, faceOpen: 0.4 },
  sleeping: { eyeOpen: 0, lookY: 0.4, pitch: -0.16, roll: -0.08, y: 0.7, lean: 0.97, spread: 0.45, visor: 0.42, halo: 0.08, happy: 0, smile: 0, orbitVel: 0, dim: 0.55, tintSuccess: 0, tintWarning: 0, faceOpen: 0.1 },
}

/** Something to look at, relative to the head: −1 … 1 across a head width. */
export interface EmmaGaze {
  x: number
  y: number
  /** 0 lets go, 1 locks on */
  strength: number
  /** the head turns too (near), or the eyes alone (far) */
  head: number
}

interface Ev {
  kind: EmmaReaction
  t: number
  dur: number
}

/** Small seeded PRNG (mulberry32) - a roster never blinks in unison. */
function rng(seed: number) {
  let a = Math.floor(seed * 2 ** 31) || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/**
 * A damped spring - the "spatial" feel: values glide, settle with a soft
 * overshoot, and keep momentum when a new target arrives mid-move, instead
 * of snapping or creeping in on an exponential.
 */
class Spring {
  v = 0
  constructor(public x: number) {}
  step(target: number, dt: number, k: number, zeta: number) {
    // sub-step so stiff springs stay stable on a slow frame
    const n = Math.max(1, Math.ceil(dt / 0.012))
    const h = dt / n
    const c = 2 * zeta * Math.sqrt(k)
    for (let i = 0; i < n; i++) {
      this.v += (k * (target - this.x) - c * this.v) * h
      this.x += this.v * h
    }
    return this.x
  }
}

/** stiffness / damping per kind of motion */
const SPRING = {
  pose: [55, 0.8], // state-to-state cross-fade of the rest pose
  body: [240, 0.62], // hops, squash, tilt: keeps the shape, rounds the edges
  look: [150, 0.85], // eyes: quick but never a snap
  face: [70, 0.62], // the sparkle swelling: a soft, slightly bouncy morph
  cell: [130, 0.5], // honeycomb cells: a little jelly
} as const

const approach = (cur: number, tgt: number, dt: number, tau: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-dt / tau))

export class EmmaSim {
  readonly pose: EmmaPose
  state: EmmaState
  /** voice level 0 … 1 for listening/speaking; null = synthesise */
  level: number | null = null
  /** no hops, spins, orbits or body motion; eyes and blinks only */
  reducedMotion = false
  /** jump now and then while idle */
  idleJumps = true
  /** the pointer is over the avatar itself */
  hovered = false

  private rand: () => number
  private t = 0
  private cur: Rest
  private springs = new Map<string, Spring>()
  private spinYaw = 0
  private flight: { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; arc: number } | null = null
  private flyWait = 0.4
  private landT = -1
  private crouchK = 0
  private landK = 0
  private prevSX = 0
  private prevSY = 0
  /** mark units per CSS px, set by the renderer (24 / rendered size) */
  unitsPerPx = 24 / 64
  /** px half-extents she may roam within while `flying`; 0 = a small hop round home */
  roam = { x: 0, y: 0 }
  /** roam came from the caller: use it as given, no minimum */
  roamSet = false
  private events: Ev[] = []
  private blinkAt: number
  private blinkL = 0
  private blinkR = 0
  private blinkT = -1
  private blinkAgain = false
  private glanceAt: number
  private glanceX = 0
  private glanceY = 0
  private jumpAt: number
  private breathPhase = 0
  private chasePhase = 0
  private orbitVel = 0
  private sylT = 0
  private sylTarget = 0
  private sylLevel = 0
  private gaze: EmmaGaze = { x: 0, y: 0, strength: 0, head: 0 }
  private gazeS = 0
  private gazeX = 0
  private gazeY = 0
  private headS = 0
  private pointAngle = 0
  private pointS = 0

  constructor(seed = Math.random(), state: EmmaState = 'idle') {
    this.rand = rng(seed)
    this.state = state
    this.cur = { ...REST[state] }
    this.blinkAt = 1 + this.rand() * 3
    this.glanceAt = 1.5 + this.rand() * 2
    this.jumpAt = 8 + this.rand() * 8
    this.pose = {
      x: 0, y: 0, sx: 1, sy: 1, roll: 0, yaw: 0, pitch: 0,
      lookX: 0, lookY: 0, eyeOpen: this.cur.eyeOpen, blinkL: 0, blinkR: 0,
      happy: this.cur.happy, star: 0, mouthOpen: 0, smile: this.cur.smile,
      visor: this.cur.visor, faceOpen: this.cur.faceOpen, faceScale: 1, faceTwist: 0,
      spread: [0, 0, 0, 0, 0, 0], cellScale: [1, 1, 1, 1, 1, 1], orbit: 0,
      halo: this.cur.halo, haloScale: 1, ripple: 0, rippleK: 0, tintSuccess: 0, tintWarning: 0, dim: this.cur.dim,
      particles: Array.from({ length: PARTICLES }, () => ({ x: 0, y: 0, s: 0, o: 0, r: 0 })),
      travelX: 0, travelY: 0, alt: 0, depth: 1, flyN: 0, flyDX: 1, flyDY: 0,
      trail: [0, 1, 2].map(() => ({ x: 0, y: 0, o: 0 })),
    }
    this.update(0)
  }

  private spring(key: string, init: number, target: number, dt: number, kind: keyof typeof SPRING) {
    let sp = this.springs.get(key)
    if (!sp) this.springs.set(key, (sp = new Spring(init)))
    const [k, z] = SPRING[kind]
    return sp.step(target, dt, k, z)
  }

  setState(next: EmmaState, immediate = false) {
    if (next === this.state) return
    const prev = this.state
    this.state = next
    if (immediate) this.cur = { ...REST[next] }
    // Entering a state says so once - the cross-ease does the rest.
    if (next === 'success') this.react('celebrate')
    else if (next === 'attention') this.react('shake')
    else if (prev === 'sleeping') this.react('startle')
    if (prev === 'flying') this.flyTo(0, 0)
  }

  /** Fly to a place, mark units from home (0, 0 = home). Stays there until told otherwise. */
  flyTo(x: number, y: number) {
    if (this.reducedMotion) {
      this.flight = null
      this.pose.travelX = x
      this.pose.travelY = y
      return
    }
    const x0 = this.pose.travelX
    const y0 = this.pose.travelY
    const dist = Math.hypot(x - x0, y - y0)
    if (dist < 0.3) return
    this.flight = { x0, y0, x1: x, y1: y, t: -0.16, dur: clamp(0.55 + dist * 0.02, 0.6, 1.9), arc: Math.min(2 + dist * 0.22, 14) }
  }

  /** Where to look, relative to the head; strength 0 lets go. */
  setGaze(g: EmmaGaze) {
    this.gaze = g
  }

  /** Point the nearest cell toward a direction (radians, SVG: 0 = right, π/2 = down). */
  setPoint(angle: number | null) {
    if (angle == null) this.pointS = 0
    else {
      this.pointAngle = angle
      this.pointS = 1
    }
  }

  react(kind: EmmaReaction) {
    const dur: Record<EmmaReaction, number> = {
      hop: 0.96, spin: 1.08, nod: 0.6, shake: 0.7, celebrate: 1.3,
      insight: 1.3, wink: 0.5, startle: 0.76, concern: 1.3, glimpse: 0.28,
    }
    // A new body move replaces one under way rather than stacking.
    const body = ['hop', 'spin', 'celebrate', 'startle']
    if (body.includes(kind)) this.events = this.events.filter((e) => !body.includes(e.kind))
    this.events = this.events.filter((e) => e.kind !== kind)
    this.events.push({ kind, t: 0, dur: dur[kind] })
  }

  /** A click: a hop and a full turn, whatever the state. */
  poke() {
    this.react(this.state === 'sleeping' ? 'startle' : 'spin')
  }

  private updateFlight(dt: number, st: EmmaState) {
    const p = this.pose
    // Roaming: in the flying state she picks somewhere new after each landing.
    if (!this.flight && st === 'flying' && !this.reducedMotion) {
      this.flyWait -= dt
      if (this.flyWait <= 0) {
        const rx = this.roamSet ? this.roam.x * this.unitsPerPx : Math.max(this.roam.x * this.unitsPerPx, 7)
        const ry = this.roamSet ? this.roam.y * this.unitsPerPx : Math.max(this.roam.y * this.unitsPerPx, 4)
        let tx = 0
        let ty = 0
        for (let i = 0; i < 8; i++) {
          tx = (this.rand() * 2 - 1) * rx
          ty = (this.rand() * 2 - 1) * ry
          if (Math.hypot(tx - p.travelX, ty - p.travelY) > Math.max(rx, ry) * 0.45) break
        }
        this.flyTo(tx, ty)
        this.flyWait = 0.7 + this.rand() * 1.3
      }
    }
    let alt = 0
    let depth = 1
    this.crouchK = 0
    const f = this.flight
    if (f) {
      f.t += dt
      if (f.t < 0) this.crouchK = Math.sin((1 + f.t / 0.16) * (Math.PI / 2))
      else {
        const q = Math.min(1, f.t / f.dur)
        const e = q < 0.5 ? 4 * q * q * q : 1 - (-2 * q + 2) ** 3 / 2
        p.travelX = f.x0 + (f.x1 - f.x0) * e
        p.travelY = f.y0 + (f.y1 - f.y0) * e
        // up and over on an arc, and nearer the camera at the top of it
        alt = f.arc * Math.sin(Math.PI * e)
        depth = 1 + 0.18 * Math.sin(Math.PI * e)
        if (q >= 1) {
          this.flight = null
          this.landT = 0
        }
      }
    }
    if (this.landT >= 0) {
      this.landT += dt
      const l = Math.min(1, this.landT / 0.32)
      this.landK = Math.sin(l * Math.PI) * (1 - l * 0.5)
      if (l >= 1) this.landT = -1
    } else this.landK = 0

    // Velocity on screen (floor travel plus height), for blur, bank and trail.
    const sx = p.travelX
    const sy = p.travelY - alt
    const vx = dt > 0 ? (sx - this.prevSX) / dt : 0
    const vy = dt > 0 ? (sy - this.prevSY) / dt : 0
    this.prevSX = sx
    this.prevSY = sy
    const speed = Math.hypot(vx, vy)
    p.flyN = approach(p.flyN, clamp(speed / 45, 0, 1), dt, 0.06)
    if (speed > 2) {
      p.flyDX = approach(p.flyDX, vx / speed, dt, 0.08)
      p.flyDY = approach(p.flyDY, vy / speed, dt, 0.08)
    }
    p.alt = alt
    p.depth = depth
    p.trail.forEach((g, i) => {
      g.x = approach(g.x, sx, dt, 0.035 * (i + 1))
      g.y = approach(g.y, sy, dt, 0.035 * (i + 1))
      g.o = p.flyN * (0.2 - i * 0.055)
    })
  }

  update(dt: number) {
    const p = this.pose
    this.t += dt
    const st = this.state
    const tgt = REST[st]
    const motion = this.reducedMotion ? 0 : 1
    this.updateFlight(dt, st)
    const fn = this.pose.flyN * motion
    const fdx = this.pose.flyDX
    const fdy = this.pose.flyDY

    // ── cross-ease toward the state's rest pose ──────────────────────────
    const c = this.cur
    for (const k of Object.keys(c) as (keyof Rest)[]) c[k] = this.spring(`rest.${k}`, c[k], tgt[k], dt, 'pose')

    // ── breath ───────────────────────────────────────────────────────────
    const breathRate = st === 'sleeping' ? 0.22 : st === 'listening' ? 0.42 : 0.3
    this.breathPhase = (this.breathPhase + dt * breathRate) % 1
    const breath = Math.sin(this.breathPhase * TAU) * motion

    // ── voice: given level, or synthesised syllables ─────────────────────
    let level = 0
    if (st === 'speaking' || st === 'listening') {
      if (this.level != null) level = clamp(this.level, 0, 1)
      else if (st === 'speaking') {
        this.sylT -= dt
        if (this.sylT <= 0) {
          const pause = this.rand() < 0.14
          this.sylTarget = pause ? 0 : 0.35 + this.rand() * 0.65
          this.sylT = pause ? 0.18 + this.rand() * 0.22 : 0.08 + this.rand() * 0.1
        }
        this.sylLevel = approach(this.sylLevel, this.sylTarget, dt, 0.05)
        level = this.sylLevel
      }
    }

    // ── blinks ───────────────────────────────────────────────────────────
    this.blinkAt -= dt
    if (this.blinkAt <= 0 && this.blinkT < 0 && st !== 'sleeping') {
      this.blinkT = 0
      this.blinkAgain = this.rand() < 0.18
      this.blinkAt = 2.2 + this.rand() * 3.8
    }
    if (this.blinkT >= 0) {
      this.blinkT += dt
      const d = 0.15
      const b = this.blinkT < d ? Math.sin((this.blinkT / d) * Math.PI) : 0
      this.blinkL = this.blinkR = b
      if (this.blinkT >= d) {
        this.blinkT = -1
        if (this.blinkAgain) {
          this.blinkAgain = false
          this.blinkAt = 0.12
        }
      }
    }

    // ── gaze: a target (pointer, element), else her own glances ─────────
    this.glanceAt -= dt
    if (this.glanceAt <= 0) {
      const corner = this.rand() < 0.75
      this.glanceX = corner ? (this.rand() < 0.5 ? -1 : 1) * (0.45 + this.rand() * 0.4) : 0
      this.glanceY = corner ? (this.rand() - 0.5) * 0.7 : 0
      this.glanceAt = 1.6 + this.rand() * 3.2
    }
    const g = this.gaze
    this.gazeS = approach(this.gazeS, clamp(g.strength, 0, 1), dt, 0.18)
    this.headS = approach(this.headS, clamp(g.head, 0, 1) * clamp(g.strength, 0, 1), dt, 0.3)
    // Pointer coordinates → a look direction that saturates gently far away.
    const gl = Math.hypot(g.x, g.y)
    const gx = gl > 0 ? (g.x / (gl + 0.55)) * Math.min(1, gl * 1.6) : 0
    const gy = gl > 0 ? (g.y / (gl + 0.55)) * Math.min(1, gl * 1.6) : 0
    this.gazeX = approach(this.gazeX, gx, dt, 0.08)
    this.gazeY = approach(this.gazeY, gy, dt, 0.08)
    const ownX = st === 'thinking' ? Math.sin(this.t * 0.45) * 0.6 : st === 'working' ? Math.sin(this.t * 1.7) * 0.35 : this.glanceX
    const ownY = st === 'thinking' || st === 'working' || st === 'sleeping' ? c.lookY : this.glanceY + c.lookY
    const lookX = ownX * (1 - this.gazeS) + this.gazeX * this.gazeS
    const lookY = ownY * (1 - this.gazeS) + this.gazeY * this.gazeS
    // In flight the eyes lead, looking where she is going.
    p.lookX = this.spring('lookX', p.lookX, st === 'sleeping' ? 0 : lookX * (1 - fn) + fdx * 0.9 * fn, dt, 'look')
    p.lookY = this.spring('lookY', p.lookY, lookY * (1 - fn) + fdy * 0.8 * fn, dt, 'look')

    // Head follows the eyes a little - more when the target is near.
    const headK = (0.35 + 0.45 * this.headS) * motion
    let yaw = p.lookX * 0.42 * headK + Math.sin(this.t * 0.29) * 0.05 * motion
    let pitch = c.pitch * motion - p.lookY * 0.22 * headK
    let roll = c.roll * motion + (st === 'thinking' ? Math.sin(this.t * 0.6) * 0.05 * motion : 0)
    // A slow float - she hovers rather than sits.
    let x = Math.sin(this.t * 0.37) * 0.12 * motion
    /** full turns ride outside the springs - a spring would unwind them backwards */
    let spin = 0
    let y = c.y * motion + breath * 0.18 * (st === 'sleeping' ? 2 : 1)
    let sx = 1 - breath * 0.012
    let sy = c.lean + breath * 0.018
    let eyeOpen = c.eyeOpen
    let happy = c.happy + (this.hovered && st !== 'sleeping' ? 0.7 : 0)
    let faceOpen = c.faceOpen + (this.hovered && st !== 'sleeping' ? 0.4 : 0)
    let star = 0
    let smile = c.smile + (this.hovered && st !== 'sleeping' ? 0.4 : 0)
    let halo = c.halo + (this.hovered ? 0.15 : 0)
    // Flight: turn and bank into the direction, stretch along it, crouch to
    // launch and squash on landing.
    yaw += fdx * 0.6 * fn
    roll += fdx * 0.25 * fn
    pitch -= fdy * 0.3 * fn
    sx *= 1 + (0.1 * Math.abs(fdx) - 0.05 * Math.abs(fdy)) * fn
    sy *= 1 + (0.1 * Math.abs(fdy) - 0.05 * Math.abs(fdx)) * fn
    sy *= 1 - (0.09 * this.crouchK + 0.08 * this.landK) * motion
    sx *= 1 + (0.06 * this.crouchK + 0.05 * this.landK) * motion
    happy += 0.3 * fn
    faceOpen += 0.2 * fn
    let haloScale = 1 + breath * 0.04
    let tintSuccess = c.tintSuccess
    let tintWarning = c.tintWarning
    let blinkL = this.blinkL
    let blinkR = this.blinkR
    let faceScale = 1
    let faceTwist = 0

    // ── idle jumps ───────────────────────────────────────────────────────
    if (st === 'idle' && this.idleJumps && motion && !this.hovered) {
      this.jumpAt -= dt
      if (this.jumpAt <= 0) {
        this.react(this.rand() < 0.55 ? 'spin' : 'hop')
        this.jumpAt = 9 + this.rand() * 9
      }
    }

    // ── state motion ─────────────────────────────────────────────────────
    const spread = [0, 0, 0, 0, 0, 0]
    const cellScale = [1, 1, 1, 1, 1, 1]
    for (let i = 0; i < 6; i++) spread[i] = c.spread + breath * 0.12

    // A chase round the ring - the run is moving.
    this.chasePhase = (this.chasePhase + dt * 0.95) % 1
    const workW = st === 'working' ? 1 : 0
    if (workW) {
      for (let i = 0; i < 6; i++) {
        const ph = (this.chasePhase - i / 6 + 1) % 1
        const bump = Math.max(0, Math.cos(ph * TAU)) ** 6
        cellScale[i] += bump * 0.12 * (motion || 0.5)
        spread[i] += bump * 0.7 * motion
      }
      y += Math.abs(Math.sin(this.t * 3.1)) * -0.35 * motion
    }
    if (st === 'speaking') {
      // Each syllable lifts the face; the ring ripples from the bottom up.
      faceScale += level * 0.08
      for (let i = 0; i < 6; i++) {
        const fromBottom = [3, 2, 1, 0, 1, 2][i]
        spread[i] += Math.max(0, Math.sin(this.t * 6 - fromBottom * 0.9)) * 0.35 * level * (motion || 0.4)
      }
      halo += level * 0.25
    }
    if (st === 'listening') {
      halo += level * 0.35
      haloScale += level * 0.12
      for (let i = 0; i < 6; i++) spread[i] -= level * 0.25
    }
    if (st === 'attention') {
      halo += Math.max(0, Math.sin(this.t * 4)) * 0.2
    }
    if (st === 'thinking') {
      faceTwist = Math.sin(this.t * 1.3) * 0.05 * motion
    }

    // The ring orbits while thinking, and settles back on the mark's angles.
    this.orbitVel = approach(this.orbitVel, c.orbitVel * motion, dt, 0.4)
    if (Math.abs(this.orbitVel) > 0.02) p.orbit = (p.orbit + this.orbitVel * dt) % TAU
    else {
      const home = Math.round(p.orbit / (Math.PI / 3)) * (Math.PI / 3)
      p.orbit = approach(p.orbit, home, dt, 0.35)
    }

    // Pointing: the cell facing the target reaches toward it.
    if (this.pointS > 0) {
      for (let i = 0; i < 6; i++) {
        const a = ((-90 + i * 60) * Math.PI) / 180 + p.orbit
        let d = Math.abs(((a - this.pointAngle + Math.PI * 3) % TAU) - Math.PI)
        d = Math.max(0, 1 - d / (Math.PI / 3))
        spread[i] += d * d * (1.1 + Math.sin(this.t * 5) * 0.25 * motion)
        cellScale[i] += d * d * 0.06
      }
    }

    // Flight: the cells on the trailing side drag behind like a wake.
    if (fn > 0.01) {
      const back = Math.atan2(fdy, fdx) + Math.PI
      for (let i = 0; i < 6; i++) {
        const d = Math.max(0, Math.cos(((-90 + i * 60) * Math.PI) / 180 + p.orbit - back))
        spread[i] += d * d * 1.4 * fn
        cellScale[i] -= d * 0.05 * fn
      }
    }

    // ── reactions ────────────────────────────────────────────────────────
    for (const e of this.events) {
      e.t += dt
      const q = clamp(e.t / e.dur, 0, 1)
      switch (e.kind) {
        case 'hop':
        case 'spin':
        case 'celebrate':
        case 'startle': {
          const air = e.kind === 'startle' ? 0.3 : e.kind === 'hop' ? 0.5 : 0.62
          const crouch = 0.14
          const h = e.kind === 'startle' ? 1.8 : e.kind === 'hop' ? 2.8 : 4
          const tt = e.t
          if (tt < crouch) {
            const k = ease(tt / crouch)
            sy *= 1 - 0.07 * k * motion
            sx *= 1 + 0.05 * k * motion
          } else if (tt < crouch + air) {
            const a = (tt - crouch) / air
            y -= h * 4 * a * (1 - a) * motion
            sy *= 1 + 0.04 * Math.sin(a * Math.PI) * motion
            sx *= 1 - 0.025 * Math.sin(a * Math.PI) * motion
            if (e.kind === 'spin' || e.kind === 'celebrate') spin += TAU * ease(a) * motion
          } else {
            const l = clamp((tt - crouch - air) / 0.32, 0, 1)
            const k = Math.sin(l * Math.PI) * (1 - l * 0.5)
            sy *= 1 - 0.06 * k * motion
            sx *= 1 + 0.04 * k * motion
          }
          if (e.kind === 'startle') eyeOpen = Math.max(eyeOpen, 1.25 * (1 - q) + eyeOpen * q)
          if (e.kind === 'celebrate') {
            faceOpen = Math.max(faceOpen, 0.85)
            happy = Math.max(happy, 1)
            smile = Math.max(smile, 1)
            halo += 0.35 * (1 - q)
            tintSuccess = Math.max(tintSuccess, 1 - q * 0.5)
          }
          break
        }
        case 'nod':
          pitch -= Math.sin(q * Math.PI) * 0.3 * (motion || 0.3)
          y += Math.sin(q * Math.PI) * 0.5 * motion
          break
        case 'shake':
        case 'concern': {
          const k = e.kind === 'concern' ? Math.min(1, q * 2.4) : q
          const s = Math.sin(e.t * 22) * (1 - k) ** 2
          x += s * 0.6 * motion
          roll += s * 0.06 * motion
          yaw += s * 0.15 * motion
          if (e.kind === 'concern') {
            eyeOpen = Math.max(eyeOpen, 1.15)
            tintWarning = Math.max(tintWarning, 1 - q)
            halo += 0.3 * (1 - q)
          }
          break
        }
        case 'insight':
          star = Math.max(star, Math.sin(Math.min(1, q * 1.6) * Math.PI) ** 0.5)
          faceScale += Math.sin(q * Math.PI) * 0.08
          pitch += Math.sin(q * Math.PI) * 0.12 * motion
          halo += Math.sin(q * Math.PI) * 0.3
          break
        case 'wink':
          blinkR = Math.max(blinkR, Math.sin(q * Math.PI) ** 0.6)
          happy = Math.max(happy, Math.sin(q * Math.PI) * 0.5)
          smile = Math.max(smile, Math.sin(q * Math.PI))
          roll += Math.sin(q * Math.PI) * 0.06 * motion
          break
        case 'glimpse':
          p.lookY = Math.max(p.lookY, 0.4 * Math.sin(q * Math.PI))
          eyeOpen *= 1 - Math.sin(q * Math.PI) * 0.12
          break
      }
    }
    this.events = this.events.filter((e) => e.t < e.dur)

    // ── particles: a burst on celebrate, one star above on insight ───────
    const burst = this.events.find((e) => e.kind === 'celebrate')
    const idea = this.events.find((e) => e.kind === 'insight')
    for (let i = 0; i < PARTICLES; i++) {
      const pt = p.particles[i]
      pt.o = 0
      if (burst && i < 6 && motion) {
        const q = clamp((burst.t - 0.2) / 0.9, 0, 1)
        const a = ((-90 + i * 60 + 30) * Math.PI) / 180
        const r = 9 + ease(q) * 7
        pt.x = 12 + Math.cos(a) * r
        pt.y = 12 + Math.sin(a) * r + y
        pt.s = Math.sin(q * Math.PI) * (i % 2 ? 1.1 : 1.6)
        pt.o = q > 0 ? Math.sin(q * Math.PI) : 0
        pt.r = q * 2
      } else if (idea && i === 6) {
        const q = clamp(idea.t / idea.dur, 0, 1)
        pt.x = 18.5
        pt.y = -2.5 - ease(q) * 2 + y
        pt.s = Math.sin(Math.min(1, q * 2) * Math.PI * 0.5) * 1.8 * (1 - q * 0.4)
        pt.o = Math.sin(q * Math.PI) ** 0.5
        pt.r = q * 1.5
      }
    }

    // ── write the pose ───────────────────────────────────────────────────
    p.x = this.spring('x', p.x, x, dt, 'body')
    p.y = this.spring('y', p.y, y, dt, 'body')
    p.sx = this.spring('sx', p.sx, sx, dt, 'body')
    p.sy = this.spring('sy', p.sy, sy, dt, 'body')
    p.roll = this.spring('roll', p.roll, roll, dt, 'body')
    p.yaw = this.spring('yaw', p.yaw - this.spinYaw, yaw, dt, 'body') + spin
    this.spinYaw = spin
    p.pitch = this.spring('pitch', p.pitch, pitch, dt, 'body')
    p.eyeOpen = eyeOpen
    p.blinkL = blinkL
    p.blinkR = blinkR
    p.happy = approach(p.happy, clamp(happy, 0, 1), dt, 0.16)
    p.star = star
    p.smile = approach(p.smile, clamp(smile, 0, 1), dt, 0.12)
    p.mouthOpen = approach(p.mouthOpen, st === 'speaking' ? level : 0, dt, 0.04)
    p.visor = c.visor
    p.faceOpen = this.spring('face', p.faceOpen, Math.min(1, Math.max(0, faceOpen + p.mouthOpen * 0.3)), dt, 'face')
    p.faceScale = faceScale
    p.faceTwist = faceTwist
    for (let i = 0; i < 6; i++) {
      p.spread[i] = this.spring(`spread${i}`, p.spread[i], spread[i], dt, 'cell')
      p.cellScale[i] = this.spring(`scale${i}`, p.cellScale[i], cellScale[i], dt, 'cell')
    }
    p.halo = approach(p.halo, clamp(halo, 0, 1.2), dt, 0.12)
    p.haloScale = haloScale
    // Ripples say "something is happening" without a glow disc: amber when she
    // needs you, green when it landed, violet while she listens or talks.
    p.ripple = (p.ripple + dt * 0.55 * (motion || 0.4)) % 1
    const rippleK = Math.max(
      tintWarning * 0.9,
      tintSuccess * 0.75,
      st === 'listening' ? 0.3 + level * 0.6 : 0,
      st === 'speaking' ? level * 0.45 : 0,
    )
    p.rippleK = approach(p.rippleK, rippleK, dt, 0.25)
    p.tintSuccess = approach(p.tintSuccess, tintSuccess, dt, 0.15)
    p.tintWarning = approach(p.tintWarning, tintWarning, dt, 0.15)
    p.dim = c.dim
  }
}
