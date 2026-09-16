export type PaymentProviderId = 'mock' | 'test' | 'iyzico' | 'paytr' | 'stripe' | string

export type PaymentIntentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface PaymentIntent {
  id: string
  orderId: string
  orderNumber: string
  provider: PaymentProviderId
  amount: number
  amountMinor: number
  currency: string
  status: PaymentIntentStatus
  clientSecret?: string | null
  redirectUrl?: string | null
  createdAt: string
  isExisting?: boolean
}

export interface CreatePaymentIntentInput {
  orderId: string
  orderNumber: string
  amount: number
  amountMinor: number
  currency: string
  customer: {
    name: string
    email: string
    phone?: string | null
  }
  billingAddress: Record<string, unknown>
  shippingAddress: Record<string, unknown>
  items: Array<{
    productId: string
    variantId?: string | null
    name: string
    unitPrice: number
    quantity: number
  }>
  metadata?: Record<string, unknown>
}

export interface CreatePaymentIntentResult {
  providerTransactionId: string
  providerPaymentId?: string
  providerToken?: string
  status: PaymentIntentStatus
  clientSecret?: string | null
  redirectUrl?: string | null
  rawResponseScrubbed?: Record<string, unknown>
}

export interface GetPaymentStatusInput {
  providerTransactionId: string
  providerPaymentId?: string
}

export interface GetPaymentStatusResult {
  status: PaymentIntentStatus
  amountMinor?: number
  currency?: string
  paidAt?: string
  errorCode?: string
  errorMessage?: string
}

export interface VerifyPaymentCallbackInput {
  provider?: string
  payload: Record<string, unknown>
  headers: Record<string, string | string[] | undefined>
  rawBody?: string
}

export interface VerifiedPaymentEvent {
  provider: string
  providerEventId: string
  providerTransactionId?: string
  orderId?: string
  paymentTransactionId?: string
  status: PaymentIntentStatus
  amountMinor?: number
  currency?: string
  errorCode?: string
  errorMessage?: string
  occurredAt: string
}

export interface PaymentCallbackResult {
  success: boolean
  orderId?: string
  status: PaymentIntentStatus
  duplicate: boolean
  message?: string
}

export interface InitiatePaymentRequest {
  orderId: string
  guestToken?: string | null
  idempotencyKey?: string | null
}

export interface InitiatePaymentSuccessResponse {
  success: true
  payment: PaymentIntent
}

export interface InitiatePaymentErrorResponse {
  success: false
  code: string
  message: string
}

export type InitiatePaymentResponse = InitiatePaymentSuccessResponse | InitiatePaymentErrorResponse

export interface GetPaymentStatusSuccessResponse {
  success: true
  payment: PaymentIntent
}

export interface GetPaymentStatusErrorResponse {
  success: false
  code: string
  message: string
}

export type GetPaymentStatusResponse =
  | GetPaymentStatusSuccessResponse
  | GetPaymentStatusErrorResponse
