import {describe, it, expect, beforeEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import adminOrdersHandler from '../../api/admin.js'
import {
  isValidOrderStatusTransition,
  assertValidOrderStatusTransition,
  canCancelOrderStatus,
  canRefundOrderStatus,
  cancelCommerceOrder,
} from '../../lib/commerce/order-lifecycle'
import {
  toMinorUnits,
  fromMinorUnits,
  calculateRefundableAmount,
  createCommerceRefund,
  listOrderRefunds,
} from '../../lib/commerce/refund-service'
import {createToken} from '../../lib/server/token'
import {CommerceValidationError} from '../../lib/commerce/types'
import {listOrderEvents} from '../../lib/commerce/order-events'

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

describe('Phase 6A.5: Order Lifecycle, Cancellation & Refund Foundation', () => {
  const secretKey = 'test-secret-key-at-least-32-chars-long'
  const adminSecret = 'super-secret-admin-break-glass-token'

  beforeEach(() => {
    process.env['JWT_SECRET'] = secretKey
    process.env['ADMIN_SECRET'] = adminSecret
  })

  describe('1. Order Lifecycle State Machine', () => {
    it('allows valid state transitions', () => {
      expect(isValidOrderStatusTransition('PENDING_PAYMENT', 'PAID')).toBe(true)
      expect(isValidOrderStatusTransition('PENDING_PAYMENT', 'CANCELLED')).toBe(true)
      expect(isValidOrderStatusTransition('PENDING_PAYMENT', 'PAYMENT_FAILED')).toBe(true)
      expect(isValidOrderStatusTransition('PAYMENT_FAILED', 'PENDING_PAYMENT')).toBe(true)
      expect(isValidOrderStatusTransition('PAYMENT_FAILED', 'CANCELLED')).toBe(true)
      expect(isValidOrderStatusTransition('PAID', 'PARTIALLY_REFUNDED')).toBe(true)
      expect(isValidOrderStatusTransition('PAID', 'REFUNDED')).toBe(true)
      expect(isValidOrderStatusTransition('PARTIALLY_REFUNDED', 'REFUNDED')).toBe(true)
      expect(isValidOrderStatusTransition('PAID', 'PAID')).toBe(true)
    })

    it('rejects invalid state transitions', () => {
      expect(isValidOrderStatusTransition('PAID', 'PENDING_PAYMENT')).toBe(false)
      expect(isValidOrderStatusTransition('PAID', 'CANCELLED')).toBe(false)
      expect(isValidOrderStatusTransition('REFUNDED', 'PAID')).toBe(false)
      expect(isValidOrderStatusTransition('REFUNDED', 'PARTIALLY_REFUNDED')).toBe(false)
      expect(isValidOrderStatusTransition('CANCELLED', 'PAID')).toBe(false)
      expect(isValidOrderStatusTransition('CANCELLED', 'PENDING_PAYMENT')).toBe(false)
    })

    it('assertValidOrderStatusTransition throws on illegal transition', () => {
      expect(() => assertValidOrderStatusTransition('PAID', 'CANCELLED')).toThrowError(
        CommerceValidationError
      )

      expect(() => assertValidOrderStatusTransition('REFUNDED', 'PAID')).toThrowError(
        CommerceValidationError
      )
    })

    it('canCancelOrderStatus accurately identifies cancellable states', () => {
      expect(canCancelOrderStatus('PENDING_PAYMENT')).toBe(true)
      expect(canCancelOrderStatus('PAYMENT_FAILED')).toBe(true)
      expect(canCancelOrderStatus('PAID')).toBe(false)
      expect(canCancelOrderStatus('PARTIALLY_REFUNDED')).toBe(false)
      expect(canCancelOrderStatus('REFUNDED')).toBe(false)
      expect(canCancelOrderStatus('CANCELLED')).toBe(false)
    })

    it('canRefundOrderStatus accurately identifies refundable states', () => {
      expect(canRefundOrderStatus('PAID')).toBe(true)
      expect(canRefundOrderStatus('PARTIALLY_REFUNDED')).toBe(true)
      expect(canRefundOrderStatus('PENDING_PAYMENT')).toBe(false)
      expect(canRefundOrderStatus('PAYMENT_FAILED')).toBe(false)
      expect(canRefundOrderStatus('CANCELLED')).toBe(false)
      expect(canRefundOrderStatus('REFUNDED')).toBe(false)
    })
  })

  describe('2. Order Cancellation Domain Operations', () => {
    it('cancels an order in PENDING_PAYMENT status successfully', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'PENDING_PAYMENT',
      }

      const res = await cancelCommerceOrder(
        {
          orderId: '11111111-1111-4111-8111-111111111111',
          reason: 'Customer requested cancellation',
        },
        {orderOverride: mockOrder}
      )

      expect(res.success).toBe(true)
      expect(res.alreadyCancelled).toBe(false)
      expect(res.status).toBe('CANCELLED')
      expect(mockOrder.status).toBe('CANCELLED')
    })

    it('cancels an order in PAYMENT_FAILED status successfully', async () => {
      const mockOrder = {
        id: '22222222-2222-4222-8222-222222222222',
        status: 'PAYMENT_FAILED',
      }

      const res = await cancelCommerceOrder(
        {orderId: '22222222-2222-4222-8222-222222222222'},
        {orderOverride: mockOrder}
      )

      expect(res.success).toBe(true)
      expect(res.status).toBe('CANCELLED')
      expect(mockOrder.status).toBe('CANCELLED')
    })

    it('is idempotent: cancelling already CANCELLED order returns alreadyCancelled: true', async () => {
      const mockOrder = {
        id: '33333333-3333-4333-8333-333333333333',
        status: 'CANCELLED',
      }

      const res = await cancelCommerceOrder(
        {orderId: '33333333-3333-4333-8333-333333333333'},
        {orderOverride: mockOrder}
      )

      expect(res.success).toBe(true)
      expect(res.alreadyCancelled).toBe(true)
      expect(res.status).toBe('CANCELLED')
    })

    it('rejects cancellation on PAID order with 422 ORDER_NOT_CANCELLABLE', async () => {
      const mockOrder = {
        id: '44444444-4444-4444-8444-444444444444',
        status: 'PAID',
      }

      await expect(
        cancelCommerceOrder(
          {orderId: '44444444-4444-4444-8444-444444444444'},
          {orderOverride: mockOrder}
        )
      ).rejects.toThrowError(CommerceValidationError)
    })

    it('rejects cancellation on REFUNDED order', async () => {
      const mockOrder = {
        id: '55555555-5555-4555-8555-555555555555',
        status: 'REFUNDED',
      }

      await expect(
        cancelCommerceOrder(
          {orderId: '55555555-5555-4555-8555-555555555555'},
          {orderOverride: mockOrder}
        )
      ).rejects.toThrowError(CommerceValidationError)
    })

    it('rejects invalid non-UUID orderId in cancellation schema', async () => {
      await expect(cancelCommerceOrder({orderId: 'invalid-non-uuid'})).rejects.toThrowError(
        CommerceValidationError
      )
    })
  })

  describe('3. Minor-Unit Money Calculations & Rounding Safety', () => {
    it('converts correctly between major and minor units', () => {
      expect(toMinorUnits(100.0)).toBe(10000)
      expect(toMinorUnits(100.5)).toBe(10050)
      expect(toMinorUnits(0.01)).toBe(1)
      expect(toMinorUnits(999999.99)).toBe(99999999)

      expect(fromMinorUnits(10000)).toBe(100.0)
      expect(fromMinorUnits(10050)).toBe(100.5)
      expect(fromMinorUnits(1)).toBe(0.01)
      expect(fromMinorUnits(99999999)).toBe(999999.99)
    })

    it('accurately resolves 3-part split refund (333.33 + 333.33 + 333.34 = 1000.00)', () => {
      const orderTotal = 1000.0
      const refunds = [
        {amount: 333.33, status: 'SUCCESS'},
        {amount: 333.33, status: 'SUCCESS'},
      ]

      const calc1 = calculateRefundableAmount(orderTotal, refunds)
      expect(calc1.alreadyRefunded).toBe(666.66)
      expect(calc1.remainingRefundable).toBe(333.34)
      expect(calc1.isFullyRefunded).toBe(false)

      const refundsFinal = [...refunds, {amount: 333.34, status: 'SUCCESS'}]
      const calcFinal = calculateRefundableAmount(orderTotal, refundsFinal)
      expect(calcFinal.alreadyRefunded).toBe(1000.0)
      expect(calcFinal.remainingRefundable).toBe(0)
      expect(calcFinal.isFullyRefunded).toBe(true)
    })
  })

  describe('4. Refund Domain Operations & Validations', () => {
    it('processes full refund on PAID order and transitions status to REFUNDED', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'PAID',
        payment_status: 'PAID',
        grand_total: 15000,
        currency: 'TRY',
      }
      const mockRefunds: Array<Record<string, unknown>> = []

      const result = await createCommerceRefund(
        {
          orderId: '11111111-1111-4111-8111-111111111111',
          amount: 15000,
          reason: 'Müşteri iade talebi onaylandı',
        },
        {orderOverride: mockOrder, refundsOverride: mockRefunds}
      )

      expect(result.success).toBe(true)
      expect(result.isExisting).toBe(false)
      expect(result.amount).toBe(15000)
      expect(result.orderStatus).toBe('REFUNDED')
      expect(result.remainingRefundable).toBe(0)
      expect(mockOrder.status).toBe('REFUNDED')
      expect(mockRefunds.length).toBe(1)
    })

    it('processes partial refund on PAID order and transitions status to PARTIALLY_REFUNDED', async () => {
      const mockOrder = {
        id: '22222222-2222-4222-8222-222222222222',
        status: 'PAID',
        payment_status: 'PAID',
        grand_total: 10000,
        currency: 'TRY',
      }
      const mockRefunds: Array<Record<string, unknown>> = []

      const result = await createCommerceRefund(
        {
          orderId: '22222222-2222-4222-8222-222222222222',
          amount: 2500,
          reason: 'Kısmi hasarlı ürün iadesi',
        },
        {orderOverride: mockOrder, refundsOverride: mockRefunds}
      )

      expect(result.success).toBe(true)
      expect(result.amount).toBe(2500)
      expect(result.orderStatus).toBe('PARTIALLY_REFUNDED')
      expect(result.remainingRefundable).toBe(7500)
      expect(mockOrder.status).toBe('PARTIALLY_REFUNDED')
    })

    it('supports multiple partial refunds until remaining amount reaches zero', async () => {
      const mockOrder = {
        id: '33333333-3333-4333-8333-333333333333',
        status: 'PAID',
        payment_status: 'PAID',
        grand_total: 1000,
        currency: 'TRY',
      }
      const mockRefunds: Array<Record<string, unknown>> = []

      // Refund 1: 400 TL
      const r1 = await createCommerceRefund(
        {orderId: mockOrder.id, amount: 400, reason: '1. Parça iadesi'},
        {orderOverride: mockOrder, refundsOverride: mockRefunds}
      )
      expect(r1.orderStatus).toBe('PARTIALLY_REFUNDED')
      expect(r1.remainingRefundable).toBe(600)

      // Refund 2: 350 TL
      const r2 = await createCommerceRefund(
        {orderId: mockOrder.id, amount: 350, reason: '2. Parça iadesi'},
        {orderOverride: mockOrder, refundsOverride: mockRefunds}
      )
      expect(r2.orderStatus).toBe('PARTIALLY_REFUNDED')
      expect(r2.remainingRefundable).toBe(250)

      // Refund 3: Kalan 250 TL
      const r3 = await createCommerceRefund(
        {orderId: mockOrder.id, amount: 250, reason: 'Kalan tutar iadesi'},
        {orderOverride: mockOrder, refundsOverride: mockRefunds}
      )
      expect(r3.orderStatus).toBe('REFUNDED')
      expect(r3.remainingRefundable).toBe(0)
      expect(mockOrder.status).toBe('REFUNDED')
      expect(mockRefunds.length).toBe(3)
    })

    it('rejects over-refund exceeding remaining refundable amount', async () => {
      const mockOrder = {
        id: '44444444-4444-4444-8444-444444444444',
        status: 'PAID',
        payment_status: 'PAID',
        grand_total: 1000,
        currency: 'TRY',
      }
      const mockRefunds = [{id: 'ref_1', amount: 800, status: 'SUCCESS'}]

      await expect(
        createCommerceRefund(
          {orderId: mockOrder.id, amount: 300, reason: 'Over-refund test'},
          {orderOverride: mockOrder, refundsOverride: mockRefunds}
        )
      ).rejects.toThrowError(CommerceValidationError)
    })

    it('rejects zero or negative refund amount', async () => {
      await expect(
        createCommerceRefund({
          orderId: '55555555-5555-4555-8555-555555555555',
          amount: 0,
          reason: 'Zero refund',
        })
      ).rejects.toThrowError(CommerceValidationError)

      await expect(
        createCommerceRefund({
          orderId: '55555555-5555-4555-8555-555555555555',
          amount: -50,
          reason: 'Negative refund',
        })
      ).rejects.toThrowError(CommerceValidationError)
    })

    it('rejects refund on unpaid order (PENDING_PAYMENT)', async () => {
      const mockOrder = {
        id: '66666666-6666-4666-8666-666666666666',
        status: 'PENDING_PAYMENT',
        grand_total: 1000,
      }

      await expect(
        createCommerceRefund(
          {orderId: mockOrder.id, amount: 500, reason: 'Test'},
          {orderOverride: mockOrder}
        )
      ).rejects.toThrowError(CommerceValidationError)
    })

    it('rejects refund on CANCELLED order', async () => {
      const mockOrder = {
        id: '77777777-7777-4777-8777-777777777777',
        status: 'CANCELLED',
        grand_total: 1000,
      }

      await expect(
        createCommerceRefund(
          {orderId: mockOrder.id, amount: 500, reason: 'Test'},
          {orderOverride: mockOrder}
        )
      ).rejects.toThrowError(CommerceValidationError)
    })
  })

  describe('5. Refund Idempotency', () => {
    it('returns existing refund record when same idempotency key and amount are reused', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'PAID',
        grand_total: 5000,
      }
      const mockRefunds = [
        {
          id: 'ref_existing_123',
          order_id: mockOrder.id,
          amount: 2000,
          status: 'SUCCESS',
          reason: 'İlk talep',
          idempotency_key: 'idem_key_abc',
          created_at: '2026-09-16T10:00:00.000Z',
        },
      ]

      const res = await createCommerceRefund(
        {
          orderId: mockOrder.id,
          amount: 2000,
          reason: 'Aynı talep tekrarı',
          idempotencyKey: 'idem_key_abc',
        },
        {orderOverride: mockOrder, refundsOverride: mockRefunds}
      )

      expect(res.success).toBe(true)
      expect(res.isExisting).toBe(true)
      expect(res.refundId).toBe('ref_existing_123')
      expect(res.amount).toBe(2000)
    })

    it('rejects with 409 REFUND_IDEMPOTENCY_KEY_REUSED when same key is used with different amount', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'PAID',
        grand_total: 5000,
      }
      const mockRefunds = [
        {
          id: 'ref_existing_123',
          order_id: mockOrder.id,
          amount: 2000,
          status: 'SUCCESS',
          idempotency_key: 'idem_key_abc',
        },
      ]

      await expect(
        createCommerceRefund(
          {
            orderId: mockOrder.id,
            amount: 3000, // Different amount
            reason: 'Mismatch amount',
            idempotencyKey: 'idem_key_abc',
          },
          {orderOverride: mockOrder, refundsOverride: mockRefunds}
        )
      ).rejects.toThrowError(CommerceValidationError)
    })
  })

  describe('6. Admin API Security & Endpoint Actions', () => {
    it('rejects unauthenticated POST requests with 401', async () => {
      const req = {
        method: 'POST',
        headers: {},
        query: {action: 'cancel'},
        body: {orderId: '11111111-1111-4111-8111-111111111111'},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(401)
      expect(res._json).toMatchObject({code: 'UNAUTHORIZED'})
    })

    it('rejects consumer or architect roles with 401', async () => {
      const consumerToken = createToken({sub: 'user_1', email: 'c@c.com', role: 'consumer'})
      const req = {
        method: 'POST',
        headers: {authorization: `Bearer ${consumerToken}`},
        query: {action: 'refund'},
        body: {orderId: '11111111-1111-4111-8111-111111111111', amount: 100, reason: 'Test'},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(401)
    })

    it('rejects unknown POST action with 400 INVALID_ACTION', async () => {
      const adminToken = createToken({sub: 'admin_1', email: 'a@a.com', role: 'admin'})
      const req = {
        method: 'POST',
        headers: {authorization: `Bearer ${adminToken}`},
        query: {action: 'invalid_action'},
        body: {orderId: '11111111-1111-4111-8111-111111111111'},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(400)
      expect(res._json).toMatchObject({code: 'INVALID_ACTION'})
    })

    it('rejects client attempting to tamper by sending currency, orderStatus or provider in refund request', async () => {
      await expect(
        createCommerceRefund({
          orderId: '11111111-1111-4111-8111-111111111111',
          amount: 500,
          reason: 'Test',
          currency: 'USD', // Forged field forbidden by .strict()
        })
      ).rejects.toThrowError(CommerceValidationError)
    })
  })

  describe('7. Audit Trail & Events Listing', () => {
    it('lists order events accurately', async () => {
      const mockEvents = [
        {
          id: 'ev_1',
          orderId: '11111111-1111-4111-8111-111111111111',
          eventType: 'ORDER_CREATED',
          actorType: 'customer' as const,
          createdAt: '2026-09-16T10:00:00.000Z',
        },
        {
          id: 'ev_2',
          orderId: '11111111-1111-4111-8111-111111111111',
          eventType: 'REFUND_SUCCEEDED',
          actorType: 'admin' as const,
          createdAt: '2026-09-16T11:00:00.000Z',
        },
      ]

      const events = await listOrderEvents('11111111-1111-4111-8111-111111111111', {
        eventsOverride: mockEvents,
      })

      expect(events.length).toBe(2)
      expect(events[0]?.eventType).toBe('ORDER_CREATED')
      expect(events[1]?.eventType).toBe('REFUND_SUCCEEDED')
    })

    it('listOrderRefunds filters correctly by orderId', async () => {
      const mockRefunds = [
        {
          id: 'ref_1',
          order_id: 'ord_aaa',
          amount: 100,
          currency: 'TRY',
          status: 'SUCCESS',
          reason: 'Test 1',
        },
        {
          id: 'ref_2',
          order_id: 'ord_bbb',
          amount: 200,
          currency: 'TRY',
          status: 'SUCCESS',
          reason: 'Test 2',
        },
      ]

      const res = await listOrderRefunds('ord_aaa', {refundsOverride: mockRefunds})
      expect(res.length).toBe(1)
      expect(res[0]?.id).toBe('ref_1')
      expect(res[0]?.amount).toBe(100)
    })
  })

  describe('8. Client Services & Break-Glass Authorization', () => {
    it('executes cancellation via break-glass x-admin-secret header', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'PENDING_PAYMENT',
      }

      const origCancel = await cancelCommerceOrder(
        {orderId: mockOrder.id, reason: 'Break-glass cancellation'},
        {orderOverride: mockOrder}
      )
      expect(origCancel.success).toBe(true)
    })

    it('executes refund via break-glass x-admin-secret header', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'PAID',
        grand_total: 1000,
      }

      const origRefund = await createCommerceRefund(
        {orderId: mockOrder.id, amount: 500, reason: 'Break-glass refund'},
        {orderOverride: mockOrder, refundsOverride: []}
      )
      expect(origRefund.success).toBe(true)
      expect(origRefund.amount).toBe(500)
    })

    it('rejects break-glass header when secret is incorrect', async () => {
      const req = {
        method: 'POST',
        headers: {'x-admin-secret': 'wrong-admin-secret'},
        query: {action: 'cancel'},
        body: {orderId: '11111111-1111-4111-8111-111111111111'},
      } as unknown as VercelRequest

      const res = createMockRes()
      await adminOrdersHandler(req, res as unknown as VercelResponse)

      expect(res._status).toBe(401)
      expect(res._json).toMatchObject({code: 'UNAUTHORIZED'})
    })

    it('cancels order with empty reason field gracefully', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'PENDING_PAYMENT',
      }

      const res = await cancelCommerceOrder({orderId: mockOrder.id}, {orderOverride: mockOrder})

      expect(res.success).toBe(true)
      expect(res.status).toBe('CANCELLED')
    })
  })
})
