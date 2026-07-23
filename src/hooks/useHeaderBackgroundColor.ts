import {useLocation} from 'react-router-dom'
import {isDarkHeroPage} from '../utils/headerUtils'

interface HeaderBackgroundParams {
  isMobile: boolean
  isProductsOpen: boolean
  headerOpacity: number
  isMobileMenuOpen: boolean
  isOverlayMobileMenu: boolean
  isMobileMenuClosing: boolean
  isSearchOpen: boolean
  isDarkMode: boolean
}

export function useHeaderBackgroundColor({
  isMobile,
  isProductsOpen,
  headerOpacity,
  isMobileMenuOpen,
  isOverlayMobileMenu,
  isMobileMenuClosing,
  isSearchOpen,
  isDarkMode,
}: HeaderBackgroundParams) {
  const location = useLocation()

  const calculateBackgroundColor = () => {
    const path = location.pathname

    if (
      (isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)) ||
      (isSearchOpen && isMobile)
    ) {
      return isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(16, 24, 32, 0.7)'
    }

    if (isSearchOpen && !isMobile) {
      if (isDarkMode) return 'rgba(10, 10, 10, 0.95)'
      return 'rgba(255, 255, 255, 0.95)'
    }

    if (isProductsOpen && !isMobile) {
      if (isDarkMode) return 'rgba(10, 10, 10, 0.95)'
      return 'rgba(255, 255, 255, 0.95)'
    }

    // Üstte koyu hero görseli bulunan sayfalar: header tam şeffaf olmalı.
    const isDarkHeroMatched = isDarkHeroPage(path)

    if (!isDarkHeroMatched) {
      // Beyaz sayfalarda: bg-white/60 + backdrop-blur-md (buz etkisi)
      // Dark mode'da: bg-black/60 + backdrop-blur-md
      const baseColor = isDarkMode ? 'rgba(10, 10, 10, ' : 'rgba(255, 255, 255, '
      return `${baseColor}${Math.max(headerOpacity, 0.6)})`
    }

    // Koyu hero görseli olan sayfalar (Ana Sayfa, Hakkımızda, Proje Detay vb.) için şeffaflık kuralları:
    // Metin rengi değişene kadar (0.75) tam şeffaf kalsın, sonra buz etkili beyaz fona geç
    if (headerOpacity < 0.75) return 'transparent'

    if (isMobileMenuOpen && !isOverlayMobileMenu) {
      return isDarkMode ? 'rgba(0, 0, 0, 0.8)' : `rgba(16, 24, 32, 0.7)`
    }

    // Dark mode'da koyu hero altındaki bölümde koyu arka plan, normal modda beyaz arka plan
    const baseColor = isDarkMode ? 'rgba(0, 0, 0, ' : 'rgba(255, 255, 255, '
    return `${baseColor}${Math.max(headerOpacity, 0.75)})`
  }

  return calculateBackgroundColor()
}
