/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {Helmet} from 'react-helmet-async'
import {useLocation} from 'react-router-dom'
import {useTranslation} from '../i18n'
import type {SEOData} from '../lib/seo'

type SEOState = SEOData & {
  url?: string
}

type SEOContextValue = {
  setSeoData: Dispatch<SetStateAction<SEOState>>
  setSeoDefaults: Dispatch<SetStateAction<Partial<SEOState>>>
}

const isEqualSeoState = (a: SEOState, b: SEOState) =>
  a.title === b.title &&
  a.description === b.description &&
  a.image === b.image &&
  a.type === b.type &&
  a.siteName === b.siteName &&
  a.url === b.url &&
  a.locale === b.locale &&
  JSON.stringify(a.schema) === JSON.stringify(b.schema)

const DEFAULT_TITLE = 'BIRIM'
const DEFAULT_SITE_NAME = 'BIRIM'
const DEFAULT_STATE: SEOState = {
  title: DEFAULT_TITLE,
  siteName: DEFAULT_SITE_NAME,
  type: 'website',
  locale: 'tr_TR',
}

const SEOContext = createContext<SEOContextValue | null>(null)

const useSeoContext = () => {
  const ctx = useContext(SEOContext)
  if (!ctx) {
    throw new Error('useSEO must be used within an SEOProvider')
  }
  return ctx
}

export const SEOProvider = ({children}: PropsWithChildren) => {
  const [seoData, setSeoData] = useState<SEOState>(DEFAULT_STATE)
  const [seoDefaults, setSeoDefaults] = useState<Partial<SEOState>>(DEFAULT_STATE)
  const {supportedLocales} = useTranslation()

  const merged = useMemo(() => ({...seoDefaults, ...seoData}), [seoDefaults, seoData])

  const title = merged.title || merged.siteName || DEFAULT_TITLE
  const siteName = merged.siteName || DEFAULT_SITE_NAME
  const ogType = merged.type || 'website'
  const locale = merged.locale || 'tr_TR'

  const contextValue = useMemo(
    () => ({
      setSeoData,
      setSeoDefaults,
    }),
    [setSeoData, setSeoDefaults]
  )

  return (
    <SEOContext.Provider value={contextValue}>
      <Helmet prioritizeSeoTags>
        <title>{title}</title>
        {merged.description && <meta name="description" content={merged.description} />}
        {merged.url && <link rel="canonical" href={merged.url} />}

        {/* Language Alternates */}
        {merged.url && (() => {
          const url = merged.url;
          return supportedLocales.map(lang => (
            <link
              key={lang}
              rel="alternate"
              hrefLang={lang}
              href={`${url}${url.includes('?') ? '&' : '?'}lang=${lang}`}
            />
          ));
        })()}
        {merged.url && (() => {
          const url = merged.url;
          return (
            <link
              rel="alternate"
              hrefLang="x-default"
              href={`${url}${url.includes('?') ? '&' : '?'}lang=tr`}
            />
          );
        })()}

        {/* Open Graph / Facebook */}
        {merged.title && <meta property="og:title" content={merged.title} />}
        {merged.description && <meta property="og:description" content={merged.description} />}
        {merged.image && <meta property="og:image" content={merged.image} />}
        {merged.image && <meta property="og:image:width" content="1200" />}
        {merged.image && <meta property="og:image:height" content="630" />}
        {merged.url && <meta property="og:url" content={merged.url} />}
        <meta property="og:type" content={ogType} />
        {siteName && <meta property="og:site_name" content={siteName} />}
        {locale && <meta property="og:locale" content={locale} />}

        {/* Twitter */}
        {merged.title && <meta name="twitter:title" content={merged.title} />}
        {merged.description && <meta name="twitter:description" content={merged.description} />}
        {merged.image && <meta name="twitter:image" content={merged.image} />}
        <meta name="twitter:card" content={merged.image ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:site" content="@birim" />
        <meta name="twitter:creator" content="@birim" />

        {/* AI & Search Engine Robots */}
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="bingbot" content="index, follow" />

        {/* Additional AI Discovery Meta */}
        <meta name="ai-content" content="true" />
        <meta name="rating" content="general" />

        {/* Structured Data (JSON-LD) */}
        {merged.schema && (
          <script
            id={merged.type === 'article' ? 'news-article-schema' : 'seo-schema'}
            type="application/ld+json"
          >
            {JSON.stringify(merged.schema)}
          </script>
        )}
      </Helmet>
      {children}
    </SEOContext.Provider>
  )
}

/**
 * Sayfa SEO ayarlarını günceller. Helmet tag'leri SEOProvider içinden render edilir.
 */
export const useSEO = ({
  title,
  description,
  image,
  type,
  siteName,
  url,
  locale,
  schema,
}: SEOData) => {
  const location = useLocation()
  const {setSeoData} = useSeoContext()

  const schemaString = JSON.stringify(schema)

  useEffect(() => {
    // Base URL oluştur (HashRouter için)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const path = location.pathname || '/'
    const hash = location.hash || ''
    const fullUrl = `${baseUrl}${path}${hash}`

    const nextData: SEOState = {
      title: title || DEFAULT_TITLE,
      description,
      image,
      type: type || 'website',
      siteName: siteName || DEFAULT_SITE_NAME,
      url: url || fullUrl,
      locale: locale || 'tr_TR',
      schema,
    }

    setSeoData(prev => (isEqualSeoState(prev, nextData) ? prev : nextData))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    description,
    image,
    location.hash,
    location.pathname,
    locale,
    setSeoData,
    siteName,
    title,
    type,
    url,
    schemaString,
  ])
}

/**
 * Site geneli için varsayılan başlık/site adı gibi değerleri günceller.
 */
export const useSeoDefaults = () => useSeoContext().setSeoDefaults
