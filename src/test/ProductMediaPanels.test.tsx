import {describe, it, expect, vi} from 'vitest'
import {render, screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import {ProductMediaPanels} from '../components/ProductMediaPanels'

describe('ProductMediaPanels', () => {
  const mockProduct = {
    id: 'test-product',
    name: {tr: 'Test Ürün'},
    description: {tr: 'Test Açıklama'},
    bottomMedia: [
      {
        type: 'image' as const,
        url: 'https://example.com/img1.jpg',
        title: {tr: 'Görsel 1'},
      },
      {
        type: 'youtube' as const,
        url: 'https://www.youtube.com/watch?v=abc123xyz',
        title: {tr: 'Video 1'},
      },
    ],
  }

  it('renders bottom alternative media panels properly', () => {
    const openLightbox = vi.fn()
    const youTubeThumb = vi.fn(() => `https://img.youtube.com/vi/thumb.jpg`)
    const t = (val: any) => (typeof val === 'string' ? val : val?.tr || '')

    render(
      <ProductMediaPanels
        product={mockProduct as any}
        imageBorderClass="rounded-lg"
        youTubeThumb={youTubeThumb}
        openPanelLightbox={openLightbox}
        t={t}
      />
    )

    expect(screen.getByText('Projeler')).toBeInTheDocument()
    expect(screen.getByText('Görsel 1')).toBeInTheDocument()
    expect(screen.getByText('Video 1')).toBeInTheDocument()

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)

    fireEvent.click(buttons[0])
    expect(openLightbox).toHaveBeenCalledWith(0)
  })

  it('returns null if no media available', () => {
    const {container} = render(
      <ProductMediaPanels
        product={{id: 'p2', name: {tr: 'Boş'}} as any}
        imageBorderClass=""
        youTubeThumb={vi.fn()}
        openPanelLightbox={vi.fn()}
        t={(v: any) => v?.tr || ''}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
