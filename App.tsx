import React, {
  useState,
  useContext,
  createContext,
  PropsWithChildren,
  useEffect,
  Suspense,
  lazy,
} from 'react'
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom'

import { Header } from './components/Header'
import { getFooterContent, getSiteSettings } from './services/cms'
import type { FooterContent, SiteSettings, User } from './types'
import { SiteLogo } from './components/SiteLogo'
import { I18nProvider, useTranslation } from './i18n'
import { CartProvider } from './context/CartContext'
import { CartSidebar } from './components/CartSidebar'
import CookieBanner from './components/CookieBanner'
import { SkipLink } from './components/SkipLink'
import { errorReporter } from './src/lib/errorReporting'
import { analytics } from './src/lib/analytics'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './src/lib/queryClient'
import ScrollReveal from './components/ScrollReveal'
import { resolveLegalLinkText } from './src/lib/legalLinks'
import { NewsletterForm } from './components/NewsletterForm'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage }))
)
const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage }))
)
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage }))
)
const DesignersPage = lazy(() =>
  import('./pages/DesignersPage').then(m => ({ default: m.DesignersPage }))
)
const DesignerDetailPage = lazy(() =>
  import('./pages/DesignerDetailPage').then(m => ({ default: m.DesignerDetailPage }))
)
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const NewsPage = lazy(() => import('./pages/NewsPage').then(m => ({ default: m.NewsPage })))
const NewsDetailPage = lazy(() =>
  import('./pages/NewsDetailPage').then(m => ({ default: m.NewsDetailPage }))
)
const CookiesPage = lazy(() => import('./pages/CookiesPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const KvkkPage = lazy(() => import('./pages/KvkkPage'))
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage }))
)
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage }))
)
const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage }))
)
const ComingSoonPage = lazy(() =>
  import('./pages/ComingSoonPage').then(m => ({ default: m.ComingSoonPage }))
)

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-white text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
      <p className="text-gray-300">Yükleniyor...</p>
    </div>
  </div>
)

// Helper component to render SVG strings safely
const DynamicIcon: React.FC<{ svgString: string }> = ({ svgString }) => (
  <div dangerouslySetInnerHTML={{ __html: svgString }} />
)

interface AuthContextType {
  isLoggedIn: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface SiteSettingsContextType {
  settings: SiteSettings | null
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null)

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}

const SiteSettingsProvider = ({ children }: PropsWithChildren) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    getSiteSettings().then(setSettings)
  }, [])

  useEffect(() => {
    // Update browser tab title if provided from settings; fallback to current title
    if (
      settings?.topBannerText &&
      typeof settings.topBannerText === 'string' &&
      settings.topBannerText.trim()
    ) {
      document.title = settings.topBannerText.trim()
    }
  }, [settings?.topBannerText])

  return <SiteSettingsContext.Provider value={{ settings }}>{children}</SiteSettingsContext.Provider>
}

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUser = localStorage.getItem('birim_user')
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
            try {
              localStorage.removeItem('birim_user')
            } catch {
              // Storage erişilemiyorsa sessizce devam et
            }
          }
        }
      }
    } catch {
      // Storage erişilemiyorsa sessizce devam et
    }
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('birim_user', JSON.stringify(userData))
      }
    } catch {
      // Storage erişilemiyorsa sessizce devam et
    }
    // Set user in error reporting
    errorReporter.setUser({
      id: userData._id,
      email: userData.email,
      name: userData.name,
    })
    // Track login
    analytics.trackUserAction('login', userData._id)
  }

  const logout = () => {
    setUser(null)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('birim_user')
      }
    } catch {
      // Storage erişilemiyorsa sessizce devam et
    }
    // Clear user from error reporting
    errorReporter.clearUser()
  }

  const value = {
    isLoggedIn: !!user,
    user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const ScrollToTop = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    window.scrollTo(0, 0)

    // Dinamik detay sayfaları (ürün, proje, haber, tasarımcı) için
    // başlık ve pageview takibini ilgili sayfa bileşenleri yapıyor.
    const isDynamicDetail =
      pathname.startsWith('/product/') ||
      pathname.startsWith('/projects/') ||
      pathname.startsWith('/news/') ||
      pathname.startsWith('/designer/')
    if (isDynamicDetail) {
      return
    }

    // Sayfa başlığı - rota bazlı dinamik title
    const baseTitle = 'BIRIM'
    let suffix = ''

    if (pathname === '/' || pathname === '') {
      suffix = t('homepage') || 'Ana Sayfa'
    } else if (pathname === '/about') {
      suffix = t('about') || 'Hakkımızda'
    } else if (pathname === '/products') {
      suffix = t('products') || 'Ürünler'
    } else if (pathname.startsWith('/product/')) {
      suffix = t('product_detail_title') || t('product') || 'Ürün Detayı'
    } else if (pathname === '/categories') {
      suffix = t('categories') || 'Kategoriler'
    } else if (pathname === '/designers') {
      suffix = t('designers') || 'Tasarımcılar'
    } else if (pathname.startsWith('/designer/')) {
      suffix = t('designer_detail_title') || t('designers') || 'Tasarımcı Detayı'
    } else if (pathname === '/projects') {
      suffix = t('projects') || 'Projeler'
    } else if (pathname.startsWith('/projects/')) {
      suffix = t('project_detail_title') || t('projects') || 'Proje Detayı'
    } else if (pathname === '/news') {
      suffix = t('news') || 'Haberler'
    } else if (pathname.startsWith('/news/')) {
      suffix = t('news_detail_title') || t('news') || 'Haber Detayı'
    } else if (pathname === '/contact') {
      suffix = t('contact') || 'İletişim'
    } else if (pathname === '/login') {
      suffix = t('login') || 'Giriş'
    } else if (pathname === '/profile') {
      suffix = t('profile') || 'Profil'
    } else if (pathname === '/verify-email') {
      suffix = 'E-posta Doğrulama'
    } else if (pathname === '/cookies') {
      suffix = t('cookies') || 'Çerez Politikası'
    } else if (pathname === '/privacy') {
      suffix = t('privacy') || 'Gizlilik Politikası'
    } else if (pathname === '/terms') {
      suffix = t('terms') || 'Kullanım Şartları'
    } else if (pathname === '/kvkk') {
      suffix = t('kvkk') || 'KVKK'
    }

    const finalTitle = suffix ? `${baseTitle} - ${suffix}` : baseTitle
    if (typeof document !== 'undefined') {
      document.title = finalTitle
    }

    // Google Analytics pageview (sadece statik sayfalar için)
    analytics.pageview(pathname, finalTitle)
  }, [pathname, t])

  return null
}

const BackToTopButton: React.FC = () => {
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
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Sayfanın en üstüne dön"
      className="fixed bottom-6 right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur hover:bg-black/60 transition-all duration-200"
    >
      <span className="text-lg leading-none">↑</span>
    </button>
  )
}

// TopBanner kaldırıldı
const TopBanner = () => null

const Footer = () => {
  const [content, setContent] = useState<FooterContent | null>(null)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const { t, setLocale, locale, supportedLocales } = useTranslation()

  useEffect(() => {
    Promise.all([getFooterContent(), getSiteSettings()]).then(([footerData, settingsData]) => {
      setContent(footerData)
      setSettings(settingsData)
    })
  }, [])

  if (!content || !settings) return null

  return (
    <>
      <footer
        className="bg-gray-800 text-gray-400"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 lg:py-12" style={{ overflow: 'visible' }}>
          {/* Mobil düzen */}
          <div className="lg:hidden flex flex-col items-center justify-center space-y-6 w-full" style={{ maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
            {/* Logo - ortada üstte */}
            <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto">
              <Link to="/" className="text-white flex justify-center w-full">
                <SiteLogo logoUrl={settings.logoUrl} className="h-6 w-auto mx-auto" />
              </Link>
            </ScrollReveal>

            {/* Menü düğmeleri - alt alta ortada */}
            <nav className="flex flex-col items-center space-y-3 w-full">
              <ScrollReveal delay={15} threshold={0.1} width="w-full" className="h-auto">
                <Link
                  to="/products"
                  className="flex justify-center items-center text-lg font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 w-full"
                >
                  {t('view_all')}
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={30} threshold={0.1} width="w-full" className="h-auto">
                <Link
                  to="/designers"
                  className="flex justify-center items-center text-lg font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 w-full"
                >
                  {t('designers')}
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={45} threshold={0.1} width="w-full" className="h-auto">
                <Link
                  to="/projects"
                  className="flex justify-center items-center text-lg font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 w-full"
                >
                  {t('projects') || 'Projeler'}
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={60} threshold={0.1} width="w-full" className="h-auto">
                <Link
                  to="/news"
                  className="flex justify-center items-center text-lg font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 w-full"
                >
                  {t('news')}
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={75} threshold={0.1} width="w-full" className="h-auto">
                <Link
                  to="/about"
                  className="flex justify-center items-center text-lg font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 w-full"
                >
                  {t('about')}
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={90} threshold={0.1} width="w-full" className="h-auto">
                <Link
                  to="/contact"
                  className="flex justify-center items-center text-lg font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 w-full"
                >
                  {t('contact')}
                </Link>
              </ScrollReveal>
            </nav>

            {/* İnce çizgi */}
            <ScrollReveal delay={105} threshold={0.1} width="w-full" className="h-auto">
              <div className="w-full border-t border-gray-700"></div>
            </ScrollReveal>

            {/* Dil seçenekleri */}
            <ScrollReveal delay={120} threshold={0.1} width="w-full" className="h-auto">
              <div className="flex items-center justify-center gap-3 w-full">
                {supportedLocales.map((langCode) => {
                  const isActive = locale === langCode
                  return (
                    <button
                      key={langCode}
                      onClick={() => setLocale(langCode)}
                      className={`text-xs uppercase tracking-wider transition-colors duration-200 ${isActive ? 'text-white font-bold' : 'text-gray-400 hover:text-white font-thin'
                        }`}
                    >
                      {langCode.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </ScrollReveal>

            {/* İnce çizgi */}
            <ScrollReveal delay={135} threshold={0.1} width="w-full" className="h-auto">
              <div className="w-full border-t border-gray-700"></div>
            </ScrollReveal>

            {/* Email abonelik formu - mobilde en altta ortalanmış */}
            <ScrollReveal delay={150} threshold={0.1} width="w-full" className="h-auto">
              <div className="w-full flex justify-center !mt-8 lg:!mt-6">
                <ScrollReveal
                  delay={165}
                  threshold={0.1}
                  width="w-full"
                  className="h-auto w-full flex flex-col items-center justify-center"
                >
                  <NewsletterForm variant="mobile" className="flex flex-col items-center w-full" />
                </ScrollReveal>
              </div>
            </ScrollReveal>

            {/* Partnerler - mobilde en altta */}
            <ScrollReveal delay={210} threshold={0.1} width="w-full" className="h-auto">
              <div className="flex items-center justify-center flex-wrap gap-6 mb-0">
                {(content.partners || content.partnerNames || []).map((partner, index) => {
                  const partnerName = typeof partner === 'string' ? partner : t(partner.name)
                  const partnerLogo = typeof partner === 'object' ? partner.logo : undefined
                  const partnerUrl = typeof partner === 'object' ? partner.url : undefined

                  const partnerContent = partnerLogo ? (
                    <img
                      src={partnerLogo}
                      alt={partnerName}
                      className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
                    />
                  ) : (
                    <span className="font-semibold text-gray-300 opacity-70 hover:opacity-100 transition-opacity duration-200">
                      {partnerName}
                    </span>
                  )

                  return partnerUrl ? (
                    <a
                      key={index}
                      href={partnerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      {partnerContent}
                    </a>
                  ) : (
                    <span key={index}>{partnerContent}</span>
                  )
                })}
              </div>
            </ScrollReveal>
          </div>

          {/* Desktop düzen */}
          <div className="hidden lg:flex flex-wrap items-start gap-8 lg:gap-16">
            {/* Sol taraf: Logo ve partner yazıları (sola hizalı) */}
            <div className="w-full lg:w-auto">
              <ScrollReveal delay={0} threshold={0.1} width="w-auto" className="h-auto">
                <div className="text-white mb-4">
                  <SiteLogo logoUrl={settings.logoUrl} className="h-4 w-auto" />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={15} threshold={0.1} width="w-full" className="h-auto">
                <div className="flex items-center flex-wrap gap-6 mb-4">
                  {(content.partners || content.partnerNames || []).map((partner, index) => {
                    const partnerName = typeof partner === 'string' ? partner : t(partner.name)
                    const partnerLogo = typeof partner === 'object' ? partner.logo : undefined
                    const partnerUrl = typeof partner === 'object' ? partner.url : undefined

                    const partnerContent = partnerLogo ? (
                      <img
                        src={partnerLogo}
                        alt={partnerName}
                        className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
                      />
                    ) : (
                      <span className="font-semibold text-gray-300 opacity-70 hover:opacity-100 transition-opacity duration-200">
                        {partnerName}
                      </span>
                    )

                    return partnerUrl ? (
                      <a
                        key={index}
                        href={partnerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        {partnerContent}
                      </a>
                    ) : (
                      <span key={index}>{partnerContent}</span>
                    )
                  })}
                </div>
              </ScrollReveal>
            </div>

            {/* Orta: Menü düğmeleri (sağa hizalı üstte) */}
            <div className="flex-1 flex justify-end">
              <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold uppercase tracking-wider text-gray-300 items-center justify-end">
                <ScrollReveal delay={30} threshold={0.1} width="w-auto" className="h-auto">
                  <Link to="/products" className="group relative hover:text-white">
                    <span className="relative inline-block">
                      {t('view_all')}
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                    </span>
                  </Link>
                </ScrollReveal>
                <ScrollReveal delay={45} threshold={0.1} width="w-auto" className="h-auto">
                  <Link to="/designers" className="group relative hover:text-white">
                    <span className="relative inline-block">
                      {t('designers')}
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                    </span>
                  </Link>
                </ScrollReveal>
                <ScrollReveal delay={60} threshold={0.1} width="w-auto" className="h-auto">
                  <Link to="/projects" className="group relative hover:text-white">
                    <span className="relative inline-block">
                      {t('projects') || 'Projeler'}
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                    </span>
                  </Link>
                </ScrollReveal>
                <ScrollReveal delay={75} threshold={0.1} width="w-auto" className="h-auto">
                  <Link to="/news" className="group relative hover:text-white">
                    <span className="relative inline-block">
                      {t('news')}
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                    </span>
                  </Link>
                </ScrollReveal>
                <ScrollReveal delay={90} threshold={0.1} width="w-auto" className="h-auto">
                  <Link to="/about" className="group relative hover:text-white">
                    <span className="relative inline-block">
                      {t('about')}
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                    </span>
                  </Link>
                </ScrollReveal>
                <ScrollReveal delay={105} threshold={0.1} width="w-auto" className="h-auto">
                  <Link to="/contact" className="group relative hover:text-white">
                    <span className="relative inline-block">
                      {t('contact')}
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                    </span>
                  </Link>
                </ScrollReveal>
              </nav>
            </div>
          </div>
          {/* Sosyal medya linkleri ve email formu - aynı üst hizasında */}
          {/* Sosyal medya linkleri ve email formu - Desktop'ta justify-between ile ayrılır */}
          <div className="mt-8 flex flex-col lg:flex-row flex-wrap items-center lg:items-start justify-center lg:justify-between gap-6 lg:gap-0">
            {/* Sosyal medya linkleri */}
            <ScrollReveal delay={120} threshold={0.1} width="w-auto" className="h-auto">
              <div className="w-full lg:w-auto flex justify-center lg:justify-start space-x-4">
                {(content.socialLinks || [])
                  .filter(link => link.isEnabled)
                  .map((link, index) => (
                    <ScrollReveal
                      key={link.name}
                      delay={135 + index * 15}
                      threshold={0.1}
                      width="w-auto"
                      className="h-auto"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group text-gray-300/80 hover:text-white transition-colors duration-300 ease-out"
                      >
                        <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
                          {(() => {
                            const key = link.name.toLowerCase()

                            if (key.includes('instagram')) {
                              // Kullanıcının verdiği black-instagram-transparent-logo-10671.svg'den sadeleştirilmiş ikon
                              // viewBox'ı 0–32 aralığına çekerek ikonun çerçeve içinde daha büyük görünmesini sağlıyoruz
                              return (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 32 32"
                                  className="w-8 h-8"
                                  fill="currentColor"
                                >
                                  <path d="M 31.336 8.741 c -0.078 -1.71 -0.35 -2.878 -0.747 -3.9 c -0.403 -1.072 -1.036 -2.043 -1.853 -2.846 c -0.802 -0.817 -1.774 -1.45 -2.846 -1.854 c -1.022 -0.397 -2.19 -0.668 -3.9 -0.746 c -1.713 -0.078 -2.261 -0.097 -6.624 -0.097 s -4.911 0.019 -6.624 0.097 c -1.71 0.078 -2.878 0.35 -3.9 0.747 C 3.769 0.546 2.798 1.178 1.996 1.996 c -0.817 0.802 -1.45 1.773 -1.854 2.846 c -0.397 1.022 -0.668 2.19 -0.746 3.9 c -0.079 1.714 -0.097 2.261 -0.097 6.625 c 0 4.364 0.019 4.911 0.097 6.625 c 0.078 1.71 0.35 2.878 0.747 3.9 c 0.403 1.072 1.036 2.043 1.853 2.846 c 0.802 0.817 1.774 1.45 2.846 1.853 c 1.022 0.397 2.19 0.669 3.9 0.747 c 1.713 0.078 2.261 0.097 6.624 0.097 s 4.911 -0.018 6.624 -0.097 c 1.71 -0.078 2.878 -0.35 3.9 -0.747 c 2.158 -0.834 3.864 -2.541 4.699 -4.699 c 0.397 -1.022 0.669 -2.19 0.747 -3.9 c 0.078 -1.714 0.097 -2.261 0.097 -6.625 S 31.414 10.455 31.336 8.741 z M 28.444 21.858 c -0.071 1.567 -0.333 2.417 -0.553 2.983 c -0.541 1.401 -1.648 2.509 -3.049 3.049 c -0.566 0.22 -1.417 0.482 -2.983 0.553 c -1.694 0.077 -2.202 0.094 -6.492 0.094 c -4.291 0 -4.799 -0.016 -6.492 -0.094 c -1.566 -0.071 -2.417 -0.333 -2.983 -0.553 c -0.698 -0.258 -1.329 -0.668 -1.847 -1.202 c -0.534 -0.518 -0.944 -1.149 -1.202 -1.847 c -0.22 -0.566 -0.482 -1.417 -0.553 -2.983 c -0.077 -1.694 -0.094 -2.202 -0.094 -6.492 s 0.016 -4.798 0.094 -6.492 C 2.359 7.306 2.62 6.456 2.84 5.89 C 3.098 5.192 3.509 4.56 4.042 4.042 C 4.561 3.508 5.192 3.098 5.89 2.84 c 0.566 -0.22 1.417 -0.482 2.983 -0.553 c 1.694 -0.077 2.202 -0.093 6.492 -0.093 h 0 c 4.29 0 4.798 0.016 6.492 0.094 c 1.567 0.071 2.417 0.333 2.983 0.553 c 0.698 0.258 1.329 0.668 1.847 1.202 c 0.534 0.518 0.944 1.15 1.202 1.848 c 0.22 0.566 0.482 1.417 0.553 2.983 c 0.077 1.694 0.094 2.202 0.094 6.492 S 28.521 20.164 28.444 21.858 z" />
                                  <path d="M 15.365 7.115 c -4.557 0 -8.25 3.694 -8.25 8.25 s 3.694 8.251 8.25 8.251 c 4.557 0 8.251 -3.694 8.251 -8.251 S 19.922 7.115 15.365 7.115 z M 15.365 20.721 c -2.957 0 -5.355 -2.398 -5.355 -5.356 s 2.398 -5.356 5.356 -5.356 c 2.958 0 5.356 2.398 5.356 5.356 S 18.323 20.721 15.365 20.721 z" />
                                  <path d="M 25.87 6.789 c 0 1.065 -0.863 1.928 -1.928 1.928 c -1.065 0 -1.928 -0.863 -1.928 -1.928 c 0 -1.065 0.863 -1.928 1.928 -1.928 S 25.87 5.724 25.87 6.789 z" />
                                </svg>
                              )
                            }

                            if (key.includes('pinterest')) {
                              // Kullanıcının verdiği pinterest-113.svg'den sadeleştirilmiş ikon
                              // Orijinal path koordinatları 0–90 aralığında olduğundan viewBox'ı daraltıp ikonu büyütüyoruz.
                              return (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 90 90"
                                  className="w-8 h-8"
                                  fill="currentColor"
                                >
                                  <path d="M 25.334 90 c 3.415 -2.853 8.943 -12.256 10.189 -17.048 c 0.671 -2.581 3.437 -13.114 3.437 -13.114 c 1.799 3.43 7.054 6.334 12.644 6.334 c 16.638 0 28.626 -15.301 28.626 -34.312 C 80.229 13.636 65.357 0 46.22 0 C 22.415 0 9.771 15.981 9.771 33.382 c 0 8.091 4.307 18.164 11.198 21.371 c 1.045 0.486 1.604 0.272 1.845 -0.738 c 0.183 -0.767 1.113 -4.513 1.532 -6.256 c 0.134 -0.557 0.068 -1.036 -0.383 -1.582 c -2.279 -2.764 -4.105 -7.848 -4.105 -12.589 c 0 -12.167 9.213 -23.94 24.909 -23.94 c 13.552 0 23.042 9.235 23.042 22.443 c 0 14.923 -7.536 25.261 -17.341 25.261 c -5.415 0 -9.469 -4.478 -8.169 -9.968 c 1.555 -6.558 4.569 -13.634 4.569 -18.367 c 0 -4.237 -2.274 -7.771 -6.98 -7.771 c -5.536 0 -9.982 5.727 -9.982 13.397 c 0 4.886 1.65 8.19 1.65 8.19 s -5.467 23.115 -6.469 27.421 c -1.109 4.764 -0.674 11.476 -0.191 15.84 L 25.334 90 z" />
                                </svg>
                              )
                            }

                            if (key.includes('facebook') || key === 'fb') {
                              // Kullanıcının verdiği facebook-logo-108.svg'den sadeleştirilmiş ikon
                              return (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 90 90"
                                  className="w-8 h-8"
                                  fill="currentColor"
                                >
                                  <path d="M 51.991 90 V 49.008 h 13.781 l 2.12 -16.049 H 51.991 V 22.739 c 0 -4.632 1.293 -7.791 7.94 -7.791 h 8.417 V 0.637 C 64.25 0.196 60.13 -0.017 56.009 0.001 c -12.212 0 -20.576 7.42 -20.576 21.148 v 11.809 H 21.652 v 16.049 h 13.781 V 90 H 51.991 z" />
                                </svg>
                              )
                            }

                            if (key.includes('youtube')) {
                              // Kullanıcının verdiği youtube-123.svg'den sadeleştirilmiş ikon
                              return (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 90 90"
                                  className="w-8 h-8"
                                  fill="currentColor"
                                >
                                  <path d="M 88.119 23.338 c -1.035 -3.872 -4.085 -6.922 -7.957 -7.957 C 73.144 13.5 45 13.5 45 13.5 s -28.144 0 -35.162 1.881 c -3.872 1.035 -6.922 4.085 -7.957 7.957 C 0 30.356 0 45 0 45 s 0 14.644 1.881 21.662 c 1.035 3.872 4.085 6.922 7.957 7.957 C 16.856 76.5 45 76.5 45 76.5 s 28.144 0 35.162 -1.881 c 3.872 -1.035 6.922 -4.085 7.957 -7.957 C 90 59.644 90 45 90 45 S 90 30.356 88.119 23.338 z M 36 58.5 v -27 L 59.382 45 L 36 58.5 z" />
                                </svg>
                              )
                            }

                            if (key.includes('linkedin') || key.includes('linkdin')) {
                              // Kullanıcının verdiği linkedin-112.svg'den sadeleştirilmiş ikon
                              return (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 90 90"
                                  className="w-8 h-8"
                                  fill="currentColor"
                                >
                                  <path d="M 1.48 29.91 h 18.657 v 60.01 H 1.48 V 29.91 z M 10.809 0.08 c 5.963 0 10.809 4.846 10.809 10.819 c 0 5.967 -4.846 10.813 -10.809 10.813 C 4.832 21.712 0 16.866 0 10.899 C 0 4.926 4.832 0.08 10.809 0.08" />
                                  <path d="M 31.835 29.91 h 17.89 v 8.206 h 0.255 c 2.49 -4.72 8.576 -9.692 17.647 -9.692 C 86.514 28.424 90 40.849 90 57.007 V 89.92 H 71.357 V 60.737 c 0 -6.961 -0.121 -15.912 -9.692 -15.912 c -9.706 0 -11.187 7.587 -11.187 15.412 V 89.92 H 31.835 V 29.91 z" />
                                </svg>
                              )
                            }

                            // Bilinmeyen platformlarda CMS'ten gelen SVG'yi kullan
                            return <DynamicIcon svgString={link.svgIcon} />
                          })()}
                        </div>
                      </a>
                    </ScrollReveal>
                  ))}
              </div>
            </ScrollReveal>
            {/* Email abonelik formu - sadece desktop'ta */}
            <ScrollReveal delay={150} threshold={0.1} width="w-full lg:w-auto" className="h-auto">
              <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                <NewsletterForm variant="desktop" className="flex w-full lg:w-auto lg:justify-end" />
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={180} threshold={0} width="w-full" className="h-auto">
            <div
              id="mobile-legal-row-container"
              className="mt-8 lg:mt-10 border-t border-gray-700 pt-8 flex flex-col items-center justify-center md:flex-row md:items-start md:justify-start gap-4 text-xs w-full legal-links-row"
              style={{ overflow: 'visible', width: '100%' }}
            >
              {content.legalLinks && content.legalLinks.length > 0 && (
                <div
                  id="mobile-legal-links-stack"
                  className="legal-links-inner flex flex-col w-full md:w-auto md:flex-row md:flex-wrap md:items-center items-center justify-center md:justify-start gap-y-2 md:gap-x-4 md:gap-y-0"
                  style={{
                    overflow: 'visible',
                    maxWidth: '100%',
                    width: '100%',
                    minWidth: 0,
                    flexShrink: 0,
                    flexGrow: 0,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'center',
                  }}
                >
                  {content.legalLinks
                    .filter(link => link?.isVisible)
                    .map((link, index) => {
                      const url = typeof link?.url === 'string' ? link.url : ''
                      const linkText = resolveLegalLinkText(link, locale, t)

                      // Diğer footer öğeleri gibi her yasal linke de ScrollReveal animasyonu ekle
                      return (
                        <ScrollReveal
                          key={index}
                          delay={195 + index * 15}
                          threshold={0}
                          width="w-auto"
                          className="h-auto"
                        >
                          {!url ? (
                            <span
                              className="opacity-80 select-none text-gray-400"
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                                textOverflow: 'clip',
                                maxWidth: 'none',
                              }}
                            >
                              {linkText}
                            </span>
                          ) : (
                            (() => {
                              const isHttp = /^https?:\/\//.test(url)
                              const isInternalLink =
                                url.startsWith('/') && !url.startsWith('//') && !isHttp
                              const commonClasses =
                                'text-gray-400 hover:text-gray-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:rounded-sm'

                              return (
                                <span className="legal-link-wrapper">
                                  {isInternalLink ? (
                                    <Link to={url} className={commonClasses}>
                                      {linkText}
                                    </Link>
                                  ) : (
                                    <a
                                      href={url}
                                      className={commonClasses}
                                      target={isHttp ? '_blank' : undefined}
                                      rel={isHttp ? 'noopener noreferrer' : undefined}
                                    >
                                      {linkText}
                                    </a>
                                  )}
                                </span>
                              )
                            })()
                          )}
                        </ScrollReveal>
                      )
                    })}
                </div>
              )}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={210} threshold={0} width="w-full" className="h-auto">
            <div className="mt-6 text-center md:text-left text-xs pb-4">
              <p>{t(content.copyrightText)}</p>
            </div>
          </ScrollReveal>
        </div>
      </footer>
      {/* Mobilde footer'dan sonra ekstra padding - scroll bounce beyaz alanını önler */}
      <div className="lg:hidden h-2 bg-gray-800" aria-hidden="true"></div>
    </>
  )
}

// Maintenance mode kontrolünü provider içinde yapmak için ayrı component
const AppContent = () => {
  // Maintenance mode kontrolü - öncelikle CMS'den, yoksa environment variable'dan
  // Development modunda (dev server) maintenance mode devre dışı
  // Production'da aktif olabilir, ancak ?bypass=secret ile bypass edilebilir
  const { settings } = useSiteSettings()
  const maintenanceModeFromCMS = settings?.maintenanceMode ?? false
  // Tip güvenliği için string index kullan, ama Vite prod build'de gerçek değeri enjekte eder
  const maintenanceModeFromEnv = import.meta.env['VITE_MAINTENANCE_MODE'] === 'true'
  const maintenanceModeEnabled = maintenanceModeFromCMS || maintenanceModeFromEnv

  const isProduction = import.meta.env.PROD
  // Bypass için kabul edilen secret değerleri:
  // - Vercel env'den gelen değer (varsa)
  // - Proje içinde sabitlenen güvenli değerler (ör: 'birim-dev-2025', 'dev-bypass-2024')
  const envBypassSecret = import.meta.env['VITE_MAINTENANCE_BYPASS_SECRET']
  const allowedBypassSecrets = [
    'dev-bypass-2024',
    'birim-dev-2025',
    ...(envBypassSecret && !['dev-bypass-2024', 'birim-dev-2025'].includes(envBypassSecret)
      ? [envBypassSecret]
      : []),
  ]

  // HashRouter'da query parameter hem hash'ten önce hem de hash içinde olabilir
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const bypassParam = searchParams.get('bypass') || hashParams.get('bypass')

  const hasBypass = !!bypassParam && allowedBypassSecrets.includes(bypassParam)

  // Maintenance mode sadece production'da ve geçerli bir bypass YOKSA aktif
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
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        {isMaintenanceMode ? (
          // Maintenance mode aktifse sadece ComingSoonPage göster
          <main className="flex-grow" style={{ overflowX: 'hidden' }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="*" element={<ComingSoonPage />} />
              </Routes>
            </Suspense>
          </main>
        ) : (
          // Normal mod - tüm sayfalar
          <>
            <SkipLink />
            <Header />
            <CartSidebar />
            <main
              id="main-content"
              className="flex-grow"
              style={{ overflowX: 'hidden' }}
              tabIndex={-1}
            >
              <TopBanner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:categoryId" element={<ProductsPage />} />
                  <Route path="/product/:productId" element={<ProductDetailPage />} />
                  <Route path="/designers" element={<DesignersPage />} />
                  <Route path="/designer/:designerId" element={<DesignerDetailPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/:newsId" element={<NewsDetailPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/kvkk" element={<KvkkPage />} />
                </Routes>
              </Suspense>
            </main>
            <CookieBanner />
            <Footer />
          </>
        )}
        <BackToTopButton />
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
    </HashRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <CartProvider>
            <SiteSettingsProvider>
              <AppContent />
            </SiteSettingsProvider>
          </CartProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
