import { BRAND_DEEP, LIGHT } from './geometry'

/**
 * How Emma's body is lit and what it is made of. All plain SVG filters on
 * the front face of the body - built once, then only the geometry under them
 * moves - so a material costs one filter pass a frame.
 */
export type EmmaShading = 'smooth' | 'crisp' | 'flat' | 'glass' | 'fabric' | 'fluffy'

export const EMMA_SHADINGS: EmmaShading[] = ['smooth', 'crisp', 'flat', 'glass', 'fabric', 'fluffy']

interface Light {
  /** how far the edge band reaches in, mark units */
  dy: number
  blur: number
  op: number
}

export interface Material {
  label: string
  note: string
  /** null: no lighting at all */
  filter: {
    /** edge fuzz: displacement strength and noise frequency (0 = clean edge) */
    fuzz: number
    fuzzFreq: number
    /** felt / fur grain strength and frequency (0 = none) */
    grain: number
    grainFreq: number
    hi: Light
    sh: Light
    /** rounded bevel round the silhouette: blur = how wide it rounds, light/shade = strength */
    bevel?: { blur: number; scale: number; light: number; shade: number }
    /** white rim on the outer silhouette only (never on the seams between cells) */
    rim?: { width: number; op: number }
  } | null
  /** sides of the body when she turns */
  slices: 'shade' | 'flat' | 'glass'
  /** front opacity, as one sheet (no seams between cells) */
  body: number
  /** glossy streak across the top-left */
  specular: number
  /** a soft magenta spot light from the upper right, 0 … 1 */
  spot: number
  /** a fringe of hair standing past the silhouette */
  fur: number
  /** the glint in each eye */
  catchlight: number
}

export const MATERIALS: Record<EmmaShading, Material> = {
  smooth: {
    label: 'Smooth',
    note: "The mark's own soft top highlight, plus a soft shade along the bottom. Default.",
    filter: { fuzz: 0, fuzzFreq: 0, grain: 0, grainFreq: 0, hi: { dy: 1.26, blur: 0.63, op: 0.46 }, sh: { dy: 1.1, blur: 0.9, op: 0.3 } },
    slices: 'shade', body: 1, specular: 0, spot: 0.35, fur: 0, catchlight: 0.85,
  },
  crisp: {
    label: 'Crisp',
    note: 'A clean lit rim on top and a hard shade underneath - vector, sticker-sharp.',
    filter: { fuzz: 0, fuzzFreq: 0, grain: 0, grainFreq: 0, hi: { dy: 0.6, blur: 0, op: 0.7 }, sh: { dy: 0.6, blur: 0, op: 0.45 } },
    slices: 'shade', body: 1, specular: 0, spot: 0.25, fur: 0, catchlight: 0.9,
  },
  flat: {
    label: 'Flat',
    note: 'Depth only, no light. For dense UI and print.',
    filter: null,
    slices: 'flat', body: 1, specular: 0, spot: 0, fur: 0, catchlight: 0,
  },
  glass: {
    label: 'Glass',
    note: 'One translucent sheet: a thin white rim on the outer edge only, a bright top band and a glossy streak.',
    filter: { fuzz: 0, fuzzFreq: 0, grain: 0, grainFreq: 0, hi: { dy: 0.9, blur: 0.35, op: 0.7 }, sh: { dy: 1, blur: 0.9, op: 0.22 }, rim: { width: 0.28, op: 0.8 } },
    slices: 'glass', body: 0.72, specular: 0.85, spot: 0.5, fur: 0, catchlight: 1,
  },
  fabric: {
    label: 'Fabric',
    note: 'Felt over a cushion: a rounded bevel all round the edge, fine grain, a barely-soft outline - a plush toy.',
    filter: { fuzz: 0.15, fuzzFreq: 2.4, grain: 0.2, grainFreq: 3.2, hi: { dy: 1.2, blur: 1, op: 0.18 }, sh: { dy: 1.3, blur: 1.1, op: 0.25 }, bevel: { blur: 0.9, scale: 6, light: 0.55, shade: 0.5 } },
    slices: 'shade', body: 1, specular: 0, spot: 0.3, fur: 0, catchlight: 1,
  },
  fluffy: {
    label: 'Fluffy',
    note: 'Fur: a fringe of hair past the silhouette, a broken edge, coarse grain.',
    filter: { fuzz: 1, fuzzFreq: 3.4, grain: 0.28, grainFreq: 4.2, hi: { dy: 1.7, blur: 1.2, op: 0.3 }, sh: { dy: 1.6, blur: 1.2, op: 0.3 }, bevel: { blur: 1.2, scale: 4, light: 0.3, shade: 0.35 } },
    slices: 'shade', body: 1, specular: 0, spot: 0.25, fur: 0.85, catchlight: 1,
  },
}

/** The front material: optional edge fuzz, inner light and shade bands, grain. */
export function MaterialFilter({ id, m }: { id: string; m: NonNullable<Material['filter']> }) {
  const k = m.grain * 6
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36" colorInterpolationFilters="sRGB">
      {m.fuzz ? (
        <>
          <feTurbulence type="fractalNoise" baseFrequency={m.fuzzFreq} numOctaves={2} seed={4} result="fn" />
          <feDisplacementMap in="SourceGraphic" in2="fn" scale={m.fuzz} xChannelSelector="R" yChannelSelector="G" result="base" />
        </>
      ) : (
        <feOffset in="SourceGraphic" result="base" />
      )}
      <feColorMatrix in="base" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="A" />
      {/* light: the body minus itself shifted down = a band along the top edge */}
      <feOffset in="A" dy={m.hi.dy} result="ho" />
      <feGaussianBlur in="ho" stdDeviation={m.hi.blur} result="hob" />
      <feComposite in="A" in2="hob" operator="arithmetic" k2="1" k3="-1" result="hiM" />
      <feFlood floodColor={LIGHT} floodOpacity={m.hi.op} />
      <feComposite in2="hiM" operator="in" result="hiC" />
      {/* shade: the same from below */}
      <feOffset in="A" dy={-m.sh.dy} result="so" />
      <feGaussianBlur in="so" stdDeviation={m.sh.blur} result="sob" />
      <feComposite in="A" in2="sob" operator="arithmetic" k2="1" k3="-1" result="shM" />
      <feFlood floodColor={BRAND_DEEP} floodOpacity={m.sh.op} />
      <feComposite in2="shM" operator="in" result="shC" />
      {m.bevel ? (
        <>
          {/* a pillow height field from the blurred silhouette, lit from the upper left */}
          <feGaussianBlur in="A" stdDeviation={m.bevel.blur} result="bh" />
          {/* specular comes out with alpha = its strength (colour channels unpremultiply to 1), so read alpha;
              the flat top reflects ~0.04 at this exponent - subtracted, so only the rounded rim catches light */}
          <feSpecularLighting in="bh" surfaceScale={m.bevel.scale} specularConstant="1" specularExponent="32" lightingColor={LIGHT} result="bs">
            <feDistantLight azimuth="225" elevation="40" />
          </feSpecularLighting>
          <feColorMatrix in="bs" type="matrix" values={`0 0 0 0 0.97  0 0 0 0 0.87  0 0 0 0 1  0 0 0 ${m.bevel.light * 1.8} ${-m.bevel.light * 0.12}`} />
          <feComposite in2="A" operator="in" result="bvL" />
          <feDiffuseLighting in="bh" surfaceScale={m.bevel.scale} diffuseConstant="1" lightingColor="#FFFFFF" result="bd">
            <feDistantLight azimuth="225" elevation="40" />
          </feDiffuseLighting>
          {/* flat top = sin(40°) ≈ 0.64; darker than that = the far side rounding away */}
          <feColorMatrix in="bd" type="matrix" values={`0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.55  ${-m.bevel.shade * 2.2} 0 0 0 ${m.bevel.shade * 2.2 * 0.64}`} />
          <feComposite in2="A" operator="in" result="bvD" />
        </>
      ) : null}
      {m.rim ? (
        <>
          <feMorphology in="A" operator="erode" radius={m.rim.width} result="er" />
          <feComposite in="A" in2="er" operator="out" result="rimM" />
          <feFlood floodColor={LIGHT} floodOpacity={m.rim.op} />
          <feComposite in2="rimM" operator="in" result="rimC" />
        </>
      ) : null}
      {m.grain ? (
        <>
          <feTurbulence type="fractalNoise" baseFrequency={m.grainFreq} numOctaves={3} seed={9} result="g" />
          <feColorMatrix in="g" type="matrix" values={`0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.55  ${k} 0 0 0 ${-0.55 * k}`} />
          <feComposite in2="A" operator="in" result="gD" />
          <feColorMatrix in="g" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${-k} 0 0 0 ${0.45 * k}`} />
          <feComposite in2="A" operator="in" result="gL" />
        </>
      ) : null}
      <feMerge>
        <feMergeNode in="base" />
        <feMergeNode in="shC" />
        <feMergeNode in="hiC" />
        {m.bevel ? <feMergeNode in="bvD" /> : null}
        {m.bevel ? <feMergeNode in="bvL" /> : null}
        {m.rim ? <feMergeNode in="rimC" /> : null}
        {m.grain ? <feMergeNode in="gD" /> : null}
        {m.grain ? <feMergeNode in="gL" /> : null}
      </feMerge>
    </filter>
  )
}

/** Fluffy's fringe: the body torn into hair-fine spikes, laid behind the front. */
export function FurFilter({ id }: { id: string }) {
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36">
      <feTurbulence type="fractalNoise" baseFrequency="3.2 4" numOctaves={3} seed={2} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation="0.12" />
    </filter>
  )
}
