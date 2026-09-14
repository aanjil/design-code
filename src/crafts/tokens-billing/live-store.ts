import type { Balances, ReviewVariant } from './types'
import { preset } from './engine'

export type LiveScreen = 'tokens' | 'credit' | 'usage' | 'paymentMethods' | 'wallet' | 'buy'

/**
 * The Live App's real, mutable, localStorage-persisted state - same
 * external-store contract as every other craft's live-store.ts.
 * Versioned from day one (see multi-payroll's live-store.ts for why an
 * unversioned read of stale localStorage is worth avoiding from the start).
 */
export interface LiveData {
  version: number
  balances: Balances
  screen: LiveScreen
  buyQty: number
  buyMethod: 'ach' | 'wire'
  review: ReviewVariant | null
  autoReloadOpen: boolean
  autoReloadSources: Array<'credit' | 'wallet'>
}

const CURRENT_VERSION = 1
const DATA_KEY = 'nds-live:tokens-billing:data'

function seed(): LiveData {
  return {
    version: CURRENT_VERSION,
    balances: preset('healthy'),
    screen: 'tokens',
    buyQty: 1250,
    buyMethod: 'ach',
    review: null,
    autoReloadOpen: false,
    autoReloadSources: ['credit', 'wallet'],
  }
}

function isCurrentShape(value: unknown): value is LiveData {
  return !!value && typeof value === 'object' && (value as LiveData).version === CURRENT_VERSION
}

let cached: LiveData | null = null

function read(): LiveData {
  if (cached) return cached
  try {
    const raw = window.localStorage.getItem(DATA_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    cached = isCurrentShape(parsed) ? parsed : seed()
  } catch {
    cached = seed()
  }
  return cached
}

function persist() {
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(cached))
  } catch {
    /* ignore (private mode / quota) */
  }
}

const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((l) => l())
}

function update(patch: Partial<LiveData>) {
  cached = { ...read(), ...patch }
  persist()
  emit()
}

export const liveStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  getSnapshot(): LiveData {
    return read()
  },
  getServerSnapshot(): LiveData {
    return seed()
  },
  reset() {
    cached = seed()
    persist()
    emit()
  },
  navigate(screen: LiveScreen) {
    update({ screen, review: null })
  },
  setBuyQty(qty: number) {
    update({ buyQty: qty })
  },
  setBuyMethod(method: 'ach' | 'wire') {
    update({ buyMethod: method })
  },
  openReview(variant: ReviewVariant) {
    update({ review: variant })
  },
  closeReview() {
    update({ review: null })
  },
  /** Real purchase - v1 funding order (credit, then wallet, then whatever's
   *  left is a no-op here since the Live App only demonstrates the
   *  instantly-clears path; ACH/wire settlement stays a catalog-only state). */
  commitPurchase(qty: number, spend: { credit: number; wallet: number }) {
    const cur = read()
    update({
      balances: {
        ...cur.balances,
        tokens: cur.balances.tokens + qty,
        credit: cur.balances.credit - spend.credit,
        wallet: cur.balances.wallet - spend.wallet,
      },
      review: 'done',
    })
  },
  openAutoReload() {
    update({ autoReloadOpen: true })
  },
  closeAutoReload() {
    update({ autoReloadOpen: false })
  },
  saveAutoReload(patch: { autoOn: boolean; arTh: number; arAmt: number; sources: Array<'credit' | 'wallet'> }) {
    const cur = read()
    update({
      balances: { ...cur.balances, autoOn: patch.autoOn, arTh: patch.arTh, arAmt: patch.arAmt },
      autoReloadSources: patch.sources,
      autoReloadOpen: false,
    })
  },
}
