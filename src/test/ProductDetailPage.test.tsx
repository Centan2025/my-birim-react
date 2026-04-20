import {describe, it, expect, vi} from 'vitest'
import {render, screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'
import {ProductDetailPage} from '../pages/ProductDetailPage'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {I18nProvider} from '../i18n'
import {HeaderThemeProvider} from '../context/HeaderThemeContext'
import {SEOProvider} from '../hooks/useSEO'
import {SiteSettingsProvider} from '../context/SiteSettingsContext'
import {HelmetProvider} from 'react-helmet-async'
import {CartProvider} from '../context/CartContext'
import {AuthProvider} from '../context/AuthContext'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

const mockProduct = {
  id: 'p1',
  name: {tr: 'Test Ürün'},
  description: {tr: 'Açıklama'},
  materials: [{id: 'm1', name: {tr: 'Malzeme 1'}, image: {url: 'm1.jpg'}}],
  groupedMaterials: [
    {
      group: {title: {tr: 'Grup 1'}},
      materials: [{id: 'gm1', name: {tr: 'Grup Malzeme 1'}, image: {url: 'gm1.jpg'}}],
    },
  ],
}

vi.mock('../hooks/useProductDetail', () => ({
  useProductDetail: () => ({
    product: mockProduct,
    productLoading: false,
    designer: {name: {tr: 'Tasarımcı'}},
    category: {name: {tr: 'Kategori'}},
    relatedProducts: [],
    heroHook: {
      heroNext: vi.fn(),
      heroPrev: vi.fn(),
      setHeroSlideIndex: vi.fn(),
      setCurrentImageIndex: vi.fn(),
      setHeroTransitionEnabled: vi.fn(),
      heroSlideIndex: 0,
      currentImageIndex: 0,
      heroTransitionEnabled: true,
      draggedX: 0,
      totalHeroSlides: 1,
      handleHeroDragStart: vi.fn(),
      handleHeroDragMove: vi.fn(),
      handleHeroDragEnd: vi.fn(),
      handleHeroTransitionEnd: vi.fn(),
    },
    bandMedia: [],
    heroMedia: [],
    slideCount: 0,
    mergedGroups: [],
    imageBorderClass: '',
    showRelatedProducts: false,
    showProductPrevNext: false,
    prevProduct: null,
    nextProduct: null,
    isMobile: false,
  }),
}))

// Mock components as named exports
vi.mock('../components/product/ProductHero', () => ({
  ProductHero: () => <div data-testid="product-hero">Hero</div>,
}))

vi.mock('../components/product/ProductThumbnails', () => ({
  ProductThumbnails: () => null,
}))
vi.mock('../components/product/ProductInfo', () => ({
  ProductInfo: () => null,
}))
vi.mock('../components/product/ProductDimensions', () => ({
  ProductDimensions: () => null,
}))
vi.mock('../components/product/ProductAddToCart', () => ({
  ProductAddToCart: () => null,
}))
vi.mock('../components/product/ProductBottomNav', () => ({
  ProductBottomNav: () => null,
}))
vi.mock('../components/product/ProductRelated', () => ({
  ProductRelated: () => null,
}))
vi.mock('../components/product/ProductMediaPanels', () => ({
  ProductMediaPanels: () => null,
}))
vi.mock('../components/FullscreenMediaViewer', () => ({
  FullscreenMediaViewer: () => null,
}))

vi.mock('../components/product/ProductMaterials', () => ({
  ProductMaterials: ({onSetActiveMaterialGroup}: { onSetActiveMaterialGroup: (index: number) => void }) => (
    <div data-testid="product-materials">
      <button onClick={() => onSetActiveMaterialGroup(0)}>Select Group 0</button>
    </div>
  ),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('ProductDetailPage', () => {
  it('sekmeler arası geçiş ve malzeme seçimi simülasyonu', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/product/p1']}>
          <HelmetProvider>
            <AuthProvider>
              <I18nProvider>
                <SEOProvider>
                  <SiteSettingsProvider>
                    <HeaderThemeProvider>
                      <CartProvider>
                        <Routes>
                          <Route path="/product/:id" element={<ProductDetailPage />} />
                        </Routes>
                      </CartProvider>
                    </HeaderThemeProvider>
                  </SiteSettingsProvider>
                </SEOProvider>
              </I18nProvider>
            </AuthProvider>
          </HelmetProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByTestId('product-hero')).toBeInTheDocument()

    // Malzeme grubu değişimini test et
    const btn = screen.getByText('Select Group 0')
    fireEvent.click(btn)
  })
})
