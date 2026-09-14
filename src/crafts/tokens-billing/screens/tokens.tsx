import {
  Bell,
  Clock,
  Flame,
  Gift,
  Lock,
  PlayPause,
  ShieldCheck,
  ShieldSlash,
  ShieldWarning,
  Wallet,
} from '@phosphor-icons/react'
import type { AutoReloadFieldError, TokensView } from '../types'
import {
  LEDGERS,
  RUN_COST,
  autoReloadState,
  isBlocked,
  num,
  priceFor,
  runsLeft,
  usd,
} from '../engine'
import { Banner, Chip, EmptyRow, ModalShell, SettingsShell, StatCard, TableCard, Td, Th, settingsNavTarget } from '../ui'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useExplorer } from '@/components/playground/explorer'

/**
 * Settings > AI > Tokens - the one page most of the PRD's token behaviour
 * lives on (overview card, auto-reload status, the blocked-at-zero card,
 * purchases ledger, notification prefs). Every visual state comes from a
 * single `balances` object, same "one state drives everything" shape as
 * the source workbench's `S`.
 */

function TokenOverviewCard({ view }: { view: TokensView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  const loading = b.load === 'loading'
  const error = b.load === 'error'

  if (loading) {
    return (
      <div className="rounded-2xl bg-background-base p-4.5 shadow-card">
        <div className="h-3 w-24 animate-pulse rounded bg-background-highlight" />
        <div className="mt-3 h-7 w-32 animate-pulse rounded bg-background-highlight" />
        <div className="mt-3 h-3 w-40 animate-pulse rounded bg-background-highlight" />
      </div>
    )
  }

  if (error) {
    return (
      <Banner tone="error" title="Couldn't load your balance">
        Your tokens are safe - we just couldn't reach the ledger. Nothing here is stale because nothing loaded.
        <div className="mt-2">
          <Button size="sm" variant="outline">
            <span className="px-1">Try again</span>
          </Button>
        </div>
      </Banner>
    )
  }

  const runs = runsLeft(b.tokens)
  const sub =
    b.tokens === 0
      ? 'Emma is paused until you top up'
      : `≈ ${usd(b.tokens / 10)} · about ${runs} payroll run${runs === 1 ? '' : 's'} left`

  return (
    <StatCard
      icon={Flame}
      label="Emma tokens"
      value={num(b.tokens)}
      sub={sub}
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => show('A3')}>
            <span className="px-1">See what used them</span>
          </Button>
          <Button size="sm" onClick={() => show('D1')}>
            <span className="px-1">Buy tokens</span>
          </Button>
        </>
      }
    />
  )
}

function CreditCrossLink({ view }: { view: TokensView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  if (b.load !== 'ok') return null
  const line =
    b.credit > 0
      ? `You have ${usd(b.credit)} of credit, enough for ${num(Math.floor(b.credit * 10))} tokens.`
      : b.creditEver === 0
        ? 'You have no credit, so purchases come from your wallet.'
        : 'Your credit is spent, so purchases come from your wallet.'
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-background-highlight p-3">
      <Gift weight="fill" className="mt-px size-4 shrink-0 text-text-success-base" />
      <p className="min-w-0 flex-1 text-paragraph-xs text-text-muted">
        Buying tokens spends your credit first when you have any. {line}{' '}
        <button type="button" onClick={() => show('B1')} className="text-brand-text">
          Credit balance
        </button>
      </p>
    </div>
  )
}

const AR_CONFIG: Record<
  'ok' | 'off' | 'risk',
  { icon: React.ElementType; tone: 'success' | 'warning' | 'error'; head: string; wrap: string }
> = {
  ok: { icon: ShieldCheck, tone: 'success', head: "You won't run out", wrap: 'bg-background-base' },
  off: { icon: ShieldWarning, tone: 'warning', head: 'Emma will stop when you hit zero', wrap: 'bg-background-warning-highlight' },
  risk: { icon: ShieldSlash, tone: 'error', head: 'Auto-reload will fail next time', wrap: 'bg-background-error-highlight' },
}

const AR_ICON_CLS: Record<'success' | 'warning' | 'error', string> = {
  success: 'text-text-success-base',
  warning: 'text-text-warning-base',
  error: 'text-text-error-base',
}

function AutoReloadRow({ view }: { view: TokensView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  const state = autoReloadState(b)
  const cfg = AR_CONFIG[state]
  const topup = priceFor(b.arAmt).total
  const held = b.credit + b.wallet
  const summary =
    state === 'ok'
      ? 'We top up before your balance hits zero.'
      : state === 'off'
        ? "Auto-reload is off, so nothing tops you up. Emma blocks rather than running up a bill."
        : `Topping up ${num(b.arAmt)} tokens costs ${usd(topup)}. Credit and wallet hold ${usd(held)} between them.`
  const RowIcon = cfg.icon
  return (
    <div className={`mt-3 flex items-center gap-3 rounded-2xl p-3.5 shadow-card ${cfg.wrap}`}>
      <RowIcon weight="fill" className={`size-5 shrink-0 ${AR_ICON_CLS[cfg.tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-label-sm text-text-primary">{cfg.head}</p>
        <p className="mt-0.5 text-paragraph-xs text-text-muted">{summary}</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => show('A2', 'ok')}>
        <span className="px-1">Auto-reload settings</span>
      </Button>
    </div>
  )
}

function BlockedCard({ view }: { view: TokensView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  if (!isBlocked(b)) return null
  const why = b.autoOn
    ? `This payroll run needs about ${RUN_COST} tokens. Auto-reload tried your sources and came up short.`
    : `This payroll run needs about ${RUN_COST} tokens and auto-reload is off.`
  return (
    <div className="mt-4">
      <p className="mb-2 text-paragraph-xs text-text-muted">What Emma shows right now</p>
      <div className="rounded-2xl bg-background-base p-4 shadow-card">
        <div className="mb-2.5 flex items-start gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background-highlight">
            <Bell className="size-3.5 text-text-muted" />
          </span>
          <p className="text-paragraph-xs text-text-primary">Run July payroll for the US team</p>
        </div>
        {b.mid && (
          <div className="mb-2.5 flex items-start gap-2.5 rounded-lg bg-background-warning-highlight p-3">
            <PlayPause weight="fill" className="mt-px size-4 shrink-0 text-text-warning-base" />
            <p className="text-paragraph-xs text-text-warning-base">
              <b className="font-medium">Paused part-way through.</b> Emma finished 2 of 5 steps and stopped before
              spending tokens it didn't have. The completed steps are saved - topping up resumes from step 3.
            </p>
          </div>
        )}
        <div className="rounded-lg bg-background-error-highlight p-3.5">
          <p className="flex items-center gap-1.5 text-label-sm text-text-error-base">
            <Flame weight="fill" className="size-4" /> You're out of tokens
          </p>
          <p className="mt-1.5 text-paragraph-xs text-text-error-base">{why}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <Button size="sm" onClick={() => show('D1')}>
              <span className="px-1">Buy tokens</span>
            </Button>
            <Button size="sm" variant="outline">
              <span className="px-1">Fund wallet</span>
            </Button>
          </div>
          <p className="mt-2.5 text-paragraph-xs text-text-error-base">
            Nothing was charged and your payroll wasn't started.
          </p>
        </div>
      </div>
    </div>
  )
}

function PurchasesLedger({ view }: { view: TokensView }) {
  const rows = LEDGERS[view.balances.ledger].filter((r) => r.unit === 'tok' && r.amount > 0)
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-label-md text-text-primary">Purchases and top-ups</h3>
        <Button size="sm" variant="ghost">
          <span className="px-1">Export</span>
        </Button>
      </div>
      <TableCard>
        <thead>
          <tr>
            <Th width="84px">Date</Th>
            <Th>Source</Th>
            <Th align="right" width="110px">
              Tokens
            </Th>
            <Th align="right" width="96px">
              Balance
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <Td muted>{r.date}</Td>
              <Td>
                {r.title}
                {r.flag && (
                  <Chip tone={r.flag === 'adjustment' ? 'warning' : 'accent'} className="ml-2">
                    {r.flag}
                  </Chip>
                )}
                <p className="mt-0.5 text-caption-md text-text-muted">{r.sub}</p>
              </Td>
              <Td align="right">
                <span className="text-text-success-base">+{num(r.amount)}</span>
              </Td>
              <Td align="right" muted>
                {num(r.balance)}
              </Td>
            </tr>
          ))}
        </tbody>
        {rows.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={4}>
                <EmptyRow title="No purchases yet" description="Every purchase and auto-reload top-up appears here with the source it was paid from." />
              </td>
            </tr>
          </tbody>
        )}
      </TableCard>
    </div>
  )
}

function NotificationPrefs() {
  return (
    <div className="mt-8 border-t border-border-highlight pt-6">
      <h3 className="text-label-md text-text-primary">Settings</h3>
      <p className="mt-1.5 mb-4 text-paragraph-xs text-text-muted">
        Auto-reload keeps Emma running. Notifications tell you when something needs you.
      </p>
      <div className="rounded-2xl bg-background-base p-4.5 shadow-card">
        <div className="mb-3.5 flex items-baseline justify-between">
          <div>
            <p className="text-label-sm text-text-primary">Notifications</p>
            <p className="mt-0.5 text-paragraph-xs text-text-muted">
              Token and credit events. Emma's task updates are in Emma settings.
            </p>
          </div>
          <Chip>P1-3</Chip>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-paragraph-xs text-text-primary">Emma stopped - you're out of tokens</p>
              <p className="text-caption-md text-text-muted">Always on. Work is blocked until you top up.</p>
            </div>
            <Lock className="size-3.5 shrink-0 text-text-muted" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-paragraph-xs text-text-primary">Auto-reload failed</p>
              <p className="text-caption-md text-text-muted">Always on. Nothing was charged.</p>
            </div>
            <Lock className="size-3.5 shrink-0 text-text-muted" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-paragraph-xs text-text-primary">Token balance running low</p>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-paragraph-xs text-text-primary">Niural added credit to your account</p>
            <Switch defaultChecked />
          </div>
        </div>
        <div className="mt-3.5 rounded-lg bg-background-highlight p-3">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-label-xs text-text-primary">"Running low" means</p>
              <p className="mt-0.5 text-paragraph-xs text-text-muted">
                Separate from the auto-reload trigger, so you hear about it before the top-up fires.
              </p>
            </div>
            <span className="shrink-0 text-label-sm text-text-primary">200 tokens</span>
          </div>
        </div>
        <div className="mt-3.5">
          <p className="mb-1.5 text-label-xs text-text-primary">Sent to</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone="accent">anjil@niural.com · owner</Chip>
            <Chip>priya@acme.com · billing admin</Chip>
          </div>
          <p className="mt-2 text-paragraph-xs text-text-muted">
            The PRD says "the employer is notified" without saying who that is.
          </p>
        </div>
      </div>
    </div>
  )
}

const AR_FIELD_ERROR_COPY: Record<AutoReloadFieldError, string> = {
  'below-min': 'Minimum purchase is 250 tokens',
  'threshold-zero': 'May not prevent blocking',
  'threshold-negative': 'Enter 0 or higher',
  'no-source': 'Turn on at least one funding source',
}

function AutoReloadModal({ view }: { view: TokensView }) {
  const { show } = useExplorer()
  if (!view.autoReload?.open) return null
  const { balances: b } = view
  const fieldError = view.autoReload.fieldError
  const sources = view.autoReload.sources
  return (
    <ModalShell
      title="Auto-reload"
      subtitle="Top up automatically so Emma never stops mid-task"
      onClose={() => show('A2', 'close')}
      footer={
        <Button disabled={!!fieldError} onClick={() => show('A2', 'close')}>
          <span className="px-1">Save changes</span>
        </Button>
      }
    >
      <label className="mb-4 flex items-center gap-2">
        <Switch defaultChecked={b.autoOn} />
        <span className="text-paragraph-sm text-text-primary">Auto-reload is {b.autoOn ? 'on' : 'off'}</span>
      </label>
      <p className="mb-1.5 text-label-xs text-text-primary">Funding sources, in order</p>
      <div className="mb-3.5 flex flex-col gap-1.5">
        {(['credit', 'wallet'] as const).map((s) => {
          const on = sources.includes(s)
          const order = sources.indexOf(s)
          return (
            <div key={s} className="flex items-center gap-2 rounded-lg border border-border-highlight px-2.5 py-2">
              {on && <Chip tone="accent">{order === 0 ? '1st' : '2nd'}</Chip>}
              <span className="flex-1 text-paragraph-xs text-text-primary capitalize">{s} balance</span>
              <span className="text-caption-md text-text-muted">{s === 'credit' ? usd(b.credit) : usd(b.wallet)}</span>
              <Switch defaultChecked={on} />
            </div>
          )
        })}
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-2.5">
        <div>
          <p className="mb-1 text-label-xs text-text-primary">When balance drops to</p>
          <input
            type="number"
            defaultValue={b.arTh}
            className="h-9 w-full rounded-lg bg-background-highlight px-2.5 text-paragraph-sm text-text-primary outline-none"
          />
          <p className={`mt-1 text-caption-md ${fieldError?.startsWith('threshold') ? 'text-text-error-base' : 'text-text-muted'}`}>
            {fieldError === 'threshold-zero'
              ? AR_FIELD_ERROR_COPY['threshold-zero']
              : fieldError === 'threshold-negative'
                ? AR_FIELD_ERROR_COPY['threshold-negative']
                : 'tokens'}
          </p>
        </div>
        <div>
          <p className="mb-1 text-label-xs text-text-primary">Buy this many</p>
          <input
            type="number"
            defaultValue={b.arAmt}
            className="h-9 w-full rounded-lg bg-background-highlight px-2.5 text-paragraph-sm text-text-primary outline-none"
          />
          <p className={`mt-1 text-caption-md ${fieldError === 'below-min' ? 'text-text-error-base' : 'text-text-muted'}`}>
            {fieldError === 'below-min' ? AR_FIELD_ERROR_COPY['below-min'] : 'tokens · minimum 250'}
          </p>
        </div>
      </div>
      {fieldError === 'no-source' && (
        <Banner tone="error" title="Turn on at least one source" className="mb-3.5">
          Auto-reload can't save with everything off - Emma would just block instead.
        </Banner>
      )}
      <div className="mb-3.5 flex items-start gap-2.5 rounded-lg bg-brand-muted p-3">
        <Wallet weight="fill" className="mt-px size-4 shrink-0 text-brand-text" />
        <p className="text-paragraph-xs text-brand-text">
          Auto-reload only uses the sources you tick. It won't fall back to an unticked source, even if it has funds.
        </p>
      </div>
      <div className="rounded-2xl bg-background-highlight p-3">
        <p className="flex items-center gap-1.5 text-label-xs text-text-primary">
          <Clock className="size-4" /> Top-ups wait 60 seconds between fires
        </p>
        <p className="mt-1 text-paragraph-xs text-text-muted">
          A burst of Emma tasks can cross the threshold several times in a few seconds. We top up once, then pause.
        </p>
      </div>
    </ModalShell>
  )
}

export function TokensScreen({ view }: { view: TokensView }) {
  const { show } = useExplorer()
  const { balances: b } = view
  return (
    <SettingsShell
      active="tokens"
      title="Tokens"
      subtitle="Settings · AI"
      balances={{ tokens: b.tokens, credit: b.credit, wallet: b.wallet }}
      onNavigate={(key) => show(settingsNavTarget(key) ?? 'A1')}
    >
      {b.preset === 'freetier' && (
        <Banner tone="pending" title="Your 100 free tokens are ready" className="mb-4">
          A token is what Emma spends to do a job. A payroll run costs about 100. An offer letter costs about 3.
          You'll never be charged without seeing it here first.
        </Banner>
      )}
      {b.preset === 'freeExhausted' && (
        <Banner tone="info" title="You've used your free tokens" className="mb-4">
          Emma drafted 12 offer letters and reviewed 40 receipts on the house. Buy 250 tokens for $25.00 to keep going.
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => show('D1')}>
              <span className="px-1">Buy tokens</span>
            </Button>
          </div>
        </Banner>
      )}
      <TokenOverviewCard view={view} />
      <CreditCrossLink view={view} />
      <AutoReloadRow view={view} />
      <BlockedCard view={view} />
      <PurchasesLedger view={view} />
      <NotificationPrefs />
      <AutoReloadModal view={view} />
    </SettingsShell>
  )
}
