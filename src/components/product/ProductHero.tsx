import {useEffect, useRef} from 'react'
import {Link, useLocation} from 'react-router-dom'
import {OptimizedImage} from '../OptimizedImage'
import {OptimizedVideo} from '../OptimizedVideo'
import {useTranslation} from '../../i18n'
import {motion} from 'framer-motion'
import {useCardTransition} from '../../context/CardTransitionContext'
import type {LocalizedString, Designer, R2ImageMetadata, Category} from '../../types'
import {Breadcrumbs} from '../Breadcrumbs'

interface ProductHeroProps {
  product: {
    id: string
    name: LocalizedString
    year?: string | number
  }
  category?: Category
  designer?: Designer
  designers?: Designer[]
  heroMedia: {
    type: string
    url: string
    urlMobile?: string
    urlDesktop?: string
    crop?: unknown
    hotspot?: unknown
    isMirrored?: boolean
    isMirroredMobile?: boolean
    isMirroredDesktop?: boolean
  }[]
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
  showHeroNavigation?: boolean
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

const toYouTubeEmbed = (url: string, {autoplay = false} = {}) => {
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
  category,
  designer,
  designers: designersProp,
  heroMedia,
  slideCount,
  totalHeroSlides,
  heroSlideIndex,
  draggedX,
  heroTransitionEnabled,
  isTitleVisible,
  isDesignerVisible,
  areDotsVisible,
  isFullscreenButtonVisible,
  imageBorderClass,
  currentImageIndex: _unused_currentImageIndex,
  showHeroNavigation = false,
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
  const {t} = useTranslation()
  const designers = designersProp || (designer ? [designer] : [])
  const location = useLocation()
  const {isExpanding, phase, setTargetRect} = useCardTransition()
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
    <header ref={heroRef} className="relative w-full hero-section">
      <style>{`
        @keyframes home-button-grow {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        className={`relative w-full overflow-hidden cursor-grab active:cursor-grabbing h-[100dvh] ${
          !showHeroNavigation ? 'md:h-[100vh]' : 'md:h-[85vh]'
        }`}
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
            transform: `translateX(calc(-${
              (heroSlideIndex * 100) / totalHeroSlides
            }% + ${draggedX}px))`,
            transition: heroTransitionEnabled
              ? 'transform 1s cubic-bezier(0.1, 1, 0.2, 1)'
              : 'none',
            opacity: phase === 'animating' ? 0 : 1,
          }}
          onTransitionEnd={e => {
            if (e.target === e.currentTarget) {
              onTransitionEnd()
            }
          }}
        >
          {Array.from({length: totalHeroSlides}).map((_, index) => {
            // Ensure index is mapped correctly back to the base `heroMedia` array
            const m = heroMedia[index]
            if (!m) return null
            const shouldEagerLoad =
              (slideCount <= 1 && index === 0) || (slideCount > 1 && index === 1)
            const isActiveSlide = heroSlideIndex === index
            return (
              <div
                key={`slide-${index}-${m.url || index}`}
                className="w-full h-full flex items-center justify-center relative p-0 max-md:px-4 landscape:px-0 overflow-hidden"
                style={
                  {
                    width: `${100 / totalHeroSlides}%`,
                    viewTransitionName: isActiveSlide ? `product-img-${product.id}` : 'none',
                  } as React.CSSProperties
                }
              >
                {m.type === 'image' ? (
                  <OptimizedImage
                    src={m.url}
                    srcMobile={m.urlMobile}
                    srcDesktop={m.urlDesktop}
                    alt={`${t(product.name)} ${index + 1}`}
                    className={`w-full h-full max-md:object-contain md:object-cover ${imageBorderClass} select-none`}
                    width={1600}
                    height={900}
                    loading="eager"
                    fetchPriority={isActiveSlide || shouldEagerLoad ? 'high' : 'auto'}
                    quality={90}
                    crop={m.crop as R2ImageMetadata['crop']}
                    hotspot={m.hotspot as R2ImageMetadata['hotspot']}
                    origWidth={(m as Record<string, unknown>)['origWidth'] as number}
                    origHeight={(m as Record<string, unknown>)['origHeight'] as number}
                    cropMobile={
                      (m as Record<string, unknown>)['cropMobile'] as R2ImageMetadata['crop']
                    }
                    hotspotMobile={
                      (m as Record<string, unknown>)['hotspotMobile'] as R2ImageMetadata['hotspot']
                    }
                    origWidthMobile={(m as Record<string, unknown>)['origWidthMobile'] as number}
                    origHeightMobile={(m as Record<string, unknown>)['origHeightMobile'] as number}
                    cropDesktop={
                      (m as Record<string, unknown>)['cropDesktop'] as R2ImageMetadata['crop']
                    }
                    hotspotDesktop={
                      (m as Record<string, unknown>)['hotspotDesktop'] as R2ImageMetadata['hotspot']
                    }
                    origWidthDesktop={(m as Record<string, unknown>)['origWidthDesktop'] as number}
                    origHeightDesktop={
                      (m as Record<string, unknown>)['origHeightDesktop'] as number
                    }
                    isMirrored={m.isMirrored}
                    isMirroredMobile={m.isMirroredMobile}
                    isMirroredDesktop={m.isMirroredDesktop}
                    draggable={false}
                  />
                ) : m.type === 'video' ? (
                  <OptimizedVideo
                    key={`video-${index}-${m.url}`}
                    src={m.url}
                    srcMobile={m.urlMobile}
                    srcDesktop={m.urlDesktop}
                    poster={
                      (m as unknown as Record<string, string>)['poster'] ||
                      (m as unknown as Record<string, string>)['image']
                    }
                    posterMobile={
                      (m as unknown as Record<string, string>)['posterMobile'] ||
                      (m as unknown as Record<string, string>)['imageMobile']
                    }
                    posterDesktop={
                      (m as unknown as Record<string, string>)['posterDesktop'] ||
                      (m as unknown as Record<string, string>)['imageDesktop']
                    }
                    className={`w-full h-full max-md:object-contain md:object-cover ${imageBorderClass}`}
                    autoPlay={isActiveSlide}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    loading="eager"
                  />
                ) : (
                  <iframe
                    className="w-full h-full"
                    title="youtube-player"
                    src={toYouTubeEmbed(m.url, {autoplay: isActiveSlide})}
                    allow="autoplay; encrypted-media; fullscreen"
                    frameBorder="0"
                  />
                )}
              </div>
            )
          })}
        </div>
        <motion.div
          initial={{opacity: fromCard ? 1 : 0}}
          animate={{opacity: 1}}
          transition={fromCard ? {duration: 0} : {duration: 1.8, ease: 'easeInOut'}}
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none"
        />

        {/* Top-Left Breadcrumb overlay - aligned with Header Search Icon */}
        <div className="absolute top-20 landscape:top-12 md:top-28 lg:top-32 left-0 right-0 z-40 pointer-events-none pt-4 landscape:pt-0 md:pt-6 lg:pt-8">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            <Breadcrumbs
              items={[
                {label: t('homepage'), to: '/'},
                ...(category ? [{label: t(category.name), to: `/products/${category.id}`}] : []),
                {label: t(product.name)},
              ]}
              className="pointer-events-auto inline-block text-black [&_a]:!text-black/80 [&_a:hover]:!text-black [&_span.font-bold]:!text-black [&_span]:!text-black"
            />
          </div>
        </div>

        <div
          className="absolute bottom-12 landscape:bottom-4 md:bottom-10 left-0 right-0 text-white z-40 pointer-events-none"
        >
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            <div
              style={{
                transform: isTitleVisible ? 'translateX(0)' : 'translateX(-40px)',
                opacity: isTitleVisible ? 1 : 0,
                transition: 'transform 1000ms ease-out, opacity 1000ms ease-out',
              }}
            >
              <h1 className="text-3xl landscape:text-xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-lg font-michroma pointer-events-auto">
                {t(product.name)}
              </h1>
            </div>
            {(designers.length > 0 || Boolean(product.year)) && (
              <div
                className="mt-2 text-xs landscape:text-[11px] md:text-sm text-white/80 font-michroma pointer-events-auto [&_a]:font-michroma [&_span]:font-michroma"
                style={{
                  transform: isDesignerVisible ? 'translateX(0)' : 'translateX(-40px)',
                  opacity: isDesignerVisible ? 1 : 0,
                  transition: 'transform 1000ms ease-out, opacity 1000ms ease-out',
                }}
              >
                {designers.map((d, i) => (
                  <span key={d.id}>
                    <Link to={`/designer/${d.id}`} className="hover:text-white font-michroma">
                      {t(d.name)}
                    </Link>
                    {i < designers.length - 1 ? ' & ' : ''}
                  </span>
                ))}
                {designers.length > 0 && product.year && ' '}
                {product.year && <span>— {product.year}</span>}
              </div>
            )}
          </div>
        </div>

        {slideCount > 0 && (
          <div
            className="hidden md:block landscape:flex pointer-events-none absolute left-0 right-0 z-40"
            style={{bottom: 'max(16px, env(safe-area-inset-bottom, 0px) + 16px)'}}
          >
            <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 flex justify-end">
              <div className="flex items-center gap-2 md:gap-4">
              {slideCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={onPrev}
                    className="group pointer-events-auto flex h-8 w-8 md:h-14 md:w-14 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
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
                      className="h-5 w-5 md:h-11 md:w-11 transition-transform duration-300 group-hover:-translate-x-1"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="group pointer-events-auto flex h-8 w-8 md:h-14 md:w-14 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
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
                      className="h-5 w-5 md:h-11 md:w-11 transition-transform duration-300 group-hover:translate-x-1"
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
                className="group pointer-events-auto flex h-8 w-8 md:h-14 md:w-14 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
                style={{
                  opacity: isFullscreenButtonVisible ? 1 : 0,
                  transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
                  transition:
                    'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  willChange: 'transform, opacity',
                  animation: isFullscreenButtonVisible
                    ? 'home-button-grow 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 300ms forwards'
                    : 'none',
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
                  className="transition-transform duration-500 group-hover:scale-110 h-5 w-5 md:h-10 md:w-10"
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        )}

        {slideCount > 1 && (
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2 md:space-x-4"
            style={{bottom: 'max(16px, env(safe-area-inset-bottom, 0px) + 16px)'}}
          >
            {(() => {
              const normalizedSlideIndex =
                slideCount <= 1
                  ? 0
                  : heroSlideIndex === 0
                    ? slideCount - 1
                    : heroSlideIndex === totalHeroSlides - 1
                      ? 0
                      : heroSlideIndex - 1

              return Array.from({length: slideCount}).map((_, index) => {
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
                    className={`relative h-2 rounded-none transition-all duration-500 ease-in-out group ${
                      areDotsVisible ? 'animate-dot-grow' : 'opacity-0 scale-0'
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
        {slideCount > 0 && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onOpenFullscreen()
            }}
            className="md:hidden landscape:hidden absolute bottom-4 right-4 z-50 group flex h-10 w-10 items-center justify-center rounded-none border-[0.5px] border-white bg-transparent text-white transition-all duration-300 active:scale-95 shadow-lg"
            style={{
              opacity: isFullscreenButtonVisible ? 1 : 0,
              transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
              transition:
                'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              willChange: 'transform, opacity',
              animation: isFullscreenButtonVisible
                ? 'home-button-grow 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 300ms forwards'
                : 'none',
              bottom: 'max(16px, env(safe-area-inset-bottom, 0px) + 16px)',
            }}
            aria-label="Tam Ekran"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
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
