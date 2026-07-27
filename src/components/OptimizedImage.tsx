import React, {useState, useEffect, useRef, useMemo} from 'react'
import {R2ImageMetadata} from '../types'
import {rewriteR2Url} from '../services/sanity/client'

/**
 * srcset attribute'ünde boşluklar ayırıcıdır — URL'deki boşlukları %20 ile encode ederek
 * "pomelli-image (9).webp" benzeri dosya isimlerinde kırılmayı önler.
 */
const encodeSrcSetUrl = (url: string): string => {
  if (!url) return url
  try {
    // URL'deki segmentleri ayır ve trim et (Örn: "dosya .webp" -> "dosya.webp")
    // Bu sayede sondaki boşluklardan kaynaklanan 404 hatalarını önleriz.
    const parts = url.split('/')
    const trimmedUrl = parts
      .map((p, i) => {
        if (i < 3 && p.includes(':')) return p // protocol/domain kısmına dokunma
        return p.trim()
      })
      .join('/')

    // Önce decode et (eğer zaten encode edilmişse), sonra tekrar encode et.
    const decoded = decodeURI(trimmedUrl)
    return encodeURI(decoded).replace(/ /g, '%20')
  } catch {
    return url.replace(/ /g, '%20')
  }
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
  sizes?: string
  srcSet?: string
  // Art Direction: Farklı ekranlar için farklı görseller
  srcMobile?: string // Mobil için görsel (varsa)
  srcDesktop?: string // Desktop için görsel (varsa)
  draggable?: boolean
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
  style?: React.CSSProperties
  crop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
  origWidth?: number
  origHeight?: number
  onClick?: React.MouseEventHandler<HTMLElement>
  showPlaceholder?: boolean
  placeholderColor?: string
  isMirrored?: boolean
  isMirroredMobile?: boolean
  isMirroredDesktop?: boolean
}

/**
 * Optimize edilmiş görsel component'i
 * - Lazy loading desteği
 * - WebP format desteği
 * - Responsive images (srcset)
 * - Placeholder gösterimi
 * - R2 tabanlı Art Direction
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
  sizes,
  srcSet,
  srcMobile,
  srcDesktop,
  draggable,
  onLoad,
  onError,
  fallbackSrc,
  style,
  crop,
  hotspot,
  origWidth,
  origHeight,
  onClick,
  showPlaceholder = true,
  placeholderColor = '#f3f4f6',
  isMirrored = false,
  isMirroredMobile,
  isMirroredDesktop,
}) => {
  const styleBlock = useMemo(() => {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: `
        img.responsive-mirror {
          scale: var(--is-mirrored-general, 1) 1 !important;
        }
        @media (max-width: 768px) {
          img.responsive-mirror {
            scale: var(--is-mirrored-mobile, var(--is-mirrored-general, 1)) 1 !important;
          }
        }
        @media (min-width: 769px) {
          img.responsive-mirror {
            scale: var(--is-mirrored-desktop, var(--is-mirrored-general, 1)) 1 !important;
          }
        }
      `,
        }}
      />
    )
  }, [])

  const [currentSrc, setCurrentSrc] = useState<string>(src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [naturalDims, setNaturalDims] = useState<{w: number; h: number} | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // src değiştiğinde state'i sıfırla
  useEffect(() => {
    setCurrentSrc(src)
    setIsLoaded(false)
    setHasError(false)
  }, [src, srcMobile, srcDesktop])

  // Cache'den yüklenen görselleri yakalama — back navigation'da onLoad tetiklenmez
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true)
      if (img.naturalHeight > 0) {
        setNaturalDims((prev: {w: number; h: number} | null) => {
          if (prev && prev.w === img.naturalWidth && prev.h === img.naturalHeight) return prev
          return {w: img.naturalWidth, h: img.naturalHeight}
        })
      }
    }
  }, [currentSrc, srcMobile, srcDesktop])

  // React henüz fetchPriority prop'unu DOM attribute olarak tanımıyor; uyarıyı
  // engellemek için custom attribute'u lowercase olarak enjekte ediyoruz.
  const fetchPriorityAttr =
    fetchPriority && fetchPriority !== 'auto'
      ? ({fetchpriority: fetchPriority} as Record<string, string>)
      : {}

  // Placeholder (çok küçük, özel renk veya varsayılan gri)
  const placeholder = `data:image/svg+xml;base64,${btoa(`<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${placeholderColor}"/></svg>`)}`

  const handleLoad = () => {
    setIsLoaded(true)
    // Doğal boyutları yakala (crop layout hesaplaması için gerekli)
    const img = imgRef.current
    if (img && img.naturalWidth && img.naturalHeight) {
      setNaturalDims({w: img.naturalWidth, h: img.naturalHeight})
    }
    onLoad?.()
  }

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
    } else {
      setHasError(true)
    }
    onError?.()
  }

  const activeSrc = rewriteR2Url(currentSrc)
  const activeMobileSrc = rewriteR2Url(srcMobile || currentSrc)
  const activeDesktopSrc = rewriteR2Url(srcDesktop || currentSrc)

  // Cloudflare R2 / Image Resizing logic
  const r2Domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
  // .r2.dev ve .workers.dev domainleri image resizing desteklemez
  const skipImageResizing =
    r2Domain?.includes('.r2.dev') ||
    r2Domain?.includes('.workers.dev') ||
    r2Domain?.includes('assets.birim.com')

  // R2 URL'lerini optimize et
  const getOptimizedUrl = (url: string): string => {
    if (!url) return placeholder

    // Cloudflare R2 / Image Resizing
    if (r2Domain && url.startsWith(r2Domain) && !url.includes('/cdn-cgi/image/')) {
      if (skipImageResizing) return url.replace('?rs=1', '').replace('&rs=1', '')

      // Eğer domain .workers.dev veya .r2.dev ise Cloudflare Image Resizing desteklenmez (404 verir).
      if (r2Domain.includes('.workers.dev') || r2Domain.includes('.r2.dev')) {
        return encodeSrcSetUrl(url)
      }

      const params = []
      if (width) params.push(`width=${width}`)
      if (height) params.push(`height=${height}`)

      // Add crop rect if available
      if (crop) {
        if (crop.width < 1.0 || crop.height < 1.0 || crop.x > 0 || crop.y > 0) {
          if (origWidth && origHeight) {
            params.push(
              `rect=${Math.round(crop.x * origWidth)},${Math.round(crop.y * origHeight)},${Math.round(crop.width * origWidth)},${Math.round(crop.height * origHeight)}`
            )
          }
        } else {
          params.push(`rect=${crop.x},${crop.y},${crop.width},${crop.height}`)
        }
      }

      params.push(`quality=${quality}`)
      params.push('format=auto')

      const path = url.replace(r2Domain + '/', '')
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
    if (srcSet) return srcSet

    const sizes = [400, 800, 1200, 1600, 2000]

    // R2 Logic
    const r2Domain =
      import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
    if (r2Domain && baseUrl.startsWith(r2Domain)) {
      if (
        r2Domain.includes('.r2.dev') ||
        r2Domain.includes('.workers.dev') ||
        r2Domain.includes('assets.birim.com')
      ) {
        if (
          baseUrl.endsWith('.webp') &&
          !baseUrl.includes('-400w.webp') &&
          !baseUrl.includes('-800w.webp') &&
          !baseUrl.includes('-1600w.webp')
        ) {
          const cleanUrl = baseUrl.replace('?rs=1', '').replace('&rs=1', '')
          return [
            `${encodeSrcSetUrl(cleanUrl.replace(/\.webp$/, '-400w.webp'))} 400w`,
            `${encodeSrcSetUrl(cleanUrl.replace(/\.webp$/, '-800w.webp'))} 800w`,
            `${encodeSrcSetUrl(cleanUrl.replace(/\.webp$/, '-1600w.webp'))} 1600w`,
            `${encodeSrcSetUrl(cleanUrl)} 2560w`,
          ].join(', ')
        }
        return ''
      }

      const buildR2 = (w: number) => {
        const params = [`width=${w}`, `quality=${quality}`, 'format=auto']

        if (crop) {
          if (crop.width < 1.0 || crop.height < 1.0 || crop.x > 0 || crop.y > 0) {
            if (origWidth && origHeight) {
              params.push(
                `rect=${Math.round(crop.x * origWidth)},${Math.round(crop.y * origHeight)},${Math.round(crop.width * origWidth)},${Math.round(crop.height * origHeight)}`
              )
            }
          } else {
            params.push(`rect=${crop.x},${crop.y},${crop.width},${crop.height}`)
          }
        }

        const path = baseUrl.replace(r2Domain + '/', '')
        return encodeSrcSetUrl(`${r2Domain}/cdn-cgi/image/${params.join(',')}/${path}`)
      }
      return sizes.map(w => `${buildR2(w)} ${w}w`).join(', ')
    }

    return ''
  }

  // Safari treats empty srcSet="" differently from absent srcSet — ensure empty becomes undefined
  const responsiveSrcSet = generateSrcSet(activeSrc) || undefined
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px'

  // Art Direction kullanılıyor mu?
  const useArtDirection = Boolean(srcMobile || srcDesktop)

  // Hotspot varsa style'a object-position ekle
  const imgStyle: React.CSSProperties = {
    ...style,
    // SSR-stable CSS custom properties
    '--is-mirrored-general': isMirrored ? '-1' : '1',
    '--is-mirrored-mobile':
      isMirroredMobile !== undefined ? (isMirroredMobile ? '-1' : '1') : isMirrored ? '-1' : '1',
    '--is-mirrored-desktop':
      isMirroredDesktop !== undefined ? (isMirroredDesktop ? '-1' : '1') : isMirrored ? '-1' : '1',
  } as React.CSSProperties
  if (hotspot) {
    imgStyle.objectPosition = `${hotspot.x * 100}% ${hotspot.y * 100}%`
  }

  // Crop ve Hotspot pozisyon hesaplaması
  const hasCrop = !!(
    crop &&
    crop.width > 0 &&
    crop.height > 0 &&
    (crop.width < 0.999 || crop.height < 0.999 || crop.x > 0.001 || crop.y > 0.001)
  )

  if (hasCrop) {
    const centerX = (crop!.x + crop!.width / 2) * 100
    const centerY = (crop!.y + crop!.height / 2) * 100
    imgStyle.objectPosition = `${centerX}% ${centerY}%`
  } else if (hotspot) {
    imgStyle.objectPosition = `${hotspot.x * 100}% ${hotspot.y * 100}%`
  }
  const isCoverMode =
    className.includes('h-full') ||
    className.includes('h-screen') ||
    className.includes('object-cover') ||
    className.includes('object-contain') ||
    !!height

  const canCloudflareCrop = !!(crop && (crop.width >= 1.0 || (origWidth && origHeight)))
  const isServerResizingActive =
    r2Domain &&
    !r2Domain.includes('.workers.dev') &&
    !r2Domain.includes('.r2.dev') &&
    !skipImageResizing &&
    (!hasCrop || canCloudflareCrop)

  const useClientCrop = hasCrop && !isServerResizingActive

  const renderCroppedContent = (pictureContent: React.ReactNode) => {
    if (!useClientCrop) return pictureContent

    const widthPercent = (1 / crop!.width) * 100
    const heightPercent = (1 / crop!.height) * 100
    const leftPercent = -(crop!.x / crop!.width) * 100
    const topPercent = -(crop!.y / crop!.height) * 100

    return (
      <div
        className={`relative overflow-hidden ${isCoverMode ? 'w-full h-full' : 'w-full'}`}
        data-crop={JSON.stringify(crop)}
      >
        <div
          style={{
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            position: 'absolute',
          }}
        >
          {pictureContent}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{width, height}}
      >
        <span className="text-gray-400 text-sm">Görsel yüklenemedi</span>
      </div>
    )
  }

  const isHeightDefined = className.includes('h-') || className.includes('aspect-')
  const innerImgClassName = className
    .split(' ')
    .filter(c => !c.startsWith('max-w-') && !c.startsWith('w-'))
    .join(' ')

  if (useArtDirection) {
    const mobileSrcSet = (srcMobile ? generateSrcSet(srcMobile) : '') || undefined
    const desktopSrcSet = (srcDesktop ? generateSrcSet(srcDesktop) : '') || undefined

    const pictureElement = (
      <picture>
        {srcMobile && (
          <source
            media="(max-width: 768px)"
            srcSet={
              mobileSrcSet || (optimizedMobileSrc ? encodeSrcSetUrl(optimizedMobileSrc) : undefined)
            }
            sizes={mobileSrcSet ? defaultSizes : undefined}
          />
        )}

        {srcDesktop && (
          <source
            media="(min-width: 769px)"
            srcSet={
              desktopSrcSet ||
              (optimizedDesktopSrc ? encodeSrcSetUrl(optimizedDesktopSrc) : undefined)
            }
            sizes={desktopSrcSet ? defaultSizes : undefined}
          />
        )}

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
          className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full ${isHeightDefined ? '' : 'h-auto'} ${innerImgClassName} responsive-mirror`}
          draggable={draggable}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            ...imgStyle,
            display: 'block',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        />
      </picture>
    )

    return (
      <div
        className={`relative ${className}`}
        style={style}
        onClick={onClick}
        onKeyDown={
          onClick
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  ;(onClick as React.MouseEventHandler)(e as unknown as React.MouseEvent)
                }
              }
            : undefined
        }
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {styleBlock}
        {showPlaceholder && !isLoaded && (
          <img
            src={placeholder}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        )}
        {renderCroppedContent(pictureElement)}
      </div>
    )
  }

  const pictureElement = (
    <picture>
      {responsiveSrcSet && <source srcSet={responsiveSrcSet} sizes={defaultSizes} />}
      <img
        key={activeSrc}
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        {...fetchPriorityAttr}
        srcSet={responsiveSrcSet}
        sizes={responsiveSrcSet ? defaultSizes : undefined}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full ${isHeightDefined ? '' : 'h-auto'} ${innerImgClassName} responsive-mirror`}
        draggable={draggable}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...imgStyle,
          display: 'block',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      />
    </picture>
  )

  return (
    <div
      className={`relative ${className}`}
      style={style}
      onClick={onClick}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                ;(onClick as React.MouseEventHandler)(e as unknown as React.MouseEvent)
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {styleBlock}
      {showPlaceholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}
      {renderCroppedContent(pictureElement)}
    </div>
  )
}
