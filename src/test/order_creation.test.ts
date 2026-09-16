import {describe, it, expect, vi, beforeEach} from 'vitest'
import {
  createCommerceOrder,
  generateOrderNumber,
  computeRequestFingerprint,
  scopeIdempotencyKey,
  minorToMajor,
} from '../../lib/commerce/order-service'
import {createOrderRequestSchema} from '../../lib/commerce/order-schemas'
import {CommerceValidationError} from '../../lib/commerce/types'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'
import type {CreateOrderRequest} from '../../lib/commerce/order-types'

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
    {
      id: 'prod-config-1',
      name: {tr: 'Era Çalışma Masası', en: 'Era Desk'},
      buyable: true,
      price: undefined,
      currency: 'TRY',
      sku: 'BRM-ERA-BASE',
      sales_mode: 'CONFIGURABLE',
      sale_enabled: true,
      variants: [
        {
          id: 'var-walnut-180',
          title: {tr: 'Ceviz 180cm', en: 'Walnut 180cm'},
          price: 45000,
          currency: 'TRY',
          sku: 'BRM-ERA-WAL-180',
          enabled: true,
          options: [
            {name: 'Malzeme', value: 'Ceviz'},
            {name: 'Ölçü', value: '180x90'},
          ],
        },
      ],
    },
    {
      id: 'prod-disabled',
      name: {tr: 'Özel Seri Koltuk'},
      buyable: false,
      price: 30000,
      currency: 'TRY',
      sku: 'BRM-OZS-001',
      sales_mode: 'QUOTE_ONLY',
      sale_enabled: false,
      variants: [],
    },
  ],
}

const validCheckoutPayload = {
  customerType: 'INDIVIDUAL' as const,
  customer: {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet.yilmaz@example.com',
    phone: '+905551234567',
  },
  shippingAddress: {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    addressLine1: 'Büyükdere Cad. No: 123',
    addressLine2: 'Kat: 4 Daire: 8',
    city: 'İstanbul',
    district: 'Şişli',
    postalCode: '34394',
    country: 'Türkiye',
    phone: '+905551234567',
  },
  billingAddress: {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    addressLine1: 'Büyükdere Cad. No: 123',
    city: 'İstanbul',
    district: 'Şişli',
    postalCode: '34394',
    country: 'Türkiye',
  },
  billingSameAsShipping: true,
  corporateBilling: null,
}

describe('Phase 5 — Order Engine & Order Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Minor-Unit Math & Order Number Generator', () => {
    it('minorToMajor correctly converts minor units to major currency units', () => {
      expect(minorToMajor(1500000)).toBe(15000)
      expect(minorToMajor(999)).toBe(9.99)
      expect(minorToMajor(50)).toBe(0.5)
      expect(minorToMajor(0)).toBe(0)
    })

    it('generateOrderNumber generates BRM-YYYYMMDD-XXXXXX format with uppercase suffix', () => {
      const fixedDate = new Date(2026, 8, 16) // 2026-09-16
      const orderNum = generateOrderNumber(fixedDate)
      expect(orderNum).toMatch(/^BRM-20260916-[A-F0-9]{6}$/)
    })
  })

  describe('2. Canonical Request Fingerprinting & Idempotency Scoping', () => {
    it('produces deterministic SHA-256 fingerprint regardless of items ordering', () => {
      const itemsA = [
        {productId: 'prod-direct-1', variantId: null, quantity: 2},
        {productId: 'prod-config-1', variantId: 'var-walnut-180', quantity: 1},
      ]
      const itemsB = [
        {productId: 'prod-config-1', variantId: 'var-walnut-180', quantity: 1},
        {productId: 'prod-direct-1', variantId: null, quantity: 2},
      ]

      const fpA = computeRequestFingerprint(itemsA, validCheckoutPayload)
      const fpB = computeRequestFingerprint(itemsB, validCheckoutPayload)

      expect(fpA).toBe(fpB)
      expect(fpA.length).toBe(64) // SHA-256 hex length
    })

    it('produces different fingerprints when items, quantities or customer details change', () => {
      const itemsA = [{productId: 'prod-direct-1', variantId: null, quantity: 1}]
      const itemsB = [{productId: 'prod-direct-1', variantId: null, quantity: 2}]

      const fpA = computeRequestFingerprint(itemsA, validCheckoutPayload)
      const fpB = computeRequestFingerprint(itemsB, validCheckoutPayload)

      expect(fpA).not.toBe(fpB)
    })

    it('scopeIdempotencyKey properly isolates authenticated and guest scopes', () => {
      const rawKey = 'client-order-uuid-999'
      const authScoped = scopeIdempotencyKey(rawKey, 'user-123', 'test@example.com')
      const guestScoped = scopeIdempotencyKey(rawKey, null, 'guest@example.com')
      const guest2Scoped = scopeIdempotencyKey(rawKey, null, 'other@example.com')

      expect(authScoped).toBe('auth:user-123:client-order-uuid-999')
      expect(guestScoped).toBe('guest:guest@example.com:client-order-uuid-999')
      expect(guest2Scoped).toBe('guest:other@example.com:client-order-uuid-999')
      expect(guestScoped).not.toBe(guest2Scoped)
    })
  })

  describe('3. Strict Schema Validation & Tampering Protection', () => {
    it('rejects requests containing client-provided price, currency, or grandTotal', () => {
      const tamperedPayload = {
        items: [
          {
            productId: 'prod-direct-1',
            quantity: 1,
            price: 1, // Tampered price
          },
        ],
        checkout: validCheckoutPayload,
      }

      const result = createOrderRequestSchema.safeParse(tamperedPayload)
      expect(result.success).toBe(false)
    })

    it('rejects requests with top-level userId or unauthorized fields', () => {
      const tamperedPayload = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
        userId: 'malicious-user-id',
      }

      const result = createOrderRequestSchema.safeParse(tamperedPayload)
      expect(result.success).toBe(false)
    })

    it('rejects corporate checkout without corporate tax details', () => {
      const invalidCorporate = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: {
          ...validCheckoutPayload,
          customerType: 'CORPORATE' as const,
          corporateBilling: null,
        },
      }

      const result = createOrderRequestSchema.safeParse(invalidCorporate)
      expect(result.success).toBe(false)
    })
  })

  describe('4. Authoritative Order Creation, Snapshots & Price Changes', () => {
    it('creates order with fresh Sanity price snapshots for DIRECT product', async () => {
      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 2}],
        checkout: validCheckoutPayload,
        idempotencyKey: 'test-idem-key-1',
        notes: 'Kapıda güvenlik var.',
      }

      const order = await createCommerceOrder(payload, {
        catalogBatchOverride: mockCatalog,
      })

      expect(order.orderNumber).toMatch(/^BRM-\d{8}-[A-F0-9]{6}$/)
      expect(order.status).toBe('PENDING_PAYMENT')
      expect(order.paymentStatus).toBe('PENDING')
      expect(order.currency).toBe('TRY')
      expect(order.subtotal).toBe(30000) // 15000 * 2
      expect(order.grandTotal).toBe(30000)
      expect(order.itemsCount).toBe(1)
      expect(order.isExisting).toBe(false)
    })

    it('creates order with fresh variant snapshots and options for CONFIGURABLE product', async () => {
      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-config-1', variantId: 'var-walnut-180', quantity: 1}],
        checkout: validCheckoutPayload,
      }

      const order = await createCommerceOrder(payload, {
        catalogBatchOverride: mockCatalog,
      })

      expect(order.status).toBe('PENDING_PAYMENT')
      expect(order.subtotal).toBe(45000)
      expect(order.grandTotal).toBe(45000)
    })

    it('throws 409 PRICE_CHANGED when expectedGrandTotal does not match fresh catalog', async () => {
      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
        expectedGrandTotal: 14000, // User saw 14,000 TL but Sanity has 15,000 TL
      }

      await expect(
        createCommerceOrder(payload, {catalogBatchOverride: mockCatalog})
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'PRICE_CHANGED',
      })
    })

    it('succeeds when expectedGrandTotal matches fresh Sanity price', async () => {
      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
        expectedGrandTotal: 15000, // Matches Sanity price exactly
      }

      const order = await createCommerceOrder(payload, {
        catalogBatchOverride: mockCatalog,
      })

      expect(order.grandTotal).toBe(15000)
    })

    it('rejects order if product is disabled or quote-only in Sanity', async () => {
      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-disabled', quantity: 1}],
        checkout: validCheckoutPayload,
      }

      await expect(
        createCommerceOrder(payload, {catalogBatchOverride: mockCatalog})
      ).rejects.toThrow(CommerceValidationError)
    })

    it('rejects order if global commerce is disabled', async () => {
      const disabledCatalog: AuthoritativeCatalogBatch = {
        commerce_enabled: false,
        products: mockCatalog.products,
      }

      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
      }

      await expect(
        createCommerceOrder(payload, {catalogBatchOverride: disabledCatalog})
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'COMMERCE_DISABLED',
      })
    })
  })

  describe('5. Idempotency, Concurrency & Supabase Atomic RPC', () => {
    it('handles idempotent replay (same key -> same order 200 OK)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: true,
          order_id: 'existing-order-uuid-1',
          order_number: 'BRM-20260916-EXIST1',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 15000,
          grand_total: 15000,
          created_at: '2026-09-16T12:00:00Z',
        },
        error: null,
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
        idempotencyKey: 'idem-replay-key',
      }

      const result = await createCommerceOrder(payload, {
        catalogBatchOverride: mockCatalog,
        supabaseClientOverride: mockSupabase,
      })

      expect(mockRpc).toHaveBeenCalledWith(
        'create_commerce_order_atomic',
        expect.objectContaining({
          p_order: expect.objectContaining({
            idempotency_key: 'guest:ahmet.yilmaz@example.com:idem-replay-key',
          }),
        })
      )
      expect(result.id).toBe('existing-order-uuid-1')
      expect(result.orderNumber).toBe('BRM-20260916-EXIST1')
      expect(result.isExisting).toBe(true)
    })

    it('handles idempotency conflict (same key different payload -> 409 IDEMPOTENCY_KEY_REUSED)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'P0001',
          message: 'IDEMPOTENCY_KEY_REUSED',
        },
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
        idempotencyKey: 'idem-conflict-key',
      }

      await expect(
        createCommerceOrder(payload, {
          catalogBatchOverride: mockCatalog,
          supabaseClientOverride: mockSupabase,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'IDEMPOTENCY_KEY_REUSED',
      })
    })

    it('handles concurrent duplicate requests safely without unhandled race conditions', async () => {
      // Simulate RPC handling concurrency: first call inserts, second call returns existing
      let callCount = 0
      const mockRpc = vi.fn().mockImplementation(async () => {
        callCount++
        return {
          data: {
            is_existing: callCount > 1,
            order_id: 'order-concurrent-uuid-100',
            order_number: 'BRM-20260916-CONC100',
            status: 'PENDING_PAYMENT',
            payment_status: 'PENDING',
            currency: 'TRY',
            subtotal: 15000,
            grand_total: 15000,
            created_at: '2026-09-16T12:00:00Z',
          },
          error: null,
        }
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
        idempotencyKey: 'concurrent-key-test',
      }

      const [orderA, orderB] = await Promise.all([
        createCommerceOrder(payload, {
          catalogBatchOverride: mockCatalog,
          supabaseClientOverride: mockSupabase,
        }),
        createCommerceOrder(payload, {
          catalogBatchOverride: mockCatalog,
          supabaseClientOverride: mockSupabase,
        }),
      ])

      expect(mockRpc).toHaveBeenCalledTimes(2)
      expect(orderA.id).toBe('order-concurrent-uuid-100')
      expect(orderB.id).toBe('order-concurrent-uuid-100')
      expect(orderA.orderNumber).toBe(orderB.orderNumber)
    })

    it('ensures ZERO payment_transactions INSERT occurs during order initialization', async () => {
      // In Phase 5, payment_transactions table must NEVER be called or written to
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: false,
          order_id: 'new-order-uuid-99',
          order_number: 'BRM-20260916-NEW099',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 15000,
          grand_total: 15000,
        },
        error: null,
      })

      const mockFrom = vi.fn()
      const mockSupabase = {
        rpc: mockRpc,
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const payload: CreateOrderRequest = {
        items: [{productId: 'prod-direct-1', quantity: 1}],
        checkout: validCheckoutPayload,
      }

      await createCommerceOrder(payload, {
        catalogBatchOverride: mockCatalog,
        supabaseClientOverride: mockSupabase,
      })

      // Ensure no direct .from('payment_transactions') or .from('orders') bypasses the atomic RPC
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })
})
