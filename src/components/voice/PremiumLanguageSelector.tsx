import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, ChevronDown, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
  whisperCode: string;
  webSpeechCode: string;
}
const PREMIUM_LANGUAGES: Language[] = [{
  code: 'en',
  name: 'English',
  nativeName: 'English',
  flag: '🇺🇸',
  whisperCode: 'en',
  webSpeechCode: 'en-US'
}, {
  code: 'ar',
  name: 'Arabic',
  nativeName: 'العربية',
  flag: '🇸🇦',
  rtl: true,
  whisperCode: 'ar',
  webSpeechCode: 'ar-SA'
}, {
  code: 'bn',
  name: 'Bengali',
  nativeName: 'বাংলা',
  flag: '🇧🇩',
  whisperCode: 'bn',
  webSpeechCode: 'bn-BD'
}, {
  code: 'ur',
  name: 'Urdu',
  nativeName: 'اردو',
  flag: '🇵🇰',
  rtl: true,
  whisperCode: 'ur',
  webSpeechCode: 'ur-PK'
}, {
  code: 'hi',
  name: 'Hindi',
  nativeName: 'हिन्दी',
  flag: '🇮🇳',
  whisperCode: 'hi',
  webSpeechCode: 'hi-IN'
}, {
  code: 'tr',
  name: 'Turkish',
  nativeName: 'Türkçe',
  flag: '🇹🇷',
  whisperCode: 'tr',
  webSpeechCode: 'tr-TR'
}, {
  code: 'fr',
  name: 'French',
  nativeName: 'Français',
  flag: '🇫🇷',
  whisperCode: 'fr',
  webSpeechCode: 'fr-FR'
}, {
  code: 'de',
  name: 'German',
  nativeName: 'Deutsch',
  flag: '🇩🇪',
  whisperCode: 'de',
  webSpeechCode: 'de-DE'
}];
interface PremiumLanguageSelectorProps {
  currentLanguage: string;
  detectedLanguage?: string;
  onLanguageChange: (language: string) => void;
  isListening?: boolean;
  className?: string;
}
export const PremiumLanguageSelector = ({
  currentLanguage,
  detectedLanguage,
  onLanguageChange,
  isListening = false,
  className
}: PremiumLanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const selectedLang = PREMIUM_LANGUAGES.find(lang => lang.code === currentLanguage || currentLanguage?.startsWith(lang.code)) || PREMIUM_LANGUAGES[0];
  const detectedLang = PREMIUM_LANGUAGES.find(lang => lang.code === detectedLanguage || detectedLanguage?.startsWith(lang.code));

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = 320; // w-80
      const left = Math.min(rect.left + window.scrollX, window.innerWidth - width - 16);
      const top = rect.bottom + 8 + window.scrollY;
      setMenuPos({ top, left, width });
    }
  }, [isOpen]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return <div className={cn("relative z-[9999]", className)} ref={dropdownRef}>
      {/* Main Language Button */}
      <Button
        ref={buttonRef}
        variant="outline"
        className={cn(
          "h-10 px-3 rounded-xl flex items-center gap-2 border-border/60",
          "bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40"
        )}
        onClick={() => setIsOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select language, current ${selectedLang.name}`}
      >
        <span className="text-xl leading-none">{selectedLang.flag}</span>
        <span className="text-sm font-medium">{selectedLang.name}</span>
        {detectedLang && detectedLang.code !== currentLanguage && (
          <Badge variant="secondary" className="text-[10px] ml-2">
            <Mic className="w-3 h-3 mr-1" />
            {detectedLang.name}
          </Badge>
        )}
        <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {/* Premium Dropdown */}
      {isOpen && (
        <Card
          className={cn(
            "fixed w-80 p-2 z-[9999] animate-slide-in-up",
            "bg-card border border-border/50 shadow-2xl",
            "rounded-2xl max-h-[70vh] overflow-y-auto"
          )}
          style={{ top: menuPos?.top ?? 0, left: menuPos?.left ?? 0, width: menuPos?.width ?? 320 }}
        >
          <div className="space-y-1">
            {PREMIUM_LANGUAGES.map(language => (
              <Button
                key={language.code}
                variant="ghost"
                onClick={() => {
                  onLanguageChange(language.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full justify-start h-12 rounded-xl transition-all duration-300",
                  "hover:bg-primary/10 hover:scale-[1.02]",
                  language.code === currentLanguage && "bg-primary/15 shadow-md",
                  language.code === detectedLanguage && language.code !== currentLanguage && "bg-accent/10"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl">{language.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{language.name}</div>
                    <div className={cn("text-xs text-muted-foreground", language.rtl && "font-arabic text-right")}>
                      {language.nativeName}
                    </div>
                  </div>

                  {language.code === currentLanguage && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}

                  {language.code === detectedLanguage && language.code !== currentLanguage && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      <Mic className="w-3 h-3 mr-1" />
                      Detected
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {/* Detection Status */}
          <div className="mt-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-gentle-pulse" />
              Auto-detection active
            </div>
          </div>
        </Card>)}
    </div>;
};