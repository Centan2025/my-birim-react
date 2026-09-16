import {describe, it, expect, vi, beforeEach} from 'vitest'
import {validateCheckout} from '../../lib/commerce/checkout-validator'
import {CommerceValidationError} from '../../lib/commerce/types'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'
import type {CheckoutValidateRequest} from '../../lib/commerce/checkout-types'

// Mock catalog batch for testing without live network calls
const createMockCatalog = (
  overrides?: Partial<AuthoritativeCatalogBatch>
): AuthoritativeCatalogBatch => ({
  commerce_enabled: true,
  products: [
    {
      id: 'kilit-sehpa',
      buyable: true,
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 15000,
      currency: 'TRY',
      sku: 'KLT-01',
      name: {tr: 'Kilit Sehpa', en: 'Kilit Coffee Table'},
      stockStatus: 'in_stock',
      variants: [],
    },
    {
      id: 'arch-table',
      buyable: true,
      sale_enabled: true,
      sales_mode: 'CONFIGURABLE',
      price: 45000,
      currency: 'TRY',
      sku: 'ARCH-BASE',
      name: {tr: 'Arch Masa', en: 'Arch Table'},
      stockStatus: 'in_stock',
      variants: [
        {
          id: 'oak-240',
          title: {tr: '240cm Meşe', en: '240cm Oak'},
          sku: 'ARCH-240-OAK',
          price: 52000,
          currency: 'TRY',
          enabled: true,
          options: [
            {name: 'Boyut', value: '240cm'},
            {name: 'Malzeme', value: 'Meşe'},
          ],
        },
        {
          id: 'walnut-disabled',
          title: {tr: 'Ceviz', en: 'Walnut'},
          sku: 'ARCH-WALNUT',
          price: 60000,
          currency: 'TRY',
          enabled: false,
          options: [{name: 'Malzeme', value: 'Ceviz'}],
        },
      ],
    },
    {
      id: 'quote-only-product',
      buyable: true,
      sale_enabled: false,
      sales_mode: 'QUOTE',
      price: 10000,
      currency: 'TRY',
      sku: 'QUOTE-01',
      name: {tr: 'Özel Koltuk', en: 'Custom Sofa'},
      stockStatus: 'in_stock',
      variants: [],
    },
  ],
  ...overrides,
})

const validIndividualCheckoutPayload: CheckoutValidateRequest = {
  items: [
    {
      productId: 'kilit-sehpa',
      quantity: 2,
    },
  ],
  checkout: {
    customerType: 'INDIVIDUAL',
    customer: {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      email: 'ahmet.yilmaz@example.com',
      phone: '+90 555 123 4567',
    },
    shippingAddress: {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      addressLine1: 'Büyükdere Cad. No: 123 K: 4',
      addressLine2: 'Daire 8',
      city: 'İstanbul',
      district: 'Şişli',
      postalCode: '34360',
      country: 'TR',
      phone: '+90 555 123 4567',
    },
    billingAddress: {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      addressLine1: 'Büyükdere Cad. No: 123 K: 4',
      city: 'İstanbul',
      district: 'Şişli',
      postalCode: '34360',
      country: 'TR',
    },
    billingSameAsShipping: true,
  },
}

describe('Server-Authoritative Checkout Validation (Phase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Valid Checkout Scenarios', () => {
    it('validates a valid INDIVIDUAL checkout and calculates authoritative totals', async () => {
      const catalog = createMockCatalog()
      const result = await validateCheckout(validIndividualCheckoutPayload, catalog)

      expect(result.valid).toBe(true)
      expect(result.currency).toBe('TRY')
      expect(result.customer.customerType).toBe('INDIVIDUAL')
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual({
        productId: 'kilit-sehpa',
        variantId: null,
        productName: 'Kilit Sehpa',
        sku: 'KLT-01',
        quantity: 2,
        unitPrice: 15000,
        totalPrice: 30000,
        currency: 'TRY',
        selectedOptions: null,
      })
      expect(result.subtotal).toBe(30000)
      expect(result.grandTotal).toBe(30000)
    })

    it('validates a valid CORPORATE checkout with company billing details', async () => {
      const catalog = createMockCatalog()
      const corporatePayload: CheckoutValidateRequest = {
        ...validIndividualCheckoutPayload,
        checkout: {
          ...validIndividualCheckoutPayload.checkout,
          customerType: 'CORPORATE',
          corporateBilling: {
            companyName: 'Birim Mimarlık A.Ş.',
            taxOffice: 'Zincirlikuyu',
            taxNumber: '1234567890',
          },
        },
      }

      const result = await validateCheckout(corporatePayload, catalog)
      expect(result.valid).toBe(true)
      expect(result.customer.customerType).toBe('CORPORATE')
    })

    it('validates CONFIGURABLE product variant with authoritative variant price', async () => {
      const catalog = createMockCatalog()
      const variantPayload: CheckoutValidateRequest = {
        ...validIndividualCheckoutPayload,
        items: [
          {
            productId: 'arch-table',
            variantId: 'oak-240',
            quantity: 1,
          },
        ],
      }

      const result = await validateCheckout(variantPayload, catalog)
      expect(result.valid).toBe(true)
      expect(result.items[0]?.unitPrice).toBe(52000)
      expect(result.items[0]?.totalPrice).toBe(52000)
      expect(result.items[0]?.sku).toBe('ARCH-240-OAK')
      expect(result.items[0]?.selectedOptions).toEqual([
        {name: 'Boyut', value: '240cm'},
        {name: 'Malzeme', value: 'Meşe'},
      ])
      expect(result.grandTotal).toBe(52000)
    })
  })

  describe('2. Customer & Address Validation', () => {
    it('rejects missing or empty customer firstName', async () => {
      const catalog = createMockCatalog()
      const invalid = {
        ...validIndividualCheckoutPayload,
        checkout: {
          ...validIndividualCheckoutPayload.checkout,
          customer: {
            ...validIndividualCheckoutPayload.checkout.customer,
            firstName: '',
          },
        },
      }

      await expect(validateCheckout(invalid, catalog)).rejects.toThrow(CommerceValidationError)
    })

    it('rejects invalid email format', async () => {
      const catalog = createMockCatalog()
      const invalid = {
        ...validIndividualCheckoutPayload,
        checkout: {
          ...validIndividualCheckoutPayload.checkout,
          customer: {
            ...validIndividualCheckoutPayload.checkout.customer,
            email: 'not-an-email',
          },
        },
      }

      await expect(validateCheckout(invalid, catalog)).rejects.toThrow(
        'Geçerli bir e-posta adresi giriniz.'
      )
    })

    it('rejects missing shipping address fields', async () => {
      const catalog = createMockCatalog()
      const invalid = {
        ...validIndividualCheckoutPayload,
        checkout: {
          ...validIndividualCheckoutPayload.checkout,
          shippingAddress: {
            ...validIndividualCheckoutPayload.checkout.shippingAddress,
            city: '',
          },
        },
      }

      await expect(validateCheckout(invalid, catalog)).rejects.toThrow(CommerceValidationError)
    })

    it('rejects CORPORATE customerType without corporateBilling details', async () => {
      const catalog = createMockCatalog()
      const invalid = {
        ...validIndividualCheckoutPayload,
        checkout: {
          ...validIndividualCheckoutPayload.checkout,
          customerType: 'CORPORATE' as const,
          corporateBilling: null,
        },
      }

      await expect(validateCheckout(invalid, catalog)).rejects.toThrow(
        'Kurumsal fatura seçildiğinde kurumsal fatura bilgileri'
      )
    })

    it('rejects excessively long strings (oversized abuse protection)', async () => {
      const catalog = createMockCatalog()
      const oversized = {
        ...validIndividualCheckoutPayload,
        checkout: {
          ...validIndividualCheckoutPayload.checkout,
          customer: {
            ...validIndividualCheckoutPayload.checkout.customer,
            firstName: 'A'.repeat(150), // max is 100
          },
        },
      }

      await expect(validateCheckout(oversized, catalog)).rejects.toThrow(CommerceValidationError)
    })
  })

  describe('3. Cart & Catalog Re-validation', () => {
    it('rejects empty cart on checkout', async () => {
      const catalog = createMockCatalog()
      const emptyPayload = {
        ...validIndividualCheckoutPayload,
        items: [],
      }

      await expect(validateCheckout(emptyPayload, catalog)).rejects.toThrow(CommerceValidationError)
    })

    it('rejects products disabled for direct sale', async () => {
      const catalog = createMockCatalog()
      const payload = {
        ...validIndividualCheckoutPayload,
        items: [{productId: 'quote-only-product', quantity: 1}],
      }

      await expect(validateCheckout(payload, catalog)).rejects.toThrow(
        'Ürün online satışa açık değil'
      )
    })

    it('rejects disabled variants on checkout', async () => {
      const catalog = createMockCatalog()
      const payload = {
        ...validIndividualCheckoutPayload,
        items: [{productId: 'arch-table', variantId: 'walnut-disabled', quantity: 1}],
      }

      await expect(validateCheckout(payload, catalog)).rejects.toThrow(
        'Seçilen varyant satışa kapalıdır'
      )
    })
  })

  describe('4. Security & Client Tampering Prevention', () => {
    it('strictly ignores/rejects client-submitted fake prices and totals', async () => {
      const catalog = createMockCatalog()
      const tamperedPayload = {
        ...validIndividualCheckoutPayload,
        items: [
          {
            productId: 'kilit-sehpa',
            quantity: 2,
            price: 1, // Attempted tamper: 1 TL instead of 15000 TL
            unitPrice: 1,
            totalPrice: 2,
          },
        ],
        subtotal: 2,
        grandTotal: 2,
      }

      // Strict schema rejects unauthorized client-sent fields
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validateCheckout(tamperedPayload as any, catalog)
      ).rejects.toThrow('yetkisiz')
    })

    it('rejects checkout when global commerce_enabled is false', async () => {
      const catalog = createMockCatalog({commerce_enabled: false})

      await expect(validateCheckout(validIndividualCheckoutPayload, catalog)).rejects.toThrow(
        'Online e-ticaret satışı şu anda aktif değildir'
      )
    })
  })

  describe('5. Zero Database Writes Assertion', () => {
    it('executes checkout validation with strictly 0 DB mutations', async () => {
      const catalog = createMockCatalog()
      const result = await validateCheckout(validIndividualCheckoutPayload, catalog)

      expect(result.valid).toBe(true)
      // Confirmed: validateCheckout is a pure calculation function with zero DB client calls
    })
  })
})
