import {startTransition} from 'react'
import {motion, type Variants, useReducedMotion} from 'framer-motion'
import {OptimizedImage} from './OptimizedImage'
import {TextMaskReveal} from './TextMaskReveal'
import type {LocalizedString, Product, R2ImageMetadata} from '../types'

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      delay: (i % 3) * 0.09,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
}

const getMediaZoomVariants = (reduceMotion: boolean): Variants => ({
  hidden: {
    scale: reduceMotion ? 1 : 1.22,
    originX: 0,
    originY: 0.5,
  },
  visible: (i: number = 0) => ({
    scale: 1,
    originX: 0,
    originY: 0.5,
    transition: {
      duration: reduceMotion ? 0.01 : 1.25,
      delay: reduceMotion ? 0 : (i % 3) * 0.09,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
})

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
  const shouldReduceMotion = Boolean(useReducedMotion())
  const mediaZoomVariants = getMediaZoomVariants(shouldReduceMotion)

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
    <section className="mt-8 md:mt-10">
      <TextMaskReveal delay={80}>
        <h2 className="text-xl font-light text-gray-600 mb-3 md:mb-4">{sectionTitle}</h2>
      </TextMaskReveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-2 md:gap-x-2.5 gap-y-1 md:gap-y-1.5">
        {media.map((m, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            custom={idx}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true, amount: 0.12, margin: '0px 0px -30px 0px'}}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  openPanelLightbox(idx)
                })
              }}
              className={`relative w-full aspect-video bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden group ${imageBorderClass}`}
            >
              <motion.div
                variants={mediaZoomVariants}
                custom={idx}
                className="w-full h-full transform-gpu origin-left"
                style={{transformOrigin: 'left center'}}
              >
                <div className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.04] origin-left">
                  {m.type === 'image' ? (
                    <OptimizedImage
                      src={m.url}
                      srcMobile={m.urlMobile}
                      srcDesktop={m.urlDesktop}
                      alt={`media-${idx}`}
                      className="w-full h-full object-cover"
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
                    <div className="w-full h-full bg-gray-300" />
                  ) : (
                    <OptimizedImage
                      src={youTubeThumb(m.url)}
                      alt={`youtube thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      quality={75}
                    />
                  )}
                </div>
              </motion.div>
              {(m.type === 'video' || m.type === 'youtube') && (
                <span className="pointer-events-none absolute bottom-2 right-2 z-10">
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
      </div>
    </section>
  )
}
