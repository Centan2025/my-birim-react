import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCardTransition } from '../context/CardTransitionContext'

interface PageTransitionProps {
  children: React.ReactNode
}

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
    case 'left': return { x: '-100%', y: 0 }
    case 'right': return { x: '100%', y: 0 }
    case 'up': return { x: 0, y: '-100%' }
    case 'down': return { x: 0, y: '100%' }
  }
}

function getExitTo(dir: 'left' | 'right' | 'up' | 'down') {
  switch (dir) {
    case 'left': return { x: '100%', y: 0 }
    case 'right': return { x: '-100%', y: 0 }
    case 'up': return { x: 0, y: '100%' }
    case 'down': return { x: 0, y: '-100%' }
  }
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const currentLocation = useLocation()
  const { isExpanding } = useCardTransition()

  // Mount-time state sabitlenir — useLocation() güncel döndürür ama
  // bu component'in kendi animasyonu mount anındaki state'e göre belirlenir
  const mountStateRef = useRef({
    slideOver: (currentLocation.state as any)?.slideOver === true,
    fromCard: (currentLocation.state as any)?.fromCard === true,
    pathname: currentLocation.pathname,
  })

  const mySlideOver = mountStateRef.current.slideOver
  const myFromCard = mountStateRef.current.fromCard
  const myIsCardEntry = isExpanding || myFromCard

  const direction = getDirection(mountStateRef.current.pathname)
  const enterFrom = getEnterFrom(direction)
  const exitTo = getExitTo(direction)

  // slideOver giriş animasyonu tamamlandığında fixed→relative geçişi
  const [slideAnimDone, setSlideAnimDone] = useState(false)

  // Scroll-to-top
  useEffect(() => {
    const state = currentLocation.state as any
    // Üstümüze slideOver geliyorsa scroll'u KORU
    if (state?.slideOver && currentLocation.pathname !== mountStateRef.current.pathname) {
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [currentLocation.pathname, currentLocation.state])

  // ── slideOver giriş: sağdan kayarak gelir ──
  if (mySlideOver) {
    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{
          x: 0,
          transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
        }}
        exit={{
          opacity: 0,
          transition: { duration: 0.3 },
        }}
        onAnimationComplete={() => setSlideAnimDone(true)}
        className="w-full min-h-screen bg-white"
        style={{
          position: slideAnimDone ? 'relative' : 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: slideAnimDone ? 'auto' : 0,
          zIndex: slideAnimDone ? 1 : 20,
          overflowY: slideAnimDone ? 'visible' : 'auto',
          willChange: 'transform',
          boxShadow: slideAnimDone ? 'none' : '-8px 0 30px rgba(0,0,0,0.15)',
        }}
      >
        {children}
      </motion.div>
    )
  }

  // ── Normal exit animasyonları ──
  // Üstümüze slideOver geliyorsa → sayfada HİÇBİR ŞEY değişmez, sadece bekle
  const nextIsSlideOver = (currentLocation.state as any)?.slideOver === true
    && currentLocation.pathname !== mountStateRef.current.pathname

  // slideOver exit: SIFIR görsel değişiklik, sadece bekleme süresi
  const slideOverExit = {
    opacity: 1, // Değişmez! Sayfa olduğu gibi kalır
    transition: { duration: 0.7 },
  }

  const normalExit = myIsCardEntry
    ? {
      opacity: 0,
      position: 'fixed' as const,
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }
    : {
      ...exitTo,
      position: 'fixed' as const,
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0,
      transition: { duration: 1.6, ease: [0.12, 0.8, 0.2, 1] as [number, number, number, number] },
    }

  return (
    <motion.div
      initial={
        myIsCardEntry
          ? { opacity: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }
          : { ...enterFrom, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }
      }
      animate={{
        x: 0,
        y: 0,
        opacity: 1,
        position: 'relative',
        zIndex: 1,
        transition: myIsCardEntry
          ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
          : { duration: 1.6, ease: [0.12, 0.8, 0.2, 1] as [number, number, number, number] },
      }}
      exit={nextIsSlideOver ? slideOverExit : normalExit}
      className="w-full min-h-screen bg-white"
      style={{ willChange: myIsCardEntry ? 'opacity' : 'transform' }}
    >
      {children}
    </motion.div>
  )
}
