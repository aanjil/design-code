/**
 * "Voice · run payroll" (bezel_7.html voiceSim, ported to the real Master
 * App). Said from any page; Emma's cursor then drives the product the way
 * a person would - AppBar "Payments", sidebar "Payroll", the run that needs
 * approval - resolves the three reversible tensions, and stops on the one
 * button that moves money.
 *
 * The Bezel doc's line, enforced here:
 *   navigation is free and reversible -> Emma does it without asking
 *   a decision under low confidence    -> she hesitates, offers you the
 *                                         wheel, else takes the most
 *                                         reversible reading
 *   commitment is not reversible       -> she stops, and dissolves
 * "Take over" sits in the bar at every step; stopping loses nothing - the
 * run is exactly where she left it, because she only ever clicked the app.
 */

import type { AgentCursorApi } from './agent-cursor'
import type { AgentBar } from './floating-bezel'
import { TOTAL_EMPLOYEES, computeImpact, fmtMoney } from '@/crafts/dynamic-timeline/engine'
import { SCHEDULES } from '@/mocks/payroll'
import { WORLD_TODAY, fmtHuman, periodOf } from '@/crafts/multi-payroll/engine'

/** Thrown out of any wait once the run is stopped (Take over / Stop). */
export const STOPPED = Symbol('agent-stopped')

export interface VoiceRunCtx {
  cursor: AgentCursorApi
  /** The app column - targets are only ever looked up inside it. */
  ground: () => HTMLElement | null
  bar: (bar: AgentBar) => void
  /** Assist mode: stop at the first thing that needs judgment. */
  assist: () => boolean
  /** Where the user was when they spoke ("Settings"). */
  where: string
  /** Sleeps; throws STOPPED if the run was stopped meanwhile. */
  wait: (ms: number) => Promise<void>
  /** Sleeps up to `ms`, or less if the user says "Choose the safe one". */
  hesitate: (ms: number) => Promise<void>
  takeOver: () => void
  proceed: () => void
  /** The user's own click on the bar's "Approve and submit". */
  approve: () => void
  /** Hand back: cursor gone, bar keeps the last word. */
  finish: () => void
}

/** The cycle the run list says needs approval (same mock as Payments › Payroll). */
export function payrollCycle() {
  const s = SCHEDULES[0]
  const p = periodOf(s.frequency, WORLD_TODAY)
  return `${fmtHuman(p.start)} – ${fmtHuman(p.end)}`
}

export async function runVoicePayroll(ctx: VoiceRunCtx) {
  const { cursor, wait } = ctx
  const take = { label: 'Take over', onSelect: ctx.takeOver }
  const drive = (claim: string, sub: string) => ctx.bar({ phase: 'driving', claim, sub, actions: [take] })

  async function find<T extends HTMLElement = HTMLElement>(sel: string, timeout = 3500): Promise<T | null> {
    const until = Date.now() + timeout
    for (;;) {
      const el = ctx.ground()?.querySelector<T>(sel)
      if (el) return el
      if (Date.now() > until) return null
      await wait(80)
    }
  }

  /** Scroll it into view, glide there, press it - the way you would. */
  async function click(el: HTMLElement, label = 'Emma', ms = 850) {
    cursor.scrollTo(el)
    await wait(480)
    cursor.moveTo(el, label, ms)
    await wait(ms + 120)
    cursor.press(el)
    await wait(420)
  }

  /* 0 - listening */
  ctx.bar({ phase: 'listening', claim: 'Listening…', sub: `on ${ctx.where}`, actions: [] })
  await wait(1700)

  /* 1 - heard, with a scope and a brake */
  ctx.bar({
    phase: 'heard',
    claim: '“run payroll for this cycle”',
    sub: `heard · ${payrollCycle()} · ${TOTAL_EMPLOYEES} people · nothing changed yet`,
    actions: [],
  })
  await wait(1600)

  /* 2 - the cursor appears; the rule that makes this safe */
  cursor.park()
  cursor.show()
  drive('Taking you there. Payments › Payroll', 'I can navigate freely · I stop before anything commits')
  await wait(700)

  // Spoken on the run itself: pick up where it is. Anywhere else: walk the
  // whole path, even if the app remembers an open run.
  const onRun = !!ctx.ground()?.querySelector('[data-tension], [data-agent="approve-run"]')
  if (!onRun) {
    /* 3 - AppBar "Payments" */
    const nav = await find('[data-appbar-item="Payments"]', 1200)
    if (nav) await click(nav, 'Emma', 900)
    await wait(350)

    /* 4 - sidebar "Payroll" -> the runs list */
    const leaf = await find('[data-sidebar-item="Payroll"]')
    if (!leaf) return lost('the Payroll page')
    await click(leaf, 'Emma', 850)

    /* 5 - the run that needs approval */
    const review = await find('[data-agent="review-run"]')
    if (!review) return lost('the run that needs approval')
    drive('Opening the run that needs approval', `${payrollCycle()} · nothing approved`)
    await click(review, 'Emma', 800)
  }

  /* 6 - Prepare ran itself */
  drive('Prepare ran itself · 41 clear, 3 need a call', 'timesheets · expenses · time off · balances')
  await wait(1300)

  if (ctx.assist()) {
    const first = await find('[data-tension]', 1500)
    if (first) {
      cursor.scrollTo(first)
      await wait(480)
      cursor.moveTo(first, 'handing back', 700)
      await wait(1000)
    }
    ctx.bar({
      phase: 'handed',
      claim: 'The three calls are yours',
      sub: 'I navigated and prepared · nothing decided, nothing submitted',
      actions: [],
    })
    return ctx.finish()
  }

  /* T1 - Sam, .68: reversible until submit, so it proceeds and says why */
  const sam = await find('[data-tension="sam"] [data-option="hold"]', 1200)
  if (sam) {
    drive('Sam has no bank account. Holding him is the only option that pays everyone else', '.68 · reversible until you submit')
    await click(sam, 'Emma · .68', 750)
    await wait(500)
  }

  /* T2 - Maya, .35: the hesitation is the point */
  const maya = await find('[data-tension="maya"]', 1200)
  if (maya) {
    cursor.scrollTo(maya)
    await wait(480)
    cursor.moveTo(maya, '.35 low', 750, maya.querySelector('h3'))
    ctx.bar({
      phase: 'hesitating',
      claim: 'Maya’s overtime is .35. I’d rather you took this one',
      sub: 'three equal readings · left alone, I take the most reversible',
      actions: [
        { label: 'I’ll take it', primary: true, onSelect: ctx.takeOver },
        { label: 'Choose the safe one', onSelect: ctx.proceed },
      ],
    })
    await ctx.hesitate(2800)
    const cap = await find('[data-tension="maya"] [data-option="cap"]', 600)
    if (cap) {
      drive('Capping Maya at the 10h policy limit', 'the safe read · the remainder goes to a person, not approved')
      await click(cap, 'taking the safe read', 700)
      await wait(500)
    }
  }

  /* T3 - Diego, .58 */
  const exp = await find('[data-tension="exp"] [data-option="reject"]', 1200)
  if (exp) {
    drive('Rejecting #4521. Vendor, amount and date all match #4498', '.58 · Diego is notified and can dispute')
    await click(exp, 'Emma · .58', 700)
    await wait(700)
  }

  /* The one it will not click */
  const approve = await find('[data-agent="approve-run"]', 2500)
  if (!approve) return lost('the approval step')
  cursor.scrollTo(approve)
  await wait(520)
  cursor.moveTo(approve, 'this one is yours', 800)
  const impact = computeImpact({ sam: 'hold', maya: 'cap', exp: 'reject' })
  ctx.bar({
    phase: 'ready',
    claim: `Ready. ${TOTAL_EMPLOYEES - 1} people, ${fmtMoney(impact.total)}`,
    sub: 'everything above is reversible · this button is not',
    actions: [{ label: 'Approve and submit', primary: true, onSelect: ctx.approve }],
  })
  await wait(1500)
  ctx.finish()

  function lost(what: string) {
    ctx.bar({
      phase: 'handed',
      claim: `I couldn’t find ${what}`,
      sub: 'stopped where I was · nothing changed',
      actions: [],
    })
    ctx.finish()
  }
}
