/**
 * Input Sanitization Utilities
 * XSS koruması için DOMPurify kullanır
 */

import DOMPurify from 'dompurify'

/**
 * HTML içeriğini sanitize et
 * @param dirty - Sanitize edilecek HTML string
 * @param options - DOMPurify seçenekleri
 * @returns Sanitize edilmiş HTML string
 */
export const sanitizeHtml = (dirty: string, options?: DOMPurify.Config): string => {
  if (typeof window === 'undefined') {
    // SSR için fallback
    return dirty
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ...options,
  })
}

/**
 * Text içeriğini sanitize et (HTML tag'leri kaldır)
 * @param dirty - Sanitize edilecek text
 * @returns Sadece text içeriği
 */
export const sanitizeText = (dirty: string): string => {
  if (typeof window === 'undefined') {
    return dirty
  }
  return DOMPurify.sanitize(dirty, {ALLOWED_TAGS: []})
}

/**
 * URL'yi sanitize et
 * @param url - Sanitize edilecek URL
 * @returns Güvenli URL veya boş string
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return ''
  try {
    const parsed = new URL(url, window.location.origin)
    // Sadece http ve https protokollerine izin ver
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return ''
  } catch {
    return ''
  }
}

/**
 * Email adresini sanitize et
 * @param email - Sanitize edilecek email
 * @returns Güvenli email veya boş string
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return ''
  // Basit email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = sanitizeText(email).trim()
  if (emailRegex.test(sanitized)) {
    return sanitized
  }
  return ''
}


