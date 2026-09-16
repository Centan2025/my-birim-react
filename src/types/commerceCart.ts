import type {
  CommerceErrorCode,
  CartValidationResult,
  ValidatedCartItem,
} from '../../lib/commerce/types'

export interface CommerceCartItem {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface CommerceCartError {
  code: CommerceErrorCode
  message: string
  productId?: string
  variantId?: string
  statusCode?: number
}

export interface CommerceCartContextValue {
  items: CommerceCartItem[]
  validatedCart: CartValidationResult | null
  isValidating: boolean
  validationError: CommerceCartError | null
  isStale: boolean
  itemCount: number
  hasItems: boolean
  addItem: (productId: string, variantId?: string | null, quantity?: number) => Promise<void>
  removeItem: (productId: string, variantId?: string | null) => Promise<void>
  updateQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number
  ) => Promise<void>
  clearCart: () => void
  validateCart: () => Promise<void>
}

export type {CartValidationResult, ValidatedCartItem, CommerceErrorCode}
