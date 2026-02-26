import React, {useMemo, useRef} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import type {Product, Designer} from '../types'
import {OptimizedImage} from './OptimizedImage'
import {useTranslation} from '../i18n'
import {useSiteSettings} from '../App'
import {analytics} from '../lib/analytics'
import {useDesigners} from '../hooks/useDesigners'
import {useCardTransition} from '../context/CardTransitionContext'

export const ProductCard: React.FC<{product: Product; variant?: 'default' | 'light'}> = ({
  product,
  variant = 'default',
}) => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const {settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const isLight = variant === 'light'
  const cardRef = useRef<HTMLDivElement>(null)
  const {triggerExpand} = useCardTransition()

  const {data: designers = []} = useDesigners()
  const designerName = useMemo(() => {
    if (!product.designerId || !designers.length) return ''
    const designer = (designers as Designer[]).find(d => d.id === product.designerId)
    return designer ? t(designer.name) : ''
  }, [designers, product.designerId, t])

  // Helper: mainImage string veya object olabilir
  const mainImageUrl =
    typeof product.mainImage === 'string' ? product.mainImage : product.mainImage?.url || ''
  const mainImageMobile =
    typeof product.mainImage === 'object' ? product.mainImage.urlMobile : undefined
  const mainImageDesktop =
    typeof product.mainImage === 'object' ? product.mainImage.urlDesktop : undefined

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    analytics.event({
      category: 'navigation',
      action: 'product_click',
      label: t(product.name),
      value: product.year,
    })

    // Get the image container's bounding rect
    const imageContainer = cardRef.current
    if (!imageContainer) {
      navigate(`/product/${product.id}`, {state: {product}})
      return
    }

    const rect = imageContainer.getBoundingClientRect()
    const crop = typeof product.mainImage === 'object' ? product.mainImage.crop : undefined
    const hotspot = typeof product.mainImage === 'object' ? product.mainImage.hotspot : undefined

    triggerExpand(
      {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        imageUrl: mainImageUrl,
        imageMobile: mainImageMobile,
        imageDesktop: mainImageDesktop,
        crop,
        hotspot,
        showGradient: true,
        initialBorderRadius: '0px',
      },
      () => {
        navigate(`/product/${product.id}`, {state: {product, fromCard: true}})
      }
    )
  }

  return (
    <Link to={`/product/${product.id}`} className="group block w-full" onClick={handleClick}>
      <div className={`bg-white ${imageBorderClass} overflow-hidden`}>
        <div
          ref={cardRef}
          className="relative overflow-hidden aspect-square w-full flex items-center justify-center bg-white group-hover:scale-[1.04]"
          style={{
            transition: 'scale 0.9s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          <OptimizedImage
            src={mainImageUrl}
            srcMobile={mainImageMobile}
            srcDesktop={mainImageDesktop}
            alt={t(product.name)}
            className="w-full h-full object-contain"
            loading="lazy"
            quality={85}
          />
        </div>
        <div className="px-2.5 py-2 sm:px-3 sm:py-2 transition-colors duration-500">
          <h3
            className={`text-base sm:text-lg tracking-tight font-semibold ${
              isLight
                ? 'text-gray-800 group-hover:text-gray-900'
                : 'text-gray-900 group-hover:text-black'
            }`}
          >
            {t(product.name)}
          </h3>
          {designerName && (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-600 truncate">{designerName}</p>
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-gray-600 flex-shrink-0">
                {product.year}
              </span>
            </div>
          )}
          {!designerName && (
            <div className="mt-1 flex items-baseline justify-end">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-gray-600">
                {product.year}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
