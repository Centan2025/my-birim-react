import {supabase, isSupabaseConfigured} from '../../lib/supabaseClient'
import type {User, UserRole, ArchitectVerificationStatus} from '../../types'

export interface SupabaseProfileRow {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  role?: string | null
  company?: string | null
  profession?: string | null
  phone?: string | null
  tax_id?: string | null
  architect_verification_status?: string | null
  is_verified?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export function mapProfileToUser(profile: SupabaseProfileRow, authEmail?: string): User {
  const email = profile.email || authEmail || ''
  const fullName =
    profile.name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    email.split('@')[0] ||
    'Kullanıcı'

  let role: UserRole = 'consumer'
  if (
    profile.role === 'architect' ||
    profile.role === 'admin' ||
    profile.role === 'dealer' ||
    profile.role === 'distributor' ||
    profile.role === 'contract' ||
    profile.role === 'employee'
  ) {
    role = profile.role
  }

  let verificationStatus: ArchitectVerificationStatus = 'not_requested'
  if (
    profile.architect_verification_status === 'pending_verification' ||
    profile.architect_verification_status === 'pending'
  ) {
    verificationStatus = 'pending_verification'
  } else if (
    profile.architect_verification_status === 'verified' ||
    profile.architect_verification_status === 'approved'
  ) {
    verificationStatus = 'verified'
  } else if (profile.architect_verification_status === 'rejected') {
    verificationStatus = 'rejected'
  }

  return {
    _id: profile.id,
    email,
    firstName: profile.first_name || undefined,
    lastName: profile.last_name || undefined,
    name: fullName,
    role,
    company: profile.company || undefined,
    profession: profile.profession || undefined,
    phone: profile.phone || undefined,
    architectVerificationStatus: verificationStatus,
    isVerified: profile.is_verified ?? true,
    isActive: true,
    createdAt: profile.created_at || new Date().toISOString(),
  }
}

export async function getCurrentSupabaseUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null

  try {
    const {
      data: {session},
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return null
    }

    const authUser = session.user
    const {data: profile, error: profileError} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profileError) {
      console.error('[Supabase Auth] Profil getirme hatası:', profileError)
    }

    if (profile) {
      return mapProfileToUser(profile, authUser.email)
    }

    // Profil satırı henüz oluşmadıysa auth metadata'dan geçici User üret
    const meta = authUser.user_metadata || {}
    return {
      _id: authUser.id,
      email: authUser.email || '',
      name:
        meta['name'] ||
        [meta['first_name'], meta['last_name']].filter(Boolean).join(' ') ||
        authUser.email?.split('@')[0] ||
        'Kullanıcı',
      role: (meta['role'] as UserRole) || 'consumer',
      isActive: true,
      isVerified: Boolean(authUser.email_confirmed_at),
      createdAt: authUser.created_at,
    }
  } catch (err) {
    console.error('[Supabase Auth] Oturum alma hatası:', err)
    return null
  }
}

export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{user: User | null; token?: string; error?: string}> {
  if (!isSupabaseConfigured) {
    return {user: null, error: 'Supabase yapılandırması eksik.'}
  }

  try {
    const {data, error} = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      return {user: null, error: error.message}
    }

    if (!data.user || !data.session) {
      return {user: null, error: 'Giriş yapılamadı.'}
    }

    const {data: profile} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    const user = profile
      ? mapProfileToUser(profile, data.user.email)
      : mapProfileToUser(
          {
            id: data.user.id,
            email: data.user.email || '',
            name: (data.user.user_metadata || {})['name'] || '',
          },
          data.user.email
        )

    return {
      user,
      token: data.session.access_token,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Giriş yapılamadı.'
    return {user: null, error: message}
  }
}

export async function signUpWithSupabase(params: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: UserRole
  company?: string
  profession?: string
  phone?: string
}): Promise<{user: User | null; requiresVerification: boolean; error?: string}> {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      requiresVerification: false,
      error: 'Supabase yapılandırması eksik.',
    }
  }

  try {
    const normEmail = params.email.trim().toLowerCase()
    const fullName = [params.firstName, params.lastName].filter(Boolean).join(' ')
    const assignedRole: UserRole = params.role || 'consumer'

    const {data, error} = await supabase.auth.signUp({
      email: normEmail,
      password: params.password,
      options: {
        data: {
          first_name: params.firstName,
          last_name: params.lastName,
          name: fullName,
          role: assignedRole,
          company: params.company,
          profession: params.profession,
          phone: params.phone,
        },
      },
    })

    if (error) {
      return {user: null, requiresVerification: false, error: error.message}
    }

    const authUser = data.user
    if (!authUser) {
      return {
        user: null,
        requiresVerification: true,
        error: 'Kayıt işlemi başlatılamadı.',
      }
    }

    try {
      await supabase.from('profiles').upsert(
        {
          id: authUser.id,
          email: normEmail,
          first_name: params.firstName || null,
          last_name: params.lastName || null,
          name: fullName || null,
          role: assignedRole,
          company: params.company || null,
          profession: params.profession || null,
          phone: params.phone || null,
          architect_verification_status:
            assignedRole === 'architect' ? 'pending_verification' : 'not_requested',
        },
        {onConflict: 'id'}
      )
    } catch (e) {
      console.warn('[Supabase Auth] Profil upsert uyarısı:', e)
    }

    const requiresVerification = !authUser.email_confirmed_at

    const user: User = {
      _id: authUser.id,
      email: normEmail,
      firstName: params.firstName,
      lastName: params.lastName,
      name: fullName || normEmail.split('@')[0],
      role: assignedRole,
      company: params.company,
      profession: params.profession,
      phone: params.phone,
      architectVerificationStatus:
        assignedRole === 'architect' ? 'pending_verification' : 'not_requested',
      isVerified: !requiresVerification,
      isActive: true,
      createdAt: authUser.created_at,
    }

    return {user, requiresVerification}
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kayıt başarısız.'
    return {user: null, requiresVerification: false, error: message}
  }
}

export async function signOutFromSupabase(): Promise<{error?: string}> {
  if (!isSupabaseConfigured) return {}
  try {
    const {error} = await supabase.auth.signOut()
    if (error) return {error: error.message}
    return {}
  } catch (err: unknown) {
    return {error: err instanceof Error ? err.message : 'Çıkış yapılamadı.'}
  }
}

export async function resetSupabasePassword(
  email: string
): Promise<{success: boolean; error?: string}> {
  if (!isSupabaseConfigured) {
    return {success: false, error: 'Supabase yapılandırması eksik.'}
  }
  try {
    const {error} = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return {success: false, error: error.message}
    return {success: true}
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'İşlem başarısız.',
    }
  }
}

export function onSupabaseAuthStateChange(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured) {
    return {unsubscribe: () => {}}
  }

  const {
    data: {subscription},
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null)
      return
    }

    const {data: profile} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile) {
      callback(mapProfileToUser(profile, session.user.email))
    } else {
      callback(null)
    }
  })

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
}
