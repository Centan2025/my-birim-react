import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {renderHook, act} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {CommerceCartProvider, useCommerceCart} from '../context/CommerceCartContext'
import {CartProvider, useCart} from '../context/CartContext'
import type {CartValidationResult} from '../types/commerceCart'

// Helper wrapper for CommerceCartProvider
const wrapper = ({children}: PropsWithChildren) => (
  <CommerceCartProvider>{children}</CommerceCartProvider>
)

describe('CommerceCartContext & Client State Layer', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('1. State Management', () => {
    it('initializes with an empty cart', () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      expect(result.current.items).toEqual([])
      expect(result.current.itemCount).toBe(0)
      expect(result.current.hasItems).toBe(false)
      expect(result.current.validatedCart).toBeNull()
      expect(result.current.validationError).toBeNull()
      expect(result.current.isValidating).toBe(false)
    })

    it('adds a DIRECT product item', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-direct', null, 2)
      })

      expect(result.current.items).toEqual([
        {productId: 'prod-direct', variantId: null, quantity: 2},
      ])
      expect(result.current.itemCount).toBe(2)
      expect(result.current.hasItems).toBe(true)
    })

    it('adds a CONFIGURABLE product variant item', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-conf', 'variant-oak', 1)
      })

      expect(result.current.items).toEqual([
        {productId: 'prod-conf', variantId: 'variant-oak', quantity: 1},
      ])
      expect(result.current.itemCount).toBe(1)
    })

    it('merges quantity when adding the exact same product and variant', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-conf', 'variant-oak', 2)
      })
      await act(async () => {
        await result.current.addItem('prod-conf', 'variant-oak', 3)
      })

      expect(result.current.items).toEqual([
        {productId: 'prod-conf', variantId: 'variant-oak', quantity: 5},
      ])
      expect(result.current.itemCount).toBe(5)
    })

    it('keeps separate lines for different variants of the same product', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-conf', 'variant-oak', 1)
        await result.current.addItem('prod-conf', 'variant-walnut', 2)
      })

      expect(result.current.items).toHaveLength(2)
      expect(result.current.items[0]).toEqual({
        productId: 'prod-conf',
        variantId: 'variant-oak',
        quantity: 1,
      })
      expect(result.current.items[1]).toEqual({
        productId: 'prod-conf',
        variantId: 'variant-walnut',
        quantity: 2,
      })
      expect(result.current.itemCount).toBe(3)
    })

    it('removes an item by productId and variantId', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-1', null, 1)
        await result.current.addItem('prod-2', 'var-a', 2)
      })

      expect(result.current.items).toHaveLength(2)

      await act(async () => {
        await result.current.removeItem('prod-1', null)
      })

      expect(result.current.items).toEqual([{productId: 'prod-2', variantId: 'var-a', quantity: 2}])
      expect(result.current.itemCount).toBe(2)
    })

    it('updates item quantity and clamps bounds (1..100)', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-1', null, 2)
      })

      await act(async () => {
        await result.current.updateQuantity('prod-1', null, 10)
      })
      expect(result.current.items[0]?.quantity).toBe(10)

      // Clamps to max 100
      await act(async () => {
        await result.current.updateQuantity('prod-1', null, 150)
      })
      expect(result.current.items[0]?.quantity).toBe(100)

      // Quantity <= 0 removes the item
      await act(async () => {
        await result.current.updateQuantity('prod-1', null, 0)
      })
      expect(result.current.items).toHaveLength(0)
    })

    it('clears all items and resets state', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-1', null, 2)
        await result.current.addItem('prod-2', 'var-x', 1)
      })

      expect(result.current.itemCount).toBe(3)

      act(() => {
        result.current.clearCart()
      })

      expect(result.current.items).toEqual([])
      expect(result.current.itemCount).toBe(0)
      expect(result.current.hasItems).toBe(false)
      expect(result.current.validatedCart).toBeNull()
      expect(result.current.validationError).toBeNull()
      expect(localStorage.getItem('birim_commerce_cart')).toBeNull()
    })

    it('enforces maximum 50 distinct cart lines', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        for (let i = 1; i <= 55; i++) {
          await result.current.addItem(`prod-${i}`, null, 1)
        }
      })

      expect(result.current.items.length).toBe(50)
    })
  })

  describe('2. Persistence & Security', () => {
    it('persists only minimal intent data to birim_commerce_cart in localStorage', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-1', 'var-1', 2)
      })

      const raw = localStorage.getItem('birim_commerce_cart')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)

      expect(parsed).toEqual([{productId: 'prod-1', variantId: 'var-1', quantity: 2}])

      // Strictly verify no prices, currencies, skus or tokens exist
      expect(parsed[0].price).toBeUndefined()
      expect(parsed[0].unitPrice).toBeUndefined()
      expect(parsed[0].currency).toBeUndefined()
      expect(parsed[0].sku).toBeUndefined()
    })

    it('recovers gracefully from malformed JSON in localStorage', () => {
      localStorage.setItem('birim_commerce_cart', '{invalid json corrupt')

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      expect(result.current.items).toEqual([])
      expect(result.current.hasItems).toBe(false)
    })

    it('filters out invalid or legacy entries from localStorage', () => {
      const corruptData = [
        null,
        123,
        'string',
        {},
        {productId: '', quantity: 2},
        {productId: 'valid-prod', quantity: -5},
        {productId: 'valid-prod-2', variantId: 'v1', quantity: 3},
      ]
      localStorage.setItem('birim_commerce_cart', JSON.stringify(corruptData))

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      expect(result.current.items).toEqual([
        {productId: 'valid-prod', variantId: null, quantity: 1}, // normalized to min 1
        {productId: 'valid-prod-2', variantId: 'v1', quantity: 3},
      ])
    })

    it('ignores and discards forged price/currency/sku in localStorage', () => {
      const forgedData = [
        {
          productId: 'prod-hack',
          variantId: 'var-hack',
          quantity: 2,
          price: 0.01,
          unitPrice: 0.01,
          currency: 'USD',
          sku: 'FORGED-SKU',
          grandTotal: 0.02,
        },
      ]
      localStorage.setItem('birim_commerce_cart', JSON.stringify(forgedData))

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      expect(result.current.items).toEqual([
        {productId: 'prod-hack', variantId: 'var-hack', quantity: 2},
      ])
      // Forged attributes are discarded
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.items[0] as any).price).toBeUndefined()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.items[0] as any).currency).toBeUndefined()
    })

    it('never contains passwords, tokens or payment details in localStorage', async () => {
      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-1', null, 1)
      })

      const raw = localStorage.getItem('birim_commerce_cart') || ''
      expect(raw).not.toContain('token')
      expect(raw).not.toContain('password')
      expect(raw).not.toContain('card')
      expect(raw).not.toContain('cvv')
    })
  })

  describe('3. Server Validation Integration', () => {
    it('receives authoritative snapshot on successful server validation', async () => {
      const mockValidationResult: CartValidationResult = {
        valid: true,
        currency: 'TRY',
        items: [
          {
            productId: 'kilit-sehpa',
            variantId: 'oak-finish',
            productName: 'Kilit Sehpa (Meşe)',
            sku: 'KLT-OAK',
            quantity: 2,
            unitPrice: 15000,
            totalPrice: 30000,
            currency: 'TRY',
            selectedOptions: [{name: 'Kaplama', value: 'Meşe'}],
          },
        ],
        subtotal: 30000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 30000,
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockValidationResult,
      })

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('kilit-sehpa', 'oak-finish', 2)
      })

      // Trigger validation
      await act(async () => {
        await result.current.validateCart()
      })

      expect(result.current.validatedCart).toEqual(mockValidationResult)
      expect(result.current.validationError).toBeNull()
      expect(result.current.isStale).toBe(false)
    })

    it('handles server validation errors without automatically deleting the cart item', async () => {
      const mockErrorResponse = {
        valid: false,
        code: 'PRODUCT_NOT_FOR_SALE',
        message: 'Bu ürün şu anda doğrudan satışa kapalıdır.',
        productId: 'arch-table',
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => mockErrorResponse,
      })

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('arch-table', null, 1)
      })

      await act(async () => {
        await result.current.validateCart()
      })

      // ValidatedCart must be null
      expect(result.current.validatedCart).toBeNull()
      // Error is structured and user friendly
      expect(result.current.validationError).toEqual({
        code: 'PRODUCT_NOT_FOR_SALE',
        message: 'Sepetteki ürünlerden biri şu anda doğrudan satın alınamıyor.',
        productId: 'arch-table',
        variantId: undefined,
        statusCode: 422,
      })
      // CRITICAL: Item must NOT be deleted from cart intent
      expect(result.current.items).toEqual([
        {productId: 'arch-table', variantId: null, quantity: 1},
      ])
    })

    it('handles COMMERCE_DISABLED error from server gracefully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          valid: false,
          code: 'COMMERCE_DISABLED',
          message: 'Online e-ticaret satışı şu finale aktif değildir.',
        }),
      })

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-1', null, 1)
      })

      await act(async () => {
        await result.current.validateCart()
      })

      expect(result.current.validatedCart).toBeNull()
      expect(result.current.validationError?.code).toBe('COMMERCE_DISABLED')
      expect(result.current.validationError?.message).toBe(
        'Online satış hizmeti şu anda aktif değildir.'
      )
    })

    it('handles VARIANT_DISABLED error with specific variantId', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          valid: false,
          code: 'VARIANT_DISABLED',
          message: 'Seçilen varyant satışa kapalıdır.',
          productId: 'chair-x',
          variantId: 'var-red',
        }),
      })

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('chair-x', 'var-red', 1)
      })

      await act(async () => {
        await result.current.validateCart()
      })

      expect(result.current.validationError?.code).toBe('VARIANT_DISABLED')
      expect(result.current.validationError?.productId).toBe('chair-x')
      expect(result.current.validationError?.variantId).toBe('var-red')
      expect(result.current.items).toHaveLength(1)
    })

    it('handles CART_CURRENCY_MISMATCH error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          valid: false,
          code: 'CART_CURRENCY_MISMATCH',
          message: 'Sepette farklı para birimlerine sahip ürünler bulunamaz.',
        }),
      })

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('prod-try', null, 1)
        await result.current.addItem('prod-eur', null, 1)
      })

      await act(async () => {
        await result.current.validateCart()
      })

      expect(result.current.validationError?.code).toBe('CART_CURRENCY_MISMATCH')
      expect(result.current.validatedCart).toBeNull()
    })
  })

  describe('4. Stale Snapshot & Race Condition Protection', () => {
    it('invalidates validatedCart immediately when cart intent changes (isStale = true)', async () => {
      const mockValidationResult: CartValidationResult = {
        valid: true,
        currency: 'TRY',
        items: [
          {
            productId: 'p1',
            variantId: null,
            productName: 'Product 1',
            sku: 'P1',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
            currency: 'TRY',
            selectedOptions: null,
          },
        ],
        subtotal: 1000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 1000,
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockValidationResult,
      })

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      await act(async () => {
        await result.current.addItem('p1', null, 1)
      })
      await act(async () => {
        await result.current.validateCart()
      })

      expect(result.current.validatedCart).toEqual(mockValidationResult)
      expect(result.current.isStale).toBe(false)

      // When user updates quantity, validatedCart is immediately cleared to prevent stale display
      await act(async () => {
        await result.current.updateQuantity('p1', null, 5)
      })

      expect(result.current.isStale).toBe(true)
      expect(result.current.validatedCart).toBeNull()
    })

    it('prevents out-of-order race conditions from overwriting newer cart state', async () => {
      const firstValidationResult: CartValidationResult = {
        valid: true,
        currency: 'TRY',
        items: [
          {
            productId: 'p1',
            variantId: null,
            productName: 'Product 1',
            sku: 'P1',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
            currency: 'TRY',
            selectedOptions: null,
          },
        ],
        subtotal: 1000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 1000,
      }

      const secondValidationResult: CartValidationResult = {
        valid: true,
        currency: 'TRY',
        items: [
          {
            productId: 'p1',
            variantId: null,
            productName: 'Product 1',
            sku: 'P1',
            quantity: 5,
            unitPrice: 1000,
            totalPrice: 5000,
            currency: 'TRY',
            selectedOptions: null,
          },
        ],
        subtotal: 5000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 5000,
      }

      let requestCount = 0
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        requestCount++
        if (requestCount === 1) {
          // Slow first request (delayed by 80ms)
          await new Promise(r => setTimeout(r, 80))
          return {
            ok: true,
            status: 200,
            json: async () => firstValidationResult,
          }
        }
        // Fast second request (instant)
        return {
          ok: true,
          status: 200,
          json: async () => secondValidationResult,
        }
      })

      const {result} = renderHook(() => useCommerceCart(), {wrapper})

      // Dispatch first request (slow)
      const p1 = result.current.addItem('p1', null, 1).then(() => result.current.validateCart())
      // Dispatch second request immediately (fast)
      const p2 = result.current.addItem('p1', null, 4).then(() => result.current.validateCart())

      await act(async () => {
        await Promise.all([p1, p2])
        // Wait for slow request timeout to finish
        await new Promise(r => setTimeout(r, 100))
      })

      // Second request snapshot (quantity 5, total 5000) must prevail
      expect(result.current.validatedCart).toEqual(secondValidationResult)
      expect(result.current.validatedCart?.grandTotal).toBe(5000)
    })
  })

  describe('5. Existing Quote Cart Regression & Isolation', () => {
    it('ensures CartContext and CommerceCartContext remain 100% isolated', async () => {
      const {result: quoteResult} = renderHook(() => useCart(), {
        wrapper: ({children}: PropsWithChildren) => <CartProvider>{children}</CartProvider>,
      })

      const {result: commerceResult} = renderHook(() => useCommerceCart(), {
        wrapper: ({children}: PropsWithChildren) => (
          <CommerceCartProvider>{children}</CommerceCartProvider>
        ),
      })

      // Add to quote cart
      act(() => {
        quoteResult.current.addToCart({
          id: 'quote-product',
          name: {tr: 'Quote Product', en: 'Quote Product'},
          designerId: 'd1',
          categoryId: 'c1',
          year: 2024,
          description: {tr: 'Description', en: 'Description'},
          mainImage: 'img.jpg',
          buyable: true,
          price: 5000,
          currency: 'TRY',
          materials: [],
          exclusiveContent: {images: [], drawings: [], models3d: []},
        })
      })

      // Add to commerce cart
      await act(async () => {
        await commerceResult.current.addItem('commerce-product', 'var-1', 2)
      })

      // Verify Quote Cart state and storage
      expect(quoteResult.current.cartItems).toHaveLength(1)
      expect(quoteResult.current.cartItems[0]?.product.id).toBe('quote-product')
      expect(quoteResult.current.cartCount).toBe(1)
      const quoteStorage = JSON.parse(localStorage.getItem('birim_cart') || '[]')
      expect(quoteStorage).toHaveLength(1)
      expect(quoteStorage[0].product.id).toBe('quote-product')

      // Verify Commerce Cart state and storage
      expect(commerceResult.current.items).toHaveLength(1)
      expect(commerceResult.current.items[0]?.productId).toBe('commerce-product')
      expect(commerceResult.current.itemCount).toBe(2)
      const commerceStorage = JSON.parse(localStorage.getItem('birim_commerce_cart') || '[]')
      expect(commerceStorage).toHaveLength(1)
      expect(commerceStorage[0].productId).toBe('commerce-product')

      // Verify mutual non-interference
      expect(quoteStorage[0].productId).toBeUndefined()
      expect(commerceStorage[0].product).toBeUndefined()
    })
  })
})
