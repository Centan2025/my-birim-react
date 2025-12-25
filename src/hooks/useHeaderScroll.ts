import { useEffect, MutableRefObject } from 'react'

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
  setIsProductsOpen: (value: boolean) => void
  // Optional: if you later want to close mobile menu on scroll
  setIsMobileMenuOpen?: (value: boolean) => void
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
}: UseHeaderScrollOptions) {
  useEffect(() => {
    let scrollListener: (() => void) | null = null
    let rafId: number | null = null
    let lastScrollTime = 0
    const SCROLL_THROTTLE_MS = 50

    const handleScroll = () => {
      const currentScrollY = window.scrollY
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
            const path = locationPathname
            const isProjectsList = path === '/projects' || path === '/projects/'
            const isProjectDetailPage = path.match(/^\/projects\/[^/]+$/)
            const isNewsList = path === '/news' || path === '/news/'
            const isNewsDetailPage = path.match(/^\/news\/[^/]+$/)
            const isDesignersList = path === '/designers' || path === '/designers/'
            const isDesignerDetailPage = path.match(/^\/designer\/[^/]+$/)
            const isProductDetailPage = path.match(/^\/product\/[^/]+$/)

            if (
              isProjectsList ||
              isProjectDetailPage ||
              isNewsList ||
              isNewsDetailPage ||
              isDesignersList ||
              isDesignerDetailPage
            ) {
              setHeaderOpacity(0.7)
              opacitySetByHandleScrollRef.current = true
            } else if (isProductDetailPage) {
              setHeaderOpacity(0.7)
              opacitySetByHandleScrollRef.current = true
            } else if (currentHeroBrightness !== null) {
              if (currentPath !== locationPathname) {
                setHeaderOpacity(0)
                setIsHeaderVisible(true)
                opacitySetByHandleScrollRef.current = true
              } else if (currentHeroBrightness >= 0.7) {
                setHeaderOpacity(0.75)
                opacitySetByHandleScrollRef.current = true
              } else if (currentHeroBrightness >= 0.5) {
                setHeaderOpacity(0.65)
                opacitySetByHandleScrollRef.current = true
              } else if (currentHeroBrightness > 0.4) {
                const adjustedOpacity = Math.min(0.75, 0.2 + (currentHeroBrightness - 0.4) * 1.2)
                setHeaderOpacity(adjustedOpacity)
                opacitySetByHandleScrollRef.current = true
              } else {
                setHeaderOpacity(0)
                opacitySetByHandleScrollRef.current = true
              }
            } else {
              const path = locationPathname
              const isProjectsList = path === '/projects' || path === '/projects/'
              const isProductsList =
                path === '/products' || path === '/products/' || path.match(/^\/products\/?$/)
              const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
              const isProductDetail = path.match(/^\/product\/[^/]+$/)
              const isNewsList = path === '/news' || path === '/news/'
              const isNewsDetail = path.match(/^\/news\/[^/]+$/)
              const isDesignersList = path === '/designers' || path === '/designers/'
              const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
              const isLightPage =
                isProjectsList ||
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
                setHeaderOpacity(0.7)
              } else {
                setHeaderOpacity(0)
              }
              opacitySetByHandleScrollRef.current = true
            }
          }
          setIsHeaderVisible(true)
        } else {
          const path = locationPathname
          const isProjectsList = path === '/projects' || path === '/projects/'
          const isProjectDetailPage = path.match(/^\/projects\/[^/]+$/)
          const isNewsList = path === '/news' || path === '/news/'
          const isNewsDetailPage = path.match(/^\/news\/[^/]+$/)
          const isDesignersList = path === '/designers' || path === '/designers/'
          const isDesignerDetailPage = path.match(/^\/designer\/[^/]+$/)

          if (
            isProjectsList ||
            isProjectDetailPage ||
            isNewsList ||
            isNewsDetailPage ||
            isDesignersList ||
            isDesignerDetailPage
          ) {
            setHeaderOpacity(0.7)
            opacitySetByHandleScrollRef.current = true
          } else {
            opacitySetByHandleScrollRef.current = false
            const maxScroll = 200
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

        const path = locationPathname
        const isProjectsList = path === '/projects' || path === '/projects/'
        const isProjectDetailPage = path.match(/^\/projects\/[^/]+$/)
        const isNewsList = path === '/news' || path === '/news/'
        const isNewsDetailPage = path.match(/^\/news\/[^/]+$/)
        const isDesignersList = path === '/designers' || path === '/designers/'
        const isDesignerDetailPage = path.match(/^\/designer\/[^/]+$/)

        if (
          isProjectsList ||
          isProjectDetailPage ||
          isNewsList ||
          isNewsDetailPage ||
          isDesignersList ||
          isDesignerDetailPage
        ) {
          setHeaderOpacity(0.7)
          opacitySetByHandleScrollRef.current = true
        } else {
          const maxScroll = 200
          let opacity = 0.1

          if (currentScrollY > 0) {
            opacity = Math.min(0.75, 0.1 + (currentScrollY / maxScroll) * 0.65)
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
        if (opacitySetByHandleScrollRef.current) {
          opacitySetByHandleScrollRef.current = false
          return
        }

        const path = locationPathname
        const isProjectsList = path === '/projects' || path === '/projects/'
        const isProjectDetail = path.match(/^\/projects\/[^/]+$/)
        const isNewsList = path === '/news' || path === '/news/'
        const isNewsDetail = path.match(/^\/news\/[^/]+$/)
        const isDesignersList = path === '/designers' || path === '/designers/'
        const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)

        if (
          isProjectsList ||
          isProjectDetail ||
          isNewsList ||
          isNewsDetail ||
          isDesignersList ||
          isDesignerDetail
        ) {
          setHeaderOpacity(0.7)
        } else {
          const isProductsList =
            path === '/products' || path === '/products/' || path.match(/^\/products\/?$/)
          const isProductDetail = path.match(/^\/product\/[^/]+$/)
          const isDesignersList = path === '/designers' || path === '/designers/'
          const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)
          const isLightPage =
            isProductsList ||
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
            setHeaderOpacity(0.7)
          } else if (heroBrightnessRef.current !== null) {
            if (heroBrightnessRef.current < 0.5) {
              setHeaderOpacity(0)
            } else {
              setHeaderOpacity(0.7)
            }
          }
        }
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
      window.addEventListener('scroll', handleScrollWithEnd, { passive: true })
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
  ])
}








