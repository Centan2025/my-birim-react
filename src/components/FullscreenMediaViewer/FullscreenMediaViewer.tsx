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

  // Mouse drag için ref ve state'ler (desktop için)
  const isDraggingRef = useRef(false)
  const [isDraggingState, setIsDraggingState] = useState(false)
  const dragStartX = useRef(0)
  const currentMouseXRef = useRef(0)
  const dragStartScrollLeft = useRef(0)
  const dragStartDisplayIndex = useRef(initialIndex)
  const rafIdRef = useRef<number | null>(null)
  const targetScrollLeftRef = useRef(0)
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Silent instant boundary wrap function for true continuous infinite looping
  const checkBoundaryWrap = useCallback(() => {
    if (!scrollContainerRef.current || !isLooping || isDraggingRef.current || isJumpingRef.current)
      return
    const container = scrollContainerRef.current
    const curr = currentDisplayIndexRef.current

    if (curr >= displayCount - 1) {
      const clonedFirstEl = itemRefs.current[displayCount - 1]
      const realFirstEl = itemRefs.current[1]
      if (clonedFirstEl && realFirstEl) {
        // Only swap if scroll is at or very near cloned element
        const distToCloned = Math.abs(container.scrollLeft - clonedFirstEl.offsetLeft)
        if (distToCloned < 100) {
          isJumpingRef.current = true
          if (!isMobile) container.style.scrollSnapType = 'none'
          container.style.scrollBehavior = 'auto'
          container.scrollLeft = realFirstEl.offsetLeft
          currentDisplayIndexRef.current = 1
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.style.scrollBehavior = 'smooth'
            }
            isJumpingRef.current = false
          })
        }
      }
    } else if (curr <= 0) {
      const clonedLastEl = itemRefs.current[0]
      const realLastEl = itemRefs.current[slideCount]
      if (clonedLastEl && realLastEl) {
        const distToCloned = Math.abs(container.scrollLeft - clonedLastEl.offsetLeft)
        if (distToCloned < 100) {
          isJumpingRef.current = true
          if (!isMobile) container.style.scrollSnapType = 'none'
          container.style.scrollBehavior = 'auto'
          container.scrollLeft = realLastEl.offsetLeft
          currentDisplayIndexRef.current = slideCount
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.style.scrollBehavior = 'smooth'
            }
            isJumpingRef.current = false
          })
        }
      }
    }
  }, [displayCount, slideCount, isLooping, isMobile])

  // Navigation & Scroll Handlers
  const scrollToDisplayIndex = useCallback(
    (index: number, smooth: boolean = true) => {
      if (!scrollContainerRef.current) return
      const container = scrollContainerRef.current
      const targetEl = itemRefs.current[index]
      if (targetEl) {
        if (smooth) {
          if (!isMobile) container.style.scrollSnapType = 'none'
          if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current)
          snapTimeoutRef.current = setTimeout(() => {
            if (scrollContainerRef.current && !isDraggingRef.current && !isMobile) {
              scrollContainerRef.current.style.scrollSnapType = 'x mandatory'
            }
            checkBoundaryWrap()
          }, 350)
        }

        container.scrollTo({
          left: targetEl.offsetLeft,
          behavior: smooth ? 'smooth' : 'auto',
        })
        currentDisplayIndexRef.current = index
      }
    },
    [isMobile, checkBoundaryWrap]
  )

  // Drag Handlers (Desktop Mouse Drag via Window Event Listeners for zero stutter)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || !scrollContainerRef.current) return
    if (e.button !== 0) return
    e.preventDefault()

    const container = scrollContainerRef.current
    let curr = currentDisplayIndexRef.current

    if (isLooping) {
      if (curr >= displayCount - 1) {
        const realFirstEl = itemRefs.current[1]
        if (realFirstEl) {
          container.style.scrollSnapType = 'none'
          container.style.scrollBehavior = 'auto'
          container.scrollLeft = realFirstEl.offsetLeft
          curr = 1
          currentDisplayIndexRef.current = 1
        }
      } else if (curr <= 0) {
        const realLastEl = itemRefs.current[slideCount]
        if (realLastEl) {
          container.style.scrollSnapType = 'none'
          container.style.scrollBehavior = 'auto'
          container.scrollLeft = realLastEl.offsetLeft
          curr = slideCount
          currentDisplayIndexRef.current = slideCount
        }
      }
    }

    isDraggingRef.current = true
    setIsDraggingState(true)
    dragStartX.current = e.clientX
    currentMouseXRef.current = e.clientX
    dragStartScrollLeft.current = container.scrollLeft
    dragStartDisplayIndex.current = currentDisplayIndexRef.current
    targetScrollLeftRef.current = dragStartScrollLeft.current

    container.style.cursor = 'grabbing'
    container.style.scrollSnapType = 'none'
  }

  useEffect(() => {
    if (isMobile) return

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollContainerRef.current) return

      const x = e.clientX
      currentMouseXRef.current = x
      const walk = (dragStartX.current - x) * 1.8
      targetScrollLeftRef.current = dragStartScrollLeft.current + walk

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = targetScrollLeftRef.current
          }
          rafIdRef.current = null
        })
      }
    }

    const handleWindowMouseUp = () => {
      if (!isDraggingRef.current || !scrollContainerRef.current) return
      isDraggingRef.current = false
      setIsDraggingState(false)

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      const container = scrollContainerRef.current
      container.style.cursor = 'grab'

      const deltaX = dragStartX.current - currentMouseXRef.current
      const threshold = Math.min(80, window.innerWidth * 0.08)

      let targetIdx = dragStartDisplayIndex.current
      if (deltaX > threshold) {
        // Dragged left -> Next image
        targetIdx = dragStartDisplayIndex.current + 1
      } else if (deltaX < -threshold) {
        // Dragged right -> Previous image
        targetIdx = dragStartDisplayIndex.current - 1
      } else {
        // Find nearest item if drag was tiny or slow
        const currentScroll = container.scrollLeft
        let nearestIndex = currentDisplayIndexRef.current
        let minDistance = Infinity

        itemRefs.current.forEach((ref, index) => {
          if (!ref) return
          const itemLeft = ref.offsetLeft
          const distance = Math.abs(currentScroll - itemLeft)
          if (distance < minDistance) {
            minDistance = distance
            nearestIndex = index
          }
        })
        targetIdx = nearestIndex
      }

      if (!isLooping) {
        targetIdx = Math.max(0, Math.min(displayCount - 1, targetIdx))
      }
      scrollToDisplayIndex(targetIdx, true)
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isMobile, isLooping, displayCount, scrollToDisplayIndex])

  const handleScrollLeft = useCallback(() => {
    if (!isLooping || !scrollContainerRef.current) return
    const container = scrollContainerRef.current
    let curr = currentDisplayIndexRef.current

    if (curr <= 0 && Math.abs(container.scrollLeft - itemRefs.current[0]!.offsetLeft) < 50) {
      const realLastEl = itemRefs.current[slideCount]
      if (realLastEl) {
        if (!isMobile) container.style.scrollSnapType = 'none'
        container.style.scrollBehavior = 'auto'
        container.scrollLeft = realLastEl.offsetLeft
        curr = slideCount
        currentDisplayIndexRef.current = slideCount
      }
    }

    const nextDisplayIdx = curr - 1
    scrollToDisplayIndex(nextDisplayIdx, true)
  }, [isLooping, slideCount, isMobile, scrollToDisplayIndex])

  const handleScrollRight = useCallback(() => {
    if (!isLooping || !scrollContainerRef.current) return
    const container = scrollContainerRef.current
    let curr = currentDisplayIndexRef.current

    if (
      curr >= displayCount - 1 &&
      Math.abs(container.scrollLeft - itemRefs.current[displayCount - 1]!.offsetLeft) < 50
    ) {
      const realFirstEl = itemRefs.current[1]
      if (realFirstEl) {
        if (!isMobile) container.style.scrollSnapType = 'none'
        container.style.scrollBehavior = 'auto'
        container.scrollLeft = realFirstEl.offsetLeft
        curr = 1
        currentDisplayIndexRef.current = 1
      }
    }

    const nextDisplayIdx = curr + 1
    scrollToDisplayIndex(nextDisplayIdx, true)
  }, [isLooping, displayCount, isMobile, scrollToDisplayIndex])

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
      let centerItemIndex = currentDisplayIndexRef.current
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

      currentDisplayIndexRef.current = centerItemIndex

      // Prevent redundant state updates during scrolling to avoid React re-render lags
      setVisibleIndices(prev => {
        if (prev.length === visible.length && prev.every((val, i) => val === visible[i])) {
          return prev
        }
        return visible
      })

      // Skip boundary wrapping while user is dragging
      if (isDraggingRef.current) return

      // Smooth debounced boundary jump without flickering or snapping conflicts
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        checkBoundaryWrap()
      }, 150)
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
        backgroundColor: '#ffffff',
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
              cursor: isDraggingState && !isMobile ? 'grabbing' : !isMobile ? 'grab' : 'default',
              overflowY: 'hidden',
              overflowX: 'auto',
              scrollSnapType: isMobile ? 'x mandatory' : isDraggingState ? 'none' : 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
            onMouseDown={handleMouseDown}
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
