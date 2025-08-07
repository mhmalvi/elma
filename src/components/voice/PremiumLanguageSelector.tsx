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

const PREMIUM_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', whisperCode: 'en', webSpeechCode: 'en-US' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, whisperCode: 'ar', webSpeechCode: 'ar-SA' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', whisperCode: 'bn', webSpeechCode: 'bn-BD' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true, whisperCode: 'ur', webSpeechCode: 'ur-PK' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', whisperCode: 'hi', webSpeechCode: 'hi-IN' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', whisperCode: 'tr', webSpeechCode: 'tr-TR' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', whisperCode: 'fr', webSpeechCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', whisperCode: 'de', webSpeechCode: 'de-DE' },
];

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

  const selectedLang = PREMIUM_LANGUAGES.find(lang => lang.code === currentLanguage) || PREMIUM_LANGUAGES[0];
  const detectedLang = PREMIUM_LANGUAGES.find(lang => lang.code === detectedLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative z-50", className)} ref={dropdownRef}>
      {/* Main Language Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 px-6 rounded-2xl transition-all duration-500 bg-card/80 backdrop-blur-xl",
          "border border-border/50 hover:border-primary/30 hover:bg-card/90",
          "shadow-lg hover:shadow-xl hover:scale-105",
          isListening && "animate-gentle-pulse border-primary/50 bg-primary/5",
          isOpen && "border-primary/50 bg-primary/5 shadow-xl scale-105"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Globe className={cn(
              "w-5 h-5 transition-all duration-300",
              isListening ? "text-primary animate-spin" : "text-muted-foreground"
            )} />
            {isListening && (
              <div className="absolute -inset-1 rounded-full bg-primary/20 animate-ping" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedLang.flag}</span>
            <div className="text-left">
              <div className="font-medium text-sm">{selectedLang.name}</div>
              <div className={cn(
                "text-xs text-muted-foreground",
                selectedLang.rtl && "font-arabic"
              )}>
                {selectedLang.nativeName}
              </div>
            </div>
          </div>

          {detectedLang && detectedLang.code !== currentLanguage && (
            <Badge variant="secondary" className="ml-2 text-xs animate-pulse">
              <Mic className="w-3 h-3 mr-1" />
              Detected: {detectedLang.flag}
            </Badge>
          )}

          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-300",
            isOpen && "rotate-180"
          )} />
        </div>
      </Button>

      {/* Premium Dropdown */}
      {isOpen && (
        <Card className={cn(
          "absolute top-16 left-0 w-80 p-2 z-50 animate-slide-in-up",
          "bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl",
          "rounded-2xl"
        )}>
          <div className="space-y-1">
            {PREMIUM_LANGUAGES.map((language) => (
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
                    <div className={cn(
                      "text-xs text-muted-foreground",
                      language.rtl && "font-arabic text-right"
                    )}>
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
        </Card>
      )}
    </div>
  );
};