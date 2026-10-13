import { createContext, useContext, useMemo, useState } from 'react'
import {
  CUSTOM_EARNINGS,
  IDENTITY_PROVIDERS,
  ORG,
  ORG_GROUPS,
  ORG_USERS,
  STATE_TAX,
  WORK_SCHEDULES,
} from '@/mocks/org-settings'
import type {
  CustomEarning,
  IdentityProvider,
  OrgGroup,
  OrgUser,
  StateTaxSetup,
  WorkSchedule,
} from '@/mocks/org-settings'

/**
 * One in-memory world per app instance (each canvas window gets its own),
 * seeded from src/mocks/org-settings.ts. No persistence - reload resets,
 * which keeps every demo starting from the same account.
 */

function useSettingsWorld() {
  const [taxationStatus, setTaxationStatus] = useState(ORG.taxationStatus)
  const [stateTax, setStateTax] = useState<Array<StateTaxSetup>>(STATE_TAX)
  const [users, setUsers] = useState<Array<OrgUser>>(ORG_USERS)
  const [groups, setGroups] = useState<Array<OrgGroup>>(ORG_GROUPS)
  const [idps, setIdps] = useState<Array<IdentityProvider>>(IDENTITY_PROVIDERS)
  const [schedules, setSchedules] = useState<Array<WorkSchedule>>(WORK_SCHEDULES)
  const [earnings, setEarnings] = useState<Array<CustomEarning>>(CUSTOM_EARNINGS)

  return useMemo(
    () => ({
      taxationStatus,
      setTaxationStatus,
      stateTax,
      setStateTax,
      users,
      setUsers,
      groups,
      setGroups,
      idps,
      setIdps,
      schedules,
      setSchedules,
      earnings,
      setEarnings,
    }),
    [taxationStatus, stateTax, users, groups, idps, schedules, earnings],
  )
}

type SettingsWorld = ReturnType<typeof useSettingsWorld>

const WorldContext = createContext<SettingsWorld | null>(null)

export function SettingsWorldProvider({ children }: { children: React.ReactNode }) {
  const world = useSettingsWorld()
  return <WorldContext.Provider value={world}>{children}</WorldContext.Provider>
}

export function useWorld(): SettingsWorld {
  const world = useContext(WorldContext)
  if (!world) throw new Error('useWorld must be used inside <SettingsWorldProvider>')
  return world
}

let seq = 0
export function newId(prefix: string) {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

/** Fixed "today" so new rows read the same in every screenshot. */
export const TODAY_ISO = '2026-10-14'
export const TODAY_LABEL = 'Oct 14, 2026'
