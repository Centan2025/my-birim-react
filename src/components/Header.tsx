import { useState, useEffect, useRef, FC, Fragment, useCallback, ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { SiteSettings, Product, FooterContent } from '../types'
import {
  getSiteSettings,
  getFooterContent,
  subscribeEmail as subscribeEmailService,
} from '../services/cms'
import { useAuth } from '../App'
import { SiteLogo } from './SiteLogo'
import { HeaderProductsPanel } from './HeaderProductsPanel'
import { HeaderMobileMenuInline } from './HeaderMobileMenuInline'
import { HeaderMobileMenuOverlay } from './HeaderMobileMenuOverlay'
import { HeaderSearchPanel } from './HeaderSearchPanel'
import { UserIcon, UserLoggedInIcon } from './HeaderShared'
import { useTranslation } from '../i18n'
import { useCart } from '../context/CartContext'
import { useCategories } from '../hooks/useCategories'
import { useProductsByCategory } from '../hooks/useProducts'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useHeaderScroll } from '../hooks/useHeaderScroll'
import { useHeaderTheme } from '../context/HeaderThemeContext'
import { useHeaderSearch } from '../hooks/useHeaderSearch'
import { useHeroBrightness } from '../hooks/useHeroBrightness'
import { MenuIcon, ChevronDownIcon, SearchIcon, CloseIcon, ShoppingBagIcon } from './HeaderIcons'

export function Header() {
  const { t, setLocale, locale, supportedLocales } = useTranslation()
  const location = useLocation()
  const { data: categories = [] } = useCategories()
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
  const { theme: headerTheme } = useHeaderTheme()

  const { isLoggedIn } = useAuth()
  const { cartCount, toggleCart } = useCart()
  const [headerOpacity, setHeaderOpacity] = useState(0)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const scrollPositionRef = useRef(0)
  const headerVisibilityLastChanged = useRef(0)
  const mobileMenuJustClosedUntilRef = useRef(0)
  const lastScrollForHeader = useRef(0) // Header visibility için ayrı scroll takibi
  const [isMobile, setIsMobile] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(56) // 3.5rem = 56px (mobil için varsayılan)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  // Desktop arama açıldığında header şeffaf ise, eski opacity'yi hatırlamak için
  const previousHeaderOpacityRef = useRef<number | null>(null)
  // 2. seçenek (overlay) SADECE: (1) mobilde ve (2) CMS'te açıkça "overlay" seçiliyse aktif olsun.
  const isOverlayMobileMenu = Boolean(
    isMobile && settings && settings.mobileHeaderAnimation === 'overlay'
  )
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)

  // Search logic hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    allData,
    internalCloseSearch,
  } = useHeaderSearch(isSearchOpen)

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    internalCloseSearch()

    // Arama paneli kapanırken, eğer biz header opacity'yi değiştirdiysek geri al
    if (previousHeaderOpacityRef.current !== null) {
      setHeaderOpacity(previousHeaderOpacityRef.current)
      previousHeaderOpacityRef.current = null
    }
  }, [internalCloseSearch])

  // Hero brightness hook
  const { heroBrightness, heroBrightnessRef } = useHeroBrightness(isMobile, location.pathname, headerTheme.brightness)

  // Footer content for social links and subscribe
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null)
  const [subscribeEmail, setSubscribeEmailState] = useState('')
  const handleHeaderSubscribeEmail = useCallback(async (email: string): Promise<void> => {
    await subscribeEmailService(email)
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
    // This is now handled by useHeroBrightness hook internally
    // setHeroBrightness(null)

    // Scroll pozisyonunu sıfırla (ScrollToTop component'i bunu yapıyor ama biz de garantilemek için)
    lastScrollYRef.current = 0
    // Flag'i sıfırla (route değiştiğinde)
    opacitySetByHandleScrollRef.current = false
    // Header opacity'yi hemen 0 yap (route değiştiğinde)
    setHeaderOpacity(0)

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

  // Mobil kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

    window.addEventListener('scroll', handleHeaderVisibility, { passive: true })
    return () => window.removeEventListener('scroll', handleHeaderVisibility)
  }, [isMobile])

  // Header kaybolduğunda products dropdown'ı kapat
  useEffect(() => {
    if (!isHeaderVisible && isProductsOpen) {
      setIsProductsOpen(false)
    }
  }, [isHeaderVisible, isProductsOpen])

  // Menü state'leri değiştiğinde ref'i güncelle (scroll handler stale closure'dan kaçınmak için)
  useEffect(() => {
    menuStateRef.current = {
      isLangOpen,
      isProductsOpen,
      isSearchOpen,
      isMobileMenuOpen,
    }
  }, [isLangOpen, isProductsOpen, isSearchOpen, isMobileMenuOpen])

  useHeaderScroll({
    isMobile,
    locationPathname: location.pathname,
    closeSearch,
    currentRouteRef,
    heroBrightnessRef,
    menuStateRef,
    opacitySetByHandleScrollRef,
    mobileMenuJustClosedUntilRef,
    headerVisibilityLastChanged,
    lastScrollYRef,
    scrollTimeoutRef,
    setHeaderOpacity,
    setIsHeaderVisible,
    setIsLangOpen,
    setIsProductsOpen,
  })

  // Mobil menü açıldığında/kapandığında opacity'yi güncelle
  useEffect(() => {
    if (isMobile) {
      if (isMobileMenuOpen) {
        setHeaderOpacity(0.75)
        setIsHeaderVisible(true)
        // Menü yeni açıldı, "az önce kapandı" durumunu sıfırla
        mobileMenuJustClosedUntilRef.current = 0
      } else if (isSearchOpen) {
        // Arama açıldığında arama paneli ile aynı opacity (0.7)
        setHeaderOpacity(0.7)
        setIsHeaderVisible(true)
      } else {
        // Menü KAPANIRKEN: belirli bir süre boyunca header'ın gizlenmesini engelle
        // Böylece kullanıcı close'a bastığı anda header kaybolmaz.
        mobileMenuJustClosedUntilRef.current = Date.now() + 800 // 800ms grace süresi
        setIsHeaderVisible(true)
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
    const menuEl = mobileMenuRef.current as (HTMLElement & { inert?: boolean }) | null
    if (!menuEl) return

    try {
      menuEl.inert = !isMobileMenuOpen
    } catch {
      // Eski tarayıcılar inert'i desteklemiyorsa sessizce yoksay
    }
  }, [isMobileMenuOpen])

  // Hover edilen kategorinin ürünlerini yükle (eğer menuImage yoksa)
  const hoveredCategory = categories.find(c => c.id === hoveredCategoryId)
  const shouldFetchProductData = hoveredCategoryId && hoveredCategory && !hoveredCategory.menuImage
  const { data: hoveredCategoryProducts = [] } = useProductsByCategory(
    shouldFetchProductData ? hoveredCategoryId : undefined
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

    // Ref değerini effect içinde sabitle, cleanup'ta da aynı DOM node'u kullan
    const headerElement = headerContainerRef.current
    if (!headerElement) {
      return
    }

    // Header yüksekliği değiştiğinde güncelle (menü açıldığında/kapandığında)
    const observer = new ResizeObserver(updateHeaderHeight)
    observer.observe(headerElement)

    return () => {
      observer.unobserve(headerElement)
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
    window.addEventListener('resize', onResize, { passive: true })
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
    'tracking-wider uppercase text-gray-300 hover:text-white transition-colors duration-300 header-nav-item'
  const activeLinkClasses = {
    color: 'white',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    opacity: 1,
  }
  const iconBaseSize = 'clamp(22px, 1.2rem + 0.4vw, 30px)'
  const iconClasses =
    'text-gray-300 hover:text-white transition-all duration-300 transform hover:scale-125'
  const sharedIconStyle = {
    width: iconBaseSize,
    height: iconBaseSize,
    display: isMobile ? 'none' : 'flex', // Only apply flex on desktop to avoid forcing visibility
    alignItems: 'center',
    justifyContent: 'center',
  }

  const mobileMenuLinks: { to: string; label: string }[] = [
    { to: '/designers', label: (t('designers') || '').toLocaleUpperCase('en') },
    { to: '/projects', label: (t('projects') || 'Projeler').toLocaleUpperCase('en') },
    { to: '/news', label: (t('news') || '').toLocaleUpperCase('en') },
    { to: '/about', label: (t('about') || '').toLocaleUpperCase('en') },
    { to: '/contact', label: (t('contact') || '').toLocaleUpperCase('en') },
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

  const NavItem: FC<{
    to: string
    children: ReactNode
    onMouseEnter?: () => void
    onClick?: () => void
  }> = ({ to, children, onMouseEnter, onClick }) => {
    const baseStyle = {
      fontSize: 'clamp(10px, 0.2rem + 0.7vw, 14px)', // Aggressive scaling
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
        className={`relative group flex items-center py-2 ${navLinkClasses}`}
        style={({ isActive }) => ({
          ...(isActive ? activeLinkClasses : {}),
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
        })}
      >
        <span
          className="relative flex items-center transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase header-nav-text"
          style={{ ...baseStyle, display: 'flex', alignItems: 'center' }}
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

  /**
   * Header ile ilgili büyük JSX bloklarını küçük parçalara bölen
   * yardımcı render fonksiyonları.
   * Not: Bu fonksiyonlar HOOK kullanmaz, sadece mevcut state/prop değerlerini okur.
   */

  const renderHeaderStyles = () => (
    <style>
      {`
           .hide-scrollbar::-webkit-scrollbar { display: none; }
           .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
           
            .header-scroll-transition {
              transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), 
                          opacity 0.6s ease-out, 
                          scale 0.7s cubic-bezier(0.16, 1, 0.3, 1) !important;
              will-change: transform, opacity, scale;
            }

            .header-layout-transition {
              transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }

            .header-layout-transition-delayed {
              transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.05s !important;
            }
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
            font-size: clamp(10px, 0.2rem + 0.7vw, 14px) !important;
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
            font-size: clamp(10px, 0.2rem + 0.7vw, 14px) !important;
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
          
          /* Overlay mobil menü - tamamen opak, bir tık daha koyu gri arka plan */
          #mobile-menu.mobile-menu-overlay {
            background-color: #111827 !important; /* Tailwind gray-900 - daha koyu gri */
            background: #111827 !important;
          }

          /* Overlay mobil menü AÇIKKEN header'ı da menü paneli ile bire bir aynı renge zorla */
          header.overlay-menu-open > div {
            background-color: #111827 !important; /* Aynı ton - daha koyu gri */
            background: #111827 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
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
            font-family: 'Neue Montreal', 'Jura', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          }

          /* Mobil menüde tıklama/tap mavi highlight'ını yumuşat (mavi yerine hafif beyaz overlay) */
          #mobile-menu button,
          #mobile-menu a {
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.08);
          }

          /* Mobil menüde focus/outlines için mavi yerine nötr gri kullan */
          #mobile-menu a:focus,
          #mobile-menu a:focus-visible,
          #mobile-menu button:focus,
          #mobile-menu button:focus-visible {
            outline-color: rgba(148, 163, 184, 0.6); /* slate-400 civarı nötr gri */
          }
          
        `}
    </style>
  )

  // renderDesktopProductsPanel, renderInlineMobileMenu, renderOverlayMobileMenu, renderSearchPanel
  // ayrı dosyalara taşındı (HeaderProductsPanel, HeaderMobileMenuInline, HeaderMobileMenuOverlay, HeaderSearchPanel)

  return (
    <>
      {renderHeaderStyles()}
      <header
        className={`fixed top-0 left-0 right-0 z-50 header-scroll-transition ${
          // Overlay mobil menü açıkken header ile panelin tam aynı renkte görünmesi için özel sınıf
          isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)
            ? 'overlay-menu-open'
            : ''
          }`}
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
          // Opacity ve scale dış kapsayıcıdan kaldırıldı (sınırların görünmemesi için)
        }}
      >
        <div
          className={`${isOverlayMobileMenu || (isProductsOpen && !isMobile) ? '' : 'overflow-hidden'} ${
            // Header yüksekliği: mobil ve desktop için sabit yükseklik - her zaman
            isMobile
              ? 'h-[3.5rem] min-h-[3.5rem] max-h-[3.5rem]'
              : 'h-[5rem] min-h-[5rem] max-h-[5rem]'
            } ${
            // Arka plan blur'ü: opacity 0 ise blur'ü kaldır (Products açıkken blur aktif)
            headerOpacity <= 0 && !isProductsOpen ? '' : 'backdrop-blur-lg'
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
              // header'ı da mobil menü paneli ile aynı daha koyu gri yap
              if (isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)) {
                return '#111827' // Tailwind gray-900 - daha koyu gri
              }

              // MOBİL: Arka plan açık renkteyse header'ı her zaman belirgin koyu yap
              if (isMobile) {
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

                // Mobil: heroBrightness null = hero görseli yok veya henüz yüklenmedi
                // Koyu hero sayfaları hariç, beyaz arka planlı sayfalarda koyu header
                const isDarkHeroMobile = path === '/' || path === '' || path.includes('about')
                if (!isDarkHeroMobile && window.scrollY <= 10) {
                  // Sayfa arka plan rengini kontrol et
                  const mainEl = document.querySelector('main')
                  if (mainEl) {
                    const bg = window.getComputedStyle(mainEl).backgroundColor
                    if (bg && (bg.includes('255, 255, 255') || bg.includes('255,255,255'))) {
                      return 'rgba(0, 0, 0, 0.85)'
                    }
                  }
                  // Görsel bulunamadıysa ve arka plan da net değilse,
                  // sayfanın body background'ına bak
                  const bodyBg = window.getComputedStyle(document.body).backgroundColor
                  if (
                    bodyBg &&
                    (bodyBg.includes('255, 255, 255') || bodyBg.includes('255,255,255'))
                  ) {
                    return 'rgba(0, 0, 0, 0.85)'
                  }
                }
              }

              // DESKTOP: Arka plan açık renkteyse header'ı koyu yap
              // Koyu hero olan sayfaları (ana sayfa, hakkımızda) hariç tut
              const isDarkHeroPage = path === '/' || path === '' || path.includes('about')
              if (!isMobile && window.scrollY <= 10 && !isDarkHeroPage) {
                if (heroBrightness !== null) {
                  if (heroBrightness >= 0.7) {
                    return 'rgba(0, 0, 0, 0.85)'
                  }
                  if (heroBrightness >= 0.5) {
                    return 'rgba(0, 0, 0, 0.75)'
                  }
                  if (heroBrightness >= 0.35) {
                    return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.65)})`
                  }
                }
                // Hero görseli olmayan sayfalarda (tasarımcılar, iletişim vb.)
                // arka plan beyazsa header şeffaf kalıyor — burada sayfanın
                // arka rengini kontrol et
                if (heroBrightness === null) {
                  const mainEl = document.querySelector('main')
                  if (mainEl) {
                    const bg = window.getComputedStyle(mainEl).backgroundColor
                    // rgb(255,255,255) veya rgba(255,255,255,1) gibi beyaz arka plan kontrolü
                    if (bg && (bg.includes('255, 255, 255') || bg.includes('255,255,255'))) {
                      // Beyaz arka plan — header koyu olsun
                      return 'rgba(0, 0, 0, 0.85)'
                    }
                  }
                }
              }

              // Varsayılan temel opacity
              let baseOpacity = headerOpacity > 0.25 ? Math.max(headerOpacity, 0.4) : 0

              // Desktop ve Mobil için (eğer henüz basOpacity dönülmediyse)
              if (isMobileMenuOpen && !isOverlayMobileMenu) {
                // Inline menü açıksa arkaplan tamamen siyah olmasın, %75 koyulukta olsun
                baseOpacity = Math.min(baseOpacity, 0.75)
              }

              return headerOpacity <= 0.25 && baseOpacity === 0
                ? 'transparent'
                : `rgba(0, 0, 0, ${baseOpacity})`
            })(),
            transition:
              isProductsOpen || (isMobileMenuOpen && !isOverlayMobileMenu)
                ? 'background-color 0.2s ease-out, max-height 0.7s ease-in-out'
                : 'background-color 0.2s ease-out',
            // Overlay mobil menü AÇIKKEN blur'ü tamamen kapat ki panel ile header aynı tonda görünsün
            backdropFilter:
              isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)
                ? 'none'
                : headerOpacity <= 0 && !isProductsOpen
                  ? 'none'
                  : 'blur(16px)',
            WebkitBackdropFilter:
              isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)
                ? 'none'
                : headerOpacity <= 0 && !isProductsOpen
                  ? 'none'
                  : 'blur(16px)',
            // Header altındaki çizgi: sadece arama ve products kapalıyken göster
            borderBottom: headerOpacity <= 0 || isProductsOpen || isSearchOpen ? 'none' : undefined,
            pointerEvents: 'auto',
            // Desktop'ta header yüksekliği her zaman sabit - products dropdown overflow ile gösterilir
            height:
              isMobileMenuOpen && !isOverlayMobileMenu ? 'auto' : isMobile ? '3.5rem' : '5rem',
            minHeight: isMobile ? '3.5rem' : '5rem',
            maxHeight:
              isMobileMenuOpen && !isOverlayMobileMenu ? '40rem' : isMobile ? '3.5rem' : '5rem',
            // Products dropdown için overflow visible
            overflow: isProductsOpen && !isMobile ? 'visible' : undefined,
          }}
          ref={headerContainerRef}
        >
          <nav
            className="mx-auto h-full flex items-center w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] px-4 md:px-8 lg:px-0 header-scroll-transition header-layout-transition"
            ref={navRef}
            style={{
              transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-20px)',
              opacity: isHeaderVisible ? 1 : 0,
              scale: isHeaderVisible ? '1' : '0.8',
              transformOrigin: 'top center',
              transition:
                'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), scale 0.4s cubic-bezier(0.4, 0, 0.2, 1), all 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {/* Üst satır: logo ve menü düğmeleri dikeyde tam ortalı */}
            <div className="relative flex w-full h-full items-center lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center header-layout-transition">
              {/* Sol taraf - Arama + sol menü (desktop) ve arama + logo (mobil) */}
              <div className="flex flex-1 items-center lg:justify-between header-layout-transition">
                {/* Mobil Arama - Solda */}
                {isMobile && (
                  <button
                    ref={searchButtonRef}
                    onClick={() => {
                      if (isSearchOpen) {
                        closeSearch()
                      } else {
                        // Header tamamen şeffafsa (veya neredeyse şeffafsa) arama açıldığında
                        // geçici olarak yarı şeffaf yap; kapanırken eski değere döndür.
                        if (headerOpacity <= 0.05 && previousHeaderOpacityRef.current === null) {
                          previousHeaderOpacityRef.current = headerOpacity
                          setHeaderOpacity(0.7)
                        }
                        setIsSearchOpen(true)
                      }
                    }}
                    className="group p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white"
                    aria-label={
                      isSearchOpen
                        ? t('close_search') || 'Aramayı kapat'
                        : t('open_search') || 'Ara'
                    }
                    aria-expanded={isSearchOpen}
                    aria-controls="search-panel"
                  >
                    {/* Search → X arasında yumuşak geçiş animasyonu */}
                    <span className="relative flex items-center justify-center w-6 h-6">
                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${isSearchOpen
                          ? 'opacity-0 scale-75 rotate-90'
                          : 'opacity-100 scale-100 rotate-0'
                          }`}
                      >
                        <SearchIcon />
                      </span>
                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${isSearchOpen
                          ? 'opacity-100 scale-100 rotate-0'
                          : 'opacity-0 scale-75 -rotate-90'
                          }`}
                      >
                        <CloseIcon />
                      </span>
                    </span>
                  </button>
                )}

                {/* Mobil Logo - Ortada */}
                <div className="lg:hidden flex items-center absolute left-1/2 -translate-x-1/2">
                  <Link to="/" className="flex items-center gap-1.5 text-white transition-colors">
                    <SiteLogo logoUrl={settings?.logoUrl} className="w-32 h-5" />
                  </Link>
                </div>
                {/* Desktop Arama (masaüstü) - Sol tarafta */}
                {!isMobile && (
                  <button
                    ref={searchButtonRef}
                    onClick={() => {
                      // Desktop: Header tamamen şeffafsa (veya neredeyse şeffafsa) arama açıldığında
                      // geçici olarak yarı şeffaf yap; kapanırken eski değere döndür.
                      if (
                        !isSearchOpen &&
                        headerOpacity <= 0.05 &&
                        previousHeaderOpacityRef.current === null
                      ) {
                        previousHeaderOpacityRef.current = headerOpacity
                        setHeaderOpacity(0.7)
                      }

                      if (isSearchOpen) {
                        closeSearch()
                      } else {
                        setIsSearchOpen(true)
                      }
                    }}
                    className={`${iconClasses} hidden lg:inline-flex`}
                    style={sharedIconStyle}
                    aria-label={
                      isSearchOpen
                        ? t('close_search') || 'Aramayı kapat'
                        : t('open_search') || 'Ara'
                    }
                    aria-expanded={isSearchOpen}
                    aria-controls="search-panel"
                  >
                    {/* Search → X arasında yumuşak geçiş animasyonu */}
                    <span className="relative flex items-center justify-center w-6 h-6">
                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${isSearchOpen
                          ? 'opacity-0 scale-75 rotate-90'
                          : 'opacity-100 scale-100 rotate-0'
                          }`}
                      >
                        <SearchIcon />
                      </span>
                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${isSearchOpen
                          ? 'opacity-100 scale-100 rotate-0'
                          : 'opacity-0 scale-75 -rotate-90'
                          }`}
                      >
                        <CloseIcon />
                      </span>
                    </span>
                  </button>
                )}

                {/* Desktop Menü - Logo'nun solundaki linkler (eşit aralıklarla dağıtılmış) */}
                <div
                  ref={productsButtonRef}
                  className="relative hidden lg:block"
                  onMouseEnter={handleProductsEnter}
                  onMouseLeave={handleProductsLeave}
                >
                  <Link
                    to="/categories"
                    className={`group flex items-center space-x-1 py-2 ${navLinkClasses}`}
                    onClick={() => setIsProductsOpen(false)}
                    style={{
                      fontSize: 'clamp(11px, 0.4rem + 0.5vw, 14px)',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      fontFamily: 'inherit',
                      lineHeight: '1.25rem',
                    }}
                  >
                    <span
                      className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase header-nav-text"
                      style={{
                        fontSize: 'clamp(0.7rem, 0.5rem + 0.3vw, 0.875rem)',
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
                <div className="hidden lg:flex items-center">
                  <NavItem
                    to="/designers"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('designers')}
                  </NavItem>
                </div>
                <div className="hidden lg:flex items-center">
                  <NavItem
                    to="/projects"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('projects') || 'Projeler'}
                  </NavItem>
                </div>

                {/* Görünmez çapa: Boşluğu 4'e bölmek için 5. nokta (Logo sınırı) */}
                <div className="hidden lg:block w-0" aria-hidden="true" />
              </div>

              {/* Orta - Logo (Desktop) */}
              <div className="hidden lg:flex items-center justify-center header-layout-transition-delayed">
                <Link to="/" className="flex items-center gap-3 text-white transition-colors">
                  <div
                    style={{
                      width: 'clamp(110px, 10vw + 50px, 288px)', // Smaller minimum to avoid collision
                    }}
                  >
                    <SiteLogo logoUrl={settings?.logoUrl} className="w-full h-auto" />
                  </div>
                </Link>
              </div>

              {/* Sağ taraf - Logo'nun sağındaki linkler + ikonlar */}
              <div className="flex flex-1 items-center justify-end lg:justify-between header-layout-transition">
                {/* Görünmez çapa: Boşluğu 4'e bölmek için 1. nokta (Logo sınırı) */}
                <div className="hidden lg:block w-0" aria-hidden="true" />

                {/* Desktop Menü - Logo'nun sağındaki linkler (eşit aralıklarla dağıtılmış) */}
                <div className="hidden lg:flex items-center">
                  <NavItem
                    to="/news"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('news')}
                  </NavItem>
                </div>
                <div className="hidden lg:flex items-center">
                  <NavItem
                    to="/about"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('about')}
                  </NavItem>
                </div>
                <div className="hidden lg:flex items-center">
                  <NavItem
                    to="/contact"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('contact')}
                  </NavItem>
                </div>

                <div className="hidden lg:flex items-center space-x-4">
                  <div
                    className="flex items-center"
                    style={{ fontSize: 'clamp(11px, 0.4rem + 0.5vw, 15px)' }}
                  >
                    {supportedLocales.map((langCode, index) => {
                      const isLast = index === supportedLocales.length - 1
                      const isActive = locale === langCode
                      return (
                        <Fragment key={langCode}>
                          <button
                            onClick={() => setLocale(langCode)}
                            className={`relative transition-all duration-300 uppercase ${isActive ? 'text-gray-300' : 'text-gray-400 hover:text-gray-200'
                              }`}
                            style={{
                              fontWeight: 100,
                              fontFamily: "'Jura', 'Neue Montreal', sans-serif",
                              letterSpacing: '0.25em',
                              transform: 'scale(0.9, 1.35)',
                              transformOrigin: 'center center',
                              display: 'inline-block',
                            }}
                          >
                            {langCode}
                          </button>
                          {!isLast && <span className="mx-1 text-gray-400">|</span>}
                        </Fragment>
                      )
                    })}
                  </div>
                  <NavLink
                    to={isLoggedIn ? '/profile' : '/login'}
                    className={`${iconClasses}`}
                    style={sharedIconStyle}
                    aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
                  >
                    {isLoggedIn ? <UserLoggedInIcon /> : <UserIcon />}
                  </NavLink>
                  {settings?.showCartButton === true && (
                    <button
                      onClick={toggleCart}
                      className={`relative ${iconClasses}`}
                      style={sharedIconStyle}
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
                </div>
                <div className="lg:hidden flex items-center">
                  {/* Settings yüklenene kadar hamburger butonunu gizle - böylece yanlış stil gösterilmez */}
                  {!settings ? null : isOverlayMobileMenu ? (
                    // Overlay modunda: hamburger → X animasyonu
                    <button
                      ref={mobileMenuButtonRef}
                      onClick={() => {
                        const willOpen = !isMobileMenuOpen
                        setIsMobileMenuOpen(willOpen)
                        // Menü tamamen KAPANIRKEN ürünler alt menüsünü de sıfırla
                        if (!willOpen) {
                          setIsMobileProductsMenuOpen(false)
                        }
                        // Menü KAPANIRKEN header her durumda görünür kalsın
                        if (!willOpen) {
                          setIsHeaderVisible(true)
                          headerVisibilityLastChanged.current = Date.now()
                        }
                      }}
                      className="group p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                      aria-label={
                        isMobileMenuOpen
                          ? t('close_menu') || 'Menüyü kapat'
                          : t('open_menu') || 'Menüyü aç'
                      }
                      aria-expanded={isMobileMenuOpen}
                      aria-controls="mobile-menu"
                    >
                      <div className="flex flex-col gap-1.5 items-center w-6">
                        {/* Üst Çizgi: 45 derece döner ve aşağı iner */}
                        <span
                          className={`h-0.5 w-6 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                            }`}
                        ></span>
                        {/* Orta Çizgi: Kaybolur */}
                        <span
                          className={`h-0.5 w-6 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''
                            }`}
                        ></span>
                        {/* Alt Çizgi: -45 derece döner ve yukarı çıkar */}
                        <span
                          className={`h-0.5 w-6 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                            }`}
                        ></span>
                      </div>
                    </button>
                  ) : (
                    <button
                      ref={mobileMenuButtonRef}
                      onClick={() => {
                        const willOpen = !isMobileMenuOpen
                        setIsMobileMenuOpen(willOpen)
                        // Menü tamamen KAPANIRKEN ürünler alt menüsünü de sıfırla
                        if (!willOpen) {
                          setIsMobileProductsMenuOpen(false)
                        }
                        // Menü KAPANIRKEN header her durumda görünür kalsın
                        if (!willOpen) {
                          setIsHeaderVisible(true)
                          headerVisibilityLastChanged.current = Date.now()
                        }
                      }}
                      className="group p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
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
          {/* Desktop ürün paneli */}
          <HeaderProductsPanel
            isOpen={isProductsOpen}
            categories={categories}
            hoveredCategoryId={hoveredCategoryId}
            onHoveredCategoryChange={setHoveredCategoryId}
            categoryProducts={categoryProducts}
            submenuOffset={submenuOffset}
            onEnter={handleProductsEnter}
            onLeave={handleProductsLeave}
            onClose={handleCloseProducts}
            t={t}
          />
          {/* Inline mobil menü (overlay olmayan mod) */}
          <HeaderMobileMenuInline
            isOpen={!isOverlayMobileMenu && isMobileMenuOpen}
            isMobileProductsMenuOpen={isMobileProductsMenuOpen}
            categories={categories}
            settings={settings}
            supportedLocales={supportedLocales}
            locale={locale}
            t={t}
            isLoggedIn={isLoggedIn}
            iconClasses={iconClasses}
            onLocaleChange={handleMobileLocaleChange}
            onToggleProductsMenu={() => setIsMobileProductsMenuOpen(!isMobileProductsMenuOpen)}
            onCloseAll={() => setIsMobileMenuOpen(false)}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            setIsMobileProductsMenuOpen={setIsMobileProductsMenuOpen}
            mobileMenuRef={mobileMenuRef}
            mobileMenuFocusTrap={mobileMenuFocusTrap}
          />
        </div>
      </header>

      <HeaderMobileMenuOverlay
        isOverlayMobileMenu={isOverlayMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
        isMobileProductsMenuOpen={isMobileProductsMenuOpen}
        settings={settings}
        supportedLocales={supportedLocales}
        locale={locale}
        t={t}
        isLoggedIn={isLoggedIn}
        iconClasses={iconClasses}
        categories={categories}
        headerHeight={headerHeight}
        mobileMenuLinks={mobileMenuLinks}
        mobileMenuCloseDelay={mobileMenuCloseDelay}
        subscribeEmail={subscribeEmail}
        isMobileLocaleTransition={isMobileLocaleTransition}
        footerContent={footerContent}
        onLocaleChange={handleMobileLocaleChange}
        onToggleProductsMenu={() => setIsMobileProductsMenuOpen(!isMobileProductsMenuOpen)}
        onCloseAll={() => setIsMobileMenuOpen(false)}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsMobileProductsMenuOpen={setIsMobileProductsMenuOpen}
        setSubscribeEmail={setSubscribeEmailState}
        subscribeEmailService={handleHeaderSubscribeEmail}
        mobileMenuRef={mobileMenuRef}
        mobileMenuFocusTrap={mobileMenuFocusTrap}
      />

      <HeaderSearchPanel
        isOpen={isSearchOpen}
        isMobile={isMobile}
        isHeaderVisible={isHeaderVisible}
        headerHeight={headerHeight}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        allData={allData}
        t={t}
        closeSearch={closeSearch}
        searchPanelRef={searchPanelRef}
        searchInputRef={searchInputRef}
      />
    </>
  )
}
