/**
 * CartSidebar bileşeni testleri
 */
import React from 'react'
import {describe, it, expect, beforeEach} from 'vitest'
import {render, screen, fireEvent, act} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {CartProvider, useCart} from '../context/CartContext'
import {CartSidebar} from '../components/CartSidebar'
import {I18nContext} from '../i18n'
import type {Product} from '../types'

const mockProduct: Product = {
  id: 'chair-1',
  name: {tr: 'Modern Sandalye', en: 'Modern Chair'},
  description: {tr: 'Açıklama', en: 'Description'},
  designerId: 'designer-1',
  categoryId: 'category-1',
  year: 2024,
  mainImage: 'https://example.com/chair.jpg',
  buyable: true,
  price: 2500,
  currency: 'TRY',
  materials: [],
}

const CartTestController: React.FC<{initialOpen?: boolean}> = ({initialOpen}) => {
  const {openCart} = useCart()
  const hasRun = React.useRef(false)

  React.useEffect(() => {
    if (initialOpen && !hasRun.current) {
      hasRun.current = true
      openCart()
    }
  }, [initialOpen, openCart])

  return <CartSidebar />
}

const renderWithProviders = (initialOpen = false, withItem = false) => {
  if (withItem) {
    localStorage.setItem('birim_cart', JSON.stringify([{product: mockProduct, quantity: 1}]))
  }

  return render(
    <MemoryRouter>
      <I18nContext.Provider
        value={{
          t: (key: unknown) =>
            typeof key === 'string' ? key : (key as Record<string, string>)?.tr || '',
          locale: 'tr',
          setLocale: () => {},
          supportedLocales: ['tr', 'en'],
        }}
      >
        <CartProvider>
          <CartTestController initialOpen={initialOpen} />
        </CartProvider>
      </I18nContext.Provider>
    </MemoryRouter>
  )
}

describe('CartSidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('uygun dialog rolü ve erişilebilirlik etiketlerine sahip olmalı', () => {
    renderWithProviders(true)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('sepet boşken boş sepet mesajı görüntülenmeli', () => {
    renderWithProviders(true, false)

    expect(screen.getByText('cart_empty')).toBeInTheDocument()
  })

  it('ürün eklendiğinde ürün adı ve teklif butonu görüntülenmeli', () => {
    renderWithProviders(true, true)

    expect(screen.getByText('Modern Sandalye')).toBeInTheDocument()
    expect(screen.getByText('request_quote')).toBeInTheDocument()
  })

  it('Escape tuşuna basıldığında sepet kapanmalı', () => {
    renderWithProviders(true)

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('translate-x-0')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
    })

    expect(dialog.className).toContain('translate-x-full')
  })

  it('kapatma butonuna tıklandığında sepet kapanmalı', () => {
    renderWithProviders(true)

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('translate-x-0')

    const closeBtn = screen.getAllByRole('button', {name: /close_cart|kapat/i})[1]
    fireEvent.click(closeBtn)

    expect(dialog.className).toContain('translate-x-full')
  })
})
