import React from 'react'
import {Link} from 'react-router-dom'
import {useTranslation} from '../../i18n'
import ScrollReveal from '../ScrollReveal'
import PortableTextLite from '../PortableTextLite'
import type {LocalizedString} from '../../types'

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
  locale: string
  prevProduct?: {id: string} | null
  nextProduct?: {id: string} | null
  showProductPrevNext?: boolean
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  locale,
  prevProduct,
  nextProduct,
  showProductPrevNext,
}) => {
  const {t} = useTranslation()

  return (
    <section className="space-y-10">
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
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)]">
          {t(product.name)}
        </h2>
        <ScrollReveal delay={200}>
          {(() => {
            const desc = t(product.description)
            const isPortableText =
              Array.isArray(desc) ||
              (typeof desc === 'object' &&
                desc !== null &&
                (desc as {_type?: string})._type === 'block')

            if (isPortableText) {
              const blocks = Array.isArray(desc) ? desc : [desc]
              return (
                <div className="mt-4 text-lg md:text-xl text-[var(--text-primary)] leading-relaxed max-w-3xl font-roboto-thin">
                  <PortableTextLite value={blocks} />
                </div>
              )
            }

            return (
              <p className="mt-4 text-lg md:text-xl text-[var(--text-primary)] leading-relaxed max-w-3xl font-roboto-thin">
                {desc}
              </p>
            )
          })()}
        </ScrollReveal>
      </div>
    </section>
  )
}
