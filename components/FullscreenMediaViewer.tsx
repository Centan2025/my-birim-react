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
}

const DRAG_THRESHOLD = 30

export const FullscreenMediaViewer: React.FC<FullscreenMediaViewerProps> = ({
  items,
  initialIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(() => {
    if (!items || items.length === 0) return 0
    const safe = Math.max(0, Math.min(initialIndex, items.length - 1))
    return safe
  })
  // Klonlu dizi üzerinde kayma için viewer index'i
  const [viewerIndex, setViewerIndex] = useState(() => {
    if (!items || items.length === 0) return 0
    const safe = Math.max(0, Math.min(initialIndex, items.length - 1))
    return items.length > 1 ? safe + 1 : 0
  })
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [draggedX, setDraggedX] = useState(0)

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

  // initialIndex güncellendiğinde viewer index'i hizala
  useEffect(() => {
    if (!items || items.length === 0) return
    const safe = Math.max(0, Math.min(initialIndex, items.length - 1))
    setIndex(safe)
    setViewerIndex(items.length > 1 ? safe + 1 : 0)
  }, [items, initialIndex])

  const goNext = () => {
    if (slideCount <= 1) return
    if (!transitionEnabled) return
    setViewerIndex(prev => prev + 1)
    setIndex(prev => (prev + 1) % slideCount)
  }

  const goPrev = () => {
    if (slideCount <= 1) return
    if (!transitionEnabled) return
    setViewerIndex(prev => prev - 1)
    setIndex(prev => (prev - 1 + slideCount) % slideCount)
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
    <div className="fixed left-0 right-0 bottom-0 top-14 z-[200] bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-white/95 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-900"
          >
            <path d="M15 18l-6-6 6-6" />
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
            className="flex h-full items-start"
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
            {clonedItems.map((item, i) => (
              <div
                key={i}
                className="w-full h-full shrink-0 flex items-start justify-center"
                style={{width: `${100 / totalSlides}%`}}
              >
                {item.type === 'image' ? (
                  <OptimizedImage
                    src={item.url}
                    srcMobile={item.urlMobile}
                    srcDesktop={item.urlDesktop}
                    alt=""
                    className="w-full h-full object-contain object-top"
                    loading="eager"
                    quality={95}
                  />
                ) : item.type === 'video' ? (
                  <OptimizedVideo
                    src={item.url}
                    srcMobile={item.urlMobile}
                    srcDesktop={item.urlDesktop}
                    className="w-full h-full object-contain object-top"
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


