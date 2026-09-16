import type {PaymentIntent, InitiatePaymentResponse} from '../../../lib/commerce/payment/types'
import {CommerceCartServiceError, getLocalizedErrorMessage} from './cart'

export interface InitiateCommercePaymentOptions {
  guestToken?: string
  idempotencyKey?: string
  signal?: AbortSignal
}

/**
 * Initiates payment intent for an order on the server.
 * Returns provider-neutral PaymentIntent.
 */
export async function initiateCommercePayment(
  orderId: string,
  options: InitiateCommercePaymentOptions = {}
): Promise<PaymentIntent> {
  const cleanOrderId = String(orderId || '').trim()
  if (!cleanOrderId) {
    throw new CommerceCartServiceError({
      code: 'INVALID_REQUEST',
      message: 'Ödeme başlatmak için geçerli bir sipariş ID gereklidir.',
      statusCode: 400,
    })
  }

  const response = await fetch('/api/commerce/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId: cleanOrderId,
      guestToken: options.guestToken || undefined,
      idempotencyKey: options.idempotencyKey || undefined,
    }),
    signal: options.signal,
  })

  const data: InitiatePaymentResponse = await response.json()

  if (!response.ok || !data || data.success !== true || !data.payment) {
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

  return data.payment
}

export interface CompleteMockPaymentOptions {
  status?: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PROCESSING'
  orderId?: string
  guestToken?: string
  signal?: AbortSignal
}

export interface CompleteMockPaymentResult {
  success: boolean
  status: 'PAID' | 'FAILED' | 'CANCELLED' | 'PROCESSING'
  orderId?: string
  message?: string
}

/**
 * Completes or simulates mock payment outcome in dev/test environment.
 * Strictly blocked on server if executed against production.
 */
export async function completeMockPaymentClient(
  paymentTransactionId: string,
  options: CompleteMockPaymentOptions = {}
): Promise<CompleteMockPaymentResult> {
  const cleanTxId = String(paymentTransactionId || '').trim()
  if (!cleanTxId) {
    throw new CommerceCartServiceError({
      code: 'INVALID_REQUEST',
      message: 'Ödeme simülasyonu için geçerli bir işlem referansı gereklidir.',
      statusCode: 400,
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.guestToken) {
    headers['x-guest-token'] = options.guestToken.trim()
  }

  const response = await fetch('/api/commerce/payments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'mock_complete',
      paymentTransactionId: cleanTxId,
      status: options.status || 'SUCCESS',
      orderId: options.orderId || undefined,
    }),
    signal: options.signal,
  })

  const data = await response.json()

  if (!response.ok || !data || data.success !== true) {
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

  return {
    success: true,
    status: data.status,
    orderId: data.orderId,
    message: data.message,
  }
}

export interface FetchPaymentStatusClientOptions {
  guestToken?: string
  signal?: AbortSignal
}

/**
 * Fetches authoritative payment status from GET /api/commerce/payments
 * Used for recovery when a client loses connection during payment processing.
 */
export async function fetchPaymentStatusClient(
  paymentTransactionId: string,
  options: FetchPaymentStatusClientOptions = {}
): Promise<PaymentIntent> {
  const cleanTxId = String(paymentTransactionId || '').trim()
  if (!cleanTxId) {
    throw new CommerceCartServiceError({
      code: 'INVALID_REQUEST',
      message: 'Ödeme durumunu sorgulamak için geçerli bir işlem referansı gereklidir.',
      statusCode: 400,
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.guestToken) {
    headers['x-guest-token'] = options.guestToken.trim()
  }

  const response = await fetch(
    `/api/commerce/payments?transactionId=${encodeURIComponent(cleanTxId)}`,
    {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: options.signal,
    }
  )

  const data: import('../../../lib/commerce/payment/types').GetPaymentStatusResponse =
    await response.json()

  if (!response.ok || !data || data.success !== true || !('payment' in data)) {
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

  return data.payment
}
