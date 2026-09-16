import type {CommerceCartItem} from '../../types/commerceCart'
import type {CheckoutPayload} from '../../types/checkout'
import type {
  OrderResult,
  CreateOrderResponse,
  OrderDetailResult,
  GetOrderResponse,
  CustomerOrderSummary,
  ListOrdersResponse,
} from '../../../lib/commerce/order-types'
import {CommerceCartServiceError, getLocalizedErrorMessage} from './cart'

export interface CreateCommerceOrderClientOptions {
  expectedGrandTotal?: number
  idempotencyKey?: string
  notes?: string
  signal?: AbortSignal
}

export interface FetchCommerceOrderClientOptions {
  guestToken?: string
  signal?: AbortSignal
}

export interface FetchCustomerOrdersClientOptions {
  signal?: AbortSignal
}

/**
 * Sends order initialization request to POST /api/commerce/orders
 * Returns confirmed OrderResult snapshot from server.
 */
export async function createCommerceOrderClient(
  items: CommerceCartItem[],
  checkout: CheckoutPayload,
  options: CreateCommerceOrderClientOptions = {}
): Promise<OrderResult> {
  if (!items || items.length === 0) {
    throw new CommerceCartServiceError({
      code: 'EMPTY_CART',
      message: 'Sipariş oluşturmak için sepetinizde ürün bulunmalıdır.',
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

  const response = await fetch('/api/commerce/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      items: sanitizedItems,
      checkout: sanitizedCheckout,
      expectedGrandTotal: options.expectedGrandTotal,
      idempotencyKey: options.idempotencyKey || undefined,
      notes: options.notes || undefined,
    }),
    signal: options.signal,
  })

  const data: CreateOrderResponse = await response.json()

  if (!response.ok || !data || data.success !== true || !data.order) {
    const code = (
      data && 'code' in data ? data.code : 'INTERNAL_ERROR'
    ) as import('../../../lib/commerce/types').CommerceErrorCode
    const serverMsg = data && 'message' in data ? data.message : undefined
    const friendlyMsg = getLocalizedErrorMessage(code, serverMsg)

    throw new CommerceCartServiceError({
      code,
      message: friendlyMsg,
      productId: data && 'productId' in data ? data.productId : undefined,
      variantId: data && 'variantId' in data ? data.variantId : undefined,
      statusCode: response.status,
    })
  }

  return data.order
}

/**
 * Fetches order details with strict authorization.
 * Sends guestToken via x-guest-token header to avoid token leakage in URLs.
 */
export async function fetchCommerceOrderClient(
  orderId: string,
  options: FetchCommerceOrderClientOptions = {}
): Promise<OrderDetailResult> {
  const cleanOrderId = String(orderId || '').trim()
  if (!cleanOrderId) {
    throw new CommerceCartServiceError({
      code: 'INVALID_REQUEST',
      message: 'Sipariş bilgilerini sorgulamak için geçerli bir sipariş ID gereklidir.',
      statusCode: 400,
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.guestToken) {
    headers['x-guest-token'] = options.guestToken.trim()
  }

  const response = await fetch(`/api/commerce/orders?orderId=${encodeURIComponent(cleanOrderId)}`, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal: options.signal,
  })

  const data: GetOrderResponse = await response.json()

  if (!response.ok || !data || data.success !== true || !('order' in data)) {
    const code = (
      data && 'code' in data ? data.code : 'INTERNAL_ERROR'
    ) as import('../../../lib/commerce/types').CommerceErrorCode
    const serverMsg = data && 'message' in data ? data.message : undefined
    const friendlyMsg = getLocalizedErrorMessage(code, serverMsg)

    throw new CommerceCartServiceError({
      code,
      message: friendlyMsg,
      statusCode: response.status,
    })
  }

  return data.order
}

/**
 * Fetches authenticated customer's order history from GET /api/commerce/orders
 * Returns list of CustomerOrderSummary items sorted newest first.
 */
export async function fetchCustomerOrdersClient(
  options: FetchCustomerOrdersClientOptions = {}
): Promise<CustomerOrderSummary[]> {
  const response = await fetch('/api/commerce/orders', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal: options.signal,
  })

  const data: ListOrdersResponse = await response.json()

  if (!response.ok || !data || data.success !== true || !('orders' in data)) {
    const code = (
      data && 'code' in data ? data.code : 'INTERNAL_ERROR'
    ) as import('../../../lib/commerce/types').CommerceErrorCode
    const serverMsg = data && 'message' in data ? data.message : undefined
    const friendlyMsg = getLocalizedErrorMessage(code, serverMsg)

    throw new CommerceCartServiceError({
      code,
      message: friendlyMsg,
      statusCode: response.status,
    })
  }

  return data.orders
}
