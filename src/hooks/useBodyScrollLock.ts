import {useEffect, useRef} from 'react'

/**
 * Hook to lock body scroll when a modal/menu is open.
 * Saves and restores scroll position on toggle.
 */
export function useBodyScrollLock(isLocked: boolean) {
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    if (isLocked) {
      scrollPositionRef.current = window.scrollY

      const body = document.body
      body.style.position = 'fixed'
      body.style.top = `-${scrollPositionRef.current}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
    } else {
      const body = document.body
      const scrollY = scrollPositionRef.current

      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''

      if (scrollY > 0) {
        window.scrollTo(0, scrollY)
      }
    }

    return () => {
      if (!isLocked) {
        const body = document.body
        body.style.position = ''
        body.style.top = ''
        body.style.left = ''
        body.style.right = ''
        body.style.width = ''
        body.style.overflow = ''
      }
    }
  }, [isLocked])
}
