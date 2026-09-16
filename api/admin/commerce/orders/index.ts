import crypto from 'crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../../../lib/server/rateLimiter.js'
import {getAuthTokenFromReq, verifyToken} from '../../../../lib/server/token.js'
import {
  listAdminCommerceOrders,
  getAdminCommerceOrderDetail,
} from '../../../../lib/commerce/admin-order-service.js'
import {cancelCommerceOrder} from '../../../../lib/commerce/order-lifecycle.js'
import {createCommerceRefund} from '../../../../lib/commerce/refund-service.js'
import {CommerceValidationError} from '../../../../lib/commerce/types.js'

function isBreakGlassAuthorized(adminSecretHeader?: string | string[]): boolean {
  const expectedSecret = process.env['ADMIN_SECRET']?.trim()
  if (!expectedSecret || !adminSecretHeader || typeof adminSecretHeader !== 'string') {
    return false
  }
  const providedBuf = Buffer.from(adminSecretHeader.trim())
  const expectedBuf = Buffer.from(expectedSecret)
  if (providedBuf.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(providedBuf, expectedBuf)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Preflight & Headers
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, OPTIONS',
      allowHeaders: 'Content-Type, Authorization, x-admin-secret',
      allowCredentials: true,
    })
  ) {
    return
  }

  // 2. Only GET and POST allowed
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Yalnızca GET ve POST istekleri desteklenir.',
    })
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`admin_commerce_orders_${ip}`, {limit: 60, windowMs: 60000})) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.',
    })
  }

  // 3. Strict Admin Authorization
  // 1. Primary: Verified Admin JWT token with role === 'admin'
  // 2. Break-Glass: Secure ADMIN_SECRET header matching process.env['ADMIN_SECRET']
  let isAuthorized = false
  let adminUserId: string | null = null

  const token = getAuthTokenFromReq(req)
  if (token) {
    const payload = verifyToken(token)
    if (payload && payload.role === 'admin') {
      isAuthorized = true
      adminUserId = payload.sub || null
    }
  }

  if (!isAuthorized) {
    const adminSecretHeader = req.headers['x-admin-secret']
    if (isBreakGlassAuthorized(adminSecretHeader)) {
      isAuthorized = true
      adminUserId = 'break_glass_admin'
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Yetkisiz erişim. Admin yetkisi gereklidir.',
    })
  }

  // 4. Handle POST (Admin Actions: Cancel / Refund)
  if (req.method === 'POST') {
    const action = String(req.query?.['action'] || req.body?.action || '').trim()

    if (action === 'cancel') {
      try {
        const result = await cancelCommerceOrder(req.body, {
          actorType: 'admin',
          actorId: adminUserId,
        })
        return res.status(200).json(result)
      } catch (error: unknown) {
        if (error instanceof CommerceValidationError) {
          return res.status(error.statusCode).json({
            success: false,
            code: error.code,
            message: error.message,
          })
        }

        const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Admin Commerce Orders API] Cancel Error:', sanitizedErrorMessage)

        return res.status(500).json({
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Sipariş iptal edilirken bir sunucu hatası oluştu.',
        })
      }
    }

    if (action === 'refund') {
      try {
        const result = await createCommerceRefund(req.body, {
          actorType: 'admin',
          actorId: adminUserId,
        })
        return res.status(200).json(result)
      } catch (error: unknown) {
        if (error instanceof CommerceValidationError) {
          return res.status(error.statusCode).json({
            success: false,
            code: error.code,
            message: error.message,
          })
        }

        const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Admin Commerce Orders API] Refund Error:', sanitizedErrorMessage)

        return res.status(500).json({
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'İade işlemi gerçekleştirilirken bir sunucu hatası oluştu.',
        })
      }
    }

    return res.status(400).json({
      success: false,
      code: 'INVALID_ACTION',
      message: 'Geçersiz admin işlemi. Desteklenen işlemler: cancel, refund.',
    })
  }

  // 5. Handle GET (Single Order Lookup OR Order List)
  const orderId = String(req.query?.['orderId'] || req.query?.['id'] || '').trim()

  // 5A. Single Order Detail
  if (orderId) {
    try {
      const order = await getAdminCommerceOrderDetail(orderId)
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
      console.error('[Admin Commerce Orders API] Detail Error:', sanitizedErrorMessage)

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Sipariş detayları alınırken bir hata oluştu.',
      })
    }
  }

  // 5B. List Orders with Search, Filter & Pagination
  try {
    const page = req.query?.['page'] ? parseInt(String(req.query['page']), 10) : 1
    const limit = req.query?.['limit'] ? parseInt(String(req.query['limit']), 10) : 20
    const q = typeof req.query?.['q'] === 'string' ? req.query['q'].trim().slice(0, 100) : undefined
    const status =
      typeof req.query?.['status'] === 'string'
        ? req.query['status'].trim().slice(0, 50)
        : undefined
    const paymentStatus =
      typeof req.query?.['paymentStatus'] === 'string'
        ? req.query['paymentStatus'].trim().slice(0, 50)
        : undefined
    const startDate =
      typeof req.query?.['startDate'] === 'string'
        ? req.query['startDate'].trim().slice(0, 50)
        : undefined
    const endDate =
      typeof req.query?.['endDate'] === 'string'
        ? req.query['endDate'].trim().slice(0, 50)
        : undefined

    const result = await listAdminCommerceOrders({
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
      q: q || undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })

    return res.status(200).json({
      success: true,
      orders: result.orders,
      pagination: result.pagination,
    })
  } catch (error: unknown) {
    const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Admin Commerce Orders API] List Error:', sanitizedErrorMessage)

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Siparişler listelenirken bir hata oluştu.',
    })
  }
}
