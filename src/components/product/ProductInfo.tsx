import React from 'react'
import {Link} from 'react-router-dom'
import {useTranslation} from '../../i18n'
import ScrollReveal from '../ScrollReveal'
import PortableTextLite from '../PortableTextLite'
import type {LocalizedString, Category} from '../../types'

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
}

export const ProductInfo: React.FC<ProductInfoProps> = ({product, category, locale}) => {
  const {t} = useTranslation()

  return (
    <section className="space-y-10">
      {/* Breadcrumbs */}
      <nav className="mb-0 text-[11px] sm:text-[12px] text-gray-700" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex items-center">
          <li>
            <Link to="/" className="underline underline-offset-4 text-gray-900 hover:text-gray-900">
              {t('homepage')}
            </Link>
          </li>
          <li className="mx-2 font-light text-gray-400">|</li>
          {category && (
            <>
              <li>
                <Link
                  to={`/products/${category.id}`}
                  className="underline underline-offset-4 text-gray-900 hover:text-gray-900"
                >
                  {t(category.name)}
                </Link>
              </li>
              <li className="mx-2 font-light text-gray-400">|</li>
            </>
          )}
          <li className="font-light text-gray-500" aria-current="page">
            {t(product.name)}
          </li>
        </ol>
      </nav>

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
