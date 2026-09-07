import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'
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

const SANITY_PROJECT_ID =
  process.env['SANITY_PROJECT_ID'] || process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET =
  process.env['SANITY_DATASET'] || process.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION =
  process.env['SANITY_API_VERSION'] || process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const SANITY_TOKEN = process.env['SANITY_TOKEN']

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

export interface SanityUserRecord {
  _id: string
  _createdAt?: string
  email?: string
  firstName?: string
  lastName?: string
  name?: string
  role?: string
  company?: string
  profession?: string
  country?: string
  userType?: string
  isActive?: boolean
  isVerified?: boolean
  createdAt?: string
  architectVerificationStatus?: string
  [key: string]: unknown
}

import {
  sendVerificationEmail as sendServiceVerificationEmail,
  sendPasswordResetEmail as sendServicePasswordResetEmail,
} from '../../lib/server/emailService.js'

async function sendServerVerificationEmail(
  email: string,
  verificationUrl: string,
  name?: string,
  lang: 'tr' | 'en' = 'tr'
) {
  return sendServiceVerificationEmail({to: email, verificationUrl, name, lang})
}

async function sendServerPasswordResetEmail(
  email: string,
  resetUrl: string,
  name?: string,
  lang: 'tr' | 'en' = 'tr'
) {
  return sendServicePasswordResetEmail({to: email, resetUrl, name, lang})
}

function detectUserLanguage(
  req: VercelRequest,
  country?: string,
  explicitLang?: string
): 'tr' | 'en' {
  if (explicitLang === 'en' || explicitLang === 'tr') {
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
    // 1. Try Supabase Auth first if configured
    try {
      const supabaseAdmin = getSafeSupabaseAdmin()
      const anonKey = process.env['VITE_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY']
      const supabaseUrl =
        process.env['SUPABASE_URL'] ||
        process.env['VITE_SUPABASE_URL'] ||
        'https://rkmpfxervwqleibhbiqv.supabase.co'

      if (supabaseAdmin && anonKey) {
        const {createClient} = await import('@supabase/supabase-js')
        const clientAuth = createClient(supabaseUrl, anonKey, {
          auth: {persistSession: false},
        })

        const {data: authData, error: authErr} = await clientAuth.auth.signInWithPassword({
          email: normEmail,
          password,
        })

        if (!authErr && authData.user) {
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
              architectVerificationStatus:
                profile?.architect_verification_status || 'not_requested',
              isActive: true,
              isVerified: true,
              createdAt: profile?.created_at || authUser.created_at,
            },
          })
        }
      }
    } catch (sbErr) {
      console.warn('[Supabase Auth] Login attempt fallback to Sanity:', sbErr)
    }

    const user = (await client.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )) as SanityUserRecord | null

    if (!user) {
      return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
    }

    if (user.userType === 'email_subscriber') {
      return res.status(403).json({error: 'Bu sadece abonelik kaydı, lütfen tam üyelik alın.'})
    }

    if (!user.isActive) {
      return res.status(403).json({error: 'Hesabınız aktif değil.'})
    }

    if (user.isVerified === false && user['verificationToken']) {
      return res.status(403).json({
        error:
          'Lütfen önce e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı onaylayın.',
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, (user['password'] as string) || '')
    if (!isPasswordCorrect) {
      return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
    }

    const token = createToken({
      sub: user._id,
      email: user.email || normEmail,
      role: user.role || 'consumer',
    })

    setAuthCookie(res, token)

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        profession: user.profession,
        country: user.country,
        role: user.role,
        userType: user.userType,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt || user._createdAt,
      },
    })
  } catch (error: unknown) {
    console.error('Login error:', error)
    return res.status(500).json({error: 'Giriş sırasında bir teknik hata oluştu.'})
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

  const {
    email,
    password,
    firstName,
    lastName,
    name,
    role,
    company,
    profession,
    country,
    phone,
    city,
    website,
  } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({error: 'Email ve şifre gereklidir.'})
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

        await supabaseAdmin
          .from('profiles')
          .update({
            first_name: firstName || null,
            last_name: lastName || null,
            name: displayName,
            role: dbRole,
            company: company || null,
            profession: userProfession,
            phone: phone || null,
            architect_verification_status: dbArchStatus,
            is_verified: false,
          })
          .eq('id', existingProfile.id)

        const verificationToken = randomUUID()
        const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
        const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}`
        const emailLang = detectUserLanguage(req, country, req.body?.['lang'])
        sendServerVerificationEmail(normEmail, verificationUrl, displayName, emailLang).catch(err =>
          console.error('Verification email error:', err)
        )

        return res.status(200).json({
          success: true,
          requireVerification: true,
          message:
            'Bülten aboneliğiniz üye hesabına dönüştürüldü. Lütfen e-posta adresinize gönderilen bağlantı ile üyeliğinizi doğrulayın.',
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

      return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
    }

    // Create new Supabase user
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
    const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}`
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
    if (supabaseAdmin) {
      try {
        const {data: profile} = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', payload.sub)
          .maybeSingle()

        if (profile) {
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
        }
      } catch (sbErr) {
        console.warn('[Supabase Me] Error querying Supabase profile:', sbErr)
      }
    }

    const user = (await client.fetch(`*[_type == "user" && _id == $id && !defined(_deleted)][0]`, {
      id: payload.sub,
    })) as SanityUserRecord | null

    if (!user || !user.isActive) {
      return res.status(200).json({authenticated: false, user: null})
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        profession: user.profession,
        country: user.country,
        userType: user.userType,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt || user._createdAt,
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
  if (supabaseAdmin && email) {
    const targetEmail = (email as string).trim().toLowerCase()
    try {
      await supabaseAdmin
        .from('profiles')
        .update({is_verified: true, updated_at: new Date().toISOString()})
        .eq('email', targetEmail)

      const {data: profile} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', targetEmail)
        .maybeSingle()

      const {data: usersList} = await supabaseAdmin.auth.admin.listUsers()
      const authUser = usersList?.users?.find(u => u.email?.toLowerCase() === targetEmail)
      if (authUser) {
        await supabaseAdmin.auth.admin
          .updateUserById(authUser.id, {
            email_confirm: true,
            user_metadata: {...authUser.user_metadata, email_verified: true},
          })
          .catch(() => {})
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
    } catch (sbErr) {
      console.warn('[Supabase Verify Warning]:', sbErr)
    }
  }

  try {
    const user = (await client.fetch(`*[_type == "user" && verificationToken == $token][0]`, {
      token: token || '',
    })) as SanityUserRecord | null

    if (!user) {
      return res.status(400).json({error: 'Geçersiz veya süresi dolmuş token.'})
    }

    if (user.isVerified && user.isActive) {
      return res.status(200).json({
        success: true,
        message: 'E-posta zaten doğrulanmış.',
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          company: user.company,
          profession: user.profession,
          country: user.country,
          userType: user.userType,
          isActive: true,
          isVerified: true,
          createdAt: user.createdAt || user._createdAt,
        },
      })
    }

    const updatedUser = (await client
      .patch(user._id)
      .set({isVerified: true, isActive: true})
      .unset(['verificationToken'])
      .commit()) as SanityUserRecord

    // Sync verification status to Supabase if configured
    try {
      const supabaseAdmin = getSafeSupabaseAdmin()
      if (supabaseAdmin && updatedUser.email) {
        await supabaseAdmin
          .from('profiles')
          .update({is_verified: true})
          .eq('email', updatedUser.email.toLowerCase())
      }
    } catch (sbErr) {
      console.warn('[Supabase Sync] Doğrulama Supabase senkronizasyon uyarısı:', sbErr)
    }

    return res.status(200).json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı.',
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        company: updatedUser.company,
        profession: updatedUser.profession,
        country: updatedUser.country,
        userType: updatedUser.userType,
        isActive: updatedUser.isActive,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt || updatedUser._createdAt,
      },
    })
  } catch (error: unknown) {
    console.error('Verification error:', error)
    return res.status(500).json({error: 'Doğrulama sırasında bir hata oluştu.'})
  }
}

async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {token, newPassword, email, action} = req.body || {}

  if (action === 'request' || (email && !newPassword && !token)) {
    if (!email) {
      return res.status(400).json({error: 'E-posta adresi gereklidir.'})
    }

    const normEmail = (email as string).trim().toLowerCase()

    try {
      const user = (await client.fetch(
        `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
        {email: normEmail}
      )) as SanityUserRecord | null

      if (user) {
        const resetToken = randomUUID()
        const resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        await client
          .patch(user._id)
          .set({
            resetPasswordToken: resetToken,
            resetPasswordExpires,
          })
          .commit()

        const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
        const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`
        const emailLang = detectUserLanguage(req, undefined, req.body?.['lang'])
        sendServerPasswordResetEmail(normEmail, resetUrl, user?.name, emailLang).catch(err =>
          console.error('Password reset email error:', err)
        )
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
    const user = (await client.fetch(
      `*[_type == "user" && resetPasswordToken == $token && resetPasswordExpires > now()][0]`,
      {token}
    )) as SanityUserRecord | null

    if (!user) {
      return res.status(400).json({error: 'Geçersiz veya süresi dolmuş token.'})
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await client
      .patch(user._id)
      .set({password: passwordHash})
      .unset(['resetPasswordToken', 'resetPasswordExpires'])
      .commit()

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

  if (id.startsWith('_') || id.includes('..') || id.includes('drafts.')) {
    return res.status(400).json({error: "Geçersiz kullanıcı ID'si."})
  }

  try {
    const supabaseAdmin = getSafeSupabaseAdmin()
    if (supabaseAdmin) {
      try {
        const {error: sbErr} = await supabaseAdmin.auth.admin.deleteUser(id)
        if (!sbErr) {
          return res.status(200).json({success: true, message: 'Hesap başarıyla silindi.'})
        }
      } catch (sbErr) {
        console.warn('[Supabase Delete] Error deleting from Supabase:', sbErr)
      }
    }

    const existing = (await client.fetch(
      `*[_type == "user" && _id == $id && !defined(_deleted)][0]._id`,
      {id}
    )) as string | null

    if (!existing) {
      return res.status(404).json({error: 'Kullanıcı bulunamadı.'})
    }

    await client.delete(id)
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

  // 1. Professional / Architect Application
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
          if (password) {
            await supabaseAdmin.auth.admin.updateUserById(existing.id, {password}).catch(() => {})
          }
          await supabaseAdmin
            .from('profiles')
            .update({
              name: name || existing.name || null,
              company: company || existing.company || null,
              profession: profession || existing.profession || 'Mimar / İç Mimar',
              phone: phone || existing.phone || null,
              role: 'architect',
              architect_verification_status: 'pending',
              is_verified: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

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

  // 2. Newsletter / Email Subscriber
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
      return res.status(400).json({error: sbAuthErr.message})
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
