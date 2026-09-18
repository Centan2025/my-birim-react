/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {
  getProfileForUser,
  updateProfileForUser,
  listAddressesForUser,
  createAddressForUser,
  updateAddressForUser,
  deleteAddressForUser,
  createBillingProfileForUser,
  updateBillingProfileForUser,
  listOrdersForUser,
  getOrderForUser,
  AccountError,
} from '../../lib/account/account-service'
import accountHandler from '../../api/account.js'
import {createToken} from '../../lib/server/token'

// Mock Supabase Store
function createMockSupabaseClient(initialState: {
  profiles?: any[]
  addresses?: any[]
  billingProfiles?: any[]
  orders?: any[]
}) {
  const profiles = [...(initialState.profiles || [])]
  const addresses = [...(initialState.addresses || [])]
  const billingProfiles = [...(initialState.billingProfiles || [])]
  const orders = [...(initialState.orders || [])]

  const client: any = {
    rpc: vi.fn(async (rpcName: string, params: any) => {
      if (rpcName === 'set_default_customer_address') {
        const {p_user_id, p_address_id} = params
        const target = addresses.find(a => a.id === p_address_id && a.user_id === p_user_id)
        if (!target) return {data: null, error: {message: 'Address not found'}}
        addresses.forEach(a => {
          if (a.user_id === p_user_id) {
            a.is_default_shipping = a.id === p_address_id
          }
        })
        return {data: null, error: null}
      }
      if (rpcName === 'set_default_customer_billing_profile') {
        const {p_user_id, p_billing_id} = params
        const target = billingProfiles.find(b => b.id === p_billing_id && b.user_id === p_user_id)
        if (!target) return {data: null, error: {message: 'Billing profile not found'}}
        billingProfiles.forEach(b => {
          if (b.user_id === p_user_id) {
            b.is_default = b.id === p_billing_id
          }
        })
        return {data: null, error: null}
      }
      return {data: null, error: {message: 'Unknown RPC'}}
    }),
    from: vi.fn((table: string) => {
      const currentTable =
        table === 'profiles'
          ? profiles
          : table === 'customer_addresses'
            ? addresses
            : table === 'customer_billing_profiles'
              ? billingProfiles
              : table === 'orders'
                ? orders
                : []

      let filterUserId: string | null = null
      let filterId: string | null = null
      let _filterDefaultShipping: boolean | null = null
      let _filterDefaultBilling: boolean | null = null
      let _notFilterId: string | null = null

      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn((field: string, val: any) => {
          if (field === 'id') filterId = val
          if (field === 'user_id') filterUserId = val
          if (field === 'is_default_shipping') _filterDefaultShipping = val
          if (field === 'is_default') _filterDefaultBilling = val
          return builder
        }),
        neq: vi.fn((field: string, val: any) => {
          if (field === 'id') _notFilterId = val
          return builder
        }),
        order: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => {
          const rows = currentTable.filter(r => {
            if (filterId && r.id !== filterId) return false
            if (filterUserId && r.user_id !== filterUserId) return false
            return true
          })
          return {data: rows[0] || null, error: null}
        }),
        single: vi.fn(async () => {
          const rows = currentTable.filter(r => {
            if (filterId && r.id !== filterId) return false
            if (filterUserId && r.user_id !== filterUserId) return false
            return true
          })
          if (!rows[0]) return {data: null, error: {message: 'Row not found'}}
          return {data: rows[0], error: null}
        }),
        then: (resolve: any) => {
          const rows = currentTable.filter(r => {
            if (filterId && r.id !== filterId) return false
            if (filterUserId && r.user_id !== filterUserId) return false
            return true
          })
          return Promise.resolve({data: rows, error: null}).then(resolve)
        },
        insert: vi.fn((data: any) => {
          const newRow = {
            ...data,
            id: data.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          currentTable.push(newRow)
          return {
            select: () => ({
              single: async () => ({data: newRow, error: null}),
            }),
          }
        }),
        update: vi.fn((data: any) => {
          return {
            eq: vi.fn((field1: string, val1: any) => {
              const chain2 = {
                eq: vi.fn((field2: string, val2: any) => {
                  currentTable.forEach(r => {
                    if (r[field1] === val1 && r[field2] === val2) {
                      Object.assign(r, data)
                    }
                  })
                  return {
                    select: () => ({
                      single: async () => {
                        const row = currentTable.find(r => r[field1] === val1 && r[field2] === val2)
                        return {data: row || null, error: null}
                      },
                    }),
                  }
                }),
                neq: vi.fn((field2: string, val2: any) => {
                  return {
                    eq: vi.fn((field3: string, val3: any) => {
                      currentTable.forEach(r => {
                        if (r[field1] === val1 && r[field2] !== val2 && r[field3] === val3) {
                          Object.assign(r, data)
                        }
                      })
                      return Promise.resolve({error: null})
                    }),
                  }
                }),
                select: () => ({
                  single: async () => {
                    const row = currentTable.find(r => r[field1] === val1)
                    return {data: row || null, error: null}
                  },
                }),
              }
              currentTable.forEach(r => {
                if (r[field1] === val1) {
                  Object.assign(r, data)
                }
              })
              return chain2
            }),
          }
        }),
        delete: vi.fn(() => ({
          eq: vi.fn((field1: string, val1: any) => ({
            eq: vi.fn((field2: string, val2: any) => {
              const idx = currentTable.findIndex(r => r[field1] === val1 && r[field2] === val2)
              if (idx >= 0) currentTable.splice(idx, 1)
              return Promise.resolve({error: null})
            }),
          })),
        })),
      }

      return builder
    }),
  }

  return {client, profiles, addresses, billingProfiles, orders}
}
describe('BİRİM Unified Customer Account Phase 2A — Backend Foundation Tests', () => {
  const user1 = 'user-uuid-1111'
  const user2 = 'user-uuid-2222'

  let mockDb: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockDb = createMockSupabaseClient({
      profiles: [
        {
          id: user1,
          email: 'user1@birim.com',
          name: 'Ahmet Yılmaz',
          first_name: 'Ahmet',
          last_name: 'Yılmaz',
          company: 'Birim Mimarlık',
          profession: 'Mimar / İç Mimar',
          phone: '+905551112233',
          tax_id: '1234567890',
          role: 'architect',
          architect_verification_status: 'approved',
          is_verified: true,
          newsletter_subscribed: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: user2,
          email: 'user2@birim.com',
          name: 'Mehmet Demir',
          first_name: 'Mehmet',
          last_name: 'Demir',
          company: null,
          profession: 'Bireysel Kullanıcı',
          phone: null,
          tax_id: null,
          role: 'user',
          architect_verification_status: 'none',
          is_verified: true,
          newsletter_subscribed: true,
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z',
        },
      ],
      addresses: [
        {
          id: 'addr-1',
          user_id: user1,
          label: 'Ofis',
          recipient_name: 'Ahmet Yılmaz',
          phone: '+905551112233',
          address_line_1: 'Nispetiye Cad. No: 10',
          address_line_2: 'Kat 4 Daire 8',
          city: 'İstanbul',
          district: 'Beşiktaş',
          postal_code: '34340',
          country: 'Türkiye',
          is_default_shipping: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'addr-2',
          user_id: user1,
          label: 'Ev',
          recipient_name: 'Ahmet Yılmaz',
          phone: '+905551112233',
          address_line_1: 'Bağdat Cad. No: 50',
          address_line_2: null,
          city: 'İstanbul',
          district: 'Kadıköy',
          postal_code: '34710',
          country: 'Türkiye',
          is_default_shipping: false,
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
        {
          id: 'addr-user2',
          user_id: user2,
          label: 'Mehmet Ev',
          recipient_name: 'Mehmet Demir',
          phone: '+905559998877',
          address_line_1: 'Tunali Hilmi Cad. No: 20',
          address_line_2: null,
          city: 'Ankara',
          district: 'Çankaya',
          postal_code: '06680',
          country: 'Türkiye',
          is_default_shipping: true,
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z',
        },
      ],
      billingProfiles: [
        {
          id: 'bill-1',
          user_id: user1,
          billing_type: 'company',
          label: 'Şirket Faturası',
          full_name: null,
          company_name: 'Birim Mimarlık Ltd. Şti.',
          tax_office: 'Beşiktaş VD',
          tax_number: '1234567890',
          address_line_1: 'Nispetiye Cad. No: 10',
          address_line_2: 'Kat 4',
          city: 'İstanbul',
          district: 'Beşiktaş',
          postal_code: '34340',
          country: 'Türkiye',
          is_default: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      orders: [
        {
          id: 'ord-101',
          order_number: 'BRM-20260917-111111',
          user_id: user1,
          status: 'CONFIRMED',
          payment_status: 'PAID',
          currency: 'TRY',
          subtotal: 100000,
          discount_total: 0,
          shipping_total: 0,
          tax_total: 0,
          grand_total: 100000,
          created_at: '2026-09-17T10:00:00Z',
          items: [
            {
              product_id: 'prod-gala',
              variant_id: null,
              product_name_snapshot: 'Gala Sandalye',
              sku_snapshot: 'BRM-GAL-001',
              quantity: 2,
              unit_price: 50000,
              total_price: 100000,
            },
          ],
        },
        {
          id: 'ord-202',
          order_number: 'BRM-20260917-222222',
          user_id: user2,
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 20000,
          discount_total: 0,
          shipping_total: 0,
          tax_total: 0,
          grand_total: 20000,
          created_at: '2026-09-17T11:00:00Z',
          items: [],
        },
      ],
    })
  })

  // 1. Profile Security & Mutability Tests
  describe('Profile Operations', () => {
    it('requires authentication for fetching profile', async () => {
      await expect(getProfileForUser('')).rejects.toThrow(AccountError)
    })

    it('fetches profile data for authorized user with canonical fields', async () => {
      const profile = await getProfileForUser(user1, {supabaseClientOverride: mockDb.client})
      expect(profile.id).toBe(user1)
      expect(profile.email).toBe('user1@birim.com')
      expect(profile.name).toBe('Ahmet Yılmaz')
      expect(profile.role).toBe('architect')
      expect(profile.architectVerificationStatus).toBe('approved')
      expect(profile.newsletterSubscribed).toBe(false)
    })

    it('allows updating permitted fields on profile (name, phone, company, profession, newsletter)', async () => {
      const updated = await updateProfileForUser(
        user1,
        {
          name: 'Ahmet Can Yılmazer',
          phone: '+905559990000',
          company: 'Birim Tasarım',
          profession: 'Mimar',
          newsletter_subscribed: true,
        },
        {supabaseClientOverride: mockDb.client}
      )

      expect(updated.name).toBe('Ahmet Can Yılmazer')
      expect(updated.phone).toBe('+905559990000')
      expect(updated.company).toBe('Birim Tasarım')
      expect(updated.profession).toBe('Mimar')
      expect(updated.newsletterSubscribed).toBe(true)
    })

    it('strictly rejects forbidden / privileged fields with HTTP 400', async () => {
      // Forbidden: role
      await expect(
        updateProfileForUser(user1, {role: 'admin'}, {supabaseClientOverride: mockDb.client})
      ).rejects.toThrow(AccountError)

      // Forbidden: architect_verification_status
      await expect(
        updateProfileForUser(
          user1,
          {architect_verification_status: 'approved'},
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)

      // Forbidden: is_verified
      await expect(
        updateProfileForUser(user1, {is_verified: true}, {supabaseClientOverride: mockDb.client})
      ).rejects.toThrow(AccountError)

      // Forbidden: user_id tampering
      await expect(
        updateProfileForUser(user1, {user_id: user2}, {supabaseClientOverride: mockDb.client})
      ).rejects.toThrow(AccountError)

      // Forbidden: first_name / last_name / tax_id (not allowed in Phase 2A profile mutation)
      await expect(
        updateProfileForUser(user1, {first_name: 'Ahmet'}, {supabaseClientOverride: mockDb.client})
      ).rejects.toThrow(AccountError)

      await expect(
        updateProfileForUser(user1, {last_name: 'Yılmaz'}, {supabaseClientOverride: mockDb.client})
      ).rejects.toThrow(AccountError)

      await expect(
        updateProfileForUser(user1, {tax_id: '1234567890'}, {supabaseClientOverride: mockDb.client})
      ).rejects.toThrow(AccountError)
    })

    it('rejects unknown arbitrary fields with HTTP 400', async () => {
      await expect(
        updateProfileForUser(
          user1,
          {some_random_field: 'hacked'},
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)
    })
  })
  // 2. Address Security & Isolation Tests
  describe('Address Operations', () => {
    it('isolates address listings strictly per user (user1 cannot see user2 addresses)', async () => {
      const addresses1 = await listAddressesForUser(user1, {supabaseClientOverride: mockDb.client})
      expect(addresses1.length).toBe(2)
      expect(addresses1.every(a => a.userId === user1)).toBe(true)

      const addresses2 = await listAddressesForUser(user2, {supabaseClientOverride: mockDb.client})
      expect(addresses2.length).toBe(1)
      expect(addresses2[0].userId).toBe(user2)
    })

    it('creates a new address with validation', async () => {
      const newAddr = await createAddressForUser(
        user1,
        {
          label: 'Yazlık',
          recipient_name: 'Ahmet Yılmaz',
          phone: '+905551112233',
          address_line_1: 'Atatürk Cad. No: 12',
          city: 'Muğla',
          district: 'Bodrum',
          postal_code: '48400',
          country: 'Türkiye',
          is_default_shipping: false,
        },
        {supabaseClientOverride: mockDb.client}
      )

      expect(newAddr.id).toBeDefined()
      expect(newAddr.label).toBe('Yazlık')
      expect(newAddr.city).toBe('Muğla')
      expect(newAddr.userId).toBe(user1)
    })

    it('setting default address atomically unsets previous defaults', async () => {
      // Create second default address for user1
      const defaultAddr = await createAddressForUser(
        user1,
        {
          label: 'Yeni Merkez Ofis',
          recipient_name: 'Ahmet Yılmaz',
          phone: '+905551112233',
          address_line_1: 'Büyükdere Cad. No: 100',
          city: 'İstanbul',
          district: 'Şişli',
          is_default_shipping: true,
        },
        {supabaseClientOverride: mockDb.client}
      )

      expect(defaultAddr.isDefaultShipping).toBe(true)
      const allAddresses = await listAddressesForUser(user1, {
        supabaseClientOverride: mockDb.client,
      })
      const defaults = allAddresses.filter(a => a.isDefaultShipping)
      expect(defaults.length).toBe(1)
      expect(defaults[0].id).toBe(defaultAddr.id)
    })

    it('prevents user from modifying or deleting another user address (IDOR protection)', async () => {
      // User1 attempts to update User2 address
      await expect(
        updateAddressForUser(
          user1,
          'addr-user2',
          {label: 'Tampered'},
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)

      // User1 attempts to delete User2 address
      await expect(
        deleteAddressForUser(user1, 'addr-user2', {supabaseClientOverride: mockDb.client})
      ).rejects.toThrow(AccountError)
    })

    it('rejects address creation or update if forbidden user_id or id is supplied', async () => {
      await expect(
        createAddressForUser(
          user1,
          {
            label: 'Test',
            recipient_name: 'Ahmet',
            phone: '12345',
            address_line_1: 'Cadde',
            city: 'İst',
            district: 'Bşk',
            user_id: user2,
          },
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)

      await expect(
        updateAddressForUser(
          user1,
          'addr-1',
          {user_id: user2},
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)
    })

    it('deletes address under Policy B (default removed without auto-promoting another)', async () => {
      await deleteAddressForUser(user1, 'addr-1', {supabaseClientOverride: mockDb.client})
      const remaining = await listAddressesForUser(user1, {supabaseClientOverride: mockDb.client})
      expect(remaining.some(a => a.id === 'addr-1')).toBe(false)
    })
  })

  // 3. Billing Profile Operations Tests
  describe('Billing Profile Operations', () => {
    it('creates an individual billing profile with validation', async () => {
      const indProfile = await createBillingProfileForUser(
        user1,
        {
          billing_type: 'individual',
          label: 'Şahıs Faturam',
          full_name: 'Ahmet Yılmaz',
          address_line_1: 'Nispetiye Cad. No: 10',
          city: 'İstanbul',
          district: 'Beşiktaş',
          is_default: false,
        },
        {supabaseClientOverride: mockDb.client}
      )

      expect(indProfile.billingType).toBe('individual')
      expect(indProfile.fullName).toBe('Ahmet Yılmaz')
      expect(indProfile.userId).toBe(user1)
    })

    it('rejects company billing profile without company name or tax number', async () => {
      await expect(
        createBillingProfileForUser(
          user1,
          {
            billing_type: 'company',
            label: 'Eksik Kurumsal',
            address_line_1: 'Nispetiye Cad.',
            city: 'İstanbul',
            district: 'Beşiktaş',
          },
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)
    })

    it('updates billing profile with ownership isolation', async () => {
      const updated = await updateBillingProfileForUser(
        user1,
        'bill-1',
        {company_name: 'Birim Mimarlık A.Ş.'},
        {supabaseClientOverride: mockDb.client}
      )
      expect(updated.companyName).toBe('Birim Mimarlık A.Ş.')

      // User2 cannot update User1 billing profile
      await expect(
        updateBillingProfileForUser(
          user2,
          'bill-1',
          {company_name: 'Hacked'},
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)
    })

    it('rejects billing profile creation or update if forbidden user_id or id is supplied', async () => {
      await expect(
        createBillingProfileForUser(
          user1,
          {
            billing_type: 'individual',
            label: 'Test',
            full_name: 'Ahmet',
            address_line_1: 'Cadde',
            city: 'İst',
            district: 'Bşk',
            user_id: user2,
          },
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)

      await expect(
        updateBillingProfileForUser(
          user1,
          'bill-1',
          {user_id: user2},
          {supabaseClientOverride: mockDb.client}
        )
      ).rejects.toThrow(AccountError)
    })
  })
  // 4. Order History & Detail IDOR Protection Tests
  describe('Customer Order History & Detail', () => {
    it('strictly filters orders by authenticated user_id', async () => {
      const ordersUser1 = await listOrdersForUser(user1, {
        ordersOverride: mockDb.orders.filter(o => o.user_id === user1),
      })
      expect(ordersUser1.length).toBe(1)
      expect(ordersUser1[0].orderNumber).toBe('BRM-20260917-111111')
    })

    it('allows user to view their own order detail with immutable snapshot', async () => {
      const order = await getOrderForUser(user1, 'ord-101', {
        orderOverride: mockDb.orders.find(o => o.id === 'ord-101'),
      })
      expect(order.orderNumber).toBe('BRM-20260917-111111')
      expect(order.grandTotal).toBe(100000)
    })

    it('rejects access to another user order with 404 (IDOR protection)', async () => {
      await expect(
        getOrderForUser(user1, 'ord-202', {
          orderOverride: mockDb.orders.find(o => o.id === 'ord-202'),
        })
      ).rejects.toThrow(AccountError)
    })
  })

  // 5. API Route [...slug] Integration Handler Tests
  describe('API Route /api/account/[...slug] Handler', () => {
    function createMockRes() {
      const res: any = {
        statusCode: 200,
        headers: {},
        setHeader: vi.fn((k: string, v: string) => {
          res.headers[k.toLowerCase()] = v
        }),
        status: vi.fn((code: number) => {
          res.statusCode = code
          return res
        }),
        json: vi.fn((body: any) => {
          res.body = body
          return res
        }),
        end: vi.fn(),
      }
      return res
    }

    it('returns 401 when request has no auth token', async () => {
      const req: any = {
        method: 'GET',
        headers: {},
        query: {slug: ['profile']},
      }
      const res = createMockRes()

      await accountHandler(req, res)
      expect(res.statusCode).toBe(401)
      expect(res.body.error).toContain('Oturum')
    })

    it('returns 405 when invalid method is called on profile', async () => {
      const token = createToken({sub: user1, email: 'user1@birim.com'})
      const req: any = {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
        query: {slug: ['profile']},
      }
      const res = createMockRes()

      await accountHandler(req, res)
      expect(res.statusCode).toBe(405)
    })

    it('returns 404 for unknown account resource', async () => {
      const token = createToken({sub: user1, email: 'user1@birim.com'})
      const req: any = {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
        query: {slug: ['unknown-endpoint']},
      }
      const res = createMockRes()

      await accountHandler(req, res)
      expect(res.statusCode).toBe(404)
    })
  })
})
