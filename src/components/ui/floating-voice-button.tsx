import * as React from "react"
import { Volume2, VolumeX, Waves } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface WaveformProps {
  isActive: boolean
  bars?: number
  className?: string
}

export const Waveform = ({ isActive, bars = 5, className }: WaveformProps) => {
  const [waveHeights, setWaveHeights] = React.useState<number[]>(
    Array.from({ length: bars }, () => 8)
  )

  React.useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setWaveHeights(prev => 
          prev.map(() => Math.random() * 20 + 4)
        )
      }, 150)
      return () => clearInterval(interval)
    } else {
      setWaveHeights(Array.from({ length: bars }, () => 8))
    }
  }, [isActive, bars])

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {waveHeights.map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-current rounded-full transition-all duration-150 ease-out",
            isActive 
              ? "opacity-100" 
              : "opacity-40"
          )}
          style={{
            height: `${height}px`,
            transform: isActive ? `scaleY(${0.8 + Math.sin(Date.now() * 0.001 + i) * 0.3})` : 'scaleY(1)',
            animationDelay: `${i * 50}ms`
          }}
        />
      ))}
    </div>
  )
}

interface FloatingVoiceButtonProps {
  isRecording: boolean
  isLoading: boolean
  transcript?: string
  onStartRecording: () => void
  onStopRecording: () => void
  className?: string
}

export const FloatingVoiceButton = ({
  isRecording,
  isLoading,
  transcript,
  onStartRecording,
  onStopRecording,
  className
}: FloatingVoiceButtonProps) => {
  const [ripples, setRipples] = React.useState<number[]>([])
  const [isPressed, setIsPressed] = React.useState(false)

  React.useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRipples(prev => [...prev, Date.now()])
      }, 600)
      
      return () => clearInterval(interval)
    } else {
      setRipples([])
    }
  }, [isRecording])

  React.useEffect(() => {
    const cleanup = setInterval(() => {
      setRipples(prev => prev.filter(time => Date.now() - time < 2500))
    }, 100)
    
    return () => clearInterval(cleanup)
  }, [])

  const handlePress = () => {
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)
    
    if (isRecording) {
      onStopRecording()
    } else {
      onStartRecording()
    }
  }

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Transcript Preview */}
      {transcript && (
        <div className="mb-4 px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full shadow-medium border border-border animate-slide-in-up transform transition-all duration-500 ease-out">
          <p className="text-sm text-muted-foreground italic animate-fade-in">
            {transcript}
          </p>
        </div>
      )}

      {/* Voice Button with Ripples */}
      <div className="relative">
        {/* Ripple Effects */}
        {ripples.map((rippleTime) => (
          <div
            key={rippleTime}
            className="absolute inset-0 border-2 border-primary/40 rounded-full animate-ripple"
            style={{
              animationDuration: '2.5s',
              animationFillMode: 'forwards',
              animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          />
        ))}
        
        {/* Main Button */}
        <Button
          onMouseDown={handlePress}
          onTouchStart={handlePress}
          disabled={isLoading}
          className={cn(
            "relative w-20 h-20 rounded-full border-0 shadow-floating transition-all duration-300 ease-out",
            "hover:scale-110 active:scale-95 transform-gpu",
            isRecording 
              ? "bg-destructive hover:bg-destructive/90 animate-smooth-glow" 
              : "primary-gradient hover:shadow-large",
            isLoading && "opacity-50 cursor-not-allowed",
            !isRecording && !isLoading && "animate-breathe",
            isPressed && "scale-90",
            "before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
          )}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 border-2 border-white/80 border-t-white rounded-full animate-spin" />
            </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center gap-1 animate-fade-in">
              <VolumeX className="w-6 h-6 text-white animate-gentle-pulse" />
              <Waveform isActive={true} bars={3} className="text-white" />
            </div>
          ) : (
            <div className="flex flex-col items-center transform transition-transform duration-200">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
          )}
        </Button>
      </div>

      {/* Status Text */}
      <div className="mt-3 text-center">
        <p className={cn(
          "text-xs font-medium transition-all duration-300 ease-out",
          isRecording ? "text-destructive animate-gentle-pulse" : "text-muted-foreground",
          isLoading && "animate-pulse"
        )}>
          {isLoading 
            ? "Processing..." 
            : isRecording 
              ? "Listening... Tap to stop" 
              : "Tap to speak"}
        </p>
      </div>
    </div>
  )
}