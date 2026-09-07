import {randomUUID} from 'crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {
  createToken,
  setAuthCookie,
  getAuthTokenFromReq,
  verifyToken,
  clearAuthCookie,
} from '../../lib/server/token.js'
import {handleCors} from '../../lib/server/cors.js'
import {getSafeSupabaseAdmin} from '../../lib/server/supabaseAdmin.js'
import {
  sendVerificationEmail as sendServiceVerificationEmail,
  sendPasswordResetEmail as sendServicePasswordResetEmail,
} from '../../lib/server/emailService.js'

async function sendServerVerificationEmail(
  email: string,
  verificationUrl: string,
  name?: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  return sendServiceVerificationEmail({to: email, verificationUrl, name, lang})
}

async function sendServerPasswordResetEmail(
  email: string,
  resetUrl: string,
  name?: string,
  lang: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  return sendServicePasswordResetEmail({to: email, resetUrl, name, lang})
}

function detectUserLanguage(
  req: VercelRequest,
  country?: string,
  explicitLang?: string
): 'tr' | 'en' {
  if (explicitLang === 'tr' || explicitLang === 'en') {
    return explicitLang
  }

  if (country && typeof country === 'string') {
    const norm = country.trim().toLowerCase()
    if (
      norm === 'tr' ||
      norm === 'turkey' ||
      norm === 'türkiye' ||
      norm === 'turkiye' ||
      norm === 'türkei' ||
      norm === 'turquie'
    ) {
      return 'tr'
    }
    return 'en'
  }

  const geoCountry = (req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '')
    .toString()
    .toUpperCase()
    .trim()

  if (geoCountry) {
    return geoCountry === 'TR' ? 'tr' : 'en'
  }

  const acceptLang = (req.headers['accept-language'] || '').toString().toLowerCase()
  if (acceptLang && !acceptLang.includes('tr')) {
    return 'en'
  }

  return 'tr'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, OPTIONS',
      allowHeaders: 'Content-Type, Authorization, x-api-secret',
      allowCredentials: true,
    })
  ) {
    return
  }

  const rawAction = req.query['action']
  const action = Array.isArray(rawAction)
    ? rawAction[0]
    : rawAction || req.url?.split('?')[0].split('/').pop()

  switch (action) {
    case 'login':
      return handleLogin(req, res)
    case 'register':
      return handleRegister(req, res)
    case 'me':
      return handleMe(req, res)
    case 'logout':
      return handleLogout(req, res)
    case 'verify':
      return handleVerify(req, res)
    case 'reset-password':
      return handleResetPassword(req, res)
    case 'delete-account':
      return handleDeleteAccount(req, res)
    case 'subscribe':
      return handleSubscribe(req, res)
    default:
      return res.status(404).json({error: `Bilinmeyen auth aksiyonu: ${action}`})
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`login_ip_${ip}`, {limit: 10, windowMs: 60000})) {
    return res
      .status(429)
      .json({error: 'Çok fazla giriş denemesi yaptınız. Lütfen daha sonra tekrar deneyin.'})
  }

  const {email, password} = req.body || {}
  if (!email || !password) {
    return res.status(400).json({error: 'Email ve şifre gereklidir.'})
  }

  const normEmail = (email as string).trim().toLowerCase()

  try {
    const supabaseAdmin = getSafeSupabaseAdmin()
    const anonKey =
      process.env['VITE_SUPABASE_ANON_KEY'] ||
      process.env['SUPABASE_ANON_KEY'] ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbXBmeGVydndxbGVpYmhiaXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTM1ODQsImV4cCI6MjEwNDM2OTU4NH0.nQJwhU1hxIjem6pxdJSQ8PNfmahd-bn9Z2CEkwf1Yi0'
    const supabaseUrl =
      process.env['SUPABASE_URL'] ||
      process.env['VITE_SUPABASE_URL'] ||
      'https://rkmpfxervwqleibhbiqv.supabase.co'

    if (!supabaseAdmin || !anonKey) {
      return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
    }

    const {createClient} = await import('@supabase/supabase-js')
    const clientAuth = createClient(supabaseUrl, anonKey, {
      auth: {persistSession: false},
    })

    const {data: authData, error: authErr} = await clientAuth.auth.signInWithPassword({
      email: normEmail,
      password,
    })

    if (authErr) {
      const {data: profile} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', normEmail)
        .maybeSingle()

      if (profile && authErr.message?.toLowerCase().includes('email not confirmed')) {
        return res.status(403).json({
          error:
            'Lütfen önce e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı onaylayın.',
        })
      }

      if (profile && profile.profession === 'Bülten Abonesi') {
        return res.status(403).json({
          error:
            'Bu e-posta sadece bülten abonesi olarak kayıtlıdır. Lütfen üye ol sekmesinden şifre belirleyerek tam üyelik oluşturun.',
        })
      }

      return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
    }

    if (!authData.user) {
      return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
    }

    const authUser = authData.user
    const {data: profile} = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    const isVerified = Boolean(authUser.email_confirmed_at || profile?.is_verified)
    if (!isVerified) {
      return res.status(403).json({
        error:
          'Lütfen önce e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı onaylayın.',
      })
    }

    const token = createToken({
      sub: authUser.id,
      email: authUser.email || normEmail,
      role: profile?.role || 'consumer',
    })

    setAuthCookie(res, token)

    const displayName =
      profile?.name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      authUser.email?.split('@')[0] ||
      'Kullanıcı'

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: authUser.id,
        email: authUser.email,
        name: displayName,
        company: profile?.company || '',
        profession: profile?.profession || '',
        role: profile?.role || 'consumer',
        architectVerificationStatus: profile?.architect_verification_status || 'not_requested',
        isActive: true,
        isVerified: true,
        createdAt: profile?.created_at || authUser.created_at,
      },
    })
  } catch (error: unknown) {
    console.error('Login error:', error)
    return res.status(500).json({error: 'Giriş sırasında bir hata oluştu.'})
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`register_ip_${ip}`, {limit: 5, windowMs: 60000})) {
    return res
      .status(429)
      .json({error: 'Çok fazla kayıt denemesi yaptınız. Lütfen daha sonra tekrar deneyin.'})
  }

  const {email, password, firstName, lastName, name, role, company, country, profession, phone} =
    req.body || {}

  if (!email || !password) {
    return res.status(400).json({error: 'Email ve şifre zorunludur.'})
  }

  const normEmail = (email as string).trim().toLowerCase()
  const dbRole = role === 'architect' ? 'architect' : 'user'
  const userRole = role === 'architect' ? 'architect' : 'consumer'
  const dbArchStatus = role === 'architect' ? 'pending' : 'none'
  const verificationStatus = role === 'architect' ? 'pending_verification' : 'not_requested'
  const displayName =
    name || `${firstName || ''} ${lastName || ''}`.trim() || normEmail.split('@')[0]
  const userProfession =
    profession || (role === 'architect' ? 'Mimar / İç Mimar' : 'Bireysel Kullanıcı')

  try {
    const supabaseAdmin = getSafeSupabaseAdmin()
    if (!supabaseAdmin) {
      return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
    }

    // Check if user already exists in profiles
    const {data: existingProfile} = await supabaseAdmin
      .from('profiles')
      .select('id, email, is_verified, profession')
      .eq('email', normEmail)
      .maybeSingle()

    if (existingProfile) {
      if (existingProfile.profession === 'Bülten Abonesi') {
        // Upgrade newsletter subscriber to full member
        let hasAuth = false
        try {
          const {data: chk} = await supabaseAdmin.auth.admin.getUserById(existingProfile.id)
          if (chk?.user) hasAuth = true
        } catch {
          hasAuth = false
        }

        if (hasAuth) {
          const {error: updateAuthErr} = await supabaseAdmin.auth.admin.updateUserById(
            existingProfile.id,
            {
              password,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
                name: displayName,
                role: dbRole,
                company,
                country: country || 'Türkiye',
                profession: userProfession,
                phone,
              },
            }
          )
          if (updateAuthErr) {
            return res.status(400).json({error: updateAuthErr.message})
          }
        } else {
          const {data: newSbAuth, error: createAuthErr} = await supabaseAdmin.auth.admin.createUser(
            {
              email: normEmail,
              password,
              email_confirm: false,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
                name: displayName,
                role: dbRole,
                company,
                country: country || 'Türkiye',
                profession: userProfession,
                phone,
              },
            }
          )
          if (createAuthErr) {
            return res.status(400).json({error: createAuthErr.message})
          }
          if (newSbAuth?.user?.id) {
            await supabaseAdmin.from('profiles').delete().eq('id', existingProfile.id)
            existingProfile.id = newSbAuth.user.id
          }
        }

        await supabaseAdmin.from('profiles').upsert({
          id: existingProfile.id,
          email: normEmail,
          first_name: firstName || null,
          last_name: lastName || null,
          name: displayName,
          role: dbRole,
          company: company || null,
          profession: userProfession,
          phone: phone || null,
          architect_verification_status: dbArchStatus,
          is_verified: false,
          updated_at: new Date().toISOString(),
        })

        const verificationToken = randomUUID()
        const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
        const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normEmail)}`
        const emailLang = detectUserLanguage(req, country, req.body?.['lang'])
        sendServerVerificationEmail(normEmail, verificationUrl, displayName, emailLang).catch(err =>
          console.error('Verification email error:', err)
        )

        return res.status(200).json({
          success: true,
          requireVerification: true,
          message:
            'Üyeliğiniz başarıyla oluşturuldu! Lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı onaylayın.',
          user: {
            _id: existingProfile.id,
            id: existingProfile.id,
            email: normEmail,
            firstName: firstName || '',
            lastName: lastName || '',
            name: displayName,
            role: userRole,
            architectVerificationStatus: verificationStatus,
            isVerified: false,
            isActive: true,
          },
        })
      }

      return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlıdır.'})
    }

    const {data: sbAuth, error: authError} = await supabaseAdmin.auth.admin.createUser({
      email: normEmail,
      password,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        name: displayName,
        role: dbRole,
        company,
        country: country || 'Türkiye',
        profession: userProfession,
        phone,
      },
    })

    if (authError || !sbAuth?.user) {
      return res.status(400).json({error: authError?.message || 'Kayıt sırasında hata oluştu.'})
    }

    const userId = sbAuth.user.id
    await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email: normEmail,
        first_name: firstName || null,
        last_name: lastName || null,
        name: displayName,
        role: dbRole,
        company: company || null,
        profession: userProfession,
        phone: phone || null,
        architect_verification_status: dbArchStatus,
        is_verified: false,
      },
      {onConflict: 'id'}
    )

    const verificationToken = randomUUID()
    const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
    const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normEmail)}`
    const emailLang = detectUserLanguage(req, country, req.body?.['lang'])
    sendServerVerificationEmail(normEmail, verificationUrl, displayName, emailLang).catch(err =>
      console.error('Verification email error:', err)
    )

    return res.status(201).json({
      success: true,
      requireVerification: true,
      message:
        'Kayıt başarılı! Lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı onaylayın.',
      user: {
        _id: userId,
        id: userId,
        email: normEmail,
        firstName: firstName || '',
        lastName: lastName || '',
        name: displayName,
        role: userRole,
        architectVerificationStatus: verificationStatus,
        isVerified: false,
        isActive: true,
      },
    })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    const message = error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu.'
    return res.status(500).json({error: message})
  }
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(200).json({authenticated: false, user: null})
  }

  const payload = verifyToken(token)
  if (!payload || !payload.sub) {
    return res.status(200).json({authenticated: false, user: null})
  }

  try {
    const supabaseAdmin = getSafeSupabaseAdmin()
    if (!supabaseAdmin) {
      return res.status(200).json({authenticated: false, user: null})
    }

    const {data: profile} = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .maybeSingle()

    if (!profile) {
      return res.status(200).json({authenticated: false, user: null})
    }

    const displayName =
      profile.name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.email?.split('@')[0] ||
      'Kullanıcı'

    return res.status(200).json({
      authenticated: true,
      user: {
        _id: profile.id,
        email: profile.email,
        name: displayName,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        role: profile.role || 'consumer',
        company: profile.company || '',
        country: profile.country || '',
        profession: profile.profession || '',
        architectVerificationStatus: profile.architect_verification_status || 'not_requested',
        isActive: true,
        isVerified: profile.is_verified ?? true,
        createdAt: profile.created_at,
      },
    })
  } catch (error: unknown) {
    console.error('Me endpoint error:', error)
    return res.status(500).json({authenticated: false, error: 'Sunucu hatası.'})
  }
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  clearAuthCookie(res)
  return res.status(200).json({success: true, message: 'Oturum kapatıldı.'})
}

async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {token, email} = req.body || {}
  if (!token && !email) {
    return res.status(400).json({error: "Doğrulama token'ı veya e-posta gereklidir."})
  }

  const supabaseAdmin = getSafeSupabaseAdmin()
  if (!supabaseAdmin) {
    return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
  }

  const targetEmail = email ? (email as string).trim().toLowerCase() : null

  try {
    let profile = null

    if (targetEmail) {
      await supabaseAdmin
        .from('profiles')
        .update({is_verified: true, updated_at: new Date().toISOString()})
        .eq('email', targetEmail)

      const {data} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', targetEmail)
        .maybeSingle()

      profile = data

      if (profile?.id) {
        await supabaseAdmin.auth.admin
          .updateUserById(profile.id, {
            email_confirm: true,
            user_metadata: {email_verified: true},
          })
          .catch(() => {})
      }

      const {data: usersList} = await supabaseAdmin.auth.admin.listUsers()
      const authUser = usersList?.users?.find(u => u.email?.toLowerCase() === targetEmail)
      if (authUser && authUser.id !== profile?.id) {
        await supabaseAdmin.auth.admin
          .updateUserById(authUser.id, {
            email_confirm: true,
            user_metadata: {...authUser.user_metadata, email_verified: true},
          })
          .catch(() => {})
      }
    }

    if (profile) {
      return res.status(200).json({
        success: true,
        message: 'E-posta adresiniz başarıyla doğrulandı.',
        user: {
          _id: profile.id,
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          company: profile.company,
          profession: profile.profession,
          architectVerificationStatus: profile.architect_verification_status,
          isVerified: true,
        },
      })
    }

    return res.status(200).json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı.',
    })
  } catch (sbErr) {
    console.error('[Supabase Verify Error]:', sbErr)
    return res.status(500).json({error: 'Doğrulama sırasında bir hata oluştu.'})
  }
}

async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {token, newPassword, email, action} = req.body || {}
  const supabaseAdmin = getSafeSupabaseAdmin()
  if (!supabaseAdmin) {
    return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
  }

  if (action === 'request' || (email && !newPassword && !token)) {
    if (!email) {
      return res.status(400).json({error: 'E-posta adresi gereklidir.'})
    }

    const normEmail = (email as string).trim().toLowerCase()

    try {
      const {data: profile} = await supabaseAdmin
        .from('profiles')
        .select('id, email, name')
        .eq('email', normEmail)
        .maybeSingle()

      if (profile) {
        const resetToken = randomUUID()
        const resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        await supabaseAdmin.auth.admin
          .updateUserById(profile.id, {
            user_metadata: {
              reset_password_token: resetToken,
              reset_password_expires: resetPasswordExpires,
            },
          })
          .catch(() => {})

        const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
        const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`
        const emailLang = detectUserLanguage(req, undefined, req.body?.['lang'])
        sendServerPasswordResetEmail(
          normEmail,
          resetUrl,
          profile.name || undefined,
          emailLang
        ).catch(err => console.error('Password reset email error:', err))
      }

      return res.status(200).json({
        success: true,
        message:
          'Eğer e-posta adresi sistemimizde kayıtlı ise şifre sıfırlama bağlantısı oluşturulmuştur.',
      })
    } catch (error: unknown) {
      console.error('Reset request error:', error)
      return res.status(500).json({error: 'Sıfırlama isteğinde bir hata oluştu.'})
    }
  }

  if (!token || !newPassword) {
    return res.status(400).json({error: 'Token ve yeni şifre gereklidir.'})
  }

  try {
    const {data: usersList} = await supabaseAdmin.auth.admin.listUsers()
    const now = new Date()
    const matchedUser = usersList?.users?.find(u => {
      const uToken = u.user_metadata?.['reset_password_token']
      const uExp = u.user_metadata?.['reset_password_expires']
      return uToken === token && uExp && new Date(uExp) > now
    })

    if (!matchedUser) {
      return res.status(400).json({error: 'Geçersiz veya süresi dolmuş token.'})
    }

    const {error: updateErr} = await supabaseAdmin.auth.admin.updateUserById(matchedUser.id, {
      password: newPassword,
      user_metadata: {
        ...matchedUser.user_metadata,
        reset_password_token: null,
        reset_password_expires: null,
      },
    })

    if (updateErr) {
      return res.status(400).json({error: updateErr.message})
    }

    return res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi.',
    })
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    return res.status(500).json({error: 'Şifre güncellenirken bir hata oluştu.'})
  }
}

async function handleDeleteAccount(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(401).json({error: 'Hesap silmek için oturum açmanız gerekmektedir.'})
  }

  const payload = verifyToken(token)
  if (!payload || !payload.sub) {
    return res.status(401).json({error: 'Geçersiz veya süresi dolmuş oturum.'})
  }

  const {id} = req.body || {}
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})
  }

  if (payload.sub !== id && payload.role !== 'admin') {
    return res.status(403).json({error: 'Bu hesabı silme yetkiniz bulunmamaktadır.'})
  }

  try {
    const supabaseAdmin = getSafeSupabaseAdmin()
    if (!supabaseAdmin) {
      return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
    }

    await supabaseAdmin.from('profiles').delete().eq('id', id)
    const {error: sbErr} = await supabaseAdmin.auth.admin.deleteUser(id)
    if (sbErr && !sbErr.message.includes('User not found')) {
      return res.status(400).json({error: sbErr.message})
    }

    return res.status(200).json({success: true, message: 'Hesap başarıyla silindi.'})
  } catch (error: unknown) {
    console.error('Delete account error:', error)
    return res.status(500).json({error: 'Hesap silinirken bir hata oluştu.'})
  }
}

async function handleSubscribe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {email, password, name, company, profession, phone, country, isProfessional} =
    req.body || {}

  if (!email) {
    return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  }

  const normEmail = (email as string).trim().toLowerCase()
  const supabaseAdmin = getSafeSupabaseAdmin()

  if (!supabaseAdmin) {
    return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
  }

  // 1. Professional / Architect Application (Özel Erişim)
  if (isProfessional || profession) {
    try {
      const {data: existing} = await supabaseAdmin
        .from('profiles')
        .select(
          'id, email, profession, role, is_verified, architect_verification_status, name, company, phone'
        )
        .eq('email', normEmail)
        .maybeSingle()

      if (existing) {
        const canUpdate =
          existing.profession === 'Bülten Abonesi' ||
          existing.role === 'user' ||
          existing.architect_verification_status === 'pending' ||
          existing.architect_verification_status === 'none' ||
          !existing.is_verified

        if (canUpdate) {
          let hasAuthAccount = false
          try {
            const {data: usr} = await supabaseAdmin.auth.admin.getUserById(existing.id)
            if (usr?.user) hasAuthAccount = true
          } catch {
            hasAuthAccount = false
          }

          if (hasAuthAccount) {
            if (password) {
              await supabaseAdmin.auth.admin.updateUserById(existing.id, {password}).catch(() => {})
            }
            await supabaseAdmin.auth.admin
              .updateUserById(existing.id, {
                user_metadata: {
                  name: name || existing.name || '',
                  role: 'architect',
                  company: company || existing.company || '',
                  country: country || 'Türkiye',
                  profession: profession || existing.profession || 'Mimar / İç Mimar',
                  phone: phone || existing.phone || '',
                  email_verified: false,
                },
              })
              .catch(() => {})
          } else {
            const {data: newAuth} = await supabaseAdmin.auth.admin.createUser({
              email: normEmail,
              password: password || undefined,
              email_confirm: false,
              user_metadata: {
                name: name || existing.name || '',
                role: 'architect',
                company: company || existing.company || '',
                country: country || 'Türkiye',
                profession: profession || existing.profession || 'Mimar / İç Mimar',
                phone: phone || '',
              },
            })
            if (newAuth?.user?.id) {
              await supabaseAdmin.from('profiles').delete().eq('id', existing.id)
              existing.id = newAuth.user.id
            }
          }

          await supabaseAdmin.from('profiles').upsert({
            id: existing.id,
            email: normEmail,
            name: name || existing.name || null,
            company: company || existing.company || null,
            profession: profession || existing.profession || 'Mimar / İç Mimar',
            phone: phone || existing.phone || null,
            role: 'architect',
            architect_verification_status: 'pending',
            is_verified: false,
            updated_at: new Date().toISOString(),
          })

          const verificationToken = randomUUID()
          const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
          const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normEmail)}`
          const emailLang = detectUserLanguage(req, country, req.body?.['lang'])
          sendServerVerificationEmail(
            normEmail,
            verificationUrl,
            name || existing.name,
            emailLang
          ).catch(err => console.error('Subscribe verification email error:', err))

          return res.status(200).json({
            success: true,
            message:
              'Mimar başvurusu bilgileriniz başarıyla güncellendi. Lütfen e-posta adresinize gönderilen onay bağlantısını kontrol edin.',
            email: normEmail,
          })
        }
        return res.status(400).json({error: 'Bu e-posta adresi zaten onaylı bir hesaba aittir.'})
      }

      const {data: sbAuthUser, error: sbAuthErr} = await supabaseAdmin.auth.admin.createUser({
        email: normEmail,
        password: password || undefined,
        email_confirm: false,
        user_metadata: {
          name: name || '',
          role: 'architect',
          company: company || '',
          country: country || 'Türkiye',
          profession: profession || 'Mimar / İç Mimar',
          phone: phone || '',
        },
      })

      if (sbAuthErr) {
        return res.status(400).json({error: sbAuthErr.message})
      }

      const userId = sbAuthUser?.user?.id
      if (userId) {
        await supabaseAdmin.from('profiles').upsert(
          {
            id: userId,
            email: normEmail,
            name: name || null,
            company: company || null,
            profession: profession || 'Mimar / İç Mimar',
            phone: phone || null,
            role: 'architect',
            architect_verification_status: 'pending',
            is_verified: false,
          },
          {onConflict: 'id'}
        )
      }

      const verificationToken = randomUUID()
      const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
      const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normEmail)}`
      const emailLang = detectUserLanguage(req, country, req.body?.['lang'])
      sendServerVerificationEmail(normEmail, verificationUrl, name, emailLang).catch(err =>
        console.error('Subscribe verification email error:', err)
      )

      return res.status(201).json({
        success: true,
        message:
          'Başvurunuz alındı. Lütfen e-posta adresinize gönderilen onay mailini kontrol edin.',
        email: normEmail,
      })
    } catch (err: unknown) {
      console.error('Subscribe Prof error:', err)
      const errMessage = err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.'
      return res.status(500).json({error: `Başvuru hatası: ${errMessage}`})
    }
  }

  // 2. Newsletter / Email Subscriber (Sadece E-posta Bülteni)
  try {
    const {data: existingUser} = await supabaseAdmin
      .from('profiles')
      .select('id, email, profession, role')
      .eq('email', normEmail)
      .maybeSingle()

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'Bu e-posta adresi zaten bülten listemize kayıtlı.',
        user: {
          id: existingUser.id,
          email: normEmail,
          userType: 'email_subscriber',
        },
      })
    }

    const {data: sbAuthUser, error: sbAuthErr} = await supabaseAdmin.auth.admin.createUser({
      email: normEmail,
      email_confirm: true,
      user_metadata: {
        name: 'E-posta Abonesi',
        role: 'user',
      },
    })

    if (sbAuthErr && !sbAuthErr.message.includes('already been registered')) {
      console.warn('Supabase createUser warning:', sbAuthErr.message)
    }

    let userId = sbAuthUser?.user?.id
    if (!userId) {
      const {data: usersList} = await supabaseAdmin.auth.admin.listUsers()
      const foundUser = usersList?.users?.find(u => u.email?.toLowerCase() === normEmail)
      userId = foundUser?.id || randomUUID()
    }

    await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email: normEmail,
        name: 'E-posta Abonesi',
        role: 'user',
        profession: 'Bülten Abonesi',
        architect_verification_status: 'none',
        is_verified: true,
      },
      {onConflict: 'email'}
    )

    return res.status(200).json({
      success: true,
      message: 'Bülten aboneliğiniz başarıyla kaydedildi.',
      user: {
        id: userId,
        email: normEmail,
        userType: 'email_subscriber',
      },
    })
  } catch (error: unknown) {
    console.error('Subscription error:', error)
    return res.status(500).json({error: 'Abonelik sırasında bir hata oluştu.'})
  }
}
