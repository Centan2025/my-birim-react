import React from 'react'
import {describe, it, expect} from 'vitest'
import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {AuthProvider} from '../context/AuthContext'
import {SelectionProvider} from '../context/SelectionContext'
import {I18nProvider} from '../i18n'
import {
  isProductShopEligible,
  getShopProductUrl,
  getShopCtaLabel,
  getShopBaseUrl,
  isShopNavVisible,
  extractProductSlug,
} from '../utils/shopBridge'
import {ProductCard} from '../components/ProductCard'
import {ProductInfo} from '../components/product/ProductInfo'
import type {Product} from '../types'

describe('Shop Bridge Utilities & Authoritative Consistency', () => {
  const baseProduct: Partial<Product> = {
    id: 'prod-12345',
    slug: 'vesper-chair',
    name: {tr: 'Vesper Sandalye', en: 'Vesper Chair'},
    description: {tr: 'Tasarım sandalye', en: 'Design chair'},
    year: 2025,
    buyable: true,
    sale_enabled: true,
    sales_mode: 'DIRECT',
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <SelectionProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </SelectionProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  )

  describe('extractProductSlug', () => {
    it('extracts string slug correctly', () => {
      expect(extractProductSlug('vesper-chair')).toBe('vesper-chair')
      expect(extractProductSlug('  custom-sofa  ')).toBe('custom-sofa')
    })

    it('extracts slug from object structure {current: string}', () => {
      expect(extractProductSlug({slug: {current: 'armchair-99'}})).toBe('armchair-99')
    })

    it('rejects empty, null, undefined, and malformed strings', () => {
      expect(extractProductSlug(null)).toBeNull()
      expect(extractProductSlug(undefined)).toBeNull()
      expect(extractProductSlug('')).toBeNull()
      expect(extractProductSlug('   ')).toBeNull()
      expect(extractProductSlug('undefined')).toBeNull()
      expect(extractProductSlug('null')).toBeNull()
    })

    it('rejects product object when slug is missing even if id is present', () => {
      expect(
        extractProductSlug({id: 'prod-999', name: {tr: 'Test', en: 'Test'}} as unknown as Product)
      ).toBeNull()
      expect(extractProductSlug({id: 'prod-999', slug: ''} as unknown as Product)).toBeNull()
      expect(
        extractProductSlug({id: 'prod-999', slug: {current: ''}} as unknown as Product)
      ).toBeNull()
    })
  })

  describe('isProductShopEligible', () => {
    it('returns true for DIRECT commerce-eligible products with valid slug', () => {
      expect(isProductShopEligible(baseProduct as Product)).toBe(true)
    })

    it('returns true for CONFIGURABLE commerce-eligible products with valid slug', () => {
      const configurableProduct = {
        ...baseProduct,
        sales_mode: 'CONFIGURABLE',
      }
      expect(isProductShopEligible(configurableProduct as Product)).toBe(true)
    })

    it('returns false when commerce_enabled is false on product candidate', () => {
      const disabledCommerce = {
        ...baseProduct,
        commerce_enabled: false,
      }
      expect(isProductShopEligible(disabledCommerce as Product)).toBe(false)
    })

    it('returns false when commerce_enabled is false via global options', () => {
      expect(isProductShopEligible(baseProduct as Product, {commerce_enabled: false})).toBe(false)
    })

    it('returns false when slug is missing even if id exists (ID alone is strictly insufficient)', () => {
      const noSlugProduct = {
        ...baseProduct,
        slug: undefined,
      }
      expect(isProductShopEligible(noSlugProduct as Product)).toBe(false)
    })

    it('returns false when slug is empty string or malformed', () => {
      expect(isProductShopEligible({...baseProduct, slug: ''} as Product)).toBe(false)
      expect(isProductShopEligible({...baseProduct, slug: '   '} as Product)).toBe(false)
      expect(isProductShopEligible({...baseProduct, slug: 'undefined'} as Product)).toBe(false)
      expect(isProductShopEligible({...baseProduct, slug: {current: ''}} as Product)).toBe(false)
    })

    it('returns false when sales_mode is QUOTE (Shop CTA HIDDEN)', () => {
      const quoteProduct = {
        ...baseProduct,
        sales_mode: 'QUOTE',
      }
      expect(isProductShopEligible(quoteProduct as Product)).toBe(false)
    })

    it('returns false when sales_mode is NONE (Shop CTA HIDDEN)', () => {
      const noneProduct = {
        ...baseProduct,
        sales_mode: 'NONE',
      }
      expect(isProductShopEligible(noneProduct as Product)).toBe(false)
    })

    it('returns false when buyable is false (Shop CTA HIDDEN)', () => {
      const notBuyable = {
        ...baseProduct,
        buyable: false,
      }
      expect(isProductShopEligible(notBuyable as Product)).toBe(false)
    })

    it('returns false when sale_enabled is false (Shop CTA HIDDEN)', () => {
      const disabledSale = {
        ...baseProduct,
        sale_enabled: false,
      }
      expect(isProductShopEligible(disabledSale as Product)).toBe(false)
    })

    it('returns false for null or undefined input', () => {
      expect(isProductShopEligible(null)).toBe(false)
      expect(isProductShopEligible(undefined)).toBe(false)
    })
  })

  describe('getShopProductUrl', () => {
    it('generates direct product URL when valid slug is present', () => {
      const baseUrl = getShopBaseUrl()
      expect(getShopProductUrl(baseProduct as Product)).toBe(`${baseUrl}/product/vesper-chair`)
      expect(getShopProductUrl('custom-sofa')).toBe(`${baseUrl}/product/custom-sofa`)
      expect(getShopProductUrl({slug: {current: 'lounge-chair'}})).toBe(
        `${baseUrl}/product/lounge-chair`
      )
    })

    it('returns null fail-safe when slug is missing, empty, or malformed', () => {
      expect(getShopProductUrl(null)).toBeNull()
      expect(getShopProductUrl(undefined)).toBeNull()
      expect(getShopProductUrl('')).toBeNull()
      expect(getShopProductUrl('   ')).toBeNull()
      expect(getShopProductUrl('undefined')).toBeNull()
      expect(getShopProductUrl('null')).toBeNull()
      expect(getShopProductUrl({id: 'id-only'} as Product)).toBeNull()
    })
  })

  describe('getShopCtaLabel', () => {
    it('returns proper Turkish and English labels for card and PDP', () => {
      expect(getShopCtaLabel(baseProduct, 'tr', 'card')).toBe("Shop'ta Gör")
      expect(getShopCtaLabel(baseProduct, 'en', 'card')).toBe('View in Shop')
      expect(getShopCtaLabel(baseProduct, 'tr', 'pdp')).toBe("Shop'ta Satın Al")
      expect(getShopCtaLabel(baseProduct, 'en', 'pdp')).toBe('Buy in Shop')
    })

    it('returns View in Shop for CONFIGURABLE PDP', () => {
      const confProduct = {...baseProduct, sales_mode: 'CONFIGURABLE'}
      expect(getShopCtaLabel(confProduct, 'tr', 'pdp')).toBe("Shop'ta Gör")
      expect(getShopCtaLabel(confProduct, 'en', 'pdp')).toBe('View in Shop')
    })
  })

  describe('Component Rendering Integration', () => {
    it('ProductCard renders Shop CTA when product is eligible with valid slug', () => {
      const {container} = render(
        <TestWrapper>
          <ProductCard product={baseProduct as Product} />
        </TestWrapper>
      )
      const shopLink = container.querySelector(
        'a[href="https://shop.birim.com/product/vesper-chair"]'
      )
      expect(shopLink).toBeInTheDocument()
      expect(shopLink).toHaveAttribute('title', expect.stringMatching(/Shop'ta Gör|View in Shop/i))
    })

    it('ProductCard DOES NOT render Shop CTA when slug is missing (ID only)', () => {
      const idOnlyProduct = {
        ...baseProduct,
        slug: undefined,
      }
      const {container} = render(
        <TestWrapper>
          <ProductCard product={idOnlyProduct as Product} />
        </TestWrapper>
      )
      const shopLink = container.querySelector('a[href*="shop.birim.com"]')
      expect(shopLink).toBeNull()
    })

    it('ProductCard DOES NOT render Shop CTA when commerce_enabled is false', () => {
      const disabledProduct = {
        ...baseProduct,
        commerce_enabled: false,
      }
      const {container} = render(
        <TestWrapper>
          <ProductCard product={disabledProduct as Product} />
        </TestWrapper>
      )
      const shopLink = container.querySelector('a[href*="shop.birim.com"]')
      expect(shopLink).toBeNull()
    })

    it('ProductInfo renders primary Shop CTA when eligible with valid slug', () => {
      render(
        <TestWrapper>
          <ProductInfo
            product={baseProduct as Product}
            locale="tr"
            t={k => (typeof k === 'object' ? k.tr : k)}
          />
        </TestWrapper>
      )
      const cta = screen.getByRole('link', {name: /Shop'ta Satın Al|Buy in Shop/i})
      expect(cta).toBeInTheDocument()
      expect(cta).toHaveAttribute('href', 'https://shop.birim.com/product/vesper-chair')
    })

    it('ProductInfo DOES NOT render Shop CTA when sales_mode is QUOTE', () => {
      const quoteProduct = {
        ...baseProduct,
        sales_mode: 'QUOTE',
      }
      render(
        <TestWrapper>
          <ProductInfo
            product={quoteProduct as Product}
            locale="tr"
            t={k => (typeof k === 'object' ? k.tr : k)}
          />
        </TestWrapper>
      )
      expect(
        screen.queryByRole('link', {name: /Shop'ta Satın Al|Buy in Shop/i})
      ).not.toBeInTheDocument()
    })
  })

  describe('isShopNavVisible', () => {
    it('returns true in development / localhost environment by default', () => {
      expect(isShopNavVisible()).toBe(true)
    })

    it('returns true if explicitly enabled via settings.isShopVisible', () => {
      expect(isShopNavVisible({isShopVisible: true})).toBe(true)
    })
  })
})
