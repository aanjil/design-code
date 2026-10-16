import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Restyled to the NDS Web design system (Figma):
 * 34px default height, 9px radius (rounded-control), label-small type,
 * gradient fills + 0.5px ring shadows instead of borders.
 * Wrap text children in <span className="px-1"> for the 4px optical
 * label padding from spacing.md (icons sit at the 10px edge).
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-0.5 rounded-control text-label-small whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:borders-error [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-button-primary text-on-color buttons-primary hover:brightness-105",
        secondary:
          "bg-button-neutral text-primary borders-base hover:brightness-[0.98] dark:hover:brightness-110",
        outline:
          "bg-base text-primary borders-base hover:bg-highlight",
        ghost: "text-primary hover:bg-highlight",
        "ghost-destructive":
          "text-error hover:bg-error-highlight",
        destructive:
          "bg-error-emphasis text-on-color hover:bg-error",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[34px] px-2.5",
        sm: "h-7 rounded-lg px-1.5",
        lg: "h-9 px-3",
        icon: "size-[34px]",
        "icon-sm": "size-7 rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
