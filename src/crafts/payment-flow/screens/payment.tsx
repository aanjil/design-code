import { useState } from "react";
import {
  ArrowRight,
  ArrowsLeftRight,
  ArrowsInLineVertical,
  ArrowsOutLineVertical,
  Bank,
  CaretDown,
  CaretRight,
  CaretUpDown,
  CheckCircle,
  CurrencyEth,
  DownloadSimple,
  Info,
  Lightning,
  ArrowSquareOut,
  ArrowsClockwise,
  Plus,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { usePayment } from "../app";
import {
  GROUP_LABEL,
  convert,
  currencyShares,
  fmtRate,
  invoiceTotal,
  isLocalMode,
  quote,
  railInSentence,
  fmtLegs,
  round2,
} from "../engine";
import {
  CreditCard,
  CreditCoversNote,
  CreditLeft,
  SummaryPanel,
} from "./credit";
import type { MethodGroup, MethodOption } from "../engine";
import {
  Banner,
  CheckBadge,
  CopyButton,
  CurrencyMark,
  LeaderRow,
  Money,
  PrimaryTag,
  RadioDot,
  RecipientDetails,
  Tag,
} from "../ui";
import { PageHeader } from "@/components/nds/layouts";
import { Button, Text } from "@niural/components";
import {
  CCY_NAME,
  COLLECTION_ACCOUNT,
  LOCAL_RAIL,
  daysFromToday,
  fmt,
  fmtDate,
} from "@/mocks/payment-flow";
import type { Ccy, Invoice, LocalCcy } from "@/mocks/payment-flow";
import { cn } from "@/lib/utils";

/**
 * Payment screen - left: the selected invoices as billed (flat card for
 * one, accordion for many); right: payment method (one wallet row per
 * currency when the batch splits by currency), then Payment summary with
 * the credit line item (Apply → editable USD amount).
 * Nothing picked yet → accordion of method groups that expand to their
 * options; once picked → a switcher that opens the big Choose payment
 * method modal. Local invoices start on the matching wallet (PRD F4.1).
 * Experiment (dock): a Payment summary breakdown card under the method.
 * Footer: totals + Confirm payment / Pay with credit.
 */

export function PaymentScreen() {
  const { ui, set, payInvoices } = usePayment();
  const back = () => set({ screen: "invoices", modal: null });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Payments"
        onBack={back}
        actions={
          <button
            type="button"
            aria-label="Close"
            onClick={back}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-highlight hover:text-primary"
          >
            <X className="size-4" />
          </button>
        }
      />
      <div className="flex min-h-0 h-full  mx-auto px-6 gap-20 py-5 w-300 ">
        <div className="min-h-0 flex-1 overflow-y-auto p-px  justify-center ">
          <SummaryColumn />
        </div>
        <div className="min-h-0 w-[24.5rem] shrink-0 overflow-y-auto p-px pb-4">
          <MethodColumn />
        </div>
      </div>
      

      <TotalsFooter />
      
      {payInvoices.length === 0 && ui.screen === "payment" && (
        <div className="absolute inset-0 grid place-items-center text-paragraph-small text-muted">
          No invoices selected.
        </div>
      )}
    </div>
  );
}

/* ================= left: payment summary ================= */

function SummaryColumn() {
  const { ui, set, payInvoices, q } = usePayment();
  const multi = payInvoices.length > 1;
  const allCollapsed =
    multi && payInvoices.every((i) => ui.collapsed.includes(i.id));
  const shares = currencyShares(payInvoices);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Text type="label-large" className="text-primary"> Payment summary </Text>
          
          <p className="mt-1.5 text-paragraph-xsmall text-muted">
            {payInvoices.length}{" "}
            {payInvoices.length === 1 ? "invoice" : "invoices"}
            {shares.length > 1 && ` · ${shares.map((s) => s.ccy).join(", ")}`}
            {q &&
              q.fxCount > 0 &&
              ` · converted to ${q.ccy} for ${q.fxCount} of ${payInvoices.length}`}
          </p>
        </div>
        {multi && (
          <button
            type="button"
            onClick={() =>
              set({
                collapsed: allCollapsed ? [] : payInvoices.map((i) => i.id),
              })
            }
            className="flex items-center gap-1 text-label-xsmall text-primary hover:text-brand"
          >
            {allCollapsed ? "Expand all" : "Collapse all"}
            {allCollapsed ? (
              <ArrowsOutLineVertical className="size-3.5" />
            ) : (
              <ArrowsInLineVertical className="size-3.5" />
            )}
          </button>
        )}
      </div>
      {payInvoices.map((inv) => (
        <InvoiceCard key={inv.id} inv={inv} accordion={multi} />
      ))}
    </div>
  );
}

function InvoiceCard({ inv, accordion }: { inv: Invoice; accordion: boolean }) {
  const { ui, set, q, data } = usePayment();
  const collapsed = accordion && ui.collapsed.includes(inv.id);
  const line = q?.lines.find((l) => l.invoiceId === inv.id);
  // Split by currency: each invoice is paid in its own currency, no conversion.
  const payCcy = q && !q.split ? q.ccy : inv.ccy;
  const days = daysFromToday(inv.dueDate, data.today);
  const toggle = () =>
    set((p) => ({
      collapsed: collapsed
        ? p.collapsed.filter((x) => x !== inv.id)
        : [...p.collapsed, inv.id],
    }));
  // The credit amount resets to the new max - the batch it was typed for is gone.
  const remove = () =>
    set((p) => ({
      payIds: p.payIds.filter((x) => x !== inv.id),
      selected: p.selected.filter((x) => x !== inv.id),
      methodId: null,
      creditAmount: null,
    }));

  return (
    <div className="overflow-hidden rounded-2xl bg-base elevation-card">
      <div
        className={cn(
          "flex items-center gap-2 px-4",
          accordion ? "h-14" : "pt-4 pb-1",
        )}
      >
        {accordion ? (
          <button
            type="button"
            onClick={toggle}
            className="flex min-w-0 items-center gap-1.5 text-left"
          >
            <span className="truncate text-label-medium text-primary">
              {inv.name}
            </span>
            {collapsed ? (
              <CaretRight className="size-4 shrink-0" />
            ) : (
              <CaretDown className="size-4 shrink-0" />
            )}
          </button>
        ) : (
          <span className="truncate text-label-medium text-primary">
            {inv.name}
          </span>
        )}
        <span className="flex-1" />
        {inv.person && <Tag tone="blue">{inv.person}</Tag>}
        {!inv.person && <Tag tone="gray">{inv.description}</Tag>}
        {collapsed && line && (
          <>
            <span className="text-muted">·</span>
            <Money className="text-label-small text-primary">
              {fmt(line.converted, payCcy)}
            </Money>
          </>
        )}
        {accordion && (
          <button
            type="button"
            aria-label={`Remove ${inv.name}`}
            onClick={remove}
            className="ml-1 flex size-7 items-center justify-center rounded-lg text-muted hover:bg-highlight hover:text-primary"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {!collapsed && (
        <div
          className={cn(
            "flex flex-col gap-3 px-4 pb-4",
            accordion && "border-t border-base pt-3",
          )}
        >
          <p className="text-paragraph-xsmall text-primary">
            Due date: {fmtDate(inv.dueDate)}
            {days < 0 && (
              <span className="ml-2 text-error">Overdue by {-days} days</span>
            )}
            {days >= 0 && (
              <span className="ml-2 text-muted">Due in {days} days</span>
            )}
          </p>
          <div className="flex flex-col gap-2.5">
            {inv.lines.map((l) => (
              <LeaderRow
                key={l.label}
                label={l.label}
                muted={inv.lines.length > 1}
                value={<Conv amount={l.amount} from={inv.ccy} to={payCcy} />}
              />
            ))}
          </div>
          <div className="border-t border-base pt-3">
            <LeaderRow
              strong
              label="Subtotal"
              value={<Conv amount={invoiceTotal(inv)} from={inv.ccy} to={payCcy} strong />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** "CAD 200.00 → USD 143.64" when currencies differ; plain amount otherwise. */
function Conv({
  amount,
  from,
  to,
  strong,
}: {
  amount: number;
  from: Ccy;
  to: Ccy;
  strong?: boolean;
}) {
  if (from === to)
    return (
      <Money className={strong ? "text-label-small" : "text-paragraph-xsmall"}>
        {fmt(amount, from)}
      </Money>
    );
  return (
    <span className="inline-flex items-center gap-1.5">
      <Money className="text-paragraph-xsmall text-muted">
        {fmt(amount, from)}
      </Money>
      <ArrowRight className="size-3.5 text-muted" />
      <Money className={strong ? "text-label-small" : "text-paragraph-xsmall"}>
        {fmt(convert(amount, from, to), to)}
      </Money>
    </span>
  );
}

/* ================= right: payment method ================= */

export const GROUP_META: Record<
  MethodGroup,
  { icon: typeof Wallet; tint: string; desc: (local?: LocalCcy) => string }
> = {
  wallet: {
    icon: Wallet,
    tint: "bg-success-muted text-success",
    desc: () =>
      "Make fast, secure payments in multiple currencies using your Niural balance.",
  },
  bank: {
    icon: Bank,
    tint: "bg-info-muted text-info",
    desc: () => "Make payments directly from your connected bank account.",
  },
  crypto: {
    icon: CurrencyEth,
    tint: "bg-accent-pink-muted text-accent-pink-base",
    desc: () => "Easily pay with crypto: fast, secure, and hassle-free.",
  },
  wire: {
    icon: ArrowsLeftRight,
    tint: "bg-accent-teal-muted text-accent-teal-base",
    desc: () =>
      "Securely send payments via wire transfer from your bank account.",
  },
  "local-transfer": {
    icon: Bank,
    tint: "bg-accent-teal-muted text-accent-teal-base",
    desc: (l) =>
      l
        ? `Send ${l} by ${LOCAL_RAIL[l].method} from your own bank. Paid once we receive it.`
        : "",
  },
};

const GROUP_ORDER: Array<MethodGroup> = [
  "wallet",
  "local-transfer",
  "bank",
  "wire",
  "crypto",
];

function MethodColumn() {
  const { ui, option, q, data, payInvoices } = usePayment();
  const localMode = isLocalMode(payInvoices, data.local);
  // Method only appears when something is left to pay. (No legs alone isn't
  // enough - there are none before a method is picked either.)
  const covered = !!q && q.amountDue <= 0 && q.lines.some((l) => l.credit > 0);
  return (
    <div className="flex flex-col gap-4">
      {ui.payFailed && (
        <Banner tone="error" title={<>
          Payment didn't go through. No credit or wallet balance was used. Try
          again.
        </>} />
      )}
      {covered ? (
        <CreditCoversNote />
      ) : (
        <>
          <Text type="label-large" className="text-primary">
            Payment method
          </Text>
          {q?.split ? (
            <SplitWallets />
          ) : option ? (
            <>
              <SelectedMethod option={option} />
              {q && <MethodDetails option={option} />}
            </>
          ) : (
            <MethodGroups />
          )}
          {localMode &&
            option?.group === "wallet" &&
            option.ccy === "USD" &&
            data.local && <SwitchToLocalHint local={data.local} />}
        </>
      )}
      {data.flags.summaryPanel ? <SummaryPanel /> : <CreditCard />}
    </div>
  );
}

/**
 * Mixed currencies with a wallet for each: one wallet row per currency
 * still due ("Pays CAD 42,209.20"), each with its own balance check.
 */
function SplitWallets() {
  const { q, openFund, data } = usePayment();
  if (!q) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <p className="flex items-start gap-1.5 text-paragraph-xsmall text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Each currency is paid from its own wallet. No conversion.
      </p>
      {q.legs.map((leg) => {
        const ccy = leg.ccy as "USD" | LocalCcy;
        const fundable = ccy === "USD" || ccy === data.local;
        return (
          <div key={leg.ccy} className="flex flex-col gap-2">
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl bg-base p-4 card",
                !leg.sufficient && "borders-error",
              )}
            >
              <CurrencyMark ccy={leg.ccy} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-label-medium text-primary">
                    {CCY_NAME[leg.ccy]}
                  </span>
                  {leg.option.primary && <PrimaryTag />}
                  <Tag tone="green">No FX</Tag>
                </span>
                <OptionSubline option={leg.option} showPending={false} />
              </span>
              <span className="text-right">
                <span className="block text-caption-sm text-muted">Pays</span>
                <Money className="text-label-small text-primary">
                  {fmt(leg.amount, leg.ccy)}
                </Money>
              </span>
            </div>
            {!leg.sufficient &&
              (leg.coveredByPending ? (
                <Banner tone="warning" title={<>
                  <Money>{fmt(leg.pending ?? 0, leg.ccy)}</Money> is waiting
                  for approval and can be used once it clears.
                  {fundable && (
                    <FundLink onClick={() => openFund(ccy, leg.shortfall)} />
                  )}
                </>} />
              ) : (
                <Banner tone="error" title={<>
                  Not enough balance in your {leg.ccy} wallet. Fund your wallet
                  to pay these invoices.
                  {fundable && (
                    <FundLink onClick={() => openFund(ccy, leg.shortfall)} />
                  )}
                </>} />
              ))}
          </div>
        );
      })}
    </div>
  );
}

/** The picked method as a switcher - opens the Choose payment method modal. */
function SelectedMethod({ option }: { option: MethodOption }) {
  const { set, q } = usePayment();
  const insufficient = q && !q.sufficient;
  return (
    <button
      type="button"
      onClick={() => set({ modal: { kind: "methods" } })}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-base p-4 text-left card transition-shadow hover:card-hover",
        insufficient && "borders-error hover:borders-error",
      )}
    >
      <OptionIcon option={option} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-label-medium text-primary">{option.label}</span>
          {option.sub && option.group === "wallet" && (
            <span className="text-label-medium text-muted">({option.sub})</span>
          )}
          {option.primary && <PrimaryTag />}
          {q && q.fxCount === 0 && option.group === "wallet" && (
            <Tag tone="green">No FX</Tag>
          )}
        </span>
        <OptionSubline option={option} />
      </span>
      <span className="flex items-center gap-1 text-label-xsmall text-muted">
        Change
        <CaretUpDown className="size-4 shrink-0" />
      </span>
    </button>
  );
}

export function OptionIcon({ option }: { option: MethodOption }) {
  if (option.group === "wallet")
    return <CurrencyMark ccy={option.ccy} size="md" />;
  const I = GROUP_META[option.group].icon;
  return <I className="size-5 shrink-0 text-muted" />;
}

/** `showPending` false in the method modal - pending is never presented as usable (F4.2). */
export function OptionSubline({
  option,
  showPending = true,
}: {
  option: MethodOption;
  showPending?: boolean;
}) {
  if (option.wallet) {
    return (
      <span className="block text-paragraph-xsmall text-muted">
        Available balance:{" "}
        <Money className="text-primary">
          {fmt(option.wallet.available, option.ccy)}
        </Money>
        {showPending && option.wallet.pending > 0 && (
          <>
            {" · "}
            <Money>{fmt(option.wallet.pending, option.ccy)}</Money> pending
          </>
        )}
      </span>
    );
  }
  if (option.bankLast4)
    return (
      <span className="block text-paragraph-xsmall text-muted">
        Account ending in {option.bankLast4}
      </span>
    );
  if (option.fee > 0)
    return (
      <span className="block text-paragraph-xsmall text-muted">
        {option.feeLabel ?? "Fee"}:{" "}
        <Money className="text-primary">{fmt(option.fee, option.ccy)}</Money>
      </span>
    );
  return option.sub ? (
    <span className="block text-paragraph-xsmall text-muted">{option.sub}</span>
  ) : null;
}

/* ---------- accordion of method groups ---------- */

function MethodGroups() {
  const { ui, set, groups, data, payInvoices, option } = usePayment();
  const localMode = isLocalMode(payInvoices, data.local);
  const visible = GROUP_ORDER.filter((g) => groups[g].length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {localMode && data.local && (
        <p className="flex items-start gap-1.5 text-paragraph-xsmall text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {payInvoices.length === 1
            ? "This invoice is"
            : "These invoices are"}{" "}
          billed in {data.local}. Pay from a Niural wallet or by{" "}
          {railInSentence(LOCAL_RAIL[data.local].method)} from your bank.
        </p>
      )}
      {visible.map((g) => {
        const open = ui.openGroup === g;
        const meta = GROUP_META[g];
        const I = meta.icon;
        const single =
          groups[g].length === 1 && (g === "wire" || g === "local-transfer");
        const selectedHere = option?.group === g;
        const pick = (o: MethodOption) =>
          set({
            methodId: o.id,
            openGroup: null,
            wireVerify: "idle",
            payFailed: false,
          });
        return (
          <div
            key={g}
            className={cn(
              "overflow-hidden rounded-2xl transition-colors",
              open ? "bg-highlight p-1 pb-3" : "bg-base card",
            )}
          >
            <button
              type="button"
              onClick={() =>
                single
                  ? pick(groups[g][0])
                  : set({ openGroup: open ? null : g })
              }
              className={cn(
                "flex w-full items-center gap-3 p-3 text-left",
                !open && "hover:bg-highlight",
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  meta.tint,
                )}
              >
                <I className="size-5" weight="duotone" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-label-medium text-primary">
                    {g === "local-transfer"
                      ? groups[g][0].label
                      : GROUP_LABEL[g]}
                  </span>
                  {open && (g === "wallet" || g === "bank") && (
                    <span className="inline-flex items-center gap-1 text-label-xsmall text-info">
                      <ArrowsClockwise className="size-3.5" />
                      Refresh
                    </span>
                  )}
                  {single && groups[g][0].fee > 0 && (
                    <Tag tone="gray">
                      Fee {fmt(groups[g][0].fee, groups[g][0].ccy)}
                    </Tag>
                  )}
                  {selectedHere && !open && <Tag tone="brand">Selected</Tag>}
                </span>
                {!open && (
                  <span className="block text-paragraph-xsmall text-muted">
                    {meta.desc(data.local ?? undefined)}
                  </span>
                )}
              </span>
              {single ? (
                <CaretRight className="size-5 text-muted" />
              ) : (
                <CaretDown
                  className={cn(
                    "size-5 text-muted transition-transform",
                    open && "rotate-180",
                  )}
                />
              )}
            </button>
            {open && (
              <div className="flex flex-col gap-2.5 px-2">
                {groups[g].map((o) => (
                  <OptionCard
                    key={o.id}
                    o={o}
                    selected={option?.id === o.id}
                    onPick={() => pick(o)}
                  />
                ))}
                {g === "bank" && <AddMethodRow />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OptionCard({
  o,
  selected,
  onPick,
}: {
  o: MethodOption;
  selected: boolean;
  onPick: () => void;
}) {
  const { payInvoices, q } = usePayment();
  const oq = quote(payInvoices, o, q?.plan ?? null);
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl bg-base p-3.5 text-left transition-shadow",
        selected ? "borders-shadow" : "card hover:card-hover",
      )}
    >
      {o.group === "wallet" ? (
        <CurrencyMark ccy={o.ccy} />
      ) : (
        <OptionIcon option={o} />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-label-small text-primary">{o.label}</span>
          {o.sub && o.group === "wallet" && (
            <span className="text-label-small text-muted">({o.sub})</span>
          )}
          {o.primary && <PrimaryTag />}
          {o.group === "wallet" && oq.fxCount === 0 && (
            <Tag tone="green">No FX</Tag>
          )}
          {o.group === "wallet" &&
            oq.fxCount > 0 &&
            o.ccy !== "USD" &&
            !o.sub && <Tag tone="gray">FX on {oq.fxCount}</Tag>}
        </span>
        <OptionSubline option={o} />
        {o.wallet && !oq.sufficient && (
          <span className="block text-caption-sm text-error">
            Not enough to cover {fmt(oq.total, o.ccy)}
          </span>
        )}
      </span>
      {selected && <CheckBadge />}
    </button>
  );
}

export function AddMethodRow() {
  return (
    <div className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-dashed border-base text-label-small text-info">
      <Plus className="size-4" /> Add payment method{" "}
      <ArrowSquareOut className="size-4" />
    </div>
  );
}

/* ---------- per-method details under the selected card ---------- */

function MethodDetails({ option }: { option: MethodOption }) {
  const { q, openFund, data } = usePayment();
  if (!q) return null;

  if (option.group === "wallet") {
    const fiat =
      option.wallet &&
      !option.wallet.network &&
      (option.ccy === "USD" || option.ccy === data.local);
    if (!q.sufficient) {
      const fundCcy = fiat ? (option.ccy as "USD" | LocalCcy) : null;
      if (q.coveredByPending) {
        return (
          <Banner tone="warning" title={<>
            Not enough available balance in your {option.ccy} wallet.{" "}
            <Money>{fmt(q.pending ?? 0, option.ccy)}</Money> is waiting for
            approval and can be used once it clears.
            {q.lines.some((l) => l.credit > 0) && (
              <span className="mt-1 block text-muted">
                Your credit stays untouched until{" "}
              {q.lines.length === 1 ? "this invoice is" : "these invoices are"}{" "}
              paid.
              </span>
            )}
            {fundCcy && (
              <FundLink onClick={() => openFund(fundCcy, q.shortfall)} />
            )}
          </>} />
        );
      }
      return (
        <Banner tone="error" title={<>
          Not enough balance in your {option.ccy} wallet. Fund your wallet to
          pay {q.lines.length === 1 ? "this invoice" : "these invoices"}.{" "}
          <span className="text-muted">
            Short by{" "}
            <Money className="text-primary">{fmt(q.shortfall, option.ccy)}</Money>
            .
          </span>
          {q.lines.some((l) => l.credit > 0) && (
            <span className="mt-1 block text-muted">
              Your credit stays untouched until{" "}
              {q.lines.length === 1 ? "this invoice is" : "these invoices are"}{" "}
              paid.
            </span>
          )}
          {fundCcy ? (
            <FundLink onClick={() => openFund(fundCcy, q.shortfall)} />
          ) : (
            <FundLink label="Top up balance" external />
          )}
        </>} />
      );
    }
    if (q.fxCount > 0) {
      return (
        <p className="flex items-start gap-1.5 px-1 text-paragraph-xsmall text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {q.fxCount === q.lines.length
            ? "All invoices"
            : `${q.fxCount} of ${q.lines.length} invoices`}{" "}
          will be converted to {option.ccy} at the exchange rate shown below.
        </p>
      );
    }
    return (
      <p className="flex items-start gap-1.5 px-1 text-paragraph-xsmall text-muted">
        <CheckCircle
          className="mt-0.5 size-3.5 shrink-0 text-success"
          weight="fill"
        />
        Paid in {option.ccy} from your {CCY_NAME[option.ccy]} wallet. No
        conversion.
      </p>
    );
  }

  if (option.group === "bank") {
    return (
      <p className="flex items-start gap-1.5 px-1 text-paragraph-xsmall text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        We'll debit {option.label} ••{option.bankLast4} by ACH. Funds usually
        settle in 3 to 5 business days.
      </p>
    );
  }

  if (option.group === "crypto") {
    return (
      <p className="flex items-start gap-1.5 px-1 text-paragraph-xsmall text-muted">
        <Lightning className="mt-0.5 size-3.5 shrink-0" />
        After you confirm, you'll approve{" "}
        <Money className="text-primary">{fmt(q.total, "USDC")}</Money> from your
        wallet. Includes the network fee.
      </p>
    );
  }

  if (option.group === "wire") return <WireDetails />;
  return <LocalTransferDetails local={option.ccy as LocalCcy} />;
}


function FundLink({
  onClick,
  label = "Fund wallet",
  external,
}: {
  onClick?: () => void;
  label?: string;
  external?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1.5 flex items-center gap-1 text-label-xsmall text-brand hover:underline"
    >
      {label}
      {external ? (
        <ArrowSquareOut className="size-3.5" />
      ) : (
        <ArrowRight className="size-3.5" />
      )}
    </button>
  );
}

function SwitchToLocalHint({ local }: { local: LocalCcy }) {
  const { set, data } = usePayment();
  const w = data.wallets.find((x) => x.ccy === local);
  if (!w) return null;
  return (
    <button
      type="button"
      onClick={() => set({ methodId: w.id })}
      className="flex items-center gap-2 rounded-xl bg-base p-3 text-left text-paragraph-xsmall text-muted card hover:card-hover"
    >
      <CurrencyMark ccy={local} size="sm" />
      <span className="flex-1">
        Pay from your {local} wallet to skip currency conversion.
      </span>
      <span className="text-label-xsmall text-brand">Switch</span>
    </button>
  );
}

function WireDetails() {
  const { ui, set } = usePayment();
  const [method, setMethod] = useState<"sms" | null>(null);
  const [code, setCode] = useState("");
  const fields = COLLECTION_ACCOUNT.USD;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-base p-4 card">
        <div className="flex items-center justify-between">
          <p className="text-label-medium text-primary">Recipient details</p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              shade="neutral"
              size="sm"
              leftIcon={<DownloadSimple className="size-4" />}
            >
              Download
            </Button>
            <CopyButton
              value={fields.map(([k, v]) => `${k}: ${v}`).join("\n")}
              label="Copy all"
            />
          </div>
        </div>
        <RecipientDetails fields={fields} />
        <Banner
          tone="info"
          className="mt-1"
          title="Include the reference number we give you after confirming, or your wire may be rejected. Let us know once you've sent the funds."
        />
      </div>
      {ui.wireVerify === "verified" ? (
        <p className="flex items-center gap-1.5 text-label-small text-success">
          <CheckCircle weight="fill" className="size-4" /> Verified by SMS
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-label-medium text-primary">
            Select verification method
          </p>
          <div className="flex flex-col rounded-xl bg-base p-1 card">
            <span className="flex items-center gap-2.5 p-2.5 text-paragraph-small text-disabled">
              <RadioDot on={false} /> Verify using connected 2FA authenticator
            </span>
            <button
              type="button"
              onClick={() => setMethod("sms")}
              className="flex items-center gap-2.5 rounded-lg p-2.5 text-left text-paragraph-small text-primary hover:bg-highlight"
            >
              <RadioDot on={method === "sms"} /> Verify using SMS notification
            </button>
          </div>
          {ui.wireVerify === "code" ? (
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label-xsmall text-primary">
                  Enter the 6-digit code sent to •••• 4821
                </span>
                <input
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="h-9 rounded-control bg-base px-3 tabular-nums text-label-small tracking-[0.3em] borders-base outline-none focus:borders-focus"
                />
              </label>
              <Button
                type="button"
                disabled={code.length !== 6}
                onClick={() => set({ wireVerify: "verified" })}
              >
                Confirm code
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="self-start"
              disabled={!method}
              onClick={() => set({ wireVerify: "code" })}
            >
              Verify
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function LocalTransferDetails({ local }: { local: LocalCcy }) {
  const rail = LOCAL_RAIL[local];
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-base p-4 card">
      <div className="flex items-center justify-between">
        <p className="text-label-medium text-primary">Send to</p>
        <CopyButton
          value={COLLECTION_ACCOUNT[local]
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}
          label="Copy all"
        />
      </div>
      <RecipientDetails fields={COLLECTION_ACCOUNT[local]} />
      <Banner
        tone="info"
        className="mt-1"
        title={`${rail.instruction} You'll get the reference after you confirm. These invoices stay Awaiting transfer until we receive the funds.`}
      />
    </div>
  );
}

/* ================= footer ================= */

function TotalsFooter() {
  const { q, option, ui, set, data, credit } = usePayment();
  const payWithCredit =
    !!q && q.amountDue <= 0 && q.lines.some((l) => l.credit > 0);
  const needsMethod = !!q && !q.split && !option && !payWithCredit;
  const wireBlocked =
    !payWithCredit && option?.group === "wire" && ui.wireVerify !== "verified";
  const invalid = !!credit?.on && credit.plan.invalid;
  const blocked = !q || needsMethod || !q.sufficient || wireBlocked || invalid;
  const panel = data.flags.summaryPanel;
  const creditApplied = q ? round2(q.subtotal - q.amountDue) : 0;
  const hint = invalid
    ? "Fix the credit amount"
    : needsMethod
      ? "Choose a payment method"
      : wireBlocked
        ? "Verify to continue"
        : "";
  const [whole, cents] =
    q && q.legs.length <= 1
      ? (q.legs.length ? fmtLegs(q.legs, q.ccy) : fmt(q.total, q.ccy)).split(".")
      : [null, null];
  return (
    <div className="flex shrink-0 justify-center border-t border-base bg-base">
      <div className="mx-auto flex w-300 gap-20 px-6 py-3">
        <div className="mx-auto flex w-169.5">
          {q && (
            <div className="flex w-full flex-col justify-end gap-1.5">
              {!panel && !q.split && credit?.on && creditApplied > 0 && (
                <LeaderRow
                  label="Credit applied"
                  value={
                    <Money className="text-paragraph-xsmall text-success">
                      −{fmt(creditApplied, q.ccy)}
                    </Money>
                  }
                />
              )}
              {!panel &&
                q.fees.map((f) => (
                  <LeaderRow
                    key={f.label}
                    label={f.label}
                    value={
                      <Money className="text-paragraph-xsmall">
                        {fmt(f.amount, q.ccy)}
                      </Money>
                    }
                  />
                ))}
              {!panel &&
                q.fxPairs.map((p) => (
                  <LeaderRow
                    key={p.from}
                    muted
                    label="Exchange rate"
                    value={
                      <Money className="text-paragraph-xsmall text-muted">
                        1 {p.from} = {fmtRate(p.rate)} {p.to}
                      </Money>
                    }
                  />
                ))}
              <div className="flex items-center gap-3 pt-1">
                <span className="shrink-0 text-label-medium text-primary">
                  Total debit amount
                </span>
                <span className="h-px flex-1 border-t border-dotted border-base" />
                <Money className="text-paragraph-large text-primary">
                  {whole !== null ? (
                    <>
                      {whole}
                      <span className="text-muted">.{cents}</span>
                    </>
                  ) : (
                    fmtLegs(q.legs, q.ccy)
                  )}
                </Money>
              </div>
              {!panel && <CreditLeft />}
            </div>
          )}
        </div>
        <div className="flex w-98 shrink-0 items-end px-8">
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-paragraph-xsmall text-muted">{hint}</span>
            <Button
              type="button"
              size="lg"
              className="h-9"
              disabled={blocked}
              onClick={() => set({ modal: { kind: "confirm" }, payFailed: false })}
            >
              {payWithCredit ? "Pay with credit" : "Confirm payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
