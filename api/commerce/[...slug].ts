import type {VercelRequest, VercelResponse} from '@vercel/node'
import {z} from 'zod'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {validateCart} from '../../lib/commerce/cart-validator.js'
import {validateCheckout} from '../../lib/commerce/checkout-validator.js'
import {
  createCommerceOrder,
  getCommerceOrderById,
  listCommerceOrdersForUser,
} from '../../lib/commerce/order-service.js'
import {
  initiatePayment,
  getPaymentStatus,
  handlePaymentCallback,
} from '../../lib/commerce/payment/payment-service.js'
import {PaymentError} from '../../lib/commerce/payment/errors.js'
import {CommerceValidationError} from '../../lib/commerce/types.js'
import {getAuthTokenFromReq, verifyToken} from '../../lib/server/token.js'

// Strict cart validation schema
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
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, OPTIONS',
      allowHeaders:
        'Content-Type, Authorization, x-guest-token, x-payment-signature, x-idempotency-key',
      allowCredentials: true,
    })
  ) {
    return
  }

  const rawSlug = req.query?.['slug']
  const slugArray: string[] = Array.isArray(rawSlug)
    ? rawSlug
    : typeof rawSlug === 'string'
      ? [rawSlug]
      : (req.url?.split('?')[0] ?? '').split('/').filter(Boolean).slice(1)

  const segments = slugArray.filter(s => s !== 'commerce')
  const path = segments.join('/')

  const isCart =
    path === 'cart/validate' ||
    path === 'cart' ||
    Boolean(req.url?.includes('cart')) ||
    (path === '' &&
      req.body &&
      Array.isArray((req.body as Record<string, unknown>).items) &&
      !(req.body as Record<string, unknown>)['customer'])
  if (isCart) {
    return handleCartValidate(req, res)
  }

  const isCheckout =
    path === 'checkout/validate' ||
    path === 'checkout' ||
    Boolean(req.url?.includes('checkout')) ||
    (path === '' &&
      req.body &&
      ((req.body as Record<string, unknown>)['customer'] ||
        (req.body as Record<string, unknown>)['shippingAddress']))
  if (isCheckout) {
    return handleCheckoutValidate(req, res)
  }

  const isPayment =
    path === 'payments' ||
    path === 'payments/index' ||
    Boolean(req.url?.includes('payments')) ||
    (path === '' &&
      (req.query?.['transactionId'] ||
        (req.body as Record<string, unknown> | undefined)?.['paymentTransactionId'] ||
        (req.body as Record<string, unknown> | undefined)?.['action'] === 'mock_complete' ||
        (req.body as Record<string, unknown> | undefined)?.['action'] === 'callback'))
  if (isPayment) {
    return handlePayments(req, res)
  }

  return handleOrders(req, res)
}

export async function handleCartValidate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({
      valid: false,
      code: 'INVALID_REQUEST',
      message: 'Method Not Allowed. Yalnızca POST istekleri desteklenir.',
    })
  }

  const ip = getClientIp(req)
  if (
    process.env['NODE_ENV'] !== 'test' &&
    (await isRateLimitedAsync(`cart_validate_${ip}`, {limit: 30, windowMs: 60000}))
  ) {
    return res.status(429).json({
      valid: false,
      code: 'RATE_LIMITED',
      message: 'Çok fazla doğrulama isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
    })
  }

  const parseResult = cartValidateSchema.safeParse(req.body)
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Geçersiz sepet verisi.'
    return res.status(400).json({
      valid: false,
      code: 'INVALID_REQUEST',
      message: firstError,
    })
  }

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

    console.error('[Commerce Cart Validate API] Internal Error:', error)
    return res.status(500).json({
      valid: false,
      code: 'INTERNAL_ERROR',
      message: 'Sepet doğrulanırken beklenmeyen bir sunucu hatası oluştu.',
    })
  }
}

export async function handleCheckoutValidate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({
      valid: false,
      code: 'INVALID_REQUEST',
      message: 'Method Not Allowed. Yalnızca POST istekleri desteklenir.',
    })
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`checkout_validate_${ip}`, {limit: 30, windowMs: 60000})) {
    return res.status(429).json({
      valid: false,
      code: 'RATE_LIMITED',
      message: 'Çok fazla doğrulama isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
    })
  }

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

    console.error('[Commerce Checkout Validate API] Internal Error:', error)
    return res.status(500).json({
      valid: false,
      code: 'INTERNAL_ERROR',
      message: 'Sipariş bilgileri doğrulanırken beklenmeyen bir sunucu hatası oluştu.',
    })
  }
}

export async function handleOrders(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Yalnızca GET ve POST istekleri desteklenir.',
    })
  }

  const ip = getClientIp(req)

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

  if (req.method === 'GET') {
    if (await isRateLimitedAsync(`order_get_${ip}`, {limit: 30, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message:
          'Çok fazla sipariş sorgulama isteği gönderildi. Lütfen bir süre sonra tekrar deneyin.',
      })
    }

    const orderId = String(req.query?.['orderId'] || req.query?.['id'] || '').trim()

    if (orderId) {
      const guestTokenHeader = req.headers['x-guest-token']
      const guestToken =
        typeof guestTokenHeader === 'string'
          ? guestTokenHeader.trim()
          : typeof req.query?.['guestToken'] === 'string'
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

    const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Commerce Orders API] Internal Error:', sanitizedErrorMessage)

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Sipariş oluşturulurken beklenmeyen bir sunucu hatası oluştu.',
    })
  }
}

export async function handlePayments(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Yalnızca GET ve POST desteklenir.',
    })
  }

  const ip = getClientIp(req)

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

  const guestTokenHeader = req.headers['x-guest-token']
  const guestToken =
    typeof guestTokenHeader === 'string'
      ? guestTokenHeader.trim()
      : typeof req.query?.['guestToken'] === 'string'
        ? req.query['guestToken'].trim()
        : null

  if (req.method === 'GET') {
    if (await isRateLimitedAsync(`payment_get_${ip}`, {limit: 60, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.',
      })
    }

    const transactionId = String(req.query?.['transactionId'] || req.query?.['id'] || '').trim()
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: "Ödeme işlem kimliği ('transactionId') gereklidir.",
      })
    }

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

      const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Commerce Payments API] Status Error:', sanitizedErrorMessage)

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Ödeme durumu sorgulanırken bir hata oluştu.',
      })
    }
  }

  const action = String(req.query?.['action'] || req.body?.action || '').trim()

  if (action === 'initiate' || !action) {
    if (await isRateLimitedAsync(`payment_initiate_${ip}`, {limit: 15, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Çok fazla ödeme başlatma isteği gönderildi. Lütfen biraz bekleyin.',
      })
    }

    const orderId = String(req.body?.orderId || '').trim()
    const idempotencyKey =
      (typeof req.headers['x-idempotency-key'] === 'string'
        ? req.headers['x-idempotency-key'].trim()
        : null) ||
      (typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey.trim() : null)

    if (!orderId) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: "Sipariş kimliği ('orderId') gereklidir.",
      })
    }

    try {
      const payment = await initiatePayment(
        {
          orderId,
          guestToken,
          idempotencyKey,
        },
        {
          userId,
        }
      )
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

      const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Commerce Payments API] Initiate Error:', sanitizedErrorMessage)

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Ödeme başlatılırken bir hata oluştu.',
      })
    }
  }

  if (action === 'callback' || action === 'mock_complete') {
    const rawStatus = String(req.body?.status || '').toUpperCase()
    const paymentTransactionId = String(req.body?.paymentTransactionId || '').trim()
    const orderId = String(req.body?.orderId || '').trim()

    let mappedStatus: 'SUCCESS' | 'FAILED' | 'PROCESSING' = 'SUCCESS'
    if (rawStatus === 'SUCCESS') {
      mappedStatus = 'SUCCESS'
    } else if (rawStatus === 'FAILED') {
      mappedStatus = 'FAILED'
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

      const sanitizedErrorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Commerce Payments API] Callback Error:', sanitizedErrorMessage)

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Ödeme geri bildirimi işlenirken bir hata oluştu.',
      })
    }
  }

  return res.status(400).json({
    success: false,
    code: 'INVALID_ACTION',
    message: 'Geçersiz ödeme işlemi.',
  })
}
