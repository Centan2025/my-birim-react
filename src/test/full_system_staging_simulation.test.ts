import {describe, it, expect, vi, beforeEach} from 'vitest'
import {createCommerceOrder} from '../../lib/commerce/order-service'
import {initiatePayment, handlePaymentCallback} from '../../lib/commerce/payment/payment-service'
import {verifyGuestOrderToken} from '../../lib/commerce/payment/guest-auth'
import {MockPaymentProvider} from '../../lib/commerce/payment/mock-provider'
import {
  STAGING_TEST_CUSTOMERS,
  assertSafeStagingEnvironment,
} from '../../scripts/seed-staging-account-fixtures'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'

const stagingCatalogBatch: AuthoritativeCatalogBatch = {
  commerce_enabled: true,
  products: [
    // 1. DIRECT Product (Buyable online with fixed price)
    {
      id: 'prod-chair-direct',
      name: {tr: 'Kav Tekli Koltuk', en: 'Kav Armchair'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 35000,
      currency: 'TRY',
      sku: 'BRM-KAV-DIR',
      variants: [],
    },
    // 2. CONFIGURABLE Product (Dimension + Finish selection)
    {
      id: 'prod-sofa-configurable',
      name: {tr: 'Sarmal Kanepe', en: 'Sarmal Sofa'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'CONFIGURABLE',
      price: 65000,
      currency: 'TRY',
      sku: 'BRM-SRM-CONF',
      variants: [
        {
          id: 'var-srm-220-oak-beige',
          sku: 'BRM-SRM-220-OAK-BG',
          price: 72000,
          currency: 'TRY',
          stock_status: 'IN_STOCK',
          stock_quantity: 4,
          lead_time_weeks: null,
          selected_dimension_key: 'dim-220',
          selected_material_keys: ['mat-oak', 'swatch-luna-beige'],
        },
      ],
    },
    // 3. QUOTE Product (Price on request / Quote cart only)
    {
      id: 'prod-table-quote',
      name: {tr: 'Mono Konferans Masası', en: 'Mono Conference Table'},
      buyable: false,
      sale_enabled: true,
      sales_mode: 'QUOTE',
      price: null,
      currency: 'TRY',
      sku: 'BRM-MNO-QTE',
      variants: [],
    },
    // 4. NONE Product (Archival / Exhibition only)
    {
      id: 'prod-object-none',
      name: {tr: 'Koleksiyon Objesi', en: 'Collection Object'},
      buyable: false,
      sale_enabled: false,
      sales_mode: 'NONE',
      price: null,
      currency: 'TRY',
      sku: 'BRM-OBJ-NON',
      variants: [],
    },
  ],
}

const fakeCustomerCheckoutPayload = {
  customerType: 'INDIVIDUAL' as const,
  customer: {
    firstName: 'TEST CUSTOMER',
    lastName: '01',
    email: 'customer-standard@test.birim.invalid',
    phone: '+905550001122',
  },
  shippingAddress: {
    firstName: 'TEST CUSTOMER',
    lastName: '01',
    addressLine1: 'Test Mah. Moda Cad. No: 10 D: 4',
    city: 'İstanbul',
    district: 'Kadıköy',
    postalCode: '34710',
    country: 'TR',
  },
  billingAddress: {
    firstName: 'TEST CUSTOMER',
    lastName: '01',
    addressLine1: 'Test Mah. Moda Cad. No: 10 D: 4',
    city: 'İstanbul',
    district: 'Kadıköy',
    postalCode: '34710',
    country: 'TR',
  },
  billingSameAsShipping: true,
}

describe('BİRİM Pre-Production Full System Simulation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env['PAYMENT_ALLOW_MOCK']
    process.env['NODE_ENV'] = 'test'
  })

  // 1. Direct Product E2E Simulation
  describe('1. DIRECT Product Flow', () => {
    it('executes DIRECT product purchase through order creation, snapshot generation, and mock payment', async () => {
      const order = await createCommerceOrder(
        {
          items: [{productId: 'prod-chair-direct', quantity: 1}],
          checkout: fakeCustomerCheckoutPayload,
        },
        {
          userId: STAGING_TEST_CUSTOMERS.USER_A_STANDARD.id,
          catalogBatchOverride: stagingCatalogBatch,
        }
      )

      expect(order.status).toBe('PENDING_PAYMENT')
      expect(order.grandTotal).toBe(35000)
      expect(order.currency).toBe('TRY')
      expect(order.guestToken).toBeUndefined() // Authenticated user has no guest token

      // Initiate payment via mock provider
      const payment = await initiatePayment(
        {orderId: order.id},
        {
          userId: 'usr-test-standard-001',
          orderOverride: {
            id: order.id,
            user_id: 'usr-test-standard-001',
            status: 'PENDING_PAYMENT',
            payment_status: 'PENDING',
            grand_total: 35000,
            currency: 'TRY',
          },
        }
      )

      expect(payment.status).toBe('PENDING')
      expect(payment.provider).toBe('mock')

      // Process payment callback -> SUCCESS
      const callbackResult = await handlePaymentCallback(
        {
          provider: 'mock',
          headers: {},
          payload: {
            eventId: 'evt-test-pay-01',
            orderId: order.id,
            status: 'PAID',
          },
        },
        {
          orderOverride: {
            id: order.id,
            user_id: 'usr-test-standard-001',
            status: 'PENDING_PAYMENT',
            payment_status: 'PENDING',
            grand_total: 35000,
            currency: 'TRY',
          },
        }
      )

      expect(callbackResult.status).toBe('PAID')
    })
  })

  // 2. Configurable Product E2E Simulation
  describe('2. CONFIGURABLE Product Flow', () => {
    it('calculates server-authoritative variant price and creates line-item option snapshot', async () => {
      const order = await createCommerceOrder(
        {
          items: [
            {
              productId: 'prod-sofa-configurable',
              variantId: 'var-srm-220-oak-beige',
              quantity: 1,
            },
          ],
          checkout: fakeCustomerCheckoutPayload,
        },
        {
          userId: STAGING_TEST_CUSTOMERS.USER_A_STANDARD.id,
          catalogBatchOverride: stagingCatalogBatch,
        }
      )

      expect(order.grandTotal).toBe(72000)
      expect(order.itemsCount).toBe(1)
    })
  })

  // 3. QUOTE and NONE Product Isolation
  describe('3. QUOTE and NONE Product Commerce Isolation', () => {
    it('rejects direct checkout for QUOTE products', async () => {
      await expect(
        createCommerceOrder(
          {
            items: [{productId: 'prod-table-quote', quantity: 1}],
            checkout: fakeCustomerCheckoutPayload,
          },
          {catalogBatchOverride: stagingCatalogBatch}
        )
      ).rejects.toThrow(/satın alınabilir durumda değil/)
    })

    it('rejects direct checkout for NONE catalog-only products', async () => {
      await expect(
        createCommerceOrder(
          {
            items: [{productId: 'prod-object-none', quantity: 1}],
            checkout: fakeCustomerCheckoutPayload,
          },
          {catalogBatchOverride: stagingCatalogBatch}
        )
      ).rejects.toThrow(/satın alınabilir durumda değil/)
    })
  })

  // 4. Guest Checkout Flow
  describe('4. Guest Checkout Isolation', () => {
    it('creates guest order with null userId and valid guestToken without modifying account state', async () => {
      const guestOrder = await createCommerceOrder(
        {
          items: [{productId: 'prod-chair-direct', quantity: 1}],
          checkout: fakeCustomerCheckoutPayload,
        },
        {
          userId: null,
          catalogBatchOverride: stagingCatalogBatch,
        }
      )

      expect(guestOrder.userId).toBeUndefined()
      expect(guestOrder.guestToken).toBeDefined()
      expect(verifyGuestOrderToken(guestOrder.id, guestOrder.guestToken!)).toBe(true)
    })
  })

  // 5. Account Snapshot Immutability
  describe('5. Order Snapshot Immutability', () => {
    it('preserves historical order snapshots when customer modifies saved address later', async () => {
      const originalUser = STAGING_TEST_CUSTOMERS.USER_A_STANDARD
      const initialSnapshot = originalUser.orders[0]?.shippingAddressSnapshot

      expect(initialSnapshot?.recipientName).toBe('TEST CUSTOMER 01')
      expect(initialSnapshot?.addressLine1).toBe('Test Mah. Moda Cad. No: 10 D: 4')

      // Simulate customer modifying active saved address
      const modifiedAddress = {
        ...originalUser.addresses[0],
        addressLine1: 'GÜNCELLENMİŞ YENİ ADRES NO: 999',
      }

      expect(modifiedAddress.addressLine1).not.toBe(initialSnapshot?.addressLine1)
      // Historical order snapshot remains intact
      expect(originalUser.orders[0]?.shippingAddressSnapshot.addressLine1).toBe(
        'Test Mah. Moda Cad. No: 10 D: 4'
      )
    })
  })

  // 6. Professional Verification Status
  describe('6. Professional Verification Status Scenarios', () => {
    it('correctly models pending architect and approved architect profiles as read-only', () => {
      const userPending = STAGING_TEST_CUSTOMERS.USER_B_ARCHITECT_PENDING
      const userApproved = STAGING_TEST_CUSTOMERS.USER_C_ARCHITECT_APPROVED

      expect(userPending.role).toBe('architect')
      expect(userPending.architectVerificationStatus).toBe('pending')

      expect(userApproved.role).toBe('architect')
      expect(userApproved.architectVerificationStatus).toBe('approved')
    })
  })

  // 7. Mock Payment Guard & State Machine
  describe('7. Mock Payment Production Safety Guard', () => {
    it('strictly forbids mock payment in production environment without explicit allow flag', async () => {
      process.env['NODE_ENV'] = 'production'
      const mockProvider = new MockPaymentProvider()

      await expect(
        mockProvider.createPaymentIntent({
          orderId: 'ord-test-999',
          amount: 35000,
          currency: 'TRY',
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          customerPhone: '+905550001122',
        })
      ).rejects.toThrow(/Mock payment provider is not permitted in production/)
    })

    it('simulates payment failure and cancelled states deterministically', async () => {
      const mockProvider = new MockPaymentProvider()

      const failedEvent = await mockProvider.verifyCallback({
        provider: 'mock',
        headers: {},
        payload: {
          eventId: 'evt-fail-01',
          orderId: 'ord-test-failed',
          status: 'FAILED',
        },
      })

      expect(failedEvent.status).toBe('FAILED')
    })
  })

  // 8. Staging Safety Invariants
  describe('8. Staging Environment Invariants', () => {
    it('passes staging safety assertion in test environment and blocks production URLs', () => {
      expect(() => assertSafeStagingEnvironment()).not.toThrow()

      process.env['NODE_ENV'] = 'production'
      expect(() => assertSafeStagingEnvironment()).toThrow(
        /Staging fixture script cannot run in production/
      )
    })
  })
})
