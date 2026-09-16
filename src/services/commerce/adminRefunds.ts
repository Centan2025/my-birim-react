import type {CreateRefundRequest, CreateRefundResult} from '../../../lib/commerce/refund-types'
import type {CancelOrderResult} from '../../../lib/commerce/order-lifecycle'
import {CommerceCartServiceError, getLocalizedErrorMessage} from './cart'

export interface CancelAdminOrderOptions {
  reason?: string
  signal?: AbortSignal
}

export interface CreateAdminRefundOptions {
  signal?: AbortSignal
}

/**
 * Sends order cancellation intent to POST /api/admin/commerce/orders?action=cancel
 */
export async function cancelAdminOrderClient(
  orderId: string,
  options: CancelAdminOrderOptions = {}
): Promise<CancelOrderResult> {
  const cleanOrderId = String(orderId || '').trim()
  if (!cleanOrderId) {
    throw new CommerceCartServiceError({
      code: 'INVALID_REQUEST',
      message: 'İptal işlemi için geçerli bir sipariş ID gereklidir.',
      statusCode: 400,
    })
  }

  const response = await fetch('/api/admin/commerce/orders?action=cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      orderId: cleanOrderId,
      reason: options.reason || undefined,
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

  return data
}

/**
 * Sends order refund intent to POST /api/admin/commerce/orders?action=refund
 */
export async function createAdminRefundClient(
  payload: CreateRefundRequest,
  options: CreateAdminRefundOptions = {}
): Promise<CreateRefundResult> {
  const cleanOrderId = String(payload.orderId || '').trim()
  if (!cleanOrderId) {
    throw new CommerceCartServiceError({
      code: 'INVALID_REQUEST',
      message: 'İade işlemi için geçerli bir sipariş ID gereklidir.',
      statusCode: 400,
    })
  }

  const response = await fetch('/api/admin/commerce/orders?action=refund', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      orderId: cleanOrderId,
      amount: payload.amount,
      reason: payload.reason,
      idempotencyKey: payload.idempotencyKey || undefined,
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

  return data
}
