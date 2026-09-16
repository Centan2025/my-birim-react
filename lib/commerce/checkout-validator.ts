import {validateCart} from './cart-validator'
import {CommerceValidationError} from './types'
import type {AuthoritativeCatalogBatch} from './sanityCommerceClient'
import type {CheckoutValidateRequest, CheckoutValidationResult} from './checkout-types'
import {checkoutValidateRequestSchema} from './checkout-schemas'

/**
 * Validates full checkout payload (items + customer + shipping + billing)
 * against authoritative Sanity catalog and strict Zod schemas.
 * Reuses Phase 2 cart-validator engine.
 * Does NOT perform database writes.
 */
export async function validateCheckout(
  rawPayload: CheckoutValidateRequest,
  catalogBatchOverride?: AuthoritativeCatalogBatch
): Promise<CheckoutValidationResult> {
  // 1. Strict Schema Validation with Zod
  const parseResult = checkoutValidateRequestSchema.safeParse(rawPayload)
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Geçersiz sipariş tamamlama verisi.'
    throw new CommerceValidationError(400, 'INVALID_REQUEST', firstError)
  }

  const {items, checkout} = parseResult.data

  // 2. Authoritative Cart & Fresh Catalog Validation
  // (Checks commerce_enabled, product/variant eligibility, prices, minor units, single currency, quantities)
  const cartResult = await validateCart(items, catalogBatchOverride)

  // 3. Return Safe, Authoritative Checkout Summary
  return {
    valid: true,
    currency: cartResult.currency,
    customer: {
      customerType: checkout.customerType,
    },
    items: cartResult.items,
    subtotal: cartResult.subtotal,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    grandTotal: cartResult.grandTotal,
  }
}
