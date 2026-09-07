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
import crypto from 'crypto'
import {randomUUID} from 'crypto'

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
if (SMTP_PASSWORD) {
  mailTransporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
      user: 'birimdesign@birim.com',
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
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 14px 34px; border-radius: 6px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);">
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

        const displayName =
          profile?.name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          authUser.email?.split('@')[0] ||
          'Kullanıcı'

        return res.status(200).json({
          success: true,
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
  const authHeader = req.headers['authorization']
  const token =
    authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : null

  if (!token) {
    return res.status(200).json({authenticated: false, user: null})
  }

  // 1. Supabase Profile check
  if (supabaseAdmin) {
    try {
      const {data: profile} = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', token)
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

  if (supabaseAdmin) {
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
          await supabaseAdmin.auth.admin.updateUserById(profile.id, {
            email_confirm: true,
            user_metadata: {email_verified: true},
          }).catch(() => {})
        }

        const {data: usersList} = await supabaseAdmin.auth.admin.listUsers()
        const authUser = usersList?.users?.find(u => u.email?.toLowerCase() === targetEmail)
        if (authUser && authUser.id !== profile?.id) {
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            email_confirm: true,
            user_metadata: {...authUser.user_metadata, email_verified: true},
          }).catch(() => {})
        }

      }

      return res.status(200).json({
        success: true,
        message: 'E-posta adresiniz başarıyla doğrulandı.',
        user: profile
          ? {
              _id: profile.id,
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              company: profile.company,
              profession: profile.profession,
              architectVerificationStatus: profile.architect_verification_status,
              isVerified: true,
            }
          : undefined,
      })
    } catch (err) {
      console.error('[Local API] Supabase verify error:', err)
    }
  }

  if (!token && !email) return res.status(400).json({error: "Doğrulama token'ı gereklidir."})
  return res.status(200).json({
    success: true,
    message: 'E-posta adresiniz başarıyla doğrulandı.',
  })
})

// ─── Ortak Mimar / Özel Erişim Kayıt Fonksiyonu ───────────────────────────
async function handleSubscribeProfLogic(req, res) {
  const {email, password, name, company, profession, phone, country} = req.body || {}
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  const normEmail = email.trim().toLowerCase()
  const siteUrl = process.env.VITE_SITE_URL || 'http://localhost:3000'
  const verificationToken = randomUUID()
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
      from: '"Birim Design" <birimdesign@birim.com>',
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
      from: '"Birim Design" <birimdesign@birim.com>',
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

// ─── /api/media/presigned-url ──────────────────────────────────────────────
app.post('/api/media/presigned-url', async (req, res) => {
  const {filename, contentType, folder} = req.body || {}
  if (!filename || !contentType) {
    return res.status(400).json({error: 'filename ve contentType parametreleri gereklidir.'})
  }

  try {
    const {S3Client, PutObjectCommand} = await import('@aws-sdk/client-s3')
    const {getSignedUrl} = await import('@aws-sdk/s3-request-presigner')

    const originDomain = process.env.VITE_R2_ORIGIN_DOMAIN || ''
    const hashMatch = originDomain.match(/pub-([a-f0-9]+)\.r2\.dev/)
    const defaultAccountId = hashMatch ? hashMatch[1] : '114e37dc2d51e58147e027097a68470b'

    const R2_ACCOUNT_ID =
      process.env.R2_ACCOUNT_ID ||
      process.env.SANITY_STUDIO_R2_ACCOUNT_ID ||
      process.env.VITE_R2_ACCOUNT_ID ||
      defaultAccountId
    const R2_ACCESS_KEY_ID =
      process.env.R2_ACCESS_KEY_ID ||
      process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID ||
      process.env.VITE_R2_ACCESS_KEY_ID
    const R2_SECRET_ACCESS_KEY =
      process.env.R2_SECRET_ACCESS_KEY ||
      process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY ||
      process.env.VITE_R2_SECRET_ACCESS_KEY
    const R2_BUCKET_NAME =
      process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web'
    const R2_DOMAIN =
      process.env.R2_DOMAIN ||
      process.env.SANITY_STUDIO_R2_DOMAIN ||
      process.env.VITE_R2_DOMAIN ||
      'https://assets.birim.com'

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({
        error:
          'Cloudflare R2 erişim anahtarları (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) .env.local dosyasında tanımlı değil.',
      })
    }

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    const key = folder ? `${folder}/${filename}` : `uploads/${filename}`
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(r2Client, command, {expiresIn: 900})
    const r2Domain = R2_DOMAIN?.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`
    const finalFileUrl = `${r2Domain}/${key}`

    return res.status(200).json({
      success: true,
      uploadUrl: url,
      fileUrl: finalFileUrl,
      key: key,
    })
  } catch (error) {
    console.error('Presigned URL error:', error)
    return res.status(500).json({error: `Presigned URL oluşturulamadı: ${error.message}`})
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
    limit: 15,
  })
  await sleep(60)

  // 7. Cities
  const cityRes = await runGaReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'city'}],
    metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
    orderBys: [{metric: {metricName: 'activeUsers'}, desc: true}],
    limit: 15,
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

  const cityData = (cityRes.rows || [])
    .filter(r => r.dimensionValues?.[0]?.value !== '(not set)')
    .map(r => ({
      city: r.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
      sessions: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
    }))

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
    'birim2026'
  ).trim()
  const rawProvidedPin = req.headers['x-analytics-pin']
  const providedPin = typeof rawProvidedPin === 'string' ? rawProvidedPin.trim() : ''

  const isPinValid = Boolean(
    providedPin &&
      providedPin.length === expectedPin.length &&
      crypto.timingSafeEqual(Buffer.from(providedPin), Buffer.from(expectedPin))
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

    const data = await getLocalAllAnalyticsData(String(startDate), String(endDate))
    return res.status(200).json({success: true, data})
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
    const key = safeFolder.endsWith('/')
      ? `${safeFolder}${cleanFileName}`
      : `${safeFolder}/${cleanFileName}`

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
