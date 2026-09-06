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
}

loadEnvVars()

// sanity client ve bcrypt'i dynamic import ile yükle
const {createClient} = await import('@sanity/client')
const bcrypt = (await import('bcryptjs')).default
const nodemailer = (await import('nodemailer')).default

// SMTP Mail Transporter
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
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
      origin.endsWith('.vercel.app'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Startup Test: Sanity Bağlantısını Kontrol Et
async function testSanity() {
  try {
    const userCount = await sanityClient.fetch('count(*[_type == "user"])')
    console.log(`✅ Sanity bağlantısı başarılı. Veritabanında ${userCount} kullanıcı var.`)
  } catch (err) {
    console.error('❌ Sanity bağlantı veya yetki hatası!!')
    console.error(`   Hata: ${err.message}`)
    console.error(`   Project ID: ${SANITY_PROJECT_ID}, Dataset: ${SANITY_DATASET}`)
    if (err.message.includes('401') || err.message.includes('403')) {
      console.error('   UYARI: Token yetkisi yetersiz veya Project ID/Token uyumsuz.')
    }
  }
}
testSanity()

// ─── /api/auth/login ───────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const {email, password} = req.body
  if (!email || !password) return res.status(400).json({error: 'Email ve şifre gereklidir.'})

  const normEmail = email.trim().toLowerCase()
  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )
    if (!user) return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})
    if (user.userType === 'email_subscriber')
      return res.status(403).json({error: 'Bu sadece abonelik kaydı, lütfen tam üyelik alın.'})
    if (!user.isActive) return res.status(403).json({error: 'Hesabınız aktif değil.'})

    const isPasswordCorrect = await bcrypt.compare(password, user.password || '')
    if (!isPasswordCorrect)
      return res.status(401).json({error: 'E-posta adresi veya şifre hatalı.'})

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        profession: user.profession,
        country: user.country,
        userType: user.userType,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt || user._createdAt,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res
      .status(500)
      .json({error: `Giriş hatası: ${err.message || 'Teknik bir hata oluştu.'}`})
  }
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

  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && _id == $id && !defined(_deleted)][0]`,
      {id: token}
    )

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
  } catch (err) {
    console.error('Me endpoint error:', err)
    return res.status(500).json({authenticated: false, error: 'Sunucu hatası.'})
  }
})

// ─── /api/auth/register ───────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
  const {email, password, name, company, profession, country} = req.body
  if (!email || !password) return res.status(400).json({error: 'Email ve şifre gereklidir.'})

  const normEmail = email.trim().toLowerCase()
  try {
    const existingUser = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )
    if (existingUser) {
      if (existingUser.userType === 'email_subscriber') {
        const passwordHash = await bcrypt.hash(password, 10)
        const updatedUser = await sanityClient
          .patch(existingUser._id)
          .set({
            password: passwordHash,
            name: name || '',
            company: company || '',
            profession: profession || '',
            country: country || existingUser.country || '',
            userType: 'full_member',
            isVerified: false,
            verificationToken: randomUUID(),
          })
          .commit()
        return res.status(200).json({
          success: true,
          message: 'Abonelik hesabınız tam üyeliğe yükseltildi.',
          user: {id: updatedUser._id, email: updatedUser.email, userType: 'full_member'},
        })
      }
      return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationToken = randomUUID()
    const newUser = await sanityClient.create({
      _type: 'user',
      email: normEmail,
      password: passwordHash,
      name: name || '',
      company: company || '',
      profession: profession || '',
      country: country || '',
      userType: 'full_member',
      isActive: true,
      isVerified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
    })
    return res.status(201).json({
      success: true,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        verificationToken: newUser.verificationToken,
      },
    })
  } catch (err) {
    return res
      .status(500)
      .json({error: `Hata: ${err.message || 'Kayıt sırasında bir hata oluştu.'}`})
  }
})

// ─── /api/auth/verify ─────────────────────────────────────────────────────
app.post('/api/auth/verify', async (req, res) => {
  const {token} = req.body
  if (!token) return res.status(400).json({error: "Doğrulama token'ı gereklidir."})
  try {
    const user = await sanityClient.fetch(`*[_type == "user" && verificationToken == $token][0]`, {
      token,
    })
    if (!user) return res.status(400).json({error: 'Geçersiz veya süresi dolmuş token.'})

    const updatedUser = await sanityClient
      .patch(user._id)
      .set({isVerified: true, isActive: true})
      .unset(['verificationToken'])
      .commit()

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
  } catch (err) {
    console.error('Verification error:', err)
    return res.status(500).json({error: `Doğrulama hatası: ${err.message || 'Bir hata oluştu.'}`})
  }
})

// ─── /api/auth/subscribe ──────────────────────────────────────────────────
app.post('/api/auth/subscribe', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
  const {email} = req.body
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  const normEmail = email.trim().toLowerCase()
  try {
    const existing = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )
    if (existing) return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
    const newUser = await sanityClient.create({
      _type: 'user',
      email: normEmail,
      name: '',
      company: '',
      profession: '',
      userType: 'email_subscriber',
      isActive: true,
      createdAt: new Date().toISOString(),
    })
    return res.status(201).json({success: true, user: newUser})
  } catch (err) {
    console.error('Subscribe error:', err)
    return res
      .status(500)
      .json({
        error: `Abonelik hatası: ${err.message || 'İşlem sırasında bir hata oluştu.'}`,
        details: err.toString(),
      })
  }
})

// ─── /api/auth/subscribe-prof ─────────────────────────────────────────────
app.post('/api/auth/subscribe-prof', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
  const {email, password, name, company, profession, country, phone} = req.body
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})

  const normEmail = email.trim().toLowerCase()
  try {
    const existing = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )

    let passwordHash = null
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    if (existing) {
      if (existing.userType === 'email_subscriber') {
        // E-posta aboneliğinden profesyonel aboneliğe yükselt
        const verificationToken = randomUUID()
        const patchData = {
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
          patchData.password = passwordHash
        }

        await sanityClient.patch(existing._id).set(patchData).commit()

        return res.status(200).json({
          success: true,
          message:
            'Başvurunuz alındı. Lütfen e-posta adresinize gönderilen onay mailini kontrol edin.',
          verificationToken,
          email: normEmail,
        })
      }
      if (existing.userType === 'professional_subscriber' && !existing.isVerified) {
        return res
          .status(400)
          .json({
            error:
              'Bu e-posta adresi zaten kayıtlı ve onay bekliyor. Lütfen e-postanızı kontrol edin.',
          })
      }
      return res
        .status(400)
        .json({error: 'Bu e-posta adresi ile zaten kayıtlı profesyonel hesabınız var.'})
    }

    const verificationToken = randomUUID()

    // Profesyonel başvurucu: isActive=false, onay mailinden sonra aktif olacak
    const newUserObj = {
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
      newUserObj.password = passwordHash
    }

    const newUser = await sanityClient.create(newUserObj)

    return res.status(201).json({
      success: true,
      message: 'Başvurunuz alındı. Lütfen e-posta adresinize gönderilen onay mailini kontrol edin.',
      verificationToken,
      email: normEmail,
    })
  } catch (err) {
    console.error('Subscribe Prof error:', err)
    return res
      .status(500)
      .json({error: `Başvuru hatası: ${err.message || 'İşlem sırasında bir hata oluştu.'}`})
  }
})

// ─── /api/auth/reset-request ──────────────────────────────────────────────
app.post('/api/auth/reset-request', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({error: 'SANITY_TOKEN yapılandırılmamış.'})
  const {email} = req.body
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  const normEmail = email.trim().toLowerCase()
  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )
    if (!user) return res.status(404).json({error: 'Kullanıcı bulunamadı.'})
    const resetToken = randomUUID()
    const resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await sanityClient
      .patch(user._id)
      .set({resetPasswordToken: resetToken, resetPasswordExpires})
      .commit()
    return res
      .status(200)
      .json({success: true, resetToken, message: 'Şifre sıfırlama kodu oluşturuldu.'})
  } catch (err) {
    console.error('Reset request error:', err)
    return res
      .status(500)
      .json({
        error: `Hata: ${err.message || 'Süreç sırasında bir hata oluştu.'}`,
        details: err.toString(),
      })
  }
})

// ─── /api/auth/reset-password ─────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  const {token, newPassword} = req.body
  if (!token || !newPassword)
    return res.status(400).json({error: 'Token ve yeni şifre gereklidir.'})
  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && resetPasswordToken == $token && resetPasswordExpires > $now][0]`,
      {token, now: new Date().toISOString()}
    )
    if (!user) return res.status(400).json({error: 'Geçersiz veya süresi dolmuş token.'})
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await sanityClient
      .patch(user._id)
      .set({password: passwordHash})
      .unset(['resetPasswordToken', 'resetPasswordExpires'])
      .commit()
    return res.status(200).json({success: true, message: 'Şifreniz başarıyla değiştirildi.'})
  } catch (err) {
    console.error('Reset password error:', err)
    return res
      .status(500)
      .json({error: `Şifre değiştirme hatası: ${err.message || 'Bir hata oluştu.'}`})
  }
})

// ─── /api/auth/delete-account ─────────────────────────────────────────────
app.post('/api/auth/delete-account', async (req, res) => {
  const {id} = req.body
  if (!id) return res.status(400).json({error: 'Kullanıcı ID gereklidir.'})
  try {
    await sanityClient.delete(id)
    return res.status(200).json({success: true})
  } catch (err) {
    console.error('Delete account error:', err)
    return res.status(500).json({error: 'Hesap silinirken bir hata oluştu.'})
  }
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
app.get('/api/analytics', async (req, res) => {
  try {
    const {startDate = '30daysAgo', endDate = 'today', type = 'all'} = req.query
    // Dynamic import to support analytics module
    const {getAllAnalyticsData, getRealtimeData} = await import('../api/analytics.ts')

    if (type === 'realtime') {
      const realtime = await getRealtimeData()
      return res.status(200).json({success: true, data: {realtime}})
    }

    const data = await getAllAnalyticsData(String(startDate), String(endDate))
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
    `   SMTP: ${mailTransporter ? '✓ Mail gönderimine hazır' : '✗ SMTP_PASSWORD yok (simülasyon modu)'}`
  )
  console.log(`   Proje: ${SANITY_PROJECT_ID} / ${SANITY_DATASET}\n`)
})
