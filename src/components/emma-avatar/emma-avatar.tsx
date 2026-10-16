import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type Ref,
  type RefObject,
  type SVGProps,
} from 'react'
import { EmmaBus, globalEmmaBus, onTick, pointer, type EmmaTarget } from './bus'
import {
  BRAND_DEEP,
  BRAND_FROM,
  BRAND_SHADE,
  BRAND_TO,
  C,
  CELL_ANGLES,
  CELL_PATH,
  FACE_PATH,
  INK,
  INK_LIT,
  RING_R,
  STAR_PATH,
  sparklePath,
} from './geometry'
import { FurFilter, MATERIALS, MaterialFilter, type EmmaShading, type Material } from './materials'
import { EmmaSim, type EmmaReaction, type EmmaState } from './sim'

export const EmmaBusContext = createContext<EmmaBus>(globalEmmaBus)

export interface EmmaAvatarHandle {
  /** Fire a one-shot reaction on this avatar only. */
  react: (r: EmmaReaction) => void
  /**
   * Fly to an element or a viewport point (null = home). She stays there
   * until flown elsewhere; leaving the `flying` state brings her home.
   */
  flyTo: (target: Element | { x: number; y: number } | null) => void
  readonly sim: EmmaSim
  readonly element: SVGSVGElement | null
}

export interface EmmaAvatarProps
  extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'children' | 'width' | 'height' | 'viewBox'> {
  /** What Emma is doing. Default `idle`. */
  state?: EmmaState
  /** px, or any CSS length. The body fills the box; glow and hops spill past it. Default 64. */
  size?: number | string
  /**
   * Cursor awareness. `page` (default): her eyes follow the pointer anywhere
   * on the page while it moves, and her head turns when it comes close;
   * she goes back to her own glances a couple of seconds after it stops.
   * `near`: only within a few head widths. `none`: never.
   */
  watch?: 'page' | 'near' | 'none'
  /** Something to look at instead of the pointer: an element, a ref, or a viewport point. */
  lookAt?: EmmaTarget | RefObject<Element | null>
  /** With `lookAt`: the cell facing it reaches toward it - Emma points. */
  point?: boolean
  /** Voice level 0–1 for `listening` / `speaking`; leave out to synthesise syllables. */
  level?: number
  /** The ambient glow: an aura hugging her silhouette, plus outline ripples (green on success, amber on attention, violet while listening). Default true. */
  glow?: boolean
  /** The soft floor shadow under her. Default true. */
  ground?: boolean
  /** Hover acknowledges you (happy squint); click makes her hop and turn. Default true. */
  interactive?: boolean
  /**
   * Listen to the page's ambient channel (`<EmmaAmbient>` / `useEmma()`):
   * moods and targets apply while her own `state` is `idle`; reactions
   * always do. Default true.
   */
  ambient?: boolean
  /** While `flying`: px half-extents round home she roams within. Default: a short hop either side. */
  roam?: { x: number; y: number }
  /** Hop and turn now and then while idle. Default true. */
  idleJumps?: boolean
  /** Multiplier on every animation. Default 1. */
  speed?: number
  /** Freeze on the current frame. */
  paused?: boolean
  /** 0–1: offsets blinks and glances so a row of Emmas never moves in unison. */
  seed?: number
  /**
   * The face swells out of the mark's sparkle to fit the expression - wider
   * for a smile, taller for wide eyes or talking, flatter when sleepy.
   * `false` keeps the mark's star at all times. Default true.
   */
  faceMorph?: boolean
  /** What she is made of: `smooth` (default), `crisp`, `flat`, `glass`, `fabric`, `fluffy`. */
  shading?: EmmaShading
  /** Thickness shown when she turns, 0–6 mark units. Default 2.6. */
  depth?: number
  ref?: Ref<EmmaAvatarHandle>
}

const SLICES = 5

const STATE_LABEL: Record<EmmaState, string> = {
  idle: 'ready',
  listening: 'listening',
  thinking: 'thinking',
  working: 'working',
  speaking: 'speaking',
  success: 'done',
  attention: 'needs your attention',
  sleeping: 'resting',
  flying: 'on the move',
}

/**
 * Emma, as a living version of her mark: six honeycomb cells round a
 * sparkle that is her face. See `docs` in the emma-avatar craft.
 */
export function EmmaAvatar({
  state = 'idle',
  size = 64,
  watch = 'page',
  lookAt,
  point = false,
  level,
  glow = true,
  ground = true,
  interactive = true,
  ambient = true,
  idleJumps = true,
  roam,
  speed = 1,
  paused = false,
  seed,
  depth = 2.6,
  shading = 'smooth',
  faceMorph = true,
  ref,
  className,
  style,
  onPointerDown,
  ...rest
}: EmmaAvatarProps) {
  const bus = useContext(EmmaBusContext)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ids = {
    cells: `emma-cells-${uid}`,
    body: `emma-body-${uid}`,
    muted: `emma-muted-${uid}`,
    visor: `emma-visor-${uid}`,
    hi: `emma-hi-${uid}`,
    halo: `emma-halo-${uid}`,
    ring: `emma-ring-${uid}`,
    fur: `emma-fur-${uid}`,
    mask: `emma-mask-${uid}`,
    mblur: `emma-mblur-${uid}`,
    spec: `emma-spec-${uid}`,
    spot: `emma-spot-${uid}`,
    face: `emma-face-${uid}`,
    eye: `emma-eye-${uid}`,
  }
  const mat = MATERIALS[shading]

  const simRef = useRef<EmmaSim | null>(null)
  if (!simRef.current) simRef.current = new EmmaSim(seed ?? Math.random(), state)
  const sim = simRef.current

  const svgRef = useRef<SVGSVGElement>(null)
  const el = useRef<Record<string, SVGElement | null>>({})
  const set = (k: string) => (n: SVGElement | null) => {
    el.current[k] = n
  }

  // Props the frame loop reads - kept in a ref so the loop never restarts.
  const live = useRef({ state, watch, lookAt, point, level, interactive, ambient, speed, paused, depth, mat, faceMorph })
  live.current = { state, watch, lookAt, point, level, interactive, ambient, speed, paused, depth, mat, faceMorph }
  sim.idleJumps = idleJumps
  if (roam) {
    sim.roam = roam
    sim.roamSet = true
  }

  useImperativeHandle(ref, () => ({
    react: (r) => sim.react(r),
    flyTo: (target) => {
      const svg = svgRef.current
      if (!svg) return
      const t = resolveTarget(target)
      if (!t) return sim.flyTo(0, 0)
      const r = svg.getBoundingClientRect()
      const upp = 24 / Math.max(8, r.width)
      sim.flyTo((t.x - (r.left + r.width / 2)) * upp, (t.y - (r.top + r.height / 2)) * upp)
    },
    sim,
    get element() {
      return svgRef.current
    },
  }))

  // Reactions from the ambient channel.
  useEffect(() => {
    if (!ambient) return
    return bus.subscribe((r) => sim.react(r))
  }, [ambient, bus, sim])

  // Reduced motion: eyes and blinks stay, the body holds still.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      sim.reducedMotion = mq.matches
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [sim])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(svg)

    const stop = onTick((dt, now) => {
      if (!visible) return
      const L = live.current
      const rect = svg.getBoundingClientRect()
      const w = Math.max(8, rect.width)
      sim.unitsPerPx = 24 / w
      // Where her body actually is, flown or not.
      const cx = rect.left + rect.width / 2 + (sim.pose.travelX * w) / 24
      const cy = rect.top + rect.height / 2 + ((sim.pose.travelY - sim.pose.alt) * w) / 24

      // What she is doing: her own state, or the page's mood while idle.
      const mood = L.ambient ? bus.mood : null
      const st: EmmaState = L.state === 'idle' && mood && mood.state !== 'idle' ? mood.state : L.state
      sim.setState(st)
      sim.level = L.level ?? null

      // Where she looks: an explicit target, the mood's target, else the pointer.
      let target = resolveTarget(L.lookAt)
      let pointing = L.point && !!target
      if (!target && mood?.target && (L.state === 'idle' || mood.state === 'idle')) {
        target = resolveTarget(mood.target)
        pointing = mood.point
      }
      const pd = Math.hypot(pointer.x - cx, pointer.y - cy) / w
      const hovered = L.interactive && pointer.inside && pd < 0.55
      sim.hovered = hovered
      if (target) {
        const dx = (target.x - cx) / w
        const dy = (target.y - cy) / w
        sim.setGaze({ x: dx, y: dy, strength: 1, head: 1 })
        sim.setPoint(pointing ? Math.atan2(dy, dx) : null)
      } else {
        sim.setPoint(null)
        const since = (now - pointer.at) / 1000
        const fresh = pointer.inside ? Math.max(0, Math.min(1, 1 - (since - 2) / 1.2)) : 0
        const reach = L.watch === 'page' ? 1 : L.watch === 'near' ? Math.max(0, Math.min(1, 1 - (pd - 3) / 2)) : 0
        sim.setGaze({
          x: (pointer.x - cx) / w,
          y: (pointer.y - cy) / w,
          strength: hovered ? 1 : fresh * reach,
          head: Math.max(0, Math.min(1, 1 - (pd - 1) / 4)),
        })
      }

      if (!L.paused) sim.update(dt * L.speed)
      draw(el.current, sim, L.depth, L.mat, L.faceMorph)
    })
    return () => {
      stop()
      io.disconnect()
    }
  }, [bus, sim])

  const px = typeof size === 'number' ? `${size}px` : size
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 24 24"
      role="img"
      aria-label={`Emma, ${STATE_LABEL[state]}`}
      className={className}
      style={{ width: px, height: px, overflow: 'visible', display: 'block', flexShrink: 0, ...style } as CSSProperties}
      onPointerDown={(e) => {
        if (interactive) sim.poke()
        onPointerDown?.(e)
      }}
      {...rest}
    >
      <defs>
        <g id={ids.cells}>
          {CELL_ANGLES.map((a, i) => (
            <path key={a} ref={set(`cell${i}`)} d={CELL_PATH} transform={cellTransform(a, 0, 0, 1)} />
          ))}
        </g>
        <linearGradient id={ids.body} x1="2.68" y1="2.84" x2="20.67" y2="20.08" gradientUnits="userSpaceOnUse">
          <stop stopColor={BRAND_FROM} />
          <stop offset="1" stopColor={BRAND_TO} />
        </linearGradient>
        <linearGradient id={ids.muted} x1="2.68" y1="2.84" x2="20.67" y2="20.08" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8E86B8" />
          <stop offset="1" stopColor="#A893BE" />
        </linearGradient>
        {/* The face is a window set into the body: lit centre, cooler edges,
            the body's lip shadowing its top edge and a magenta bounce along the bottom. */}
        <radialGradient id={ids.visor} cx="-0.6" cy="-1.6" r="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#F9F6FF" />
          <stop offset="1" stopColor="#E6DCFF" />
        </radialGradient>
        <filter id={ids.face} filterUnits="userSpaceOnUse" x="-11" y="-11" width="22" height="22" colorInterpolationFilters="sRGB">
          <feOffset in="SourceAlpha" dy="0.85" result="fo" />
          <feGaussianBlur in="fo" stdDeviation="0.55" result="fob" />
          <feComposite in="SourceAlpha" in2="fob" operator="arithmetic" k2="1" k3="-1" result="top" />
          <feFlood floodColor={BRAND_DEEP} floodOpacity="0.32" />
          <feComposite in2="top" operator="in" result="topC" />
          <feOffset in="SourceAlpha" dy="-0.6" result="bo" />
          <feGaussianBlur in="bo" stdDeviation="0.5" result="bob" />
          <feComposite in="SourceAlpha" in2="bob" operator="arithmetic" k2="1" k3="-1" result="bot" />
          <feFlood floodColor={BRAND_TO} floodOpacity="0.22" />
          <feComposite in2="bot" operator="in" result="botC" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="topC" />
            <feMergeNode in="botC" />
          </feMerge>
        </filter>
        <linearGradient id={ids.eye} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={INK} />
          <stop offset="0.6" stopColor={INK} />
          <stop offset="1" stopColor={INK_LIT} />
        </linearGradient>
        {mat.filter && <MaterialFilter id={ids.hi} m={mat.filter} />}
        {mat.fur > 0 && <FurFilter id={ids.fur} />}
        {(mat.specular > 0 || mat.spot > 0) && (
          <>
            <radialGradient id={ids.spot} cx="17.5" cy="5" r="11" gradientUnits="userSpaceOnUse">
              <stop stopColor={BRAND_TO} stopOpacity="0.9" />
              <stop offset="1" stopColor={BRAND_TO} stopOpacity="0" />
            </radialGradient>
            <mask id={ids.mask} maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36">
              <use href={`#${ids.cells}`} fill="#FFFFFF" />
            </mask>
            <linearGradient id={ids.spec} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </>
        )}
        {/* Glow hugs the honeycomb instead of sitting behind it as a disc: a
            blurred copy of the silhouette (aura), and outline rings that leave
            the silhouette and fade (ripple). */}
        <filter id={ids.halo} filterUnits="userSpaceOnUse" x="-12" y="-12" width="48" height="48">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id={ids.ring} filterUnits="userSpaceOnUse" x="-12" y="-12" width="48" height="48">
          <feMorphology in="SourceGraphic" operator="dilate" radius="0.38" result="d" />
          <feComposite in="d" in2="SourceGraphic" operator="out" />
          <feGaussianBlur stdDeviation="0.12" />
        </filter>
        {/* motion blur: a 1-D blur, laid along the direction of travel by rotating
            into it and back out again round the body */}
        <filter id={ids.mblur} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur ref={set('mblurStd')} stdDeviation="0 0" />
        </filter>
      </defs>

      {/* after-images: where she just was, fading */}
      {[2, 1, 0].map((i) => (
        <g key={i} ref={set(`ghost${i}`)} opacity="0">
          <use href={`#${ids.cells}`} fill={`url(#${ids.body})`} filter={`url(#${ids.halo})`} />
        </g>
      ))}

      <g ref={set('travel')}>
      {ground && <ellipse ref={set('ground')} cx={C} cy="24.4" rx="7.5" ry="1.1" fill={INK} opacity="0.14" />}

      {/* speed streaks behind her */}
      <g ref={set('streaks')} opacity="0" stroke={BRAND_FROM} strokeLinecap="round" strokeWidth="0.35">
        {[
          [-4.2, 0.55],
          [-1.4, 1],
          [1.4, 0.8],
          [4.2, 0.5],
        ].map(([y, k], i) => (
          <line key={i} x1={-11} y1={y} x2={-11 - 7 * k} y2={y} opacity={0.5 + k * 0.4} />
        ))}
      </g>
      <g ref={set('lift')}>
      <g ref={set('blurOut')}>
      <g ref={set('blurIn')}>
      <g ref={set('root')}>
        {glow && (
          <>
            <g ref={set('aura')} filter={`url(#${ids.halo})`}>
              <use href={`#${ids.cells}`} fill={`url(#${ids.body})`} ref={set('auraBrand')} />
              <use href={`#${ids.cells}`} style={{ fill: 'var(--background-success-base)' }} ref={set('auraOk')} opacity="0" />
              <use href={`#${ids.cells}`} style={{ fill: 'var(--background-warning-base)' }} ref={set('auraWarn')} opacity="0" />
            </g>
            {[0, 1].map((i) => (
              <g key={i} ref={set(`ring${i}`)} opacity="0">
                <use href={`#${ids.cells}`} ref={set(`ringUse${i}`)} fill={BRAND_FROM} filter={`url(#${ids.ring})`} />
              </g>
            ))}
          </>
        )}
        <g opacity={mat.slices === 'glass' ? 0.4 : 1}>
          {Array.from({ length: SLICES - 1 }, (_, i) => {
            const col = mat.slices === 'flat' ? BRAND_SHADE : mix(BRAND_DEEP, BRAND_SHADE, i / (SLICES - 1))
            return (
              <g key={i} ref={set(`slice${i}`)} strokeWidth="0">
                <use href={`#${ids.cells}`} fill={col} stroke={col} strokeLinejoin="round" />
              </g>
            )
          })}
        </g>
        <g ref={set(`slice${SLICES - 1}`)}>
          {mat.fur > 0 && <use href={`#${ids.cells}`} fill={BRAND_TO} opacity={mat.fur} filter={`url(#${ids.fur})`} />}
          <use href={`#${ids.cells}`} fill={`url(#${ids.body})`} opacity={mat.body} filter={mat.filter ? `url(#${ids.hi})` : undefined} />
          {mat.spot > 0 && (
            <g mask={`url(#${ids.mask})`} opacity={mat.spot}>
              <rect x="-2" y="-2" width="28" height="28" fill={`url(#${ids.spot})`} />
            </g>
          )}
          {mat.specular > 0 && (
            <g mask={`url(#${ids.mask})`} opacity={mat.specular}>
              <ellipse cx="7.5" cy="5.5" rx="7" ry="2.6" transform="rotate(-32 7.5 5.5)" fill={`url(#${ids.spec})`} />
            </g>
          )}
          <use href={`#${ids.cells}`} fill={`url(#${ids.muted})`} ref={set('dim')} opacity="0" />
        </g>

        <g ref={set('face')}>
          <path ref={set('visor')} d={FACE_PATH} fill={`url(#${ids.visor})`} filter={mat.filter ? `url(#${ids.face})` : undefined} />
          <path ref={set('visorFace')} d={FACE_PATH} fill={BRAND_SHADE} opacity="0" />
          <g ref={set('eyes')}>
            {(['L', 'R'] as const).map((side) => (
              <g key={side} ref={set(`eye${side}`)} transform={`translate(${side === 'L' ? -1.9 : 1.9} 0)`}>
                <rect ref={set(`pill${side}`)} x="-0.66" y="-1.35" width="1.32" height="2.7" rx="0.66" fill={`url(#${ids.eye})`} />
                <ellipse ref={set(`refl${side}`)} rx="0.4" ry="0.16" fill={BRAND_TO} opacity="0" />
                <path ref={set(`closed${side}`)} d="M-0.8 -0.15Q0 0.55 0.8 -0.15" fill="none" stroke={INK} strokeWidth="0.45" strokeLinecap="round" opacity="0" />
                <path ref={set(`happy${side}`)} d="M-0.85 0.4Q0 -0.95 0.85 0.4" fill="none" stroke={INK} strokeWidth="0.55" strokeLinecap="round" opacity="0" />
                <path ref={set(`star${side}`)} d={STAR_PATH} transform="scale(1.4)" fill={INK} opacity="0" />
                <circle ref={set(`catch${side}`)} r="0.3" fill="#FFFFFF" opacity="0" />
              </g>
            ))}
            <g ref={set('mouthG')}>
              <path ref={set('smile')} d="M-0.85 2.2Q0 3 0.85 2.2" fill="none" stroke={INK} strokeWidth="0.42" strokeLinecap="round" opacity="0" />
              <ellipse ref={set('mouth')} cx="0" cy="2.45" rx="0.55" ry="0" fill={INK} />
            </g>
          </g>
        </g>
      </g>

      <g>
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} ref={set(`pt${i}`)} d={STAR_PATH} fill={i === 6 ? BRAND_TO : i % 2 ? BRAND_TO : BRAND_FROM} opacity="0" />
        ))}
      </g>
      </g>
      </g>
      </g>
      </g>
    </svg>
  )
}

// ─── drawing ─────────────────────────────────────────────────────────────────

function resolveTarget(t: EmmaAvatarProps['lookAt'] | EmmaTarget | undefined): { x: number; y: number } | null {
  if (!t) return null
  if ('current' in t) t = t.current
  if (!t) return null
  if (t instanceof Element) {
    if (!t.isConnected) return null
    const r = t.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  return t
}

function cellTransform(angleDeg: number, orbit: number, spread: number, scale: number) {
  const a = (angleDeg * Math.PI) / 180 + orbit
  const r = RING_R + spread
  return `translate(${n(C + Math.cos(a) * r)} ${n(C + Math.sin(a) * r)}) rotate(${n((orbit * 180) / Math.PI)}) scale(${n(scale)})`
}

function draw(el: Record<string, SVGElement | null>, sim: EmmaSim, depth: number, mat: Material, morph: boolean) {
  const p = sim.pose
  const attr = (k: string, name: string, v: string) => el[k]?.setAttribute(name, v)

  for (let i = 0; i < 6; i++) attr(`cell${i}`, 'transform', cellTransform(CELL_ANGLES[i], p.orbit, p.spread[i], p.cellScale[i]))

  // Body: squash into the floor, tilt, hop.
  attr('root', 'transform', `translate(${n(p.x)} ${n(p.y)}) translate(${C} 22) rotate(${n((p.roll * 180) / Math.PI)}) scale(${n(p.sx)} ${n(p.sy)}) translate(${-C} -22)`)

  // A turned disc with thickness: slices through the depth, nearest last.
  const cyaw = Math.cos(p.yaw)
  const syaw = Math.sin(p.yaw)
  const cp = Math.cos(p.pitch)
  const sp = Math.sin(p.pitch)
  const facing = cyaw * cp
  const sign = facing >= 0 ? 1 : -1
  const fx = Math.abs(cyaw) < 0.02 ? 0.02 * Math.sign(cyaw || 1) : cyaw
  // The sides only need their stroke (which fills the gaps between slices) when turned.
  const side = Math.min(1, Math.hypot(syaw, sp) * 2.5)
  for (let i = 0; i < SLICES; i++) {
    const z = sign * (-depth / 2 + (i * depth) / (SLICES - 1))
    attr(`slice${i}`, 'transform', `translate(${n(C + z * syaw)} ${n(C - z * sp)}) scale(${n(fx)} ${n(cp)}) translate(${-C} ${-C})`)
    if (i < SLICES - 1) attr(`slice${i}`, 'stroke-width', n(0.8 * side))
  }
  attr('dim', 'opacity', n(p.dim))

  // Face: rides just proud of the front, so it slides further than the body when she turns.
  // Spatial: the face floats well proud of the body and the eyes further still,
  // so a turn reads as layers sliding past each other.
  const zf = depth / 2 + 1.4
  const fs = p.faceScale * (morph ? 1 + p.faceOpen * 0.1 : 1)
  attr('face', 'transform', `translate(${n(C + zf * syaw)} ${n(C - zf * sp)}) scale(${n(fx * fs)} ${n(cp * fs)}) rotate(${n((p.faceTwist * 180) / Math.PI)})`)
  attr('face', 'opacity', n(Math.max(0, Math.min(1, (facing - 0.05) * 6))))
  attr('visorFace', 'opacity', n((1 - p.visor) * 0.85))

  // The sparkle swells into a rounder face when she needs room to emote
  // (a mouth, happy eyes), and settles back to the mark's star at rest.
  const o = morph ? p.faceOpen : 0
  const happy = morph ? p.happy : 0
  const wide = morph ? Math.min(1, Math.max(0, (p.eyeOpen - 1) / 0.25)) : 0
  const sleepy = morph ? Math.max(0, 1 - p.eyeOpen) : 0
  const talk = morph ? p.mouthOpen : 0
  // Bellies stay well inside the chord between tips, so the sides keep their
  // inward curve; the rest of the room comes from scaling the face (fs above).
  const bx = 1.2 + o * 1.3 + happy * 0.5
  const by = Math.max(0.9, 1.2 + o * 1.3 + wide * 0.6 + talk * 0.4 - sleepy * 0.4)
  const key = `${n(bx)} ${n(by)}`
  const visor = el.visor
  if (visor && visor.dataset.key !== key) {
    visor.dataset.key = key
    const d = sparklePath(8.55 - o * 0.8, 8.62 - o * 0.8 - sleepy * 0.6, 0.22, bx, by)
    visor.setAttribute('d', d)
    el.visorFace?.setAttribute('d', d)
  }
  const gap = 1.9 + o * 0.35
  attr('eyeL', 'transform', `translate(${n(-gap)} ${n(-o * 0.45)})`)
  attr('eyeR', 'transform', `translate(${n(gap)} ${n(-o * 0.45)})`)
  attr('mouthG', 'transform', `translate(0 ${n(o * 0.45)})`)

  // Eyes slide toward the look, plus a little parallax with the turn.
  const ex = p.lookX * 0.62 + syaw * 0.9
  const ey = p.lookY * 0.55 - sp * 0.7
  attr('eyes', 'transform', `translate(${n(ex)} ${n(ey)})`)
  // Expressions swap rather than cross-fade, so two eye shapes never ghost.
  const wHappy = smooth(0.3, 0.65, p.happy)
  const wStar = smooth(0.2, 0.5, p.star)
  const shape = Math.max(0, 1 - wHappy - wStar)
  for (const side of ['L', 'R'] as const) {
    const blink = side === 'L' ? p.blinkL : p.blinkR
    const open = Math.max(0, p.eyeOpen * (1 - blink))
    const h = 3.1 * Math.min(1.3, open)
    const w = 1.5 * (1 + Math.max(0, p.eyeOpen - 1) * 0.6)
    attr(`pill${side}`, 'height', n(h))
    attr(`pill${side}`, 'y', n(-h / 2))
    attr(`pill${side}`, 'width', n(w))
    attr(`pill${side}`, 'x', n(-w / 2))
    attr(`pill${side}`, 'rx', n(Math.min(w, h) / 2))
    attr(`pill${side}`, 'opacity', n(shape * Math.min(1, open * 5)))
    attr(`closed${side}`, 'opacity', n(shape * Math.max(0, 1 - open * 5)))
    attr(`happy${side}`, 'opacity', n(wHappy * (1 - wStar)))
    attr(`star${side}`, 'opacity', n(wStar))
    attr(`catch${side}`, 'cx', n(-w * 0.2))
    attr(`catch${side}`, 'cy', n(-h / 2 + 0.6))
    attr(`catch${side}`, 'opacity', n(mat.catchlight * shape * smooth(1.2, 2, h)))
    attr(`refl${side}`, 'cy', n(h / 2 - 0.42))
    attr(`refl${side}`, 'rx', n(w * 0.26))
    attr(`refl${side}`, 'opacity', n(0.55 * mat.catchlight * shape * smooth(1.6, 2.4, h)))
  }
  attr('smile', 'opacity', n(p.smile * Math.max(0, 1 - p.mouthOpen * 4)))
  attr('mouth', 'ry', n(p.mouthOpen * 0.75))

  // Glow: rides with the front face of the body (same turn), never a disc.
  const front = `translate(${n(C + (sign * depth) / 2 * syaw)} ${n(C - (sign * depth) / 2 * sp)}) scale(${n(fx)} ${n(cp)})`
  const tint = Math.max(p.tintSuccess, p.tintWarning)
  attr('aura', 'transform', `${front} scale(${n(p.haloScale)}) translate(${-C} ${-C})`)
  attr('auraBrand', 'opacity', n(Math.min(1, p.halo) * 0.75 * (1 - tint * 0.8)))
  attr('auraOk', 'opacity', n(Math.min(1, p.halo) * 0.8 * p.tintSuccess))
  attr('auraWarn', 'opacity', n(Math.min(1, p.halo) * 0.85 * p.tintWarning))
  const ringFill = p.tintWarning > 0.3 ? 'var(--background-warning-base)' : p.tintSuccess > 0.3 ? 'var(--background-success-base)' : BRAND_TO
  for (let i = 0; i < 2; i++) {
    const ph = (p.ripple + i * 0.5) % 1
    attr(`ring${i}`, 'transform', `${front} scale(${n(1 + ph * 0.32)}) translate(${-C} ${-C})`)
    attr(`ring${i}`, 'opacity', n(p.rippleK * (1 - ph) ** 1.6 * Math.min(1, ph * 6)))
    const u = el[`ringUse${i}`]
    if (u && u.dataset.fill !== ringFill) {
      u.dataset.fill = ringFill
      u.style.fill = ringFill
    }
  }
  const lift = Math.max(0, -p.y) + p.alt
  attr('ground', 'rx', n(7.5 * Math.max(0.35, 1 - lift / 22)))
  attr('ground', 'opacity', n(0.14 * Math.max(0.25, 1 - lift / 14) * (0.6 + 0.4 * (1 - p.dim))))

  // Flight: the floor position moves everything; the body rides above it on
  // its arc, nearer the camera (bigger) at the top.
  attr('travel', 'transform', `translate(${n(p.travelX)} ${n(p.travelY)})`)
  attr('lift', 'transform', `translate(${C} ${n(C - p.alt)}) scale(${n(p.depth)}) translate(${-C} ${-C})`)
  const ang = (Math.atan2(p.flyDY, p.flyDX) * 180) / Math.PI
  // Kept light: the face must still read at full speed.
  const blur = p.flyN ** 1.5 * 0.65
  const blurOut = el.blurOut
  if (blur > 0.06) {
    attr('blurOut', 'transform', `rotate(${n(ang)} ${C} ${C})`)
    attr('blurIn', 'transform', `rotate(${n(-ang)} ${C} ${C})`)
    attr('mblurStd', 'stdDeviation', `${n(blur)} 0`)
    if (blurOut && !blurOut.hasAttribute('filter')) blurOut.setAttribute('filter', `url(#${el.mblurStd?.parentElement?.id})`)
  } else if (blurOut?.hasAttribute('filter')) {
    blurOut.removeAttribute('filter')
    blurOut.removeAttribute('transform')
    el.blurIn?.removeAttribute('transform')
  }
  attr('streaks', 'transform', `translate(${n(C)} ${n(C - p.alt)}) rotate(${n(ang)}) scale(${n(0.6 + p.flyN * 0.6)} 1)`)
  attr('streaks', 'opacity', n(Math.max(0, p.flyN - 0.15) * 0.8))
  p.trail.forEach((g, i) => {
    attr(`ghost${i}`, 'transform', `translate(${n(g.x)} ${n(g.y)}) ${front} translate(${-C} ${-C})`)
    attr(`ghost${i}`, 'opacity', n(Math.max(0, g.o)))
  })

  p.particles.forEach((pt, i) => {
    attr(`pt${i}`, 'transform', `translate(${n(pt.x)} ${n(pt.y)}) rotate(${n(pt.r * 90)}) scale(${n(Math.max(0.001, pt.s))})`)
    attr(`pt${i}`, 'opacity', n(pt.o))
  })
}

function smooth(a: number, b: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function n(v: number) {
  return (Math.round(v * 1000) / 1000).toString()
}

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`
}
