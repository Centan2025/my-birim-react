import React, {useRef, useEffect, useState} from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number // delay in ms
  threshold?: number // 0 to 1
  className?: string
  width?: string
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  threshold = 0.15,
  className = '',
  width = 'w-full',
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return

    // İlk render'da görünür alandaysa hemen göster (animasyon olmadan)
    const checkInitialVisibility = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight + 100 && rect.bottom > -100
      
      if (isInViewport) {
        setIsVisible(true)
        return true
      }
      return false
    }

    // İlk kontrolü hemen yap
    if (checkInitialVisibility()) {
      return
    }

    // Görünür alanda değilse IntersectionObserver ile izle
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // Only animate once
        }
      },
      {
        threshold,
        rootMargin: '150px' // Daha erken tetikle - 150px önceden
      }
    )

    observer.observe(ref.current)

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
      observer.disconnect()
    }
  }, [threshold])

  const style = {
    transitionDelay: `${delay}ms`,
  }

  return (
    <div
      ref={ref}
      style={style}
      className={`${width} h-full transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default ScrollReveal

