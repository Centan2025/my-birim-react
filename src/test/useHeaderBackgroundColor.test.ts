import {describe, it, expect, vi, afterEach} from 'vitest'
import {renderHook} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import React from 'react'
import {useHeaderBackgroundColor} from '../hooks/useHeaderBackgroundColor'

const wrapper =
  (path = '/') =>
  ({children}: {children: React.ReactNode}) =>
    React.createElement(MemoryRouter, {initialEntries: [path]}, children)

const baseParams = {
  isMobile: false,
  isProductsOpen: false,
  headerOpacity: 0,
  isMobileMenuOpen: false,
  isOverlayMobileMenu: false,
  isMobileMenuClosing: false,
  isSearchOpen: false,
  isDarkMode: false,
}

describe('useHeaderBackgroundColor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    Object.defineProperty(window, 'scrollY', {value: 0, configurable: true})
  })

  it('ürün detay sayfasında minimum 0.7 opacity döndürmeli', () => {
    const {result} = renderHook(() => useHeaderBackgroundColor({...baseParams, headerOpacity: 0}), {
      wrapper: wrapper('/product/sandalye-1'),
    })
    expect(result.current).toBe('rgba(255, 255, 255, 0.6)')
  })

  it('products dropdown açıkken 0.95 opacity döndürmeli (açık renk sayfa)', () => {
    const {result} = renderHook(
      () => useHeaderBackgroundColor({...baseParams, isProductsOpen: true}),
      {wrapper: wrapper('/contact')}
    )
    expect(result.current).toBe('rgba(255, 255, 255, 0.95)')
  })

  it('dark mode açıkken dark arka plan döndürmeli', () => {
    const {result} = renderHook(() => useHeaderBackgroundColor({...baseParams, isDarkMode: true}), {
      wrapper: wrapper('/contact'),
    })
    expect(result.current).toBe('rgba(10, 10, 10, 0.6)')
  })

  it('dark olmayan sayfada scroll yoksa (veya azsa) minimum 0.6 opacity döndürmeli', () => {
    const {result} = renderHook(() => useHeaderBackgroundColor({...baseParams}), {
      wrapper: wrapper('/contact'),
    })
    expect(result.current).toBe('rgba(255, 255, 255, 0.6)')
  })

  it('inline mobil menü açıkken opacity 0.75 ile sınırlandırılmalı', () => {
    const {result} = renderHook(
      () =>
        useHeaderBackgroundColor({
          ...baseParams,
          isMobileMenuOpen: true,
          isOverlayMobileMenu: false,
          headerOpacity: 0.9,
        }),
      {wrapper: wrapper('/')}
    )
    expect(result.current).toBe('rgba(16, 24, 32, 0.7)')
  })

  it('mobilde heroBrightness düşük ve headerOpacity düşükse transparent döner', () => {
    const {result} = renderHook(
      () =>
        useHeaderBackgroundColor({
          ...baseParams,
          isMobile: true,
          heroBrightness: 0.2,
          headerOpacity: 0.1,
        }),
      {wrapper: wrapper('/')}
    )
    expect(result.current).toBe('transparent')
  })
})
