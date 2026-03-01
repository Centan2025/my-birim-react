import React from 'react'
import {motion, Variants} from 'framer-motion'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  threshold?: number
  className?: string
  width?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  duration?: number
  initialScale?: number
  once?: boolean
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  threshold = 0.1,
  className = '',
  width = 'w-full',
  direction = 'up',
  distance = 30,
  duration = 0.8,
  initialScale = 0.95,
  once = true,
}) => {
  const getInitialTranslate = () => {
    switch (direction) {
      case 'up':
        return {y: distance}
      case 'down':
        return {y: -distance}
      case 'left':
        return {x: distance}
      case 'right':
        return {x: -distance}
      case 'none':
        return {}
      default:
        return {y: distance}
    }
  }

  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: initialScale,
      ...getInitialTranslate(),
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration,
        delay: delay / 1000, // Convert ms to s
        ease: [0.16, 1, 0.3, 1], // Custom sudden deceleration easing
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{once, amount: threshold}}
      variants={variants}
      className={`${width} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default ScrollReveal
