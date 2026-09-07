import React, {useRef, useState, useEffect, useLayoutEffect, useMemo} from 'react'
import {motion, useInView, useReducedMotion, type UseInViewOptions} from 'framer-motion'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export interface TextLineRevealProps {
  /** The text string to animate line-by-line */
  text: string
  /** HTML tag to render (default: 'div') */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div' | 'span'
  /** Base delay in ms or seconds (values > 5 treated as ms) */
  delay?: number
  /** Stagger delay between lines in ms or seconds (default: 70ms) */
  stagger?: number
  /** Duration of animation for each line in seconds (default: 0.9s) */
  duration?: number
  /** Amount of element visible to trigger (default: 0.08) */
  amount?: number
  /** Margin for intersection observer */
  margin?: UseInViewOptions['margin']
  /** Whether the animation runs once (default: true) */
  once?: boolean
  /** Outer container className */
  className?: string
  /** ClassName applied to each animated line */
  lineClassName?: string
  /** Custom style for container */
  style?: React.CSSProperties
}

/**
 * TextLineReveal splits text into naturally wrapped lines according to the container's layout
 * and reveals each line with an individual mask and staggered upward motion ("satır satır reveal").
 */
export const TextLineReveal: React.FC<TextLineRevealProps> = ({
  text,
  as: Component = 'div',
  delay = 0,
  stagger = 70,
  duration = 0.9,
  amount = 0.08,
  margin = '0px 0px -20px 0px',
  once = true,
  className = '',
  lineClassName = '',
  style,
}) => {
  const containerRef = useRef<HTMLElement>(null)
  const measuringRef = useRef<HTMLSpanElement>(null)
  const [lines, setLines] = useState<string[]>(() => (text ? [text] : []))
  const shouldReduceMotion = useReducedMotion()

  const isInView = useInView(containerRef, {
    once,
    amount,
    margin,
  })

  const delayInSeconds = delay > 5 ? delay / 1000 : delay
  const staggerInSeconds = stagger > 5 ? stagger / 1000 : stagger

  const words = useMemo(() => {
    if (!text || typeof text !== 'string') return []
    return text.trim().split(/\s+/).filter(Boolean)
  }, [text])

  const calculateLines = () => {
    if (!measuringRef.current || words.length === 0) return
    const wordSpans = measuringRef.current.children
    if (!wordSpans || wordSpans.length === 0) return

    const computedLines: string[] = []
    let currentLineWords: string[] = []
    let lastTop: number | null = null

    for (let i = 0; i < wordSpans.length; i++) {
      const span = wordSpans[i] as HTMLElement
      const top = span.offsetTop
      const w = words[i]
      if (!w) continue

      if (lastTop === null) {
        lastTop = top
        currentLineWords.push(w)
      } else if (Math.abs(top - lastTop) > 6) {
        computedLines.push(currentLineWords.join(' '))
        currentLineWords = [w]
        lastTop = top
      } else {
        currentLineWords.push(w)
      }
    }

    if (currentLineWords.length > 0) {
      computedLines.push(currentLineWords.join(' '))
    }

    if (computedLines.length > 0) {
      setLines(computedLines)
    }
  }

  useIsomorphicLayoutEffect(() => {
    calculateLines()
  }, [words])

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      !containerRef.current
    )
      return
    const container = containerRef.current
    let prevWidth = container.clientWidth

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        if (Math.abs(newWidth - prevWidth) > 4) {
          prevWidth = newWidth
          calculateLines()
        }
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [words])

  if (!text) return null

  if (shouldReduceMotion) {
    return (
      <Component className={className} style={style}>
        {text}
      </Component>
    )
  }

  return (
    <Component
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={containerRef as any}
      className={`relative ${className}`}
      style={style}
      aria-label={text}
    >
      {/* Hidden measuring element used to calculate exact wrapping offsets */}
      <span
        ref={measuringRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -1,
        }}
      >
        {words.map((word, i) => (
          <span key={i}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>

      {/* Visible lines masked independently with staggered entrance */}
      {lines.map((lineText, idx) => (
        <span
          key={`${lineText}-${idx}`}
          className="block overflow-hidden [clip-path:inset(0)] relative pb-[0.08em]"
          style={{isolation: 'isolate'}}
        >
          <motion.span
            className={`block ${lineClassName}`}
            initial={{y: '115%', opacity: 0}}
            animate={isInView ? {y: '0%', opacity: 1} : {y: '115%', opacity: 0}}
            transition={{
              y: {
                duration,
                delay: delayInSeconds + idx * staggerInSeconds,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: {
                duration: duration * 0.9,
                delay: delayInSeconds + idx * staggerInSeconds,
                ease: [0.45, 0, 0.15, 1],
              },
            }}
          >
            {lineText}
          </motion.span>
        </span>
      ))}
    </Component>
  )
}
