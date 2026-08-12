import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'
import {randomUUID} from 'crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'

const SANITY_PROJECT_ID = process.env['SANITY_PROJECT_ID'] || process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET = process.env['SANITY_DATASET'] || process.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION = process.env['SANITY_API_VERSION'] || process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const SANITY_TOKEN = process.env['SANITY_TOKEN']

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {token, newPassword, email, action} = req.body || {}

  // Action: Request Password Reset Token
  if (action === 'request' || (email && !newPassword && !token)) {
    if (!email) {
      return res.status(400).json({error: 'E-posta adresi gereklidir.'})
    }

    const normEmail = email.trim().toLowerCase()

    try {
      const user = await client.fetch(
        `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
        {email: normEmail}
      )

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

      // Security: Always return generic success response without leaking token or user existence
      return res.status(200).json({
        success: true,
        message: 'Eğer e-posta adresi sistemimizde kayıtlı ise şifre sıfırlama bağlantısı oluşturulmuştur.',
      })
    } catch (error: unknown) {
      console.error('Reset request error:', error)
      return res.status(500).json({error: 'Sıfırlama isteğinde bir hata oluştu.'})
    }
  }

  // Action: Reset Password with Token
  if (!token || !newPassword) {
    return res.status(400).json({error: 'Token ve yeni şifre gereklidir.'})
  }

  try {
    const user = await client.fetch(
      `*[_type == "user" && resetPasswordToken == $token && resetPasswordExpires > now()][0]`,
      {token}
    )

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
