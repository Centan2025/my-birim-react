/**
 * Security & Anti-Abuse utilities for AI Room Planner
 */

// 1. Rate Limiting (In-Memory IP Tracker: 3 requests per 1 minute window)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string, limit = 3, windowMs = 60 * 1000): { allowed: boolean; remaining: number; resetMs: number } {
  // Local environment bypass (localhost / 127.0.0.1)
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return { allowed: true, remaining: 999, resetMs: 0 };
  }

  const now = Date.now();
  const record = ipStore.get(ip);

  if (!record || now > record.resetTime) {
    ipStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: record.resetTime - now };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, resetMs: record.resetTime - now };
}

// Cleanup stale IP records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

// 2. Input Sanitization & Limits
export function sanitizePrompt(input?: unknown, maxLength = 150): string {
  if (!input || typeof input !== 'string') return '';
  
  // Truncate to max length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove potential script tags, HTML tags and prompt injection keywords
  sanitized = sanitized
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/system prompt/gi, '')
    .replace(/override instructions/gi, '');

  return sanitized;
}

// 3. Client Quota Management (LocalStorage & Cookie: Max 3 tries per 24 hours)
const QUOTA_STORAGE_KEY = 'birim_ai_planner_quota';

export interface QuotaState {
  count: number;
  lastResetDate: string; // YYYY-MM-DD
}

function getTodayString(): string {
  const isoStr = new Date().toISOString()
  return isoStr.split('T')[0] ?? isoStr
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );
}

export function getDailyQuota(maxDaily = 3): { count: number; remaining: number; isExhausted: boolean } {
  if (typeof window === 'undefined') return { count: 0, remaining: maxDaily, isExhausted: false };

  // Bypass daily limit in local environment
  if (isLocalhost()) {
    return { count: 0, remaining: 999, isExhausted: false };
  }

  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    const today = getTodayString();

    if (!raw) {
      return { count: 0, remaining: maxDaily, isExhausted: false };
    }

    const data: QuotaState = JSON.parse(raw);
    if (data.lastResetDate !== today) {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      return { count: 0, remaining: maxDaily, isExhausted: false };
    }

    const remaining = Math.max(0, maxDaily - data.count);
    return {
      count: data.count,
      remaining,
      isExhausted: data.count >= maxDaily,
    };
  } catch {
    return { count: 0, remaining: maxDaily, isExhausted: false };
  }
}

export function incrementDailyQuota(maxDaily = 3): { count: number; remaining: number; isExhausted: boolean } {
  if (typeof window === 'undefined') return { count: 0, remaining: maxDaily, isExhausted: false };

  try {
    const today = getTodayString();
    const current = getDailyQuota(maxDaily);
    const newCount = current.count + 1;

    const data: QuotaState = {
      count: newCount,
      lastResetDate: today,
    };

    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
    document.cookie = `${QUOTA_STORAGE_KEY}_count=${newCount}; path=/; max-age=86400`;

    return {
      count: newCount,
      remaining: Math.max(0, maxDaily - newCount),
      isExhausted: newCount >= maxDaily,
    };
  } catch {
    return { count: 1, remaining: maxDaily - 1, isExhausted: false };
  }
}

// 4. Client Image Resizer & Canvas Optimizer (Max 5MB input -> Downscale to 1024x1024 max, 0.75 JPEG quality)
export async function optimizeImageForUpload(file: File, maxDimension = 1024, maxSizeBytes = 5 * 1024 * 1024): Promise<string> {
  if (file.size > maxSizeBytes) {
    throw new Error('Yüklenen dosya boyutu maksimum 5MB olabilir.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okuma hatası.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel formatı geçersiz.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes any image URL or Base64 string to maxDimension (1024x1024) with quality 0.75 JPEG
 */
export async function resizeImageUrlOrBase64(imageSrc: string, maxDimension = 1024, quality = 0.75): Promise<string> {
  if (!imageSrc) return ''

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(imageSrc); // fallback to original on CORS or load error
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = imageSrc;
  });
}
