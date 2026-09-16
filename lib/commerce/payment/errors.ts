export type PaymentErrorCode =
  | 'PAYMENT_DISABLED'
  | 'MOCK_PROVIDER_DISABLED'
  | 'PAYMENT_PROVIDER_UNAVAILABLE'
  | 'PAYMENT_PROVIDER_NOT_CONFIGURED'
  | 'PAYMENT_ORDER_NOT_FOUND'
  | 'PAYMENT_TRANSACTION_NOT_FOUND'
  | 'PAYMENT_ORDER_NOT_OWNED'
  | 'PAYMENT_ORDER_NOT_PAYABLE'
  | 'PAYMENT_ALREADY_PAID'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'PAYMENT_CURRENCY_MISMATCH'
  | 'PAYMENT_IDEMPOTENCY_KEY_REUSED'
  | 'PAYMENT_ALREADY_PROCESSING'
  | 'PAYMENT_INVALID_STATE'
  | 'PAYMENT_CALLBACK_INVALID'
  | 'PAYMENT_CALLBACK_DUPLICATE'
  | 'PAYMENT_PROVIDER_ERROR'
  | 'PAYMENT_UNKNOWN'
  | 'INVALID_REQUEST'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export class PaymentError extends Error {
  public statusCode: number
  public code: PaymentErrorCode
  public details?: Record<string, unknown>

  constructor(
    statusCode: number,
    code: PaymentErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PaymentError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}
