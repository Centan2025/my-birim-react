import {createClient} from '@sanity/client'
import {getAuthTokenFromReq, verifyToken} from './_token'
import type {VercelRequest, VercelResponse} from '@vercel/node'

const SANITY_PROJECT_ID =
  process.env['SANITY_PROJECT_ID'] || process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET =
  process.env['SANITY_DATASET'] || process.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION =
  process.env['SANITY_API_VERSION'] || process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const SANITY_TOKEN = process.env['SANITY_TOKEN']

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(200).json({authenticated: false, user: null})
  }

  const payload = verifyToken(token)
  if (!payload || !payload.sub) {
    return res.status(200).json({authenticated: false, user: null})
  }

  try {
    const user = await client.fetch(
      `*[_type == "user" && _id == $id && !defined(_deleted)][0]`,
      {id: payload.sub}
    )

    if (!user || !user.isActive) {
      return res.status(200).json({authenticated: false, user: null})
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
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
    console.error('Me endpoint error:', error)
    return res.status(500).json({authenticated: false, error: 'Sunucu hatası.'})
  }
}
