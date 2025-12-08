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
  speed = 0.1, // Slightly increased for better visibility
  srcMobile,
  srcDesktop,
  loading = 'lazy',
  quality = 85,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Mobil kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Mobilde parallax efektini devre dışı bırak (performans ve UX için)
    if (isMobile) {
      setOffset(0)
      return
    }

    let animationFrameId: number

    const handleScroll = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Element viewport içinde mi?
      // (buffer ekleyerek smooth geçişi garantiliyoruz)
      if (rect.top < windowHeight && rect.bottom > 0) {
        // Elementin viewport'a göre konumu (-1 ile 1 arası normalize edilebilir)
        // Ancak basit bir piksel offset daha doğal duruyor
        const distanceFromCenter = (rect.top + rect.height / 2) - (windowHeight / 2)
        
        // Parallax hesaplama: 
        // Element yukarı kaydıkça (distanceFromCenter azalır/negatif olur),
        // görseli aşağı kaydır (offset artar/pozitif olur) => ters yön hareketi
        // speed faktörü ile çarpıyoruz.
        setOffset(distanceFromCenter * speed * -1) 
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
      style={height && height !== 'auto' ? {height} : undefined}
    >
      <div
        className="relative w-full h-full will-change-transform"
        style={{
          transform: isMobile ? 'none' : `translateY(${offset}px) scale(1.15)`,
          transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth transition
        }}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          srcMobile={srcMobile}
          srcDesktop={srcDesktop}
          className={`w-full h-full object-cover ${imgClassName}`} // h-full ve object-cover eklendi
          loading={loading}
          quality={quality}
        />
      </div>
    </div>
  )
}

export default ParallaxImage
