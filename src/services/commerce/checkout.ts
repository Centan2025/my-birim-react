import type {CommerceCartItem} from '../../types/commerceCart'
import type {CheckoutPayload, CheckoutValidationResult} from '../../types/checkout'
import type {CartValidationErrorResponse} from '../../../lib/commerce/types'
import {CommerceCartServiceError, getLocalizedErrorMessage} from './cart'

/**
 * Validates checkout payload (items + customer + shipping + billing)
 * against the authoritative server endpoint (/api/commerce/checkout/validate).
 */
export async function validateCommerceCheckout(
  items: CommerceCartItem[],
  checkout: CheckoutPayload,
  signal?: AbortSignal
): Promise<CheckoutValidationResult> {
  if (!items || items.length === 0) {
    throw new CommerceCartServiceError({
      code: 'EMPTY_CART',
      message: 'Sepetinizde ürün bulunmamaktadır.',
      statusCode: 422,
    })
  }

  // Pure payload sanitization: strictly send only intent items
  const sanitizedItems = items.map(item => ({
    productId: String(item.productId || '').trim(),
    variantId: item.variantId ? String(item.variantId).trim() : undefined,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  }))

  const effectiveBillingAddress = checkout.billingSameAsShipping
    ? checkout.shippingAddress
    : checkout.billingAddress

  const sanitizedCheckout: CheckoutPayload = {
    customerType: checkout.customerType,
    customer: {
      firstName: String(checkout.customer.firstName || '').trim(),
      lastName: String(checkout.customer.lastName || '').trim(),
      email: String(checkout.customer.email || '')
        .trim()
        .toLowerCase(),
      phone: String(checkout.customer.phone || '').trim(),
    },
    shippingAddress: {
      firstName: String(checkout.shippingAddress.firstName || '').trim(),
      lastName: String(checkout.shippingAddress.lastName || '').trim(),
      addressLine1: String(checkout.shippingAddress.addressLine1 || '').trim(),
      addressLine2: checkout.shippingAddress.addressLine2
        ? String(checkout.shippingAddress.addressLine2).trim()
        : null,
      city: String(checkout.shippingAddress.city || '').trim(),
      district: String(checkout.shippingAddress.district || '').trim(),
      postalCode: String(checkout.shippingAddress.postalCode || '').trim(),
      country: String(checkout.shippingAddress.country || 'TR').trim(),
      phone: checkout.shippingAddress.phone ? String(checkout.shippingAddress.phone).trim() : null,
    },
    billingAddress: {
      firstName: String(effectiveBillingAddress.firstName || '').trim(),
      lastName: String(effectiveBillingAddress.lastName || '').trim(),
      addressLine1: String(effectiveBillingAddress.addressLine1 || '').trim(),
      addressLine2: effectiveBillingAddress.addressLine2
        ? String(effectiveBillingAddress.addressLine2).trim()
        : null,
      city: String(effectiveBillingAddress.city || '').trim(),
      district: String(effectiveBillingAddress.district || '').trim(),
      postalCode: String(effectiveBillingAddress.postalCode || '').trim(),
      country: String(effectiveBillingAddress.country || 'TR').trim(),
      phone: effectiveBillingAddress.phone ? String(effectiveBillingAddress.phone).trim() : null,
    },
    billingSameAsShipping: Boolean(checkout.billingSameAsShipping),
    corporateBilling:
      checkout.customerType === 'CORPORATE' && checkout.corporateBilling
        ? {
            companyName: String(checkout.corporateBilling.companyName || '').trim(),
            taxOffice: String(checkout.corporateBilling.taxOffice || '').trim(),
            taxNumber: String(checkout.corporateBilling.taxNumber || '').trim(),
          }
        : null,
  }

  const response = await fetch('/api/commerce/checkout/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: sanitizedItems,
      checkout: sanitizedCheckout,
    }),
    signal,
  })

  const data: CheckoutValidationResult | CartValidationErrorResponse = await response.json()

  if (!response.ok || !data || data.valid !== true) {
    const errorData = data as CartValidationErrorResponse
    const code = errorData?.code || 'INTERNAL_ERROR'
    const serverMsg = errorData?.message
    const friendlyMsg = getLocalizedErrorMessage(code, serverMsg)

    throw new CommerceCartServiceError({
      code,
      message: friendlyMsg,
      productId: errorData?.productId,
      variantId: errorData?.variantId,
      statusCode: response.status,
    })
  }

  return data
}
