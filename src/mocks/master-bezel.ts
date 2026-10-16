/**
 * One BezelScript per Master App section - what the single floating Emma
 * object says on that page. Every number is read from the section's own
 * mocks (Payments from the live invoice/wallet store the mock dock drives,
 * so claims move with the dataset and the time machine), never authored.
 */

import type { BezelScript } from './bezel'
import { EMPLOYEES_BEZEL } from './bezel'
import type { GrainFact } from '@/components/nds/grain/types'
import type { Invoice, WalletSeed } from './payment-flow'
import { USD_PER, fmt, fmtDate } from './payment-flow'
import { IDENTITY_PROVIDERS, ORG_USERS, STATE_TAX } from './org-settings'
import { REPORTS } from './insights-reports'

export interface PaymentsWorld {
  today: string
  invoices: Array<Invoice>
  wallets: Array<WalletSeed>
}

const usd = (n: number) => fmt(n, 'USD')
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000)
}

function invoiceTotal(i: Invoice): number {
  return i.lines.reduce((n, l) => n + l.amount, 0)
}

function invoiceUsd(i: Invoice): number {
  return invoiceTotal(i) * USD_PER[i.ccy]
}

/* ---------------- Payments ---------------- */

export function paymentsBezel(world: PaymentsWorld): BezelScript {
  const payable = world.invoices.filter((i) => i.status === 'pending')
  const overdue = payable
    .filter((i) => i.dueDate < world.today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const dueUsd = payable.reduce((n, i) => n + invoiceUsd(i), 0)
  const overdueUsd = overdue.reduce((n, i) => n + invoiceUsd(i), 0)
  const usdWallet = world.wallets.find((w) => w.ccy === 'USD')
  const available = usdWallet?.available ?? 0
  const shortfall = Math.max(0, dueUsd - available)
  const ccys = new Set(payable.map((i) => i.ccy))
  const oldest = overdue[0]

  const facts: Array<GrainFact> = (overdue.length ? overdue : payable).slice(0, 4).map((i) => ({
    label: `${i.person ?? i.name} · due ${fmtDate(i.dueDate)}`,
    value: fmt(invoiceTotal(i), i.ccy),
  }))

  return {
    attention: overdue.length > 0,
    askAbout: 'payments',
    quiet: {
      // Quiet is calm, never false: overdue is stated, just not pushed.
      claim: overdue.length
        ? `${plural(overdue.length, 'invoice')} past due · oldest ${plural(daysBetween(overdue[0].dueDate, world.today), 'day')}`
        : payable.length
          ? 'Nothing is late on this page'
          : 'Nothing to pay right now',
      sub: `${plural(payable.length, 'payable invoice')} · ${usd(dueUsd)} across ${plural(ccys.size, 'currency', 'currencies')} · click to ask Emma`,
    },
    scanLabel: `Reading ${plural(world.invoices.length, 'invoice')} and ${plural(world.wallets.length, 'wallet')}`,
    found: overdue.length
      ? {
          claim: `${plural(overdue.length, 'invoice is', 'invoices are')} overdue - ${usd(overdueUsd)} in total`,
          confidence: 0.93,
          facts,
          provenance: `${plural(payable.length, 'payable invoice')} · today is ${fmtDate(world.today)}`,
          nextLabel: shortfall > 0 ? 'See the funding gap' : 'See the oldest one',
          rowIds: overdue.map((i) => i.id),
        }
      : {
          claim: payable.length ? `${plural(payable.length, 'invoice')} due, none late yet` : 'Every invoice is paid',
          confidence: 0.9,
          facts,
          provenance: `today is ${fmtDate(world.today)}`,
          nextLabel: 'See what funds them',
        },
    tension:
      shortfall > 0
        ? {
            claim: `Paying everything due needs ${usd(dueUsd)} - the USD wallet holds ${usd(available)}`,
            confidence: 0.86,
            facts: [
              { label: 'Due, converted to USD', value: usd(dueUsd) },
              { label: 'USD wallet available', value: usd(available) },
              { label: 'Short by', value: usd(shortfall) },
              { label: 'Overdue share of that', value: usd(overdueUsd), tone: 'muted' },
            ],
            provenance: 'FX at today\'s mock rates · pending wallet funds excluded',
            exits: (resolve) => [
              { label: `Fund ${usd(shortfall)}`, variant: 'primary', onSelect: () => resolve(`Requested ${usd(shortfall)} wallet funding`) },
              { label: 'Pay only what\'s overdue', onSelect: () => resolve(`Queued ${plural(overdue.length, 'overdue payment')}`) },
              { label: 'Hold until Friday', variant: 'quiet', onSelect: () => resolve('Held - Emma will check again Friday') },
            ],
            continueLabel: 'Review the payment run',
          }
        : {
            claim: oldest
              ? `${oldest.person ?? oldest.name} has waited ${plural(daysBetween(oldest.dueDate, world.today), 'day')} past due`
              : 'Nothing is waiting on you',
            confidence: 0.58,
            facts: oldest
              ? [
                  { label: oldest.description, value: fmt(invoiceTotal(oldest), oldest.ccy) },
                  { label: 'Due', value: fmtDate(oldest.dueDate) },
                  { label: 'USD wallet covers it', value: available >= invoiceUsd(oldest) ? 'Yes' : 'No', tone: 'muted' },
                ]
              : [],
            provenance: 'oldest pending invoice',
            exits: (resolve) => [
              { label: 'Pay it now', variant: 'primary', onSelect: () => resolve(`Paid ${oldest?.person ?? 'the oldest invoice'}`) },
              { label: 'Mark as disputed', onSelect: () => resolve('Marked disputed - reminders paused') },
            ],
            continueLabel: 'Review the payment run',
          },
    run: {
      claim: `Pay ${plural(payable.length, 'invoice')} · ${usd(dueUsd)}`,
      sub: 'review step · nothing sent · follows you across pages',
    },
    voice: {
      command: 'pay everything overdue from the USD wallet',
      scope: `heard · affects ${plural(overdue.length, 'invoice')} · ${usd(overdueUsd)} · nothing paid yet`,
      result: `Queued ${plural(overdue.length, 'overdue payment')} for approval`,
    },
    thread: {
      title: 'What do I owe this week?',
      question: 'what do I owe this week, and can I cover it?',
      followUp: shortfall > 0
        ? `You're ${usd(shortfall)} short in USD. Converting local-currency balances first would close part of that without a new transfer.`
        : `The USD wallet covers everything due with ${usd(available - dueUsd)} to spare.`,
    },
  }
}

/* ---------------- Settings ---------------- */

const blockedStates = STATE_TAX.filter((s) => s.fields.some((f) => !f.value))
const missingFields = blockedStates.reduce((n, s) => n + s.fields.filter((f) => !f.value).length, 0)
const activeUsers = ORG_USERS.filter((u) => u.status === 'active')
const admins = activeUsers.filter((u) => u.roles.some((r) => r === 'Org owner' || r === 'Entity admin' || r === 'Payroll admin'))
const pendingInvite = ORG_USERS.find((u) => u.status === 'pending')
const ssoOn = IDENTITY_PROVIDERS.some((p) => p.configured)

export const SETTINGS_BEZEL: BezelScript = {
  attention: blockedStates.length > 0,
  askAbout: 'your organization',
  quiet: {
    claim: 'Your organization is verified',
    sub: `${plural(activeUsers.length, 'active user')} · ${plural(STATE_TAX.length, 'state')} on file · click to ask Emma`,
  },
  scanLabel: `Reading ${plural(STATE_TAX.length, 'state tax setup')} and ${plural(ORG_USERS.length, 'user')}`,
  found: {
    claim: ssoOn ? 'Single sign-on is on' : `${plural(admins.length, 'admin signs', 'admins sign')} in with a password - no SSO`,
    confidence: 0.84,
    facts: admins.map((u) => ({ label: u.name, value: u.roles.join(', ') })),
    provenance: `${plural(IDENTITY_PROVIDERS.length, 'identity provider')} available · none configured`,
    nextLabel: 'See what blocks payroll',
  },
  tension: {
    claim: `Payroll in ${blockedStates.map((s) => s.state).join(' and ')} is blocked - ${plural(missingFields, 'agency number')} missing`,
    confidence: 0.92,
    facts: blockedStates.map((s) => ({
      label: `${s.state} State tax setup`,
      value: `${s.fields.filter((f) => !f.value).length} missing`,
    })),
    provenance: 'Settings › Tax Setup',
    exits: (resolve) => [
      { label: 'Let Niural register', variant: 'primary', onSelect: () => resolve(`Started registration for ${blockedStates.map((s) => s.state).join(' + ')}`) },
      { label: "I'll add them myself", onSelect: () => resolve('Opened Tax Setup - Emma will check back tomorrow') },
      { label: 'No one works there yet', variant: 'quiet', onSelect: () => resolve('Marked as not hiring there yet') },
    ],
    continueLabel: 'Track the registration',
  },
  run: {
    claim: `Registering ${blockedStates.map((s) => s.state).join(' + ')} with state agencies`,
    sub: 'step 1 of 3 · nothing filed yet · follows you across pages',
  },
  voice: pendingInvite
    ? {
        command: `resend ${pendingInvite.name.split(' ')[0]}'s invite`,
        scope: `heard · 1 pending invite since ${pendingInvite.since} · nothing sent yet`,
        result: `Resent invite to ${pendingInvite.name}`,
      }
    : { command: 'who has admin access?', scope: `heard · ${admins.length} admins`, result: 'Listed admins' },
  thread: {
    title: 'Is anything blocking payroll?',
    question: 'is anything in settings blocking payroll?',
    followUp: `Only state registrations. Federal setup, users and documents are complete - ${blockedStates.map((s) => s.state).join(' and ')} are the gap.`,
  },
}

/* ---------------- Niural Insights ---------------- */

const schedulable = REPORTS.filter((r) => r.schedulable)
const byCategory = [...new Set(REPORTS.map((r) => r.category))].map((c) => ({ c, n: REPORTS.filter((r) => r.category === c).length }))

export const INSIGHTS_BEZEL: BezelScript = {
  askAbout: 'reports',
  quiet: { claim: 'Reports are up to date', sub: `${plural(REPORTS.length, 'report')} · ${schedulable.length} can run on a schedule · click to ask Emma` },
  scanLabel: `Reading ${plural(REPORTS.length, 'report')}`,
  found: {
    claim: `Payments has the most reports - ${byCategory.find((x) => x.c === 'Payments')?.n ?? 0} of ${REPORTS.length}`,
    confidence: 0.79,
    facts: byCategory.map((x) => ({ label: x.c, value: String(x.n) })),
    provenance: 'Niural Insights catalog',
    nextLabel: 'See what isn\'t scheduled',
  },
  tension: {
    claim: 'Cash requirement isn\'t scheduled, but payroll runs twice a month',
    confidence: 0.55,
    facts: [
      { label: 'Cash requirement', value: 'On demand only' },
      { label: 'Payroll cadence', value: 'Semi-monthly', tone: 'muted' },
    ],
    provenance: 'report settings · payroll schedule',
    exits: (resolve) => [
      { label: 'Run it before each payroll', variant: 'primary', onSelect: () => resolve('Scheduled Cash requirement before each run') },
      { label: 'Leave it on demand', variant: 'quiet', onSelect: () => resolve('Left on demand') },
    ],
  },
  run: { claim: 'Generating Payroll journal detail · Q3', sub: 'step 2 of 2 · nothing sent · follows you across pages' },
  voice: { command: 'email the bills aging report to finance every monday', scope: 'heard · 1 report · 1 recipient group · nothing scheduled yet', result: 'Scheduled Bills aging every Monday' },
  thread: {
    title: 'Which reports matter for close?',
    question: 'which reports do I need for month-end close?',
    followUp: 'Payroll journal summary, Bills aging and Invoice aging cover most closes. All three can run on a schedule.',
  },
}

/* ---------------- Fallback (sections without mocks yet) ---------------- */

function quietOnly(label: string): BezelScript {
  return {
    ...EMPLOYEES_BEZEL,
    quiet: { claim: 'Nothing needs you on this page', sub: `${label} · click to ask Emma` },
    scanLabel: `Reading ${label}`,
  }
}

export function bezelScriptFor(section: string, payments: PaymentsWorld): BezelScript {
  switch (section) {
    case 'people':
      return EMPLOYEES_BEZEL
    case 'payments':
    case 'wallet':
      return paymentsBezel(payments)
    case 'settings':
      return SETTINGS_BEZEL
    case 'niural-insights':
      return INSIGHTS_BEZEL
    default:
      return quietOnly(section === 'niural-pay' ? 'Niural Pay' : section === 'integrations' ? 'Integrations' : 'this page')
  }
}
