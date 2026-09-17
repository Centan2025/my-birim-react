import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {calculateProductPerformance} from '../../lib/commerce/admin-product-performance-service'
import adminHandler from '../../api/admin/[...slug]'
import analyticsHandler from '../../api/analytics'
import {createToken} from '../../lib/server/token'

function createMockReqRes(overrides?: {
  method?: string
  url?: string
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
}) {
  const req = {
    method: overrides?.method || 'GET',
    url: overrides?.url || '/api/admin/analytics/products',
    query: overrides?.query || {},
    headers: overrides?.headers || {},
    body: overrides?.body || {},
    socket: {remoteAddress: '127.0.0.1'},
  } as unknown as VercelRequest

  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    setHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value
      return this
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: unknown) {
      this.body = data
      return this
    },
  } as unknown as VercelResponse

  return {req, res}
}

describe('Product Performance & Funnel Metrics Service (Step 7)', () => {
  const fixedNow = new Date('2026-09-17T12:00:00.000Z')

  it('aggregates engagement and authoritative purchase metrics accurately', () => {
    const events = [
      {
        event_name: 'product_view',
        product_id: 'prod_ark',
        slug: 'ark-koltuk',
        created_at: '2026-09-10T10:00:00.000Z',
      },
      {
        event_name: 'product_view',
        product_id: 'prod_ark',
        slug: 'ark-koltuk',
        created_at: '2026-09-11T10:00:00.000Z',
      },
      {
        event_name: 'product_click',
        product_id: 'prod_ark',
        slug: 'ark-koltuk',
        created_at: '2026-09-11T10:05:00.000Z',
      },
      {
        event_name: 'variant_select',
        product_id: 'prod_ark',
        slug: 'ark-koltuk',
        created_at: '2026-09-11T10:06:00.000Z',
      },
      {
        event_name: 'add_to_bag',
        product_id: 'prod_ark',
        slug: 'ark-koltuk',
        created_at: '2026-09-11T10:07:00.000Z',
      },
      {
        event_name: 'checkout_start',
        created_at: '2026-09-11T10:10:00.000Z',
      },
    ]

    const orders = [
      {
        id: 'ord_1',
        status: 'PAID',
        payment_status: 'PAID',
        currency: 'TRY',
        created_at: '2026-09-11T10:15:00.000Z',
      },
      {
        id: 'ord_2_unpaid',
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        currency: 'TRY',
        created_at: '2026-09-12T10:15:00.000Z',
      },
    ]

    const orderItems = [
      {
        order_id: 'ord_1',
        product_id: 'prod_ark',
        product_title: 'Ark Koltuk',
        product_slug: 'ark-koltuk',
        quantity: 2,
        unit_price: 25000,
      },
      {
        order_id: 'ord_2_unpaid',
        product_id: 'prod_ark',
        product_title: 'Ark Koltuk',
        product_slug: 'ark-koltuk',
        quantity: 1,
        unit_price: 25000,
      },
    ]

    const fromDate = new Date('2026-09-01T00:00:00.000Z')
    const toDate = fixedNow

    const result = calculateProductPerformance(
      events,
      orders,
      orderItems,
      '30d',
      fromDate,
      toDate,
      'TRY'
    )

    expect(result.currency).toBe('TRY')
    expect(result.products).toHaveLength(1)

    const ark = result.products[0]
    expect(ark.productId).toBe('prod_ark')
    expect(ark.productName).toBe('Ark Koltuk')
    expect(ark.views).toBe(2)
    expect(ark.clicks).toBe(1)
    expect(ark.variantInteractions).toBe(1)
    expect(ark.addToBagCount).toBe(1)
    // Only ord_1 is PAID; ord_2_unpaid is excluded from authoritative sales
    expect(ark.paidOrders).toBe(1)
    expect(ark.unitsSold).toBe(2)
    expect(ark.grossRevenue).toBe(50000)

    // Conversion rates
    // View -> Bag: 1 / 2 = 50%
    expect(ark.viewToBagRate).toBe(50)
    // Bag -> Purchase: 1 / 1 = 100%
    expect(ark.bagToPurchaseRate).toBe(100)

    // Store Funnel
    expect(result.funnel.views).toBe(2)
    expect(result.funnel.addToBags).toBe(1)
    expect(result.funnel.checkoutStarts).toBe(1)
    expect(result.funnel.paidOrders).toBe(1)
    expect(result.funnel.overallConversionRate).toBe(50)
  })

  it('safely handles zero views and zero add to bag events without division by zero', () => {
    const result = calculateProductPerformance([], [], [], '30d', new Date(), new Date(), 'TRY')
    expect(result.products).toEqual([])
    expect(result.funnel.views).toBe(0)
    expect(result.funnel.overallConversionRate).toBe(0)
  })

  it('strictly segregates financial metrics across currencies', () => {
    const orders = [
      {
        id: 'ord_try',
        status: 'PAID',
        payment_status: 'PAID',
        currency: 'TRY',
        created_at: '2026-09-11T10:00:00.000Z',
      },
      {
        id: 'ord_eur',
        status: 'PAID',
        payment_status: 'PAID',
        currency: 'EUR',
        created_at: '2026-09-11T10:00:00.000Z',
      },
    ]

    const orderItems = [
      {
        order_id: 'ord_try',
        product_id: 'prod_1',
        product_title: 'Masa',
        quantity: 1,
        unit_price: 10000,
      },
      {
        order_id: 'ord_eur',
        product_id: 'prod_1',
        product_title: 'Masa',
        quantity: 1,
        unit_price: 300,
      },
    ]

    const fromDate = new Date('2026-09-01T00:00:00.000Z')
    const toDate = fixedNow

    const tryResult = calculateProductPerformance(
      [],
      orders,
      orderItems,
      '30d',
      fromDate,
      toDate,
      'TRY'
    )
    expect(tryResult.products[0].grossRevenue).toBe(10000)
    expect(tryResult.currency).toBe('TRY')

    const eurResult = calculateProductPerformance(
      [],
      orders,
      orderItems,
      '30d',
      fromDate,
      toDate,
      'EUR'
    )
    expect(eurResult.products[0].grossRevenue).toBe(300)
    expect(eurResult.currency).toBe('EUR')
  })
})

describe('Product Performance Admin API Route (/api/admin/analytics/products)', () => {
  const TEST_ADMIN_SECRET = 'test_secret_for_admin_break_glass_12345'

  beforeEach(() => {
    process.env['ADMIN_SECRET'] = TEST_ADMIN_SECRET
    process.env['JWT_SECRET'] = 'test_jwt_secret_for_metrics_suite_12345'
  })

  afterEach(() => {
    delete process.env['ADMIN_SECRET']
    delete process.env['JWT_SECRET']
  })

  it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
    const {req, res} = createMockReqRes({
      url: '/api/admin/analytics/products',
      query: {slug: 'analytics/products'},
    })

    await adminHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect((res.body as {code: string}).code).toBe('UNAUTHORIZED')
  })

  it('authorizes requests with valid admin JWT token', async () => {
    const adminToken = createToken({
      sub: 'admin_user_id',
      email: 'admin@birim.com',
      role: 'admin',
    })

    const {req, res} = createMockReqRes({
      url: '/api/admin/analytics/products',
      query: {slug: 'analytics/products', range: '30d', currency: 'TRY'},
      headers: {authorization: `Bearer ${adminToken}`},
    })

    await adminHandler(req, res)
    expect(res.statusCode).toBe(200)
    const body = res.body as {success: boolean; products: unknown[]}
    expect(body.success).toBe(true)
    expect(Array.isArray(body.products)).toBe(true)
  })

  it('authorizes requests with break-glass admin secret header', async () => {
    const {req, res} = createMockReqRes({
      url: '/api/admin/analytics/products',
      query: {slug: 'analytics/products', range: '7d'},
      headers: {'x-admin-secret': TEST_ADMIN_SECRET},
    })

    await adminHandler(req, res)
    expect(res.statusCode).toBe(200)
    const body = res.body as {success: boolean; range: string}
    expect(body.success).toBe(true)
    expect(body.range).toBe('7d')
  })
})

describe('Shop Analytics Ingest Endpoint Security & PII Rejection (POST /api/analytics/shop/events)', () => {
  it('strictly rejects payloads containing customer PII with 400 INVALID_EVENT_PAYLOAD', async () => {
    const piiPayloads = [
      {eventName: 'product_view', productId: 'p1', email: 'user@example.com'},
      {eventName: 'product_view', productId: 'p1', phone: '+905551234567'},
      {eventName: 'product_view', productId: 'p1', firstName: 'Ahmet'},
      {eventName: 'product_view', productId: 'p1', address: 'Bebek Cad. No: 1'},
      {eventName: 'product_view', productId: 'p1', guestToken: 'secret_token_123'},
      {
        eventName: 'product_view',
        productId: 'p1',
        metadata: {deliveryInstructions: 'Leave at front desk'},
      },
    ]

    for (const payload of piiPayloads) {
      const {req, res} = createMockReqRes({
        method: 'POST',
        url: '/api/analytics/shop/events',
        query: {slug: 'shop/events'},
        body: payload,
      })

      await analyticsHandler(req, res)
      expect(res.statusCode).toBe(400)
      const body = res.body as {code: string; error: string}
      expect(body.code).toBe('INVALID_EVENT_PAYLOAD')
    }
  })

  it('strictly rejects purchase and financial event names with 400 INVALID_EVENT_NAME', async () => {
    const forbiddenEvents = [
      'order_created',
      'payment_success',
      'purchase',
      'refund',
      'revenue',
      'paid_order',
    ]

    for (const eventName of forbiddenEvents) {
      const {req, res} = createMockReqRes({
        method: 'POST',
        url: '/api/analytics/shop/events',
        query: {slug: 'shop/events'},
        body: {eventName, productId: 'p1'},
      })

      await analyticsHandler(req, res)
      expect(res.statusCode).toBe(400)
      const body = res.body as {code: string}
      expect(body.code).toBe('INVALID_EVENT_NAME')
    }
  })

  it('strictly rejects metadata containing non-whitelisted keys with 400 INVALID_EVENT_PAYLOAD', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      url: '/api/analytics/shop/events',
      query: {slug: 'shop/events'},
      body: {
        eventName: 'product_click',
        productId: 'p1',
        metadata: {customArbitrarySecretField: 'secret_value'},
      },
    })

    await analyticsHandler(req, res)
    expect(res.statusCode).toBe(400)
    const body = res.body as {code: string; error: string}
    expect(body.code).toBe('INVALID_EVENT_PAYLOAD')
    expect(body.error).toContain('Disallowed metadata property')
  })

  it('accepts valid zero-PII engagement events with whitelisted metadata', async () => {
    const validPayload = {
      eventName: 'product_click',
      productId: 'prod_ark',
      slug: 'ark-koltuk',
      categorySlug: 'seating',
      source: 'category_grid',
      sessionId: 'anon-session-uuid-1234',
      metadata: {
        position: 1,
        layout: 'grid',
        source: 'category_grid',
      },
    }

    const {req, res} = createMockReqRes({
      method: 'POST',
      url: '/api/analytics/shop/events',
      query: {slug: 'shop/events'},
      body: validPayload,
    })

    await analyticsHandler(req, res)
    expect(res.statusCode).toBe(200)
    const body = res.body as {success: boolean}
    expect(body.success).toBe(true)
  })
})
