import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'

const SANITY_PROJECT_ID = process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f'
const SANITY_DATASET = process.env.VITE_SANITY_DATASET || 'production'
const SANITY_API_VERSION = process.env.VITE_SANITY_API_VERSION || '2025-01-01'
const SANITY_TOKEN = process.env.SANITY_TOKEN

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

interface ApiRequest {
  method?: string;
  body?: any;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: any) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {token, newPassword} = req.body

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
