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
  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-current rounded-full transition-all duration-200",
            isActive 
              ? "animate-pulse" 
              : "h-2 opacity-40"
          )}
          style={{
            height: isActive ? `${Math.random() * 16 + 8}px` : '8px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`
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

  React.useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRipples(prev => [...prev, Date.now()])
      }, 500)
      
      return () => clearInterval(interval)
    } else {
      setRipples([])
    }
  }, [isRecording])

  React.useEffect(() => {
    const cleanup = setInterval(() => {
      setRipples(prev => prev.filter(time => Date.now() - time < 2000))
    }, 100)
    
    return () => clearInterval(cleanup)
  }, [])

  const handlePress = () => {
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
        <div className="mb-4 px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full shadow-medium border border-border animate-scale-bounce">
          <p className="text-sm text-muted-foreground italic">
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
            className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping"
            style={{
              animationDuration: '2s',
              animationDelay: `${(Date.now() - rippleTime) / 1000}s`
            }}
          />
        ))}
        
        {/* Main Button */}
        <Button
          onMouseDown={handlePress}
          onTouchStart={handlePress}
          disabled={isLoading}
          className={cn(
            "relative w-20 h-20 rounded-full border-0 shadow-floating transition-all duration-300",
            "hover:scale-105 active:scale-95",
            isRecording 
              ? "bg-destructive hover:bg-destructive/90 mic-recording" 
              : "primary-gradient hover:shadow-large",
            isLoading && "opacity-50 cursor-not-allowed",
            !isRecording && !isLoading && "breathe"
          )}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center gap-1">
              <VolumeX className="w-6 h-6 text-white" />
              <Waveform isActive={true} bars={3} className="text-white" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
          )}
        </Button>
      </div>

      {/* Status Text */}
      <div className="mt-3 text-center">
        <p className="text-xs font-medium text-muted-foreground">
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