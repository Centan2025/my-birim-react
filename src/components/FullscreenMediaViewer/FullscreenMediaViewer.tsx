import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {FullscreenMediaViewerProps} from './types'
import {FullscreenMediaItem} from './FullscreenMediaItem'
import {FullscreenControls} from './FullscreenControls'

export const FullscreenMediaViewer: React.FC<FullscreenMediaViewerProps> = ({
  items,
  initialIndex = 0,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isButtonVisible, setIsButtonVisible] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [visibleIndices, setVisibleIndices] = useState<number[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const closingVisibleIndicesRef = useRef<number[]>([])

  const slideCount = items?.length ?? 0
  const hasItems = slideCount > 0
  const isLooping = slideCount > 1

  // Cloned Track for continuous infinite smooth scrolling
  const displayItems = useMemo(() => {
    if (!items || items.length <= 1) return items || []
    const first = items[0]!
    const last = items[items.length - 1]!
    return [last, ...items, first]
  }, [items])

  const displayCount = displayItems.length
  const currentDisplayIndexRef = useRef(isLooping ? initialIndex + 1 : initialIndex)
  const isJumpingRef = useRef(false)
  const lastWheelTime = useRef(0)

  // Mouse drag için state'ler (desktop için)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartScrollLeft = useRef(0)

  // Mobilde yukarı git butonu için state
  const [showScrollToTop, setShowScrollToTop] = useState(false)

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

    const timer3 = setTimeout(() => {
      setHasEntered(true)
    }, 600)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  // Kapanış animasyonu
  const handleClose = () => {
    const currentVisible: number[] = []
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
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

    window.scrollTo({top: 0, behavior: 'auto'})
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

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    if (scrollLeft < -30) {
      scrollToDisplayIndex(0)
    } else if (scrollLeft > maxScrollLeft + 30) {
      scrollToDisplayIndex(displayCount - 1)
    } else {
      scrollToDisplayIndex(nearestIndex)
    }

    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.scrollSnapType = 'x mandatory'
      }
    }, 300)
  }

  // Navigation & Scroll Handlers

  const scrollToDisplayIndex = useCallback((index: number, smooth: boolean = true) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const targetEl = itemRefs.current[index]
    if (targetEl) {
      container.scrollTo({
        left: targetEl.offsetLeft,
        behavior: smooth ? 'smooth' : 'auto',
      })
      currentDisplayIndexRef.current = index
    }
  }, [])

  const handleScrollLeft = useCallback(() => {
    if (!isLooping) return
    const nextDisplayIdx = currentDisplayIndexRef.current - 1
    scrollToDisplayIndex(nextDisplayIdx, true)
  }, [isLooping, scrollToDisplayIndex])

  const handleScrollRight = useCallback(() => {
    if (!isLooping) return
    const nextDisplayIdx = currentDisplayIndexRef.current + 1
    scrollToDisplayIndex(nextDisplayIdx, true)
  }, [isLooping, scrollToDisplayIndex])

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY || e.deltaX
    const now = Date.now()

    if (Math.abs(delta) > 10 && now - lastWheelTime.current > 300) {
      lastWheelTime.current = now
      if (delta > 0) {
        handleScrollRight()
      } else {
        handleScrollLeft()
      }
    }
  }

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll effects & silent boundary wrapping
  useEffect(() => {
    if (!scrollContainerRef.current || typeof window === 'undefined') return

    const updateVisibleIndices = () => {
      if (!scrollContainerRef.current) return
      const container = scrollContainerRef.current
      const containerLeft = container.scrollLeft
      const containerRight = containerLeft + container.clientWidth
      setShowScrollToTop(false)

      const visible: number[] = []
      let centerItemIndex = 0
      let minDistanceToCenter = Infinity
      const containerCenter = containerLeft + container.clientWidth / 2

      itemRefs.current.forEach((ref, index) => {
        if (!ref) return
        const itemCenter = ref.offsetLeft + ref.offsetWidth / 2
        const distance = Math.abs(containerCenter - itemCenter)
        if (distance < minDistanceToCenter) {
          minDistanceToCenter = distance
          centerItemIndex = index
        }
        if (ref.offsetLeft + ref.offsetWidth > containerLeft && ref.offsetLeft < containerRight) {
          visible.push(index)
        }
      })
      setVisibleIndices(visible)
      currentDisplayIndexRef.current = centerItemIndex

      // Smooth debounced boundary jump without flickering or snapping conflicts
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (!scrollContainerRef.current || !isLooping || isJumpingRef.current) return
        const c = scrollContainerRef.current
        const currIdx = currentDisplayIndexRef.current

        if (currIdx >= displayCount - 1) {
          const realFirstEl = itemRefs.current[1]
          if (realFirstEl) {
            isJumpingRef.current = true
            c.style.scrollSnapType = 'none'
            c.scrollLeft = realFirstEl.offsetLeft
            currentDisplayIndexRef.current = 1
            requestAnimationFrame(() => {
              setTimeout(() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.style.scrollSnapType = 'x mandatory'
                }
                isJumpingRef.current = false
              }, 50)
            })
          }
        } else if (currIdx <= 0) {
          const realLastEl = itemRefs.current[slideCount]
          if (realLastEl) {
            isJumpingRef.current = true
            c.style.scrollSnapType = 'none'
            c.scrollLeft = realLastEl.offsetLeft
            currentDisplayIndexRef.current = slideCount
            requestAnimationFrame(() => {
              setTimeout(() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.style.scrollSnapType = 'x mandatory'
                }
                isJumpingRef.current = false
              }, 50)
            })
          }
        }
      }, 100)
    }

    const container = scrollContainerRef.current
    container.addEventListener('scroll', updateVisibleIndices)
    window.addEventListener('resize', updateVisibleIndices)
    return () => {
      container.removeEventListener('scroll', updateVisibleIndices)
      window.removeEventListener('resize', updateVisibleIndices)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [displayCount, slideCount, isLooping])

  // Keydown listener for arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleScrollRight()
      } else if (e.key === 'ArrowLeft') {
        handleScrollLeft()
      } else if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleScrollRight, handleScrollLeft, handleClose])

  // Initial scroll positioning
  useEffect(() => {
    if (initialIndex >= 0 && scrollContainerRef.current) {
      const targetIdx = isLooping ? initialIndex + 1 : initialIndex
      setTimeout(() => scrollToDisplayIndex(targetIdx, false), 80)
    }
  }, [initialIndex, isLooping, scrollToDisplayIndex])

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({top: 0, behavior: 'smooth'})
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
        style={{height: '100dvh', overflow: 'hidden'}}
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
            className={`w-full overflow-x-auto overflow-y-hidden flex flex-row items-center ${
              displayCount === 1 ? 'justify-center' : 'justify-start'
            } px-0 select-none`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              height: '100dvh',
              paddingTop: '0',
              paddingBottom: '0',
              gap: '0',
              cursor: isDragging && !isMobile ? 'grabbing' : !isMobile ? 'grab' : 'default',
              overflowY: 'hidden',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <style>{`div::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; } * { scrollbar-width: none !important; -ms-overflow-style: none !important; }`}</style>
            {displayItems.map((item, i) => {
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
                    : displayCount - 1 - i
                animationDelay = reverseIndex * 60
              } else if (!hasEntered) {
                animationDelay = isVisible ? i * 80 : 0
              } else {
                animationDelay = 0
              }

              return (
                <FullscreenMediaItem
                  key={`fs-item-${i}-${item.url || ''}`}
                  item={item}
                  index={i}
                  isVisible={isVisible}
                  isClosing={isClosing}
                  hasEntered={hasEntered}
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
