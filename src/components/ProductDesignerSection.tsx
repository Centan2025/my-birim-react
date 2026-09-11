import {useNavigate} from 'react-router-dom'
import {OptimizedImage} from './OptimizedImage'
import {SiteLogo} from './SiteLogo'
import {useSiteSettings} from '../hooks/useSiteData'
import {isBirimDesignStudio} from '../utils/designerUtils'
import ScrollReveal from './ScrollReveal'
import {TextMaskReveal} from './TextMaskReveal'
import {ProductCardReveal} from './ProductCardReveal'
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
  const {data: settings} = useSiteSettings()
  const designers = designersProp || (designer ? [designer] : [])
  if (designers.length === 0) return null

  const hasMultiple = designers.length > 1
  const isSingleBirim =
    !hasMultiple && (isBirimDesignStudio(designers[0]) || Boolean(designers[0]?.isCompanyLogo))

  return (
    <ScrollReveal delay={400} threshold={0.05}>
      <section className="mt-10 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-t border-b border-[var(--border-primary)] transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
          <TextMaskReveal delay={80}>
            <h2 className="text-xl font-thin text-[var(--text-secondary)] mb-4">
              {hasMultiple
                ? t('designers')
                : isSingleBirim
                  ? t('design_studio') || 'Tasarım Stüdyosu'
                  : t('designer')}
            </h2>
          </TextMaskReveal>
          <div className="space-y-12">
            {designers.map((d, index) => {
              const isBirimStudio = isBirimDesignStudio(d) || Boolean(d.isCompanyLogo)
              const rawBio = toPlainText(t(d.bio))
              const bioText =
                rawBio ||
                (isBirimStudio
                  ? t('birim_studio_bio_short') ||
                    "Birim'in yenilikçi ve zamansız tasarım vizyonunu yansıtan iç tasarım stüdyosu."
                  : '')
              const isLongText = bioText.length > 400
              return (
                <div key={d.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="w-full">
                    <ProductCardReveal
                      direction="down"
                      duration={1.4}
                      delay={0.1 + index * 0.15}
                      className="w-full"
                    >
                      {isBirimStudio ? (
                        <div className="w-full aspect-[4/5] flex flex-col items-center justify-center p-8 sm:p-12 relative bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-900 select-none border border-neutral-800/40">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                          <div className="relative z-10 w-full flex items-center justify-center px-4">
                            <SiteLogo
                              logoUrl={settings?.logoUrl}
                              className="w-full max-w-[200px] sm:max-w-[240px] h-auto object-contain brightness-100"
                            />
                          </div>
                        </div>
                      ) : (
                        <OptimizedImage
                          src={typeof d.image === 'string' ? d.image : d.image?.url || ''}
                          srcMobile={
                            typeof d.image === 'object' ? d.image.urlMobile : d.imageMobile
                          }
                          srcDesktop={
                            typeof d.image === 'object' ? d.image.urlDesktop : d.imageDesktop
                          }
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
                      )}
                    </ProductCardReveal>
                  </div>
                  <div className="w-full">
                    <TextMaskReveal delay={120}>
                      <h3 className="text-2xl font-normal text-[var(--text-primary)]">
                        {t(d.name)}
                      </h3>
                    </TextMaskReveal>
                    <TextMaskReveal delay={200}>
                      <p className="mt-4 text-[var(--text-primary)] font-normal leading-relaxed opacity-90 whitespace-pre-line">
                        {bioText.slice(0, 400)}
                        {isLongText ? '…' : ''}
                      </p>
                    </TextMaskReveal>
                    <TextMaskReveal delay={280} display="inline-block">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/designer/${d.id}`, {state: {slideOver: true, designer: d}})
                        }
                        className="inline-block mt-6 text-[var(--text-secondary)] font-light underline underline-offset-4 hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0 transition-colors"
                      >
                        {t('discover_the_designer')}
                      </button>
                    </TextMaskReveal>
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
