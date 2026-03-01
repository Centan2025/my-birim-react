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

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local ve .env dosyalarından SANITY_TOKEN'ı yükle
function loadEnvVars() {
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const envPath = resolve(__dirname, file)
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
        if (!process.env[key]) {
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
const {createClient} = await import('@sanity/client')
const bcrypt = (await import('bcryptjs')).default

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
    if (!user) return res.status(401).json({error: 'Kullanıcı bulunamadı veya hatalı bilgiler.'})
    if (user.userType === 'email_subscriber')
      return res.status(403).json({error: 'Bu sadece abonelik kaydı, lütfen tam üyelik alın.'})
    if (!user.isActive) return res.status(403).json({error: 'Hesabınız aktif değil.'})

    const isPasswordCorrect = await bcrypt.compare(password, user.password || '')
    if (!isPasswordCorrect) return res.status(401).json({error: 'Hatalı şifre.'})

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
    return res.status(500).json({error: 'Giriş sırasında bir teknik hata oluştu.'})
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
            verificationToken: crypto.randomUUID(),
          })
          .commit()
        return res
          .status(200)
          .json({
            success: true,
            message: 'Abonelik hesabınız tam üyeliğe yükseltildi.',
            user: {id: updatedUser._id, email: updatedUser.email, userType: 'full_member'},
          })
      }
      return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationToken = crypto.randomUUID()
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
    console.error('Registration error:', err)
    return res.status(500).json({error: err.message || 'Kayıt sırasında bir hata oluştu.'})
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
    if (user.isVerified)
      return res.status(200).json({success: true, message: 'E-posta zaten doğrulanmış.'})
    await sanityClient.patch(user._id).set({isVerified: true}).unset(['verificationToken']).commit()
    return res.status(200).json({success: true, message: 'E-posta adresiniz başarıyla doğrulandı.'})
  } catch (err) {
    console.error('Verification error:', err)
    return res.status(500).json({error: 'Doğrulama sırasında bir hata oluştu.'})
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
    return res.status(500).json({error: 'İşlem sırasında bir hata oluştu.'})
  }
})

// ─── /api/auth/reset-request ──────────────────────────────────────────────
app.post('/api/auth/reset-request', async (req, res) => {
  const {email} = req.body
  if (!email) return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  const normEmail = email.trim().toLowerCase()
  try {
    const user = await sanityClient.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )
    if (!user) return res.status(404).json({error: 'Kullanıcı bulunamadı.'})
    const resetToken = crypto.randomUUID()
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
    return res.status(500).json({error: 'Süreç sırasında bir hata oluştu.'})
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
    return res.status(500).json({error: 'Şifre sıfırlanırken bir hata oluştu.'})
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

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({error: `Route not found: ${req.method} ${req.path}`})
})

const PORT = 3002
app.listen(PORT, () => {
  console.log(`\n✅  Local API Server çalışıyor → http://localhost:${PORT}`)
  console.log(
    `   SANITY_TOKEN: ${SANITY_TOKEN ? '✓ Yüklendi' : "✗ YOK! (.env.local'e SANITY_TOKEN ekle)"}`
  )
  console.log(`   Proje: ${SANITY_PROJECT_ID} / ${SANITY_DATASET}\n`)
})
