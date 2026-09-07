import React, {useRef} from 'react'
import {useLocation, Location} from 'react-router-dom'
import {AnimatePresence} from 'framer-motion'
import {Header} from '../components/Header'
import {PageTransition} from '../components/PageTransition'
import {CartSidebar} from '../components/CartSidebar'
import {FloatingAuthPanel} from '../components/FloatingAuthPanel'
import {SelectionDrawer} from '../components/seckim/SelectionDrawer'
import {SelectionToast} from '../components/seckim/SelectionToast'
import CookieBanner from '../components/CookieBanner'
import {SkipLink} from '../components/SkipLink'
import {AppRoutes} from '../routes/AppRoutes'

export const MainLayout: React.FC = () => {
  const location = useLocation()
  const isAnalytics =
    location.pathname.startsWith('/site-analiti') || location.pathname === '/analytics'

  return (
    <>
      <SkipLink />
      {!isAnalytics && <Header />}
      {!isAnalytics && <CartSidebar />}
      {!isAnalytics && <SelectionDrawer />}
      {!isAnalytics && <FloatingAuthPanel />}
      {!isAnalytics && <SelectionToast />}
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
 * Sayfa geçişinde (farklı pathname) exit animasyonu sırasında eski lokasyonu korurken,
 * aynı sayfa içindeki query param (search) ve hash değişikliklerinde içeriğin anında güncellenmesini sağlar.
 */
const PageTransitionWrapper = React.forwardRef<HTMLDivElement, {location: Location}>(
  ({location: liveLocation}, ref) => {
    const initialPathname = useRef(liveLocation.pathname)
    const lastSamePathLocation = useRef(liveLocation)

    // Aynı sayfa içindeyken (search/hash/query parametreleri değiştiğinde) lokasyonu güncelle
    if (liveLocation.pathname === initialPathname.current) {
      lastSamePathLocation.current = liveLocation
    }

    const activeLocation = lastSamePathLocation.current
    const isSlideOver = (activeLocation.state as {slideOver?: boolean})?.slideOver === true

    return (
      <div ref={ref} className={isSlideOver ? '' : 'flex-grow flex flex-col'}>
        <PageTransition>
          <AppRoutes frozenLocation={activeLocation} />
        </PageTransition>
      </div>
    )
  }
)
