import {useState, useRef, useEffect, useCallback} from 'react'

export function useProductHero(slideCount: number) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(1)
  const heroSlideIndexRef = useRef<number>(1)
  const [heroTransitionEnabled, setHeroTransitionEnabled] = useState(true)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState<number>(0)
  const [draggedX, setDraggedX] = useState<number>(0)
  const dragStartY = useRef<number>(0)

  const DRAG_THRESHOLD = 50
  const totalHeroSlides = slideCount > 1 ? slideCount + 2 : slideCount

  const updateSlideIndex = useCallback((newVal: number) => {
    heroSlideIndexRef.current = newVal
    setHeroSlideIndex(newVal)
  }, [])

  // Reset indices when slide count changes
  useEffect(() => {
    if (slideCount > 0) {
      setHeroTransitionEnabled(false) // Disable transition to snap instantly
      setCurrentImageIndex(0)
      updateSlideIndex(slideCount > 1 ? 1 : 0)
    }
  }, [slideCount, updateSlideIndex])

  // Transition recovery
  useEffect(() => {
    if (!heroTransitionEnabled) {
      let id2: number
      const id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => {
          setHeroTransitionEnabled(true)
        })
      })
      return () => {
        cancelAnimationFrame(id1)
        if (id2) cancelAnimationFrame(id2)
      }
    }
    return undefined
  }, [heroTransitionEnabled])

  // Fallback timer to guarantee boundary reset if onTransitionEnd event is missed or cancelled
  useEffect(() => {
    if (slideCount <= 1) return undefined
    if (heroSlideIndex === totalHeroSlides - 1) {
      const timer = setTimeout(() => {
        if (heroSlideIndexRef.current === totalHeroSlides - 1) {
          setHeroTransitionEnabled(false)
          updateSlideIndex(1)
        }
      }, 1050)
      return () => clearTimeout(timer)
    }
    if (heroSlideIndex === 0) {
      const timer = setTimeout(() => {
        if (heroSlideIndexRef.current === 0) {
          setHeroTransitionEnabled(false)
          updateSlideIndex(totalHeroSlides - 2)
        }
      }, 1050)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [heroSlideIndex, slideCount, totalHeroSlides, updateSlideIndex])

  const heroNext = useCallback(() => {
    if (slideCount <= 1) return

    setHeroTransitionEnabled(true)

    if (heroSlideIndexRef.current >= totalHeroSlides - 1) {
      setHeroTransitionEnabled(false)
      updateSlideIndex(1)
      setCurrentImageIndex(1 % slideCount)
      requestAnimationFrame(() => {
        setHeroTransitionEnabled(true)
        updateSlideIndex(2)
      })
      return
    }

    if (heroSlideIndexRef.current <= 0) {
      setHeroTransitionEnabled(false)
      updateSlideIndex(totalHeroSlides - 2)
    }

    updateSlideIndex(heroSlideIndexRef.current + 1)
    setCurrentImageIndex(prev => (prev + 1) % slideCount)
  }, [slideCount, totalHeroSlides, updateSlideIndex])

  const heroPrev = useCallback(() => {
    if (slideCount <= 1) return

    setHeroTransitionEnabled(true)

    if (heroSlideIndexRef.current <= 0) {
      setHeroTransitionEnabled(false)
      updateSlideIndex(totalHeroSlides - 2)
      setCurrentImageIndex((slideCount - 2 + slideCount) % slideCount)
      requestAnimationFrame(() => {
        setHeroTransitionEnabled(true)
        updateSlideIndex(totalHeroSlides - 3)
      })
      return
    }

    if (heroSlideIndexRef.current >= totalHeroSlides - 1) {
      setHeroTransitionEnabled(false)
      updateSlideIndex(1)
    }

    updateSlideIndex(heroSlideIndexRef.current - 1)
    setCurrentImageIndex(prev => (prev - 1 + slideCount) % slideCount)
  }, [slideCount, totalHeroSlides, updateSlideIndex])

  const handleHeroTransitionEnd = useCallback(() => {
    if (slideCount <= 1) return
    if (heroSlideIndexRef.current === totalHeroSlides - 1) {
      setHeroTransitionEnabled(false)
      updateSlideIndex(1)
    } else if (heroSlideIndexRef.current === 0) {
      setHeroTransitionEnabled(false)
      updateSlideIndex(totalHeroSlides - 2)
    }
  }, [slideCount, totalHeroSlides, updateSlideIndex])

  const handleHeroDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button')) return

      if (slideCount > 1) {
        if (heroSlideIndexRef.current === totalHeroSlides - 1) {
          setHeroTransitionEnabled(false)
          updateSlideIndex(1)
        } else if (heroSlideIndexRef.current === 0) {
          setHeroTransitionEnabled(false)
          updateSlideIndex(totalHeroSlides - 2)
        }
      }

      const x =
        'touches' in e && e.touches && e.touches.length > 0
          ? e.touches[0]?.clientX
          : 'clientX' in e
            ? e.clientX
            : undefined
      const y =
        'touches' in e && e.touches && e.touches.length > 0
          ? e.touches[0]?.clientY
          : 'clientY' in e
            ? e.clientY
            : undefined

      if (x === undefined || y === undefined) return

      setIsDragging(true)
      setDragStartX(x)
      dragStartY.current = y
      setDraggedX(0)

      if (!('touches' in e)) {
        e.preventDefault()
      }
    },
    [slideCount, totalHeroSlides, updateSlideIndex]
  )

  const VERTICAL_SCROLL_TOLERANCE = 2.5
  const MIN_VERTICAL_DELTA = 15

  const handleHeroDragMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return
      const x =
        'touches' in e && e.touches && e.touches.length > 0
          ? e.touches[0]?.clientX
          : 'clientX' in e
            ? e.clientX
            : undefined
      const y =
        'touches' in e && e.touches && e.touches.length > 0
          ? e.touches[0]?.clientY
          : 'clientY' in e
            ? e.clientY
            : undefined

      if (x === undefined || y === undefined) return

      const deltaX = Math.abs(x - dragStartX)
      const deltaY = Math.abs(y - dragStartY.current)

      // Dikey scroll yapılıyorsa (sayfa aşağı kaydırılıyorsa) yatay sürüklemeyi iptal et
      if (deltaY > deltaX * VERTICAL_SCROLL_TOLERANCE && deltaY > MIN_VERTICAL_DELTA) {
        setIsDragging(false)
        setDraggedX(0)
        return
      }

      // Yatay swipe: parmağı takip et
      setDraggedX(x - dragStartX)

      if (!('touches' in e)) {
        e.preventDefault()
      }
    },
    [isDragging, dragStartX]
  )

  const handleHeroDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    if (draggedX < -DRAG_THRESHOLD) {
      heroNext()
    } else if (draggedX > DRAG_THRESHOLD) {
      heroPrev()
    }
    setDraggedX(0)
  }, [isDragging, draggedX, heroNext, heroPrev])

  return {
    currentImageIndex,
    setCurrentImageIndex,
    heroSlideIndex,
    setHeroSlideIndex: updateSlideIndex,
    heroTransitionEnabled,
    setHeroTransitionEnabled,
    draggedX,
    isDragging,
    totalHeroSlides,
    heroNext,
    heroPrev,
    handleHeroTransitionEnd,
    handleHeroDragStart,
    handleHeroDragMove,
    handleHeroDragEnd,
  }
}
