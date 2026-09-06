import React from 'react'
import {ProductCard} from '../ProductCard'
import {ProductCardReveal, getProductCardStaggerDelay} from '../ProductCardReveal'
import {TextMaskReveal} from '../TextMaskReveal'
import {useTranslation} from '../../i18n'
import type {Product} from '../../types'

interface ProductRelatedProps {
  products: Product[]
  show: boolean
}

export const ProductRelated: React.FC<ProductRelatedProps> = ({products, show}) => {
  const {t} = useTranslation()

  if (!show || products.length === 0) return null

  return (
    <section className="pt-10 border-t border-gray-200">
      <TextMaskReveal delay={80}>
        <h2 className="text-xl md:text-2xl font-normal text-gray-700 mb-4">
          {t('related_products') || 'Benzer ürünler'}
        </h2>
      </TextMaskReveal>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
        {products.map((related, index) => (
          <ProductCardReveal
            key={related.id}
            delay={getProductCardStaggerDelay(index, 4)}
            duration={1.6}
            direction="down"
          >
            <ProductCard product={related} />
          </ProductCardReveal>
        ))}
      </div>
    </section>
  )
}
