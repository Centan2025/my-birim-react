import crypto from 'crypto'

function getSecret(): string {
  const secret = process.env['JWT_SECRET']
  if (!secret || secret.trim() === '') {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('[Payment Guest Auth] Critical: JWT_SECRET environment variable is missing!')
    }
    return 'birim_dev_fallback_jwt_secret_key_2026_do_not_use_in_prod'
  }
  return secret.trim()
}

/**
 * Creates a cryptographically signed guest token for an order.
 */
export function createGuestOrderToken(orderId: string, orderNumber: string): string {
  const secret = getSecret()
  const payload = `${orderId}:${orderNumber}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${orderNumber}.${signature}`).toString('base64url')
}

/**
 * Verifies if a guest token is authentic for the given orderId.
 */
export function verifyGuestOrderToken(orderId: string, token: string): boolean {
  if (!token || typeof token !== 'string') return false

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [orderNumber, providedSig] = decoded.split('.')
    if (!orderNumber || !providedSig) return false

    const secret = getSecret()
    const payload = `${orderId}:${orderNumber}`
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    const bufProvided = Buffer.from(providedSig)
    const bufExpected = Buffer.from(expectedSig)

    if (bufProvided.length !== bufExpected.length) return false
    return crypto.timingSafeEqual(bufProvided, bufExpected)
  } catch {
    return false
  }
}
