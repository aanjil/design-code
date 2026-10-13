import { useMemo, useSyncExternalStore } from 'react'
import type { Employee, EmployeeStatus } from '@/mocks/employees'
import { employees } from '@/mocks/employees'
import { WORLD_TODAY } from '@/mocks/bezel'
import type { EngineConfig, EngineSnapshot } from '@/mocks/engine'
import { defineFlow, useOptionalMockEngine } from '@/mocks/engine'

/**
 * The bezel's mock world: everyone the seed left Invited or Onboarding is
 * a live instance of the onboarding flow, so pressing Play on the Director
 * walks them to Active over virtual days and the table's status column
 * moves with it. The reference wiring for `src/mocks/engine` - a flow, a
 * seed, and a projection back onto the craft's existing mock rows.
 */

export const ONBOARDING_FLOW = defineFlow({
  id: 'onboarding',
  label: 'Employee onboarding',
  initial: 'invited',
  states: {
    invited: {
      label: 'Invited',
      tone: 'info',
      after: { in: '1d', to: 'onboarding', jitter: '18h' },
      on: { RESEND: 'invited', REVOKE: 'offboarded' },
    },
    onboarding: {
      label: 'Onboarding',
      tone: 'warning',
      after: { in: '3d', to: 'active', jitter: '1d' },
      on: { COMPLETE: 'active' },
    },
    active: { label: 'Active', tone: 'success', on: { OFFBOARD: 'offboarded' } },
    offboarded: { label: 'Offboarded', tone: 'neutral' },
  },
  events: {
    RESEND: 'Resend',
    REVOKE: 'Revoke',
    COMPLETE: 'Finish',
    OFFBOARD: 'Offboard',
  },
})

type OnboardingState = keyof typeof ONBOARDING_FLOW.states

const STATE_TO_STATUS: Record<OnboardingState, EmployeeStatus> = {
  invited: 'invited',
  onboarding: 'onboarding',
  active: 'active',
  offboarded: 'offboarded',
}

/** Everyone the static seed left mid-onboarding... */
const IN_FLIGHT = employees.filter((e) => e.status === 'invited' || e.status === 'onboarding')

/** ...plus two first-page rows the world opens as fresh hires, so the
 *  maturing is visible without scrolling. Live window only - the frozen
 *  catalog frames keep the static statuses. */
const FRESH_HIRES: Array<{ e: Employee; state: OnboardingState; enteredAgo: string }> = [
  { e: employees[2], state: 'invited', enteredAgo: '20h' },
  { e: employees[8], state: 'onboarding', enteredAgo: '2d12h' },
]

export function bezelWorldConfig(): EngineConfig {
  return {
    start: `${WORLD_TODAY}T09:00:00Z`,
    seed: 824,
    flows: [ONBOARDING_FLOW],
    instances: [
      ...FRESH_HIRES.map(({ e, state, enteredAgo }) => ({
        id: e.id,
        flow: ONBOARDING_FLOW.id,
        label: e.name,
        state,
        enteredAgo,
      })),
      ...IN_FLIGHT.map((e, i) => ({
        id: e.id,
        flow: ONBOARDING_FLOW.id,
        label: e.name,
        state: e.status,
        // staggered so they don't all mature on the same tick
        enteredAgo: `${(i * 7) % 20}h`,
      })),
    ],
  }
}

const NO_ENGINE = { subscribe: () => () => {}, get: () => null as EngineSnapshot | null }

/**
 * `employees` with each instance's live state projected onto `status`.
 * Outside a MockEngineProvider (the frozen catalog frames) it's the plain
 * static mock, so those frames never move.
 */
export function useWorldEmployees(): Array<Employee> {
  const engine = useOptionalMockEngine() ?? NO_ENGINE
  const instances = useSyncExternalStore(
    engine.subscribe,
    () => engine.get()?.instances ?? null,
    () => engine.get()?.instances ?? null,
  )
  return useMemo(() => {
    if (!instances) return employees
    return employees.map((e) => {
      const inst = instances[e.id]
      return inst ? { ...e, status: STATE_TO_STATUS[inst.state as OnboardingState] } : e
    })
  }, [instances])
}
