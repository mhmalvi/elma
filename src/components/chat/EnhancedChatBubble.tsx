import React, { useState } from 'react'
import { Copy, Volume2, Bookmark, ThumbsUp, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModernCard } from '@/components/ui/modern-card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookmarkDialog } from '@/components/bookmarks/BookmarkDialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ChatMessage } from '@/hooks/useConversations'
import { formatDistanceToNow } from 'date-fns'
import airchatbotLogo from '@/assets/airchatbot-logo.png'

interface EnhancedChatBubbleProps {
  message: ChatMessage
  onBookmark?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
  onReaction?: (messageId: string, reaction: string) => void
  isBookmarked?: boolean
  className?: string
}

export const EnhancedChatBubble = ({
  message,
  onBookmark,
  onRegenerate,
  onReaction,
  isBookmarked = false,
  className
}: EnhancedChatBubbleProps) => {
  const { toast } = useToast()
  const [isPlaying, setIsPlaying] = useState(false)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [reactions, setReactions] = useState<Record<string, number>>({})

  const isUser = message.role === 'user'
  const hasContext = message.sources && message.sources.length > 0
  const sources = message.sources || []

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully"
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive"
      })
    }
  }

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(message.id)
    } else {
      setShowBookmarkDialog(true)
    }
  }

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel()
        setIsPlaying(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(message.content)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.onstart = () => setIsPlaying(true)
        utterance.onend = () => setIsPlaying(false)
        utterance.onerror = () => setIsPlaying(false)
        
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  const handleReaction = (reaction: string) => {
    setReactions(prev => ({
      ...prev,
      [reaction]: (prev[reaction] || 0) + 1
    }))
    onReaction?.(message.id, reaction)
    toast({
      title: "Reaction added",
      description: `Added ${reaction} reaction`
    })
  }

  return (
    <div className={cn(
      "flex gap-3 mb-6 group animate-fade-in",
      isUser ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className={cn(
          "w-8 h-8 ring-2 transition-all duration-200",
          isUser 
            ? "ring-primary/20 bg-primary/10" 
            : "ring-spiritual/20 bg-card"
        )}>
          {!isUser && <AvatarImage src={airchatbotLogo} alt="AirChatBot" />}
          <AvatarFallback className={cn(
            "text-xs font-medium",
            isUser ? "text-primary" : "text-spiritual"
          )}>
            {isUser ? "You" : "AC"}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[85%]",
        isUser && "flex flex-col items-end"
      )}>
        <ModernCard className={cn(
          "relative transition-all duration-200 hover-scale",
          isUser 
            ? "bg-primary text-primary-foreground ml-8" 
            : "bg-card hover:shadow-md mr-8",
          "group-hover:shadow-lg"
        )}>
          {/* Context Badges */}
          {!isUser && hasContext && (
            <div className="flex flex-wrap gap-1 mb-3">
              {sources.slice(0, 2).map((source, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-spiritual/10 text-spiritual border-spiritual/20"
                >
                  {source.source_type === 'quran' ? '📖 Quran' : '📚 Hadith'}
                </Badge>
              ))}
              {sources.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{sources.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* Message Text */}
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser ? "prose-invert" : "prose-slate dark:prose-invert",
            "leading-relaxed"
          )}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Action Buttons */}
          {!isUser && (
            <div className={cn(
              "flex items-center gap-1 mt-3 pt-3 border-t border-border/50",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            )}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2 text-xs hover:bg-muted/50"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSpeak}
                className="h-8 px-2 text-xs hover:bg-muted/50"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 mr-1" />
                ) : (
                  <Play className="w-3 h-3 mr-1" />
                )}
                {isPlaying ? 'Stop' : 'Listen'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={cn(
                  "h-8 px-2 text-xs hover:bg-muted/50",
                  isBookmarked && "text-primary"
                )}
              >
                <Bookmark className={cn(
                  "w-3 h-3 mr-1",
                  isBookmarked && "fill-current"
                )} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('👍')}
                className="h-8 px-2 text-xs hover:bg-muted/50"
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                Like
              </Button>

              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerate(message.id)}
                  className="h-8 px-2 text-xs hover:bg-muted/50"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
          )}

          {/* Reactions */}
          {Object.keys(reactions).length > 0 && (
            <div className="flex gap-1 mt-2">
              {Object.entries(reactions).map(([reaction, count]) => (
                <Badge key={reaction} variant="secondary" className="text-xs">
                  {reaction} {count}
                </Badge>
              ))}
            </div>
          )}
        </ModernCard>

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-muted-foreground mt-1 px-2",
          isUser ? "text-right" : "text-left"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </div>

        {/* Sources */}
        {!isUser && sources.length > 0 && (
          <div className="mt-2 mr-8">
            <details className="group/details">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                📚 View Islamic sources ({sources.length})
              </summary>
              <div className="mt-2 space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="text-xs bg-muted/30 rounded-lg p-2">
                    <div className="font-medium text-spiritual">
                      {source.reference || `${source.source_type} Reference`}
                    </div>
                    {source.content && (
                      <div className="text-muted-foreground mt-1 line-clamp-2">
                        {source.content.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Bookmark Dialog */}
      {showBookmarkDialog && (
        <BookmarkDialog
          open={showBookmarkDialog}
          onOpenChange={setShowBookmarkDialog}
          messageId={message.id}
        />
      )}
    </div>
  )
}