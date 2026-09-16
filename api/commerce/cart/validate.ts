import type {VercelRequest, VercelResponse} from '@vercel/node'
import {z} from 'zod'
import {handleCors} from '../../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../../lib/server/rateLimiter.js'
import {validateCart} from '../../../lib/commerce/cart-validator.js'
import {CommerceValidationError} from '../../../lib/commerce/types.js'

// Strict schema rejecting unauthorized fields like unitPrice, totalPrice, grandTotal, currency, sku
const cartItemSchema = z
  .object({
    productId: z
      .string({required_error: 'productId zorunludur.'})
      .trim()
      .min(1, 'productId boş olamaz.')
      .max(100, 'productId çok uzun.'),
    variantId: z.string().trim().min(1).max(100).nullable().optional(),
    quantity: z
      .number({required_error: 'quantity zorunludur.'})
      .int('quantity bir tam sayı olmalıdır.')
      .min(1, 'quantity en az 1 olmalıdır.')
      .max(100, 'quantity en fazla 100 olabilir.'),
  })
  .strict({
    message:
      'İstemci tarafından fiyat, para birimi veya toplam gibi yetkisiz alanlar gönderilemez.',
  })

const cartValidateSchema = z
  .object({
    items: z
      .array(cartItemSchema, {required_error: 'items dizisi zorunludur.'})
      .min(1, 'Sepette en az 1 ürün bulunmalıdır.')
      .max(50, 'Sepette en fazla 50 farklı ürün bulunabilir.'),
  })
  .strict({
    message: 'Yetkisiz üst düzey alanlar gönderilemez.',
  })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Preflight & Headers
  if (
    handleCors(req, res, {
      allowMethods: 'POST, OPTIONS',
      allowHeaders: 'Content-Type, Authorization',
      allowCredentials: true,
    })
  ) {
    return
  }

  // 2. Only POST allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({
      valid: false,
      code: 'INVALID_REQUEST',
      message: 'Method Not Allowed. Yalnızca POST istekleri desteklenir.',
    })
  }

  // 3. Rate Limiting (30 requests / minute per IP)
  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`cart_validate_${ip}`, {limit: 30, windowMs: 60000})) {
    return res.status(429).json({
      valid: false,
      code: 'RATE_LIMITED',
      message: 'Çok fazla doğrulama isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
    })
  }

  // 4. Strict Input Validation with Zod
  const parseResult = cartValidateSchema.safeParse(req.body)
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Geçersiz sepet verisi.'
    return res.status(400).json({
      valid: false,
      code: 'INVALID_REQUEST',
      message: firstError,
    })
  }

  // 5. Server-Authoritative Cart Validation
  try {
    const result = await validateCart(parseResult.data.items)
    return res.status(200).json(result)
  } catch (error: unknown) {
    if (error instanceof CommerceValidationError) {
      return res.status(error.statusCode).json({
        valid: false,
        code: error.code,
        message: error.message,
        productId: error.productId,
        variantId: error.variantId,
      })
    }

    // Do not leak stack traces or internal errors to client
    console.error('[Commerce Cart Validate API] Internal Error:', error)
    return res.status(500).json({
      valid: false,
      code: 'INTERNAL_ERROR',
      message: 'Sepet doğrulanırken beklenmeyen bir sunucu hatası oluştu.',
    })
  }
}
