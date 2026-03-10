import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCardTransition } from '../context/CardTransitionContext'
import { useSiteSettings } from '../context/SiteSettingsContext'

interface PageTransitionProps {
  children: React.ReactNode
}

/**
 * Returns a push direction based on the current route.
 */
function getDirection(pathname: string): 'left' | 'right' | 'up' | 'down' {
  if (pathname === '/') return 'up'
  if (pathname.startsWith('/product/')) return 'right'
  if (pathname.startsWith('/products')) return 'right'
  if (pathname.startsWith('/categories')) return 'right'
  if (pathname.startsWith('/designer/')) return 'right'
  if (pathname.startsWith('/designers')) return 'right'
  if (pathname.startsWith('/news/')) return 'right'
  if (pathname.startsWith('/news')) return 'down'
  if (pathname.startsWith('/project')) return 'left'
  if (pathname.startsWith('/about')) return 'down'
  if (pathname.startsWith('/contact')) return 'down'
  if (pathname.startsWith('/login')) return 'up'
  if (pathname.startsWith('/profile')) return 'up'
  return 'right'
}

function getEnterFrom(dir: 'left' | 'right' | 'up' | 'down') {
  switch (dir) {
    case 'left':
      return { x: '-100%', y: 0 }
    case 'right':
      return { x: '100%', y: 0 }
    case 'up':
      return { x: 0, y: '-100%' }
    case 'down':
      return { x: 0, y: '100%' }
  }
}

function getExitTo(dir: 'left' | 'right' | 'up' | 'down') {
  switch (dir) {
    case 'left':
      return { x: '100%', y: 0 }
    case 'right':
      return { x: '-100%', y: 0 }
    case 'up':
      return { x: 0, y: '100%' }
    case 'down':
      return { x: 0, y: '-100%' }
  }
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation()
  const { isExpanding } = useCardTransition()

  // CMS'den gelen animasyon ayarını al
  const { settings, isLoading } = useSiteSettings()
  const enableTransitions = settings?.enablePageTransitions ?? true

  const direction = getDirection(location.pathname)
  const enterFrom = getEnterFrom(direction)
  const exitTo = getExitTo(direction)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  const isCardEntry = isExpanding || location.state?.fromCard

  // Animasyonları devreye sokacak mıyız?
  // Eğer özel kart animasyonu ise her zaman çalışır
  // Aksi halde settings yüklenmişse ve aktifse çalışır
  const shouldAnimate = isCardEntry || (!isLoading && enableTransitions)

  return (
    <motion.div
      initial={
        isCardEntry
          ? { opacity: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }
          : !shouldAnimate
            ? { opacity: 1, x: 0, y: 0, position: 'relative', zIndex: 10 }
            : { ...enterFrom, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }
      }
      animate={{
        x: 0,
        y: 0,
        opacity: 1,
        position: 'relative',
        zIndex: 1,
        transition: isCardEntry
          ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          : {
            duration: shouldAnimate ? 1.6 : 0,
            ease: [0.12, 0.8, 0.2, 1],
          },
      }}
      exit={
        isCardEntry
          ? {
            opacity: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
          }
          : !shouldAnimate
            ? {
              opacity: 0,
              transition: { duration: 0 },
            }
            : {
              ...exitTo,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              transition: {
                duration: 1.6,
                ease: [0.12, 0.8, 0.2, 1],
              },
            }
      }
      className="w-full min-h-screen bg-[var(--bg-primary)]"
    >
      {children}
    </motion.div>
  )
}
