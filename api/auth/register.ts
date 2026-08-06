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
  if (await isRateLimitedAsync(`register_ip_${ip}`, {limit: 5, windowMs: 60000})) {
    return res
      .status(429)
      .json({error: 'Çok fazla kayıt denemesi yaptınız. Lütfen daha sonra tekrar deneyin.'})
  }

  if (!SANITY_TOKEN) {
    return res.status(500).json({error: 'SANITY_TOKEN is not configured'})
  }

  const {email, password, firstName, lastName, name, role, company, profession, country, phone, city, website} = req.body

  if (!email || !password) {
    return res.status(400).json({error: 'Email ve şifre gereklidir.'})
  }

  const normEmail = email.trim().toLowerCase()
  const userRole = role === 'architect' ? 'architect' : 'consumer'
  const displayName = name || `${firstName || ''} ${lastName || ''}`.trim() || normEmail.split('@')[0]
  const verificationStatus = userRole === 'architect' ? 'pending_verification' : 'not_requested'

  try {
    // Kullanıcı var mı kontrol et
    const existingUser = await client.fetch(
      `*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {email: normEmail}
    )

    if (existingUser) {
      // Eğer email abonesi ise üye hesabına yükselt (Bülten abonesi hesap değildir, kayıtta hesaba dönüşür)
      if (existingUser.userType === 'email_subscriber' || !existingUser.password) {
        const passwordHash = await bcrypt.hash(password, 12)
        const verificationToken = crypto.randomUUID()
        const updatedUser = await client
          .patch(existingUser._id)
          .set({
            password: passwordHash,
            firstName: firstName || '',
            lastName: lastName || '',
            name: displayName,
            role: userRole,
            architectVerificationStatus: verificationStatus,
            company: company || '',
            profession: profession || (userRole === 'architect' ? 'Mimar / İç Mimar' : 'Son Kullanıcı'),
            country: country || existingUser.country || '',
            phone: phone || '',
            city: city || '',
            website: website || '',
            userType: 'full_member',
            isVerified: false,
            verificationToken,
          })
          .commit()

        const u = updatedUser as any
        return res.status(200).json({
          success: true,
          message: 'Bülten aboneliğiniz üye hesabına dönüştürüldü.',
          user: {
            _id: u._id,
            id: u._id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            name: u.name,
            role: u.role,
            architectVerificationStatus: u.architectVerificationStatus,
            verificationToken,
            isVerified: false,
            isActive: true,
          },
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
      firstName: firstName || '',
      lastName: lastName || '',
      name: displayName,
      role: userRole,
      architectVerificationStatus: verificationStatus,
      company: company || '',
      profession: profession || (userRole === 'architect' ? 'Mimar / İç Mimar' : 'Son Kullanıcı'),
      country: country || '',
      phone: phone || '',
      city: city || '',
      website: website || '',
      userType: 'full_member',
      isActive: true,
      isVerified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
    })

    const nu = newUser as any
    return res.status(201).json({
      success: true,
      user: {
        _id: nu._id,
        id: nu._id,
        email: nu.email,
        firstName: nu.firstName,
        lastName: nu.lastName,
        name: nu.name,
        role: nu.role,
        architectVerificationStatus: nu.architectVerificationStatus,
        verificationToken,
        isVerified: false,
        isActive: true,
      },
    })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    const message = error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu.'
    return res.status(500).json({error: message})
  }
}
