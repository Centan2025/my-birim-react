/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type PropsWithChildren,
} from 'react'
import {Helmet} from 'react-helmet-async'
import {useLocation} from 'react-router-dom'
import type {SEOData} from '../lib/seo'

type SEOState = SEOData & {
  url?: string
}

type SEOContextValue = {
  setSeoData: (data: SEOState) => void
  setSeoDefaults: (data: Partial<SEOState>) => void
}

const isEqualSeoState = (a: SEOState, b: SEOState) =>
  a.title === b.title &&
  a.description === b.description &&
  a.image === b.image &&
  a.type === b.type &&
  a.siteName === b.siteName &&
  a.url === b.url &&
  a.locale === b.locale

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
  const [defaults, setSeoDefaults] = useState<Partial<SEOState>>(DEFAULT_STATE)

  const merged = useMemo(() => ({...defaults, ...seoData}), [defaults, seoData])

  const updateSeoData = useCallback(
    (updater: (prev: SEOState) => SEOState) => {
      setSeoData(prev => updater(prev))
    },
    []
  )

  const updateSeoDefaults = useCallback(
    (updater: (prev: Partial<SEOState>) => Partial<SEOState>) => {
      setSeoDefaults(prev => updater(prev))
    },
    []
  )

  const title = merged.title || merged.siteName || DEFAULT_TITLE
  const siteName = merged.siteName || DEFAULT_SITE_NAME
  const ogType = merged.type || 'website'
  const locale = merged.locale || 'tr_TR'

  const contextValue = useMemo(
    () => ({
      setSeoData: (data: SEOState) => updateSeoData(prev => ({...prev, ...data})),
      setSeoDefaults: (data: Partial<SEOState>) => updateSeoDefaults(prev => ({...prev, ...data})),
    }),
    [updateSeoData, updateSeoDefaults]
  )

  return (
    <SEOContext.Provider value={contextValue}>
      <Helmet prioritizeSeoTags>
        <title>{title}</title>
        {merged.description && <meta name="description" content={merged.description} />}
        {merged.url && <link rel="canonical" href={merged.url} />}

        {merged.title && <meta property="og:title" content={merged.title} />}
        {merged.description && <meta property="og:description" content={merged.description} />}
        {merged.image && <meta property="og:image" content={merged.image} />}
        {merged.url && <meta property="og:url" content={merged.url} />}
        <meta property="og:type" content={ogType} />
        {siteName && <meta property="og:site_name" content={siteName} />}
        {locale && <meta property="og:locale" content={locale} />}

        {merged.title && <meta name="twitter:title" content={merged.title} />}
        {merged.description && <meta name="twitter:description" content={merged.description} />}
        {merged.image && <meta name="twitter:image" content={merged.image} />}
        <meta name="twitter:card" content={merged.image ? 'summary_large_image' : 'summary'} />
      </Helmet>
      {children}
    </SEOContext.Provider>
  )
}

/**
 * Sayfa SEO ayarlarını günceller. Helmet tag'leri SEOProvider içinden render edilir.
 */
export const useSEO = ({title, description, image, type, siteName, url, locale}: SEOData) => {
  const location = useLocation()
  const {setSeoData} = useSeoContext()

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
    }

    setSeoData(prev => (isEqualSeoState(prev, nextData) ? prev : nextData))
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
  ])
}

/**
 * Site geneli için varsayılan başlık/site adı gibi değerleri günceller.
 */
export const useSeoDefaults = () => useSeoContext().setSeoDefaults

