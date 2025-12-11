import React, {
  useState,
  useContext,
  createContext,
  PropsWithChildren,
  useEffect,
  Suspense,
  lazy,
} from 'react'
import {HashRouter, Routes, Route, useLocation, Link} from 'react-router-dom'

import {Header} from './components/Header'
import {getFooterContent, getSiteSettings, subscribeEmail} from './services/cms'
import type {FooterContent, SiteSettings, User} from './types'
import {SiteLogo} from './components/SiteLogo'
import {I18nProvider, useTranslation} from './i18n'
import {CartProvider} from './context/CartContext'
import {CartSidebar} from './components/CartSidebar'
import CookieBanner from './components/CookieBanner'
import {SkipLink} from './components/SkipLink'
import {errorReporter} from './src/lib/errorReporting'
import {analytics} from './src/lib/analytics'
import {QueryClientProvider} from '@tanstack/react-query'
import {queryClient} from './src/lib/queryClient'
import ScrollReveal from './components/ScrollReveal'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({default: m.HomePage})))
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then(m => ({default: m.CategoriesPage}))
)
const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then(m => ({default: m.ProductsPage}))
)
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then(m => ({default: m.ProductDetailPage}))
)
const DesignersPage = lazy(() =>
  import('./pages/DesignersPage').then(m => ({default: m.DesignersPage}))
)
const DesignerDetailPage = lazy(() =>
  import('./pages/DesignerDetailPage').then(m => ({default: m.DesignerDetailPage}))
)
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({default: m.AboutPage})))
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({default: m.ContactPage})))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({default: m.LoginPage})))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({default: m.ProfilePage})))
const NewsPage = lazy(() => import('./pages/NewsPage').then(m => ({default: m.NewsPage})))
const NewsDetailPage = lazy(() =>
  import('./pages/NewsDetailPage').then(m => ({default: m.NewsDetailPage}))
)
const CookiesPage = lazy(() => import('./pages/CookiesPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const KvkkPage = lazy(() => import('./pages/KvkkPage'))
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then(m => ({default: m.ProjectsPage}))
)
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then(m => ({default: m.ProjectDetailPage}))
)
const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then(m => ({default: m.VerifyEmailPage}))
)
const ComingSoonPage = lazy(() =>
  import('./pages/ComingSoonPage').then(m => ({default: m.ComingSoonPage}))
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
const DynamicIcon: React.FC<{svgString: string}> = ({svgString}) => (
  <div dangerouslySetInnerHTML={{__html: svgString}} />
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

const SiteSettingsProvider = ({children}: PropsWithChildren) => {
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

  return <SiteSettingsContext.Provider value={{settings}}>{children}</SiteSettingsContext.Provider>
}

const AuthProvider = ({children}: PropsWithChildren) => {
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
  const {pathname} = useLocation()
  const {t} = useTranslation()

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
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
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

const TopBanner = () => {
  const {settings} = useSiteSettings()
  const text = settings?.topBannerText?.trim()
  if (!text) return null
  return (
    <div className="hidden md:block bg-gray-900 text-gray-200 text-xs md:text-sm px-4 sm:px-6 lg:px-8 py-2 border-b border-white/10">
      <div className="container mx-auto">{text}</div>
    </div>
  )
}

const Footer = () => {
  const [content, setContent] = useState<FooterContent | null>(null)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [email, setEmail] = useState('')
  const {t, setLocale, locale, supportedLocales} = useTranslation()

  useEffect(() => {
    Promise.all([getFooterContent(), getSiteSettings()]).then(([footerData, settingsData]) => {
      setContent(footerData)
      setSettings(settingsData)
    })
  }, [])

  // Footer animasyonları kaldırıldı

  if (!content || !settings) return null

  return (
    <>
      <footer className="bg-gray-800 text-gray-400" style={{position: 'relative', zIndex: 1}}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3 lg:py-8">
        {/* Mobil düzen */}
        <div className="lg:hidden flex flex-col items-center space-y-6">
          {/* Logo - ortada üstte */}
          <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto">
            <Link to="/" className=" text-white -mt-4">
              <SiteLogo logoUrl={settings.logoUrl} className="h-6 w-auto mx-auto" />
            </Link>
          </ScrollReveal>

          {/* Menü düğmeleri - alt alta ortada */}
          <nav className="flex flex-col items-center space-y-3">
            <ScrollReveal delay={50} threshold={0.1} width="w-full" className="h-auto">
              <Link
                to="/products"
                className=" block text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 text-center w-full"
              >
                {t('view_all')}
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
              <Link
                to="/designers"
                className=" block text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 text-center w-full"
              >
                {t('designers')}
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={150} threshold={0.1} width="w-full" className="h-auto">
              <Link
                to="/projects"
                className=" block text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 text-center w-full"
              >
                {t('projects') || 'Projeler'}
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
              <Link
                to="/news"
                className=" block text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 text-center w-full"
              >
                {t('news')}
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={250} threshold={0.1} width="w-full" className="h-auto">
              <Link
                to="/about"
                className=" block text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 text-center w-full"
              >
                {t('about')}
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={300} threshold={0.1} width="w-full" className="h-auto">
              <Link
                to="/contact"
                className=" block text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 text-center w-full"
              >
                {t('contact')}
              </Link>
            </ScrollReveal>
          </nav>

          {/* İnce çizgi */}
          <ScrollReveal delay={350} threshold={0.1} width="w-full" className="h-auto">
            <div className="w-full border-t border-gray-700"></div>
          </ScrollReveal>

          {/* Dil seçenekleri */}
          <ScrollReveal delay={400} threshold={0.1} width="w-full" className="h-auto">
            <div className="flex items-center justify-center gap-3 w-full">
              {supportedLocales.map(langCode => {
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
          <ScrollReveal delay={450} threshold={0.1} width="w-full" className="h-auto">
            <div className="w-full border-t border-gray-700"></div>
          </ScrollReveal>

          {/* Email abonelik formu - mobilde en altta ortalanmış */}
          <ScrollReveal delay={500} threshold={0.1} width="w-full" className="h-auto">
            <div className="w-full flex justify-center !mt-8 lg:!mt-6">
              <form
                onSubmit={async e => {
                  e.preventDefault()
                  if (email) {
                    try {
                      await subscribeEmail(email)
                      analytics.trackUserAction('newsletter_subscribe', email)
                      alert('E-posta aboneliğiniz başarıyla oluşturuldu!')
                      setEmail('')
                    } catch (err: any) {
                      // Özel durum: Local storage'a kaydedildi ama CMS'de görünmüyor
                      if (err.message === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
                        alert(
                          "E-posta aboneliğiniz kaydedildi!\n\nNot: CMS'de görünmesi için .env dosyasına VITE_SANITY_TOKEN ekleyin. Detaylar: README.md"
                        )
                        analytics.trackUserAction('newsletter_subscribe', email)
                        setEmail('')
                      } else {
                        alert(err.message || "Bir hata oluştu. Lütfen console'u kontrol edin.")
                      }
                    }
                  }
                }}
                className="flex flex-col items-center justify-center w-full"
              >
                <ScrollReveal delay={550} threshold={0.1} width="w-full" className="h-auto">
                  <p className="text-sm text-gray-300 mb-4 text-center">{t('subscribe_prompt')}</p>
                </ScrollReveal>
                <ScrollReveal delay={600} threshold={0.1} width="w-full" className="h-auto">
                  <div className="flex items-center justify-center border-b border-white pb-0.5 w-full max-w-[280px] mx-auto">
                    <input
                      type="email"
                      id="footer-subscribe-email"
                      name="footer-subscribe-email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('email_placeholder')}
                      className="w-full py-1 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[15px] text-center"
                      style={{outline: 'none', boxShadow: 'none'}}
                      onFocus={e => (e.target.style.outline = 'none')}
                      onBlur={e => (e.target.style.outline = 'none')}
                    />
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={650} threshold={0.1} width="w-full" className="h-auto">
                  <div className="w-full flex justify-center mt-6">
                    <button
                      type="submit"
                      className="px-0 py-1 bg-transparent border-0 text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium uppercase tracking-[0.25em]"
                    >
                      {t('subscribe')}
                    </button>
                  </div>
                </ScrollReveal>
              </form>
            </div>
          </ScrollReveal>

          {/* Partnerler - mobilde en altta */}
          <ScrollReveal delay={700} threshold={0.1} width="w-full" className="h-auto">
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
            <ScrollReveal delay={50} threshold={0.1} width="w-auto" className="h-auto">
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
              <ScrollReveal delay={100} threshold={0.1} width="w-auto" className="h-auto">
                <Link to="/products" className="group relative hover:text-white">
                  <span className="relative inline-block">
                    {t('view_all')}
                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                  </span>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={150} threshold={0.1} width="w-auto" className="h-auto">
                <Link to="/designers" className=" group relative hover:text-white">
                  <span className="relative inline-block">
                    {t('designers')}
                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                  </span>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={200} threshold={0.1} width="w-auto" className="h-auto">
                <Link to="/projects" className=" group relative hover:text-white">
                  <span className="relative inline-block">
                    {t('projects') || 'Projeler'}
                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                  </span>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={250} threshold={0.1} width="w-auto" className="h-auto">
                <Link to="/news" className=" group relative hover:text-white">
                  <span className="relative inline-block">
                    {t('news')}
                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                  </span>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={300} threshold={0.1} width="w-auto" className="h-auto">
                <Link to="/about" className=" group relative hover:text-white">
                  <span className="relative inline-block">
                    {t('about')}
                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                  </span>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={350} threshold={0.1} width="w-auto" className="h-auto">
                <Link to="/contact" className=" group relative hover:text-white">
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
        <div className="mt-6 flex flex-col lg:flex-row flex-wrap items-center lg:items-start justify-center lg:justify-start gap-6 lg:gap-12">
          {/* Sosyal medya linkleri */}
          <ScrollReveal delay={400} threshold={0.1} width="w-auto" className="h-auto">
            <div className="w-full lg:w-auto flex justify-center lg:justify-start space-x-6">
              {(content.socialLinks || [])
                .filter(link => link.isEnabled)
                .map((link, index) => (
                  <ScrollReveal key={link.name} delay={400 + index * 50} threshold={0.1} width="w-auto" className="h-auto">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=" hover:text-white transition-opacity duration-200 opacity-70 hover:opacity-100"
                    >
                      <div className="w-3 h-3">
                        <DynamicIcon svgString={link.svgIcon} />
                      </div>
                    </a>
                  </ScrollReveal>
                ))}
            </div>
          </ScrollReveal>
          {/* Email abonelik formu - sadece desktop'ta */}
          <ScrollReveal delay={500} threshold={0.1} width="w-auto" className="h-auto">
            <div className="hidden lg:flex lg:flex-1 lg:justify-end">
              <form
                onSubmit={async e => {
                  e.preventDefault()
                  if (email) {
                    try {
                      await subscribeEmail(email)
                      analytics.trackUserAction('newsletter_subscribe', email)
                      alert('E-posta aboneliğiniz başarıyla oluşturuldu!')
                      setEmail('')
                    } catch (err: any) {
                      // Özel durum: Local storage'a kaydedildi ama CMS'de görünmüyor
                      if (err.message === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
                        alert(
                          "E-posta aboneliğiniz kaydedildi!\n\nNot: CMS'de görünmesi için .env dosyasına VITE_SANITY_TOKEN ekleyin. Detaylar: README.md"
                        )
                        analytics.trackUserAction('newsletter_subscribe', email)
                        setEmail('')
                      } else {
                        alert(err.message || "Bir hata oluştu. Lütfen console'u kontrol edin.")
                      }
                    }
                  }
                }}
                className="flex w-full lg:w-auto lg:justify-end"
              >
                {/* Input + SUBSCRIBE hizası için ortak alt çizgi */}
                <ScrollReveal delay={550} threshold={0.1} width="w-auto" className="h-auto">
                  <div className="flex items-center w-full lg:w-auto lg:min-w-[320px] lg:ml-auto border-b border-white/80 pb-0.5 gap-2">
                    <div className="flex-1 min-w-[180px]">
                      <input
                        type="email"
                        id="footer-subscribe-email-inline"
                        name="footer-subscribe-email-inline"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('email_placeholder')}
                        className=" w-full py-0.5 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[14px] text-left"
                        style={{outline: 'none', boxShadow: 'none'}}
                        onFocus={e => {
                          e.target.style.outline = 'none'
                          e.target.style.boxShadow = 'none'
                        }}
                        onBlur={e => {
                          e.target.style.outline = 'none'
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      className=" px-0 py-1 bg-transparent border-0 text-gray-300 hover:text-white transition-colors duration-200 text-xs font-medium uppercase tracking-[0.25em]"
                    >
                      {t('subscribe')}
                    </button>
                  </div>
                </ScrollReveal>
              </form>
            </div>
          </ScrollReveal>
        </div>
        <ScrollReveal delay={600} threshold={0.1} width="w-full" className="h-auto">
          <div className=" mt-6 lg:mt-8 border-t border-gray-700 pt-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4 text-xs">
            {content.legalLinks && content.legalLinks.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:gap-x-4 items-center gap-2">
                {content.legalLinks
                  .filter(link => link?.isVisible)
                  .map((link, index) => {
                    const url = typeof link?.url === 'string' ? link.url : ''
                    if (!url) {
                      return (
                        <ScrollReveal key={index} delay={600 + index * 50} threshold={0.1} width="w-auto" className="h-auto">
                          <span className=" opacity-80 select-none text-gray-400">
                            {t(link.text)}
                          </span>
                        </ScrollReveal>
                      )
                    }
                    const isHttp = /^https?:\/\//.test(url)
                    const isInternalLink = url.startsWith('/') && !url.startsWith('//') && !isHttp
                    return isInternalLink ? (
                      <ScrollReveal key={index} delay={600 + index * 50} threshold={0.1} width="w-auto" className="h-auto">
                        <Link
                          to={url}
                          className=" text-gray-400 hover:text-gray-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:rounded-sm"
                        >
                          {t(link.text)}
                        </Link>
                      </ScrollReveal>
                    ) : (
                      <ScrollReveal key={index} delay={600 + index * 50} threshold={0.1} width="w-auto" className="h-auto">
                        <a
                          href={url}
                          className=" text-gray-400 hover:text-gray-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:rounded-sm"
                          target={isHttp ? '_blank' : undefined}
                          rel={isHttp ? 'noopener noreferrer' : undefined}
                        >
                          {t(link.text)}
                        </a>
                      </ScrollReveal>
                    )
                  })}
              </div>
            )}
          </div>
        </ScrollReveal>
        <ScrollReveal delay={700} threshold={0.1} width="w-full" className="h-auto">
          <div className="mt-4 text-center md:text-left text-xs">
            <p className="">{t(content.copyrightText)}</p>
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
  const {settings} = useSiteSettings()
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
    <HashRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        {isMaintenanceMode ? (
          // Maintenance mode aktifse sadece ComingSoonPage göster
          <main className="flex-grow" style={{overflowX: 'hidden'}}>
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
              style={{overflowX: 'hidden'}}
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
