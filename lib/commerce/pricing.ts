import {CommerceValidationError} from './types.js'
import type {AuthoritativeProduct, AuthoritativeVariant} from './sanityCommerceClient.js'
import type {LocalizedString, ProductVariantOption} from '../../src/types.js'

const ALLOWED_CURRENCIES = new Set(['TRY', 'USD', 'EUR'])

export interface ResolvedPricingInfo {
  unitPrice: number
  totalPrice: number
  unitPriceMinor: number
  totalPriceMinor: number
  currency: string
  sku: string
  productName: string
  selectedOptions: ProductVariantOption[] | null
}

function resolveLocalizedText(val: LocalizedString | undefined): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if (typeof obj['tr'] === 'string' && obj['tr']) return obj['tr']
    if (typeof obj['en'] === 'string' && obj['en']) return obj['en']
    const firstVal = Object.values(obj).find(v => typeof v === 'string')
    if (typeof firstVal === 'string') return firstVal
  }
  return ''
}

/**
 * Resolves authoritative price, currency, SKU, name, and options using integer minor-unit math.
 */
export function resolveAuthoritativeItemPricing(
  product: AuthoritativeProduct,
  variant: AuthoritativeVariant | undefined,
  quantity: number
): ResolvedPricingInfo {
  // 1. Resolve raw price
  const rawPrice =
    variant?.price !== undefined && variant?.price !== null ? variant.price : product.price

  if (typeof rawPrice !== 'number' || isNaN(rawPrice) || rawPrice <= 0) {
    throw new CommerceValidationError(
      422,
      'INVALID_PRICE',
      `Ürün veya varyant için geçerli bir satış fiyatı tanımlanmamış: ${product.id}`,
      {productId: product.id, variantId: variant?.id}
    )
  }

  // 2. Resolve currency
  const rawCurrency = (variant?.currency || product.currency || 'TRY').toUpperCase().trim()
  if (!ALLOWED_CURRENCIES.has(rawCurrency)) {
    throw new CommerceValidationError(
      422,
      'INVALID_CURRENCY',
      `Geçersiz veya desteklenmeyen para birimi: ${rawCurrency}`,
      {productId: product.id, variantId: variant?.id}
    )
  }

  // 3. Money arithmetic using minor units (kuruş / cents)
  const unitPriceMinor = Math.round(rawPrice * 100)
  const totalPriceMinor = unitPriceMinor * quantity
  const unitPrice = unitPriceMinor / 100
  const totalPrice = totalPriceMinor / 100

  // 4. Resolve SKU
  const sku = variant?.sku || product.sku || product.id

  // 5. Resolve Product Name
  const baseName = resolveLocalizedText(product.name) || product.id
  const variantTitle = resolveLocalizedText(variant?.title)
  const productName = variantTitle ? `${baseName} (${variantTitle})` : baseName

  // 6. Resolve options
  const selectedOptions =
    Array.isArray(variant?.options) && variant.options.length > 0
      ? variant.options.map(opt => ({
          name: String(opt.name || '').trim(),
          value: String(opt.value || '').trim(),
        }))
      : null

  return {
    unitPrice,
    totalPrice,
    unitPriceMinor,
    totalPriceMinor,
    currency: rawCurrency,
    sku,
    productName,
    selectedOptions,
  }
}
