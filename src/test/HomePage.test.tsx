import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import {BrowserRouter} from 'react-router-dom'
import {HomePage} from '../../pages/HomePage'
import * as homeHook from '../hooks/useHomePage'
import * as siteHook from '../hooks/useSiteData'

// useHomePageContent ve useSiteSettings hook'larını mockla
vi.mock('../hooks/useHomePage')
vi.mock('../hooks/useSiteData')

// Basit i18n mock'u
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'tr',
    setLocale: vi.fn(),
    supportedLocales: ['tr', 'en'],
  }),
}))

const renderHomePage = () => {
  return render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>
  )
}

describe('HomePage', () => {
  it('renders hero and inspiration section when content is available', () => {
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
        inspirationSection: {
          backgroundImage: 'https://example.com/bg.jpg',
          title: 'insp_title',
          subtitle: 'insp_subtitle',
          buttonText: 'insp_button',
          buttonLink: '/products',
        },
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

    // Inspiration section başlığı görünmeli
    expect(screen.getByText('insp_title')).toBeInTheDocument()
    expect(screen.getByText('insp_subtitle')).toBeInTheDocument()
  })
})
