import React from 'react'
import {Link} from 'react-router-dom'
import type {Product} from '../types'
import {OptimizedImage} from './OptimizedImage'
import {useTranslation} from '../i18n'
import {useSiteSettings} from '../App'
import {analytics} from '../src/lib/analytics'

export const ProductCard: React.FC<{product: Product; variant?: 'default' | 'light'}> = ({
  product,
  variant = 'default',
}) => {
  const {t} = useTranslation()
  const {settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const isLight = variant === 'light'

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
          label: product.id,
          value: product.year,
        })
      }}
    >
      <div
        className={`relative overflow-hidden aspect-square ${imageBorderClass} w-full bg-white flex items-center justify-center`}
      >
        <OptimizedImage
          src={mainImageUrl}
          srcMobile={mainImageMobile}
          srcDesktop={mainImageDesktop}
          alt={t(product.name)}
          className={`w-full h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-[1.03] ${imageBorderClass}`}
          loading="lazy"
          quality={85}
        />
      </div>
      <div className="mt-4 overflow-hidden">
        <div className="transition-transform duration-700 ease-in-out group-hover:-translate-y-1">
          <h3
            className={`text-lg ${isLight ? 'font-light text-gray-600 group-hover:text-gray-700' : 'font-semibold text-gray-800 group-hover:text-black'}`}
          >
            {t(product.name)}
          </h3>
          <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
            {product.year}
          </p>
        </div>
      </div>
    </Link>
  )
}
