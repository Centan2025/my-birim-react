import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {updateMetaTags, setCanonicalUrl, type SEOData} from '../lib/seo'

/**
 * SEO Hook
 * Sayfa değiştiğinde otomatik olarak meta tag'leri günceller
 */
export const useSEO = (data: SEOData) => {
  const location = useLocation()

  useEffect(() => {
    // Base URL oluştur (HashRouter için)
    const baseUrl = window.location.origin
    const path = location.pathname || '/'
    const hash = location.hash || ''
    const fullUrl = `${baseUrl}${path}${hash}`

    // Meta tags güncelle
    updateMetaTags({
      ...data,
      url: data.url || fullUrl,
    })

    // Canonical URL ekle
    setCanonicalUrl(data.url || fullUrl)
  }, [location, data])
}


