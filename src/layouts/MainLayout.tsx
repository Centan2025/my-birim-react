import React, {useState} from 'react'
import {useLocation, Location} from 'react-router-dom'
import {AnimatePresence} from 'framer-motion'
import {Header} from '../components/Header'
import {PageTransition} from '../components/PageTransition'
import {CartSidebar} from '../components/CartSidebar'
import {FloatingAuthPanel} from '../components/FloatingAuthPanel'
import CookieBanner from '../components/CookieBanner'
import {SkipLink} from '../components/SkipLink'
import {AppRoutes} from '../routes/AppRoutes'

export const MainLayout: React.FC = () => {
  const location = useLocation()
  const isAnalytics = location.pathname === '/site-analitigi' || location.pathname === '/analytics'

  return (
    <>
      <SkipLink />
      {!isAnalytics && <Header />}
      {!isAnalytics && <CartSidebar />}
      {!isAnalytics && <FloatingAuthPanel />}
      <main id="main-content" className="flex flex-col flex-grow relative overflow-x-clip">
        <AnimatePresence mode="sync" initial={true}>
          <PageTransitionWrapper key={location.pathname} location={location} />
        </AnimatePresence>
      </main>
      {!isAnalytics && <CookieBanner />}
    </>
  )
}

/**
 * Bu wrapper, lokasyonu "capture" eder ve hapseder.
 * PageTransition exit yaparken bile kendi içindeki Routes'a eski lokasyonu verir.
 */
const PageTransitionWrapper = React.forwardRef<HTMLDivElement, {location: Location}>(
  ({location: liveLocation}, ref) => {
    // Lokasyonu ilk mount anındaki haliyle donduruyoruz.
    const [frozenLocation] = useState(liveLocation)
    const isSlideOver = (frozenLocation.state as {slideOver?: boolean})?.slideOver === true

    return (
      <div ref={ref} className={isSlideOver ? '' : 'flex-grow flex flex-col'}>
        <PageTransition>
          <AppRoutes frozenLocation={frozenLocation} />
        </PageTransition>
      </div>
    )
  }
)
