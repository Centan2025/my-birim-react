import type {ProductVariantOption} from '../../src/types'

export type CommerceErrorCode =
  | 'COMMERCE_DISABLED'
  | 'INVALID_REQUEST'
  | 'EMPTY_CART'
  | 'CART_TOO_LARGE'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_NOT_BUYABLE'
  | 'PRODUCT_NOT_FOR_SALE'
  | 'PRODUCT_NOT_AVAILABLE'
  | 'INVALID_SALES_MODE'
  | 'VARIANT_REQUIRED'
  | 'VARIANT_NOT_FOUND'
  | 'VARIANT_DISABLED'
  | 'VARIANT_PRODUCT_MISMATCH'
  | 'INVALID_VARIANT'
  | 'INVALID_PRICE'
  | 'INVALID_CURRENCY'
  | 'CART_CURRENCY_MISMATCH'
  | 'INVALID_QUANTITY'
  | 'RATE_LIMITED'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'PRICE_CHANGED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR'
  | 'ORDER_NOT_FOUND'
  | 'ORDER_NOT_CANCELLABLE'
  | 'INVALID_ORDER_TRANSITION'
  | 'REFUND_NOT_ALLOWED'
  | 'REFUND_AMOUNT_INVALID'
  | 'REFUND_AMOUNT_EXCEEDS_REMAINING'
  | 'REFUND_IDEMPOTENCY_KEY_REUSED'

export class CommerceValidationError extends Error {
  public statusCode: number
  public code: CommerceErrorCode
  public productId?: string
  public variantId?: string

  constructor(
    statusCode: number,
    code: CommerceErrorCode,
    message: string,
    details?: {productId?: string; variantId?: string}
  ) {
    super(message)
    this.name = 'CommerceValidationError'
    this.statusCode = statusCode
    this.code = code
    this.productId = details?.productId
    this.variantId = details?.variantId
  }
}

export interface CartItemInput {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface CartValidateRequest {
  items: CartItemInput[]
}

export interface ValidatedCartItem {
  productId: string
  variantId?: string | null
  productName: string
  sku?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
  selectedOptions?: ProductVariantOption[] | null
}

export interface CartValidationResult {
  valid: true
  currency: string
  items: ValidatedCartItem[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
}

export interface CartValidationErrorResponse {
  valid: false
  code: CommerceErrorCode
  message: string
  productId?: string
  variantId?: string
}
