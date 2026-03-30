import { useLocation } from 'react-router-dom'
import { isDarkHeroPage } from '../utils/headerUtils'

interface HeaderBackgroundParams {
  isMobile: boolean
  isProductsOpen: boolean
  headerOpacity: number
  isMobileMenuOpen: boolean
  isOverlayMobileMenu: boolean
  isMobileMenuClosing: boolean
  heroBrightness: number | null
  isSearchOpen: boolean
}

export function useHeaderBackgroundColor({
  isMobile,
  isProductsOpen,
  headerOpacity,
  isMobileMenuOpen,
  isOverlayMobileMenu,
  isMobileMenuClosing,
  heroBrightness,
  isSearchOpen,
}: HeaderBackgroundParams) {
  const location = useLocation()

  const calculateBackgroundColor = () => {
    const path = location.pathname

    if ((isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)) || (isSearchOpen && isMobile)) {
      return 'rgba(16, 24, 32, 0.65)'
    }

    if (isSearchOpen && !isMobile) {
      // isLightMode mantığına göre açık veya koyu fon dön
      const isDarkHero = isDarkHeroPage(path)

      const isLightMode = !isDarkHero || (heroBrightness !== null && heroBrightness >= 0.5) || headerOpacity > 0.5
      return isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)'
    }

    if (isProductsOpen && !isMobile) {
      // isLightMode mantığına göre açık veya koyu fon dön
      const isDarkHero = isDarkHeroPage(path)

      const isLightMode = !isDarkHero || (heroBrightness !== null && heroBrightness >= 0.5) || headerOpacity > 0.5
      return isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)'
    }

    // Üstte koyu hero görseli bulunan sayfalar: header tam şeffaf olmalı.
    const isDarkHeroMatched = isDarkHeroPage(path)

    if (!isDarkHeroMatched) {
      // Beyaz sayfalarda: bg-white/60 + backdrop-blur-md
      return `rgba(255, 255, 255, ${Math.max(headerOpacity, 0.6)})`
    }

    // Koyu hero görseli olan sayfalar (Ana Sayfa, Hakkımızda) için mevcut şeffaflık kuralları:
    if (isMobile) {
      if (heroBrightness !== null) {
        // En üstte (veya çok yakınında) her zaman şeffaf kalsın
        if (headerOpacity <= 0.01) return 'transparent'

        if (heroBrightness >= 0.7) return 'rgba(255, 255, 255, 0.85)'
        if (heroBrightness >= 0.5) return 'rgba(255, 255, 255, 0.75)'
        if (heroBrightness >= 0.35) {
          return `rgba(255, 255, 255, ${Math.max(headerOpacity, 0.6)})`
        }
        if (headerOpacity <= 0.25) return 'transparent'
        return `rgba(255, 255, 255, ${Math.max(headerOpacity, 0.6)})`
      }

      if (typeof window !== 'undefined' && window.scrollY <= 10 && headerOpacity <= 0) {
        return 'transparent'
      }
    } else {
      if (typeof window !== 'undefined' && window.scrollY <= 10 && headerOpacity <= 0) {
        return 'transparent'
      }

      if (heroBrightness !== null) {
        if (heroBrightness >= 0.7) return 'rgba(255, 255, 255, 0.85)'
        if (heroBrightness >= 0.5) return 'rgba(255, 255, 255, 0.75)'
        if (heroBrightness >= 0.35) {
          return `rgba(255, 255, 255, ${Math.max(headerOpacity, 0.6)})`
        }
      }
    }

    // Default white glassmorphism
    let baseOpacity = headerOpacity > 0.01 ? Math.max(headerOpacity, 0.6) : 0
    if (isMobileMenuOpen && !isOverlayMobileMenu) {
      return `rgba(16, 24, 32, 0.65)` // Inline mobil menü için de glassmorphism korunsun
    }

    return headerOpacity <= 0.01 && baseOpacity === 0
      ? 'transparent'
      : `rgba(255, 255, 255, ${baseOpacity})`
  }

  return calculateBackgroundColor()
}
