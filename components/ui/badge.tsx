import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-md",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-md",
        outline: "text-foreground border-2",

        // Nuevas variantes coloridas
        success: "border-transparent bg-green-500 text-white hover:bg-green-600 shadow-md",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 shadow-md",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600 shadow-md",

        // Variantes pastel
        pastelPink: "border-transparent bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200",
        pastelBlue: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200",
        pastelGreen: "border-transparent bg-green-100 text-green-700 hover:bg-green-200 border border-green-200",
        pastelOrange: "border-transparent bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200",
        pastelPurple: "border-transparent bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200",

        // Variantes con gradientes
        gradientChocolate: "border-transparent gradient-chocolate text-white shadow-lg",
        gradientStrawberry: "border-transparent gradient-strawberry text-white shadow-lg",
        gradientMint: "border-transparent gradient-mint text-white shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }



