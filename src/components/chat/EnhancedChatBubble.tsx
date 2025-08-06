import { useState } from "react"
import { Play, Pause, Square, BookmarkPlus, BookmarkCheck, Copy, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModernCard } from "@/components/ui/modern-card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ChatMessage } from "@/hooks/useConversations"
import { formatDistanceToNow } from "date-fns"

interface EnhancedChatBubbleProps {
  message: ChatMessage
  onBookmark?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
  isBookmarked?: boolean
  className?: string
}

export const EnhancedChatBubble = ({
  message,
  onBookmark,
  onRegenerate,
  isBookmarked = false,
  className
}: EnhancedChatBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const { toast } = useToast()

  const isUser = message.role === 'user'
  const hasQdrantContext = message.qdrant_context?.used_context
  const sources = message.sources || []

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied"
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message content",
        variant: "destructive"
      })
    }
  }

  const handleBookmark = () => {
    onBookmark?.(message.id)
    toast({
      title: isBookmarked ? "Bookmark removed" : "Message bookmarked",
      description: isBookmarked ? "Removed from your bookmarks" : "Added to your bookmarks"
    })
  }

  const handleSpeak = () => {
    if (isPlaying) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div
      className={cn(
        "flex w-full animate-in slide-in-from-bottom duration-500",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className={cn("flex flex-col max-w-[85%] space-y-2", isUser ? "items-end" : "items-start")}>
        {/* Message Bubble */}
        <ModernCard
          className={cn(
            "p-4 relative group",
            isUser
              ? "primary-gradient text-white ml-8"
              : "bg-card/50 backdrop-blur-sm mr-8 border-border/50"
          )}
          hover={false}
        >
          {/* Context Indicator */}
          {hasQdrantContext && !isUser && (
            <div className="absolute -top-2 -left-2">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                📚 Contextual
              </Badge>
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-2">
            <p className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap",
              isUser ? "text-white" : "text-foreground"
            )}>
              {message.content}
            </p>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <p className={cn("text-xs font-medium mb-1", isUser ? "text-white/80" : "text-muted-foreground")}>
                  Sources:
                </p>
                <div className="space-y-1">
                  {sources.map((source, index) => (
                    <div key={index} className={cn("text-xs", isUser ? "text-white/70" : "text-muted-foreground")}>
                      {source.verse && <span>📖 {source.verse}</span>}
                      {source.hadith && <span>📚 {source.hadith}</span>}
                      {source.reference && <span>🔗 {source.reference}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "absolute -bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "-right-2" : "-left-2"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="w-8 h-8 p-0 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
            >
              <Copy className="w-3 h-3" />
            </Button>

            {!isUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeak}
                  className="w-8 h-8 p-0 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={cn(
                    "w-8 h-8 p-0 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm",
                    isBookmarked && "text-primary"
                  )}
                >
                  {isBookmarked ? <BookmarkCheck className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                </Button>

                {onRegenerate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerate(message.id)}
                    className="w-8 h-8 p-0 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        </ModernCard>

        {/* Timestamp */}
        <p className={cn(
          "text-xs text-muted-foreground px-2",
          isUser ? "text-right" : "text-left"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}