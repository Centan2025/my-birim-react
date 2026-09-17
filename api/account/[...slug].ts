import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {getAuthTokenFromReq, verifyToken} from '../../lib/server/token.js'
import {
  AccountError,
  getProfileForUser,
  updateProfileForUser,
  listAddressesForUser,
  createAddressForUser,
  updateAddressForUser,
  deleteAddressForUser,
  setDefaultAddressForUser,
  listBillingProfilesForUser,
  createBillingProfileForUser,
  updateBillingProfileForUser,
  deleteBillingProfileForUser,
  setDefaultBillingProfileForUser,
  listOrdersForUser,
  getOrderForUser,
} from '../../lib/account/account-service.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      allowHeaders: 'Content-Type, Authorization, x-api-secret',
      allowCredentials: true,
    })
  ) {
    return
  }

  // 1. Rate Limiter
  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`account_rate_${ip}`, {limit: 120, windowMs: 60000})) {
    return res.status(429).json({error: 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.'})
  }

  // 2. Authentication Check
  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(401).json({error: 'Oturum açmanız gerekmektedir.'})
  }

  const payload = verifyToken(token)
  if (!payload || !payload.sub) {
    return res.status(401).json({error: 'Geçersiz veya süresi dolmuş oturum.'})
  }

  const userId = payload.sub

  // 3. Slug Path Parsing
  let slug = req.query['slug']
  if (!slug) {
    const urlParts = (req.url?.split('?')[0] || '').split('/').filter(Boolean)
    const accIdx = urlParts.indexOf('account')
    if (accIdx >= 0) {
      slug = urlParts.slice(accIdx + 1)
    } else {
      slug = []
    }
  } else if (!Array.isArray(slug)) {
    slug = [slug]
  }

  const [resource, idOrAction, subAction] = slug

  try {
    // --- PROFILE ---
    if (resource === 'profile') {
      if (req.method === 'GET') {
        const profile = await getProfileForUser(userId)
        return res.status(200).json({success: true, profile})
      }
      if (req.method === 'PATCH' || req.method === 'PUT') {
        const profile = await updateProfileForUser(userId, req.body || {})
        return res.status(200).json({success: true, profile})
      }
      return res.status(405).json({error: 'Method Not Allowed'})
    }

    // --- ADDRESSES ---
    if (resource === 'addresses') {
      if (!idOrAction) {
        if (req.method === 'GET') {
          const addresses = await listAddressesForUser(userId)
          return res.status(200).json({success: true, addresses})
        }
        if (req.method === 'POST') {
          const address = await createAddressForUser(userId, req.body || {})
          return res.status(201).json({success: true, address})
        }
        return res.status(405).json({error: 'Method Not Allowed'})
      }

      const addressId = idOrAction
      if (subAction === 'default' && req.method === 'POST') {
        const address = await setDefaultAddressForUser(userId, addressId)
        return res.status(200).json({success: true, address})
      }

      if (req.method === 'PATCH' || req.method === 'PUT') {
        const address = await updateAddressForUser(userId, addressId, req.body || {})
        return res.status(200).json({success: true, address})
      }

      if (req.method === 'DELETE') {
        const result = await deleteAddressForUser(userId, addressId)
        return res.status(200).json(result)
      }

      return res.status(405).json({error: 'Method Not Allowed'})
    }
    // --- BILLING PROFILES ---
    if (resource === 'billing-profiles') {
      if (!idOrAction) {
        if (req.method === 'GET') {
          const billingProfiles = await listBillingProfilesForUser(userId)
          return res.status(200).json({success: true, billingProfiles})
        }
        if (req.method === 'POST') {
          const billingProfile = await createBillingProfileForUser(userId, req.body || {})
          return res.status(201).json({success: true, billingProfile})
        }
        return res.status(405).json({error: 'Method Not Allowed'})
      }

      const billingId = idOrAction
      if (subAction === 'default' && req.method === 'POST') {
        const billingProfile = await setDefaultBillingProfileForUser(userId, billingId)
        return res.status(200).json({success: true, billingProfile})
      }

      if (req.method === 'PATCH' || req.method === 'PUT') {
        const billingProfile = await updateBillingProfileForUser(userId, billingId, req.body || {})
        return res.status(200).json({success: true, billingProfile})
      }

      if (req.method === 'DELETE') {
        const result = await deleteBillingProfileForUser(userId, billingId)
        return res.status(200).json(result)
      }

      return res.status(405).json({error: 'Method Not Allowed'})
    }

    // --- ORDERS ---
    if (resource === 'orders') {
      if (!idOrAction) {
        if (req.method === 'GET') {
          const orders = await listOrdersForUser(userId)
          return res.status(200).json({success: true, orders})
        }
        return res.status(405).json({error: 'Method Not Allowed'})
      }

      const orderId = idOrAction
      if (req.method === 'GET') {
        const order = await getOrderForUser(userId, orderId)
        return res.status(200).json({success: true, order})
      }
      return res.status(405).json({error: 'Method Not Allowed'})
    }

    return res.status(404).json({error: `Bilinmeyen hesap kaynağı: ${resource || 'root'}`})
  } catch (error: unknown) {
    if (error instanceof AccountError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      })
    }

    console.error('[Account API Error]:', error)
    const message =
      error instanceof Error ? error.message : 'Hesap işlemi sırasında bir hata oluştu.'
    return res.status(500).json({error: message})
  }
}
