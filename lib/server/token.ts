import crypto from 'crypto'
import type {VercelRequest} from '@vercel/node'

const JWT_SECRET = process.env['JWT_SECRET'] || process.env['SANITY_TOKEN'] || ''
if (!JWT_SECRET && process.env['NODE_ENV'] === 'production') {
  console.error('[Token Helper] Critical Warning: JWT_SECRET environment variable is missing!')
}

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str) : str
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

export interface TokenPayload {
  sub: string
  email: string
  role?: string
  iat: number
  exp: number
}

/**
 * Creates a signed JWT token using HMAC-SHA256
 */
export function createToken(
  payload: {sub: string; email: string; role?: string},
  expiresInSeconds = 604800
): string {
  const header = {alg: 'HS256', typ: 'JWT'}
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))

  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest()
  const encodedSignature = base64UrlEncode(signature)

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

/**
 * Verifies a signed JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null

  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest()
  )

  const sigBuffer = Buffer.from(encodedSignature)
  const expBuffer = Buffer.from(expectedSignature)
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload)
    const payload: TokenPayload = JSON.parse(payloadJson)
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

/**
 * Extracts Auth token from Request Cookie or Authorization Header
 */
export function getAuthTokenFromReq(req: VercelRequest): string | null {
  const authHeader = req.headers?.['authorization']
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim()
  }

  const cookieHeader = req.headers?.['cookie']
  if (cookieHeader && typeof cookieHeader === 'string') {
    const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, pair) => {
      const idx = pair.indexOf('=')
      if (idx > 0) {
        const key = pair.substring(0, idx).trim()
        const val = pair.substring(idx + 1).trim()
        acc[key] = decodeURIComponent(val)
      }
      return acc
    }, {})
    if (cookies['birim_token']) {
      return cookies['birim_token']
    }
  }

  return null
}

/**
 * Sets HttpOnly Secure SameSite Cookie on VercelResponse
 */
export function setAuthCookie(res: VercelResponse, token: string) {
  const maxAge = 604800 // 7 days
  const isProd = process.env['NODE_ENV'] === 'production'
  const cookieStr = `birim_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; ${
    isProd ? 'Secure; ' : ''
  }SameSite=Lax`
  res.setHeader('Set-Cookie', cookieStr)
}

/**
 * Clears Auth Cookie on VercelResponse
 */
export function clearAuthCookie(res: VercelResponse) {
  const cookieStr = `birim_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
  res.setHeader('Set-Cookie', cookieStr)
}
