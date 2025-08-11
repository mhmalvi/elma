import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import i18n from '@/i18n';

export type AppLanguageCode = 'en' | 'ar' | 'bn' | 'hi' | 'ur';

export interface AppLanguage {
  code: AppLanguageCode;
  name: string;
  nativeName: string;
  rtl?: boolean;
  webSpeechCode: string; // e.g., en-US, ar-SA
}

const LANGUAGES: AppLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', webSpeechCode: 'en-US' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, webSpeechCode: 'ar-SA' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', webSpeechCode: 'bn-BD' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', webSpeechCode: 'hi-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true, webSpeechCode: 'ur-PK' },
];

function getDefaultLanguage(): AppLanguageCode {
  const saved = localStorage.getItem('app.language') as AppLanguageCode | null;
  if (saved && LANGUAGES.find(l => l.code === saved)) return saved;
  // Try browser language
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('bn')) return 'bn';
  if (nav.startsWith('hi')) return 'hi';
  if (nav.startsWith('ur')) return 'ur';
  return 'en';
}

interface LanguageContextValue {
  language: AppLanguageCode;
  languageInfo: AppLanguage;
  setLanguage: (code: AppLanguageCode) => void;
  languages: AppLanguage[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguageCode>(getDefaultLanguage());

  const languageInfo = useMemo(() => LANGUAGES.find(l => l.code === language)!, [language]);

  useEffect(() => {
    localStorage.setItem('app.language', language);
    // Update document attributes for SEO/RTL
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', languageInfo.rtl ? 'rtl' : 'ltr');
    // Sync i18n
    try { i18n.changeLanguage(language); } catch (_) {}
  }, [language, languageInfo.rtl]);

  const setLanguage = (code: AppLanguageCode) => {
    setLanguageState(code);
  };

  const value: LanguageContextValue = {
    language,
    languageInfo,
    setLanguage,
    languages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
