import { useId, useState } from 'react'
import type { Icon } from '@phosphor-icons/react'
import {
  Bell,
  Briefcase,
  CaretUpDown,
  ChartLineUp,
  CirclesThreePlus,
  CreditCard,
  CurrencyEth,
  DotsThree,
  Files,
  Gear,
  Heart,
  House,
  MagnifyingGlass,
  ShieldCheck,
  Users,
  Wallet,
} from '@phosphor-icons/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ─── types ────────────────────────────────────────────────────────────────────

export type AppBarRole = 'employer' | 'multi-entity' | 'contractor' | 'employee'

type NavItem = {
  label: string
  icon: React.ElementType
  muted?: boolean
}

// ─── nav item definitions per role ───────────────────────────────────────────

const NAV_ITEMS: Record<AppBarRole, NavItem[]> = {
  employer: [
    { label: 'People', icon: Users },
    { label: 'Payments', icon: CreditCard },
    { label: 'Niural Pay', icon: ShieldCheck },
    { label: 'Niural Insights', icon: ChartLineUp },
    { label: 'Integrations', icon: CirclesThreePlus },
  ],
  'multi-entity': [
    { label: 'Dashboard', icon: House },
    { label: 'People', icon: Users },
    { label: 'Payments', icon: CreditCard },
    { label: 'Niural Pay', icon: ShieldCheck },
    { label: 'Niural Insights', icon: ChartLineUp },
    { label: 'Integrations', icon: CirclesThreePlus },
  ],
  contractor: [
    { label: 'My Work', icon: Briefcase, muted: true },
    { label: 'Payments', icon: CreditCard },
    { label: 'Documents', icon: Files, muted: true },
  ],
  employee: [
    { label: 'My Work', icon: Briefcase, muted: true },
    { label: 'Payments', icon: CreditCard },
    { label: 'Benefits', icon: Heart, muted: true },
    { label: 'Documents', icon: Files, muted: true },
  ],
}

// ─── AppBarNavItem ─────────────────────────────────────────────────────────────
// Individual nav pill. Three states: default / hover (CSS) / selected (prop).

export function AppBarNavItem({
  label,
  icon: Icon,
  active,
  muted,
  onClick,
}: {
  label: string
  icon: React.ElementType
  active?: boolean
  muted?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[34px] shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 text-label-sm transition-colors',
        active
          ? 'bg-brand-base font-[530] text-brand-text'
          : cn(
              'hover:bg-background-highlight',
              muted
                ? 'text-text-muted hover:text-text-primary'
                : 'text-text-primary',
            ),
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  )
}

// ─── WalletButton ─────────────────────────────────────────────────────────────
// Default: white pill with shadow + dark amount text.
// Active: green pill with white text + inner highlight ring.

export function WalletButton({
  amount = '$ 28,043.34',
  active = false,
}: {
  amount?: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-9 shrink-0 items-center gap-1 rounded-full px-3 transition-all',
        active
          ? 'bg-brand-wallet-primary shadow-[0px_3px_4px_0px_rgba(11,193,90,0.11),inset_0px_1px_1px_rgba(255,255,255,0.25)]'
          : 'bg-background-base shadow-button-gray hover:shadow-button-gray',
      )}
    >
      <Wallet
        className={cn('size-5 shrink-0', active ? 'text-white' : 'text-brand-wallet-primary')}
        weight="duotone"
      />
      <span className={cn('px-1 text-label-sm', active ? 'text-text-on-color' : 'text-text-primary')}>
        {amount}
      </span>
      <span className={cn('h-2.5 w-px shrink-0', active ? 'bg-white/30' : 'bg-border-muted')} />
      <CaretUpDown
        className={cn('size-[18px] shrink-0', active ? 'text-white' : 'text-text-muted')}
      />
    </button>
  )
}

// ─── EmmaMark ──────────────────────────────────────────────────────────────────
// The Emma brand mark - a fixed purple→pink gradient fill with a soft inner
// highlight, same treatment on every surface (not token-driven, like
// NiuralMark). IDs are namespaced per instance via useId so the filter/
// gradient defs don't collide when the button renders more than once on a
// page (e.g. side-by-side role variants in the docs).

export function EmmaMark({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const filterId = `emma-mark-shadow-${uid}`
  const gradientId = `emma-mark-gradient-${uid}`
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g filter={`url(#${filterId})`}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.48123 12.2793L5.25857 12.458L6.34842 12.7099C6.45662 12.735 6.56495 12.762 6.67068 12.792C8.01794 13.1717 9.17545 13.9492 10.0222 14.9912C10.0994 15.0854 10.1742 15.1826 10.2459 15.2812C10.7631 15.9945 11.1419 16.8167 11.3484 17.7099L11.6267 18.9121L11.8133 19.7207L11.9939 20.5068L12.0271 20.6523L12.0613 20.5068L12.2439 19.7148L12.4334 18.8955L12.7058 17.7099C12.909 16.8272 13.2798 16.0184 13.784 15.3154C13.8412 15.2348 13.901 15.1546 13.9627 15.0761C14.8075 14.0033 15.9764 13.205 17.3299 12.8095C17.4533 12.7732 17.5793 12.7404 17.7058 12.7109L18.7273 12.4746L19.5056 12.2949L20.575 12.0156L21.9666 12.8183C22.3217 13.0229 22.5397 13.4018 22.5398 13.8115V17.4385C22.5398 17.8485 22.3209 18.228 21.9666 18.4326L18.825 20.2451C18.4694 20.4495 18.0327 20.4495 17.6785 20.2451L16.2742 19.4345V21.041C16.274 21.4508 16.0551 21.8296 15.701 22.0342L12.5594 23.8467C12.2042 24.0513 11.7665 24.0513 11.4119 23.8467L8.27127 22.0342C7.91626 21.8296 7.6982 21.4508 7.69803 21.041V19.4199L6.30838 20.2217C5.95267 20.4263 5.51524 20.4263 5.16092 20.2217L2.01932 18.4092C1.66426 18.2046 1.4461 17.8257 1.44607 17.416V13.789C1.44607 13.379 1.66502 12.9995 2.01932 12.7949L3.47732 12.0146L4.48123 12.2793ZM11.4402 0.153298C11.7952 -0.0511278 12.2322 -0.0510708 12.5867 0.153298L15.7273 1.96677C16.083 2.17137 16.3015 2.55019 16.3015 2.95994V4.58103L16.4861 4.47459L17.6922 3.77927C18.0479 3.5747 18.4843 3.57469 18.8387 3.77927L21.9803 5.59177C22.3354 5.79637 22.5535 6.17519 22.5535 6.58494V10.2119C22.5534 10.6217 22.3343 11.0001 21.9803 11.2041L20.574 12.0156L20.283 11.9463L19.5047 11.7676L18.7273 11.5879L17.7058 11.3525C17.5604 11.3192 17.4163 11.2814 17.2752 11.2392C15.9458 10.8405 14.8059 10.052 13.9773 9.00388C13.9024 8.90994 13.8307 8.81386 13.7615 8.7158C13.2685 8.01827 12.9066 7.21918 12.7058 6.35349L12.1551 3.96482L12.0271 3.41013L11.9012 3.95896L11.3484 6.35349C11.1477 7.2271 10.7824 8.02851 10.2859 8.72654C10.2062 8.8393 10.1228 8.9491 10.0359 9.05662C9.20291 10.0854 8.06904 10.8539 6.75955 11.2441C6.62475 11.2849 6.48735 11.3205 6.34842 11.3525L5.25857 11.6045L4.48123 11.7832L3.70291 11.9629L3.47732 12.0146L3.42557 11.9844L2.03299 11.1816C1.67784 10.977 1.45975 10.5975 1.45975 10.1875V6.5615C1.45975 6.15148 1.67866 5.77196 2.03299 5.56736L5.17459 3.75486C5.52966 3.55047 5.9666 3.55037 6.32107 3.75486L7.53396 4.45408L7.72537 4.56541V2.95896C7.7254 2.54952 7.94431 2.17038 8.29861 1.9658L11.4402 0.153298Z"
          fill={`url(#${gradientId})`}
        />
      </g>
      <defs>
        <filter
          id={filterId}
          x="1.44607"
          y="0"
          width="21.1074"
          height="25.2633"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1.26319" />
          <feGaussianBlur stdDeviation="0.631595" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.46 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>
        <linearGradient id={gradientId} x1="2.67534" y1="2.84011" x2="20.6685" y2="20.084" gradientUnits="userSpaceOnUse">
          <stop stopColor="#714DFF" />
          <stop offset="1" stopColor="#E151FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** 234,000 -> "234k", 1,240 -> "1.2k", 640 -> "640". */
function formatCompactCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    return `${Number.isInteger(v) ? v : v.toFixed(1)}m`
  }
  if (n >= 1_000) {
    const v = n / 1_000
    return `${Number.isInteger(v) ? v : v.toFixed(1)}k`
  }
  return `${n}`
}

/** Opt-in via AppBar's `tokenBalance` prop - turns AiButton into the
 *  compound tokens + Ask Emma pill. `onClick` fires from the token segment
 *  only (e.g. navigate to Settings > AI > Tokens), independent of the Ask
 *  Emma toggle. */
export interface TokenBalanceSummary {
  tokens: number
  onClick?: () => void
}

// ─── AiButton ─────────────────────────────────────────────────────────────────
// Default: white pill with the Emma mark + dark text.
// Hover: same pill but text renders as a purple→pink gradient.
// Selected: purple→pink gradient pill with white text + glow shadow.
// With `tokens`, becomes a compound pill - Emma mark + compact token count,
// a divider, then "Ask Emma" - the token segment has its own click target
// (e.g. to Settings > AI > Tokens) independent of the Ask Emma toggle.

export function AiButton({
  selected = false,
  onClick,
  tokens,
  onTokensClick,
}: {
  selected?: boolean
  onClick?: () => void
  tokens?: number
  onTokensClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const hasTokens = tokens !== undefined

  return (
    <span
      className={cn(
        'flex h-9 shrink-0 items-center overflow-hidden rounded-full transition-all',
        selected
          ? 'shadow-[0px_3px_4px_0px_rgba(113,77,255,0.2),inset_0px_3px_4px_rgba(255,255,255,0.25)]'
          : 'bg-background-base shadow-button-gray',
      )}
      style={
        selected
          ? { backgroundImage: 'linear-gradient(119.6deg, #714dff 30.8%, #e151ff 122.6%)' }
          : undefined
      }
    >
      {hasTokens && (
        <>
          <button
            type="button"
            onClick={onTokensClick}
            className="flex h-full shrink-0 items-center gap-1.5 pl-3 pr-2.5"
          >
            <EmmaMark className="size-5 shrink-0" />
            <span className={cn('text-label-sm font-[530]', selected ? 'text-white' : 'text-text-primary')}>
              {formatCompactCount(tokens)}
            </span>
          </button>
          <span className={cn('h-4 w-px shrink-0', selected ? 'bg-white/30' : 'bg-border-muted')} />
        </>
      )}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn('flex h-full shrink-0 items-center gap-1.5', hasTokens ? 'pl-2.5 pr-3.5' : 'px-3')}
      >
        {!hasTokens && <EmmaMark className="size-5 shrink-0" />}
        <span
          className="text-label-sm font-[530]"
          style={
            selected
              ? { color: 'white' }
              : hovered
              ? {
                  backgroundImage: 'linear-gradient(20deg, #714dff 52.9%, #e151ff 87.7%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }
              : { color: 'var(--text-primary)' }
          }
        >
          Ask Emma
        </span>
      </button>
    </span>
  )
}

// ─── NotificationButton ────────────────────────────────────────────────────────
// Bell + unread count, opening a panel of billing/token notifications.
// Opt-in via AppBar's `notifications` prop.

export type NotificationTone = 'success' | 'accent' | 'warning' | 'error'

export interface AppBarNotification {
  id: string
  icon: Icon
  tone: NotificationTone
  title: string
  description: string
  date: string
}

const NOTIFICATION_TONE_CLASSES: Record<NotificationTone, string> = {
  success: 'bg-background-success-highlight text-text-success-base',
  accent: 'bg-brand-muted text-brand-text',
  warning: 'bg-background-warning-highlight text-text-warning-base',
  error: 'bg-background-error-highlight text-text-error-base',
}

export function NotificationButton({
  notifications,
  onExportClick,
}: {
  notifications: Array<AppBarNotification>
  onExportClick?: () => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
          />
        }
      >
        <Bell className="size-[18px]" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-text-error-base px-1 text-[10px] font-medium text-text-on-color">
            {notifications.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[344px] p-0">
        <div className="flex items-center justify-between border-b border-border-highlight px-3.5 py-2.5">
          <p className="text-label-sm text-text-primary">Notifications</p>
          <button type="button" onClick={onExportClick} className="text-caption-md text-brand-text">
            Export history
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((n) => {
            const NotifIcon = n.icon
            return (
              <div key={n.id} className="flex gap-2.5 border-b border-border-highlight px-3.5 py-3 last:border-b-0">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full',
                    NOTIFICATION_TONE_CLASSES[n.tone],
                  )}
                >
                  <NotifIcon weight="fill" className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-label-xs text-text-primary">{n.title}</p>
                  <p className="mt-0.5 text-caption-md text-text-muted">{n.description}</p>
                  <p className="mt-1.5 text-caption-md text-text-muted">{n.date}</p>
                </div>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function AppBarDivider() {
  return <span className="h-4 w-px shrink-0 bg-border-muted" />
}

/** Niural mark - fixed brand-purple + white fills (not token-driven), same
 *  as the gradient marks used elsewhere in the app bar, so it reads
 *  correctly on both light and dark surface-2. */
function NiuralMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.4001 8.91309L21.9184 8.80217H21.9126C21.86 8.79049 21.8133 8.7788 21.7753 8.76712C21.7286 8.75252 21.6848 8.73793 21.644 8.71749C21.5301 8.66494 21.4338 8.58028 21.3666 8.47518C21.2148 8.24746 21.2119 7.95553 21.3549 7.72197C21.3666 7.70446 21.3783 7.68694 21.39 7.66943C21.3958 7.66359 21.3987 7.65775 21.4046 7.64899C21.4659 7.57308 21.5505 7.50593 21.641 7.46214C21.6732 7.44754 21.7169 7.42711 21.7783 7.40959C21.8133 7.40083 21.8454 7.39207 21.8746 7.38623L21.9096 7.37748C21.9096 7.37748 21.9184 7.37748 21.9213 7.37748L22.403 7.26946C22.5023 7.24611 22.5957 7.21106 22.6862 7.16435C22.5286 6.2856 22.0498 5.49444 21.3403 4.94558C20.6367 5.20249 20.0937 5.80681 19.9302 6.54835L19.755 7.32784V7.34828C19.7346 7.42418 19.7171 7.48841 19.6996 7.5468C19.682 7.60518 19.6645 7.65191 19.6499 7.68694C19.6441 7.69862 19.6382 7.71322 19.6324 7.7249C19.5653 7.85627 19.4718 7.95845 19.358 8.03436C19.2237 8.12486 19.0689 8.17156 18.9025 8.17156C18.7361 8.17156 18.5814 8.12486 18.4471 8.03436C18.3332 7.96137 18.2398 7.85627 18.1726 7.7249C18.1726 7.7249 18.1726 7.72197 18.1697 7.71905C18.1464 7.66942 18.1259 7.61395 18.1055 7.55264C18.088 7.49133 18.0705 7.42127 18.05 7.33368L17.8749 6.54835C17.688 5.71339 17.0224 5.05069 16.1844 4.86092L15.3991 4.68283H15.3903C15.3173 4.66531 15.2473 4.64779 15.186 4.63028C15.1247 4.61276 15.075 4.59234 15.0254 4.56898C14.8911 4.50475 14.7802 4.4084 14.7013 4.28579C14.5232 4.0172 14.5203 3.67271 14.6867 3.39828C14.6984 3.37785 14.713 3.35741 14.7276 3.33989C14.7334 3.33113 14.7393 3.32237 14.7451 3.31653C14.8181 3.22603 14.9115 3.15304 15.0225 3.10049C15.0633 3.08006 15.1188 3.05379 15.1918 3.03627C15.2385 3.02168 15.2852 3.00998 15.3319 3.00122C15.3495 2.9983 15.3728 2.99247 15.3933 2.98663C15.3933 2.98663 15.3991 2.98663 15.4049 2.98663L16.1874 2.81147C16.4968 2.7414 16.783 2.60711 17.0282 2.42318L13.6824 0.493434C12.5642 -0.151762 11.1862 -0.151762 10.0651 0.493434L2.80719 4.68283C1.68901 5.32802 1 6.52209 1 7.8154V16.1942C1 17.4875 1.68901 18.6816 2.80719 19.3268L10.0651 23.5161C11.1833 24.1613 12.5642 24.1613 13.6824 23.5161L20.9404 19.3268C22.0585 18.6816 22.7475 17.4875 22.7475 16.1942V9.06491C22.6424 9.0036 22.5286 8.9569 22.406 8.9277L22.4001 8.91309ZM16.383 17.2919L14.316 18.2641H14.2079V8.74086C14.2079 8.37884 13.9773 8.10733 13.5218 7.92924C13.0722 7.74824 12.5204 7.65774 11.8665 7.65774C11.2125 7.65774 10.6607 7.74824 10.2053 7.92924C9.75273 8.10733 9.53085 8.37884 9.53085 8.74086V17.289L7.46383 18.2611H7.35581V8.36133C7.35581 7.395 8.03314 6.65053 9.39071 6.13087C10.1235 5.85061 10.9497 5.71047 11.8723 5.71047C12.7949 5.71047 13.6182 5.85061 14.3539 6.13087C15.7086 6.65053 16.3888 7.395 16.3888 8.36133V17.289L16.383 17.2919Z"
        fill="#714DFF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.383 8.3642V17.2918L14.3159 18.264H14.2079V8.7408C14.2079 8.37879 13.9773 8.10727 13.5218 7.92919C13.0722 7.74818 12.5204 7.65768 11.8665 7.65768C11.2125 7.65768 10.6607 7.74818 10.2053 7.92919C9.75273 8.10727 9.53085 8.37879 9.53085 8.7408V17.2889L7.46383 18.2611H7.3558V8.36128C7.3558 7.39494 8.03313 6.65048 9.39071 6.13082C10.1235 5.85055 10.9497 5.71042 11.8723 5.71042C12.7949 5.71042 13.6182 5.85055 14.3539 6.13082C15.7086 6.65048 16.3888 7.39494 16.3888 8.36128L16.383 8.3642Z"
        fill="white"
      />
      <path
        d="M22.6775 4.00256C22.6483 4.04635 22.6103 4.08138 22.5548 4.10766C22.5315 4.11933 22.5052 4.13101 22.4702 4.13977C22.4206 4.15436 22.3563 4.16897 22.2863 4.18356L21.5038 4.36165C21.2673 4.4142 21.0425 4.49885 20.8323 4.60979C20.1316 4.97764 19.6091 5.64035 19.431 6.43152L19.2587 7.2081C19.2412 7.28693 19.2266 7.35115 19.212 7.40078C19.2032 7.43581 19.1916 7.4621 19.1799 7.48837C19.1536 7.54092 19.1186 7.58179 19.0748 7.60806C19.0222 7.64602 18.9609 7.66061 18.8996 7.66061C18.8383 7.66061 18.7741 7.64602 18.7215 7.60806C18.6806 7.58179 18.6456 7.54092 18.6164 7.48837C18.6047 7.46502 18.596 7.43581 18.5843 7.40078C18.5697 7.35406 18.5551 7.29276 18.5405 7.21977L18.3653 6.43444C18.1347 5.4068 17.3201 4.5952 16.2925 4.36457L15.51 4.18649C15.44 4.17189 15.3757 4.15728 15.3261 4.14269C15.2911 4.13393 15.2648 4.12226 15.2414 4.11058C15.1889 4.08722 15.148 4.05218 15.1188 4.00546C15.0488 3.90036 15.0488 3.76024 15.1188 3.65222C15.1188 3.65222 15.1188 3.65222 15.1188 3.6493L15.1276 3.63763C15.1276 3.63763 15.1276 3.63763 15.1276 3.63471C15.1539 3.60259 15.1918 3.57339 15.2356 3.55295C15.259 3.54128 15.2852 3.5296 15.3203 3.52085C15.3699 3.50333 15.4341 3.49166 15.5071 3.47414L16.2866 3.29896C16.7392 3.19678 17.1508 2.98367 17.4866 2.68589C17.9186 2.30928 18.2281 1.8013 18.3595 1.22617L18.5347 0.437916C18.5493 0.36785 18.5639 0.303623 18.5785 0.256912C18.5872 0.224798 18.5989 0.195608 18.6106 0.169333C18.6368 0.119702 18.6719 0.0788199 18.7157 0.0496255L18.7332 0.0408765C18.7828 0.0146015 18.8354 0 18.8908 0C18.9551 0 19.0164 0.0175145 19.0689 0.0525478C19.1098 0.0817422 19.1448 0.122624 19.174 0.172255C19.1828 0.19561 19.1945 0.224801 19.2062 0.259835C19.2208 0.309465 19.2354 0.373682 19.2529 0.449588L19.428 1.22909C19.6587 2.25673 20.4732 3.06833 21.5009 3.29896L22.2746 3.47414C22.3534 3.49166 22.4176 3.50333 22.4673 3.52085C22.5023 3.5296 22.5286 3.54128 22.5519 3.55295C22.5957 3.57339 22.6308 3.60259 22.66 3.63471C22.66 3.63471 22.66 3.63471 22.66 3.63763L22.6687 3.6493C22.6687 3.6493 22.6687 3.65513 22.6716 3.65805L22.6804 3.66974C22.7417 3.78068 22.7359 3.9062 22.6716 4.00546L22.6775 4.00256Z"
        fill="#714DFF"
      />
      <path
        d="M26.4583 8.1978C26.4407 8.22699 26.4174 8.24742 26.3824 8.26202C26.3678 8.26786 26.3502 8.27662 26.3298 8.28245C26.3006 8.29121 26.2597 8.29998 26.2159 8.30874L25.7342 8.41968C25.0978 8.56273 24.5956 9.06486 24.4525 9.69838L24.3445 10.1772C24.3328 10.2268 24.3241 10.2648 24.3153 10.2969C24.3095 10.3173 24.3007 10.3348 24.2949 10.3494C24.2774 10.3815 24.2569 10.4078 24.2307 10.4224C24.1986 10.4458 24.1606 10.4545 24.1226 10.4545C24.0847 10.4545 24.0467 10.4458 24.0117 10.4224C23.9854 10.4078 23.965 10.3815 23.9475 10.3494C23.9387 10.3348 23.9329 10.3173 23.927 10.2969C23.9183 10.2677 23.9095 10.2297 23.8978 10.183L23.7898 9.69838C23.6643 9.14076 23.2643 8.68826 22.7388 8.48682C22.6658 8.45762 22.587 8.43427 22.5111 8.41676L22.0264 8.30581C21.9826 8.29706 21.9447 8.28829 21.9126 8.27953C21.8921 8.27369 21.8746 8.26785 21.86 8.25909C21.8279 8.2445 21.8045 8.22407 21.787 8.19487C21.7432 8.13065 21.7432 8.04306 21.787 7.97592L21.7929 7.96715C21.8075 7.94671 21.8308 7.9292 21.8571 7.91752C21.8717 7.90877 21.8892 7.90293 21.9096 7.89709C21.9388 7.88833 21.9797 7.87958 22.0235 7.8679L22.5052 7.75988C22.5841 7.74236 22.66 7.719 22.7329 7.69272C23.2585 7.49128 23.6614 7.03586 23.7869 6.48116L23.8949 5.99653C23.9037 5.95274 23.9154 5.9148 23.9241 5.88268C23.93 5.86225 23.9358 5.84471 23.9446 5.83012C23.9592 5.798 23.9825 5.77465 24.0088 5.75713L24.0175 5.7513C24.0467 5.73379 24.0818 5.72502 24.1139 5.72502C24.1518 5.72502 24.1898 5.73669 24.2248 5.75713C24.2511 5.77465 24.2715 5.798 24.2891 5.83012C24.2949 5.84471 24.3007 5.86225 24.3095 5.88268C24.3183 5.9148 24.327 5.95274 24.3358 5.99945L24.4438 6.48116C24.5868 7.11468 25.089 7.61683 25.7255 7.75988L26.2013 7.8679C26.251 7.87958 26.2919 7.88541 26.321 7.89709C26.3415 7.90293 26.359 7.90877 26.3736 7.91752C26.3999 7.9292 26.4203 7.94671 26.4407 7.96715L26.4466 7.97592C26.4466 7.97592 26.4466 7.97592 26.4466 7.97884V7.98467C26.4875 8.05473 26.4845 8.13356 26.4466 8.19195L26.4583 8.1978Z"
        fill="#714DFF"
      />
    </svg>
  )
}

function AppBarLogo({ compact }: { compact?: boolean }) {
  if (compact) {
    return <NiuralMark className="size-6 shrink-0" />
  }
  return (
    <div className="flex shrink-0 items-center gap-2">
      <NiuralMark className="size-6 shrink-0" />
      <span className="text-label-sm font-[550] text-text-primary">Niural AI</span>
    </div>
  )
}

function AppBarAvatar({ square }: { square?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center bg-brand-muted text-label-xs text-brand-text shadow-[0px_0px_0px_1px_var(--elevation-alpha-16)]',
        square ? 'rounded-[8px]' : 'rounded-full',
      )}
    >
      SB
    </span>
  )
}

const DEFAULT_ORG_NAME = 'Nexus Corp Corp America'

function OrgSwitcher({ name = DEFAULT_ORG_NAME }: { name?: string }) {
  return (
    <button
      type="button"
      className="flex h-9 w-[190px] shrink-0 items-center gap-2 rounded-btn bg-background-base px-2 py-1 shadow-button-gray"
    >
      <span className="min-w-0 flex-1 truncate text-left text-label-xs text-text-muted">
        {name}
      </span>
      <span className="shrink-0 rounded-full border border-border-success-muted bg-background-success-muted px-[7px] py-px text-[10px] leading-[1.6] tracking-tight text-text-success-base">
        HQ
      </span>
      <CaretUpDown className="size-4 shrink-0 text-text-muted" />
    </button>
  )
}

function IconBtn({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
    >
      <Icon className="size-[18px]" />
    </button>
  )
}

// ─── mini rail sub-components ──────────────────────────────────────────────────
// Icon-only, vertically-stacked counterparts of the pieces above - same
// active/muted/selected logic, tooltip stands in for the label that would
// otherwise be visible in the full-width bar.

function RailNavButton({
  label,
  icon: Icon,
  active,
  muted,
  onClick,
}: {
  label: string
  icon: React.ElementType
  active?: boolean
  muted?: boolean
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
              active
                ? 'bg-background/70 text-[#183F68]'
                : cn(
                    'hover:cursor-pointer',
                    muted ? 'text-text-muted hover:text-text-primary' : 'text-text-primary',
                  ),
            )}
          />
        }
      >
        <Icon className="size-[18px] shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function RailIconButton({
  icon: Icon,
  label,
  weight,
  onClick,
}: {
  icon: React.ElementType
  label: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
          />
        }
      >
        <Icon className="size-[18px]" weight={weight} />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function RailWalletButton({
  amount = '$ 28,043.34',
  active = false,
}: {
  amount?: string
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`Wallet - ${amount}`}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-all',
              active
                ? 'bg-brand-wallet-primary shadow-[0px_3px_4px_0px_rgba(11,193,90,0.11),inset_0px_1px_1px_rgba(255,255,255,0.25)]'
                : 'bg-background-base shadow-button-gray',
            )}
          />
        }
      >
        <Wallet
          className={cn('size-5 shrink-0', active ? 'text-white' : 'text-brand-wallet-primary')}
          weight="duotone"
        />
      </TooltipTrigger>
      <TooltipContent side="right">{amount}</TooltipContent>
    </Tooltip>
  )
}

function RailAiButton({
  selected = false,
  onClick,
  tokens,
}: {
  selected?: boolean
  onClick?: () => void
  tokens?: number
}) {
  const hasTokens = tokens !== undefined
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Ask Emma"
            onClick={onClick}
            className={cn(
              'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition-all',
              selected
                ? 'shadow-[0px_3px_4px_0px_rgba(113,77,255,0.2),inset_0px_3px_4px_rgba(255,255,255,0.25)]'
                : 'bg-background-base shadow-button-gray',
            )}
            style={
              selected
                ? { backgroundImage: 'linear-gradient(119.6deg, #714dff 30.8%, #e151ff 122.6%)' }
                : undefined
            }
          />
        }
      >
        <EmmaMark className="size-5 shrink-0" />
        {hasTokens && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-background-base px-1 text-[9px] font-medium text-text-primary shadow-button-gray">
            {formatCompactCount(tokens)}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right">
        Ask Emma{hasTokens ? ` · ${formatCompactCount(tokens)} tokens` : ''}
      </TooltipContent>
    </Tooltip>
  )
}

// ─── AppBar ───────────────────────────────────────────────────────────────────
/**
 * Top navigation bar - 4 role variants from the Figma Web design system.
 * `mini` collapses the same role/nav-item logic into a 64px vertical icon
 * rail (full height, tooltip stands in for the hidden label) instead of the
 * 58px horizontal bar - use it in place of AppBar, not alongside it.
 *
 * Roles:
 *  employer      → full logo | People, Payments, Niural Pay, Niural Insights, Integrations
 *  multi-entity  → icon | org switcher | Dashboard … Integrations
 *  contractor    → full logo | My Work, Payments, Documents
 *  employee      → full logo | My Work, Payments, Benefits, Documents
 *
 * Exported sub-components: AppBarNavItem, WalletButton, AiButton, NotificationButton
 */
export function AppBar({
  role = 'employer',
  activeItem,
  walletActive = false,
  aiSelected = false,
  onAiClick,
  onSettingsClick,
  tokenBalance,
  notifications,
  onNotificationsExportClick,
  onNavItemClick,
  mini = false,
}: {
  role?: AppBarRole
  activeItem?: string
  walletActive?: boolean
  aiSelected?: boolean
  /** Fires in addition to the button's own selected/unselected toggle -
   *  lets a consuming screen open something real (e.g. a copilot panel)
   *  on top of the existing decorative pill state. */
  onAiClick?: () => void
  /** Wires the existing Settings gear (employer/multi-entity only) to real
   *  navigation - decorative with no click handler otherwise. */
  onSettingsClick?: () => void
  /** Turns AiButton into the compound tokens + Ask Emma pill when supplied. */
  tokenBalance?: TokenBalanceSummary
  /** Renders a NotificationButton in the secondary icon group when supplied. */
  notifications?: Array<AppBarNotification>
  onNotificationsExportClick?: () => void
  /** Fires in addition to the pill's own local highlight - lets a consuming
   *  screen wire a nav item to real navigation instead of just decoration. */
  onNavItemClick?: (label: string) => void
  /** Renders a 64px vertical icon rail instead of the 58px horizontal bar -
   *  same role, nav items, and state, just collapsed. Give it `h-full` from
   *  its parent (it replaces AppBar in the layout, not the Sidebar). */
  mini?: boolean
}) {
  const navItems = NAV_ITEMS[role]
  const [active, setActive] = useState(activeItem ?? navItems[0]?.label ?? '')
  const [aiOn, setAiOn] = useState(aiSelected)

  function handleAiClick() {
    setAiOn((v) => !v)
    onAiClick?.()
  }

  const isEmployee = role === 'employee'
  const isEmployer = role === 'employer'
  const isMultiEntity = role === 'multi-entity'

  if (mini) {
    return (
      <TooltipProvider delay={300}>
        <aside className="flex h-full w-16 shrink-0 flex-col items-center gap-1 border-r border-border-base bg-surface-2 py-3">
          <div className="flex h-9 shrink-0 items-center justify-center">
            <NiuralMark className="size-6 shrink-0" />
          </div>

          {isMultiEntity && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={DEFAULT_ORG_NAME}
                    className="mt-1 flex h-6 shrink-0 items-center justify-center rounded-full border border-border-success-muted bg-background-success-muted px-2 text-[10px] leading-[1.6] tracking-tight text-text-success-base"
                  />
                }
              >
                HQ
              </TooltipTrigger>
              <TooltipContent side="right">{DEFAULT_ORG_NAME}</TooltipContent>
            </Tooltip>
          )}

          <span className="my-2 h-px w-8 shrink-0 bg-border-muted" />

          <nav className="flex flex-col items-center gap-1">
            {navItems.map(({ label, icon, muted }) => (
              <RailNavButton
                key={label}
                label={label}
                icon={icon}
                active={active === label}
                muted={muted}
                onClick={() => {
                  setActive(label)
                  onNavItemClick?.(label)
                }}
              />
            ))}
          </nav>

          <div className="flex-1" />

          <div className="flex flex-col items-center gap-2">
            {isEmployee ? (
              <>
                <RailIconButton icon={CurrencyEth} label="Connect Wallet" />
                <RailIconButton icon={DotsThree} label="Menu" weight="bold" />
                <RailIconButton icon={DotsThree} label="Notifications" weight="bold" />
              </>
            ) : (
              <>
                <RailWalletButton active={walletActive} />
                {notifications && (
                  <NotificationButton
                    notifications={notifications}
                    onExportClick={onNotificationsExportClick}
                  />
                )}
                {isEmployer && (
                  <RailAiButton selected={aiOn} onClick={handleAiClick} tokens={tokenBalance?.tokens} />
                )}
              </>
            )}
          </div>

          {!isEmployee && (
            <>
              <span className="my-2 h-px w-8 shrink-0 bg-border-muted" />
              <div className="flex flex-col items-center gap-2">
                {isMultiEntity && (
                  <RailAiButton selected={aiOn} onClick={handleAiClick} tokens={tokenBalance?.tokens} />
                )}
                <RailIconButton icon={MagnifyingGlass} label="Search" />
                {(isEmployer || isMultiEntity) && (
                  <RailIconButton icon={Gear} label="Settings" onClick={onSettingsClick} />
                )}
              </div>
            </>
          )}

          <span className="my-2 h-px w-8 shrink-0 bg-border-muted" />
          <AppBarAvatar square={isEmployee} />
        </aside>
      </TooltipProvider>
    )
  }

  return (
    <header className="flex h-[50px] shrink-0 items-center justify-between gap-3  px-4">

      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 items-center gap-3">
        <AppBarLogo compact={isMultiEntity} />

        {isMultiEntity && (
          <>
            <AppBarDivider />
            <OrgSwitcher />
          </>
        )}

        <AppBarDivider />

        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ label, icon, muted }) => (
            <AppBarNavItem
              key={label}
              label={label}
              icon={icon}
              active={active === label}
              muted={muted}
              onClick={() => {
                setActive(label)
                onNavItemClick?.(label)
              }}
            />
          ))}
        </nav>
      </div>

      {/* ── RIGHT ────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-5">

        {/* Primary actions */}
        <div className="flex shrink-0 items-center gap-3">
          {isEmployee ? (
            <>
              <button
                type="button"
                className="flex h-9 shrink-0 items-center gap-2 rounded-btn bg-background-base px-3 shadow-button-gray"
              >
                <CurrencyEth className="size-[18px]" />
                <span className="text-label-sm text-text-primary">Connect Wallet</span>
              </button>
              <button
                type="button"
                aria-label="Menu"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
              >
                <DotsThree className="size-4" weight="bold" />
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
              >
                <DotsThree className="size-4" weight="bold" />
              </button>
            </>
          ) : (
            <>
              <WalletButton active={walletActive} />
              {notifications && (
                <NotificationButton notifications={notifications} onExportClick={onNotificationsExportClick} />
              )}
              {isEmployer && (
                <AiButton
                  selected={aiOn}
                  onClick={handleAiClick}
                  tokens={tokenBalance?.tokens}
                  onTokensClick={tokenBalance?.onClick}
                />
              )}
            </>
          )}
        </div>

        {/* Secondary actions - hidden for employee */}
        {!isEmployee && (
          <>
            <AppBarDivider />
            <div className="flex shrink-0 items-center gap-2">
              {isMultiEntity && (
                <AiButton
                  selected={aiOn}
                  onClick={handleAiClick}
                  tokens={tokenBalance?.tokens}
                  onTokensClick={tokenBalance?.onClick}
                />
              )}
              <IconBtn icon={MagnifyingGlass} label="Search" />
              {(isEmployer || isMultiEntity) && (
                <button
                  type="button"
                  aria-label="Settings"
                  onClick={onSettingsClick}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background-base shadow-button-gray"
                >
                  <Gear className="size-[18px]" />
                </button>
              )}
            </div>
          </>
        )}

        <AppBarDivider />
        <AppBarAvatar square={isEmployee} />
      </div>
    </header>
  )
}
