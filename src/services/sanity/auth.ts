import groq from 'groq'
import type {User} from '../../types'
import {sanity, useSanity} from './client'
import {getItem, setItem} from './settings'

const KEYS = {USERS: 'birim_users'}

const normalizeEmail = (value: string): string => (value || '').trim().toLowerCase()

const apiFetch = async (endpoint: string, body: Record<string, unknown>) => {
  try {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg =
        errorData.error ||
        `Yerel API sunucusuna erişilemedi (${response.status}). Lütfen 'npm run dev:full' çalıştırıldığından emin olun.`
      const fullMsg = errorData.details ? `${errorMsg}\n\nDetay:\n${errorData.details}` : errorMsg
      throw new Error(fullMsg)
    }
    return await response.json()
  } catch (err: unknown) {
    if (err instanceof Error) throw err
    throw new Error(
      'API sunucusu ile iletişim kurulamadı. Lütfen projenizi "npm run dev:full" komutuyla çalıştırın.'
    )
  }
}

export const subscribeEmail = async (email: string): Promise<User> => {
  const normEmail = normalizeEmail(email)
  if (!normEmail) throw new Error('Geçerli bir e-posta adresi girin')

  if (useSanity) {
    const data = await apiFetch('subscribe', {email: normEmail})
    return data.user
  }

  // Local Storage Fallback (Demo purposes)
  const users = getItem<User[]>(KEYS.USERS) || []
  if (users.find(u => normalizeEmail(u.email) === normEmail)) throw new Error('Zaten kayıtlı')
  const newUser: User = {
    _id: `user_${Date.now()}`,
    email: normEmail,
    name: '',
    role: 'consumer',
    company: '',
    profession: '',
    userType: 'email_subscriber',
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  setItem(KEYS.USERS, [...users, newUser])
  return newUser
}

export const subscribeProfessional = async (data: {
  email: string
  password?: string
  name: string
  company: string
  profession: string
  country: string
  phone: string
}): Promise<{success: boolean; message: string}> => {
  const normEmail = normalizeEmail(data.email)
  if (!normEmail) throw new Error('Geçerli bir e-posta adresi girin')

  if (useSanity) {
    const result = await apiFetch('subscribe-prof', {
      ...data,
      email: normEmail,
    })

    if (result.verificationToken) {
      try {
        const siteUrl = import.meta.env['VITE_SITE_URL'] || window.location.origin
        const verificationUrl = `${siteUrl}/#/verify-email?token=${result.verificationToken}`
        const emailServerUrl = import.meta.env['VITE_EMAIL_SERVER_URL'] || 'http://localhost:3002'

        fetch(`${emailServerUrl}/api/send-verification`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            email: normEmail,
            verificationUrl,
            logoUrl: `${siteUrl}/logo.png`,
          }),
        }).catch(e => console.error('E-posta gönderilemedi:', e))
      } catch (e) {
        console.error('E-posta tetikleme hatası:', e)
      }
    }

    return result
  }

  // Local Storage Fallback
  const users = getItem<User[]>(KEYS.USERS) || []
  if (users.find(u => normalizeEmail(u.email) === normEmail))
    throw new Error('Bu e-posta adresi zaten kayıtlı.')
  const newUser: User = {
    _id: `user_${Date.now()}`,
    email: normEmail,
    name: data.name || '',
    role: 'architect',
    architectVerificationStatus: 'pending_verification',
    company: data.company || '',
    profession: data.profession || '',
    country: data.country || '',
    userType: 'professional_subscriber',
    isActive: false,
    isVerified: false,
    createdAt: new Date().toISOString(),
  }
  setItem(KEYS.USERS, [...users, newUser])
  return {success: true, message: 'Başvurunuz alındı. Onay mailini kontrol edin.'}
}

export const registerUser = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  role: 'consumer' | 'architect' = 'consumer',
  extraProfile?: {
    company?: string
    phone?: string
    city?: string
    country?: string
    website?: string
  }
): Promise<User> => {
  const normEmail = normalizeEmail(email)
  if (!normEmail) throw new Error('Geçerli bir e-posta adresi girin')
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || normEmail.split('@')[0]

  if (useSanity) {
    const data = await apiFetch('register', {
      email: normEmail,
      password,
      firstName,
      lastName,
      name: fullName,
      role,
      ...extraProfile,
    })

    try {
      const siteUrl = import.meta.env['VITE_SITE_URL'] || window.location.origin
      const verificationUrl = `${siteUrl}/#/verify-email?token=${data.user.verificationToken}`
      const emailServerUrl = import.meta.env['VITE_EMAIL_SERVER_URL'] || 'http://localhost:3002'

      fetch(`${emailServerUrl}/api/send-verification`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: normEmail,
          verificationUrl,
          logoUrl: `${siteUrl}/logo.png`,
        }),
      }).catch(e => console.error('E-posta gönderilemedi:', e))
    } catch (e) {
      console.error('E-posta tetikleme hatası:', e)
    }

    return data.user
  }

  const users = getItem<User[]>(KEYS.USERS) || []
  if (users.find(u => normalizeEmail(u.email) === normEmail))
    throw new Error('E-posta adresi kullanımda')

  const newUser: User = {
    _id: `user_${Date.now()}`,
    email: normEmail,
    firstName: firstName || '',
    lastName: lastName || '',
    name: fullName,
    role,
    architectVerificationStatus: role === 'architect' ? 'pending_verification' : 'not_requested',
    company: extraProfile?.company || '',
    phone: extraProfile?.phone || '',
    city: extraProfile?.city || '',
    country: extraProfile?.country || '',
    website: extraProfile?.website || '',
    profession: role === 'architect' ? 'Mimar / İç Mimar' : 'Son Kullanıcı',
    userType: 'full_member',
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
  }
  setItem(KEYS.USERS, [...users, newUser])
  return newUser
}

export const loginUser = async (email: string, password: string): Promise<User> => {
  const normEmail = normalizeEmail(email)

  if (useSanity) {
    try {
      const data = await apiFetch('login', {email: normEmail, password})
      return data.user
    } catch (err: unknown) {
      console.warn('API login failed, checking local storage fallback:', err)
      const users = getItem<User[]>(KEYS.USERS) || []
      const existingUser = users.find(u => normalizeEmail(u.email) === normEmail)
      if (existingUser) return existingUser
      throw err
    }
  }

  const users = getItem<User[]>(KEYS.USERS) || []
  const existingUser = users.find(u => normalizeEmail(u.email) === normEmail)
  if (!existingUser) throw new Error('Kullanıcı bulunamadı')
  return existingUser
}

export const verifyEmail = async (token: string): Promise<boolean> => {
  if (useSanity) {
    const data = await apiFetch('verify', {token})
    return !!data.success
  }
  return false
}

export const requestPasswordReset = async (email: string): Promise<void> => {
  const normEmail = normalizeEmail(email)
  if (useSanity) {
    const data = await apiFetch('reset-request', {email: normEmail})

    // E-posta gönderimini tetikle
    try {
      const siteUrl = import.meta.env['VITE_SITE_URL'] || window.location.origin
      const resetUrl = `${siteUrl}/#/reset-password?token=${data.resetToken}`
      const emailServerUrl = import.meta.env['VITE_EMAIL_SERVER_URL'] || 'http://localhost:3002'

      fetch(`${emailServerUrl}/api/send-password-reset`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: normEmail,
          resetUrl,
          logoUrl: `${siteUrl}/logo.png`,
        }),
      }).catch(e => console.error('Şifre sıfırlama e-postası gönderilemedi:', e))
    } catch (e) {
      console.error('Şifre sıfırlama e-posta tetikleme hatası:', e)
    }

    return
  }
  throw new Error('Sanity not configured.')
}

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  if (useSanity) {
    await apiFetch('reset-password', {token, newPassword})
    return
  }
  throw new Error('Sanity not configured.')
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const normEmail = normalizeEmail(email)
  if (useSanity && sanity)
    return (
      (await sanity.fetch(
        groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]{ ..., isVerified }`,
        {email: normEmail}
      )) || null
    )
  return getItem<User[]>(KEYS.USERS)?.find(u => normalizeEmail(u.email) === normEmail) || null
}

export const getUserById = async (id: string): Promise<User | null> => {
  if (useSanity && sanity)
    return (
      (await sanity.fetch(groq`*[_type == "user" && _id == $id][0]{ ..., isVerified }`, {id})) ||
      null
    )
  return getItem<User[]>(KEYS.USERS)?.find(u => u._id === id) || null
}

export const verifyUserByToken = async (token: string): Promise<User | null> => {
  if (useSanity) {
    try {
      const data = await apiFetch('verify', {token})
      if (data.success && data.user) {
        return data.user as User
      }
    } catch (e) {
      console.error('Verify token failed:', e)
    }
  }
  return null
}

export const deleteUserAccount = async (id: string): Promise<boolean> => {
  if (useSanity) {
    try {
      const data = await apiFetch('delete-account', {id})
      return !!data.success
    } catch {
      return false
    }
  }
  return false
}
