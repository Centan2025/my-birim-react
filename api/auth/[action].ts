import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'
import {randomUUID} from 'crypto'
import {S3Client} from '@aws-sdk/client-s3'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {
  createToken,
  setAuthCookie,
  getAuthTokenFromReq,
  verifyToken,
  clearAuthCookie,
} from '../../lib/server/token.js'

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

async function sendServerVerificationEmail(email: string, verificationUrl: string) {
  const smtpPass = process.env['SMTP_PASSWORD']
  if (!smtpPass) return
  try {
    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: 'birimdesign@birim.com',
        pass: smtpPass,
      },
    })
    await transporter.sendMail({
      from: '"Birim Design" <birimdesign@birim.com>',
      to: email,
      subject: 'Birim Üyelik Doğrulaması',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background-color: #f9fafb; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="margin-top: 0; color: #1a1f3a;">BİRİM ÜYELİK DOĞRULAMASI</h2>
            <p>Merhaba,</p>
            <p>Birim hesabınızı doğrulamak için lütfen aşağıdaki butona tıklayın:</p>
            <p style="margin: 24px 0;">
              <a href="${verificationUrl}" style="background: #1a1f3a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Üyeliğimi Doğrula</a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">Veya şu adresi tarayıcınıza yapıştırın: ${verificationUrl}</p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('[Email Helper] Send email error:', err)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  if (!SANITY_TOKEN) {
    return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
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
  const userRole = role === 'architect' ? 'architect' : 'consumer'
  const displayName =
    name || `${firstName || ''} ${lastName || ''}`.trim() || normEmail.split('@')[0]
  const verificationStatus = userRole === 'architect' ? 'pending_verification' : 'not_requested'

  try {
    const existingUser = (await client.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )) as SanityUserRecord | null

    if (existingUser) {
      if (existingUser.userType === 'email_subscriber' || !existingUser['password']) {
        const passwordHash = await bcrypt.hash(password, 12)
        const verificationToken = randomUUID()
        const updatedUser = (await client
          .patch(existingUser._id)
          .set({
            password: passwordHash,
            firstName: firstName || '',
            lastName: lastName || '',
            name: displayName,
            role: userRole,
            architectVerificationStatus: verificationStatus,
            company: company || '',
            profession:
              profession || (userRole === 'architect' ? 'Mimar / İç Mimar' : 'Son Kullanıcı'),
            country: country || existingUser.country || '',
            phone: phone || '',
            city: city || '',
            website: website || '',
            userType: 'full_member',
            isVerified: false,
            verificationToken,
          })
          .commit()) as SanityUserRecord

        const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
        const verificationUrl = `${siteUrl}/#/verify-email?token=${verificationToken}`
        sendServerVerificationEmail(normEmail, verificationUrl).catch(err =>
          console.error('Verification email error:', err)
        )

        const token = createToken({
          sub: updatedUser._id,
          email: updatedUser.email || normEmail,
          role: updatedUser.role || userRole,
        })
        setAuthCookie(res, token)

        return res.status(200).json({
          success: true,
          token,
          message: 'Bülten aboneliğiniz üye hesabına dönüştürüldü.',
          user: {
            _id: updatedUser._id,
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            name: updatedUser.name,
            role: updatedUser.role,
            architectVerificationStatus: updatedUser.architectVerificationStatus,
            isVerified: false,
            isActive: true,
          },
        })
      }
      return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = randomUUID()

    const newUser = (await client.create({
      _type: 'user',
      email: normEmail,
      password: passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      name: displayName,
      role: userRole,
      architectVerificationStatus: verificationStatus,
      company: company || '',
      profession: profession || (userRole === 'architect' ? 'Mimar / İç Mimar' : 'Son Kullanıcı'),
      country: country || '',
      phone: phone || '',
      city: city || '',
      website: website || '',
      userType: 'full_member',
      isActive: true,
      isVerified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
    })) as SanityUserRecord

    const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
    const verificationUrl = `${siteUrl}/#/verify-email?token=${verificationToken}`
    sendServerVerificationEmail(normEmail, verificationUrl).catch(err =>
      console.error('Verification email error:', err)
    )

    const token = createToken({
      sub: newUser._id,
      email: newUser.email || normEmail,
      role: newUser.role || userRole,
    })
    setAuthCookie(res, token)

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: newUser._id,
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        name: newUser.name,
        role: newUser.role,
        architectVerificationStatus: newUser.architectVerificationStatus,
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

  const {token} = req.body || {}
  if (!token) {
    return res.status(400).json({error: "Doğrulama token'ı gereklidir."})
  }

  try {
    const user = (await client.fetch(`*[_type == "user" && verificationToken == $token][0]`, {
      token,
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

  const {email, password, name, company, profession, country, phone, isProfessional} =
    req.body || {}

  if (!email) {
    return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  }

  const normEmail = (email as string).trim().toLowerCase()

  if (isProfessional || profession) {
    if (!SANITY_TOKEN) {
      return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
    }

    try {
      const existing = (await client.fetch(
        `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
        {email: normEmail}
      )) as SanityUserRecord | null

      let passwordHash: string | null = null
      if (password) {
        passwordHash = await bcrypt.hash(password, 10)
      }

      if (existing) {
        if (existing.userType === 'email_subscriber') {
          const verificationToken = randomUUID()
          const patchData: Record<string, unknown> = {
            name: name || existing.name || '',
            company: company || existing.company || '',
            profession: profession || existing.profession || '',
            country: country || existing.country || '',
            phone: phone || existing.phone || '',
            userType: 'professional_subscriber',
            isActive: false,
            isVerified: false,
            verificationToken,
          }
          if (passwordHash) {
            patchData['password'] = passwordHash
          }

          await client.patch(existing._id).set(patchData).commit()

          return res.status(200).json({
            success: true,
            message: 'Aboneliğiniz mimar programı başvurusuna dönüştürüldü.',
            verificationToken,
            email: normEmail,
          })
        }
        return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlıdır.'})
      }

      const verificationToken = randomUUID()

      const newUserObj: {_type: string; [key: string]: unknown} = {
        _type: 'user',
        email: normEmail,
        name: name || '',
        company: company || '',
        profession: profession || '',
        country: country || '',
        phone: phone || '',
        userType: 'professional_subscriber',
        isActive: false,
        isVerified: false,
        verificationToken,
        createdAt: new Date().toISOString(),
      }

      if (passwordHash) {
        newUserObj['password'] = passwordHash
      }

      await client.create(newUserObj)

      return res.status(201).json({
        success: true,
        message:
          'Başvurunuz alındı. Lütfen e-posta adresinize gönderilen onay mailini kontrol edin.',
        verificationToken,
        email: normEmail,
      })
    } catch (err: unknown) {
      console.error('Subscribe Prof error:', err)
      const errMessage = err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.'
      return res.status(500).json({error: `Başvuru hatası: ${errMessage}`})
    }
  }

  try {
    const safeId = 'email_subscriber_' + normEmail.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')

    const user = (await client.createIfNotExists({
      _id: safeId,
      _type: 'user',
      email: normEmail,
      password: '',
      name: '',
      company: '',
      profession: '',
      userType: 'email_subscriber',
      isActive: true,
      createdAt: new Date().toISOString(),
    })) as SanityUserRecord

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
      },
    })
  } catch (error: unknown) {
    console.error('Subscription error:', error)
    return res.status(500).json({error: 'Abonelik sırasında bir hata oluştu.'})
  }
}
