import React from 'react'
import { Menu, Search, Download, X, MessageCircle, Settings } from 'lucide-react'
import { FuturisticButton } from '@/components/ui/futuristic-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import airchatbotLogo from '@/assets/airchatbot-logo.png'
import { PremiumLanguageSelector } from '@/components/voice/PremiumLanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'

interface ChatHeaderProps {
  title?: string
  subtitle?: string
  isVoiceMode?: boolean
  onMenuClick?: () => void
  onSearchClick?: () => void
  onExportClick?: () => void
  onSettingsClick?: () => void
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
  onSettingsClick,
  onVoiceModeToggle,
  className
}: ChatHeaderProps) => {
  const { language, setLanguage } = useLanguage();
  return (
    <header className={cn(
      "sticky top-0 z-40 glass border-b border-border/20 backdrop-blur-xl",
      "px-6 py-4 flex items-center justify-between",
      "bg-background/80 supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <FuturisticButton
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </FuturisticButton>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20 shadow-glow">
              <AvatarImage src={airchatbotLogo} alt="AirChatBot" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">AC</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background animate-pulse" />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground leading-none">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground" lang={language} dir={language === 'ar' || language === 'ur' ? 'rtl' : 'ltr'}>
                {subtitle}
              </p>
              {isVoiceMode && (
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20 animate-pulse">
                  🎤 Voice Mode
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex">
          <PremiumLanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        </div>

        <FuturisticButton
          variant="ghost"
          size="icon"
          onClick={onSearchClick}
          className="hidden sm:flex"
        >
          <Search className="w-5 h-5" />
        </FuturisticButton>
        
        <FuturisticButton
          variant="ghost"
          size="icon"
          onClick={onExportClick}
          className="hidden sm:flex"
        >
          <Download className="w-5 h-5" />
        </FuturisticButton>

        <FuturisticButton
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="hidden sm:flex"
        >
          <Settings className="w-5 h-5" />
        </FuturisticButton>
        
        {isVoiceMode && (
          <FuturisticButton
            variant="secondary"
            size="icon"
            onClick={onVoiceModeToggle}
            className="ml-2"
          >
            <X className="w-5 h-5" />
          </FuturisticButton>
        )}
      </div>
    </header>
  )
}