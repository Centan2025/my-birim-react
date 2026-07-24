import {useState, useEffect, useRef, FC, Fragment, useCallback, ReactNode} from 'react'
import {Link, NavLink, useLocation} from 'react-router-dom'
import {isDarkHeroPage as isDarkHeroPageUtil} from '../utils/headerUtils'
import type {SiteSettings, Product, FooterContent} from '../types'
import {
  getSiteSettings,
  getFooterContent,
  subscribeEmail as subscribeEmailService,
} from '../services/cms'
import {useAuth} from '../context/AuthContext'
import {SiteLogo} from './SiteLogo'
import {HeaderProductsPanel} from './HeaderProductsPanel'
import {HeaderMobileMenuInline} from './HeaderMobileMenuInline'
import {HeaderMobileMenuOverlay} from './HeaderMobileMenuOverlay'
import {HeaderSearchPanel} from './HeaderSearchPanel'
import {HeaderStyles} from './HeaderStyles'
import {useTranslation} from '../i18n'
import {useCart} from '../context/CartContext'
import {useCategories} from '../hooks/useCategories'
import {useProductsByCategory} from '../hooks/useProducts'
import {useFocusTrap} from '../hooks/useFocusTrap'
import {useHeaderScroll} from '../hooks/useHeaderScroll'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import {useHeaderSearch} from '../hooks/useHeaderSearch'
import {useHeroBrightness} from '../hooks/useHeroBrightness'
import {useHeaderBackgroundColor} from '../hooks/useHeaderBackgroundColor'
import {useBodyScrollLock} from '../hooks/useBodyScrollLock'
import {MenuIcon, ChevronDownIcon, SearchIcon, CloseIcon, ShoppingBagIcon} from './HeaderIcons'
import {useDarkMode} from '../context/DarkModeContext'

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="18.36" x2="5.64" y2="19.78" />
    <line x1="18.36" y1="4.22" x2="19.78" y2="5.64" />
  </svg>
)

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

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
  const {theme: headerTheme} = useHeaderTheme()

  const {isDarkMode, toggleTheme} = useDarkMode()
  const {isLoggedIn} = useAuth()
  const {cartCount, toggleCart} = useCart()
  const [headerOpacity, setHeaderOpacity] = useState(0)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  // Logic to determine if we are on a "Dark Hero" page (transparent header potential)
  const isDarkHeroPage = useCallback((p: string) => isDarkHeroPageUtil(p), [])

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const [headerHeight, setHeaderHeight] = useState(56) // 3.5rem = 56px (mobil için varsayılan)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)
  const isDarkHero = isDarkHeroPage(location.pathname)

  // On standard pages (white pages) WE MUST USE DARK TEXT
  // On dark hero pages, if we scrolled or the hero is light, use DARK TEXT
  // Logic: Use Dark Text (isLightMode = true) only if background is actually light.
  // Mobile search and menu are always dark, so isLightMode must be false then.
  const isLightMode =
    (!isDarkHero || headerTheme.mode === 'light' || headerOpacity > 0.5) &&
    !(isMobile && (isSearchOpen || isMobileMenuOpen || isMobileMenuClosing))

  const headerForegroundColor = isLightMode ? '#000000' : '#ffffff'
  const headerLogoFilter = isLightMode ? 'invert(1) brightness(0.95)' : 'none'
  const iconBrightness = isLightMode ? 'brightness(0)' : 'none'

  const lastScrollYRef = useRef(0)
  const headerVisibilityLastChanged = useRef(0)
  const mobileMenuJustClosedUntilRef = useRef(0)
  const lastScrollForHeader = useRef(0) // Header visibility için ayrı scroll takibi
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
  // Mobilde her zaman tam ekran (overlay) menü stilini çalıştır
  const isOverlayMobileMenu = isMobile

  // Search logic hook
  const {searchQuery, setSearchQuery, searchResults, isSearching, allData, internalCloseSearch} =
    useHeaderSearch(isSearchOpen)

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
  const {heroBrightnessRef} = useHeroBrightness(isMobile, location.pathname, headerTheme.brightness)

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

    window.addEventListener('scroll', handleHeaderVisibility, {passive: true})
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
    isMobileMenuOpen,
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

  // Mobil menü AÇIKKEN body scroll'unu kilitle
  useBodyScrollLock(isMobile && isMobileMenuOpen)

  // Mobil menü kapalıyken odaklanılmasını tamamen engelle (inert davranışı)
  useEffect(() => {
    const menuEl = mobileMenuRef.current as (HTMLElement & {inert?: boolean}) | null
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
  const {data: hoveredCategoryProducts = []} = useProductsByCategory(
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
    color: headerForegroundColor,
    filter: iconBrightness,
  }

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

  const NavItem: FC<{
    to: string
    children: ReactNode
    onMouseEnter?: () => void
    onClick?: () => void
  }> = ({to, children, onMouseEnter, onClick}) => {
    const baseStyle = {
      fontSize: 'clamp(11px, 0.3rem + 0.7vw, 15px)', // Aggressive scaling
      fontWeight: 500,
      letterSpacing: '0.05em',
      fontFamily: "'Inter', sans-serif",
      lineHeight: '1.25rem',
      color: headerForegroundColor,
    }
    return (
      <NavLink
        to={to}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={`relative group flex items-end pb-0 pt-2 ${navLinkClasses}`}
        style={({isActive}) => ({
          ...(isActive ? activeLinkClasses : {}),
          ...baseStyle,
          display: 'flex',
          alignItems: 'flex-end',
        })}
      >
        <span
          className="relative flex items-end transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase header-nav-text"
          style={{...baseStyle, display: 'flex', alignItems: 'flex-end'}}
        >
          {children}
          <span
            className="absolute -bottom-1 left-0 w-full h-[3px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"
            style={{backgroundColor: headerForegroundColor}}
          ></span>
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

  // renderDesktopProductsPanel, renderInlineMobileMenu, renderOverlayMobileMenu, renderSearchPanel
  // ayrı dosyalara taşındı (HeaderProductsPanel, HeaderMobileMenuInline, HeaderMobileMenuOverlay, HeaderSearchPanel)

  // Background color calculation (extracted from inline IIFE)
  const headerBgColor = useHeaderBackgroundColor({
    isMobile,
    isProductsOpen,
    headerOpacity,
    isMobileMenuOpen,
    isOverlayMobileMenu,
    isMobileMenuClosing,
    isSearchOpen,
    isDarkMode,
  })

  return (
    <>
      <HeaderStyles />
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
            backgroundColor: headerBgColor,
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
            {/* Üst satır: grid stretch (tam yükseklik), içindeki hücreler alttan hizalı */}
            <div className="relative flex w-full h-full items-center lg:grid lg:grid-cols-[1fr_auto_1fr] header-layout-transition">
              {/* Sol taraf - Arama + sol menü (desktop) ve arama + logo (mobil) */}
              <div className="flex flex-1 h-full items-center lg:items-end lg:justify-between lg:pb-6 lg:translate-y-[6px] header-layout-transition">
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
                    className="group p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                    style={{color: headerForegroundColor}}
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
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                          isSearchOpen
                            ? 'opacity-0 scale-75 rotate-90'
                            : 'opacity-100 scale-100 rotate-0'
                        }`}
                      >
                        <SearchIcon />
                      </span>
                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                          isSearchOpen
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
                  <Link
                    to="/"
                    className="flex items-center gap-1.5 transition-colors"
                    style={{color: headerForegroundColor}}
                  >
                    <SiteLogo
                      logoUrl={settings?.logoUrl}
                      className="w-32 h-5"
                      style={{filter: headerLogoFilter}}
                    />
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
                    style={{...sharedIconStyle, color: headerForegroundColor}}
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
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                          isSearchOpen
                            ? 'opacity-0 scale-75 rotate-90'
                            : 'opacity-100 scale-100 rotate-0'
                        }`}
                      >
                        <SearchIcon />
                      </span>
                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                          isSearchOpen
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
                    className={`group flex items-end space-x-1 pb-0 pt-2 ${navLinkClasses}`}
                    onClick={() => setIsProductsOpen(false)}
                    style={{
                      fontSize: 'clamp(12px, 0.4rem + 0.6vw, 15px)',
                      fontWeight: 500, // Re-applying the 500 from previous request
                      letterSpacing: '0.05em',
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: '1.25rem',
                      color: headerForegroundColor,
                    }}
                  >
                    <span
                      className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase header-nav-text"
                      style={{
                        fontSize: 'clamp(0.75rem, 0.5rem + 0.4vw, 0.9375rem)',
                        fontWeight: 500, // Re-applying the 500 from previous request
                        letterSpacing: '0.05em',
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: '1.25rem',
                      }}
                    >
                      {t('products')}
                      <span
                        className={`absolute -bottom-1 left-0 w-full h-[3px] transition-transform duration-300 ease-out origin-center ${isProductsOpen ? 'scale-x-0 opacity-0' : 'transform scale-x-0 group-hover:scale-x-100'}`}
                        style={{backgroundColor: headerForegroundColor}}
                      ></span>
                    </span>
                    <div style={{filter: iconBrightness}}>
                      <ChevronDownIcon />
                    </div>
                  </Link>
                </div>
                <div className="hidden lg:flex items-end">
                  <NavItem
                    to="/designers"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('designers')}
                  </NavItem>
                </div>
                <div className="hidden lg:flex items-end">
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
              <div className="hidden lg:flex h-full items-end justify-center lg:pb-6 header-layout-transition-delayed">
                <Link
                  to="/"
                  className="flex items-end gap-3 transition-colors"
                  style={{color: headerForegroundColor}}
                >
                  <div
                    style={{
                      width: 'clamp(110px, 10vw + 50px, 288px)', // Smaller minimum to avoid collision
                    }}
                  >
                    <SiteLogo
                      logoUrl={settings?.logoUrl}
                      className="w-full h-auto"
                      style={{filter: headerLogoFilter}}
                    />
                  </div>
                </Link>
              </div>

              {/* Sağ taraf - Logo'nun sağındaki linkler + ikonlar */}
              <div className="flex flex-1 h-full items-center lg:items-end justify-end lg:justify-between lg:pb-6 lg:translate-y-[6px] header-layout-transition">
                {/* Görünmez çapa: Boşluğu 4'e bölmek için 1. nokta (Logo sınırı) */}
                <div className="hidden lg:block w-0" aria-hidden="true" />

                {/* Desktop Menü - Logo'nun sağındaki linkler (eşit aralıklarla dağıtılmış) */}
                <div className="hidden lg:flex items-end">
                  <NavItem
                    to="/news"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('news')}
                  </NavItem>
                </div>
                <div className="hidden lg:flex items-end">
                  <NavItem
                    to="/about"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('about')}
                  </NavItem>
                </div>
                <div className="hidden lg:flex items-end">
                  <NavItem
                    to="/contact"
                    onMouseEnter={handleCloseProducts}
                    onClick={handleCloseProducts}
                  >
                    {t('contact')}
                  </NavItem>
                </div>

                <div className="hidden lg:flex items-end space-x-4">
                  <div
                    className="flex items-center"
                    style={{fontSize: 'clamp(12px, 0.4rem + 0.6vw, 16px)'}}
                  >
                    {supportedLocales.map((langCode, index) => {
                      const isLast = index === supportedLocales.length - 1
                      const isActive = locale === langCode
                      return (
                        <Fragment key={langCode}>
                          <button
                            onClick={() => setLocale(langCode)}
                            className={`relative transition-all duration-300 lowercase`}
                            style={{
                              fontWeight: 500,
                              fontFamily: "'Inter', sans-serif",
                              letterSpacing: '0.05em',
                              fontSize: 'clamp(12px, 0.4rem + 0.6vw, 15px)',
                              color: isActive
                                ? headerForegroundColor
                                : `${headerForegroundColor}80`, // 50% opacity for inactive
                              opacity: isActive ? 1 : 0.6,
                            }}
                          >
                            {langCode.toLowerCase()}
                          </button>
                          {!isLast && (
                            <span className="mx-1" style={{color: `${headerForegroundColor}40`}}>
                              |
                            </span>
                          )}
                        </Fragment>
                      )
                    })}
                  </div>

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`${iconClasses}`}
                    style={{...sharedIconStyle, color: headerForegroundColor}}
                    aria-label={isDarkMode ? t('light_mode') : t('dark_mode')}
                  >
                    <span className="relative flex items-center justify-center w-6 h-6">
                      <span
                        className={`absolute transition-all duration-500 ${isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                      >
                        <SunIcon />
                      </span>
                      <span
                        className={`absolute transition-all duration-500 ${!isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`}
                      >
                        <MoonIcon />
                      </span>
                    </span>
                  </button>

                  {settings?.showCartButton === true && (
                    <button
                      onClick={toggleCart}
                      className={`relative ${iconClasses}`}
                      style={{...sharedIconStyle, color: headerForegroundColor}}
                      aria-label={`${t('cart') || 'Sepet'}${cartCount > 0 ? ` (${cartCount} ${t('items') || 'ürün'})` : ''}`}
                      aria-expanded={false}
                    >
                      <ShoppingBagIcon />
                      {cartCount > 0 && (
                        <span
                          className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-white border"
                          aria-hidden="true"
                        >
                          {cartCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <div className="lg:hidden flex items-center">
                  {isOverlayMobileMenu ? (
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
                      <div
                        className="flex flex-col gap-1.5 items-center w-6"
                        style={{filter: iconBrightness}}
                      >
                        {/* Üst Çizgi: 45 derece döner ve aşağı iner */}
                        <span
                          className={`h-0.5 w-6 transition-all duration-300 ${
                            isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                          }`}
                          style={{backgroundColor: headerForegroundColor}}
                        ></span>
                        {/* Orta Çizgi: Kaybolur */}
                        <span
                          className={`h-0.5 w-6 transition-all duration-300 ${
                            isMobileMenuOpen ? 'opacity-0' : ''
                          }`}
                          style={{backgroundColor: headerForegroundColor}}
                        ></span>
                        {/* Alt Çizgi: -45 derece döner ve yukarı çıkar */}
                        <span
                          className={`h-0.5 w-6 transition-all duration-300 ${
                            isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                          }`}
                          style={{backgroundColor: headerForegroundColor}}
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
            isLightMode={isLightMode}
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
        isLightMode={isLightMode}
      />
    </>
  )
}
