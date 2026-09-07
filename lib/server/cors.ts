import type {VercelRequest, VercelResponse} from '@vercel/node'

const EXACT_ALLOWED_ORIGINS = new Set([
  'https://www.birim.com',
  'https://birim.com',
  'https://birim.sanity.studio',
])

const LOCALHOST_ORIGIN_REGEX = /^http:\/\/(localhost|127\.0\.0\.1):(3000|3001|3002|3333|5173)$/
const BIRIM_VERCEL_PREVIEW_REGEX =
  /^https:\/\/my-birim-react(-[a-z0-9]+)?-centans-projects\.vercel\.app$/

export function isOriginAllowed(origin: string | undefined | null): boolean {
  if (!origin || typeof origin !== 'string') return false
  const trimmed = origin.trim()

  if (EXACT_ALLOWED_ORIGINS.has(trimmed)) return true

  if (trimmed.endsWith('.birim.com') && /^https:\/\/([a-z0-9-]+\.)*birim\.com$/.test(trimmed)) {
    return true
  }

  if (BIRIM_VERCEL_PREVIEW_REGEX.test(trimmed)) {
    return true
  }

  // Development environment only
  if (process.env['NODE_ENV'] !== 'production') {
    if (LOCALHOST_ORIGIN_REGEX.test(trimmed)) {
      return true
    }
  }

  return false
}

export function handleCors(
  req: VercelRequest,
  res: VercelResponse,
  options?: {
    allowMethods?: string
    allowHeaders?: string
    allowCredentials?: boolean
  }
): boolean {
  const requestOrigin = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  const allowed = isOriginAllowed(requestOrigin)

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
    if (options?.allowCredentials !== false) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
  } else {
    // Default safe fallback origin without credentials
    res.setHeader('Access-Control-Allow-Origin', 'https://www.birim.com')
  }

  const methods = options?.allowMethods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  const headers =
    options?.allowHeaders ||
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-analytics-pin, x-api-secret'

  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', headers)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true // Handled preflight
  }

  return false
}
