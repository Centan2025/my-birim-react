import React, { useState, useEffect, useRef } from 'react'
import { R2ImageMetadata } from '../types'

/**
 * srcset attribute'ünde boşluklar ayırıcıdır — URL'deki boşlukları %20 ile encode ederek
 * "pomelli-image (9).webp" benzeri dosya isimlerinde kırılmayı önler.
 */
const encodeSrcSetUrl = (url: string): string => {
  if (!url) return url
  return url.replace(/ /g, '%20')
}

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  sizes?: string
  srcSet?: string
  // Art Direction: Farklı ekranlar için farklı görseller
  srcMobile?: string // Mobil için görsel (varsa)
  srcDesktop?: string // Desktop için görsel (varsa)
  fallbackSrc?: string // R2 yüklenemezse kullanılacak yedek (Sanity) görsel
  draggable?: boolean
  onLoad?: () => void
  onError?: () => void
  style?: React.CSSProperties
  crop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
}

/**
 * Optimize edilmiş görsel component'i
 * - Lazy loading desteği
 * - WebP format desteği
 * - Responsive images (srcset)
 * - Placeholder gösterimi
 * - R2 -> Sanity Fallback desteği
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  fetchPriority = 'auto',
  quality = 85,
  format = 'webp',
  sizes,
  srcSet,
  srcMobile,
  srcDesktop,
  fallbackSrc,
  draggable,
  onLoad,
  onError,
  style,
  crop,
  hotspot,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // src değiştiğinde state'i sıfırla
  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
    setUsingFallback(false)
  }, [src, srcMobile, srcDesktop])

  // Cache'den yüklenen görselleri yakalama — back navigation'da onLoad tetiklenmez
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true)
    }
  })

  // React henüz fetchPriority prop'unu DOM attribute olarak tanımıyor; uyarıyı
  // engellemek için custom attribute'u lowercase olarak enjekte ediyoruz.
  const fetchPriorityAttr =
    fetchPriority && fetchPriority !== 'auto'
      ? ({ fetchpriority: fetchPriority } as Record<string, string>)
      : {}

  // Placeholder (çok küçük, gri renk)
  const placeholder =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4='

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    // Eğer fallback varsa ve henüz kullanmıyorsak, ona geç
    if (fallbackSrc && !usingFallback) {
      console.warn(
        'OptimizedImage: R2 visual failed or unavailable, switching to Sanity fallback.',
        src
      )
      setUsingFallback(true)
      // Hata durumunu resetle, çünkü yeni bir deneme yapıyoruz
      setHasError(false)
      setIsLoaded(false)
      return
    }

    setHasError(true)
    onError?.()
  }

  // R2 URL Rewriter: .r2.dev URL'lerini custom domain'e çevir
  const rewriteUrl = (url: string | undefined): string => {
    if (!url) return ''
    const r2Domain =
      import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
    const r2Origin =
      import.meta.env['VITE_R2_ORIGIN_DOMAIN'] ||
      'https://pub-5e705b2a702d4bb1a3631c558917599d.r2.dev'
    // Origin -> Custom domain rewrite
    if (r2Origin && r2Domain && r2Origin !== r2Domain && url.startsWith(r2Origin)) {
      return url.replace(r2Origin, r2Domain)
    }
    // Generic .r2.dev -> custom domain rewrite
    if (r2Domain && !r2Domain.includes('.r2.dev') && url.includes('.r2.dev')) {
      try {
        const parsed = new URL(url)
        const path = parsed.pathname.startsWith('/')
          ? parsed.pathname.substring(1)
          : parsed.pathname
        return `${r2Domain}/${path}`
      } catch {
        return url
      }
    }
    return url
  }

  // fallback modundaysak sadece fallbackSrc'yi optimize etmeye çalış (Sanity ise)
  // Değilse normal src'yi kullan.
  const activeSrc = rewriteUrl(usingFallback && fallbackSrc ? fallbackSrc : src)
  const activeMobileSrc = usingFallback ? undefined : rewriteUrl(srcMobile || src)
  const activeDesktopSrc = usingFallback ? undefined : rewriteUrl(srcDesktop || src)

  // Sanity image URL'lerini ve R2 URL'lerini optimize et
  const getOptimizedUrl = (url: string): string => {
    if (!url) return placeholder

    // 1. Sanity CDN
    if (url.includes('cdn.sanity.io/images')) {
      const urlObj = new URL(url)
      // Mevcut parametreleri koru, yeni parametreler ekle
      if (width) urlObj.searchParams.set('w', width.toString())
      if (height) urlObj.searchParams.set('h', height.toString())
      urlObj.searchParams.set('q', quality.toString())
      urlObj.searchParams.set('fm', format)
      urlObj.searchParams.set('auto', 'format')
      return encodeSrcSetUrl(urlObj.toString())
    }

    // 2. Cloudflare R2 / Image Resizing
    // VITE_R2_DOMAIN kontrolü (örn: https://assets.birim.com)
    const r2Domain =
      import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
    // .r2.dev ve .workers.dev domainleri image resizing desteklemez, direkt döndür.
    const skipImageResizing =
      r2Domain?.includes('.r2.dev') ||
      r2Domain?.includes('.workers.dev') ||
      r2Domain?.includes('assets.birim.com')

    if (r2Domain && url.startsWith(r2Domain) && !url.includes('/cdn-cgi/image/')) {
      if (skipImageResizing) return url.replace('?rs=1', '').replace('&rs=1', '')

      // Cloudflare URL format: /cdn-cgi/image/format=auto,width=XXX,height=YYY/path/to/image
      const params = []
      if (width) params.push(`width=${width}`)
      if (height) params.push(`height=${height}`)

      // Add crop rect if available
      if (crop) {
        params.push(`rect=${crop.x},${crop.y},${crop.width},${crop.height}`)
      }

      params.push(`quality=${quality}`)
      params.push('format=auto') // Cloudflare auto format (webp/avif)

      // URL'den domain'i çıkarıp path'i al
      const path = url.replace(r2Domain + '/', '')

      // Construct: https://assets.birim.com/cdn-cgi/image/.../path
      return encodeSrcSetUrl(`${r2Domain}/cdn-cgi/image/${params.join(',')}/${path}`)
    }

    return encodeSrcSetUrl(url)
  }

  // Optimize edilmiş URL'ler
  const optimizedSrc = getOptimizedUrl(activeSrc)
  const optimizedMobileSrc = activeMobileSrc ? getOptimizedUrl(activeMobileSrc) : undefined
  const optimizedDesktopSrc = activeDesktopSrc ? getOptimizedUrl(activeDesktopSrc) : undefined

  // Responsive srcset oluştur
  const generateSrcSet = (baseUrl: string): string => {
    if (srcSet && !usingFallback) return srcSet

    const sizes = [400, 800, 1200, 1600, 2000]

    // Sanity Logic
    if (baseUrl.includes('cdn.sanity.io/images')) {
      return sizes
        .map(w => {
          const url = getOptimizedUrl(baseUrl)
          const urlObj = new URL(url)
          urlObj.searchParams.set('w', w.toString())
          return `${urlObj.toString()} ${w}w`
        })
        .join(', ')
    }

    // R2 Logic
    const r2Domain =
      import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
    if (r2Domain && baseUrl.startsWith(r2Domain)) {
      if (
        r2Domain.includes('.r2.dev') ||
        r2Domain.includes('.workers.dev') ||
        r2Domain.includes('assets.birim.com')
      ) {
        if (baseUrl.includes('rs=1')) {
          const cleanUrl = baseUrl.replace('?rs=1', '').replace('&rs=1', '')
          return [
            `${cleanUrl.replace(/\.webp$/, '-400w.webp')} 400w`,
            `${cleanUrl.replace(/\.webp$/, '-800w.webp')} 800w`,
            `${cleanUrl.replace(/\.webp$/, '-1600w.webp')} 1600w`,
            `${cleanUrl} 2560w`,
          ].join(', ')
        }
        return '' // srcset desteği yok (image resizing kapalı)
      }

      // Cloudflare URL builder helper for local usage inside map
      const buildR2 = (w: number) => {
        const params = [`width=${w}`, `quality=${quality}`, 'format=auto']

        // Add crop rect if available
        if (crop) {
          params.push(`rect=${crop.x},${crop.y},${crop.width},${crop.height}`)
        }

        // Remove domain to get path
        const path = baseUrl.replace(r2Domain + '/', '')
        return encodeSrcSetUrl(`${r2Domain}/cdn-cgi/image/${params.join(',')}/${path}`)
      }
      return sizes.map(w => `${buildR2(w)} ${w}w`).join(', ')
    }

    return ''
  }

  const responsiveSrcSet = generateSrcSet(activeSrc)
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px'

  // Art Direction kullanılıyor mu? (srcMobile veya srcDesktop varsa ve fallback yoksa)
  const useArtDirection = Boolean((srcMobile || srcDesktop) && !usingFallback)

  // Hotspot varsa style'a object-position ekle
  const imgStyle: React.CSSProperties = { ...style }
  if (hotspot) {
    imgStyle.objectPosition = `${hotspot.x * 100}% ${hotspot.y * 100}%`
  }
  if (crop) {
    // Destekleyen tarayıcılarda (Chrome/Edge 104+) resmi CSS ile kırpmak için
    ; (imgStyle as any).objectViewBox = `inset(${crop.y * 100}% ${100 - (crop.x + crop.width) * 100
      }% ${100 - (crop.y + crop.height) * 100}% ${crop.x * 100}%)`
  }

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Görsel yüklenemedi</span>
      </div>
    )
  }

  // Format için optimize edilmiş URL oluştur
  const getFormatUrl = (url: string, imgFormat: 'webp' | 'avif' | 'jpg' | 'png'): string => {
    // Sanity
    if (url && url.includes('cdn.sanity.io/images')) {
      const urlObj = new URL(url)
      urlObj.searchParams.set('fm', imgFormat)
      urlObj.searchParams.set('auto', 'format')
      if (width) urlObj.searchParams.set('w', width.toString())
      if (height) urlObj.searchParams.set('h', height.toString())
      urlObj.searchParams.set('q', quality.toString())
      return urlObj.toString()
    }
    // Cloudflare R2
    const r2Domain =
      import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
    if (r2Domain && url && url.startsWith(r2Domain)) {
      if (
        r2Domain.includes('.r2.dev') ||
        r2Domain.includes('.workers.dev') ||
        r2Domain.includes('assets.birim.com')
      )
        return '' // no image resizing support

      const params = []
      if (width) params.push(`width=${width}`)
      if (height) params.push(`height=${height}`)

      // Add crop rect if available
      if (crop) {
        params.push(`rect=${crop.x},${crop.y},${crop.width},${crop.height}`)
      }

      params.push(`quality=${quality}`)
      params.push(`format=${imgFormat === 'jpg' ? 'jpeg' : imgFormat}`) // Cloudflare uses 'jpeg'

      const path = url.replace(r2Domain + '/', '')
      return encodeSrcSetUrl(`${r2Domain}/cdn-cgi/image/${params.join(',')}/${path}`)
    }
    return encodeSrcSetUrl(url)
  }

  // Strip layout relevant classes from inner img to prevent nested constraints
  // Keep mx-auto for centering, only remove max-w- and w- to prevent double scaling
  const innerImgClassName = className
    .split(' ')
    .filter(c => !c.startsWith('max-w-') && !c.startsWith('w-'))
    .join(' ')

  // Art Direction ile picture elementi kullan
  if (useArtDirection) {
    return (
      <div className={`relative ${className}`} style={style}>
        {!isLoaded && (
          <img
            src={placeholder}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        )}
        <picture>
          {/* AVIF format (en iyi sıkıştırma) */}
          {srcMobile && (
            <source
              type="image/avif"
              media="(max-width: 768px)"
              srcSet={generateSrcSet(srcMobile) || getFormatUrl(srcMobile, 'avif') || undefined}
              sizes={defaultSizes}
            />
          )}
          {srcDesktop && (
            <source
              type="image/avif"
              media="(min-width: 769px)"
              srcSet={generateSrcSet(srcDesktop) || getFormatUrl(srcDesktop, 'avif') || undefined}
              sizes={defaultSizes}
            />
          )}
          {/* WebP format (fallback) */}
          {srcMobile && (
            <source
              type="image/webp"
              media="(max-width: 768px)"
              srcSet={generateSrcSet(srcMobile) || getFormatUrl(srcMobile, 'webp') || undefined}
              sizes={defaultSizes}
            />
          )}
          {srcDesktop && (
            <source
              type="image/webp"
              media="(min-width: 769px)"
              srcSet={generateSrcSet(srcDesktop) || getFormatUrl(srcDesktop, 'webp') || undefined}
              sizes={defaultSizes}
            />
          )}
          {/* Mobil için görsel (max-width: 768px) */}
          {srcMobile && optimizedMobileSrc && (
            <source
              media="(max-width: 768px)"
              srcSet={generateSrcSet(srcMobile) || undefined}
              sizes={defaultSizes}
            />
          )}
          {/* Desktop için görsel (min-width: 769px) */}
          {srcDesktop && optimizedDesktopSrc && (
            <source
              media="(min-width: 769px)"
              srcSet={generateSrcSet(srcDesktop) || undefined}
              sizes={defaultSizes}
            />
          )}
          {/* Fallback: Eğer mobil versiyonu yoksa desktop'u kullan, o da yoksa src'i kullan */}
          <img
            ref={imgRef}
            src={
              activeMobileSrc
                ? optimizedMobileSrc
                : activeDesktopSrc
                  ? optimizedDesktopSrc
                  : optimizedSrc
            }
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            {...fetchPriorityAttr}
            className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full h-full ${innerImgClassName}`}
            draggable={draggable}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
            style={imgStyle}
          />
        </picture>
      </div>
    )
  }

  // Normal kullanım (Art Direction yok veya fallback)
  return (
    <div className={`relative ${className}`} style={style}>
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}
      <picture>
        {/* AVIF format (en iyi sıkıştırma) */}
        <source
          type="image/avif"
          srcSet={responsiveSrcSet || getFormatUrl(activeSrc, 'avif') || undefined}
          sizes={responsiveSrcSet ? defaultSizes : undefined}
        />
        {/* WebP format (fallback) */}
        <source
          type="image/webp"
          srcSet={responsiveSrcSet || getFormatUrl(activeSrc, 'webp') || undefined}
          sizes={responsiveSrcSet ? defaultSizes : undefined}
        />
        {/* Fallback image */}
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          {...fetchPriorityAttr}
          srcSet={responsiveSrcSet || undefined}
          sizes={responsiveSrcSet ? defaultSizes : undefined}
          className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full h-full ${innerImgClassName}`}
          draggable={draggable}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          style={imgStyle}
        />
      </picture>
    </div>
  )
}
