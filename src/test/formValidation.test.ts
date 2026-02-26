import {describe, it, expect} from 'vitest'
import {validateLoginForm, validateRegisterForm} from '../lib/formValidation'

describe('formValidation', () => {
  describe('validateLoginForm', () => {
    it('geçerli mail ve şifre için true döner', () => {
      const res = validateLoginForm('test@example.com', '12345678')
      expect(res.isValid).toBe(true)
      expect(Object.keys(res.errors)).toHaveLength(0)
    })

    it('boş alanlar için hata döndürür', () => {
      const res = validateLoginForm('', '')
      expect(res.isValid).toBe(false)
      expect(res.errors.email).toBeDefined()
      expect(res.errors.password).toBeDefined()
    })

    it('geçersiz e-posta formatı için hata bildirir', () => {
      const res = validateLoginForm('invalid-email', '12345678')
      expect(res.isValid).toBe(false)
      expect(res.errors.email).toContain('Geçerli')
    })
  })

  describe('validateRegisterForm', () => {
    it('tüm alanlar dolu ve geçerli ise true döner', () => {
      // Şifre en az 8 karakter olmalı
      const res = validateRegisterForm(
        'test@ex.com',
        'password123',
        'Ad Soyad',
        'Firma',
        'Mesa',
        'Türkiye'
      )
      expect(res.isValid).toBe(true)
    })

    it('kısa şifre için hata bildirir', () => {
      const res = validateRegisterForm('test@ex.com', '123', 'Ad Soyad', 'Firma', 'Mesa', 'Türkiye')
      expect(res.isValid).toBe(false)
      expect(res.errors.password).toContain('en az 8')
    })

    it('boş isim veya e-posta için hata döner', () => {
      const res = validateRegisterForm('', 'password123', '', 'F', 'M', 'T')
      expect(res.isValid).toBe(false)
      expect(res.errors.email).toBeDefined()
      expect(res.errors.name).toBeDefined()
    })

    it('eksik ülke için hata döner', () => {
      const res = validateRegisterForm('test@ex.com', 'password123', 'Ad Soyad', '', '', '')
      expect(res.isValid).toBe(false)
      expect(res.errors.country).toBeDefined()
    })
  })
})
