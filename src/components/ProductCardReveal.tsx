import React, {useRef} from 'react'
import {motion, useInView, useReducedMotion} from 'framer-motion'

interface ProductCardRevealProps {
  children: React.ReactNode
  delay?: number // In seconds or milliseconds
  duration?: number
  direction?: 'down' | 'up' // 'down' emerges from top to bottom
  className?: string
}

/**
 * Generates a deterministic pseudo-random number (0 to 1) based on index.
 * Stays consistent between renders (no hydration mismatch, no re-triggering flickers).
 */
function getPseudoRandom(seed: number): number {
  const x = Math.sin((seed + 1) * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/**
 * Calculates an organic, pseudo-randomized delay for product cards:
 * Instead of a rigid conveyor-belt order, cards appear in a scattered,
 * organic sequence while staying within a tight time window (0.04s - 0.42s).
 */
export function getProductCardStaggerDelay(index: number, columns = 4, randomize = true): number {
  if (!randomize) {
    const col = index % columns
    const row = Math.floor(index / columns)
    return row < 2 ? row * 0.14 + col * 0.1 : col * 0.1
  }

  const row = Math.floor(index / columns)
  const rand = getPseudoRandom(index)

  // First 2 rows (initial viewport): scatter delays between 0.05s and 0.55s
  if (row < 2) {
    return Math.round((0.05 + rand * 0.5) * 100) / 100
  }

  // Subsequent rows scrolled into view: scatter delays across the row between 0.03s and 0.35s
  return Math.round((0.03 + rand * 0.32) * 100) / 100
}

export const ProductCardReveal: React.FC<ProductCardRevealProps> = ({
  children,
  delay = 0,
  duration = 1.9,
  direction = 'down',
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Convert milliseconds to seconds if passed as ms (e.g. 150 -> 0.15)
  const delayInSeconds = delay > 5 ? delay / 1000 : delay
  const initialY = direction === 'down' ? '-102%' : '102%'

  const isInView = useInView(ref, {
    once: true,
    amount: 0.02,
    margin: '0px 0px -20px 0px',
  })

  // When reduced motion is preferred, render static without animation
  if (shouldReduceMotion) {
    return <div className={`w-full ${className}`}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden [clip-path:inset(0)] w-full ${className}`}
      style={{isolation: 'isolate'}}
    >
      <motion.div
        initial={{y: initialY, opacity: 0}}
        animate={isInView ? {y: '0%', opacity: 1} : {y: initialY, opacity: 0}}
        transition={{
          y: {
            duration,
            delay: delayInSeconds,
            ease: [0.19, 1, 0.22, 1], // Elegant, gentle glide with smooth deceleration
          },
          opacity: {
            duration: duration * 1.1, // Gradual fade-in matching the slower slide
            delay: delayInSeconds,
            ease: [0.45, 0, 0.15, 1], // Starts very faint in the beginning, then clarifies
          },
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  )
}

interface CategoryTitleRevealProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export const CategoryTitleReveal: React.FC<CategoryTitleRevealProps> = ({
  children,
  delay = 0.05,
  duration = 1.3,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const isInView = useInView(ref, {
    once: true,
    amount: 0.1,
    margin: '0px 0px -30px 0px',
  })

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`overflow-hidden [clip-path:inset(0_0_-6px_0)] pb-1 ${className}`}
      style={{isolation: 'isolate'}}
    >
      <motion.div
        initial={{y: '-110%', opacity: 0}}
        animate={isInView ? {y: '0%', opacity: 1} : {y: '-110%', opacity: 0}}
        transition={{
          y: {
            duration,
            delay,
            ease: [0.19, 1, 0.22, 1],
          },
          opacity: {
            duration: duration * 1.08,
            delay,
            ease: [0.45, 0, 0.15, 1],
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default ProductCardReveal
