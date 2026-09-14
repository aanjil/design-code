import type { Icon } from '@phosphor-icons/react'
import {
  ArrowUp,
  BatteryFull,
  CaretLeft,
  CellSignalFull,
  Microphone,
  Paperclip,
  Camera as PhosphorCamera,
  WifiHigh,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Basic mobile UI kit for AI-native mobile prototyping (Emma Mobile PRD).
 * Rendered *inside* a canvas phone-chrome window (see playground/canvas.tsx's
 * `chrome: 'phone'` + `phoneFrameSize`) - the device bezel + Dynamic Island
 * are canvas chrome; everything below is real screen content, sized against
 * the iPhone 16 Pro Max's own 440x956pt viewport (62pt top / 34pt bottom
 * safe areas). Deliberately minimal - reuses `Button` (ui/button.tsx) and
 * `Banner` (nds/feedback.tsx) rather than forking mobile-only variants of
 * either; only genuinely mobile-shaped pieces (status bar, home indicator,
 * tab bar, chat bubble, dynamic input, the Action/Details/CTA card) live here.
 */

export const MOBILE_SCREEN = { width: 440, height: 956 }

/* ---------------- status bar / home indicator ---------------- */

/** Fixed "9:41" demo time (the same convention Apple's own marketing shots
 *  use) - a prototype has no real clock/battery/signal state to reflect. */
export function MobileStatusBar({ dark }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-[54px] shrink-0 items-end justify-between px-6 pb-1.5',
        dark ? 'text-white' : 'text-text-primary',
      )}
    >
      <span className="text-[15px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        <CellSignalFull weight="fill" className="size-4" />
        <WifiHigh weight="fill" className="size-4" />
        <BatteryFull weight="fill" className="size-5" />
      </div>
    </div>
  )
}

export function MobileHomeIndicator({ dark }: { dark?: boolean }) {
  return (
    <div className="flex h-[34px] shrink-0 items-center justify-center">
      <div className={cn('h-[5px] w-[134px] rounded-full', dark ? 'bg-white/90' : 'bg-text-primary/90')} />
    </div>
  )
}

/** Standard screen wrapper: status bar + scrollable body + home indicator,
 *  respecting the device's real safe-area proportions. Most screens should
 *  render inside this; opt out (`chrome={false}`) for full-bleed screens
 *  (e.g. a splash/auth screen) that draw their own status bar treatment. */
export function MobileScreen({
  children,
  className,
  dark,
  chrome = true,
}: {
  children: React.ReactNode
  className?: string
  dark?: boolean
  /** False skips the status bar/home indicator - use for full-bleed screens
   *  that need to draw under them (e.g. a photo/gradient auth background). */
  chrome?: boolean
}) {
  return (
    <div className={cn('relative flex h-full flex-col', dark ? 'bg-[#0b0b0d]' : 'bg-surface-1')}>
      {chrome && <MobileStatusBar dark={dark} />}
      <div className={cn('min-h-0 flex-1 overflow-y-auto', className)}>{children}</div>
      {chrome && <MobileHomeIndicator dark={dark} />}
    </div>
  )
}

/* ---------------- app header / tab bar ---------------- */

export function MobileAppHeader({
  title,
  onBack,
  action,
}: {
  title: string
  onBack?: () => void
  action?: React.ReactNode
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 px-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-primary transition-colors active:bg-background-highlight"
        >
          <CaretLeft weight="bold" className="size-5" />
        </button>
      )}
      <h1 className={cn('min-w-0 flex-1 truncate text-label-md text-text-primary', !onBack && 'px-1')}>
        {title}
      </h1>
      {action}
    </div>
  )
}

export interface MobileTabItem {
  id: string
  label: string
  icon: Icon
}

export function MobileTabBar({
  items,
  active,
  onSelect,
}: {
  items: Array<MobileTabItem>
  active: string
  onSelect?: (id: string) => void
}) {
  return (
    <div className="flex shrink-0 items-stretch border-t border-border-highlight bg-background-base">
      {items.map((item) => {
        const ItemIcon = item.icon
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2"
          >
            <ItemIcon
              weight={isActive ? 'fill' : 'regular'}
              className={cn('size-6', isActive ? 'text-brand-primary' : 'text-text-muted')}
            />
            <span className={cn('text-[10px] leading-none', isActive ? 'text-brand-primary' : 'text-text-muted')}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------------- Action / Details / CTA card (PRD Function 4.5) ---------------- */

export interface MobileCardCta {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

/**
 * The dashboard's one component contract (PRD 4.5): an Action/title area, an
 * optional Details area, and one or more CTAs. `size` picks the two variants
 * the PRD requires - `compact` (icon + title + a single-line detail, CTAs
 * inline) and `expanded` (room for multi-line details, CTAs full-width).
 */
export function MobileCard({
  icon,
  title,
  subtitle,
  details,
  ctas,
  size = 'expanded',
  tone = 'default',
}: {
  icon?: Icon
  title: string
  subtitle?: string
  details?: React.ReactNode
  ctas: Array<MobileCardCta>
  size?: 'compact' | 'expanded'
  tone?: 'default' | 'brand'
}) {
  const CardIcon = icon
  const compact = size === 'compact'
  return (
    <div
      className={cn(
        'rounded-2xl p-4 shadow-card',
        tone === 'brand' ? 'bg-brand-muted' : 'bg-background-base',
      )}
    >
      <div className="flex items-start gap-3">
        {CardIcon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-base">
            <CardIcon weight="fill" className="size-[18px] text-brand-primary" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-label-sm text-text-primary">{title}</p>
          {subtitle && <p className="mt-0.5 text-paragraph-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {details && !compact && <div className="mt-3 text-paragraph-xs text-text-muted">{details}</div>}
      {ctas.length > 0 && (
        <div className={cn('mt-3 flex gap-2', compact && 'flex-row')}>
          {ctas.map((cta) => (
            <Button
              key={cta.label}
              size="lg"
              variant={cta.variant === 'secondary' ? 'secondary' : 'default'}
              onClick={cta.onClick}
              className="flex-1"
            >
              <span className="px-1">{cta.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- dynamic input area (PRD Function 3.4) ---------------- */

function InputIconButton({
  icon: ItemIcon,
  label,
  onClick,
  tone,
}: {
  icon: Icon
  label: string
  onClick?: () => void
  tone?: 'brand'
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
        tone === 'brand'
          ? 'bg-brand-primary text-text-on-color'
          : 'text-text-muted active:bg-background-highlight',
      )}
    >
      <ItemIcon weight={tone === 'brand' ? 'bold' : 'regular'} className="size-[18px]" />
    </button>
  )
}

/**
 * The single input surface shared by onboarding and the dashboard - its
 * controls change by context (PRD 3.4): document steps show camera/
 * attachment, chat shows mic, dashboard shows quick prompts above it.
 */
export function MobileInputBar({
  value,
  onChange,
  onSend,
  placeholder = 'Message Emma',
  showMic = true,
  showCamera = false,
  showAttachment = false,
  onMic,
  onCamera,
  onAttachment,
}: {
  value: string
  onChange: (value: string) => void
  onSend?: () => void
  placeholder?: string
  showMic?: boolean
  showCamera?: boolean
  showAttachment?: boolean
  onMic?: () => void
  onCamera?: () => void
  onAttachment?: () => void
}) {
  const hasText = value.trim().length > 0
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-border-highlight bg-background-base px-2 py-2">
      {showCamera && <InputIconButton icon={PhosphorCamera} label="Camera" onClick={onCamera} />}
      {showAttachment && <InputIconButton icon={Paperclip} label="Attach a file" onClick={onAttachment} />}
      <div className="flex h-10 min-w-0 flex-1 items-center rounded-full bg-background-highlight px-4">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-paragraph-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>
      {hasText ? (
        <InputIconButton icon={ArrowUp} label="Send" tone="brand" onClick={onSend} />
      ) : (
        showMic && <InputIconButton icon={Microphone} label="Voice input" onClick={onMic} />
      )}
    </div>
  )
}

/* ---------------- chat bubble ---------------- */

export function MobileChatBubble({
  from,
  children,
}: {
  from: 'emma' | 'user'
  children: React.ReactNode
}) {
  const isEmma = from === 'emma'
  return (
    <div className={cn('flex', isEmma ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-paragraph-sm',
          isEmma ? 'bg-background-highlight text-text-primary' : 'bg-brand-primary text-text-on-color',
        )}
      >
        {children}
      </div>
    </div>
  )
}

/* ---------------- transient toast (PRD Function 1.1 error handling) ---------------- */

/**
 * Non-blocking transient message, e.g. a failed mode-switch (PRD 1.1: "the
 * app stays in the current mode and shows a non-blocking toast"). Absolutely
 * positioned - the nearest ancestor needs `relative` (MobileScreen's root div
 * already is one).
 */
export function MobileToast({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-4 bottom-24 z-10 rounded-xl bg-[#1a1a1a] px-4 py-3 text-center text-label-xs text-white shadow-2xl">
      {children}
    </div>
  )
}
