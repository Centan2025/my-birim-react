import crypto from 'crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {getAuthTokenFromReq, verifyToken} from '../../lib/server/token.js'
import {getSafeSupabaseAdmin} from '../../lib/server/supabaseAdmin.js'
import {
  listAdminCommerceOrders,
  getAdminCommerceOrderDetail,
} from '../../lib/commerce/admin-order-service.js'
import {cancelCommerceOrder} from '../../lib/commerce/order-lifecycle.js'
import {createCommerceRefund} from '../../lib/commerce/refund-service.js'
import {getAdminCommerceMetrics} from '../../lib/commerce/admin-metrics-service.js'
import {CommerceValidationError} from '../../lib/commerce/types.js'

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
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, PATCH, DELETE, OPTIONS',
      allowHeaders: 'Content-Type, Authorization, x-admin-secret',
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

  const segments = slugArray.filter(s => s !== 'admin')
  const path = segments.join('/')

  if (
    path === 'members' ||
    segments[0] === 'members' ||
    (path === '' && (req.url?.includes('members') || req.body?.architect_verification_status))
  ) {
    return handleAdminMembers(req, res)
  }

  if (
    path === 'commerce/metrics' ||
    path === 'metrics' ||
    (segments.length >= 2 && segments[0] === 'commerce' && segments[1] === 'metrics')
  ) {
    return handleAdminCommerceMetrics(req, res)
  }

  if (
    path === 'commerce/orders' ||
    path === 'commerce/orders/index' ||
    path.startsWith('commerce/orders') ||
    path === 'orders' ||
    path.startsWith('orders') ||
    segments[0] === 'orders' ||
    (segments.length >= 2 && segments[0] === 'commerce' && segments[1] === 'orders') ||
    path === ''
  ) {
    return handleAdminCommerceOrders(req, res)
  }

  return res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Geçersiz admin endpointi: ${path}`,
  })
}

// -------------------------------------------------------------
// 1. Admin Members Handler
// -------------------------------------------------------------
async function handleAdminMembers(req: VercelRequest, res: VercelResponse) {
  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`admin_members_${ip}`, {limit: 100, windowMs: 60000})) {
    return res.status(429).json({error: 'Çok fazla istek. Lütfen biraz bekleyin.'})
  }

  let isAuthorized = false
  const token = getAuthTokenFromReq(req)
  if (token) {
    const payload = verifyToken(token)
    if (payload && payload.role === 'admin') {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    const adminSecretHeader = req.headers['x-admin-secret']
    if (isBreakGlassAuthorized(adminSecretHeader)) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({error: 'Yetkisiz erişim. Admin yetkisi gereklidir.'})
  }

  const supabaseAdmin = getSafeSupabaseAdmin()
  if (!supabaseAdmin) {
    return res.status(503).json({error: 'Supabase sunucu bağlantısı yapılandırılmamış.'})
  }

  if (req.method === 'GET') {
    try {
      const {data: profiles, error} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', {ascending: false})

      if (error) {
        console.error('[Admin Members] Get error:', error)
        return res.status(500).json({error: error.message})
      }

      return res.status(200).json({
        success: true,
        count: profiles?.length || 0,
        members: profiles || [],
      })
    } catch (err: unknown) {
      console.error('[Admin Members] Error:', err)
      return res.status(500).json({error: 'Üyeler yüklenirken bir hata oluştu.'})
    }
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const {
        id,
        architect_verification_status,
        role,
        is_verified,
        name,
        company,
        country,
        profession,
        phone,
        tax_id,
      } = req.body || {}

      if (!id || typeof id !== 'string') {
        return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (architect_verification_status !== undefined) {
        updates['architect_verification_status'] = architect_verification_status
      }
      if (role !== undefined) {
        updates['role'] = role
      }
      if (typeof is_verified === 'boolean') {
        updates['is_verified'] = is_verified
      }
      if (name !== undefined) {
        updates['name'] = name ? String(name).trim() : null
      }
      if (company !== undefined) {
        updates['company'] = company ? String(company).trim() : null
      }
      if (country !== undefined) {
        updates['country'] = country ? String(country).trim() : null
      }
      if (profession !== undefined) {
        updates['profession'] = profession ? String(profession).trim() : null
      }
      if (phone !== undefined) {
        updates['phone'] = phone ? String(phone).trim() : null
      }
      if (tax_id !== undefined) {
        updates['tax_id'] = tax_id ? String(tax_id).trim() : null
      }

      const {data: updated, error} = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[Admin Members] Update error:', error)
        return res.status(500).json({error: error.message})
      }

      return res.status(200).json({
        success: true,
        message: 'Üye bilgileri başarıyla güncellendi.',
        member: updated,
      })
    } catch (err: unknown) {
      console.error('[Admin Members] Error:', err)
      return res.status(500).json({error: 'Üye güncellenirken bir hata oluştu.'})
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = String(req.query?.['id'] || req.body?.id || '').trim()
      if (!id) {
        return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})
      }

      const {error} = await supabaseAdmin.from('profiles').delete().eq('id', id)

      if (error) {
        console.error('[Admin Members] Delete error:', error)
        return res.status(500).json({error: error.message})
      }

      return res.status(200).json({
        success: true,
        message: 'Üye kaydı başarıyla silindi.',
      })
    } catch (err: unknown) {
      console.error('[Admin Members] Delete Error:', err)
      return res.status(500).json({error: 'Üye silinirken bir hata oluştu.'})
    }
  }

  return res.status(405).json({error: 'Method Not Allowed'})
}

// -------------------------------------------------------------
// 2. Admin Commerce Metrics Handler
// -------------------------------------------------------------
async function handleAdminCommerceMetrics(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Yalnızca GET istekleri desteklenir.',
    })
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`admin_commerce_metrics_${ip}`, {limit: 60, windowMs: 60000})) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.',
    })
  }

  let isAuthorized = false

  const token = getAuthTokenFromReq(req)
  if (token) {
    const payload = verifyToken(token)
    if (payload && payload.role === 'admin') {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    const adminSecretHeader = req.headers['x-admin-secret']
    if (isBreakGlassAuthorized(adminSecretHeader)) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Yetkisiz erişim. Admin yetkisi gereklidir.',
    })
  }

  try {
    const range = typeof req.query?.['range'] === 'string' ? req.query['range'] : undefined
    const from = typeof req.query?.['from'] === 'string' ? req.query['from'] : undefined
    const to = typeof req.query?.['to'] === 'string' ? req.query['to'] : undefined

    const result = await getAdminCommerceMetrics({
      range,
      from,
      to,
    })

    return res.status(200).json({
      success: true,
      ...result,
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
    console.error('[Admin Commerce Metrics API] Error:', sanitizedErrorMessage)

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Ticari metrikler hesaplanırken bir hata oluştu.',
    })
  }
}

// -------------------------------------------------------------
// 3. Admin Commerce Orders Handler
// -------------------------------------------------------------
async function handleAdminCommerceOrders(req: VercelRequest, res: VercelResponse) {
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

  const rawSlug = req.query?.['slug']
  const slugSegments = Array.isArray(rawSlug)
    ? rawSlug
    : typeof rawSlug === 'string'
      ? rawSlug.split('/').filter(Boolean)
      : []

  const isCancelSlug = slugSegments.includes('cancel')
  const isRefundSlug = slugSegments.includes('refund')
  const slugAction = isCancelSlug ? 'cancel' : isRefundSlug ? 'refund' : undefined

  if (req.method === 'POST') {
    const action = String(req.query?.['action'] || req.body?.action || slugAction || '').trim()

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

  const lastSegment = slugSegments[slugSegments.length - 1]
  const isSlugOrderId =
    lastSegment &&
    !['orders', 'commerce', 'index', 'cancel', 'refund', 'members', 'admin'].includes(lastSegment)
  const slugOrderId = isSlugOrderId ? lastSegment : undefined

  const orderId = String(req.query?.['orderId'] || req.query?.['id'] || slugOrderId || '').trim()

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
