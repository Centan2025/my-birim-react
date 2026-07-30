import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'
import {isRateLimitedAsync, getClientIp} from './_rateLimiter'

const SANITY_PROJECT_ID = process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET = process.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION = process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const SANITY_TOKEN = process.env['SANITY_TOKEN'] || process.env['VITE_SANITY_TOKEN']

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

import type {VercelRequest, VercelResponse} from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`login_ip_${ip}`, {limit: 10, windowMs: 60000})) {
    return res
      .status(429)
      .json({error: 'Çok fazla giriş denemesi yaptınız. Lütfen daha sonra tekrar deneyin.'})
  }

  const {email, password} = req.body

  if (!email || !password) {
    return res.status(400).json({error: 'Email ve şifre gereklidir.'})
  }

  const normEmail = email.trim().toLowerCase()

  try {
    const user = await client.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )

    if (!user) {
      return res.status(401).json({error: 'Kullanıcı bulunamadı veya hatalı bilgiler.'})
    }

    if (user.userType === 'email_subscriber') {
      return res.status(403).json({error: 'Bu sadece abonelik kaydı, lütfen tam üyelik alın.'})
    }

    if (!user.isActive) {
      return res.status(403).json({error: 'Hesabınız aktif değil.'})
    }

    // Şifre kontrolü
    const isPasswordCorrect = await bcrypt.compare(password, user.password || '')
    if (!isPasswordCorrect) {
      // SHA-256 fallback (legacy hesaplar için src/services/sanity/auth.ts:22-27'ye benzer mantık gerekebilir)
      // Ancak yeni sistemde her şey bcrypt olmalı.
      // Şimdilik sadece bcrypt.
      return res.status(401).json({error: 'Hatalı şifre.'})
    }

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
  } catch (error: unknown) {
    console.error('Login error:', error)
    return res.status(500).json({error: 'Giriş sırasında bir teknik hata oluştu.'})
  }
}
