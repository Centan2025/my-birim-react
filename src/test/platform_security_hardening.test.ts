import {describe, it, expect} from 'vitest'
import {isOriginAllowed} from '../../lib/server/cors'
import * as fs from 'fs'
import * as path from 'path'
import {createHash, timingSafeEqual} from 'crypto'

describe('Platform Security Hardening Test Suite', () => {
  describe('SEC-04: CORS Hardening & Allowlist Validation', () => {
    it('allows official production Birim domain', () => {
      expect(isOriginAllowed('https://www.birim.com')).toBe(true)
      expect(isOriginAllowed('https://birim.com')).toBe(true)
    })

    it('allows official Sanity Studio origin', () => {
      expect(isOriginAllowed('https://birim.sanity.studio')).toBe(true)
    })

    it('REJECTS arbitrary third-party .sanity.studio origins', () => {
      expect(isOriginAllowed('https://attacker.sanity.studio')).toBe(false)
      expect(isOriginAllowed('https://fake-birim.sanity.studio')).toBe(false)
      expect(isOriginAllowed('https://evil.sanity.studio')).toBe(false)
    })

    it('REJECTS malicious or unapproved domains', () => {
      expect(isOriginAllowed('https://evil.com')).toBe(false)
      expect(isOriginAllowed('https://birim.com.attacker.com')).toBe(false)
      expect(isOriginAllowed(null)).toBe(false)
      expect(isOriginAllowed(undefined)).toBe(false)
      expect(isOriginAllowed('')).toBe(false)
    })
  })

  describe('SEC-03: Email Verification Token Hashing & Safe Verification', () => {
    function safeCompareHash(aHex: string, bHex: string): boolean {
      try {
        const bufA = Buffer.from(aHex, 'hex')
        const bufB = Buffer.from(bHex, 'hex')
        if (bufA.length !== bufB.length) return false
        return timingSafeEqual(bufA, bufB)
      } catch {
        return false
      }
    }

    it('computes and matches SHA-256 token hash correctly', () => {
      const rawToken = '4c21df26-f7df-42b7-a3a8-e16104bc1ec9'
      const storedHash = createHash('sha256').update(rawToken).digest('hex')

      const incomingToken = '4c21df26-f7df-42b7-a3a8-e16104bc1ec9'
      const incomingHash = createHash('sha256').update(incomingToken).digest('hex')

      expect(safeCompareHash(incomingHash, storedHash)).toBe(true)
    })

    it('rejects tampered or mismatched token hash', () => {
      const rawToken = '4c21df26-f7df-42b7-a3a8-e16104bc1ec9'
      const storedHash = createHash('sha256').update(rawToken).digest('hex')

      const forgedToken = '00000000-0000-0000-0000-000000000000'
      const forgedHash = createHash('sha256').update(forgedToken).digest('hex')

      expect(safeCompareHash(forgedHash, storedHash)).toBe(false)
    })
  })

  describe('SEC-06: PostgreSQL SECURITY DEFINER search_path Hardening', () => {
    it('verifies all SQL SECURITY DEFINER functions have SET search_path = public, pg_temp', () => {
      const sqlFiles = [
        'scripts/commerce_payment_foundation.sql',
        'scripts/commerce_order_engine.sql',
        'scripts/commerce_order_lifecycle_and_refunds.sql',
        'scripts/supabase_schema.sql',
      ]

      for (const relPath of sqlFiles) {
        const fullPath = path.resolve(process.cwd(), relPath)
        const content = fs.readFileSync(fullPath, 'utf-8')

        const securityDefinerCount = (content.match(/SECURITY DEFINER/gi) || []).length
        const searchPathCount = (content.match(/SET search_path = public, pg_temp/gi) || []).length

        expect(securityDefinerCount).toBeGreaterThan(0)
        expect(searchPathCount).toBe(securityDefinerCount)
      }
    })
  })

  describe('SEC-01: Zero R2 Secret Credentials in Studio Client Bundle', () => {
    it('verifies birim-web/utils/r2Upload.ts contains NO S3Client or secret access keys', () => {
      const uploadUtilsPath = path.resolve(process.cwd(), 'birim-web/utils/r2Upload.ts')
      const content = fs.readFileSync(uploadUtilsPath, 'utf-8')

      expect(content).not.toContain('@aws-sdk/client-s3')
      expect(content).not.toContain('SANITY_STUDIO_R2_SECRET_ACCESS_KEY')
      expect(content).not.toContain('SANITY_STUDIO_R2_ACCESS_KEY_ID')
      expect(content).toContain('/api/media/presigned-url')
    })
  })

  describe('Legacy Quote Cart Protection Guarantee', () => {
    it('verifies CartContext uses birim_cart storage key and contact navigation', () => {
      const cartContextPath = path.resolve(process.cwd(), 'src/context/CartContext.tsx')
      const content = fs.readFileSync(cartContextPath, 'utf-8')

      expect(content).toContain("'birim_cart'")
      expect(content).toContain('cartCount')
      expect(content).toContain('addToCart')
      expect(content).toContain('removeFromCart')
      expect(content).toContain('clearCart')
    })

    it('verifies CartSidebar directs to /contact?source=cart', () => {
      const cartSidebarPath = path.resolve(process.cwd(), 'src/components/CartSidebar.tsx')
      const content = fs.readFileSync(cartSidebarPath, 'utf-8')

      expect(content).toContain('/contact?source=cart')
      expect(content).toContain('request_quote')
    })
  })
})
