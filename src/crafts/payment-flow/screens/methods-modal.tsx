import { useState } from 'react'
import { ArrowSquareOut, Plus } from '@phosphor-icons/react'
import { usePayment } from '../app'
import { GROUP_LABEL, isLocalMode, quote } from '../engine'
import type { MethodOption } from '../engine'
import { CheckBadge, CurrencyMark, ModalShell, PrimaryTag, Tag } from '../ui'
import { AddMethodRow, GROUP_META, OptionIcon, OptionSubline } from './payment'
import { Button } from '@niural/components'
import { CCY_NAME, fmt } from '@/mocks/payment-flow'
import { cn } from '@/lib/utils'

/**
 * Choose payment method - the big modal behind the method switcher.
 * Local invoices (P2): Niural wallets only, matching wallet first and
 * tagged "No FX", every other wallet captioned "FX applies", Available
 * balance only. Everything else: Niural wallet, connected bank accounts,
 * other payment options (wire, crypto), add method. Credit never shows
 * here - it's a reduction in Payment summary (principle 2).
 */

export function MethodsModal() {
  const { option, groups, payInvoices, data, set } = usePayment()
  const [picked, setPicked] = useState<string | null>(option?.id ?? null)
  const localMode = isLocalMode(payInvoices, data.local)
  const close = () => set({ modal: null })
  const all = Object.values(groups).flat()
  const choice = all.find((o) => o.id === picked) ?? null

  const sections: Array<{ title: string; options: Array<MethodOption>; footer?: React.ReactNode }> = localMode
    ? [
        { title: GROUP_LABEL.wallet, options: groups.wallet },
        ...(groups['local-transfer'].length ? [{ title: 'Other payment options', options: groups['local-transfer'] }] : []),
      ]
    : [
        { title: GROUP_LABEL.wallet, options: groups.wallet, footer: <LinkRow label="Enable currencies" /> },
        { title: 'Your connected bank accounts', options: groups.bank, footer: <AddMethodRow /> },
        { title: 'Other payment options', options: [...groups.wire, ...groups.crypto] },
      ]

  return (
    <ModalShell
      title="Choose payment method"
      onClose={close}
      width="w-[640px]"
      footer={
        <>
          <span className="text-paragraph-xsmall text-muted">
            {payInvoices.length} {payInvoices.length === 1 ? 'invoice' : 'invoices'}
            {localMode && data.local && ` · billed in ${data.local}`}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="solid" shade="neutral" onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!choice}
              onClick={() => set({ methodId: choice?.id ?? null, modal: null, openGroup: null, wireVerify: 'idle', payFailed: false })}
            >
              {choice ? `Use ${choice.group === 'wallet' && !choice.sub ? `${choice.ccy} wallet` : choice.label}` : 'Choose a method'}
            </Button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {sections
          .filter((sec) => sec.options.length > 0 || sec.footer)
          .map((sec) => (
            <section key={sec.title} className="flex flex-col gap-2.5">
              <p className="text-label-medium text-primary">{sec.title}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {sec.options.map((o) => (
                  <ModalOption key={o.id} o={o} localMode={localMode} selected={picked === o.id} onPick={() => setPicked(o.id)} />
                ))}
              </div>
              {sec.footer}
            </section>
          ))}
      </div>
    </ModalShell>
  )
}

function ModalOption({
  o,
  localMode,
  selected,
  onPick,
}: {
  o: MethodOption
  localMode: boolean
  selected: boolean
  onPick: () => void
}) {
  const { payInvoices, q } = usePayment()
  // Balance check uses Amount due AFTER credit (P3).
  const oq = quote(payInvoices, o, q?.plan ?? null)
  const wallet = o.group === 'wallet'
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'flex min-h-[76px] items-start gap-3 rounded-xl bg-base p-3.5 text-left transition-shadow',
        selected ? 'borders-shadow' : 'card hover:card-hover',
      )}
    >
      {wallet ? (
        <CurrencyMark ccy={o.ccy} size="md" />
      ) : (
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', GROUP_META[o.group].tint)}>
          <OptionIcon option={o} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-label-small text-primary">{wallet && !o.sub ? CCY_NAME[o.ccy] : o.label}</span>
          {o.sub && wallet && <span className="text-label-small text-muted">({o.sub})</span>}
          {o.primary && <PrimaryTag />}
          {wallet && oq.fxCount === 0 && oq.amountDue > 0 && <Tag tone="green">No FX</Tag>}
        </span>
        <OptionSubline option={o} showPending={false} />
        {wallet && oq.fxCount > 0 && localMode && <span className="block text-caption-sm text-muted">FX applies</span>}
        {o.wallet && !oq.sufficient && (
          <span className="block text-caption-sm text-error">Not enough to cover {fmt(oq.total, o.ccy)}</span>
        )}
      </span>
      {selected && <CheckBadge />}
    </button>
  )
}

function LinkRow({ label }: { label: string }) {
  return (
    <div className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-base text-label-small text-info">
      <Plus className="size-4" /> {label} <ArrowSquareOut className="size-4" />
    </div>
  )
}
