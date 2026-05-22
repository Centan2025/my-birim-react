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
import { createRequire } from 'module'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local ve .env dosyalarından SANITY_TOKEN'ı yükle
function loadEnvVars() {
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const envPath = resolve(__dirname, '..', file)
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx === -1) continue
        const key = trimmed.slice(0, eqIdx).trim()
        const val = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, '')

        // Boş değilse veya önceden hiç set edilmemişse set et (boş olanı dolu olanla ez)
        if (val && (!process.env[key] || process.env[key] === '')) {
          process.env[key] = val
        } else if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
  // VITE_ prefixli değerleri hem prefix'li hem prefix'siz olarak set et
  // (API fonksiyonları process.env.VITE_SANITY_TOKEN de okuyabilir)
  if (!process.env.SANITY_TOKEN && process.env.VITE_SANITY_TOKEN) {
    process.env.SANITY_TOKEN = process.env.VITE_SANITY_TOKEN
  }
}

loadEnvVars()

// sanity client ve bcrypt'i dynamic import ile yükle
const { createClient } = await import('@sanity/client')
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
      user: 'birim@birim.com',
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
app.use(express.json())

// CORS - sadece local Vite dev server'dan gelen isteklere izin ver
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
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
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email ve şifre gereklidir.' })

  const normEmail = email.trim().toLowerCase()
  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      { email: normEmail }
    )
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı veya hatalı bilgiler.' })
    if (user.userType === 'email_subscriber')
      return res.status(403).json({ error: 'Bu sadece abonelik kaydı, lütfen tam üyelik alın.' })
    if (!user.isActive) return res.status(403).json({ error: 'Hesabınız aktif değil.' })

    const isPasswordCorrect = await bcrypt.compare(password, user.password || '')
    if (!isPasswordCorrect) return res.status(401).json({ error: 'Hatalı şifre.' })

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
    return res.status(500).json({ error: `Giriş hatası: ${err.message || 'Teknik bir hata oluştu.'}` })
  }
})

// ─── /api/auth/register ───────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({ error: 'SANITY_TOKEN is not configured' })
  const { email, password, name, company, profession, country } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email ve şifre gereklidir.' })

  const normEmail = email.trim().toLowerCase()
  try {
    const existingUser = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      { email: normEmail }
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
        return res
          .status(200)
          .json({
            success: true,
            message: 'Abonelik hesabınız tam üyeliğe yükseltildi.',
            user: { id: updatedUser._id, email: updatedUser.email, userType: 'full_member' },
          })
      }
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı.' })
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
    return res
      .status(201)
      .json({
        success: true,
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          verificationToken: newUser.verificationToken,
        },
      })
  } catch (err) {
    return res.status(500).json({ error: `Hata: ${err.message || 'Kayıt sırasında bir hata oluştu.'}` })
  }
})

// ─── /api/auth/verify ─────────────────────────────────────────────────────
app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: "Doğrulama token'ı gereklidir." })
  try {
    const user = await sanityClient.fetch(`*[_type == "user" && verificationToken == $token][0]`, {
      token,
    })
    if (!user) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş token.' })
    if (user.isVerified)
      return res.status(200).json({ success: true, message: 'E-posta zaten doğrulanmış.' })
    await sanityClient.patch(user._id).set({ isVerified: true, isActive: true }).unset(['verificationToken']).commit()
    return res.status(200).json({ success: true, message: 'E-posta adresiniz başarıyla doğrulandı.' })
  } catch (err) {
    console.error('Verification error:', err)
    return res.status(500).json({ error: `Doğrulama hatası: ${err.message || 'Bir hata oluştu.'}` })
  }
})

// ─── /api/auth/subscribe ──────────────────────────────────────────────────
app.post('/api/auth/subscribe', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({ error: 'SANITY_TOKEN is not configured' })
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'E-posta adresi gereklidir.' })
  const normEmail = email.trim().toLowerCase()
  try {
    const existing = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      { email: normEmail }
    )
    if (existing) return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı.' })
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
    return res.status(201).json({ success: true, user: newUser })
  } catch (err) {
    console.error('Subscribe error:', err)
    return res.status(500).json({ error: `Abonelik hatası: ${err.message || 'İşlem sırasında bir hata oluştu.'}`, details: err.toString() })
  }
})

// ─── /api/auth/subscribe-prof ─────────────────────────────────────────────
app.post('/api/auth/subscribe-prof', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({ error: 'SANITY_TOKEN is not configured' })
  const { email, password, name, company, profession, country, phone } = req.body
  if (!email) return res.status(400).json({ error: 'E-posta adresi gereklidir.' })

  const normEmail = email.trim().toLowerCase()
  try {
    const existing = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      { email: normEmail }
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

        await sanityClient
          .patch(existing._id)
          .set(patchData)
          .commit()

        return res.status(200).json({
          success: true,
          message: 'Başvurunuz alındı. Lütfen e-posta adresinize gönderilen onay mailini kontrol edin.',
          verificationToken,
          email: normEmail,
        })
      }
      if (existing.userType === 'professional_subscriber' && !existing.isVerified) {
        return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı ve onay bekliyor. Lütfen e-postanızı kontrol edin.' })
      }
      return res.status(400).json({ error: 'Bu e-posta adresi ile zaten kayıtlı profesyonel hesabınız var.' })
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
    return res.status(500).json({ error: `Başvuru hatası: ${err.message || 'İşlem sırasında bir hata oluştu.'}` })
  }
})

// ─── /api/auth/reset-request ──────────────────────────────────────────────
app.post('/api/auth/reset-request', async (req, res) => {
  if (!SANITY_TOKEN) return res.status(500).json({ error: 'SANITY_TOKEN yapılandırılmamış.' })
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'E-posta adresi gereklidir.' })
  const normEmail = email.trim().toLowerCase()
  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      { email: normEmail }
    )
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' })
    const resetToken = randomUUID()
    const resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await sanityClient
      .patch(user._id)
      .set({ resetPasswordToken: resetToken, resetPasswordExpires })
      .commit()
    return res
      .status(200)
      .json({ success: true, resetToken, message: 'Şifre sıfırlama kodu oluşturuldu.' })
  } catch (err) {
    console.error('Reset request error:', err)
    return res.status(500).json({ error: `Hata: ${err.message || 'Süreç sırasında bir hata oluştu.'}`, details: err.toString() })
  }
})

// ─── /api/auth/reset-password ─────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword)
    return res.status(400).json({ error: 'Token ve yeni şifre gereklidir.' })
  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && resetPasswordToken == $token && resetPasswordExpires > $now][0]`,
      { token, now: new Date().toISOString() }
    )
    if (!user) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş token.' })
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await sanityClient
      .patch(user._id)
      .set({ password: passwordHash })
      .unset(['resetPasswordToken', 'resetPasswordExpires'])
      .commit()
    return res.status(200).json({ success: true, message: 'Şifreniz başarıyla değiştirildi.' })
  } catch (err) {
    console.error('Reset password error:', err)
    return res.status(500).json({ error: `Şifre değiştirme hatası: ${err.message || 'Bir hata oluştu.'}` })
  }
})

// ─── /api/auth/delete-account ─────────────────────────────────────────────
app.post('/api/auth/delete-account', async (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'Kullanıcı ID gereklidir.' })
  try {
    await sanityClient.delete(id)
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return res.status(500).json({ error: 'Hesap silinirken bir hata oluştu.' })
  }
})

// ─── /api/send-verification ───────────────────────────────────────────────
app.post('/api/send-verification', async (req, res) => {
  const { email, verificationUrl, logoUrl } = req.body || {}

  if (!mailTransporter || !SMTP_PASSWORD) {
    console.warn('⚠️  SMTP_PASSWORD yok, e-posta gönderilemedi. .env dosyasına SMTP_PASSWORD ekleyin.')
    console.log(`📧 [SIMÜLASYON] Doğrulama maili gönderilecekti → ${email}`)
    console.log(`   Doğrulama URL: ${verificationUrl}`)
    return res.json({ ok: true, simulated: true })
  }

  if (!email || !verificationUrl) {
    return res.status(400).json({ error: 'email and verificationUrl are required' })
  }

  console.log('[Email] Logo URL received:', logoUrl)

  try {
    await mailTransporter.sendMail({
      from: '"Birim Design" <birim@birim.com>',
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
            ${logoUrl ? `
            <div style="text-align: center; margin-top: 24px;">
              <img
                src="${logoUrl}"
                alt="Birim Logo"
                style="height: 40px; width: auto; max-width: 200px; display: block; margin: 0 auto;"
              />
            </div>
            ` : ''}
          </div>
        </body>
        </html>
      `,
    })

    console.log('✅ Verification email sent to', email)
    res.json({ ok: true })
  } catch (err) {
    console.error('❌ Mail gönderim hatası:', err)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// ─── /api/send-password-reset ─────────────────────────────────────────────
app.post('/api/send-password-reset', async (req, res) => {
  const { email, resetUrl, logoUrl } = req.body || {}

  if (!mailTransporter || !SMTP_PASSWORD) {
    console.warn('⚠️  SMTP_PASSWORD yok, e-posta gönderilemedi. .env dosyasına SMTP_PASSWORD ekleyin.')
    console.log(`📧 [SIMÜLASYON] Şifre sıfırlama maili gönderilecekti → ${email}`)
    console.log(`   Sıfırlama URL: ${resetUrl}`)
    return res.json({ ok: true, simulated: true })
  }

  if (!email || !resetUrl) {
    return res.status(400).json({ error: 'email and resetUrl are required' })
  }

  try {
    await mailTransporter.sendMail({
      from: '"Birim Design" <birim@birim.com>',
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
            ${logoUrl ? `
            <div style="text-align: center; margin-top: 24px;">
              <img
                src="${logoUrl}"
                alt="Birim Logo"
                style="height: 40px; width: auto; max-width: 200px; display: block; margin: 0 auto;"
              />
            </div>
            ` : ''}
          </div>
        </body>
        </html>
      `,
    })

    console.log('✅ Password reset email sent to', email)
    res.json({ ok: true })
  } catch (err) {
    console.error('❌ Sıfırlama maili gönderim hatası:', err)
    res.status(500).json({ error: 'Failed to send reset email' })
  }
})

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
})

const PORT = 3002
app.listen(PORT, () => {
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
