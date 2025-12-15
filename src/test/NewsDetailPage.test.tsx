import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import {MemoryRouter, Routes, Route} from 'react-router-dom'

import {NewsDetailPage} from '../../pages/NewsDetailPage'
import * as newsHooks from '../hooks/useNews'
import * as siteHooks from '../hooks/useSiteData'

// Hooks'u mockla
vi.mock('../hooks/useNews')
vi.mock('../hooks/useSiteData')

// Basit i18n mock'u
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key: any) => (typeof key === 'string' ? key : key?.tr || ''),
    locale: 'tr',
    setLocale: vi.fn(),
    supportedLocales: ['tr', 'en'],
  }),
}))

// useSEO ve structured data helper'ları gerçek implementasyonla kullanıyoruz

const renderWithRouter = (initialPath: string) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/news/:newsId" element={<NewsDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('NewsDetailPage', () => {
  it('renders news title and content when data is available', () => {
    vi.mocked(newsHooks.useNewsItem).mockReturnValue({
      data: {
        id: 'news-1',
        title: {tr: 'Haber Başlığı'},
        date: '2025-01-01T00:00:00.000Z',
        content: {tr: 'Haber içeriği'},
        mainImage: {url: 'https://example.com/news.jpg'},
        media: [],
        isPublished: true,
      },
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(newsHooks.useNews).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(siteHooks.useSiteSettings).mockReturnValue({
      data: {
        logoUrl: 'https://example.com/logo.png',
        imageBorderStyle: 'square',
      },
      isLoading: false,
      isError: false,
    } as any)

    renderWithRouter('/news/news-1')

    expect(screen.getByText('Haber Başlığı')).toBeInTheDocument()
    expect(screen.getByText('Haber içeriği')).toBeInTheDocument()
  })

  it('injects Article JSON-LD structured data', () => {
    vi.mocked(newsHooks.useNewsItem).mockReturnValue({
      data: {
        id: 'news-1',
        title: {tr: 'Haber Başlığı'},
        date: '2025-01-01T00:00:00.000Z',
        content: {tr: 'Haber içeriği'},
        mainImage: {url: 'https://example.com/news.jpg'},
        media: [],
        isPublished: true,
      },
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(newsHooks.useNews).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(siteHooks.useSiteSettings).mockReturnValue({
      data: {
        logoUrl: 'https://example.com/logo.png',
        imageBorderStyle: 'square',
      },
      isLoading: false,
      isError: false,
    } as any)

    renderWithRouter('/news/news-1')

    const script = document.getElementById('news-article-schema') as HTMLScriptElement | null
    expect(script).not.toBeNull()
    expect(script?.type).toBe('application/ld+json')

    const parsed = JSON.parse(script!.textContent || '{}')
    expect(parsed['@type']).toBe('Article')
    expect(parsed.headline).toBe('Haber Başlığı')
  })
})

