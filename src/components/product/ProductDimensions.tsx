import React from 'react'
import { OptimizedImage } from '../OptimizedImage'
import { useTranslation } from '../../i18n'
import ScrollReveal from '../ScrollReveal'

interface ProductDimensionsProps {
  dimImages: { image: string; imageMobile?: string; imageDesktop?: string; title?: string | LocalizedString }[]
  imageBorderClass: string
  onOpenLightbox: (images: { image: string; imageMobile?: string; imageDesktop?: string; title?: string | LocalizedString }[], index: number) => void
}

export const ProductDimensions: React.FC<ProductDimensionsProps> = ({
  dimImages,
  imageBorderClass,
  onOpenLightbox,
}) => {
  const { t } = useTranslation()

  if (!dimImages || dimImages.length === 0) return null

  return (
    <ScrollReveal delay={200} threshold={0.05}>
      <div className="pb-4">
        <h2 className="text-xl font-light text-[var(--text-secondary)]">{t('dimensions')}</h2>
        <div className="h-px bg-[var(--border-primary)] my-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {dimImages.map((dimImg, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <button
                onClick={() => onOpenLightbox(dimImages, idx)}
                className="group border border-[var(--border-primary)] transition-transform duration-200 p-3 bg-[var(--bg-primary)] rounded-none w-full"
              >
                <OptimizedImage
                  src={dimImg.image}
                  srcMobile={dimImg.imageMobile}
                  srcDesktop={dimImg.imageDesktop}
                  alt={dimImg.title ? t(dimImg.title) : `${t('dimensions')} ${idx + 1}`}
                  className={`w-full h-40 object-contain group-hover:scale-[1.03] transition-transform duration-700 ease-in-out ${imageBorderClass}`}
                  loading="lazy"
                  quality={85}
                />
              </button>
              {dimImg.title && (
                <p className="mt-2 text-sm text-[var(--text-secondary)] text-center font-medium">
                  {t(dimImg.title)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  )
}
