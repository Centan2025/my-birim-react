import {
  CommerceValidationError,
  type CartItemInput,
  type CartValidationResult,
  type ValidatedCartItem,
} from './types.js'
import {
  fetchAuthoritativeCatalogBatch,
  type AuthoritativeCatalogBatch,
} from './sanityCommerceClient.js'
import {validateProductAndVariantEligibility} from './eligibility.js'
import {resolveAuthoritativeItemPricing} from './pricing.js'

export const MIN_CART_ITEMS = 1
export const MAX_CART_ITEMS = 50
export const MIN_ITEM_QUANTITY = 1
export const MAX_ITEM_QUANTITY = 100

/**
 * Validates a raw cart payload against authoritative Sanity catalog data.
 * Does NOT perform database writes.
 */
export async function validateCart(
  items: CartItemInput[],
  catalogBatchOverride?: AuthoritativeCatalogBatch
): Promise<CartValidationResult> {
  // 1. Basic array bounds validation
  if (!Array.isArray(items) || items.length === 0) {
    throw new CommerceValidationError(422, 'EMPTY_CART', 'Sepetinizde ürün bulunmamaktadır.')
  }

  if (items.length > MAX_CART_ITEMS) {
    throw new CommerceValidationError(
      422,
      'CART_TOO_LARGE',
      `Sepette en fazla ${MAX_CART_ITEMS} farklı ürün bulunabilir.`
    )
  }

  // 2. Validate individual item structure and quantities
  const uniqueProductIds = new Set<string>()

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      throw new CommerceValidationError(400, 'INVALID_REQUEST', 'Geçersiz sepet kalemi formatı.')
    }

    const {productId, quantity} = item

    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new CommerceValidationError(
        400,
        'INVALID_REQUEST',
        'Sepet kaleminde ürün ID bilgisi zorunludur.'
      )
    }

    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      isNaN(quantity) ||
      quantity < MIN_ITEM_QUANTITY ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      throw new CommerceValidationError(
        422,
        'INVALID_QUANTITY',
        `Geçersiz ürün adedi (${quantity}). Adet ${MIN_ITEM_QUANTITY} ile ${MAX_ITEM_QUANTITY} arasında bir tam sayı olmalıdır.`,
        {productId}
      )
    }

    uniqueProductIds.add(productId.trim())
  }

  // 3. Retrieve authoritative catalog batch from Sanity (or injected override for testing)
  const catalogBatch =
    catalogBatchOverride || (await fetchAuthoritativeCatalogBatch(Array.from(uniqueProductIds)))

  // 4. Global Commerce flag check
  if (catalogBatch.commerce_enabled !== true) {
    throw new CommerceValidationError(
      403,
      'COMMERCE_DISABLED',
      'Online e-ticaret satışı şu anda aktif değildir.'
    )
  }

  const productMap = new Map(catalogBatch.products.map(p => [p.id, p]))

  // 5. Validate each cart item against authoritative catalog
  const validatedItems: ValidatedCartItem[] = []
  let cartCurrency: string | null = null
  let subtotalMinor = 0

  for (const item of items) {
    const cleanProductId = item.productId.trim()
    const cleanVariantId = item.variantId ? item.variantId.trim() : null
    const authProduct = productMap.get(cleanProductId)

    // Eligibility check
    const {product, variant} = validateProductAndVariantEligibility(
      authProduct,
      cleanProductId,
      cleanVariantId
    )

    // Pricing calculation
    const pricing = resolveAuthoritativeItemPricing(product, variant, item.quantity)

    // Currency consistency check
    if (!cartCurrency) {
      cartCurrency = pricing.currency
    } else if (cartCurrency !== pricing.currency) {
      throw new CommerceValidationError(
        422,
        'CART_CURRENCY_MISMATCH',
        `Sepette farklı para birimlerine sahip ürünler bulunamaz (${cartCurrency} / ${pricing.currency}).`,
        {productId: cleanProductId, variantId: cleanVariantId || undefined}
      )
    }

    subtotalMinor += pricing.totalPriceMinor

    validatedItems.push({
      productId: product.id,
      variantId: variant ? variant.id : null,
      productName: pricing.productName,
      sku: pricing.sku,
      quantity: item.quantity,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
      currency: pricing.currency,
      selectedOptions: pricing.selectedOptions,
    })
  }

  const subtotal = subtotalMinor / 100

  // 6. Return normalized result (discount, shipping, tax are placeholders for future phases)
  return {
    valid: true,
    currency: cartCurrency || 'TRY',
    items: validatedItems,
    subtotal,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    grandTotal: subtotal,
  }
}
