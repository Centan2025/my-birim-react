import {Suspense, useEffect, useState} from 'react'
import {BrowserRouter, Routes, Route, useLocation, useNavigate} from 'react-router-dom'
import {QueryClientProvider} from '@tanstack/react-query'

import {I18nProvider} from './i18n'
import {CartProvider} from './context/CartContext'
import {CommerceCartProvider} from './context/CommerceCartContext'
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

import {lazyWithRetry} from './utils/lazyWithRetry'
import {useUserActivityTracking} from './hooks/useUserActivityTracking'

// Lazy load pages for code splitting
const ComingSoonPage = lazyWithRetry(() =>
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
    const isProd = import.meta.env.PROD
    document.cookie = `maintenance_bypass=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Strict${
      isProd ? '; Secure' : ''
    }`
  } catch {
    // ignore
  }
}

function clearBypassCookie() {
  if (typeof document === 'undefined') return
  try {
    document.cookie = `maintenance_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`
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
  useUserActivityTracking()

  // Ultra-Soft & Butter-Smooth Lenis Momentum Scroll Integration for Desktop and Laptop devices
  useEffect(() => {
    // Mobil dar ekranlarda ve hareket azaltma tercihi olan kullanıcılarda native kaydırmayı koru
    const isSmallMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isSmallMobile || prefersReducedMotion) {
      return undefined
    }

    const lenis = new Lenis({
      duration: 1.2, // İpeksi ve pürüzsüz kayma süresi (saniye)
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Doğal üstel yavaşlama
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
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

  // Sayfa rotası değiştikçe Lenis scroll sınırlarını güncelle
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (win.lenis && typeof win.lenis.resize === 'function') {
      // Sayfa DOM'u yerleştikten hemen sonra ve kısa bir süre sonra yeniden hesapla
      win.lenis.resize()
      const timer = setTimeout(() => {
        if (win.lenis && typeof win.lenis.resize === 'function') {
          win.lenis.resize()
        }
      }, 150)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [pathname])

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

  const [hasServerBypass, setHasServerBypass] = useState<boolean>(() => {
    return Boolean(getStoredBypass())
  })

  // URL bypass parametresi kontrolü ve sunucu doğrulaması
  useEffect(() => {
    if (typeof window === 'undefined') return

    const searchParams = new URLSearchParams(window.location.search)
    let urlBypass = searchParams.get('bypass')

    if (!urlBypass && window.location.hash) {
      const hash = window.location.hash
      const queryPart = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
      if (queryPart) {
        urlBypass = new URLSearchParams(queryPart).get('bypass')
      }
    }

    if (!urlBypass) return

    const normalized = urlBypass.trim()

    // 1. Temizleme komutu
    if (normalized === 'clear' || normalized === 'off' || normalized === 'false') {
      clearBypassStorage()
      setHasServerBypass(false)
      const cleanUrl = window.location.pathname + window.location.hash.split('?')[0]
      window.history.replaceState({}, document.title, cleanUrl)
      return
    }

    // 2. Yerel geliştirme ortamı bypass'ı
    if (
      import.meta.env.DEV &&
      (normalized === 'birim-dev-local' ||
        normalized === 'birim-dev' ||
        normalized === 'birim-dev-2025' ||
        normalized === 'dev' ||
        normalized === '1')
    ) {
      persistBypass('local-dev')
      setHasServerBypass(true)
      return
    }

    // 3. Sunucu doğrulaması (Secret istemci kodunda tutulmaz)
    fetch('/api/maintenance/verify', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({secret: normalized}),
      credentials: 'same-origin',
    })
      .then(res => {
        if (!res.ok && import.meta.env.DEV) {
          // Yerel geliştirme ortamında endpoint henüz hazır olmasa bile bypass'a izin ver
          persistBypass('local-dev')
          setHasServerBypass(true)
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!data) return
        if (data && data.success) {
          persistBypass(data.bypassToken || 'server-verified')
          setHasServerBypass(true)
          // URL'den bypass parametresini temizle (history / referer sızıntısını önler)
          const cleanSearch = new URLSearchParams(window.location.search)
          cleanSearch.delete('bypass')
          const queryStr = cleanSearch.toString() ? `?${cleanSearch.toString()}` : ''
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + queryStr + window.location.hash
          )
        } else {
          clearBypassStorage()
          setHasServerBypass(false)
        }
      })
      .catch(() => {
        // Ağ hatası durumunda mevcut depolanmış oturumu koru
      })
  }, [])

  const hasBypass = hasServerBypass || Boolean(getStoredBypass())
  const isMaintenanceMode = isProduction && maintenanceModeEnabled && !hasBypass

  const debugInfo =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    (window.location.search.includes('bypass') ||
      window.location.hash.includes('bypass') ||
      hasBypass)
      ? {
          isProduction,
          maintenanceModeFromCMS,
          maintenanceModeFromEnv,
          maintenanceModeEnabled,
          hasBypass,
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
          <div>hasBypass: {String(debugInfo.hasBypass)}</div>
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

import {SelectionProvider} from './context/SelectionContext'

export default function App() {
  return (
    <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
      <HashRedirector />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <CartProvider>
              <CommerceCartProvider>
                <SEOProvider>
                  <DarkModeProvider>
                    <HeaderThemeProvider>
                      <SiteSettingsProvider>
                        <SelectionProvider>
                          <CardTransitionProvider>
                            <AppContent />
                          </CardTransitionProvider>
                        </SelectionProvider>
                      </SiteSettingsProvider>
                    </HeaderThemeProvider>
                  </DarkModeProvider>
                </SEOProvider>
              </CommerceCartProvider>
            </CartProvider>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
