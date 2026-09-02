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
import {toPlainText} from '../utils/portableText'

export type Locale = string

// Base translations from files (fallback)
const baseTranslations: Record<string, Record<string, string>> = {tr, en}

interface II18nContext {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (keyOrObject: string | LocalizedString | undefined, ...args: (string | number)[]) => string
  supportedLocales: string[]
}

// eslint-disable-next-line react-refresh/only-export-components
export const I18nContext = createContext<II18nContext | null>(null)

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

const normalizeKey = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
}

const findInDict = (dict: Record<string, string> | undefined, key: string): string | undefined => {
  if (!dict || !key) return undefined
  if (dict[key]) return dict[key]
  const lower = key.toLowerCase()
  if (dict[lower]) return dict[lower]
  const norm = normalizeKey(key)
  if (dict[norm]) return dict[norm]
  const matchedKey = Object.keys(dict).find(k => normalizeKey(k) === norm)
  if (matchedKey) return dict[matchedKey]
  return undefined
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

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (supportedLocales.includes(newLocale)) {
        setLocaleState(newLocale)
      }
    },
    [supportedLocales]
  )

  const t = useCallback(
    (keyOrObject: string | LocalizedString | undefined, ...args: (string | number)[]): string => {
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
        const cmsTranslation = shouldBypassCms
          ? undefined
          : findInDict(cmsTranslations[locale], keyOrObject)
        const baseTranslation =
          findInDict(baseTranslations[locale], keyOrObject) ||
          findInDict(baseTranslations['tr'], keyOrObject)
        let translation = cmsTranslation || baseTranslation || keyOrObject
        if (args.length > 0 && typeof translation === 'string') {
          args.forEach((arg, index) => {
            translation = translation.replace(`{${index}}`, String(arg))
          })
        }
        return translation
      }

      if (typeof keyOrObject === 'object' && keyOrObject !== null) {
        // Direct PortableText array or block object
        if (Array.isArray(keyOrObject) || ('_type' in keyOrObject && 'children' in keyOrObject)) {
          return toPlainText(keyOrObject)
        }

        const obj = keyOrObject as Record<string, unknown>

        // LocalizedString veya dilli bir içerik nesnesi mi?
        const isLocalizedObject =
          obj['_type'] === 'localizedString' ||
          obj['_type'] === 'localizedPortableText' ||
          'tr' in obj ||
          'en' in obj

        if (isLocalizedObject) {
          // Seçili dildeki değeri al
          const val = obj[locale]
          if (typeof val === 'string') {
            return val.trim()
          }
          if (
            Array.isArray(val) ||
            (typeof val === 'object' && val !== null && '_type' in val && 'children' in val)
          ) {
            return toPlainText(val as never)
          }
          // Seçili dilde alan boş bırakılmışsa veya silinmişse, başka dile fallback YAPMA, boş döndür!
          return ''
        }
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
    [locale, t, supportedLocales, setLocale]
  )

  // Uygulamanın beyaz ekrana düşmemesi için loading sırasında da render etmeye devam et

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

const defaultI18nContext: II18nContext = {
  locale: 'tr',
  setLocale: () => {},
  t: (keyOrObject: string | LocalizedString | undefined) => {
    if (typeof keyOrObject === 'string') return keyOrObject
    if (typeof keyOrObject === 'object' && keyOrObject !== null) {
      const obj = keyOrObject as Record<string, string>
      return obj['tr'] || obj['en'] || Object.values(obj)[0] || ''
    }
    return ''
  },
  supportedLocales: ['tr', 'en'],
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTranslation = () => {
  const context = useContext(I18nContext)
  return context || defaultI18nContext
}
