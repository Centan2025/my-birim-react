import {createClient} from '@sanity/client'

const SANITY_PROJECT_ID = process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET = process.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION = process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const SANITY_TOKEN = process.env['SANITY_TOKEN']

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

interface ApiRequest {
  method?: string
  body?: any
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
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

    if (user.isVerified) {
      return res.status(200).json({success: true, message: 'E-posta zaten doğrulanmış.'})
    }

    await client.patch(user._id).set({isVerified: true}).unset(['verificationToken']).commit()

    return res.status(200).json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı.',
    })
  } catch (error: unknown) {
    console.error('Verification error:', error)
    return res.status(500).json({error: 'Doğrulama sırasında bir hata oluştu.'})
  }
}
