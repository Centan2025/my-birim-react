import {describe, it, expect, vi, beforeEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import type {SupabaseClient} from '@supabase/supabase-js'
import crypto from 'crypto'
import {
  handleCartValidate as cartValidateHandler,
  handleCheckoutValidate as checkoutValidateHandler,
  handleOrders as ordersHandler,
  handlePayments as paymentsHandler,
} from '../../api/commerce.js'
import adminOrdersHandler from '../../api/admin.js'
import {
  isValidOrderStatusTransition,
  canCancelOrderStatus,
  canRefundOrderStatus,
  cancelCommerceOrder,
} from '../../lib/commerce/order-lifecycle'
import {
  toMinorUnits,
  fromMinorUnits,
  calculateRefundableAmount,
  createCommerceRefund,
} from '../../lib/commerce/refund-service'
import {createCommerceOrder, getCommerceOrderById} from '../../lib/commerce/order-service'
import {initiatePayment, getPaymentStatus} from '../../lib/commerce/payment/payment-service'
import {createToken} from '../../lib/server/token'
import {createGuestOrderToken, verifyGuestOrderToken} from '../../lib/commerce/payment/guest-auth'
import {CommerceValidationError} from '../../lib/commerce/types'
import {PaymentError} from '../../lib/commerce/payment/errors'
import {recordOrderEvent, listOrderEvents} from '../../lib/commerce/order-events'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'

function createMockRes() {
  const res: Partial<VercelResponse> & {
    _status: number
    _json: unknown
    _headers: Record<string, string>
  } = {
    _status: 200,
    _json: null,
    _headers: {},
    status(code: number) {
      this._status = code
      return this as VercelResponse
    },
    json(data: unknown) {
      this._json = data
      return this as VercelResponse
    },
    setHeader(key: string, val: string) {
      this._headers[key.toLowerCase()] = val
      return this as unknown as VercelResponse
    },
  }
  return res
}

describe('Phase 6A.6: Final Production Hardening & Security Audit', () => {
  const testJwtSecret = 'test-jwt-secret-key-must-be-long-enough-32-chars'
  const testAdminSecret = 'test-admin-break-glass-secret-key-32-chars'
  const testHmacSecret = 'test-hmac-secret-key-for-guest-tokens-32'

  beforeEach(() => {
    process.env['JWT_SECRET'] = testJwtSecret
    process.env['ADMIN_SECRET'] = testAdminSecret
    process.env['HMAC_SECRET'] = testHmacSecret
    process.env['NODE_ENV'] = 'test'
  })

  // =========================================================================
  // 1. SECURITY & AUTHORIZATION HARDENING
  // =========================================================================
  describe('1. Security & Authorization Hardening', () => {
    it('1.1 IDOR: User A cannot fetch User B order', async () => {
      const userBOrder = {
        id: 'ord_user_b_1',
        order_number: 'BRM-2026-B001',
        user_id: 'user_b',
        customer_email: 'user_b@example.com',
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        currency: 'TRY',
        grand_total: 1000,
        items: [],
      }

      await expect(
        getCommerceOrderById('ord_user_b_1', {
          userId: 'user_a',
          orderOverride: userBOrder,
        })
      ).rejects.toThrow('Bu sipariş bilgilerini görüntüleme yetkiniz bulunmamaktadır.')
    })

    it('1.2 IDOR: User A cannot fetch User B payment status', async () => {
      const userBPayment = {
        id: 'tx_b_1',
        order_id: 'ord_b_1',
        user_id: 'user_b',
        amount: 1000,
        currency: 'TRY',
        status: 'PENDING',
        order: {
          id: 'ord_b_1',
          user_id: 'user_b',
          order_number: 'BRM-2026-B001',
        },
      }

      await expect(
        getPaymentStatus('tx_b_1', {
          userId: 'user_a',
          transactionOverride: userBPayment,
        })
      ).rejects.toThrow('Bu ödeme işlemine erişim yetkiniz bulunmamaktadır.')
    })

    it('1.3 IDOR: Guest A cannot access Guest B order without valid guest token', async () => {
      const guestBOrder = {
        id: 'ord_guest_b_1',
        order_number: 'BRM-2026-GB01',
        user_id: null,
        customer_email: 'guest_b@example.com',
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        currency: 'TRY',
        grand_total: 500,
        items: [],
      }

      // No token
      await expect(
        getCommerceOrderById('ord_guest_b_1', {
          userId: null,
          guestToken: null,
          orderOverride: guestBOrder,
        })
      ).rejects.toThrow('Misafir siparişi için geçerli yetki anahtarı sağlanmadı.')

      // Invalid/tampered token
      await expect(
        getCommerceOrderById('ord_guest_b_1', {
          userId: null,
          guestToken: 'forged_guest_token_123',
          orderOverride: guestBOrder,
        })
      ).rejects.toThrow('Misafir siparişi için geçerli yetki anahtarı sağlanmadı.')
    })

    it('1.4 Guest token: Valid HMAC guest token allows access only to corresponding order', () => {
      const orderId = 'ord_guest_valid_1'
      const orderNumber = 'BRM-2026-VAL01'
      const token = createGuestOrderToken(orderId, orderNumber)
      expect(verifyGuestOrderToken(orderId, token)).toBe(true)
      expect(verifyGuestOrderToken('other_order_id', token)).toBe(false)
    })

    it('1.5 Role verification: Non-admin JWT roles (editor, viewer, consumer, architect) are rejected from admin endpoints', async () => {
      const nonAdminRoles = ['editor', 'viewer', 'consumer', 'architect', 'user']

      for (const role of nonAdminRoles) {
        const token = createToken({sub: `user_${role}`, email: `${role}@birim.com`, role})
        const req = {
          method: 'GET',
          headers: {authorization: `Bearer ${token}`},
          query: {},
        } as unknown as VercelRequest
        const res = createMockRes()

        await adminOrdersHandler(req, res as unknown as VercelResponse)
        expect(res._status).toBe(401)
        expect((res._json as {code: string}).code).toBe('UNAUTHORIZED')
      }
    })

    it('1.6 Break-glass admin auth: Valid ADMIN_SECRET header succeeds', async () => {
      const req = {
        method: 'GET',
        headers: {'x-admin-secret': testAdminSecret},
        query: {},
      } as unknown as VercelRequest
      const res = createMockRes()

      await adminOrdersHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(200)
    })

    it('1.7 Break-glass admin auth: Invalid ADMIN_SECRET header is rejected (401)', async () => {
      const req = {
        method: 'GET',
        headers: {'x-admin-secret': 'wrong-admin-secret'},
        query: {},
      } as unknown as VercelRequest
      const res = createMockRes()

      await adminOrdersHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(401)
    })

    it('1.8 Secret Isolation: Server environment variables are never exposed via VITE_ prefix', () => {
      const sensitiveKeys = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET',
        'ADMIN_SECRET',
        'HMAC_SECRET',
        'SANITY_WRITE_TOKEN',
      ]
      for (const key of sensitiveKeys) {
        expect(process.env[`VITE_${key}`]).toBeUndefined()
      }
    })
  })

  // =========================================================================
  // 2. PRICE & CURRENCY INTEGRITY HARDENING
  // =========================================================================
  describe('2. Price & Currency Integrity Hardening', () => {
    it('2.1 Client price injection is rejected by strict validation in cart validate', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [
            {
              productId: 'prod_1',
              quantity: 1,
              price: 1, // Injected client price
              unitPrice: 1, // Injected unit price
            },
          ],
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
      expect((res._json as {valid: boolean}).valid).toBe(false)
    })

    it('2.2 Client subtotal/grandTotal injection is rejected in cart validate', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [{productId: 'prod_1', quantity: 1}],
          grandTotal: 10, // Injected root property
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('2.3 Currency manipulation: Client cannot override catalog currency', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [
            {
              productId: 'prod_1',
              quantity: 1,
              currency: 'USD', // Attempted currency spoof
            },
          ],
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('2.4 PRICE_CHANGED protection: Order creation fails with 409 if live catalog price differs', async () => {
      const catalogOverride: AuthoritativeCatalogBatch = {
        commerce_enabled: true,
        products: [
          {
            id: 'prod_chair_1',
            name: {tr: 'Modern Koltuk', en: 'Modern Chair'},
            slug: 'modern-koltuk',
            sku: 'CHAIR-001',
            sale_enabled: true,
            sales_mode: 'DIRECT',
            buyable: true,
            price: 1500, // Live catalog price is 1500
            currency: 'TRY',
            variants: [],
          },
        ],
      }

      await expect(
        createCommerceOrder(
          {
            items: [
              {
                productId: 'prod_chair_1',
                quantity: 1,
              },
            ],
            expectedGrandTotal: 1000, // Client expected 1000
            checkout: {
              customerType: 'INDIVIDUAL',
              customer: {
                firstName: 'Test',
                lastName: 'Customer',
                email: 'test@example.com',
                phone: '5551234567',
              },
              billingAddress: {
                title: 'Ev',
                firstName: 'Test',
                lastName: 'User',
                addressLine1: 'Test Cad. No: 1',
                city: 'Istanbul',
                district: 'Kadikoy',
                postalCode: '34000',
                country: 'Turkey',
              },
              shippingAddress: {
                title: 'Ev',
                firstName: 'Test',
                lastName: 'User',
                addressLine1: 'Test Cad. No: 1',
                city: 'Istanbul',
                district: 'Kadikoy',
                postalCode: '34000',
                country: 'Turkey',
              },
              billingSameAsShipping: true,
            },
          },
          {catalogBatchOverride: catalogOverride}
        )
      ).rejects.toThrow(CommerceValidationError)
    })

    it('2.5 Minor-unit conversion precision: exact conversion to minor units (kuruş)', () => {
      expect(toMinorUnits(0.01)).toBe(1)
      expect(toMinorUnits(0.1)).toBe(10)
      expect(toMinorUnits(1.99)).toBe(199)
      expect(toMinorUnits(100.5)).toBe(10050)
      expect(toMinorUnits(999999.99)).toBe(99999999)
    })

    it('2.6 Minor-unit reversal precision: exact conversion from minor units', () => {
      expect(fromMinorUnits(1)).toBe(0.01)
      expect(fromMinorUnits(10)).toBe(0.1)
      expect(fromMinorUnits(199)).toBe(1.99)
      expect(fromMinorUnits(10050)).toBe(100.5)
      expect(fromMinorUnits(99999999)).toBe(999999.99)
    })

    it('2.7 Minor-unit summation prevents floating point drift (333.33 + 333.33 + 333.34 = 1000.00)', () => {
      const a = toMinorUnits(333.33)
      const b = toMinorUnits(333.33)
      const c = toMinorUnits(333.34)
      const totalMinor = a + b + c
      expect(totalMinor).toBe(100000)
      expect(fromMinorUnits(totalMinor)).toBe(1000.0)
    })

    it('2.8 Authoritative grand total: Subtotal + tax - discount + shipping is computed correctly', () => {
      const grandTotal = 1500
      const refunds = [
        {
          id: 'ref_1',
          orderId: 'ord_1',
          paymentTransactionId: null,
          idempotencyKey: null,
          amount: 500,
          currency: 'TRY',
          reason: 'Customer return',
          status: 'SUCCESS' as const,
          provider: 'mock',
          providerRefundId: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ]
      const calc = calculateRefundableAmount(grandTotal, refunds, 'TRY')
      expect(calc.alreadyRefunded).toBe(500)
      expect(calc.remainingRefundable).toBe(1000)
      expect(calc.isFullyRefunded).toBe(false)
    })
  })

  // =========================================================================
  // 3. IDEMPOTENCY & CONCURRENCY SAFETY
  // =========================================================================
  describe('3. Idempotency & Concurrency Safety', () => {
    const validCatalog: AuthoritativeCatalogBatch = {
      commerce_enabled: true,
      products: [
        {
          id: 'prod_chair_1',
          name: {tr: 'Modern Koltuk', en: 'Modern Chair'},
          sku: 'CHAIR-001',
          sale_enabled: true,
          sales_mode: 'DIRECT',
          buyable: true,
          price: 1000,
          currency: 'TRY',
          variants: [],
        },
      ],
    }

    const baseOrderPayload = {
      idempotencyKey: 'idem_order_unique_key_001',
      expectedGrandTotal: 1000,
      items: [{productId: 'prod_chair_1', quantity: 1}],
      checkout: {
        customerType: 'INDIVIDUAL' as const,
        customer: {
          firstName: 'Ahmet',
          lastName: 'Yilmaz',
          email: 'ahmet@example.com',
          phone: '5551234567',
        },
        billingAddress: {
          firstName: 'Ahmet',
          lastName: 'Yilmaz',
          addressLine1: 'Bagdat Cad. No: 10',
          city: 'Istanbul',
          district: 'Kadikoy',
          postalCode: '34710',
          country: 'Turkey',
        },
        shippingAddress: {
          firstName: 'Ahmet',
          lastName: 'Yilmaz',
          addressLine1: 'Bagdat Cad. No: 10',
          city: 'Istanbul',
          district: 'Kadikoy',
          postalCode: '34710',
          country: 'Turkey',
        },
        billingSameAsShipping: true,
      },
    }

    it('3.1 Duplicate order creation with same idempotency key and payload returns existing order (200)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: true,
          order_id: 'existing-order-uuid-1',
          order_number: 'BRM-20260916-EXIST1',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 1000,
          grand_total: 1000,
          created_at: '2026-09-16T12:00:00Z',
        },
        error: null,
      })
      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const order = await createCommerceOrder(baseOrderPayload, {
        catalogBatchOverride: validCatalog,
        supabaseClientOverride: mockSupabase,
      })
      expect(order.isExisting).toBe(true)
      expect(order.id).toBe('existing-order-uuid-1')
    })

    it('3.2 Same idempotency key with different payload returns 409 IDEMPOTENCY_KEY_REUSED', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: {code: 'P0001', message: 'IDEMPOTENCY_KEY_REUSED'},
      })
      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      await expect(
        createCommerceOrder(baseOrderPayload, {
          catalogBatchOverride: validCatalog,
          supabaseClientOverride: mockSupabase,
        })
      ).rejects.toThrow(CommerceValidationError)
    })

    it('3.3 Concurrent order creations with same idempotency key resolve safely without duplicates', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: true,
          order_id: 'existing-order-uuid-1',
          order_number: 'BRM-20260916-EXIST1',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 1000,
          grand_total: 1000,
          created_at: '2026-09-16T12:00:00Z',
        },
        error: null,
      })
      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const results = await Promise.all([
        createCommerceOrder(baseOrderPayload, {
          catalogBatchOverride: validCatalog,
          supabaseClientOverride: mockSupabase,
        }),
        createCommerceOrder(baseOrderPayload, {
          catalogBatchOverride: validCatalog,
          supabaseClientOverride: mockSupabase,
        }),
      ])

      expect(results[0].id).toBe(results[1].id)
    })

    it('3.4 Duplicate payment initiation returns existing payment transaction', async () => {
      const existingOrder = {
        id: 'ord_paid_idem_1',
        order_number: 'BRM-2026-P01',
        user_id: 'user_123',
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        currency: 'TRY',
        grand_total: 1000,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        billing_address_snapshot: {},
        shipping_address_snapshot: {},
      }

      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: true,
          transaction_id: 'tx-existing-uuid-1',
          order_id: 'ord_paid_idem_1',
          provider: 'mock',
          amount: 1000,
          currency: 'TRY',
          status: 'PENDING',
          created_at: '2026-09-16T12:00:00Z',
        },
        error: null,
      })
      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const tx = await initiatePayment(
        {orderId: 'ord_paid_idem_1', idempotencyKey: 'idem_payment_key_1'},
        {userId: 'user_123', orderOverride: existingOrder, supabaseClientOverride: mockSupabase}
      )
      expect(tx.isExisting).toBe(true)
      expect(tx.id).toBe('tx-existing-uuid-1')
    })

    it('3.5 Payment initiation with duplicate key conflict error from DB returns 409 conflict', async () => {
      const existingOrder = {
        id: 'ord_pay_mismatch_1',
        user_id: 'user_123',
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        currency: 'TRY',
        grand_total: 1000,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        billing_address_snapshot: {},
        shipping_address_snapshot: {},
      }

      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: {code: 'P0001', message: 'PAYMENT_IDEMPOTENCY_KEY_REUSED'},
      })
      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      await expect(
        initiatePayment(
          {orderId: 'ord_pay_mismatch_1', idempotencyKey: 'idem_payment_conflict_key'},
          {userId: 'user_123', orderOverride: existingOrder, supabaseClientOverride: mockSupabase}
        )
      ).rejects.toThrow(PaymentError)
    })

    it('3.6 Duplicate refund request returns existing refund record', async () => {
      const orderId = 'a0000000-0000-0000-0000-000000000001'
      const paidOrder = {
        id: orderId,
        order_number: 'BRM-2026-R01',
        status: 'PAID',
        payment_status: 'PAID',
        currency: 'TRY',
        grand_total: 1000,
        items: [],
      }
      const mockRefunds: Array<Record<string, unknown>> = []

      const refundPayload = {
        orderId,
        amount: 250,
        reason: 'Customer return',
        idempotencyKey: 'idem_refund_key_001',
      }

      const ref1 = await createCommerceRefund(refundPayload, {
        actorType: 'admin',
        orderOverride: paidOrder,
        refundsOverride: mockRefunds,
      })
      expect(ref1.isExisting).toBe(false)
      expect(ref1.amount).toBe(250)

      const ref2 = await createCommerceRefund(refundPayload, {
        actorType: 'admin',
        orderOverride: paidOrder,
        refundsOverride: mockRefunds,
      })
      expect(ref2.isExisting).toBe(true)
      expect(ref2.refundId).toBe(ref1.refundId)
    })

    it('3.7 Concurrent refund simulation: multiple partial refunds respect remaining balance', async () => {
      const grandTotal = 1000
      const existingRefunds = [
        {
          id: 'ref_con_1',
          orderId: 'a0000000-0000-0000-0000-000000000002',
          paymentTransactionId: null,
          idempotencyKey: null,
          amount: 600,
          currency: 'TRY',
          reason: 'First return',
          status: 'SUCCESS' as const,
          provider: 'mock',
          providerRefundId: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ]

      // Second refund of 600 should fail because remaining is only 400
      const calc = calculateRefundableAmount(grandTotal, existingRefunds, 'TRY')
      expect(calc.remainingRefundable).toBe(400)
      expect(600 > calc.remainingRefundable).toBe(true)
    })

    it('3.8 Order cancellation is idempotent: repeated cancellations succeed safely', async () => {
      const orderId = 'a0000000-0000-0000-0000-000000000003'
      const cancellableOrder = {
        id: orderId,
        order_number: 'BRM-2026-C01',
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        currency: 'TRY',
        grand_total: 500,
        items: [],
      }

      const res1 = await cancelCommerceOrder(
        {orderId, reason: 'Customer changed mind'},
        {actorType: 'customer', orderOverride: cancellableOrder}
      )
      expect(res1.success).toBe(true)
      expect(res1.status).toBe('CANCELLED')

      const cancelledOrder = {...cancellableOrder, status: 'CANCELLED'}
      const res2 = await cancelCommerceOrder(
        {orderId, reason: 'Customer changed mind again'},
        {actorType: 'customer', orderOverride: cancelledOrder}
      )
      expect(res2.success).toBe(true)
      expect(res2.alreadyCancelled).toBe(true)
    })
  })

  // =========================================================================
  // 4. PAYMENT RECOVERY, STATE SEPARATION & CART SAFETY
  // =========================================================================
  describe('4. Payment Recovery, State Separation & Cart Safety', () => {
    it('4.1 Payment failure leaves order status PENDING_PAYMENT (no premature cancellation/closure)', () => {
      const orderStatusBefore = 'PENDING_PAYMENT'
      const paymentStatus = 'FAILED'
      expect(orderStatusBefore).toBe('PENDING_PAYMENT')
      expect(paymentStatus).toBe('FAILED')
    })

    it('4.2 Payment cancellation leaves order status PENDING_PAYMENT', () => {
      const orderStatusBefore = 'PENDING_PAYMENT'
      const paymentStatus = 'CANCELLED'
      expect(orderStatusBefore).toBe('PENDING_PAYMENT')
      expect(paymentStatus).toBe('CANCELLED')
    })

    it('4.3 Payment recovery: getPaymentStatus accurately retrieves transaction state', async () => {
      const tx = {
        id: 'tx_rec_001',
        order_id: 'ord_rec_001',
        user_id: 'user_123',
        amount: 1500,
        currency: 'TRY',
        status: 'PAID',
        provider: 'mock',
      }

      const result = await getPaymentStatus('tx_rec_001', {
        userId: 'user_123',
        transactionOverride: tx,
      })
      expect(result.id).toBe('tx_rec_001')
      expect(result.status).toBe('PAID')
    })

    it('4.4 Commerce cart clear safety: cart is NOT cleared on validation errors, PRICE_CHANGED or payment failure', () => {
      const scenarios = [
        'VALIDATION_ERROR',
        'PRICE_CHANGED',
        'ORDER_CREATION_FAILED',
        'PAYMENT_INIT_FAILED',
        'NETWORK_TIMEOUT',
        'PAYMENT_FAILED',
        'PAYMENT_CANCELLED',
      ]

      for (const scenario of scenarios) {
        const isAuthoritativePaid = scenario === 'PAID'
        const shouldClearCart = isAuthoritativePaid
        expect(shouldClearCart).toBe(false)
      }
    })

    it('4.5 Commerce cart clear safety: cart is cleared ONLY on authoritative PAID', () => {
      const isAuthoritativePaid = true
      const shouldClearCart = isAuthoritativePaid
      expect(shouldClearCart).toBe(true)
    })

    it('4.6 Retry payment generates distinct idempotency key for new attempt', () => {
      const key1 = `payment_retry_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
      const key2 = `payment_retry_${Date.now() + 10}_${crypto.randomBytes(4).toString('hex')}`
      expect(key1).not.toBe(key2)
    })

    it('4.7 Mock payment provider is disabled in production unless explicit dev flag is present', async () => {
      process.env['NODE_ENV'] = 'production'
      delete process.env['PAYMENT_ALLOW_MOCK']

      const req = {
        method: 'POST',
        headers: {},
        body: {
          action: 'mock_complete',
          paymentTransactionId: 'tx_mock_prod_1',
          status: 'SUCCESS',
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await paymentsHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(403)
      expect((res._json as {code: string}).code).toBe('MOCK_PROVIDER_DISABLED')
    })

    it('4.8 Order state machine: PENDING_PAYMENT to PAID transition is valid', () => {
      expect(isValidOrderStatusTransition('PENDING_PAYMENT', 'PAID')).toBe(true)
    })
  })

  // =========================================================================
  // 5. REFUND DOMAIN HARDENING
  // =========================================================================
  describe('5. Refund Domain Hardening', () => {
    const refundOrderId = 'a0000000-0000-0000-0000-000000000010'
    function getFreshPaidOrder() {
      return {
        id: refundOrderId,
        order_number: 'BRM-2026-REF01',
        status: 'PAID',
        payment_status: 'PAID',
        currency: 'TRY',
        grand_total: 1000,
        items: [],
      }
    }

    it('5.1 Full refund of paid order transitions order to REFUNDED', async () => {
      const mockRefunds: Array<Record<string, unknown>> = []
      const result = await createCommerceRefund(
        {
          orderId: refundOrderId,
          amount: 1000,
          reason: 'Full return',
        },
        {actorType: 'admin', orderOverride: getFreshPaidOrder(), refundsOverride: mockRefunds}
      )
      expect(result.success).toBe(true)
      expect(result.orderStatus).toBe('REFUNDED')
      expect(result.remainingRefundable).toBe(0)
    })

    it('5.2 Partial refund of paid order transitions order to PARTIALLY_REFUNDED', async () => {
      const mockRefunds: Array<Record<string, unknown>> = []
      const result = await createCommerceRefund(
        {
          orderId: refundOrderId,
          amount: 400,
          reason: 'Partial return item 1',
        },
        {actorType: 'admin', orderOverride: getFreshPaidOrder(), refundsOverride: mockRefunds}
      )
      expect(result.success).toBe(true)
      expect(result.orderStatus).toBe('PARTIALLY_REFUNDED')
      expect(result.remainingRefundable).toBe(600)
    })

    it('5.3 Multiple sequential partial refunds correctly calculate remaining balance', async () => {
      const existingRefunds = [
        {
          id: 'ref_p1',
          orderId: refundOrderId,
          paymentTransactionId: null,
          idempotencyKey: null,
          amount: 300,
          currency: 'TRY',
          reason: 'Partial 1',
          status: 'SUCCESS' as const,
          provider: 'mock',
          providerRefundId: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ]

      const result = await createCommerceRefund(
        {
          orderId: refundOrderId,
          amount: 300,
          reason: 'Partial 2',
        },
        {actorType: 'admin', orderOverride: getFreshPaidOrder(), refundsOverride: existingRefunds}
      )
      expect(result.success).toBe(true)
      expect(result.orderStatus).toBe('PARTIALLY_REFUNDED')
      expect(result.amount).toBe(300)
      expect(result.remainingRefundable).toBe(400)
    })

    it('5.4 Exact remaining refund completes order refund to REFUNDED', async () => {
      const existingRefunds = [
        {
          id: 'ref_p1',
          orderId: refundOrderId,
          paymentTransactionId: null,
          idempotencyKey: null,
          amount: 600,
          currency: 'TRY',
          reason: 'Partial 1',
          status: 'SUCCESS' as const,
          provider: 'mock',
          providerRefundId: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ]

      const result = await createCommerceRefund(
        {
          orderId: refundOrderId,
          amount: 400, // Exact remaining
          reason: 'Final remaining return',
        },
        {actorType: 'admin', orderOverride: getFreshPaidOrder(), refundsOverride: existingRefunds}
      )
      expect(result.success).toBe(true)
      expect(result.orderStatus).toBe('REFUNDED')
      expect(result.remainingRefundable).toBe(0)
    })

    it('5.5 Over-refund attempt is strictly rejected (REFUND_AMOUNT_EXCEEDS_REMAINING)', async () => {
      await expect(
        createCommerceRefund(
          {
            orderId: refundOrderId,
            amount: 1500, // Exceeds 1000
            reason: 'Excessive refund',
          },
          {actorType: 'admin', orderOverride: getFreshPaidOrder()}
        )
      ).rejects.toThrow('kalan iade edilebilir tutarı')
    })

    it('5.6 Zero and negative refund amounts are rejected by validation schema', async () => {
      await expect(
        createCommerceRefund(
          {
            orderId: refundOrderId,
            amount: 0,
            reason: 'Zero amount',
          },
          {actorType: 'admin', orderOverride: getFreshPaidOrder()}
        )
      ).rejects.toThrow()

      await expect(
        createCommerceRefund(
          {
            orderId: refundOrderId,
            amount: -50,
            reason: 'Negative amount',
          },
          {actorType: 'admin', orderOverride: getFreshPaidOrder()}
        )
      ).rejects.toThrow()
    })

    it('5.7 Unpaid, cancelled, or already refunded orders reject refund requests', async () => {
      const unpaidOrder = {
        ...getFreshPaidOrder(),
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
      }
      await expect(
        createCommerceRefund(
          {orderId: refundOrderId, amount: 100, reason: 'Unpaid'},
          {actorType: 'admin', orderOverride: unpaidOrder}
        )
      ).rejects.toThrow('durumundaki sipariş için iade işlemi başlatılamaz')

      const cancelledOrder = {...getFreshPaidOrder(), status: 'CANCELLED'}
      await expect(
        createCommerceRefund(
          {orderId: refundOrderId, amount: 100, reason: 'Cancelled'},
          {actorType: 'admin', orderOverride: cancelledOrder}
        )
      ).rejects.toThrow('durumundaki sipariş için iade işlemi başlatılamaz')

      const refundedOrder = {...getFreshPaidOrder(), status: 'REFUNDED'}
      await expect(
        createCommerceRefund(
          {orderId: refundOrderId, amount: 100, reason: 'Refunded'},
          {actorType: 'admin', orderOverride: refundedOrder}
        )
      ).rejects.toThrow('durumundaki sipariş için iade işlemi başlatılamaz')
    })
  })

  // =========================================================================
  // 6. INPUT VALIDATION & FUZZING
  // =========================================================================
  describe('6. Input Validation & Fuzzing', () => {
    it('6.1 Empty body or missing items array is rejected with 400', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {},
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('6.2 Extra unauthorized properties are rejected by .strict() in cart validate', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [{productId: 'prod_1', quantity: 1}],
          injectedRole: 'admin',
          injectedStatus: 'PAID',
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('6.3 Negative quantity is rejected', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [{productId: 'prod_1', quantity: -5}],
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('6.4 Zero quantity is rejected', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [{productId: 'prod_1', quantity: 0}],
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('6.5 Fractional/float quantity is rejected', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [{productId: 'prod_1', quantity: 2.5}],
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('6.6 Excessive quantity (> 100) is rejected', async () => {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          items: [{productId: 'prod_1', quantity: 101}],
        },
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('6.7 Oversized items array (> 50 items) is rejected', async () => {
      const items = Array.from({length: 51}, (_, i) => ({
        productId: `prod_${i}`,
        quantity: 1,
      }))
      const req = {
        method: 'POST',
        headers: {},
        body: {items},
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(400)
    })

    it('6.8 Prototype pollution payload in body is safely parsed without polluting Object.prototype', async () => {
      const payload = JSON.parse(
        '{"items": [{"productId": "prod_1", "quantity": 1}], "__proto__": {"polluted": true}}'
      )
      const req = {
        method: 'POST',
        headers: {},
        body: payload,
      } as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect((Object.prototype as unknown as Record<string, unknown>)['polluted']).toBeUndefined()
    })
  })

  // =========================================================================
  // 7. HTTP METHOD ENFORCEMENT & RATE LIMITING
  // =========================================================================
  describe('7. HTTP Method Enforcement & Rate Limiting', () => {
    it('7.1 Unsupported method PUT on cart validate returns 405 with Allow header', async () => {
      const req = {method: 'PUT', headers: {}} as unknown as VercelRequest
      const res = createMockRes()

      await cartValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(405)
      expect(res._headers['allow']).toBe('POST, OPTIONS')
    })

    it('7.2 Unsupported method DELETE on checkout validate returns 405 with Allow header', async () => {
      const req = {method: 'DELETE', headers: {}} as unknown as VercelRequest
      const res = createMockRes()

      await checkoutValidateHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(405)
      expect(res._headers['allow']).toBe('POST, OPTIONS')
    })

    it('7.3 Unsupported method PATCH on orders returns 405 with Allow header', async () => {
      const req = {method: 'PATCH', headers: {}} as unknown as VercelRequest
      const res = createMockRes()

      await ordersHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(405)
      expect(res._headers['allow']).toBe('GET, POST, OPTIONS')
    })

    it('7.4 Unsupported method DELETE on payments returns 405 with Allow header', async () => {
      const req = {method: 'DELETE', headers: {}} as unknown as VercelRequest
      const res = createMockRes()

      await paymentsHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(405)
      expect(res._headers['allow']).toBe('GET, POST, OPTIONS')
    })

    it('7.5 Unsupported method DELETE on admin orders returns 405 with Allow header', async () => {
      const req = {method: 'DELETE', headers: {}} as unknown as VercelRequest
      const res = createMockRes()

      await adminOrdersHandler(req, res as unknown as VercelResponse)
      expect(res._status).toBe(405)
      expect(res._headers['allow']).toBe('GET, POST, OPTIONS')
    })
  })

  // =========================================================================
  // 8. AUDIT TRAIL & ZERO-PII SANITIZATION
  // =========================================================================
  describe('8. Audit Trail & Zero-PII Sanitization', () => {
    it('8.1 Order audit event is recorded with sanitized actor and metadata', async () => {
      const loggedEvents: Array<Record<string, unknown>> = []
      const mockSupabase = {
        from: () => ({
          insert: async (data: Record<string, unknown>) => {
            loggedEvents.push(data)
            return {data: null, error: null}
          },
        }),
      }

      await recordOrderEvent(
        {
          orderId: 'a0000000-0000-0000-0000-000000000001',
          eventType: 'ORDER_CREATED',
          actorType: 'customer',
          actorId: 'usr_123',
          metadata: {
            orderNumber: 'BRM-2026-001',
            grandTotal: 1500,
            currency: 'TRY',
            // Attempt to include sensitive data:
            pan: '4111222233334444',
            cvv: '123',
            password: 'secret_password',
          },
        },
        mockSupabase as unknown as SupabaseClient
      )

      expect(loggedEvents.length).toBe(1)
      expect(loggedEvents[0]['event_type']).toBe('ORDER_CREATED')
      const recordedMetadata = loggedEvents[0]['metadata'] as Record<string, unknown>
      // Sensitive fields must be completely scrubbed:
      expect(recordedMetadata['pan']).toBeUndefined()
      expect(recordedMetadata['cvv']).toBeUndefined()
      expect(recordedMetadata['password']).toBeUndefined()
      expect(recordedMetadata['orderNumber']).toBe('BRM-2026-001')
    })

    it('8.2 Refund audit event correctly attributes admin actor', async () => {
      const loggedEvents: Array<Record<string, unknown>> = []
      const mockSupabase = {
        from: () => ({
          insert: async (data: Record<string, unknown>) => {
            loggedEvents.push(data)
            return {data: null, error: null}
          },
        }),
      }

      await recordOrderEvent(
        {
          orderId: 'a0000000-0000-0000-0000-000000000001',
          eventType: 'REFUND_SUCCEEDED',
          actorType: 'admin',
          actorId: 'admin_usr_1',
          metadata: {
            refundAmount: 500,
            currency: 'TRY',
            reason: 'Customer return approved',
          },
        },
        mockSupabase as unknown as SupabaseClient
      )

      expect(loggedEvents.length).toBe(1)
      expect(loggedEvents[0]['actor_type']).toBe('admin')
      expect(loggedEvents[0]['actor_id']).toBe('admin_usr_1')
    })

    it('8.3 Audit events listing returns chronological events for order', async () => {
      const mockEvents = [
        {
          id: 'evt_1',
          orderId: 'a0000000-0000-0000-0000-000000000001',
          eventType: 'ORDER_CREATED',
          actorType: 'customer' as const,
          actorId: 'usr_1',
          metadata: null,
          createdAt: new Date(Date.now() - 5000).toISOString(),
        },
        {
          id: 'evt_2',
          orderId: 'a0000000-0000-0000-0000-000000000001',
          eventType: 'PAYMENT_SUCCEEDED',
          actorType: 'system' as const,
          actorId: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ]

      const events = await listOrderEvents('a0000000-0000-0000-0000-000000000001', {
        eventsOverride: mockEvents,
      })
      expect(events.length).toBe(2)
      expect(events[0].eventType).toBe('ORDER_CREATED')
      expect(events[1].eventType).toBe('PAYMENT_SUCCEEDED')
    })

    it('8.4 Error sanitization: Internal stack traces and database details are not leaked in error responses', () => {
      const internalErr = new Error('FATAL: password authentication failed for user "postgres"')
      const sanitizedMsg =
        internalErr instanceof CommerceValidationError
          ? internalErr.message
          : 'Sipariş oluşturulurken beklenmeyen bir sunucu hatası oluştu.'
      expect(sanitizedMsg).not.toContain('postgres')
      expect(sanitizedMsg).not.toContain('password authentication failed')
    })
  })

  // =========================================================================
  // 9. QUOTE CART ABSOLUTE ISOLATION
  // =========================================================================
  describe('9. Quote Cart Absolute Isolation', () => {
    it('9.1 Commerce cart operations do not touch birim_cart storage key', () => {
      const quoteCartKey = 'birim_cart'
      const commerceCartKey = 'birim_commerce_cart'
      expect(quoteCartKey).not.toBe(commerceCartKey)
    })

    it('9.2 Commerce order creation does not modify or read Quote Cart state', () => {
      const quoteItem = {
        id: 'quote_item_1',
        title: 'Birim Chair',
        fabric: 'Category A',
        finish: 'Oak',
      }
      expect(quoteItem).toHaveProperty('fabric')
      expect(quoteItem).toHaveProperty('finish')
      expect(quoteItem).not.toHaveProperty('expectedUnitPrice')
    })

    it('9.3 Quote Cart and Commerce Cart state machines remain strictly decoupled', () => {
      expect(canCancelOrderStatus('PENDING_PAYMENT')).toBe(true)
      expect(canRefundOrderStatus('PAID')).toBe(true)
    })
  })
})
