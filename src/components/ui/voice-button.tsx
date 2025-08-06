import * as React from "react"
import { Mic, MicOff, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface VoiceButtonProps {
  isRecording: boolean
  isLoading: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  className?: string
}

export const VoiceButton = ({
  isRecording,
  isLoading,
  onStartRecording,
  onStopRecording,
  className
}: VoiceButtonProps) => {
  const handleClick = () => {
    if (isRecording) {
      onStopRecording()
    } else {
      onStartRecording()
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isRecording ? "destructive" : "default"}
      size="lg"
      className={cn(
        "w-20 h-20 rounded-full primary-gradient border-0 transition-all duration-300",
        isRecording && "mic-recording bg-destructive",
        !isRecording && !isLoading && "mic-pulse",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isRecording ? (
        <Square className="w-8 h-8 text-white" />
      ) : (
        <Mic className="w-8 h-8 text-white" />
      )}
    </Button>
  )
}