import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import * as homeHook from '../hooks/useHomePage'
import * as siteHook from '../hooks/useSiteData'
import { HeaderThemeProvider } from '../context/HeaderThemeContext'
import { SEOProvider } from '../hooks/useSEO'
import { HelmetProvider } from 'react-helmet-async'

// Cart context mock'u
vi.mock('@/context/CartContext', () => ({
  useCart: vi.fn(() => ({
    addToCart: vi.fn(),
  })),
}))

// useHomePageContent ve useSiteSettings hook'larını mockla
vi.mock('../hooks/useHomePage')
vi.mock('../hooks/useSiteData')

// Basit i18n mock'u
vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'tr',
    setLocale: vi.fn(),
    supportedLocales: ['tr', 'en'],
  }),
}))

const renderHomePage = () => {
  return render(
    <HelmetProvider>
      <HeaderThemeProvider>
        <SEOProvider>
          <BrowserRouter>
            <HomePage />
          </BrowserRouter>
        </SEOProvider>
      </HeaderThemeProvider>
    </HelmetProvider>
  )
}

describe('HomePage', () => {
  it('renders hero when content is available', () => {
    vi.mocked(homeHook.useHomePageContent).mockReturnValue({
      data: {
        heroMedia: [
          {
            type: 'image',
            url: 'https://example.com/hero.jpg',
            title: 'hero_title',
            subtitle: 'hero_subtitle',
          },
        ],
        heroAutoPlay: false,
        isHeroTextVisible: true,
        isLogoVisible: true,
        featuredProductIds: [],
        featuredDesignerId: '',
        contentBlocks: [],
      },
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(siteHook.useSiteSettings).mockReturnValue({
      data: {
        logoUrl: '',
        imageBorderStyle: 'square',
        maintenanceMode: false,
      },
      isLoading: false,
      isError: false,
    } as any)

    renderHomePage()

    // Hero text (translation key) görünmeli
    expect(screen.getByText('hero_title')).toBeInTheDocument()
    expect(screen.getByText('hero_subtitle')).toBeInTheDocument()
  })
})
