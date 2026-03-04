import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../i18n'
import ScrollReveal from '../ScrollReveal'
import PortableTextLite from '../PortableTextLite'
import type { LocalizedString, Category } from '../../types'

const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 6 2 12" />
    <path d="M2 12h20" />
  </svg>
)

const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 6 22 12" />
    <path d="M22 12H2" />
  </svg>
)

interface ProductInfoProps {
  product: {
    name: LocalizedString
    description: LocalizedString
    buyable?: boolean
    price?: number
    currency?: string
  }
  category?: Category
  locale: string
  prevProduct?: { id: string } | null
  nextProduct?: { id: string } | null
  showProductPrevNext?: boolean
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  category,
  locale,
  prevProduct,
  nextProduct,
  showProductPrevNext
}) => {
  const { t } = useTranslation()

  return (
    <section className="space-y-10">
      {/* Breadcrumbs */}
      <nav className="mb-0" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex flex-wrap items-center font-inter text-[11px] sm:text-[13px] text-gray-700">
          <li>
            <Link to="/" className="font-light text-gray-900 hover:text-gray-900 transition-colors">
              {t('homepage')}
            </Link>
          </li>
          <li className="font-light text-gray-400 mx-2">|</li>
          {category && (
            <>
              <li>
                <Link
                  to={`/products/${category.id}`}
                  className="font-light text-gray-900 hover:text-gray-900 transition-colors"
                >
                  {t(category.name)}
                </Link>
              </li>
              <li className="font-light text-gray-400 mx-2">|</li>
            </>
          )}
          <li className="font-bold text-gray-900" aria-current="page">
            {t(product.name)}
          </li>
        </ol>
      </nav>

      {/* Top Prev / Next controls */}
      {showProductPrevNext && (prevProduct || nextProduct) && (
        <div className="flex items-center justify-between mt-2 mb-6">
          <div>
            {prevProduct ? (
              <Link
                to={`/product/${prevProduct.id}`}
                className="inline-flex items-center text-gray-400 hover:text-gray-800 transition-colors"
                aria-label="Previous product"
              >
                <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
              </Link>
            ) : (
              <span className="w-7 h-7 md:w-8 md:h-8" />
            )}
          </div>
          <div>
            {nextProduct ? (
              <Link
                to={`/product/${nextProduct.id}`}
                className="inline-flex items-center text-gray-400 hover:text-gray-800 transition-colors"
                aria-label="Next product"
              >
                <ArrowRight className="w-7 h-7 md:w-8 md:h-8" />
              </Link>
            ) : (
              <span className="w-7 h-7 md:w-8 md:h-8" />
            )}
          </div>
        </div>
      )}

      {product.buyable && product.price && product.price > 0 && (
        <div>
          <p className="text-3xl font-light text-gray-600">
            {new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: product.currency || 'TRY',
            }).format(product.price)}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900">
          {t(product.name)}
        </h2>
        <ScrollReveal delay={200}>
          {(() => {
            const desc = t(product.description)
            const isPortableText =
              Array.isArray(desc) ||
              (typeof desc === 'object' && desc !== null && (desc as any)._type === 'block')

            if (isPortableText) {
              const blocks = Array.isArray(desc) ? desc : [desc]
              return (
                <div className="mt-4 text-lg md:text-xl text-gray-900 leading-relaxed max-w-3xl font-roboto-thin">
                  <PortableTextLite value={blocks} />
                </div>
              )
            }

            return (
              <p className="mt-4 text-lg md:text-xl text-gray-900 leading-relaxed max-w-3xl font-roboto-thin">
                {desc}
              </p>
            )
          })()}
        </ScrollReveal>
      </div>
    </section>
  )
}
