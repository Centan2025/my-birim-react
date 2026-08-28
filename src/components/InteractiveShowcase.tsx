import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react'
import {Link} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {InteractiveShowcaseItem, ProductHotspot, LocalizedString} from '../types'
import {useTranslation} from '../i18n'
import {OptimizedImage} from './OptimizedImage'

interface InteractiveShowcaseProps {
  items?: InteractiveShowcaseItem[]
  sectionTitle?: LocalizedString
}

export const InteractiveShowcase: React.FC<InteractiveShowcaseProps> = ({items}) => {
  const {locale} = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [activeHotspot, setActiveHotspot] = useState<{
    slideIndex: number
    hotspot: ProductHotspot
    hotspotIndex: number
  } | null>(null)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })

  // Drag / Swipe State (HomeHero ile birebir aynı mimari)
  const [dragStartX, setDragStartX] = useState(0)
  const [draggedX, setDraggedX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const DRAG_THRESHOLD = 50
  const VERTICAL_SCROLL_TOLERANCE = 1.2
  const MIN_VERTICAL_DELTA = 8

  const slideCount = items?.length || 0
  const clonedItems = useMemo(() => {
    if (!items || items.length <= 1) return items || []
    return [items[items.length - 1], ...items, items[0]]
  }, [items])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Timeout cleanup
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (innerTimeoutRef.current) clearTimeout(innerTimeoutRef.current)
    }
  }, [])

  const resetCloneIfNeeded = useCallback(() => {
    if (slideCount <= 1) return
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
    if (innerTimeoutRef.current) {
      clearTimeout(innerTimeoutRef.current)
      innerTimeoutRef.current = null
    }
    const safeCurrent = ((activeIndex % slideCount) + slideCount) % slideCount
    if (safeCurrent !== activeIndex) {
      setIsTransitioning(true)
      setActiveIndex(safeCurrent)
    }
  }, [activeIndex, slideCount])

  const handleNext = useCallback(() => {
    if (slideCount <= 1) {
      setDraggedX(0)
      return
    }

    const safeCurrent = ((activeIndex % slideCount) + slideCount) % slideCount
    const nextSlide = safeCurrent + 1

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
    if (innerTimeoutRef.current) clearTimeout(innerTimeoutRef.current)

    if (nextSlide >= slideCount) {
      setIsTransitioning(false)
      setActiveIndex(slideCount)
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(true)
        setActiveIndex(0)
        requestAnimationFrame(() => {
          setIsTransitioning(false)
          transitionTimeoutRef.current = null
        })
      }, 1000)
    } else {
      setIsTransitioning(false)
      setActiveIndex(nextSlide)
    }
    setDraggedX(0)
  }, [activeIndex, slideCount])

  const handlePrev = useCallback(() => {
    if (slideCount <= 1) {
      setDraggedX(0)
      return
    }

    const safeCurrent = ((activeIndex % slideCount) + slideCount) % slideCount
    const prevSlide = safeCurrent - 1

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
    if (innerTimeoutRef.current) clearTimeout(innerTimeoutRef.current)

    if (prevSlide < 0) {
      setIsTransitioning(false)
      setActiveIndex(-1)
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(true)
        setActiveIndex(slideCount - 1)
        requestAnimationFrame(() => {
          setIsTransitioning(false)
          transitionTimeoutRef.current = null
        })
      }, 1000)
    } else {
      setIsTransitioning(false)
      setActiveIndex(prevSlide)
    }
    setDraggedX(0)
  }, [activeIndex, slideCount])

  const goToSlide = useCallback(
    (index: number) => {
      if (slideCount <= 1) return
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = null
      }
      if (innerTimeoutRef.current) {
        clearTimeout(innerTimeoutRef.current)
        innerTimeoutRef.current = null
      }
      setIsTransitioning(false)
      const target = Math.max(0, Math.min(index, slideCount - 1))
      setActiveIndex(target)
      setDraggedX(0)
    },
    [slideCount]
  )

  // Touch event'ler – dikey scroll'a izin ver, yatay sürüklemeyi koru (HomeHero ile aynı)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
        return
      }
      if (!e.touches || e.touches.length === 0) return
      resetCloneIfNeeded()
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

      if (deltaY > deltaX * VERTICAL_SCROLL_TOLERANCE && deltaY > MIN_VERTICAL_DELTA) {
        setIsDragging(false)
        setDraggedX(0)
        return
      }

      setDraggedX(currentX - dragStartX)
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      setIsDragging(false)

      const count = items?.length || 1
      if (count <= 1) {
        setDraggedX(0)
        return
      }

      if (draggedX < -DRAG_THRESHOLD) {
        handleNext()
      } else if (draggedX > DRAG_THRESHOLD) {
        handlePrev()
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
  }, [isDragging, dragStartX, draggedX, items?.length, handleNext, handlePrev, resetCloneIfNeeded])

  // Close popover when active slide changes
  useEffect(() => {
    setActiveHotspot(null)
  }, [activeIndex])

  // ESC key listener to close popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveHotspot(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!items || items.length === 0 || isMobile) {
    return null
  }

  const getLocVal = (val?: unknown) => {
    if (!val) return ''
    if (typeof val === 'string') return val.trim()
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>
      const current = obj[locale] || obj['tr'] || obj['en'] || ''
      return typeof current === 'string' ? current.trim() : ''
    }
    return ''
  }

  // Mouse / Pointer drag handlers (HomeHero ile birebir aynı)
  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
      return
    }
    resetCloneIfNeeded()
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
    const rawDelta = currentX - dragStartX
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth
    // Apply soft dampening and clamp maximum drag movement to prevent over-scrolling
    const clampedDelta = Math.min(
      Math.max(rawDelta * 0.85, -containerWidth * 0.5),
      containerWidth * 0.5
    )
    setDraggedX(clampedDelta)
    if (!('touches' in e)) {
      e.preventDefault()
    }
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const finalDelta = draggedX
    setDraggedX(0)

    const count = items?.length || 1
    if (count <= 1) return

    // Require controlled 60px threshold to move exactly 1 slide at a time
    if (finalDelta < -60) {
      handleNext()
    } else if (finalDelta > 60) {
      handlePrev()
    }
  }

  const getTransform = () => {
    if (slideCount <= 1) return `translateX(${draggedX}px)`

    let virtualSlide = activeIndex
    if (virtualSlide < -1) virtualSlide = -1
    if (virtualSlide > slideCount) virtualSlide = slideCount

    const translateX = -(virtualSlide + 1) * 100
    return `translateX(calc(${translateX}% + ${draggedX}px))`
  }

  const normalizedActiveIndex =
    slideCount > 0 ? ((activeIndex % slideCount) + slideCount) % slideCount : 0

  return (
    <section
      className="w-full relative bg-[var(--bg-primary)] py-0 my-0 overflow-hidden select-none leading-none scroll-snap-start home-content-block-snap"
      style={{scrollSnapAlign: 'start', scrollSnapStop: 'always'}}
    >
      {/* Main Full-Bleed & Full-Screen Interactive Showcase Container */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={containerRef}
        role="region"
        aria-label="Interactive Showcase"
        className={`relative w-full overflow-hidden bg-neutral-950 shadow-2xl ${
          (items?.length || 0) > 1 ? 'cursor-grab active:cursor-grabbing select-none' : ''
        }`}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Horizontal Sliding Track (kayarak değişen görseller) */}
        <div
          className="flex w-full"
          style={{
            transform: getTransform(),
            transition:
              isDragging || isTransitioning
                ? 'none'
                : 'transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {clonedItems.map((slide, index) => {
            if (!slide) return null
            const isClone = slideCount > 1 && (index === 0 || index === slideCount + 1)
            const realSlideIdx =
              slideCount > 1
                ? index === 0
                  ? slideCount - 1
                  : index === slideCount + 1
                    ? 0
                    : index - 1
                : index
            const slideTitle = getLocVal(slide.title)

            return (
              <div
                key={`${realSlideIdx}-${index}`}
                aria-hidden={isClone ? 'true' : undefined}
                className="w-full flex-shrink-0 relative h-[80vh] min-h-[550px] md:h-[90vh] lg:h-screen bg-neutral-900 overflow-hidden"
              >
                {/* Background Visual (100% Full Screen Cover) */}
                <div className="absolute inset-0 w-full h-full">
                  <OptimizedImage
                    src={slide.image}
                    srcMobile={slide.imageMobile}
                    alt={!isClone && slideTitle ? slideTitle : 'İnteraktif Ürün Görseli'}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    quality={95}
                    crop={slide.crop}
                    hotspot={slide.hotspot}
                    origWidth={slide.origWidth as number}
                    origHeight={slide.origHeight as number}
                    cropMobile={slide.cropMobile}
                    hotspotMobile={slide.hotspotMobile}
                    origWidthMobile={slide.origWidthMobile as number}
                    origHeightMobile={slide.origHeightMobile as number}
                  />
                  {/* Subtle vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/30 pointer-events-none" />
                </div>

                {/* Slide Title Overlay (No background color, no border, modern typography) */}
                {!isClone && slideTitle ? (
                  <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20 pointer-events-none">
                    <span className="text-white text-sm md:text-xl font-light uppercase tracking-[0.3em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] font-sans">
                      {slideTitle}
                    </span>
                  </div>
                ) : null}

                {/* Hotspot Pins for this slide */}
                {!isClone && slide.hotspots && slide.hotspots.length > 0 && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {slide.hotspots.map((hs, hsIdx) => {
                      const isActive =
                        activeHotspot?.slideIndex === realSlideIdx &&
                        activeHotspot?.hotspotIndex === hsIdx

                      const prod = hs.product
                      const prodName = getLocVal(hs.label) || getLocVal(prod?.name) || 'Ürün'

                      return (
                        <div
                          key={hsIdx}
                          className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2"
                          style={{left: `${hs.x}%`, top: `${hs.y}%`}}
                        >
                          {/* Modern Hotspot Pin Button */}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              if (isDragging) return
                              if (isActive) {
                                setActiveHotspot(null)
                              } else {
                                setActiveHotspot({
                                  slideIndex: realSlideIdx,
                                  hotspot: hs,
                                  hotspotIndex: hsIdx,
                                })
                              }
                            }}
                            className={`group relative flex items-center justify-center p-3 focus:outline-none transition-transform duration-300 ${
                              isActive ? 'scale-125 z-40' : 'hover:scale-115 z-30'
                            }`}
                            aria-label={`Hotspot: ${prodName}`}
                          >
                            {/* Outer pulsing aura ring */}
                            <span
                              className={`absolute inline-flex h-9 w-9 md:h-11 md:w-11 rounded-full transition-all duration-500 ${
                                isActive
                                  ? 'bg-white/60 border border-white animate-ping'
                                  : 'bg-white/35 border border-white/50 animate-pulse group-hover:bg-white/50'
                              }`}
                            />

                            {/* Circular Glass Dot Pin */}
                            <span
                              className={`relative inline-flex items-center justify-center h-6 w-6 md:h-7 md:w-7 rounded-full border transition-all duration-300 shadow-2xl ${
                                isActive
                                  ? 'bg-neutral-900 border-white text-white scale-110'
                                  : 'bg-white/95 border-neutral-900 text-neutral-900 group-hover:bg-white'
                              }`}
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                            </span>
                          </button>

                          {/* Desktop Popover Card (Large Image Banner White Square Card) with smooth fluid animation */}
                          <AnimatePresence>
                            {!isMobile && isActive && prod && (
                              /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
                              <motion.div
                                key={`hotspot-card-${hsIdx}`}
                                initial={{
                                  opacity: 0,
                                  scale: 0.88,
                                  y: hs.y > 60 ? 14 : -14,
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                  y: 0,
                                }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.92,
                                  y: hs.y > 60 ? 8 : -8,
                                }}
                                transition={{
                                  type: 'spring',
                                  damping: 24,
                                  stiffness: 280,
                                  mass: 0.8,
                                }}
                                role="dialog"
                                aria-label="Hotspot details"
                                className={`absolute z-50 w-80 sm:w-88 bg-white text-neutral-900 border border-neutral-200 rounded-none shadow-2xl overflow-hidden ${
                                  hs.y > 60 ? 'bottom-full mb-4' : 'top-full mt-4'
                                } ${
                                  hs.x > 70
                                    ? 'right-0'
                                    : hs.x < 30
                                      ? 'left-0'
                                      : 'left-1/2 -translate-x-1/2'
                                }`}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => {
                                  if (e.key === 'Escape') {
                                    e.stopPropagation()
                                    setActiveHotspot(null)
                                  }
                                }}
                              >
                                {/* Close Button (X) */}
                                <button
                                  type="button"
                                  onClick={() => setActiveHotspot(null)}
                                  className="absolute top-3 right-3 z-20 text-neutral-600 hover:text-neutral-900 bg-white/80 hover:bg-white p-1.5 rounded-full backdrop-blur-md transition-colors shadow-md border border-neutral-200"
                                  aria-label="Kapat"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>

                                <Link
                                  to={prod.id ? `/product/${prod.id}` : '#'}
                                  className="block group/card"
                                >
                                  {/* Large Prominent Product Image Banner */}
                                  {(() => {
                                    const imgSrc =
                                      typeof prod.mainImage === 'string'
                                        ? prod.mainImage
                                        : (prod.mainImage as {url?: string} | undefined)?.url

                                    return (
                                      <div className="w-full h-48 bg-neutral-100 border-b border-neutral-200 overflow-hidden relative">
                                        {imgSrc ? (
                                          <img
                                            src={imgSrc}
                                            alt={prodName}
                                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                            <svg
                                              className="w-10 h-10"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                              />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}

                                  {/* Product Info Section */}
                                  <div className="p-5 flex flex-col justify-between">
                                    <div>
                                      {(() => {
                                        const cat = getLocVal(prod.categoryName)
                                        const des = getLocVal(prod.designerName)
                                        if (!cat && !des) return null
                                        return (
                                          <div className="space-y-0.5 mb-1">
                                            {cat ? (
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 line-clamp-1">
                                                {cat}
                                              </p>
                                            ) : null}
                                            {des ? (
                                              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-800 line-clamp-1">
                                                TASARIMCI: {des}
                                              </p>
                                            ) : null}
                                          </div>
                                        )
                                      })()}
                                      <h4 className="text-base font-medium uppercase tracking-wider text-neutral-900 group-hover/card:text-neutral-600 transition-colors line-clamp-2 mt-1">
                                        {prodName}
                                      </h4>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 group-hover/card:underline underline-offset-4">
                                        Ürünü İncele &gt;
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Multi-Slide Navigation Arrows (Şeffaf ve Çerçeveli / Transparent & Bordered Buttons) */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-none bg-transparent hover:bg-white hover:text-neutral-900 text-white backdrop-blur-md items-center justify-center transition-all duration-300 border border-white/80 shadow-2xl hover:scale-105"
              aria-label="Önceki Görsel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-none bg-transparent hover:bg-white hover:text-neutral-900 text-white backdrop-blur-md items-center justify-center transition-all duration-300 border border-white/80 shadow-2xl hover:scale-105"
              aria-label="Sonraki Görsel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Slide Pagination Dots (Hero stili kare dotlar / Square dots matching Hero) */}
        {items.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-4">
            <div className="flex items-center gap-3">
              {items.map((_, index) => {
                const isActive = normalizedActiveIndex === index
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToSlide(index)}
                    className={`relative h-2 rounded-none transition-all duration-500 ease-in-out group ${
                      isActive ? 'w-2 bg-red-900' : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Görsel ${index + 1}`}
                  >
                    {isActive && (
                      <div
                        key={`${normalizedActiveIndex}-${index}`}
                        className="absolute top-0 left-0 h-full rounded-none bg-red-900 animate-fill-line"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Active Hotspot Drawer (Görselli Beyaz Dik Köşeli Mobil Kart) with fluid animation */}
      <AnimatePresence>
        {isMobile && activeHotspot && activeHotspot.hotspot.product && (
          /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
          <motion.div
            key="mobile-hotspot-drawer"
            initial={{opacity: 0, y: '100%'}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: '100%'}}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 280,
              mass: 0.9,
            }}
            role="dialog"
            aria-label="Mobile Hotspot details"
            className="fixed inset-x-0 bottom-0 z-50 p-5 bg-white text-neutral-900 border-t-2 border-neutral-900 shadow-2xl rounded-none"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                setActiveHotspot(null)
              }
            }}
          >
            <button
              type="button"
              onClick={() => setActiveHotspot(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1"
              aria-label="Kapat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {(() => {
              const prod = activeHotspot.hotspot.product
              if (!prod) return null
              const prodName =
                getLocVal(activeHotspot.hotspot.label) || getLocVal(prod.name) || 'Ürün'

              const imgSrc =
                typeof prod.mainImage === 'string'
                  ? prod.mainImage
                  : (prod.mainImage as {url?: string} | undefined)?.url

              return (
                <Link
                  to={prod.id ? `/product/${prod.id}` : '#'}
                  className="flex items-center gap-4 py-1"
                  onClick={() => setActiveHotspot(null)}
                >
                  {imgSrc ? (
                    <div className="w-24 h-24 flex-shrink-0 bg-neutral-100 border border-neutral-200 rounded-none overflow-hidden relative">
                      <img src={imgSrc} alt={prodName} className="w-full h-full object-cover" />
                    </div>
                  ) : null}

                  <div className="flex-1 min-w-0">
                    {(() => {
                      const cat = getLocVal(prod.categoryName)
                      const des = getLocVal(prod.designerName)
                      if (!cat && !des) return null
                      return (
                        <div className="space-y-0.5 mb-1">
                          {cat ? (
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 line-clamp-1">
                              {cat}
                            </p>
                          ) : null}
                          {des ? (
                            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-800 line-clamp-1">
                              TASARIMCI: {des}
                            </p>
                          ) : null}
                        </div>
                      )
                    })()}
                    <h4 className="text-base font-medium uppercase tracking-wider text-neutral-900 mt-0.5 line-clamp-2">
                      {prodName}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-semibold text-neutral-900 underline underline-offset-4 mt-2">
                      Ürünü İncele &gt;
                    </span>
                  </div>
                </Link>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
