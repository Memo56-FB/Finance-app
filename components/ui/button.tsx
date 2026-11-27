import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { CaretRight } from "@phosphor-icons/react/dist/ssr"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap motion-safe:transition-colors motion-safe:[transition-timing-function:steps(3)] disabled:pointer-events-none disabled:opacity-50 p-200 text-[14px] leading-[150%] tracking-normal font-bold h-[53px]",
  {
    variants: {
      variant: {
        primary: "bg-theme-3 text-ink px-bevel hover:bg-theme-4",
        secondary: 'bg-line text-ink px-inset hover:bg-panel',
        tertiary: 'h-max p-0 font-normal gap-3 text-ink-muted hover:text-ink',
        destroy: 'bg-danger text-background px-bevel hover:bg-danger/80'
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        <Slottable>{children}</Slottable>
        {variant === 'tertiary' && <CaretRight aria-hidden="true" weight="fill" className="transition-colors" />}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
