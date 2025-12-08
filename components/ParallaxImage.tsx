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
  speed = 0.1, // Subtle parallax effect
  srcMobile,
  srcDesktop,
  loading = 'lazy',
  quality = 85,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  // Sabit scale değeri - parallax sırasında boşlukların oluşmaması için
  const scale = 1.2

  // Mobil kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Desktop breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let animationFrameId: number
    // Mobilde daha düşük speed kullan
    const effectiveSpeed = isMobile ? speed * 0.3 : speed

    const handleScroll = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Element viewport içinde mi?
      if (rect.top < windowHeight && rect.bottom > 0) {
        // Parallax hesaplama: Element'in viewport'a göre konumu
        // Element yukarı kaydıkça (rect.top azalır), görseli daha yavaş kaydır
        // Bu parallax efektini oluşturur
        
        // Element'in viewport'un üstünden ne kadar uzakta olduğunu hesapla
        const distanceFromTop = rect.top
        
        // Parallax offset: distanceFromTop'a göre görseli hareket ettir
        // Element yukarı kaydıkça görsel daha yavaş kayar (parallax efekti)
        const parallaxOffset = (windowHeight - distanceFromTop) * effectiveSpeed * 0.5
        
        setOffset(parallaxOffset)
      } else {
        setOffset(0)
      }
    }

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', onScroll, {passive: true})
    // İlk hesaplama
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [speed, isMobile])

  // Parallax efekti: container overflow-hidden olmalı
  // Görselin transform ile hareket etmesi için container'dan daha büyük olması gerekir
  // Scale ile görseli büyüterek boşlukları önlüyoruz
  
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="relative w-full will-change-transform"
        style={{
          transform: `translateY(${offset}px) scale(${scale})`,
          transition: 'none',
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
