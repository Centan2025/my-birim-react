import React, {useRef, useState, useEffect} from 'react'
import {createPortal} from 'react-dom'
import {OptimizedImage} from '../OptimizedImage'
import {OptimizedVideo} from '../OptimizedVideo'
import {useTranslation} from '../../i18n'
import type {R2ImageMetadata} from '../../types'
import {mapImage, rewriteR2Url, SanityImageLike} from '../../services/sanity/client'

export interface LightboxItem {
  url?: string
  image?: string
  type?: string
  title?: string
  name?: string
  description?: string
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

interface ProductMediaLightboxProps {
  items: LightboxItem[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  showMetadata?: boolean
}

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const toYouTubeEmbed = (url: string, {autoplay = false, controls = false} = {}) => {
  if (!url) return ''
  let id = ''
  if (url.includes('youtube.com/watch?v=')) {
    id = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    id = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/embed/')) {
    id = url.split('embed/')[1]?.split('?')[0] || ''
  }
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&mute=1&controls=${controls ? 1 : 0}&playlist=${id}&loop=1`
    : ''
}

import {motion, AnimatePresence} from 'framer-motion'

export const ProductMediaLightbox: React.FC<ProductMediaLightboxProps> = ({
  items,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  showMetadata = false,
}) => {
  const {t} = useTranslation()
  const youTubePlayerRef = useRef<HTMLIFrameElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [direction, setDirection] = useState(0) // 1 for next, -1 for prev

  // Açılış animasyonu: mount sonrası hemen tetikle
  useEffect(() => {
    // Bir sonraki frame'de animasyonu başlat
    const raf = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    // Body scroll'u kilitle
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
    }
  }, [])

  // Kapanış animasyonu
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // Animasyon süresiyle eşleşmeli
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDirection(1)
    onNext()
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDirection(-1)
    onPrev()
  }

  const currentItem = items[currentIndex]
  if (!currentItem) return null

  // Map item properties (handles different schemas for main media, dimensions, and materials)
  const rawUrl = (currentItem as any)?.url || (currentItem as any)?.image
  const url =
    typeof rawUrl === 'string' ? rewriteR2Url(rawUrl) : mapImage(rawUrl as SanityImageLike)
  const type = (currentItem.type || 'image') as string
  const title = currentItem.title || currentItem.name || ''

  // Directional Slide Variants
  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: {type: 'spring' as const, stiffness: 200, damping: 25},
        opacity: {duration: 0.4},
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-30%' : dir < 0 ? '30%' : 0,
      opacity: 0,
      transition: {
        x: {type: 'spring' as const, stiffness: 200, damping: 25},
        opacity: {duration: 0.3},
      },
    }),
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/90 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={handleClose}
      onKeyDown={e => {
        if (e.key === 'Escape') handleClose()
        if (e.key === 'ArrowLeft') {
          setDirection(-1)
          onPrev()
        }
        if (e.key === 'ArrowRight') {
          setDirection(1)
          onNext()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Media Lightbox"
      tabIndex={-1}
    >
      {/* İçerik - tam ekran dikey ortalama */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8`}
        onClick={e => e.stopPropagation()}
      >
        {/* Medya Konteynırı */}
        <div className="relative group w-full max-w-6xl mx-auto flex items-center justify-center overflow-visible">
          {/* Medya içeriği - Simultaneous Animation (Sabit Yükseklik) */}
          <div
            className={`relative w-full h-[75vh] flex items-center justify-center transition-all duration-300 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={url}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center p-4 md:p-12 overflow-visible"
              >
                <div className="relative w-fit h-fit mx-auto overflow-visible flex items-center justify-center">
                  {/* Close Button - Görselin tam sağ üst köşesiyle kesişsin */}
                  <button
                    onClick={handleClose}
                    className={`absolute -top-3 -right-3 md:-top-5 md:-right-5 z-[120] w-10 h-10 md:w-12 md:h-12 rounded-none border-[0.5px] border-white/50 bg-black/40 backdrop-blur-md text-white transition-all duration-300 md:hover:bg-white/10 active:scale-95 shadow-lg flex items-center justify-center outline-none ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  >
                    <CloseIcon />
                  </button>

                  {type === 'image' ? (
                    <OptimizedImage
                      src={url}
                      alt="Enlarged view"
                      className="max-w-full max-h-[70vh] object-contain shadow-2xl"
                      loading="eager"
                      quality={95}
                      crop={currentItem.crop}
                      hotspot={currentItem.hotspot}
                      origWidth={currentItem.origWidth as number}
                      origHeight={currentItem.origHeight as number}
                      cropMobile={currentItem.cropMobile}
                      hotspotMobile={currentItem.hotspotMobile}
                      origWidthMobile={currentItem.origWidthMobile as number}
                      origHeightMobile={currentItem.origHeightMobile as number}
                      placeholderColor="#111111"
                      isMirrored={currentItem.isMirrored}
                      isMirroredMobile={currentItem.isMirroredMobile}
                      isMirroredDesktop={currentItem.isMirroredDesktop}
                    />
                  ) : type === 'video' ? (
                    <OptimizedVideo
                      src={url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="max-w-full max-h-[70vh] object-contain shadow-2xl"
                      preload="auto"
                      loading="eager"
                    />
                  ) : (
                    <div className="relative w-[85vw] md:w-[70vw] lg:w-[60vw] aspect-video max-w-5xl">
                      <iframe
                        ref={youTubePlayerRef}
                        className="w-full h-full"
                        title="youtube-player"
                        src={toYouTubeEmbed(url, {autoplay: true})}
                        allow="autoplay; encrypted-media; fullscreen"
                        frameBorder="0"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Alt Panel: Prev/Next Düğmeleri - Görselin HEMEN ALTINDA (Daha yakın) */}
        {items.length > 1 && (
          <div
            className={`mt-0 flex items-center gap-6 transition-all duration-500 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <button
              onClick={handlePrev}
              className="group flex h-14 w-14 items-center justify-center rounded-none border-[0.5px] border-white/50 bg-transparent text-white transition-all duration-300 md:hover:bg-white/10 active:scale-95 shadow-lg outline-none select-none"
              aria-label="Önceki"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 transition-transform duration-300 group-hover:-translate-x-1"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className="group flex h-14 w-14 items-center justify-center rounded-none border-[0.5px] border-white/50 bg-transparent text-white transition-all duration-300 md:hover:bg-white/10 active:scale-95 shadow-lg outline-none select-none"
              aria-label="Sonraki"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 transition-transform duration-300 group-hover:translate-x-1"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Metadata Overlay */}
        {showMetadata && (
          <div
            className={`mb-6 max-w-md text-center text-white transition-all duration-300 delay-150 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {title && <h3 className="text-xl font-light mb-1">{t(title)}</h3>}
            {currentItem.description && (
              <p className="text-sm text-white/70 leading-relaxed italic">
                {t(currentItem.description)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
