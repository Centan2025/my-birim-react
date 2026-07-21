// Simple in-memory rate limiter for serverless environment hot-instances
// and local development.

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Temizleme döngüsü (hafıza sızıntısını önlemek için)
const cleanStore = () => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}

// Serverless ortamlarda setInterval bazen düzgün çalışmayabilir ancak in-memory tutarlılık için yardımcıdır
if (typeof setInterval !== 'undefined') {
  const interval = setInterval(cleanStore, 60000)
  if (interval && typeof interval.unref === 'function') {
    interval.unref()
  }
}

interface RateLimitOptions {
  limit: number      // Maksimum istek sayısı
  windowMs: number   // Zaman penceresi (milisaniye cinsinden)
}

/**
 * IP veya email bazında rate limit kontrolü yapar
 * @returns boolean limit aşıldıysa true, aşılmadıysa false
 */
export function isRateLimited(key: string, options: RateLimitOptions): boolean {
  const now = Date.now()
  const record = store[key]

  if (!record || record.resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    }
    return false
  }

  record.count++
  if (record.count > options.limit) {
    return true
  }

  return false
}

interface MiniRequest {
  headers?: Record<string, string | string[] | undefined>
  socket?: {
    remoteAddress?: string
  }
}

/**
 * İstek başlıklarından veya IP adresinden client IP'sini bulur
 */
export function getClientIp(req: MiniRequest): string {
  const forwardedFor = req.headers?.['x-forwarded-for']
  const ipStr = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  return (
    ipStr?.split(',')[0]?.trim() ||
    (req.headers?.['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  )
}
