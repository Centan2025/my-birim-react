import {useEffect, useRef, MutableRefObject} from 'react'
import {isDarkHeroPage} from '../utils/headerUtils'

type MenuState = {
  isLangOpen: boolean
  isProductsOpen: boolean
  isSearchOpen: boolean
  isMobileMenuOpen: boolean
}

interface UseHeaderScrollOptions {
  isMobile: boolean
  locationPathname: string
  closeSearch: () => void
  currentRouteRef: MutableRefObject<string>
  heroBrightnessRef: MutableRefObject<number | null>
  menuStateRef: MutableRefObject<MenuState>
  opacitySetByHandleScrollRef: MutableRefObject<boolean>
  mobileMenuJustClosedUntilRef: MutableRefObject<number>
  headerVisibilityLastChanged: MutableRefObject<number>
  lastScrollYRef: MutableRefObject<number>
  scrollTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
  setHeaderOpacity: (value: number) => void
  setIsHeaderVisible: (value: boolean) => void
  setIsLangOpen: (value: boolean) => void
  setIsProductsOpen: (open: boolean) => void
  isMobileMenuOpen: boolean
}

/**
 * Scroll + opacity hesaplarını Header bileşeninden ayıran hook.
 * Mevcut davranışı korumak için orijinal handleScroll ve checkOpacityOnScrollEnd mantığı taşındı.
 */
export function useHeaderScroll({
  isMobile,
  locationPathname,
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
}: UseHeaderScrollOptions) {
  const routeChangedTimeRef = useRef<number>(Date.now())
  const prevPathnameRef = useRef<string>(locationPathname)

  useEffect(() => {
    if (prevPathnameRef.current !== locationPathname) {
      prevPathnameRef.current = locationPathname
      routeChangedTimeRef.current = Date.now()
      lastScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0
      setIsHeaderVisible(true)
    }
  }, [locationPathname, lastScrollYRef, setIsHeaderVisible])

  useEffect(() => {
    let scrollListener: (() => void) | null = null
    let rafId: number | null = null
    let lastScrollTime = 0
    const SCROLL_THROTTLE_MS = 50

    // Üstte koyu hero görseli olan sayfalar (header tam şeffaf olmalı)
    // isDarkHeroPage importundan geliyor.

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const path = locationPathname
      const currentPath = currentRouteRef.current
      const {
        isMobileMenuOpen: menuOpen,
        isSearchOpen: searchOpen,
        isLangOpen: langOpen,
        isProductsOpen: productsOpen,
      } = menuStateRef.current

      if (currentPath !== locationPathname) {
        return
      }

      // Mobil davranış
      if (isMobile) {
        if (menuOpen) {
          setHeaderOpacity(0.75)
          setIsHeaderVisible(true)
          lastScrollYRef.current = currentScrollY
          return
        }

        const now = Date.now()
        if (now < mobileMenuJustClosedUntilRef.current) {
          setIsHeaderVisible(true)
          lastScrollYRef.current = currentScrollY
          return
        }

        // Route change grace period (300ms): sayfa geçişi sırasında scroll diff nedeniyle header'ın aniden kaybolmasını engelle
        const isRecentlyNavigated = now - routeChangedTimeRef.current < 300

        if (currentScrollY === 0 || isRecentlyNavigated) {
          setIsHeaderVisible(true)
          if (currentScrollY === 0) {
            setHeaderOpacity(isDarkHeroPage(path) ? 0 : 0.7)
            opacitySetByHandleScrollRef.current = true
          }
        } else {
          if (!isDarkHeroPage(path)) {
            setHeaderOpacity(0.7)
            opacitySetByHandleScrollRef.current = true
          } else {
            opacitySetByHandleScrollRef.current = false
            // Hero yüksekliğini dinamik olarak al (sabit 800 veya innerHeight yerine)
            const heroEl = document.querySelector('.hero-section')
            const maxScroll = heroEl
              ? heroEl.getBoundingClientRect().height
              : typeof window !== 'undefined'
                ? window.innerHeight
                : 800
            const opacity = Math.min(0.75, (currentScrollY / maxScroll) * 0.75)
            setHeaderOpacity(opacity)
          }

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
      } else {
        // Desktop'ta arama açıkken header'ı zorla görünür tutma kısıtlaması kaldırıldı.
        // Böylece scroll yapıldığında header normal gizlenme mantığını izleyebilir.

        if (!isDarkHeroPage(path)) {
          setHeaderOpacity(0.7)
          opacitySetByHandleScrollRef.current = true
        } else {
          // Koyu hero bulunan sayfalar dahil: scroll'a göre opacity artır
          // Hero yüksekliğini dinamik olarak al
          const heroEl = document.querySelector('.hero-section')
          const maxScroll = heroEl
            ? heroEl.getBoundingClientRect().height
            : typeof window !== 'undefined'
              ? window.innerHeight
              : 800
          let opacity = 0

          if (currentScrollY > 0) {
            opacity = Math.min(0.75, (currentScrollY / maxScroll) * 0.75)
            opacitySetByHandleScrollRef.current = false
          } else {
            opacitySetByHandleScrollRef.current = true
          }

          setHeaderOpacity(opacity)
        }
      }

      const scrollDelta = Math.abs(currentScrollY - lastScrollYRef.current)
      if (scrollDelta > 5) {
        if (langOpen) setIsLangOpen(false)
        if (productsOpen) setIsProductsOpen(false)
        if (searchOpen) closeSearch()
      }

      // Update last scroll position at the very end
      lastScrollYRef.current = currentScrollY
    }

    const throttledHandleScroll = () => {
      const now = Date.now()
      if (now - lastScrollTime < SCROLL_THROTTLE_MS) {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            rafId = null
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

    let scrollEndTimeout: ReturnType<typeof setTimeout> | null = null

    const checkOpacityOnScrollEnd = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop
      if (currentScrollY <= 10) {
        const path = locationPathname
        const isDarkHero = isDarkHeroPage(path)

        if (isDarkHero) {
          // Koyu hero görseli olan sayfalarda (Ana Sayfa, Hakkımızda, Proje Detay)
          // Eğer hero çok açıksa (parlaksa) biraz opaklık ver, değilse tam şeffaf yap.
          if (heroBrightnessRef.current !== null && heroBrightnessRef.current >= 0.5) {
            setHeaderOpacity(0.7)
          } else {
            setHeaderOpacity(0)
          }
        } else {
          // Sabit beyaz sayfalarda (veya liste sayfalarında)
          setHeaderOpacity(0.7)
        }
        opacitySetByHandleScrollRef.current = true
      } else {
        opacitySetByHandleScrollRef.current = false
      }
    }

    const handleScrollWithEnd = () => {
      throttledHandleScroll()
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout)
      // 150ms: detect scroll end, then wait 300ms more for CSS color transition to complete before snapping opacity
      scrollEndTimeout = setTimeout(() => {
        setTimeout(checkOpacityOnScrollEnd, 300)
      }, 150)
    }

    const initializeScrollListener = () => {
      scrollListener = handleScrollWithEnd
      handleScroll()
      window.addEventListener('scroll', handleScrollWithEnd, {passive: true})
    }

    initializeScrollListener()

    const currentScrollTimeout = scrollTimeoutRef.current

    return () => {
      if (scrollListener) {
        window.removeEventListener('scroll', scrollListener)
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (currentScrollTimeout) {
        clearTimeout(currentScrollTimeout)
      }
      if (scrollEndTimeout) {
        clearTimeout(scrollEndTimeout)
      }
    }
  }, [
    isMobile,
    locationPathname,
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
  ])
}
