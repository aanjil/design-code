import { describe, expect, it } from 'vitest'
import { createMockEngine, defineFlow, fmtDuration, ms } from './engine'

const invite = defineFlow({
  id: 'invite',
  label: 'Invite',
  initial: 'invited',
  states: {
    invited: { label: 'Invited', after: { in: '1d', to: 'onboarding' }, on: { REVOKE: 'revoked' } },
    onboarding: { label: 'Onboarding', after: { in: '2d', to: 'active' } },
    active: { label: 'Active' },
    revoked: { label: 'Revoked' },
  },
  events: { REVOKE: 'Revoke invite' },
})

const START = '2026-08-24T09:00:00Z'
const t0 = Date.parse(START)

function world() {
  return createMockEngine({
    start: START,
    flows: [invite],
    instances: [
      { id: 'a', flow: 'invite' },
      { id: 'b', flow: 'invite', state: 'onboarding', enteredAgo: '1d' },
    ],
  })
}

describe('durations', () => {
  it('parses compact strings', () => {
    expect(ms('90m')).toBe(5_400_000)
    expect(ms('1d12h')).toBe(ms('36h'))
    expect(ms(42)).toBe(42)
    expect(() => ms('soon')).toThrow()
  })
  it('formats coarsely', () => {
    expect(fmtDuration(ms('2d4h'))).toBe('2d 4h')
    expect(fmtDuration(ms('35m'))).toBe('35m')
    expect(fmtDuration(0)).toBe('now')
  })
})

describe('mock engine', () => {
  it('seeds mid-maturity from enteredAgo', () => {
    const e = world()
    expect(e.get().instances.b.dueAt).toBe(t0 + ms('1d'))
    expect(e.nextDueAt()).toBe(t0 + ms('1d'))
  })

  it('fires timed transitions in order and chains through states', () => {
    const e = world()
    e.advance('3d')
    const s = e.get()
    expect(s.instances.a.state).toBe('active')
    expect(s.instances.b.state).toBe('active')
    expect(s.log.map((l) => `${l.instanceId}:${l.to}`)).toEqual(['a:onboarding', 'b:active', 'a:active'])
    // each transition is stamped at its due time, not the advance target
    expect(s.log[0].at).toBe(t0 + ms('1d'))
  })

  it('next() jumps exactly to the next transition', () => {
    const e = world()
    e.next()
    expect(e.get().now).toBe(t0 + ms('1d'))
    expect(e.get().log).toHaveLength(2) // a and b are both due at +1d
  })

  it('events only fire where the current state allows them', () => {
    const e = world()
    expect(e.send('b', 'REVOKE')).toBe(false)
    expect(e.send('a', 'REVOKE')).toBe(true)
    expect(e.get().instances.a).toMatchObject({ state: 'revoked', dueAt: null })
  })

  it('jitter is seeded - same world, same timeline', () => {
    const jittery = defineFlow({
      id: 'j',
      label: 'J',
      initial: 'x',
      states: { x: { label: 'X', after: { in: '1d', to: 'y', jitter: '12h' } }, y: { label: 'Y' } },
    })
    const make = (seed: number) =>
      createMockEngine({
        start: START,
        seed,
        flows: [jittery],
        instances: ['p', 'q', 'r'].map((id) => ({ id, flow: 'j' })),
      }).get().instances
    const a = make(7)
    expect(make(7)).toEqual(a)
    const dues = Object.values(a).map((i) => i.dueAt! - t0)
    for (const d of dues) expect(Math.abs(d - ms('1d'))).toBeLessThanOrEqual(ms('12h'))
    expect(new Set(dues).size).toBeGreaterThan(1)
  })

  it('reset returns to the seeded world', () => {
    const e = world()
    e.advance('5d')
    e.force('a', 'revoked')
    e.reset()
    expect(e.get().now).toBe(t0)
    expect(e.get().instances.a.state).toBe('invited')
    expect(e.get().log).toEqual([])
  })
})
