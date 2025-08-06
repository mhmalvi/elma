import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingDotsProps {
  className?: string
}

export const LoadingDots = ({ className }: LoadingDotsProps) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="w-2 h-2 bg-primary rounded-full animate-pulse"
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}