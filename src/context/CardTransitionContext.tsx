import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { OptimizedImage } from '../components/OptimizedImage'

interface CardRect {
  top: number
  left: number
  width: number
  height: number
  imageUrl: string
  imageMobile?: string
  imageDesktop?: string
  crop?: any
  hotspot?: any
  objectFit?: 'cover' | 'contain'
  initialBorderRadius?: string
  className?: string
  target?: {
    width?: number | string
    height?: number | string
    top?: number
    left?: number
    borderRadius?: string
  }
  showGradient?: boolean
}

interface CardTransitionContextType {
  triggerExpand: (rect: CardRect, onComplete: () => void) => void
  setTargetRect: (rect: {
    top: number
    left: number
    width: number | string
    height: number | string
    borderRadius?: string
  }) => void
  isExpanding: boolean
  phase: 'animating' | 'holding' | 'fading' | 'none'
  heroTarget: {
    top: number
    left: number
    width: number | string
    height: number | string
    borderRadius?: string
  } | null
}

const CardTransitionContext = createContext<CardTransitionContextType>({
  triggerExpand: () => { },
  setTargetRect: () => { },
  isExpanding: false,
  phase: 'none',
  heroTarget: null,
})

export const useCardTransition = () => useContext(CardTransitionContext)

export const CardTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{
    rect: CardRect
    onComplete: () => void
    phase: 'animating' | 'holding' | 'fading'
    heroTarget: {
      top: number
      left: number
      width: number | string
      height: number | string
      borderRadius?: string
    }
  } | null>(null)

  const triggerExpand = useCallback((rect: CardRect, onComplete: () => void) => {
    const isMobile = window.innerWidth < 1024

    // Default target is the hero section (e.g. for products)
    const targetWidth = document.documentElement.clientWidth
    const targetHeight = isMobile ? window.innerHeight * 0.7 : window.innerHeight * 0.85

    const defaultHeroTarget = {
      top: 0,
      left: 0,
      width: targetWidth,
      height: targetHeight,
      borderRadius: '0px',
    }

    const heroTarget = {
      ...defaultHeroTarget,
      ...(rect.target || {}),
    }

    setState({ rect, onComplete, phase: 'animating', heroTarget })

    // Trigger navigation immediately so the new page mounts and fades in while the card flies!
    onComplete()
  }, [])

  const setTargetRect = useCallback(
    (rect: {
      top: number
      left: number
      width: number | string
      height: number | string
      borderRadius?: string
    }) => {
      setState(prev => {
        if (!prev || prev.phase !== 'animating') return prev
        // Only update if something actually changed to avoid re-render loops
        if (prev.heroTarget.top === rect.top && prev.heroTarget.left === rect.left) return prev
        return {
          ...prev,
          heroTarget: rect,
        }
      })
    },
    []
  )

  const isExpanding = state !== null
  const phase = state?.phase || 'none'
  const heroTarget = state?.heroTarget ?? null

  return (
    <CardTransitionContext.Provider
      value={{ triggerExpand, setTargetRect, isExpanding, phase, heroTarget }}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {state && (state.phase === 'animating' || state.phase === 'holding') && (
            <motion.div
              key="card-hero-expand"
              initial={
                state.phase === 'animating'
                  ? {
                    position: 'fixed',
                    top: state.rect.top,
                    left: state.rect.left,
                    width: state.rect.width,
                    height: state.rect.height,
                    zIndex: 30,
                    overflow: 'hidden',
                    borderRadius: state.rect.initialBorderRadius || '0px',
                    opacity: 1,
                  }
                  : undefined
              }
              animate={
                state.phase === 'animating'
                  ? {
                    // Move to hero position
                    top: state.heroTarget.top,
                    left: state.heroTarget.left,
                    width: state.heroTarget.width,
                    height: state.heroTarget.height,
                    borderRadius: state.heroTarget.borderRadius || '0px',
                    transition: {
                      duration: 0.8,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
                  : {
                    // Holding — stay in place, fade out gently
                    opacity: 0,
                    transition: { duration: 0.5, ease: 'easeOut' },
                  }
              }
              onAnimationComplete={() => {
                if (state.phase === 'animating') {
                  // Arrived at hero position. The page is now fully loaded and visible beneath.
                  // Just transition to 'holding' phase to fade out smoothly over it.
                  setState(prev => (prev ? { ...prev, phase: 'holding' } : null))
                } else {
                  // Fade complete — remove overlay
                  setState(null)
                }
              }}
              style={{ pointerEvents: 'none' }}
            >
              {/* Layer 1: Starts looking exactly like card, crossfades out */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <OptimizedImage
                  src={state.rect.imageUrl}
                  srcMobile={state.rect.imageMobile}
                  srcDesktop={state.rect.imageDesktop}
                  crop={state.rect.crop}
                  hotspot={state.rect.hotspot}
                  alt=""
                  className={`w-full h-full ${state.rect.className || ''} ${state.rect.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                />
                {/* Progressive gradient fade-out for Layer 1 */}
                {state.rect.showGradient && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none"
                  />
                )}
              </motion.div>
              {/* Layer 2: Final cover crop for hero, crossfades in seamlessly */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'transparent',
                }}
              >
                <OptimizedImage
                  src={state.rect.imageUrl}
                  srcMobile={state.rect.imageMobile}
                  srcDesktop={state.rect.imageDesktop}
                  crop={state.rect.crop}
                  hotspot={state.rect.hotspot}
                  alt=""
                  className={`w-full h-full ${state.rect.objectFit === 'cover'
                      ? 'object-cover'
                      : !state.rect.imageMobile
                        ? 'max-md:object-contain md:object-cover'
                        : 'object-cover'
                    }`}
                />
                {/* Synchronized gradient fade-in for Layer 2 */}
                {state.rect.showGradient && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none"
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </CardTransitionContext.Provider>
  )
}
