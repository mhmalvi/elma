import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, Smile, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onVoiceToggle?: () => void;
  isListening?: boolean;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

export const SimpleChatInput = ({
  value,
  onChange,
  onSend,
  onVoiceToggle,
  isListening = false,
  isProcessing = false,
  placeholder = "Ask about Islam, life guidance, Quran, Hadith...",
  className
}: SimpleChatInputProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isProcessing) {
      onSend(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("border-t border-border/50 bg-background/95 backdrop-blur-xl p-4", className)}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3">
          {/* Input Area */}
          <div className="flex-1 relative">
            {/* Voice Mode Indicator */}
            {isListening && (
              <div className="absolute -top-10 left-4 right-4 flex items-center justify-center">
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
                  🎤 Listening... Speak naturally
                </div>
              </div>
            )}
            
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "min-h-[52px] max-h-32 resize-none rounded-2xl border-border/50 bg-background/80 backdrop-blur-sm",
                "focus:border-primary/50 focus:ring-primary/20 pr-24 py-4 text-base",
                "placeholder:text-muted-foreground/60"
              )}
              disabled={isProcessing}
            />
            
            {/* Input Actions */}
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-accent/50 rounded-lg"
                disabled={isProcessing}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-accent/50 rounded-lg"
                disabled={isProcessing}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Voice Button */}
            {onVoiceToggle && (
              <Button
                type="button"
                onClick={onVoiceToggle}
                variant={isListening ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-2xl transition-all duration-200 hover-lift",
                  isListening && "bg-primary text-primary-foreground animate-pulse shadow-lg"
                )}
                disabled={isProcessing}
              >
                <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />
              </Button>
            )}

            {/* Send Button */}
            <Button
              type="submit"
              variant="default"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-2xl bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg hover-lift",
                (!value.trim() || isProcessing) && "opacity-50 cursor-not-allowed"
              )}
              disabled={!value.trim() || isProcessing}
            >
              {isProcessing ? (
                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Press Enter to send • Shift+Enter for new line</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Voice input available</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              More
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};