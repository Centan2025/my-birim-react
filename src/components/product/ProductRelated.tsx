import React from 'react'
import { ProductCard } from '../ProductCard'
import ScrollReveal from '../ScrollReveal'
import { useTranslation } from '../../i18n'
import { Product } from '../../types'

interface ProductRelatedProps {
  products: Product[]
  show: boolean
}

export const ProductRelated: React.FC<ProductRelatedProps> = ({ products, show }) => {
  const { t } = useTranslation()

  if (!show || products.length === 0) return null

  return (
    <ScrollReveal delay={550} threshold={0.05}>
      <div className="pt-10 border-t border-gray-200">
        <h2 className="text-xl md:text-2xl font-normal text-gray-700 mb-4">
          {t('related_products') || 'Benzer ürünler'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
          {products.map((related, index) => (
            <ScrollReveal key={related.id} delay={index < 8 ? index * 100 : 0} threshold={0.05}>
              <ProductCard product={related} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </ScrollReveal>
  )
}
