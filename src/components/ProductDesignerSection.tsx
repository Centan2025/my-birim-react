import {useNavigate} from 'react-router-dom'
import {OptimizedImage} from './OptimizedImage'
import ScrollReveal from './ScrollReveal'
import type {Designer, LocalizedString, R2ImageMetadata} from '../types'

interface ProductDesignerSectionProps {
  designer?: Designer | null
  designers?: Designer[]
  t: (value: string | LocalizedString) => string
}

// Helper to extract plain text from Portable Text blocks
function toPlainText(blocks: unknown): string {
  if (!blocks) return ''
  if (typeof blocks === 'string') return blocks
  if (Array.isArray(blocks)) {
    return (blocks as {_type?: string; children?: {text?: string}[]}[])
      .map(block => {
        if (block._type !== 'block' || !block.children) {
          return ''
        }
        return block.children.map(child => child.text || '').join('')
      })
      .join('\n\n')
  }
  return ''
}

export function ProductDesignerSection({
  designer,
  designers: designersProp,
  t,
}: ProductDesignerSectionProps) {
  const navigate = useNavigate()
  const designers = designersProp || (designer ? [designer] : [])
  if (designers.length === 0) return null

  return (
    <ScrollReveal delay={400} threshold={0.05}>
      <section className="mt-10 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-t border-b border-[var(--border-primary)] transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
          <h2 className="text-xl font-thin text-[var(--text-secondary)] mb-4">
            {designers.length > 1 ? t('designers') : t('designer')}
          </h2>
          <div className="space-y-12">
            {designers.map(d => {
              const bioText = toPlainText(t(d.bio))
              const isLongText = bioText.length > 400
              return (
                <div key={d.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="w-full">
                    <OptimizedImage
                      src={typeof d.image === 'string' ? d.image : d.image?.url || ''}
                      srcMobile={typeof d.image === 'object' ? d.image.urlMobile : d.imageMobile}
                      srcDesktop={typeof d.image === 'object' ? d.image.urlDesktop : d.imageDesktop}
                      alt={t(d.name)}
                      className="w-full h-auto object-cover filter grayscale"
                      loading="lazy"
                      quality={85}
                      crop={
                        typeof d.image === 'object'
                          ? (d.image as {crop?: R2ImageMetadata['crop']})?.crop
                          : undefined
                      }
                      hotspot={
                        typeof d.image === 'object'
                          ? (d.image as {hotspot?: R2ImageMetadata['hotspot']})?.hotspot
                          : undefined
                      }
                    />
                  </div>
                  <div className="w-full">
                    <h3 className="text-2xl font-normal text-[var(--text-primary)]">{t(d.name)}</h3>
                    <p className="mt-4 text-[var(--text-primary)] font-normal leading-relaxed opacity-90">
                      {bioText.slice(0, 400)}
                      {isLongText ? '…' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/designer/${d.id}`, {state: {slideOver: true, designer: d}})
                      }
                      className="inline-block mt-6 text-[var(--text-secondary)] font-light underline underline-offset-4 hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0 transition-colors"
                    >
                      {t('discover_the_designer')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}
