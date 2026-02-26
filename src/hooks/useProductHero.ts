import {useState, useRef, useEffect, useCallback} from 'react'

export function useProductHero(slideCount: number) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(1)
  const [heroTransitionEnabled, setHeroTransitionEnabled] = useState(true)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState<number>(0)
  const [draggedX, setDraggedX] = useState<number>(0)
  const dragStartY = useRef<number>(0)

  const DRAG_THRESHOLD = 50
  const totalHeroSlides = slideCount > 1 ? slideCount + 2 : slideCount

  // Reset indices when slide count changes
  useEffect(() => {
    if (slideCount > 0) {
      setCurrentImageIndex(0)
      setHeroSlideIndex(slideCount > 1 ? 1 : 0)
    }
  }, [slideCount])

  // Transition recovery
  useEffect(() => {
    if (!heroTransitionEnabled) {
      const id = requestAnimationFrame(() => setHeroTransitionEnabled(true))
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [heroTransitionEnabled])

  const heroNext = useCallback(() => {
    if (slideCount <= 1 || !heroTransitionEnabled) return
    setHeroSlideIndex(prev => prev + 1)
    setCurrentImageIndex(prev => (prev + 1) % slideCount)
  }, [slideCount, heroTransitionEnabled])

  const heroPrev = useCallback(() => {
    if (slideCount <= 1 || !heroTransitionEnabled) return
    setHeroSlideIndex(prev => prev - 1)
    setCurrentImageIndex(prev => (prev - 1 + slideCount) % slideCount)
  }, [slideCount, heroTransitionEnabled])

  const handleHeroTransitionEnd = useCallback(() => {
    if (slideCount <= 1 || !heroTransitionEnabled) return
    if (heroSlideIndex === totalHeroSlides - 1) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(1)
    } else if (heroSlideIndex === 0) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(totalHeroSlides - 2)
    }
  }, [slideCount, heroTransitionEnabled, heroSlideIndex, totalHeroSlides])

  const handleHeroDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button')) return
      const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX
      const y = 'touches' in e ? e.touches[0]?.clientY : e.clientY

      if (x === undefined || y === undefined) return

      setIsDragging(true)
      setDragStartX(x)
      dragStartY.current = y
      setDraggedX(0)
    },
    []
  )

  const handleHeroDragMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return
      const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX
      const y = 'touches' in e ? e.touches[0]?.clientY : e.clientY

      if (x === undefined || y === undefined) return

      const deltaX = Math.abs(x - dragStartX)
      const deltaY = Math.abs(y - dragStartY.current)
      if (deltaY > deltaX && deltaY > 10) {
        setIsDragging(false)
        return
      }
      setDraggedX(x - dragStartX)
    },
    [isDragging, dragStartX]
  )

  const handleHeroDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    if (draggedX < -DRAG_THRESHOLD) heroNext()
    else if (draggedX > DRAG_THRESHOLD) heroPrev()
    setDraggedX(0)
  }, [isDragging, draggedX, heroNext, heroPrev])

  return {
    currentImageIndex,
    setCurrentImageIndex,
    heroSlideIndex,
    setHeroSlideIndex,
    heroTransitionEnabled,
    setHeroTransitionEnabled,
    draggedX,
    totalHeroSlides,
    heroNext,
    heroPrev,
    handleHeroTransitionEnd,
    handleHeroDragStart,
    handleHeroDragMove,
    handleHeroDragEnd,
  }
}
