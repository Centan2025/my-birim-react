import { createContext, useState, useContext, PropsWithChildren, useMemo, useCallback, useEffect } from 'react';
import tr from './locales/tr';
import en from './locales/en';
import { LocalizedString } from '../types';
import { getLanguages } from '../services/cms';

export type Locale = string;

const translations: Record<string, any> = { tr, en };

interface II18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (keyOrObject: string | LocalizedString | undefined, ...args: any[]) => string;
  supportedLocales: string[];
}

const I18nContext = createContext<II18nContext | null>(null);

const getInitialLocale = (locales: string[]): Locale => {
    if (locales.length === 0) return 'tr';
    const savedLocale = localStorage.getItem('birim_locale');
    if (savedLocale && locales.includes(savedLocale)) {
        return savedLocale;
    }
    const browserLang = navigator.language.split('-')[0];
    if (locales.includes(browserLang)) {
        return browserLang;
    }
    return locales[0];
};

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const [supportedLocales, setSupportedLocales] = useState<string[]>([]);
  const [locale, setLocaleState] = useState<Locale>('tr');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocales = async () => {
        try {
            const langs = await getLanguages();
            const validLangs = langs && langs.length > 0 ? langs : ['tr', 'en'];
            setSupportedLocales(validLangs);
            setLocaleState(getInitialLocale(validLangs));
        } catch (error) {
            console.error("Failed to fetch languages, using defaults.", error);
            const defaultLangs = ['tr', 'en'];
            setSupportedLocales(defaultLangs);
            setLocaleState(getInitialLocale(defaultLangs));
        } finally {
            setLoading(false);
        }
    };
    fetchLocales();
  }, []);
  
  useEffect(() => {
    if (!loading) {
        localStorage.setItem('birim_locale', locale);
    }
  }, [locale, loading]);

  const setLocale = (newLocale: Locale) => {
      if (supportedLocales.includes(newLocale)) {
          setLocaleState(newLocale);
      }
  };

  const t = useCallback((keyOrObject: string | LocalizedString | undefined, ...args: any[]): string => {
    if (typeof keyOrObject === 'string') {
      const translationSet = translations[locale] || translations.tr;
      let translation = translationSet[keyOrObject] || keyOrObject;
      if (args.length > 0) {
        args.forEach((arg, index) => {
          translation = translation.replace(`{${index}}`, arg);
        });
      }
      return translation;
    }
    
    if (typeof keyOrObject === 'object' && keyOrObject !== null) {
      if (locale in keyOrObject) {
         return (keyOrObject as any)[locale] || (keyOrObject as any)['tr'] || '';
      }
    }
    
    if (typeof keyOrObject === 'object' && keyOrObject !== null && 'tr' in keyOrObject) {
        return (keyOrObject as any)['tr'] || '';
    }

    return '';
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    supportedLocales
  }), [locale, t, supportedLocales]);

  if (loading) {
      return null;
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};