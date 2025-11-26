import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Link} from 'react-router-dom'
import type {HomePageContent, SiteSettings} from '../types'
import {OptimizedImage} from './OptimizedImage'
import {OptimizedVideo} from './OptimizedVideo'
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
  const [heroHeight, setHeroHeight] = useState<number | null>(null)

  const DRAG_THRESHOLD = 50 // pixels
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const heroMedia = useMemo(
    () => (Array.isArray(content?.heroMedia) ? content!.heroMedia : []),
    // content referansı bilerek dependency'e eklenmiyor; heroMedia sadece heroMedia alanına göre güncellenmeli
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content?.heroMedia]
  )
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

  // Touch event'ler için non-passive listener
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
      setDragStartX(startX)
      setDraggedX(0)
      e.preventDefault()
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      if (!e.touches || e.touches.length === 0) return
      const currentX = e.touches[0]?.clientX ?? 0
      setDraggedX(currentX - dragStartX)
      e.preventDefault()
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
      } else if (draggedX > DRAG_THRESHOLD) {
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
              setCurrentSlide(count - 1)
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
      }
      setDraggedX(0)
    }

    container.addEventListener('touchstart', handleTouchStart, {passive: false})
    container.addEventListener('touchmove', handleTouchMove, {passive: false})
    container.addEventListener('touchend', handleTouchEnd, {passive: false})

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
    } else if (draggedX > DRAG_THRESHOLD) {
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
    }
    setDraggedX(0)
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

  // Mobilde hero container yüksekliğini medyanın gerçek boyutuna göre ayarla
  useEffect(() => {
    if (!isMobile || !heroMedia || heroMedia.length === 0) return

    const updateHeroHeight = () => {
      const heroContainer = heroContainerRef.current
      if (!heroContainer) return

      const count = heroMedia.length || 1
      const normalizedSlide =
        currentSlide < 0 ? count - 1 : currentSlide >= count ? 0 : currentSlide

      const realIndex = normalizedSlide + 1 // +1 çünkü ilk klon var

      const slides = heroContainer.querySelectorAll('.hero-slide-mobile')
      const activeSlide = slides[realIndex] as HTMLElement
      if (!activeSlide) return

      const mediaElement = activeSlide.querySelector('video, img') as
        | HTMLVideoElement
        | HTMLImageElement
      if (!mediaElement) return

      const doUpdate = () => {
        const containerWidth =
          viewportWidth || window.innerWidth || heroContainer.getBoundingClientRect().width

        let calculatedHeight = 0

        if (mediaElement instanceof HTMLVideoElement) {
          if (mediaElement.videoWidth > 0 && mediaElement.videoHeight > 0) {
            const aspectRatio = mediaElement.videoWidth / mediaElement.videoHeight
            calculatedHeight = containerWidth / aspectRatio
          }
        } else if (mediaElement instanceof HTMLImageElement) {
          if (mediaElement.naturalWidth > 0 && mediaElement.naturalHeight > 0) {
            const aspectRatio = mediaElement.naturalWidth / mediaElement.naturalHeight
            calculatedHeight = containerWidth / aspectRatio
          }
        }

        if (calculatedHeight <= 0) {
          const rect = mediaElement.getBoundingClientRect()
          if (rect.height > 0) {
            calculatedHeight = rect.height
          }
        }

        if (calculatedHeight > 0) {
          setHeroHeight(calculatedHeight)
          heroContainer.style.height = `${calculatedHeight}px`
          heroContainer.style.minHeight = `${calculatedHeight}px`
          heroContainer.style.maxHeight = `${calculatedHeight}px`
          activeSlide.style.height = `${calculatedHeight}px`
          activeSlide.style.minHeight = `${calculatedHeight}px`
        }
      }

      if (mediaElement instanceof HTMLVideoElement) {
        if (mediaElement.readyState >= 2) {
          setTimeout(doUpdate, 50)
        } else {
          mediaElement.addEventListener(
            'loadedmetadata',
            () => {
              setTimeout(doUpdate, 50)
            },
            {once: true}
          )
          mediaElement.addEventListener(
            'loadeddata',
            () => {
              setTimeout(doUpdate, 50)
            },
            {once: true}
          )
        }
      } else if (mediaElement instanceof HTMLImageElement) {
        if (mediaElement.complete && mediaElement.naturalHeight > 0) {
          setTimeout(doUpdate, 50)
        } else {
          mediaElement.addEventListener(
            'load',
            () => {
              setTimeout(doUpdate, 50)
            },
            {once: true}
          )
        }
      }
    }

    const timeoutId = setTimeout(updateHeroHeight, 100)
    return () => clearTimeout(timeoutId)
  }, [isMobile, heroMedia, currentSlide, viewportWidth])

  if (!content || heroMedia.length === 0) {
    return <div className="relative h-[50vh] w-full bg-gray-800" />
  }

  // Infinite carousel için klonlanmış slide'lar
  const clonedMedia =
    slideCount > 1 ? [heroMedia[heroMedia.length - 1], ...heroMedia, heroMedia[0]] : heroMedia
  const totalSlides = clonedMedia.length

  const getTransform = () => {
    if (slideCount <= 1) return 'translateX(0%)'
    const normalizedSlide =
      currentSlide < 0 ? slideCount - 1 : currentSlide >= slideCount ? 0 : currentSlide

    if (isMobile && viewportWidth > 0) {
      const slideWidth = viewportWidth
      const translateX = -(normalizedSlide + 1) * slideWidth
      return `translateX(calc(${translateX}px + ${draggedX}px))`
    }

    const translateX = -(normalizedSlide + 1) * 100
    return `translateX(calc(${translateX}% + ${draggedX}px))`
  }

  return (
    <>
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        className={`relative ${isMobile ? '' : 'h-screen'} md:h-screen overflow-hidden cursor-grab active:cursor-grabbing`}
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
            ...(isMobile && heroHeight
              ? {
                  height: `${heroHeight}px`,
                  minHeight: `${heroHeight}px`,
                  maxHeight: `${heroHeight}px`,
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
                className={`relative ${isMobile ? '' : 'h-full'} flex-shrink-0 ${isMobile ? 'hero-slide-mobile' : ''}`}
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
                  ...(isMobile && heroHeight
                    ? {height: `${heroHeight}px`, minHeight: `${heroHeight}px`}
                    : !isMobile
                      ? {height: '100%', minHeight: '100%'}
                      : {}),
                }}
              >
                {media.type === 'video' ? (
                  <OptimizedVideo
                    src={media.url}
                    srcMobile={media.urlMobile}
                    srcDesktop={media.urlDesktop}
                    className={`${isMobile ? 'relative' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-auto' : 'h-full'} ${isMobile ? 'object-contain object-top' : 'object-cover'}`}
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
                    className={`${isMobile ? 'relative' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-auto' : 'h-full'} ${isMobile ? 'object-contain object-top' : 'object-cover'}`}
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
                      className={`absolute z-20 ${isMobile ? 'w-full px-4' : 'container mx-auto px-4 sm:px-6 lg:px-8'} h-full flex items-center ${justifyClass}`}
                      style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                    >
                      <div
                        className={`flex flex-col md:flex-row items-center text-white gap-12 md:gap-16 ${content?.isHeroTextVisible ? 'max-w-4xl' : ''} ${textAlignClass}`}
                      >
                        {content?.isHeroTextVisible && (
                          <div className="relative w-full">
                            <div className="animate-fade-in-up-subtle">
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
        {slideCount > 1 && (
          <div
            className={`${isMobile ? 'absolute' : 'absolute'} ${isMobile ? 'bottom-4' : 'bottom-10'} left-1/2 -translate-x-1/2 z-30 flex items-center space-x-4`}
            style={isMobile ? {position: 'absolute', bottom: '16px'} : {}}
          >
            {heroMedia.map((_, index) => {
              const normalizedSlide =
                currentSlide < 0 ? slideCount - 1 : currentSlide >= slideCount ? 0 : currentSlide
              return (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`relative rounded-full h-2 transition-all duration-500 ease-in-out group ${index === normalizedSlide ? 'w-12 bg-white/50' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {index === normalizedSlide && (
                    <div
                      key={`${normalizedSlide}-${index}`}
                      className="absolute top-0 left-0 h-full rounded-full bg-white animate-fill-line"
                    ></div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
