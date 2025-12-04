import React, {useEffect, useState, useMemo} from 'react'
import {OptimizedImage} from './OptimizedImage'
import {OptimizedVideo} from './OptimizedVideo'

type MediaItem = {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
}

interface FullscreenMediaViewerProps {
  items: MediaItem[]
  initialIndex?: number
  onClose: () => void
  // Opsiyonel: bazı sayfalarda (ör. iletişim) okları her durumda göstermek için
  forceShowArrows?: boolean
}

const DRAG_THRESHOLD = 30

export const FullscreenMediaViewer: React.FC<FullscreenMediaViewerProps> = ({
  items,
  initialIndex = 0,
  onClose,
  forceShowArrows = false,
}) => {
  // Klonlu dizi üzerinde kayma için viewer index'i
  const [viewerIndex, setViewerIndex] = useState<number>(() => {
    if (!items || items.length === 0) return 0
    const safe = Math.max(0, Math.min(initialIndex, items.length - 1))
    return items.length > 1 ? safe + 1 : 0
  })
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [draggedX, setDraggedX] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  if (!items || items.length === 0) return null

  const slideCount = items.length

  // Sonsuz döngü için klonlanmış dizi: [son, ...items, ilk]
  const clonedItems = useMemo(() => {
    if (slideCount <= 1) return items
    const first = items[0]
    const last = items[items.length - 1]
    return [last, ...items, first]
  }, [items, slideCount])
  const totalSlides = clonedItems.length || 1

  // Görünen (klonlu) index'ten mantıksal (0..slideCount-1) index'e geçiş
  const logicalIndex = useMemo(() => {
    if (slideCount <= 1) return 0
    let idx = viewerIndex - 1
    if (idx < 0) idx = slideCount - 1
    if (idx >= slideCount) idx = 0
    return idx
  }, [viewerIndex, slideCount])

  // initialIndex güncellendiğinde viewer index'i hizala
  useEffect(() => {
    if (!items || items.length === 0) return
    const safe = Math.max(0, Math.min(initialIndex, items.length - 1))
    setViewerIndex(items.length > 1 ? safe + 1 : 0)
  }, [items, initialIndex])

  // Sadece viewport genişliğine göre basit mobil tespiti (desktop davranışını bozmamak için)
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Açıldığında sayfayı en üste kaydır ve body scroll'unu kilitle
  useEffect(() => {
    if (typeof window === 'undefined') return

    window.scrollTo({top: 0, behavior: 'auto'})
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    // Sayfa arka planının (hem body hem html) kaymasını durdur
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  const goNext = () => {
    if (slideCount <= 1) return
    if (!transitionEnabled) return
    setViewerIndex((prev: number) => prev + 1)
  }

  const goPrev = () => {
    if (slideCount <= 1) return
    if (!transitionEnabled) return
    setViewerIndex((prev: number) => prev - 1)
  }

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (e.target instanceof HTMLElement && e.target.closest('button, a')) {
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
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (draggedX < -DRAG_THRESHOLD) {
      goNext()
    } else if (draggedX > DRAG_THRESHOLD) {
      goPrev()
    }
    setDraggedX(0)
  }

  // Geçiş animasyonu bittiğinde cloned slide'lardan gerçek slide'a snap et
  const handleTransitionEnd = () => {
    if (slideCount <= 1) return
    if (!transitionEnabled) return

    if (viewerIndex === totalSlides - 1) {
      // sağdaki clone'dan ilk gerçeğe
      setTransitionEnabled(false)
      setViewerIndex(1)
      return
    }
    if (viewerIndex === 0) {
      // soldaki clone'dan son gerçeğe
      setTransitionEnabled(false)
      setViewerIndex(totalSlides - 2)
    }
  }

  // Snap sonrasında transition'ı tekrar aç
  useEffect(() => {
    if (!transitionEnabled) {
      const id = requestAnimationFrame(() => {
        setTransitionEnabled(true)
      })
      return () => cancelAnimationFrame(id)
    }
    return
  }, [transitionEnabled])

  return (
    // Mobilde: header yüksekliği (h-14 ≈ 3.5rem) kadar yukarıdan başla → header görünür,
    // altındaki breadcrumb / navigation içeriklerini kapat.
    // Desktop'ta: header'ın tam altından (top-24 ≈ 6rem) başla; header üstte kalır.
    <div className="fixed left-0 right-0 bottom-0 top-14 md:top-24 z-30 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-white/95 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-900"
          >
            {/* Daha ince geri ok, ortadaki çizgi okun ucundan başlamıyor */}
            <path d="M14.5 18.5L8 12l6.5-6.5" />
            <line x1="9" y1="12" x2="21" y2="12" />
          </svg>
        </button>
      </div>

      <div
        className="flex-1 flex items-start justify-center px-0 pb-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="w-full h-full overflow-hidden">
          <div
            className="flex h-full items-center"
            style={{
              width: `${totalSlides * 100}%`,
              transform: `translateX(calc(-${
                (viewerIndex * 100) / totalSlides
              }% + ${draggedX}px))`,
              transition:
                isDragging || !transitionEnabled ? 'none' : 'transform 0.3s ease-out',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {clonedItems.map((item, i) => {
              if (!item) return null
              return (
                <div
                  key={i}
                  className="w-full h-full shrink-0 flex items-start justify-center px-4 sm:px-6"
                  style={{width: `${100 / totalSlides}%`}}
                >
                  {item.type === 'image' ? (
                    <OptimizedImage
                      src={item.url}
                      srcMobile={item.urlMobile}
                      srcDesktop={item.urlDesktop}
                      alt=""
                      className="w-full max-h-full object-contain"
                      loading="eager"
                      quality={95}
                    />
                  ) : item.type === 'video' ? (
                    <OptimizedVideo
                      src={item.url}
                      srcMobile={item.urlMobile}
                      srcDesktop={item.urlDesktop}
                      className="w-full max-h-full object-contain"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      loading="eager"
                    />
                  ) : (
                    <iframe
                      className="w-full h-full object-top"
                      title={`fullscreen-media-youtube-${i}`}
                      src={item.url}
                      allow="autoplay; encrypted-media; fullscreen"
                      frameBorder="0"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Alt kısım: önceki / sonraki görsel okları - tüm cihazlarda viewer'ın en dibine sabitlenir */}
      {(slideCount > 1 || forceShowArrows) && (
        <div className="absolute left-0 right-0 bottom-0 pb-3 pt-2 px-6 flex items-center justify-between bg-white/95 shadow-inner">
          <div className="flex-1 flex justify-start">
            {(logicalIndex > 0 ||
              (forceShowArrows && isMobile && slideCount === 1)) && (
              <button
                type="button"
                onClick={goPrev}
                className="flex items-center justify-center w-12 h-12 active:scale-95 transition-transform"
                aria-label="Önceki görsel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 18.5L8 12l6.5-6.5" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            {(logicalIndex < slideCount - 1 ||
              (forceShowArrows && isMobile && slideCount === 1)) && (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center justify-center w-12 h-12 active:scale-95 transition-transform"
                aria-label="Sonraki görsel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.5 5.5L16 12l-6.5 6.5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

