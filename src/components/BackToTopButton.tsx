import React, {useState, useEffect} from 'react'

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let lastVisible = false
    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const scrollY =
          window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
        const shouldBeVisible = scrollY > 300
        if (shouldBeVisible !== lastVisible) {
          lastVisible = shouldBeVisible
          setIsVisible(shouldBeVisible)
        }
        ticking = false
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, {passive: true})

    // Lenis dinleyicisi ekle (Lenis window.scrollY dışındaki durumları tetiklerse)
    const win = window as unknown as {
      lenis?: {
        on: (event: string, callback: () => void) => void
        off: (event: string, callback: () => void) => void
      }
    }
    if (win.lenis && typeof win.lenis.on === 'function') {
      win.lenis.on('scroll', handleScroll)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (win.lenis && typeof win.lenis.off === 'function') {
        win.lenis.off('scroll', handleScroll)
      }
    }
  }, [])

  const scrollToTop = () => {
    const win = window as unknown as {
      lenis?: {scrollTo: (target: number | HTMLElement, opts?: {duration?: number}) => void}
    }
    if (win.lenis && typeof win.lenis.scrollTo === 'function') {
      win.lenis.scrollTo(0, {duration: 1.2})
    } else {
      try {
        window.scrollTo({top: 0, behavior: 'smooth'})
      } catch {
        window.scrollTo(0, 0)
      }
    }
  }

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Sayfanın en üstüne dön"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 flex items-center justify-center rounded-none border-[0.5px] border-white bg-white/10 text-white shadow-sm backdrop-blur-md mix-blend-difference hover:bg-white/20 transition-all duration-300 active:scale-95 cursor-pointer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-9 w-9"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  )
}
