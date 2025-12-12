import React, {useMemo} from 'react'
import {Link} from 'react-router-dom'
import type {Product, Designer} from '../types'
import {OptimizedImage} from './OptimizedImage'
import {useTranslation} from '../i18n'
import {useSiteSettings} from '../App'
import {analytics} from '../src/lib/analytics'
import {useDesigners} from '../src/hooks/useDesigners'

export const ProductCard: React.FC<{product: Product; variant?: 'default' | 'light'}> = ({
  product,
  variant = 'default',
}) => {
  const {t} = useTranslation()
  const {settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const isLight = variant === 'light'

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

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block w-full"
      onClick={() => {
        analytics.event({
          category: 'navigation',
          action: 'product_click',
          label: t(product.name), // Ürün ID'si yerine okunabilir ürün adı
          value: product.year,
        })
      }}
    >
      <div
        className={`bg-white ${imageBorderClass} overflow-hidden transition-transform duration-700 ease-in-out group-hover:-translate-y-1`}
      >
        <div className="relative overflow-hidden aspect-square w-full flex items-center justify-center bg-white">
          <OptimizedImage
            src={mainImageUrl}
            srcMobile={mainImageMobile}
            srcDesktop={mainImageDesktop}
            alt={t(product.name)}
            className="w-full h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-[1.03]"
            loading="lazy"
            quality={85}
          />
        </div>
        <div className="px-2 py-1.5 sm:px-2 sm:py-1.5">
          <h3
            className={`text-base sm:text-lg tracking-tight font-semibold ${
              isLight
                ? 'text-gray-700 group-hover:text-gray-800'
                : 'text-gray-800 group-hover:text-black'
            }`}
          >
            {t(product.name)}
          </h3>
          {designerName && (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-500 truncate">{designerName}</p>
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-gray-500 flex-shrink-0">
                {product.year}
              </span>
            </div>
          )}
          {!designerName && (
            <div className="mt-1 flex items-baseline justify-end">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-gray-500">
                {product.year}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
