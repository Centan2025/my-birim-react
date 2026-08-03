import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import {describe, it, expect} from 'vitest'
import {MemoryRouter} from 'react-router-dom'
import {I18nProvider} from '../i18n'
import {InteractiveShowcase} from '../components/InteractiveShowcase'
import {InteractiveShowcaseItem} from '../types'

describe('InteractiveShowcase component', () => {
  const mockItems: InteractiveShowcaseItem[] = [
    {
      title: {tr: 'Oturma Odası Tasarımı', en: 'Living Room Design'},
      image: 'https://example.com/image1.jpg',
      hotspots: [
        {
          x: 40,
          y: 60,
          label: {tr: 'Modern Koltuk', en: 'Modern Armchair'},
          product: {
            id: 'modern-koltuk',
            name: {tr: 'Modern Koltuk', en: 'Modern Armchair'},
            mainImage: 'https://example.com/koltuk.jpg',
            price: 15000,
            currency: 'TRY',
            categoryName: {tr: 'Koltuklar', en: 'Armchairs'},
            designerName: {tr: 'Mimar Ali', en: 'Architect Ali'},
          },
        },
      ],
    },
    {
      title: {tr: 'Yemek Odası Tasarımı', en: 'Dining Room Design'},
      image: 'https://example.com/image2.jpg',
      hotspots: [],
    },
  ]

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <I18nProvider>{ui}</I18nProvider>
      </MemoryRouter>
    )
  }

  it('renders showcase items cleanly', () => {
    renderWithProviders(<InteractiveShowcase items={mockItems} />)

    expect(screen.getByText('Living Room Design')).toBeInTheDocument()
  })

  it('renders hotspot pin and opens product card on click', () => {
    renderWithProviders(<InteractiveShowcase items={mockItems} />)

    const pin = screen.getByLabelText('Hotspot: Modern Armchair')
    expect(pin).toBeInTheDocument()

    // Click hotspot pin to reveal popover card
    fireEvent.click(pin)

    expect(screen.getAllByText('Modern Armchair').length).toBeGreaterThan(0)
    expect(screen.getByText(/Ürünü İncele/i)).toBeInTheDocument()
  })

  it('navigates slides when clicking next/prev buttons', () => {
    renderWithProviders(<InteractiveShowcase items={mockItems} />)

    expect(screen.getByText('Living Room Design')).toBeInTheDocument()

    const nextBtn = screen.getByLabelText('Sonraki Görsel')
    fireEvent.click(nextBtn)

    expect(screen.getByText('Dining Room Design')).toBeInTheDocument()
  })
})
