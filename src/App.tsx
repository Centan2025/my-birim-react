import {Suspense, lazy, useEffect} from 'react'
import {BrowserRouter, Routes, Route, useLocation, useNavigate} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'

import {I18nProvider} from './i18n'
import {CartProvider} from './context/CartContext'
import {HeaderThemeProvider, useHeaderTheme} from './context/HeaderThemeContext'
import {AuthProvider} from './context/AuthContext'
import {CardTransitionProvider} from './context/CardTransitionContext'
import {
  SiteSettingsProvider,
  useSiteSettings as useGlobalSettings,
} from './context/SiteSettingsContext'
import {queryClient} from './lib/queryClient'
import {SEOProvider} from './hooks/useSEO'

// Shared Components
import {PageLoader} from './components/PageLoader'
import {ScrollToTop} from './components/ScrollToTop'
import {BackToTopButton} from './components/BackToTopButton'
import {MediaCropDebugOverlay} from './components/debug/MediaCropDebugOverlay'
import {MainLayout} from './layouts/MainLayout'

// Lazy load pages for code splitting
const ComingSoonPage = lazy(() =>
  import('./pages/ComingSoonPage').then(m => ({default: m.ComingSoonPage}))
)

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Maintenance mode kontrolünü provider içinde yapmak için ayrı component
const AppContent = () => {
  const {pathname} = useLocation()
  const {reset: resetHeaderTheme} = useHeaderTheme()

  // Ultra-Soft & Butter-Smooth Lenis Momentum Scroll Integration for Desktop only
  useEffect(() => {
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768)

    if (isTouchDevice) {
      return undefined
    }

    const lenis = new Lenis({
      lerp: 0.065, // Masaüstünde ipeksi kayma
      wheelMultiplier: 1.0,
      smoothWheel: true,
    })

    const win = window as unknown as {lenis: unknown}
    win.lenis = lenis

    let animationFrameId: number

    function raf(time: number) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    animationFrameId = requestAnimationFrame(raf)

    return () => {
      win.lenis = null
      cancelAnimationFrame(animationFrameId)
      lenis.destroy()
    }
  }, [])

  // Sayfa değişimlerinde header temasını sıfırla (beyaz sayfalarda header'ın beyaz kalma sorununu çözer)
  useEffect(() => {
    resetHeaderTheme()
  }, [pathname, resetHeaderTheme])

  // Maintenance mode kontrolü - öncelikle CMS'den, yoksa environment variable'dan
  const {settings, isLoading: settingsLoading} = useGlobalSettings()
  const maintenanceModeFromCMS = settings?.maintenanceMode ?? false
  const maintenanceModeFromEnv = import.meta.env['VITE_MAINTENANCE_MODE'] === 'true'
  const maintenanceModeEnabled = maintenanceModeFromCMS || maintenanceModeFromEnv

  const enableTransitions = settings?.enablePageTransitions ?? true

  const isProduction = import.meta.env.PROD
  const envBypassSecret = import.meta.env['VITE_MAINTENANCE_BYPASS_SECRET']
  const allowedBypassSecrets = envBypassSecret
    ? [envBypassSecret]
    : import.meta.env.DEV
      ? ['birim-dev-local']
      : []

  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  let bypassParam = searchParams.get('bypass') || hashParams.get('bypass')

  if (bypassParam === 'clear' || bypassParam === 'off' || bypassParam === 'false') {
    try {
      sessionStorage.removeItem('maintenance_bypass')
      bypassParam = null
    } catch {
      // ignore
    }
  } else if (bypassParam && allowedBypassSecrets.includes(bypassParam)) {
    try {
      sessionStorage.setItem('maintenance_bypass', bypassParam)
    } catch {
      // ignore
    }
  } else {
    try {
      const stored = sessionStorage.getItem('maintenance_bypass')
      if (stored) bypassParam = stored
    } catch {
      // ignore
    }
  }

  const hasBypass = !!bypassParam && allowedBypassSecrets.includes(bypassParam)
  const isMaintenanceMode = isProduction && maintenanceModeEnabled && !hasBypass

  const debugInfo =
    typeof window !== 'undefined' &&
    (window.location.search.includes('bypass') || window.location.hash.includes('bypass'))
      ? {
          isProduction,
          maintenanceModeFromCMS,
          maintenanceModeFromEnv,
          maintenanceModeEnabled,
          allowedBypassSecrets,
          bypassParam,
          isMaintenanceMode,
        }
      : null

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />

      {/* Sayfa geçişleri kapalıyken CSS animasyonlarını öldür */}
      {!settingsLoading && !enableTransitions && (
        <style>{`
          .animate-fade-in-up-subtle, 
          .animate-fade-in-down, 
          .animate-fade-in-panel { 
            animation: none !important; 
            transition: none !important;
          }
        `}</style>
      )}

      {isMaintenanceMode ? (
        <main className="flex-grow overflow-x-clip">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="*" element={<ComingSoonPage />} />
            </Routes>
          </Suspense>
        </main>
      ) : (
        <MainLayout />
      )}
      <BackToTopButton />
      {typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('debugMedia') === 'true' ||
          new URLSearchParams(window.location.search).get('debug') === 'media') && (
          <MediaCropDebugOverlay />
        )}
      {import.meta.env.DEV && debugInfo && (
        <div className="fixed bottom-2 left-2 z-50 rounded bg-black/70 text-white text-[10px] px-2 py-1 font-mono text-left">
          <div>MAINT DEBUG</div>
          <div>bypassParam: {String(debugInfo.bypassParam)}</div>
          <div>
            allowedSecrets:
            {debugInfo.allowedBypassSecrets.map((s, i) => (
              <span key={i}> {String(s)}</span>
            ))}
          </div>
          <div>isMaintenanceMode: {String(debugInfo.isMaintenanceMode)}</div>
        </div>
      )}
    </div>
  )
}

import {DarkModeProvider} from './context/DarkModeContext'

/**
 * Geriye dönük uyumluluk: Eski #/link yer imlerini veya harici bağlantıları
 * anında standart temiz URL yapısına yönlendirir.
 */
function HashRedirector() {
  const navigate = useNavigate()
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash
      if (hash.startsWith('#/')) {
        const target = hash.slice(1) // '#/about' -> '/about'
        navigate(target, {replace: true})
      }
    }
  }, [navigate])
  return null
}

export default function App() {
  return (
    <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
      <HashRedirector />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <CartProvider>
              <SEOProvider>
                <DarkModeProvider>
                  <HeaderThemeProvider>
                    <SiteSettingsProvider>
                      <CardTransitionProvider>
                        <AppContent />
                      </CardTransitionProvider>
                    </SiteSettingsProvider>
                  </HeaderThemeProvider>
                </DarkModeProvider>
              </SEOProvider>
            </CartProvider>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
