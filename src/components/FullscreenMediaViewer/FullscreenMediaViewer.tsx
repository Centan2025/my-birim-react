import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FullscreenMediaViewerProps } from './types'
import { FullscreenMediaItem } from './FullscreenMediaItem'
import { FullscreenControls } from './FullscreenControls'

export const FullscreenMediaViewer: React.FC<FullscreenMediaViewerProps> = ({
  items,
  initialIndex = 0,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isButtonVisible, setIsButtonVisible] = useState(false)
  const [visibleIndices, setVisibleIndices] = useState<number[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const closingVisibleIndicesRef = useRef<number[]>([])

  // Mouse drag için state'ler (desktop için)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartScrollLeft = useRef(0)

  // Mobilde yukarı git butonu için state
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  const slideCount = items?.length ?? 0
  const hasItems = slideCount > 0

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // Mobil ve orientation kontrolü
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobileAndOrientation = () => {
      setIsMobile(window.innerWidth < 768)
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    checkMobileAndOrientation()
    window.addEventListener('resize', checkMobileAndOrientation)
    window.addEventListener('orientationchange', checkMobileAndOrientation)
    return () => {
      window.removeEventListener('resize', checkMobileAndOrientation)
      window.removeEventListener('orientationchange', checkMobileAndOrientation)
    }
  }, [])

  // Açılış animasyonu
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    const timer2 = setTimeout(() => {
      requestAnimationFrame(() => {
        setIsButtonVisible(true)
      })
    }, 400)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  // Kapanış animasyonu
  const handleClose = () => {
    const currentVisible: number[] = []
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const isHorizontal = (isMobile && isLandscape) || !isMobile

      if (isHorizontal) {
        const containerLeft = container.scrollLeft
        const containerRight = containerLeft + container.clientWidth

        itemRefs.current.forEach((ref, index) => {
          if (!ref) return
          const itemLeft = ref.offsetLeft
          const itemRight = itemLeft + ref.offsetWidth

          if (itemRight > containerLeft && itemLeft < containerRight) {
            currentVisible.push(index)
          }
        })

        currentVisible.sort((a, b) => {
          const refA = itemRefs.current[a]
          const refB = itemRefs.current[b]
          if (!refA || !refB) return 0
          return refA.offsetLeft - refB.offsetLeft
        })
      } else {
        const containerTop = container.scrollTop
        const containerBottom = containerTop + container.clientHeight

        itemRefs.current.forEach((ref, index) => {
          if (!ref) return
          const itemTop = ref.offsetTop
          const itemBottom = itemTop + ref.offsetHeight

          if (itemBottom > containerTop && itemTop < containerBottom) {
            currentVisible.push(index)
          }
        })

        currentVisible.sort((a, b) => {
          const refA = itemRefs.current[a]
          const refB = itemRefs.current[b]
          if (!refA || !refB) return 0
          return refA.offsetTop - refB.offsetTop
        })
      }

      setVisibleIndices(currentVisible)
      closingVisibleIndicesRef.current = currentVisible
    }

    setIsClosing(true)
    setIsButtonVisible(false)

    const visibleCount =
      closingVisibleIndicesRef.current.length > 0
        ? closingVisibleIndicesRef.current.length
        : currentVisible.length
    const topItemDelay = visibleCount > 0 ? (visibleCount - 1) * 75 : (items.length - 1) * 75
    const imageAnimationDuration = 250
    const totalImageAnimation = topItemDelay + imageAnimationDuration

    setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose()
      }, 200)
    }, totalImageAnimation)
  }

  // Scroll kilitleme ve elementleri gizleme
  useEffect(() => {
    if (typeof window === 'undefined') return

    window.scrollTo({ top: 0, behavior: 'auto' })
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.classList.add('fullscreen-viewer-active')

    const hideElement = (selector: string) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        if (el) {
          const htmlEl = el as HTMLElement
          htmlEl.style.setProperty('display', 'none', 'important')
          htmlEl.style.setProperty('visibility', 'hidden', 'important')
          htmlEl.style.setProperty('opacity', '0', 'important')
        }
      })
    }

    // Basitleştirilmiş gizleme
    hideElement('header')
    hideElement('footer')
    hideElement('[class*="top-banner"]')

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.classList.remove('fullscreen-viewer-active')

      const showElement = (selector: string) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          if (el) {
            const htmlEl = el as HTMLElement
            htmlEl.style.removeProperty('display')
            htmlEl.style.removeProperty('visibility')
            htmlEl.style.removeProperty('opacity')
          }
        })
      }
      showElement('header')
      showElement('footer')
      showElement('[class*="top-banner"]')
    }
  }, [])

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || !scrollContainerRef.current) return
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartScrollLeft.current = scrollContainerRef.current.scrollLeft
    scrollContainerRef.current.style.cursor = 'grabbing'
    scrollContainerRef.current.style.scrollSnapType = 'none'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.clientX
    const walk = (dragStartX.current - x) * 1.5
    scrollContainerRef.current.scrollLeft = dragStartScrollLeft.current + walk
  }

  const handleMouseUp = () => {
    if (isMobile || !isDragging || !scrollContainerRef.current) return
    setIsDragging(false)
    const container = scrollContainerRef.current
    container.style.cursor = 'grab'

    // Snap to nearest
    const scrollLeft = container.scrollLeft
    let nearestIndex = 0
    let minDistance = Infinity

    itemRefs.current.forEach((ref, index) => {
      if (!ref) return
      const itemLeft = ref.offsetLeft - container.offsetLeft
      const distance = Math.abs(scrollLeft - itemLeft)
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = index
      }
    })

    const targetRef = itemRefs.current[nearestIndex]
    if (targetRef) {
      container.scrollTo({
        left: targetRef.offsetLeft - container.offsetLeft,
        behavior: 'smooth',
      })
    }

    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.scrollSnapType = 'x mandatory'
      }
    }, 300)
  }

  // Scroll effects
  useEffect(() => {
    if (!scrollContainerRef.current || typeof window === 'undefined') return

    const updateVisibleIndices = () => {
      if (!scrollContainerRef.current) return
      const container = scrollContainerRef.current
      const isHorizontal = (isMobile && isLandscape) || !isMobile

      if (isHorizontal) {
        const containerLeft = container.scrollLeft
        const containerRight = containerLeft + container.clientWidth
        setShowScrollToTop(false)

        const visible: number[] = []
        itemRefs.current.forEach((ref, index) => {
          if (!ref) return
          if (ref.offsetLeft + ref.offsetWidth > containerLeft && ref.offsetLeft < containerRight) {
            visible.push(index)
          }
        })
        setVisibleIndices(visible)
      } else {
        const containerTop = container.scrollTop
        setShowScrollToTop(isMobile && !isLandscape && containerTop > 200)

        const visible: number[] = []
        itemRefs.current.forEach((ref, index) => {
          if (!ref) return
          if (
            ref.offsetTop + ref.offsetHeight > containerTop &&
            ref.offsetTop < containerTop + container.clientHeight
          ) {
            visible.push(index)
          }
        })
        setVisibleIndices(visible)
      }
    }

    const container = scrollContainerRef.current
    container.addEventListener('scroll', updateVisibleIndices)
    window.addEventListener('resize', updateVisibleIndices)
    return () => {
      container.removeEventListener('scroll', updateVisibleIndices)
      window.removeEventListener('resize', updateVisibleIndices)
    }
  }, [items.length, isMobile, isLandscape])

  const scrollToIndex = useCallback(
    (index: number) => {
      if (!scrollContainerRef.current) return
      const container = scrollContainerRef.current
      const targetEl = itemRefs.current[index]
      if (targetEl) {
        if (!isMobile || (isMobile && isLandscape)) {
          container.scrollTo({ left: targetEl.offsetLeft, behavior: 'smooth' })
        } else {
          container.scrollTo({ top: targetEl.offsetTop, behavior: 'smooth' })
        }
      }
    },
    [isMobile, isLandscape]
  )

  useEffect(() => {
    if (initialIndex >= 0 && scrollContainerRef.current) {
      setTimeout(() => scrollToIndex(initialIndex), 100)
    }
  }, [initialIndex, scrollToIndex])

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -window.innerWidth / 2, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: window.innerWidth / 2, behavior: 'smooth' })
    }
  }

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!hasItems) return null

  return createPortal(
    <div
      className="fixed flex flex-col overflow-hidden"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 99999,
        backgroundColor: '#e5e7eb',
      }}
    >
      <div
        className={`w-full relative transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ height: '100dvh', overflow: 'hidden' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <FullscreenControls
            isMobile={isMobile}
            isLandscape={isLandscape}
            isClosing={isClosing}
            isButtonVisible={isButtonVisible}
            handleClose={handleClose}
            onPrev={handleScrollLeft}
            onNext={handleScrollRight}
            showScrollToTop={showScrollToTop}
            handleScrollToTop={handleScrollToTop}
            slideCount={slideCount}
          />

          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            role="region"
            aria-label="Fullscreen media scroll container"
            ref={scrollContainerRef}
            className={`w-full overflow-y-auto md:overflow-y-hidden md:overflow-x-auto flex ${isMobile && isLandscape ? 'flex-row' : isMobile ? 'flex-col' : 'flex-row'
              } items-start md:items-stretch ${slideCount === 1 ? 'justify-center' : 'justify-start'} px-0 md:px-4 md:cursor-grab md:select-none`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              height: '100dvh',
              paddingTop: isMobile && isLandscape ? '4px' : '0',
              paddingBottom: isMobile && isLandscape ? '4px' : '0',
              gap: isMobile && isLandscape ? '4px' : isMobile ? '0' : '6px',
              cursor: isDragging && !isMobile ? 'grabbing' : !isMobile ? 'grab' : 'default',
              overflowY: isMobile && isLandscape ? 'hidden' : isMobile ? 'auto' : 'hidden',
              overflowX: isMobile && isLandscape ? 'auto' : isMobile ? 'hidden' : 'auto',
              scrollSnapType: (isMobile && isLandscape) || !isMobile ? 'x mandatory' : 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <style>{`div::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; } * { scrollbar-width: none !important; -ms-overflow-style: none !important; }`}</style>
            {items.map((item, i) => {
              let animationDelay = 0
              const currentVisible =
                closingVisibleIndicesRef.current.length > 0
                  ? closingVisibleIndicesRef.current
                  : visibleIndices
              if (isClosing) {
                const visibleIndex = currentVisible.indexOf(i)
                const reverseIndex =
                  visibleIndex >= 0
                    ? currentVisible.length - 1 - visibleIndex
                    : items.length - 1 - i
                animationDelay = reverseIndex * 60
              } else {
                animationDelay = isVisible ? i * 100 : 0
              }

              return (
                <FullscreenMediaItem
                  key={i}
                  item={item}
                  index={i}
                  isVisible={isVisible}
                  isClosing={isClosing}
                  animationDelay={animationDelay}
                  isMobile={isMobile}
                  isLandscape={isLandscape}
                  itemRef={el => {
                    itemRefs.current[i] = el
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
