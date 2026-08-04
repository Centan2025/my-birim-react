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
  cropMobile?: R2ImageMetadata['crop']
  hotspotMobile?: R2ImageMetadata['hotspot']
  origWidthMobile?: number
  origHeightMobile?: number
  cropDesktop?: R2ImageMetadata['crop']
  hotspotDesktop?: R2ImageMetadata['hotspot']
  origWidthDesktop?: number
  origHeightDesktop?: number
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
const getActiveCrop = (
  c: unknown
): {x: number; y: number; width: number; height: number} | undefined => {
  if (!c || typeof c !== 'object') return undefined
  const obj = c as Record<string, unknown>
  if (obj['cropX'] !== undefined && obj['cropWidth'] !== undefined) {
    return {
      x: Number(obj['cropX']) || 0,
      y: Number(obj['cropY']) || 0,
      width: Number(obj['cropWidth']) || 1,
      height: Number(obj['cropHeight']) || 1,
    }
  }
  if (obj['crop'] && typeof obj['crop'] === 'object') {
    return getActiveCrop(obj['crop'])
  }
  if (obj['x'] !== undefined && obj['width'] !== undefined) {
    return {
      x: Number(obj['x']) || 0,
      y: Number(obj['y']) || 0,
      width: Number(obj['width']) || 1,
      height: Number(obj['height']) || 1,
    }
  }
  if (
    obj['top'] !== undefined ||
    obj['left'] !== undefined ||
    obj['bottom'] !== undefined ||
    obj['right'] !== undefined
  ) {
    const left = Number(obj['left']) || 0
    const top = Number(obj['top']) || 0
    const right = Number(obj['right']) || 0
    const bottom = Number(obj['bottom']) || 0
    return {
      x: left,
      y: top,
      width: Math.max(0.001, 1 - left - right),
      height: Math.max(0.001, 1 - top - bottom),
    }
  }
  return undefined
}

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
  cropMobile,
  hotspotMobile,
  origWidthMobile,
  origHeightMobile,
  cropDesktop,
  hotspotDesktop,
  origWidthDesktop,
  origHeightDesktop,
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
        img.responsive-crop-pos,
        picture.responsive-crop-pos img {
          aspect-ratio: var(--aspect-desktop, auto) !important;
          object-position: var(--obj-pos-desktop, center) !important;
          clip-path: var(--clip-desktop, none) !important;
          transform: var(--transform-desktop, none) !important;
          transform-origin: var(--transform-origin-desktop, center) !important;
        }
        @media (max-width: 1023px) {
          img.responsive-crop-pos,
          picture.responsive-crop-pos img {
            aspect-ratio: var(--aspect-mobile, var(--aspect-desktop, auto)) !important;
            object-position: var(--obj-pos-mobile, var(--obj-pos-desktop, center)) !important;
            clip-path: var(--clip-mobile, var(--clip-desktop, none)) !important;
            transform: var(--transform-mobile, var(--transform-desktop, none)) !important;
            transform-origin: var(--transform-origin-mobile, var(--transform-origin-desktop, center)) !important;
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
  const imgRef = useRef<HTMLImageElement>(null)

  const [naturalDims, setNaturalDims] = useState<{w: number; h: number} | null>(
    origWidth && origHeight ? {w: origWidth, h: origHeight} : null
  )

  const [hasTriedWithoutSrcSet, setHasTriedWithoutSrcSet] = useState(false)
  const [hasTriedDirectOrigin, setHasTriedDirectOrigin] = useState(false)

  // src veya props değiştiğinde state'i sıfırla
  useEffect(() => {
    setCurrentSrc(src)
    setIsLoaded(false)
    setHasError(false)
    setHasTriedWithoutSrcSet(false)
    setHasTriedDirectOrigin(false)
    if (origWidth && origHeight) {
      setNaturalDims({w: origWidth, h: origHeight})
    }
  }, [src, srcMobile, srcDesktop, origWidth, origHeight])

  // Cache'den yüklenen görselleri yakalama & hızlı görünürlük zamanlayıcısı
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true)
      if (img.naturalHeight > 0) {
        setNaturalDims({w: img.naturalWidth, h: img.naturalHeight})
      }
    }
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [currentSrc, srcMobile, srcDesktop])

  // React henüz fetchPriority prop'unu DOM attribute olarak tanımıyor; uyarıyı
  // engellemek için custom attribute'u lowercase olarak enjekte ediyoruz.
  const fetchPriorityAttr =
    fetchPriority && fetchPriority !== 'auto'
      ? ({fetchpriority: fetchPriority} as Record<string, string>)
      : {}

  // Placeholder (çok küçük, özel renk veya varsayılan gri)
  const placeholder = `data:image/svg+xml;base64,${btoa(`<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${placeholderColor}"/></svg>`)}`

  const handleLoad = (e?: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    const img = e?.currentTarget || imgRef.current
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalDims({w: img.naturalWidth, h: img.naturalHeight})
    }
    onLoad?.()
  }

  const handleError = () => {
    if (!hasTriedWithoutSrcSet && responsiveSrcSet) {
      setHasTriedWithoutSrcSet(true)
      setHasError(false)
      return
    }
    if (!hasTriedDirectOrigin && currentSrc) {
      const primaryDomain = (
        import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
      ).replace(/^https?:\/\//, '')
      const originDomain = (
        import.meta.env['VITE_R2_ORIGIN_DOMAIN'] ||
        'https://pub-5e705b2a702d4bb1a3631c558917599d.r2.dev'
      ).replace(/^https?:\/\//, '')
      if (currentSrc.includes(primaryDomain)) {
        const fallbackUrl = currentSrc.replace(primaryDomain, originDomain)
        setHasTriedDirectOrigin(true)
        setCurrentSrc(fallbackUrl)
        setHasError(false)
        return
      }
    }
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
    } else {
      setHasError(true)
    }
    onError?.()
  }

  const activeSrc =
    rewriteR2Url(currentSrc) || rewriteR2Url(srcMobile) || rewriteR2Url(srcDesktop) || ''
  const activeMobileSrc = rewriteR2Url(srcMobile || currentSrc)
  const activeDesktopSrc = rewriteR2Url(srcDesktop || currentSrc)

  // Cloudflare R2 / Image Resizing logic
  const r2Domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
  // .r2.dev ve .workers.dev domainleri image resizing desteklemez
  const skipImageResizing =
    r2Domain?.includes('.r2.dev') ||
    r2Domain?.includes('.workers.dev') ||
    r2Domain?.includes('assets.birim.com')

  const normalizedCropDesktop = useMemo(
    () => getActiveCrop(cropDesktop || crop),
    [cropDesktop, crop]
  )
  const normalizedCropMobile = useMemo(
    () => getActiveCrop(cropMobile || cropDesktop || crop),
    [cropMobile, cropDesktop, crop]
  )

  const activeCrop = normalizedCropDesktop || normalizedCropMobile

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
      if (activeCrop) {
        if (
          activeCrop.width < 1.0 ||
          activeCrop.height < 1.0 ||
          activeCrop.x > 0 ||
          activeCrop.y > 0
        ) {
          if (origWidth && origHeight) {
            params.push(
              `rect=${Math.round(activeCrop.x * origWidth)},${Math.round(activeCrop.y * origHeight)},${Math.round(activeCrop.width * origWidth)},${Math.round(activeCrop.height * origHeight)}`
            )
          }
        } else {
          params.push(
            `rect=${activeCrop.x},${activeCrop.y},${activeCrop.width},${activeCrop.height}`
          )
        }
      }

      params.push(`quality=${quality}`)
      params.push('format=auto')

      const path = url.replace(r2Domain + '/', '')
      return encodeSrcSetUrl(`${r2Domain}/cdn-cgi/image/${params.join(',')}/${path}`)
    }

    // Sanity CDN URL (rect parameter)
    if (url.includes('cdn.sanity.io') && activeCrop && !url.includes('rect=')) {
      const match = url.match(/-(\d+)x(\d+)\./)
      const w = origWidth || (match ? Number(match[1]) : undefined)
      const h = origHeight || (match ? Number(match[2]) : undefined)
      if (
        w &&
        h &&
        (activeCrop.width < 0.999 ||
          activeCrop.height < 0.999 ||
          activeCrop.x > 0.001 ||
          activeCrop.y > 0.001)
      ) {
        const rectX = Math.round(activeCrop.x * w)
        const rectY = Math.round(activeCrop.y * h)
        const rectW = Math.round(activeCrop.width * w)
        const rectH = Math.round(activeCrop.height * h)
        const delim = url.includes('?') ? '&' : '?'
        return encodeSrcSetUrl(`${url}${delim}rect=${rectX},${rectY},${rectW},${rectH}`)
      }
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

    // R2 Logic
    const r2Domain =
      import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
    if (r2Domain && baseUrl.startsWith(r2Domain)) {
      if (
        r2Domain.includes('.r2.dev') ||
        r2Domain.includes('.workers.dev') ||
        r2Domain.includes('assets.birim.com')
      ) {
        // Sadece rs=1 (responsive sizes üretilmiş) olan webp görseller için srcset döndür
        if (
          baseUrl.includes('rs=1') &&
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

      const sizes = [400, 800, 1200, 1600, 2000]
      const buildR2 = (w: number) => {
        const params = [`width=${w}`, `quality=${quality}`, 'format=auto']

        if (activeCrop) {
          if (
            activeCrop.width < 1.0 ||
            activeCrop.height < 1.0 ||
            activeCrop.x > 0 ||
            activeCrop.y > 0
          ) {
            if (origWidth && origHeight) {
              params.push(
                `rect=${Math.round(activeCrop.x * origWidth)},${Math.round(activeCrop.y * origHeight)},${Math.round(activeCrop.width * origWidth)},${Math.round(activeCrop.height * origHeight)}`
              )
            }
          } else {
            params.push(
              `rect=${activeCrop.x},${activeCrop.y},${activeCrop.width},${activeCrop.height}`
            )
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
  const responsiveSrcSet = hasTriedWithoutSrcSet
    ? undefined
    : generateSrcSet(activeSrc) || undefined
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px'

  // Art Direction kullanılıyor mu?
  const useArtDirection = Boolean(srcMobile || srcDesktop)

  // Hotspot ve crop position style'a ekle
  const imgStyle: React.CSSProperties = {
    ...style,
    // SSR-stable CSS custom properties
    '--is-mirrored-general': isMirrored ? '-1' : '1',
    '--is-mirrored-mobile':
      isMirroredMobile !== undefined ? (isMirroredMobile ? '-1' : '1') : isMirrored ? '-1' : '1',
    '--is-mirrored-desktop':
      isMirroredDesktop !== undefined ? (isMirroredDesktop ? '-1' : '1') : isMirrored ? '-1' : '1',
  } as React.CSSProperties

  const customStyle = imgStyle as Record<string, string>

  if (normalizedCropDesktop) {
    const centerX = (normalizedCropDesktop.x + normalizedCropDesktop.width / 2) * 100
    const centerY = (normalizedCropDesktop.y + normalizedCropDesktop.height / 2) * 100
    const topP = (normalizedCropDesktop.y * 100).toFixed(2)
    const rightP = ((1 - normalizedCropDesktop.x - normalizedCropDesktop.width) * 100).toFixed(2)
    const bottomP = ((1 - normalizedCropDesktop.y - normalizedCropDesktop.height) * 100).toFixed(2)
    const leftP = (normalizedCropDesktop.x * 100).toFixed(2)

    customStyle['--obj-pos-desktop'] = `${centerX.toFixed(2)}% ${centerY.toFixed(2)}%`
    customStyle['--clip-desktop'] = `inset(${topP}% ${rightP}% ${bottomP}% ${leftP}%)`

    const oW = origWidthDesktop || origWidth || 1
    const oH = origHeightDesktop || origHeight || 1
    const cW = normalizedCropDesktop.width * oW
    const cH = normalizedCropDesktop.height * oH
    if (cW > 0 && cH > 0) {
      customStyle['--aspect-desktop'] = `${cW.toFixed(4)} / ${cH.toFixed(4)}`
    }
  } else if (hotspotDesktop || hotspot) {
    const hs = hotspotDesktop || hotspot!
    customStyle['--obj-pos-desktop'] = `${hs.x * 100}% ${hs.y * 100}%`
  }

  if (normalizedCropMobile) {
    const centerX = (normalizedCropMobile.x + normalizedCropMobile.width / 2) * 100
    const centerY = (normalizedCropMobile.y + normalizedCropMobile.height / 2) * 100
    const topP = (normalizedCropMobile.y * 100).toFixed(2)
    const rightP = ((1 - normalizedCropMobile.x - normalizedCropMobile.width) * 100).toFixed(2)
    const bottomP = ((1 - normalizedCropMobile.y - normalizedCropMobile.height) * 100).toFixed(2)
    const leftP = (normalizedCropMobile.x * 100).toFixed(2)

    customStyle['--obj-pos-mobile'] = `${centerX.toFixed(2)}% ${centerY.toFixed(2)}%`
    customStyle['--clip-mobile'] = `inset(${topP}% ${rightP}% ${bottomP}% ${leftP}%)`

    const oW = origWidthMobile || origWidth || 1
    const oH = origHeightMobile || origHeight || 1
    const cW = normalizedCropMobile.width * oW
    const cH = normalizedCropMobile.height * oH
    if (cW > 0 && cH > 0) {
      customStyle['--aspect-mobile'] = `${cW.toFixed(4)} / ${cH.toFixed(4)}`
    }
  } else if (hotspotMobile || hotspot) {
    const hs = hotspotMobile || hotspot!
    customStyle['--obj-pos-mobile'] = `${hs.x * 100}% ${hs.y * 100}%`
  }

  const hasCrop = !!(
    activeCrop &&
    activeCrop.width > 0 &&
    activeCrop.height > 0 &&
    (activeCrop.width < 0.999 ||
      activeCrop.height < 0.999 ||
      activeCrop.x > 0.001 ||
      activeCrop.y > 0.001)
  )

  const canCloudflareCrop = !!(activeCrop && (activeCrop.width >= 1.0 || (origWidth && origHeight)))
  const isServerResizingActive =
    r2Domain &&
    !r2Domain.includes('.workers.dev') &&
    !r2Domain.includes('.r2.dev') &&
    !skipImageResizing &&
    (!hasCrop || canCloudflareCrop)

  const useClientCrop = hasCrop && !isServerResizingActive

  const classList = className.split(' ')
  const isCoverMode =
    classList.some(
      (c: string) =>
        c.includes('h-full') ||
        c.includes('h-screen') ||
        c.includes('object-cover') ||
        c.includes('object-contain') ||
        c.includes('min-h-')
    ) || !!height

  const renderCroppedContent = (pictureContent: React.ReactNode) => {
    if (!useClientCrop || !activeCrop) return pictureContent

    const cropW = activeCrop.width
    const cropH = activeCrop.height
    if (cropW >= 0.999 && cropH >= 0.999 && activeCrop.x <= 0.001 && activeCrop.y <= 0.001) {
      return pictureContent
    }

    const scaleX = (1 / cropW) * 100
    const scaleY = (1 / cropH) * 100
    const leftPercent = -(activeCrop.x / cropW) * 100
    const topPercent = -(activeCrop.y / cropH) * 100

    // Orijinal görsel boyutları (varsa naturalDims veya origWidth/origHeight)
    const imgW = naturalDims?.w || origWidth || 1
    const imgH = naturalDims?.h || origHeight || 1
    const croppedAspect = (cropW * imgW) / (cropH * imgH)

    return (
      <div
        className={`relative w-full ${isCoverMode ? 'h-full' : ''} overflow-hidden`}
        style={{
          aspectRatio: isCoverMode ? undefined : `${croppedAspect}`,
        }}
        data-crop={JSON.stringify(activeCrop)}
      >
        <div
          style={{
            width: `${scaleX.toFixed(4)}%`,
            height: `${scaleY.toFixed(4)}%`,
            left: `${leftPercent.toFixed(4)}%`,
            top: `${topPercent.toFixed(4)}%`,
            position: 'absolute',
          }}
          className="w-full h-full"
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

  const isHeightDefined = classList.some(
    (c: string) => (c.startsWith('h-') && c !== 'h-auto') || c.startsWith('aspect-')
  )
  const innerImgClassName = className
    .split(' ')
    .filter(
      c => !c.startsWith('max-w-') && !c.startsWith('w-') && (!useClientCrop || !c.startsWith('h-'))
    )
    .map(c =>
      useClientCrop && (c === 'object-contain' || c.startsWith('object-')) ? 'object-cover' : c
    )
    .join(' ')

  if (useArtDirection) {
    const mobileSrcSet = (srcMobile ? generateSrcSet(srcMobile) : '') || undefined
    const desktopSrcSet = (srcDesktop ? generateSrcSet(srcDesktop) : '') || undefined

    const pictureElement = (
      <picture className="w-full h-full block relative overflow-hidden responsive-crop-pos">
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
          className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full ${useClientCrop ? 'h-full' : isHeightDefined ? '' : 'h-auto'} ${innerImgClassName} responsive-mirror responsive-crop-pos`}
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
        className={`relative overflow-hidden ${className}`}
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
    <picture className="w-full h-full block relative overflow-hidden responsive-crop-pos">
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
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full ${useClientCrop ? 'h-full' : isHeightDefined ? '' : 'h-auto'} ${innerImgClassName} responsive-mirror responsive-crop-pos`}
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
      className={`relative overflow-hidden ${className}`}
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
