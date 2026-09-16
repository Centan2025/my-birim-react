import {describe, it, expect} from 'vitest'
import {normalizeCurrency, formatCurrency} from '../utils/currency'

describe('currency utility', () => {
  describe('normalizeCurrency', () => {
    it('normalizes TL and ₺ to TRY', () => {
      expect(normalizeCurrency('TL')).toBe('TRY')
      expect(normalizeCurrency('tl')).toBe('TRY')
      expect(normalizeCurrency(' TL ')).toBe('TRY')
      expect(normalizeCurrency('₺')).toBe('TRY')
    })

    it('normalizes $ to USD and € to EUR', () => {
      expect(normalizeCurrency('$')).toBe('USD')
      expect(normalizeCurrency('€')).toBe('EUR')
      expect(normalizeCurrency('usd')).toBe('USD')
      expect(normalizeCurrency('eur')).toBe('EUR')
    })

    it('defaults to TRY when null, undefined or empty string', () => {
      expect(normalizeCurrency(null)).toBe('TRY')
      expect(normalizeCurrency(undefined)).toBe('TRY')
      expect(normalizeCurrency('')).toBe('TRY')
    })
  })

  describe('formatCurrency', () => {
    it('formats TRY amount correctly without throwing RangeError when currency is TL', () => {
      expect(() => formatCurrency(1500, 'TL')).not.toThrow()
      const formatted = formatCurrency(1500, 'TL')
      expect(formatted).toContain('1.500')
    })

    it('formats USD amount correctly', () => {
      const formatted = formatCurrency(250, 'USD', 'en-US')
      expect(formatted).toContain('250')
    })

    it('falls back safely on completely unrecognized currency symbols', () => {
      expect(() => formatCurrency(99, 'INVALID_UNKNOWN_XYZ')).not.toThrow()
    })
  })
})
