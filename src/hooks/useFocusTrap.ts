import {useEffect, useRef} from 'react'

/**
 * Focus trap hook for modals and dropdowns
 * Traps focus within a container element
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (!firstElement || !lastElement) return

    // Focus first element when trap activates, but mümkünse sayfayı kaydırmadan
    if (firstElement && typeof firstElement.focus === 'function') {
      try {
        // Modern tarayıcılarda scroll'u tetiklemeden odaklan
        ;(firstElement as HTMLElement).focus({preventScroll: true})
      } catch {
        // Eski tarayıcılar için normal focus'a geri dön
        firstElement.focus()
      }
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

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

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Allow escape to close modal/dropdown
        // This should be handled by the component using this hook
      }
    }

    container.addEventListener('keydown', handleTab)
    container.addEventListener('keydown', handleEscape)

    return () => {
      container.removeEventListener('keydown', handleTab)
      container.removeEventListener('keydown', handleEscape)
    }
  }, [isActive])

  return containerRef
}
