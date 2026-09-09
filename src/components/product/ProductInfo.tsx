import React from 'react'
import {Link} from 'react-router-dom'
import {useTranslation} from '../../i18n'
import {TextMaskReveal} from '../TextMaskReveal'
import {TextLineReveal} from '../TextLineReveal'
import PortableTextLite from '../PortableTextLite'
import type {Category, Designer, LocalizedString, Product, ProductMaterialsGroup} from '../../types'
import {ProductPdfButton} from './ProductPdfButton'
import {DetailSelectionCTA} from '../seckim/DetailSelectionCTA'

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
  product:
    | Product
    | {
        id?: string
        name: LocalizedString
        description: LocalizedString
        buyable?: boolean
        price?: number
        currency?: string
        [key: string]: unknown
      }
  locale: string
  prevProduct?: {id: string} | null
  nextProduct?: {id: string} | null
  showProductPrevNext?: boolean
  category?: Category | null
  designer?: Designer | null
  designers?: Designer[]
  mergedGroups?: ProductMaterialsGroup[]
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  locale,
  prevProduct,
  nextProduct,
  showProductPrevNext,
  category,
  designer,
  designers,
  mergedGroups,
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
        <TextMaskReveal delay={120}>
          <p className="text-3xl font-medium text-gray-900 dark:text-gray-100">
            {new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: product.currency || 'TRY',
            }).format(product.price)}
          </p>
        </TextMaskReveal>
      )}

      <div>
        <div className="flex items-center justify-between gap-4">
          <TextLineReveal
            as="h2"
            text={t(product.name)}
            className="text-3xl md:text-4xl lg:text-5xl font-oswald uppercase tracking-tight text-[var(--text-primary)]"
            delay={60}
            stagger={80}
          />
          <div className="flex items-center gap-2 shrink-0">
            {product.id && <DetailSelectionCTA product={product as unknown as Product} />}
            {product.id && (
              <ProductPdfButton
                product={product as unknown as Product}
                category={category}
                designer={designer}
                designers={designers}
                mergedGroups={mergedGroups}
                variant="icon-only"
              />
            )}
          </div>
        </div>

        {(() => {
          const desc = t(product.description)
          const isPortableText =
            Array.isArray(desc) ||
            (typeof desc === 'object' &&
              desc !== null &&
              (desc as {_type?: string})._type === 'block')

          if (isPortableText) {
            const blocks = Array.isArray(desc) ? desc : [desc]
            const isAllSimpleText = blocks.every(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (b: any) =>
                b?._type === 'block' &&
                Array.isArray(b?.children) &&
                b.children.every(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (c: any) => c?._type === 'span' && (!c.marks || c.marks.length === 0)
                )
            )

            if (isAllSimpleText) {
              return (
                <div className="mt-4 space-y-4 max-w-3xl">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {blocks.map((b: any, idx: number) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const blockText = b.children.map((c: any) => c.text || '').join('')
                    return (
                      <TextLineReveal
                        key={b._key || idx}
                        as="p"
                        text={blockText}
                        className="text-lg md:text-xl text-black dark:text-gray-100 leading-relaxed font-roboto-thin"
                        delay={160 + idx * 120}
                        stagger={65}
                      />
                    )
                  })}
                </div>
              )
            }

            return (
              <TextMaskReveal delay={180}>
                <div className="mt-4 text-lg md:text-xl text-black dark:text-gray-100 leading-relaxed max-w-3xl font-roboto-thin">
                  <PortableTextLite value={blocks} />
                </div>
              </TextMaskReveal>
            )
          }

          const rawDesc = typeof desc === 'string' ? desc : ''
          const paragraphs = rawDesc.split(/\n\n+/).filter(Boolean)

          if (paragraphs.length > 1) {
            return (
              <div className="mt-4 space-y-4 max-w-3xl">
                {paragraphs.map((para, idx) => (
                  <TextLineReveal
                    key={idx}
                    as="p"
                    text={para}
                    className="text-lg md:text-xl text-black dark:text-gray-100 leading-relaxed font-roboto-thin"
                    delay={160 + idx * 120}
                    stagger={65}
                  />
                ))}
              </div>
            )
          }

          return (
            <TextLineReveal
              as="p"
              text={rawDesc}
              className="mt-4 text-lg md:text-xl text-black dark:text-gray-100 leading-relaxed max-w-3xl font-roboto-thin"
              delay={160}
              stagger={65}
            />
          )
        })()}
      </div>
    </section>
  )
}
