import React, {useRef, useEffect, useState} from 'react'
import {OptimizedImage} from './OptimizedImage'

interface ParallaxImageProps {
  src: string
  alt: string
  className?: string // Classes for the wrapper
  imgClassName?: string // Classes for the img element
  height?: string // CSS height value (e.g., '100%', '400px')
  speed?: number // Movement speed, lower is subtle
  srcMobile?: string
  srcDesktop?: string
  loading?: 'lazy' | 'eager'
  quality?: number
}

const ParallaxImage: React.FC<ParallaxImageProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  height = '100%',
  speed = 0.08, // Reduced from 0.15 to 0.08 for very subtle effect
  srcMobile,
  srcDesktop,
  loading = 'lazy',
  quality = 85,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let animationFrameId: number

    const handleScroll = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Check if element is in view (with a buffer)
      if (rect.top < windowHeight && rect.bottom > 0) {
        const elementCenter = rect.top + rect.height / 2
        const viewportCenter = windowHeight / 2
        const distanceFromCenter = elementCenter - viewportCenter

        // Calculate translation - ters yönde hareket (scroll yukarı → görsel aşağı, scroll aşağı → görsel yukarı)
        setOffset(distanceFromCenter * speed)
      } else {
        // Element viewport dışındaysa offset'i sıfırla
        setOffset(0)
      }
    }

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', onScroll)
    // Initial calculation
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [speed])

  // Parallax efekti: container sabit, içindeki görsel hareket eder
  const useFixedHeight = height && height !== 'auto'

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={useFixedHeight ? {height} : undefined}
    >
      <div
        className="relative w-full transition-transform duration-75 ease-linear will-change-transform"
        style={{
          transform: `translateY(${offset}px)`,
        }}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          srcMobile={srcMobile}
          srcDesktop={srcDesktop}
          className={`w-full h-auto ${imgClassName}`}
          loading={loading}
          quality={quality}
        />
      </div>
    </div>
  )
}

export default ParallaxImage

