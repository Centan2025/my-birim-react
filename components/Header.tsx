import React, {useState, useEffect, useRef, useCallback} from 'react'
import {Link, NavLink, useLocation} from 'react-router-dom'
import type {Category, SiteSettings, Product, Designer, FooterContent} from '../types'
import {
  getSiteSettings,
  getDesigners,
  getProducts,
  getCategories,
  getFooterContent,
  subscribeEmail as subscribeEmailService,
} from '../services/cms'
import {useAuth} from '../App'
import {SiteLogo} from './SiteLogo'
import {useTranslation} from '../i18n'
import {useCart} from '../context/CartContext'
import {useCategories} from '../src/hooks/useCategories'
import {useProductsByCategory} from '../src/hooks/useProducts'
import {useFocusTrap} from '../src/hooks/useFocusTrap'

// Helper component to render SVG strings safely
const DynamicIcon: React.FC<{svgString: string}> = ({svgString}) => (
  <div dangerouslySetInnerHTML={{__html: svgString}} />
)

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const ShoppingBagIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
)

const ChevronRightIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

// Ortak cross-fade metin bileşeni
// Not: React state'in korunması için HEADER DIŞINDA tanımlanmalı
// Aksi halde Header her render olduğunda CrossFadeText yeniden mount edilir ve animasyon tetiklenmez.
const CrossFadeText: React.FC<{
  text: string
  className?: string
  triggerKey?: string | number
}> = ({text, className = '', triggerKey}) => {
  const [currentText, setCurrentText] = useState(text)
  const [previousText, setPreviousText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Her triggerKey değişiminde (yani dil değiştiğinde) animasyon oynat
    setPreviousText(currentText)
    setCurrentText(text)
    setIsAnimating(true)

    const timeout = window.setTimeout(() => {
      setIsAnimating(false)
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [triggerKey, text])

  if (!isAnimating) {
    return (
      <span className={`relative inline-block ${className}`}>
        <span className={`block ${className}`}>{currentText}</span>
      </span>
    )
  }

  return (
    <span key={String(triggerKey)} className={`relative inline-block ${className}`}>
      {/* Yeni metin normal akışta, genişlik HER ZAMAN buna göre belirlenir */}
      <span className={`block cross-fade-text-in ${className}`}>{currentText}</span>
      {/* Eski metin mutlak pozisyonda, sadece görsel olarak üstüne bindiriliyor */}
      <span className={`block absolute inset-0 cross-fade-text-out ${className}`}>{previousText}</span>
    </span>
  )
}

export function Header() {
  const {t, setLocale, locale, supportedLocales} = useTranslation()
  const location = useLocation()
  const {data: categories = []} = useCategories()
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isMobileProductsMenuOpen, setIsMobileProductsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Map<string, Product[]>>(new Map())
  const productsTimeoutRef = useRef<number | null>(null)
  const searchPanelRef = useRef<HTMLDivElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const productsButtonRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileMenuFocusTrap = useFocusTrap(isMobileMenuOpen)
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileLocaleTimeoutRef = useRef<number | null>(null)
  const [submenuOffset, setSubmenuOffset] = useState(0)

  const {isLoggedIn} = useAuth()
  const {cartCount, toggleCart} = useCart()
  const [headerOpacity, setHeaderOpacity] = useState(0)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const scrollPositionRef = useRef(0)
  const headerVisibilityLastChanged = useRef(0)
  const lastScrollForHeader = useRef(0) // Header visibility için ayrı scroll takibi
  const [isMobile, setIsMobile] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(56) // 3.5rem = 56px (mobil için varsayılan)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heroBrightness, setHeroBrightness] = useState<number | null>(null)
  const heroBrightnessRef = useRef<number | null>(null)
  const opacitySetByHandleScrollRef = useRef(false) // handleScroll tarafından opacity ayarlandı mı kontrolü için
  // Menü state'lerini ref olarak da tut (scroll handler için)
  const menuStateRef = useRef({
    isLangOpen: false,
    isProductsOpen: false,
    isSearchOpen: false,
    isMobileMenuOpen: false,
  })
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const currentRouteRef = useRef<string>(location.pathname)
  const [isMobileLocaleTransition, setIsMobileLocaleTransition] = useState(false)
  // 2. seçenek (overlay) SADECE: (1) mobilde ve (2) CMS'te açıkça "overlay" seçiliyse aktif olsun.
  const isOverlayMobileMenu = Boolean(
    isMobile && settings && settings.mobileHeaderAnimation === 'overlay'
  )
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    products: Product[]
    designers: Designer[]
    categories: Category[]
  }>({products: [], designers: [], categories: []})
  const [isSearching, setIsSearching] = useState(false)
  const [allData, setAllData] = useState<{
    products: Product[]
    designers: Designer[]
    categories: Category[]
  } | null>(null)

  // Footer content for social links and subscribe
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null)
  const [subscribeEmail, setSubscribeEmailState] = useState('')

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults({products: [], designers: [], categories: []})
  }, [])

  useEffect(() => {
    getSiteSettings().then(setSettings)
    getFooterContent().then(setFooterContent)
  }, [])

  // Route değiştiğinde brightness'i sıfırla ve header opacity'yi ayarla (sayfa geçişlerinde hemen güncelle)
  useEffect(() => {
    // Route değiştiğini ref'e kaydet
    currentRouteRef.current = location.pathname

    // Sayfa değiştiğinde brightness'i hemen sıfırla
    setHeroBrightness(null)
    // Scroll pozisyonunu sıfırla (ScrollToTop component'i bunu yapıyor ama biz de garantilemek için)
    lastScrollYRef.current = 0
    // Flag'i sıfırla (route değiştiğinde)
    opacitySetByHandleScrollRef.current = false
    // Header opacity'yi hemen 0 yap (route değiştiğinde)
    if (isMobile) {
      setHeaderOpacity(0)
    }

    // Sayfa geçişlerinde scroll pozisyonunu kontrol et
    // ScrollToTop component'i scroll'u 0'a ayarlıyor ama biraz gecikme olabilir
    // Bu yüzden kısa bir gecikme ile kontrol ediyoruz
    const checkScroll = () => {
      // Route değiştiyse işlemi durdur
      if (currentRouteRef.current !== location.pathname) {
        return
      }

      const currentScrollY = window.scrollY
      if (isMobile && currentScrollY === 0) {
        // Sayfa en üstteyse ve brightness henüz hesaplanmadıysa, header'ı şeffaf yap
        setHeaderOpacity(0)
      }
    }
    // Hemen kontrol et
    checkScroll()
    // ScrollToTop'un çalışması için kısa bir gecikme ile tekrar kontrol et
    const timeoutId = setTimeout(checkScroll, 50)
    return () => clearTimeout(timeoutId)
  }, [location.pathname, isMobile])

  // Sayfanın üst kısmındaki görselin parlaklığını kontrol et (tüm cihazlarda, sadece en üstteyken)
  useEffect(() => {
    // Sadece sayfa en üstteyken parlaklığı hesapla
    if (window.scrollY > 0) {
      setHeroBrightness(null)
      return
    }

    // Route değiştiğinde brightness'i sıfırla ve hesaplamayı durdur
    const currentPath = location.pathname
    let isCancelled = false

    const checkTopImageBrightness = () => {
      // Route değiştiyse hesaplamayı durdur
      if (location.pathname !== currentPath) {
        isCancelled = true
        return
      }

      // Scroll pozisyonu değiştiyse (artık 0 değilse) durdur
      if (window.scrollY > 0) {
        setHeroBrightness(null)
        return
      }
      // Sayfanın en üst kısmındaki görseli bul (viewport'un üst kısmı)
      // Önce hero section'ı kontrol et
      let activeMedia: HTMLImageElement | HTMLVideoElement | null = null

      // 1. Hero section'daki görseli kontrol et
      const heroContainer = document.querySelector('.hero-scroll-container')
      if (heroContainer) {
        const slides = heroContainer.querySelectorAll('.hero-slide-mobile, [class*="hero-slide"]')
        for (const slide of Array.from(slides)) {
          const img = slide.querySelector('img') as HTMLImageElement
          const video = slide.querySelector('video') as HTMLVideoElement

          if (img && img.complete) {
            activeMedia = img
            break
          } else if (video && video.readyState >= 2) {
            activeMedia = video
            break
          }
        }
      }

      // 2. Hero section yoksa, main element'in ilk görselini bul
      if (!activeMedia) {
        const main = document.querySelector('main')
        if (main) {
          // Main'in ilk section veya div'ini bul
          const firstSection = main.querySelector('section, div, img, video') as HTMLElement
          if (firstSection) {
            // İlk img veya video'yu bul
            const img = firstSection.querySelector('img') as HTMLImageElement
            const video = firstSection.querySelector('video') as HTMLVideoElement

            if (img && img.complete && img.offsetTop < 500) {
              // Viewport'un üst kısmında
              activeMedia = img
            } else if (video && video.readyState >= 2 && video.offsetTop < 500) {
              activeMedia = video
            }
          }
        }
      }

      // 3. Hala bulamadıysak, viewport'un üst kısmındaki tüm img/video'ları kontrol et
      if (!activeMedia) {
        const allImages = document.querySelectorAll('img, video')
        for (const media of Array.from(allImages)) {
          const rect = media.getBoundingClientRect()
          // Viewport'un üst 500px'inde olan ve yüklenmiş görseli bul
          if (rect.top >= 0 && rect.top < 500 && rect.left >= 0 && rect.left < window.innerWidth) {
            if (media instanceof HTMLImageElement && media.complete) {
              activeMedia = media
              break
            } else if (media instanceof HTMLVideoElement && media.readyState >= 2) {
              activeMedia = media
              break
            }
          }
        }
      }

      if (!activeMedia) {
        if (!isCancelled) {
          setHeroBrightness(null)
        }
        return
      }

      // Route değiştiyse hesaplamayı durdur
      if (location.pathname !== currentPath || isCancelled) {
        return
      }

      // Canvas kullanarak görselin parlaklığını hesapla
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = Math.min(activeMedia.width || activeMedia.offsetWidth || 100, 200)
      canvas.height = Math.min(activeMedia.height || activeMedia.offsetHeight || 100, 200)

      try {
        ctx.drawImage(activeMedia, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Route değiştiyse hesaplamayı durdur (async işlem sırasında)
        if (location.pathname !== currentPath || isCancelled) {
          return
        }

        // Ortalama parlaklığı hesapla
        let totalBrightness = 0
        let pixelCount = 0

        // Her 10. pikseli örnekle (performans için)
        const sampleRate = 10
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          // Route değiştiyse hesaplamayı durdur
          if (location.pathname !== currentPath || isCancelled) {
            return
          }

          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          // Luminance formülü: 0.299*R + 0.587*G + 0.114*B
          if (r !== undefined && g !== undefined && b !== undefined) {
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            totalBrightness += brightness
            pixelCount++
          }
        }

        // Route değiştiyse sonucu kaydetme
        if (location.pathname !== currentPath || isCancelled) {
          return
        }

        if (pixelCount > 0) {
          const avgBrightness = totalBrightness / pixelCount
          setHeroBrightness(avgBrightness)
        } else {
          setHeroBrightness(null)
        }
      } catch (e) {
        // Route değiştiyse hata işleme yapma
        if (location.pathname !== currentPath || isCancelled) {
          return
        }

        // CORS hatası veya başka bir hata - sessizce handle et
        // Cross-origin görseller için brightness hesaplanamaz, bu normal
        const errorMessage = e instanceof Error ? e.message : String(e)
        if (
          e instanceof DOMException ||
          errorMessage.includes('tainted') ||
          errorMessage.includes('SecurityError') ||
          errorMessage.includes('cross-origin')
        ) {
          setHeroBrightness(null)
        } else {
          setHeroBrightness(null)
        }
      }
    }

    // Görsel yüklendikten sonra kontrol et - sayfa geçişlerinde daha hızlı
    // Route değiştiğinde hemen kontrol et (sayfa geçişlerinde)
    const immediateTimeoutId = setTimeout(checkTopImageBrightness, 100)
    const timeoutId = setTimeout(checkTopImageBrightness, 500)
    const intervalId = setInterval(checkTopImageBrightness, 2000) // Her 2 saniyede bir kontrol et

    return () => {
      clearTimeout(immediateTimeoutId)
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [isMobile, location.pathname])

  // Mobil kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Koyu hero olan sayfaları kontrol et
  const isDarkHeroPage = () => {
    const path = location.pathname
    // HashRouter'da path / veya /about gibi gelir
    return path === '/' || path === '' || path.includes('about')
  }

  // Açık arka planlı sayfaları kontrol et (hero olmayan)
  const isLightBackgroundPage = () => {
    const path = location.pathname
    // Bu sayfalarda hero yok ve arka plan açık renk
    // NOT: /projects/123 gibi detay sayfaları hariç (onlar beyaz arka planlı)
    // NOT: /products/123 gibi detay sayfaları hariç (onlarda hero var)
    // NOT: /news/123 gibi detay sayfaları hariç (onlar beyaz arka planlı)
    // NOT: /designer/123 gibi detay sayfaları hariç (onlar beyaz arka planlı)
    const isProjectsList = path === '/projects' || path === '/projects/'
    const isProductsList = path === '/products' || path === '/products/' || path.match(/^\/products\/?$/)
    const isNewsList = path === '/news' || path === '/news/'
    const isDesignersList = path === '/designers' || path === '/designers/'
    
    return isProjectsList || 
           isProductsList || 
           isNewsList ||
           isDesignersList ||
           path.includes('contact') ||
           path.includes('cart') ||
           path.includes('favorites') ||
           path.includes('profile') ||
           path.includes('orders') ||
           path.includes('search')
  }

  // Beyaz arka planlı sayfa (detay sayfaları)
  const isWhiteBackgroundPage = () => {
    const path = location.pathname
    // Proje detay, haberler detay, ürün detay ve tasarımcı detay sayfaları beyaz arka planlı
    // NOT: Ürün detay route'u /product/:productId şeklinde (tekil)
    const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
    const isProductDetail = path.match(/^\/product\/[^/]+$/)
    const isNewsDetail = path.match(/^\/news\/[^/]+$/)
    const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
    return isProjectDetail || isProductDetail || isNewsDetail || isDesignerDetail
  }

  // heroBrightness değiştiğinde ref'i güncelle ve opacity'yi ayarla
  useEffect(() => {
    heroBrightnessRef.current = heroBrightness
    
    // Products menüsü açıkken opacity'yi değiştirme
    if (isProductsOpen) return
    
    // Sayfa en üstteyken (scrollY <= 10) opacity'yi ayarla
    if (window.scrollY <= 10) {
      // Projeler, haberler ve tasarımcılar sayfalarını kontrol et (ana sayfa ve detay sayfası)
      const path = location.pathname
      const isProjectsList = path === '/projects' || path === '/projects/'
      const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
      const isNewsList = path === '/news' || path === '/news/'
      const isNewsDetail = path.match(/^\/news\/[^/]+$/)
      const isDesignersList = path === '/designers' || path === '/designers/'
      const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
      
      // Projeler, haberler ve tasarımcılar ana sayfası ve detay sayfasında her zaman yarı şeffaf (renk kontrolü yapma)
      if (isProjectsList || isProjectDetail || isNewsList || isNewsDetail || isDesignersList || isDesignerDetail) {
        setHeaderOpacity(0.7)
        return
      }
      
      if (isDarkHeroPage()) {
        setHeaderOpacity(0)
        return
      }
      
      // Beyaz arka planlı detay sayfalarında (ürün) her zaman yarı şeffaf
      // Çünkü hero görseli koyu olsa bile arka plan beyaz
      if (isWhiteBackgroundPage()) {
        setHeaderOpacity(0.7)
        return
      }
      
      // Diğer sayfalar için heroBrightness'a bak
      if (heroBrightness !== null) {
        if (heroBrightness >= 0.7) {
          setHeaderOpacity(0.75)
        } else if (heroBrightness >= 0.5) {
          setHeaderOpacity(0.65)
        } else if (heroBrightness > 0.4) {
          const adjustedOpacity = Math.min(0.75, 0.2 + (heroBrightness - 0.4) * 1.2)
          setHeaderOpacity(adjustedOpacity)
        } else {
          setHeaderOpacity(0)
        }
      } else {
        setHeaderOpacity(0.7)
      }
    }
  }, [heroBrightness, location.pathname, isProductsOpen])

  // Sayfa değiştiğinde header opacity'yi ayarla
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.scrollY <= 10 && !isProductsOpen) {
        // Projeler, haberler ve tasarımcılar sayfalarını kontrol et (ana sayfa ve detay sayfası)
        const path = location.pathname
        const isProjectsList = path === '/projects' || path === '/projects/'
        const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
        const isNewsList = path === '/news' || path === '/news/'
        const isNewsDetail = path.match(/^\/news\/[^/]+$/)
        const isDesignersList = path === '/designers' || path === '/designers/'
        const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
        
        // Projeler, haberler ve tasarımcılar ana sayfası ve detay sayfasında her zaman yarı şeffaf (renk kontrolü yapma)
        if (isProjectsList || isProjectDetail || isNewsList || isNewsDetail || isDesignersList || isDesignerDetail) {
          setHeaderOpacity(0.7)
        } else if (isDarkHeroPage()) {
          setHeaderOpacity(0)
        } else if (isLightBackgroundPage() || isWhiteBackgroundPage()) {
          setHeaderOpacity(0.7) // Açık/beyaz arka planlı sayfalarda yarı şeffaf
        }
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [location.pathname])

  // Products menüsü açılınca header'ı yarı şeffaf yap
  useEffect(() => {
    if (isProductsOpen) {
      setHeaderOpacity(0.85)
    } else if (window.scrollY <= 10) {
      // Projeler, haberler ve tasarımcılar sayfalarını kontrol et (ana sayfa ve detay sayfası)
      const path = location.pathname
      const isProjectsList = path === '/projects' || path === '/projects/'
      const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
      const isNewsList = path === '/news' || path === '/news/'
      const isNewsDetail = path.match(/^\/news\/[^/]+$/)
      const isDesignersList = path === '/designers' || path === '/designers/'
      const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
      
      // Projeler, haberler ve tasarımcılar ana sayfası ve detay sayfasında her zaman yarı şeffaf (renk kontrolü yapma)
      if (isProjectsList || isProjectDetail || isNewsList || isNewsDetail || isDesignersList || isDesignerDetail) {
        setHeaderOpacity(0.7)
      } else if (isDarkHeroPage()) {
        setHeaderOpacity(0)
      } else if (isLightBackgroundPage() || isWhiteBackgroundPage()) {
        setHeaderOpacity(0.7)
      }
    }
  }, [isProductsOpen, location.pathname])

  // Desktop header visibility - throttle olmadan anında tepki
  useEffect(() => {
    if (isMobile) return

    const handleHeaderVisibility = () => {
      const currentY = window.scrollY
      const lastY = lastScrollForHeader.current
      
      // Sayfa en üstündeyken her zaman görünür
      if (currentY < 150) {
        setIsHeaderVisible(true)
        lastScrollForHeader.current = currentY
        return
      }
      
      const diff = currentY - lastY
      
      // Sadece belirgin scroll hareketlerine tepki ver (15px+)
      if (Math.abs(diff) > 15) {
        if (diff > 0) {
          // Aşağı scroll - gizle
          setIsHeaderVisible(false)
        } else {
          // Yukarı scroll - göster
          setIsHeaderVisible(true)
        }
        lastScrollForHeader.current = currentY
      }
    }

    window.addEventListener('scroll', handleHeaderVisibility, {passive: true})
    return () => window.removeEventListener('scroll', handleHeaderVisibility)
  }, [isMobile])

  // Menü state'leri değiştiğinde ref'i güncelle (scroll handler stale closure'dan kaçınmak için)
  useEffect(() => {
    menuStateRef.current = {
      isLangOpen,
      isProductsOpen,
      isSearchOpen,
      isMobileMenuOpen,
    }
  }, [isLangOpen, isProductsOpen, isSearchOpen, isMobileMenuOpen])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const currentPath = currentRouteRef.current
      // Ref'lerden güncel değerleri al (stale closure'dan kaçınmak için)
      const currentHeroBrightness = heroBrightnessRef.current
      const { isMobileMenuOpen: menuOpen, isSearchOpen: searchOpen, isLangOpen: langOpen, isProductsOpen: productsOpen } = menuStateRef.current

      // Route değiştiyse işlemi durdur
      if (currentPath !== location.pathname) {
        return
      }

      // Mobilde: Özel davranış
      if (isMobile) {
        // Mobil menü veya arama AÇIKKEN scroll davranışını kilitle;
        // header sabit kalsın, yukarı-aşağı zıplamasın.
        if (menuOpen || searchOpen) {
          setHeaderOpacity(menuOpen ? 0.75 : 0.7)
          setIsHeaderVisible(true)
          lastScrollYRef.current = currentScrollY
          return
        }

        // Mobilde: Sayfa en üstteyken (scrollY = 0) şeffaflığı ayarla
        if (currentScrollY === 0) {
          // Route değiştiyse brightness kullanma
          if (currentPath !== location.pathname) {
            setHeaderOpacity(0)
            setIsHeaderVisible(true)
            opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
          } else {
            // Projeler ve haberler sayfalarını önce kontrol et (ana sayfa ve detay sayfası)
            const path = location.pathname
            const isProjectsList = path === '/projects' || path === '/projects/'
            const isProjectDetailPage = path.match(/^\/projects\/[^/]+$/)
            const isNewsList = path === '/news' || path === '/news/'
            const isNewsDetailPage = path.match(/^\/news\/[^/]+$/)
            const isDesignersList = path === '/designers' || path === '/designers/'
            const isDesignerDetailPage = path.match(/^\/designer\/[^/]+$/)
            const isProductDetailPage = path.match(/^\/product\/[^/]+$/)
            
            // Projeler, haberler ve tasarımcılar ana sayfası ve detay sayfasında her zaman yarı şeffaf (renk kontrolü yapma)
            if (isProjectsList || isProjectDetailPage || isNewsList || isNewsDetailPage || isDesignersList || isDesignerDetailPage) {
              setHeaderOpacity(0.7)
              opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
            } else if (isProductDetailPage) {
              // Ürün detay sayfalarında her zaman yarı şeffaf (görsel koyu olsa bile arka plan beyaz)
              setHeaderOpacity(0.7)
              opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
            } else if (currentHeroBrightness !== null) {
              // Route değiştiyse brightness kullanma (double check)
              if (currentPath !== location.pathname) {
                setHeaderOpacity(0)
                setIsHeaderVisible(true)
                opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
              } else if (currentHeroBrightness >= 0.7) {
                // Çok açık / beyaza yakın görseller - minimum opacity garantile
                setHeaderOpacity(0.75)
                opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
              } else if (currentHeroBrightness >= 0.5) {
                // Açık arka plan - minimum opacity garantile
                setHeaderOpacity(0.65)
                opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
              } else if (currentHeroBrightness > 0.4) {
                // Orta-açık arka plan
                const adjustedOpacity = Math.min(0.75, 0.2 + (currentHeroBrightness - 0.4) * 1.2)
                setHeaderOpacity(adjustedOpacity)
                opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
              } else {
                // Görsel koyu, header tamamen şeffaf
                setHeaderOpacity(0)
                opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
              }
            } else {
            // Brightness hesaplanamadı (CORS vb.) veya henüz hesaplanmadı
            // Sayfa türüne göre opacity belirle
            const path = location.pathname
            const isProjectsList = path === '/projects' || path === '/projects/'
            const isProductsList = path === '/products' || path === '/products/' || path.match(/^\/products\/?$/)
            const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
            const isProductDetail = path.match(/^\/product\/[^/]+$/)
            const isNewsList = path === '/news' || path === '/news/'
            const isNewsDetail = path.match(/^\/news\/[^/]+$/)
            const isDesignersList = path === '/designers' || path === '/designers/'
            const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
            const isLightPage = isProjectsList || 
                               isProductsList || 
                               isProjectDetail ||
                               isProductDetail ||
                               isNewsList ||
                               isNewsDetail ||
                               isDesignersList ||
                               isDesignerDetail ||
                               path.includes('contact') ||
                               path.includes('cart') ||
                               path.includes('favorites') ||
                               path.includes('profile') ||
                               path.includes('orders') ||
                               path.includes('search')
            
            if (isLightPage) {
              setHeaderOpacity(0.7) // Açık/beyaz arka planlı sayfalarda yarı şeffaf
            } else {
              setHeaderOpacity(0) // Koyu sayfalarda şeffaf
            }
            opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
            }
          }
          setIsHeaderVisible(true) // Sayfa en üstteyken menü görünür
        } else {
          // Projeler, haberler ve tasarımcılar sayfalarında scroll yapıldığında da opacity sabit kalmalı
          const path = location.pathname
          const isProjectsList = path === '/projects' || path === '/projects/'
          const isProjectDetailPage = path.match(/^\/projects\/[^/]+$/)
          const isNewsList = path === '/news' || path === '/news/'
          const isNewsDetailPage = path.match(/^\/news\/[^/]+$/)
          const isDesignersList = path === '/designers' || path === '/designers/'
          const isDesignerDetailPage = path.match(/^\/designer\/[^/]+$/)
          
          if (isProjectsList || isProjectDetailPage || isNewsList || isNewsDetailPage || isDesignersList || isDesignerDetailPage) {
            // Projeler, haberler ve tasarımcılar sayfalarında her zaman yarı şeffaf (renk kontrolü yapma)
            setHeaderOpacity(0.7)
            opacitySetByHandleScrollRef.current = true
          } else {
            // Scroll yapıldıkça opacity artıyor
            opacitySetByHandleScrollRef.current = false // Scroll yapıldı, checkOpacityOnScrollEnd çalışabilir
            const maxScroll = 200
            const opacity = Math.min(0.75, (currentScrollY / maxScroll) * 0.75)
            setHeaderOpacity(opacity)
          }

          // Mobilde de scroll yönüne göre header'ı gizle/göster
          const now = Date.now()
          const timeSinceLastChange = now - (headerVisibilityLastChanged.current || 0)
          
          if (timeSinceLastChange > 150) {
            const scrollDiff = currentScrollY - lastScrollYRef.current
            if (scrollDiff > 20) {
              setIsHeaderVisible(false)
              headerVisibilityLastChanged.current = now
            } else if (scrollDiff < -20) {
              setIsHeaderVisible(true)
              headerVisibilityLastChanged.current = now
            }
          }
        }
        lastScrollYRef.current = currentScrollY
      } else {
        // Desktop header visibility artık ayrı useEffect ile yönetiliyor
        // Burada sadece arama açıkken görünür tutuyoruz
        if (searchOpen) {
          setIsHeaderVisible(true)
        }

        lastScrollYRef.current = currentScrollY

        // Projeler, haberler ve tasarımcılar sayfalarını kontrol et (ana sayfa ve detay sayfası)
        const path = location.pathname
        const isProjectsList = path === '/projects' || path === '/projects/'
        const isProjectDetailPage = path.match(/^\/projects\/[^/]+$/)
        const isNewsList = path === '/news' || path === '/news/'
        const isNewsDetailPage = path.match(/^\/news\/[^/]+$/)
        const isDesignersList = path === '/designers' || path === '/designers/'
        const isDesignerDetailPage = path.match(/^\/designer\/[^/]+$/)

        // Projeler, haberler ve tasarımcılar ana sayfası ve detay sayfasında her zaman yarı şeffaf (renk kontrolü yapma)
        if (isProjectsList || isProjectDetailPage || isNewsList || isNewsDetailPage || isDesignersList || isDesignerDetailPage) {
          // Projeler, haberler ve tasarımcılar sayfalarında scroll yapıldığında da opacity sabit kalmalı
          setHeaderOpacity(0.7)
          opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
        } else {
          const maxScroll = 200
          let opacity = 0.1

          if (currentScrollY > 0) {
            opacity = Math.min(0.75, 0.1 + (currentScrollY / maxScroll) * 0.65)
            opacitySetByHandleScrollRef.current = false // Scroll yapıldı, checkOpacityOnScrollEnd çalışabilir
          } else {
            // Desktop'ta sayfa en üstteyken opacity ayarlanıyor
            opacitySetByHandleScrollRef.current = true // handleScroll tarafından ayarlandı
          }

          setHeaderOpacity(opacity)
        }
      }

      // Scroll sırasında açık menüleri kapat
      const scrollDelta = Math.abs(currentScrollY - lastScrollYRef.current)
      if (scrollDelta > 3) {
        // En az 3px scroll yapıldıysa
        if (isMobile) {
          // Mobilde: Scroll timeout'u temizle ve yeni bir tane başlat
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
          }

          // Hemen kapat (gecikme yok) — fakat mobil menü açıksa onu kapatma,
          // aksi halde hamburger'e tıklandığında oluşan küçük scroll'larda menü anlık kapanabiliyor.
          if (langOpen) setIsLangOpen(false)
          if (productsOpen) setIsProductsOpen(false)
          if (searchOpen) closeSearch()
          // if (menuOpen) setIsMobileMenuOpen(false) // scroll ile mobil menüyü artık kapatmıyoruz
        } else {
          // Desktop'ta: Arama açıksa kapat
          if (searchOpen) closeSearch()
          if (langOpen) setIsLangOpen(false)
          if (productsOpen) setIsProductsOpen(false)
        }
      }
    }

    // Scroll listener - header visibility için hızlı tepki
    let scrollListener: (() => void) | null = null
    let rafId: number | null = null
    let lastScrollTime = 0
    const SCROLL_THROTTLE_MS = 50 // 50ms throttle - hızlı tepki için

    const throttledHandleScroll = () => {
      const now = Date.now()
      if (now - lastScrollTime < SCROLL_THROTTLE_MS) {
        // Throttle: Sadece bir RAF beklet, birden fazla queue etme
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            rafId = null
            // Throttle süresini kontrol et
            if (Date.now() - lastScrollTime >= SCROLL_THROTTLE_MS) {
              lastScrollTime = Date.now()
              handleScroll()
            }
          })
        }
        return
      }
      lastScrollTime = now
      handleScroll()
    }

    // Scroll bittiğinde sadece şeffaflık kontrolü (görünürlüğe dokunma)
    let scrollEndTimeout: ReturnType<typeof setTimeout> | null = null
    
    const checkOpacityOnScrollEnd = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop
      
      // Sayfa en üstteyse şeffaflık durumunu kontrol et
      // Ancak handleScroll zaten opacity'yi ayarladıysa çift kontrol yapma
      if (currentScrollY <= 10) {
        // handleScroll zaten opacity'yi ayarladıysa, checkOpacityOnScrollEnd çalışmasın
        if (opacitySetByHandleScrollRef.current) {
          // Flag'i sıfırla ki bir sonraki scroll'da tekrar çalışabilsin
          opacitySetByHandleScrollRef.current = false
          return
        }
        
        const path = location.pathname
        const isProjectsList = path === '/projects' || path === '/projects/'
        const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
        const isNewsList = path === '/news' || path === '/news/'
        const isNewsDetail = path.match(/^\/news\/[^/]+$/)
        const isDesignersList = path === '/designers' || path === '/designers/'
        const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
        
        // Projeler, haberler ve tasarımcılar ana sayfası ve detay sayfasında her zaman yarı şeffaf (renk kontrolü yapma)
        if (isProjectsList || isProjectDetail || isNewsList || isNewsDetail || isDesignersList || isDesignerDetail) {
          setHeaderOpacity(0.7)
        } else {
          const isProductsList = path === '/products' || path === '/products/' || path.match(/^\/products\/?$/)
          const isProductDetail = path.match(/^\/product\/[^/]+$/)
          const isDesignersList = path === '/designers' || path === '/designers/'
          const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
          const isLightPage = isProductsList || 
                             isProductDetail ||
                             isDesignersList ||
                             isDesignerDetail ||
                             path.includes('contact') ||
                             path.includes('cart') ||
                             path.includes('favorites') ||
                             path.includes('profile') ||
                             path.includes('orders') ||
                             path.includes('search')
          
          if (isLightPage) {
            setHeaderOpacity(0.7) // Açık/beyaz arka planlı sayfalarda yarı şeffaf
          } else if (heroBrightnessRef.current !== null) {
            if (heroBrightnessRef.current < 0.5) {
              setHeaderOpacity(0) // Koyu hero - şeffaf header
            } else {
              setHeaderOpacity(0.7) // Açık hero - yarı şeffaf header
            }
          }
        }
      } else {
        // Scroll yapıldı, flag'i sıfırla
        opacitySetByHandleScrollRef.current = false
      }
      // Header görünürlüğüne dokunma - kullanıcı nereye scroll yaptıysa orada kalsın
    }

    const handleScrollWithEnd = () => {
      throttledHandleScroll()
      // Scroll bittiğinde kontrol et
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout)
      scrollEndTimeout = setTimeout(checkOpacityOnScrollEnd, 150)
    }

    const initializeScrollListener = () => {
      scrollListener = handleScrollWithEnd
      // İlk yüklemede şeffaflığı ayarla (throttle olmadan)
      handleScroll()
      window.addEventListener('scroll', handleScrollWithEnd, {passive: true})
    }

    // Scroll listener'ı hemen başlat (gecikme yok)
    // State değişikliklerinde useEffect yeniden çalıştığında listener yeniden kurulacak
    // Ama artık state'lere ref üzerinden eriştiğimiz için dependency array minimize edildi
    initializeScrollListener()

    return () => {
      if (scrollListener) {
        window.removeEventListener('scroll', scrollListener)
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (scrollEndTimeout) {
        clearTimeout(scrollEndTimeout)
      }
    }
  // Sadece isMobile ve location.pathname değiştiğinde yeniden kur
  // Diğer state'lere ref üzerinden erişiyoruz
  }, [isMobile, location.pathname, closeSearch])

  // Mobil menü açıldığında/kapandığında opacity'yi güncelle
  useEffect(() => {
    if (isMobile) {
      if (isMobileMenuOpen) {
        setHeaderOpacity(0.75)
        setIsHeaderVisible(true)
      } else if (isSearchOpen) {
        // Arama açıldığında arama paneli ile aynı opacity (0.7)
        setHeaderOpacity(0.7)
        setIsHeaderVisible(true)
      } else {
        // Menü ve arama kapalıysa, scroll handler opacity'yi ayarlayacak
        // Bu effect sadece menü/arama açıkken opacity'yi override eder
        // Scroll handler zaten route değiştiğinde opacity'yi 0 yapıyor
      }
    }
  }, [isMobile, isMobileMenuOpen, isSearchOpen, location.pathname])

  // Mobil menü AÇIKKEN body scroll'unu kilitle (header'ın yukarı-aşağı zıplamasını engelle)
  useEffect(() => {
    if (!isMobile) return

    if (isMobileMenuOpen) {
      // Mevcut scroll pozisyonunu kaydet
      scrollPositionRef.current = window.scrollY

      // Body scroll'unu kilitle
      const body = document.body
      body.style.position = 'fixed'
      body.style.top = `-${scrollPositionRef.current}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
    } else {
      // Menü kapanınca body scroll'unu eski haline getir
      const body = document.body
      const scrollY = scrollPositionRef.current

      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''

      if (scrollY > 0) {
        window.scrollTo(0, scrollY)
      }
    }

    return () => {
      // Cleanup: herhangi bir nedenle effect yeniden çalışırsa style'ları sıfırla
      if (!isMobileMenuOpen) {
        const body = document.body
        body.style.position = ''
        body.style.top = ''
        body.style.left = ''
        body.style.right = ''
        body.style.width = ''
        body.style.overflow = ''
      }
    }
  }, [isMobile, isMobileMenuOpen])

  // Mobil menü kapalıyken odaklanılmasını tamamen engelle (inert davranışı)
  useEffect(() => {
    const menuEl = mobileMenuRef.current
    if (!menuEl) return

    try {
      ;(menuEl as any).inert = !isMobileMenuOpen
    } catch {
      // Eski tarayıcılar inert'i desteklemiyorsa sessizce yoksay
    }
  }, [isMobileMenuOpen])

  // Hover edilen kategorinin ürünlerini yükle (eğer menuImage yoksa)
  const hoveredCategory = categories.find(c => c.id === hoveredCategoryId)
  const shouldFetchProducts = hoveredCategoryId && hoveredCategory && !hoveredCategory.menuImage
  const {data: hoveredCategoryProducts = []} = useProductsByCategory(
    shouldFetchProducts ? hoveredCategoryId : undefined
  )

  useEffect(() => {
    if (!hoveredCategoryId || !hoveredCategoryProducts.length) return
    const category = categories.find(c => c.id === hoveredCategoryId)
    if (!category || category.menuImage) return

    setCategoryProducts(prev => {
      const newMap = new Map(prev)
      newMap.set(category.id, hoveredCategoryProducts)
      return newMap
    })
  }, [hoveredCategoryId, hoveredCategoryProducts, categories])

  // Header yüksekliğini güncelle
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerContainerRef.current) {
        const height = headerContainerRef.current.offsetHeight
        setHeaderHeight(height)
      }
    }

    updateHeaderHeight()

    // Header yüksekliği değiştiğinde güncelle (menü açıldığında/kapandığında)
    const observer = new ResizeObserver(updateHeaderHeight)
    if (headerContainerRef.current) {
      observer.observe(headerContainerRef.current)
    }

    return () => {
      if (headerContainerRef.current) {
        observer.unobserve(headerContainerRef.current)
      }
    }
  }, [isMobileMenuOpen, isProductsOpen])

  // Keep submenu aligned under the PRODUCTS button
  const updateSubmenuOffset = useCallback(() => {
    const btn = productsButtonRef.current
    const headerEl = headerContainerRef.current
    if (!btn || !headerEl) return
    const btnRect = btn.getBoundingClientRect()
    const headerRect = headerEl.getBoundingClientRect()
    const offset = Math.max(0, Math.round(btnRect.left - headerRect.left))
    setSubmenuOffset(offset)
  }, [])

  useEffect(() => {
    if (isProductsOpen) {
      updateSubmenuOffset()
    }
  }, [isProductsOpen, updateSubmenuOffset, locale])

  useEffect(() => {
    const onResize = () => updateSubmenuOffset()
    window.addEventListener('resize', onResize, {passive: true})
    return () => window.removeEventListener('resize', onResize)
  }, [updateSubmenuOffset])

  // Focus search input when search panel opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      // Small delay to ensure the panel is visible
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchOpen])

  // Fetch all data for search when the search modal is opened for the first time.
  useEffect(() => {
    if (isSearchOpen && !allData) {
      setIsSearching(true)
      Promise.all([getProducts(), getDesigners(), getCategories()])
        .then(([products, designers, categories]) => {
          setAllData({products, designers, categories})
          setIsSearching(false)
        })
        .catch(() => {
          setIsSearching(false)
        })
    }
  }, [isSearchOpen, allData])

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({products: [], designers: [], categories: []})
      return
    }

    if (!allData) return

    setIsSearching(true)
    const handler = setTimeout(() => {
      const lowercasedQuery = searchQuery.toLowerCase().trim()
      if (!lowercasedQuery) {
        setSearchResults({products: [], designers: [], categories: []})
        setIsSearching(false)
        return
      }

      // Arama kelimelerini ayır (örn: "kanepe su" -> ["kanepe", "su"])
      const searchTerms = lowercasedQuery.split(/\s+/).filter(term => term.length > 0)

      // Ürünleri filtrele - ürün adı, kategori adı veya tasarımcı adına göre
      const filteredProducts = allData.products.filter(p => {
        const productName = t(p.name).toLowerCase()
        const category = allData.categories.find(c => c.id === p.categoryId)
        const categoryName = category ? t(category.name).toLowerCase() : ''
        const designer = allData.designers.find(d => d.id === p.designerId)
        const designerName = designer ? t(designer.name).toLowerCase() : ''

        // Tüm aranabilir metin
        const searchableText = `${productName} ${categoryName} ${designerName}`

        // Tüm arama terimleri eşleşmeli (AND mantığı)
        return searchTerms.every(term => searchableText.includes(term))
      })

      const filteredDesigners = allData.designers.filter(d => {
        const designerName = t(d.name).toLowerCase()
        return searchTerms.every(term => designerName.includes(term))
      })

      const filteredCategories = allData.categories.filter(c => {
        const categoryName = t(c.name).toLowerCase()
        return searchTerms.every(term => categoryName.includes(term))
      })

      setSearchResults({
        products: filteredProducts,
        designers: filteredDesigners,
        categories: filteredCategories,
      })
      setIsSearching(false)
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, allData, t])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      // Search panel için - sadece mouse event'lerde çalış (touch'da sorun yaratıyor)
      if (event.type === 'mousedown' && isSearchOpen) {
        if (
          searchPanelRef.current &&
          !searchPanelRef.current.contains(target) &&
          searchButtonRef.current &&
          !searchButtonRef.current.contains(target)
        ) {
          closeSearch()
        }
      }

      // Mobil menü için
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    // Touch event'i kaldırdık - arama paneli için sorun yaratıyordu
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen, isMobileMenuOpen, closeSearch])

  const handleProductsEnter = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current)
      productsTimeoutRef.current = null
    }
    setHoveredCategoryId(null) // Menü açıldığında görsel alanı temizle
    setIsProductsOpen(true)
  }

  const handleProductsLeave = () => {
    productsTimeoutRef.current = window.setTimeout(() => {
      setIsProductsOpen(false)
      setHoveredCategoryId(null) // Menü kapandığında görsel alanı temizle
      productsTimeoutRef.current = null
    }, 200)
  }

  const handleCloseProducts = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current)
      productsTimeoutRef.current = null
    }
    setIsProductsOpen(false)
    setHoveredCategoryId(null) // Menü kapandığında görsel alanı temizle
  }

  const navLinkClasses =
    'tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300 header-nav-item'
  const activeLinkClasses = {
    color: 'white',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    opacity: 1,
  }
  const iconClasses =
    'text-white hover:text-gray-200 transition-all duration-300 transform hover:scale-125'

  const mobileMenuLinks: {to: string; label: string}[] = [
    {to: '/designers', label: (t('designers') || '').toLocaleUpperCase('en')},
    {to: '/projects', label: (t('projects') || 'Projeler').toLocaleUpperCase('en')},
    {to: '/news', label: (t('news') || '').toLocaleUpperCase('en')},
    {to: '/about', label: (t('about') || '').toLocaleUpperCase('en')},
    {to: '/contact', label: (t('contact') || '').toLocaleUpperCase('en')},
  ]

  // Mobil overlay menü kapanırken önce yazıların kaybolup sonra panelin animasyonla kapanması için (biraz daha hızlı)
  const mobileMenuCloseDelay = mobileMenuLinks.length * 80 + 80

  // Overlay mobil menüde: kapanma animasyonu süresince header rengini sabit siyah tut
  useEffect(() => {
    if (!isOverlayMobileMenu || !isMobile) {
      // Overlay modunda değilsek veya mobil değilsek zamanlayıcıyı temizle
      if (mobileMenuCloseTimeoutRef.current) {
        clearTimeout(mobileMenuCloseTimeoutRef.current)
        mobileMenuCloseTimeoutRef.current = null
      }
      setIsMobileMenuClosing(false)
      return
    }

    if (isMobileMenuOpen) {
      // Menü tekrar açıldıysa: closing durumunu iptal et
      setIsMobileMenuClosing(false)
      if (mobileMenuCloseTimeoutRef.current) {
        clearTimeout(mobileMenuCloseTimeoutRef.current)
        mobileMenuCloseTimeoutRef.current = null
      }
      return
    }

    // Menü kapanıyorsa: kapanma animasyonu süresince header siyah kalsın
    setIsMobileMenuClosing(true)
    if (mobileMenuCloseTimeoutRef.current) {
      clearTimeout(mobileMenuCloseTimeoutRef.current)
    }
    mobileMenuCloseTimeoutRef.current = setTimeout(() => {
      setIsMobileMenuClosing(false)
      mobileMenuCloseTimeoutRef.current = null
    }, mobileMenuCloseDelay + 500)

    return () => {
      if (mobileMenuCloseTimeoutRef.current) {
        clearTimeout(mobileMenuCloseTimeoutRef.current)
        mobileMenuCloseTimeoutRef.current = null
      }
    }
  }, [isMobileMenuOpen, isOverlayMobileMenu, isMobile, mobileMenuCloseDelay])

  const NavItem: React.FC<{
    to: string
    children: React.ReactNode
    onMouseEnter?: () => void
    onClick?: () => void
  }> = ({to, children, onMouseEnter, onClick}) => {
    const baseStyle = {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      fontFamily: 'inherit',
      lineHeight: '1.25rem',
    }
    return (
      <NavLink
        to={to}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={`relative group py-2 ${navLinkClasses}`}
        style={({isActive}) => ({...(isActive ? activeLinkClasses : {}), ...baseStyle})}
      >
        <span
          className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase header-nav-text"
          style={baseStyle}
        >
          {children}
          <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
        </span>
      </NavLink>
    )
  }

  const handleMobileLocaleChange = (langCode: string) => {
    if (locale === langCode) return

    setIsMobileLocaleTransition(true)
    if (mobileLocaleTimeoutRef.current) {
      window.clearTimeout(mobileLocaleTimeoutRef.current)
    }
    mobileLocaleTimeoutRef.current = window.setTimeout(() => {
      setIsMobileLocaleTransition(false)
    }, 400)

    setLocale(langCode)
  }

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          @keyframes crossFade {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          
          .image-transition {
            transition: opacity 0.5s ease-in-out;
          }

          @keyframes textFadeIn {
            0%   { opacity: 0; }
            100% { opacity: 1; }
          }

          @keyframes textFadeOut {
            0%   { opacity: 1; }
            100% { opacity: 0; }
          }

          .cross-fade-text-in {
            animation: textFadeIn 0.6s ease-in-out forwards;
          }

          .cross-fade-text-out {
            animation: textFadeOut 0.6s ease-in-out forwards;
          }

          .cross-fade-input {
            animation: textFadeIn 0.6s ease-in-out forwards;
          }
          
          /* Tüm header menü öğelerini kesinlikle aynı boyutta yap */
          header nav .header-nav-item,
          header nav .header-nav-item.active,
          header nav a.header-nav-item,
          header nav a.header-nav-item.active,
          header nav a[href*="/designers"],
          header nav a[href*="/projects"],
          header nav a[href*="/news"],
          header nav a[href*="/about"],
          header nav a[href*="/contact"],
          header nav a[href*="/categories"] {
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            letter-spacing: 0.05em !important;
          }
          
          header nav .header-nav-text,
          header nav .header-nav-item .header-nav-text,
          header nav .header-nav-item.active .header-nav-text,
          header nav a.header-nav-item span.header-nav-text,
          header nav a.header-nav-item.active span.header-nav-text,
          header nav a[href*="/designers"] span,
          header nav a[href*="/projects"] span,
          header nav a[href*="/news"] span,
          header nav a[href*="/about"] span,
          header nav a[href*="/contact"] span,
          header nav a[href*="/categories"] span {
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            letter-spacing: 0.05em !important;
            line-height: 1.25rem !important;
            display: inline-block !important;
          }
          
          /* React Router active state override */
          header nav a[class*="active"] span,
          header nav a.active span,
          header nav a[aria-current="page"] span {
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            letter-spacing: 0.05em !important;
            line-height: 1.25rem !important;
          }
          
          /* Overlay mobil menü - tamamen opak siyah arka plan */
          #mobile-menu.mobile-menu-overlay {
            background-color: #000000 !important;
            background: #000000 !important;
          }
          
          /* Mobil menüde TÜM menü öğeleri için aynı font boyutu garantisi */
          #mobile-menu nav button,
          #mobile-menu nav a,
          #mobile-menu nav button *,
          #mobile-menu nav a *,
          #mobile-menu nav button span,
          #mobile-menu nav a span,
          #mobile-menu nav button span span,
          #mobile-menu nav a span span,
          #mobile-menu nav button span span span,
          #mobile-menu nav a span span span,
          #mobile-menu nav button .cross-fade-text-in,
          #mobile-menu nav a .cross-fade-text-in,
          #mobile-menu nav button .cross-fade-text-out,
          #mobile-menu nav a .cross-fade-text-out {
            font-size: 1.25rem !important;
            font-weight: 300 !important;
            letter-spacing: 0.2em !important;
            line-height: 1.25 !important;
          }
          
        `}
      </style>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-150 ease-out ${
          // Scroll yönüne göre header'ı gizle/göster (mobil ve desktop)
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div
          className={`${isOverlayMobileMenu || (isProductsOpen && !isMobile) ? '' : 'overflow-hidden'} ${
            // Header yüksekliği: mobil ve desktop için sabit yükseklik - her zaman
            isMobile ? 'h-[3.5rem] min-h-[3.5rem] max-h-[3.5rem]' : 'h-[5rem] min-h-[5rem] max-h-[5rem]'
          } ${
            // Arka plan blur'ü: opacity 0 ise blur'ü kaldır (Products açıkken blur aktif)
            headerOpacity <= 0 && !isProductsOpen ? '' : 'backdrop-blur-lg'
          } ${
            // Header altındaki ince beyaz çizgiyi opacity 0 iken veya products açıkken kaldır
            isSearchOpen || headerOpacity <= 0 || isProductsOpen ? '' : 'border-b border-white/10'
          } ${
            // Sadece menü açıldığında transition ve max-height değişimi
            isProductsOpen || (isMobileMenuOpen && !isOverlayMobileMenu)
              ? 'transition-all duration-700 ease-in-out'
              : ''
          }`}
          style={{
            backgroundColor: (() => {
              // Ürün detay sayfasında arka plan rengini kontrol etme - sabit değer kullan
              const path = location.pathname
              const isProductDetail = path.match(/^\/product\/[^/]+$/)
              if (isProductDetail) {
                // Ürün detay sayfasında header opacity'ye göre sabit değer
                return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.7)})`
              }
              
              // Desktop'ta Products dropdown açıkken yarı şeffaf arka plan
              if (isProductsOpen && !isMobile) {
                return 'rgba(0, 0, 0, 0.85)'
              }
              
              // Koyu hero olan sayfalarda en üstteyken şeffaf
              const isDarkHero = path === '/' || path === '' || path.includes('about')
              if (isDarkHero && window.scrollY <= 10 && headerOpacity <= 0) {
                return 'transparent'
              }
              
              // Overlay mobil menü AÇIKKEN veya kapanma animasyonu sürerken
              // header'ı da tamamen opak siyah yap
              if (isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)) {
                return '#000000'
              }

              // MOBİL: Arka plan açık renkteyse header'ı her zaman belirgin koyu yap
              if (isMobile) {
                // Sayfa arka plan rengini kontrol et (brightness hesaplanamadığında)
                const getPageBackgroundColor = () => {
                  try {
                  // Açık renkli sayfaları route'a göre kontrol et
                  // NOT: /about sayfası hero bölümü koyu olduğu için buradan çıkarıldı
                  const lightPages = ['/privacy', '/terms', '/cookies', '/kvkk']
                  if (lightPages.some(page => location.pathname.includes(page))) {
                    return 0.85 // Açık renkli sayfalar için yüksek luminance
                  }
                    
                    // Header'ın hemen altındaki elementi kontrol et
                    const headerElement = headerContainerRef.current
                    if (headerElement) {
                      let element = headerElement.nextElementSibling as HTMLElement
                      // İlk görünür elementi bul
                      while (element) {
                        const style = window.getComputedStyle(element)
                        if (style.display !== 'none' && style.visibility !== 'hidden') {
                          const bgColor = style.backgroundColor
                          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                            const rgbMatch = bgColor.match(/\d+/g)
                            if (rgbMatch && rgbMatch.length >= 3) {
                              const r = parseInt(rgbMatch[0] || '0')
                              const g = parseInt(rgbMatch[1] || '0')
                              const b = parseInt(rgbMatch[2] || '0')
                              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                              return luminance
                            }
                          }
                        }
                        element = element.nextElementSibling as HTMLElement
                      }
                    }
                    
                    // Fallback: main veya body'yi kontrol et
                    const body = document.body
                    const main = document.querySelector('main')
                    const computedStyle = window.getComputedStyle(main || body)
                    const bgColor = computedStyle.backgroundColor
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                      const rgbMatch = bgColor.match(/\d+/g)
                      if (rgbMatch && rgbMatch.length >= 3) {
                        const r = parseInt(rgbMatch[0] || '0')
                        const g = parseInt(rgbMatch[1] || '0')
                        const b = parseInt(rgbMatch[2] || '0')
                        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                        return luminance
                      }
                    }
                  } catch (e) {
                    // Hata durumunda null döndür
                  }
                  return null
                }

                // Parlaklık ölçüldüyse, tamamen ona göre karar ver
                if (heroBrightness !== null) {
                  // Çok açık / beyaza yakın görseller - headerOpacity'den bağımsız minimum opacity
                  if (heroBrightness >= 0.7) {
                    return 'rgba(0, 0, 0, 0.85)'
                  }
                  // Açık arka plan - minimum opacity garantile
                  if (heroBrightness >= 0.5) {
                    return 'rgba(0, 0, 0, 0.75)'
                  }
                  // Orta ton arka plan – en az orta koyulukta olsun
                  if (heroBrightness >= 0.35) {
                    const safeOpacity = Math.max(headerOpacity, 0.65)
                    return `rgba(0, 0, 0, ${safeOpacity})`
                  }
                  // Çok koyu arka plan – özellikle sayfanın en üstünde mümkün olduğunca şeffaf kalsın
                  if (headerOpacity <= 0.25) {
                    return 'transparent'
                  }
                  const darkOpacity = Math.max(headerOpacity, 0.4)
                  return `rgba(0, 0, 0, ${darkOpacity})`
                }

                // Parlaklık bilgisi yoksa sayfa arka plan rengini kontrol et
                const pageBgLuminance = getPageBackgroundColor()
                if (pageBgLuminance !== null) {
                  // Sayfa arka planı açık renkliyse header'ı koyu yap (düğmeler görünsün)
                  if (pageBgLuminance >= 0.7) {
                    return 'rgba(0, 0, 0, 0.9)'
                  }
                  if (pageBgLuminance >= 0.5) {
                    return 'rgba(0, 0, 0, 0.8)'
                  }
                  // Koyu sayfalarda tam şeffaf kal
                  if (pageBgLuminance < 0.4) {
                    if (headerOpacity <= 0.25) {
                      return 'transparent'
                    }
                    return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.4)})`
                  }
                }

                // Brightness ve pageBgLuminance bilgisi yoksa headerOpacity'ye göre karar ver
                // Koyu sayfalarda tam şeffaf kalabilir
                if (headerOpacity <= 0.25) {
                  return 'transparent'
                }
                // Scroll yapıldıysa headerOpacity'yi kullan
                return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.4)})`
              }

              // Desktop için sayfa arka plan rengini kontrol et
              const getPageBackgroundColor = () => {
                try {
                  // Açık renkli sayfaları route'a göre kontrol et
                  // NOT: /about sayfası hero bölümü koyu olduğu için buradan çıkarıldı
                  const lightPages = ['/privacy', '/terms', '/cookies', '/kvkk']
                  if (lightPages.some(page => location.pathname.includes(page))) {
                    return 0.85 // Açık renkli sayfalar için yüksek luminance
                  }
                  
                  // Header'ın hemen altındaki elementi kontrol et
                  const headerElement = headerContainerRef.current
                  if (headerElement) {
                    let element = headerElement.nextElementSibling as HTMLElement
                    // İlk görünür elementi bul
                    while (element) {
                      const style = window.getComputedStyle(element)
                      if (style.display !== 'none' && style.visibility !== 'hidden') {
                        const bgColor = style.backgroundColor
                        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                          const rgbMatch = bgColor.match(/\d+/g)
                          if (rgbMatch && rgbMatch.length >= 3) {
                            const r = parseInt(rgbMatch[0] || '0')
                            const g = parseInt(rgbMatch[1] || '0')
                            const b = parseInt(rgbMatch[2] || '0')
                            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                            return luminance
                          }
                        }
                      }
                      element = element.nextElementSibling as HTMLElement
                    }
                  }
                  
                  // Fallback: main veya body'yi kontrol et
                  const body = document.body
                  const main = document.querySelector('main')
                  const computedStyle = window.getComputedStyle(main || body)
                  const bgColor = computedStyle.backgroundColor
                  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    const rgbMatch = bgColor.match(/\d+/g)
                    if (rgbMatch && rgbMatch.length >= 3) {
                      const r = parseInt(rgbMatch[0] || '0')
                      const g = parseInt(rgbMatch[1] || '0')
                      const b = parseInt(rgbMatch[2] || '0')
                      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                      return luminance
                    }
                  }
                } catch (e) {
                  // Hata durumunda null döndür
                }
                return null
              }

              // Varsayılan temel opacity
              let baseOpacity = headerOpacity > 0.25 ? Math.max(headerOpacity, 0.4) : 0

              // Eğer üstteki görselin parlaklığını biliyorsak, header koyuluğunu buna göre ayarla
              if (heroBrightness !== null) {
                if (heroBrightness >= 0.7) {
                  // Çok açık arka plan → header'ı belirgin koyu yap (headerOpacity'den bağımsız)
                  baseOpacity = 0.85
                } else if (heroBrightness >= 0.5) {
                  // Açık arka plan → minimum opacity garantile
                  baseOpacity = Math.max(baseOpacity, 0.75)
                } else if (heroBrightness >= 0.45) {
                  // Orta-açık arka plan → biraz daha koyu
                  baseOpacity = Math.max(baseOpacity, 0.7)
                } else if (heroBrightness <= 0.25) {
                  // Çok koyu arka plan → header biraz daha şeffaf kalabilir
                  baseOpacity = Math.min(baseOpacity, 0.5)
                }
              } else {
                // Parlaklık bilgisi yoksa sayfa arka plan rengini kontrol et
                const pageBgLuminance = getPageBackgroundColor()
                if (pageBgLuminance !== null) {
                  // Sayfa arka planı açık renkliyse header'ı koyu yap (düğmeler görünsün)
                  if (pageBgLuminance >= 0.7) {
                    baseOpacity = 0.9
                  } else if (pageBgLuminance >= 0.5) {
                    baseOpacity = Math.max(baseOpacity, 0.8)
                  } else {
                    // Koyu arka plan - tam şeffaf kalabilir
                    if (headerOpacity <= 0.25) {
                      baseOpacity = 0
                    } else {
                      baseOpacity = Math.max(baseOpacity, 0.4)
                    }
                  }
                } else {
                  // Brightness ve pageBgLuminance bilgisi yoksa headerOpacity'ye göre karar ver
                  // Koyu sayfalarda tam şeffaf kalabilir
                  if (headerOpacity <= 0.25) {
                    baseOpacity = 0
                  } else {
                    baseOpacity = Math.max(baseOpacity, 0.4)
                  }
                }
              }

              return `rgba(0, 0, 0, ${baseOpacity})`
            })(),
            transition: isProductsOpen || (isMobileMenuOpen && !isOverlayMobileMenu) 
              ? 'background-color 0.2s ease-out, max-height 0.7s ease-in-out'
              : 'background-color 0.2s ease-out',
            backdropFilter: headerOpacity <= 0 && !isProductsOpen ? 'none' : 'blur(16px)',
            WebkitBackdropFilter: headerOpacity <= 0 && !isProductsOpen ? 'none' : 'blur(16px)',
            borderBottom: (headerOpacity <= 0 || isProductsOpen) ? 'none' : undefined,
            pointerEvents: 'auto',
            // Desktop'ta header yüksekliği her zaman sabit - products dropdown overflow ile gösterilir
            height: isMobileMenuOpen && !isOverlayMobileMenu 
              ? 'auto' 
              : (isMobile ? '3.5rem' : '5rem'),
            minHeight: isMobile ? '3.5rem' : '5rem',
            maxHeight: isMobileMenuOpen && !isOverlayMobileMenu 
              ? '40rem' 
              : (isMobile ? '3.5rem' : '5rem'),
            // Products dropdown için overflow visible
            overflow: isProductsOpen && !isMobile ? 'visible' : undefined,
          }}
          ref={headerContainerRef}
        >
          <nav className="px-2 sm:px-4 lg:px-6 h-full flex items-center" ref={navRef}>
            {/* Üst satır: logo ve menü düğmeleri dikeyde tam ortalı */}
            <div className="relative flex w-full h-full items-center lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              {/* Sol taraf - Menü düğmeleri (desktop) ve arama + logo (mobil) */}
              <div className="flex flex-1 items-center lg:justify-start">
                {/* Mobil Arama - Solda */}
                {isMobile && (
                  <button
                    ref={searchButtonRef}
                    onClick={() => (isSearchOpen ? closeSearch() : setIsSearchOpen(true))}
                    className={`${iconClasses} absolute left-3 top-1/2 -translate-y-1/2`}
                    aria-label={
                      isSearchOpen
                        ? t('close_search') || 'Aramayı kapat'
                        : t('open_search') || 'Ara'
                    }
                    aria-expanded={isSearchOpen}
                    aria-controls="search-panel"
                  >
                    {isSearchOpen ? <CloseIcon /> : <SearchIcon />}
                  </button>
                )}

                {/* Mobil Logo - Ortada */}
                <div className="lg:hidden flex items-center absolute left-1/2 -translate-x-1/2">
                  <Link to="/" className="flex items-center gap-1.5 text-white transition-colors">
                    <SiteLogo logoUrl={settings?.logoUrl} className="w-32 h-5" />
                  </Link>
                </div>
                {/* Desktop Menü */}
                <div className="hidden lg:flex lg:items-center lg:space-x-8">
                  <div
                    ref={productsButtonRef}
                    className="relative"
                    onMouseEnter={handleProductsEnter}
                    onMouseLeave={handleProductsLeave}
                  >
                    <Link
                      to="/categories"
                      className={`group flex items-center space-x-1 py-2 ${navLinkClasses}`}
                      onClick={() => setIsProductsOpen(false)}
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        fontFamily: 'inherit',
                        lineHeight: '1.25rem',
                      }}
                    >
                      <span
                        className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase header-nav-text"
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          fontFamily: 'inherit',
                          lineHeight: '1.25rem',
                        }}
                      >
                        {t('products')}
                        <span
                          className={`absolute -bottom-1 left-0 w-full h-[3px] bg-white transition-transform duration-300 ease-out origin-center ${isProductsOpen ? 'scale-x-0 opacity-0' : 'transform scale-x-0 group-hover:scale-x-100'}`}
                        ></span>
                      </span>
                      <ChevronDownIcon />
                    </Link>
                  </div>
                  <NavItem
                    to="/designers"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('designers')}
                  </NavItem>
                  <NavItem
                    to="/projects"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('projects') || 'Projeler'}
                  </NavItem>
                  <NavItem
                    to="/news"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('news')}
                  </NavItem>
                  <NavItem
                    to="/about"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('about')}
                  </NavItem>
                  <NavItem
                    to="/contact"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('contact')}
                  </NavItem>
                </div>
              </div>

              {/* Orta - Logo (Desktop) */}
              <div className="hidden lg:flex items-center justify-center">
                <Link to="/" className="flex items-center gap-3 text-white transition-colors">
                  <SiteLogo logoUrl={settings?.logoUrl} className="w-32 md:w-72 h-6 md:h-10" />
                </Link>
              </div>

              {/* Sağ taraf - İkonlar */}
              <div className="flex flex-1 items-center justify-end space-x-4 lg:justify-end">
                {/* Desktop Arama - Dil seçeneklerinin solunda */}
                {!isMobile && (
                  <button
                    ref={searchButtonRef}
                    onClick={() => (isSearchOpen ? closeSearch() : setIsSearchOpen(true))}
                    className={`${iconClasses} hidden md:inline-flex`}
                    aria-label={
                      isSearchOpen
                        ? t('close_search') || 'Aramayı kapat'
                        : t('open_search') || 'Ara'
                    }
                    aria-expanded={isSearchOpen}
                    aria-controls="search-panel"
                  >
                    {isSearchOpen ? <CloseIcon /> : <SearchIcon />}
                  </button>
                )}
                {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length > 1 && (
                  <div className="hidden md:flex items-center gap-0">
                    {supportedLocales.map(langCode => {
                      const isActive = locale === langCode
                      return (
                        <button
                          key={langCode}
                          onClick={() => setLocale(langCode)}
                          aria-pressed={isActive}
                          aria-label={`${t('switch_language') || 'Dil değiştir'} - ${langCode.toUpperCase()}`}
                          className={`group relative px-1 py-1 text-[0.8rem] uppercase tracking-[0.25em] transition-colors duration-200 ${
                            isActive
                              ? 'text-white font-extralight'
                              : 'text-gray-400/90 hover:text-white font-extralight'
                          }`}
                          style={{fontFamily: 'Inter, sans-serif', letterSpacing: '0.25em'}}
                        >
                          <span className="relative inline-block">
                            {langCode.toUpperCase()}
                            <span
                              className={`absolute -bottom-1 left-0 w-full h-[3px] bg-white transition-transform duration-300 ease-out origin-center ${
                                isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                              }`}
                            ></span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                <NavLink
                  to={isLoggedIn ? '/profile' : '/login'}
                  className={`${iconClasses} hidden lg:inline-flex`}
                  aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
                >
                  <UserIcon />
                </NavLink>
                {settings?.showCartButton === true && (
                  <button
                    onClick={toggleCart}
                    className={`relative ${iconClasses}`}
                    aria-label={`${t('cart') || 'Sepet'}${cartCount > 0 ? ` (${cartCount} ${t('items') || 'ürün'})` : ''}`}
                    aria-expanded={false}
                  >
                    <ShoppingBagIcon />
                    {cartCount > 0 && (
                      <span
                        className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                        aria-hidden="true"
                      >
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}
                <div className="lg:hidden flex items-center">
                  {/* Settings yüklenene kadar hamburger butonunu gizle - böylece yanlış stil gösterilmez */}
                  {!settings ? null : isOverlayMobileMenu ? (
                    // Overlay modunda: hamburger → X animasyonu (senin verdiğin pattern'e göre)
                    <button
                      ref={mobileMenuButtonRef}
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="group p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                      aria-label={
                        isMobileMenuOpen
                          ? t('close_menu') || 'Menüyü kapat'
                          : t('open_menu') || 'Menüyü aç'
                      }
                      aria-expanded={isMobileMenuOpen}
                      aria-controls="mobile-menu"
                    >
                      <div className="flex flex-col gap-1.5 items-start w-6">
                        {/* Üst Çizgi: 45 derece döner ve aşağı iner */}
                        <span
                          className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                            isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                          }`}
                        ></span>
                        {/* Orta Çizgi: Kaybolur */}
                        <span
                          className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                            isMobileMenuOpen ? 'opacity-0' : ''
                          }`}
                        ></span>
                        {/* Alt Çizgi: -45 derece döner ve yukarı çıkar */}
                        <span
                          className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                            isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                          }`}
                        ></span>
                      </div>
                    </button>
                  ) : (
                    <button
                      ref={mobileMenuButtonRef}
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className={`${iconClasses} flex items-center justify-center`}
                      aria-label={
                        isMobileMenuOpen
                          ? t('close_menu') || 'Menüyü kapat'
                          : t('open_menu') || 'Menüyü aç'
                      }
                      aria-expanded={isMobileMenuOpen}
                      aria-controls="mobile-menu"
                    >
                      <MenuIcon />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </nav>
          {/* Ürün kategorileri paneli - header içinde genişleyip daralır */}
          <div
            className={`hidden lg:block transition-all duration-500 ease-in-out ${isProductsOpen ? 'opacity-100 translate-y-0 max-h-[800px]' : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden'}`}
            style={{
              backgroundColor: isProductsOpen ? 'rgba(0, 0, 0, 0.85)' : 'transparent',
              backdropFilter: isProductsOpen ? 'blur(16px)' : 'none',
              WebkitBackdropFilter: isProductsOpen ? 'blur(16px)' : 'none',
            }}
            onMouseEnter={handleProductsEnter}
            onMouseLeave={handleProductsLeave}
          >
            {/* Beyaz ayırıcı çizgi */}
            <div
              className="h-[1px] bg-white/60 mx-4"
              style={{marginLeft: submenuOffset}}
            ></div>

            <div
              className="pt-4 pb-3 grid grid-cols-[auto_1fr] gap-24"
              style={{paddingLeft: submenuOffset, paddingRight: '5rem'}}
            >
              {/* Sol taraf - Kategoriler */}
              <div className="overflow-y-auto hide-scrollbar pr-6 pl-4">
                <div className="flex flex-col gap-3">
                  {categories.map(category => (
                    <NavLink
                      key={category.id}
                      to={`/products/${category.id}`}
                      className="group relative px-1 py-2 text-sm font-semibold uppercase text-gray-200 hover:text-white transition-colors duration-300"
                      onClick={() => setIsProductsOpen(false)}
                      onMouseEnter={() => setHoveredCategoryId(category.id)}
                    >
                      <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase">
                        {t(category.name)}
                        <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Sağ taraf - Görsel */}
              <div
                className="relative w-[600px] self-stretch overflow-hidden"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                {(() => {
                  const hoveredCategory = categories.find(c => c.id === hoveredCategoryId)

                  // Hover edilmediyse boş alan göster
                  if (!hoveredCategory) {
                    return null
                  }

                  let imageUrl = ''
                  let imageClass = 'w-full h-full object-cover'

                  // Önce menuImage'i kontrol et
                  if (hoveredCategory.menuImage) {
                    imageUrl = hoveredCategory.menuImage
                  } else {
                    // menuImage yoksa ilk ürün görselini göster
                    const products = categoryProducts.get(hoveredCategory.id)

                    if (products && products.length > 0) {
                      // Görseli olan ilk ürünü bul
                      for (const product of products) {
                        // Ana görseli kontrol et
                        let tempImageUrl =
                          typeof product.mainImage === 'string'
                            ? product.mainImage
                            : product.mainImage?.url

                        // Ana görsel yoksa alternativeMedia'dan al
                        if (
                          !tempImageUrl &&
                          product.alternativeMedia &&
                          product.alternativeMedia.length > 0
                        ) {
                          const firstAlt = product.alternativeMedia[0]
                          if (firstAlt && firstAlt.type === 'image' && firstAlt.url) {
                            tempImageUrl = firstAlt.url
                          }
                        }

                        if (tempImageUrl && tempImageUrl.trim() !== '') {
                          imageUrl = tempImageUrl
                          imageClass = 'max-w-full max-h-full object-contain'
                          break
                        }
                      }
                    }
                  }

                  // Görsel bulunduysa göster
                  if (imageUrl) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          key={hoveredCategory.id}
                          src={imageUrl}
                          alt={t(hoveredCategory.name)}
                          className={`${imageClass} image-transition`}
                          style={{
                            animation: 'crossFade 0.5s ease-in-out',
                          }}
                        />
                      </div>
                    )
                  }

                  return null
                })()}
              </div>
            </div>

            {/* Tüm Modeller butonu - boydan boya çizgi ile */}
            <div
              className="border-t border-white/80 mx-4 mt-3"
              style={{marginLeft: submenuOffset}}
            ></div>
            <div className="pt-3 pb-3" style={{paddingLeft: submenuOffset, paddingRight: '5rem'}}>
              <NavLink
                to="/products"
                className="group relative inline-block px-1 py-2 text-sm font-bold uppercase text-white hover:text-gray-200 transition-colors duration-300"
                onClick={() => setIsProductsOpen(false)}
              >
                <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase">
                  {t('view_all')}
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
                </span>
              </NavLink>
            </div>
          </div>
          {/* Mobil menü - default stil (header içinde) - overlay stili header dışında render edilir */}
          {!isOverlayMobileMenu && isMobileMenuOpen && (
            <div
              ref={node => {
                if (node) {
                  ;(mobileMenuRef as React.MutableRefObject<HTMLDivElement | null>).current = node
                  ;(mobileMenuFocusTrap as React.MutableRefObject<HTMLElement | null>).current =
                    node
                }
              }}
              id="mobile-menu"
              className="lg:hidden border-t border-white/10"
              role="menu"
              aria-label={t('main_menu') || 'Ana menü'}
            >
              {/* Dil seçenekleri - Menü öğelerinin üstünde */}
              {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length > 1 && (
                <div className="relative w-full">
                  <div className="flex items-center justify-between bg-black/50 px-4 sm:px-5 lg:px-6 pt-3 pb-2 min-h-[3rem] border-b border-white/10">
                    <div className="flex items-center gap-1">
                      {supportedLocales.map(langCode => {
                        const isActive = locale === langCode
                        return (
                          <button
                            key={langCode}
                            onClick={() => {
                              handleMobileLocaleChange(langCode)
                            }}
                            aria-pressed={isActive}
                            className={`group relative px-1.5 py-0.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
                              isActive
                                ? 'text-white font-extralight'
                                : 'text-gray-400/90 hover:text-white font-extralight'
                            }`}
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              letterSpacing: '0.2em',
                            }}
                          >
                            <span className="relative inline-block">{langCode.toUpperCase()}</span>
                          </button>
                        )
                      })}
                    </div>
                    {/* Mobilde dil bölümünün en sağında giriş/profile ikonu */}
                    <NavLink
                      to={isLoggedIn ? '/profile' : '/login'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={iconClasses}
                      aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
                    >
                      <UserIcon />
                    </NavLink>
                  </div>
                </div>
              )}
              <nav className="px-4 sm:px-5 lg:px-6 pb-2 flex flex-col">
                <div className="flex flex-col">
                  {/* Ürünler düğmesi - tıklanınca alt menü açılır */}
                  <div className="border-b border-white/10">
                    <button
                      onClick={() => setIsMobileProductsMenuOpen(!isMobileProductsMenuOpen)}
                      className="mobile-menu-products-button flex items-center justify-between w-full min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300"
                    >
                      <CrossFadeText text={t('products')} triggerKey={locale} />
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isMobileProductsMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Alt menü - kategoriler ve Hepsini Gör */}
                    <div
                      className={`overflow-hidden transition-all duration-700 ease-in-out ${
                        isMobileProductsMenuOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="pl-4 pb-2 flex flex-col">
                        {categories.map((category, index) => (
                          <NavLink
                            key={category.id}
                            to={`/products/${category.id}`}
                            className="flex items-center min-h-[2.5rem] py-2 text-lg font-light leading-tight tracking-[0.15em] uppercase text-gray-300 hover:text-white transition-colors duration-300 border-b border-white/5 last:border-b-0"
                            onClick={() => {
                              setIsMobileMenuOpen(false)
                              setIsMobileProductsMenuOpen(false)
                            }}
                            style={{
                              transitionDelay: isMobileProductsMenuOpen ? `${index * 50}ms` : '0ms',
                            }}
                          >
                            <CrossFadeText text={t(category.name)} triggerKey={locale} />
                          </NavLink>
                        ))}
                        <NavLink
                          to="/products"
                          className="flex items-center min-h-[2.5rem] py-2 mt-2 text-lg font-light leading-tight tracking-[0.15em] uppercase text-gray-300 hover:text-white transition-colors duration-300 border-t border-white/10 pt-2"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setIsMobileProductsMenuOpen(false)
                          }}
                          style={{
                            transitionDelay: isMobileProductsMenuOpen ? `${categories.length * 50}ms` : '0ms',
                          }}
                        >
                          <CrossFadeText text={t('see_all')} triggerKey={locale} />
                        </NavLink>
                      </div>
                    </div>
                  </div>
                  <NavLink
                    to="/designers"
                    className={`flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10 transition-transform ${
                      isMobileProductsMenuOpen ? 'translate-y-0' : 'translate-y-0'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CrossFadeText text={t('designers')} triggerKey={locale} />
                  </NavLink>
                  <NavLink
                    to="/projects"
                    className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CrossFadeText text={t('projects') || 'Projeler'} triggerKey={locale} />
                  </NavLink>
                  <NavLink
                    to="/news"
                    className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CrossFadeText text={t('news')} triggerKey={locale} />
                  </NavLink>
                  <NavLink
                    to="/about"
                    className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CrossFadeText text={t('about')} triggerKey={locale} />
                  </NavLink>
                  <NavLink
                    to="/contact"
                    className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CrossFadeText text={t('contact')} triggerKey={locale} />
                  </NavLink>
                </div>
              </nav>
            </div>
          )}
        </div>
        {/* Desktop genişleyen ürün paneli kaldırıldı; içerik header içinde render ediliyor */}
      </header>

      {/* Overlay mobil menü - header'ın DIŞINDA, tam ekran kaplayan panel */}
      {isOverlayMobileMenu && (
        <div
          ref={node => {
            if (node) {
              ;(mobileMenuRef as React.MutableRefObject<HTMLDivElement | null>).current = node
              ;(mobileMenuFocusTrap as React.MutableRefObject<HTMLElement | null>).current = node
            }
          }}
          id="mobile-menu"
          className={`mobile-menu-overlay fixed left-0 right-0 bottom-0 lg:hidden z-40 flex flex-col border-t border-white/10 text-white pb-8 px-6 transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            isMobileMenuOpen
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-2 opacity-0 pointer-events-none'
          }`}
          style={{
            top: `${headerHeight}px`,
            backgroundColor: '#000000',
            // Kapanırken panel animasyonunu, linklerin ters sırada kaybolma animasyonundan sonra başlat
            transitionDelay: isMobileMenuOpen ? '0ms' : `${mobileMenuCloseDelay}ms`,
          }}
          role="menu"
          aria-label={t('main_menu') || 'Ana menü'}
        >
          {/* Dil ve kullanıcı alanı */}
          {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length > 1 && (
            <div
              className={`mb-6 pt-4 pb-4 transition-all duration-400 ${
                isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{transitionDelay: isMobileMenuOpen ? '50ms' : '0ms'}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {supportedLocales.map(langCode => {
                    const isActive = locale === langCode
                    return (
                      <button
                        key={langCode}
                        onClick={() => {
                          handleMobileLocaleChange(langCode)
                        }}
                        aria-pressed={isActive}
                        className={`group relative px-1.5 py-0.5 text-xs uppercase tracking-[0.2em] transition-all duration-200 ${
                          isActive
                            ? 'text-white font-extralight'
                            : 'text-gray-400/90 hover:text-white font-extralight'
                        } ${isActive ? 'scale-105' : 'scale-100'}`}
                        style={{fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em'}}
                      >
                        <span className="relative inline-block transition-opacity transition-transform duration-200 ease-out">
                          {langCode.toUpperCase()}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <NavLink
                  to={isLoggedIn ? '/profile' : '/login'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={iconClasses}
                  aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
                >
                  <UserIcon />
                </NavLink>
              </div>
              {/* Tam ekran genişliğinde ayırıcı çizgi */}
              <div
                className="border-b border-white/20 mt-4 -mx-6"
                style={{width: 'calc(100% + 3rem)'}}
              ></div>
            </div>
          )}

          {/* Menü linkleri - stagger animasyon */}
          <nav className="flex flex-col justify-start gap-6">
            {/* Ürünler düğmesi - tıklanınca alt menü açılır */}
            <div>
              <button
                onClick={() => setIsMobileProductsMenuOpen(!isMobileProductsMenuOpen)}
                style={{
                  transitionDelay: `${
                    isMobileMenuOpen
                      ? 0
                      : (mobileMenuLinks.length - 1) * 100
                  }ms`,
                  fontWeight: 300,
                  letterSpacing: '0.2em',
                }}
                className={`group flex items-center justify-between w-full text-xl md:text-2xl font-light leading-tight text-white transition-all duration-400 ${
                  isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                }`}
              >
                <span>
                  <CrossFadeText text={(t('products') || '').toLocaleUpperCase('en')} triggerKey={locale} />
                </span>
                <svg
                  className={`w-6 h-6 transition-transform duration-300 ${isMobileProductsMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Alt menü - kategoriler ve Hepsini Gör */}
              <div
                className={`overflow-hidden transition-all duration-700 ease-in-out ${
                  isMobileProductsMenuOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pl-4 flex flex-col gap-3">
                  {categories.map((category, index) => (
                    <NavLink
                      key={category.id}
                      to={`/products/${category.id}`}
                      style={{
                        transitionDelay: isMobileProductsMenuOpen ? `${index * 50}ms` : '0ms',
                        fontWeight: 300,
                        letterSpacing: '0.15em',
                      }}
                      className={`group flex items-center justify-between text-xl md:text-2xl font-light leading-tight text-gray-300 hover:text-white transition-all duration-400 ${
                        isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                      }`}
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setIsMobileProductsMenuOpen(false)
                      }}
                    >
                      <span>
                        <CrossFadeText text={t(category.name)} triggerKey={locale} />
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <ChevronRightIcon />
                      </span>
                    </NavLink>
                  ))}
                  <NavLink
                    to="/products"
                    style={{
                      transitionDelay: isMobileProductsMenuOpen ? `${categories.length * 50}ms` : '0ms',
                      fontWeight: 300,
                      letterSpacing: '0.15em',
                    }}
                    className={`group flex items-center justify-between text-xl md:text-2xl font-light leading-tight text-gray-300 hover:text-white transition-all duration-400 border-t border-white/20 pt-3 mt-2 ${
                      isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                    }`}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsMobileProductsMenuOpen(false)
                    }}
                  >
                    <span>
                      <CrossFadeText text={(t('see_all') || '').toLocaleUpperCase('en')} triggerKey={locale} />
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <ChevronRightIcon />
                    </span>
                  </NavLink>
                </div>
              </div>
            </div>
            {/* Diğer menü linkleri */}
            {mobileMenuLinks.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  // Açılırken yukarı doğru (ilk eleman en geç), kapanırken tersine (ilk eleman en erken)
                  transitionDelay: `${
                    isMobileMenuOpen
                      ? (index + 1) * 100
                      : (mobileMenuLinks.length - 1 - index) * 100
                  }ms`,
                  fontWeight: 300,
                  letterSpacing: '0.2em',
                }}
                className={`group flex items-center justify-between text-2xl md:text-3xl font-light leading-tight text-white transition-all duration-400 ${
                  isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>
                  <CrossFadeText text={item.label} triggerKey={locale} />
                </span>
                <span className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <ChevronRightIcon />
                </span>
              </NavLink>
            ))}
          </nav>

          {/* Alt kısım - Subscribe ve Sosyal Medya */}
          <div
            className={`mt-auto pt-8 transition-all duration-400 ${
              isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{transitionDelay: isMobileMenuOpen ? '300ms' : '0ms'}}
          >
            {/* Ayırıcı çizgi - tam ekran genişliğinde */}
            <div
              className="border-t border-white/20 -mx-6 mb-6"
              style={{width: 'calc(100% + 3rem)'}}
            ></div>

            {/* Subscribe bölümü */}
            <form
              onSubmit={async e => {
                e.preventDefault()
                if (subscribeEmail) {
                  try {
                    await subscribeEmailService(subscribeEmail)
                    alert(t('subscribe_success') || 'E-posta aboneliğiniz başarıyla oluşturuldu!')
                    setSubscribeEmailState('')
                  } catch (err: any) {
                    if (err.message === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
                      alert(t('subscribe_success') || 'E-posta aboneliğiniz kaydedildi!')
                      setSubscribeEmailState('')
                    } else {
                      alert(err.message || 'Bir hata oluştu.')
                    }
                  }
                }
              }}
              className="flex flex-col items-center mb-6"
            >
              <p className="text-sm text-gray-300 mb-4 text-center">
                <CrossFadeText text={t('subscribe_prompt')} triggerKey={locale} />
              </p>
              <div className="flex items-center justify-center border-b border-white pb-0.5 w-full max-w-[280px]">
                <input
                  type="email"
                  id="header-subscribe-email"
                  name="header-subscribe-email"
                  value={subscribeEmail}
                  onChange={e => setSubscribeEmailState(e.target.value)}
                  placeholder={t('email_placeholder')}
                  className={`w-full py-1 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 transition-all duration-200 text-[15px] text-center ${
                    isMobileLocaleTransition ? 'cross-fade-input' : ''
                  }`}
                  style={{outline: 'none', boxShadow: 'none'}}
                />
              </div>
              <button
                type="submit"
                className="mt-4 px-6 py-2 border border-white/50 text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-medium uppercase tracking-wider"
              >
                <CrossFadeText text={t('subscribe')} triggerKey={locale} />
              </button>
            </form>

            {/* Sosyal medya ikonları */}
            {footerContent?.socialLinks && footerContent.socialLinks.length > 0 && (
              <div className="flex justify-center space-x-6">
                {footerContent.socialLinks
                  .filter(link => link.isEnabled)
                  .map(link => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-opacity duration-200 opacity-70 hover:opacity-100"
                    >
                      <div className="w-5 h-5">
                        <DynamicIcon svgString={link.svgIcon} />
                      </div>
                    </a>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={searchPanelRef}
        id="search-panel"
        role="search"
        aria-label={t('search') || 'Ara'}
        className={`fixed left-0 right-0 z-[100] bg-black/80 backdrop-blur-lg border-b border-white/10 shadow-2xl transition-all duration-300 ease-out ${
          isSearchOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : isMobile
              ? 'opacity-0 -translate-y-4 pointer-events-none'
              : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
        style={{
          top: isHeaderVisible ? `${headerHeight}px` : '0px',
        }}
      >
        <div className={`container mx-auto px-6 ${isMobile ? 'py-4' : 'py-8'}`}>
          <div className="w-full max-w-3xl mx-auto">
            <input
              ref={searchInputRef}
              type="search"
              placeholder={t('search_placeholder') || ''}
              id="global-search-input"
              name="global-search"
              className={`w-full bg-transparent text-white border-b border-gray-500 focus:border-white outline-none transition-colors duration-300 ${isMobile ? 'text-lg pb-2' : 'text-2xl pb-3'}`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            {searchQuery.length > 0 && (
              <div className="mt-6 max-h-[50vh] overflow-y-auto pr-2">
                {isSearching && <p className="text-center text-gray-300">{t('searching')}</p>}

                {!isSearching &&
                  searchQuery.length > 1 &&
                  searchResults.products.length === 0 &&
                  searchResults.designers.length === 0 &&
                  searchResults.categories.length === 0 && (
                    <p className="text-center text-gray-300">
                      {t('search_no_results', searchQuery)}
                    </p>
                  )}

                {searchResults.products.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 pl-3">
                      {t('products')}
                    </h3>
                    <div className="space-y-2">
                      {searchResults.products.map(product => {
                        const designerName = t(
                          allData?.designers.find(d => d.id === product.designerId)?.name
                        )
                        return (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={closeSearch}
                            className="flex items-center p-3 hover:bg-white/10 rounded-md transition-colors duration-200"
                          >
                            <img
                              src={
                                typeof product.mainImage === 'string'
                                  ? product.mainImage
                                  : product.mainImage?.url || ''
                              }
                              alt={t(product.name)}
                              className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-white">{t(product.name)}</p>
                              {designerName && (
                                <p className="text-sm text-gray-400">{designerName}</p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {searchResults.categories.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 pl-3">
                      {t('categories')}
                    </h3>
                    <div className="space-y-2">
                      {searchResults.categories.map(category => (
                        <Link
                          key={category.id}
                          to={`/products/${category.id}`}
                          onClick={closeSearch}
                          className="flex items-center p-3 hover:bg-white/10 rounded-md transition-colors duration-200"
                        >
                          <img
                            src={category.heroImage}
                            alt={t(category.name)}
                            className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-white">{t(category.name)}</p>
                            <p className="text-sm text-gray-400">{t('category')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.designers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 pl-3">
                      {t('designers')}
                    </h3>
                    <div className="space-y-2">
                      {searchResults.designers.map(designer => (
                        <Link
                          key={designer.id}
                          to={`/designer/${designer.id}`}
                          onClick={closeSearch}
                          className="flex items-center p-3 hover:bg-white/10 rounded-md transition-colors duration-200"
                        >
                          <img
                            src={
                              typeof designer.image === 'string'
                                ? designer.image
                                : designer.image?.url || ''
                            }
                            alt={t(designer.name)}
                            className="w-12 h-12 object-cover rounded-full mr-4 flex-shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-white">{t(designer.name)}</p>
                            <p className="text-sm text-gray-400">{t('designer')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
