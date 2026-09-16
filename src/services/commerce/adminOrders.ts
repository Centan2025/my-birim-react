import type {
  AdminOrderListQuery,
  AdminOrderListResult,
  AdminOrderDetailResult,
  AdminOrderListResponse,
  AdminOrderDetailResponse,
} from '../../../lib/commerce/admin-order-types'
import {CommerceCartServiceError, getLocalizedErrorMessage} from './cart'

export interface FetchAdminOrdersClientOptions {
  params?: AdminOrderListQuery
  signal?: AbortSignal
}

export interface FetchAdminOrderDetailClientOptions {
  signal?: AbortSignal
}

/**
 * Fetches paginated, filtered admin orders from GET /api/admin/commerce/orders
 */
export async function fetchAdminOrdersClient(
  options: FetchAdminOrdersClientOptions = {}
): Promise<AdminOrderListResult> {
  const queryParams = new URLSearchParams()
  const {params = {}, signal} = options

  if (params.page) queryParams.set('page', String(params.page))
  if (params.limit) queryParams.set('limit', String(params.limit))
  if (params.q) queryParams.set('q', params.q.trim())
  if (params.status) queryParams.set('status', params.status.trim())
  if (params.paymentStatus) queryParams.set('paymentStatus', params.paymentStatus.trim())
  if (params.startDate) queryParams.set('startDate', params.startDate.trim())
  if (params.endDate) queryParams.set('endDate', params.endDate.trim())

  const queryString = queryParams.toString()
  const url = `/api/admin/commerce/orders${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal,
  })

  const data: AdminOrderListResponse = await response.json()

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

  return {
    orders: data.orders,
    pagination: data.pagination,
  }
}

/**
 * Fetches complete snapshot detail for a specific order from GET /api/admin/commerce/orders?orderId=...
 */
export async function fetchAdminOrderDetailClient(
  orderId: string,
  options: FetchAdminOrderDetailClientOptions = {}
): Promise<AdminOrderDetailResult> {
  const cleanOrderId = String(orderId || '').trim()
  if (!cleanOrderId) {
    throw new CommerceCartServiceError({
      code: 'INVALID_REQUEST',
      message: 'Geçersiz sipariş ID.',
      statusCode: 400,
    })
  }

  const response = await fetch(
    `/api/admin/commerce/orders?orderId=${encodeURIComponent(cleanOrderId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      signal: options.signal,
    }
  )

  const data: AdminOrderDetailResponse = await response.json()

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
