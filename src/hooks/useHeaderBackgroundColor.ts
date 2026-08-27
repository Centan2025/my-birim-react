import {useLocation} from 'react-router-dom'
import {isDarkHeroPage} from '../utils/headerUtils'

interface HeaderBackgroundParams {
  isMobile: boolean
  isProductsOpen: boolean
  headerOpacity: number
  isMobileMenuOpen: boolean
  isOverlayMobileMenu: boolean
  isMobileMenuClosing?: boolean
  isSearchOpen: boolean
  isDarkMode: boolean
  isLightMode?: boolean
}

export function useHeaderBackgroundColor({
  isMobile,
  isProductsOpen,
  headerOpacity,
  isMobileMenuOpen,
  isOverlayMobileMenu,
  isSearchOpen,
  isDarkMode,
  isLightMode,
}: HeaderBackgroundParams) {
  const location = useLocation()

  const calculateBackgroundColor = () => {
    const path = location.pathname

    const isDarkHeroMatched = isDarkHeroPage(path)
    const effectiveIsLight = isLightMode ?? !isDarkHeroMatched

    if (isOverlayMobileMenu && isMobileMenuOpen) {
      return isDarkMode || !effectiveIsLight ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'
    }

    if (isSearchOpen) {
      if (isDarkMode) return 'rgba(10, 10, 10, 0.95)'
      return 'rgba(255, 255, 255, 0.95)'
    }

    if (isProductsOpen && !isMobile) {
      return 'rgba(0, 0, 0, 0.85)'
    }

    // Üstte koyu hero görseli bulunmayan sayfalar (Tasarımcılar, Haberler vb.):
    if (!isDarkHeroMatched) {
      if (!effectiveIsLight && !isDarkMode) {
        return 'rgba(0, 0, 0, 0.85)'
      }
      // Yarı şeffaf beyaz buz efekti: bg-white/78 + backdrop-blur-xl
      const baseColor = isDarkMode ? 'rgba(10, 10, 10, ' : 'rgba(255, 255, 255, '
      return `${baseColor}${Math.max(headerOpacity, 0.78)})`
    }

    // Koyu hero görseli olan sayfalar (Ana Sayfa, Hakkımızda, Proje Detay, Fabrika V2 vb.):
    // Hero üzerindeyken tam şeffaf:
    if (headerOpacity < 0.75) return 'transparent'

    if (isMobileMenuOpen && !isOverlayMobileMenu) {
      return isDarkMode ? 'rgba(0, 0, 0, 0.85)' : `rgba(16, 24, 32, 0.85)`
    }

    // Hero altından itibaren: yarı şeffaf beyaz buz efekti
    const baseColor = isDarkMode ? 'rgba(10, 10, 10, ' : 'rgba(255, 255, 255, '
    return `${baseColor}${Math.max(headerOpacity, 0.78)})`
  }

  return calculateBackgroundColor()
}
