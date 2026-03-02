import { useLocation } from 'react-router-dom'

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

    if (isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)) {
      return '#111827'
    }

    if (isProductsOpen && !isMobile) {
      return 'rgba(0, 0, 0, 0.85)'
    }

    // Ana sayfa ve hakkımızda dışındaki sayfaların genel fonu açık renk olduğu için
    // header'ın (yazılar beyaz olduğu için) her zaman koyu fonla başlaması gerekiyor.
    const isDarkHeroPage = path === '/' || path === '' || path.startsWith('/about')

    if (!isDarkHeroPage) {
      // Koyu hero bulunmayan sayfalarda her zaman siyah-transparan fon uygula
      return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.85)})`
    }

    // Koyu hero görseli olan sayfalar (Ana Sayfa, Hakkımızda) için mevcut şeffaflık kuralları:
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

      if (typeof window !== 'undefined' && window.scrollY <= 10 && headerOpacity <= 0) {
        return 'transparent'
      }
    } else {
      if (typeof window !== 'undefined' && window.scrollY <= 10 && headerOpacity <= 0) {
        return 'transparent'
      }

      if (heroBrightness !== null) {
        if (heroBrightness >= 0.7) return 'rgba(0, 0, 0, 0.85)'
        if (heroBrightness >= 0.5) return 'rgba(0, 0, 0, 0.75)'
        if (heroBrightness >= 0.35) {
          return `rgba(0, 0, 0, ${Math.max(headerOpacity, 0.65)})`
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
