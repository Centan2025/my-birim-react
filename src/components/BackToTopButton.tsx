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
      className="fixed bottom-6 right-6 z-40 w-12 h-12 flex items-center justify-center rounded-none border-[0.5px] border-white bg-white/10 text-white shadow-sm backdrop-blur-md mix-blend-difference hover:bg-white/20 transition-all duration-300 active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-9 w-9"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  )
}
