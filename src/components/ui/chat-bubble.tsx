import * as React from "react"
import { Play, Pause, BookOpen, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ChatBubbleProps {
  message: string
  isUser: boolean
  audioUrl?: string
  source?: {
    verse?: string
    hadith?: string
    reference?: string
  }
  onExplainMore?: () => void
  onBookmark?: () => void
  className?: string
}

export const ChatBubble = ({
  message,
  isUser,
  audioUrl,
  source,
  onExplainMore,
  onBookmark,
  className
}: ChatBubbleProps) => {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    if (audioUrl) {
      const audioElement = new Audio(audioUrl)
      audioElement.addEventListener('ended', () => setIsPlaying(false))
      setAudio(audioElement)
      
      return () => {
        audioElement.pause()
        audioElement.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [audioUrl])

  const handlePlayPause = () => {
    if (!audio) return
    
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className={cn(
      "flex w-full animate-slide-in-up",
      isUser ? "justify-end animate-slide-in-right" : "justify-start animate-slide-in-left",
      className
    )}>
      <Card className={cn(
        "max-w-[80%] p-4 shadow-medium transition-all duration-300 hover:shadow-large transform hover:scale-[1.02]",
        isUser 
          ? "primary-gradient text-primary-foreground ml-4" 
          : "bg-card text-card-foreground mr-4"
      )}>
        <div className="space-y-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
            {message}
          </p>
          
          {source && (
            <div className="text-xs opacity-80 border-t pt-2 mt-2 space-y-1 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {source.verse && (
                <div className="flex items-center gap-1 transition-all duration-200 hover:opacity-100">
                  <BookOpen className="w-3 h-3 transition-transform duration-200 hover:scale-110" />
                  <span>Quran: {source.verse}</span>
                </div>
              )}
              {source.hadith && (
                <div className="flex items-center gap-1 transition-all duration-200 hover:opacity-100">
                  <ExternalLink className="w-3 h-3 transition-transform duration-200 hover:scale-110" />
                  <span>Hadith: {source.hadith}</span>
                </div>
              )}
              {source.reference && (
                <div className="text-xs opacity-60 transition-opacity duration-200 hover:opacity-80">
                  {source.reference}
                </div>
              )}
            </div>
          )}
          
          {!isUser && (
            <div className="flex gap-2 pt-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {audioUrl && (
                <Button
                  onClick={handlePlayPause}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs transition-all duration-200 hover:scale-105 hover:shadow-medium"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 mr-1 animate-gentle-pulse" />
                  ) : (
                    <Play className="w-3 h-3 mr-1 transition-transform duration-200 hover:scale-110" />
                  )}
                  {isPlaying ? "Pause" : "Listen"}
                </Button>
              )}
              
              {onExplainMore && (
                <Button
                  onClick={onExplainMore}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs transition-all duration-200 hover:scale-105 hover:shadow-medium"
                >
                  Explain more
                </Button>
              )}
              
              {onBookmark && (
                <Button
                  onClick={onBookmark}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs transition-all duration-200 hover:scale-105 hover:shadow-medium"
                >
                  <BookOpen className="w-3 h-3 mr-1 transition-transform duration-200 hover:scale-110" />
                  Save
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}