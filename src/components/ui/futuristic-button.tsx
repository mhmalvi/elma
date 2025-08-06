import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const futuristicButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-glow hover:shadow-neon hover:scale-105",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-glow",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        neon: "gradient-primary text-primary-foreground neon-glow hover:shadow-neon hover:scale-105",
        glass: "glass text-foreground hover:glass-strong hover:shadow-glow",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground neon-border",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8",
        xl: "h-16 rounded-2xl px-12 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface FuturisticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof futuristicButtonVariants> {
  asChild?: boolean
}

const FuturisticButton = React.forwardRef<HTMLButtonElement, FuturisticButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(futuristicButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    )
  }
)
FuturisticButton.displayName = "FuturisticButton"

export { FuturisticButton, futuristicButtonVariants }