import React, {useRef} from 'react'
import {motion, useInView, useReducedMotion, type UseInViewOptions} from 'framer-motion'

export interface TextMaskRevealProps {
  children: React.ReactNode
  /** Delay in seconds or milliseconds (values > 5 treated as ms) */
  delay?: number
  /** Duration of animation in seconds (default: 1.05s) */
  duration?: number
  /** Direction from which the text emerges: 'up' (default, emerges from bottom) or 'down' */
  direction?: 'up' | 'down'
  /** Amount of element visible to trigger (default: 0.08) */
  amount?: number
  /** Margin for intersection observer */
  margin?: UseInViewOptions['margin']
  /** Whether the animation runs once (default: true) */
  once?: boolean
  /** Outer container className */
  className?: string
  /** Inner motion container className */
  innerClassName?: string
  /** Display type: 'block' | 'inline-block' */
  display?: 'block' | 'inline-block'
  /** Custom style for the outer mask container */
  style?: React.CSSProperties
}

/**
 * TextMaskReveal wraps text or elements inside a masked container (`overflow: hidden`, `clip-path: inset(0)`).
 * When scrolled into view, the text smoothly rises from behind the mask boundary.
 */
export const TextMaskReveal: React.FC<TextMaskRevealProps> = ({
  children,
  delay = 0,
  duration = 1.05,
  direction = 'up',
  amount = 0.08,
  margin = '0px 0px -20px 0px',
  once = true,
  className = '',
  innerClassName = '',
  display = 'block',
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const isInView = useInView(ref, {
    once,
    amount,
    margin,
  })

  // Convert milliseconds to seconds if delay > 5 (e.g. 150 -> 0.15)
  const delayInSeconds = delay > 5 ? delay / 1000 : delay
  const initialY = direction === 'up' ? '112%' : '-112%'

  if (shouldReduceMotion) {
    return (
      <div
        className={`${display === 'inline-block' ? 'inline-block' : 'block'} ${className}`}
        style={style}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`overflow-hidden [clip-path:inset(0)] relative pb-0.5 ${
        display === 'inline-block' ? 'inline-block' : 'block'
      } ${className}`}
      style={{
        isolation: 'isolate',
        ...style,
      }}
    >
      <motion.div
        initial={{y: initialY, opacity: 0}}
        animate={isInView ? {y: '0%', opacity: 1} : {y: initialY, opacity: 0}}
        transition={{
          y: {
            duration,
            delay: delayInSeconds,
            ease: [0.22, 1, 0.36, 1], // Smooth luxury cubic-bezier easing
          },
          opacity: {
            duration: duration * 0.95,
            delay: delayInSeconds,
            ease: [0.45, 0, 0.15, 1],
          },
        }}
        className={innerClassName}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default TextMaskReveal
