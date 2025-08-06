import React, { useState, useRef } from 'react'
import { Send, Mic, MicOff, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  onVoiceStart?: () => void
  onVoiceStop?: () => void
  isListening?: boolean
  isProcessing?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  onVoiceStart,
  onVoiceStop,
  isListening = false,
  isProcessing = false,
  placeholder = "Ask about Islam, life guidance, Quran, Hadith...",
  disabled = false,
  className
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onSend(value.trim())
      onChange('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      onVoiceStop?.()
    } else {
      onVoiceStart?.()
    }
  }

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  React.useEffect(() => {
    adjustTextareaHeight()
  }, [value])

  const showSendButton = value.trim().length > 0
  const showVoiceButton = !showSendButton && !isProcessing

  return (
    <div className={cn(
      "sticky bottom-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/50",
      "p-4 safe-area-bottom",
      className
    )}>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className={cn(
              "min-h-[48px] max-h-[120px] resize-none rounded-2xl border-muted-foreground/20",
              "focus:border-primary/50 focus:ring-primary/20 transition-all duration-200",
              "pr-12 py-3 px-4 text-base leading-relaxed",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
          />
          
          {/* Character count for long messages */}
          {value.length > 200 && (
            <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {value.length}/1000
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Voice Button */}
          {showVoiceButton && (
            <Button
              type="button"
              onClick={handleVoiceToggle}
              disabled={disabled}
              className={cn(
                "w-12 h-12 rounded-full transition-all duration-300",
                isListening 
                  ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
                  : "primary-gradient hover:shadow-lg hover:scale-105",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isListening ? (
                <Square className="w-5 h-5 text-white fill-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </Button>
          )}

          {/* Send Button */}
          {showSendButton && (
            <Button
              type="submit"
              disabled={!value.trim() || disabled || isProcessing}
              className={cn(
                "w-12 h-12 rounded-full primary-gradient transition-all duration-300",
                "hover:shadow-lg hover:scale-105 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Voice Status */}
      {isListening && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-1 h-4 bg-primary rounded-full animate-pulse",
                  `animation-delay-${i * 100}`
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          Listening... Tap ⏹️ to stop
        </div>
      )}
    </div>
  )
}