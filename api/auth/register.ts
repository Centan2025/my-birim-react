import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'
import {isRateLimitedAsync, getClientIp} from './rateLimiter'

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
  headers?: Record<string, string>
  socket?: {remoteAddress?: string}
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`register_ip_${ip}`, {limit: 5, windowMs: 60000})) {
    return res
      .status(429)
      .json({error: 'Çok fazla kayıt denemesi yaptınız. Lütfen daha sonra tekrar deneyin.'})
  }

  if (!SANITY_TOKEN) {
    return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
  }

  const {email, password, name, company, profession, country} = req.body

  if (!email || !password) {
    return res.status(400).json({error: 'Email ve şifre gereklidir.'})
  }

  const normEmail = email.trim().toLowerCase()

  try {
    // Kullanıcı var mı kontrol et
    const existingUser = await client.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )

    if (existingUser) {
      // Eğer email abonesi ise tam üyeliğe yükselt
      if (existingUser.userType === 'email_subscriber') {
        const passwordHash = await bcrypt.hash(password, 12)
        const updatedUser = await client
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

        return res.status(200).json({
          success: true,
          message: 'Abonelik hesabınız tam üyeliğe yükseltildi.',
          user: {id: updatedUser._id, email: updatedUser.email, userType: 'full_member'},
        })
      }
      return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
    }

    // Yeni kullanıcı oluştur
    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomUUID()

    const newUser = await client.create({
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
      },
    })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    const message = error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu.'
    return res.status(500).json({error: message})
  }
}
