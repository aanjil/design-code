import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowCounterClockwise,
  ArrowUp,
  Brain,
  ChatCircleDots,
  CheckCircle,
  CornersIn,
  CornersOut,
  Ear,
  GearSix,
  House,
  Moon,
  PaperPlaneTilt,
  Smiley,
  Sparkle,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react'
import { Button, Slider, Switch } from '@niural/components'
import { Annotate } from '@/components/playground/annotations'
import { CraftFrame } from '@/components/playground/craft-frame'
import { FieldLabel, TextInput } from '@/components/nds/controls'
import {
  EMMA_REACTIONS,
  EMMA_SHADINGS,
  MATERIALS,
  EMMA_STATES,
  EmmaAmbient,
  EmmaAvatar,
  useEmma,
  type EmmaAvatarHandle,
  type EmmaShading,
  type EmmaState,
} from '@/components/emma-avatar'
import { cn } from '@/lib/utils'

/**
 * Emma's avatar, built from the Emma mark: the six honeycomb cells are her
 * body, the sparkle is her face. Three views - the studio (one Emma, every
 * control), ambient feedback on a real-ish payroll screen, and the sizes
 * the product uses.
 */
export function EmmaAvatarCraft() {
  return (
    <CraftFrame
      slug="emma-avatar"
      variants={[
        { id: 'studio', label: 'Studio', node: <Studio />, note: 'Every state and reaction. Move your cursor - she watches it.' },
        { id: 'ambient', label: 'Ambient feedback', node: <Ambient />, note: 'She reacts to what you do on the page, without being asked.' },
        { id: 'context', label: 'In the product', node: <InContext />, note: 'The same avatar at 20 / 28 / 36 / 56px.' },
      ]}
    />
  )
}

const STATE_COPY: Record<EmmaState, string> = {
  idle: 'Awake. Breathes, blinks, glances round, follows your cursor; hops and turns now and then.',
  listening: 'You are talking or typing to her. Leans in, eyes wide, ring pulled tight; the halo follows your voice.',
  thinking: 'Working something out. The ring orbits round her face, eyes drift up, head tilts.',
  working: 'A run in flight. A chase travels round the ring like a loader; eyes down on the work.',
  speaking: 'Answering. Her face lifts with each syllable and the ring ripples up from the bottom.',
  success: 'It landed. Happy eyes, a hop and a full turn, a burst of sparkles, a green halo.',
  attention: 'Needs you. Wide eyes, a shake, an amber halo; give her a target and a cell points at it.',
  sleeping: 'Nothing needs you. Lids shut, face dimmed, the ring loosens, slow breaths.',
  flying: 'On the move. Flies on an arc to somewhere new - banks into the turn, stretches, blurs along the path, leaves after-images; her shadow stays on the floor.',
}

const STATE_ICON: Record<EmmaState, Icon> = {
  idle: Smiley,
  listening: Ear,
  thinking: Brain,
  working: GearSix,
  speaking: ChatCircleDots,
  success: CheckCircle,
  attention: WarningCircle,
  sleeping: Moon,
  flying: PaperPlaneTilt,
}

// ─── Studio ──────────────────────────────────────────────────────────────────

type Watch = 'page' | 'near' | 'none'

function Studio() {
  const emma = useRef<EmmaAvatarHandle>(null)
  const [state, setState] = useState<EmmaState>('idle')
  const [shading, setShading] = useState<EmmaShading>('smooth')
  const [morph, setMorph] = useState(true)
  const [glow, setGlow] = useState(true)
  const [jumps, setJumps] = useState(true)
  const [watch, setWatch] = useState<Watch>('page')
  const [level, setLevel] = useState<number | null>(null)
  const [full, setFull] = useState(false)
  const [size, setSize] = useState(260)

  const reset = () => {
    setState('idle')
    setShading('smooth')
    setMorph(true)
    setGlow(true)
    setJumps(true)
    setWatch('page')
    setLevel(null)
    setSize(260)
    emma.current?.flyTo(null)
  }
  const voiced = state === 'speaking' || state === 'listening'

  // Full screen: Esc closes, the page underneath stops scrolling.
  useEffect(() => {
    if (!full) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [full])

  const avatar = { state, shading, faceMorph: morph, glow, idleJumps: jumps, watch, level: voiced ? (level ?? undefined) : undefined }

  const toolbar = (
    <div className="flex flex-col gap-3">
      <Section label="Material">
        <div className="grid grid-cols-3 gap-1.5">
          {EMMA_SHADINGS.map((m, i) => (
            <PickTile key={m} active={m === shading} onClick={() => setShading(m)} label={MATERIALS[m].label}>
              <EmmaAvatar size={28} seed={i / 6} {...avatar} shading={m} glow={false} interactive={false} roam={{ x: 6, y: 3 }} />
            </PickTile>
          ))}
        </div>
        <p className="line-clamp-2 text-caption-sm text-muted">{MATERIALS[shading].note}</p>
      </Section>
      <Section label="State">
        <div className="grid grid-cols-3 gap-1.5">
          {EMMA_STATES.map((st) => {
            const StateIcon = STATE_ICON[st]
            return (
              <PickTile key={st} row active={st === state} onClick={() => setState(st)} label={st}>
                <StateIcon className={cn('size-4 shrink-0', st === state && 'text-brand')} />
              </PickTile>
            )
          })}
        </div>
      </Section>
      <Section label="React">
        <div className="flex flex-wrap gap-1">
          {EMMA_REACTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => emma.current?.react(r)}
              className="h-6 rounded-full bg-base px-2 text-caption-sm font-medium text-muted capitalize borders-base hover:bg-highlight hover:text-primary"
            >
              {r}
            </button>
          ))}
        </div>
      </Section>
      <Section label="Size">
        <div className="flex items-center gap-3">
          <Slider className="flex-1" value={[size]} min={24} max={420} step={2} onValueChange={(v: number[]) => setSize(v[0])} />
          <span className="w-12 text-right tabular-nums text-caption-sm text-primary">{size}px</span>
        </div>
        <div className="flex gap-1">
          {[36, 96, 260, 400].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSize(p)}
              className={cn('h-6 rounded-full px-2 tabular-nums text-caption-xs borders-base', size === p ? 'bg-base text-primary' : 'text-muted hover:text-primary')}
            >
              {p}
            </button>
          ))}
        </div>
      </Section>
      {voiced && (
        <Section label="Voice">
          <div className="flex items-center gap-3">
            <Slider className="flex-1" value={[Math.round((level ?? 0.5) * 100)]} max={100} step={1} onValueChange={(v: number[]) => setLevel(v[0] / 100)} />
            <button type="button" className="text-label-xsmall text-brand" onClick={() => setLevel(null)}>
              {level == null ? 'Synthesised' : 'Reset'}
            </button>
          </div>
        </Section>
      )}
      <Section label="Cursor">
        <Seg
          options={[
            { label: 'Page', value: 'page' },
            { label: 'Near', value: 'near' },
            { label: 'Off', value: 'none' },
          ]}
          value={watch}
          onChange={(v) => setWatch(v as Watch)}
        />
      </Section>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <InlineToggle label="Morph" checked={morph} onChange={setMorph} />
        <InlineToggle label="Halo" checked={glow} onChange={setGlow} />
        <InlineToggle label="Hops" checked={jumps} onChange={setJumps} />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" shade="neutral" leftIcon={<ArrowCounterClockwise className="size-4" />} onClick={reset}>
          Reset
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          shade="neutral"
          leftIcon={full ? <CornersIn className="size-4" /> : <CornersOut className="size-4" />}
          onClick={() => setFull(!full)}
        >
          {full ? 'Exit · Esc' : 'Full screen'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Annotate
        n={1}
        title="Controls on the left, stage gets the rest"
        note="Pickers are live previews, not labels: the material grid shows each material in the current state, so you see the combination before you pick it; states are plain icons. Reactions are one-shots that play over the state. Size scrubs the stage avatar 24-420px; Full screen opens a 96vw × 97vh stage with the same split."
      >
        {toolbar}
      </Annotate>
      <Annotate
        n={2}
        title="Fly"
        note="Click anywhere on the stage and she flies there - on an arc, banking and turning into the direction, stretching along it, motion-blurred along the path with after-images and speed streaks, and bigger at the top of the arc (nearer the camera) while her shadow stays on the floor. In the Flying state she roams on her own. Apps call emma.flyTo(element)."
      >
        {full ? (
          <div className="flex h-[calc(100vh-200px)] min-h-[560px] items-center justify-center rounded-xl bg-muted text-paragraph-small text-muted">Showing in full screen · Esc to come back</div>
        ) : (
          <Stage emma={emma} size={size} avatar={avatar} className="h-[calc(100vh-200px)] min-h-[560px]" />
        )}
      </Annotate>

      {full &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay backdrop-blur-sm"
            onPointerDown={(e) => e.target === e.currentTarget && setFull(false)}
          >
            <div role="dialog" aria-modal aria-label="Emma studio" className="grid h-[97vh] w-[96vw] grid-cols-[320px_minmax(0,1fr)] gap-4 rounded-2xl bg-base p-4 elevation-modal">
              <div className="min-h-0 overflow-y-auto">{toolbar}</div>
              <Stage emma={emma} size={size} avatar={avatar} className="h-full" />
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

/** A compact segmented control (fe-pkg Tabs has no small size). */
function Seg({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-8 rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-md text-label-xsmall transition-colors',
            o.value === value ? 'bg-base text-primary card' : 'text-muted hover:text-primary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <p className="text-caption-sm font-medium text-muted">{label}</p>
      {children}
    </section>
  )
}

/** A small live tile used as a picker: the avatar is the label. */
function PickTile({
  active,
  onClick,
  label,
  row = false,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  /** icon and label side by side - the compact form */
  row?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center rounded-lg transition-colors',
        row ? 'h-8 gap-1.5 px-2' : 'flex-col gap-1 pt-2 pb-1.5',
        active ? 'bg-base text-primary card' : 'bg-muted text-muted hover:bg-highlight hover:text-primary',
      )}
    >
      {children}
      <span className="truncate text-label-xsmall capitalize">{label}</span>
    </button>
  )
}

/** The big preview: she roams within it while flying; click anywhere and she flies there. */
function Stage({
  emma,
  size,
  avatar,
  className,
}: {
  emma: React.RefObject<EmmaAvatarHandle | null>
  size: number
  avatar: React.ComponentProps<typeof EmmaAvatar>
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [roam, setRoam] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setRoam({ x: Math.max(0, width / 2 - size * 0.7), y: Math.max(0, height / 2 - size * 0.75) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [size])

  return (
    <div
      ref={box}
      className={cn('relative flex cursor-crosshair items-center justify-center overflow-hidden rounded-xl bg-muted', className)}
      onPointerDown={(e) => {
        if ((e.target as Element).closest('svg, button')) return
        // Keep her landing inside the stage.
        const r = e.currentTarget.getBoundingClientRect()
        const m = size * 0.6
        emma.current?.flyTo({
          x: Math.min(r.right - m, Math.max(r.left + m, e.clientX)),
          y: Math.min(r.bottom - m, Math.max(r.top + m, e.clientY)),
        })
      }}
    >
      <EmmaAvatar ref={emma} size={size} roam={roam} {...avatar} />
      <p className="pointer-events-none absolute bottom-3 left-4 max-w-[60%] text-paragraph-xsmall text-muted">{STATE_COPY[avatar.state ?? 'idle']}</p>
      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        <span className="pointer-events-none text-caption-xs text-muted">Click anywhere - she flies there</span>
        <button
          type="button"
          onClick={() => emma.current?.flyTo(null)}
          className="flex h-7 items-center gap-1 rounded-full bg-base px-2.5 text-label-xsmall text-primary borders-base hover:bg-highlight"
        >
          <House className="size-3.5" />
          Home
        </button>
      </div>
    </div>
  )
}

// ─── Ambient ─────────────────────────────────────────────────────────────────

function Ambient() {
  const scope = useRef<HTMLDivElement>(null)
  return (
    <EmmaAmbient root={scope} sleepAfter={15_000}>
      <div ref={scope}>
        <ApprovalCard />
      </div>
    </EmmaAmbient>
  )
}

function ApprovalCard() {
  const emma = useEmma()
  const bank = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<EmmaState>('idle')
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const hold = (s: EmmaState, ms: number) => {
    setState(s)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), ms)
  }

  return (
    <div className="mx-auto grid max-w-[920px] gap-5 py-2 lg:grid-cols-[1fr_260px]">
      <form
        className="flex flex-col gap-5 rounded-xl bg-base p-4 card"
        onSubmit={(e) => {
          e.preventDefault()
          hold('working', 1800)
          timer.current = window.setTimeout(() => hold('success', 2600), 1800)
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-label-medium text-primary">Approve October payroll</p>
            <p className="text-paragraph-xsmall text-muted">118 employees · pays Oct 31 · Acme Inc.</p>
          </div>
          <Annotate
            n={1}
            inline
            title="She lives in the corner"
            note="Same spot as the Bezel bar's avatar. Her eyes follow your cursor anywhere on the page while it moves, and her head turns when it comes close; a couple of seconds after it stops she goes back to her own glances so she never stares."
          >
            <EmmaAvatar state={state} size={56} />
          </Annotate>
        </div>

        <Annotate
          n={2}
          title="Typing → listening"
          note="Focus a field and she leans in and looks at it; every keystroke flicks her eyes down - she is reading along. Leave the field and she lets go."
        >
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="emma-note">Note to approver</FieldLabel>
            <TextInput id="emma-note" placeholder="Anything the approver should know…" />
          </div>
        </Annotate>

        <Annotate
          n={3}
          title="Hotspots: data-emma=&quot;caution&quot;"
          note="Hovering a risky element puts her in attention - amber halo, wide eyes - and the cell nearest to it reaches out and points. One attribute, no wiring: data-emma = look | point | caution | curious | celebrate."
        >
          <div ref={bank} data-emma="caution" className="flex items-center justify-between gap-3 rounded-xl bg-warning-highlight px-3 py-2.5 borders-base">
            <div>
              <p className="text-label-small text-primary">Bank account changed 2 days ago</p>
              <p className="tabular-nums text-paragraph-xsmall text-muted">Chase •••• 4821 → Wise •••• 0193 · Priya Raman</p>
            </div>
            <span className="text-label-xsmall text-warning">Review</span>
          </div>
        </Annotate>

        <Annotate
          n={4}
          title="Validation → concern"
          note="Submit with Bonus empty: the browser's own invalid event makes her shake, go amber and point at the field for two seconds. Nothing to wire - EmmaAmbient listens for invalid inside its root."
        >
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="emma-bonus" required>
              One-off bonus (USD)
            </FieldLabel>
            <TextInput id="emma-bonus" type="number" min={0} max={5000} required placeholder="0 – 5,000" className="tabular-nums" />
          </div>
        </Annotate>

        <Annotate
          n={5}
          title="Selection → thinking"
          note="Select any of this text and she starts thinking, looking at the selection - the cue that she could explain it (the Bezel's 'Ask about these')."
        >
          <p data-emma="curious" className="rounded-xl bg-muted px-3 py-2.5 text-paragraph-small text-primary">
            Net pay is <span className="tabular-nums">$3,120.40</span> lower than September: two employees moved to a bi-weekly schedule and one unpaid leave started Oct 14.
          </p>
        </Annotate>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" shade="neutral" size="sm" data-emma="celebrate" leftIcon={<Sparkle className="size-4" />}>
            Mark reviewed
          </Button>
          <Button
            type="button"
            variant="outline"
            shade="neutral"
            size="sm"
            onClick={() => {
              emma.lookAt(bank.current)
              emma.react('insight')
              window.setTimeout(() => emma.lookAt(null), 2600)
            }}
          >
            Show me what changed
          </Button>
          <Button type="submit" size="sm" data-emma="point">
            Approve payroll
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-label-small text-primary">Try</p>
        {[
          'Move your cursor round the page.',
          'Hover the amber row.',
          'Type in "Note to approver".',
          'Select text in the grey box.',
          'Approve with Bonus empty, then with a number.',
          '"Show me what changed" - she looks and points.',
          'Stop for 15s - she falls asleep. Move to wake her.',
        ].map((t, i) => (
          <p key={t} className="flex gap-2 text-paragraph-small text-muted">
            <span className="tabular-nums text-primary">{i + 1}</span>
            {t}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── In the product ──────────────────────────────────────────────────────────

function InContext() {
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-8 py-2">
      <Annotate n={1} title="AppBar - 20px" note="Replaces the static mark in the Ask Emma pill. Idle hops are off at this size; she still blinks and watches.">
        <Surface label="AppBar">
          <div className="flex h-[34px] w-fit items-center gap-1.5 rounded-full bg-base pr-3 pl-2 borders-base">
            <EmmaAvatar size={20} glow={false} ground={false} idleJumps={false} seed={0.1} />
            <span className="text-label-small text-primary">Ask Emma</span>
          </div>
        </Surface>
      </Annotate>

      <Annotate n={2} title="Thread - 28px, speaking" note="The avatar on the turn that is streaming speaks; earlier turns go still (idle, no hops) so only one face moves at once.">
        <Surface label="Thread">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <EmmaAvatar size={28} glow={false} ground={false} idleJumps={false} watch="none" seed={0.3} />
              <p className="rounded-xl bg-muted px-3 py-2 text-paragraph-small text-primary">Three employees in California are missing a SDI withholding.</p>
            </div>
            <div className="flex justify-end">
              <p className="rounded-xl bg-brand px-3 py-2 text-paragraph-small text-on-color">Fix them and re-run the preview</p>
            </div>
            <div className="flex items-start gap-2.5">
              <EmmaAvatar size={28} state="speaking" glow={false} ground={false} seed={0.6} />
              <p className="rounded-xl bg-muted px-3 py-2 text-paragraph-small text-primary">Updating withholding for Maya, Arjun and Lee, then re-running…</p>
            </div>
          </div>
        </Surface>
      </Annotate>

      <Annotate n={3} title="Bezel bar - 36px, working" note="Where EmmaBot sits today. The chase round the ring reads as progress without a separate spinner.">
        <Surface label="Bezel">
          <div className="flex h-[54px] items-center gap-2 rounded-full bg-base pr-2 pl-3 card">
            <EmmaAvatar size={36} state="working" seed={0.8} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-label-small text-primary">Running October payroll</p>
              <p className="tabular-nums text-caption-xs text-muted">42 of 118 employees</p>
            </div>
            <span className="flex size-8 items-center justify-center rounded-full bg-muted">
              <ArrowUp className="size-4 text-muted" />
            </span>
          </div>
        </Surface>
      </Annotate>

      <Annotate n={4} title="Chat head - 56px" note="The Immersive orb. Asleep while the page is quiet, so the badge does the talking; awake when something needs you.">
        <Surface label="Chat head">
          <div className="flex items-center gap-6">
            <ChatHead state="sleeping" />
            <ChatHead state="attention" badge={2} />
          </div>
        </Surface>
      </Annotate>
    </div>
  )
}

function Surface({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label-xsmall text-muted">{label}</p>
      <div className="rounded-xl bg-muted p-4">{children}</div>
    </div>
  )
}

function ChatHead({ state, badge }: { state: EmmaState; badge?: number }) {
  return (
    <div className="relative flex size-14 items-center justify-center rounded-full bg-base card">
      <EmmaAvatar size={38} state={state} ground={false} />
      {badge ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 tabular-nums text-caption-xs font-medium text-on-color">
          {badge}
        </span>
      ) : null}
    </div>
  )
}

// ─── shared ──────────────────────────────────────────────────────────────────

function InlineToggle({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <label className={cn('flex items-center gap-2', disabled && 'opacity-50')}>
      <Switch isChecked={checked && !disabled} onChange={onChange} isDisabled={disabled} />
      <span className={cn('text-label-xsmall', checked && !disabled ? 'text-primary' : 'text-muted')}>{label}</span>
      {hint && <span className="text-caption-xs text-muted">{hint}</span>}
    </label>
  )
}
