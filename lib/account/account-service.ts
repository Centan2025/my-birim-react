import type {SupabaseClient} from '@supabase/supabase-js'
import {getSafeSupabaseAdmin} from '../server/supabaseAdmin.js'
import {
  getCommerceOrderById,
  listCommerceOrdersForUser,
  type GetCommerceOrderOptions,
  type ListCommerceOrdersOptions,
} from '../commerce/order-service.js'
import type {OrderDetailResult, CustomerOrderSummary} from '../commerce/order-types.js'

export class AccountError extends Error {
  public statusCode: number
  public code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'AccountError'
    this.statusCode = statusCode
    this.code = code
  }
}

export interface CustomerProfileData {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  company: string | null
  profession: string | null
  phone: string | null
  taxId: string | null
  role: string
  architectVerificationStatus: string
  isVerified: boolean
  newsletterSubscribed: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CustomerAddress {
  id: string
  userId: string
  label: string
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  district: string
  postalCode: string | null
  country: string
  isDefaultShipping: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerBillingProfile {
  id: string
  userId: string
  billingType: 'individual' | 'company'
  label: string
  fullName: string | null
  companyName: string | null
  taxOffice: string | null
  taxNumber: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  district: string
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AccountServiceOptions {
  supabaseClientOverride?: SupabaseClient | null
}

export const FORBIDDEN_PROFILE_MUTATION_FIELDS = new Set([
  'id',
  'user_id',
  'userId',
  'email',
  'role',
  'architect_verification_status',
  'architectVerificationStatus',
  'is_verified',
  'isVerified',
  'created_at',
  'createdAt',
  'first_name',
  'firstName',
  'last_name',
  'lastName',
  'tax_id',
  'taxId',
])

export const ALLOWED_PROFILE_MUTATION_FIELDS = new Set([
  'name',
  'phone',
  'company',
  'profession',
  'newsletter_subscribed',
  'newsletterSubscribed',
])
/**
 * 1. GET PROFILE FOR USER
 */
export async function getProfileForUser(
  userId: string,
  options: AccountServiceOptions = {}
): Promise<CustomerProfileData> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {data: profile, error} = await supabase
    .from('profiles')
    .select(
      'id, email, name, first_name, last_name, company, profession, phone, tax_id, role, architect_verification_status, is_verified, newsletter_subscribed, created_at, updated_at'
    )
    .eq('id', cleanUserId)
    .maybeSingle()

  if (error) {
    throw new AccountError(500, 'DATABASE_ERROR', `Profil verisi alınamadı: ${error.message}`)
  }

  if (!profile) {
    throw new AccountError(404, 'NOT_FOUND', 'Kullanıcı profili bulunamadı.')
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || null,
    firstName: profile.first_name || null,
    lastName: profile.last_name || null,
    company: profile.company || null,
    profession: profile.profession || null,
    phone: profile.phone || null,
    taxId: profile.tax_id || null,
    role: profile.role || 'user',
    architectVerificationStatus: profile.architect_verification_status || 'not_requested',
    isVerified: Boolean(profile.is_verified),
    newsletterSubscribed: Boolean(profile.newsletter_subscribed),
    createdAt: profile.created_at || new Date().toISOString(),
    updatedAt: profile.updated_at || null,
  }
}

/**
 * 2. UPDATE PROFILE FOR USER
 */
export async function updateProfileForUser(
  userId: string,
  rawPayload: Record<string, unknown>,
  options: AccountServiceOptions = {}
): Promise<CustomerProfileData> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }

  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new AccountError(400, 'INVALID_PAYLOAD', 'Geçersiz güncelleme verisi.')
  }

  for (const key of Object.keys(rawPayload)) {
    if (FORBIDDEN_PROFILE_MUTATION_FIELDS.has(key)) {
      throw new AccountError(
        400,
        'FORBIDDEN_FIELD',
        `'${key}' alanı istemci tarafından güncellenemez.`
      )
    }
    if (!ALLOWED_PROFILE_MUTATION_FIELDS.has(key)) {
      throw new AccountError(400, 'UNKNOWN_FIELD', `'${key}' alanı profil için geçerli değildir.`)
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (rawPayload['name'] !== undefined) {
    const n = rawPayload['name'] as string | null
    updates['name'] = n !== null ? String(n).trim() : null
  }

  if (rawPayload['phone'] !== undefined) {
    const p = rawPayload['phone'] as string | null
    updates['phone'] = p !== null ? String(p).trim() : null
  }

  if (rawPayload['company'] !== undefined) {
    const c = rawPayload['company'] as string | null
    updates['company'] = c !== null ? String(c).trim() : null
  }

  if (rawPayload['profession'] !== undefined) {
    const pr = rawPayload['profession'] as string | null
    updates['profession'] = pr !== null ? String(pr).trim() : null
  }

  if (
    rawPayload['newsletter_subscribed'] !== undefined ||
    rawPayload['newsletterSubscribed'] !== undefined
  ) {
    const ns = rawPayload['newsletter_subscribed'] ?? rawPayload['newsletterSubscribed']
    updates['newsletter_subscribed'] = Boolean(ns)
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {error} = await supabase.from('profiles').update(updates).eq('id', cleanUserId)

  if (error) {
    throw new AccountError(500, 'DATABASE_ERROR', `Profil güncellenemedi: ${error.message}`)
  }

  return getProfileForUser(cleanUserId, options)
}

/**
 * 3. LIST ADDRESSES FOR USER
 */
export async function listAddressesForUser(
  userId: string,
  options: AccountServiceOptions = {}
): Promise<CustomerAddress[]> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {data, error} = await supabase
    .from('customer_addresses')
    .select(
      'id, user_id, label, recipient_name, phone, address_line_1, address_line_2, city, district, postal_code, country, is_default_shipping, created_at, updated_at'
    )
    .eq('user_id', cleanUserId)
    .order('is_default_shipping', {ascending: false})
    .order('created_at', {ascending: false})

  if (error) {
    throw new AccountError(500, 'DATABASE_ERROR', `Adresler alınamadı: ${error.message}`)
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2 || null,
    city: row.city,
    district: row.district,
    postalCode: row.postal_code || null,
    country: row.country || 'Türkiye',
    isDefaultShipping: Boolean(row.is_default_shipping),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * 4. CREATE ADDRESS FOR USER
 */
export async function createAddressForUser(
  userId: string,
  rawPayload: Record<string, unknown>,
  options: AccountServiceOptions = {}
): Promise<CustomerAddress> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }

  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new AccountError(400, 'INVALID_PAYLOAD', 'Geçersiz adres verisi.')
  }

  if (rawPayload['user_id'] !== undefined || rawPayload['userId'] !== undefined) {
    throw new AccountError(
      400,
      'FORBIDDEN_FIELD',
      "'user_id' alanı istemci tarafından belirlenemez."
    )
  }
  if (rawPayload['id'] !== undefined) {
    throw new AccountError(400, 'FORBIDDEN_FIELD', "'id' alanı istemci tarafından belirlenemez.")
  }

  const label = String(rawPayload['label'] || '').trim()
  const recipientName = String(
    rawPayload['recipient_name'] || rawPayload['recipientName'] || ''
  ).trim()
  const phone = String(rawPayload['phone'] || '').trim()
  const addressLine1 = String(
    rawPayload['address_line_1'] || rawPayload['addressLine1'] || ''
  ).trim()
  const addressLine2 = rawPayload['address_line_2'] ?? rawPayload['addressLine2']
  const city = String(rawPayload['city'] || '').trim()
  const district = String(rawPayload['district'] || '').trim()
  const postalCode = rawPayload['postal_code'] ?? rawPayload['postalCode']
  const country = String(rawPayload['country'] || 'Türkiye').trim()
  const isDefaultShipping = Boolean(
    rawPayload['is_default_shipping'] ?? rawPayload['isDefaultShipping']
  )

  if (!label) throw new AccountError(400, 'VALIDATION_ERROR', 'Adres başlığı zorunludur.')
  if (!recipientName)
    throw new AccountError(400, 'VALIDATION_ERROR', 'Teslim alacak kişi adı zorunludur.')
  if (!phone) throw new AccountError(400, 'VALIDATION_ERROR', 'Telefon numarası zorunludur.')
  if (!addressLine1) throw new AccountError(400, 'VALIDATION_ERROR', 'Adres satırı zorunludur.')
  if (!city) throw new AccountError(400, 'VALIDATION_ERROR', 'İl seçimi zorunludur.')
  if (!district) throw new AccountError(400, 'VALIDATION_ERROR', 'İlçe seçimi zorunludur.')

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  if (isDefaultShipping) {
    await supabase
      .from('customer_addresses')
      .update({is_default_shipping: false, updated_at: new Date().toISOString()})
      .eq('user_id', cleanUserId)
      .eq('is_default_shipping', true)
  }

  const insertData = {
    user_id: cleanUserId,
    label,
    recipient_name: recipientName,
    phone,
    address_line_1: addressLine1,
    address_line_2: addressLine2 ? String(addressLine2).trim() : null,
    city,
    district,
    postal_code: postalCode ? String(postalCode).trim() : null,
    country: country || 'Türkiye',
    is_default_shipping: isDefaultShipping,
  }

  const {data, error} = await supabase
    .from('customer_addresses')
    .insert(insertData)
    .select(
      'id, user_id, label, recipient_name, phone, address_line_1, address_line_2, city, district, postal_code, country, is_default_shipping, created_at, updated_at'
    )
    .single()

  if (error || !data) {
    throw new AccountError(500, 'DATABASE_ERROR', `Adres eklenemedi: ${error?.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    label: data.label,
    recipientName: data.recipient_name,
    phone: data.phone,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2 || null,
    city: data.city,
    district: data.district,
    postalCode: data.postal_code || null,
    country: data.country || 'Türkiye',
    isDefaultShipping: Boolean(data.is_default_shipping),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
/**
 * 5. UPDATE ADDRESS FOR USER
 */
export async function updateAddressForUser(
  userId: string,
  addressId: string,
  rawPayload: Record<string, unknown>,
  options: AccountServiceOptions = {}
): Promise<CustomerAddress> {
  const cleanUserId = String(userId || '').trim()
  const cleanAddressId = String(addressId || '').trim()

  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  if (!cleanAddressId) {
    throw new AccountError(400, 'INVALID_REQUEST', 'Adres ID gereklidir.')
  }

  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new AccountError(400, 'INVALID_PAYLOAD', 'Geçersiz güncelleme verisi.')
  }

  if (rawPayload['user_id'] !== undefined || rawPayload['userId'] !== undefined) {
    throw new AccountError(
      400,
      'FORBIDDEN_FIELD',
      "'user_id' alanı istemci tarafından değiştirilemez."
    )
  }
  if (rawPayload['id'] !== undefined) {
    throw new AccountError(400, 'FORBIDDEN_FIELD', "'id' alanı istemci tarafından değiştirilemez.")
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {data: existing, error: findError} = await supabase
    .from('customer_addresses')
    .select('id, user_id, is_default_shipping')
    .eq('id', cleanAddressId)
    .eq('user_id', cleanUserId)
    .maybeSingle()

  if (findError) {
    throw new AccountError(500, 'DATABASE_ERROR', `Adres aranamadı: ${findError.message}`)
  }
  if (!existing) {
    throw new AccountError(404, 'NOT_FOUND', 'Adres bulunamadı.')
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (rawPayload['label'] !== undefined) {
    const l = String(rawPayload['label']).trim()
    if (!l) throw new AccountError(400, 'VALIDATION_ERROR', 'Adres başlığı boş olamaz.')
    updates['label'] = l
  }
  if (rawPayload['recipient_name'] !== undefined || rawPayload['recipientName'] !== undefined) {
    const r = String(rawPayload['recipient_name'] ?? rawPayload['recipientName']).trim()
    if (!r) throw new AccountError(400, 'VALIDATION_ERROR', 'Teslim alacak kişi adı boş olamaz.')
    updates['recipient_name'] = r
  }
  if (rawPayload['phone'] !== undefined) {
    const p = String(rawPayload['phone']).trim()
    if (!p) throw new AccountError(400, 'VALIDATION_ERROR', 'Telefon numarası boş olamaz.')
    updates['phone'] = p
  }
  if (rawPayload['address_line_1'] !== undefined || rawPayload['addressLine1'] !== undefined) {
    const a1 = String(rawPayload['address_line_1'] ?? rawPayload['addressLine1']).trim()
    if (!a1) throw new AccountError(400, 'VALIDATION_ERROR', 'Adres satırı boş olamaz.')
    updates['address_line_1'] = a1
  }
  if (rawPayload['address_line_2'] !== undefined || rawPayload['addressLine2'] !== undefined) {
    const a2 = rawPayload['address_line_2'] ?? rawPayload['addressLine2']
    updates['address_line_2'] = a2 ? String(a2).trim() : null
  }
  if (rawPayload['city'] !== undefined) {
    const c = String(rawPayload['city']).trim()
    if (!c) throw new AccountError(400, 'VALIDATION_ERROR', 'İl seçimi zorunludur.')
    updates['city'] = c
  }
  if (rawPayload['district'] !== undefined) {
    const d = String(rawPayload['district']).trim()
    if (!d) throw new AccountError(400, 'VALIDATION_ERROR', 'İlçe seçimi zorunludur.')
    updates['district'] = d
  }
  if (rawPayload['postal_code'] !== undefined || rawPayload['postalCode'] !== undefined) {
    const pc = rawPayload['postal_code'] ?? rawPayload['postalCode']
    updates['postal_code'] = pc ? String(pc).trim() : null
  }
  if (rawPayload['country'] !== undefined) {
    updates['country'] = String(rawPayload['country']).trim() || 'Türkiye'
  }

  const wantsDefault =
    rawPayload['is_default_shipping'] !== undefined || rawPayload['isDefaultShipping'] !== undefined
      ? Boolean(rawPayload['is_default_shipping'] ?? rawPayload['isDefaultShipping'])
      : undefined

  if (wantsDefault === true) {
    try {
      await supabase.rpc('set_default_customer_address', {
        p_user_id: cleanUserId,
        p_address_id: cleanAddressId,
      })
    } catch {
      await supabase
        .from('customer_addresses')
        .update({is_default_shipping: false, updated_at: new Date().toISOString()})
        .eq('user_id', cleanUserId)
        .neq('id', cleanAddressId)
        .eq('is_default_shipping', true)
      updates['is_default_shipping'] = true
    }
  } else if (wantsDefault === false) {
    updates['is_default_shipping'] = false
  }

  const {data, error} = await supabase
    .from('customer_addresses')
    .update(updates)
    .eq('id', cleanAddressId)
    .eq('user_id', cleanUserId)
    .select(
      'id, user_id, label, recipient_name, phone, address_line_1, address_line_2, city, district, postal_code, country, is_default_shipping, created_at, updated_at'
    )
    .single()

  if (error || !data) {
    throw new AccountError(500, 'DATABASE_ERROR', `Adres güncellenemedi: ${error?.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    label: data.label,
    recipientName: data.recipient_name,
    phone: data.phone,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2 || null,
    city: data.city,
    district: data.district,
    postalCode: data.postal_code || null,
    country: data.country || 'Türkiye',
    isDefaultShipping: Boolean(data.is_default_shipping),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 6. DELETE ADDRESS FOR USER (Policy B)
 */
export async function deleteAddressForUser(
  userId: string,
  addressId: string,
  options: AccountServiceOptions = {}
): Promise<{success: boolean}> {
  const cleanUserId = String(userId || '').trim()
  const cleanAddressId = String(addressId || '').trim()

  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  if (!cleanAddressId) {
    throw new AccountError(400, 'INVALID_REQUEST', 'Adres ID gereklidir.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {data: existing, error: findError} = await supabase
    .from('customer_addresses')
    .select('id')
    .eq('id', cleanAddressId)
    .eq('user_id', cleanUserId)
    .maybeSingle()

  if (findError) {
    throw new AccountError(500, 'DATABASE_ERROR', `Adres aranamadı: ${findError.message}`)
  }
  if (!existing) {
    throw new AccountError(404, 'NOT_FOUND', 'Adres bulunamadı.')
  }

  const {error: deleteError} = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', cleanAddressId)
    .eq('user_id', cleanUserId)

  if (deleteError) {
    throw new AccountError(500, 'DATABASE_ERROR', `Adres silinemedi: ${deleteError.message}`)
  }

  return {success: true}
}

/**
 * 7. SET DEFAULT ADDRESS FOR USER
 */
export async function setDefaultAddressForUser(
  userId: string,
  addressId: string,
  options: AccountServiceOptions = {}
): Promise<CustomerAddress> {
  const cleanUserId = String(userId || '').trim()
  const cleanAddressId = String(addressId || '').trim()

  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  if (!cleanAddressId) {
    throw new AccountError(400, 'INVALID_REQUEST', 'Adres ID gereklidir.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {error: rpcError} = await supabase.rpc('set_default_customer_address', {
    p_user_id: cleanUserId,
    p_address_id: cleanAddressId,
  })

  if (rpcError) {
    const {data: existing} = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('id', cleanAddressId)
      .eq('user_id', cleanUserId)
      .maybeSingle()

    if (!existing) {
      throw new AccountError(404, 'NOT_FOUND', 'Adres bulunamadı.')
    }

    await supabase
      .from('customer_addresses')
      .update({is_default_shipping: false, updated_at: new Date().toISOString()})
      .eq('user_id', cleanUserId)

    await supabase
      .from('customer_addresses')
      .update({is_default_shipping: true, updated_at: new Date().toISOString()})
      .eq('id', cleanAddressId)
      .eq('user_id', cleanUserId)
  }

  const {data, error} = await supabase
    .from('customer_addresses')
    .select(
      'id, user_id, label, recipient_name, phone, address_line_1, address_line_2, city, district, postal_code, country, is_default_shipping, created_at, updated_at'
    )
    .eq('id', cleanAddressId)
    .eq('user_id', cleanUserId)
    .single()

  if (error || !data) {
    throw new AccountError(500, 'DATABASE_ERROR', `Adres alınamadı: ${error?.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    label: data.label,
    recipientName: data.recipient_name,
    phone: data.phone,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2 || null,
    city: data.city,
    district: data.district,
    postalCode: data.postal_code || null,
    country: data.country || 'Türkiye',
    isDefaultShipping: Boolean(data.is_default_shipping),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
/**
 * 8. LIST BILLING PROFILES FOR USER
 */
export async function listBillingProfilesForUser(
  userId: string,
  options: AccountServiceOptions = {}
): Promise<CustomerBillingProfile[]> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {data, error} = await supabase
    .from('customer_billing_profiles')
    .select(
      'id, user_id, billing_type, label, full_name, company_name, tax_office, tax_number, address_line_1, address_line_2, city, district, postal_code, country, is_default, created_at, updated_at'
    )
    .eq('user_id', cleanUserId)
    .order('is_default', {ascending: false})
    .order('created_at', {ascending: false})

  if (error) {
    throw new AccountError(500, 'DATABASE_ERROR', `Fatura profilleri alınamadı: ${error.message}`)
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    billingType: row.billing_type === 'company' ? 'company' : 'individual',
    label: row.label,
    fullName: row.full_name || null,
    companyName: row.company_name || null,
    taxOffice: row.tax_office || null,
    taxNumber: row.tax_number || null,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2 || null,
    city: row.city,
    district: row.district,
    postalCode: row.postal_code || null,
    country: row.country || 'Türkiye',
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * 9. CREATE BILLING PROFILE FOR USER
 */
export async function createBillingProfileForUser(
  userId: string,
  rawPayload: Record<string, unknown>,
  options: AccountServiceOptions = {}
): Promise<CustomerBillingProfile> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }

  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new AccountError(400, 'INVALID_PAYLOAD', 'Geçersiz fatura profili verisi.')
  }

  if (rawPayload['user_id'] !== undefined || rawPayload['userId'] !== undefined) {
    throw new AccountError(
      400,
      'FORBIDDEN_FIELD',
      "'user_id' alanı istemci tarafından belirlenemez."
    )
  }
  if (rawPayload['id'] !== undefined) {
    throw new AccountError(400, 'FORBIDDEN_FIELD', "'id' alanı istemci tarafından belirlenemez.")
  }

  const billingType =
    (rawPayload['billing_type'] ?? rawPayload['billingType']) === 'company'
      ? 'company'
      : 'individual'
  const label = String(rawPayload['label'] || '').trim()
  const fullName = rawPayload['full_name'] ?? rawPayload['fullName']
  const companyName = rawPayload['company_name'] ?? rawPayload['companyName']
  const taxOffice = rawPayload['tax_office'] ?? rawPayload['taxOffice']
  const taxNumber = rawPayload['tax_number'] ?? rawPayload['taxNumber'] ?? rawPayload['taxId']
  const addressLine1 = String(
    rawPayload['address_line_1'] || rawPayload['addressLine1'] || ''
  ).trim()
  const addressLine2 = rawPayload['address_line_2'] ?? rawPayload['addressLine2']
  const city = String(rawPayload['city'] || '').trim()
  const district = String(rawPayload['district'] || '').trim()
  const postalCode = rawPayload['postal_code'] ?? rawPayload['postalCode']
  const country = String(rawPayload['country'] || 'Türkiye').trim()
  const isDefault = Boolean(rawPayload['is_default'] ?? rawPayload['isDefault'])

  if (!label) throw new AccountError(400, 'VALIDATION_ERROR', 'Fatura başlığı zorunludur.')
  if (!addressLine1)
    throw new AccountError(400, 'VALIDATION_ERROR', 'Fatura adresi satırı zorunludur.')
  if (!city) throw new AccountError(400, 'VALIDATION_ERROR', 'İl seçimi zorunludur.')
  if (!district) throw new AccountError(400, 'VALIDATION_ERROR', 'İlçe seçimi zorunludur.')

  if (billingType === 'company') {
    if (!companyName || !String(companyName).trim()) {
      throw new AccountError(
        400,
        'VALIDATION_ERROR',
        'Kurumsal fatura için şirket unvanı zorunludur.'
      )
    }
    if (!taxOffice || !String(taxOffice).trim()) {
      throw new AccountError(
        400,
        'VALIDATION_ERROR',
        'Kurumsal fatura için vergi dairesi zorunludur.'
      )
    }
    if (!taxNumber || !String(taxNumber).trim()) {
      throw new AccountError(
        400,
        'VALIDATION_ERROR',
        'Kurumsal fatura için vergi numarası zorunludur.'
      )
    }
  } else {
    if (!fullName || !String(fullName).trim()) {
      throw new AccountError(400, 'VALIDATION_ERROR', 'Bireysel fatura için ad soyad zorunludur.')
    }
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  if (isDefault) {
    await supabase
      .from('customer_billing_profiles')
      .update({is_default: false, updated_at: new Date().toISOString()})
      .eq('user_id', cleanUserId)
      .eq('is_default', true)
  }

  const insertData = {
    user_id: cleanUserId,
    billing_type: billingType,
    label,
    full_name: fullName ? String(fullName).trim() : null,
    company_name: companyName ? String(companyName).trim() : null,
    tax_office: taxOffice ? String(taxOffice).trim() : null,
    tax_number: taxNumber ? String(taxNumber).trim() : null,
    address_line_1: addressLine1,
    address_line_2: addressLine2 ? String(addressLine2).trim() : null,
    city,
    district,
    postal_code: postalCode ? String(postalCode).trim() : null,
    country: country || 'Türkiye',
    is_default: isDefault,
  }

  const {data, error} = await supabase
    .from('customer_billing_profiles')
    .insert(insertData)
    .select(
      'id, user_id, billing_type, label, full_name, company_name, tax_office, tax_number, address_line_1, address_line_2, city, district, postal_code, country, is_default, created_at, updated_at'
    )
    .single()

  if (error || !data) {
    throw new AccountError(500, 'DATABASE_ERROR', `Fatura profili eklenemedi: ${error?.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    billingType: data.billing_type === 'company' ? 'company' : 'individual',
    label: data.label,
    fullName: data.full_name || null,
    companyName: data.company_name || null,
    taxOffice: data.tax_office || null,
    taxNumber: data.tax_number || null,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2 || null,
    city: data.city,
    district: data.district,
    postalCode: data.postal_code || null,
    country: data.country || 'Türkiye',
    isDefault: Boolean(data.is_default),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
/**
 * 10. UPDATE BILLING PROFILE FOR USER
 */
export async function updateBillingProfileForUser(
  userId: string,
  billingId: string,
  rawPayload: Record<string, unknown>,
  options: AccountServiceOptions = {}
): Promise<CustomerBillingProfile> {
  const cleanUserId = String(userId || '').trim()
  const cleanBillingId = String(billingId || '').trim()

  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  if (!cleanBillingId) {
    throw new AccountError(400, 'INVALID_REQUEST', 'Fatura profili ID gereklidir.')
  }

  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new AccountError(400, 'INVALID_PAYLOAD', 'Geçersiz fatura profili verisi.')
  }

  if (rawPayload['user_id'] !== undefined || rawPayload['userId'] !== undefined) {
    throw new AccountError(
      400,
      'FORBIDDEN_FIELD',
      "'user_id' alanı istemci tarafından değiştirilemez."
    )
  }
  if (rawPayload['id'] !== undefined) {
    throw new AccountError(400, 'FORBIDDEN_FIELD', "'id' alanı istemci tarafından değiştirilemez.")
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {data: existing, error: findError} = await supabase
    .from('customer_billing_profiles')
    .select('*')
    .eq('id', cleanBillingId)
    .eq('user_id', cleanUserId)
    .maybeSingle()

  if (findError) {
    throw new AccountError(500, 'DATABASE_ERROR', `Fatura profili aranamadı: ${findError.message}`)
  }
  if (!existing) {
    throw new AccountError(404, 'NOT_FOUND', 'Fatura profili bulunamadı.')
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (rawPayload['billing_type'] !== undefined || rawPayload['billingType'] !== undefined) {
    const bt =
      (rawPayload['billing_type'] ?? rawPayload['billingType']) === 'company'
        ? 'company'
        : 'individual'
    updates['billing_type'] = bt
  }

  const effectiveType = (updates['billing_type'] || existing.billing_type) as
    | 'individual'
    | 'company'

  if (rawPayload['label'] !== undefined) {
    const l = String(rawPayload['label']).trim()
    if (!l) throw new AccountError(400, 'VALIDATION_ERROR', 'Fatura başlığı boş olamaz.')
    updates['label'] = l
  }

  if (rawPayload['full_name'] !== undefined || rawPayload['fullName'] !== undefined) {
    const fn = rawPayload['full_name'] ?? rawPayload['fullName']
    updates['full_name'] = fn ? String(fn).trim() : null
  }

  if (rawPayload['company_name'] !== undefined || rawPayload['companyName'] !== undefined) {
    const cn = rawPayload['company_name'] ?? rawPayload['companyName']
    updates['company_name'] = cn ? String(cn).trim() : null
  }

  if (rawPayload['tax_office'] !== undefined || rawPayload['taxOffice'] !== undefined) {
    const to = rawPayload['tax_office'] ?? rawPayload['taxOffice']
    updates['tax_office'] = to ? String(to).trim() : null
  }

  if (
    rawPayload['tax_number'] !== undefined ||
    rawPayload['taxNumber'] !== undefined ||
    rawPayload['taxId'] !== undefined
  ) {
    const tn = rawPayload['tax_number'] ?? rawPayload['taxNumber'] ?? rawPayload['taxId']
    updates['tax_number'] = tn ? String(tn).trim() : null
  }

  if (rawPayload['address_line_1'] !== undefined || rawPayload['addressLine1'] !== undefined) {
    const a1 = String(rawPayload['address_line_1'] ?? rawPayload['addressLine1']).trim()
    if (!a1) throw new AccountError(400, 'VALIDATION_ERROR', 'Adres satırı boş olamaz.')
    updates['address_line_1'] = a1
  }

  if (rawPayload['address_line_2'] !== undefined || rawPayload['addressLine2'] !== undefined) {
    const a2 = rawPayload['address_line_2'] ?? rawPayload['addressLine2']
    updates['address_line_2'] = a2 ? String(a2).trim() : null
  }

  if (rawPayload['city'] !== undefined) {
    const c = String(rawPayload['city']).trim()
    if (!c) throw new AccountError(400, 'VALIDATION_ERROR', 'İl seçimi zorunludur.')
    updates['city'] = c
  }

  if (rawPayload['district'] !== undefined) {
    const d = String(rawPayload['district']).trim()
    if (!d) throw new AccountError(400, 'VALIDATION_ERROR', 'İlçe seçimi zorunludur.')
    updates['district'] = d
  }

  if (rawPayload['postal_code'] !== undefined || rawPayload['postalCode'] !== undefined) {
    const pc = rawPayload['postal_code'] ?? rawPayload['postalCode']
    updates['postal_code'] = pc ? String(pc).trim() : null
  }

  if (rawPayload['country'] !== undefined) {
    updates['country'] = String(rawPayload['country']).trim() || 'Türkiye'
  }

  if (effectiveType === 'company') {
    const effectiveCompany =
      updates['company_name'] !== undefined ? updates['company_name'] : existing.company_name
    const effectiveTaxOffice =
      updates['tax_office'] !== undefined ? updates['tax_office'] : existing.tax_office
    const effectiveTaxNum =
      updates['tax_number'] !== undefined ? updates['tax_number'] : existing.tax_number

    if (!effectiveCompany)
      throw new AccountError(
        400,
        'VALIDATION_ERROR',
        'Kurumsal fatura için şirket unvanı zorunludur.'
      )
    if (!effectiveTaxOffice)
      throw new AccountError(
        400,
        'VALIDATION_ERROR',
        'Kurumsal fatura için vergi dairesi zorunludur.'
      )
    if (!effectiveTaxNum)
      throw new AccountError(
        400,
        'VALIDATION_ERROR',
        'Kurumsal fatura için vergi numarası zorunludur.'
      )
  }

  const wantsDefault =
    rawPayload['is_default'] !== undefined || rawPayload['isDefault'] !== undefined
      ? Boolean(rawPayload['is_default'] ?? rawPayload['isDefault'])
      : undefined

  if (wantsDefault === true) {
    try {
      await supabase.rpc('set_default_customer_billing_profile', {
        p_user_id: cleanUserId,
        p_billing_id: cleanBillingId,
      })
    } catch {
      await supabase
        .from('customer_billing_profiles')
        .update({is_default: false, updated_at: new Date().toISOString()})
        .eq('user_id', cleanUserId)
        .neq('id', cleanBillingId)
        .eq('is_default', true)
      updates['is_default'] = true
    }
  } else if (wantsDefault === false) {
    updates['is_default'] = false
  }

  const {data, error} = await supabase
    .from('customer_billing_profiles')
    .update(updates)
    .eq('id', cleanBillingId)
    .eq('user_id', cleanUserId)
    .select(
      'id, user_id, billing_type, label, full_name, company_name, tax_office, tax_number, address_line_1, address_line_2, city, district, postal_code, country, is_default, created_at, updated_at'
    )
    .single()

  if (error || !data) {
    throw new AccountError(
      500,
      'DATABASE_ERROR',
      `Fatura profili güncellenemedi: ${error?.message}`
    )
  }

  return {
    id: data.id,
    userId: data.user_id,
    billingType: data.billing_type === 'company' ? 'company' : 'individual',
    label: data.label,
    fullName: data.full_name || null,
    companyName: data.company_name || null,
    taxOffice: data.tax_office || null,
    taxNumber: data.tax_number || null,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2 || null,
    city: data.city,
    district: data.district,
    postalCode: data.postal_code || null,
    country: data.country || 'Türkiye',
    isDefault: Boolean(data.is_default),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 11. DELETE BILLING PROFILE FOR USER (Policy B)
 */
export async function deleteBillingProfileForUser(
  userId: string,
  billingId: string,
  options: AccountServiceOptions = {}
): Promise<{success: boolean}> {
  const cleanUserId = String(userId || '').trim()
  const cleanBillingId = String(billingId || '').trim()

  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  if (!cleanBillingId) {
    throw new AccountError(400, 'INVALID_REQUEST', 'Fatura profili ID gereklidir.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {data: existing, error: findError} = await supabase
    .from('customer_billing_profiles')
    .select('id')
    .eq('id', cleanBillingId)
    .eq('user_id', cleanUserId)
    .maybeSingle()

  if (findError) {
    throw new AccountError(500, 'DATABASE_ERROR', `Fatura profili aranamadı: ${findError.message}`)
  }
  if (!existing) {
    throw new AccountError(404, 'NOT_FOUND', 'Fatura profili bulunamadı.')
  }

  const {error: deleteError} = await supabase
    .from('customer_billing_profiles')
    .delete()
    .eq('id', cleanBillingId)
    .eq('user_id', cleanUserId)

  if (deleteError) {
    throw new AccountError(
      500,
      'DATABASE_ERROR',
      `Fatura profili silinemedi: ${deleteError.message}`
    )
  }

  return {success: true}
}

/**
 * 12. SET DEFAULT BILLING PROFILE FOR USER
 */
export async function setDefaultBillingProfileForUser(
  userId: string,
  billingId: string,
  options: AccountServiceOptions = {}
): Promise<CustomerBillingProfile> {
  const cleanUserId = String(userId || '').trim()
  const cleanBillingId = String(billingId || '').trim()

  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  if (!cleanBillingId) {
    throw new AccountError(400, 'INVALID_REQUEST', 'Fatura profili ID gereklidir.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new AccountError(500, 'DATABASE_UNAVAILABLE', 'Veritabanı servisi kullanılamıyor.')
  }

  const {error: rpcError} = await supabase.rpc('set_default_customer_billing_profile', {
    p_user_id: cleanUserId,
    p_billing_id: cleanBillingId,
  })

  if (rpcError) {
    const {data: existing} = await supabase
      .from('customer_billing_profiles')
      .select('id')
      .eq('id', cleanBillingId)
      .eq('user_id', cleanUserId)
      .maybeSingle()

    if (!existing) {
      throw new AccountError(404, 'NOT_FOUND', 'Fatura profili bulunamadı.')
    }

    await supabase
      .from('customer_billing_profiles')
      .update({is_default: false, updated_at: new Date().toISOString()})
      .eq('user_id', cleanUserId)

    await supabase
      .from('customer_billing_profiles')
      .update({is_default: true, updated_at: new Date().toISOString()})
      .eq('id', cleanBillingId)
      .eq('user_id', cleanUserId)
  }

  const {data, error} = await supabase
    .from('customer_billing_profiles')
    .select(
      'id, user_id, billing_type, label, full_name, company_name, tax_office, tax_number, address_line_1, address_line_2, city, district, postal_code, country, is_default, created_at, updated_at'
    )
    .eq('id', cleanBillingId)
    .eq('user_id', cleanUserId)
    .single()

  if (error || !data) {
    throw new AccountError(500, 'DATABASE_ERROR', `Fatura profili alınamadı: ${error?.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    billingType: data.billing_type === 'company' ? 'company' : 'individual',
    label: data.label,
    fullName: data.full_name || null,
    companyName: data.company_name || null,
    taxOffice: data.tax_office || null,
    taxNumber: data.tax_number || null,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2 || null,
    city: data.city,
    district: data.district,
    postalCode: data.postal_code || null,
    country: data.country || 'Türkiye',
    isDefault: Boolean(data.is_default),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 13. LIST ORDERS FOR USER
 */
export async function listOrdersForUser(
  userId: string,
  options: ListCommerceOrdersOptions = {}
): Promise<CustomerOrderSummary[]> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  return listCommerceOrdersForUser(cleanUserId, options)
}

/**
 * 14. GET ORDER DETAIL FOR USER
 */
export async function getOrderForUser(
  userId: string,
  orderId: string,
  options: GetCommerceOrderOptions = {}
): Promise<OrderDetailResult> {
  const cleanUserId = String(userId || '').trim()
  const cleanOrderId = String(orderId || '').trim()

  if (!cleanUserId) {
    throw new AccountError(401, 'UNAUTHORIZED', 'Oturum açmanız gerekmektedir.')
  }
  if (!cleanOrderId) {
    throw new AccountError(400, 'INVALID_REQUEST', 'Sipariş numarası gereklidir.')
  }

  try {
    return await getCommerceOrderById(cleanOrderId, {
      ...options,
      userId: cleanUserId,
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const cErr = err as {statusCode: number; code?: string; message: string}
      if (cErr.statusCode === 403 || cErr.statusCode === 404) {
        throw new AccountError(
          404,
          'NOT_FOUND',
          'Sipariş bulunamadı veya görüntüleme yetkiniz yok.'
        )
      }
      throw new AccountError(cErr.statusCode, cErr.code || 'COMMERCE_ERROR', cErr.message)
    }
    throw err
  }
}
