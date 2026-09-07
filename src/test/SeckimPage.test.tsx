import {describe, it, expect, vi} from 'vitest'
import {render, screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {HelmetProvider} from 'react-helmet-async'
import {SeckimPage} from '../pages/SeckimPage'
import {I18nProvider} from '../i18n'
import {SEOProvider} from '../hooks/useSEO'
import {SelectionProvider} from '../context/SelectionContext'
import {AuthProvider} from '../context/AuthContext'
import {SiteSettingsProvider} from '../context/SiteSettingsContext'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({
    data: [
      {
        id: 'prod-1',
        name: {tr: 'Test Koltuk', en: 'Test Armchair'},
        categoryId: 'cat-1',
        images: [{url: 'https://example.com/p1.jpg'}],
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({
    data: [{id: 'cat-1', name: {tr: 'Koltuklar', en: 'Armchairs'}}],
    isLoading: false,
  }),
}))

vi.mock('../hooks/useDesigners', () => ({
  useDesigners: () => ({
    data: [],
    isLoading: false,
  }),
}))

const queryClient = new QueryClient({
  defaultOptions: {queries: {retry: false}},
})

const renderSeckimPage = (initialUrl = '/seckim') => {
  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <I18nProvider>
            <SEOProvider>
              <SiteSettingsProvider>
                <SelectionProvider>
                  <MemoryRouter initialEntries={[initialUrl]}>
                    <Routes>
                      <Route path="/seckim" element={<SeckimPage />} />
                    </Routes>
                  </MemoryRouter>
                </SelectionProvider>
              </SiteSettingsProvider>
            </SEOProvider>
          </I18nProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  )
}

describe('SeckimPage Tab Switcher and Breadcrumbs', () => {
  it('renders "TÜM SEÇTİKLERİM" tab by default and switches to "PROJELERİM" on click with dynamic breadcrumbs', () => {
    renderSeckimPage('/seckim')

    // Tab buttons exist
    const seckimTabBtn = screen.getByRole('button', {name: /TÜM SEÇTİKLERİM/i})
    const projelerTabBtn = screen.getByRole('button', {name: /PROJELERİM/i})

    expect(seckimTabBtn).toBeInTheDocument()
    expect(projelerTabBtn).toBeInTheDocument()

    // Default tab is "TÜM SEÇTİKLERİM"
    expect(screen.getByText(/Henüz bir seçiminiz yok/i)).toBeInTheDocument()

    // Breadcrumbs on default tab
    const breadcrumbNav = screen.getByRole('navigation', {name: /breadcrumb/i})
    expect(breadcrumbNav).toHaveTextContent(/SEÇTİKLERİM/i)
    expect(breadcrumbNav).not.toHaveTextContent(/PROJELERİM/i)

    // Click "PROJELERİM" tab
    fireEvent.click(projelerTabBtn)

    // Should switch to "PROJELERİM" view immediately
    expect(screen.getByText(/Henüz bir proje oluşturmadınız/i)).toBeInTheDocument()

    // Breadcrumbs updated to include PROJELERİM
    expect(breadcrumbNav).toHaveTextContent(/SEÇTİKLERİM/i)
    expect(breadcrumbNav).toHaveTextContent(/PROJELERİM/i)

    // Click back to "TÜM SEÇTİKLERİM" tab
    fireEvent.click(seckimTabBtn)

    // Should switch back immediately
    expect(screen.getByText(/Henüz bir seçiminiz yok/i)).toBeInTheDocument()
    expect(breadcrumbNav).not.toHaveTextContent(/PROJELERİM/i)
  })

  it('renders "PROJELERİM" tab and breadcrumbs directly when URL has ?tab=projeler', () => {
    renderSeckimPage('/seckim?tab=projeler')

    expect(screen.getByText(/Henüz bir proje oluşturmadınız/i)).toBeInTheDocument()

    const breadcrumbNav = screen.getByRole('navigation', {name: /breadcrumb/i})
    expect(breadcrumbNav).toHaveTextContent(/SEÇTİKLERİM/i)
    expect(breadcrumbNav).toHaveTextContent(/PROJELERİM/i)
  })
})
