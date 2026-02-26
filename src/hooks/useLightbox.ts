import {useState, useCallback} from 'react'

interface LightboxState {
  images: any[]
  currentIndex: number
}

/**
 * Generic lightbox state management hook.
 * Handles open/close, next/prev navigation for any image array.
 */
export function useLightbox() {
  const [state, setState] = useState<LightboxState | null>(null)

  const open = useCallback((images: any[], currentIndex: number) => {
    setState({images, currentIndex})
  }, [])

  const close = useCallback(() => {
    setState(null)
  }, [])

  const next = useCallback(() => {
    setState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.images.length,
      }
    })
  }, [])

  const prev = useCallback(() => {
    setState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
      }
    })
  }, [])

  return {
    isOpen: state !== null,
    images: state?.images ?? [],
    currentIndex: state?.currentIndex ?? 0,
    open,
    close,
    next,
    prev,
  }
}
