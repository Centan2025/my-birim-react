import React, { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  threshold?: number
  className?: string
  width?: string
  direction?: 'up' | 'left'
  distance?: number
  duration?: number
  initialScale?: number
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  threshold = 0.1,
  className = '',
  width = 'w-full',
  direction = 'up',
  distance = 30,
  duration = 0.25,
  initialScale = 1,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Delay ile animasyonu başlat
            setTimeout(() => {
              setIsVisible(true)
            }, delay)
            // Bir kez görünür olduktan sonra observer'ı kaldır
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold,
        rootMargin: threshold === 0 ? '0px 0px 100px 0px' : '0px 0px -50px 0px', // Footer elementleri için daha erken tetiklenir
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [delay, threshold])

  const translateDirection = direction === 'left' ? `translateX(-${distance}px)` : `translateY(${distance}px)`

  return (
    <div
      ref={elementRef}
      className={`${width} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0) scale(1)' : `${translateDirection} scale(${initialScale})`,
        transition: `opacity ${duration}s ease-out ${delay}ms, transform ${duration}s ease-out ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

export default ScrollReveal
