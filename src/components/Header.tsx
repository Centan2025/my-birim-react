import {useState, useEffect, useRef, FC, Fragment, useCallback, ReactNode} from 'react'
import {Link, NavLink, useLocation} from 'react-router-dom'
import {motion} from 'framer-motion'
import {isDarkHeroPage as isDarkHeroPageUtil, isFullscreenDarkPage} from '../utils/headerUtils'
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
import {MenuIcon, ChevronDownIcon, SearchIcon, CloseIcon} from './HeaderIcons'
import {useDarkMode} from '../context/DarkModeContext'
import {useSelection} from '../context/SelectionContext'
import {getShopBaseUrl, isShopNavVisible} from '../utils/shopBridge'

export function Header() {
  const {t, setLocale, locale, supportedLocales} = useTranslation()
  const location = useLocation()
  const {data: categories = []} = useCategories()
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const isProductsOpenRef = useRef(isProductsOpen)
  isProductsOpenRef.current = isProductsOpen
  const [isProductsClosing, setIsProductsClosing] = useState(false)
  const [isMobileProductsMenuOpen, setIsMobileProductsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)
  const isMobileMenuOpenRef = useRef(isMobileMenuOpen)
  isMobileMenuOpenRef.current = isMobileMenuOpen
  const isMobileMenuClosingRef = useRef(isMobileMenuClosing)
  isMobileMenuClosingRef.current = isMobileMenuClosing
  const mobileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Map<string, Product[]>>(new Map())
  const productsTimeoutRef = useRef<number | null>(null)
  const productsCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const productsClosingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchPanelRef = useRef<HTMLDivElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const productsButtonRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileLocaleTimeoutRef = useRef<number | null>(null)
  const [submenuOffset, setSubmenuOffset] = useState(0)
  const {theme: headerTheme, reset: resetHeaderTheme} = useHeaderTheme()

  const {isDarkMode} = useDarkMode()
  const {isLoggedIn} = useAuth()
  const {cartCount, toggleCart} = useCart()
  const {selectionCount, openDrawer, isSelectionEnabled} = useSelection()
  const [headerOpacity, setHeaderOpacity] = useState(() =>
    isDarkHeroPageUtil(location.pathname, location.search) ? 0 : 0.7
  )
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  // Logic to determine if we are on a "Dark Hero" page (transparent header potential)
  const isDarkHeroPage = useCallback(
    (p: string, search?: string) => isDarkHeroPageUtil(p, search),
    []
  )

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const [headerHeight, setHeaderHeight] = useState(56) // 3.5rem = 56px (mobil için varsayılan)
  const isDarkHero = isDarkHeroPage(location.pathname, location.search)
  const isProductsActive = (isProductsOpen || isProductsClosing) && !isSearchOpen && !isMobile

  // Track whether scroll has passed the hero bottom boundary
  const [isPastHero, setIsPastHero] = useState(false)

  useEffect(() => {
    if (!isDarkHero) {
      setIsPastHero(false)
      return
    }
    const update = () => {
      const isFullscreen = isFullscreenDarkPage(location.pathname, location.search)
      if (isFullscreen) {
        setIsPastHero(false)
        return
      }

      const heroEl = document.querySelector('.hero-section') as HTMLElement | null
      if (!heroEl) {
        setIsPastHero(true)
        return
      }

      const currentY = window.scrollY || document.documentElement.scrollTop || 0
      if (currentY === 0) {
        setIsPastHero(false)
        return
      }
      const heroBottom = heroEl.offsetTop + heroEl.offsetHeight
      setIsPastHero(currentY >= heroBottom - headerHeight)
    }
    update()
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', update, {passive: true})

    const observer = new MutationObserver(update)
    observer.observe(document.body, {childList: true, subtree: true})

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [isDarkHero, headerHeight, location.pathname, location.search])

  const isFullscreen = isFullscreenDarkPage(location.pathname, location.search)

  // isDarkHero pages: white text at top, black after hero bottom boundary.
  // Standard pages: always dark text.
  // Search open: always dark text (white panel bg).
  // Mobile overlay menu: always dark text.
  const isLightMode =
    !isProductsActive &&
    !(isMobile && (isMobileMenuOpen || isMobileMenuClosing)) &&
    (isSearchOpen || (isFullscreen ? false : isPastHero || !isDarkHero))

  const headerForegroundColor = isLightMode ? '#000000' : '#ffffff'
  const headerLogoFilter = isLightMode ? 'invert(1) brightness(0.95)' : 'none'
  const iconBrightness = isLightMode ? 'brightness(0)' : 'none'
  // Smooth transitions for colors, backgrounds, and icon/logo filters
  const colorTransition =
    'color 0.45s cubic-bezier(0.25, 1, 0.5, 1), filter 0.45s cubic-bezier(0.25, 1, 0.5, 1), fill 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1)'

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
    return () => {
      if (mobileMenuCloseTimeoutRef.current) {
        clearTimeout(mobileMenuCloseTimeoutRef.current)
      }
      if (productsCloseTimeoutRef.current) {
        clearTimeout(productsCloseTimeoutRef.current)
      }
      if (productsClosingTimeoutRef.current) {
        clearTimeout(productsClosingTimeoutRef.current)
      }
    }
  }, [])

  const upperLoc = locale === 'tr' ? 'tr-TR' : 'en-US'
  const isProjectsVisible = settings?.isProjectsVisible !== false
  const isShopVisible = isShopNavVisible(settings || undefined)
  const mobileMenuLinks: {to: string; label: string; isExternal?: boolean}[] = [
    {to: '/designers', label: (t('designers') || '').toLocaleUpperCase(upperLoc)},
    ...(isProjectsVisible
      ? [{to: '/projects', label: (t('projects') || 'Projeler').toLocaleUpperCase(upperLoc)}]
      : []),
    {to: '/news', label: (t('news') || '').toLocaleUpperCase(upperLoc)},
    {to: '/about', label: (t('about') || '').toLocaleUpperCase(upperLoc)},
    ...(settings?.isFactoryVisible
      ? [{to: '/uretim', label: (t('factory') || 'Üretim').toLocaleUpperCase(upperLoc)}]
      : []),
    {to: '/contact', label: (t('contact') || '').toLocaleUpperCase(upperLoc)},
    ...(isShopVisible ? [{to: getShopBaseUrl(), label: 'SHOP', isExternal: true}] : []),
    ...(isSelectionEnabled
      ? [
          {
            to: '/seckim',
            label: (t('seckim') || 'Seçtiklerim').toLocaleUpperCase(upperLoc),
          },
        ]
      : []),
  ]

  // Mobil overlay menü kapanırken önce yazıların kaybolup sonra panelin animasyonla kapanması için (biraz daha hızlı)
  const mobileMenuCloseDelay = mobileMenuLinks.length * 80 + 80

  // Sayfa değiştiğinde state'leri ve scroll takibini sıfırla
  useEffect(() => {
    currentRouteRef.current = location.pathname

    lastScrollYRef.current = 0
    lastScrollForHeader.current = 0
    opacitySetByHandleScrollRef.current = false
    setIsHeaderVisible(true)

    // Eğer mobil menü açıkken veya kapanma sürecindeyken sayfa değiştiyse (menüdeki bir linke tıklandıysa),
    // kapanma animasyonunu yarıda kesip header'ı aniden beyaza döndürme.
    // Menü panelinin kapanma animasyonu bitene kadar header menü overlay durumunda kalsın,
    // animasyon bittikten sonra yumuşak bir geçişle yeni sayfanın rengine dönsün.
    const wasMobileMenuOpen = isMobileMenuOpenRef.current
    const wasMobileMenuClosing = isMobileMenuClosingRef.current

    if (
      isMobile &&
      (wasMobileMenuOpen || wasMobileMenuClosing || mobileMenuCloseTimeoutRef.current)
    ) {
      setIsMobileMenuOpen(false)
      setIsMobileProductsMenuOpen(false)
      setIsMobileMenuClosing(true)
      mobileMenuJustClosedUntilRef.current = Date.now() + mobileMenuCloseDelay + 800
      if (!mobileMenuCloseTimeoutRef.current) {
        mobileMenuCloseTimeoutRef.current = setTimeout(() => {
          setIsMobileMenuClosing(false)
          mobileMenuCloseTimeoutRef.current = null
        }, mobileMenuCloseDelay + 400)
      }
    } else {
      if (mobileMenuCloseTimeoutRef.current) {
        clearTimeout(mobileMenuCloseTimeoutRef.current)
        mobileMenuCloseTimeoutRef.current = null
      }
      setIsMobileMenuClosing(false)
      setIsMobileMenuOpen(false)
      setIsMobileProductsMenuOpen(false)
      mobileMenuJustClosedUntilRef.current = 0
    }

    setIsSearchOpen(false)
    setIsProductsOpen(false)

    // Header opacity'yi sayfa türüne göre ayarla (koyu hero varsa 0, yoksa veya hero-section DOM'da yoksa 0.7)
    const heroEl =
      typeof document !== 'undefined'
        ? (document.querySelector('.hero-section') as HTMLElement | null)
        : null
    const isFullscreen = isFullscreenDarkPage(location.pathname, location.search)
    const initialOpacity =
      isDarkHeroPageUtil(location.pathname, location.search) &&
      (heroEl !== null ||
        location.pathname === '/' ||
        location.pathname === '' ||
        isFullscreen ||
        headerTheme.mode === 'dark')
        ? 0
        : 0.7
    setHeaderOpacity(initialOpacity)

    const checkScroll = () => {
      if (currentRouteRef.current !== location.pathname) {
        return
      }

      const currentScrollY = window.scrollY
      if (isMobile && currentScrollY === 0) {
        const currentHeroEl = document.querySelector('.hero-section')
        setHeaderOpacity(
          isDarkHeroPageUtil(location.pathname, location.search) &&
            (currentHeroEl !== null ||
              location.pathname === '/' ||
              location.pathname === '' ||
              isFullscreen ||
              headerTheme.mode === 'dark')
            ? 0
            : 0.7
        )
        setIsHeaderVisible(true)
      }
    }
    checkScroll()
    const timeoutId = setTimeout(checkScroll, 50)
    return () => clearTimeout(timeoutId)
  }, [
    location.pathname,
    location.search,
    isMobile,
    resetHeaderTheme,
    mobileMenuCloseDelay,
    headerTheme.mode,
  ])

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

  // Listen to custom header visibility events (e.g. from fullscreen vertical sliders like Projects V4 / Designers V2)
  useEffect(() => {
    const handleCustomVisibility = (e: Event) => {
      const customEvent = e as CustomEvent<boolean | {visible: boolean}>
      if (typeof customEvent.detail === 'boolean') {
        setIsHeaderVisible(customEvent.detail)
      } else if (customEvent.detail && typeof customEvent.detail.visible === 'boolean') {
        setIsHeaderVisible(customEvent.detail.visible)
      }
    }
    window.addEventListener('setHeaderVisibility', handleCustomVisibility)
    return () => window.removeEventListener('setHeaderVisibility', handleCustomVisibility)
  }, [])

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
    locationSearch: location.search,
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

  const handleOpenMobileMenu = useCallback(() => {
    if (mobileMenuCloseTimeoutRef.current) {
      clearTimeout(mobileMenuCloseTimeoutRef.current)
      mobileMenuCloseTimeoutRef.current = null
    }
    setIsMobileMenuClosing(false)
    setIsMobileMenuOpen(true)
    setIsHeaderVisible(true)
    mobileMenuJustClosedUntilRef.current = 0
  }, [])

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
    setIsMobileProductsMenuOpen(false)
    setIsHeaderVisible(true)
    mobileMenuJustClosedUntilRef.current = Date.now() + mobileMenuCloseDelay + 800
    headerVisibilityLastChanged.current = Date.now()

    if (isOverlayMobileMenu && isMobile) {
      setIsMobileMenuClosing(true)
      if (mobileMenuCloseTimeoutRef.current) {
        clearTimeout(mobileMenuCloseTimeoutRef.current)
      }
      mobileMenuCloseTimeoutRef.current = setTimeout(() => {
        setIsMobileMenuClosing(false)
        mobileMenuCloseTimeoutRef.current = null
      }, mobileMenuCloseDelay + 400)
    }
  }, [isOverlayMobileMenu, isMobile, mobileMenuCloseDelay])

  const handleToggleMobileMenu = useCallback(() => {
    if (isMobileMenuOpen) {
      handleCloseMobileMenu()
    } else {
      handleOpenMobileMenu()
    }
  }, [isMobileMenuOpen, handleCloseMobileMenu, handleOpenMobileMenu])

  const mobileMenuFocusTrap = useFocusTrap(isMobileMenuOpen, handleCloseMobileMenu)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      // Search panel için - sadece mouse event'lerde çalış (touch'da sorun yaratıyor)
      if (event.type === 'mousedown' && isSearchOpen) {
        const isInPanel = searchPanelRef.current && searchPanelRef.current.contains(target)
        const isInButton = searchButtonRef.current && searchButtonRef.current.contains(target)
        const isInInput = searchInputRef.current && searchInputRef.current.contains(target)
        if (!isInPanel && !isInButton && !isInInput) {
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
        handleCloseMobileMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    // Touch event'i kaldırdık - arama paneli için sorun yaratıyordu
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen, isMobileMenuOpen, closeSearch, handleCloseMobileMenu])

  const handleProductsEnter = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current)
      productsTimeoutRef.current = null
    }
    if (productsCloseTimeoutRef.current) {
      clearTimeout(productsCloseTimeoutRef.current)
      productsCloseTimeoutRef.current = null
    }
    if (productsClosingTimeoutRef.current) {
      clearTimeout(productsClosingTimeoutRef.current)
      productsClosingTimeoutRef.current = null
    }
    setIsProductsClosing(false)
    setIsProductsOpen(true)
  }

  const handleProductsLeave = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current)
    }
    productsTimeoutRef.current = window.setTimeout(() => {
      if (!isProductsOpenRef.current) {
        productsTimeoutRef.current = null
        return
      }
      setIsProductsOpen(false)
      setIsProductsClosing(true)
      productsTimeoutRef.current = null

      if (productsClosingTimeoutRef.current) {
        clearTimeout(productsClosingTimeoutRef.current)
      }
      productsClosingTimeoutRef.current = setTimeout(() => {
        setIsProductsClosing(false)
        productsClosingTimeoutRef.current = null
      }, 420)

      if (productsCloseTimeoutRef.current) {
        clearTimeout(productsCloseTimeoutRef.current)
      }
      productsCloseTimeoutRef.current = setTimeout(() => {
        setHoveredCategoryId(null) // Only clear after panel collapse completes to prevent flicker
        productsCloseTimeoutRef.current = null
      }, 420)
    }, 120)
  }

  const handleCloseProducts = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current)
      productsTimeoutRef.current = null
    }
    if (!isProductsOpenRef.current) {
      return
    }
    setIsProductsOpen(false)
    setIsProductsClosing(true)

    if (productsClosingTimeoutRef.current) {
      clearTimeout(productsClosingTimeoutRef.current)
    }
    productsClosingTimeoutRef.current = setTimeout(() => {
      setIsProductsClosing(false)
      productsClosingTimeoutRef.current = null
    }, 420)

    if (productsCloseTimeoutRef.current) {
      clearTimeout(productsCloseTimeoutRef.current)
    }
    productsCloseTimeoutRef.current = setTimeout(() => {
      setHoveredCategoryId(null)
      productsCloseTimeoutRef.current = null
    }, 420)
  }

  const navLinkClasses =
    'tracking-wide uppercase text-gray-300 hover:text-white transition-colors duration-300 header-nav-item'
  const activeLinkClasses = {
    color: 'white',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    opacity: 1,
  }
  const iconBaseSize = 'clamp(16px, 0.8rem + 0.3vw, 20px)'
  const iconClasses =
    'text-gray-300 hover:text-white transition-opacity duration-300 ease-out hover:opacity-80'
  const sharedIconStyle = {
    width: iconBaseSize,
    height: iconBaseSize,
    display: isMobile ? 'none' : 'flex', // Only apply flex on desktop to avoid forcing visibility
    alignItems: 'center',
    justifyContent: 'center',
    color: headerForegroundColor,
    filter: iconBrightness,
    transition: `opacity 0.35s cubic-bezier(0.25, 1, 0.5, 1), ${colorTransition}`,
  }
  const searchIconBaseSize = 'clamp(18px, 0.88rem + 0.35vw, 22px)'
  const searchIconStyle = {
    ...sharedIconStyle,
    width: searchIconBaseSize,
    height: searchIconBaseSize,
  }

  const MaskedNavText: FC<{
    text: string
    isVisible: boolean
    delay?: number
    className?: string
    style?: React.CSSProperties
  }> = ({text, isVisible, delay = 0, className = '', style}) => {
    return (
      <span
        className={`relative inline-block overflow-hidden [clip-path:inset(0)] ${className}`}
        style={{
          ...style,
          verticalAlign: 'bottom',
          lineHeight: '1.25rem',
        }}
      >
        <motion.span
          initial={false}
          animate={{
            y: isVisible ? '0%' : '-115%',
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            y: {
              duration: isVisible ? 0.38 : 0.24,
              delay: isVisible ? delay : delay * 0.5,
              ease: isVisible ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1],
            },
            opacity: {
              duration: isVisible ? 0.3 : 0.18,
              delay: isVisible ? delay : delay * 0.5,
              ease: 'linear',
            },
          }}
          className="block whitespace-nowrap"
          style={{
            willChange: 'transform, opacity',
          }}
        >
          {text}
        </motion.span>
      </span>
    )
  }

  const NavItem: FC<{
    to: string
    children: ReactNode
    onMouseEnter?: () => void
    onClick?: () => void
    isExternal?: boolean
    isVisible?: boolean
    delay?: number
  }> = ({to, children, onMouseEnter, onClick, isExternal, isVisible = true, delay = 0}) => {
    const baseStyle = {
      fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
      fontWeight: 600,
      letterSpacing: '0.025em',
      fontFamily: "'Inter', sans-serif",
      lineHeight: '1.25rem',
      color: headerForegroundColor,
      transition: colorTransition,
    }

    const renderedChildren =
      typeof children === 'string' ? (
        <MaskedNavText text={children} isVisible={isVisible} delay={delay} />
      ) : (
        children
      )

    if (isExternal || to.startsWith('http')) {
      return (
        <a
          href={to}
          onMouseEnter={onMouseEnter}
          onClick={onClick}
          className={`relative group flex items-end pb-0 pt-2 ${navLinkClasses}`}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <span
            className="relative flex items-end uppercase header-nav-text"
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            {renderedChildren}
            <span
              className="header-nav-underline"
              style={{
                backgroundColor: headerForegroundColor,
                opacity: isVisible ? undefined : 0,
                transition: 'opacity 0.2s ease',
              }}
            />
          </span>
        </a>
      )
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
          className="relative flex items-end uppercase header-nav-text"
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          {renderedChildren}
          <span
            className="header-nav-underline"
            style={{
              backgroundColor: headerForegroundColor,
              opacity: isVisible ? undefined : 0,
              transition: 'opacity 0.2s ease',
            }}
          />
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
    isProductsOpen: isProductsActive,
    headerOpacity,
    isMobileMenuOpen,
    isMobileMenuClosing,
    isOverlayMobileMenu,
    isSearchOpen,
    isDarkMode,
    isLightMode,
  })

  return (
    <>
      <HeaderStyles />
      <header
        className={`fixed top-0 left-0 right-0 z-50 header-scroll-transition ${
          isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)
            ? 'overlay-menu-open'
            : ''
        } ${headerBgColor === 'transparent' && !isProductsActive ? '' : 'header-frosted-glass'}`}
        style={{
          transform: isHeaderVisible ? 'none' : 'translateY(-100%)',
          transition: isMobile
            ? 'transform 0.2s ease-out, background-color 0.45s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.45s cubic-bezier(0.25, 1, 0.5, 1), backdrop-filter 0.45s cubic-bezier(0.25, 1, 0.5, 1), -webkit-backdrop-filter 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
            : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1), -webkit-backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: headerBgColor,
          backdropFilter:
            headerBgColor === 'transparent' && !isProductsActive
              ? 'none'
              : isProductsActive
                ? 'blur(24px) saturate(180%)'
                : 'blur(4px)',
          WebkitBackdropFilter:
            headerBgColor === 'transparent' && !isProductsActive
              ? 'none'
              : isProductsActive
                ? 'blur(24px) saturate(180%)'
                : 'blur(4px)',
        }}
      >
        <div
          className=""
          style={{
            minHeight: isMobile ? '3.5rem' : '5rem',
            maxHeight:
              isMobileMenuOpen && !isOverlayMobileMenu ? '40rem' : isMobile ? '3.5rem' : undefined,
          }}
          ref={headerContainerRef}
        >
          <nav
            className="mx-auto h-[3.5rem] lg:h-[5rem] shrink-0 flex items-center w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] px-4 md:px-8 lg:px-0 header-scroll-transition header-layout-transition"
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
            <div
              className={`w-full h-full items-center header-layout-transition ${
                isMobile && isSearchOpen ? 'flex justify-between' : 'grid grid-cols-[1fr_auto_1fr]'
              } lg:grid lg:grid-cols-[1fr_auto_1fr]`}
            >
              {/* Sol taraf - Arama + sol menü (desktop) ve arama (mobil) */}
              <div
                className={`flex h-full items-center lg:items-end justify-start lg:gap-6 xl:gap-8 lg:pb-6 lg:translate-y-[6px] header-layout-transition relative ${
                  isMobile && isSearchOpen ? 'flex-1 min-w-0 mr-3' : 'min-w-0'
                }`}
              >
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
                    className="group p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
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
                    <span className="relative flex items-center justify-center w-[22px] h-[22px] sm:w-6 sm:h-6">
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

                {/* Mobil Inline Arama Girişi */}
                {isMobile && (
                  <div
                    className={`flex items-center flex-1 min-w-0 transition-all duration-300 ease-out ${
                      isSearchOpen
                        ? 'opacity-100 translate-x-0 pointer-events-auto ml-1 mr-1'
                        : 'opacity-0 -translate-x-2 pointer-events-none w-0 max-w-0 overflow-hidden ml-0 mr-0'
                    }`}
                  >
                    <div className="relative w-full flex items-center">
                      <input
                        ref={isMobile ? searchInputRef : undefined}
                        type="search"
                        placeholder={t('search_placeholder') || 'Ara...'}
                        id="global-search-input-mobile"
                        name="global-search"
                        className={`w-full bg-transparent outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 text-[15px] sm:text-sm pb-1 border-b transition-colors pr-7 ${
                          isLightMode
                            ? 'text-neutral-900 placeholder-neutral-400 border-neutral-300 focus:border-neutral-900'
                            : 'text-white placeholder-neutral-500 border-neutral-600 focus:border-white'
                        }`}
                        style={{
                          color: headerForegroundColor,
                          outline: 'none',
                          boxShadow: 'none',
                          fontFamily: "'Inter', sans-serif",
                        }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {searchQuery.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            searchInputRef.current?.focus()
                          }}
                          aria-label={t('clear_search') || 'Aramayı temizle'}
                          className="absolute right-0 inset-y-0 flex items-center justify-center p-1.5 cursor-pointer"
                        >
                          <span className="relative w-3.5 h-3.5 flex items-center justify-center">
                            <span
                              className={`absolute inset-0 before:absolute before:left-1/2 before:top-[2px] before:bottom-[2px] before:w-[1.5px] before:-translate-x-1/2 before:rotate-45 after:absolute after:left-1/2 after:top-[2px] after:bottom-[2px] after:w-[1.5px] after:-translate-x-1/2 after:-rotate-45 transition-colors ${
                                isLightMode
                                  ? 'before:bg-neutral-800 after:bg-neutral-800'
                                  : 'before:bg-neutral-200 after:bg-neutral-200'
                              }`}
                            />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
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
                    className={`${iconClasses} hidden lg:inline-flex shrink-0`}
                    style={{...searchIconStyle, color: headerForegroundColor}}
                    aria-label={
                      isSearchOpen
                        ? t('close_search') || 'Aramayı kapat'
                        : t('open_search') || 'Ara'
                    }
                    aria-expanded={isSearchOpen}
                    aria-controls="search-panel"
                  >
                    {/* Search → X arasında yumuşak geçiş animasyonu */}
                    <span className="relative flex items-center justify-center w-full h-full">
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

                {/* Desktop Sol Bölüm: Arama Çubuğu ve Menü Butonları Alanı */}
                {!isMobile &&
                  (() => {
                    const productsLabel = t('products') || 'ÜRÜNLER'
                    const designersLabel = t('designers') || 'TASARIMCILAR'
                    const thirdNavLabel = isProjectsVisible
                      ? t('projects') || 'Projeler'
                      : t('news') || 'Haberler'

                    return (
                      <div className="hidden lg:flex items-end relative flex-1 min-w-0">
                        {/* 1. Desktop Menü Butonları (Maskeli zarif yukarı/aşağı geçiş alanı) */}
                        <div
                          className={`flex items-end lg:gap-6 xl:gap-8 ${
                            isSearchOpen ? 'pointer-events-none' : 'pointer-events-auto'
                          }`}
                        >
                          <div
                            ref={productsButtonRef}
                            className="relative"
                            onMouseEnter={handleProductsEnter}
                            onMouseLeave={handleProductsLeave}
                          >
                            <Link
                              to="/categories"
                              className={`group flex items-end space-x-1 pb-0 pt-2 ${navLinkClasses}`}
                              onClick={() => setIsProductsOpen(false)}
                              style={{
                                fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
                                fontWeight: 600,
                                letterSpacing: '0.025em',
                                fontFamily: "'Inter', sans-serif",
                                lineHeight: '1.25rem',
                                color: headerForegroundColor,
                                transition: colorTransition,
                              }}
                            >
                              <span
                                className="relative inline-block uppercase header-nav-text"
                                style={{
                                  fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
                                  fontWeight: 600,
                                  letterSpacing: '0.025em',
                                  fontFamily: "'Inter', sans-serif",
                                  lineHeight: '1.25rem',
                                  color: headerForegroundColor,
                                }}
                              >
                                <MaskedNavText
                                  text={productsLabel}
                                  isVisible={!isSearchOpen}
                                  delay={0}
                                />
                                <span
                                  className={`header-nav-underline ${
                                    isProductsOpen || isSearchOpen ? 'opacity-0 scale-x-0' : ''
                                  }`}
                                  style={{
                                    backgroundColor: headerForegroundColor,
                                    opacity: isSearchOpen ? 0 : undefined,
                                    transition: 'opacity 0.2s ease',
                                  }}
                                />
                              </span>
                              <span className="relative inline-block overflow-hidden [clip-path:inset(0)]">
                                <motion.div
                                  initial={false}
                                  animate={{
                                    y: !isSearchOpen ? '0%' : '-115%',
                                    opacity: !isSearchOpen ? 1 : 0,
                                  }}
                                  transition={{
                                    y: {
                                      duration: !isSearchOpen ? 0.38 : 0.24,
                                      delay: !isSearchOpen ? 0.02 : 0,
                                      ease: !isSearchOpen ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1],
                                    },
                                    opacity: {
                                      duration: !isSearchOpen ? 0.3 : 0.18,
                                      delay: !isSearchOpen ? 0.02 : 0,
                                    },
                                  }}
                                  className={`transform ${isProductsOpen ? 'rotate-180' : ''}`}
                                  style={{
                                    filter: iconBrightness,
                                    transition: `transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s cubic-bezier(0.25, 1, 0.5, 1)`,
                                  }}
                                >
                                  <ChevronDownIcon />
                                </motion.div>
                              </span>
                            </Link>
                          </div>

                          <div className="flex items-end">
                            <NavItem
                              to="/designers"
                              onMouseEnter={handleCloseProducts}
                              onClick={handleCloseProducts}
                              isVisible={!isSearchOpen}
                              delay={0.05}
                            >
                              {designersLabel}
                            </NavItem>
                          </div>

                          {isProjectsVisible ? (
                            <div className="flex items-end">
                              <NavItem
                                to="/projects"
                                onMouseEnter={handleCloseProducts}
                                onClick={handleCloseProducts}
                                isVisible={!isSearchOpen}
                                delay={0.1}
                              >
                                {thirdNavLabel}
                              </NavItem>
                            </div>
                          ) : (
                            <div className="flex items-end">
                              <NavItem
                                to="/news"
                                onMouseEnter={handleCloseProducts}
                                onClick={handleCloseProducts}
                                isVisible={!isSearchOpen}
                                delay={0.1}
                              >
                                {thirdNavLabel}
                              </NavItem>
                            </div>
                          )}
                        </div>

                        {/* 2. Desktop Inline Arama Çubuğu (Menü butonlarının üzerine doğru genişleyen alan) */}
                        <motion.div
                          initial={false}
                          animate={{
                            width: isSearchOpen ? '100%' : '0%',
                            opacity: isSearchOpen ? 1 : 0,
                          }}
                          transition={{
                            duration: isSearchOpen ? 0.38 : 0.28,
                            ease: isSearchOpen ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1],
                          }}
                          className={`absolute inset-y-0 left-0 flex items-center overflow-hidden max-w-sm xl:max-w-md ${
                            isSearchOpen ? 'pointer-events-auto z-10' : 'pointer-events-none z-0'
                          }`}
                        >
                          <div className="relative w-full flex items-center pr-4">
                            <input
                              ref={!isMobile ? searchInputRef : undefined}
                              type="search"
                              placeholder={t('search_placeholder') || 'Ara...'}
                              id="global-search-input"
                              name="global-search"
                              className={`w-full bg-transparent outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 text-sm pb-1 border-b transition-colors ${
                                isLightMode
                                  ? 'text-neutral-900 placeholder-neutral-400 border-neutral-300 focus:border-neutral-900'
                                  : 'text-white placeholder-neutral-500 border-neutral-600 focus:border-white'
                              }`}
                              style={{
                                color: headerForegroundColor,
                                outline: 'none',
                                boxShadow: 'none',
                                fontFamily: "'Inter', sans-serif",
                              }}
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              autoComplete="off"
                              spellCheck={false}
                            />
                            {searchQuery.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery('')
                                  searchInputRef.current?.focus()
                                }}
                                aria-label={t('clear_search') || 'Aramayı temizle'}
                                className="absolute right-4 inset-y-0 flex items-center justify-center px-1 group"
                              >
                                <span className="relative w-3.5 h-3.5 flex items-center justify-center">
                                  <span
                                    className={`absolute inset-0 before:absolute before:left-1/2 before:top-[2px] before:bottom-[2px] before:w-[1px] before:-translate-x-1/2 before:rotate-45 after:absolute after:left-1/2 after:top-[2px] after:bottom-[2px] after:w-[1px] after:-translate-x-1/2 after:-rotate-45 transition-colors ${
                                      isLightMode
                                        ? 'before:bg-neutral-800 after:bg-neutral-800 group-hover:before:bg-black group-hover:after:bg-black'
                                        : 'before:bg-neutral-200 after:bg-neutral-200 group-hover:before:bg-white group-hover:after:bg-white'
                                    }`}
                                  />
                                </span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )
                  })()}
              </div>

              {/* Orta - Logo (Tüm Ekranlar için Grid Sütun 2) */}
              <div
                className={`h-full items-center lg:items-end justify-center lg:pb-6 px-2 header-layout-transition-delayed pointer-events-auto transition-opacity duration-300 ${
                  isMobile && isSearchOpen ? 'hidden' : 'flex'
                }`}
              >
                <Link
                  to="/"
                  className="flex items-center lg:items-end gap-3 transition-opacity duration-300 hover:opacity-80"
                  style={{color: headerForegroundColor, transition: colorTransition}}
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
              <div className="flex h-full items-center lg:items-end justify-end gap-3 lg:gap-6 xl:gap-8 lg:pb-6 lg:translate-y-[6px] header-layout-transition shrink-0">
                {/* Desktop Menü - Logo'nun sağındaki linkler (eşit aralıklarla dağıtılmış) */}
                {isProjectsVisible && (
                  <div className="hidden lg:flex items-end">
                    <NavItem
                      to="/news"
                      onMouseEnter={handleCloseProducts}
                      onClick={handleCloseProducts}
                    >
                      {t('news')}
                    </NavItem>
                  </div>
                )}
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
                      to="/uretim"
                      onMouseEnter={handleCloseProducts}
                      onClick={handleCloseProducts}
                    >
                      {t('factory') || 'ÜRETİM'}
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
                {isShopVisible && (
                  <div className="hidden lg:flex items-end">
                    <NavItem
                      to={getShopBaseUrl()}
                      isExternal
                      onMouseEnter={handleCloseProducts}
                      onClick={handleCloseProducts}
                    >
                      SHOP
                    </NavItem>
                  </div>
                )}

                <div className="hidden lg:flex items-end space-x-5">
                  {isSelectionEnabled && (
                    <div className="relative group/seckim flex items-end">
                      <button
                        type="button"
                        onClick={openDrawer}
                        className="group relative flex items-center pb-0 pt-2 cursor-pointer transition-opacity duration-300 hover:opacity-75"
                        style={{
                          color: headerForegroundColor,
                          transition: colorTransition,
                        }}
                        aria-label={`${t('seckim') || 'Seçtiklerim'}${selectionCount > 0 ? ` (${selectionCount})` : ''}`}
                      >
                        <svg
                          className="w-[18px] h-[18px] transition-transform duration-300 ease-out group-hover:scale-105"
                          viewBox="0 0 24 24"
                          fill={selectionCount > 0 ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </button>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 hidden group-hover/seckim:flex items-center justify-center pointer-events-none z-50">
                        <span className="text-[10px] tracking-wide font-medium text-white bg-neutral-900/95 dark:text-neutral-900 dark:bg-white/95 px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap border border-white/10 dark:border-black/10 backdrop-blur-sm">
                          {t('seckim') || 'Seçtiklerim'}
                          {selectionCount > 0 ? ` (${selectionCount})` : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Auth Trigger Text Button (Seçtiklerim'in sağında) */}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('openFloatingAuthPanel'))}
                    className="group relative flex items-end pb-0 pt-2 cursor-pointer transition-opacity duration-300 hover:opacity-75"
                    style={{
                      color: headerForegroundColor,
                      transition: colorTransition,
                    }}
                    aria-label={
                      isLoggedIn ? t('profile') || 'Profil' : locale === 'tr' ? 'Giriş' : 'Login'
                    }
                    title={
                      isLoggedIn ? t('profile') || 'Profil' : locale === 'tr' ? 'Giriş' : 'Login'
                    }
                  >
                    <span
                      className="relative inline-block uppercase header-nav-text"
                      style={{
                        fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
                        fontWeight: 600,
                        letterSpacing: '0.025em',
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: '1.25rem',
                        color: headerForegroundColor,
                        transition: colorTransition,
                      }}
                    >
                      {isLoggedIn ? t('profile') || 'PROFİL' : locale === 'tr' ? 'GİRİŞ' : 'LOGIN'}
                      <span
                        className="header-nav-underline"
                        style={{
                          backgroundColor: headerForegroundColor,
                        }}
                      />
                    </span>
                  </button>

                  <div
                    className="flex items-end pb-0 pt-2"
                    style={{
                      fontSize: 'clamp(12px, 0.35rem + 0.5vw, 13.5px)',
                      lineHeight: '1.25rem',
                    }}
                  >
                    {supportedLocales.map((langCode, index) => {
                      const isLast = index === supportedLocales.length - 1
                      const isActive = locale === langCode
                      return (
                        <Fragment key={langCode}>
                          <button
                            onClick={() => setLocale(langCode)}
                            aria-label={
                              langCode === 'tr' ? 'Türkçe diline geç' : 'Switch to English'
                            }
                            aria-current={isActive ? 'true' : undefined}
                            className="relative uppercase transition-opacity duration-300 hover:opacity-100 flex items-end"
                            style={{
                              fontWeight: 600,
                              fontFamily: "'Inter', sans-serif",
                              letterSpacing: '0.025em',
                              fontSize: 'clamp(9px, 0.2rem + 0.5vw, 11px)',
                              lineHeight: '1.25rem',
                              color: isActive
                                ? headerForegroundColor
                                : `${headerForegroundColor}80`, // 50% opacity for inactive
                              opacity: isActive ? 1 : 0.6,
                              transition: colorTransition,
                            }}
                          >
                            {langCode.toUpperCase()}
                          </button>
                          {!isLast && (
                            <span
                              className="mx-1 flex items-end"
                              style={{
                                color: `${headerForegroundColor}40`,
                                fontSize: 'clamp(9px, 0.2rem + 0.5vw, 11px)',
                                lineHeight: '1.25rem',
                                transition: colorTransition,
                              }}
                            >
                              |
                            </span>
                          )}
                        </Fragment>
                      )
                    })}
                  </div>

                  {settings?.showCartButton === true && settings?.commerce_enabled === true && (
                    <button
                      type="button"
                      onClick={toggleCart}
                      className="group relative flex items-center pb-0 pt-2 cursor-pointer transition-opacity duration-300 hover:opacity-75"
                      style={{
                        color: headerForegroundColor,
                        transition: colorTransition,
                      }}
                      aria-label={`${t('cart') || 'Sepet'}${cartCount > 0 ? ` (${cartCount} ${t('items') || 'ürün'})` : ''}`}
                      aria-expanded={false}
                    >
                      <svg
                        className="w-[19px] h-[19px] transition-transform duration-300 ease-out group-hover:scale-105"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      {cartCount > 0 && (
                        <span
                          className="absolute -top-0.5 -right-2.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold text-white bg-red-600 border border-white dark:border-neutral-900 shadow-xs leading-none pointer-events-none select-none"
                          style={{
                            fontVariantNumeric: 'tabular-nums',
                          }}
                          aria-hidden="true"
                        >
                          {cartCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <div className="lg:hidden flex items-center gap-1">
                  {settings?.showCartButton === true && settings?.commerce_enabled === true && (
                    <button
                      type="button"
                      onClick={toggleCart}
                      className="group relative p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
                      style={{color: headerForegroundColor, transition: colorTransition}}
                      aria-label={`${t('cart') || 'Sepet'}${cartCount > 0 ? ` (${cartCount} ${t('items') || 'ürün'})` : ''}`}
                      aria-expanded={false}
                    >
                      <svg
                        className="w-5 h-5 transition-transform duration-300 group-hover:scale-105"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      {cartCount > 0 && (
                        <span
                          className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full text-[9.5px] font-bold text-white bg-red-600 border border-white dark:border-neutral-900 shadow-xs leading-none pointer-events-none select-none"
                          style={{
                            fontVariantNumeric: 'tabular-nums',
                          }}
                          aria-hidden="true"
                        >
                          {cartCount}
                        </span>
                      )}
                    </button>
                  )}
                  {isOverlayMobileMenu ? (
                    // Overlay modunda: hamburger → X animasyonu
                    <button
                      ref={mobileMenuButtonRef}
                      onClick={handleToggleMobileMenu}
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
                      onClick={handleToggleMobileMenu}
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
          {/* Header altı silik ayırıcı çizgi - Açılırken yavaşça belirip yerine oturur, kapanırken silinir */}
          <div
            className="w-full pointer-events-none hidden lg:block overflow-hidden"
            style={{
              height: '1px',
            }}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundColor: isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)',
                opacity: isProductsOpen ? 1 : 0,
                transform: isProductsOpen
                  ? 'scaleX(1) translateY(0)'
                  : 'scaleX(0.85) translateY(-2px)',
                transformOrigin: 'center center',
                transition:
                  'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease',
              }}
            />
          </div>
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
            onCloseAll={handleCloseMobileMenu}
            setIsMobileMenuOpen={open => {
              if (!open) handleCloseMobileMenu()
              else handleOpenMobileMenu()
            }}
            setIsMobileProductsMenuOpen={setIsMobileProductsMenuOpen}
            mobileMenuRef={mobileMenuRef}
            mobileMenuFocusTrap={mobileMenuFocusTrap}
            selectionCount={selectionCount}
            openDrawer={openDrawer}
            isSelectionEnabled={isSelectionEnabled}
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
        onCloseAll={handleCloseMobileMenu}
        setIsMobileMenuOpen={open => {
          if (!open) handleCloseMobileMenu()
          else handleOpenMobileMenu()
        }}
        setIsMobileProductsMenuOpen={setIsMobileProductsMenuOpen}
        setSubscribeEmail={setSubscribeEmailState}
        subscribeEmailService={handleHeaderSubscribeEmail}
        mobileMenuRef={mobileMenuRef}
        mobileMenuFocusTrap={mobileMenuFocusTrap}
        selectionCount={selectionCount}
        openDrawer={openDrawer}
        isSelectionEnabled={isSelectionEnabled}
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
        searchButtonRef={searchButtonRef}
        isLightMode={isLightMode}
      />
    </>
  )
}
