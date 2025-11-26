import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import {BrowserRouter, MemoryRouter, Route, Routes} from 'react-router-dom'
import {ProductDetailPage} from '../../pages/ProductDetailPage'
import * as productsHooks from '../hooks/useProducts'
import * as designersHooks from '../hooks/useDesigners'
import * as categoriesHooks from '../hooks/useCategories'
import * as siteHooks from '../hooks/useSiteData'
import {useCart} from '../../context/CartContext'

// Hooks'u mockla
vi.mock('../hooks/useProducts')
vi.mock('../hooks/useDesigners')
vi.mock('../hooks/useCategories')
vi.mock('../hooks/useSiteData')

// Cart context mock'u
vi.mock('../../context/CartContext', () => ({
  useCart: vi.fn(() => ({
    addToCart: vi.fn(),
  })),
}))

// Basit i18n mock'u
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key: any) => (typeof key === 'string' ? key : key?.tr || ''),
    locale: 'tr',
    setLocale: vi.fn(),
    supportedLocales: ['tr', 'en'],
  }),
}))

const renderWithRouter = (initialPath: string) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/products/:productId" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProductDetailPage', () => {
  it('renders basic product info when data is available', () => {
    vi.mocked(productsHooks.useProduct).mockReturnValue({
      data: {
        id: 'product-1',
        name: {tr: 'Ürün 1'},
        designerId: 'designer-1',
        categoryId: 'category-1',
        year: 2024,
        isPublished: true,
        description: {tr: 'Ürün açıklaması'},
        mainImage: {url: 'https://example.com/main.jpg'},
        alternativeImages: [],
        alternativeMedia: [],
        media: [],
        showMediaPanels: false,
        dimensionImages: [],
        buyable: true,
        price: 1000,
        currency: 'TRY',
        sku: 'SKU-1',
        stockStatus: 'in_stock',
        materials: [],
        groupedMaterials: [],
      },
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(siteHooks.useSiteSettings).mockReturnValue({
      data: {
        logoUrl: '',
        imageBorderStyle: 'square',
        maintenanceMode: false,
        showProductPrevNext: false,
        showCartButton: true,
      },
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(categoriesHooks.useCategories).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(designersHooks.useDesigner).mockReturnValue({
      data: {
        id: 'designer-1',
        name: {tr: 'Tasarımcı 1'},
        bio: {tr: ''},
        image: 'https://example.com/designer.jpg',
      },
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(productsHooks.useProductsByCategory).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any)

    renderWithRouter('/products/product-1')

    expect(screen.getByText('Ürün 1')).toBeInTheDocument()
    expect(screen.getByText('Ürün açıklaması')).toBeInTheDocument()
  })
})
