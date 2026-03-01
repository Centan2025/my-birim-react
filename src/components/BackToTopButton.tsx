import React, {useState, useEffect} from 'react'

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let lastVisible = false
    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const shouldBeVisible = window.scrollY > 400
        // Sadece değiştiğinde state güncelle
        if (shouldBeVisible !== lastVisible) {
          lastVisible = shouldBeVisible
          setIsVisible(shouldBeVisible)
        }
        ticking = false
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, {passive: true})
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
      aria-label="Sayfanın en üstüne dön"
      className="fixed bottom-6 right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur hover:bg-black/60 transition-all duration-200"
    >
      <span className="text-lg leading-none">↑</span>
    </button>
  )
}
