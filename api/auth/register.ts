import {createClient} from '@sanity/client'
import bcrypt from 'bcryptjs'
import {randomUUID} from 'crypto'
import {isRateLimitedAsync, getClientIp} from './_rateLimiter'

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

import {createToken, setAuthCookie} from './_token'
import type {VercelRequest, VercelResponse} from '@vercel/node'

async function sendServerVerificationEmail(email: string, verificationUrl: string) {
  const smtpPass = process.env['SMTP_PASSWORD']
  if (!smtpPass) return
  try {
    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: 'birimdesign@birim.com',
        pass: smtpPass,
      },
    })
    await transporter.sendMail({
      from: '"Birim Design" <birimdesign@birim.com>',
      to: email,
      subject: 'Birim Üyelik Doğrulaması',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background-color: #f9fafb; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="margin-top: 0; color: #1a1f3a;">BİRİM ÜYELİK DOĞRULAMASI</h2>
            <p>Merhaba,</p>
            <p>Birim hesabınızı doğrulamak için lütfen aşağıdaki butona tıklayın:</p>
            <p style="margin: 24px 0;">
              <a href="${verificationUrl}" style="background: #1a1f3a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Üyeliğimi Doğrula</a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">Veya şu adresi tarayıcınıza yapıştırın: ${verificationUrl}</p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('[Email Helper] Send email error:', err)
  }
}

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

  const {
    email,
    password,
    firstName,
    lastName,
    name,
    role,
    company,
    profession,
    country,
    phone,
    city,
    website,
  } = req.body

  if (!email || !password) {
    return res.status(400).json({error: 'Email ve şifre gereklidir.'})
  }

  const normEmail = email.trim().toLowerCase()
  const userRole = role === 'architect' ? 'architect' : 'consumer'
  const displayName =
    name || `${firstName || ''} ${lastName || ''}`.trim() || normEmail.split('@')[0]
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
        const verificationToken = randomUUID()
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
            profession:
              profession || (userRole === 'architect' ? 'Mimar / İç Mimar' : 'Son Kullanıcı'),
            country: country || existingUser.country || '',
            phone: phone || '',
            city: city || '',
            website: website || '',
            userType: 'full_member',
            isVerified: false,
            verificationToken,
          })
          .commit()

        // Send verification email server-side securely
        const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
        const verificationUrl = `${siteUrl}/#/verify-email?token=${verificationToken}`
        sendServerVerificationEmail(normEmail, verificationUrl).catch(err =>
          console.error('Verification email error:', err)
        )

        interface SanityUserRecord {
          _id: string
          email?: string
          firstName?: string
          lastName?: string
          name?: string
          role?: string
          architectVerificationStatus?: string
          [key: string]: unknown
        }

        const u = updatedUser as SanityUserRecord
        const token = createToken({
          sub: u._id,
          email: u.email || normEmail,
          role: u.role || userRole,
        })
        setAuthCookie(res, token)

        return res.status(200).json({
          success: true,
          token,
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
            isVerified: false,
            isActive: true,
          },
        })
      }
      return res.status(400).json({error: 'Bu e-posta adresi zaten kayıtlı.'})
    }

    // Yeni kullanıcı oluştur
    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = randomUUID()

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

    // Send verification email server-side securely
    const siteUrl = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
    const verificationUrl = `${siteUrl}/#/verify-email?token=${verificationToken}`
    sendServerVerificationEmail(normEmail, verificationUrl).catch(err =>
      console.error('Verification email error:', err)
    )

    const nu = newUser as SanityUserRecord
    const token = createToken({
      sub: nu._id,
      email: nu.email || normEmail,
      role: nu.role || userRole,
    })
    setAuthCookie(res, token)

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: nu._id,
        id: nu._id,
        email: nu.email,
        firstName: nu.firstName,
        lastName: nu.lastName,
        name: nu.name,
        role: nu.role,
        architectVerificationStatus: nu.architectVerificationStatus,
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
