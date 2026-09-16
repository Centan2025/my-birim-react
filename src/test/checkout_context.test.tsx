import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {renderHook, act} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {CommerceCartProvider, useCommerceCart} from '../context/CommerceCartContext'
import {CheckoutProvider, useCheckout} from '../context/CheckoutContext'
import {CartProvider, useCart} from '../context/CartContext'
import type {CheckoutValidationResult} from '../types/checkout'

const wrapper = ({children}: PropsWithChildren) => (
  <CommerceCartProvider>
    <CheckoutProvider>{children}</CheckoutProvider>
  </CommerceCartProvider>
)

describe('CheckoutContext & Client Checkout State (Phase 4)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('1. Form State Management', () => {
    it('initializes with default individual state and empty addresses', () => {
      const {result} = renderHook(() => useCheckout(), {wrapper})

      expect(result.current.form.customerType).toBe('INDIVIDUAL')
      expect(result.current.form.billingSameAsShipping).toBe(true)
      expect(result.current.form.customer.firstName).toBe('')
      expect(result.current.isValidating).toBe(false)
      expect(result.current.checkoutSummary).toBeNull()
      expect(result.current.validationError).toBeNull()
    })

    it('updates customer info fields', () => {
      const {result} = renderHook(() => useCheckout(), {wrapper})

      act(() => {
        result.current.updateCustomer({
          firstName: 'Mehmet',
          lastName: 'Kaya',
          email: 'mehmet@example.com',
          phone: '+90 532 111 2233',
        })
      })

      expect(result.current.form.customer).toEqual({
        firstName: 'Mehmet',
        lastName: 'Kaya',
        email: 'mehmet@example.com',
        phone: '+90 532 111 2233',
      })
    })

    it('syncs shipping address to billing address when billingSameAsShipping is true', () => {
      const {result} = renderHook(() => useCheckout(), {wrapper})

      act(() => {
        result.current.updateShippingAddress({
          firstName: 'Mehmet',
          lastName: 'Kaya',
          addressLine1: 'İstiklal Cad. No: 45',
          city: 'İstanbul',
          district: 'Beyoğlu',
          postalCode: '34433',
          country: 'TR',
        })
      })

      expect(result.current.form.shippingAddress.addressLine1).toBe('İstiklal Cad. No: 45')
      expect(result.current.form.billingAddress.addressLine1).toBe('İstiklal Cad. No: 45')
      expect(result.current.form.billingAddress.city).toBe('İstanbul')
    })

    it('supports separate billing address when billingSameAsShipping is false', () => {
      const {result} = renderHook(() => useCheckout(), {wrapper})

      act(() => {
        result.current.updateShippingAddress({
          addressLine1: 'Shipping Address 1',
          city: 'İstanbul',
        })
        result.current.setBillingSameAsShipping(false)
        result.current.updateBillingAddress({
          addressLine1: 'Billing Address 2',
          city: 'Ankara',
        })
      })

      expect(result.current.form.shippingAddress.addressLine1).toBe('Shipping Address 1')
      expect(result.current.form.shippingAddress.city).toBe('İstanbul')
      expect(result.current.form.billingAddress.addressLine1).toBe('Billing Address 2')
      expect(result.current.form.billingAddress.city).toBe('Ankara')
    })

    it('manages corporate billing info in CORPORATE mode', () => {
      const {result} = renderHook(() => useCheckout(), {wrapper})

      act(() => {
        result.current.setCustomerType('CORPORATE')
        result.current.updateCorporateBilling({
          companyName: 'Birim A.Ş.',
          taxOffice: 'Mecidiyeköy',
          taxNumber: '9876543210',
        })
      })

      expect(result.current.form.customerType).toBe('CORPORATE')
      expect(result.current.form.corporateBilling).toEqual({
        companyName: 'Birim A.Ş.',
        taxOffice: 'Mecidiyeköy',
        taxNumber: '9876543210',
      })
    })
  })

  describe('2. Server Validation Integration', () => {
    it('returns error when submitting with an empty cart', async () => {
      const {result} = renderHook(() => useCheckout(), {wrapper})

      let submitResult: CheckoutValidationResult | null = null
      await act(async () => {
        submitResult = await result.current.submitCheckoutValidation()
      })

      expect(submitResult).toBeNull()
      expect(result.current.validationError?.code).toBe('EMPTY_CART')
      expect(result.current.checkoutSummary).toBeNull()
    })

    it('submits checkout and receives authoritative summary on success', async () => {
      const mockCheckoutSummary: CheckoutValidationResult = {
        valid: true,
        currency: 'TRY',
        customer: {
          customerType: 'INDIVIDUAL',
        },
        items: [
          {
            productId: 'kilit-sehpa',
            variantId: null,
            productName: 'Kilit Sehpa',
            sku: 'KLT-01',
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000,
            currency: 'TRY',
            selectedOptions: null,
          },
        ],
        subtotal: 15000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 15000,
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCheckoutSummary,
      })

      const combined = ({children}: PropsWithChildren) => (
        <CommerceCartProvider>
          <CheckoutProvider>{children}</CheckoutProvider>
        </CommerceCartProvider>
      )

      const {result} = renderHook(
        () => ({
          cart: useCommerceCart(),
          checkout: useCheckout(),
        }),
        {wrapper: combined}
      )

      // Add item to commerce cart
      await act(async () => {
        await result.current.cart.addItem('kilit-sehpa', null, 1)
      })

      // Fill valid customer form
      act(() => {
        result.current.checkout.updateCustomer({
          firstName: 'Ali',
          lastName: 'Veli',
          email: 'ali@example.com',
          phone: '+90 555 999 8877',
        })
        result.current.checkout.updateShippingAddress({
          firstName: 'Ali',
          lastName: 'Veli',
          addressLine1: 'Bağdat Cad. No: 10',
          city: 'İstanbul',
          district: 'Kadıköy',
          postalCode: '34710',
          country: 'TR',
        })
      })

      let res: CheckoutValidationResult | null = null
      await act(async () => {
        res = await result.current.checkout.submitCheckoutValidation()
      })

      expect(res).toEqual(mockCheckoutSummary)
      expect(result.current.checkout.checkoutSummary).toEqual(mockCheckoutSummary)
      expect(result.current.checkout.validationError).toBeNull()
    })
  })

  describe('3. PII Security (Memory-Only Assertion)', () => {
    it('ensures zero customer PII or address data is ever written to localStorage', async () => {
      const {result} = renderHook(() => useCheckout(), {wrapper})

      act(() => {
        result.current.updateCustomer({
          firstName: 'Gizli',
          lastName: 'Müşteri',
          email: 'gizli@gizlifirma.com',
          phone: '+90 500 000 0000',
        })
        result.current.updateShippingAddress({
          addressLine1: 'Gizli Mahalle No: 99',
          city: 'İstanbul',
        })
      })

      const localKeys = Object.keys(localStorage)
      for (const key of localKeys) {
        const val = localStorage.getItem(key) || ''
        expect(val).not.toContain('Gizli')
        expect(val).not.toContain('gizli@gizlifirma.com')
        expect(val).not.toContain('500 000 0000')
        expect(val).not.toContain('Gizli Mahalle')
      }
    })
  })

  describe('4. Quote Cart Non-Interference', () => {
    it('verifies CartContext and birim_cart are completely unaffected by checkout state', () => {
      const fullWrapper = ({children}: PropsWithChildren) => (
        <CartProvider>
          <CommerceCartProvider>
            <CheckoutProvider>{children}</CheckoutProvider>
          </CommerceCartProvider>
        </CartProvider>
      )

      const {result} = renderHook(
        () => ({
          quoteCart: useCart(),
          checkout: useCheckout(),
        }),
        {wrapper: fullWrapper}
      )

      act(() => {
        result.current.quoteCart.addToCart({
          id: 'quote-prod-1',
          name: {tr: 'Teklif Ürünü', en: 'Quote Product'},
          designerId: 'd1',
          categoryId: 'c1',
          year: 2024,
          description: {tr: 'Açıklama', en: 'Description'},
          mainImage: 'img.jpg',
          buyable: true,
          price: 10000,
          currency: 'TRY',
          materials: [],
          exclusiveContent: {images: [], drawings: [], models3d: []},
        })
        result.current.checkout.updateCustomer({
          firstName: 'Test',
          lastName: 'User',
        })
      })

      expect(result.current.quoteCart.cartItems).toHaveLength(1)
      expect(result.current.quoteCart.cartItems[0]?.product.id).toBe('quote-prod-1')
      const rawQuote = localStorage.getItem('birim_cart') || ''
      expect(rawQuote).toContain('quote-prod-1')
      expect(rawQuote).not.toContain('Test')
    })
  })

  describe('5. Payment State Machine & Cart Preservation (Phase 6A.1)', () => {
    it('preserves cart on order creation and clears cart ONLY upon confirmed payment SUCCESS', async () => {
      const {result} = renderHook(
        () => ({
          cart: useCommerceCart(),
          checkout: useCheckout(),
        }),
        {wrapper}
      )

      // Add item to commerce cart
      act(() => {
        result.current.cart.addItem({
          productId: 'prod-chair',
          quantity: 1,
        })
      })

      expect(result.current.cart.items).toHaveLength(1)

      // Mock create order
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
        async () =>
          ({
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              order: {
                id: 'ord_test_999',
                orderNumber: 'BRM-20260916-TEST01',
                status: 'PENDING_PAYMENT',
                paymentStatus: 'PENDING',
                currency: 'TRY',
                subtotal: 15000,
                discountTotal: 0,
                shippingTotal: 0,
                taxTotal: 0,
                grandTotal: 15000,
                itemsCount: 1,
                createdAt: new Date().toISOString(),
                guestToken: 'mock_token_abc',
              },
            }),
          }) as Response
      )

      await act(async () => {
        await result.current.checkout.createOrder()
      })

      // Cart MUST still be intact after order creation!
      expect(result.current.cart.items).toHaveLength(1)
      expect(result.current.checkout.createdOrder?.id).toBe('ord_test_999')
      expect(result.current.checkout.currentStep).toBe('PAYMENT')

      // Mock payment initiation
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
        async () =>
          ({
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              payment: {
                id: 'tx_pay_123',
                orderId: 'ord_test_999',
                orderNumber: 'BRM-20260916-TEST01',
                provider: 'mock',
                amount: 15000,
                amountMinor: 1500000,
                currency: 'TRY',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
              },
            }),
          }) as Response
      )

      // Mock payment failure simulation
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              status: 'FAILED',
              orderId: 'ord_test_999',
              message: 'Payment failed simulation',
            }),
          }) as Response
      )

      await act(async () => {
        await result.current.checkout.simulateMockPayment('FAILED')
      })

      // Cart MUST STILL be preserved on failure!
      expect(result.current.cart.items).toHaveLength(1)
      expect(result.current.checkout.paymentState).toBe('FAILED')

      // Mock payment success simulation
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              status: 'PAID',
              orderId: 'ord_test_999',
              message: 'Payment success simulation',
            }),
          }) as Response
      )

      await act(async () => {
        await result.current.checkout.simulateMockPayment('SUCCESS')
      })

      // NOW and only now: cart is cleared upon confirmed SUCCESS!
      expect(result.current.cart.items).toHaveLength(0)
      expect(result.current.checkout.paymentState).toBe('SUCCESS')
      expect(result.current.checkout.currentStep).toBe('RESULT')
    })
  })
})
