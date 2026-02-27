import React, { useEffect, useRef } from 'react'
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

  // Mount-time state: bu component hangi state ile oluşturuldu?
  // Bunu ref'te saklıyoruz çünkü useLocation() her zaman GÜNCEL location'ı döndürür.
  // Eski sayfa bile yeni URL'nin state'ini görür — bu yüzden ref ile mount-time'ı sabitliyoruz.
  const mountStateRef = useRef({
    slideOver: (currentLocation.state as any)?.slideOver === true,
    fromCard: (currentLocation.state as any)?.fromCard === true,
    pathname: currentLocation.pathname,
  })

  // Bu component'in kendi giriş animasyonu mount-time state'e göre belirlenir
  const mySlideOver = mountStateRef.current.slideOver
  const myFromCard = mountStateRef.current.fromCard
  const myIsCardEntry = isExpanding || myFromCard

  const direction = getDirection(mountStateRef.current.pathname)
  const enterFrom = getEnterFrom(direction)
  const exitTo = getExitTo(direction)

  // Scroll-to-top: Sadece bu sayfa slideOver değilse ve
  // üzerimize slideOver gelen bir sayfa yoksa scroll yap
  useEffect(() => {
    const myState = mountStateRef.current
    // Bu sayfa slideOver ile açıldıysa, designer sayfasının kendi scroll'u olsun
    if (myState.slideOver) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }
    // Eğer üstümüze slideOver bir sayfa geliyorsa, scroll'umuzu koruyalım
    const navState = currentLocation.state as any
    if (navState?.slideOver && currentLocation.pathname !== myState.pathname) {
      return // Scroll'u KORU
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [currentLocation.pathname, currentLocation.state])

  // slideOver giriş: sağdan kayarak gelir, eski sayfanın üstüne biner
  if (mySlideOver) {
    return (
      <motion.div
        initial={{
          x: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          overflow: 'auto',
        }}
        animate={{
          x: 0,
          position: 'relative',
          zIndex: 1,
          overflow: 'visible',
          transition: {
            duration: 0.7,
            ease: [0.25, 1, 0.5, 1],
          },
        }}
        exit={{
          opacity: 0,
          zIndex: 0,
          transition: { duration: 0.4, ease: 'easeOut' },
        }}
        className="w-full min-h-screen bg-white"
        style={{ willChange: 'transform', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)' }}
      >
        {children}
      </motion.div>
    )
  }

  // Normal giriş animasyonu
  // Exit animasyonu: eğer ÜSTÜMÜZe slideOver geliyorsa, yerinde kal + fade out
  // (position: fixed YAPMA — scroll pozisyonu bozulur)
  const nextIsSlideOver = (currentLocation.state as any)?.slideOver === true
    && currentLocation.pathname !== mountStateRef.current.pathname

  const normalExit = myIsCardEntry
    ? {
      opacity: 0,
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }
    : {
      ...exitTo,
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      transition: { duration: 1.6, ease: [0.12, 0.8, 0.2, 1] as [number, number, number, number] },
    }

  // slideOver geliyorsa: eski sayfa yerinde kalsın, sadece fade out
  const slideOverExit = {
    opacity: 0,
    zIndex: 0,
    transition: { duration: 0.7, ease: 'easeOut' as const },
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
          ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          : { duration: 1.6, ease: [0.12, 0.8, 0.2, 1] },
      }}
      exit={nextIsSlideOver ? slideOverExit : normalExit}
      className="w-full min-h-screen bg-white"
      style={{ willChange: myIsCardEntry ? 'opacity' : 'transform' }}
    >
      {children}
    </motion.div>
  )
}
