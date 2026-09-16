import type {CommerceCartItem, CommerceCartError} from '../../types/commerceCart'
import type {CartValidationResult, CartValidationErrorResponse} from '../../../lib/commerce/types'

export class CommerceCartServiceError extends Error implements CommerceCartError {
  public code: CommerceCartError['code']
  public productId?: string
  public variantId?: string
  public statusCode?: number

  constructor(error: CommerceCartError) {
    super(error.message)
    this.name = 'CommerceCartServiceError'
    this.code = error.code
    this.productId = error.productId
    this.variantId = error.variantId
    this.statusCode = error.statusCode
  }
}

/**
 * Maps technical error codes to clear user-friendly Turkish messages if needed
 */
export function getLocalizedErrorMessage(code: string, defaultMessage?: string): string {
  switch (code) {
    case 'COMMERCE_DISABLED':
      return 'Online satış hizmeti şu anda aktif değildir.'
    case 'PRODUCT_NOT_FOUND':
      return 'Sepetteki ürünlerden biri artık mevcut değil.'
    case 'PRODUCT_NOT_BUYABLE':
    case 'PRODUCT_NOT_FOR_SALE':
    case 'PRODUCT_NOT_AVAILABLE':
      return 'Sepetteki ürünlerden biri şu anda doğrudan satın alınamıyor.'
    case 'INVALID_SALES_MODE':
      return 'Bu ürün yalnızca teklif ile temin edilebilir.'
    case 'VARIANT_REQUIRED':
      return 'Bu ürün için lütfen bir model/seçenek seçiniz.'
    case 'VARIANT_NOT_FOUND':
    case 'VARIANT_DISABLED':
      return 'Seçtiğiniz ürün seçeneği şu anda mevcut değil.'
    case 'VARIANT_PRODUCT_MISMATCH':
      return 'Seçilen ürün seçeneği ürünle eşleşmiyor.'
    case 'INVALID_PRICE':
      return 'Ürün fiyatı güncelleniyor, lütfen daha sonra tekrar deneyiniz.'
    case 'INVALID_CURRENCY':
    case 'CART_CURRENCY_MISMATCH':
      return 'Sepetinizde farklı para birimlerine sahip ürünler bir arada bulunamaz.'
    case 'INVALID_QUANTITY':
      return 'Lütfen geçerli bir ürün adedi giriniz (1-100 arası).'
    case 'CART_TOO_LARGE':
      return 'Sepetinizde en fazla 50 farklı ürün bulunabilir.'
    case 'EMPTY_CART':
      return 'Sepetinizde ürün bulunmamaktadır.'
    case 'RATE_LIMITED':
      return 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyiniz.'
    default:
      return defaultMessage || 'Sepet doğrulanırken bir hata oluştu.'
  }
}

/**
 * Validates commerce cart items against the authoritative server endpoint (/api/commerce/cart/validate).
 * Strictly transmits only intent data (productId, variantId, quantity).
 */
export async function validateCommerceCart(
  items: CommerceCartItem[],
  signal?: AbortSignal
): Promise<CartValidationResult> {
  if (!items || items.length === 0) {
    throw new CommerceCartServiceError({
      code: 'EMPTY_CART',
      message: 'Sepetinizde ürün bulunmamaktadır.',
      statusCode: 422,
    })
  }

  // Pure payload sanitization: never transmit client prices, currency, or unauthorized fields
  const sanitizedItems = items.map(item => ({
    productId: String(item.productId || '').trim(),
    variantId: item.variantId ? String(item.variantId).trim() : undefined,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  }))

  const response = await fetch('/api/commerce/cart/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({items: sanitizedItems}),
    signal,
  })

  const data: CartValidationResult | CartValidationErrorResponse = await response.json()

  if (!response.ok || !data || data.valid !== true) {
    const errorData = data as CartValidationErrorResponse
    const code = errorData?.code || 'INTERNAL_ERROR'
    const serverMsg = errorData?.message
    const friendlyMsg = getLocalizedErrorMessage(code, serverMsg)

    throw new CommerceCartServiceError({
      code,
      message: friendlyMsg,
      productId: errorData?.productId,
      variantId: errorData?.variantId,
      statusCode: response.status,
    })
  }

  return data
}
