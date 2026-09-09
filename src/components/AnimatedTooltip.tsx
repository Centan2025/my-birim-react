import React, {useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'

export interface AnimatedTooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
  className?: string
  delay?: number
}

export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({
  content,
  position = 'top',
  children,
  className = '',
  delay = 0.05,
}) => {
  const [isVisible, setIsVisible] = useState(false)

  if (!content) {
    return <>{children}</>
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const motionVariants = {
    top: {
      initial: {opacity: 0, y: 5, scale: 0.96},
      animate: {opacity: 1, y: 0, scale: 1},
      exit: {opacity: 0, y: 3, scale: 0.96},
    },
    bottom: {
      initial: {opacity: 0, y: -5, scale: 0.96},
      animate: {opacity: 1, y: 0, scale: 1},
      exit: {opacity: 0, y: -3, scale: 0.96},
    },
    left: {
      initial: {opacity: 0, x: 5, scale: 0.96},
      animate: {opacity: 1, x: 0, scale: 1},
      exit: {opacity: 0, x: 3, scale: 0.96},
    },
    right: {
      initial: {opacity: 0, x: -5, scale: 0.96},
      animate: {opacity: 1, x: 0, scale: 1},
      exit: {opacity: 0, x: -3, scale: 0.96},
    },
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            role="tooltip"
            initial={motionVariants[position].initial}
            animate={motionVariants[position].animate}
            exit={motionVariants[position].exit}
            transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1], delay}}
            className={`hidden sm:flex items-center absolute ${positionClasses[position]} pointer-events-none z-50`}
          >
            <span className="text-[9px] sm:text-[10px] tracking-[0.14em] uppercase font-light text-[var(--text-primary)] bg-[var(--bg-primary)]/95 dark:bg-neutral-900/95 backdrop-blur-md px-2.5 py-1 shadow-md border border-neutral-300/80 dark:border-neutral-700/80 whitespace-nowrap">
              {content}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
