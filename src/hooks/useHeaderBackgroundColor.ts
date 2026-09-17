import {useLocation} from 'react-router-dom'
import {isDarkHeroPage, isFullscreenDarkPage} from '../utils/headerUtils'

interface HeaderBackgroundParams {
  isMobile: boolean
  isProductsOpen: boolean
  headerOpacity: number
  isMobileMenuOpen: boolean
  isMobileMenuClosing?: boolean
  isOverlayMobileMenu: boolean
  isSearchOpen: boolean
  isDarkMode: boolean
  isLightMode?: boolean
}

export function useHeaderBackgroundColor({
  isMobile,
  isProductsOpen,
  headerOpacity,
  isMobileMenuOpen,
  isMobileMenuClosing = false,
  isOverlayMobileMenu,
  isSearchOpen,
  isDarkMode,
  isLightMode,
}: HeaderBackgroundParams) {
  const location = useLocation()

  const calculateBackgroundColor = () => {
    const path = location.pathname
    const search = location.search

    const isDarkHeroMatched = isDarkHeroPage(path, search)
    const isFullscreen = isFullscreenDarkPage(path, search)
    const effectiveIsLight = isLightMode ?? !isDarkHeroMatched

    const isProductDetailPage = path.startsWith('/product/') || path === '/product'

    if (isOverlayMobileMenu && (isMobileMenuOpen || isMobileMenuClosing)) {
      return isDarkMode || !effectiveIsLight
        ? 'rgba(0, 0, 0, 0.85)'
        : isProductDetailPage
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(248, 248, 248, 0.95)'
    }

    if (isMobileMenuOpen && !isOverlayMobileMenu) {
      return isDarkMode ? 'rgba(0, 0, 0, 0.85)' : `rgba(16, 24, 32, 0.85)`
    }

    if (isSearchOpen) {
      if (isDarkMode) return 'rgba(10, 10, 10, 0.95)'
      return 'rgba(255, 255, 255, 0.95)'
    }

    if (isProductsOpen && !isMobile) {
      return 'rgba(0, 0, 0, 0.78)'
    }

    if (isFullscreen) {
      return 'transparent'
    }

    // Üstte koyu hero görseli bulunmayan sayfalar (Tasarımcılar, Haberler, Ürün Detay vb.):
    if (!isDarkHeroMatched) {
      // Ürün detay sayfasında beyaz, diğer açık sayfalarda soluk gri buz efekti
      const lightRgb = isProductDetailPage ? '255, 255, 255' : '248, 248, 248'
      const baseColor = isDarkMode ? 'rgba(10, 10, 10, ' : `rgba(${lightRgb}, `
      return `${baseColor}${Math.max(Math.min(headerOpacity, 0.82), 0.78)})`
    }

    // Koyu hero görseli olan sayfalar (Ana Sayfa, Hakkımızda, Proje Detay, Fabrika V2 vb.):
    // Hero üzerindeyken (ve lightMode değilken) tam şeffaf:
    if (!effectiveIsLight) return 'transparent'

    // Hero altından itibaren: yarı şeffaf buz efekti
    const isFactoryPage = path.startsWith('/uretim') || path.startsWith('/factory')
    const lightRgb = isProductDetailPage || isFactoryPage ? '255, 255, 255' : '248, 248, 248'
    const baseColor = isDarkMode ? 'rgba(10, 10, 10, ' : `rgba(${lightRgb}, `
    return `${baseColor}${Math.max(Math.min(headerOpacity, 0.82), 0.78)})`
  }

  return calculateBackgroundColor()
}
