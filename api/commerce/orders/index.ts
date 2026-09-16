import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../../lib/server/rateLimiter.js'
import {getAuthTokenFromReq, verifyToken} from '../../../lib/server/token.js'
import {
  createCommerceOrder,
  getCommerceOrderById,
  listCommerceOrdersForUser,
} from '../../../lib/commerce/order-service.js'
import {CommerceValidationError} from '../../../lib/commerce/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Preflight & Headers
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, OPTIONS',
      allowHeaders: 'Content-Type, Authorization, x-guest-token',
      allowCredentials: true,
    })
  ) {
    return
  }

  // 2. Only GET and POST allowed
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Yalnızca GET ve POST istekleri desteklenir.',
    })
  }

  const ip = getClientIp(req)

  // 3. Authenticated User Extraction (Optional for Guest Access)
  let userId: string | null = null
  try {
    const rawToken = getAuthTokenFromReq(req)
    if (rawToken) {
      const verified = verifyToken(rawToken)
      if (verified && verified.sub) {
        userId = verified.sub
      }
    }
  } catch {
    userId = null
  }

  // 4. Handle GET (Single Order Lookup OR Customer Order History)
  if (req.method === 'GET') {
    if (await isRateLimitedAsync(`order_get_${ip}`, {limit: 30, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message:
          'Çok fazla sipariş sorgulama isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
      })
    }

    const orderId = String(req.query['orderId'] || req.query['id'] || '').trim()

    // 4A. If orderId is provided -> Single Order Lookup with IDOR / Guest Token check
    if (orderId) {
      const guestTokenHeader = req.headers['x-guest-token']
      const guestToken =
        typeof guestTokenHeader === 'string'
          ? guestTokenHeader.trim()
          : typeof req.query['guestToken'] === 'string'
            ? req.query['guestToken'].trim()
            : null

      try {
        const order = await getCommerceOrderById(orderId, {userId, guestToken})
        return res.status(200).json({
          success: true,
          order,
        })
      } catch (error: unknown) {
        if (error instanceof CommerceValidationError) {
          return res.status(error.statusCode).json({
            success: false,
            code: error.code,
            message: error.message,
          })
        }

        const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Commerce Orders API] Lookup Error:', sanitizedErrorMessage)

        return res.status(500).json({
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Sipariş bilgileri alınırken beklenmeyen bir sunucu hatası oluştu.',
        })
      }
    }

    // 4B. If orderId is omitted -> List Customer Orders (Requires Authentication)
    if (!userId) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Sipariş geçmişinizi görüntülemek için giriş yapmalısınız.',
      })
    }

    try {
      const orders = await listCommerceOrdersForUser(userId)
      return res.status(200).json({
        success: true,
        orders,
      })
    } catch (error: unknown) {
      if (error instanceof CommerceValidationError) {
        return res.status(error.statusCode).json({
          success: false,
          code: error.code,
          message: error.message,
        })
      }

      const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Commerce Orders API] List Orders Error:', sanitizedErrorMessage)

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Sipariş geçmişi alınırken beklenmeyen bir sunucu hatası oluştu.',
      })
    }
  }

  // 5. Handle POST (Order Creation & Transaction)
  if (await isRateLimitedAsync(`order_create_${ip}`, {limit: 10, windowMs: 60000})) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message:
        'Çok fazla sipariş oluşturma isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
    })
  }

  try {
    const order = await createCommerceOrder(req.body, {userId})
    const statusCode = order.isExisting ? 200 : 201
    return res.status(statusCode).json({
      success: true,
      order,
    })
  } catch (error: unknown) {
    if (error instanceof CommerceValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        productId: error.productId,
        variantId: error.variantId,
      })
    }

    // Zero PII logging: Do not leak customer details or request body
    const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Commerce Orders API] Internal Error:', sanitizedErrorMessage)

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Sipariş oluşturulurken beklenmeyen bir sunucu hatası oluştu.',
    })
  }
}
