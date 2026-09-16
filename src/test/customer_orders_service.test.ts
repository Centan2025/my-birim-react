import {describe, it, expect} from 'vitest'
import {listCommerceOrdersForUser, getCommerceOrderById} from '../../lib/commerce/order-service'
import {createGuestOrderToken} from '../../lib/commerce/payment/guest-auth'
import {CommerceValidationError} from '../../lib/commerce/types'

describe('Phase 6A.2 — Customer Order History & Detail Services', () => {
  const mockOrders = [
    {
      id: 'ord-101',
      order_number: 'BRM-20260916-AAA111',
      user_id: 'user-auth-123',
      status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
      currency: 'TRY',
      subtotal: 30000,
      discount_total: 0,
      shipping_total: 0,
      tax_total: 0,
      grand_total: 30000,
      created_at: '2026-09-16T10:00:00Z',
      items: [
        {
          product_id: 'prod-gala',
          variant_id: null,
          product_name_snapshot: 'Gala Sandalye',
          sku_snapshot: 'BRM-GAL-001',
          selected_options_snapshot: {Renk: 'Siyah'},
          quantity: 2,
          unit_price: 15000,
          total_price: 30000,
        },
      ],
    },
    {
      id: 'ord-102',
      order_number: 'BRM-20260916-BBB222',
      user_id: 'user-auth-123',
      status: 'CONFIRMED',
      payment_status: 'PAID',
      currency: 'TRY',
      subtotal: 45000,
      discount_total: 0,
      shipping_total: 0,
      tax_total: 0,
      grand_total: 45000,
      created_at: '2026-09-16T12:00:00Z',
      items: [
        {
          product_id: 'prod-era',
          variant_id: 'var-walnut-180',
          product_name_snapshot: 'Era Çalışma Masası',
          sku_snapshot: 'BRM-ERA-WAL-180',
          selected_options_snapshot: {Malzeme: 'Ceviz', Ölçü: '180x90'},
          quantity: 1,
          unit_price: 45000,
          total_price: 45000,
        },
      ],
    },
    {
      id: 'ord-999',
      order_number: 'BRM-20260916-ZZZ999',
      user_id: 'user-different-456',
      status: 'CONFIRMED',
      payment_status: 'PAID',
      currency: 'TRY',
      subtotal: 50000,
      discount_total: 0,
      shipping_total: 0,
      tax_total: 0,
      grand_total: 50000,
      created_at: '2026-09-16T08:00:00Z',
      items: [],
    },
  ]

  describe('listCommerceOrdersForUser', () => {
    it('throws error when userId is missing or empty', async () => {
      await expect(listCommerceOrdersForUser('')).rejects.toThrow(CommerceValidationError)
      await expect(listCommerceOrdersForUser('  ')).rejects.toThrow(CommerceValidationError)
    })

    it('returns customer order summaries correctly when orders are passed', async () => {
      const userOrders = mockOrders.filter(o => o.user_id === 'user-auth-123')
      const result = await listCommerceOrdersForUser('user-auth-123', {
        ordersOverride: userOrders,
      })

      expect(result).toHaveLength(2)
      expect(result[0]?.orderNumber).toBe('BRM-20260916-AAA111')
      expect(result[0]?.grandTotal).toBe(30000)
      expect(result[0]?.itemsCount).toBe(1)
      expect(result[0]?.paymentStatus).toBe('PENDING')

      expect(result[1]?.orderNumber).toBe('BRM-20260916-BBB222')
      expect(result[1]?.paymentStatus).toBe('PAID')
    })
  })

  describe('getCommerceOrderById — IDOR Protection & Authorization', () => {
    it('throws 400 if orderId is missing', async () => {
      await expect(getCommerceOrderById('')).rejects.toThrow(CommerceValidationError)
    })

    it('allows authenticated owner to view their order', async () => {
      const targetOrder = mockOrders[0]!
      const result = await getCommerceOrderById('ord-101', {
        userId: 'user-auth-123',
        orderOverride: targetOrder,
      })

      expect(result.id).toBe('ord-101')
      expect(result.orderNumber).toBe('BRM-20260916-AAA111')
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.productName).toBe('Gala Sandalye')
      expect(result.items[0]?.selectedOptions).toEqual({Renk: 'Siyah'})
      expect(result.grandTotal).toBe(30000)
    })

    it('strictly forbids other authenticated users from viewing the order (IDOR Prevention)', async () => {
      const targetOrder = mockOrders[0]! // belongs to user-auth-123

      await expect(
        getCommerceOrderById('ord-101', {
          userId: 'attacker-user-789', // different user
          orderOverride: targetOrder,
        })
      ).rejects.toThrow('Bu sipariş bilgilerini görüntüleme yetkiniz bulunmamaktadır.')
    })

    it('strictly forbids unauthenticated users from viewing user orders without auth', async () => {
      const targetOrder = mockOrders[0]! // belongs to user-auth-123

      await expect(
        getCommerceOrderById('ord-101', {
          userId: null,
          orderOverride: targetOrder,
        })
      ).rejects.toThrow(CommerceValidationError)
    })

    it('allows guest order lookup only with valid signed HMAC guestToken', async () => {
      const guestOrder = {
        id: 'ord-guest-555',
        order_number: 'BRM-20260916-GST555',
        user_id: null,
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        currency: 'TRY',
        subtotal: 15000,
        discount_total: 0,
        shipping_total: 0,
        tax_total: 0,
        grand_total: 15000,
        created_at: '2026-09-16T14:00:00Z',
        items: [
          {
            product_id: 'prod-gala',
            variant_id: null,
            product_name_snapshot: 'Gala Sandalye',
            sku_snapshot: 'BRM-GAL-001',
            quantity: 1,
            unit_price: 15000,
            total_price: 15000,
          },
        ],
      }

      const validToken = createGuestOrderToken('ord-guest-555', 'BRM-20260916-GST555')

      // Valid token -> success
      const result = await getCommerceOrderById('ord-guest-555', {
        userId: null,
        guestToken: validToken,
        orderOverride: guestOrder,
      })
      expect(result.id).toBe('ord-guest-555')
      expect(result.orderNumber).toBe('BRM-20260916-GST555')

      // Invalid token -> 403 error
      await expect(
        getCommerceOrderById('ord-guest-555', {
          userId: null,
          guestToken: 'tampered-guest-token',
          orderOverride: guestOrder,
        })
      ).rejects.toThrow('Misafir siparişi için geçerli yetki anahtarı sağlanmadı.')

      // Missing token -> 403 error
      await expect(
        getCommerceOrderById('ord-guest-555', {
          userId: null,
          guestToken: null,
          orderOverride: guestOrder,
        })
      ).rejects.toThrow('Misafir siparişi için geçerli yetki anahtarı sağlanmadı.')
    })
  })
})
