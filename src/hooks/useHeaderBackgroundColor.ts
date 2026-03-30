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
      return 'rgba(16, 24, 32, 0.7)'
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
      // Beyaz sayfalarda: bg-white/60 + backdrop-blur-md (buz etkisi)
      return `rgba(255, 255, 255, ${Math.max(headerOpacity, 0.6)})`
    }

    // Koyu hero görseli olan sayfalar (Ana Sayfa, Hakkımızda, Proje Detay vb.) için şeffaflık kuralları:
    // Metin rengi değişene kadar (0.7) tam şeffaf kalsın, sonra buz etkili beyaz fona geç
    if (headerOpacity < 0.7) return 'transparent'

    if (isMobileMenuOpen && !isOverlayMobileMenu) {
      return `rgba(16, 24, 32, 0.7)`
    }

    return `rgba(255, 255, 255, ${Math.max(headerOpacity, 0.75)})`
  }

  return calculateBackgroundColor()
}
