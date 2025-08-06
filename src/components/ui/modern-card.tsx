import * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModernCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  gradient?: "primary" | "spiritual" | "calm" | "subtle"
}

export const ModernCard = ({ 
  children, 
  className, 
  onClick, 
  hover = true,
  gradient
}: ModernCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 shadow-soft",
        "transition-all duration-300",
        hover && "hover:shadow-medium hover:-translate-y-1 cursor-pointer",
        onClick && "active:scale-[0.98]",
        gradient === "primary" && "primary-gradient text-primary-foreground",
        gradient === "spiritual" && "spiritual-gradient text-spiritual-foreground", 
        gradient === "calm" && "calm-gradient text-white",
        gradient === "subtle" && "subtle-gradient",
        !gradient && "bg-card text-card-foreground",
        className
      )}
    >
      {children}
      {onClick && (
        <div className="absolute top-4 right-4 opacity-50 transition-opacity duration-300 group-hover:opacity-100">
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient?: "primary" | "spiritual" | "calm"
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
    <ModernCard className={cn("p-6 group", className)} hover>
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-medium",
          gradient === "primary" && "primary-gradient",
          gradient === "spiritual" && "spiritual-gradient", 
          gradient === "calm" && "calm-gradient"
        )}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </ModernCard>
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
        "transition-all duration-500",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
}