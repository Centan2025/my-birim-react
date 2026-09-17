/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CustomerProfileData,
  CustomerAddress,
  CustomerBillingProfile,
  CustomerOrderSummary,
  OrderDetailResult,
} from '../types/account'

/**
 * BİRİM Unified Account API Client (Phase 2B)
 *
 * Rules:
 * 1. All requests to `/api/account/*` MUST use credentials: 'include'.
 * 2. Never store PII in localStorage or sessionStorage.
 * 3. Never mutate server-authoritative fields (e.g. role, verification status).
 */

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  const res = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  let json: any = null
  try {
    json = await res.json()
  } catch {
    throw new Error('Sunucu geçerli bir JSON yanıtı döndürmedi.')
  }

  if (!res.ok || !json.success) {
    const errorMsg = json?.error || json?.message || `İşlem başarısız oldu (${res.status})`
    throw new Error(errorMsg)
  }

  return json as T
}

// ==========================================
// 1. Profile API
// ==========================================

export async function getAccountProfile(signal?: AbortSignal): Promise<CustomerProfileData> {
  const res = await request<{success: true; profile: CustomerProfileData}>('/api/account/profile', {
    method: 'GET',
    signal,
  })
  return res.profile
}

export interface UpdateProfilePayload {
  name?: string | null
  phone?: string | null
  company?: string | null
  profession?: string | null
  newsletter_subscribed?: boolean
  newsletterSubscribed?: boolean
}

export async function updateAccountProfile(
  payload: UpdateProfilePayload,
  signal?: AbortSignal
): Promise<CustomerProfileData> {
  const cleanPayload: Record<string, unknown> = {}
  if (payload.name !== undefined) cleanPayload['name'] = payload.name
  if (payload.phone !== undefined) cleanPayload['phone'] = payload.phone
  if (payload.company !== undefined) cleanPayload['company'] = payload.company
  if (payload.profession !== undefined) cleanPayload['profession'] = payload.profession
  if (payload.newsletter_subscribed !== undefined) {
    cleanPayload['newsletter_subscribed'] = payload.newsletter_subscribed
  } else if (payload.newsletterSubscribed !== undefined) {
    cleanPayload['newsletter_subscribed'] = payload.newsletterSubscribed
  }

  const res = await request<{success: true; profile: CustomerProfileData}>('/api/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(cleanPayload),
    signal,
  })
  return res.profile
}

// ==========================================
// 2. Addresses API
// ==========================================

export interface AddressPayload {
  label?: string
  recipientName?: string
  recipient_name?: string
  phone?: string
  addressLine1?: string
  address_line_1?: string
  addressLine2?: string | null
  address_line_2?: string | null
  city?: string
  district?: string
  postalCode?: string | null
  postal_code?: string | null
  country?: string
  isDefaultShipping?: boolean
  is_default_shipping?: boolean
}

export async function listAccountAddresses(signal?: AbortSignal): Promise<CustomerAddress[]> {
  const res = await request<{success: true; addresses: CustomerAddress[]}>(
    '/api/account/addresses',
    {method: 'GET', signal}
  )
  return res.addresses
}

export async function createAccountAddress(
  payload: AddressPayload,
  signal?: AbortSignal
): Promise<CustomerAddress> {
  const cleanPayload: Record<string, unknown> = {
    label: (payload.label || '').trim() || undefined,
    recipient_name: (payload.recipient_name || payload.recipientName || '').trim(),
    phone: (payload.phone || '').trim(),
    address_line_1: (payload.address_line_1 || payload.addressLine1 || '').trim(),
    address_line_2: payload.address_line_2 ?? payload.addressLine2 ?? null,
    city: (payload.city || 'İstanbul').trim(),
    district: (payload.district || '').trim(),
    postal_code: payload.postal_code ?? payload.postalCode ?? null,
    country: payload.country || 'Türkiye',
    is_default_shipping: Boolean(payload.is_default_shipping ?? payload.isDefaultShipping),
  }

  const res = await request<{success: true; address: CustomerAddress}>('/api/account/addresses', {
    method: 'POST',
    body: JSON.stringify(cleanPayload),
    signal,
  })
  return res.address
}

export async function updateAccountAddress(
  addressId: string,
  payload: Partial<AddressPayload>,
  signal?: AbortSignal
): Promise<CustomerAddress> {
  const cleanPayload: Record<string, unknown> = {}
  if (payload.label !== undefined) cleanPayload['label'] = payload.label.trim()
  if (payload.recipient_name !== undefined || payload.recipientName !== undefined) {
    cleanPayload['recipient_name'] = (payload.recipient_name || payload.recipientName || '').trim()
  }
  if (payload.phone !== undefined) cleanPayload['phone'] = payload.phone.trim()
  if (payload.address_line_1 !== undefined || payload.addressLine1 !== undefined) {
    cleanPayload['address_line_1'] = (payload.address_line_1 || payload.addressLine1 || '').trim()
  }
  if (payload.address_line_2 !== undefined || payload.addressLine2 !== undefined) {
    cleanPayload['address_line_2'] = payload.address_line_2 ?? payload.addressLine2 ?? null
  }
  if (payload.city !== undefined) cleanPayload['city'] = payload.city.trim()
  if (payload.district !== undefined) cleanPayload['district'] = payload.district.trim()
  if (payload.postal_code !== undefined || payload.postalCode !== undefined) {
    cleanPayload['postal_code'] = payload.postal_code ?? payload.postalCode ?? null
  }
  if (payload.country !== undefined) cleanPayload['country'] = payload.country
  if (payload.is_default_shipping !== undefined || payload.isDefaultShipping !== undefined) {
    cleanPayload['is_default_shipping'] = Boolean(
      payload.is_default_shipping ?? payload.isDefaultShipping
    )
  }

  const res = await request<{success: true; address: CustomerAddress}>(
    `/api/account/addresses/${encodeURIComponent(addressId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(cleanPayload),
      signal,
    }
  )
  return res.address
}

export async function deleteAccountAddress(addressId: string, signal?: AbortSignal): Promise<void> {
  await request<{success: true}>(`/api/account/addresses/${encodeURIComponent(addressId)}`, {
    method: 'DELETE',
    signal,
  })
}

export async function setDefaultAccountAddress(
  addressId: string,
  signal?: AbortSignal
): Promise<CustomerAddress> {
  const res = await request<{success: true; address: CustomerAddress}>(
    `/api/account/addresses/${encodeURIComponent(addressId)}/default`,
    {
      method: 'POST',
      signal,
    }
  )
  return res.address
}

// ==========================================
// 3. Billing Profiles API
// ==========================================

export interface BillingProfilePayload {
  billingType?: 'individual' | 'company'
  billing_type?: 'individual' | 'company'
  label?: string
  fullName?: string | null
  full_name?: string | null
  companyName?: string | null
  company_name?: string | null
  taxOffice?: string | null
  tax_office?: string | null
  taxNumber?: string | null
  tax_number?: string | null
  addressLine1?: string
  address_line_1?: string
  addressLine2?: string | null
  address_line_2?: string | null
  city?: string
  district?: string
  postalCode?: string | null
  postal_code?: string | null
  country?: string
  isDefault?: boolean
  is_default?: boolean
}

export async function listAccountBillingProfiles(
  signal?: AbortSignal
): Promise<CustomerBillingProfile[]> {
  const res = await request<{
    success: true
    billingProfiles: CustomerBillingProfile[]
  }>('/api/account/billing-profiles', {method: 'GET', signal})
  return res.billingProfiles
}

export async function createAccountBillingProfile(
  payload: BillingProfilePayload,
  signal?: AbortSignal
): Promise<CustomerBillingProfile> {
  const cleanPayload: Record<string, unknown> = {
    billing_type:
      (payload.billing_type || payload.billingType) === 'company' ? 'company' : 'individual',
    label: (payload.label || '').trim() || undefined,
    full_name: payload.full_name ?? payload.fullName ?? null,
    company_name: payload.company_name ?? payload.companyName ?? null,
    tax_office: payload.tax_office ?? payload.taxOffice ?? null,
    tax_number: payload.tax_number ?? payload.taxNumber ?? null,
    address_line_1: (payload.address_line_1 || payload.addressLine1 || '').trim(),
    address_line_2: payload.address_line_2 ?? payload.addressLine2 ?? null,
    city: (payload.city || 'İstanbul').trim(),
    district: (payload.district || '').trim(),
    postal_code: payload.postal_code ?? payload.postalCode ?? null,
    country: payload.country || 'Türkiye',
    is_default: Boolean(payload.is_default ?? payload.isDefault),
  }

  const res = await request<{
    success: true
    billingProfile: CustomerBillingProfile
  }>('/api/account/billing-profiles', {
    method: 'POST',
    body: JSON.stringify(cleanPayload),
    signal,
  })
  return res.billingProfile
}

export async function updateAccountBillingProfile(
  billingId: string,
  payload: Partial<BillingProfilePayload>,
  signal?: AbortSignal
): Promise<CustomerBillingProfile> {
  const cleanPayload: Record<string, unknown> = {}
  if (payload.billing_type !== undefined || payload.billingType !== undefined) {
    cleanPayload['billing_type'] =
      (payload.billing_type || payload.billingType) === 'company' ? 'company' : 'individual'
  }
  if (payload.label !== undefined) cleanPayload['label'] = payload.label.trim()
  if (payload.full_name !== undefined || payload.fullName !== undefined) {
    cleanPayload['full_name'] = payload.full_name ?? payload.fullName ?? null
  }
  if (payload.company_name !== undefined || payload.companyName !== undefined) {
    cleanPayload['company_name'] = payload.company_name ?? payload.companyName ?? null
  }
  if (payload.tax_office !== undefined || payload.taxOffice !== undefined) {
    cleanPayload['tax_office'] = payload.tax_office ?? payload.taxOffice ?? null
  }
  if (payload.tax_number !== undefined || payload.taxNumber !== undefined) {
    cleanPayload['tax_number'] = payload.tax_number ?? payload.taxNumber ?? null
  }
  if (payload.address_line_1 !== undefined || payload.addressLine1 !== undefined) {
    cleanPayload['address_line_1'] = (payload.address_line_1 || payload.addressLine1 || '').trim()
  }
  if (payload.address_line_2 !== undefined || payload.addressLine2 !== undefined) {
    cleanPayload['address_line_2'] = payload.address_line_2 ?? payload.addressLine2 ?? null
  }
  if (payload.city !== undefined) cleanPayload['city'] = payload.city.trim()
  if (payload.district !== undefined) cleanPayload['district'] = payload.district.trim()
  if (payload.postal_code !== undefined || payload.postalCode !== undefined) {
    cleanPayload['postal_code'] = payload.postal_code ?? payload.postalCode ?? null
  }
  if (payload.country !== undefined) cleanPayload['country'] = payload.country
  if (payload.is_default !== undefined || payload.isDefault !== undefined) {
    cleanPayload['is_default'] = Boolean(payload.is_default ?? payload.isDefault)
  }

  const res = await request<{
    success: true
    billingProfile: CustomerBillingProfile
  }>(`/api/account/billing-profiles/${encodeURIComponent(billingId)}`, {
    method: 'PATCH',
    body: JSON.stringify(cleanPayload),
    signal,
  })
  return res.billingProfile
}

export async function deleteAccountBillingProfile(
  billingId: string,
  signal?: AbortSignal
): Promise<void> {
  await request<{success: true}>(`/api/account/billing-profiles/${encodeURIComponent(billingId)}`, {
    method: 'DELETE',
    signal,
  })
}

export async function setDefaultAccountBillingProfile(
  billingId: string,
  signal?: AbortSignal
): Promise<CustomerBillingProfile> {
  const res = await request<{
    success: true
    billingProfile: CustomerBillingProfile
  }>(`/api/account/billing-profiles/${encodeURIComponent(billingId)}/default`, {
    method: 'POST',
    signal,
  })
  return res.billingProfile
}

// ==========================================
// 4. Orders API
// ==========================================

export async function listAccountOrders(signal?: AbortSignal): Promise<CustomerOrderSummary[]> {
  const res = await request<{success: true; orders: CustomerOrderSummary[]}>(
    '/api/account/orders',
    {method: 'GET', signal}
  )
  return res.orders
}

export async function getAccountOrderDetail(
  orderId: string,
  signal?: AbortSignal
): Promise<OrderDetailResult> {
  const res = await request<{success: true; order: OrderDetailResult}>(
    `/api/account/orders/${encodeURIComponent(orderId)}`,
    {method: 'GET', signal}
  )
  return res.order
}
