import {describe, it, expect, vi, beforeEach} from 'vitest'
import {render, screen, fireEvent} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {HelmetProvider} from 'react-helmet-async'
import {DesignersPage} from '../pages/DesignersPage'
import * as designersHooks from '../hooks/useDesigners'
import * as productsHooks from '../hooks/useProducts'
import * as siteDataHooks from '../hooks/useSiteData'
import {I18nContext} from '../i18n'
import {SEOProvider} from '../hooks/useSEO'

vi.mock('../hooks/useDesigners')
vi.mock('../hooks/useProducts')
vi.mock('../hooks/useSiteData')

const mockDesignersData = [
  {
    id: 'designer-1',
    name: {tr: 'Ahmet Yılmaz', en: 'Ahmet Yilmaz'},
    role: {tr: 'Endüstriyel Tasarımcı', en: 'Industrial Designer'},
    bio: {
      tr: 'Modern ve minimalist mobilya tasarımları üzerinde uzmanlaşmıştır.',
      en: 'Specialized in modern and minimalist furniture design.',
    },
    image: {url: 'https://example.com/designer1.jpg'},
  },
  {
    id: 'tasarimci-birim-design-studio',
    name: {tr: 'Birim Design Studio', en: 'Birim Design Studio'},
    role: {tr: 'Tasarım Stüdyosu', en: 'Design Studio'},
    bio: {
      tr: "Birim'in yenilikçi ve zamansız tasarım vizyonunu yansıtan iç tasarım stüdyosu.",
      en: "Birim's in-house design studio reflecting timeless vision.",
    },
    isCompanyLogo: true,
  },
]

const mockProductsData = [
  {
    id: 'prod-1',
    name: {tr: 'Luna Koltuk', en: 'Luna Armchair'},
    designerId: 'designer-1',
    categoryId: 'seating',
    year: 2026,
    description: {tr: 'Açıklama', en: 'Description'},
    mainImage: 'https://example.com/luna.jpg',
  },
]

const renderComponent = (initialEntries = ['/designers']) => {
  return render(
    <HelmetProvider>
      <SEOProvider>
        <I18nContext.Provider
          value={{
            t: (key: unknown) => {
              if (typeof key === 'string') {
                if (key === 'explore_designer') return 'Profili & Tasarımları İncele'
                return key
              }
              if (typeof key === 'object' && key !== null) {
                return (key as Record<string, string>)?.tr || ''
              }
              return ''
            },
            locale: 'tr',
            setLocale: vi.fn(),
            supportedLocales: ['tr', 'en'],
          }}
        >
          <MemoryRouter initialEntries={initialEntries}>
            <DesignersPage />
          </MemoryRouter>
        </I18nContext.Provider>
      </SEOProvider>
    </HelmetProvider>
  )
}

describe('DesignersPage & Version Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(designersHooks.useDesigners).mockReturnValue({
      data: mockDesignersData,
      isLoading: false,
    } as unknown as ReturnType<typeof designersHooks.useDesigners>)

    vi.mocked(productsHooks.useProducts).mockReturnValue({
      data: mockProductsData,
      isLoading: false,
    } as unknown as ReturnType<typeof productsHooks.useProducts>)

    vi.mocked(siteDataHooks.useSiteSettings).mockReturnValue({
      data: {logoUrl: 'https://example.com/logo.svg'},
      isLoading: false,
    } as unknown as ReturnType<typeof siteDataHooks.useSiteSettings>)
  })

  it('renders V1 Grid by default', () => {
    renderComponent(['/designers'])

    // Switcher presence
    expect(screen.getByText('V1')).toBeDefined()
    expect(screen.getByText('V2')).toBeDefined()

    // Title and content in V1
    expect(screen.getByRole('heading', {level: 1})).toBeDefined()
    expect(screen.getByText('Ahmet Yılmaz')).toBeDefined()
    expect(screen.getByText('Birim Design Studio')).toBeDefined()
  })

  it('renders V2 Fullscreen when query parameter v=2 is present', () => {
    renderComponent(['/designers?v=2'])

    // V2 specific elements
    expect(screen.getAllByText('Ahmet Yılmaz').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Birim Design Studio').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Luna Koltuk')).toBeDefined()
    expect(screen.getAllByText(/Profili & Tasarımları İncele/i).length).toBeGreaterThanOrEqual(1)
  })

  it('switches between V1 and V2 when switcher buttons are clicked', () => {
    renderComponent(['/designers'])

    // Click V2 button
    const v2Button = screen.getByTitle('V2 (Tam Ekran)')
    fireEvent.click(v2Button)

    // Should now be on V2
    expect(screen.getAllByText(/Profili & Tasarımları İncele/i).length).toBeGreaterThanOrEqual(1)
    expect(localStorage.getItem('birim_designers_view_version')).toBe('v2')

    // Click V1 button
    const v1Button = screen.getByTitle('V1 (Izgara)')
    fireEvent.click(v1Button)
    expect(localStorage.getItem('birim_designers_view_version')).toBe('v1')
  })
})
