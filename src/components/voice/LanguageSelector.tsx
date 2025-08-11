import React from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

interface LanguageSelectorProps {
  currentLanguage: string;
  detectedLanguage?: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'bn-BD', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'ar-SA', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur-PK', name: 'اردو', flag: '🇵🇰', rtl: true },
];

export const LanguageSelector = ({ 
  currentLanguage, 
  detectedLanguage,
  onLanguageChange,
  className 
}: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  const detectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === detectedLanguage);

  return (
    <div className={cn("relative", className)}>
      {/* Main selector button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative overflow-hidden transition-all duration-500",
          "bg-gradient-to-r from-card/80 to-secondary/40",
          "border border-border/30 hover:border-primary/40",
          "backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10",
          "min-w-[140px] justify-between"
        )}
      >
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors duration-300" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLang.flag}</span>
            <span className="font-medium text-sm">{currentLang.code.split('-')[0].toUpperCase()}</span>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-300",
          isOpen && "rotate-180"
        )} />
        
        {/* Hover glow */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>

      {/* Detection indicator */}
      {detectedLang && detectedLang.code !== currentLanguage && (
        <div className={cn(
          "absolute -top-2 -right-2 px-2 py-1 rounded-full",
          "bg-spiritual text-spiritual-foreground text-xs font-medium",
          "animate-gentle-pulse shadow-lg"
        )}>
          Detected: {detectedLang.flag}
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 mt-2 w-full min-w-[200px] z-[9999]",
          "bg-card",
          "border border-border/40 rounded-xl shadow-2xl",
          "animate-slide-in-up"
        )}>
          <div className="p-2 space-y-1">
            {SUPPORTED_LANGUAGES.map((language) => {
              const isSelected = language.code === currentLanguage;
              const isDetected = language.code === detectedLanguage;
              
              return (
                <button
                  key={language.code}
                  onClick={() => {
                    onLanguageChange(language.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg",
                    "transition-all duration-300 group relative overflow-hidden",
                    isSelected 
                      ? "bg-primary/10 border border-primary/30" 
                      : "hover:bg-secondary/50 border border-transparent",
                    "text-left"
                  )}
                  dir={language.rtl ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{language.flag}</span>
                    <div>
                      <div className={cn(
                        "font-medium transition-colors duration-300",
                        isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {language.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language.code}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isDetected && (
                      <div className="px-2 py-1 rounded-full bg-spiritual/20 text-spiritual text-xs">
                        Auto
                      </div>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              );
            })}
          </div>
          
          {/* Auto-detect footer */}
          <div className="border-t border-border/20 p-3">
            <div className="text-xs text-muted-foreground text-center">
              🤖 Auto-detection enabled
            </div>
          </div>
        </div>
      )}
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};