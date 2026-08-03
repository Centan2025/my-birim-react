import React, {useState, useRef, useEffect} from 'react'
import {Link} from 'react-router-dom'
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

  // Drag / Swipe State for mouse and touch
  const [draggedX, setDraggedX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartXRef = useRef<number>(0)
  const dragStartYRef = useRef<number>(0)
  const isPointerDownRef = useRef<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const DRAG_THRESHOLD = 50

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  if (!items || items.length === 0) {
    return null
  }

  const getLocVal = (val?: unknown) => {
    if (!val) return ''
    if (typeof val === 'string') return val.trim()
    if (typeof val === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = (val as any)[locale] || (val as any).tr || (val as any).en || ''
      return typeof current === 'string' ? current.trim() : ''
    }
    return ''
  }

  const handlePrev = () => {
    setActiveIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
  }

  // Pointer drag handlers (Mouse on desktop & Touch on mobile)
  const handlePointerDown = (clientX: number, clientY: number) => {
    isPointerDownRef.current = true
    dragStartXRef.current = clientX
    dragStartYRef.current = clientY
    setDraggedX(0)
  }

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isPointerDownRef.current) return
    const deltaX = clientX - dragStartXRef.current
    const deltaY = Math.abs(clientY - dragStartYRef.current)

    // Ignore horizontal drag if vertical scroll is predominant on touch
    if (deltaY > Math.abs(deltaX) * 1.2 && deltaY > 10 && !isDragging) {
      isPointerDownRef.current = false
      setDraggedX(0)
      return
    }

    if (Math.abs(deltaX) > 5) {
      setIsDragging(true)
      setDraggedX(deltaX)
    }
  }

  const handlePointerUp = () => {
    if (!isPointerDownRef.current && !isDragging) return
    isPointerDownRef.current = false

    if (Math.abs(draggedX) > DRAG_THRESHOLD && items.length > 1) {
      if (draggedX < 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }

    setDraggedX(0)
    setTimeout(() => {
      setIsDragging(false)
    }, 50)
  }

  // Global window listeners for smooth mouse dragging without sticking to cursor
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isPointerDownRef.current) return
      const deltaX = e.clientX - dragStartXRef.current
      if (Math.abs(deltaX) > 5) {
        setIsDragging(true)
        setDraggedX(deltaX)
      }
    }

    const handleGlobalMouseUp = () => {
      if (!isPointerDownRef.current) return
      isPointerDownRef.current = false

      setDraggedX(currentDragged => {
        if (Math.abs(currentDragged) > DRAG_THRESHOLD && items.length > 1) {
          if (currentDragged < 0) {
            handleNext()
          } else {
            handlePrev()
          }
        }
        return 0
      })

      setTimeout(() => {
        setIsDragging(false)
      }, 50)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [items.length])

  return (
    <section
      className="w-full relative bg-[var(--bg-primary)] py-0 my-0 overflow-hidden select-none leading-none scroll-snap-start home-content-block-snap"
      style={{scrollSnapAlign: 'start', scrollSnapStop: 'always'}}
    >
      {/* Main Full-Bleed & Full-Screen Interactive Showcase Container */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden bg-neutral-950 shadow-2xl ${
          items.length > 1 ? 'cursor-grab active:cursor-grabbing select-none' : ''
        }`}
        onDragStart={e => e.preventDefault()}
        onMouseDown={e => {
          if (e.button === 0) handlePointerDown(e.clientX, e.clientY)
        }}
        onTouchStart={e => {
          if (e.touches && e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
        }}
        onTouchMove={e => {
          if (e.touches && e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
        }}
        onTouchEnd={handlePointerUp}
      >
        {/* Horizontal Sliding Track (kayarak değişen görseller) */}
        <div
          className="flex w-full"
          style={{
            transform: `translateX(calc(-${activeIndex * 100}% + ${draggedX}px))`,
            transition: isDragging ? 'none' : 'transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {items.map((slide, slideIdx) => {
            const slideTitle = getLocVal(slide.title)

            return (
              <div
                key={slideIdx}
                className="w-full flex-shrink-0 relative h-[80vh] min-h-[550px] md:h-[90vh] lg:h-screen bg-neutral-900 overflow-hidden"
              >
                {/* Background Visual (100% Full Screen Cover) */}
                <div className="absolute inset-0 w-full h-full">
                  <OptimizedImage
                    src={isMobile && slide.imageMobile ? slide.imageMobile : slide.image}
                    alt={slideTitle || 'İnteraktif Ürün Görseli'}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    quality={95}
                    crop={slide.crop}
                    hotspot={slide.hotspot}
                  />
                  {/* Subtle vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/30 pointer-events-none" />
                </div>

                {/* Slide Title Overlay (No background color, no border, modern typography) */}
                {slideTitle ? (
                  <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20 pointer-events-none">
                    <span className="text-white text-sm md:text-xl font-light uppercase tracking-[0.3em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] font-sans">
                      {slideTitle}
                    </span>
                  </div>
                ) : null}

                {/* Hotspot Pins for this slide */}
                {slide.hotspots && slide.hotspots.length > 0 && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {slide.hotspots.map((hs, hsIdx) => {
                      const isActive =
                        activeHotspot?.slideIndex === slideIdx &&
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
                                  slideIndex: slideIdx,
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

                          {/* Desktop Popover Card (Large Image Banner White Square Card) */}
                          {!isMobile && isActive && prod && (
                            <div
                              className={`absolute z-50 w-80 sm:w-88 bg-white text-neutral-900 border border-neutral-200 rounded-none shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
                                hs.y > 60 ? 'bottom-full mb-4' : 'top-full mt-4'
                              } ${
                                hs.x > 70
                                  ? 'right-0'
                                  : hs.x < 30
                                    ? 'left-0'
                                    : 'left-1/2 -translate-x-1/2'
                              }`}
                              onClick={e => e.stopPropagation()}
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
                                    {prod.categoryName || prod.designerName ? (
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 line-clamp-1">
                                        {getLocVal(prod.categoryName) ||
                                          getLocVal(prod.designerName)}
                                      </p>
                                    ) : null}
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
                            </div>
                          )}
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
                const isActive = activeIndex === index
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-2 rounded-none transition-all duration-500 ease-in-out group ${
                      isActive ? 'w-2 bg-red-900' : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Görsel ${index + 1}`}
                  >
                    {isActive && (
                      <div
                        key={`${activeIndex}-${index}`}
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

      {/* Mobile Active Hotspot Drawer (Görselli Beyaz Dik Köşeli Mobil Kart) */}
      {isMobile && activeHotspot && activeHotspot.hotspot.product && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 p-5 bg-white text-neutral-900 border-t-2 border-neutral-900 shadow-2xl rounded-none animate-in slide-in-from-bottom duration-300"
          onClick={e => e.stopPropagation()}
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
                  {prod.categoryName || prod.designerName ? (
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">
                      {getLocVal(prod.categoryName) || getLocVal(prod.designerName)}
                    </p>
                  ) : null}
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
        </div>
      )}
    </section>
  )
}
