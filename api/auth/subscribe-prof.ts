import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'
import {randomUUID} from 'crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  if (!SANITY_TOKEN) {
    return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
  }

  const {email, password, name, company, profession, country, phone} = req.body || {}

  if (!email) {
    return res.status(400).json({error: 'E-posta adresi gereklidir.'})
  }

  const normEmail = email.trim().toLowerCase()

  try {
    const existing = await client.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )

    let passwordHash: string | null = null
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    if (existing) {
      if (existing.userType === 'email_subscriber') {
        const verificationToken = randomUUID()
        const patchData: Record<string, unknown> = {
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
          patchData['password'] = passwordHash
        }

        await client
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
        return res.status(400).json({
          error: 'Bu e-posta adresi zaten kayıtlı ve onay bekliyor. Lütfen e-postanızı kontrol edin.',
        })
      }
      return res.status(400).json({error: 'Bu e-posta adresi ile zaten kayıtlı profesyonel hesabınız var.'})
    }

    const verificationToken = randomUUID()

    const newUserObj: Record<string, unknown> = {
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
      newUserObj['password'] = passwordHash
    }

    await client.create(newUserObj)

    return res.status(201).json({
      success: true,
      message: 'Başvurunuz alındı. Lütfen e-posta adresinize gönderilen onay mailini kontrol edin.',
      verificationToken,
      email: normEmail,
    })
  } catch (err: unknown) {
    console.error('Subscribe Prof error:', err)
    const errMessage = err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.'
    return res.status(500).json({error: `Başvuru hatası: ${errMessage}`})
  }
}
