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

// Global in-memory cache to ensure bypass survives ANY in-app navigation
// even if storage is restricted or cleared in Incognito / Private Browsing modes
let inMemoryBypass: string | null = null

function getBypassCookie(): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie.match(/(?:^|;\s*)maintenance_bypass=([^;]+)/)
    return match && match[1] ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function setBypassCookie(value: string) {
  if (typeof document === 'undefined') return
  try {
    document.cookie = `maintenance_bypass=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`
  } catch {
    // ignore
  }
}

function clearBypassCookie() {
  if (typeof document === 'undefined') return
  try {
    document.cookie = `maintenance_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  } catch {
    // ignore
  }
}

function getStoredBypass(): string | null {
  if (inMemoryBypass) return inMemoryBypass
  try {
    const session = sessionStorage.getItem('maintenance_bypass')
    if (session) return session
  } catch {
    // ignore
  }
  try {
    const local = localStorage.getItem('maintenance_bypass')
    if (local) return local
  } catch {
    // ignore
  }
  const cookie = getBypassCookie()
  if (cookie) return cookie
  return null
}

function persistBypass(value: string) {
  inMemoryBypass = value
  try {
    sessionStorage.setItem('maintenance_bypass', value)
  } catch {
    // ignore
  }
  try {
    localStorage.setItem('maintenance_bypass', value)
  } catch {
    // ignore
  }
  setBypassCookie(value)
}

function clearBypassStorage() {
  inMemoryBypass = null
  try {
    sessionStorage.removeItem('maintenance_bypass')
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem('maintenance_bypass')
  } catch {
    // ignore
  }
  clearBypassCookie()
}

// Maintenance mode kontrolünü provider içinde yapmak için ayrı component
const AppContent = () => {
  const location = useLocation()
  const {pathname} = location
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
  const allowedBypassSecrets = [
    ...(envBypassSecret ? [envBypassSecret] : []),
    'birim-dev-2025',
    'birim2025',
    'birim-preview',
    ...(import.meta.env.DEV ? ['birim-dev-local'] : []),
  ]

  const searchParams = new URLSearchParams(window.location.search || location.search)
  let urlBypass = searchParams.get('bypass')

  if (!urlBypass && typeof window !== 'undefined' && window.location.hash) {
    const hash = window.location.hash
    const queryPart = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
    if (queryPart) {
      urlBypass = new URLSearchParams(queryPart).get('bypass')
    }
  }

  let bypassParam: string | null = null

  if (urlBypass) {
    const normalized = urlBypass.trim()
    if (normalized === 'clear' || normalized === 'off' || normalized === 'false') {
      clearBypassStorage()
      bypassParam = null
    } else if (allowedBypassSecrets.some(s => s.toLowerCase() === normalized.toLowerCase())) {
      persistBypass(normalized)
      bypassParam = normalized
    }
  }

  if (!bypassParam) {
    const stored = getStoredBypass()
    if (stored && allowedBypassSecrets.some(s => s.toLowerCase() === stored.trim().toLowerCase())) {
      bypassParam = stored.trim()
      inMemoryBypass = bypassParam
    }
  }

  const hasBypass = !!bypassParam
  const isMaintenanceMode = isProduction && maintenanceModeEnabled && !hasBypass

  const debugInfo =
    typeof window !== 'undefined' &&
    (window.location.search.includes('bypass') ||
      window.location.hash.includes('bypass') ||
      hasBypass)
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
        const rawTarget = hash.slice(1) // '#/about?foo=bar' -> '/about?foo=bar'
        const [targetPath, hashQuery] = rawTarget.split('?')
        const query = window.location.search || (hashQuery ? `?${hashQuery}` : '')
        const target = (targetPath || '/') + query
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
