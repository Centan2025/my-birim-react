import type {LegalLink, LocalizedString} from '../../types'

// URL'e göre direkt çeviri döndür (t() fonksiyonuna güvenmeden)
const TRANSLATIONS: Record<string, Record<string, string>> = {
  '/kvkk': {
    tr: 'KVKK Aydınlatma Metni',
    en: 'KVKK Disclosure',
  },
  '/privacy': {
    tr: 'Gizlilik Politikası',
    en: 'Privacy Policy',
  },
  '/cookies': {
    tr: 'Çerez Politikası',
    en: 'Cookie Policy',
  },
  '/terms': {
    tr: 'Kullanım Koşulları',
    en: 'Terms of Service',
  },
  '/legal': {
    tr: 'Yasal Bilgiler',
    en: 'Legal Information',
  },
}

const getTranslationFromUrl = (url: string, locale: string): string | null => {
  const urlLower = url.toLowerCase()

  if (TRANSLATIONS[urlLower]) {
    return TRANSLATIONS[urlLower][locale] || TRANSLATIONS[urlLower].tr || null
  }

  if (urlLower.includes('kvkk')) {
    return locale === 'en' ? 'KVKK Disclosure' : 'KVKK Aydınlatma Metni'
  }
  if (urlLower.includes('privacy')) {
    return locale === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası'
  }
  if (urlLower.includes('cookie')) {
    return locale === 'en' ? 'Cookie Policy' : 'Çerez Politikası'
  }
  if (urlLower.includes('terms')) {
    return locale === 'en' ? 'Terms of Service' : 'Kullanım Koşulları'
  }
  if (urlLower.includes('legal')) {
    return locale === 'en' ? 'Legal Information' : 'Yasal Bilgiler'
  }

  return null
}

// LocalizedString için ortak çözümleyici
const resolveLocalizedString = (
  value: LocalizedString | undefined,
  locale: string,
  t: (keyOrObject: string | LocalizedString | undefined) => string
): string => {
  if (!value) return ''

  if (typeof value === 'string') {
    const translated = t(value)
    if (translated && translated.trim() && translated !== value) {
      return translated
    }
    return value
  }

  const obj = value as Record<string, string>

  if (obj[locale] && obj[locale].trim()) return obj[locale]
  if (obj.tr && obj.tr.trim()) return obj.tr
  if (obj.en && obj.en.trim()) return obj.en

  const first = Object.values(obj).find(v => v && typeof v === 'string' && v.trim())
  return (first as string) || ''
}

export const resolveLegalLinkText = (
  link: LegalLink,
  locale: string,
  t: (keyOrObject: string | LocalizedString | undefined) => string
): string => {
  const url = typeof link.url === 'string' ? link.url : ''

  // 1) URL'e göre doğrudan mapping dene
  const urlText = url ? getTranslationFromUrl(url, locale) : null
  if (urlText) return urlText

  // 2) LocalizedString çöz
  const fromText = resolveLocalizedString(link.text, locale, t)
  if (fromText && fromText.trim()) return fromText

  // 3) Son çare: URL'yi ham haliyle döndür
  return url || ''
}


