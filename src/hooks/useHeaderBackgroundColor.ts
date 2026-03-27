import { useLocation } from 'react-router-dom'

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
      return 'rgba(0, 0, 0, 0.85)'
    }

    if (isSearchOpen && !isMobile) {
      // isLightMode mantığına göre açık veya koyu fon dön
      const isDarkHero =
        path === '/' ||
        path === '' ||
        path.startsWith('/about') ||
        path === '/products' ||
        path === '/categories' ||
        path.startsWith('/projects/') ||
        path.startsWith('/project/') ||
        /^\/projects\/[^/]+$/.test(path) ||
        /^\/project\/[^/]+$/.test(path) ||
        /^\/products\/[^/]+$/.test(path)

      const isLightMode = !isDarkHero || (heroBrightness !== null && heroBrightness >= 0.5) || headerOpacity > 0.5
      return isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)'
    }

    if (isProductsOpen && !isMobile) {
      // isLightMode mantığına göre açık veya koyu fon dön
      const isDarkHero =
        path === '/' ||
        path === '' ||
        path.startsWith('/about') ||
        path === '/products' ||
        path === '/categories' ||
        path.startsWith('/projects/') ||
        path.startsWith('/project/') ||
        /^\/projects\/[^/]+$/.test(path) ||
        /^\/project\/[^/]+$/.test(path) ||
        /^\/products\/[^/]+$/.test(path)

      const isLightMode = !isDarkHero || (heroBrightness !== null && heroBrightness >= 0.5) || headerOpacity > 0.5
      return isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)'
    }

    // Üstte koyu hero görseli bulunan sayfalar: header tam şeffaf olmalı.
    // Ana sayfa, hakkımızda, ürünler ana sayfası, alt kategori sayfaları ve kategoriler sayfası.
    const isDarkHeroPage =
      path === '/' ||
      path === '' ||
      path.startsWith('/about') ||
      path === '/products' ||
      path === '/categories' ||
      path.startsWith('/projects/') ||
      path.startsWith('/project/') || // Singular safety
      /^\/projects\/[^/]+$/.test(path) ||
      /^\/project\/[^/]+$/.test(path) ||
      /^\/products\/[^/]+$/.test(path)

    if (!isDarkHeroPage) {
      // Beyaz sayfalarda: bg-white/60 + backdrop-blur-md
      return `rgba(255, 255, 255, ${Math.max(headerOpacity, 0.6)})`
    }

    // Koyu hero görseli olan sayfalar (Ana Sayfa, Hakkımızda) için mevcut şeffaflık kuralları:
    if (isMobile) {
      if (heroBrightness !== null) {
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
      return `rgba(0, 0, 0, 0.75)` // Inline mobil menü hala koyu kalsın
    }

    return headerOpacity <= 0.01 && baseOpacity === 0
      ? 'transparent'
      : `rgba(255, 255, 255, ${baseOpacity})`
  }

  return calculateBackgroundColor()
}
