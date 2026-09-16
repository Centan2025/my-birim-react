import React, {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {motion} from 'framer-motion'
import {useCardTransition} from '../context/CardTransitionContext'
import {useSiteSettings} from '../context/SiteSettingsContext'

interface PageTransitionProps {
  children: React.ReactNode
}

export const PageTransition: React.FC<PageTransitionProps> = ({children}) => {
  const location = useLocation()
  const {isExpanding} = useCardTransition()

  // CMS'den gelen animasyon ayarını al
  const {settings, isLoading} = useSiteSettings()
  const enableTransitions = settings?.enablePageTransitions ?? true

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo({top: 0, left: 0, behavior: 'instant'})
    return () => {
      window.scrollTo({top: 0, left: 0, behavior: 'instant'})
    }
  }, [location.pathname])

  const isCardEntry = isExpanding || location.state?.fromCard
  const shouldAnimate = isCardEntry || (!isLoading && enableTransitions)

  return (
    <motion.div
      initial={!shouldAnimate ? {opacity: 1} : {opacity: 0, y: 10}}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: shouldAnimate ? 0.3 : 0,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      exit={
        !shouldAnimate
          ? {opacity: 1}
          : {
              opacity: 0,
              y: -8,
              transition: {
                duration: 0.2,
                ease: 'easeIn',
              },
            }
      }
      className="w-full flex-grow flex flex-col min-h-screen bg-[var(--bg-primary)] relative"
    >
      {children}
    </motion.div>
  )
}
