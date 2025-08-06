import * as React from "react"
import { ArrowLeft, MoreVertical } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TopAppBarProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
  transparent?: boolean
}

export const TopAppBar = ({
  title,
  showBack = false,
  onBack,
  actions,
  className,
  transparent = false
}: TopAppBarProps) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={cn(
      "sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border/50",
      transparent 
        ? "bg-background/80 backdrop-blur-md" 
        : "bg-background",
      className
    )}>
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="hover:bg-muted/50 rounded-full p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-lg font-display font-semibold text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {actions}
      </div>
    </div>
  )
}