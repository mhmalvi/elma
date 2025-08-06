import * as React from "react"
import { Quote } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyVerseProps {
  verse: string
  reference: string
  className?: string
}

export const DailyVerse = ({ verse, reference, className }: DailyVerseProps) => {
  return (
    <div className={cn(
      "relative p-6 rounded-2xl overflow-hidden",
      "bg-gradient-to-br from-primary/5 to-spiritual/5",
      "border border-primary/20",
      className
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 text-6xl text-primary">
          <Quote />
        </div>
      </div>
      
      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <span className="text-sm font-medium text-primary">Verse of the Day</span>
        </div>
        
        <blockquote className="text-base leading-relaxed text-foreground font-medium italic">
          "{verse}"
        </blockquote>
        
        <cite className="text-sm text-muted-foreground font-medium">
          — {reference}
        </cite>
      </div>
    </div>
  )
}

interface FloatingParticlesProps {
  count?: number
  className?: string
}

export const FloatingParticles = ({ count = 6, className }: FloatingParticlesProps) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 20,
    duration: Math.random() * 10 + 15
  }))

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/10 animate-pulse"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
    </div>
  )
}