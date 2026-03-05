import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { OptimizedImage } from '../OptimizedImage'
import { OptimizedVideo } from '../OptimizedVideo'
import { useTranslation } from '../../i18n'
import { motion } from 'framer-motion'
import { useCardTransition } from '../../context/CardTransitionContext'
import type { LocalizedString, Designer } from '../../types'

interface ProductHeroProps {
  product: {
    id: string
    name: LocalizedString
    year?: string | number
  }
  designer?: Designer
  heroMedia: any[]
  slideCount: number
  totalHeroSlides: number
  heroSlideIndex: number
  draggedX: number
  heroTransitionEnabled: boolean
  isMobile: boolean
  isTitleVisible: boolean
  isDesignerVisible: boolean
  areDotsVisible: boolean
  isFullscreenButtonVisible: boolean
  imageBorderClass: string
  currentImageIndex: number
  onNext: () => void
  onPrev: () => void
  onDragStart: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  onDragMove: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  onDragEnd: () => void
  onTransitionEnd: () => void
  onOpenFullscreen: () => void
  onSetSlideIndex: (index: number) => void
  onSetCurrentImageIndex: (index: number) => void
  onSetTransitionEnabled: (enabled: boolean) => void
}

const toYouTubeEmbed = (url: string, { autoplay = false } = {}) => {
  if (!url) return ''
  let id = ''
  if (url.includes('youtube.com/watch?v=')) id = url.split('v=')[1]?.split('&')[0] || ''
  else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1]?.split('?')[0] || ''
  else if (url.includes('youtube.com/embed/')) id = url.split('embed/')[1]?.split('?')[0] || ''
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&mute=1&playlist=${id}&loop=1`
    : ''
}

export const ProductHero: React.FC<ProductHeroProps> = ({
  product,
  designer,
  heroMedia,
  slideCount,
  totalHeroSlides,
  heroSlideIndex,
  draggedX,
  heroTransitionEnabled,
  isMobile,
  isTitleVisible,
  isDesignerVisible,
  areDotsVisible,
  isFullscreenButtonVisible,
  imageBorderClass,
  currentImageIndex: _unused_currentImageIndex,
  onNext,
  onPrev,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransitionEnd,
  onOpenFullscreen,
  onSetSlideIndex,
  onSetCurrentImageIndex,
  onSetTransitionEnabled,
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const { isExpanding, phase, setTargetRect } = useCardTransition()
  const fromCard = location.state?.fromCard || isExpanding
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (phase === 'animating' && heroRef.current) {
      const updateRect = () => {
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect()
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: imageBorderClass === 'rounded-lg' ? '8px' : '0px',
          })
        }
      }

      // First immediate measurement
      updateRect()

      // Continuous measurement during the first 1 second of expansion
      const interval = setInterval(updateRect, 32) // ~30fps tracking
      const timeout = setTimeout(() => clearInterval(interval), 1000)

      window.addEventListener('resize', updateRect)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
        window.removeEventListener('resize', updateRect)
      }
    }
    return undefined
  }, [phase, setTargetRect, imageBorderClass])

  const arrowInLeft: React.CSSProperties = {
    transform: areDotsVisible ? 'scale(1)' : 'scale(0)',
    opacity: areDotsVisible ? 1 : 0,
    transition:
      'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 120ms, opacity 600ms ease-out 120ms',
  }

  const arrowInRight: React.CSSProperties = {
    transform: areDotsVisible ? 'scale(1)' : 'scale(0)',
    opacity: areDotsVisible ? 1 : 0,
    transition:
      'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms, opacity 600ms ease-out 200ms',
  }

  return (
    <header ref={heroRef} className="relative w-full">
      <style>{`
        @keyframes home-button-grow {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          height: isMobile ? '70vh' : '85vh',
          minHeight: isMobile ? '70vh' : '85vh',
          maxHeight: isMobile ? '70vh' : '85vh',
        }}
        aria-label="Product Image Carousel"
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') onPrev()
          if (e.key === 'ArrowRight') onNext()
        }}
      >
        <div
          className="flex h-full"
          style={{
            width: `${totalHeroSlides * 100}%`,
            transform: `translateX(calc(-${(heroSlideIndex * 100) / totalHeroSlides
              }% + ${draggedX}px))`,
            transition: heroTransitionEnabled
              ? 'transform 1s cubic-bezier(0.1, 1, 0.2, 1)'
              : 'none',
            opacity: phase === 'animating' ? 0 : 1,
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {Array.from({ length: totalHeroSlides }).map((_, index) => {
            // Ensure index is mapped correctly back to the base `heroMedia` array
            const m = heroMedia[index]
            if (!m) return null
            const shouldEagerLoad =
              (slideCount <= 1 && index === 0) || (slideCount > 1 && index === 1)
            const isActiveSlide = heroSlideIndex === index
            return (
              <div
                key={`slide-${index}-${m.url || index}`}
                style={
                  {
                    width: `${100 / totalHeroSlides}%`,
                    viewTransitionName: isActiveSlide ? `product-img-${product.id}` : 'none',
                  } as any
                }
              >
                {m.type === 'image' ? (
                  <OptimizedImage
                    src={m.url}
                    srcMobile={m.urlMobile}
                    srcDesktop={m.urlDesktop}
                    alt={`${t(product.name)} ${index + 1}`}
                    className={`w-full h-full ${!m.urlMobile ? 'max-md:object-contain md:object-cover' : 'object-cover'
                      } ${imageBorderClass}`}
                    width={1600}
                    height={900}
                    loading={shouldEagerLoad ? 'eager' : 'lazy'}
                    fetchPriority={shouldEagerLoad ? 'high' : 'low'}
                    quality={90}
                    crop={m.crop}
                    hotspot={m.hotspot}
                  />
                ) : m.type === 'video' ? (
                  <OptimizedVideo
                    key={`video-${index}-${m.url}`}
                    src={m.url}
                    srcMobile={m.urlMobile}
                    srcDesktop={m.urlDesktop}
                    className={`w-full h-full ${!m.urlMobile ? 'max-md:object-contain md:object-cover' : 'object-cover'
                      } ${imageBorderClass}`}
                    autoPlay={isActiveSlide}
                    muted
                    loop
                    playsInline
                    preload={shouldEagerLoad ? 'auto' : 'metadata'}
                    loading={shouldEagerLoad ? 'eager' : 'lazy'}
                  />
                ) : (
                  <iframe
                    className="w-full h-full"
                    title="youtube-player"
                    src={toYouTubeEmbed(m.url, { autoplay: isActiveSlide })}
                    allow="autoplay; encrypted-media; fullscreen"
                    frameBorder="0"
                  />
                )}
              </div>
            )
          })}
        </div>
        <motion.div
          initial={{ opacity: fromCard ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={fromCard ? { duration: 0 } : { duration: 1.8, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none"
        />

        <div className="absolute bottom-10 md:bottom-10 left-6 md:left-10 text-white z-40">
          <div
            style={{
              transform: isTitleVisible ? 'translateX(0)' : 'translateX(-40px)',
              opacity: isTitleVisible ? 1 : 0,
              transition: 'transform 1000ms ease-out, opacity 1000ms ease-out',
            }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
              {t(product.name)}
            </h1>
          </div>
          {designer && (
            <div
              className="mt-2 text-white/80"
              style={{
                transform: isDesignerVisible ? 'translateX(0)' : 'translateX(-40px)',
                opacity: isDesignerVisible ? 1 : 0,
                transition: 'transform 1000ms ease-out, opacity 1000ms ease-out',
              }}
            >
              <Link to={`/designer/${designer.id}`} className="hover:text-white">
                {t(designer.name)}
              </Link>{' '}
              {product.year && <span>— {product.year}</span>}
            </div>
          )}
        </div>

        {slideCount > 0 && !isMobile && (
          <div className="pointer-events-none absolute bottom-10 right-3 md:bottom-10 md:right-8 z-30 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] px-4 md:px-8 lg:px-0">
            <div className="flex justify-end items-center gap-4">
              {slideCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={onPrev}
                    className="group pointer-events-auto flex h-14 w-14 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
                    style={arrowInLeft}
                    aria-label="Previous hero slide"
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
                      className="h-11 w-11 transition-transform duration-300 group-hover:-translate-x-1"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="group pointer-events-auto flex h-14 w-14 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
                    style={arrowInRight}
                    aria-label="Next hero slide"
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
                      className="h-11 w-11 transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onOpenFullscreen()
                }}
                className="group pointer-events-auto flex h-14 w-14 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
                style={{
                  opacity: isFullscreenButtonVisible ? 1 : 0,
                  transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
                  transition:
                    'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  willChange: 'transform, opacity',
                  animation: isFullscreenButtonVisible ? 'home-button-grow 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 300ms forwards' : 'none'
                }}
                aria-label="Tam Ekran"
              >
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
                  className="transition-transform duration-500 group-hover:scale-110 h-10 w-10"
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {slideCount > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-4">
            {(() => {
              const normalizedSlideIndex =
                slideCount <= 1
                  ? 0
                  : heroSlideIndex === 0
                    ? slideCount - 1
                    : heroSlideIndex === totalHeroSlides - 1
                      ? 0
                      : heroSlideIndex - 1

              return Array.from({ length: slideCount }).map((_, index) => {
                const isActive = index === normalizedSlideIndex
                const centerIndex = Math.floor(slideCount / 2)
                const distanceFromCenter = Math.abs(index - centerIndex)
                const animationDelay = distanceFromCenter * 50

                return (
                  <button
                    key={`dot-${index}`}
                    onClick={() => {
                      if (slideCount > 1) {
                        onSetTransitionEnabled(true)
                        onSetSlideIndex(index + 1)
                      } else {
                        onSetSlideIndex(0)
                      }
                      onSetCurrentImageIndex(index)
                    }}
                    className={`relative h-2 rounded-none transition-all duration-500 ease-in-out group ${areDotsVisible ? 'animate-dot-grow' : 'opacity-0 scale-0'
                      } ${isActive ? 'w-2 bg-red-900' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                    style={{
                      transitionDelay: `${animationDelay}ms`,
                    }}
                    aria-label={`Görsel ${index + 1}`}
                  >
                    {isActive && (
                      <div
                        key={`${normalizedSlideIndex}-${index}`}
                        className="absolute top-0 left-0 h-full rounded-none bg-red-900 animate-fill-line"
                      ></div>
                    )}
                  </button>
                )
              })
            })()}
          </div>
        )}

        {/* Mobile Fullscreen Button */}
        {slideCount > 0 && isMobile && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onOpenFullscreen()
            }}
            className="absolute bottom-4 right-4 z-50 group flex h-12 w-12 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 active:scale-95 shadow-lg"
            style={{
              opacity: isFullscreenButtonVisible ? 1 : 0,
              transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
              transition:
                'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              willChange: 'transform, opacity',
              animation: isFullscreenButtonVisible ? 'home-button-grow 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 300ms forwards' : 'none',
              bottom: 'max(16px, env(safe-area-inset-bottom, 0px) + 16px)'
            }}
            aria-label="Tam Ekran"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
