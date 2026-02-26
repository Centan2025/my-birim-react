import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { useHeaderBackgroundColor } from '../hooks/useHeaderBackgroundColor'

const wrapper =
    (path = '/') =>
        ({ children }: { children: React.ReactNode }) =>
            React.createElement(MemoryRouter, { initialEntries: [path] }, children)

const baseParams = {
    isMobile: false,
    isProductsOpen: false,
    headerOpacity: 0,
    isMobileMenuOpen: false,
    isOverlayMobileMenu: false,
    isMobileMenuClosing: false,
    heroBrightness: null as number | null,
}

describe('useHeaderBackgroundColor', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        document.body.innerHTML = ''
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    })

    it('ürün detay sayfasında minimum 0.7 opacity döndürmeli', () => {
        const { result } = renderHook(
            () => useHeaderBackgroundColor({ ...baseParams, headerOpacity: 0 }),
            { wrapper: wrapper('/product/sandalye-1') }
        )
        expect(result.current).toBe('rgba(0, 0, 0, 0.7)')
    })

    it('products dropdown açıkken 0.85 opacity döndürmeli', () => {
        const { result } = renderHook(
            () => useHeaderBackgroundColor({ ...baseParams, isProductsOpen: true }),
            { wrapper: wrapper('/categories') }
        )
        expect(result.current).toBe('rgba(0, 0, 0, 0.85)')
    })

    it('heroBrightness 0.5 ile 0.6 arası ise 0.75 opacity döndürmeli (mobil, scrolled)', () => {
        // Mobilde scroll konumu dark hero istisnası dışında önemli değil ama heroBrightness varsa devrededir.
        // window.scrollY > 0 ise ve heroBrightness varsa renk dönmeli.
        Object.defineProperty(window, 'scrollY', { value: 20, configurable: true })
        const { result } = renderHook(
            () => useHeaderBackgroundColor({ ...baseParams, isMobile: true, heroBrightness: 0.6 }),
            { wrapper: wrapper('/') }
        )
        expect(result.current).toBe('rgba(0, 0, 0, 0.75)')
    })

    it('heroBrightness 0.5 ile 0.6 arası ise 0.75 opacity döndürmeli (masaüstü, az scroll, not dark hero path)', () => {
        // Masaüstünde brightness mantığı scroll <= 10 ve dark hero olmayan sayfalarda çalışır
        Object.defineProperty(window, 'scrollY', { value: 5, configurable: true })
        const { result } = renderHook(
            () => useHeaderBackgroundColor({ ...baseParams, isMobile: false, heroBrightness: 0.6 }),
            { wrapper: wrapper('/products') }
        )
        expect(result.current).toBe('rgba(0, 0, 0, 0.75)')
    })

    it('dark olmayan sayfada scroll yoksa main element arka planına göre renk dönmeli (beyaz bg)', () => {
        document.body.innerHTML = '<main style="background-color: rgb(255, 255, 255)"></main>'
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })

        // getComputedStyle mock
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            backgroundColor: 'rgb(255, 255, 255)'
        } as any)

        const { result } = renderHook(
            () => useHeaderBackgroundColor({ ...baseParams }),
            { wrapper: wrapper('/products') }
        )
        expect(result.current).toBe('rgba(0, 0, 0, 0.85)')
    })

    it('inline mobil menü açıkken opacity 0.75 ile sınırlandırılmalı', () => {
        const { result } = renderHook(
            () => useHeaderBackgroundColor({
                ...baseParams,
                isMobileMenuOpen: true,
                isOverlayMobileMenu: false,
                headerOpacity: 0.9
            }),
            { wrapper: wrapper('/products') }
        )
        expect(result.current).toBe('rgba(0, 0, 0, 0.75)')
    })

    it('mobilde heroBrightness düşük ve headerOpacity düşükse transparent döner', () => {
        const { result } = renderHook(
            () => useHeaderBackgroundColor({
                ...baseParams,
                isMobile: true,
                heroBrightness: 0.2,
                headerOpacity: 0.1
            }),
            { wrapper: wrapper('/') }
        )
        expect(result.current).toBe('transparent')
    })
})
