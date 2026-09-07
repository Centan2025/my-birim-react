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

describe('NewsPage & Version Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(newsHooks.useNews).mockReturnValue({
      data: mockNewsData,
      isLoading: false,
    } as unknown as ReturnType<typeof newsHooks.useNews>)
  })

  it('renders V1 Klasik by default', () => {
    renderComponent(['/news'])
    // Switcher presence
    expect(screen.getByText('V1')).toBeDefined()
    expect(screen.getByText('V2')).toBeDefined()

    // Title in V1
    expect(screen.getByRole('heading', {level: 1})).toBeDefined()
    expect(screen.getByText('Birim Yeni Koleksiyonu Milano Tasarım Haftasında')).toBeDefined()
  })

  it('renders V2 Editoryal when query parameter v=2 is present', () => {
    renderComponent(['/news?v=2'])
    // Should render V2 elements
    expect(screen.getByText('Bento')).toBeDefined()
    expect(screen.getByText('Dizin')).toBeDefined()
    expect(screen.getByText(/EDİTÖRÜN SEÇTİKLERİ/i)).toBeDefined()
    expect(screen.getByText(/HABERİ OKU/i)).toBeDefined()
  })

  it('switches between V1 and V2 when switcher buttons are clicked', () => {
    renderComponent(['/news'])

    // Click V2 button
    const v2Button = screen.getByTitle('V2 (Editoryal)')
    fireEvent.click(v2Button)

    // Should now be on V2
    expect(screen.getByText('Bento')).toBeDefined()
    expect(screen.getByText('Dizin')).toBeDefined()
    expect(localStorage.getItem('birim_news_view_version')).toBe('v2')

    // Click V1 button
    const v1Button = screen.getByTitle('V1 (Klasik)')
    fireEvent.click(v1Button)
    expect(localStorage.getItem('birim_news_view_version')).toBe('v1')
  })
})
