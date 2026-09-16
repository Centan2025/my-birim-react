import {describe, it, expect, vi, beforeEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import adminOrdersHandler from '../../api/admin/commerce/orders/index'
import {
  listAdminCommerceOrders,
  getAdminCommerceOrderDetail,
} from '../../lib/commerce/admin-order-service'
import {fetchAdminOrdersClient, fetchAdminOrderDetailClient} from '../services/commerce/adminOrders'
import {createToken} from '../../lib/server/token'
import {CommerceValidationError} from '../../lib/commerce/types'

// Mock Response Helper
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
      this._headers[key] = val
      return this as unknown as VercelResponse
    },
  }
  return res
}

// Sample dataset
const mockOrdersDb = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    order_number: 'BRM-20260916-AAA111',
    user_id: 'user_123',
    status: 'PAID',
    payment_status: 'PAID',
    currency: 'TRY',
    subtotal: 12000,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 2400,
    grand_total: 14400,
    customer_type: 'INDIVIDUAL',
    customer_name: 'Ahmet Yılmaz',
    customer_email: 'ahmet@example.com',
    customer_phone: '+905551112233',
    billing_address_snapshot: {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      addressLine1: 'Bağdat Cad. No: 10',
      district: 'Kadıköy',
      city: 'İstanbul',
      postalCode: '34710',
      country: 'TR',
    },
    shipping_address_snapshot: {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      addressLine1: 'Bağdat Cad. No: 10',
      district: 'Kadıköy',
      city: 'İstanbul',
      postalCode: '34710',
      country: 'TR',
    },
    items: [
      {
        product_id: 'prod_chair_01',
        variant_id: 'var_walnut',
        product_name_snapshot: 'Tasarım Sandalye',
        sku_snapshot: 'BRM-CHR-01-WLN',
        selected_options_snapshot: {Ahşap: 'Ceviz'},
        quantity: 2,
        unit_price: 6000,
        total_price: 12000,
      },
    ],
    payment_transactions: [
      {
        id: 'tx_001',
        order_id: '11111111-1111-4111-8111-111111111111',
        provider: 'test',
        provider_payment_id: 'test_pay_123',
        amount: 14400,
        currency: 'TRY',
        status: 'SUCCESS',
        installment: 1,
        created_at: '2026-09-16T10:00:00.000Z',
      },
    ],
    created_at: '2026-09-16T10:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    order_number: 'BRM-20260916-BBB222',
    user_id: null,
    status: 'PENDING_PAYMENT',
    payment_status: 'PENDING',
    currency: 'TRY',
    subtotal: 25000,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 5000,
    grand_total: 30000,
    customer_type: 'CORPORATE',
    customer_name: 'Zeynep Kaya',
    customer_email: 'zeynep@mimarlik.com',
    customer_phone: '+905559998877',
    billing_address_snapshot: {
      companyName: 'Kaya Mimarlık A.Ş.',
      taxOffice: 'Beşiktaş',
      taxNumber: '1234567890',
      addressLine1: 'Levent Mah. No: 42',
      district: 'Beşiktaş',
      city: 'İstanbul',
      postalCode: '34330',
      country: 'TR',
    },
    shipping_address_snapshot: {
      firstName: 'Zeynep',
      lastName: 'Kaya',
      addressLine1: 'Levent Mah. No: 42',
      district: 'Beşiktaş',
      city: 'İstanbul',
      postalCode: '34330',
      country: 'TR',
    },
    items: [
      {
        product_id: 'prod_table_01',
        variant_id: null,
        product_name_snapshot: 'Masif Masa',
        sku_snapshot: 'BRM-TBL-01',
        quantity: 1,
        unit_price: 25000,
        total_price: 25000,
      },
    ],
    payment_transactions: [],
    created_at: '2026-09-16T11:30:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    order_number: 'BRM-20260916-CCC333',
    user_id: 'user_456',
    status: 'PAYMENT_FAILED',
    payment_status: 'FAILED',
    currency: 'TRY',
    subtotal: 5000,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 1000,
    grand_total: 6000,
    customer_type: 'INDIVIDUAL',
    customer_name: 'Can Demir',
    customer_email: 'can@demir.com',
    customer_phone: '+905554445566',
    billing_address_snapshot: {},
    shipping_address_snapshot: {},
    items: [],
    payment_transactions: [
      {
        id: 'tx_002',
        order_id: '33333333-3333-4333-8333-333333333333',
        provider: 'test',
        amount: 6000,
        currency: 'TRY',
        status: 'FAILED',
        error_code: 'CARD_DECLINED',
        error_message: 'Yetersiz Bakiye',
        installment: 1,
        created_at: '2026-09-16T12:00:00.000Z',
      },
    ],
    created_at: '2026-09-16T12:00:00.000Z',
  },
]

describe('Phase 6A.4: Admin Commerce Order Management', () => {
  const secretKey = 'test-secret-key-at-least-32-chars-long'
  const adminSecret = 'super-secret-admin-break-glass-token'

  beforeEach(() => {
    process.env['JWT_SECRET'] = secretKey
    process.env['ADMIN_SECRET'] = adminSecret
  })

  describe('1. Server-Side Service: listAdminCommerceOrders & getAdminCommerceOrderDetail', () => {
    it('lists orders with default pagination', async () => {
      const result = await listAdminCommerceOrders({}, {ordersOverride: mockOrdersDb})
      expect(result.orders.length).toBe(3)
      expect(result.pagination.total).toBe(3)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.totalPages).toBe(1)
      expect(result.orders[0]?.orderNumber).toBe('BRM-20260916-AAA111')
    })

    it('filters orders by status correctly', async () => {
      const result = await listAdminCommerceOrders({status: 'PAID'}, {ordersOverride: mockOrdersDb})
      expect(result.orders.length).toBe(1)
      expect(result.orders[0]?.status).toBe('PAID')
      expect(result.orders[0]?.orderNumber).toBe('BRM-20260916-AAA111')
    })

    it('filters orders by paymentStatus correctly', async () => {
      const result = await listAdminCommerceOrders(
        {paymentStatus: 'FAILED'},
        {ordersOverride: mockOrdersDb}
      )
      expect(result.orders.length).toBe(1)
      expect(result.orders[0]?.paymentStatus).toBe('FAILED')
      expect(result.orders[0]?.orderNumber).toBe('BRM-20260916-CCC333')
    })

    it('searches orders by query across orderNumber, email, and customerName', async () => {
      // Search by order number
      const res1 = await listAdminCommerceOrders({q: 'AAA111'}, {ordersOverride: mockOrdersDb})
      expect(res1.orders.length).toBe(1)
      expect(res1.orders[0]?.orderNumber).toBe('BRM-20260916-AAA111')

      // Search by email
      const res2 = await listAdminCommerceOrders(
        {q: 'mimarlik.com'},
        {ordersOverride: mockOrdersDb}
      )
      expect(res2.orders.length).toBe(1)
      expect(res2.orders[0]?.customerEmail).toBe('zeynep@mimarlik.com')

      // Search by customer name
      const res3 = await listAdminCommerceOrders({q: 'Can Demir'}, {ordersOverride: mockOrdersDb})
      expect(res3.orders.length).toBe(1)
      expect(res3.orders[0]?.customerName).toBe('Can Demir')
    })

    it('paginates correctly with page and limit', async () => {
      const result = await listAdminCommerceOrders(
        {page: 2, limit: 1},
        {ordersOverride: mockOrdersDb}
      )
      expect(result.orders.length).toBe(1)
      expect(result.pagination.total).toBe(3)
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.totalPages).toBe(3)
      expect(result.orders[0]?.orderNumber).toBe('BRM-20260916-BBB222')
    })

    it('retrieves full order detail snapshot with items and payment transactions', async () => {
      const detail = await getAdminCommerceOrderDetail('11111111-1111-4111-8111-111111111111', {
        orderOverride: mockOrdersDb[0],
      })

      expect(detail.id).toBe('11111111-1111-4111-8111-111111111111')
      expect(detail.orderNumber).toBe('BRM-20260916-AAA111')
      expect(detail.status).toBe('PAID')
      expect(detail.paymentStatus).toBe('PAID')
      expect(detail.grandTotal).toBe(14400)
      expect(detail.items.length).toBe(1)
      expect(detail.items[0]?.productName).toBe('Tasarım Sandalye')
      expect(detail.items[0]?.selectedOptions).toEqual({Ahşap: 'Ceviz'})
      expect(detail.paymentTransactions.length).toBe(1)
      expect(detail.paymentTransactions[0]?.status).toBe('SUCCESS')
    })

    it('throws 400 INVALID_REQUEST when orderId is empty', async () => {
      await expect(getAdminCommerceOrderDetail('')).rejects.toThrowError(CommerceValidationError)
    })
  })

  describe('2. Admin API Endpoint Authorization & Security', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const req = {
        method: 'GET',
        headers: {},
        query: {},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(401)
      expect(res._json).toMatchObject({
        success: false,
        code: 'UNAUTHORIZED',
      })
    })

    it('rejects regular users (role: consumer) with 401 Unauthorized', async () => {
      const consumerToken = createToken({
        sub: 'user_consumer',
        email: 'user@test.com',
        role: 'consumer',
      })

      const req = {
        method: 'GET',
        headers: {
          authorization: `Bearer ${consumerToken}`,
        },
        query: {},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(401)
    })

    it('rejects architect users (role: architect) with 401 Unauthorized', async () => {
      const architectToken = createToken({
        sub: 'user_architect',
        email: 'arch@test.com',
        role: 'architect',
      })

      const req = {
        method: 'GET',
        headers: {
          authorization: `Bearer ${architectToken}`,
        },
        query: {},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(401)
    })

    it('allows verified admin users (role: admin)', async () => {
      const adminToken = createToken({
        sub: 'admin_user',
        email: 'admin@birim.com',
        role: 'admin',
      })

      const req = {
        method: 'GET',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        query: {},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(200)
      expect(res._json).toMatchObject({
        success: true,
      })
    })

    it('allows break-glass header x-admin-secret matching ADMIN_SECRET', async () => {
      const req = {
        method: 'GET',
        headers: {
          'x-admin-secret': adminSecret,
        },
        query: {},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(200)
      expect(res._json).toMatchObject({
        success: true,
      })
    })

    it('rejects invalid break-glass x-admin-secret', async () => {
      const req = {
        method: 'GET',
        headers: {
          'x-admin-secret': 'wrong-secret-token',
        },
        query: {},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(401)
    })

    it('rejects unsupported HTTP methods (PUT, DELETE, PATCH) with 405 Method Not Allowed', async () => {
      const adminToken = createToken({
        sub: 'admin_user',
        email: 'admin@birim.com',
        role: 'admin',
      })

      const req = {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        query: {},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(405)
      expect(res._json).toMatchObject({
        code: 'METHOD_NOT_ALLOWED',
      })
    })
  })

  describe('3. Client Services: fetchAdminOrdersClient & fetchAdminOrderDetailClient', () => {
    it('fetchAdminOrdersClient calls /api/admin/commerce/orders with query parameters', async () => {
      const mockResult = {
        success: true,
        orders: [
          {
            id: 'ord_1',
            orderNumber: 'BRM-20260916-001',
            customerName: 'Test Müşteri',
            customerEmail: 'test@test.com',
            status: 'PAID',
            paymentStatus: 'PAID',
            currency: 'TRY',
            subtotal: 1000,
            discountTotal: 0,
            shippingTotal: 0,
            taxTotal: 200,
            grandTotal: 1200,
            itemsCount: 1,
            createdAt: '2026-09-16T12:00:00.000Z',
          },
        ],
        pagination: {
          total: 1,
          limit: 20,
          page: 1,
          totalPages: 1,
        },
      }

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult,
      } as Response)

      const res = await fetchAdminOrdersClient({
        params: {
          page: 1,
          limit: 20,
          q: 'test',
          status: 'PAID',
        },
      })

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/commerce/orders?page=1&limit=20&q=test&status=PAID'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      )
      expect(res.orders.length).toBe(1)
      expect(res.pagination.total).toBe(1)

      fetchSpy.mockRestore()
    })

    it('fetchAdminOrderDetailClient calls /api/admin/commerce/orders?orderId=...', async () => {
      const mockDetail = {
        success: true,
        order: {
          id: 'ord_123',
          orderNumber: 'BRM-20260916-123',
          status: 'PAID',
          paymentStatus: 'PAID',
          currency: 'TRY',
          subtotal: 5000,
          discountTotal: 0,
          shippingTotal: 0,
          taxTotal: 1000,
          grandTotal: 6000,
          customerType: 'INDIVIDUAL',
          customerName: 'Ali Demir',
          customerEmail: 'ali@demir.com',
          customerPhone: '+905551234567',
          billingAddress: {},
          shippingAddress: {},
          items: [],
          paymentTransactions: [],
          createdAt: '2026-09-16T12:00:00.000Z',
        },
      }

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDetail,
      } as Response)

      const order = await fetchAdminOrderDetailClient('ord_123')

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/commerce/orders?orderId=ord_123'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      )
      expect(order.id).toBe('ord_123')
      expect(order.grandTotal).toBe(6000)

      fetchSpy.mockRestore()
    })
  })
})
