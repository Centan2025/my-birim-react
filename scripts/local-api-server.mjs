/**
 * Local API Server — Development only
 * Vercel serverless fonksiyonlarını local'de çalıştırmak için Express server.
 * Port: 3002 (Vite proxy bu porta yönlendirir)
 *
 * Kullanım:
 *   npm run api:server    → Sadece API server'ı başlatır
 *   npm run dev:full      → Hem Vite hem API server'ı başlatır
 */

import express from 'express'
import {createRequire} from 'module'
import {readFileSync, existsSync} from 'fs'
import {resolve, dirname} from 'path'
import {fileURLToPath} from 'url'
import crypto, {randomUUID, createHash} from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

import dotenv from 'dotenv'

// .env.local ve .env dosyalarından ortam değişkenlerini yükle
function loadEnvVars() {
  dotenv.config({path: resolve(__dirname, '..', '.env.local')})
  dotenv.config({path: resolve(__dirname, '..', '.env')})

  // VITE_ prefixli değerleri hem prefix'li hem prefix'siz olarak set et
  if (!process.env.SANITY_TOKEN && process.env.VITE_SANITY_TOKEN) {
    process.env.SANITY_TOKEN = process.env.VITE_SANITY_TOKEN
  }
  if (!process.env.ANALYTICS_PIN && process.env.VITE_ANALYTICS_PIN) {
    process.env.ANALYTICS_PIN = process.env.VITE_ANALYTICS_PIN
  }
}

loadEnvVars()

process.on('uncaughtException', (err) => {
  console.error('⚠️ [Local API] Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Local API] Unhandled Rejection at:', promise, 'reason:', reason)
})

// sanity client ve bcrypt'i dynamic import ile yükle
const {createClient} = await import('@sanity/client')
const bcrypt = (await import('bcryptjs')).default
const nodemailer = (await import('nodemailer')).default

// E-posta Servisi: Resend & SMTP Desteği
const {Resend} = await import('resend').catch(() => ({}))
const RESEND_API_KEY = process.env.RESEND_API_KEY
const SMTP_PASSWORD = process.env.SMTP_PASSWORD

let resendClient = null
if (RESEND_API_KEY && Resend) {
  resendClient = new Resend(RESEND_API_KEY)
}

let mailTransporter = null
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || 'birim@birim.com'
if (SMTP_PASSWORD) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  })
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || 'Birim Design <birim@birim.com>'
}

function detectUserLanguage(req, country, explicitLang) {
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

  const geoCountry = (
    req?.headers?.['x-vercel-ip-country'] ||
    req?.headers?.['cf-ipcountry'] ||
    ''
  )
    .toString()
    .toUpperCase()
    .trim()

  if (geoCountry) {
    return geoCountry === 'TR' ? 'tr' : 'en'
  }

  const acceptLang = (req?.headers?.['accept-language'] || '').toString().toLowerCase()
  if (acceptLang && !acceptLang.includes('tr')) {
    return 'en'
  }

  return 'tr'
}

async function sendVerificationEmail(email, verificationUrl, name, lang = 'tr') {
  console.log(`\n========================================`)
  console.log(`📧 [BİRİM DOĞRULAMA E-POSTASI] (${lang === 'en' ? 'EN' : 'TR'})`)
  console.log(`   Kime: ${email}`)
  console.log(`   Doğrulama Linki: ${verificationUrl}`)
  console.log(`========================================\n`)

  const isEn = lang === 'en'
  const displayName = name ? (isEn ? `Dear ${name},` : `Sayın ${name},`) : (isEn ? 'Hello,' : 'Merhaba,')
  const title = isEn ? 'MEMBER VERIFICATION' : 'ÜYELİK DOĞRULAMASI'
  const subtitle = isEn 
    ? 'Thank you for applying to Birim Exclusive Architect & Professional Network.'
    : 'Birim Özel Mimar & Profesyonel Ağı’na yaptığınız başvuru için teşekkür ederiz.'
  const bodyText = isEn
    ? 'Please click the button below to verify your email address, activate your account, and access high-resolution 3D models and CAD/DWG technical files:'
    : 'Hesabınızı aktifleştirmek, e-posta adresinizi doğrulamak ve yüksek çözünürlüklü 3D model ile CAD/DWG teknik çizim dosyalarına erişebilmek için lütfen aşağıdaki butona tıklayın:'
  const buttonText = isEn ? 'Verify My Account' : 'Üyeliğimi Doğrula'
  const fallbackNotice = isEn
    ? 'If the button above does not work, please copy and paste the following link into your browser:'
    : 'Yukarıdaki buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:'
  const ignoreNotice = isEn
    ? 'If you did not request this verification, you can safely ignore this email.'
    : 'Bu başvuruyu siz gerçekleştirmediyseniz bu e-postayı dikkate almayınız.'
  const subject = isEn ? 'Birim Account Verification' : 'Birim Üyelik Doğrulaması'

  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <a href="https://www.birim.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://www.birim.com/img/logo-1.png" alt="B I R I M" width="150" style="display: block; margin: 0 auto; max-width: 160px; height: auto; border: 0;" />
              </a>
              <div style="font-size: 11px; letter-spacing: 2px; color: #64748b; margin-top: 10px; text-transform: uppercase;">
                Contemporary Architecture &amp; Design
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #0f172a; text-transform: uppercase;">
                ${title}
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #334155;">
                ${displayName}
              </p>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #475569;">
                ${subtitle}
              </p>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 22px; color: #475569;">
                ${bodyText}
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-decoration: none; padding: 13px 30px; border-radius: 4px; border: 1px solid #27272a;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 24px 0 20px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
                  ${fallbackNotice}
                </p>
                <a href="${verificationUrl}" target="_blank" style="font-size: 12px; color: #2563eb; word-break: break-all; text-decoration: underline;">
                  ${verificationUrl}
                </a>
              </div>
              <p style="margin: 20px 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                ${ignoreNotice}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #475569;">
                Birim Mobilya Tasarım San. ve Tic. A.Ş.
              </p>
              <p style="margin: 0 0 10px; font-size: 11px; color: #94a3b8;">
                <a href="https://www.birim.com" target="_blank" style="color: #64748b; text-decoration: none;">www.birim.com</a>
                &nbsp;•&nbsp;
                <a href="mailto:birim@birim.com" style="color: #64748b; text-decoration: none;">birim@birim.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Birim. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // 1. Resend API
  if (resendClient) {
    try {
      const {data, error} = await resendClient.emails.send({
        from: getEmailFrom(),
        to: [email],
        replyTo: 'birim@birim.com',
        subject,
        html,
      })
      if (error) throw new Error(error.message)
      console.log(`✅ [Local API] Resend ile e-posta gönderildi (${email}), id: ${data?.id}`)
      return
    } catch (rErr) {
      console.warn(`⚠️ [Local API] Resend gönderim hatası (${rErr.message}), SMTP deneniyor...`)
    }
  }

  // 2. SMTP
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: '"Birim Design" <birim@birim.com>',
        to: email,
        replyTo: 'birim@birim.com',
        subject: 'Birim Üyelik Doğrulaması',
        html,
      })
      console.log(`✅ [Local API] SMTP ile e-posta gönderildi: ${email}`)
      return
    } catch (err) {
      console.warn(`⚠️ [Local API] SMTP e-posta gönderimi başarısız (${err.message}). Konsoldaki link kullanılabilir.`)
    }
  }
}

const SANITY_PROJECT_ID = process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f'
const SANITY_DATASET = process.env.VITE_SANITY_DATASET || 'production'
const SANITY_API_VERSION = process.env.VITE_SANITY_API_VERSION || '2025-01-01'
const SANITY_TOKEN = process.env.SANITY_TOKEN

if (!SANITY_TOKEN) {
  console.warn('⚠️  SANITY_TOKEN bulunamadı. Kayıt/yazma işlemleri başarısız olabilir.')
  console.warn('   .env.local dosyasına SANITY_TOKEN=... ekleyin.')
}

const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

// Supabase Admin Client
const {createClient: createSupabaseClient} = await import('@supabase/supabase-js')
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://rkmpfxervwqleibhbiqv.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false},
    })
  : null

if (!supabaseAdmin) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY bulunamadı. Supabase üye yönetimi çalışmayabilir.')
}

const app = express()
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({limit: '50mb', extended: true}))

const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3333',
  'https://birim.sanity.studio',
  'https://www.birim.com',
]

// CORS - Dinamik origin destegi
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.sanity.studio') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001')
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Api-Secret, Accept, x-analytics-pin'
  )
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Startup Test: Supabase & Sanity Bağlantısını Kontrol Et
async function testConnections() {
  if (supabaseAdmin) {
    try {
      const { count, error } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      console.log(`✅ Supabase bağlantısı başarılı. profiles tablosunda ${count ?? 0} üye var.`)
    } catch (err) {
      console.error('❌ Supabase bağlantı hatası:', err.message)
    }
  }

  try {
    const productCount = await sanityClient.fetch('count(*[_type == "product"])')
    console.log(`✅ Sanity bağlantısı başarılı. Veritabanında ${productCount} ürün var.`)
  } catch (err) {
    console.error('❌ Sanity bağlantı veya yetki hatası!!')
    console.error(`   Hata: ${err.message}`)
    console.error(`   Project ID: ${SANITY_PROJECT_ID}, Dataset: ${SANITY_DATASET}`)
  }
}
testConnections()

// ─── JWT & Auth Cookie Helpers ────────────────────────────────────────────
function getJwtSecret() {
  return process.env.JWT_SECRET || 'birim_dev_fallback_jwt_secret_key_2026_do_not_use_in_prod'
}

function base64UrlEncode(str) {
  const buf = typeof str === 'string' ? Buffer.from(str) : str
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

function createToken(payload, expiresInSeconds = 604800) {
  const secret = getJwtSecret()
  const header = {alg: 'HS256', typ: 'JWT'}
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))

  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest()
  const encodedSignature = base64UrlEncode(signature)

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null

  const secret = getJwtSecret()
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(signatureInput).digest()
  )

  const sigBuffer = Buffer.from(encodedSignature)
  const expBuffer = Buffer.from(expectedSignature)
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload)
    const payload = JSON.parse(payloadJson)
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

function getAuthTokenFromReq(req) {
  const authHeader = req.headers?.['authorization']
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim()
  }

  const cookieHeader = req.headers?.['cookie']
  if (cookieHeader && typeof cookieHeader === 'string') {
    const cookies = cookieHeader.split(';').reduce((acc, pair) => {
      const idx = pair.indexOf('=')
      if (idx > 0) {
        const key = pair.substring(0, idx).trim()
        const val = pair.substring(idx + 1).trim()
        acc[key] = decodeURIComponent(val)
      }
      return acc
    }, {})
    if (cookies['birim_token']) {
      return cookies['birim_token']
    }
  }

  return null
}

function setAuthCookie(res, token) {
  const maxAge = 604800
  const cookieStr = `birim_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
  res.setHeader('Set-Cookie', cookieStr)
}

function requireLocalAuth(req, res, next) {
  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(401).json({error: 'Oturum açmanız gerekmektedir.'})
  }
  const payload = verifyToken(token)
  if (!payload || !payload.sub) {
    return res.status(401).json({error: 'Geçersiz veya süresi dolmuş oturum.'})
  }
  req.userId = payload.sub
  next()
}

// ─── /api/auth/login ───────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const {email, password} = req.body
  if (!email || !password) return res.status(400).json({error: 'Email ve şifre gereklidir.'})

  const normEmail = email.trim().toLowerCase()

  // 1. Supabase Auth dene
  if (supabaseAdmin && SUPABASE_ANON_KEY) {
    try {
      const clientAuth = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
            phone: profile?.phone || '',
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
      } else if (authErr) {
        const {data: profile} = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', normEmail)
          .maybeSingle()

        if (profile) {
          if (authErr.message?.toLowerCase().includes('email not confirmed')) {
            return res.status(403).json({
              error:
                'Lütfen önce e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı onaylayın.',
            })
          }
          if (profile.profession === 'Bülten Abonesi') {
            return res.status(403).json({
              error:
                'Bu e-posta sadece bülten abonesi olarak kayıtlıdır. Lütfen üye ol sekmesinden şifre belirleyerek tam üyelik oluşturun.',
            })
          }
          if (authErr.message?.toLowerCase().includes('invalid login credentials')) {
            return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
          }
        }
        return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
      }
    } catch (sbErr) {
      console.warn('[Local API] Supabase login error:', sbErr)
      return res.status(500).json({error: `Giriş hatası: ${sbErr.message || 'Teknik bir hata oluştu.'}`})
    }
  }

  return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
})

// ─── /api/auth/me ──────────────────────────────────────────────────────────
app.all('/api/auth/me', async (req, res) => {
  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(200).json({authenticated: false, user: null})
  }

  const payload = verifyToken(token)
  const targetId = payload?.sub || token

  // 1. Supabase Profile check
  if (supabaseAdmin) {
    try {
      const {data: profile} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetId)
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
            phone: profile.phone || '',
            role: profile.role || 'consumer',
            company: profile.company || '',
            country: profile.country || '',
            profession: profile.profession || '',
            architectVerificationStatus:
              profile.architect_verification_status || 'not_requested',
            isActive: true,
            isVerified: profile.is_verified ?? true,
            createdAt: profile.created_at,
          },
        })
      }
    } catch (e) {
      console.warn('[Local API] Supabase me check warning:', e)
    }
  }

  return res.status(200).json({authenticated: false, user: null})
})

// ─── /api/auth/logout ──────────────────────────────────────────────────────
app.all('/api/auth/logout', (req, res) => {
  res.setHeader(
    'Set-Cookie',
    'birim_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )
  return res.status(200).json({success: true, message: 'Çıkış yapıldı.'})
})

// ─── /api/auth/register ───────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const {
    email,
    password,
    name,
    firstName,
    lastName,
    role,
    company,
    profession,
    phone,
    country,
  } = req.body || {}
  if (!email || !password) return res.status(400).json({error: 'Email ve şifre gereklidir.'})

  const normEmail = email.trim().toLowerCase()
  const dbRole = role === 'architect' ? 'architect' : 'user'
  const userRole = role === 'architect' ? 'architect' : 'consumer'
  const dbArchStatus = role === 'architect' ? 'pending' : 'none'
  const verificationStatus = role === 'architect' ? 'pending_verification' : 'not_requested'
  const displayName =
    name || `${firstName || ''} ${lastName || ''}`.trim() || normEmail.split('@')[0]
  const userProfession =
    profession || (role === 'architect' ? 'Mimar / İç Mimar' : 'Bireysel Kullanıcı')

  if (supabaseAdmin) {
    try {
      const {data: existingProfile} = await supabaseAdmin
        .from('profiles')
        .select('id, email, profession')
        .eq('email', normEmail)
        .maybeSingle()

      if (existingProfile) {
        if (existingProfile.profession === 'Bülten Abonesi') {
          await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
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
          })
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
          return res.status(200).json({
            success: true,
            message: 'Bülten aboneliğiniz üye hesabına dönüştürüldü.',
            user: {
              _id: existingProfile.id,
              id: existingProfile.id,
              email: normEmail,
              role: userRole,
            },
          })
        }
        return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
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
        return res.status(400).json({error: authError?.message || 'Kayıt hatası'})
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
      const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:3000'
      const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normEmail)}`
      const emailLang = detectUserLanguage(req, country, req.body?.lang)
      await sendVerificationEmail(normEmail, verificationUrl, displayName, emailLang)

      return res.status(201).json({
        success: true,
        user: {
          id: userId,
          _id: userId,
          email: normEmail,
          name: displayName,
          role: userRole,
          architectVerificationStatus: verificationStatus,
          verificationToken,
          verificationUrl,
        },
      })
    } catch (sbErr) {
      console.error('[Local API] Supabase register error:', sbErr)
      return res.status(500).json({error: sbErr.message})
    }
  }

  return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
})

// ─── /api/auth/verify ─────────────────────────────────────────────────────
app.post('/api/auth/verify', async (req, res) => {
  const {token, email} = req.body || {}
  const targetEmail = email ? email.trim().toLowerCase() : null
  const trimmedToken = typeof token === 'string' ? token.trim() : ''

  if (supabaseAdmin) {
    try {
      let profile = null
      let matchedUser = null

      if (targetEmail) {
        const {data} = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', targetEmail)
          .maybeSingle()
        profile = data

        if (profile?.id) {
          try {
            const {data: usrRes} = await supabaseAdmin.auth.admin.getUserById(profile.id)
            if (usrRes?.user) {
              matchedUser = usrRes.user
            }
          } catch {}
        }
      }

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
        profile = data || profile

        if (profile?.id) {
          await supabaseAdmin.auth.admin.updateUserById(profile.id, {
            email_confirm: true,
            user_metadata: {
              ...matchedUser?.user_metadata,
              email_verified: true,
              verification_token_hash: null,
              verification_token_expires: null,
            },
          }).catch(() => {})
        }
      }

      const finalUserId = profile?.id || matchedUser?.id || targetEmail || 'verified_user'
      const finalEmail = profile?.email || matchedUser?.email || targetEmail || ''
      const finalRole = profile?.role || matchedUser?.user_metadata?.role || 'architect'

      const sessionToken = createToken({
        sub: finalUserId,
        email: finalEmail,
        role: finalRole,
      })
      setAuthCookie(res, sessionToken)

      return res.status(200).json({
        success: true,
        token: sessionToken,
        message: 'E-posta adresiniz başarıyla doğrulandı.',
        user: {
          _id: finalUserId,
          id: finalUserId,
          email: finalEmail,
          name: profile?.name || matchedUser?.user_metadata?.name || '',
          role: finalRole,
          company: profile?.company || matchedUser?.user_metadata?.company || '',
          profession: profile?.profession || matchedUser?.user_metadata?.profession || '',
          architectVerificationStatus: profile?.architect_verification_status || 'pending',
          isVerified: true,
        },
      })
    } catch (err) {
      console.error('[Local API] Supabase verify error:', err)
    }
  }

  if (!token && !email) return res.status(400).json({error: "Doğrulama token'ı gereklidir."})
  return res.status(200).json({
    success: true,
    message: 'E-posta adresiniz başarıyla doğrulandı.',
    user: {
      _id: targetEmail || 'local_user',
      id: targetEmail || 'local_user',
      email: targetEmail || '',
      name: '',
      role: 'architect',
      architectVerificationStatus: 'pending',
      isVerified: true,
    }
  })
})

// ─── /api/account/profile ─────────────────────────────────────────────────
app.get('/api/account/profile', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    const {data: profile, error} = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .maybeSingle()

    if (error) return res.status(500).json({error: error.message})
    if (!profile) return res.status(404).json({error: 'Profil bulunamadı.'})

    return res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name || null,
        firstName: profile.first_name || null,
        lastName: profile.last_name || null,
        company: profile.company || null,
        profession: profile.profession || null,
        phone: profile.phone || null,
        taxId: profile.tax_id || null,
        role: profile.role || 'user',
        architectVerificationStatus: profile.architect_verification_status || 'not_requested',
        isVerified: Boolean(profile.is_verified),
        newsletterSubscribed: Boolean(profile.newsletter_subscribed ?? (profile.profession === 'Bülten Abonesi')),
        createdAt: profile.created_at || new Date().toISOString(),
        updatedAt: profile.updated_at || null,
      }
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.patch('/api/account/profile', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    const updates = {updated_at: new Date().toISOString()}
    const body = req.body || {}
    if (body.name !== undefined) updates.name = body.name ? String(body.name).trim() : null
    if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null
    if (body.company !== undefined) updates.company = body.company ? String(body.company).trim() : null
    if (body.profession !== undefined) updates.profession = body.profession ? String(body.profession).trim() : null
    if (body.newsletter_subscribed !== undefined || body.newsletterSubscribed !== undefined) {
      updates.newsletter_subscribed = Boolean(body.newsletter_subscribed ?? body.newsletterSubscribed)
    }

    let {error} = await supabaseAdmin.from('profiles').update(updates).eq('id', req.userId)
    if (error && error.message?.includes('newsletter_subscribed')) {
      delete updates.newsletter_subscribed
      const retry = await supabaseAdmin.from('profiles').update(updates).eq('id', req.userId)
      error = retry.error
    }
    if (error) return res.status(500).json({error: error.message})

    const {data: updated} = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .maybeSingle()

    return res.status(200).json({
      success: true,
      profile: {
        id: updated.id,
        email: updated.email,
        name: updated.name || null,
        firstName: updated.first_name || null,
        lastName: updated.last_name || null,
        company: updated.company || null,
        profession: updated.profession || null,
        phone: updated.phone || null,
        taxId: updated.tax_id || null,
        role: updated.role || 'user',
        architectVerificationStatus: updated.architect_verification_status || 'not_requested',
        isVerified: Boolean(updated.is_verified),
        newsletterSubscribed: Boolean(updated.newsletter_subscribed ?? (updated.profession === 'Bülten Abonesi')),
        createdAt: updated.created_at || new Date().toISOString(),
        updatedAt: updated.updated_at || null,
      }
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// ─── /api/account/change-password ─────────────────────────────────────────
app.post('/api/account/change-password', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  const {currentPassword, newPassword} = req.body || {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({error: 'Mevcut şifre ve yeni şifre gereklidir.'})
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({error: 'Yeni şifre en az 6 karakter olmalıdır.'})
  }

  try {
    const {data: usrData, error: usrErr} = await supabaseAdmin.auth.admin.getUserById(req.userId)
    if (usrErr || !usrData?.user?.email) {
      return res.status(404).json({error: 'Kullanıcı hesabı bulunamadı.'})
    }

    if (SUPABASE_ANON_KEY && SUPABASE_URL) {
      const testClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {persistSession: false},
      })
      const {error: signErr} = await testClient.auth.signInWithPassword({
        email: usrData.user.email,
        password: currentPassword,
      })
      if (signErr) {
        return res.status(400).json({error: 'Mevcut şifreniz hatalı.'})
      }
    }

    const {error: updateErr} = await supabaseAdmin.auth.admin.updateUserById(req.userId, {
      password: newPassword,
    })

    if (updateErr) {
      return res.status(500).json({error: updateErr.message})
    }

    return res.status(200).json({success: true, message: 'Şifreniz başarıyla güncellendi.'})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// ─── /api/account/addresses ───────────────────────────────────────────────
app.get('/api/account/addresses', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(200).json({success: true, addresses: []})
  try {
    const {data, error} = await supabaseAdmin
      .from('customer_addresses')
      .select('id, user_id, label, recipient_name, phone, address_line_1, address_line_2, city, district, postal_code, country, is_default_shipping, created_at, updated_at')
      .eq('user_id', req.userId)
      .order('is_default_shipping', {ascending: false})
      .order('created_at', {ascending: false})

    if (error) return res.status(200).json({success: true, addresses: []})

    const addresses = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      label: row.label,
      recipientName: row.recipient_name,
      phone: row.phone,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2 || null,
      city: row.city,
      district: row.district,
      postalCode: row.postal_code || null,
      country: row.country || 'Türkiye',
      isDefaultShipping: Boolean(row.is_default_shipping),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    return res.status(200).json({success: true, addresses})
  } catch {
    return res.status(200).json({success: true, addresses: []})
  }
})

app.post('/api/account/addresses', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    const body = req.body || {}
    const isDefault = Boolean(body.is_default_shipping ?? body.isDefaultShipping)
    if (isDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({is_default_shipping: false, updated_at: new Date().toISOString()})
        .eq('user_id', req.userId)
        .eq('is_default_shipping', true)
    }

    const {data, error} = await supabaseAdmin
      .from('customer_addresses')
      .insert({
        user_id: req.userId,
        label: body.label || 'Ev',
        recipient_name: body.recipient_name || body.recipientName || '',
        phone: body.phone || '',
        address_line_1: body.address_line_1 || body.addressLine1 || '',
        address_line_2: body.address_line_2 || body.addressLine2 || null,
        city: body.city || '',
        district: body.district || '',
        postal_code: body.postal_code || body.postalCode || null,
        country: body.country || 'Türkiye',
        is_default_shipping: isDefault,
      })
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(201).json({
      success: true,
      address: {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        recipientName: data.recipient_name,
        phone: data.phone,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2 || null,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code || null,
        country: data.country || 'Türkiye',
        isDefaultShipping: Boolean(data.is_default_shipping),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.delete('/api/account/addresses/:id', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    const {error} = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId)

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({success: true, message: 'Adres silindi.'})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.post('/api/account/addresses/:id/default', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    await supabaseAdmin
      .from('customer_addresses')
      .update({is_default_shipping: false, updated_at: new Date().toISOString()})
      .eq('user_id', req.userId)

    const {data, error} = await supabaseAdmin
      .from('customer_addresses')
      .update({is_default_shipping: true, updated_at: new Date().toISOString()})
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({
      success: true,
      address: {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        recipientName: data.recipient_name,
        phone: data.phone,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2 || null,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code || null,
        country: data.country || 'Türkiye',
        isDefaultShipping: true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// ─── /api/account/billing & /api/account/billing-profiles ────────────────
const handleGetBillingProfiles = async (req, res) => {
  if (!supabaseAdmin) return res.status(200).json({success: true, billingProfiles: []})
  try {
    const {data, error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .order('is_default', {ascending: false})
      .order('created_at', {ascending: false})

    if (error) return res.status(200).json({success: true, billingProfiles: []})

    const billingProfiles = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      billingType: row.billing_type,
      label: row.label,
      fullName: row.full_name || null,
      companyName: row.company_name || null,
      taxOffice: row.tax_office || null,
      taxNumber: row.tax_number || null,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2 || null,
      city: row.city,
      district: row.district,
      postalCode: row.postal_code || null,
      country: row.country || 'Türkiye',
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    return res.status(200).json({success: true, billingProfiles})
  } catch {
    return res.status(200).json({success: true, billingProfiles: []})
  }
}

const handlePostBillingProfile = async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    const body = req.body || {}
    const isDefault = Boolean(body.is_default ?? body.isDefault)
    if (isDefault) {
      await supabaseAdmin
        .from('customer_billing_profiles')
        .update({is_default: false, updated_at: new Date().toISOString()})
        .eq('user_id', req.userId)
        .eq('is_default', true)
    }

    const {data, error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .insert({
        user_id: req.userId,
        billing_type: body.billing_type || body.billingType || 'individual',
        label: body.label || 'Fatura',
        full_name: body.full_name || body.fullName || null,
        company_name: body.company_name || body.companyName || null,
        tax_office: body.tax_office || body.taxOffice || null,
        tax_number: body.tax_number || body.taxNumber || null,
        address_line_1: body.address_line_1 || body.addressLine1 || '',
        address_line_2: body.address_line_2 || body.addressLine2 || null,
        city: body.city || '',
        district: body.district || '',
        postal_code: body.postal_code || body.postalCode || null,
        country: body.country || 'Türkiye',
        is_default: isDefault,
      })
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(201).json({
      success: true,
      billingProfile: {
        id: data.id,
        userId: data.user_id,
        billingType: data.billing_type,
        label: data.label,
        fullName: data.full_name || null,
        companyName: data.company_name || null,
        taxOffice: data.tax_office || null,
        taxNumber: data.tax_number || null,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2 || null,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code || null,
        country: data.country || 'Türkiye',
        isDefault: Boolean(data.is_default),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
}

const handleDeleteBillingProfile = async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    const {error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId)

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({success: true, message: 'Fatura profili silindi.'})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
}

const handleDefaultBillingProfile = async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Supabase servisi yok.'})
  try {
    await supabaseAdmin
      .from('customer_billing_profiles')
      .update({is_default: false, updated_at: new Date().toISOString()})
      .eq('user_id', req.userId)

    const {data, error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .update({is_default: true, updated_at: new Date().toISOString()})
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({
      success: true,
      billingProfile: {
        id: data.id,
        userId: data.user_id,
        billingType: data.billing_type,
        label: data.label,
        fullName: data.full_name || null,
        companyName: data.company_name || null,
        taxOffice: data.tax_office || null,
        taxNumber: data.tax_number || null,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2 || null,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code || null,
        country: data.country || 'Türkiye',
        isDefault: true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
}

app.get('/api/account/billing', requireLocalAuth, handleGetBillingProfiles)
app.get('/api/account/billing-profiles', requireLocalAuth, handleGetBillingProfiles)
app.post('/api/account/billing', requireLocalAuth, handlePostBillingProfile)
app.post('/api/account/billing-profiles', requireLocalAuth, handlePostBillingProfile)
app.delete('/api/account/billing/:id', requireLocalAuth, handleDeleteBillingProfile)
app.delete('/api/account/billing-profiles/:id', requireLocalAuth, handleDeleteBillingProfile)
app.post('/api/account/billing/:id/default', requireLocalAuth, handleDefaultBillingProfile)
app.post('/api/account/billing-profiles/:id/default', requireLocalAuth, handleDefaultBillingProfile)

// ─── /api/account/orders ──────────────────────────────────────────────────
app.get('/api/account/orders', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(200).json({success: true, orders: []})
  try {
    const {data, error} = await supabaseAdmin
      .from('commerce_orders')
      .select('id, order_number, order_status, payment_status, total_amount, currency, item_count, tracking_number, created_at, paid_at')
      .eq('user_id', req.userId)
      .order('created_at', {ascending: false})

    if (error) return res.status(200).json({success: true, orders: []})

    const orders = (data || []).map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      orderStatus: row.order_status,
      paymentStatus: row.payment_status,
      totalAmount: row.total_amount,
      currency: row.currency || 'TRY',
      itemCount: row.item_count || 1,
      trackingNumber: row.tracking_number || null,
      createdAt: row.created_at,
      paidAt: row.paid_at || null,
    }))
    return res.status(200).json({success: true, orders})
  } catch {
    return res.status(200).json({success: true, orders: []})
  }
})

app.get('/api/account/orders/:id', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(404).json({error: 'Sipariş bulunamadı.'})
  try {
    const {data, error} = await supabaseAdmin
      .from('commerce_orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .maybeSingle()

    if (error || !data) return res.status(404).json({error: 'Sipariş bulunamadı.'})
    return res.status(200).json({success: true, order: data})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// ─── Ortak Mimar / Özel Erişim Kayıt Fonksiyonu ───────────────────────────
async function handleSubscribeProfLogic(req, res) {
  const {email, password, name, company, profession, phone, country} = req.body || {}
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  const normEmail = email.trim().toLowerCase()
  const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:3000'
  const verificationToken = randomUUID()
  const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex')
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const verificationUrl = `${siteUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normEmail)}`

  if (supabaseAdmin) {
    try {
      const {data: existing} = await supabaseAdmin
        .from('profiles')
        .select('id, email, profession, role, architect_verification_status, is_verified, name, company, phone')
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
          } catch {}

          if (hasAuthAccount) {
            if (password) {
              await supabaseAdmin.auth.admin.updateUserById(existing.id, {password}).catch(() => {})
            }
            await supabaseAdmin.auth.admin.updateUserById(existing.id, {
              user_metadata: {
                name: name || existing.name || '',
                role: 'architect',
                company: company || existing.company || '',
                country: country || 'Türkiye',
                profession: profession || existing.profession || 'Mimar / İç Mimar',
                phone: phone || existing.phone || '',
                email_verified: false,
                verification_token_hash: verificationTokenHash,
                verification_token_expires: verificationTokenExpires,
              },
            }).catch(() => {})
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
                verification_token_hash: verificationTokenHash,
                verification_token_expires: verificationTokenExpires,
              },
            })
            if (newAuth?.user?.id) {
              await supabaseAdmin.from('profiles').delete().eq('id', existing.id)
              existing.id = newAuth.user.id
            }
          }

          await supabaseAdmin
            .from('profiles')
            .upsert({
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

          const emailLang = detectUserLanguage(req, country, req.body?.lang)
          await sendVerificationEmail(normEmail, verificationUrl, name || existing.name, emailLang)

          return res.status(200).json({
            success: true,
            message: 'Mimar başvurusu bilgileriniz başarıyla güncellendi. Lütfen e-posta adresinize gönderilen onay bağlantısını kontrol edin.',
            email: normEmail,
            verificationUrl,
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
          email_verified: false,
          verification_token_hash: verificationTokenHash,
          verification_token_expires: verificationTokenExpires,
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
        if (foundUser) {
          if (password) {
            await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {password}).catch(() => {})
          }
          await supabaseAdmin.auth.admin
            .updateUserById(foundUser.id, {
              user_metadata: {
                ...foundUser.user_metadata,
                name: name || foundUser.user_metadata?.name || '',
                role: 'architect',
                company: company || foundUser.user_metadata?.company || '',
                country: country || 'Türkiye',
                profession: profession || foundUser.user_metadata?.profession || 'Mimar / İç Mimar',
                phone: phone || foundUser.user_metadata?.phone || '',
                email_verified: false,
                verification_token_hash: verificationTokenHash,
                verification_token_expires: verificationTokenExpires,
              },
            })
            .catch(() => {})
        }
      }

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
          updated_at: new Date().toISOString(),
        },
        {onConflict: 'id'}
      )

      const emailLang = detectUserLanguage(req, country, req.body?.lang)
      await sendVerificationEmail(normEmail, verificationUrl, name, emailLang)

      return res.status(201).json({
        success: true,
        message: 'Başvurunuz alındı. Lütfen e-posta adresinize gönderilen onay mailini kontrol edin.',
        email: normEmail,
        verificationUrl,
      })
    } catch (err) {
      console.error('[Local API] Supabase subscribe-prof error:', err)
      return res.status(500).json({error: `Başvuru hatası: ${err.message}`})
    }
  }

  return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
}

// ─── /api/auth/subscribe ──────────────────────────────────────────────────
app.post('/api/auth/subscribe', async (req, res) => {
  const {email, isProfessional, profession} = req.body || {}
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})

  // Özel Erişim veya Mimar Başvurusu ise profesyonel kayıt akışına yönlendir
  if (isProfessional || (profession && profession !== 'Bülten Abonesi')) {
    return handleSubscribeProfLogic(req, res)
  }

  const normEmail = email.trim().toLowerCase()

  if (supabaseAdmin) {
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
          user: {id: existingUser.id, email: normEmail, userType: 'email_subscriber'},
        })
      }

      const {data: sbAuthUser, error: sbAuthErr} = await supabaseAdmin.auth.admin.createUser({
        email: normEmail,
        email_confirm: true,
        user_metadata: {name: 'E-posta Abonesi', role: 'user'},
      })

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
        user: {id: userId, email: normEmail, userType: 'email_subscriber'},
      })
    } catch (err) {
      console.error('[Local API] Supabase subscribe error:', err)
      return res.status(500).json({error: `Abonelik hatası: ${err.message}`})
    }
  }

  return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
})

// ─── /api/auth/subscribe-prof ─────────────────────────────────────────────
app.post('/api/auth/subscribe-prof', async (req, res) => {
  return handleSubscribeProfLogic(req, res)
})

// ─── /api/auth/reset-request ──────────────────────────────────────────────
app.post('/api/auth/reset-request', async (req, res) => {
  const {email} = req.body
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  const normEmail = email.trim().toLowerCase()

  if (supabaseAdmin) {
    try {
      const {data: profile} = await supabaseAdmin
        .from('profiles')
        .select('id, email, name')
        .eq('email', normEmail)
        .maybeSingle()

      if (profile) {
        const resetToken = randomUUID()
        const resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        await supabaseAdmin.auth.admin.updateUserById(profile.id, {
          user_metadata: {
            reset_password_token: resetToken,
            reset_password_expires: resetPasswordExpires,
          },
        }).catch(() => {})

        const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:3000'
        const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`
        console.log(`[Local API] Password reset link created: ${resetUrl}`)
        return res.status(200).json({success: true, resetToken, message: 'Şifre sıfırlama kodu oluşturuldu.'})
      }
      return res.status(200).json({success: true, message: 'Şifre sıfırlama kodu oluşturuldu.'})
    } catch (err) {
      console.error('Reset request error:', err)
      return res.status(500).json({error: `Hata: ${err.message || 'Süreç sırasında bir hata oluştu.'}`})
    }
  }
  return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
})

// ─── /api/auth/reset-password ─────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  const {token, newPassword} = req.body
  if (!token || !newPassword)
    return res.status(400).json({error: 'Token ve yeni şifre gereklidir.'})

  if (supabaseAdmin) {
    try {
      const {data: usersList} = await supabaseAdmin.auth.admin.listUsers()
      const now = new Date()
      const matchedUser = usersList?.users?.find(u => {
        const uToken = u.user_metadata?.reset_password_token
        const uExp = u.user_metadata?.reset_password_expires
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

      if (updateErr) return res.status(400).json({error: updateErr.message})
      return res.status(200).json({success: true, message: 'Şifreniz başarıyla değiştirildi.'})
    } catch (err) {
      console.error('Reset password error:', err)
      return res.status(500).json({error: `Şifre değiştirme hatası: ${err.message || 'Bir hata oluştu.'}`})
    }
  }
  return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
})

// ─── /api/auth/delete-account ─────────────────────────────────────────────
app.post('/api/auth/delete-account', async (req, res) => {
  const {id} = req.body
  if (!id) return res.status(400).json({error: 'Kullanıcı ID gereklidir.'})

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('profiles').delete().eq('id', id)
      await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {})
      return res.status(200).json({success: true})
    } catch (err) {
      console.error('Delete account error:', err)
      return res.status(500).json({error: 'Hesap silinirken bir hata oluştu.'})
    }
  }
  return res.status(500).json({error: 'Supabase servisi yapılandırılmamış.'})
})



// ─── /api/send-verification ───────────────────────────────────────────────
app.post('/api/send-verification', async (req, res) => {
  const {email, verificationUrl, logoUrl} = req.body || {}

  if (!mailTransporter || !SMTP_PASSWORD) {
    console.warn(
      '⚠️  SMTP_PASSWORD yok, e-posta gönderilemedi. .env dosyasına SMTP_PASSWORD ekleyin.'
    )
    console.log(`📧 [SIMÜLASYON] Doğrulama maili gönderilecekti → ${email}`)
    console.log(`   Doğrulama URL: ${verificationUrl}`)
    return res.json({ok: true, simulated: true})
  }

  if (!email || !verificationUrl) {
    return res.status(400).json({error: 'email and verificationUrl are required'})
  }

  console.log('[Email] Logo URL received:', logoUrl)

  try {
    await mailTransporter.sendMail({
      from: `"Birim Design" <${SMTP_USER}>`,
      to: email,
      subject: 'Birim Üyelik Doğrulaması',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb;">
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              padding: 32px 24px;
              background-color: #f9fafb;
              font-family: 'Arial Narrow', Arial, 'Helvetica Neue', Helvetica, sans-serif;
              color: #1a1f3a;
              font-size: 15px;
              line-height: 1.65;
              font-weight: 400;
            "
          >
            <div style="background-color:#ffffff; padding: 32px 28px 24px 28px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #1a1f3a;">
                Birim Üyelik
              </p>
              <p style="margin: 0 0 14px 0; color: #1a1f3a;">
                Merhaba,
              </p>
              <p style="margin: 0 0 14px 0; color: #1a1f3a;">
                Birim web sitesi için yeni bir üyelik talebi aldık. Üyeliğinizi tamamlamak için aşağıdaki butona tıklayın.
              </p>
              <p style="margin: 28px 0; text-align: left;">
                <a
                  href="${verificationUrl}"
                  style="
                    display: inline-block;
                    background: #1a1f3a;
                    color: #ffffff;
                    padding: 12px 24px;
                    text-decoration: none;
                    font-size: 13px;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    font-weight: 600;
                  "
                >
                  Üyeliğimi Doğrula
                </a>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563;">
                Eğer buton çalışmazsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınızın adres çubuğuna yapıştırabilirsiniz:
              </p>
              <p style="margin: 0; font-size: 12px; word-break: break-all;">
                <a href="${verificationUrl}" style="color:#1a1f3a; text-decoration: underline;">${verificationUrl}</a>
              </p>
            </div>
            ${
              logoUrl
                ? `
            <div style="text-align: center; margin-top: 24px;">
              <img
                src="${logoUrl}"
                alt="Birim Logo"
                style="height: 40px; width: auto; max-width: 200px; display: block; margin: 0 auto;"
              />
            </div>
            `
                : ''
            }
          </div>
        </body>
        </html>
      `,
    })

    console.log('✅ Verification email sent to', email)
    res.json({ok: true})
  } catch (err) {
    console.error('❌ Mail gönderim hatası:', err)
    res.status(500).json({error: 'Failed to send email'})
  }
})

// ─── /api/send-password-reset ─────────────────────────────────────────────
app.post('/api/send-password-reset', async (req, res) => {
  const {email, resetUrl, logoUrl} = req.body || {}

  if (!mailTransporter || !SMTP_PASSWORD) {
    console.warn(
      '⚠️  SMTP_PASSWORD yok, e-posta gönderilemedi. .env dosyasına SMTP_PASSWORD ekleyin.'
    )
    console.log(`📧 [SIMÜLASYON] Şifre sıfırlama maili gönderilecekti → ${email}`)
    console.log(`   Sıfırlama URL: ${resetUrl}`)
    return res.json({ok: true, simulated: true})
  }

  if (!email || !resetUrl) {
    return res.status(400).json({error: 'email and resetUrl are required'})
  }

  try {
    await mailTransporter.sendMail({
      from: `"Birim Design" <${SMTP_USER}>`,
      to: email,
      subject: 'Birim Şifre Sıfırlama Talebi',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb;">
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              padding: 32px 24px;
              background-color: #f9fafb;
              font-family: 'Arial Narrow', Arial, 'Helvetica Neue', Helvetica, sans-serif;
              color: #1a1f3a;
              font-size: 15px;
              line-height: 1.65;
              font-weight: 400;
            "
          >
            <div style="background-color:#ffffff; padding: 32px 28px 24px 28px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #1a1f3a;">
                Birim Şifre Sıfırlama
              </p>
              <p style="margin: 0 0 14px 0; color: #1a1f3a;">
                Merhaba,
              </p>
              <p style="margin: 0 0 14px 0; color: #1a1f3a;">
                Birim hesabınız için şifre sıfırlama talebinde bulunuldu. Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayın.
              </p>
              <p style="margin: 28px 0; text-align: left;">
                <a
                  href="${resetUrl}"
                  style="
                    display: inline-block;
                    background: #1a1f3a;
                    color: #ffffff;
                    padding: 12px 24px;
                    text-decoration: none;
                    font-size: 13px;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    font-weight: 600;
                  "
                >
                  Şifremi Sıfırla
                </a>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563;">
                Bağlantı 24 saat boyunca geçerlidir.
              </p>
              <p style="margin: 0; font-size: 12px; word-break: break-all;">
                <a href="${resetUrl}" style="color:#1a1f3a; text-decoration: underline;">${resetUrl}</a>
              </p>
            </div>
            ${
              logoUrl
                ? `
            <div style="text-align: center; margin-top: 24px;">
              <img
                src="${logoUrl}"
                alt="Birim Logo"
                style="height: 40px; width: auto; max-width: 200px; display: block; margin: 0 auto;"
              />
            </div>
            `
                : ''
            }
          </div>
        </body>
        </html>
      `,
    })

    console.log('✅ Password reset email sent to', email)
    res.json({ok: true})
  } catch (err) {
    console.error('❌ Sıfırlama maili gönderim hatası:', err)
    res.status(500).json({error: 'Failed to send reset email'})
  }
})



// In-Memory Rate Limiting for local API server (3 requests per 1 minute window)
const rateLimitStore = new Map()

app.post('/api/ai/nano-banana-planner', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
  const now = Date.now()
  const windowMs = 60 * 1000
  const limit = 3

  const rec = rateLimitStore.get(clientIp)
  if (!rec || now > rec.resetTime) {
    rateLimitStore.set(clientIp, {count: 1, resetTime: now + windowMs})
  } else if (rec.count >= limit) {
    console.warn(`⚠️ IP Rate limit aşıldı: ${clientIp}`)
    return res.status(429).json({
      error: 'Çok fazla istek attınız, lütfen 1 dakika bekleyin.',
      retryAfterSeconds: Math.ceil((rec.resetTime - now) / 1000),
    })
  } else {
    rec.count += 1
  }

  const {
    roomImage,
    productImage,
    customPrompt,
    angle,
    alignmentInstruction,
    productName,
    productDetails,
  } = req.body || {}
  if (!roomImage || !productImage) {
    return res.status(400).json({error: 'roomImage ve productImage parametreleri zorunludur.'})
  }

  // Input Sanitization for customPrompt
  let cleanPrompt = ''
  if (customPrompt && typeof customPrompt === 'string') {
    cleanPrompt = customPrompt
      .trim()
      .slice(0, 150)
      .replace(/<[^>]*>?/gm, '')
      .replace(/javascript:/gi, '')
      .replace(/ignore previous instructions/gi, '')
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY bulunamadı. Lütfen .env.local dosyasına GEMINI_API_KEY=... ekleyin.',
    })
  }

  try {
    const {GoogleGenAI} = await import('@google/genai')

    // Helper to get base64 & mimeType
    const parseImg = async inputStr => {
      if (inputStr.startsWith('data:')) {
        const matches = inputStr.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
        if (matches) return {mimeType: matches[1], base64Data: matches[2]}
      }
      if (inputStr.startsWith('http://') || inputStr.startsWith('https://')) {
        let targetUrl = inputStr
        if (targetUrl.includes('cdn.sanity.io') && !targetUrl.includes('w=')) {
          try {
            const urlObj = new URL(targetUrl)
            urlObj.searchParams.set('w', '512')
            urlObj.searchParams.set('q', '60')
            urlObj.searchParams.set('auto', 'format')
            targetUrl = urlObj.toString()
          } catch {
            // ignore
          }
        }
        const fRes = await fetch(targetUrl)
        if (!fRes.ok) throw new Error(`Görsel indirilemedi: ${fRes.statusText}`)
        const buf = Buffer.from(await fRes.arrayBuffer())
        return {
          mimeType: fRes.headers.get('content-type') || 'image/jpeg',
          base64Data: buf.toString('base64'),
        }
      }
      return {mimeType: 'image/jpeg', base64Data: inputStr}
    }

    const roomImg = await parseImg(roomImage)
    const productImg = await parseImg(productImage)

    let promptText = cleanPrompt
      ? cleanPrompt
      : `
You are an ultra-precise photorealistic 3D interior renderer and product-exact visualizer engine.

INPUT IMAGES:
- Image 1: The target room background scene.
- Image 2: The EXACT product model (${productName || 'Target Furniture'}).

ZERO-TOLERANCE MANDATORY PRODUCT CONSTRAINTS:
1. NO MODEL MODIFICATION OR SUBSTITUTION (ABSOLUTE RULE):
   - You MUST NOT change, alter, modify, redesign, simplify, or substitute the furniture model under ANY circumstances.
   - The product in the rendered room MUST be 100% IDENTICAL in structure, shape, geometry, proportions, arms, backrest, cushions, legs, stitching pattern, upholstery texture, color, and design language to the EXACT model shown in Image 2.
   - DO NOT generate a generic or alternative sofa/chair/table. It MUST be the EXACT same product model as Image 2.

2. ALLOWED VS FORBIDDEN ALTERATIONS:
   - ALLOWED: Adjusting the 3D perspective rotation, scale, room placement, and realistic environmental lighting/shadows of the product to fit Image 1 seamlessly.
   - FORBIDDEN: Modifying the armrest curve, leg material/shape, cushion shape/count, seam details, or fabric weave of Image 2.

3. STRICTLY NO CUT-OUT / STICKER OVERLAY:
   - Do NOT perform a naive 2D copy-paste or cutout overlay.
   - Fully re-render the exact furniture model of Image 2 into the 3D space of Image 1 with physically accurate contact shadows on the floor and realistic light reflections matching Image 1's light sources.

4. ENVIRONMENT & BACKGROUND INTEGRITY:
   - Analyze the vanishing point, horizon line, scale, camera height, and lighting of Image 1.
   - Place the untouched model of Image 2 firmly onto the floor plane of Image 1.
   - Do NOT alter the walls, floor materials, windows, or existing elements of Image 1 except casting soft contact shadows on the floor beneath the newly placed product.

5. EXACTLY ONE SINGLE PRODUCT INSTANCE (STRICT NO-DUPLICATION RULE):
   - Render EXACTLY ONE (1) single instance of the furniture model from Image 2 in the room.
   - NEVER place a second copy, clone, or duplicate of the furniture in the room.
   - There MUST be ONLY ONE piece of this furniture in the entire generated room image.
`.trim()

    if (productDetails && typeof productDetails === 'object') {
      const detailsList = []
      if (productDetails.material) detailsList.push(`- Material/Fabric: ${productDetails.material}`)
      if (productDetails.legStyle) detailsList.push(`- Leg Style: ${productDetails.legStyle}`)
      if (productDetails.color) detailsList.push(`- Color/Finish: ${productDetails.color}`)
      if (productDetails.description)
        detailsList.push(`- Description: ${productDetails.description}`)
      if (detailsList.length > 0) {
        promptText += `\n\nEXACT PRODUCT SPECIFICATIONS TO KEEP UNCHANGED:\n${detailsList.join('\n')}`
      }
    }

    if (angle) {
      promptText += `\n\nROTATION INSTRUCTION: Re-render the SINGLE model from Image 2 from the requested angle: ${angle}. Ensure there is ONLY ONE piece of furniture in the room.`
    }

    if (alignmentInstruction) {
      promptText += `\n\nPOSITIONING INSTRUCTION: Reposition the SINGLE model from Image 2 on the floor according to: ${alignmentInstruction}. Ensure NO duplicate furniture appears.`
    }

    promptText += `\n\nFINAL EXECUTION DIRECTIVE:\nProduce a single, photorealistic high-resolution photograph where the target furniture from Image 2 is integrated into Image 1 with 100% design fidelity.`

    let outputBuffer = null
    let outputMime = 'image/png'

    const imageModels = [
      'imagen-3.0-fast-generate-001',
      'imagen-3.0-generate-002',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ]

    for (const modelName of imageModels) {
      try {
        console.log(`🤖 AI Room Planner: Google Gemini AI sentezi başlatılıyor ("${modelName}")...`)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
        const apiRes = await fetch(url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {text: promptText},
                  {inlineData: {mimeType: roomImg.mimeType, data: roomImg.base64Data}},
                  {inlineData: {mimeType: productImg.mimeType, data: productImg.base64Data}},
                ],
              },
            ],
            generationConfig: {
              temperature: 0.15,
              responseModalities: ['IMAGE', 'TEXT'],
            },
          }),
        })

        if (!apiRes.ok) {
          const errBody = await apiRes.text()
          console.warn(`⚠️ Model ${modelName} HTTP ${apiRes.status}:`, errBody)
          continue
        }

        const resData = await apiRes.json()
        const candidates = resData.candidates || []
        if (candidates.length > 0 && candidates[0].content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              outputBuffer = Buffer.from(part.inlineData.data, 'base64')
              if (part.inlineData.mimeType) outputMime = part.inlineData.mimeType
              break
            }
          }
        }

        if (!outputBuffer && resData.text) {
          const match = resData.text.match(/data:(image\/[a-zA-Z+]+);base64,([A-Za-z0-9+/=]+)/)
          if (match) {
            outputMime = match[1]
            outputBuffer = Buffer.from(match[2], 'base64')
          }
        }

        if (outputBuffer) {
          console.log(`✅ Google Gemini AI görsel sentezi başarıyla tamamlandı (${modelName})`)
          break
        }
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} istek hatası:`, err.message)
      }
    }

    if (!outputBuffer) {
      console.warn('⚠️ Google Gemini AI görsel sentezleme kotalara veya izinlere takıldı.')
      return res.status(200).json({
        success: true,
        imageUrl: roomImage,
        isDemo: true,
        message:
          'Google Gemini API kotanız (Free Tier) dolduğu için oda görseli hazırlandı. Kotanız yenilendiğinde canlı 3D sentezleme yapılacaktır.',
      })
    }

    // Try Cloudflare R2 Upload if available
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.SANITY_STUDIO_R2_ACCOUNT_ID
    const R2_ACCESS_KEY_ID =
      process.env.R2_ACCESS_KEY_ID || process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID
    const R2_SECRET_ACCESS_KEY =
      process.env.R2_SECRET_ACCESS_KEY || process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY
    const R2_BUCKET_NAME =
      process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web'
    const R2_DOMAIN = process.env.R2_DOMAIN || process.env.SANITY_STUDIO_R2_DOMAIN

    let finalUrl = `data:${outputMime};base64,${outputBuffer.toString('base64')}`

    if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
      try {
        const {S3Client, PutObjectCommand} = await import('@aws-sdk/client-s3')
        const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY},
        })
        const key = `ai-room-planner/${Date.now()}_${randomUUID().slice(0, 8)}.png`
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: outputBuffer,
            ContentType: outputMime,
          })
        )
        const domain = R2_DOMAIN?.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`
        finalUrl = `${domain}/${key}`
      } catch (err) {
        console.warn('R2 upload failed in dev server, using base64 fallback:', err.message)
      }
    }

    return res.status(200).json({
      success: true,
      imageUrl: finalUrl,
      message: 'Oda tasarımınız başarıyla oluşturuldu.',
    })
  } catch (err) {
    console.error('Local AI Room Planner error:', err)
    const errStr = String(err?.message || err)
    const isQuotaExceeded =
      errStr.includes('RESOURCE_EXHAUSTED') ||
      errStr.includes('Quota exceeded') ||
      errStr.includes('429')

    if (isQuotaExceeded) {
      console.warn('⚠️ Gemini API kotası/limiti dolduğu için Demo önizleme modu aktif edildi.')
      return res.status(200).json({
        success: true,
        imageUrl: roomImage,
        isDemo: true,
        message:
          'Google Gemini API kotanız (Free Tier) dolduğu için Demo modunda çalıştırıldı. Kotanız yenilendiğinde canlı AI sentezi yapılacaktır.',
      })
    }

    return res.status(500).json({error: `AI Oda Tasarımı hatası: ${err.message}`})
  }
})

// ─── GOOGLE ANALYTICS API ───────────────────────────────────────────────────
const analyticsCache = new Map()
const ANALYTICS_CACHE_TTL_MS = 60 * 1000

let lastValidRealtime = {
  activeUsers: 3,
  activePages: [
    {page: 'BIRIM | Modern Tasarım Mobilya', users: 2},
    {page: 'Ürünler - Koleksiyon', users: 1},
  ],
  activeCountries: [{country: 'Türkiye', city: 'İstanbul', users: 3}],
}

function getGaCredentials() {
  let propertyId = (process.env.GA_PROPERTY_ID || '').trim()
  if (propertyId.startsWith('properties/')) {
    propertyId = propertyId.replace('properties/', '')
  }
  const clientEmail = (process.env.GA_CLIENT_EMAIL || '').trim()
  let privateKey = (process.env.GA_PRIVATE_KEY || '').trim()
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1)
  }
  privateKey = privateKey.replace(/\\n/g, '\n')
  return {propertyId, clientEmail, privateKey}
}

async function getGaAccessToken() {
  const {propertyId, clientEmail, privateKey} = getGaCredentials()
  if (!propertyId || !clientEmail || !privateKey) {
    throw new Error('Google Analytics kimlik bilgileri (GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY) eksik.')
  }
  const {GoogleAuth} = await import('google-auth-library')
  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  if (!token.token) throw new Error('Google Auth access token alınamadı.')
  return token.token
}

async function runGaReport(body) {
  const {propertyId} = getGaCredentials()
  const token = await getGaAccessToken()
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({error: 'Unknown API error'}))
    throw new Error(`GA API Error: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

async function runGaRealtimeReport(body) {
  const {propertyId} = getGaCredentials()
  const token = await getGaAccessToken()
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({error: 'Unknown Realtime API error'}))
    throw new Error(`GA Realtime Error: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

async function getLocalRealtimeData() {
  const cacheKey = 'realtime'
  const cached = analyticsCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    const realtimeReport = await runGaRealtimeReport({
      dimensions: [{name: 'unifiedScreenName'}, {name: 'country'}, {name: 'city'}],
      metrics: [{name: 'activeUsers'}],
      limit: 20,
    })

    const rows = realtimeReport.rows || []
    let totalActive = 0
    const pageMap = new Map()
    const geoMap = new Map()

    for (const r of rows) {
      const page = r.dimensionValues?.[0]?.value || '/'
      const country = r.dimensionValues?.[1]?.value || 'Türkiye'
      const city = r.dimensionValues?.[2]?.value || 'İstanbul'
      const count = parseInt(r.metricValues?.[0]?.value || '0', 10) || 0

      totalActive += count
      pageMap.set(page, (pageMap.get(page) || 0) + count)

      const geoKey = `${country}_${city}`
      const existing = geoMap.get(geoKey)
      if (existing) {
        existing.users += count
      } else {
        geoMap.set(geoKey, {country, city, users: count})
      }
    }

    if (rows.length === 0) {
      const simpleReport = await runGaRealtimeReport({
        metrics: [{name: 'activeUsers'}],
      }).catch(() => null)
      totalActive = parseInt(simpleReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10) || 0
    }

    const activePages = Array.from(pageMap.entries())
      .map(([page, users]) => ({page, users}))
      .sort((a, b) => b.users - a.users)
      .slice(0, 8)

    const activeCountries = Array.from(geoMap.values())
      .sort((a, b) => b.users - a.users)
      .slice(0, 8)

    const result = {
      activeUsers: totalActive,
      activePages,
      activeCountries,
    }

    if (totalActive > 0) {
      lastValidRealtime = result
    }
    analyticsCache.set(cacheKey, {data: result, expires: Date.now() + 60 * 1000})
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ...lastValidRealtime,
      isQuotaThrottled: true,
      error: msg.includes('429')
        ? 'Google Analytics saatlik kota sınırı (Son aktif oturumlar gösteriliyor)'
        : msg,
    }
  }
}

async function getLocalAllAnalyticsData(startDate, endDate) {
  const cacheKey = `all_${startDate}_${endDate}`
  const cached = analyticsCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  const sleep = ms => new Promise(res => setTimeout(res, ms))

  // 1. Overview
  const overviewRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    metrics: [
      {name: 'activeUsers'},
      {name: 'sessions'},
      {name: 'screenPageViews'},
      {name: 'bounceRate'},
      {name: 'averageSessionDuration'},
      {name: 'newUsers'},
      {name: 'engagedSessions'},
    ],
  })
  await sleep(60)

  // 2. Daily Visitors
  const dailyRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'date'}],
    metrics: [
      {name: 'activeUsers'},
      {name: 'sessions'},
      {name: 'screenPageViews'},
      {name: 'newUsers'},
    ],
    orderBys: [{dimension: {dimensionName: 'date'}}],
  })
  await sleep(60)

  // 3. Top Pages
  const topPagesRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'pagePath'}, {name: 'pageTitle'}],
    metrics: [
      {name: 'screenPageViews'},
      {name: 'activeUsers'},
      {name: 'averageSessionDuration'},
      {name: 'bounceRate'},
    ],
    orderBys: [{metric: {metricName: 'screenPageViews'}, desc: true}],
    limit: 15,
  })
  await sleep(60)

  // 4. Sources
  const sourcesRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'sessionDefaultChannelGroup'}],
    metrics: [{name: 'sessions'}, {name: 'activeUsers'}, {name: 'bounceRate'}],
    orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
    limit: 10,
  })
  await sleep(60)

  // 5. Devices
  const devicesRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'deviceCategory'}],
    metrics: [{name: 'sessions'}, {name: 'activeUsers'}],
    orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
  })
  await sleep(60)

  // 6. Countries
  const countryRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'country'}],
    metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
    orderBys: [{metric: {metricName: 'activeUsers'}, desc: true}],
    limit: 100,
  })
  await sleep(60)

  // 7. Cities & Regions with Country
  const cityRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'country'}, {name: 'region'}, {name: 'city'}],
    metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
    orderBys: [{metric: {metricName: 'activeUsers'}, desc: true}],
    limit: 500,
  })
  await sleep(60)

  // 8. Browsers
  const browserRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'browser'}],
    metrics: [{name: 'sessions'}, {name: 'activeUsers'}],
    orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
    limit: 8,
  })

  // 9. Realtime
  const realtime = await getLocalRealtimeData()

  const ovRow = overviewRes.rows?.[0]
  const overview = {
    activeUsers: parseInt(ovRow?.metricValues?.[0]?.value || '0', 10) || 0,
    sessions: parseInt(ovRow?.metricValues?.[1]?.value || '0', 10) || 0,
    pageViews: parseInt(ovRow?.metricValues?.[2]?.value || '0', 10) || 0,
    bounceRate: parseFloat(ovRow?.metricValues?.[3]?.value || '0') || 0,
    avgSessionDuration: parseFloat(ovRow?.metricValues?.[4]?.value || '0') || 0,
    newUsers: parseInt(ovRow?.metricValues?.[5]?.value || '0', 10) || 0,
    engagedSessions: parseInt(ovRow?.metricValues?.[6]?.value || '0', 10) || 0,
  }

  const dailyVisitors = (dailyRes.rows || []).map(r => {
    const d = r.dimensionValues?.[0]?.value || ''
    const formatted =
      d.length === 8 ? `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}` : d
    return {
      date: formatted,
      activeUsers: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
      sessions: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
      pageViews: parseInt(r.metricValues?.[2]?.value || '0', 10) || 0,
      newUsers: parseInt(r.metricValues?.[3]?.value || '0', 10) || 0,
    }
  })

  const topPages = (topPagesRes.rows || []).map(r => ({
    pagePath: r.dimensionValues?.[0]?.value || '',
    pageTitle: r.dimensionValues?.[1]?.value || r.dimensionValues?.[0]?.value || '',
    pageViews: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
    avgDuration: parseFloat(r.metricValues?.[2]?.value || '0') || 0,
    bounceRate: parseFloat(r.metricValues?.[3]?.value || '0') || 0,
  }))

  const trafficSources = (sourcesRes.rows || []).map(r => ({
    channel: r.dimensionValues?.[0]?.value || 'Direct',
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
    bounceRate: parseFloat(r.metricValues?.[2]?.value || '0') || 0,
  }))

  const deviceBreakdown = (devicesRes.rows || []).map(r => ({
    device: r.dimensionValues?.[0]?.value || 'desktop',
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
  }))

  const countryData = (countryRes.rows || []).map(r => ({
    country: r.dimensionValues?.[0]?.value || 'Unknown',
    users: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    sessions: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
  }))

  const regionMap = new Map()

  const cityData = (cityRes.rows || [])
    .map(r => {
      const country = r.dimensionValues?.[0]?.value || 'Unknown'
      const region = r.dimensionValues?.[1]?.value || ''
      const rawCity = r.dimensionValues?.[2]?.value || ''
      const isCityValid = rawCity && rawCity !== '(not set)' && rawCity !== 'Unknown'
      const isRegionValid = region && region !== '(not set)' && region !== 'Unknown'

      const city = isCityValid ? rawCity : isRegionValid ? region : country
      const users = parseInt(r.metricValues?.[0]?.value || '0', 10) || 0
      const sessions = parseInt(r.metricValues?.[1]?.value || '0', 10) || 0

      // Aggregate region stats
      if (isRegionValid) {
        const rKey = `${country}_${region}`
        const existingR = regionMap.get(rKey)
        if (existingR) {
          existingR.users += users
          existingR.sessions += sessions
        } else {
          regionMap.set(rKey, {country, region, users, sessions})
        }
      }

      return {
        country,
        region: isRegionValid ? region : undefined,
        city,
        users,
        sessions,
      }
    })
    .filter(c => c.users > 0 || c.sessions > 0)

  const regionData = Array.from(regionMap.values()).sort((a, b) => b.users - a.users)

  const browserData = (browserRes.rows || []).map(r => ({
    browser: r.dimensionValues?.[0]?.value || 'Other',
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
  }))

  const result = {
    overview,
    dailyVisitors,
    topPages,
    trafficSources,
    deviceBreakdown,
    countryData,
    cityData,
    regionData,
    browserData,
    realtime,
  }

  analyticsCache.set(cacheKey, {data: result, expires: Date.now() + ANALYTICS_CACHE_TTL_MS})
  return result
}

app.get('/api/analytics', async (req, res) => {
  const expectedPin = (
    process.env.ANALYTICS_PIN ||
    process.env.VITE_ANALYTICS_PIN ||
    '1978'
  ).trim()
  const rawProvidedPin = req.headers['x-analytics-pin']
  const providedPin = typeof rawProvidedPin === 'string' ? rawProvidedPin.trim() : ''

  // Support master PIN, dev bypass key, query bypass, and Studio iframe
  const isBypassSecret =
    providedPin === 'birim-dev-2025' ||
    req.headers['x-analytics-bypass'] === '1' ||
    req.query.bypass === 'birim-dev-2025' ||
    (req.headers.referer && req.headers.referer.includes('bypass=birim-dev-2025'))

  const isOriginAllowed =
    (typeof req.headers.origin === 'string' && req.headers.origin.includes('sanity.studio')) ||
    (typeof req.headers.referer === 'string' && req.headers.referer.includes(':3333'))

  const isPinValid = Boolean(
    isBypassSecret ||
      isOriginAllowed ||
      (providedPin &&
        (providedPin === expectedPin ||
          providedPin === 'birim2026' ||
          providedPin === '1978' ||
          (providedPin.length === expectedPin.length &&
            crypto.timingSafeEqual(Buffer.from(providedPin), Buffer.from(expectedPin)))))
  )

  // Also check admin token if provided
  const authHeader = req.headers.authorization
  const hasAdminToken = Boolean(authHeader && authHeader.startsWith('Bearer '))

  // Verification endpoint for client PIN submission
  if (req.query.action === 'verify') {
    if (isPinValid || hasAdminToken) {
      return res.status(200).json({success: true, message: 'Doğrulama başarılı.'})
    }
    return res.status(401).json({success: false, error: 'Geçersiz PIN kodu.'})
  }

  // Verify PIN before serving analytics data
  if (!isPinValid && !hasAdminToken) {
    return res.status(401).json({
      success: false,
      error: 'Bu analitik verilerine erişmek için yetkili PIN kodu gereklidir.',
    })
  }

  try {
    const {startDate = '30daysAgo', endDate = 'today', type = 'all'} = req.query

    if (type === 'realtime') {
      const realtime = await getLocalRealtimeData()
      return res.status(200).json({success: true, data: {realtime}})
    }

    try {
      const data = await getLocalAllAnalyticsData(String(startDate), String(endDate))
      return res.status(200).json({success: true, data})
    } catch (gaErr) {
      console.warn('[Local Analytics] Real GA query failed or credentials missing, serving local mock analytics data:', gaErr.message)
      const fallbackData = {
        overview: {
          activeUsers: 1420,
          sessions: 2180,
          pageViews: 6840,
          bounceRate: 0.38,
          avgSessionDuration: 185,
          newUsers: 980,
          engagedSessions: 1640,
        },
        dailyVisitors: Array.from({length: 30}, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (29 - i))
          return {
            date: d.toISOString().split('T')[0],
            activeUsers: Math.floor(40 + Math.random() * 60),
            sessions: Math.floor(60 + Math.random() * 80),
            pageViews: Math.floor(180 + Math.random() * 250),
            newUsers: Math.floor(25 + Math.random() * 45),
          }
        }),
        topPages: [
          {pagePath: '/', pageTitle: 'Birim Mobilya | Modern & Özgün Tasarımlar', pageViews: 2450, users: 1120, avgDuration: 120, bounceRate: 0.32},
          {pagePath: '/products', pageTitle: 'Ürünler • Koleksiyon | Birim Mobilya', pageViews: 1890, users: 870, avgDuration: 210, bounceRate: 0.28},
          {pagePath: '/projects', pageTitle: 'Projeler | Birim Mobilya', pageViews: 840, users: 430, avgDuration: 165, bounceRate: 0.35},
          {pagePath: '/about', pageTitle: 'Hakkımızda | Birim Mobilya', pageViews: 620, users: 310, avgDuration: 95, bounceRate: 0.42},
          {pagePath: '/contact', pageTitle: 'İletişim | Birim Mobilya', pageViews: 510, users: 280, avgDuration: 85, bounceRate: 0.40},
          {pagePath: '/seckim', pageTitle: 'Seçtiklerim | Birim Mobilya', pageViews: 380, users: 195, avgDuration: 240, bounceRate: 0.20},
        ],
        trafficSources: [
          {channel: 'Direct', sessions: 920, users: 650, bounceRate: 0.34},
          {channel: 'Organic Search', sessions: 780, users: 510, bounceRate: 0.36},
          {channel: 'Organic Social', sessions: 320, users: 240, bounceRate: 0.45},
          {channel: 'Referral', sessions: 160, users: 110, bounceRate: 0.30},
        ],
        deviceBreakdown: [
          {device: 'desktop', sessions: 1340, users: 890},
          {device: 'mobile', sessions: 760, users: 480},
          {device: 'tablet', sessions: 80, users: 50},
        ],
        countryData: [
          {country: 'Turkey', users: 1150, sessions: 1780},
          {country: 'Germany', users: 85, sessions: 120},
          {country: 'United Kingdom', users: 60, sessions: 90},
          {country: 'United States', users: 45, sessions: 65},
          {country: 'Italy', users: 35, sessions: 50},
        ],
        cityData: [
          {country: 'Turkey', city: 'İstanbul', users: 740, sessions: 1120},
          {country: 'Turkey', city: 'Ankara', users: 190, sessions: 280},
          {country: 'Turkey', city: 'İzmir', users: 120, sessions: 190},
          {country: 'Turkey', city: 'Bursa', users: 60, sessions: 95},
          {country: 'Germany', city: 'Berlin', users: 45, sessions: 65},
          {country: 'United Kingdom', city: 'London', users: 40, sessions: 55},
          {country: 'United States', city: 'New York', users: 30, sessions: 45},
          {country: 'Italy', city: 'Milan', users: 25, sessions: 35},
          {country: 'Turkey', city: 'Antalya', users: 40, sessions: 65},
        ],
        browserData: [
          {browser: 'Chrome', sessions: 1280, users: 850},
          {browser: 'Safari', sessions: 620, users: 390},
          {browser: 'Edge', sessions: 180, users: 120},
          {browser: 'Firefox', sessions: 100, users: 60},
        ],
        realtime: {
          activeUsers: 4,
          activePages: [
            {page: 'Birim Mobilya | Modern & Özgün Tasarımlar', users: 2},
            {page: 'Ürünler • Koleksiyon | Birim Mobilya', users: 1},
            {page: 'Projeler | Birim Mobilya', users: 1},
          ],
          activeCountries: [
            {country: 'Türkiye', city: 'İstanbul', users: 3},
            {country: 'Türkiye', city: 'Ankara', users: 1},
          ],
        },
      }
      return res.status(200).json({success: true, data: fallbackData})
    }
  } catch (err) {
    console.error('Local Analytics API error:', err)
    return res.status(500).json({success: false, error: err.message || 'Analytics fetch failed'})
  }
})

// ─── /api/media/presigned-url ──────────────────────────────────────────────
app.post(['/api/media/presigned-url', '/api/media'], async (req, res) => {
  try {
    const {filename, contentType, folder} = req.body || {}
    if (!filename || !contentType) {
      return res.status(400).json({error: 'filename ve contentType parametreleri gereklidir.'})
    }

    const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID || process.env.SANITY_STUDIO_R2_ACCOUNT_ID || '').trim()
    const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID || '').trim()
    const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY || '').trim()
    const R2_BUCKET_NAME = (process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web').trim()
    const R2_DOMAIN = (process.env.R2_DOMAIN || process.env.SANITY_STUDIO_R2_DOMAIN || 'https://assets.birim.com').trim()

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({
        error: 'Cloudflare R2 konfigürasyon değişkenleri (.env.local) sunucu ortamında tanımlı değil.',
      })
    }

    const {S3Client, PutObjectCommand} = await import('@aws-sdk/client-s3')
    const {getSignedUrl} = await import('@aws-sdk/s3-request-presigner')

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    const safeFolder = typeof folder === 'string' && folder.trim() ? folder.trim() : 'uploads'
    const cleanFileName = filename.trim().replace(/[^a-zA-Z0-9_.-]/g, '_')
    const hasTimestamp = /^\d{10,14}[-_]/.test(cleanFileName)
    const finalFileName = hasTimestamp ? cleanFileName : `${Date.now()}-${cleanFileName}`
    const key = safeFolder.endsWith('/')
      ? `${safeFolder}${finalFileName}`
      : `${safeFolder}/${finalFileName}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, {expiresIn: 900})
    const defaultDomain = 'assets.birim.com'
    const domainToUse = R2_DOMAIN && R2_DOMAIN !== 'undefined' ? R2_DOMAIN : defaultDomain
    const r2Domain = domainToUse.startsWith('http') ? domainToUse : `https://${domainToUse}`
    const finalFileUrl = `${r2Domain}/${key}`

    return res.status(200).json({
      success: true,
      uploadUrl,
      fileUrl: finalFileUrl,
      key,
    })
  } catch (error) {
    console.error('Local presigned-url error:', error)
    return res.status(500).json({error: `Presigned URL oluşturulamadı: ${error.message}`})
  }
})

// ─── /api/media/list ───────────────────────────────────────────────────────
app.post('/api/media/list', async (req, res) => {
  try {
    const {continuationToken} = req.body || {}
    const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID || process.env.SANITY_STUDIO_R2_ACCOUNT_ID || '').trim()
    const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID || '').trim()
    const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY || '').trim()
    const R2_BUCKET_NAME = (process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web').trim()

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({error: 'Cloudflare R2 kimlik bilgileri eksik.'})
    }

    const {S3Client, ListObjectsV2Command} = await import('@aws-sdk/client-s3')
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      ContinuationToken: continuationToken || undefined,
    })

    const response = await r2Client.send(command)
    return res.status(200).json({
      success: true,
      contents: response.Contents || [],
      nextContinuationToken: response.NextContinuationToken,
    })
  } catch (error) {
    console.error('Local R2 list error:', error)
    return res.status(500).json({error: `Dosyalar listelenemedi: ${error.message}`})
  }
})

// ─── /api/media/delete-batch ───────────────────────────────────────────────
app.post('/api/media/delete-batch', async (req, res) => {
  try {
    const {keys} = req.body || {}
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({error: 'keys parametresi boş olamaz.'})
    }

    const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID || process.env.SANITY_STUDIO_R2_ACCOUNT_ID || '').trim()
    const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID || '').trim()
    const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY || '').trim()
    const R2_BUCKET_NAME = (process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web').trim()

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({error: 'Cloudflare R2 kimlik bilgileri eksik.'})
    }

    const {S3Client, DeleteObjectsCommand} = await import('@aws-sdk/client-s3')
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    const command = new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({Key: key})),
        Quiet: true,
      },
    })

    await r2Client.send(command)
    return res.status(200).json({
      success: true,
      deletedCount: keys.length,
    })
  } catch (error) {
    console.error('Local R2 delete-batch error:', error)
    return res.status(500).json({error: `Dosyalar silinemedi: ${error.message}`})
  }
})

// ─── /api/analytics/activity ──────────────────────────────────────────────
app.post('/api/analytics/activity', async (req, res) => {
  try {
    let bodyData = req.body
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData)
      } catch {
        return res.status(400).json({error: 'Invalid JSON payload'})
      }
    }

    if (!bodyData || typeof bodyData !== 'object') {
      return res.status(400).json({error: 'Missing payload'})
    }

    const payloadList = Array.isArray(bodyData) ? bodyData : [bodyData]
    if (payloadList.length === 0) {
      return res.status(400).json({error: 'Empty payload list'})
    }

    if (!supabaseAdmin) {
      return res.status(503).json({error: 'Supabase admin client unavailable'})
    }

    const rowsToInsert = payloadList
      .filter((item) => item && item.user_id && item.session_id && item.activity_type)
      .map((item) => ({
        user_id: item.user_id,
        user_email: item.user_email || null,
        session_id: item.session_id,
        activity_type: item.activity_type,
        page_url: item.page_url || null,
        page_title: item.page_title || null,
        duration_seconds: Math.max(0, Math.floor(Number(item.duration_seconds) || 0)),
        download_file_name: item.download_file_name || null,
        download_file_type: item.download_file_type || null,
        platform: item.platform || null,
        os: item.os || null,
        browser: item.browser || null,
        referrer: item.referrer || null,
        ip_address: req.ip || req.socket?.remoteAddress || null,
        city: 'Local Dev',
        country: 'TR',
        metadata: item.metadata || {},
        created_at: new Date().toISOString(),
      }))

    if (rowsToInsert.length === 0) {
      return res.status(400).json({error: 'No valid activity rows to record'})
    }

    const {error} = await supabaseAdmin.from('user_activities').insert(rowsToInsert)

    if (error) {
      console.warn('[Local API] Error inserting activities:', error.message)
      return res.status(200).json({
        success: false,
        warning: 'Activities received but persistence failed',
        details: error.message,
      })
    }

    return res.status(200).json({
      success: true,
      recorded: rowsToInsert.length,
    })
  } catch (err) {
    console.error('[Local API] Activity handler error:', err)
    return res.status(500).json({error: err.message})
  }
})

// ─── /api/admin/members ───────────────────────────────────────────────────
app.get('/api/admin/members', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  if (!supabaseAdmin) {
    return res.status(503).json({error: 'Supabase servisi yapılandırılmamış.'})
  }
  try {
    let supabaseProfiles = []
    if (supabaseAdmin) {
      try {
        const {data: profiles, error} = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', {ascending: false})

        if (!error && Array.isArray(profiles)) {
          supabaseProfiles = profiles
        }
      } catch (sbErr) {
        console.warn('[Local API Admin Members] Supabase query warning:', sbErr.message)
      }
    }

    // Sanity'deki kullanıcı ve abone kayıtlarını da yükle
    let sanityUsers = []
    if (sanityClient) {
      try {
        const rawSanityUsers = await sanityClient.fetch('*[_type == "user"]')
        sanityUsers = (rawSanityUsers || []).map((u) => ({
          id: u._id,
          email: u.email || '',
          name:
            u.name ||
            [u.firstName, u.lastName].filter(Boolean).join(' ') ||
            (u.email ? u.email.split('@')[0] : 'Kullanıcı'),
          first_name: u.firstName || null,
          last_name: u.lastName || null,
          role: u.role || (u.userType === 'email_subscriber' ? 'user' : (u.userType || 'user')),
          company: u.company || null,
          country: u.country || 'Türkiye',
          profession:
            u.profession || (u.userType === 'email_subscriber' ? 'Bülten Abonesi' : null),
          phone: u.phone || null,
          tax_id: u.taxId || null,
          architect_verification_status:
            u.architectVerificationStatus || (u.role === 'architect' ? 'pending' : 'none'),
          is_verified:
            u.isVerified !== undefined ? u.isVerified : (u.isActive !== undefined ? u.isActive : true),
          created_at: u.createdAt || u._createdAt,
          updated_at: u._updatedAt || u.createdAt || u._createdAt,
        }))
      } catch (sErr) {
        console.warn('[Local API Admin Members] Sanity fetch warning:', sErr.message)
      }
    }

    // E-posta adresine göre birleştir (Supabase öncelikli, Sanity tamamlayıcı)
    const emailMap = new Map()
    for (const p of supabaseProfiles) {
      if (p.email) emailMap.set(p.email.toLowerCase(), p)
    }
    for (const su of sanityUsers) {
      const norm = (su.email || '').toLowerCase()
      if (norm && !emailMap.has(norm)) {
        emailMap.set(norm, su)
      } else if (!norm) {
        emailMap.set(su.id, su)
      }
    }

    const allMembers = Array.from(emailMap.values())
    return res.status(200).json({
      success: true,
      count: allMembers.length,
      members: allMembers,
    })
  } catch (err) {
    console.error('[Local API Admin Members] Error:', err)
    return res.status(500).json({error: 'Üyeler yüklenirken bir hata oluştu.'})
  }
})

app.patch('/api/admin/members', async (req, res) => {
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

  if (!id) return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})

  if (supabaseAdmin) {
    try {
      const updates = {updated_at: new Date().toISOString()}
      if (architect_verification_status !== undefined) updates.architect_verification_status = architect_verification_status
      if (role !== undefined) updates.role = role
      if (typeof is_verified === 'boolean') updates.is_verified = is_verified
      if (name !== undefined) updates.name = name ? String(name).trim() : null
      if (company !== undefined) updates.company = company ? String(company).trim() : null
      if (country !== undefined) updates.country = country ? String(country).trim() : null
      if (profession !== undefined) updates.profession = profession ? String(profession).trim() : null
      if (phone !== undefined) updates.phone = phone ? String(phone).trim() : null
      if (tax_id !== undefined) updates.tax_id = tax_id ? String(tax_id).trim() : null

      const {data: updated, error} = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (updated) {
        return res.status(200).json({
          success: true,
          message: 'Üye bilgileri güncellendi.',
          member: updated,
        })
      }
    } catch {}
  }

  if (sanityClient) {
    try {
      const patch = sanityClient.patch(id)
      const setObj = {}
      if (name !== undefined) setObj.name = name
      if (company !== undefined) setObj.company = company
      if (country !== undefined) setObj.country = country
      if (profession !== undefined) setObj.profession = profession
      if (phone !== undefined) setObj.phone = phone
      if (role !== undefined) setObj.role = role
      if (architect_verification_status !== undefined) setObj.architectVerificationStatus = architect_verification_status
      if (is_verified !== undefined) setObj.isVerified = is_verified

      if (Object.keys(setObj).length > 0) {
        const updatedDoc = await patch.set(setObj).commit()
        return res.status(200).json({
          success: true,
          message: 'Üye bilgileri güncellendi.',
          member: {
            id: updatedDoc._id,
            email: updatedDoc.email,
            name: updatedDoc.name,
            company: updatedDoc.company,
            profession: updatedDoc.profession,
            role: updatedDoc.role,
            architect_verification_status: updatedDoc.architectVerificationStatus,
            is_verified: updatedDoc.isVerified,
          },
        })
      }
    } catch (sErr) {
      console.warn('[Local API Admin Members] Sanity patch warning:', sErr.message)
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Üye bilgileri güncellendi.',
    member: req.body || {},
  })
})

app.delete('/api/admin/members', async (req, res) => {
  const id = String(req.query?.id || req.body?.id || '').trim()
  if (!id) return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('profiles').delete().eq('id', id)
    } catch {}
  }

  if (sanityClient) {
    try {
      await sanityClient.delete(id)
    } catch {}
  }

  return res.status(200).json({success: true, message: 'Üye kaydı silindi.'})
})

// ─── MAINTENANCE BYPASS VERIFICATION ──────────────────────────────────────
app.post('/api/maintenance/verify', async (req, res) => {
  try {
    const {secret} = req.body || {}
    const rawProvided = typeof secret === 'string' ? secret.trim() : ''
    const expectedSecret = (
      process.env.MAINTENANCE_BYPASS_SECRET ||
      process.env.VITE_MAINTENANCE_BYPASS_SECRET ||
      'birim-dev-local'
    ).trim()

    const isMatch =
      rawProvided === expectedSecret ||
      rawProvided === 'birim-dev-local' ||
      (expectedSecret &&
        rawProvided.length === expectedSecret.length &&
        crypto.timingSafeEqual(Buffer.from(rawProvided), Buffer.from(expectedSecret)))

    if (!isMatch) {
      return res.status(401).json({error: 'Geçersiz bypass kodu.'})
    }

    const bypassToken = 'local-dev-bypass-token'
    res.setHeader(
      'Set-Cookie',
      `maintenance_bypass_session=${bypassToken}; Path=/; Max-Age=86400; SameSite=Lax`
    )

    return res.status(200).json({
      success: true,
      message: 'Bakım modu bypass doğrulaması başarılı.',
      bypassToken,
    })
  } catch (err) {
    console.error('[Local Maintenance Verify] Error:', err)
    return res.status(500).json({error: 'Doğrulama sırasında bir hata oluştu.'})
  }
})

// ─── /api/account ──────────────────────────────────────────────────────────

// 1. Profile
app.get('/api/account/profile', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const {data: profile, error} = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .maybeSingle()
    if (error) return res.status(500).json({error: error.message})
    if (!profile) return res.status(404).json({error: 'Profil bulunamadı.'})

    return res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name || null,
        firstName: profile.first_name || null,
        lastName: profile.last_name || null,
        company: profile.company || null,
        profession: profile.profession || null,
        phone: profile.phone || null,
        taxId: profile.tax_id || null,
        role: profile.role || 'user',
        architectVerificationStatus: profile.architect_verification_status || 'not_requested',
        isVerified: Boolean(profile.is_verified),
        newsletterSubscribed: Boolean(profile.newsletter_subscribed ?? (profile.profession === 'Bülten Abonesi')),
        createdAt: profile.created_at || new Date().toISOString(),
        updatedAt: profile.updated_at || null,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

const handleProfileUpdate = async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const rawPayload = req.body || {}
    const updates = {updated_at: new Date().toISOString()}
    if (rawPayload.name !== undefined) updates.name = rawPayload.name ? String(rawPayload.name).trim() : null
    if (rawPayload.phone !== undefined) updates.phone = rawPayload.phone ? String(rawPayload.phone).trim() : null
    if (rawPayload.company !== undefined) updates.company = rawPayload.company ? String(rawPayload.company).trim() : null
    if (rawPayload.profession !== undefined) updates.profession = rawPayload.profession ? String(rawPayload.profession).trim() : null
    if (rawPayload.newsletter_subscribed !== undefined || rawPayload.newsletterSubscribed !== undefined) {
      updates.newsletter_subscribed = Boolean(rawPayload.newsletter_subscribed ?? rawPayload.newsletterSubscribed)
    }

    let {data, error} = await supabaseAdmin.from('profiles').update(updates).eq('id', req.userId).select().single()
    if (error && error.message?.includes('newsletter_subscribed')) {
      delete updates.newsletter_subscribed
      const retry = await supabaseAdmin.from('profiles').update(updates).eq('id', req.userId).select().single()
      data = retry.data
      error = retry.error
    }
    if (error) return res.status(500).json({error: error.message})

    return res.status(200).json({
      success: true,
      profile: {
        id: data.id,
        email: data.email,
        name: data.name || null,
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        company: data.company || null,
        profession: data.profession || null,
        phone: data.phone || null,
        taxId: data.tax_id || null,
        role: data.role || 'user',
        architectVerificationStatus: data.architect_verification_status || 'not_requested',
        isVerified: Boolean(data.is_verified),
        newsletterSubscribed: Boolean(data.newsletter_subscribed ?? (data.profession === 'Bülten Abonesi')),
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || null,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
}
app.patch('/api/account/profile', requireLocalAuth, handleProfileUpdate)
app.put('/api/account/profile', requireLocalAuth, handleProfileUpdate)

// 2. Change Password
app.post('/api/account/change-password', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const {currentPassword, newPassword} = req.body || {}
    if (!currentPassword || !newPassword) {
      return res.status(400).json({error: 'Mevcut şifre ve yeni şifre gereklidir.'})
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({error: 'Yeni şifre en az 6 karakter olmalıdır.'})
    }

    const {data: usrData, error: usrErr} = await supabaseAdmin.auth.admin.getUserById(req.userId)
    if (usrErr || !usrData?.user?.email) {
      return res.status(404).json({error: 'Kullanıcı hesabı bulunamadı.'})
    }

    if (SUPABASE_ANON_KEY) {
      const testClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {auth: {persistSession: false}})
      const {error: signErr} = await testClient.auth.signInWithPassword({
        email: usrData.user.email,
        password: currentPassword,
      })
      if (signErr) {
        return res.status(400).json({error: 'Mevcut şifreniz hatalı.'})
      }
    }

    const {error: updateErr} = await supabaseAdmin.auth.admin.updateUserById(req.userId, {
      password: newPassword,
    })
    if (updateErr) return res.status(500).json({error: updateErr.message})

    return res.status(200).json({success: true, message: 'Şifreniz başarıyla güncellendi.'})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// 3. Addresses
app.get('/api/account/addresses', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const {data, error} = await supabaseAdmin
      .from('customer_addresses')
      .select('id, user_id, label, recipient_name, phone, address_line_1, address_line_2, city, district, postal_code, country, is_default_shipping, created_at, updated_at')
      .eq('user_id', req.userId)
      .order('is_default_shipping', {ascending: false})
      .order('created_at', {ascending: false})

    if (error) return res.status(500).json({error: error.message})

    const addresses = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      label: row.label,
      recipientName: row.recipient_name,
      phone: row.phone,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2 || null,
      city: row.city,
      district: row.district,
      postalCode: row.postal_code || null,
      country: row.country || 'Türkiye',
      isDefaultShipping: Boolean(row.is_default_shipping),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return res.status(200).json({success: true, addresses})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.post('/api/account/addresses', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const body = req.body || {}
    const isDefault = Boolean(body.isDefaultShipping ?? body.is_default_shipping)
    if (isDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({is_default_shipping: false, updated_at: new Date().toISOString()})
        .eq('user_id', req.userId)
        .eq('is_default_shipping', true)
    }

    const insertData = {
      user_id: req.userId,
      label: String(body.label || 'Teslimat Adresi').trim(),
      recipient_name: String(body.recipientName || body.recipient_name || 'Müşteri').trim(),
      phone: String(body.phone || '').trim(),
      address_line_1: String(body.addressLine1 || body.address_line_1 || '').trim(),
      address_line_2: (body.addressLine2 || body.address_line_2) ? String(body.addressLine2 || body.address_line_2).trim() : null,
      city: String(body.city || 'İstanbul').trim(),
      district: String(body.district || '').trim(),
      postal_code: (body.postalCode || body.postal_code) ? String(body.postalCode || body.postal_code).trim() : null,
      country: String(body.country || 'Türkiye').trim(),
      is_default_shipping: isDefault,
    }

    const {data, error} = await supabaseAdmin.from('customer_addresses').insert(insertData).select().single()
    if (error) return res.status(500).json({error: error.message})

    return res.status(201).json({
      success: true,
      address: {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        recipientName: data.recipient_name,
        phone: data.phone,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code,
        country: data.country,
        isDefaultShipping: Boolean(data.is_default_shipping),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.post('/api/account/addresses/:id/default', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const addressId = req.params.id
    await supabaseAdmin
      .from('customer_addresses')
      .update({is_default_shipping: false, updated_at: new Date().toISOString()})
      .eq('user_id', req.userId)

    const {data, error} = await supabaseAdmin
      .from('customer_addresses')
      .update({is_default_shipping: true, updated_at: new Date().toISOString()})
      .eq('id', addressId)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({
      success: true,
      address: {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        recipientName: data.recipient_name,
        phone: data.phone,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code,
        country: data.country,
        isDefaultShipping: true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

const handleAddressUpdate = async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const addressId = req.params.id
    const body = req.body || {}
    const updates = {updated_at: new Date().toISOString()}
    if (body.label !== undefined) updates.label = String(body.label).trim()
    if (body.recipientName !== undefined || body.recipient_name !== undefined) updates.recipient_name = String(body.recipientName || body.recipient_name).trim()
    if (body.phone !== undefined) updates.phone = String(body.phone).trim()
    if (body.addressLine1 !== undefined || body.address_line_1 !== undefined) updates.address_line_1 = String(body.addressLine1 || body.address_line_1).trim()
    if (body.addressLine2 !== undefined || body.address_line_2 !== undefined) updates.address_line_2 = (body.addressLine2 || body.address_line_2) ? String(body.addressLine2 || body.address_line_2).trim() : null
    if (body.city !== undefined) updates.city = String(body.city).trim()
    if (body.district !== undefined) updates.district = String(body.district).trim()
    if (body.postalCode !== undefined || body.postal_code !== undefined) updates.postal_code = (body.postalCode || body.postal_code) ? String(body.postalCode || body.postal_code).trim() : null
    if (body.country !== undefined) updates.country = String(body.country).trim()
    if (body.isDefaultShipping !== undefined || body.is_default_shipping !== undefined) {
      const isDef = Boolean(body.isDefaultShipping ?? body.is_default_shipping)
      updates.is_default_shipping = isDef
      if (isDef) {
        await supabaseAdmin
          .from('customer_addresses')
          .update({is_default_shipping: false, updated_at: new Date().toISOString()})
          .eq('user_id', req.userId)
          .neq('id', addressId)
      }
    }

    const {data, error} = await supabaseAdmin
      .from('customer_addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({
      success: true,
      address: {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        recipientName: data.recipient_name,
        phone: data.phone,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code,
        country: data.country,
        isDefaultShipping: Boolean(data.is_default_shipping),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
}
app.patch('/api/account/addresses/:id', requireLocalAuth, handleAddressUpdate)
app.put('/api/account/addresses/:id', requireLocalAuth, handleAddressUpdate)

app.delete('/api/account/addresses/:id', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const addressId = req.params.id
    const {error} = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', req.userId)

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({success: true, message: 'Adres silindi.'})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// 4. Billing Profiles
app.get('/api/account/billing-profiles', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const {data, error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .select('id, user_id, billing_type, label, full_name, company_name, tax_office, tax_number, address_line_1, address_line_2, city, district, postal_code, country, is_default, created_at, updated_at')
      .eq('user_id', req.userId)
      .order('is_default', {ascending: false})
      .order('created_at', {ascending: false})

    if (error) return res.status(500).json({error: error.message})

    const billingProfiles = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      billingType: row.billing_type,
      label: row.label,
      fullName: row.full_name || null,
      companyName: row.company_name || null,
      taxOffice: row.tax_office || null,
      taxNumber: row.tax_number || null,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2 || null,
      city: row.city,
      district: row.district,
      postalCode: row.postal_code || null,
      country: row.country || 'Türkiye',
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return res.status(200).json({success: true, billingProfiles})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.post('/api/account/billing-profiles', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const body = req.body || {}
    const isDefault = Boolean(body.isDefault ?? body.is_default)
    if (isDefault) {
      await supabaseAdmin
        .from('customer_billing_profiles')
        .update({is_default: false, updated_at: new Date().toISOString()})
        .eq('user_id', req.userId)
        .eq('is_default', true)
    }

    const billingType = body.billingType === 'company' ? 'company' : 'individual'
    const insertData = {
      user_id: req.userId,
      billing_type: billingType,
      label: String(body.label || (billingType === 'company' ? 'Kurumsal Fatura' : 'Bireysel Fatura')).trim(),
      full_name: billingType === 'individual' ? String(body.fullName || body.full_name || 'Müşteri').trim() : null,
      company_name: billingType === 'company' ? String(body.companyName || body.company_name || '').trim() : null,
      tax_office: billingType === 'company' ? String(body.taxOffice || body.tax_office || '').trim() : null,
      tax_number: (body.taxNumber || body.tax_number) ? String(body.taxNumber || body.tax_number).trim() : null,
      address_line_1: String(body.addressLine1 || body.address_line_1 || '').trim(),
      address_line_2: (body.addressLine2 || body.address_line_2) ? String(body.addressLine2 || body.address_line_2).trim() : null,
      city: String(body.city || 'İstanbul').trim(),
      district: String(body.district || '').trim(),
      postal_code: (body.postalCode || body.postal_code) ? String(body.postalCode || body.postal_code).trim() : null,
      country: String(body.country || 'Türkiye').trim(),
      is_default: isDefault,
    }

    const {data, error} = await supabaseAdmin.from('customer_billing_profiles').insert(insertData).select().single()
    if (error) return res.status(500).json({error: error.message})

    return res.status(201).json({
      success: true,
      billingProfile: {
        id: data.id,
        userId: data.user_id,
        billingType: data.billing_type,
        label: data.label,
        fullName: data.full_name,
        companyName: data.company_name,
        taxOffice: data.tax_office,
        taxNumber: data.tax_number,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code,
        country: data.country,
        isDefault: Boolean(data.is_default),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.post('/api/account/billing-profiles/:id/default', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const bpId = req.params.id
    await supabaseAdmin
      .from('customer_billing_profiles')
      .update({is_default: false, updated_at: new Date().toISOString()})
      .eq('user_id', req.userId)

    const {data, error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .update({is_default: true, updated_at: new Date().toISOString()})
      .eq('id', bpId)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({
      success: true,
      billingProfile: {
        id: data.id,
        userId: data.user_id,
        billingType: data.billing_type,
        label: data.label,
        fullName: data.full_name,
        companyName: data.company_name,
        taxOffice: data.tax_office,
        taxNumber: data.tax_number,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code,
        country: data.country,
        isDefault: true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

const handleBillingUpdate = async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const bpId = req.params.id
    const body = req.body || {}
    const updates = {updated_at: new Date().toISOString()}
    if (body.billingType !== undefined || body.billing_type !== undefined) updates.billing_type = body.billingType || body.billing_type
    if (body.label !== undefined) updates.label = String(body.label).trim()
    if (body.fullName !== undefined || body.full_name !== undefined) updates.full_name = (body.fullName || body.full_name) ? String(body.fullName || body.full_name).trim() : null
    if (body.companyName !== undefined || body.company_name !== undefined) updates.company_name = (body.companyName || body.company_name) ? String(body.companyName || body.company_name).trim() : null
    if (body.taxOffice !== undefined || body.tax_office !== undefined) updates.tax_office = (body.taxOffice || body.tax_office) ? String(body.taxOffice || body.tax_office).trim() : null
    if (body.taxNumber !== undefined || body.tax_number !== undefined) updates.tax_number = (body.taxNumber || body.tax_number) ? String(body.taxNumber || body.tax_number).trim() : null
    if (body.addressLine1 !== undefined || body.address_line_1 !== undefined) updates.address_line_1 = String(body.addressLine1 || body.address_line_1).trim()
    if (body.addressLine2 !== undefined || body.address_line_2 !== undefined) updates.address_line_2 = (body.addressLine2 || body.address_line_2) ? String(body.addressLine2 || body.address_line_2).trim() : null
    if (body.city !== undefined) updates.city = String(body.city).trim()
    if (body.district !== undefined) updates.district = String(body.district).trim()
    if (body.postalCode !== undefined || body.postal_code !== undefined) updates.postal_code = (body.postalCode || body.postal_code) ? String(body.postalCode || body.postal_code).trim() : null
    if (body.country !== undefined) updates.country = String(body.country).trim()
    if (body.isDefault !== undefined || body.is_default !== undefined) {
      const isDef = Boolean(body.isDefault ?? body.is_default)
      updates.is_default = isDef
      if (isDef) {
        await supabaseAdmin
          .from('customer_billing_profiles')
          .update({is_default: false, updated_at: new Date().toISOString()})
          .eq('user_id', req.userId)
          .neq('id', bpId)
      }
    }

    const {data, error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .update(updates)
      .eq('id', bpId)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({
      success: true,
      billingProfile: {
        id: data.id,
        userId: data.user_id,
        billingType: data.billing_type,
        label: data.label,
        fullName: data.full_name,
        companyName: data.company_name,
        taxOffice: data.tax_office,
        taxNumber: data.tax_number,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        district: data.district,
        postalCode: data.postal_code,
        country: data.country,
        isDefault: Boolean(data.is_default),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
}
app.patch('/api/account/billing-profiles/:id', requireLocalAuth, handleBillingUpdate)
app.put('/api/account/billing-profiles/:id', requireLocalAuth, handleBillingUpdate)

app.delete('/api/account/billing-profiles/:id', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const bpId = req.params.id
    const {error} = await supabaseAdmin
      .from('customer_billing_profiles')
      .delete()
      .eq('id', bpId)
      .eq('user_id', req.userId)

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({success: true, message: 'Fatura profili silindi.'})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// 5. Orders
app.get('/api/account/orders', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const {data, error} = await supabaseAdmin
      .from('commerce_orders')
      .select('id, order_number, status, payment_status, currency, grand_total, created_at, items_count, first_item_name_snapshot, first_item_sku_snapshot')
      .eq('user_id', req.userId)
      .order('created_at', {ascending: false})

    if (error) {
      if (error.code === '42P01') {
        return res.status(200).json({success: true, orders: []})
      }
      return res.status(500).json({error: error.message})
    }

    const orders = (data || []).map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      currency: row.currency,
      grandTotal: row.grand_total,
      createdAt: row.created_at,
      itemCount: row.items_count || 1,
      firstItemNameSnapshot: row.first_item_name_snapshot,
      firstItemSkuSnapshot: row.first_item_sku_snapshot,
    }))

    return res.status(200).json({success: true, orders})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.get('/api/account/orders/:id', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const orderId = req.params.id
    const {data: order, error} = await supabaseAdmin
      .from('commerce_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', req.userId)
      .maybeSingle()

    if (error) return res.status(500).json({error: error.message})
    if (!order) return res.status(404).json({error: 'Sipariş bulunamadı.'})

    const {data: items} = await supabaseAdmin
      .from('commerce_order_items')
      .select('*')
      .eq('order_id', orderId)

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        currency: order.currency,
        subtotal: order.subtotal,
        taxTotal: order.tax_total,
        grandTotal: order.grand_total,
        createdAt: order.created_at,
        shippingAddressSnapshot: order.shipping_address_snapshot,
        billingAddressSnapshot: order.billing_address_snapshot,
        corporateBillingSnapshot: order.corporate_billing_snapshot,
        items: (items || []).map(it => ({
          id: it.id,
          productName: it.product_name_snapshot || it.product_name,
          sku: it.sku_snapshot || it.sku,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          totalPrice: it.total_price,
        })),
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// ─── /api/account/selections ──────────────────────────────────────────────────
app.get('/api/account/selections', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(200).json({success: true, productIds: []})
  try {
    const {data, error} = await supabaseAdmin
      .from('user_selections')
      .select('product_id')
      .eq('user_id', req.userId)

    if (error) return res.status(200).json({success: true, productIds: []})
    const productIds = (data || []).map(r => r.product_id)
    return res.status(200).json({success: true, productIds})
  } catch {
    return res.status(200).json({success: true, productIds: []})
  }
})

app.post('/api/account/selections', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(200).json({success: true})
  try {
    const productId = req.body?.productId
    if (!productId) return res.status(400).json({error: 'Ürün ID gereklidir.'})

    const {error} = await supabaseAdmin
      .from('user_selections')
      .insert({user_id: req.userId, product_id: productId})

    if (error && error.code !== '23505') {
      if (
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('does not exist')
      ) {
        return res.status(200).json({success: true})
      }
      return res.status(500).json({error: error.message})
    }
    return res.status(200).json({success: true})
  } catch {
    return res.status(200).json({success: true})
  }
})

app.post('/api/account/selections/sync', requireLocalAuth, async (req, res) => {
  const clientIds = Array.isArray(req.body?.productIds) ? req.body.productIds : []
  if (!supabaseAdmin) {
    return res.status(200).json({success: true, productIds: clientIds})
  }
  try {
    const {data: existing, error: fetchErr} = await supabaseAdmin
      .from('user_selections')
      .select('product_id')
      .eq('user_id', req.userId)

    if (fetchErr) {
      return res.status(200).json({success: true, productIds: clientIds})
    }

    const serverIds = (existing || []).map(r => r.product_id)
    const merged = Array.from(new Set([...serverIds, ...clientIds]))
    const newItems = merged.filter(id => !serverIds.includes(id))

    if (newItems.length > 0) {
      await supabaseAdmin
        .from('user_selections')
        .insert(newItems.map(pid => ({user_id: req.userId, product_id: pid})))
        .catch(() => {})
    }

    return res.status(200).json({success: true, productIds: merged})
  } catch {
    return res.status(200).json({success: true, productIds: clientIds})
  }
})

app.delete('/api/account/selections/:productId', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(200).json({success: true})
  try {
    const productId = req.params.productId
    await supabaseAdmin
      .from('user_selections')
      .delete()
      .eq('user_id', req.userId)
      .eq('product_id', productId)

    return res.status(200).json({success: true})
  } catch {
    return res.status(200).json({success: true})
  }
})

// ─── /api/account/projects ────────────────────────────────────────────────────
app.get('/api/account/projects/share/:token', async (req, res) => {
  if (!supabaseAdmin) return res.status(404).json({error: 'Proje bulunamadı.'})
  try {
    const {data: project, error: pErr} = await supabaseAdmin
      .from('projects')
      .select('id, user_id, name, description, share_token, is_public, created_at, updated_at')
      .eq('share_token', req.params.token)
      .single()

    if (pErr || !project) return res.status(404).json({error: 'Proje bulunamadı.'})

    const {data: prodData} = await supabaseAdmin
      .from('project_products')
      .select('product_id')
      .eq('project_id', project.id)

    return res.status(200).json({
      success: true,
      project: {
        id: project.id,
        userId: project.user_id,
        name: project.name,
        description: project.description || '',
        shareToken: project.share_token,
        isPublic: Boolean(project.is_public),
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        productIds: (prodData || []).map(r => r.product_id),
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.get('/api/account/projects', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(200).json({success: true, projects: []})
  try {
    const {data: projectsData, error: pErr} = await supabaseAdmin
      .from('projects')
      .select('id, user_id, name, description, share_token, is_public, created_at, updated_at')
      .eq('user_id', req.userId)
      .order('created_at', {ascending: false})

    if (pErr || !projectsData || projectsData.length === 0) {
      return res.status(200).json({success: true, projects: []})
    }

    const projectIds = projectsData.map(p => p.id)
    const {data: prodData} = await supabaseAdmin
      .from('project_products')
      .select('project_id, product_id')
      .in('project_id', projectIds)

    const map = new Map()
    if (prodData) {
      for (const row of prodData) {
        const list = map.get(row.project_id) || []
        list.push(row.product_id)
        map.set(row.project_id, list)
      }
    }

    const projects = projectsData.map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      description: p.description || '',
      shareToken: p.share_token,
      isPublic: Boolean(p.is_public),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      productIds: map.get(p.id) || [],
    }))

    return res.status(200).json({success: true, projects})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.post('/api/account/projects', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const {name, description = '', productIds = [], isPublic = false} = req.body || {}
    if (!name || !name.trim()) {
      return res.status(400).json({error: 'Proje adı gereklidir.'})
    }

    const shareToken = 'prj_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    const {data, error} = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: req.userId,
        name: name.trim(),
        description: description.trim(),
        is_public: Boolean(isPublic),
        share_token: shareToken,
      })
      .select()
      .single()

    if (error || !data) {
      return res.status(500).json({error: error?.message || 'Proje oluşturulamadı.'})
    }

    const safePids = Array.isArray(productIds) ? productIds.filter(Boolean) : []
    if (safePids.length > 0) {
      await supabaseAdmin.from('project_products').insert(
        safePids.map(pid => ({
          project_id: data.id,
          product_id: pid,
        }))
      )
    }

    return res.status(201).json({
      success: true,
      project: {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || '',
        shareToken: data.share_token,
        isPublic: Boolean(data.is_public),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        productIds: safePids,
      },
    })
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.patch('/api/account/projects/:id', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const projectId = req.params.id
    const {name, description, isPublic, shareToken, productIds} = req.body || {}
    const fieldsToUpdate = {updated_at: new Date().toISOString()}
    if (name !== undefined) fieldsToUpdate.name = String(name).trim()
    if (description !== undefined) fieldsToUpdate.description = String(description || '')
    if (isPublic !== undefined) fieldsToUpdate.is_public = Boolean(isPublic)
    if (shareToken !== undefined) fieldsToUpdate.share_token = shareToken

    const {error} = await supabaseAdmin
      .from('projects')
      .update(fieldsToUpdate)
      .eq('id', projectId)
      .eq('user_id', req.userId)

    if (error) return res.status(500).json({error: error.message})

    if (productIds !== undefined) {
      await supabaseAdmin.from('project_products').delete().eq('project_id', projectId)
      const safePids = Array.isArray(productIds) ? productIds.filter(Boolean) : []
      if (safePids.length > 0) {
        await supabaseAdmin.from('project_products').insert(
          safePids.map(pid => ({
            project_id: projectId,
            product_id: pid,
          }))
        )
      }
    }

    return res.status(200).json({success: true})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

app.delete('/api/account/projects/:id', requireLocalAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({error: 'Veritabanı servisi kullanılamıyor.'})
  try {
    const projectId = req.params.id
    await supabaseAdmin.from('project_products').delete().eq('project_id', projectId)
    const {error} = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', req.userId)

    if (error) return res.status(500).json({error: error.message})
    return res.status(200).json({success: true})
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
})

// ─── /api/inquiry ──────────────────────────────────────────────────────────
const handleInquiry = async (req, res) => {
  const {
    name,
    company,
    email,
    phone,
    projectName,
    message,
    selectedProducts = [],
    userId,
  } = req.body || {}

  if (!name || !email) {
    return res.status(400).json({error: 'Ad ve e-posta zorunludur.'})
  }

  const safeEmail = String(email).trim().toLowerCase().slice(0, 150)
  const safeName = String(name).trim().slice(0, 100)
  const safeCompany = company ? String(company).trim().slice(0, 150) : null
  const safePhone = phone ? String(phone).trim().slice(0, 50) : null
  const safeProjectName = projectName ? String(projectName).trim().slice(0, 150) : null
  const safeMessage = message ? String(message).trim().slice(0, 3000) : null

  // 1. Save to Supabase inquiries table if exists
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('inquiries').insert({
        user_id: userId || null,
        name: safeName,
        company: safeCompany,
        email: safeEmail,
        phone: safePhone,
        project_name: safeProjectName,
        message: safeMessage,
        selected_products: Array.isArray(selectedProducts) ? selectedProducts : [],
        status: 'new',
      })
    } catch (dbErr) {
      console.warn('[Local API] Supabase persistence error:', dbErr?.message || dbErr)
    }
  }

  // 2. Format products list for Email
  const productsListHtml =
    Array.isArray(selectedProducts) && selectedProducts.length > 0
      ? selectedProducts
          .map((p, idx) => {
            const pName = p.name || p.id || 'Ürün'
            const pCategory = p.category ? String(p.category) : ''
            const pDim = p.dimensions && p.dimensions !== '-' ? String(p.dimensions) : ''
            const safeUrlId = encodeURIComponent(String(p.id || '').trim())
            const rawImg = (p.image || '').trim()
            const safeImgUrl =
              rawImg && rawImg !== '/' && !rawImg.endsWith('birim.com/')
                ? rawImg.startsWith('http://') || rawImg.startsWith('https://')
                  ? rawImg
                  : `https://birim.com${rawImg.startsWith('/') ? '' : '/'}${rawImg}`
                : ''

            const imgHtml = safeImgUrl
              ? `<img src="${safeImgUrl}" alt="${pName}" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />`
              : `<div style="width: 56px; height: 56px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; line-height: 56px; font-size: 20px; color: #94a3b8;">🛋️</div>`

            const isLast = idx === selectedProducts.length - 1
            const borderStyle = isLast ? '' : 'border-bottom: 1px solid #f1f5f9;'

            return `
            <tr style="${borderStyle}">
              <td style="padding: 12px 12px 12px 14px; width: 56px; vertical-align: middle;">
                ${imgHtml}
              </td>
              <td style="padding: 12px 12px; vertical-align: middle;">
                <a href="https://birim.com/product/${safeUrlId}" style="color: #09090b; font-weight: 600; font-size: 14px; text-decoration: none; display: block; line-height: 1.4;">
                  ${pName}
                </a>
                ${
                  pCategory
                    ? `<span style="display: inline-block; font-size: 11px; color: #71717a; margin-top: 3px;">${pCategory}</span>`
                    : ''
                }
                ${
                  pDim
                    ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Ölçü: ${pDim}</div>`
                    : ''
                }
              </td>
              <td style="padding: 12px 14px 12px 8px; text-align: right; vertical-align: middle; white-space: nowrap;">
                <a href="https://birim.com/product/${safeUrlId}" style="font-size: 11px; font-weight: 600; color: #09090b; text-decoration: none; background-color: #f4f4f5; padding: 6px 12px; border-radius: 6px; display: inline-block; border: 1px solid #e4e4e7;">
                  İncele &rarr;
                </a>
              </td>
            </tr>
          `
          })
          .join('')
      : `<tr><td colspan="3" style="padding: 24px; text-align: center; color: #a1a1aa; font-style: italic; font-size: 13px;">Ürün seçilmedi</td></tr>`

  const dateStr = new Date().toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const emailHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Birim Teklif Talebi</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 24px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 700; letter-spacing: 5px; color: #ffffff; text-transform: uppercase;">B İ R İ M</div>
                    <div style="font-size: 10px; letter-spacing: 1.5px; color: #a1a1aa; text-transform: uppercase; margin-top: 4px;">MİMARİ &amp; MOBİLYA ÇÖZÜMLERİ</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.12); color: #f4f4f5; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.18);">
                      Teklif Talebi
                    </span>
                    <div style="font-size: 10px; color: #71717a; margin-top: 4px;">${dateStr}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 32px;">
              
              <!-- Customer & Project Info Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;" colspan="2">
                          Müşteri ve Proje Bilgileri
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a; width: 110px;">Proje:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #09090b;">
                          <span style="background-color: #f4f4f5; padding: 2px 8px; border-radius: 4px; border: 1px solid #e4e4e7;">${safeProjectName || 'Genel Seçtiklerim'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Müşteri:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #09090b;">${safeName}</td>
                      </tr>
                      ${
                        safeCompany
                          ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Firma / Ofis:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #18181b;">${safeCompany}</td>
                      </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">E-posta:</td>
                        <td style="padding: 6px 0; font-size: 13px;">
                          <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${safeEmail}</a>
                        </td>
                      </tr>
                      ${
                        safePhone
                          ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Telefon:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #18181b;">
                          <a href="tel:${safePhone}" style="color: #18181b; text-decoration: none;">${safePhone}</a>
                        </td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer Note (Optional) -->
              ${
                safeMessage
                  ? `
              <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 8px;">
                  Müşteri Notu
                </div>
                <div style="background-color: #fafafa; border-left: 3px solid #18181b; border-radius: 4px; padding: 14px 18px; font-size: 13px; color: #334155; line-height: 1.6; border: 1px solid #f1f5f9; border-left: 3px solid #18181b;">
                  ${safeMessage}
                </div>
              </div>`
                  : ''
              }

              <!-- Selected Products Section -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 12px;">
                  Seçilen Ürünler (${Array.isArray(selectedProducts) ? selectedProducts.length : 0} Adet)
                </div>

                <!-- Products Table -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; overflow: hidden; background-color: #ffffff;">
                  <tbody>
                    ${productsListHtml}
                  </tbody>
                </table>
              </div>

              <!-- Action CTA -->
              <div style="text-align: center; margin: 28px 0 8px 0;">
                <a href="mailto:${safeEmail}?subject=${encodeURIComponent(`Re: Birim Teklif Talebi - ${safeProjectName || 'Seçkim'}`)}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; letter-spacing: 0.3px;">
                  Müşteriye E-posta ile Yanıt Ver &rarr;
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 18px 32px; text-align: center; font-size: 11px; color: #9ca3af; line-height: 1.5;">
              Bu e-posta <a href="https://birim.com" style="color: #6b7280; text-decoration: none; font-weight: 600;">birim.com</a> Seçkim &amp; Proje sistemi üzerinden otomatik olarak gönderilmiştir.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  console.log(`\n========================================`)
  console.log(`📩 [YENİ TEKLİF TALEBİ]`)
  console.log(`   Müşteri: ${safeName} (${safeEmail})`)
  console.log(`   Firma: ${safeCompany || '-'}`)
  console.log(`   Telefon: ${safePhone || '-'}`)
  console.log(`   Proje: ${safeProjectName || 'Genel Seçtiklerim'}`)
  console.log(`   Ürün Sayısı: ${selectedProducts.length}`)
  console.log(`========================================\n`)

  // 3. Send Email Notification
  const adminEmail = process.env.ADMIN_EMAIL || 'birim@birim.com'
  const subject = `Yeni Proje Talebi: ${safeName} - ${safeProjectName || 'Birim Seçtiklerim'}`

  if (resendClient) {
    try {
      await resendClient.emails.send({
        from: getEmailFrom(),
        to: [adminEmail],
        replyTo: safeEmail,
        subject,
        html: emailHtml,
      })
      console.log(`✅ [Local API] Resend ile teklif bildirimi gönderildi -> ${adminEmail}`)
    } catch (rErr) {
      console.warn(`⚠️ [Local API] Resend teklif gönderim hatası (${rErr.message}), SMTP deneniyor...`)
    }
  }

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"Birim Design" <${SMTP_USER}>`,
        to: adminEmail,
        replyTo: safeEmail,
        subject,
        html: emailHtml,
      })
      console.log(`✅ [Local API] SMTP ile teklif bildirimi gönderildi -> ${adminEmail}`)
    } catch (err) {
      console.warn(`⚠️ [Local API] SMTP teklif e-posta gönderimi başarısız (${err.message})`)
    }
  }

  return res.status(200).json({ok: true, message: 'Inquiry received'})
}

app.post('/api/inquiry', handleInquiry)
app.post('/api/account/inquiry', handleInquiry)

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({error: `Route not found: ${req.method} ${req.path}`})
})

const PORT = 3002
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  Local API Server çalışıyor → http://localhost:${PORT}`)
  const tokenDisplay = SANITY_TOKEN
    ? `${SANITY_TOKEN.slice(0, 4)}...${SANITY_TOKEN.slice(-4)}`
    : 'YOK'
  console.log(
    `   SANITY_TOKEN: ${SANITY_TOKEN ? `✓ (${tokenDisplay})` : "✗ YOK! (.env.local'e SANITY_TOKEN ekle)"}`
  )
  console.log(
    `   E-POSTA: ${resendClient ? '✓ Resend API hazır' : mailTransporter ? '✓ SMTP hazır' : '⚠️ Simülasyon modu (RESEND_API_KEY veya SMTP yok)'}`
  )
  console.log(`   Proje: ${SANITY_PROJECT_ID} / ${SANITY_DATASET}\n`)
})
