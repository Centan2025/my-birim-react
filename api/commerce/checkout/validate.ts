import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../../lib/server/rateLimiter.js'
import {validateCheckout} from '../../../lib/commerce/checkout-validator.js'
import {CommerceValidationError} from '../../../lib/commerce/types.js'

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
  if (await isRateLimitedAsync(`checkout_validate_${ip}`, {limit: 30, windowMs: 60000})) {
    return res.status(429).json({
      valid: false,
      code: 'RATE_LIMITED',
      message: 'Çok fazla doğrulama isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
    })
  }

  // 4. Server-Authoritative Checkout & Fresh Catalog Validation
  try {
    const result = await validateCheckout(req.body)
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

    // Do not leak stack traces, DB details or PII to client
    console.error('[Commerce Checkout Validate API] Internal Error:', error)
    return res.status(500).json({
      valid: false,
      code: 'INTERNAL_ERROR',
      message: 'Sipariş bilgileri doğrulanırken beklenmeyen bir sunucu hatası oluştu.',
    })
  }
}
