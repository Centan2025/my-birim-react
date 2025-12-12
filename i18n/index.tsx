import {
  createContext,
  useState,
  useContext,
  PropsWithChildren,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import tr from './locales/tr'
import en from './locales/en'
import {LocalizedString} from '../types'
import {getLanguages, getTranslations} from '../services/cms'

export type Locale = string

// Base translations from files (fallback)
const baseTranslations: Record<string, any> = {tr, en}

interface II18nContext {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (keyOrObject: string | LocalizedString | undefined, ...args: any[]) => string
  supportedLocales: string[]
}

const I18nContext = createContext<II18nContext | null>(null)

const getInitialLocale = (locales: string[]): Locale => {
  if (locales.length === 0) return 'tr'
  try {
    const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('birim_locale') : null
    if (savedLocale && locales.includes(savedLocale)) {
      return savedLocale
    }
    const browserLang =
      typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : undefined
    if (browserLang && locales.includes(browserLang)) {
      return browserLang as Locale
    }
  } catch {
    // ignore and fall back
  }
  return locales[0] as Locale
}

// Uygulama ilk açılırken dilin TR'ye kısa süreliğine dönmesini engellemek için
// localStorage / browser diline göre senkron bir başlangıç dili seç
const getInitialLocaleSync = (): Locale => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('birim_locale')
      if (saved) return saved as Locale
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'en' || browserLang === 'tr') return browserLang as Locale
    }
  } catch {
    // ignore
  }
  return 'tr'
}

export const I18nProvider = ({children}: PropsWithChildren) => {
  const [supportedLocales, setSupportedLocales] = useState<string[]>([])
  const [locale, setLocaleState] = useState<Locale>(getInitialLocaleSync)
  const [loading, setLoading] = useState(true)
  const [cmsTranslations, setCmsTranslations] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    const fetchLocalesAndTranslations = async () => {
      try {
        const [langs, translations] = await Promise.all([getLanguages(), getTranslations()])
        // Store CMS translations in state
        setCmsTranslations(translations)

        const validLangs = langs && langs.length > 0 ? langs : ['tr', 'en']
        setSupportedLocales(validLangs)
        setLocaleState(getInitialLocale(validLangs))
      } catch (error) {
        const defaultLangs = ['tr', 'en']
        setSupportedLocales(defaultLangs)
        setLocaleState(getInitialLocale(defaultLangs))
      } finally {
        setLoading(false)
      }
    }
    fetchLocalesAndTranslations()
  }, [])

  useEffect(() => {
    if (!loading) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('birim_locale', locale)
        }
      } catch {
        // Storage erişilemiyorsa sessizce devam et
      }
    }
  }, [locale, loading])

  const setLocale = (newLocale: Locale) => {
    if (supportedLocales.includes(newLocale)) {
      setLocaleState(newLocale)
    }
  }

  const t = useCallback(
    (keyOrObject: string | LocalizedString | undefined, ...args: any[]): string => {
      if (typeof keyOrObject === 'string') {
        // Bazı anahtarlar için (ör. ana menü ve arama yerleri) CMS çevirisini değil,
        // dosya çevirisini tercih et ki TR/EN arasında net fark ve animasyon görülebilsin
        const shouldBypassCms =
          keyOrObject === 'designs' ||
          keyOrObject === 'search_placeholder' ||
          keyOrObject === 'products' ||
          keyOrObject === 'designers' ||
          keyOrObject === 'projects' ||
          keyOrObject === 'news' ||
          keyOrObject === 'about' ||
          keyOrObject === 'contact' ||
          keyOrObject === 'subscribe' ||
          keyOrObject === 'subscribe_prompt' ||
          keyOrObject === 'email_placeholder'

        // Try CMS translations first (gerekirse bypass), then fallback to base translations
        const cmsTranslation = shouldBypassCms ? undefined : cmsTranslations[locale]?.[keyOrObject]
        const baseTranslation =
          baseTranslations[locale]?.[keyOrObject] || baseTranslations['tr']?.[keyOrObject]
        let translation = cmsTranslation || baseTranslation || keyOrObject
        if (args.length > 0) {
          args.forEach((arg, index) => {
            translation = translation.replace(`{${index}}`, arg)
          })
        }
        return translation
      }

      if (typeof keyOrObject === 'object' && keyOrObject !== null) {
        const obj = keyOrObject as any
        // Önce mevcut locale'i kontrol et (boş string değilse)
        if (locale in obj && obj[locale] && typeof obj[locale] === 'string' && obj[locale].trim()) {
          return obj[locale]
        }
        // Locale yoksa veya boşsa, 'tr' fallback'i kullan
        if ('tr' in obj && obj['tr'] && typeof obj['tr'] === 'string' && obj['tr'].trim()) {
          return obj['tr']
        }
        // 'tr' de yoksa, 'en' fallback'i dene
        if ('en' in obj && obj['en'] && typeof obj['en'] === 'string' && obj['en'].trim()) {
          return obj['en']
        }
        // Hiçbiri yoksa, object'teki ilk geçerli string değeri al
        const firstValue = Object.values(obj).find(
          (val: any) => val && typeof val === 'string' && val.trim()
        ) as string | undefined
        return firstValue || ''
      }

      return ''
    },
    [locale, cmsTranslations]
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      supportedLocales,
    }),
    [locale, t, supportedLocales, cmsTranslations]
  )

  // Uygulamanın beyaz ekrana düşmemesi için loading sırasında da render etmeye devam et

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useTranslation = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
