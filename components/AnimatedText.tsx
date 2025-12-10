import React, {useRef, useEffect, useState} from 'react'

interface AnimatedTextProps {
  text: string
  delay?: number // Her harf arasındaki delay (ms)
  threshold?: number // IntersectionObserver threshold
  className?: string
  direction?: 'left' | 'up' // Animasyon yönü
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 50,
  threshold = 0.1,
  className = '',
  direction = 'left',
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

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
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin: '150px',
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

  // Metni harflere ve boşluklara ayır
  const characters = text.split('')
  const totalLength = characters.length

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {characters.map((char, index) => {
        const isSpace = char === ' '
        // En sağdaki harf önce gelsin (son index delay 0), diğerleri peş peşe
        const charDelay = isVisible ? (totalLength - 1 - index) * delay : 0

        const transformClasses =
          direction === 'left'
            ? isVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-40'
            : isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-32'

        return (
          <span
            key={index}
            style={{
              transitionDelay: `${charDelay}ms`,
              display: isSpace ? 'inline' : 'inline-block',
            }}
            className={`transition-all duration-900 ease-out ${transformClasses}`}
          >
            {isSpace ? '\u00A0' : char}
          </span>
        )
      })}
    </span>
  )
}

export default AnimatedText

