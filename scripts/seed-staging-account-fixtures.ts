/**
 * BİRİM UNIFIED CUSTOMER ACCOUNT — STAGING ACCOUNT FIXTURES SEEDER
 *
 * SAFETY RULES:
 * 1. Strictly prohibited on production database.
 * 2. Only generates deterministic fake test identities (USER A, USER B, USER C, USER D, USER E).
 * 3. Uses obviously fake PII and schema-valid test tax numbers.
 * 4. Generates deterministic addresses, billing profiles, and order snapshots.
 */

export interface TestCustomerAccount {
  id: string
  email: string
  name: string
  role: 'user' | 'member' | 'architect'
  architectVerificationStatus: 'none' | 'pending' | 'approved' | 'rejected'
  company?: string
  profession?: string
  phone?: string
  newsletterSubscribed: boolean
  addresses: Array<{
    id: string
    label: string
    recipientName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    district: string
    postalCode: string
    country: string
    isDefaultShipping: boolean
  }>
  billingProfiles: Array<{
    id: string
    billingType: 'individual' | 'company'
    label: string
    fullName?: string
    companyName?: string
    taxOffice?: string
    taxNumber?: string
    addressLine1: string
    addressLine2?: string
    city: string
    district: string
    postalCode: string
    country: string
    isDefault: boolean
  }>
  orders: Array<{
    id: string
    orderNumber: string
    status: 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'CANCELLED'
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
    currency: string
    subtotal: number
    shippingTotal: number
    taxTotal: number
    grandTotal: number
    productNameSnapshot: string
    skuSnapshot: string
    selectedOptionsSnapshot?: Record<string, unknown>
    shippingAddressSnapshot: Record<string, unknown>
    billingAddressSnapshot: Record<string, unknown>
    createdAt: string
  }>
}

/**
 * Deterministic Test Customer Identities
 */
export const STAGING_TEST_CUSTOMERS: Record<string, TestCustomerAccount> = {
  // USER A: Standard member with multiple addresses, billing profile, and orders
  USER_A_STANDARD: {
    id: 'usr-test-standard-001',
    email: 'customer-standard@test.birim.invalid',
    name: 'TEST CUSTOMER 01',
    role: 'member',
    architectVerificationStatus: 'none',
    phone: '+905550001122',
    company: 'TEST STUDIO',
    profession: 'İç Mimar',
    newsletterSubscribed: true,
    addresses: [
      {
        id: 'addr-test-001',
        label: 'Ev - Kadıköy',
        recipientName: 'TEST CUSTOMER 01',
        phone: '+905550001122',
        addressLine1: 'Test Mah. Moda Cad. No: 10 D: 4',
        addressLine2: 'Moda',
        city: 'İstanbul',
        district: 'Kadıköy',
        postalCode: '34710',
        country: 'TR',
        isDefaultShipping: true,
      },
      {
        id: 'addr-test-002',
        label: 'Atölye - Beşiktaş',
        recipientName: 'TEST CUSTOMER 01',
        phone: '+905550001122',
        addressLine1: 'Test Mah. Nispetiye Cad. No: 40 K: 2',
        addressLine2: 'Levent',
        city: 'İstanbul',
        district: 'Beşiktaş',
        postalCode: '34340',
        country: 'TR',
        isDefaultShipping: false,
      },
    ],
    billingProfiles: [
      {
        id: 'bill-test-001',
        billingType: 'company',
        label: 'Test Mimarlık Şirketi',
        companyName: 'TEST MİMARLIK TASARIM LTD. ŞTİ.',
        taxOffice: 'Kadıköy VD',
        taxNumber: '1111111111',
        addressLine1: 'Test Mah. Moda Cad. No: 10 D: 4',
        city: 'İstanbul',
        district: 'Kadıköy',
        postalCode: '34710',
        country: 'TR',
        isDefault: true,
      },
    ],
    orders: [
      {
        id: 'ord-test-001',
        orderNumber: 'BRM-2026-TEST-001',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        currency: 'TRY',
        subtotal: 45000,
        shippingTotal: 0,
        taxTotal: 9000,
        grandTotal: 45000,
        productNameSnapshot: 'Kav Koltuk (Test Snapshot)',
        skuSnapshot: 'BRM-KAV-DIR-01',
        selectedOptionsSnapshot: {finish: 'Meşe', fabric: 'Luna Beige'},
        shippingAddressSnapshot: {
          recipientName: 'TEST CUSTOMER 01',
          addressLine1: 'Test Mah. Moda Cad. No: 10 D: 4',
          city: 'İstanbul',
          district: 'Kadıköy',
          country: 'TR',
        },
        billingAddressSnapshot: {
          companyName: 'TEST MİMARLIK TASARIM LTD. ŞTİ.',
          taxOffice: 'Kadıköy VD',
          taxNumber: '1111111111',
          addressLine1: 'Test Mah. Moda Cad. No: 10 D: 4',
          city: 'İstanbul',
          district: 'Kadıköy',
          country: 'TR',
        },
        createdAt: '2026-09-10T14:30:00Z',
      },
    ],
  },

  // USER B: Architect Pending Verification
  USER_B_ARCHITECT_PENDING: {
    id: 'usr-test-architect-pending-002',
    email: 'customer-architect-pending@test.birim.invalid',
    name: 'TEST ARCHITECT PENDING',
    role: 'architect',
    architectVerificationStatus: 'pending',
    phone: '+905550003344',
    company: 'PENDING ARCHITECTURE OFFICE',
    profession: 'Mimar',
    newsletterSubscribed: false,
    addresses: [],
    billingProfiles: [],
    orders: [],
  },

  // USER C: Architect Approved Verification
  USER_C_ARCHITECT_APPROVED: {
    id: 'usr-test-architect-approved-003',
    email: 'customer-architect-approved@test.birim.invalid',
    name: 'TEST ARCHITECT APPROVED',
    role: 'architect',
    architectVerificationStatus: 'approved',
    phone: '+905550005566',
    company: 'VERIFIED ARCHITECTURE LTD.',
    profession: 'Baş Mimar',
    newsletterSubscribed: true,
    addresses: [],
    billingProfiles: [],
    orders: [],
  },

  // USER D: Empty Account
  USER_D_EMPTY: {
    id: 'usr-test-empty-004',
    email: 'customer-empty@test.birim.invalid',
    name: 'TEST EMPTY ACCOUNT',
    role: 'user',
    architectVerificationStatus: 'none',
    newsletterSubscribed: false,
    addresses: [],
    billingProfiles: [],
    orders: [],
  },

  // USER E: Edge Cases (Multiple orders, no default address, individual billing)
  USER_E_EDGE: {
    id: 'usr-test-edge-005',
    email: 'customer-edge@test.birim.invalid',
    name: 'TEST EDGE CASE CUSTOMER',
    role: 'member',
    architectVerificationStatus: 'none',
    phone: '+905550007788',
    newsletterSubscribed: false,
    addresses: [
      {
        id: 'addr-test-005',
        label: 'Depo',
        recipientName: 'TEST RECEIVER',
        phone: '+905550007788',
        addressLine1: 'Organize Sanayi Bölgesi 4. Cadde No: 12',
        city: 'Kocaeli',
        district: 'Gebze',
        postalCode: '41400',
        country: 'TR',
        isDefaultShipping: false,
      },
    ],
    billingProfiles: [
      {
        id: 'bill-test-005',
        billingType: 'individual',
        label: 'Bireysel',
        fullName: 'TEST EDGE CASE CUSTOMER',
        taxNumber: '99999999999',
        addressLine1: 'Organize Sanayi Bölgesi 4. Cadde No: 12',
        city: 'Kocaeli',
        district: 'Gebze',
        postalCode: '41400',
        country: 'TR',
        isDefault: false,
      },
    ],
    orders: [],
  },
}

/**
 * Hard Safety Guard: Throws if environment is not staging/test.
 */
export function assertSafeStagingEnvironment(): void {
  const isProd = process.env.NODE_ENV === 'production'
  const dbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''

  if (isProd) {
    throw new Error(
      '[CRITICAL SAFETY VIOLATION] Staging fixture script cannot run in production environment!'
    )
  }

  if (dbUrl.includes('production') || dbUrl.includes('prod')) {
    throw new Error('[CRITICAL SAFETY VIOLATION] Database URL appears to point to production!')
  }
}
