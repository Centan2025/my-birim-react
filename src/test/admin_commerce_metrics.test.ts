import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {
  calculateCommerceMetrics,
  resolveDateRange,
  getAdminCommerceMetrics,
} from '../../lib/commerce/admin-metrics-service.js'
import adminHandler from '../../api/admin.js'
import {createToken} from '../../lib/server/token.js'
import {CommerceValidationError} from '../../lib/commerce/types.js'

function createMockReqRes(overrides?: {
  method?: string
  url?: string
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
}) {
  const req = {
    method: overrides?.method || 'GET',
    url: overrides?.url || '/api/admin/commerce/metrics',
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

describe('Commerce Metrics Service & API (Phase 1)', () => {
  const TEST_ADMIN_SECRET = 'test_secret_for_admin_break_glass_12345'
  const fixedNow = new Date('2026-09-17T12:00:00.000Z')

  beforeEach(() => {
    process.env['ADMIN_SECRET'] = TEST_ADMIN_SECRET
    process.env['JWT_SECRET'] = 'test_jwt_secret_for_metrics_suite_12345'
  })

  afterEach(() => {
    delete process.env['ADMIN_SECRET']
    delete process.env['JWT_SECRET']
  })

  describe('resolveDateRange', () => {
    it('resolves 30d by default', () => {
      const {range, fromDate, toDate} = resolveDateRange({}, fixedNow)
      expect(range).toBe('30d')
      expect(toDate.toISOString()).toBe(fixedNow.toISOString())
      expect(fromDate.toISOString()).toBe('2026-08-18T12:00:00.000Z')
    })

    it('resolves today correctly from UTC midnight', () => {
      const {range, fromDate, toDate} = resolveDateRange({range: 'today'}, fixedNow)
      expect(range).toBe('today')
      expect(fromDate.toISOString()).toBe('2026-09-17T00:00:00.000Z')
      expect(toDate.toISOString()).toBe(fixedNow.toISOString())
    })

    it('resolves 7d and 90d', () => {
      const r7 = resolveDateRange({range: '7d'}, fixedNow)
      expect(r7.range).toBe('7d')
      expect(r7.fromDate.toISOString()).toBe('2026-09-10T12:00:00.000Z')

      const r90 = resolveDateRange({range: '90d'}, fixedNow)
      expect(r90.range).toBe('90d')
      expect(r90.fromDate.toISOString()).toBe('2026-06-19T12:00:00.000Z')
    })

    it('resolves valid custom date range', () => {
      const custom = resolveDateRange(
        {from: '2026-01-01T00:00:00.000Z', to: '2026-01-15T00:00:00.000Z'},
        fixedNow
      )
      expect(custom.range).toBe('custom')
      expect(custom.fromDate.toISOString()).toBe('2026-01-01T00:00:00.000Z')
      expect(custom.toDate.toISOString()).toBe('2026-01-15T00:00:00.000Z')
    })

    it('throws 400 on invalid range string', () => {
      expect(() => resolveDateRange({range: 'invalid_range'}, fixedNow)).toThrow(
        CommerceValidationError
      )
    })

    it('throws 400 on invalid ISO date format', () => {
      expect(() => resolveDateRange({from: 'not-a-date'}, fixedNow)).toThrow(
        CommerceValidationError
      )
    })

    it('throws 400 when fromDate is after toDate', () => {
      expect(() =>
        resolveDateRange(
          {from: '2026-09-20T00:00:00.000Z', to: '2026-09-10T00:00:00.000Z'},
          fixedNow
        )
      ).toThrow(CommerceValidationError)
    })
  })

  describe('calculateCommerceMetrics (authoritative calculations)', () => {
    it('correctly computes Net Sales, Paid Orders, AOV, and Refund Subtraction', () => {
      const mockOrders = [
        {
          id: 'ord-1',
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'TRY',
          grand_total: 10000,
          created_at: '2026-09-15T10:00:00.000Z',
        },
        {
          id: 'ord-2',
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'TRY',
          grand_total: 20000,
          created_at: '2026-09-16T10:00:00.000Z',
        },
        {
          id: 'ord-3',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          grand_total: 5000,
          created_at: '2026-09-17T10:00:00.000Z',
        },
      ]

      const mockRefunds = [
        {
          id: 'ref-1',
          order_id: 'ord-2',
          status: 'SUCCESS',
          amount: 5000,
          currency: 'TRY',
          created_at: '2026-09-16T14:00:00.000Z',
        },
      ]

      const from = new Date('2026-09-01T00:00:00.000Z')
      const to = new Date('2026-09-17T23:59:59.000Z')
      const result = calculateCommerceMetrics(mockOrders, mockRefunds, '30d', from, to)

      expect(result.metrics['TRY']).toBeDefined()
      const tryMetrics = result.metrics['TRY']!

      expect(tryMetrics.paidOrdersCount).toBe(2)
      expect(tryMetrics.pendingPaymentsCount).toBe(1)
      expect(tryMetrics.grossSales).toBe(30000)
      expect(tryMetrics.refundTotal).toBe(5000)
      expect(tryMetrics.netSales).toBe(25000)
      // AOV = 25000 / 2 = 12500
      expect(tryMetrics.averageOrderValue).toBe(12500)
    })

    it('safely handles zero paid orders without division by zero (AOV = 0)', () => {
      const from = new Date('2026-09-01T00:00:00.000Z')
      const to = new Date('2026-09-17T23:59:59.000Z')
      const result = calculateCommerceMetrics([], [], '30d', from, to)

      const tryMetrics = result.metrics['TRY']!
      expect(tryMetrics.paidOrdersCount).toBe(0)
      expect(tryMetrics.grossSales).toBe(0)
      expect(tryMetrics.netSales).toBe(0)
      expect(tryMetrics.refundTotal).toBe(0)
      expect(tryMetrics.averageOrderValue).toBe(0)
      expect(isNaN(tryMetrics.averageOrderValue)).toBe(false)
    })

    it('isolates multiple currencies without mathematical mixing', () => {
      const mockOrders = [
        {
          id: 'ord-try',
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'TRY',
          grand_total: 10000,
          created_at: '2026-09-15T10:00:00.000Z',
        },
        {
          id: 'ord-eur',
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'EUR',
          grand_total: 500,
          created_at: '2026-09-16T10:00:00.000Z',
        },
      ]

      const from = new Date('2026-09-01T00:00:00.000Z')
      const to = new Date('2026-09-17T23:59:59.000Z')
      const result = calculateCommerceMetrics(mockOrders, [], '30d', from, to)

      expect(result.metrics['TRY']?.grossSales).toBe(10000)
      expect(result.metrics['EUR']?.grossSales).toBe(500)
      expect(result.metrics['TRY']?.paidOrdersCount).toBe(1)
      expect(result.metrics['EUR']?.paidOrdersCount).toBe(1)
    })

    it('generates chronological daily trend points', () => {
      const mockOrders = [
        {
          id: 'ord-1',
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'TRY',
          grand_total: 12000,
          created_at: '2026-09-15T10:00:00.000Z',
        },
        {
          id: 'ord-2',
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'TRY',
          grand_total: 8000,
          created_at: '2026-09-16T10:00:00.000Z',
        },
      ]

      const from = new Date('2026-09-01T00:00:00.000Z')
      const to = new Date('2026-09-17T23:59:59.000Z')
      const result = calculateCommerceMetrics(mockOrders, [], '30d', from, to)

      expect(result.daily.length).toBe(2)
      expect(result.daily[0]?.date).toBe('2026-09-15')
      expect(result.daily[0]?.grossSales).toBe(12000)
      expect(result.daily[1]?.date).toBe('2026-09-16')
      expect(result.daily[1]?.grossSales).toBe(8000)
    })

    it('getAdminCommerceMetrics works with in-memory overrides', async () => {
      const mockOrders = [
        {
          id: 'ord-override-1',
          status: 'PAID',
          payment_status: 'PAID',
          currency: 'TRY',
          grand_total: 50000,
          created_at: '2026-09-10T10:00:00.000Z',
        },
      ]

      const res = await getAdminCommerceMetrics(
        {range: '30d'},
        {
          ordersOverride: mockOrders,
          refundsOverride: [],
          nowOverride: fixedNow,
        }
      )

      expect(res.range).toBe('30d')
      expect(res.metrics['TRY']?.paidOrdersCount).toBe(1)
      expect(res.metrics['TRY']?.grossSales).toBe(50000)
    })
  })

  describe('Admin Router /api/admin/commerce/metrics', () => {
    it('rejects unauthorized requests with 401 UNAUTHORIZED', async () => {
      const {req, res} = createMockReqRes({
        url: '/api/admin/commerce/metrics',
      })

      await adminHandler(req, res)
      expect(res.statusCode).toBe(401)
      expect((res.body as Record<string, unknown>)['code']).toBe('UNAUTHORIZED')
    })

    it('authorizes requests with valid admin JWT token', async () => {
      const token = createToken({
        sub: 'admin-user-1',
        email: 'admin@birim.com',
        role: 'admin',
      })

      const {req, res} = createMockReqRes({
        url: '/api/admin/commerce/metrics',
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      await adminHandler(req, res)
      expect(res.statusCode).toBe(200)
      const body = res.body as Record<string, unknown>
      expect(body['success']).toBe(true)
      expect(body['metrics']).toBeDefined()
      expect(body['range']).toBe('30d')
    })

    it('authorizes requests with break-glass x-admin-secret header', async () => {
      const {req, res} = createMockReqRes({
        url: '/api/admin/commerce/metrics',
        headers: {
          'x-admin-secret': TEST_ADMIN_SECRET,
        },
      })

      await adminHandler(req, res)
      expect(res.statusCode).toBe(200)
      const body = res.body as Record<string, unknown>
      expect(body['success']).toBe(true)
    })

    it('returns 400 on invalid range query parameter', async () => {
      const {req, res} = createMockReqRes({
        url: '/api/admin/commerce/metrics?range=malformed_range',
        query: {range: 'malformed_range'},
        headers: {
          'x-admin-secret': TEST_ADMIN_SECRET,
        },
      })

      await adminHandler(req, res)
      expect(res.statusCode).toBe(400)
      const body = res.body as Record<string, unknown>
      expect(body['code']).toBe('INVALID_REQUEST')
    })

    it('strictly guarantees ZERO PII is present in the response body', async () => {
      const token = createToken({
        sub: 'admin-user-1',
        email: 'admin@birim.com',
        role: 'admin',
      })

      const {req, res} = createMockReqRes({
        url: '/api/admin/commerce/metrics',
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      await adminHandler(req, res)
      expect(res.statusCode).toBe(200)

      const jsonStr = JSON.stringify(res.body)
      expect(jsonStr).not.toContain('customer_name')
      expect(jsonStr).not.toContain('customer_email')
      expect(jsonStr).not.toContain('customer_phone')
      expect(jsonStr).not.toContain('billing_address')
      expect(jsonStr).not.toContain('shipping_address')
      expect(jsonStr).not.toContain('ip_address')
    })
  })
})
