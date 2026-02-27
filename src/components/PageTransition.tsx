import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCardTransition } from '../context/CardTransitionContext'

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
  const direction = getDirection(location.pathname)
  const enterFrom = getEnterFrom(direction)
  const exitTo = getExitTo(direction)

  // Mevcut scroll pozisyonunu ref'te sakla — exit animasyonunda kullanılacak
  const scrollYRef = useRef(0)
  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    scrollYRef.current = window.scrollY
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // slideOver geçişinde scroll pozisyonunu koru (eski sayfa yerinde kalmalı)
    const state = location.state as any
    if (state?.slideOver) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname, location.state])

  const isCardEntry = isExpanding || location.state?.fromCard
  const isSlideOver = location.state?.slideOver === true

  // slideOver: yeni sayfa sağdan gelip eski sayfanın üzerine biner
  if (isSlideOver) {
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
        }}
        animate={{
          x: 0,
          position: 'relative',
          zIndex: 1,
          transition: {
            duration: 0.7,
            ease: [0.25, 1, 0.5, 1],
          },
        }}
        exit={{
          opacity: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          transition: {
            duration: 0.4,
            ease: 'easeOut',
          },
        }}
        className="w-full min-h-screen bg-white"
        style={{ willChange: 'transform', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)' }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={
        isCardEntry
          ? { opacity: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }
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
            duration: 1.6,
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
          : {
            ...exitTo,
            position: 'fixed',
            top: -scrollYRef.current,
            left: 0,
            right: 0,
            zIndex: 0,
            transition: {
              duration: 1.6,
              ease: [0.12, 0.8, 0.2, 1],
            },
          }
      }
      className="w-full min-h-screen bg-white"
      style={{ willChange: isCardEntry ? 'opacity' : 'transform' }}
    >
      {children}
    </motion.div>
  )
}
