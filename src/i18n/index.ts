import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      chat: {
        title: 'Islamic AI Assistant',
        placeholder: 'Ask about Islamic guidance...',
        send: 'Send',
      }
    }
  },
  ar: {
    translation: {
      chat: {
        title: 'المساعد الإسلامي الذكي',
        placeholder: 'اسأل عن الإرشاد الإسلامي...',
        send: 'إرسال',
      }
    }
  },
  bn: {
    translation: {
      chat: {
        title: 'ইসলামিক এআই সহকারী',
        placeholder: 'ইসলামিক দিকনির্দেশনা সম্পর্কে জিজ্ঞাসা করুন...',
        send: 'পাঠান',
      }
    }
  },
  hi: {
    translation: {
      chat: {
        title: 'इस्लामिक एआई सहायक',
        placeholder: 'इस्लामी मार्गदर्शन के बारे में पूछें...',
        send: 'भेजें',
      }
    }
  },
  ur: {
    translation: {
      chat: {
        title: 'اسلامی اے آئی معاون',
        placeholder: 'اسلامی رہنمائی کے بارے میں پوچھیں...',
        send: 'بھیجیں',
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
