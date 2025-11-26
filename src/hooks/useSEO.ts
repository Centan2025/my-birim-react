import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {updateMetaTags, setCanonicalUrl, type SEOData} from '../lib/seo'

/**
 * SEO Hook
 * Sayfa değiştiğinde otomatik olarak meta tag'leri günceller.
 * SSR ortamlarında (window olmayan) güvenli şekilde no-op çalışır.
 */
export const useSEO = ({title, description, image, type, siteName, url}: SEOData) => {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // Base URL oluştur (HashRouter için)
    const baseUrl = window.location.origin
    const path = location.pathname || '/'
    const hash = location.hash || ''
    const fullUrl = `${baseUrl}${path}${hash}`

    const finalUrl = url || fullUrl

    // Meta tags güncelle
    updateMetaTags({
      title,
      description,
      image,
      type,
      siteName,
      url: finalUrl,
    })

    // Canonical URL ekle
    setCanonicalUrl(finalUrl)
  }, [location.pathname, location.hash, title, description, image, type, siteName, url])
}
