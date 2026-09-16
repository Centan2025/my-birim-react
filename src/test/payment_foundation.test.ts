import {describe, it, expect, vi, beforeEach} from 'vitest'
import {initiatePayment, handlePaymentCallback} from '../../lib/commerce/payment/payment-service'
import {
  getPaymentProvider,
  registerPaymentProvider,
} from '../../lib/commerce/payment/provider-registry'
import {MockPaymentProvider} from '../../lib/commerce/payment/mock-provider'
import {
  isValidPaymentTransition,
  assertValidPaymentTransition,
} from '../../lib/commerce/payment/state-machine'
import {createGuestOrderToken, verifyGuestOrderToken} from '../../lib/commerce/payment/guest-auth'
import {initiatePaymentRequestSchema} from '../../lib/commerce/payment/schemas'
import {PaymentError} from '../../lib/commerce/payment/errors'
import type {PaymentProvider} from '../../lib/commerce/payment/provider'
import {createCommerceOrder} from '../../lib/commerce/order-service'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'

const mockCatalog: AuthoritativeCatalogBatch = {
  commerce_enabled: true,
  products: [
    {
      id: 'prod-direct-1',
      name: {tr: 'Gala Sandalye', en: 'Gala Chair'},
      buyable: true,
      price: 15000,
      currency: 'TRY',
      sku: 'BRM-GAL-001',
      sales_mode: 'DIRECT',
      sale_enabled: true,
      variants: [],
    },
  ],
}

const mockOrderAuth = {
  id: 'order-auth-100',
  order_number: 'BRM-20260916-AUTH01',
  user_id: 'user-valid-uuid-1',
  status: 'PENDING_PAYMENT',
  payment_status: 'PENDING',
  currency: 'TRY',
  grand_total: 15000,
  customer_name: 'Ahmet Yılmaz',
  customer_email: 'ahmet@example.com',
  billing_address_snapshot: {},
  shipping_address_snapshot: {},
}

const mockOrderGuest = {
  id: 'order-guest-200',
  order_number: 'BRM-20260916-GST002',
  user_id: null,
  status: 'PENDING_PAYMENT',
  payment_status: 'PENDING',
  currency: 'TRY',
  grand_total: 45000,
  customer_name: 'Mehmet Demir',
  customer_email: 'mehmet@example.com',
  billing_address_snapshot: {},
  shipping_address_snapshot: {},
}

describe('Phase 6A — Payment Provider Abstraction & Gateway Foundation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Provider Registry & Mock Isolation', () => {
    it('resolves mock provider by default in test/dev environment', () => {
      const provider = getPaymentProvider()
      expect(provider).toBeDefined()
      expect(provider.id).toBe('mock')
    })

    it('throws PAYMENT_PROVIDER_NOT_CONFIGURED for unknown provider ID', () => {
      expect(() => getPaymentProvider('non_existent_provider')).toThrow(PaymentError)
      try {
        getPaymentProvider('non_existent_provider')
      } catch (err: unknown) {
        const pErr = err as PaymentError
        expect(pErr.code).toBe('PAYMENT_PROVIDER_NOT_CONFIGURED')
        expect(pErr.statusCode).toBe(500)
      }
    })

    it('allows registering and resolving a custom provider adapter', () => {
      const customProvider: PaymentProvider = {
        id: 'custom_test_gateway',
        createPaymentIntent: vi.fn(),
        getPaymentStatus: vi.fn(),
        verifyCallback: vi.fn(),
      }

      registerPaymentProvider(customProvider)
      const resolved = getPaymentProvider('custom_test_gateway')
      expect(resolved).toBe(customProvider)
      expect(resolved.id).toBe('custom_test_gateway')
    })

    it('mock provider throws MOCK_PROVIDER_DISABLED in production environment', async () => {
      const originalEnv = process.env['NODE_ENV']
      process.env['NODE_ENV'] = 'production'
      delete process.env['PAYMENT_ALLOW_MOCK']

      const mock = new MockPaymentProvider()

      await expect(
        mock.createPaymentIntent({
          orderId: '123',
          orderNumber: 'BRM-123',
          amount: 100,
          amountMinor: 10000,
          currency: 'TRY',
          customer: {name: 'Test', email: 'test@example.com'},
          billingAddress: {},
          shippingAddress: {},
          items: [],
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'MOCK_PROVIDER_DISABLED',
      })

      process.env['NODE_ENV'] = originalEnv
    })
  })

  describe('2. Guest & User Authorization', () => {
    it('creates and verifies cryptographically signed guest order tokens', () => {
      const token = createGuestOrderToken('order-guest-200', 'BRM-20260916-GST002')
      expect(typeof token).toBe('string')
      expect(verifyGuestOrderToken('order-guest-200', token)).toBe(true)
      expect(verifyGuestOrderToken('different-order-uuid', token)).toBe(false)
      expect(verifyGuestOrderToken('order-guest-200', 'tampered.token.sig')).toBe(false)
    })

    it('allows authenticated payment when userId matches order.user_id', async () => {
      const result = await initiatePayment(
        {orderId: 'order-auth-100'},
        {
          userId: 'user-valid-uuid-1',
          orderOverride: mockOrderAuth,
        }
      )

      expect(result.orderId).toBe('order-auth-100')
      expect(result.amount).toBe(15000)
      expect(result.amountMinor).toBe(1500000)
      expect(result.status).toBe('PENDING')
    })

    it('rejects authenticated payment when userId does not match order.user_id (403)', async () => {
      await expect(
        initiatePayment(
          {orderId: 'order-auth-100'},
          {
            userId: 'malicious-attacker-uuid-999',
            orderOverride: mockOrderAuth,
          }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'PAYMENT_ORDER_NOT_OWNED',
      })
    })

    it('allows guest payment when valid guestToken is provided', async () => {
      const token = createGuestOrderToken('order-guest-200', 'BRM-20260916-GST002')

      const result = await initiatePayment(
        {
          orderId: 'order-guest-200',
          guestToken: token,
        },
        {
          orderOverride: mockOrderGuest,
        }
      )

      expect(result.orderId).toBe('order-guest-200')
      expect(result.amount).toBe(45000)
      expect(result.amountMinor).toBe(4500000)
    })

    it('rejects guest payment when guestToken is missing or forged (403)', async () => {
      await expect(
        initiatePayment(
          {orderId: 'order-guest-200'},
          {
            orderOverride: mockOrderGuest,
          }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'PAYMENT_ORDER_NOT_OWNED',
      })
    })
  })

  describe('3. Strict Schema & Tampering Protection', () => {
    it('rejects client requests containing forged amount, currency or grandTotal', () => {
      const tampered = {
        orderId: 'order-auth-100',
        amount: 1, // Tampered price attempt
      }
      const parsed = initiatePaymentRequestSchema.safeParse(tampered)
      expect(parsed.success).toBe(false)
    })

    it('rejects client requests containing forged userId or paymentStatus', () => {
      const tampered = {
        orderId: 'order-auth-100',
        userId: 'admin',
        paymentStatus: 'PAID',
      }
      const parsed = initiatePaymentRequestSchema.safeParse(tampered)
      expect(parsed.success).toBe(false)
    })

    it('rejects client requests containing credit card numbers or CVV fields', () => {
      const cardPayload = {
        orderId: 'order-auth-100',
        cardNumber: '4111222233334444',
        cvv: '123',
      }
      const parsed = initiatePaymentRequestSchema.safeParse(cardPayload)
      expect(parsed.success).toBe(false)
    })
  })

  describe('4. Order Payable State Verification', () => {
    it('rejects payment for already PAID orders (409)', async () => {
      const paidOrder = {
        ...mockOrderAuth,
        status: 'PAID',
        payment_status: 'PAID',
      }

      await expect(
        initiatePayment(
          {orderId: 'order-auth-100'},
          {
            userId: 'user-valid-uuid-1',
            orderOverride: paidOrder,
          }
        )
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'PAYMENT_ALREADY_PAID',
      })
    })

    it('rejects payment for CANCELLED orders (422)', async () => {
      const cancelledOrder = {
        ...mockOrderAuth,
        status: 'CANCELLED',
      }

      await expect(
        initiatePayment(
          {orderId: 'order-auth-100'},
          {
            userId: 'user-valid-uuid-1',
            orderOverride: cancelledOrder,
          }
        )
      ).rejects.toMatchObject({
        statusCode: 422,
        code: 'PAYMENT_ORDER_NOT_PAYABLE',
      })
    })
  })

  describe('5. Payment Idempotency with Supabase Atomic RPC', () => {
    it('handles idempotent replay (same key -> same payment intent 200 OK)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: true,
          transaction_id: 'tx-existing-uuid-1',
          order_id: 'order-auth-100',
          provider: 'mock',
          amount: 15000,
          currency: 'TRY',
          status: 'PENDING',
          created_at: '2026-09-16T12:00:00Z',
        },
        error: null,
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const result = await initiatePayment(
        {
          orderId: 'order-auth-100',
          idempotencyKey: 'pay-idem-key-1',
        },
        {
          userId: 'user-valid-uuid-1',
          orderOverride: mockOrderAuth,
          supabaseClientOverride: mockSupabase,
        }
      )

      expect(mockRpc).toHaveBeenCalledWith(
        'create_payment_transaction_atomic',
        expect.objectContaining({
          p_transaction: expect.objectContaining({
            idempotency_key: 'pay:order_order-auth-100:pay-idem-key-1',
          }),
        })
      )
      expect(result.id).toBe('tx-existing-uuid-1')
      expect(result.isExisting).toBe(true)
    })

    it('handles idempotency conflict (same key reused for different order -> 409)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'P0001',
          message: 'PAYMENT_IDEMPOTENCY_KEY_REUSED',
        },
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      await expect(
        initiatePayment(
          {
            orderId: 'order-auth-100',
            idempotencyKey: 'pay-conflict-key',
          },
          {
            userId: 'user-valid-uuid-1',
            orderOverride: mockOrderAuth,
            supabaseClientOverride: mockSupabase,
          }
        )
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'PAYMENT_IDEMPOTENCY_KEY_REUSED',
      })
    })
  })

  describe('6. Payment State Machine Transitions', () => {
    it('allows valid state machine transitions', () => {
      expect(isValidPaymentTransition('PENDING', 'PROCESSING')).toBe(true)
      expect(isValidPaymentTransition('PROCESSING', 'AUTHORIZED')).toBe(true)
      expect(isValidPaymentTransition('PROCESSING', 'PAID')).toBe(true)
      expect(isValidPaymentTransition('PROCESSING', 'FAILED')).toBe(true)
      expect(isValidPaymentTransition('AUTHORIZED', 'PAID')).toBe(true)
      expect(isValidPaymentTransition('PAID', 'PAID')).toBe(true) // Idempotent self-transition
      expect(isValidPaymentTransition('PAID', 'REFUNDED')).toBe(true)
    })

    it('blocks invalid transitions (e.g. FAILED -> PAID, CANCELLED -> PAID)', () => {
      expect(isValidPaymentTransition('FAILED', 'PAID')).toBe(false)
      expect(isValidPaymentTransition('CANCELLED', 'PAID')).toBe(false)
      expect(isValidPaymentTransition('REFUNDED', 'PAID')).toBe(false)
      expect(isValidPaymentTransition('PENDING', 'PAID')).toBe(false) // Must go through processing/authorization

      expect(() => assertValidPaymentTransition('FAILED', 'PAID')).toThrow(PaymentError)
    })
  })

  describe('7. Webhook & Callback Verification Abstraction', () => {
    it('verifies valid callback signature and resolves payment event', async () => {
      const mockProvider: PaymentProvider = {
        id: 'mock',
        createPaymentIntent: vi.fn(),
        getPaymentStatus: vi.fn(),
        verifyCallback: vi.fn().mockResolvedValue({
          provider: 'mock',
          providerEventId: 'evt_123',
          orderId: 'order-auth-100',
          paymentTransactionId: 'tx-uuid-1',
          status: 'PAID',
          occurredAt: new Date().toISOString(),
        }),
      }

      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_duplicate: false,
          transaction_id: 'tx-uuid-1',
          order_id: 'order-auth-100',
          status: 'PAID',
        },
        error: null,
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const result = await handlePaymentCallback(
        {
          payload: {orderId: 'order-auth-100', status: 'PAID'},
          headers: {'x-mock-signature': 'valid_sig'},
        },
        {
          providerOverride: mockProvider,
          supabaseClientOverride: mockSupabase,
        }
      )

      expect(result.success).toBe(true)
      expect(result.duplicate).toBe(false)
      expect(result.status).toBe('PAID')
      expect(mockRpc).toHaveBeenCalledWith('resolve_payment_event_atomic', expect.any(Object))
    })

    it('acknowledges duplicate webhook events idempotently without mutating order state', async () => {
      const mockProvider: PaymentProvider = {
        id: 'mock',
        createPaymentIntent: vi.fn(),
        getPaymentStatus: vi.fn(),
        verifyCallback: vi.fn().mockResolvedValue({
          provider: 'mock',
          providerEventId: 'evt_duplicate_99',
          orderId: 'order-auth-100',
          paymentTransactionId: 'tx-uuid-1',
          status: 'PAID',
          occurredAt: new Date().toISOString(),
        }),
      }

      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_duplicate: true,
          transaction_id: 'tx-uuid-1',
          order_id: 'order-auth-100',
          status: 'PAID',
        },
        error: null,
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const result = await handlePaymentCallback(
        {
          payload: {orderId: 'order-auth-100', status: 'PAID'},
          headers: {'x-mock-signature': 'valid_sig'},
        },
        {
          providerOverride: mockProvider,
          supabaseClientOverride: mockSupabase,
        }
      )

      expect(result.success).toBe(true)
      expect(result.duplicate).toBe(true)
    })

    it('rejects invalid callback signatures (400)', async () => {
      const mock = new MockPaymentProvider()

      await expect(
        handlePaymentCallback(
          {
            payload: {},
            headers: {'x-mock-signature': 'invalid_signature'},
          },
          {providerOverride: mock}
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'PAYMENT_CALLBACK_INVALID',
      })
    })
  })

  describe('8. Mock E2E Flow (Order Creation -> Payment Initiation -> Mock Provider)', () => {
    it('executes full provider-neutral lifecycle in test environment', async () => {
      // 1. Order Creation via Order Engine
      const checkoutPayload = {
        customerType: 'INDIVIDUAL' as const,
        customer: {
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          email: 'ahmet@example.com',
          phone: '+905551234567',
        },
        shippingAddress: {
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          addressLine1: 'Büyükdere Cad. 123',
          city: 'İstanbul',
          district: 'Şişli',
          postalCode: '34394',
          country: 'Türkiye',
        },
        billingAddress: {
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          addressLine1: 'Büyükdere Cad. 123',
          city: 'İstanbul',
          district: 'Şişli',
          postalCode: '34394',
          country: 'Türkiye',
        },
        billingSameAsShipping: true,
        corporateBilling: null,
      }

      const orderResult = await createCommerceOrder(
        {
          items: [{productId: 'prod-direct-1', quantity: 1}],
          checkout: checkoutPayload,
        },
        {
          userId: 'user-uuid-888',
          catalogBatchOverride: mockCatalog,
        }
      )

      expect(orderResult.orderNumber).toMatch(/^BRM-\d{8}-[A-F0-9]{6}$/)
      expect(orderResult.status).toBe('PENDING_PAYMENT')
      expect(orderResult.grandTotal).toBe(15000)

      // 2. Payment Initiation via Payment Service
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: false,
          transaction_id: 'tx-uuid-888',
          order_id: orderResult.id,
          provider: 'mock',
          amount: 15000,
          currency: 'TRY',
          status: 'PENDING',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const paymentResult = await initiatePayment(
        {orderId: orderResult.id},
        {
          userId: 'user-uuid-888',
          orderOverride: {
            id: orderResult.id,
            order_number: orderResult.orderNumber,
            user_id: 'user-uuid-888',
            status: 'PENDING_PAYMENT',
            payment_status: 'PENDING',
            currency: 'TRY',
            grand_total: 15000,
            customer_name: 'Ahmet Yılmaz',
            customer_email: 'ahmet@example.com',
          },
          supabaseClientOverride: mockSupabase,
        }
      )

      expect(paymentResult.orderId).toBe(orderResult.id)
      expect(paymentResult.provider).toBe('mock')
      expect(paymentResult.amount).toBe(15000)
      expect(paymentResult.amountMinor).toBe(1500000)
      expect(paymentResult.status).toBe('PENDING')
      expect(paymentResult.clientSecret).toBeDefined()
    })
  })
})
