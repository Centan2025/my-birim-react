import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {getSafeSupabaseAdmin} from '../../lib/server/supabaseAdmin.js'
import {verifyToken, getAuthTokenFromReq} from '../../lib/server/token.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, PATCH, OPTIONS',
      allowHeaders: 'Content-Type, Authorization, x-admin-secret',
      allowCredentials: true,
    })
  ) {
    return
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`admin_members_${ip}`, {limit: 100, windowMs: 60000})) {
    return res.status(429).json({error: 'Çok fazla istek. Lütfen biraz bekleyin.'})
  }

  // Admin yetki kontrolü: Token veya x-admin-secret ile doğrulanabilir
  const adminSecretHeader = req.headers['x-admin-secret']
  const expectedSecret =
    process.env['ADMIN_SECRET'] || process.env['VITE_MAINTENANCE_BYPASS_SECRET'] || 'birim-dev-2025'

  let isAuthorized = false
  if (adminSecretHeader && adminSecretHeader === expectedSecret) {
    isAuthorized = true
  } else {
    const token = getAuthTokenFromReq(req)
    if (token) {
      const payload = verifyToken(token)
      if (payload && (payload.role === 'admin' || payload.email?.endsWith('@birim.com'))) {
        isAuthorized = true
      }
    }
  }

  // Development ortamında veya Sanity Studio yerel çalışmasında kolay erişim
  const isDev = process.env['NODE_ENV'] !== 'production'
  const origin = (req.headers.origin as string) || ''
  if (
    isDev ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin === 'https://birim.sanity.studio'
  ) {
    isAuthorized = true
  }

  if (!isAuthorized) {
    return res.status(401).json({error: 'Yetkisiz erişim. Admin yetkisi gereklidir.'})
  }

  const supabaseAdmin = getSafeSupabaseAdmin()
  if (!supabaseAdmin) {
    return res.status(503).json({error: 'Supabase sunucu bağlantısı yapılandırılmamış.'})
  }

  // GET: Tüm üyeleri listele
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

  // POST / PATCH: Üye statüsünü güncelle (örneğin mimar onayı)
  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const {id, architect_verification_status, role, is_verified} = req.body || {}

      if (!id || typeof id !== 'string') {
        return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (architect_verification_status) {
        updates['architect_verification_status'] = architect_verification_status
      }
      if (role) {
        updates['role'] = role
      }
      if (typeof is_verified === 'boolean') {
        updates['is_verified'] = is_verified
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
      console.error('[Admin Members] Update error:', err)
      return res.status(500).json({error: 'Üye güncellenirken bir hata oluştu.'})
    }
  }

  return res.status(405).json({error: 'Method Not Allowed'})
}
