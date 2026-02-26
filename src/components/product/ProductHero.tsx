import React from 'react'
import { Link } from 'react-router-dom'
import { OptimizedImage } from '../OptimizedImage'
import { OptimizedVideo } from '../OptimizedVideo'
import { useTranslation } from '../../i18n'
import type { LocalizedString, Designer } from '../../types'

interface ProductHeroProps {
    product: {
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
    return id ? `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&mute=1&playlist=${id}&loop=1` : ''
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

    const arrowInLeft: React.CSSProperties = {
        transform: 'scale(0)',
        opacity: 0,
        animation: 'arrow-scale-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 120ms forwards',
    }

    const arrowInRight: React.CSSProperties = {
        transform: 'scale(0)',
        opacity: 0,
        animation: 'arrow-scale-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms forwards',
    }

    return (
        <header className="relative w-full">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
                className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
                style={{
                    height: isMobile ? '60vh' : '70vh',
                    minHeight: isMobile ? '60vh' : '70vh',
                    maxHeight: isMobile ? '60vh' : '70vh',
                }}
                role="region"
                aria-label="Product Image Carousel"
                onMouseDown={onDragStart}
                onMouseMove={onDragMove}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
                onTouchStart={onDragStart}
                onTouchMove={onDragMove}
                onTouchEnd={onDragEnd}
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
                        transition: heroTransitionEnabled ? 'transform 0.3s ease-out' : 'none',
                    }}
                    onTransitionEnd={onTransitionEnd}
                >
                    {heroMedia.map((m, index) => {
                        if (!m) return null
                        const shouldEagerLoad =
                            (slideCount <= 1 && index === 0) || (slideCount > 1 && index === 1)
                        const isActiveSlide = heroSlideIndex === index
                        return (
                            <div
                                key={`slide-${index}-${m.url || index}`}
                                className="relative h-full shrink-0 bg-white flex items-center justify-center"
                                style={{ width: `${100 / totalHeroSlides}%` }}
                            >
                                {m.type === 'image' ? (
                                    <OptimizedImage
                                        src={m.url}
                                        srcMobile={m.urlMobile}
                                        srcDesktop={m.urlDesktop}
                                        alt={`${t(product.name)} ${index + 1}`}
                                        className={`w-full h-full object-cover ${imageBorderClass}`}
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
                                        className={`w-full h-full object-cover ${imageBorderClass}`}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

                <div className="absolute bottom-10 md:bottom-10 left-6 md:left-10 text-white">
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

                {/* hero arrows */}
                {slideCount > 1 && !isMobile && (
                    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between px-4 xl:px-8">
                        <button
                            type="button"
                            onClick={onPrev}
                            className="group pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 shadow-lg"
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
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7 -ml-0.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={onNext}
                            className="group pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 shadow-lg"
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
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7 ml-0.5 transition-transform duration-300 group-hover:translate-x-0.5"
                            >
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Hero dots */}
                {slideCount > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4">
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
                                                onSetTransitionEnabled(false)
                                                onSetSlideIndex(index + 1)
                                            } else {
                                                onSetSlideIndex(0)
                                            }
                                            onSetCurrentImageIndex(index)
                                        }}
                                        className={`relative h-2 rounded-none transition-all duration-500 ease-in-out group ${areDotsVisible ? 'animate-dot-grow' : 'opacity-0 scale-0'
                                            } ${isActive ? 'w-12 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                                        style={{
                                            transitionDelay: `${animationDelay}ms`,
                                        }}
                                        aria-label={`Görsel ${index + 1}`}
                                    >
                                        {isActive && (
                                            <div
                                                key={`${normalizedSlideIndex}-${index}`}
                                                className="absolute top-0 left-0 h-full rounded-none bg-white animate-fill-line"
                                            ></div>
                                        )}
                                    </button>
                                )
                            })
                        })()}
                    </div>
                )}

                {/* Fullscreen button */}
                {slideCount > 0 && (
                    <div
                        className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-20"
                        style={{
                            opacity: isFullscreenButtonVisible ? 1 : 0,
                            transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
                            transition:
                                'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                            willChange: 'transform, opacity',
                        }}
                    >
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation()
                                onOpenFullscreen()
                            }}
                            className="group flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 shadow-lg"
                            aria-label="Büyüt"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7 transition-transform duration-500"
                            >
                                <line x1="12" y1="4" x2="12" y2="20" />
                                <line x1="4" y1="12" x2="20" y2="12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}
