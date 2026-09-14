/**
 * Split-pay (Transak) craft data. UK EOR employee, USDC, one wallet.
 * Deterministic constants - no PRNG. Employee-visible amounts are fiat
 * only (never wallet-side USDC / tx detail - that lives in OPS_ORDERS).
 */

export const SPLIT_EMPLOYEE = {
  name: 'Amelia Clarke',
  email: 'amelia@nexus.co.uk',
  role: 'Product Designer',
  country: 'United Kingdom',
  address: '14 Redchurch Street, London E2 7DJ',
  dob: '1993-04-18',
  /** Last net pay - basis for the split live preview. */
  lastNetPay: 3240.5,
}

export interface BankAccount {
  id: string
  bank: string
  label: string
  last4: string
  primary: boolean
}

export const BANK_ACCOUNTS: Array<BankAccount> = [
  { id: 'bank-1', bank: 'Monzo', label: 'Personal current', last4: '4821', primary: true },
  { id: 'bank-2', bank: 'Barclays', label: 'Joint account', last4: '0193', primary: false },
]

export const WALLET = {
  id: 'wallet-1',
  label: 'MetaMask wallet',
  addressShort: '0x9fA3…C4e1',
  network: 'Ethereum mainnet',
  currency: 'USDC',
}

/** Active split used across config/receipt/emails. */
export const ACTIVE_SPLIT = {
  unit: 'percent' as 'percent' | 'amount',
  percent: 20,
  amount: 648.1,
  network: 'Ethereum mainnet',
  appliesFrom: 'Aug 31, 2026',
  cutoffDay: 10,
}

export const COOLING_OFF_ESTIMATE = '24 hours'

/** KYC dynamic steps (Transak Get Additional Requirements - count varies). */
export const KYC_DYNAMIC_STEPS = [
  { id: 'purpose', question: 'Purpose of usage', options: ['Receiving salary', 'Investments', 'Payments to others'], answer: 'Receiving salary' },
  { id: 'income', question: 'Source of income', options: ['Employment', 'Self-employment', 'Savings', 'Other'], answer: 'Employment' },
]

export const FCA_CATEGORIZATION_QUESTIONS = [
  {
    q: 'Which best describes you as an investor?',
    options: [
      'Restricted investor - I have not invested more than 10% of my net assets in high-risk investments',
      'High net worth investor',
      'Sophisticated investor',
    ],
  },
]

export const FCA_RISK_QUESTIONS = [
  {
    q: 'If the value of your cryptoassets falls, what protection covers your loss?',
    options: ['The FSCS compensates me', 'My employer covers it', 'None - I could lose the full amount'],
    correct: 2,
  },
  {
    q: 'Can the value of USDC change relative to pounds sterling?',
    options: ['No, it is fixed to GBP', 'Yes - it targets the US dollar, and rates move'],
    correct: 1,
  },
]

/** Ops rows - internal reconciliation view (Transak vocabulary allowed here). */
export interface OpsOrder {
  id: string
  employee: string
  cycle: string
  orderId: string
  walletShort: string
  network: string
  fiatWired: string
  usdcDelivered: string
  txHash: string
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED'
  fallbackReason?: string
  flag?: 'fallback-streak' | 'cooling-off-retry' | 'partial-delivery'
}

export const OPS_ORDERS: Array<OpsOrder> = [
  { id: 'ops-1', employee: 'Amelia Clarke', cycle: 'Jul 2026', orderId: 'TRK-88213', walletShort: '0x9fA3…C4e1', network: 'Ethereum', fiatWired: '£648.10', usdcDelivered: '812.44 USDC', txHash: '0x7d1c…9a02', status: 'COMPLETED' },
  { id: 'ops-2', employee: 'Rohan Mehta', cycle: 'Jul 2026', orderId: 'TRK-88214', walletShort: '0x22Bd…7F19', network: 'Ethereum', fiatWired: '£420.00', usdcDelivered: '—', txHash: '—', status: 'PROCESSING' },
  { id: 'ops-3', employee: 'Sofia Nilsen', cycle: 'Jul 2026', orderId: 'TRK-88215', walletShort: '0xA810…33aC', network: 'Ethereum', fiatWired: '£275.00', usdcDelivered: '—', txHash: '—', status: 'FAILED', fallbackReason: 'ORDER_FAILED_COMPLIANCE', flag: 'fallback-streak' },
  { id: 'ops-4', employee: 'Dan Okafor', cycle: 'Jun 2026', orderId: 'TRK-87730', walletShort: '0x51eE…B208', network: 'Ethereum', fiatWired: '£512.30', usdcDelivered: '641.02 USDC', txHash: '0x3b90…c711', status: 'COMPLETED', flag: 'partial-delivery' },
]
