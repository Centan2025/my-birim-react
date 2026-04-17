import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Product, Designer, R2ImageMetadata } from '../types'
import { OptimizedImage } from './OptimizedImage'
import { useTranslation } from '../i18n'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { analytics } from '../lib/analytics'
import { useDesigners } from '../hooks/useDesigners'

export const ProductCard: React.FC<{ product: Product }> = ({
  product,
}) => {
  const { t } = useTranslation()
  const { settings } = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  const { data: designers = [] } = useDesigners()
  const designerName = useMemo(() => {
    if (!product.designerId || !designers.length) return ''
    const designer = (designers as Designer[]).find(d => d.id === product.designerId)
    return designer ? t(designer.name) : ''
  }, [designers, product.designerId, t])

  const isObject = typeof product.mainImage === 'object' && product.mainImage !== null;
  const mainImageObj = isObject ? (product.mainImage as { url?: string; urlMobile?: string; urlDesktop?: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot'] }) : {};
  const mainImageUrl = (isObject ? mainImageObj.url : (product.mainImage as string)) || '';
  const mainImageMobile = mainImageObj.urlMobile;
  const mainImageDesktop = mainImageObj.urlDesktop;
  const mainImageCrop = mainImageObj.crop;
  const mainImageHotspot = mainImageObj.hotspot;

  const handleClick = () => {
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
        <div
          className="relative overflow-hidden aspect-square w-full flex items-center justify-center bg-[var(--bg-primary)]"
          style={{
            transition: 'scale 0.9s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          <OptimizedImage
            src={mainImageUrl}
            srcMobile={mainImageMobile}
            srcDesktop={mainImageDesktop}
            alt={t(product.name)}
            className="w-full h-full object-contain transform transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
            quality={85}
            crop={mainImageCrop}
            hotspot={mainImageHotspot}
          />
        </div>
        <div className="px-2.5 py-2 sm:px-3 sm:py-2 transition-colors duration-500">
          <h3
            className={`text-base sm:text-lg tracking-tight font-semibold text-[var(--text-primary)] group-hover:opacity-70`}
          >
            {t(product.name)}
          </h3>
          {designerName && (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">{designerName}</p>
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
