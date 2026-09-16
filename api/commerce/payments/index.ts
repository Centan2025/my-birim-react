import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../../lib/server/rateLimiter.js'
import {getAuthTokenFromReq, verifyToken} from '../../../lib/server/token.js'
import {
  initiatePayment,
  handlePaymentCallback,
  getPaymentStatus,
} from '../../../lib/commerce/payment/payment-service.js'
import {PaymentError} from '../../../lib/commerce/payment/errors.js'
import type {PaymentIntentStatus} from '../../../lib/commerce/payment/types.js'

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

  // 3. Authenticated User Extraction (Optional for Guest Orders)
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

  // 4. Handle GET (Payment Status Recovery / Query)
  if (req.method === 'GET') {
    if (await isRateLimitedAsync(`payment_get_${ip}`, {limit: 30, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message:
          'Çok fazla ödeme sorgulama isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
      })
    }

    const transactionId = String(req.query['transactionId'] || req.query['id'] || '').trim()
    const guestTokenHeader = req.headers['x-guest-token']
    const guestToken =
      typeof guestTokenHeader === 'string'
        ? guestTokenHeader.trim()
        : typeof req.query['guestToken'] === 'string'
          ? req.query['guestToken'].trim()
          : null

    try {
      const payment = await getPaymentStatus(transactionId, {userId, guestToken})
      return res.status(200).json({
        success: true,
        payment,
      })
    } catch (error: unknown) {
      if (error instanceof PaymentError) {
        return res.status(error.statusCode).json({
          success: false,
          code: error.code,
          message: error.message,
        })
      }

      const sanitizedMsg = error instanceof Error ? error.message : 'Unknown payment lookup error'
      console.error('[Commerce Payments API] Lookup Error:', sanitizedMsg)

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Ödeme durumu sorgulanırken beklenmeyen bir sunucu hatası oluştu.',
      })
    }
  }

  const body = req.body || {}

  // 4. Handle Mock Completion Action (Dev/Test Simulation)
  if (body.action === 'mock_complete') {
    // Strict Production Isolation
    const isProd = process.env['NODE_ENV'] === 'production'
    const allowMockInProd = process.env['PAYMENT_ALLOW_MOCK'] === 'true'
    if (isProd && !allowMockInProd) {
      return res.status(403).json({
        success: false,
        code: 'MOCK_PROVIDER_DISABLED',
        message: 'Mock payment provider is strictly disabled in production.',
      })
    }

    if (await isRateLimitedAsync(`mock_payment_complete_${ip}`, {limit: 20, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyin.',
      })
    }

    const paymentTransactionId =
      typeof body.paymentTransactionId === 'string' ? body.paymentTransactionId.trim() : ''
    const rawStatus = typeof body.status === 'string' ? body.status.toUpperCase().trim() : 'SUCCESS'
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : undefined

    if (!paymentTransactionId) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: 'Geçersiz ödeme işlem referansı (paymentTransactionId).',
      })
    }

    let mappedStatus: PaymentIntentStatus = 'PAID'
    if (rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
      mappedStatus = 'PAID'
    } else if (rawStatus === 'FAIL' || rawStatus === 'FAILED') {
      mappedStatus = 'FAILED'
    } else if (rawStatus === 'CANCEL' || rawStatus === 'CANCELLED') {
      mappedStatus = 'CANCELLED'
    } else if (rawStatus === 'PROCESSING') {
      mappedStatus = 'PROCESSING'
    } else {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: 'Geçersiz simülasyon durumu.',
      })
    }

    try {
      const callbackResult = await handlePaymentCallback({
        provider: 'mock',
        headers: req.headers as Record<string, string | undefined>,
        payload: {
          paymentTransactionId,
          orderId,
          status: mappedStatus,
          eventId: `mock_evt_${Date.now()}`,
        },
        rawBody: JSON.stringify(req.body),
      })

      return res.status(200).json({
        success: true,
        status: mappedStatus,
        orderId: callbackResult.orderId || orderId,
        message: callbackResult.message,
      })
    } catch (error: unknown) {
      if (error instanceof PaymentError) {
        return res.status(error.statusCode).json({
          success: false,
          code: error.code,
          message: error.message,
        })
      }

      const sanitizedMsg = error instanceof Error ? error.message : 'Unknown mock payment error'
      console.error('[Mock Payments API] Error:', sanitizedMsg)

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Ödeme simülasyonu tamamlanırken hata oluştu.',
      })
    }
  }

  // 5. Standard Payment Initiation
  if (await isRateLimitedAsync(`payment_init_${ip}`, {limit: 10, windowMs: 60000})) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Çok fazla ödeme başlatma isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
    })
  }

  try {
    const payment = await initiatePayment(req.body, {userId})
    const statusCode = payment.isExisting ? 200 : 201
    return res.status(statusCode).json({
      success: true,
      payment,
    })
  } catch (error: unknown) {
    if (error instanceof PaymentError) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
      })
    }

    // Zero PII & Zero Card Data logging
    const sanitizedMsg = error instanceof Error ? error.message : 'Unknown payment error'
    console.error('[Commerce Payments API] Internal Error:', sanitizedMsg)

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Ödeme başlatılırken beklenmeyen bir sunucu hatası oluştu.',
    })
  }
}
