import type {CartItemInput} from './types.js'
import type {CheckoutPayload} from './checkout-types.js'

export interface CreateOrderRequest {
  items: CartItemInput[]
  checkout: CheckoutPayload
  expectedGrandTotal?: number | null
  idempotencyKey?: string | null
  notes?: string | null
}

export interface OrderResult {
  id: string
  orderNumber: string
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
  isExisting?: boolean
  guestToken?: string
}

export interface OrderItemSnapshot {
  productId: string
  variantId?: string | null
  productName: string
  sku: string
  selectedOptions?: Record<string, string> | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderDetailResult {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  currency: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  items: OrderItemSnapshot[]
  createdAt: string
}

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
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

export interface CreateOrderSuccessResponse {
  success: true
  order: OrderResult
}

export interface CreateOrderErrorResponse {
  success: false
  code: string
  message: string
  productId?: string
  variantId?: string
}

export type CreateOrderResponse = CreateOrderSuccessResponse | CreateOrderErrorResponse

export interface GetOrderSuccessResponse {
  success: true
  order: OrderDetailResult
}

export interface GetOrderErrorResponse {
  success: false
  code: string
  message: string
}

export type GetOrderResponse = GetOrderSuccessResponse | GetOrderErrorResponse

export interface ListOrdersSuccessResponse {
  success: true
  orders: CustomerOrderSummary[]
}

export interface ListOrdersErrorResponse {
  success: false
  code: string
  message: string
}

export type ListOrdersResponse = ListOrdersSuccessResponse | ListOrdersErrorResponse
