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
  isSearchOpen: false,
  isDarkMode: false,
}

describe('useHeaderBackgroundColor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    Object.defineProperty(window, 'scrollY', {value: 0, configurable: true})
  })

  it('ürün detay sayfasında minimum 0.78 opacity döndürmeli', () => {
    const {result} = renderHook(() => useHeaderBackgroundColor({...baseParams, headerOpacity: 0}), {
      wrapper: wrapper('/product/sandalye-1'),
    })
    expect(result.current).toBe('rgba(255, 255, 255, 0.78)')
  })

  it('products dropdown açıkken koyu arka plan döndürmeli (tüm sayfalarda)', () => {
    const {result} = renderHook(
      () => useHeaderBackgroundColor({...baseParams, isProductsOpen: true}),
      {wrapper: wrapper('/contact')}
    )
    expect(result.current).toBe('rgba(0, 0, 0, 0.85)')
  })

  it('products dropdown açıkken koyu arka plan döndürmeli (koyu hero sayfa)', () => {
    const {result} = renderHook(
      () => useHeaderBackgroundColor({...baseParams, isProductsOpen: true, isLightMode: false}),
      {wrapper: wrapper('/')}
    )
    expect(result.current).toBe('rgba(0, 0, 0, 0.85)')
  })

  it('dark mode açıkken dark arka plan döndürmeli', () => {
    const {result} = renderHook(() => useHeaderBackgroundColor({...baseParams, isDarkMode: true}), {
      wrapper: wrapper('/contact'),
    })
    expect(result.current).toBe('rgba(10, 10, 10, 0.78)')
  })

  it('dark olmayan sayfada scroll yoksa (veya azsa) minimum 0.78 opacity döndürmeli', () => {
    const {result} = renderHook(() => useHeaderBackgroundColor({...baseParams}), {
      wrapper: wrapper('/contact'),
    })
    expect(result.current).toBe('rgba(255, 255, 255, 0.78)')
  })

  it('inline mobil menü açıkken opacity 0.85 ile sınırlandırılmalı', () => {
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
    expect(result.current).toBe('rgba(16, 24, 32, 0.85)')
  })

  it('overlay mobil menü açıkken sayfa temasına göre koyu veya açık panel arka plan rengi döndürmeli', () => {
    const {result} = renderHook(
      () =>
        useHeaderBackgroundColor({
          ...baseParams,
          isMobile: true,
          isMobileMenuOpen: true,
          isOverlayMobileMenu: true,
        }),
      {wrapper: wrapper('/contact')}
    )
    expect(result.current).toBe('rgba(255, 255, 255, 0.95)')
  })

  it('overlay mobil menü kapanırken de aynı arka plan rengini korumalı', () => {
    const {result} = renderHook(
      () =>
        useHeaderBackgroundColor({
          ...baseParams,
          isMobile: true,
          isMobileMenuOpen: false,
          isMobileMenuClosing: true,
          isOverlayMobileMenu: true,
        }),
      {wrapper: wrapper('/contact')}
    )
    expect(result.current).toBe('rgba(255, 255, 255, 0.95)')
  })

  it('desktopta products paneli kapanırken (isProductsClosing) koyu arka planı korumalı', () => {
    const {result} = renderHook(
      () =>
        useHeaderBackgroundColor({
          ...baseParams,
          isMobile: false,
          isProductsOpen: false,
          isProductsClosing: true,
        }),
      {wrapper: wrapper('/contact')}
    )
    expect(result.current).toBe('rgba(0, 0, 0, 0.85)')
  })
})
