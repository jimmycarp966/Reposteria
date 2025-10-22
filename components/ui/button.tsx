import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-md",

        // Nuevas variantes modernas con gradientes
        gradientChocolate: "gradient-chocolate text-white shadow-lg hover:shadow-xl hover:scale-105",
        gradientStrawberry: "gradient-strawberry text-white shadow-lg hover:shadow-xl hover:scale-105",
        gradientVanilla: "gradient-vanilla text-gray-800 shadow-lg hover:shadow-xl hover:scale-105",
        gradientMint: "gradient-mint text-white shadow-lg hover:shadow-xl hover:scale-105",

        // Variantes pastel
        pastelPink: "bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200 shadow-sm hover:shadow-md",
        pastelBlue: "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 shadow-sm hover:shadow-md",
        pastelGreen: "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 shadow-sm hover:shadow-md",
        pastelOrange: "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 shadow-sm hover:shadow-md",

        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }



