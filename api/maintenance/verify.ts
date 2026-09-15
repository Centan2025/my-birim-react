import crypto from 'crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {createToken} from '../../lib/server/token.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    handleCors(req, res, {
      allowMethods: 'POST, OPTIONS',
      allowHeaders: 'Content-Type, Authorization',
      allowCredentials: true,
    })
  ) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const clientIp = getClientIp(req)
  if (await isRateLimitedAsync(`maintenance_verify_${clientIp}`, {limit: 5, windowMs: 60000})) {
    return res
      .status(429)
      .json({error: 'Çok fazla deneme yaptınız. Lütfen 1 dakika sonra tekrar deneyin.'})
  }

  const {secret} = req.body || {}
  const rawProvided = typeof secret === 'string' ? secret.trim() : ''
  const expectedSecret = process.env['MAINTENANCE_BYPASS_SECRET']?.trim()

  if (!expectedSecret) {
    return res.status(503).json({
      error: 'Bakım modu bypass anahtarı sunucuda yapılandırılmamış.',
    })
  }

  const providedBuf = Buffer.from(rawProvided)
  const expectedBuf = Buffer.from(expectedSecret)

  const isMatch =
    providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(providedBuf, expectedBuf)

  if (!isMatch) {
    return res.status(401).json({error: 'Geçersiz bypass kodu.'})
  }

  // Create a signed bypass token valid for 24 hours
  const bypassToken = createToken(
    {
      sub: 'maintenance_bypass_user',
      email: 'maintenance@birim.com',
      role: 'bypass',
    },
    86400
  )

  const isProd = process.env['NODE_ENV'] === 'production'
  const cookieStr = `maintenance_bypass_session=${encodeURIComponent(
    bypassToken
  )}; Path=/; Max-Age=86400; SameSite=Strict; ${isProd ? 'Secure; ' : ''}HttpOnly`

  res.setHeader('Set-Cookie', cookieStr)

  return res.status(200).json({
    success: true,
    message: 'Bakım modu bypass doğrulaması başarılı.',
    bypassToken,
  })
}
