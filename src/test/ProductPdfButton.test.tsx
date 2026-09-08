import {describe, it, expect, vi} from 'vitest'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'
import {ProductPdfButton} from '../components/product/ProductPdfButton'
import {I18nProvider} from '../i18n'
import type {Product} from '../types'
import * as pdfGenerator from '../utils/pdfGenerator'

const mockProduct: Product = {
  id: 'p1',
  name: {tr: 'Test Kanepe', en: 'Test Sofa'},
  description: {tr: 'Modern konfor', en: 'Modern comfort'},
  designerId: 'd1',
  categoryId: 'c1',
  year: 2024,
  buyable: true,
  price: 15000,
  currency: 'TRY',
  sku: 'BIRIM-TK-01',
  mainImage: 'https://example.com/image.jpg',
  materials: [],
  exclusiveContent: {images: [], drawings: [], models3d: []},
}

describe('ProductPdfButton', () => {
  it('renders icon-only PDF download button correctly', () => {
    render(
      <I18nProvider>
        <ProductPdfButton product={mockProduct} variant="icon-only" />
      </I18nProvider>
    )

    expect(screen.getByRole('button', {name: /ürün bilgi formu|product datasheet/i})).toBeInTheDocument()
  })

  it('renders default button with text correctly', () => {
    render(
      <I18nProvider>
        <ProductPdfButton product={mockProduct} variant="default" />
      </I18nProvider>
    )

    expect(screen.getByRole('button', {name: /ürün bilgi formu|product datasheet/i})).toBeInTheDocument()
    expect(screen.getByText(/pdf i̇ndi̇r|pdf indir|download pdf/i)).toBeInTheDocument()
  })

  it('triggers downloadProductDetailPDF when clicked', async () => {
    const downloadSpy = vi.spyOn(pdfGenerator, 'downloadProductDetailPDF').mockResolvedValue()

    render(
      <I18nProvider>
        <ProductPdfButton
          product={mockProduct}
          category={{id: 'c1', name: {tr: 'Koltuklar'}, subtitle: {tr: ''}, heroImage: ''}}
          designer={{id: 'd1', name: {tr: 'Birim Studio'}, bio: {tr: ''}, image: ''}}
        />
      </I18nProvider>
    )

    const button = screen.getByRole('button', {name: /ürün bilgi formu|product datasheet/i})
    fireEvent.click(button)

    expect(downloadSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        product: mockProduct,
      })
    )

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })

    downloadSpy.mockRestore()
  })

  it('handles errors during PDF generation gracefully', async () => {
    const downloadSpy = vi
      .spyOn(pdfGenerator, 'downloadProductDetailPDF')
      .mockRejectedValue(new Error('PDF generation failure'))
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <I18nProvider>
        <ProductPdfButton product={mockProduct} />
      </I18nProvider>
    )

    const button = screen.getByRole('button', {name: /ürün bilgi formu|product datasheet/i})
    fireEvent.click(button)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled()
    })

    downloadSpy.mockRestore()
    alertSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
})
