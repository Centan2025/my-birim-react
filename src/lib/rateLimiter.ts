/**
 * Rate Limiter - API istekleri için rate limiting
 *
 * Brute-force saldırılarını önlemek için kullanılır.
 * LocalStorage tabanlı basit bir rate limiter.
 * Production'da backend'de daha gelişmiş rate limiting kullanılmalıdır.
 */

interface RateLimitConfig {
  maxAttempts: number // Maksimum deneme sayısı
  windowMs: number // Zaman penceresi (milisaniye)
  keyPrefix: string // LocalStorage key prefix
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return null
    }
    try {
      const testKey = '__rate_limit_test__'
      window.localStorage.setItem(testKey, '1')
      window.localStorage.removeItem(testKey)
      return window.localStorage
    } catch {
      return null
    }
  }

  /**
   * Check if request is allowed
   */
  check(key: string): RateLimitResult {
    const storage = this.getStorage()
    const now = Date.now()

    // Storage yoksa veya kullanılamıyorsa rate limiting uygulama (her isteğe izin ver)
    if (!storage) {
      return {
        allowed: true,
        remaining: this.config.maxAttempts,
        resetTime: now + this.config.windowMs,
      }
    }

    const storageKey = `${this.config.keyPrefix}_${key}`
    const stored = storage.getItem(storageKey)

    if (!stored) {
      // İlk deneme
      const data = {
        count: 1,
        resetTime: now + this.config.windowMs,
      }
      storage.setItem(storageKey, JSON.stringify(data))
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetTime: data.resetTime,
      }
    }

    const data = JSON.parse(stored)

    // Zaman penceresi dolmuşsa sıfırla
    if (now > data.resetTime) {
      const newData = {
        count: 1,
        resetTime: now + this.config.windowMs,
      }
      storage.setItem(storageKey, JSON.stringify(newData))
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetTime: newData.resetTime,
      }
    }

    // Limit aşılmış
    if (data.count >= this.config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime,
      }
    }

    // Deneme sayısını artır
    data.count++
    storage.setItem(storageKey, JSON.stringify(data))

    return {
      allowed: true,
      remaining: this.config.maxAttempts - data.count,
      resetTime: data.resetTime,
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    const storage = this.getStorage()
    if (!storage) return

    const storageKey = `${this.config.keyPrefix}_${key}`
    storage.removeItem(storageKey)
  }

  /**
   * Get remaining attempts
   */
  getRemaining(key: string): number {
    const storage = this.getStorage()
    if (!storage) {
      return this.config.maxAttempts
    }

    const storageKey = `${this.config.keyPrefix}_${key}`
    const stored = storage.getItem(storageKey)

    if (!stored) {
      return this.config.maxAttempts
    }

    const data = JSON.parse(stored)
    const now = Date.now()

    if (now > data.resetTime) {
      return this.config.maxAttempts
    }

    return Math.max(0, this.config.maxAttempts - data.count)
  }
}

// Login için rate limiter (5 deneme / 15 dakika)
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 dakika
  keyPrefix: 'rate_limit_login',
})

// Register için rate limiter (3 deneme / 1 saat)
export const registerRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 saat
  keyPrefix: 'rate_limit_register',
})

// Email subscription için rate limiter (10 deneme / 1 saat)
export const emailSubscriptionRateLimiter = new RateLimiter({
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 saat
  keyPrefix: 'rate_limit_email_sub',
})

// API istekleri için genel rate limiter (100 istek / 1 dakika)
export const apiRateLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 dakika
  keyPrefix: 'rate_limit_api',
})
