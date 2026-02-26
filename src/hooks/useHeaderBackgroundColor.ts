import {useLocation} from 'react-router-dom'

interface HeaderBackgroundParams {
  isMobile: boolean
  isProductsOpen: boolean
  headerOpacity: number
  isMobileMenuOpen: boolean
  isOverlayMobileMenu: boolean
  isMobileMenuClosing: boolean
  heroBrightness: number | null
}

export function useHeaderBackgroundColor({
  isMobile,
  isProductsOpen,
  headerOpacity,
  isMobileMenuOpen,
  isOverlayMobileMenu,
  isMobileMenuClosing,
  heroBrightness,
}: HeaderBackgroundParams) {
  const location = useLocation()

  const calculateBackgroundColor = () => {
    const path = location.pathname
    const isProductDetail = path.match(/^\/product\/[^/]+$/)
    const isDesignerDetail = path.match(/^\/designer\/[^/]+$/)

    if (isProductDetail || isDesignerDetail) {
      return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.7)})`
    }

    if (isProductsOpen && !isMobile) {
      return 'rgba(0, 0, 0, 0.85)'
    }

    const isDarkHero = path === '/' || path === '' || path.includes('about')
    if (isDarkHero && typeof window !== 'undefined' && window.scrollY <= 10 && headerOpacity <= 0) {
      return 'transparent'
    }

    if (isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)) {
      return '#111827'
    }

    if (isMobile) {
      if (heroBrightness !== null) {
        if (heroBrightness >= 0.7) return 'rgba(0, 0, 0, 0.85)'
        if (heroBrightness >= 0.5) return 'rgba(0, 0, 0, 0.75)'
        if (heroBrightness >= 0.35) {
          return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.65)})`
        }
        if (headerOpacity <= 0.25) return 'transparent'
        return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.4)})`
      }

      const isDarkHeroMobile = path === '/' || path === '' || path.includes('about')
      if (!isDarkHeroMobile && typeof window !== 'undefined' && window.scrollY <= 10) {
        const mainEl = document.querySelector('main')
        if (mainEl) {
          const bg = window.getComputedStyle(mainEl).backgroundColor
          if (bg && (bg.includes('255, 255, 255') || bg.includes('255,255,255'))) {
            return 'rgba(0, 0, 0, 0.85)'
          }
        }
      }
    }

    const isDarkHeroPage = path === '/' || path === '' || path.includes('about')
    if (!isMobile && typeof window !== 'undefined' && window.scrollY <= 10 && !isDarkHeroPage) {
      if (heroBrightness !== null) {
        if (heroBrightness >= 0.7) return 'rgba(0, 0, 0, 0.85)'
        if (heroBrightness >= 0.5) return 'rgba(0, 0, 0, 0.75)'
        if (heroBrightness >= 0.35) {
          return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.65)})`
        }
      }

      const mainEl = document.querySelector('main')
      if (mainEl) {
        const bg = window.getComputedStyle(mainEl).backgroundColor
        if (bg && (bg.includes('255, 255, 255') || bg.includes('255,255,255'))) {
          return 'rgba(0, 0, 0, 0.85)'
        }
      }
    }

    let baseOpacity = headerOpacity > 0.25 ? Math.max(headerOpacity, 0.4) : 0
    if (isMobileMenuOpen && !isOverlayMobileMenu) {
      baseOpacity = Math.min(baseOpacity, 0.75)
    }

    return headerOpacity <= 0.25 && baseOpacity === 0
      ? 'transparent'
      : `rgba(0, 0, 0, ${baseOpacity})`
  }

  return calculateBackgroundColor()
}
