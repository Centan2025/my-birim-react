import {createClient} from '@sanity/client'

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
  method?: string
  body?: Record<string, unknown>
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {email} = req.body

  if (!email) {
    return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  }

  const normEmail = email.trim().toLowerCase()

  try {
    const user = await client.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )

    if (!user) {
      return res.status(404).json({error: 'Kullanıcı bulunamadı.'})
    }

    const resetToken = crypto.randomUUID()
    const resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await client
      .patch(user._id)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetPasswordExpires,
      })
      .commit()

    return res.status(200).json({
      success: true,
      resetToken,
      message: 'Şifre sıfırlama kodu oluşturuldu.',
    })
  } catch (error: unknown) {
    console.error('Reset request error:', error)
    return res.status(500).json({error: 'Süreç sırasında bir hata oluştu.'})
  }
}
