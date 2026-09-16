import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {initiatePayment, getPaymentStatus} from '../../lib/commerce/payment/payment-service'
import {
  isValidPaymentTransition,
  assertValidPaymentTransition,
} from '../../lib/commerce/payment/state-machine'
import {PaymentError} from '../../lib/commerce/payment/errors'
import {createGuestOrderToken} from '../../lib/commerce/payment/guest-auth'
import type {PaymentProvider} from '../../lib/commerce/payment/provider'

describe('Phase 6A.3 — Payment Recovery, Retry & Commerce Hardening', () => {
  const baseOrder = {
    id: 'ord-retry-123',
    order_number: 'BRM-20260916-RETRY1',
    user_id: 'user-owner-1',
    status: 'PENDING_PAYMENT',
    payment_status: 'PENDING',
    currency: 'TRY',
    grand_total: 25000,
    customer_name: 'Ahmet Yilmaz',
    customer_email: 'ahmet@example.com',
    billing_address_snapshot: {},
    shipping_address_snapshot: {},
  }

  const mockProvider: PaymentProvider = {
    id: 'mock',
    name: 'Mock Payment Provider',
    createPaymentIntent: vi.fn(async _input => ({
      providerTransactionId: `prov_tx_${Date.now()}`,
      status: 'PROCESSING',
    })),
    getPaymentStatus: vi.fn(async () => ({
      status: 'PAID',
    })),
    verifyCallback: vi.fn(async input => {
      const payload = input.payload as {
        paymentTransactionId?: string
        orderId?: string
        status?: import('../../lib/commerce/payment/types').PaymentIntentStatus
        eventId?: string
      }
      return {
        provider: 'mock',
        providerEventId: payload.eventId || `evt_${Date.now()}`,
        paymentTransactionId: payload.paymentTransactionId,
        orderId: payload.orderId,
        status: payload.status || 'PAID',
        occurredAt: new Date().toISOString(),
      }
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. Payment Retry & Lifecycle', () => {
    it('allows payment initiation on a PENDING_PAYMENT order after previous FAILED attempt', async () => {
      const order = {...baseOrder, payment_status: 'FAILED'}
      const intent = await initiatePayment(
        {orderId: order.id},
        {userId: 'user-owner-1', orderOverride: order, providerOverride: mockProvider}
      )

      expect(intent.orderId).toBe(order.id)
      expect(intent.orderNumber).toBe(order.order_number)
      expect(intent.status).toBe('PROCESSING')
    })

    it('allows payment initiation on a PENDING_PAYMENT order after previous CANCELLED attempt', async () => {
      const order = {...baseOrder, payment_status: 'CANCELLED'}
      const intent = await initiatePayment(
        {orderId: order.id},
        {userId: 'user-owner-1', orderOverride: order, providerOverride: mockProvider}
      )

      expect(intent.orderId).toBe(order.id)
      expect(intent.status).toBe('PROCESSING')
    })

    it('retry payment uses existing order and does NOT require or create a new order', async () => {
      const order = {...baseOrder}
      const intent1 = await initiatePayment(
        {orderId: order.id},
        {userId: 'user-owner-1', orderOverride: order, providerOverride: mockProvider}
      )
      const intent2 = await initiatePayment(
        {orderId: order.id},
        {userId: 'user-owner-1', orderOverride: order, providerOverride: mockProvider}
      )

      expect(intent1.orderId).toBe(order.id)
      expect(intent2.orderId).toBe(order.id)
      expect(intent1.orderNumber).toBe(order.order_number)
    })

    it('retry payment derives amount and currency strictly from server order snapshot', async () => {
      const order = {...baseOrder, grand_total: 49999.9, currency: 'TRY'}
      const intent = await initiatePayment(
        {orderId: order.id},
        {userId: 'user-owner-1', orderOverride: order, providerOverride: mockProvider}
      )

      expect(intent.amount).toBe(49999.9)
      expect(intent.amountMinor).toBe(4999990)
      expect(intent.currency).toBe('TRY')
    })

    it('strictly rejects client amount or currency injection (Security tampering protection)', async () => {
      const order = {...baseOrder}
      await expect(
        initiatePayment(
          {orderId: order.id, amount: 10, currency: 'USD'},
          {userId: 'user-owner-1', orderOverride: order, providerOverride: mockProvider}
        )
      ).rejects.toThrow(PaymentError)
    })
  })

  describe('2. Idempotency & Concurrency', () => {
    it('scopes idempotency key by order to prevent collision across different orders', async () => {
      const order1 = {...baseOrder, id: 'ord-1'}
      const intent1 = await initiatePayment(
        {orderId: 'ord-1', idempotencyKey: 'key-123'},
        {userId: 'user-owner-1', orderOverride: order1, providerOverride: mockProvider}
      )

      expect(intent1.orderId).toBe('ord-1')
    })

    it('rejects payment on an already PAID order (409 PAYMENT_ALREADY_PAID)', async () => {
      const paidOrder = {...baseOrder, status: 'PAID', payment_status: 'PAID'}

      await expect(
        initiatePayment(
          {orderId: paidOrder.id},
          {userId: 'user-owner-1', orderOverride: paidOrder, providerOverride: mockProvider}
        )
      ).rejects.toThrow('Bu siparişin ödemesi zaten tamamlanmıştır.')
    })
  })

  describe('3. Payment State Machine Integrity', () => {
    it('allows valid state transitions', () => {
      expect(isValidPaymentTransition('PENDING', 'PROCESSING')).toBe(true)
      expect(isValidPaymentTransition('PROCESSING', 'PAID')).toBe(true)
      expect(isValidPaymentTransition('PROCESSING', 'FAILED')).toBe(true)
      expect(isValidPaymentTransition('PROCESSING', 'CANCELLED')).toBe(true)
      expect(isValidPaymentTransition('PAID', 'REFUNDED')).toBe(true)
      expect(isValidPaymentTransition('PAID', 'PARTIALLY_REFUNDED')).toBe(true)
    })

    it('rejects invalid state transitions (e.g. FAILED -> PAID or CANCELLED -> PAID)', () => {
      expect(isValidPaymentTransition('FAILED', 'PAID')).toBe(false)
      expect(isValidPaymentTransition('CANCELLED', 'PAID')).toBe(false)
      expect(isValidPaymentTransition('REFUNDED', 'PAID')).toBe(false)

      expect(() => assertValidPaymentTransition('FAILED', 'PAID')).toThrow(PaymentError)
      expect(() => assertValidPaymentTransition('CANCELLED', 'PAID')).toThrow(PaymentError)
    })
  })

  describe('4. Payment Status Query & Recovery', () => {
    it('retrieves authoritative payment status for authenticated user', async () => {
      const mockTx = {
        id: 'tx-query-101',
        order_id: 'ord-retry-123',
        provider: 'mock',
        amount: 25000,
        currency: 'TRY',
        status: 'PAID',
        created_at: '2026-09-16T12:00:00Z',
        order: {
          id: 'ord-retry-123',
          user_id: 'user-owner-1',
          order_number: 'BRM-20260916-RETRY1',
        },
      }

      const result = await getPaymentStatus('tx-query-101', {
        userId: 'user-owner-1',
        transactionOverride: mockTx,
      })

      expect(result.id).toBe('tx-query-101')
      expect(result.orderId).toBe('ord-retry-123')
      expect(result.status).toBe('PAID')
      expect(result.amount).toBe(25000)
    })

    it('enforces IDOR protection: rejects querying payment of another user', async () => {
      const mockTx = {
        id: 'tx-query-101',
        order_id: 'ord-retry-123',
        provider: 'mock',
        amount: 25000,
        currency: 'TRY',
        status: 'PAID',
        created_at: '2026-09-16T12:00:00Z',
        order: {
          id: 'ord-retry-123',
          user_id: 'user-owner-1',
          order_number: 'BRM-20260916-RETRY1',
        },
      }

      await expect(
        getPaymentStatus('tx-query-101', {
          userId: 'attacker-user-999', // Different user
          transactionOverride: mockTx,
        })
      ).rejects.toThrow('Bu ödeme işlemine erişim yetkiniz bulunmamaktadır.')
    })

    it('enforces guest token validation for guest payment status lookup', async () => {
      const guestTx = {
        id: 'tx-guest-202',
        order_id: 'ord-guest-999',
        provider: 'mock',
        amount: 15000,
        currency: 'TRY',
        status: 'PENDING',
        created_at: '2026-09-16T14:00:00Z',
        order: {
          id: 'ord-guest-999',
          user_id: null,
          order_number: 'BRM-20260916-GST999',
        },
      }

      const validGuestToken = createGuestOrderToken('ord-guest-999', 'BRM-20260916-GST999')

      // Valid token -> success
      const result = await getPaymentStatus('tx-guest-202', {
        userId: null,
        guestToken: validGuestToken,
        transactionOverride: guestTx,
      })
      expect(result.id).toBe('tx-guest-202')
      expect(result.orderId).toBe('ord-guest-999')

      // Invalid token -> 403 error
      await expect(
        getPaymentStatus('tx-guest-202', {
          userId: null,
          guestToken: 'tampered-token',
          transactionOverride: guestTx,
        })
      ).rejects.toThrow('Misafir siparişi için geçerli yetki anahtarı sağlanmadı.')
    })
  })

  describe('5. Security & Isolation', () => {
    it('forbids unauthenticated user from initiating payment on authenticated user order', async () => {
      const authOrder = {...baseOrder, user_id: 'user-owner-1'}

      await expect(
        initiatePayment(
          {orderId: authOrder.id},
          {userId: null, orderOverride: authOrder, providerOverride: mockProvider}
        )
      ).rejects.toThrow('Bu sipariş için ödeme başlatma yetkiniz bulunmamaktadır.')
    })

    it('forbids different authenticated user from initiating payment on another user order (IDOR)', async () => {
      const authOrder = {...baseOrder, user_id: 'user-owner-1'}

      await expect(
        initiatePayment(
          {orderId: authOrder.id},
          {userId: 'attacker-222', orderOverride: authOrder, providerOverride: mockProvider}
        )
      ).rejects.toThrow('Bu sipariş için ödeme başlatma yetkiniz bulunmamaktadır.')
    })

    it('rejects guest payment initiation without valid signed HMAC guestToken', async () => {
      const guestOrder = {...baseOrder, user_id: null}

      await expect(
        initiatePayment(
          {orderId: guestOrder.id, guestToken: 'invalid-token'},
          {userId: null, orderOverride: guestOrder, providerOverride: mockProvider}
        )
      ).rejects.toThrow('Misafir siparişi için geçerli erişim anahtarı sağlanmadı.')
    })
  })
})
