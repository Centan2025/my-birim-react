import type {OrderItemSnapshot} from './order-types'
import type {RefundRecord, OrderEventRecord} from './refund-types'

export interface AdminOrderSummary {
  id: string
  orderNumber: string
  userId?: string | null
  customerType?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  status: string
  paymentStatus: string
  currency: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  itemsCount: number
  createdAt: string
}

export interface AdminPaymentTransactionSnapshot {
  id: string
  orderId: string
  provider: string
  providerPaymentId?: string | null
  providerTransactionId?: string | null
  amount: number
  currency: string
  status: string
  installment: number
  errorCode?: string | null
  errorMessage?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt?: string
}

export interface AdminOrderDetailResult {
  id: string
  orderNumber: string
  userId?: string | null
  status: string
  paymentStatus: string
  currency: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  customerType: string
  customerName: string
  customerEmail: string
  customerPhone: string
  billingAddress: Record<string, unknown>
  shippingAddress: Record<string, unknown>
  notes?: string | null
  items: OrderItemSnapshot[]
  paymentTransactions: AdminPaymentTransactionSnapshot[]
  refunds: RefundRecord[]
  orderEvents: OrderEventRecord[]
  alreadyRefunded: number
  remainingRefundable: number
  createdAt: string
  updatedAt?: string
}

export interface AdminOrderListQuery {
  page?: number
  limit?: number
  q?: string
  status?: string
  paymentStatus?: string
  startDate?: string
  endDate?: string
}

export interface AdminOrderListPagination {
  total: number
  limit: number
  page: number
  totalPages: number
}

export interface AdminOrderListResult {
  orders: AdminOrderSummary[]
  pagination: AdminOrderListPagination
}

export interface AdminOrderListSuccessResponse {
  success: true
  orders: AdminOrderSummary[]
  pagination: AdminOrderListPagination
}

export interface AdminOrderListErrorResponse {
  success: false
  code: string
  message: string
}

export type AdminOrderListResponse = AdminOrderListSuccessResponse | AdminOrderListErrorResponse

export interface AdminOrderDetailSuccessResponse {
  success: true
  order: AdminOrderDetailResult
}

export interface AdminOrderDetailErrorResponse {
  success: false
  code: string
  message: string
}

export type AdminOrderDetailResponse =
  | AdminOrderDetailSuccessResponse
  | AdminOrderDetailErrorResponse
