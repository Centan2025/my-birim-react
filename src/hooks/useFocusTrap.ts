import {useEffect, useRef} from 'react'

/**
 * Focus trap hook for modals and dropdowns
 * Traps focus within a container element, handles Escape key,
 * and restores focus to previous element upon exit.
 */
export function useFocusTrap(isActive: boolean, onClose?: () => void) {
  const containerRef = useRef<HTMLElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isActive) return

    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement
    }

    const container = containerRef.current
    if (!container) return

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element when trap activates, only if focus is not already inside container
    if (
      firstElement &&
      typeof firstElement.focus === 'function' &&
      typeof document !== 'undefined' &&
      !container.contains(document.activeElement)
    ) {
      try {
        firstElement.focus({preventScroll: true})
      } catch {
        firstElement.focus()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCloseRef.current) {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
        return
      }

      if (e.key === 'Tab') {
        if (!firstElement || !lastElement) return

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        try {
          previousActiveElementRef.current.focus({preventScroll: true})
        } catch {
          // Ignore
        }
      }
    }
  }, [isActive])

  return containerRef
}
