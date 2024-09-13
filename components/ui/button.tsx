import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { CaretRight } from "@phosphor-icons/react/dist/ssr"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none p-200 text-[14px] leading-[150%] tracking-normal font-bold h-[53px]",
  {
    variants: {
      variant: {
        primary: "bg-grey-900 text-white hover:bg-grey-500",
        secondary: 'bg-beige-100 text-grey-900 hover:bg-white hover:border-beige-500 hover:border-2',
        tertiary: 'h-max rounded-none p-0 font-normal',
        destroy: 'bg-red hover:bg-red/80 text-white'
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
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    if(variant === 'tertiary'){
      return (
        <div className="flex items-center gap-3 cursor-pointer text-grey-500 hover:text-grey-900">
          <Comp
            className={cn(buttonVariants({ variant, className }))}
            ref={ref}
            {...props}
          />
          <CaretRight weight="fill" className="transition-colors"/>
        </div>
      )
    }
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
