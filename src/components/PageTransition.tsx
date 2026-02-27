import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useIsPresent, Variants } from 'framer-motion'
import { useCardTransition } from '../context/CardTransitionContext'
import { useSiteSettings } from '../context/SiteSettingsContext'

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

  // Mount-time state sabitlenir
  const mountStateRef = useRef({
    slideOver: (currentLocation.state as any)?.slideOver === true,
    fromCard: (currentLocation.state as any)?.fromCard === true,
    pathname: currentLocation.pathname,
  })

  const mySlideOver = mountStateRef.current.slideOver
  const myFromCard = mountStateRef.current.fromCard
  const myIsCardEntry = isExpanding || myFromCard

  const { settings, isLoading: settingsLoading } = useSiteSettings()
  const enablePageTransitions = settings?.enablePageTransitions ?? true

  const isSpecialEntry = myIsCardEntry || mySlideOver
  const isPresent = useIsPresent()
  const nextIsSlideOver = (currentLocation.state as any)?.slideOver === true
    && currentLocation.pathname !== mountStateRef.current.pathname

  const shouldAnimate = !settingsLoading && (enablePageTransitions || isSpecialEntry || nextIsSlideOver)

  const direction = getDirection(mountStateRef.current.pathname)
  const enterFrom = getEnterFrom(direction)

  const scrollPositionRef = useRef(0)
  useEffect(() => {
    if (!isPresent) return
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    scrollPositionRef.current = window.scrollY
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isPresent])

  // ── Sıçramayı Önleyici Body Kilitleme ──
  useEffect(() => {
    if (!isPresent) {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollY = scrollPositionRef.current
      const body = document.body

      const originalHeight = body.style.height
      const originalOverflow = body.style.overflow

      // Body yüksekliğini koru ki scroll sıfırlanmasın
      body.style.height = `${scrollHeight}px`

      return () => {
        body.style.height = originalHeight
        body.style.overflow = originalOverflow

        if (nextIsSlideOver) {
          window.scrollTo({ top: scrollY, behavior: 'instant' })
        }
      }
    }
    return undefined
  }, [isPresent, nextIsSlideOver])

  // slideOver animasyon durumu
  const [slideAnimDone, setSlideAnimDone] = useState(false)

  // Scroll-to-top: slideOver durumunda atla
  useEffect(() => {
    if (!isPresent) return // Çıkan sayfa scrollu etkilememeli
    const state = currentLocation.state as any
    if (state?.slideOver) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [currentLocation.pathname, currentLocation.state, isPresent])

  // ── slideOver giriş: sağdan kayarak gelir (TAMAMEN FIXED) ──
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


  // ── Variantlar ──
  const pageVariants: Variants = {
    initial: (custom: any) => {
      if (!custom.shouldAnimate) return { opacity: 1, x: 0, y: 0 }
      if (custom.isCardEntry) {
        return { opacity: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }
      }
      return { ...custom.enterFrom, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }
    },
    animate: (custom: any) => ({
      x: 0,
      y: 0,
      opacity: 1,
      position: 'relative',
      zIndex: 1,
      transition: !custom.shouldAnimate
        ? { duration: 0 }
        : custom.isCardEntry
          ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          : { duration: 1.6, ease: [0.12, 0.8, 0.2, 1] },
    }),
    exit: (custom: any) => {
      // ─── slideOver geçişi: arka plan sayfası TAMAMEN STATİK kalacak ───
      if (custom.nextIsSlideOver) {
        // Sayfa olduğu yerde, olduğu scroll'da donmuş kalır.
        // Tasarımcı sayfası wrapper düzeyinde fixed olarak üzerine biner.
        // Duration; slideOver animasyonundan uzun olmalı ki sayfa unmount olmasın.
        return {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 1.5 }
        }
      }

      // Eğer genel geçişler kapalıysa hemen kaldır
      if (!custom.shouldAnimate) {
        return { opacity: 0, transition: { duration: 0 } }
      }

      // Çıkış anındaki scroll pozisyonu
      const sY = scrollPositionRef.current

      const exitBase: any = {
        position: 'fixed' as const,
        top: -sY,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 0,
        overflow: 'hidden',
        transition: {
          duration: custom.isCardEntry ? 0.8 : 1.6,
          ease: custom.isCardEntry ? [0.22, 1, 0.36, 1] : [0.12, 0.8, 0.2, 1],
          top: { duration: 0 },
        },
      }

      if (custom.isCardEntry) {
        return { ...exitBase, opacity: 0 }
      }

      const dir = getDirection(custom.pathname)
      const exitTo = getExitTo(dir)

      return { ...exitBase, ...exitTo }
    },
  }

  return (
    <motion.div
      custom={{
        shouldAnimate,
        isCardEntry: myIsCardEntry,
        enterFrom,
        nextIsSlideOver,
        pathname: mountStateRef.current.pathname,
      }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout={false}
      className="w-full flex-grow flex flex-col bg-white"
      style={{
        overflowX: 'hidden',
      }}
    >
      <div className="flex-grow flex flex-col w-full relative">
        {children}
      </div>
    </motion.div>
  )
}
