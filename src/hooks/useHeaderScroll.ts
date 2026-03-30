import {useEffect, MutableRefObject} from 'react'
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
      const currentHeroBrightness = heroBrightnessRef.current
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

        if (currentScrollY === 0) {
          if (currentPath !== locationPathname) {
            setHeaderOpacity(0)
            setIsHeaderVisible(true)
            opacitySetByHandleScrollRef.current = true
          } else {
            const isProjectsList = path === '/projects' || path === '/projects/'
            const isNewsList = path === '/news' || path === '/news/'
            const isDesignersList = path === '/designers' || path === '/designers/'

            if (isProjectsList || isNewsList || isDesignersList) {
              setHeaderOpacity(0.7)
              opacitySetByHandleScrollRef.current = true
            } else if (currentHeroBrightness !== null) {
              if (currentPath !== locationPathname) {
                setHeaderOpacity(0)
                setIsHeaderVisible(true)
                opacitySetByHandleScrollRef.current = true
              } else {
                // Brightness yüksek olsa bile en üstte şeffaf kalsın (Açılışta beyaz flash'ı önlemek için)
                // Brightness'a bağlı opaklaşma scroll başladığında (calculateBackgroundColor içinde) devreye girecek
                setHeaderOpacity(0)
                opacitySetByHandleScrollRef.current = true
              }
            } else {
              if (isDarkHeroPage(path)) {
                setHeaderOpacity(0)
              } else {
                setHeaderOpacity(0.7)
              }
              opacitySetByHandleScrollRef.current = true
            }
          }
          setIsHeaderVisible(true)
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
      scrollEndTimeout = setTimeout(checkOpacityOnScrollEnd, 150)
    }

    const initializeScrollListener = () => {
      scrollListener = handleScrollWithEnd
      handleScroll()
      window.addEventListener('scroll', handleScrollWithEnd, {passive: true})
    }

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
