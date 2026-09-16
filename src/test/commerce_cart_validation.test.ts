import {describe, it, expect, vi, beforeEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import validateHandler from '../../api/commerce/cart/validate'
import {validateCart} from '../../lib/commerce/cart-validator'
import {CommerceValidationError} from '../../lib/commerce/types'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'

function createMockReqRes(overrides?: {
  method?: string
  url?: string
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
}) {
  const req = {
    method: overrides?.method || 'POST',
    url: overrides?.url || '/api/commerce/cart/validate',
    query: overrides?.query || {},
    headers: overrides?.headers || {origin: 'https://www.birim.com'},
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
    end() {
      return this
    },
  } as unknown as VercelResponse

  return {req, res}
}

// Sample authoritative catalog data for testing
const mockAuthoritativeCatalog: AuthoritativeCatalogBatch = {
  commerce_enabled: true,
  products: [
    {
      id: 'kilit-sehpa',
      name: {tr: 'Kilit Sehpa', en: 'Kilit Coffee Table'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 15000,
      currency: 'TRY',
      sku: 'KLT-001',
      stockStatus: 'in_stock',
    },
    {
      id: 'arch-sofa',
      name: {tr: 'Arch Kanepe', en: 'Arch Sofa'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'CONFIGURABLE',
      price: 45000,
      currency: 'TRY',
      sku: 'ARCH-BASE',
      stockStatus: 'in_stock',
      variants: [
        {
          id: 'arch-240-oak',
          title: {tr: '240 cm / Meşe', en: '240 cm / Oak'},
          sku: 'ARCH-240-OAK',
          price: 52000,
          currency: 'TRY',
          options: [
            {name: 'SIZE', value: '240'},
            {name: 'MATERIAL', value: 'Oak'},
          ],
          enabled: true,
        },
        {
          id: 'arch-280-walnut',
          title: {tr: '280 cm / Ceviz', en: '280 cm / Walnut'},
          sku: 'ARCH-280-WAL',
          price: 68000,
          currency: 'TRY',
          options: [
            {name: 'SIZE', value: '280'},
            {name: 'MATERIAL', value: 'Walnut'},
          ],
          enabled: false, // Disabled variant
        },
      ],
    },
    {
      id: 'disabled-chair',
      name: {tr: 'Pasif Sandalye', en: 'Disabled Chair'},
      buyable: true,
      sale_enabled: false, // Sale disabled
      sales_mode: 'DIRECT',
      price: 8000,
      currency: 'TRY',
      sku: 'DIS-001',
      stockStatus: 'in_stock',
    },
    {
      id: 'not-buyable-table',
      name: {tr: 'Satılamaz Masa', en: 'Non-buyable Table'},
      buyable: false, // Buyable false
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 20000,
      currency: 'TRY',
      sku: 'NBT-001',
      stockStatus: 'in_stock',
    },
    {
      id: 'quote-only-desk',
      name: {tr: 'Özel Yönetici Masası', en: 'Executive Desk'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'QUOTE', // Quote mode
      price: 120000,
      currency: 'TRY',
      sku: 'QOT-001',
      stockStatus: 'in_stock',
    },
    {
      id: 'none-mode-shelf',
      name: {tr: 'Kitaplık', en: 'Bookshelf'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'NONE', // Mode NONE
      price: 30000,
      currency: 'TRY',
      sku: 'NON-001',
      stockStatus: 'in_stock',
    },
    {
      id: 'out-of-stock-lamp',
      name: {tr: 'Lambader', en: 'Floor Lamp'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 9500,
      currency: 'TRY',
      sku: 'LMP-001',
      stockStatus: 'out_of_stock', // Out of stock
    },
    {
      id: 'eur-bench',
      name: {tr: 'Avrupa Bank', en: 'Euro Bench'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 1200,
      currency: 'EUR', // EUR currency
      sku: 'EUR-001',
      stockStatus: 'in_stock',
    },
  ],
}

describe('BİRİM Commerce Phase 2 — Server Core & Cart Validation Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Price Tampering Prevention
  it('1. rejects client price tampering in API and ignores untrusted price fields in core', async () => {
    // API test with strict schema violation
    const {req, res} = createMockReqRes({
      method: 'POST',
      body: {
        items: [{productId: 'kilit-sehpa', quantity: 1, unitPrice: 1}], // Injected unitPrice
      },
    })
    await validateHandler(req, res)
    expect(res.statusCode).toBe(400)
    expect((res.body as {code?: string}).code).toBe('INVALID_REQUEST')

    // Core test: even if raw object has extra properties, core uses authoritative price
    const result = await validateCart(
      [{productId: 'kilit-sehpa', quantity: 1}],
      mockAuthoritativeCatalog
    )
    expect(result.items[0].unitPrice).toBe(15000)
    expect(result.items[0].totalPrice).toBe(15000)
    expect(result.subtotal).toBe(15000)
  })

  // 2. Total Tampering Prevention
  it('2. rejects client total tampering and calculates authoritative total server-side', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      body: {
        items: [{productId: 'kilit-sehpa', quantity: 2}],
        grandTotal: 1, // Injected grandTotal
      },
    })
    await validateHandler(req, res)
    expect(res.statusCode).toBe(400)
    expect((res.body as {code?: string}).code).toBe('INVALID_REQUEST')

    // Core test: server calculates 15000 * 2 = 30000
    const result = await validateCart(
      [{productId: 'kilit-sehpa', quantity: 2}],
      mockAuthoritativeCatalog
    )
    expect(result.subtotal).toBe(30000)
    expect(result.grandTotal).toBe(30000)
  })

  // 3. Currency Tampering Prevention
  it('3. rejects client currency tampering and enforces catalog currency', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      body: {
        items: [{productId: 'kilit-sehpa', quantity: 1, currency: 'EUR'}], // Injected currency
      },
    })
    await validateHandler(req, res)
    expect(res.statusCode).toBe(400)

    const result = await validateCart(
      [{productId: 'kilit-sehpa', quantity: 1}],
      mockAuthoritativeCatalog
    )
    expect(result.currency).toBe('TRY')
    expect(result.items[0].currency).toBe('TRY')
  })

  // 4. SKU Tampering Prevention
  it('4. rejects client SKU tampering and returns authoritative SKU', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      body: {
        items: [{productId: 'kilit-sehpa', quantity: 1, sku: 'FAKE-SKU-999'}],
      },
    })
    await validateHandler(req, res)
    expect(res.statusCode).toBe(400)

    const result = await validateCart(
      [{productId: 'kilit-sehpa', quantity: 1}],
      mockAuthoritativeCatalog
    )
    expect(result.items[0].sku).toBe('KLT-001')
  })

  // 5. Product/Variant Mismatch Prevention
  it('5. rejects variant belonging to another product or unknown variant', async () => {
    await expect(
      validateCart(
        [{productId: 'kilit-sehpa', variantId: 'arch-240-oak', quantity: 1}],
        mockAuthoritativeCatalog
      )
    ).rejects.toThrowError(CommerceValidationError)

    try {
      await validateCart(
        [{productId: 'kilit-sehpa', variantId: 'arch-240-oak', quantity: 1}],
        mockAuthoritativeCatalog
      )
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('VARIANT_PRODUCT_MISMATCH')
      expect(e.statusCode).toBe(422)
    }
  })

  // 6. Disabled Product Rejection
  it('6. rejects product when sale_enabled is false', async () => {
    await expect(
      validateCart([{productId: 'disabled-chair', quantity: 1}], mockAuthoritativeCatalog)
    ).rejects.toThrowError(CommerceValidationError)

    try {
      await validateCart([{productId: 'disabled-chair', quantity: 1}], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('PRODUCT_NOT_FOR_SALE')
      expect(e.statusCode).toBe(409)
    }
  })

  // 7. buyable False Rejection
  it('7. rejects product when buyable is false', async () => {
    try {
      await validateCart([{productId: 'not-buyable-table', quantity: 1}], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('PRODUCT_NOT_BUYABLE')
      expect(e.statusCode).toBe(409)
    }
  })

  // 8. Commerce Disabled Rejection
  it('8. returns 403 COMMERCE_DISABLED when global commerce_enabled is false', async () => {
    const disabledCatalog: AuthoritativeCatalogBatch = {
      commerce_enabled: false,
      products: mockAuthoritativeCatalog.products,
    }

    try {
      await validateCart([{productId: 'kilit-sehpa', quantity: 1}], disabledCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('COMMERCE_DISABLED')
      expect(e.statusCode).toBe(403)
    }
  })

  // 9. sales_mode NONE Rejection
  it('9. rejects product when sales_mode is NONE', async () => {
    try {
      await validateCart([{productId: 'none-mode-shelf', quantity: 1}], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('INVALID_SALES_MODE')
      expect(e.statusCode).toBe(409)
    }
  })

  // 10. sales_mode QUOTE Rejection for Direct Commerce
  it('10. rejects direct commerce purchase for QUOTE sales_mode products', async () => {
    try {
      await validateCart([{productId: 'quote-only-desk', quantity: 1}], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('INVALID_SALES_MODE')
      expect(e.statusCode).toBe(409)
    }
  })

  // 11. Disabled Variant Rejection
  it('11. rejects disabled variant (variant.enabled === false)', async () => {
    try {
      await validateCart(
        [{productId: 'arch-sofa', variantId: 'arch-280-walnut', quantity: 1}],
        mockAuthoritativeCatalog
      )
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('VARIANT_DISABLED')
      expect(e.statusCode).toBe(409)
    }
  })

  // 12. Unknown Variant Rejection
  it('12. rejects non-existent variant ID for configurable product', async () => {
    try {
      await validateCart(
        [{productId: 'arch-sofa', variantId: 'non-existent-var', quantity: 1}],
        mockAuthoritativeCatalog
      )
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('VARIANT_NOT_FOUND')
      expect(e.statusCode).toBe(404)
    }
  })

  // 13. Invalid Quantities Rejection
  it('13. rejects invalid quantities (0, -1, 1.5, NaN, Infinity, 101, 999999999)', async () => {
    const invalidQuantities = [0, -1, 1.5, NaN, Infinity, 101, 999999999]

    for (const qty of invalidQuantities) {
      await expect(
        validateCart([{productId: 'kilit-sehpa', quantity: qty}], mockAuthoritativeCatalog)
      ).rejects.toThrow()
    }
  })

  // 14. Empty Cart Rejection
  it('14. rejects empty cart', async () => {
    try {
      await validateCart([], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('EMPTY_CART')
      expect(e.statusCode).toBe(422)
    }
  })

  // 15. Oversized Cart Rejection (> 50 items)
  it('15. rejects oversized cart exceeding 50 line items', async () => {
    const oversizedItems = Array.from({length: 51}, (_, i) => ({
      productId: `product-${i}`,
      quantity: 1,
    }))

    try {
      await validateCart(oversizedItems, mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('CART_TOO_LARGE')
      expect(e.statusCode).toBe(422)
    }
  })

  // 16. Multi-Currency Mismatch Rejection
  it('16. rejects mixed currency items in a single cart (TRY + EUR)', async () => {
    try {
      await validateCart(
        [
          {productId: 'kilit-sehpa', quantity: 1}, // TRY
          {productId: 'eur-bench', quantity: 1}, // EUR
        ],
        mockAuthoritativeCatalog
      )
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('CART_CURRENCY_MISMATCH')
      expect(e.statusCode).toBe(422)
    }
  })

  // 17. Security Data Minimization
  it('17. ensures validation response contains no sensitive secrets or database tokens', async () => {
    const result = await validateCart(
      [
        {productId: 'kilit-sehpa', quantity: 1},
        {productId: 'arch-sofa', variantId: 'arch-240-oak', quantity: 2},
      ],
      mockAuthoritativeCatalog
    )

    const responseStr = JSON.stringify(result).toLowerCase()

    // Assert absence of credentials / tokens
    expect(responseStr).not.toContain('pan')
    expect(responseStr).not.toContain('cvv')
    expect(responseStr).not.toContain('cvc')
    expect(responseStr).not.toContain('expiry')
    expect(responseStr).not.toContain('token')
    expect(responseStr).not.toContain('secret')
    expect(responseStr).not.toContain('service_role')
    expect(responseStr).not.toContain('password')

    // Assert accurate calculations
    // kilit-sehpa: 15000 * 1 = 15000
    // arch-sofa: 52000 * 2 = 104000
    // subtotal = 119000
    expect(result.valid).toBe(true)
    expect(result.subtotal).toBe(119000)
    expect(result.grandTotal).toBe(119000)
    expect(result.discountTotal).toBe(0)
    expect(result.shippingTotal).toBe(0)
    expect(result.taxTotal).toBe(0)
  })

  // 18. SQL-like Input Safety
  it('18. handles SQL-like strings in product and variant IDs safely', async () => {
    const maliciousProductId = "kilit-sehpa' OR 1=1 --"
    try {
      await validateCart([{productId: maliciousProductId, quantity: 1}], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('PRODUCT_NOT_FOUND')
      expect(e.statusCode).toBe(404)
    }
  })

  // 19. XSS-like Input Safety
  it('19. handles XSS-like strings in IDs safely without raw evaluation', async () => {
    const xssProductId = '<script>alert(1)</script>'
    try {
      await validateCart([{productId: xssProductId, quantity: 1}], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('PRODUCT_NOT_FOUND')
      expect(e.statusCode).toBe(404)
    }
  })

  // 20. Out of Stock Rejection
  it('20. rejects product when stockStatus is out_of_stock', async () => {
    try {
      await validateCart([{productId: 'out-of-stock-lamp', quantity: 1}], mockAuthoritativeCatalog)
    } catch (err: unknown) {
      const e = err as CommerceValidationError
      expect(e.code).toBe('PRODUCT_NOT_AVAILABLE')
      expect(e.statusCode).toBe(409)
    }
  })
})
