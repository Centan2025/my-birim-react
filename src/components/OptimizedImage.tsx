import React, {useState, useEffect, useRef, useMemo} from 'react'
import {R2ImageMetadata} from '../types'
import {rewriteR2Url, safeEncodePathSegment} from '../services/sanity/client'
import {mediaCropDebugger} from '../utils/mediaCropDebug'

/**
 * srcset attribute'ünde boşluklar ayırıcıdır — URL'deki boşlukları %20 ile encode ederek
 * "pomelli-image (9).webp" benzeri dosya isimlerinde kırılmayı önler.
 */
const encodeSrcSetUrl = (url: string): string => {
  if (!url) return url
  try {
    const urlParts = url.split('?')
    const basePath = urlParts[0] || ''
    const searchParams = urlParts[1]

    const parts = basePath.split('/')
    const encodedPath = parts
      .map((p, i) => {
        if (i < 3 && (p.includes(':') || (i === 2 && parts[0]?.includes(':')))) return p
        return safeEncodePathSegment(p)
      })
      .join('/')

    return searchParams !== undefined ? `${encodedPath}?${searchParams}` : encodedPath
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
  componentName?: string
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
  fitAuto?: boolean
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
  c: unknown,
  origW?: number,
  origH?: number
): {x: number; y: number; width: number; height: number} | undefined => {
  if (!c || typeof c !== 'object') return undefined
  const obj = c as Record<string, unknown>
  let x = 0
  let y = 0
  let width = 1
  let height = 1
  let found = false

  if (obj['cropX'] !== undefined && obj['cropWidth'] !== undefined) {
    x = Number(obj['cropX']) || 0
    y = Number(obj['cropY']) || 0
    width = Number(obj['cropWidth']) || 1
    height = Number(obj['cropHeight']) || 1
    found = true
  } else if (obj['crop'] && typeof obj['crop'] === 'object') {
    return getActiveCrop(obj['crop'], origW, origH)
  } else if (obj['x'] !== undefined && obj['width'] !== undefined) {
    x = Number(obj['x']) || 0
    y = Number(obj['y']) || 0
    width = Number(obj['width']) || 1
    height = Number(obj['height']) || 1
    found = true
  } else if (
    obj['top'] !== undefined ||
    obj['left'] !== undefined ||
    obj['bottom'] !== undefined ||
    obj['right'] !== undefined
  ) {
    const left = Number(obj['left']) || 0
    const top = Number(obj['top']) || 0
    const right = Number(obj['right']) || 0
    const bottom = Number(obj['bottom']) || 0
    x = left
    y = top
    width = Math.max(0.001, 1 - left - right)
    height = Math.max(0.001, 1 - top - bottom)
    found = true
  }

  if (!found) return undefined

  if (width > 1 && origW && origW > 0) {
    x = x / origW
    width = width / origW
  }
  if (height > 1 && origH && origH > 0) {
    y = y / origH
    height = height / origH
  }

  return {x, y, width, height}
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
  componentName,
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
  fitAuto = false,
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
          object-fit: var(--img-object-fit-desktop, var(--img-object-fit, cover)) !important;
          object-position: var(--obj-pos-desktop, center) !important;
          clip-path: var(--clip-desktop, none) !important;
          transform: var(--transform-desktop, none) !important;
          transform-origin: var(--transform-origin-desktop, center) !important;
        }
        @media (max-width: 1023px) {
          img.responsive-crop-pos,
          picture.responsive-crop-pos img,
          .responsive-crop-wrapper {
            outline: 3px dashed #ff0055 !important;
            outline-offset: -3px !important;
          }
          .responsive-crop-wrapper,
          .responsive-crop-wrapper.is-cover,
          .responsive-crop-wrapper.has-aspect {
            width: auto !important;
            height: auto !important;
            max-width: 100% !important;
            max-height: 55dvh !important;
            aspect-ratio: var(--crop-aspect-mobile, var(--crop-aspect-desktop, auto)) !important;
            margin: auto !important;
          }
          .responsive-crop-inner {
            width: var(--crop-scale-x-mobile, var(--crop-scale-x-desktop, 100%)) !important;
            height: var(--crop-scale-y-mobile, var(--crop-scale-y-desktop, 100%)) !important;
            left: var(--crop-left-mobile, var(--crop-left-desktop, 0%)) !important;
            top: var(--crop-top-mobile, var(--crop-top-desktop, 0%)) !important;
          }
        }
      `,
        }}
      />
    )
  }, [])

  const safeSrc = useMemo(() => rewriteR2Url(src), [src])
  const safeSrcMobile = useMemo(() => rewriteR2Url(srcMobile), [srcMobile])
  const safeSrcDesktop = useMemo(() => rewriteR2Url(srcDesktop), [srcDesktop])

  const [currentSrc, setCurrentSrc] = useState<string>(safeSrc)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const mediaId = useMemo(() => Math.random().toString(36).substring(2, 9), [])

  const targetOrigW = origWidthDesktop || origWidth
  const targetOrigH = origHeightDesktop || origHeight

  const [naturalDims, setNaturalDims] = useState<{w: number; h: number} | null>(
    targetOrigW && targetOrigH ? {w: targetOrigW, h: targetOrigH} : null
  )

  const [hasTriedWithoutSrcSet, setHasTriedWithoutSrcSet] = useState(false)

  // src veya props değiştiğinde state'i sıfırla ve doğal boyutları önceden yükle
  useEffect(() => {
    setCurrentSrc(safeSrc)
    setIsLoaded(false)
    setHasError(false)
    setHasTriedWithoutSrcSet(false)
    if (targetOrigW && targetOrigH) {
      setNaturalDims({w: targetOrigW, h: targetOrigH})
    } else if (safeSrc) {
      const loader = new Image()
      loader.src = safeSrc
      if (loader.complete && loader.naturalWidth > 0 && loader.naturalHeight > 0) {
        setNaturalDims({w: loader.naturalWidth, h: loader.naturalHeight})
      } else {
        loader.onload = () => {
          if (loader.naturalWidth > 0 && loader.naturalHeight > 0) {
            setNaturalDims({w: loader.naturalWidth, h: loader.naturalHeight})
          }
        }
      }
    }
  }, [safeSrc, safeSrcMobile, safeSrcDesktop, targetOrigW, targetOrigH])

  // Cache'den yüklenen görselleri yakalama & hızlı görünürlük zamanlayıcısı
  useEffect(() => {
    const checkDims = () => {
      const img = imgRef.current
      if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setIsLoaded(true)
        setNaturalDims(prev => {
          if (!prev || prev.w !== img.naturalWidth || prev.h !== img.naturalHeight) {
            return {w: img.naturalWidth, h: img.naturalHeight}
          }
          return prev
        })
      }
    }
    checkDims()
    const timer = setTimeout(checkDims, 300)
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
      setNaturalDims(prev => {
        if (!prev || prev.w !== img.naturalWidth || prev.h !== img.naturalHeight) {
          return {w: img.naturalWidth, h: img.naturalHeight}
        }
        return prev
      })
    }
    onLoad?.()
  }

  const handleError = () => {
    if (!hasTriedWithoutSrcSet && responsiveSrcSet) {
      setHasTriedWithoutSrcSet(true)
      setHasError(false)
      return
    }
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
    } else {
      setHasError(true)
    }
    onError?.()
  }

  const activeMobileSrc = srcMobile ? rewriteR2Url(srcMobile) : undefined
  const activeDesktopSrc =
    (srcDesktop ? rewriteR2Url(srcDesktop) : undefined) || rewriteR2Url(currentSrc)
  const activeSrc = rewriteR2Url(currentSrc) || activeDesktopSrc || activeMobileSrc || ''

  // Cloudflare R2 / Image Resizing logic
  const r2Domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://assets.birim.com'
  // .r2.dev ve .workers.dev domainleri image resizing desteklemez
  const skipImageResizing =
    r2Domain?.includes('.r2.dev') ||
    r2Domain?.includes('.workers.dev') ||
    r2Domain?.includes('assets.birim.com')

  const targetW = targetOrigW || naturalDims?.w
  const targetH = targetOrigH || naturalDims?.h
  const targetWMob = origWidthMobile || targetW
  const targetHMob = origHeightMobile || targetH

  const normalizedCropDesktop = useMemo(
    () => getActiveCrop(cropDesktop || crop, targetW, targetH),
    [cropDesktop, crop, targetW, targetH]
  )
  const normalizedCropMobile = useMemo(() => {
    return getActiveCrop(cropMobile, targetWMob, targetHMob)
  }, [cropMobile, targetWMob, targetHMob])

  const activeCrop = normalizedCropDesktop || normalizedCropMobile

  // R2 URL'lerini optimize et
  const getOptimizedUrl = (url: string, targetCrop?: typeof activeCrop | null): string => {
    if (!url) return placeholder
    const cropToUse =
      targetCrop === null ? undefined : targetCrop !== undefined ? targetCrop : activeCrop

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
      if (cropToUse) {
        if (cropToUse.width < 1.0 || cropToUse.height < 1.0 || cropToUse.x > 0 || cropToUse.y > 0) {
          if (origWidth && origHeight) {
            params.push(
              `rect=${Math.round(cropToUse.x * origWidth)},${Math.round(cropToUse.y * origHeight)},${Math.round(cropToUse.width * origWidth)},${Math.round(cropToUse.height * origHeight)}`
            )
          }
        } else {
          params.push(`rect=${cropToUse.x},${cropToUse.y},${cropToUse.width},${cropToUse.height}`)
        }
      }

      params.push(`quality=${quality}`)
      params.push('format=auto')

      const path = url.replace(r2Domain + '/', '')
      return encodeSrcSetUrl(`${r2Domain}/cdn-cgi/image/${params.join(',')}/${path}`)
    }

    // Sanity CDN URL (rect parameter)
    if (url.includes('cdn.sanity.io') && cropToUse && !url.includes('rect=')) {
      const match = url.match(/-(\d+)x(\d+)\./)
      const w = origWidth || (match ? Number(match[1]) : undefined)
      const h = origHeight || (match ? Number(match[2]) : undefined)
      if (
        w &&
        h &&
        (cropToUse.width < 0.999 ||
          cropToUse.height < 0.999 ||
          cropToUse.x > 0.001 ||
          cropToUse.y > 0.001)
      ) {
        const rectX = Math.round(cropToUse.x * w)
        const rectY = Math.round(cropToUse.y * h)
        const rectW = Math.round(cropToUse.width * w)
        const rectH = Math.round(cropToUse.height * h)
        const delim = url.includes('?') ? '&' : '?'
        return encodeSrcSetUrl(`${url}${delim}rect=${rectX},${rectY},${rectW},${rectH}`)
      }
    }

    return encodeSrcSetUrl(url)
  }

  // Optimize edilmiş URL'ler
  const mobileUrlToUse = activeMobileSrc || activeSrc
  const desktopUrlToUse = activeDesktopSrc || activeSrc

  const optimizedMobileSrc = mobileUrlToUse
    ? getOptimizedUrl(mobileUrlToUse, normalizedCropMobile || null)
    : undefined
  const optimizedDesktopSrc = desktopUrlToUse
    ? getOptimizedUrl(desktopUrlToUse, normalizedCropDesktop || null)
    : undefined
  const optimizedSrc = getOptimizedUrl(activeSrc, normalizedCropDesktop || normalizedCropMobile)

  // Responsive srcset oluştur
  const generateSrcSet = (baseUrl: string): string => {
    if (srcSet) return srcSet

    // R2 Logic
    const r2Domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://assets.birim.com'
    if (r2Domain && baseUrl.startsWith(r2Domain)) {
      return ''
    }

    return ''
  }

  // Safari treats empty srcSet="" differently from absent srcSet — ensure empty becomes undefined
  const responsiveSrcSet = hasTriedWithoutSrcSet
    ? undefined
    : generateSrcSet(activeSrc) || undefined
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px'

  // Art Direction kullanılıyor mu?
  const useArtDirection = Boolean(
    srcMobile ||
      srcDesktop ||
      (normalizedCropDesktop && !normalizedCropMobile) ||
      (normalizedCropMobile && !normalizedCropDesktop)
  )

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

  if (className.includes('max-md:object-contain') || className.includes('max-lg:object-contain')) {
    customStyle['--img-object-fit-mobile'] = 'contain'
  }
  if (className.includes('object-contain')) {
    customStyle['--img-object-fit'] = 'contain'
  }
  if (className.includes('md:object-cover') || className.includes('lg:object-cover')) {
    customStyle['--img-object-fit-desktop'] = 'cover'
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

  const useClientCrop = hasCrop

  if (normalizedCropDesktop) {
    const centerX = (normalizedCropDesktop.x + normalizedCropDesktop.width / 2) * 100
    const centerY = (normalizedCropDesktop.y + normalizedCropDesktop.height / 2) * 100
    customStyle['--obj-pos-desktop'] = `${centerX.toFixed(2)}% ${centerY.toFixed(2)}%`

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
    customStyle['--obj-pos-mobile'] = `${centerX.toFixed(2)}% ${centerY.toFixed(2)}%`

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

  const cropDesk = normalizedCropDesktop
  const cropMob = normalizedCropMobile

  const cropWDesk = cropDesk?.width || 1
  const cropHDesk = cropDesk?.height || 1
  const scaleXDesk = (1 / cropWDesk) * 100
  const scaleYDesk = (1 / cropHDesk) * 100
  const leftDesk = -((cropDesk?.x || 0) / cropWDesk) * 100
  const topDesk = -((cropDesk?.y || 0) / cropHDesk) * 100

  const imgWDesk =
    origWidthDesktop ||
    origWidth ||
    naturalDims?.w ||
    (imgRef.current?.naturalWidth && imgRef.current.naturalWidth > 0
      ? imgRef.current.naturalWidth
      : undefined) ||
    16
  const imgHDesk =
    origHeightDesktop ||
    origHeight ||
    naturalDims?.h ||
    (imgRef.current?.naturalHeight && imgRef.current.naturalHeight > 0
      ? imgRef.current.naturalHeight
      : undefined) ||
    9
  const aspectDesk = (cropWDesk * imgWDesk) / (cropHDesk * imgHDesk)

  const classList = className.split(' ')
  const hasExplicitContain = classList.some((c: string) => c === 'object-contain')

  const isOverflowingAspect =
    aspectDesk > 1.15 ||
    aspectDesk < 0.85 ||
    (cropDesk && (cropDesk.width < 0.98 || cropDesk.height < 0.98))

  const effectiveContain = hasExplicitContain || (fitAuto && isOverflowingAspect)

  if (effectiveContain) {
    customStyle['--img-object-fit'] = 'contain'
  } else {
    customStyle['--img-object-fit'] = 'cover'
  }

  const isCoverMode =
    !effectiveContain &&
    (classList.some(
      (c: string) =>
        c.startsWith('h-full') ||
        c.startsWith('h-screen') ||
        (c.startsWith('h-') && c !== 'h-auto') ||
        c.startsWith('aspect-')
    ) ||
      !!height)

  const activeClientCrop = useClientCrop && hasCrop

  const cropWMob = cropMob?.width || 1
  const cropHMob = cropMob?.height || 1
  const scaleXMob = (1 / cropWMob) * 100
  const scaleYMob = (1 / cropHMob) * 100
  const leftMob = -((cropMob?.x || 0) / cropWMob) * 100
  const topMob = -((cropMob?.y || 0) / cropHMob) * 100

  const imgWMob =
    origWidthMobile ||
    origWidth ||
    naturalDims?.w ||
    (imgRef.current?.naturalWidth && imgRef.current.naturalWidth > 0
      ? imgRef.current.naturalWidth
      : undefined) ||
    16
  const imgHMob =
    origHeightMobile ||
    origHeight ||
    naturalDims?.h ||
    (imgRef.current?.naturalHeight && imgRef.current.naturalHeight > 0
      ? imgRef.current.naturalHeight
      : undefined) ||
    9
  const aspectMob = (cropWMob * imgWMob) / (cropHMob * imgHMob)

  useEffect(() => {
    mediaCropDebugger.record({
      id: mediaId,
      componentName,
      src,
      srcMobile,
      srcDesktop,
      cropDesktop: cropDesk,
      cropMobile: cropMob,
      isCoverMode,
      useClientCrop,
      activeClientCrop,
      computedStyle: {
        scaleXDesk: `${scaleXDesk.toFixed(2)}%`,
        scaleYDesk: `${scaleYDesk.toFixed(2)}%`,
        leftDesk: `${leftDesk.toFixed(2)}%`,
        topDesk: `${topDesk.toFixed(2)}%`,
        scaleXMob: `${scaleXMob.toFixed(2)}%`,
        scaleYMob: `${scaleYMob.toFixed(2)}%`,
        leftMob: `${leftMob.toFixed(2)}%`,
        topMob: `${topMob.toFixed(2)}%`,
      },
    })
  }, [
    mediaId,
    componentName,
    src,
    srcMobile,
    srcDesktop,
    cropDesk,
    cropMob,
    isCoverMode,
    useClientCrop,
    activeClientCrop,
    scaleXDesk,
    scaleYDesk,
    leftDesk,
    topDesk,
    scaleXMob,
    scaleYMob,
    leftMob,
    topMob,
  ])

  const renderCroppedContent = (pictureContent: React.ReactNode) => {
    if (!activeClientCrop || !hasCrop) return pictureContent

    const uniformScaleDesk = Math.max(1, 1 / Math.min(cropWDesk, cropHDesk))
    const uniformScaleMob = Math.max(1, 1 / Math.min(cropWMob, cropHMob))

    const focalXDesk = ((cropDesk?.x || 0) + cropWDesk / 2) * 100
    const focalYDesk = ((cropDesk?.y || 0) + cropHDesk / 2) * 100

    const focalXMob = ((cropMob?.x || 0) + cropWMob / 2) * 100
    const focalYMob = ((cropMob?.y || 0) + cropHMob / 2) * 100

    const cropStyle = {
      '--crop-aspect-desktop': `${aspectDesk.toFixed(4)}`,
      '--crop-scale-x-desktop': `${scaleXDesk.toFixed(4)}%`,
      '--crop-scale-y-desktop': `${scaleYDesk.toFixed(4)}%`,
      '--crop-left-desktop': `${leftDesk.toFixed(4)}%`,
      '--crop-top-desktop': `${topDesk.toFixed(4)}%`,
      '--crop-uniform-scale-desktop': `${uniformScaleDesk.toFixed(4)}`,
      '--obj-pos-desktop': `${focalXDesk.toFixed(2)}% ${focalYDesk.toFixed(2)}%`,

      '--crop-aspect-mobile': `${aspectMob.toFixed(4)}`,
      '--crop-scale-x-mobile': `${scaleXMob.toFixed(4)}%`,
      '--crop-scale-y-mobile': `${scaleYMob.toFixed(4)}%`,
      '--crop-left-mobile': `${leftMob.toFixed(4)}%`,
      '--crop-top-mobile': `${topMob.toFixed(4)}%`,
      '--crop-uniform-scale-mobile': `${uniformScaleMob.toFixed(4)}`,
      '--obj-pos-mobile': `${focalXMob.toFixed(2)}% ${focalYMob.toFixed(2)}%`,
    } as React.CSSProperties

    const isMobileContain = classList.some(
      (c: string) =>
        c.includes('max-md:object-contain') ||
        c.includes('max-lg:object-contain') ||
        c.includes('object-contain')
    )

    return (
      <div
        className={`responsive-crop-wrapper relative w-full overflow-hidden ${isCoverMode ? 'is-cover' : 'has-aspect'} ${isMobileContain ? 'is-contain-mobile' : ''}`}
        style={cropStyle}
        data-crop={JSON.stringify({desktop: cropDesk, mobile: cropMob})}
        data-debug-media-id={mediaId}
      >
        <div className="responsive-crop-inner">{pictureContent}</div>
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
      c =>
        !c.startsWith('max-w-') &&
        !c.startsWith('w-') &&
        (!useClientCrop || (!c.startsWith('h-') && !c.startsWith('object-')))
    )
    .join(' ')

  if (useArtDirection) {
    const mobileSrcSet = (srcMobile ? generateSrcSet(srcMobile) : '') || undefined
    const desktopSrcSet = (activeDesktopSrc ? generateSrcSet(activeDesktopSrc) : '') || undefined

    const pictureElement = (
      <picture className="w-full h-full block relative overflow-hidden responsive-crop-pos">
        {optimizedMobileSrc && (
          <source
            media="(max-width: 1023px)"
            srcSet={
              mobileSrcSet || (optimizedMobileSrc ? encodeSrcSetUrl(optimizedMobileSrc) : undefined)
            }
            sizes={mobileSrcSet ? defaultSizes : undefined}
          />
        )}

        {optimizedDesktopSrc && (
          <source
            media="(min-width: 1024px)"
            srcSet={
              desktopSrcSet ||
              (optimizedDesktopSrc ? encodeSrcSetUrl(optimizedDesktopSrc) : undefined)
            }
            sizes={desktopSrcSet ? defaultSizes : undefined}
          />
        )}

        <img
          ref={imgRef}
          src={optimizedDesktopSrc || optimizedSrc || optimizedMobileSrc}
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
        className={`relative overflow-hidden flex items-center justify-center ${className}`}
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
