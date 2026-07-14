import { MagnifyingGlass } from '@phosphor-icons/react'
import { Kbd } from '@/components/playground/kbd'
import { cn } from '@/lib/utils'

/**
 * Toolbar primitives per Figma: search field (36px pill-ish input with
 * ⌘ kbd), 36px icon button, hairline vertical divider, status pill.
 */

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
  autoFocus,
  showKbd = true,
  onKeyDown,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  showKbd?: boolean
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <label
      className={cn(
        'flex h-9 w-[250px] items-center gap-1 rounded-btn bg-background-base px-3 shadow-button-gray focus-within:shadow-border-focus',
        className,
      )}
    >
      <MagnifyingGlass className="size-4 shrink-0 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 bg-transparent px-1 text-paragraph-sm text-text-primary outline-none placeholder:text-text-muted"
      />
      {showKbd && <Kbd className="rounded-kbd px-2 py-[3px]">⌘</Kbd>}
    </label>
  )
}

export function ToolbarIconButton({
  label,
  className,
  children,
  onClick,
}: {
  label: string
  className?: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-btn bg-background-base text-text-primary shadow-button-gray transition-colors hover:bg-background-highlight',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function ToolbarDivider() {
  return <span className="h-2.5 w-px shrink-0 bg-border-muted" />
}

export function StatusPill({
  dotClassName,
  children,
  className,
}: {
  dotClassName: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-0.5 rounded-full bg-background-base px-1 shadow-button-gray',
        className,
      )}
    >
      <span className="flex size-4 items-center justify-center">
        <span className={cn('size-1.5 rounded-full', dotClassName)} />
      </span>
      <span className="px-1 text-label-xs text-text-primary">{children}</span>
    </span>
  )
}

/* ---------- Form primitives (FormLayout pages, expanded table rows) ---------- */

export function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode
  required?: boolean
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1 text-label-sm text-text-primary"
    >
      {children}
      {required && <span className="text-text-error-base">*</span>}
    </label>
  )
}

export function TextInput({
  className,
  invalid,
  ...props
}: React.ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-btn bg-background-base px-3 text-paragraph-sm text-text-primary shadow-button-gray transition-shadow outline-none placeholder:text-text-muted focus:shadow-border-focus disabled:bg-background-disabled disabled:text-text-muted',
        invalid && 'shadow-border-error focus:shadow-border-error',
        className,
      )}
      {...props}
    />
  )
}

export function TextArea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-20 w-full resize-y rounded-btn bg-background-base px-3 py-2 text-paragraph-sm text-text-primary shadow-button-gray transition-shadow outline-none placeholder:text-text-muted focus:shadow-border-focus',
        className,
      )}
      {...props}
    />
  )
}
