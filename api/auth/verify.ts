import {createClient} from '@sanity/client'

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

import type {VercelRequest, VercelResponse} from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {token} = req.body

  if (!token) {
    return res.status(400).json({error: "Doğrulama token'ı gereklidir."})
  }

  try {
    const user = await client.fetch(`*[_type == "user" && verificationToken == $token][0]`, {token})

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

    const updatedUser = await client
      .patch(user._id)
      .set({isVerified: true, isActive: true})
      .unset(['verificationToken'])
      .commit()

    const u = updatedUser as {_id: string; [key: string]: unknown}
    return res.status(200).json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı.',
      user: {
        _id: u._id,
        email: u.email,
        name: u.name,
        company: u.company,
        profession: u.profession,
        country: u.country,
        userType: u.userType,
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt || u._createdAt,
      },
    })
  } catch (error: unknown) {
    console.error('Verification error:', error)
    return res.status(500).json({error: 'Doğrulama sırasında bir hata oluştu.'})
  }
}
