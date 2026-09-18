import {describe, it, expect, vi, beforeEach} from 'vitest'
import {render, screen, fireEvent} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {HelmetProvider} from 'react-helmet-async'
import {NewsPage} from '../pages/NewsPage'
import * as newsHooks from '../hooks/useNews'
import {I18nContext} from '../i18n'
import {SEOProvider} from '../hooks/useSEO'

vi.mock('../hooks/useNews')

const mockNewsData = [
  {
    id: 'news-1',
    title: {
      tr: 'Birim Yeni Koleksiyonu Milano Tasarım Haftasında',
      en: 'Birim New Collection in Milan',
    },
    content: 'Milan Design Week kapsamında Birim yeni ürünlerini tanıttı.',
    date: '2026-05-15',
    category: 'events',
    readTime: '3 dk',
    featured: true,
    mainImage: {url: 'https://example.com/img1.jpg'},
    media: [],
  },
  {
    id: 'news-2',
    title: {tr: 'German Design Award 2026 Ödülü', en: 'German Design Award 2026'},
    content: 'Birim yeni tasarımı ile uluslararası tasarım ödülüne layık görüldü.',
    date: '2026-04-10',
    category: 'awards',
    readTime: '2 dk',
    featured: false,
    mainImage: {url: 'https://example.com/img2.jpg'},
    media: [],
  },
]

const renderComponent = (initialEntries = ['/news']) => {
  return render(
    <HelmetProvider>
      <SEOProvider>
        <I18nContext.Provider
          value={{
            t: (key: unknown) =>
              typeof key === 'string'
                ? key
                : typeof key === 'object' && key !== null
                  ? (key as Record<string, string>)?.tr || ''
                  : '',
            locale: 'tr',
            setLocale: vi.fn(),
            supportedLocales: ['tr', 'en'],
          }}
        >
          <MemoryRouter initialEntries={initialEntries}>
            <NewsPage />
          </MemoryRouter>
        </I18nContext.Provider>
      </SEOProvider>
    </HelmetProvider>
  )
}

describe('NewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(newsHooks.useNews).mockReturnValue({
      data: mockNewsData,
      isLoading: false,
    } as unknown as ReturnType<typeof newsHooks.useNews>)
  })

  it('renders NewsPage (V2) directly and hides V1 and V3 options', () => {
    renderComponent(['/news'])
    expect(screen.getByRole('heading', {level: 1})).toBeDefined()
    expect(screen.getByText('Birim Yeni Koleksiyonu Milano Tasarım Haftasında')).toBeDefined()
    expect(screen.queryByText('V1')).toBeNull()
    expect(screen.queryByText('V3')).toBeNull()
    expect(screen.getByPlaceholderText('Haberlerde ara...')).toBeDefined()
  })
})
