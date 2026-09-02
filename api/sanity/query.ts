import type {VercelRequest, VercelResponse} from '@vercel/node'

const SANITY_PROJECT_ID =
  process.env['VITE_SANITY_PROJECT_ID'] || process.env['SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET =
  process.env['VITE_SANITY_DATASET'] || process.env['SANITY_DATASET'] || 'production'
const SANITY_API_VERSION =
  process.env['VITE_SANITY_API_VERSION'] || process.env['SANITY_API_VERSION'] || '2025-01-01'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  const ALLOWED_ORIGINS = [
    'https://www.birim.com',
    'https://birim.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ]
  const isAllowedOrigin =
    ALLOWED_ORIGINS.includes(requestOrigin) ||
    requestOrigin.endsWith('.birim.com') ||
    requestOrigin.endsWith('.vercel.app')

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.birim.com')
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'})
  }

  const query = (req.method === 'GET' ? req.query?.['query'] : req.body?.['query']) as
    | string
    | undefined
  if (!query) {
    return res.status(400).json({error: 'Missing query parameter'})
  }

  // Block sensitive queries targeting users, passwords, tokens (normalize string)
  const normalizedQuery = query.toLowerCase().replace(/[\s\r\n\t'"`+=_]/g, '')
  const sensitiveKeywords = [
    'user',
    'password',
    'verificationtoken',
    'resetpasswordtoken',
    'resettoken',
    'secret',
    'token',
  ]

  if (sensitiveKeywords.some(kw => normalizedQuery.includes(kw))) {
    return res.status(403).json({error: 'Hassas veri kaynaklarına erişim engellendi.'})
  }

  const sanityUrl = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`
  )
  sanityUrl.searchParams.set('query', query)
  sanityUrl.searchParams.set('returnQuery', 'false')

  // Forward GROQ params ($param)
  const params = req.method === 'GET' ? req.query : req.body
  if (params && typeof params === 'object') {
    for (const [key, val] of Object.entries(params)) {
      if (key.startsWith('$') && typeof val === 'string') {
        sanityUrl.searchParams.set(key, val)
      }
    }
  }

  // Forward perspective
  const perspective = (
    req.method === 'GET' ? req.query?.['perspective'] : req.body?.['perspective']
  ) as string | undefined
  if (perspective) {
    sanityUrl.searchParams.set('perspective', perspective)
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    // Forward auth token if present
    const authHeader = req.headers?.['authorization']
    if (authHeader && typeof authHeader === 'string') {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(sanityUrl.toString(), {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    // Cache for 60s on CDN only if public and not preview/authenticated
    if (authHeader || perspective === 'drafts') {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300, max-age=10')
    }

    return res.status(response.status).json(data)
  } catch (err) {
    console.error('Sanity proxy error:', err)
    return res.status(502).json({error: 'Failed to fetch from Sanity'})
  }
}
