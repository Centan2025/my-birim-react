import React, {useMemo} from 'react'
import {Link} from 'react-router-dom'
import type {Product, Designer, R2ImageMetadata} from '../types'
import {OptimizedImage} from './OptimizedImage'
import {useTranslation} from '../i18n'
import {useSiteSettings} from '../context/SiteSettingsContext'
import {analytics} from '../lib/analytics'
import {useDesigners} from '../hooks/useDesigners'
import {SelectionButton} from './seckim/SelectionButton'

export const ProductCard: React.FC<{
  product: Product
  priority?: boolean
}> = ({product, priority = false}) => {
  const {t} = useTranslation()
  const {settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  const {data: designers = []} = useDesigners()
  const designerName = useMemo(() => {
    if (!product.designerId || !designers.length) return ''
    const designer = (designers as Designer[]).find(d => d.id === product.designerId)
    return designer ? t(designer.name) : ''
  }, [designers, product.designerId, t])

  const isObject = typeof product.mainImage === 'object' && product.mainImage !== null
  const mainImageObj = isObject
    ? (product.mainImage as {
        url?: string
        urlMobile?: string
        urlDesktop?: string
        crop?: R2ImageMetadata['crop']
        cropMobile?: R2ImageMetadata['crop']
        cropDesktop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        hotspotMobile?: R2ImageMetadata['hotspot']
        hotspotDesktop?: R2ImageMetadata['hotspot']
        origWidth?: number
        origHeight?: number
        origWidthMobile?: number
        origHeightMobile?: number
        origWidthDesktop?: number
        origHeightDesktop?: number
        isMirrored?: boolean
        isMirroredMobile?: boolean
        isMirroredDesktop?: boolean
      })
    : {}
  const mainImageUrl = (isObject ? mainImageObj.url : (product.mainImage as string)) || ''
  const mainImageMobile = mainImageObj.urlMobile
  const mainImageDesktop = mainImageObj.urlDesktop
  const mainImageCrop = mainImageObj.crop
  const mainImageCropMobile = mainImageObj.cropMobile
  const mainImageCropDesktop = mainImageObj.cropDesktop
  const mainImageHotspot = mainImageObj.hotspot
  const mainImageHotspotMobile = mainImageObj.hotspotMobile
  const mainImageHotspotDesktop = mainImageObj.hotspotDesktop
  const mainImageOrigWidth = mainImageObj.origWidth
  const mainImageOrigHeight = mainImageObj.origHeight
  const mainImageOrigWidthMobile = mainImageObj.origWidthMobile
  const mainImageOrigHeightMobile = mainImageObj.origHeightMobile
  const mainImageOrigWidthDesktop = mainImageObj.origWidthDesktop
  const mainImageOrigHeightDesktop = mainImageObj.origHeightDesktop
  const mainImageIsMirrored =
    mainImageObj.isMirrored !== undefined ? !!mainImageObj.isMirrored : undefined
  const mainImageIsMirroredMobile =
    mainImageObj.isMirroredMobile !== undefined ? !!mainImageObj.isMirroredMobile : undefined
  const mainImageIsMirroredDesktop =
    mainImageObj.isMirroredDesktop !== undefined ? !!mainImageObj.isMirroredDesktop : undefined

  const handleClick = () => {
    window.scrollTo({top: 0, left: 0, behavior: 'instant'})
    // We still want to handle analytics before navigation
    analytics.event({
      category: 'navigation',
      action: 'product_click',
      label: t(product.name),
      value: product.year,
    })
  }

  return (
    <Link to={`/product/${product.id}`} className="group block w-full" onClick={handleClick}>
      <div className={`bg-[var(--bg-primary)] ${imageBorderClass} overflow-hidden`}>
        <div className="relative overflow-hidden aspect-square w-full flex items-center justify-center bg-[var(--bg-primary)]">
          <OptimizedImage
            src={mainImageUrl}
            srcMobile={mainImageMobile}
            srcDesktop={mainImageDesktop}
            alt={t(product.name)}
            width={480}
            height={480}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full transform transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            showPlaceholder={!priority}
            fadeOnLoad={!priority}
            quality={85}
            crop={mainImageCrop}
            cropMobile={mainImageCropMobile}
            cropDesktop={mainImageCropDesktop}
            hotspot={mainImageHotspot}
            hotspotMobile={mainImageHotspotMobile}
            hotspotDesktop={mainImageHotspotDesktop}
            origWidth={mainImageOrigWidth}
            origHeight={mainImageOrigHeight}
            origWidthMobile={mainImageOrigWidthMobile}
            origHeightMobile={mainImageOrigHeightMobile}
            origWidthDesktop={mainImageOrigWidthDesktop}
            origHeightDesktop={mainImageOrigHeightDesktop}
            isMirrored={mainImageIsMirrored}
            isMirroredMobile={mainImageIsMirroredMobile}
            isMirroredDesktop={mainImageIsMirroredDesktop}
            fitAuto={true}
          />
          <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex justify-end pointer-events-none">
            <div className="pointer-events-auto">
              <SelectionButton product={product} />
            </div>
          </div>
        </div>
        <div className="px-2.5 py-2 sm:px-3 sm:py-2 transition-colors duration-500">
          <h3
            className={`text-base sm:text-lg tracking-tight font-semibold text-[var(--text-primary)] group-hover:opacity-70`}
          >
            {t(product.name)}
          </h3>
          {designerName && (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">
                {designerName}
              </p>
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] flex-shrink-0">
                {product.year}
              </span>
            </div>
          )}
          {!designerName && (
            <div className="mt-1 flex items-baseline justify-end">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                {product.year}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
