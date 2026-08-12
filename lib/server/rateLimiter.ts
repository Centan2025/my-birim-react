interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

const cleanStore = () => {
  const now = Date.now()
  for (const key in store) {
    const record = store[key]
    if (record && record.resetTime < now) {
      delete store[key]
    }
  }
}

if (typeof setInterval !== 'undefined') {
  const interval = setInterval(cleanStore, 60000)
  if (interval && typeof interval.unref === 'function') {
    interval.unref()
  }
}

interface RateLimitOptions {
  limit: number
  windowMs: number
}

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

export async function isRateLimitedAsync(key: string, options: RateLimitOptions): Promise<boolean> {
  const redisUrl = process.env['UPSTASH_REDIS_REST_URL']
  const redisToken = process.env['UPSTASH_REDIS_REST_TOKEN']

  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/incr/${encodeURIComponent(key)}`, {
        headers: {Authorization: `Bearer ${redisToken}`},
      })
      if (res.ok) {
        const data = (await res.json()) as {result?: number}
        const count = data.result || 1
        if (count === 1) {
          const expireSec = Math.ceil(options.windowMs / 1000)
          await fetch(`${redisUrl}/expire/${encodeURIComponent(key)}/${expireSec}`, {
            headers: {Authorization: `Bearer ${redisToken}`},
          })
        }
        return count > options.limit
      }
    } catch {
      // Fallback
    }
  }

  return isRateLimited(key, options)
}

interface MiniRequest {
  headers?: Record<string, string | string[] | undefined>
  socket?: {
    remoteAddress?: string
  }
}

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
