export type RefundStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface RefundRecord {
  id: string
  orderId: string
  paymentTransactionId?: string | null
  idempotencyKey?: string | null
  amount: number
  currency: string
  reason: string
  status: RefundStatus
  provider: string
  providerRefundId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt?: string
}

export interface CreateRefundRequest {
  orderId: string
  amount: number
  reason: string
  idempotencyKey?: string | null
}

export interface CreateRefundResult {
  success: true
  isExisting: boolean
  refundId: string
  orderId: string
  amount: number
  currency: string
  status: RefundStatus
  reason: string
  orderStatus: string
  remainingRefundable: number
  createdAt: string
}

export interface RefundCalculation {
  orderTotal: number
  alreadyRefunded: number
  remainingRefundable: number
  currency: string
  isFullyRefunded: boolean
}

export interface OrderEventRecord {
  id: string
  orderId: string
  eventType: string
  actorType: 'system' | 'customer' | 'admin'
  actorId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}
