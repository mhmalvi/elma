import * as React from "react"
import { cn } from "@/lib/utils"

interface FuturisticCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "glass" | "neon" | "minimal"
  interactive?: boolean
  glowOnHover?: boolean
}

export const FuturisticCard = React.forwardRef<HTMLDivElement, FuturisticCardProps>(
  ({ children, className, variant = "default", interactive = false, glowOnHover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl border transition-all duration-300",
          // Base styles
          variant === "default" && "bg-card text-card-foreground border-border/50 shadow-lg",
          variant === "glass" && "glass border-border/30",
          variant === "neon" && "bg-card/50 neon-border shadow-glow",
          variant === "minimal" && "bg-card/80 border-border/30 backdrop-blur-sm",
          // Interactive states
          interactive && "cursor-pointer hover:scale-[1.02] hover-lift",
          glowOnHover && "hover:shadow-neon",
          className
        )}
        {...props}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

FuturisticCard.displayName = "FuturisticCard"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient?: "primary" | "secondary" | "accent"
  className?: string
}

export const FeatureCard = ({
  icon,
  title,
  description,
  gradient = "primary",
  className
}: FeatureCardProps) => {
  return (
    <FuturisticCard className={cn("p-6 group", className)} interactive glowOnHover>
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-glow",
          gradient === "primary" && "gradient-primary",
          gradient === "secondary" && "gradient-secondary", 
          gradient === "accent" && "bg-accent"
        )}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg text-foreground group-hover:neon-text transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </FuturisticCard>
  )
}

interface AnimatedCardProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export const AnimatedCard = ({ children, delay = 0, className }: AnimatedCardProps) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={cn(
        "transition-all duration-700",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  )
}