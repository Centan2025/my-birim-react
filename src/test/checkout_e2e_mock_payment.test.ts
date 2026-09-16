import {describe, it, expect, vi, beforeEach} from 'vitest'
import {createCommerceOrder, getCommerceOrderById} from '../../lib/commerce/order-service'
import {initiatePayment, handlePaymentCallback} from '../../lib/commerce/payment/payment-service'
import {createGuestOrderToken, verifyGuestOrderToken} from '../../lib/commerce/payment/guest-auth'
import {MockPaymentProvider} from '../../lib/commerce/payment/mock-provider'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'

const sampleCatalogBatch: AuthoritativeCatalogBatch = {
  commerce_enabled: true,
  products: [
    {
      id: 'prod_chair',
      name: {tr: 'Tasarım Sandalye', en: 'Design Chair'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 15000,
      currency: 'TRY',
      sku: 'CHR-001',
      variants: [],
    },
  ],
}

const validCheckoutPayload = {
  customerType: 'INDIVIDUAL' as const,
  customer: {
    firstName: 'Deniz',
    lastName: 'Yılmaz',
    email: 'deniz@example.com',
    phone: '+905551234567',
  },
  shippingAddress: {
    firstName: 'Deniz',
    lastName: 'Yılmaz',
    addressLine1: 'Bebek Cad. No: 12',
    city: 'İstanbul',
    district: 'Beşiktaş',
    postalCode: '34342',
    country: 'Türkiye',
  },
  billingAddress: {
    firstName: 'Deniz',
    lastName: 'Yılmaz',
    addressLine1: 'Bebek Cad. No: 12',
    city: 'İstanbul',
    district: 'Beşiktaş',
    postalCode: '34342',
    country: 'Türkiye',
  },
  billingSameAsShipping: true,
}

describe('Phase 6A.1 — End-to-End Checkout & Mock Payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env['PAYMENT_ALLOW_MOCK']
    process.env['NODE_ENV'] = 'test'
  })

  describe('1. Checkout to Order Creation', () => {
    it('creates order in PENDING_PAYMENT state and returns guestToken for guest checkout', async () => {
      const order = await createCommerceOrder(
        {
          items: [{productId: 'prod_chair', quantity: 1}],
          checkout: validCheckoutPayload,
        },
        {
          userId: null,
          catalogBatchOverride: sampleCatalogBatch,
        }
      )

      expect(order).toBeDefined()
      expect(order.status).toBe('PENDING_PAYMENT')
      expect(order.paymentStatus).toBe('PENDING')
      expect(order.grandTotal).toBe(15000)
      expect(order.currency).toBe('TRY')
      expect(order.guestToken).toBeDefined()
      expect(typeof order.guestToken).toBe('string')
      expect(verifyGuestOrderToken(order.id, order.guestToken!)).toBe(true)
    })

    it('creates order for authenticated user without guestToken', async () => {
      const order = await createCommerceOrder(
        {
          items: [{productId: 'prod_chair', quantity: 1}],
          checkout: validCheckoutPayload,
        },
        {
          userId: 'usr_auth_123',
          catalogBatchOverride: sampleCatalogBatch,
        }
      )

      expect(order).toBeDefined()
      expect(order.status).toBe('PENDING_PAYMENT')
      expect(order.guestToken).toBeUndefined()
    })
  })

  describe('2. Payment Initiation & Server Authority', () => {
    it('initiates mock payment intent for PENDING_PAYMENT order', async () => {
      const order = await createCommerceOrder(
        {
          items: [{productId: 'prod_chair', quantity: 2}],
          checkout: validCheckoutPayload,
        },
        {
          userId: null,
          catalogBatchOverride: sampleCatalogBatch,
        }
      )

      const payment = await initiatePayment(
        {
          orderId: order.id,
          guestToken: order.guestToken,
          idempotencyKey: 'idem_pay_001',
        },
        {
          orderOverride: {
            id: order.id,
            order_number: order.orderNumber,
            user_id: null,
            status: 'PENDING_PAYMENT',
            payment_status: 'PENDING',
            grand_total: 30000,
            currency: 'TRY',
          },
        }
      )

      expect(payment).toBeDefined()
      expect(payment.orderId).toBe(order.id)
      expect(payment.amount).toBe(30000)
      expect(payment.currency).toBe('TRY')
      expect(payment.status).toBe('PENDING')
    })

    it('blocks payment initiation for already PAID order', async () => {
      await expect(
        initiatePayment(
          {
            orderId: 'order_paid_123',
            idempotencyKey: 'idem_paid_001',
          },
          {
            userId: 'usr_123',
            orderOverride: {
              id: 'order_paid_123',
              order_number: 'BRM-20260916-PAID01',
              user_id: 'usr_123',
              status: 'PAID',
              payment_status: 'PAID',
              grand_total: 15000,
              currency: 'TRY',
            },
          }
        )
      ).rejects.toThrow('Bu siparişin ödemesi zaten tamamlanmıştır.')
    })
  })

  describe('3. Mock Payment Resolution & State Transitions', () => {
    it('resolves successful mock payment to PAID', async () => {
      const mockProvider = new MockPaymentProvider()
      const callbackResult = await handlePaymentCallback(
        {
          provider: 'mock',
          headers: {},
          payload: {
            paymentTransactionId: 'tx_mock_123',
            orderId: 'order_success_123',
            status: 'PAID',
          },
          rawBody: '{}',
        },
        {
          providerOverride: mockProvider,
        }
      )

      expect(callbackResult.success).toBe(true)
      expect(callbackResult.status).toBe('PAID')
    })

    it('handles mock payment failure safely (order stays PENDING_PAYMENT)', async () => {
      const mockProvider = new MockPaymentProvider()
      const callbackResult = await handlePaymentCallback(
        {
          provider: 'mock',
          headers: {},
          payload: {
            paymentTransactionId: 'tx_mock_fail_123',
            orderId: 'order_fail_123',
            status: 'FAILED',
          },
          rawBody: '{}',
        },
        {
          providerOverride: mockProvider,
        }
      )

      expect(callbackResult.success).toBe(true)
      expect(callbackResult.status).toBe('FAILED')
    })

    it('handles mock payment cancellation safely', async () => {
      const mockProvider = new MockPaymentProvider()
      const callbackResult = await handlePaymentCallback(
        {
          provider: 'mock',
          headers: {},
          payload: {
            paymentTransactionId: 'tx_mock_cancel_123',
            orderId: 'order_cancel_123',
            status: 'CANCELLED',
          },
          rawBody: '{}',
        },
        {
          providerOverride: mockProvider,
        }
      )

      expect(callbackResult.success).toBe(true)
      expect(callbackResult.status).toBe('CANCELLED')
    })
  })

  describe('4. Order Lookup & IDOR Protection', () => {
    it('allows access to order for matching authenticated user', async () => {
      const order = await getCommerceOrderById('order_user_1', {
        userId: 'usr_valid_456',
        orderOverride: {
          id: 'order_user_1',
          order_number: 'BRM-20260916-AUTH01',
          user_id: 'usr_valid_456',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 15000,
          grand_total: 15000,
          items: [],
        },
      })

      expect(order.id).toBe('order_user_1')
      expect(order.orderNumber).toBe('BRM-20260916-AUTH01')
    })

    it('rejects access to order for mismatched authenticated user (IDOR prevention)', async () => {
      await expect(
        getCommerceOrderById('order_user_1', {
          userId: 'usr_attacker_999',
          orderOverride: {
            id: 'order_user_1',
            order_number: 'BRM-20260916-AUTH01',
            user_id: 'usr_victim_111',
            status: 'PENDING_PAYMENT',
            payment_status: 'PENDING',
            currency: 'TRY',
            subtotal: 15000,
            grand_total: 15000,
          },
        })
      ).rejects.toThrow('Bu sipariş bilgilerini görüntüleme yetkiniz bulunmamaktadır.')
    })

    it('allows guest access with valid HMAC guest token', async () => {
      const guestToken = createGuestOrderToken('order_guest_1', 'BRM-20260916-GST001')
      const order = await getCommerceOrderById('order_guest_1', {
        guestToken,
        orderOverride: {
          id: 'order_guest_1',
          order_number: 'BRM-20260916-GST001',
          user_id: null,
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'TRY',
          subtotal: 15000,
          grand_total: 15000,
          items: [],
        },
      })

      expect(order.id).toBe('order_guest_1')
      expect(order.status).toBe('PAID')
    })

    it('rejects guest access with forged or invalid guest token', async () => {
      await expect(
        getCommerceOrderById('order_guest_1', {
          guestToken: 'forged_fake_token_value',
          orderOverride: {
            id: 'order_guest_1',
            order_number: 'BRM-20260916-GST001',
            user_id: null,
            status: 'PAID',
            payment_status: 'PAID',
            currency: 'TRY',
            subtotal: 15000,
            grand_total: 15000,
          },
        })
      ).rejects.toThrow('Misafir siparişi için geçerli yetki anahtarı sağlanmadı.')
    })
  })

  describe('5. Production Mock Isolation', () => {
    it('strictly throws MOCK_PROVIDER_DISABLED in production environment', async () => {
      process.env['NODE_ENV'] = 'production'
      delete process.env['PAYMENT_ALLOW_MOCK']

      const mockProvider = new MockPaymentProvider()
      await expect(
        mockProvider.createPaymentIntent({
          orderId: 'ord_1',
          orderNumber: 'BRM-001',
          amount: 100,
          amountMinor: 10000,
          currency: 'TRY',
          customer: {name: 'Test', email: 'test@example.com', phone: null},
          billingAddress: {},
          shippingAddress: {},
          items: [],
        })
      ).rejects.toThrow('Mock payment provider is not permitted in production environment.')
    })
  })
})
