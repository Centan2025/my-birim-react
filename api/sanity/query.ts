import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../lib/server/cors.js'

const SANITY_PROJECT_ID =
  process.env['VITE_SANITY_PROJECT_ID'] || process.env['SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET =
  process.env['VITE_SANITY_DATASET'] || process.env['SANITY_DATASET'] || 'production'
const SANITY_API_VERSION =
  process.env['VITE_SANITY_API_VERSION'] || process.env['SANITY_API_VERSION'] || '2025-01-01'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, OPTIONS',
      allowHeaders: 'Content-Type, Authorization',
    })
  ) {
    return
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

  // 1. Block sensitive keywords targeting users, passwords, tokens
  const compactQuery = query.toLowerCase().replace(/[\s\r\n\t]/g, '')
  const strippedAlphaQuery = compactQuery.replace(/[^a-z0-9]/g, '')

  const sensitiveKeywords = [
    'user',
    'password',
    'hash',
    'verificationtoken',
    'resetpasswordtoken',
    'resettoken',
    'secret',
    'token',
  ]

  if (sensitiveKeywords.some(kw => strippedAlphaQuery.includes(kw))) {
    return res.status(403).json({error: 'Hassas veri kaynaklarına erişim engellendi.'})
  }

  // 2. Reject negation operators or open wildcard selectors that could bypass type filtering
  if (
    compactQuery.includes('_type!=') ||
    compactQuery.includes('_type!in') ||
    compactQuery.includes('*[]') ||
    compactQuery.includes('*[!') ||
    compactQuery.includes('*[defined(email') ||
    compactQuery.includes('*[defined(password')
  ) {
    return res.status(403).json({error: 'Geçersiz veya kısıtlanmış sorgu yapısı.'})
  }

  // 3. Strict Document Type / ID Whitelist
  // Only public CMS documents are allowed to be fetched through this proxy
  const ALLOWED_TYPES = [
    'product',
    'category',
    'designer',
    'project',
    'newsitem',
    'sitesettings',
    'uitranslations',
    'cookiespolicy',
    'privacypolicy',
    'termsofservice',
    'kvkkpolicy',
    'footer',
    'aboutpagev2',
    'factorypage',
    'contactpage',
    'homepage',
  ]

  const unquotedQuery = compactQuery.replace(/['"`]/g, '')
  const hasAllowedTarget = ALLOWED_TYPES.some(
    type => unquotedQuery.includes(`_type==${type}`) || unquotedQuery.includes(`_id==${type}`)
  )

  if (!hasAllowedTarget) {
    return res.status(403).json({error: 'Yalnızca onaylanmış içerik dokümanları sorgulanabilir.'})
  }

  // 4. Also check params for sensitive keywords (prevent parameter injection e.g. $type: "user")
  const params = req.method === 'GET' ? req.query : req.body
  if (params && typeof params === 'object') {
    for (const [key, val] of Object.entries(params)) {
      if (typeof val === 'string') {
        const normVal = val.toLowerCase().replace(/[\s\r\n\t'"`+=_]/g, '')
        const normKey = key.toLowerCase().replace(/[\s\r\n\t'"`+=_]/g, '')
        if (sensitiveKeywords.some(kw => normVal.includes(kw) || normKey.includes(kw))) {
          return res.status(403).json({error: 'Hassas parametre içeren sorgular engellendi.'})
        }
      }
    }
  }

  const sanityUrl = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`
  )
  sanityUrl.searchParams.set('query', query)
  sanityUrl.searchParams.set('returnQuery', 'false')

  // Forward GROQ params ($param)
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
