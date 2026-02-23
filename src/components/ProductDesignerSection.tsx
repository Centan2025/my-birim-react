import { Link } from 'react-router-dom'
import { OptimizedImage } from './OptimizedImage'
import ScrollReveal from './ScrollReveal'
import type { Designer, LocalizedString } from '../types'

interface ProductDesignerSectionProps {
  designer: Designer | null
  t: (value: string | LocalizedString) => string
}

// Helper to extract plain text from Portable Text blocks
function toPlainText(blocks: any): string {
  if (!blocks) return ''
  if (typeof blocks === 'string') return blocks
  if (Array.isArray(blocks)) {
    return blocks
      .map(block => {
        if (block._type !== 'block' || !block.children) {
          return ''
        }
        return block.children.map((child: any) => child.text).join('')
      })
      .join('\n\n')
  }
  return ''
}

export function ProductDesignerSection({ designer, t }: ProductDesignerSectionProps) {
  if (!designer) return null

  // Safely extract bio text
  const bioText = toPlainText(t(designer.bio))
  const isLongText = bioText.length > 400

  return (
    <ScrollReveal delay={400} threshold={0.05}>
      <section className="mt-10 bg-gray-200 text-gray-600 border-t border-b border-gray-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
          <h2 className="text-xl font-thin text-gray-600 mb-4">{t('designer')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="w-full">
              <OptimizedImage
                src={typeof designer.image === 'string' ? designer.image : designer.image?.url || ''}
                srcMobile={
                  typeof designer.image === 'object'
                    ? designer.image.urlMobile
                    : designer.imageMobile
                }
                srcDesktop={
                  typeof designer.image === 'object'
                    ? designer.image.urlDesktop
                    : designer.imageDesktop
                }
                alt={t(designer.name)}
                className="w-full h-auto object-cover filter grayscale"
                loading="lazy"
                quality={85}
              />
            </div>
            <div className="w-full">
              <h3 className="text-2xl font-normal text-gray-700">{t(designer.name)}</h3>
              <p className="mt-4 text-gray-800 font-normal leading-relaxed">
                {bioText.slice(0, 400)}
                {isLongText ? '…' : ''}
              </p>
              <Link
                to={`/designer/${designer.id}`}
                className="inline-block mt-6 text-gray-600 font-light underline underline-offset-4 hover:text-gray-800"
              >
                {t('discover_the_designer')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}


