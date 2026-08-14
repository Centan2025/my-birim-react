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
  const {theme: headerTheme, reset: resetHeaderTheme} = useHeaderTheme()

  const {isDarkMode} = useDarkMode()
  const {isLoggedIn} = useAuth()
  const {cartCount, toggleCart} = useCart()
  const [headerOpacity, setHeaderOpacity] = useState(() =>
    typeof window !== 'undefined' && isDarkHeroPageUtil(window.location.pathname) ? 0 : 0.7
  )
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  // Logic to determine if we are on a "Dark Hero" page (transparent header potential)
  const isDarkHeroPage = useCallback((p: string) => isDarkHeroPageUtil(p), [])

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const [headerHeight, setHeaderHeight] = useState(56) // 3.5rem = 56px (mobil için varsayılan)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)
  const isDarkHero = isDarkHeroPage(location.pathname)

  // Track whether scroll has passed the hero bottom boundary
  const [isPastHero, setIsPastHero] = useState(false)

  useEffect(() => {
    if (!isDarkHero) {
      setIsPastHero(false)
      return
    }
    const update = () => {
      const heroEl = document.querySelector('.hero-section') as HTMLElement | null
      const heroBottom = heroEl ? heroEl.offsetTop + heroEl.offsetHeight : window.innerHeight
      setIsPastHero(window.scrollY >= heroBottom - headerHeight)
    }
    update()
    window.addEventListener('scroll', update, {passive: true})
    return () => window.removeEventListener('scroll', update)
  }, [isDarkHero, headerHeight, location.pathname])

  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > 20 : false
  )

  useEffect(() => {
    const handleScrollState = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScrollState()
    window.addEventListener('scroll', handleScrollState, {passive: true})
    return () => window.removeEventListener('scroll', handleScrollState)
  }, [location.pathname])

  // isDarkHero pages: white text at top, black after hero bottom boundary.
  // Standard pages: always dark text.
  // Search open: always dark text (white panel bg).
  // Mobile overlay menu: always dark text.
  const isLightMode =
    (!isDarkHero || headerTheme.mode === 'light' || isPastHero || isSearchOpen) &&
    !(isMobile && isMobileMenuOpen)

  const headerForegroundColor = isLightMode ? '#000000' : '#ffffff'
  const headerLogoFilter = isLightMode ? 'invert(1) brightness(0.95)' : 'none'
  const iconBrightness = isLightMode ? 'brightness(0)' : 'none'
  // Color transition only when scrolling on Dark Hero pages to prevent white-to-black morphing flash
  const colorTransition = isDarkHero ? 'color 0.25s ease, filter 0.25s ease' : 'none'

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

  // Sayfa değiştiğinde state'leri ve scroll takibini sıfırla
  useEffect(() => {
    currentRouteRef.current = location.pathname

    lastScrollYRef.current = 0
    lastScrollForHeader.current = 0
    opacitySetByHandleScrollRef.current = false
    setIsHeaderVisible(true)
    resetHeaderTheme()
    setIsMobileMenuOpen(false)
    setIsMobileMenuClosing(false)
    setIsSearchOpen(false)
    setIsProductsOpen(false)
    mobileMenuJustClosedUntilRef.current = 0
    if (mobileMenuCloseTimeoutRef.current) {
      clearTimeout(mobileMenuCloseTimeoutRef.current)
      mobileMenuCloseTimeoutRef.current = null
    }

    // Header opacity'yi sayfa türüne göre ayarla (koyu hero varsa 0, ürün detayı gibi standart sayfalarda 0.7)
    setHeaderOpacity(isDarkHeroPageUtil(location.pathname) ? 0 : 0.7)

    const checkScroll = () => {
      if (currentRouteRef.current !== location.pathname) {
        return
      }

      const currentScrollY = window.scrollY
      if (isMobile && currentScrollY === 0) {
        setHeaderOpacity(isDarkHeroPageUtil(location.pathname) ? 0 : 0.7)
        setIsHeaderVisible(true)
      }
    }
    checkScroll()
    const timeoutId = setTimeout(checkScroll, 50)
    return () => clearTimeout(timeoutId)
  }, [location.pathname, isMobile, resetHeaderTheme])

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

  const prevIsMobileMenuOpenRef = useRef(isMobileMenuOpen)
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
      } else if (prevIsMobileMenuOpenRef.current && !isMobileMenuOpen) {
        // Menü KAPANIRKEN: belirli bir süre boyunca header'ın gizlenmesini engelle
        // Böylece kullanıcı close'a bastığı anda header kaybolmaz.
        mobileMenuJustClosedUntilRef.current = Date.now() + 800 // 800ms grace süresi
        setIsHeaderVisible(true)
      }
    }
    prevIsMobileMenuOpenRef.current = isMobileMenuOpen
  }, [isMobile, isMobileMenuOpen, isSearchOpen])

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
  const iconBaseSize = 'clamp(16px, 0.8rem + 0.3vw, 20px)'
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
    transition: colorTransition,
  }

  const mobileMenuLinks: {to: string; label: string}[] = [
    {to: '/designers', label: (t('designers') || '').toLocaleUpperCase('en')},
    {to: '/projects', label: (t('projects') || 'Projeler').toLocaleUpperCase('en')},
    ...(settings?.isFactoryVisible
      ? [{to: '/factory', label: (t('factory') || 'Fabrika').toLocaleUpperCase('en')}]
      : []),
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
      fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
      fontWeight: 500,
      letterSpacing: '0.05em',
      fontFamily: "'Inter', sans-serif",
      lineHeight: '1.25rem',
      color: headerForegroundColor,
      transition: colorTransition,
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
            className="absolute -bottom-1 left-0 w-full h-[1px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"
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
    isLightMode,
  })

  const isBottomLineVisible =
    (isScrolled || isProductsOpen || (isMobile && isMobileMenuOpen) || isSearchOpen) &&
    headerBgColor !== 'transparent'

  return (
    <>
      <HeaderStyles />
      <header
        className={`fixed top-0 left-0 right-0 z-50 header-scroll-transition ${
          // Overlay mobil menü açıkken header ile panelin tam aynı renkte görünmesi için özel sınıf
          isOverlayMobileMenu && isMobileMenuOpen ? 'overlay-menu-open' : ''
        }`}
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: isMobile
            ? 'transform 0.2s ease-out'
            : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className={`${isOverlayMobileMenu || (isProductsOpen && !isMobile) ? '' : 'overflow-hidden'} ${
            // Header yüksekliği: mobil ve desktop için sabit yükseklik - her zaman
            isMobile
              ? 'h-[3.5rem] min-h-[3.5rem] max-h-[3.5rem]'
              : 'h-[5rem] min-h-[5rem] max-h-[5rem]'
          } ${
            // Arka plan buz efekti: şeffafken blur yok, yarı şeffaf beyaz/siyahken buz efekti aktif
            headerBgColor === 'transparent' && !isProductsOpen
              ? ''
              : 'header-frosted-glass backdrop-blur-xl backdrop-saturate-150 shadow-sm'
          } ${
            // Sadece menü açıldığında transition ve max-height değişimi
            isProductsOpen || (isMobileMenuOpen && !isOverlayMobileMenu)
              ? 'transition-all duration-700 ease-in-out'
              : 'transition-[background-color,backdrop-filter] duration-300'
          } relative`}
          style={{
            backgroundColor: headerBgColor,
            WebkitBackdropFilter:
              headerBgColor === 'transparent' && !isProductsOpen
                ? 'none'
                : 'blur(24px) saturate(180%)',
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
              transition: isMobile
                ? 'opacity 0.15s ease-out, transform 0.15s ease-out'
                : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), scale 0.4s cubic-bezier(0.4, 0, 0.2, 1), all 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {/* Üst satır: grid stretch (tam yükseklik), içindeki hücreler alttan hizalı */}
            <div className="grid grid-cols-[1fr_auto_1fr] w-full h-full items-center header-layout-transition">
              {/* Sol taraf - Arama + sol menü (desktop) ve arama (mobil) */}
              <div className="flex h-full items-center lg:items-end justify-start lg:gap-6 xl:gap-8 lg:pb-6 lg:translate-y-[6px] header-layout-transition">
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
                    style={{color: headerForegroundColor, transition: colorTransition}}
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
                      fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
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
                        fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
                        fontWeight: 500, // Re-applying the 500 from previous request
                        letterSpacing: '0.05em',
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: '1.25rem',
                      }}
                    >
                      {t('products')}
                      <span
                        className={`absolute -bottom-1 left-0 w-full h-[1px] transition-transform duration-300 ease-out origin-center ${isProductsOpen ? 'scale-x-0 opacity-0' : 'transform scale-x-0 group-hover:scale-x-100'}`}
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
              </div>

              {/* Orta - Logo (Tüm Ekranlar için Grid Sütun 2) */}
              <div className="flex h-full items-center lg:items-end justify-center lg:pb-6 px-2 header-layout-transition-delayed pointer-events-auto">
                <Link
                  to="/"
                  className="flex items-center lg:items-end gap-3 transition-colors"
                  style={{color: headerForegroundColor}}
                >
                  <div className="w-28 sm:w-32 lg:w-[clamp(110px,10vw+50px,288px)]">
                    <SiteLogo
                      logoUrl={settings?.logoUrl}
                      className="w-full h-auto"
                      style={{filter: headerLogoFilter, transition: colorTransition}}
                    />
                  </div>
                </Link>
              </div>

              {/* Sağ taraf - Logo'nun sağındaki linkler + ikonlar */}
              <div className="flex h-full items-center lg:items-end justify-end gap-3 lg:gap-6 xl:gap-8 lg:pb-6 lg:translate-y-[6px] header-layout-transition">
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
                {settings?.isFactoryVisible && (
                  <div className="hidden lg:flex items-end">
                    <NavItem
                      to="/factory"
                      onMouseEnter={handleCloseProducts}
                      onClick={handleCloseProducts}
                    >
                      {t('factory') || 'FABRİKA'}
                    </NavItem>
                  </div>
                )}
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
                    style={{fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)'}}
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
                              fontSize: 'clamp(9px, 0.2rem + 0.5vw, 11px)',
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
          {/* Animated Bottom Border Line - en üste çıkınca uzaklaşarak (scaleX-0 / opacity-0) kaybolur */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none origin-center"
            style={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              opacity: isBottomLineVisible ? 1 : 0,
              transform: isBottomLineVisible ? 'scaleX(1)' : 'scaleX(0)',
              transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out',
            }}
            aria-hidden="true"
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
