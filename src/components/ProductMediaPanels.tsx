import {startTransition} from 'react'
import {motion, type Variants} from 'framer-motion'
import {OptimizedImage} from './OptimizedImage'
import ScrollReveal from './ScrollReveal'
import type {LocalizedString, Product, R2ImageMetadata} from '../types'

const containerVariants: Variants = {
  hidden: {opacity: 0},
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 35,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.215, 0.61, 0.355, 1],
    },
  },
}

interface ProductMediaItem {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
  title?: LocalizedString | string
  crop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
  origWidth?: number
  origHeight?: number
  cropMobile?: R2ImageMetadata['crop']
  hotspotMobile?: R2ImageMetadata['hotspot']
  origWidthMobile?: number
  origHeightMobile?: number
  isMirrored?: boolean
  isMirroredMobile?: boolean
  isMirroredDesktop?: boolean
}

interface ProductWithMedia extends Product {
  media?: ProductMediaItem[]
  bottomMedia?: ProductMediaItem[]
  mediaSectionTitle?: LocalizedString | string
}

interface ProductMediaPanelsProps {
  product: ProductWithMedia
  imageBorderClass: string
  youTubeThumb: (url: string) => string
  openPanelLightbox: (index: number) => void
  t: (value: string | LocalizedString) => string
}

export function ProductMediaPanels({
  product,
  imageBorderClass,
  youTubeThumb,
  openPanelLightbox,
  t,
}: ProductMediaPanelsProps) {
  const media =
    Array.isArray(product?.bottomMedia) && product.bottomMedia.length > 0
      ? product.bottomMedia
      : Array.isArray(product?.media) && product.media.length > 0
        ? product.media
        : []

  if (media.length === 0) {
    return null
  }
  const sectionTitle =
    product?.mediaSectionTitle && String(product.mediaSectionTitle).trim().length > 0
      ? t(product.mediaSectionTitle)
      : 'Projeler'

  return (
    <section className="mt-12">
      <ScrollReveal delay={0} threshold={0.1}>
        <h2 className="text-xl font-light text-gray-600 mb-6">{sectionTitle}</h2>
      </ScrollReveal>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true, amount: 0.08}}
      >
        {media.map((m, idx) => (
          <motion.div key={idx} variants={itemVariants} className="overflow-hidden">
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  openPanelLightbox(idx)
                })
              }}
              className="relative w-full aspect-video bg-gray-200 flex items-center justify-center cursor-pointer"
            >
              {m.type === 'image' ? (
                <OptimizedImage
                  src={m.url}
                  srcMobile={m.urlMobile}
                  srcDesktop={m.urlDesktop}
                  alt={`media-${idx}`}
                  className={`w-full h-full object-cover ${imageBorderClass}`}
                  loading="lazy"
                  quality={85}
                  crop={m.crop}
                  hotspot={m.hotspot}
                  origWidth={m.origWidth as number}
                  origHeight={m.origHeight as number}
                  cropMobile={m.cropMobile}
                  hotspotMobile={m.hotspotMobile}
                  origWidthMobile={m.origWidthMobile as number}
                  origHeightMobile={m.origHeightMobile as number}
                  cropDesktop={
                    (m as unknown as Record<string, unknown>)[
                      'cropDesktop'
                    ] as R2ImageMetadata['crop']
                  }
                  hotspotDesktop={
                    (m as unknown as Record<string, unknown>)[
                      'hotspotDesktop'
                    ] as R2ImageMetadata['hotspot']
                  }
                  origWidthDesktop={
                    (m as unknown as Record<string, unknown>)['origWidthDesktop'] as number
                  }
                  origHeightDesktop={
                    (m as unknown as Record<string, unknown>)['origHeightDesktop'] as number
                  }
                  isMirrored={m.isMirrored}
                  isMirroredMobile={m.isMirroredMobile}
                  isMirroredDesktop={m.isMirroredDesktop}
                />
              ) : m.type === 'video' ? (
                <div className={`w-full h-full bg-gray-300 ${imageBorderClass}`} />
              ) : (
                <OptimizedImage
                  src={youTubeThumb(m.url)}
                  alt={`youtube thumb ${idx + 1}`}
                  className={`w-full h-full object-cover ${imageBorderClass}`}
                  loading="lazy"
                  quality={75}
                />
              )}
              {(m.type === 'video' || m.type === 'youtube') && (
                <span className="pointer-events-none absolute bottom-2 right-2">
                  <span className="bg-white/85 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 ml-0.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              )}
            </button>
            {m.title && <div className="px-1 pt-2 text-sm text-gray-600">{t(m.title)}</div>}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
