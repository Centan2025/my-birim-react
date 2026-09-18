import type {VercelRequest, VercelResponse} from '@vercel/node'
import {createClient} from '@supabase/supabase-js'
import {getSafeSupabaseAdmin} from '../lib/server/supabaseAdmin.js'
import {handleCors} from '../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../lib/server/rateLimiter.js'
import {getAuthTokenFromReq, verifyToken} from '../lib/server/token.js'
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
  listSelectionsForUser,
  saveSelectionForUser,
  removeSelectionForUser,
  clearSelectionsForUser,
  bulkSyncSelectionsForUser,
  listProjectsForUser,
  createProjectForUser,
  updateProjectForUser,
  deleteProjectForUser,
  getProjectByShareToken,
} from '../lib/account/account-service.js'

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

  // 2. Slug Path Parsing
  const rawSlug = req.query['slug']
  let slug: string[] = []

  if (Array.isArray(rawSlug)) {
    slug = rawSlug.flatMap(s => String(s).split('/')).filter(Boolean)
  } else if (typeof rawSlug === 'string' && rawSlug.trim()) {
    slug = rawSlug.split('/').filter(Boolean)
  } else {
    const urlParts = (req.url?.split('?')[0] || '').split('/').filter(Boolean)
    const accIdx = urlParts.indexOf('account')
    if (accIdx >= 0) {
      slug = urlParts.slice(accIdx + 1)
    }
  }

  const [resource, idOrAction, subAction] = slug

  // Public shared project lookup (does not require login)
  if (resource === 'projects' && idOrAction === 'share' && subAction) {
    if (req.method === 'GET') {
      const project = await getProjectByShareToken(subAction)
      if (!project) {
        return res.status(404).json({error: 'Proje bulunamadı.'})
      }
      return res.status(200).json({success: true, project})
    }
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  // 3. Authentication Check
  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(401).json({error: 'Oturum açmanız gerekmektedir.'})
  }

  const payload = verifyToken(token)
  if (!payload || !payload.sub) {
    return res.status(401).json({error: 'Geçersiz veya süresi dolmuş oturum.'})
  }

  const userId = payload.sub

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

    // --- CHANGE PASSWORD ---
    if (resource === 'change-password') {
      if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method Not Allowed'})
      }
      const {currentPassword, newPassword} = req.body || {}
      if (!currentPassword || !newPassword) {
        return res.status(400).json({error: 'Mevcut şifre ve yeni şifre gereklidir.'})
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({error: 'Yeni şifre en az 6 karakter olmalıdır.'})
      }

      const supabaseAdmin = getSafeSupabaseAdmin()
      if (!supabaseAdmin) {
        return res.status(500).json({error: 'Veritabanı servisi kullanılamıyor.'})
      }

      const {data: usrData, error: usrErr} = await supabaseAdmin.auth.admin.getUserById(userId)
      if (usrErr || !usrData?.user?.email) {
        return res.status(404).json({error: 'Kullanıcı hesabı bulunamadı.'})
      }

      const anonKey = process.env['VITE_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY']
      const sbUrl = process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL']
      if (anonKey && sbUrl) {
        const testClient = createClient(sbUrl, anonKey, {auth: {persistSession: false}})
        const {error: signErr} = await testClient.auth.signInWithPassword({
          email: usrData.user.email,
          password: currentPassword,
        })
        if (signErr) {
          return res.status(400).json({error: 'Mevcut şifreniz hatalı.'})
        }
      }

      const {error: updateErr} = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      })

      if (updateErr) {
        return res.status(500).json({error: updateErr.message})
      }

      return res.status(200).json({success: true, message: 'Şifreniz başarıyla güncellendi.'})
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

    // --- SELECTIONS / SEÇTİKLERİM ---
    if (resource === 'selections') {
      if (req.method === 'GET') {
        const productIds = await listSelectionsForUser(userId)
        return res.status(200).json({success: true, productIds})
      }
      if (req.method === 'POST') {
        if (idOrAction === 'sync' || Array.isArray(req.body?.productIds)) {
          const clientProductIds = Array.isArray(req.body?.productIds) ? req.body.productIds : []
          const productIds = await bulkSyncSelectionsForUser(userId, clientProductIds)
          return res.status(200).json({success: true, productIds})
        }
        const productId = String(req.body?.productId || '').trim()
        if (!productId) {
          return res.status(400).json({error: 'Ürün ID gereklidir.'})
        }
        const saved = await saveSelectionForUser(userId, productId)
        return res.status(200).json({success: saved})
      }
      if (req.method === 'DELETE') {
        const productId = String(idOrAction || req.body?.productId || '').trim()
        if (!productId || productId === 'all') {
          const cleared = await clearSelectionsForUser(userId)
          return res.status(200).json({success: cleared})
        }
        const removed = await removeSelectionForUser(userId, productId)
        return res.status(200).json({success: removed})
      }
      return res.status(405).json({error: 'Method Not Allowed'})
    }

    // --- PROJECTS / PROJELERİM ---
    if (resource === 'projects') {
      if (!idOrAction) {
        if (req.method === 'GET') {
          const projects = await listProjectsForUser(userId)
          return res.status(200).json({success: true, projects})
        }
        if (req.method === 'POST') {
          const project = await createProjectForUser(userId, req.body || {})
          if (!project) {
            return res.status(500).json({error: 'Proje oluşturulamadı.'})
          }
          return res.status(201).json({success: true, project})
        }
        return res.status(405).json({error: 'Method Not Allowed'})
      }

      const projectId = idOrAction
      if (req.method === 'PATCH' || req.method === 'PUT') {
        const updated = await updateProjectForUser(userId, projectId, req.body || {})
        return res.status(200).json({success: updated})
      }
      if (req.method === 'DELETE') {
        const deleted = await deleteProjectForUser(userId, projectId)
        return res.status(200).json({success: deleted})
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
