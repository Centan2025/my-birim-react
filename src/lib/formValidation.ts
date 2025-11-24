/**
 * Form Validation Utilities
 * Basit form validation fonksiyonları
 */

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Email validation
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Password validation
 */
export const validatePassword = (password: string, minLength: number = 8): boolean => {
  if (!password) return false
  return password.length >= minLength
}

/**
 * Password strength check
 */
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (!password) return 'weak'
  
  let strength = 0
  
  // Length check
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  
  // Character variety
  if (/[a-z]/.test(password)) strength++ // lowercase
  if (/[A-Z]/.test(password)) strength++ // uppercase
  if (/[0-9]/.test(password)) strength++ // numbers
  if (/[^a-zA-Z0-9]/.test(password)) strength++ // special chars
  
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

/**
 * Login form validation
 */
export const validateLoginForm = (email: string, password: string): ValidationResult => {
  const errors: Record<string, string> = {}
  
  if (!email || !email.trim()) {
    errors.email = 'E-posta adresi gereklidir'
  } else if (!validateEmail(email)) {
    errors.email = 'Geçerli bir e-posta adresi giriniz'
  }
  
  if (!password) {
    errors.password = 'Şifre gereklidir'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Register form validation
 */
export const validateRegisterForm = (
  email: string,
  password: string,
  name: string,
  company?: string,
  profession?: string
): ValidationResult => {
  const errors: Record<string, string> = {}
  
  if (!email || !email.trim()) {
    errors.email = 'E-posta adresi gereklidir'
  } else if (!validateEmail(email)) {
    errors.email = 'Geçerli bir e-posta adresi giriniz'
  }
  
  if (!password) {
    errors.password = 'Şifre gereklidir'
  } else if (!validatePassword(password, 8)) {
    errors.password = 'Şifre en az 8 karakter olmalıdır'
  }
  
  if (!name || !name.trim()) {
    errors.name = 'Ad soyad gereklidir'
  } else if (name.trim().length < 2) {
    errors.name = 'Ad soyad en az 2 karakter olmalıdır'
  }
  
  // Optional fields validation
  if (company && company.trim().length > 0 && company.trim().length < 2) {
    errors.company = 'Şirket adı en az 2 karakter olmalıdır'
  }
  
  if (profession && profession.trim().length > 0 && profession.trim().length < 2) {
    errors.profession = 'Meslek en az 2 karakter olmalıdır'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Contact form validation
 */
export const validateContactForm = (
  name: string,
  email: string,
  message: string,
  subject?: string
): ValidationResult => {
  const errors: Record<string, string> = {}
  
  if (!name || !name.trim()) {
    errors.name = 'Ad soyad gereklidir'
  }
  
  if (!email || !email.trim()) {
    errors.email = 'E-posta adresi gereklidir'
  } else if (!validateEmail(email)) {
    errors.email = 'Geçerli bir e-posta adresi giriniz'
  }
  
  if (!message || !message.trim()) {
    errors.message = 'Mesaj gereklidir'
  } else if (message.trim().length < 10) {
    errors.message = 'Mesaj en az 10 karakter olmalıdır'
  }
  
  if (subject && subject.trim().length > 0 && subject.trim().length < 3) {
    errors.subject = 'Konu en az 3 karakter olmalıdır'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

