import React, { useState, useRef } from 'react'
import { Send, Mic, Square, Smile, Paperclip, MoreHorizontal } from 'lucide-react'
import { FuturisticButton } from '@/components/ui/futuristic-button'
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
      "sticky bottom-0 z-30 bg-background/80 backdrop-blur-xl border-t border-border/20",
      "p-6 safe-area-bottom",
      className
    )}>
      {/* Voice Mode Indicator */}
      {isListening && (
        <div className="mb-4 flex items-center justify-center animate-slide-in-up">
          <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20 shadow-glow backdrop-blur-sm">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full transition-all duration-150 ease-out animate-waveform"
                  style={{ 
                    animationDelay: `${i * 100}ms`,
                    height: '16px'
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-medium animate-gentle-pulse">Listening...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Input Container */}
          <div className="flex-1 relative">
            <div className="glass rounded-2xl border border-border/30 focus-within:border-primary/50 focus-within:shadow-glow transition-all duration-300 ease-out hover:shadow-medium">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isProcessing}
                className={cn(
                  "min-h-[56px] max-h-[120px] resize-none border-0 bg-transparent",
                  "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  "px-4 py-4 text-base leading-relaxed transition-all duration-200",
                  "placeholder:text-muted-foreground/70 placeholder:transition-colors",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                rows={1}
              />
              
              {/* Input Actions */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <FuturisticButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
                  >
                    <Paperclip className="w-4 h-4 transition-transform duration-200 hover:rotate-12" />
                  </FuturisticButton>
                  <FuturisticButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
                  >
                    <Smile className="w-4 h-4 transition-transform duration-200 hover:rotate-12" />
                  </FuturisticButton>
                </div>
                
                {/* Character count for long messages */}
                {value.length > 100 && (
                  <div className="text-xs text-muted-foreground animate-fade-in transition-colors duration-300">
                    {value.length}/1000
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Voice Button */}
            {showVoiceButton && (
              <div className="relative">
                {isListening && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-ripple" 
                       style={{
                         animationDuration: '2s',
                         animationFillMode: 'forwards'
                       }}
                  />
                )}
                <FuturisticButton
                  type="button"
                  onClick={handleVoiceToggle}
                  disabled={disabled}
                  variant={isListening ? "secondary" : "neon"}
                  size="icon"
                  className={cn(
                    "w-14 h-14 rounded-2xl transition-all duration-300 ease-out transform-gpu",
                    isListening && "animate-smooth-glow bg-destructive hover:bg-destructive/90",
                    !isListening && "hover:scale-110 shadow-glow animate-breathe",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isListening ? (
                    <Square className="w-6 h-6 text-white fill-white animate-gentle-pulse" />
                  ) : (
                    <Mic className="w-6 h-6 transition-transform duration-200" />
                  )}
                </FuturisticButton>
              </div>
            )}

            {/* Send Button */}
            {showSendButton && (
              <FuturisticButton
                type="submit"
                disabled={!value.trim() || disabled || isProcessing}
                variant="neon"
                size="icon"
                className={cn(
                  "w-14 h-14 rounded-2xl transition-all duration-300 ease-out transform-gpu",
                  "hover:scale-110 shadow-glow active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  !disabled && !isProcessing && "animate-breathe"
                )}
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-6 h-6 transition-transform duration-200 hover:translate-x-0.5" />
                )}
              </FuturisticButton>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="transition-opacity duration-200 hover:opacity-80">Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center gap-2">
            <FuturisticButton
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs transition-all duration-200 hover:scale-105"
            >
              <MoreHorizontal className="w-3 h-3 mr-1 transition-transform duration-200 hover:rotate-90" />
              More
            </FuturisticButton>
          </div>
        </div>
      </form>
    </div>
  )
}