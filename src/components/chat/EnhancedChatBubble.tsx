import React, { useState } from 'react'
import { Copy, Volume2, Bookmark, ThumbsUp, Play, Pause, RotateCcw, Share, MoreVertical } from 'lucide-react'
import { FuturisticButton } from '@/components/ui/futuristic-button'
import { FuturisticCard } from '@/components/ui/futuristic-card'
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
  const [showActions, setShowActions] = useState(false)

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
      "group mb-8 animate-fade-in max-w-4xl mx-auto",
      className
    )}>
      <div className={cn(
        "flex gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className={cn(
            "w-10 h-10 ring-2 transition-all duration-200 shadow-glow",
            isUser 
              ? "ring-primary/30 bg-primary/10" 
              : "ring-spiritual/30 bg-card"
          )}>
            {!isUser && <AvatarImage src={airchatbotLogo} alt="AirChatBot" />}
            <AvatarFallback className={cn(
              "text-sm font-medium",
              isUser ? "text-primary bg-primary/10" : "text-spiritual bg-spiritual/10"
            )}>
              {isUser ? "You" : "AI"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Message Content */}
        <div className={cn(
          "flex-1 min-w-0",
          isUser && "flex flex-col items-end"
        )}>
          {/* Context Badges */}
          {!isUser && hasContext && (
            <div className={cn(
              "flex flex-wrap gap-2 mb-3",
              isUser ? "justify-end" : "justify-start"
            )}>
              {sources.slice(0, 3).map((source, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-spiritual/10 text-spiritual border-spiritual/20 px-2 py-1"
                >
                  {source.source_type === 'quran' ? '📖 Quran' : '📚 Hadith'}
                </Badge>
              ))}
              {sources.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{sources.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <FuturisticCard 
            variant="glass" 
            className={cn(
              "relative p-6 transition-all duration-200 max-w-[85%]",
              isUser 
                ? "bg-primary/5 border-primary/20 ml-auto" 
                : "bg-card border-border/30",
              "hover:shadow-glow group-hover:border-primary/30"
            )}
          >
            {/* Message Text */}
            <div className={cn(
              "prose prose-sm max-w-none leading-relaxed",
              isUser ? "text-foreground" : "text-foreground",
              "[&>p]:mb-0 [&>p:not(:last-child)]:mb-3"
            )}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>

            {/* Timestamp */}
            <div className={cn(
              "text-xs text-muted-foreground mt-3 flex items-center gap-2",
              isUser ? "justify-end" : "justify-start"
            )}>
              <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
              {!isUser && (
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              )}
              {!isUser && <span>AI Response</span>}
            </div>

            {/* Action Buttons */}
            {!isUser && (
            <div className={cn(
              "flex items-center gap-1 mt-4 pt-3 border-t border-border/30",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            )}>
                <FuturisticButton
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-3 text-xs"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copy
                </FuturisticButton>
                
                <FuturisticButton
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeak}
                  className="h-8 px-3 text-xs"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 mr-2" />
                  ) : (
                    <Play className="w-3 h-3 mr-2" />
                  )}
                  {isPlaying ? 'Stop' : 'Listen'}
                </FuturisticButton>
                
                <FuturisticButton
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={cn(
                    "h-8 px-3 text-xs",
                    isBookmarked && "text-primary bg-primary/10"
                  )}
                >
                  <Bookmark className={cn(
                    "w-3 h-3 mr-2",
                    isBookmarked && "fill-current"
                  )} />
                  {isBookmarked ? 'Saved' : 'Save'}
                </FuturisticButton>
                
                <FuturisticButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction('👍')}
                  className="h-8 px-3 text-xs"
                >
                  <ThumbsUp className="w-3 h-3 mr-2" />
                  Like
                </FuturisticButton>

                {onRegenerate && (
                  <FuturisticButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerate(message.id)}
                    className="h-8 px-3 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Regenerate
                  </FuturisticButton>
                )}

                <FuturisticButton
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-auto"
                >
                  <MoreVertical className="w-3 h-3" />
                </FuturisticButton>
              </div>
            )}

            {/* Reactions */}
            {Object.keys(reactions).length > 0 && (
              <div className="flex gap-2 mt-3">
                {Object.entries(reactions).map(([reaction, count]) => (
                  <Badge key={reaction} variant="secondary" className="text-xs px-2 py-1">
                    {reaction} {count}
                  </Badge>
                ))}
              </div>
            )}
          </FuturisticCard>

          {/* Sources */}
          {!isUser && sources.length > 0 && (
            <div className={cn(
              "mt-4 max-w-[85%]",
              isUser ? "ml-auto" : "mr-auto"
            )}>
              <details className="group/details">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-2 p-3 glass rounded-lg border border-border/30">
                  📚 View Islamic sources ({sources.length})
                  <span className="ml-auto text-xs">Click to expand</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {sources.map((source, index) => (
                    <FuturisticCard key={index} variant="minimal" className="p-4">
                      <div className="text-sm font-medium text-spiritual mb-2">
                        {source.reference || `${source.source_type} Reference`}
                      </div>
                      {source.content && (
                        <div className="text-sm text-muted-foreground line-clamp-3">
                          {source.content.substring(0, 200)}...
                        </div>
                      )}
                    </FuturisticCard>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
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