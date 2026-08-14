import React, {useState, useEffect} from 'react'
import {motion, AnimatePresence} from 'framer-motion'

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
        const shouldBeVisible = scrollY > 280
        if (shouldBeVisible !== lastVisible) {
          lastVisible = shouldBeVisible
          setIsVisible(shouldBeVisible)
        }
        ticking = false
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, {passive: true})

    // Lenis dinleyicisi ekle
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          key="back-to-top"
          type="button"
          onClick={scrollToTop}
          aria-label="Sayfanın en üstüne dön"
          initial={{opacity: 0, y: 48, scale: 0.5, filter: 'blur(4px)'}}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            transition: {
              type: 'spring',
              stiffness: 350,
              damping: 20,
              mass: 0.8,
            },
          }}
          exit={{
            opacity: 0,
            y: 36,
            scale: 0.6,
            filter: 'blur(4px)',
            transition: {
              duration: 0.25,
              ease: 'easeIn',
            },
          }}
          whileHover={{
            scale: 1.12,
            y: -4,
            transition: {duration: 0.2},
          }}
          whileTap={{scale: 0.9}}
          className="group fixed bottom-6 right-6 z-40 w-12 h-12 flex items-center justify-center rounded-none border border-white/80 bg-black/40 text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl hover:bg-black/80 hover:border-white transition-colors duration-300 cursor-pointer focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 transition-transform duration-300 group-hover:-translate-y-1.5"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
