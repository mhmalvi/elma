import React from 'react'
import { Menu, Search, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import airchatbotLogo from '@/assets/airchatbot-logo.png'

interface ChatHeaderProps {
  title?: string
  subtitle?: string
  isVoiceMode?: boolean
  onMenuClick?: () => void
  onSearchClick?: () => void
  onExportClick?: () => void
  onVoiceModeToggle?: () => void
  className?: string
}

export const ChatHeader = ({
  title = "AirChatBot",
  subtitle = "Islamic AI Assistant",
  isVoiceMode = false,
  onMenuClick,
  onSearchClick,
  onExportClick,
  onVoiceModeToggle,
  className
}: ChatHeaderProps) => {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/50",
      "px-4 py-3 flex items-center justify-between",
      className
    )}>
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="p-2 hover:bg-muted/50 rounded-full"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 ring-2 ring-primary/20">
            <AvatarImage src={airchatbotLogo} alt="AirChatBot" />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground leading-none">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
              {isVoiceMode && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                  Voice Mode
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSearchClick}
          className="p-2 hover:bg-muted/50 rounded-full"
        >
          <Search className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportClick}
          className="p-2 hover:bg-muted/50 rounded-full"
        >
          <Download className="w-4 h-4" />
        </Button>
        
        {isVoiceMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onVoiceModeToggle}
            className="p-2 hover:bg-muted/50 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  )
}