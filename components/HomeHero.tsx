import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Link} from 'react-router-dom'
import type {HomePageContent, SiteSettings} from '../types'
import {OptimizedImage} from './OptimizedImage'
import {OptimizedVideo} from './OptimizedVideo'
// Build fix
import {ArrowRight} from './ArrowRight'
import {YouTubeBackground} from './YouTubeBackground'
import {useTranslation} from '../i18n'

interface HomeHeroProps {
  content?: HomePageContent
  settings?: SiteSettings
}

export const HomeHero: React.FC<HomeHeroProps> = ({content}) => {
  const {t} = useTranslation()

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [draggedX, setDraggedX] = useState(0)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.clientWidth || window.innerWidth
    }
    return 0
  })

  const DRAG_THRESHOLD = 50 // pixels
  const VERTICAL_SCROLL_TOLERANCE = 3.0 // Y delta'sı X delta'sından bu kadar kat fazlaysa dikey scroll olarak kabul et
  const MIN_VERTICAL_DELTA = 15 // Minimum dikey hareket (pixels) - dikey scroll olarak kabul etmek için
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dragStartY = useRef<number>(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHeroTextVisible, setIsHeroTextVisible] = useState(false)
  const [areDotsVisible, setAreDotsVisible] = useState(false)

  const heroMedia = useMemo(() => {
    const items = Array.isArray(content?.heroMedia) ? content!.heroMedia : []
    // Yayınlanmamışları ve gelecekte yayınlanacakları filtrele
    const now = new Date()
    const visible = items.filter(item => {
      const publishedFlag = item.isPublished !== false
      const publishAt = item.publishAt ? new Date(item.publishAt) : null
      const allowedByTime = !publishAt || publishAt <= now
      return publishedFlag && allowedByTime
    })
    // Opsiyonel manuel sıralama: küçük sortOrder önce
    visible.sort((a, b) => {
      const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : 999999
      const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : 999999
      if (aOrder !== bOrder) return aOrder - bOrder
      return 0
    })
    return visible
  }, [content?.heroMedia])
  const slideCount = heroMedia.length || 1

  // Mobile / viewport takibi
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      const vw = document.documentElement.clientWidth || window.innerWidth
      setIsMobile(mobile)
      setViewportWidth(vw)
    }
    checkMobile()

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(checkMobile, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [])

  // Ortak ileri/geri geçiş fonksiyonları (sonsuz kaydırma + klon mantığını korur)
  const goToNextSlide = () => {
    const count = heroMedia.length || 1
    if (count <= 1) {
      setDraggedX(0)
      return
    }

    const nextSlide = currentSlide + 1
    if (nextSlide >= count) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      if (innerTimeoutRef.current) {
        clearTimeout(innerTimeoutRef.current)
      }
      setCurrentSlide(nextSlide)
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(true)
        requestAnimationFrame(() => {
          setCurrentSlide(0)
          requestAnimationFrame(() => {
            innerTimeoutRef.current = setTimeout(() => {
              setIsTransitioning(false)
              transitionTimeoutRef.current = null
              innerTimeoutRef.current = null
            }, 16)
          })
        })
      }, 600)
    } else {
      setCurrentSlide(nextSlide)
    }
    setDraggedX(0)
  }

  const goToPrevSlide = () => {
    const count = heroMedia.length || 1
    if (count <= 1) {
      setDraggedX(0)
      return
    }

    const prevSlide = currentSlide - 1
    if (prevSlide < 0) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      if (innerTimeoutRef.current) {
        clearTimeout(innerTimeoutRef.current)
      }
      setCurrentSlide(prevSlide)
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(true)
        requestAnimationFrame(() => {
          setCurrentSlide(slideCount - 1)
          requestAnimationFrame(() => {
            innerTimeoutRef.current = setTimeout(() => {
              setIsTransitioning(false)
              transitionTimeoutRef.current = null
              innerTimeoutRef.current = null
            }, 16)
          })
        })
      }, 600)
    } else {
      setCurrentSlide(prevSlide)
    }
    setDraggedX(0)
  }

  // Touch event'ler – dikey scroll'a izin ver, yatay sürüklemeyi koru
  useEffect(() => {
    const container = heroContainerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
        return
      }
      if (!e.touches || e.touches.length === 0) return
      setIsDragging(true)
      const startX = e.touches[0]?.clientX ?? 0
      const startY = e.touches[0]?.clientY ?? 0
      setDragStartX(startX)
      dragStartY.current = startY
      setDraggedX(0)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      if (!e.touches || e.touches.length === 0) return
      const currentX = e.touches[0]?.clientX ?? 0
      const currentY = e.touches[0]?.clientY ?? 0
      const deltaX = Math.abs(currentX - dragStartX)
      const deltaY = Math.abs(currentY - dragStartY.current)
      
      // Dikey scroll toleransı: Eğer Y hareketi X hareketinden çok daha fazlaysa, yatay drag'ı iptal et
      // Ancak sadece gerçekten dikey scroll yapıldığında iptal et, yoksa yatay swipe çalışmaz
      if (deltaY > deltaX * VERTICAL_SCROLL_TOLERANCE && deltaY > MIN_VERTICAL_DELTA) {
        // Dikey scroll yapılıyor, yatay drag'ı iptal et
        setIsDragging(false)
        setDraggedX(0)
        return
      }
      
      // Normal yatay drag devam etsin
      setDraggedX(currentX - dragStartX)
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      setIsDragging(false)

      const count = heroMedia.length || 1
      if (count <= 1) {
        setDraggedX(0)
        return
      }

      if (draggedX < -DRAG_THRESHOLD) {
        goToNextSlide()
      } else if (draggedX > DRAG_THRESHOLD) {
        goToPrevSlide()
      } else {
        setDraggedX(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, {passive: true})
    container.addEventListener('touchmove', handleTouchMove, {passive: true})
    container.addEventListener('touchend', handleTouchEnd, {passive: true})

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragStartX, draggedX, currentSlide, heroMedia.length])

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
      return
    }
    setIsDragging(true)
    const startX =
      'touches' in e && e.touches && e.touches.length > 0
        ? (e.touches[0]?.clientX ?? 0)
        : 'clientX' in e
          ? e.clientX
          : 0
    setDragStartX(startX)
    setDraggedX(0)
    if (!('touches' in e)) {
      e.preventDefault()
    }
  }

  const handleDragMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return
    const currentX =
      'touches' in e && e.touches && e.touches.length > 0
        ? (e.touches[0]?.clientX ?? 0)
        : 'clientX' in e
          ? e.clientX
          : 0
    setDraggedX(currentX - dragStartX)
    if (!('touches' in e)) {
      e.preventDefault()
    }
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const count = heroMedia.length || 1
    if (count <= 1) {
      setDraggedX(0)
      return
    }

    if (draggedX < -DRAG_THRESHOLD) {
      goToNextSlide()
    } else if (draggedX > DRAG_THRESHOLD) {
      goToPrevSlide()
    } else {
      setDraggedX(0)
    }
  }

  // Cleanup timeout/interval
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      if (innerTimeoutRef.current) {
        clearTimeout(innerTimeoutRef.current)
      }
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
      }
    }
  }, [])

  // Otomatik geçiş
  useEffect(() => {
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current)
      autoPlayIntervalRef.current = null
    }

    if (!heroMedia || heroMedia.length <= 1) {
      return
    }
    if (content?.heroAutoPlay !== true) {
      return
    }
    if (isDragging || isTransitioning) return

    autoPlayIntervalRef.current = setInterval(() => {
      if (isDragging || isTransitioning) return
      if (content?.heroAutoPlay !== true) {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current)
          autoPlayIntervalRef.current = null
        }
        return
      }

      const count = heroMedia.length
      setCurrentSlide(prev => {
        const next = prev + 1
        if (next >= count) {
          return 0
        }
        return next
      })
    }, 5000)

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
        autoPlayIntervalRef.current = null
      }
    }
  }, [heroMedia, content?.heroAutoPlay, isDragging, isTransitioning])

  // Klonlardan gerçek slide'a geçiş kontrolü (otomatik geçiş için)
  useEffect(() => {
    if (!heroMedia || heroMedia.length === 0) return
    const count = heroMedia.length || 1
    if (count <= 1 || isDragging || isTransitioning) return

    if (currentSlide >= count) {
      const timer = setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentSlide(0)
          setIsTransitioning(false)
        }, 10)
      }, 650)
      return () => clearTimeout(timer)
    }

    if (currentSlide < 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentSlide(count - 1)
          setIsTransitioning(false)
        }, 10)
      }, 650)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [currentSlide, heroMedia, isDragging, isTransitioning])

  // Hero text animasyonu - slide değiştiğinde soldan gel
  useEffect(() => {
    setIsHeroTextVisible(false)
    const timer = setTimeout(() => {
      setIsHeroTextVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [currentSlide])

  // Dots animasyonu - ilk açılışta sağdan ve soldan birlikte gel
  useEffect(() => {
    if (!content || heroMedia.length === 0) return
    setAreDotsVisible(false)
    const timer = setTimeout(() => {
      setAreDotsVisible(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [content, heroMedia.length])

  // Mobilde hero container yüksekliği sabit 100vh - medya boyutundan bağımsız

  if (!content || heroMedia.length === 0) {
    return <div className="relative h-[50vh] w-full bg-gray-800" />
  }

  // Infinite carousel için klonlanmış slide'lar
  const clonedMedia =
    slideCount > 1 ? [heroMedia[heroMedia.length - 1], ...heroMedia, heroMedia[0]] : heroMedia
  const totalSlides = clonedMedia.length

  const getTransform = () => {
    if (slideCount <= 1) return 'translateX(0%)'

    // Sonsuz kaydırma efekti için currentSlide değerini doğrudan kullan;
    // sadece -1 ve slideCount aralığının dışına çıkan uç değerleri clamp et.
    let virtualSlide = currentSlide
    if (virtualSlide < -1) virtualSlide = -1
    if (virtualSlide > slideCount) virtualSlide = slideCount

    if (isMobile && viewportWidth > 0) {
      const slideWidth = viewportWidth
      const translateX = -(virtualSlide + 1) * slideWidth
      return `translateX(calc(${translateX}px + ${draggedX}px))`
    }

    const translateX = -(virtualSlide + 1) * 100
    return `translateX(calc(${translateX}% + ${draggedX}px))`
  }

  return (
    <>
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        className={`relative ${isMobile ? 'h-screen hero-container-mobile' : 'h-screen'} md:h-screen overflow-hidden cursor-grab active:cursor-grabbing`}
        ref={heroContainerRef}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        style={
          {
            padding: 0,
            margin: 0,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'none',
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'auto',
            boxSizing: 'border-box',
            position: 'relative',
            touchAction: 'pan-y',
            ...(isMobile
              ? {
                  height: '100dvh',
                  minHeight: '100dvh',
                  maxHeight: '100dvh',
                }
              : {}),
          } as React.CSSProperties
        }
      >
        {/* Global hero CSS override'ları HomePage'deki <style> içinde kalıyor */}
        <div
          className="flex h-full md:h-full hero-scroll-container"
          style={
            {
              width:
                isMobile && viewportWidth > 0
                  ? `${totalSlides * viewportWidth}px`
                  : `${totalSlides * 100}%`,
              minWidth:
                isMobile && viewportWidth > 0
                  ? `${totalSlides * viewportWidth}px`
                  : `${totalSlides * 100}%`,
              maxWidth:
                isMobile && viewportWidth > 0
                  ? `${totalSlides * viewportWidth}px`
                  : `${totalSlides * 100}%`,
              transform: getTransform(),
              transition: isDragging || isTransitioning ? 'none' : 'transform 0.6s ease-in-out',
              flexWrap: 'nowrap',
              padding: 0,
              margin: 0,
              boxSizing: 'border-box',
              position: 'relative',
              overflowX: 'hidden',
              overflowY: 'hidden',
              display: 'flex',
            } as React.CSSProperties
          }
        >
          {clonedMedia.map((media, index) => {
            if (!media) return null
            const realIndex =
              slideCount > 1 && (index === 0 || index === totalSlides - 1)
                ? index === 0
                  ? slideCount - 1
                  : 0
                : index - 1

            return (
              <div
                key={`${realIndex}-${index}`}
                className={`relative ${isMobile ? 'h-full' : 'h-full'} flex-shrink-0 ${isMobile ? 'hero-slide-mobile' : ''}`}
                style={{
                  width: isMobile && viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                  minWidth: isMobile && viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                  maxWidth: isMobile && viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                  flexShrink: 0,
                  flexGrow: 0,
                  scrollSnapAlign: 'none',
                  scrollSnapStop: 'normal',
                  padding: 0,
                  margin: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  position: 'relative',
                  ...(isMobile
                    ? {height: '100dvh', minHeight: '100dvh', maxHeight: '100dvh'}
                    : {height: '100%', minHeight: '100%'}),
                }}
              >
                {media.type === 'video' ? (
                  <OptimizedVideo
                    src={media.url}
                    srcMobile={media.urlMobile}
                    srcDesktop={media.urlDesktop}
                    className={`${isMobile ? 'absolute' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-full' : 'h-full'} ${isMobile ? 'object-cover object-center' : 'object-cover'}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    loading="eager"
                  />
                ) : media.type === 'youtube' ? (
                  <YouTubeBackground url={media.url} isMobile={isMobile} />
                ) : (
                  <OptimizedImage
                    src={media.url}
                    srcMobile={media.urlMobile}
                    srcDesktop={media.urlDesktop}
                    alt={t(media.title || '')}
                    className={`${isMobile ? 'absolute' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-full' : 'h-full'} ${isMobile ? 'object-cover object-center' : 'object-cover'}`}
                    loading="eager"
                    quality={90}
                  />
                )}
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                {(() => {
                  const textPosition = media.textPosition || 'center'
                  const justifyClass =
                    textPosition === 'left'
                      ? 'justify-center md:justify-start'
                      : textPosition === 'right'
                        ? 'justify-center md:justify-end'
                        : 'justify-center'
                  const textAlignClass =
                    textPosition === 'left'
                      ? 'text-center md:text-left'
                      : textPosition === 'right'
                        ? 'text-center md:text-right'
                        : 'text-center'
                  return (
                    <div
                      className={`absolute z-20 ${isMobile ? 'w-full px-2' : 'container mx-auto px-2 sm:px-2 lg:px-3'} h-full flex items-center ${justifyClass}`}
                      style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                    >
                      <div
                        className={`flex flex-col md:flex-row items-center text-white gap-12 md:gap-16 ${content?.isHeroTextVisible ? 'max-w-4xl' : ''} ${textAlignClass}`}
                      >
                        {content?.isHeroTextVisible && (
                          <div className={`relative w-full transition-all duration-[700ms] ease-out ${
                            isHeroTextVisible
                              ? 'translate-x-0 opacity-100'
                              : '-translate-x-[150%] opacity-0'
                          }`}>
                            <h1
                              className="text-base md:text-5xl font-light tracking-tight mb-4 leading-relaxed"
                              style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}
                            >
                              {t(media.title || '')}
                            </h1>
                            <p
                              className="text-[10px] md:text-xl mb-8 leading-relaxed"
                              style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}
                            >
                              {t(media.subtitle || '')}
                            </p>
                            {media.isButtonVisible && (
                              <Link
                                to={media.buttonLink || '/'}
                                className="group inline-flex items-center gap-x-3 text-white font-semibold py-2 pl-0 pr-4 text-[10px] md:text-lg rounded-lg"
                              >
                                <span className="inline-flex items-center gap-x-3 border-b border-transparent group-hover:border-white pb-1 transition-all duration-300 ease-out">
                                  <span className="group-hover:text-gray-200">
                                    {t(media.buttonText || '')}
                                  </span>
                                  <ArrowRight className="w-3 h-3 md:w-6 md:h-6" />
                                </span>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
        {/* Desktop için hero okları */}
        {slideCount > 1 && !isMobile && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between px-6">
            <button
              type="button"
              onClick={goToPrevSlide}
              className="pointer-events-auto bg-black/35 hover:bg-black/55 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              aria-label="Previous hero slide"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNextSlide}
              className="pointer-events-auto bg-black/35 hover:bg-black/55 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              aria-label="Next hero slide"
            >
              ›
            </button>
          </div>
        )}
        {slideCount > 1 && (
          <div
            className={`absolute ${isMobile ? 'bottom-4' : 'bottom-10'} left-1/2 -translate-x-1/2 z-30 flex items-center space-x-4`}
            style={
              isMobile
                ? {
                    position: 'absolute',
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                  }
                : {}
            }
          >
            {(() => {
              const normalizedSlide =
                currentSlide < 0 ? slideCount - 1 : currentSlide >= slideCount ? 0 : currentSlide
              const centerIndex = Math.floor(heroMedia.length / 2)
              
              return heroMedia.map((_, index) => {
                const isActive = index === normalizedSlide
                const isLeft = index < centerIndex
                const distanceFromCenter = Math.abs(index - centerIndex)
                const animationDelay = distanceFromCenter * 50

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`relative rounded-full transition-all duration-500 ease-in-out group ${
                      areDotsVisible ? 'animate-dot-height-grow' : 'h-0.5'
                    } ${
                      isActive ? 'w-12 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                    } ${
                      areDotsVisible
                        ? 'translate-x-0 opacity-100'
                        : isLeft
                          ? '-translate-x-[150%] opacity-0'
                          : 'translate-x-[250%] opacity-0'
                    }`}
                    style={{
                      transitionDelay: `${animationDelay}ms`,
                      ...(areDotsVisible ? {} : {height: '0.0625rem'}),
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    {isActive && (
                      <div
                        key={`${normalizedSlide}-${index}`}
                        className="absolute top-0 left-0 h-full rounded-full bg-white animate-fill-line"
                      ></div>
                    )}
                  </button>
                )
              })
            })()}
          </div>
        )}
      </div>
    </>
  )
}
