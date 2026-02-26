import groq from 'groq'
import bcrypt from 'bcryptjs'
import type { User, UserType } from '../../types'
import { sanity, sanityMutations, useSanity, ENABLE_LOCAL_FALLBACK } from './client'
import { getItem, setItem } from './settings'



const KEYS = { USERS: 'birim_users' }

const normalizeEmail = (value: string): string => (value || '').trim().toLowerCase()

const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10
    return await bcrypt.hash(password, saltRounds)
}

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        return await bcrypt.compare(password, hash)
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return sha256Hash === hash
}

export const subscribeEmail = async (email: string): Promise<User> => {
    const normEmail = normalizeEmail(email)
    if (!normEmail) throw new Error('Geçerli bir e-posta adresi girin')

    if (useSanity && sanity) {
        if (!sanityMutations) {
            if (!ENABLE_LOCAL_FALLBACK) throw new Error('Sunucuya yazma kapalı.')
            const users = getItem<User[]>(KEYS.USERS) || []
            if (users.find(u => normalizeEmail(u.email) === normEmail)) throw new Error('Zaten kayıtlı')
            const newUser: User = { _id: `user_${Date.now()}`, email: normEmail, name: '', company: '', profession: '', userType: 'email_subscriber', isActive: true, createdAt: new Date().toISOString() }
            setItem(KEYS.USERS, [...users, newUser])
            return newUser
        }

        try {
            const safeId = 'email_subscriber_' + normEmail.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
            const user = await sanityMutations.createIfNotExists({
                _id: safeId, _type: 'user', email: normEmail, password: '', name: '', company: '', profession: '', userType: 'email_subscriber', isActive: true, createdAt: new Date().toISOString(),
            })
            return { _id: user._id, email: user.email, name: user.name, company: user.company, profession: user.profession, userType: user.userType as UserType, isActive: user.isActive, createdAt: user.createdAt || user._createdAt }
        } catch (error: any) {
            throw new Error(error.message || 'Hata')
        }
    }

    const users = getItem<User[]>(KEYS.USERS) || []
    if (users.find(u => normalizeEmail(u.email) === normEmail)) throw new Error('Zaten kayıtlı')
    const newUser: User = { _id: `user_${Date.now()}`, email: normEmail, name: '', company: '', profession: '', userType: 'email_subscriber', isActive: true, createdAt: new Date().toISOString() }
    setItem(KEYS.USERS, [...users, newUser])
    return newUser
}

export const registerUser = async (email: string, password: string, name?: string, company?: string, profession?: string, country?: string): Promise<User> => {
    const normEmail = normalizeEmail(email)
    if (!normEmail) throw new Error('Geçerli bir e-posta adresi girin')

    if (useSanity && sanity) {
        const client = sanityMutations || sanity;
        const existingUser = await client!.fetch<any>(groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`, { email: normEmail })

        if (existingUser) {
            if (existingUser.userType === 'email_subscriber') {
                const passwordHash = await hashPassword(password)
                if (!sanityMutations) throw new Error('Sanity mutations not configured')
                const updatedUser = await sanityMutations.patch(existingUser._id).set({ password: passwordHash, name: name || '', company: company || '', profession: profession || '', country: country || existingUser.country || '', userType: 'full_member' }).commit()
                return { _id: updatedUser._id, email: updatedUser['email'], name: updatedUser['name'], company: updatedUser['company'], profession: updatedUser['profession'], country: updatedUser['country'], userType: updatedUser['userType'] as UserType, isActive: updatedUser['isActive'], createdAt: updatedUser['createdAt'] || updatedUser._createdAt }
            }
            throw new Error('Bu e-posta adresi zaten kayıtlı')
        }

        const passwordHash = await hashPassword(password)
        if (!sanityMutations) throw new Error('Sanity migrations not enabled')

        const verificationToken = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`

        const user = await sanityMutations!.create({ _type: 'user', email: normEmail, password: passwordHash, name: name || '', company: company || '', profession: profession || '', country: country || '', userType: 'full_member', isActive: true, isVerified: false, verificationToken, createdAt: new Date().toISOString() })

        // E-posta gönderimini tetikle
        try {
            const siteUrl = import.meta.env['VITE_SITE_URL'] || window.location.origin
            const verificationUrl = `${siteUrl}/#/verify-email?token=${verificationToken}`
            const emailServerUrl = import.meta.env['VITE_EMAIL_SERVER_URL'] || 'http://localhost:3002'

            await fetch(`${emailServerUrl}/api/send-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: normEmail,
                    verificationUrl,
                    logoUrl: `${siteUrl}/logo.png`
                })
            }).catch(e => console.error('E-posta gönderilemedi:', e))
        } catch (e) {
            console.error('E-posta tetikleme hatası:', e)
        }

        return { _id: user._id, email: user.email, name: user.name, company: user.company, profession: user.profession, country: user.country, userType: user.userType as UserType, isActive: user.isActive, isVerified: user.isVerified, createdAt: user.createdAt || user._createdAt }
    }

    const users = getItem<User[]>(KEYS.USERS) || []
    if (users.find(u => normalizeEmail(u.email) === normEmail)) throw new Error('E-posta adresi kullanımda')
    const newUser: User = { _id: `user_${Date.now()}`, email: normEmail, name: name || '', company: company || '', profession: profession || '', country: country || '', userType: 'full_member', isActive: true, isVerified: true, createdAt: new Date().toISOString() }
    setItem(KEYS.USERS, [...users, newUser])
    return newUser
}

export const loginUser = async (email: string, password: string): Promise<User> => {
    const normEmail = normalizeEmail(email)

    if (useSanity && sanity) {
        const client = sanityMutations || sanity;
        const user = await client!.fetch<any>(groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`, { email: normEmail })
        if (!user) throw new Error('Kullanıcı bulunamadı')
        if (user.userType === 'email_subscriber') throw new Error('Bu sadece abonelik kaydı, lütfen tam üyelik alın')
        if (!user.isActive) throw new Error('Hesabınız aktif değil')
        if (user.password && !(await comparePassword(password, user.password))) throw new Error('Hatalı şifre')
        return { _id: user._id, email: user.email, name: user.name, company: user.company, profession: user.profession, country: user.country, userType: user.userType as UserType, isActive: user.isActive, isVerified: user.isVerified, createdAt: user.createdAt || user._createdAt }
    }

    const users = getItem<User[]>(KEYS.USERS) || []
    const existingUser = users.find(u => normalizeEmail(u.email) === normEmail)
    if (!existingUser) throw new Error('Kullanıcı bulunamadı')
    return existingUser
}

export const verifyEmail = async (token: string): Promise<boolean> => {
    if (useSanity && sanityMutations) {
        const client = sanityMutations;
        const user = await (client.fetch as any)(groq`*[_type == "user" && verificationToken == $token][0]`, { token })
        if (!user) throw new Error('Geçersiz veya süresi dolmuş token')
        if (user.isVerified) return true
        await sanityMutations!.patch(user._id).set({ isVerified: true }).unset(['verificationToken']).commit()
        return true
    }
    return false
}

export const requestPasswordReset = async (email: string): Promise<void> => {
    const normEmail = normalizeEmail(email)
    if (useSanity && sanityMutations) {
        const client = sanityMutations || sanity;
        const user = await (client!.fetch as any)(groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`, { email: normEmail })
        if (!user) throw new Error('Kullanıcı bulunamadı')
        const resetToken = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`
        await sanityMutations!.patch(user._id).set({ resetPasswordToken: resetToken, resetPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }).commit()

        // E-posta gönderimini tetikle
        try {
            const siteUrl = import.meta.env['VITE_SITE_URL'] || window.location.origin
            const resetUrl = `${siteUrl}/#/reset-password?token=${resetToken}`
            const emailServerUrl = import.meta.env['VITE_EMAIL_SERVER_URL'] || 'http://localhost:3002'

            await fetch(`${emailServerUrl}/api/send-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: normEmail,
                    resetUrl,
                    logoUrl: `${siteUrl}/logo.png`
                })
            }).catch(e => console.error('Şifre sıfırlama e-postası gönderilemedi:', e))
        } catch (e) {
            console.error('Şifre sıfırlama e-posta tetikleme hatası:', e)
        }

        return
    }
    throw new Error('Sanity Mutations not set up.')
}

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    if (useSanity && sanityMutations) {
        const user = await (sanityMutations.fetch as any)(groq`*[_type == "user" && resetPasswordToken == $token && resetPasswordExpires > now()][0]`, { token })
        if (!user) throw new Error('Geçersiz veya süresi dolmuş token')
        const passwordHash = await hashPassword(newPassword)
        await sanityMutations!.patch(user._id).set({ password: passwordHash }).unset(['resetPasswordToken', 'resetPasswordExpires']).commit()
        return
    }
    throw new Error('Sanity Mutations not set up.')
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const normEmail = normalizeEmail(email)
    if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]{ ..., isVerified }`, { email: normEmail }) || null
    return getItem<User[]>(KEYS.USERS)?.find(u => normalizeEmail(u.email) === normEmail) || null
}

export const getUserById = async (id: string): Promise<User | null> => {
    if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "user" && _id == $id][0]{ ..., isVerified }`, { id }) || null
    return getItem<User[]>(KEYS.USERS)?.find(u => u._id === id) || null
}

export const verifyUserByToken = async (token: string): Promise<User | null> => {
    if (useSanity && sanityMutations) {
        const user = await (sanityMutations.fetch as any)(groq`*[_type == "user" && verificationToken == $token][0]`, { token })
        if (!user) return null

        if (!user.isVerified) {
            await sanityMutations.patch(user._id).set({ isVerified: true }).unset(['verificationToken']).commit()
        }

        return {
            _id: user._id,
            email: user.email,
            name: user.name,
            company: user.company,
            profession: user.profession,
            country: user.country,
            userType: user.userType as any,
            isActive: user.isActive,
            isVerified: true,
            createdAt: user.createdAt || user._createdAt
        }
    }
    return null
}

export const deleteUserAccount = async (id: string): Promise<boolean> => {
    if (useSanity && sanityMutations) {
        try {
            await sanityMutations.delete(id)
            return true
        } catch {
            return false
        }
    }
    return false
}
