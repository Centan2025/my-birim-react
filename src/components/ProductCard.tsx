import React, {useMemo, useRef} from 'react'
import {Link} from 'react-router-dom'
import {motion, useInView} from 'framer-motion'
import type {Product, Designer, R2ImageMetadata} from '../types'
import {OptimizedImage} from './OptimizedImage'
import {useTranslation} from '../i18n'
import {useSiteSettings} from '../context/SiteSettingsContext'
import {analytics} from '../lib/analytics'
import {useDesigners} from '../hooks/useDesigners'
import {SelectionButton} from './seckim/SelectionButton'
import {ShoppingBag} from 'lucide-react'
import {isProductShopEligible, getShopProductUrl, getShopCtaLabel} from '../utils/shopBridge'

export const ProductCard: React.FC<{
  product: Product
  priority?: boolean
  index?: number
}> = ({product, priority = false, index = 0}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, {once: true, amount: 0.05, margin: '0px 0px 50px 0px'})
  const colIndex = index % 4
  const cardDelay = index < 8 ? 0.04 + index * 0.06 : (colIndex % 4) * 0.06
  const {t, locale} = useTranslation()
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
    <motion.div
      ref={cardRef}
      initial={{opacity: 0, y: 45, scale: 0.92}}
      animate={isInView ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 45, scale: 0.92}}
      transition={{
        y: {
          duration: 0.92,
          delay: cardDelay,
          ease: [0.16, 1, 0.3, 1],
        },
        scale: {
          duration: 0.84,
          delay: cardDelay + 0.05,
          ease: [0.45, 0, 0.2, 1],
        },
        opacity: {
          duration: 0.68,
          delay: cardDelay,
          ease: 'easeOut',
        },
      }}
      className="w-full h-full will-change-transform"
    >
      <Link to={`/product/${product.id}`} className="group block w-full" onClick={handleClick}>
        <div className={`bg-white dark:bg-neutral-900 ${imageBorderClass} overflow-hidden`}>
          <div className="relative overflow-hidden aspect-square w-full flex items-center justify-center bg-white dark:bg-neutral-900">
            <OptimizedImage
              src={mainImageUrl}
              srcMobile={mainImageMobile}
              srcDesktop={mainImageDesktop}
              alt={`Birim ${t(product.name)}`}
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
            <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
              {(() => {
                const isEligible = isProductShopEligible(product)
                const shopUrl = isEligible ? getShopProductUrl(product) : null
                if (!shopUrl) return <div />

                return (
                  <a
                    href={shopUrl}
                    onClick={e => e.stopPropagation()}
                    className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs text-neutral-900 dark:text-neutral-100 border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
                    title={getShopCtaLabel(product, locale, 'card')}
                    aria-label={getShopCtaLabel(product, locale, 'card')}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.6} />
                    <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:inline-block">
                      {getShopCtaLabel(product, locale, 'card')}
                    </span>
                  </a>
                )
              })()}
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
    </motion.div>
  )
}
