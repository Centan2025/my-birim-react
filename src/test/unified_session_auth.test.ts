import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {createToken, setAuthCookie, clearAuthCookie} from '../../lib/server/token'
import {isOriginAllowed, handleCors} from '../../lib/server/cors'
import {createOrderRequestSchema} from '../../lib/commerce/order-schemas'
import {createCommerceOrder} from '../../lib/commerce/order-service'
import authHandler from '../../api/auth/[action]'
import * as supabaseAdminModule from '../../lib/server/supabaseAdmin'

// Helper to create mock VercelRequest
function createMockReq(options: {
  method?: string
  query?: Record<string, string | string[]>
  url?: string
  headers?: Record<string, string>
  body?: unknown
}): VercelRequest {
  return {
    method: options.method || 'GET',
    query: options.query || {},
    url: options.url || '/api/auth/session',
    headers: options.headers || {},
    body: options.body || null,
  } as unknown as VercelRequest
}

// Helper to create mock VercelResponse
function createMockRes() {
  const state = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    ended: false,
  }

  const res = {
    status(code: number) {
      state.statusCode = code
      return res
    },
    setHeader(name: string, value: string) {
      state.headers[name.toLowerCase()] = value
      return res
    },
    json(data: unknown) {
      state.body = data
      state.ended = true
      return res
    },
    end() {
      state.ended = true
      return res
    },
  } as unknown as VercelResponse

  return {res, state}
}

describe('Unified Customer Account — Phase 1: Central Auth Session & Shop SSO', () => {
  const originalNodeEnv = process.env['NODE_ENV']
  const originalJwtSecret = process.env['JWT_SECRET']

  beforeEach(() => {
    vi.clearAllMocks()
    process.env['NODE_ENV'] = 'test'
    process.env['JWT_SECRET'] = 'test_jwt_secret_for_unified_session_2026'
  })

  afterEach(() => {
    process.env['NODE_ENV'] = originalNodeEnv
    process.env['JWT_SECRET'] = originalJwtSecret
  })

  describe('1. CORS & Credentialed Origin Verification for Shop', () => {
    it('allows exact origin https://shop.birim.com and sets Allow-Credentials: true', () => {
      expect(isOriginAllowed('https://shop.birim.com')).toBe(true)

      const {res, state} = createMockRes()
      const req = createMockReq({
        headers: {origin: 'https://shop.birim.com'},
      })

      handleCors(req, res, {allowCredentials: true})
      expect(state.headers['access-control-allow-origin']).toBe('https://shop.birim.com')
      expect(state.headers['access-control-allow-credentials']).toBe('true')
    })

    it('rejects unauthorized third-party origins and does not set credentials', () => {
      expect(isOriginAllowed('https://malicious-shop.com')).toBe(false)

      const {res, state} = createMockRes()
      const req = createMockReq({
        headers: {origin: 'https://malicious-shop.com'},
      })

      handleCors(req, res, {allowCredentials: true})
      // When origin is disallowed, falls back to default safe origin and does NOT allow credentials
      expect(state.headers['access-control-allow-origin']).toBe('https://www.birim.com')
      expect(state.headers['access-control-allow-credentials']).toBeUndefined()
    })
  })

  describe('2. Cookie Hardening & Environment Safety', () => {
    it('sets HttpOnly, Path=/, SameSite=Lax and Secure in production', () => {
      process.env['NODE_ENV'] = 'production'
      const {res, state} = createMockRes()
      const testToken = createToken({sub: 'user-123', email: 'test@birim.com'})

      setAuthCookie(res, testToken)
      const setCookie = state.headers['set-cookie']

      expect(setCookie).toContain('birim_token=')
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('SameSite=Lax')
      expect(setCookie).toContain('Path=/')
      expect(setCookie).toContain('Secure')
      // Crucial: Must be Host-Only (NO Domain=.birim.com)
      expect(setCookie).not.toContain('Domain=')
    })

    it('omits Secure in development so localhost cookies work cleanly', () => {
      process.env['NODE_ENV'] = 'development'
      const {res, state} = createMockRes()
      const testToken = createToken({sub: 'user-123', email: 'test@birim.com'})

      setAuthCookie(res, testToken)
      const setCookie = state.headers['set-cookie']

      expect(setCookie).toContain('birim_token=')
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('Path=/')
      expect(setCookie).not.toContain('Secure')
      expect(setCookie).not.toContain('Domain=')
    })

    it('clears auth cookie properly with Max-Age=0 and matching Secure in production', () => {
      process.env['NODE_ENV'] = 'production'
      const {res, state} = createMockRes()

      clearAuthCookie(res)
      const setCookie = state.headers['set-cookie']

      expect(setCookie).toContain('birim_token=;')
      expect(setCookie).toContain('Max-Age=0')
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('Secure')
    })
  })

  describe('3. Central Session Endpoint (/api/auth/session)', () => {
    it('returns { authenticated: false, user: null } when no cookie is present', async () => {
      const {res, state} = createMockRes()
      const req = createMockReq({
        query: {action: 'session'},
        url: '/api/auth/session',
      })

      await authHandler(req, res)

      expect(state.statusCode).toBe(200)
      expect(state.body).toEqual({authenticated: false, user: null})
    })

    it('returns { authenticated: false, user: null } when cookie is invalid or expired', async () => {
      const {res, state} = createMockRes()
      const req = createMockReq({
        query: {action: 'session'},
        url: '/api/auth/session',
        headers: {cookie: 'birim_token=invalid.tampered.signature'},
      })

      await authHandler(req, res)

      expect(state.statusCode).toBe(200)
      expect(state.body).toEqual({authenticated: false, user: null})
    })

    it('returns fresh profile and verified status when valid session cookie is provided', async () => {
      const userId = 'usr-uuid-777'
      const testToken = createToken({sub: userId, email: 'mimar@birim.com', role: 'architect'})

      // Mock fresh profile in Supabase
      const mockProfile = {
        id: userId,
        email: 'mimar@birim.com',
        name: 'Selin Mimar',
        first_name: 'Selin',
        last_name: 'Mimar',
        company: 'Selin Mimarlık Ltd.',
        profession: 'İç Mimar',
        role: 'architect',
        architect_verification_status: 'approved',
        is_verified: true,
        created_at: '2026-09-01T10:00:00Z',
      }

      const mockSupabaseAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({data: mockProfile, error: null}),
            }),
          }),
        }),
      }

      vi.spyOn(supabaseAdminModule, 'getSafeSupabaseAdmin').mockReturnValue(
        mockSupabaseAdmin as unknown as import('@supabase/supabase-js').SupabaseClient
      )

      const {res, state} = createMockRes()
      const req = createMockReq({
        query: {action: 'session'},
        url: '/api/auth/session',
        headers: {cookie: `birim_token=${testToken}`},
      })

      await authHandler(req, res)

      expect(state.statusCode).toBe(200)
      const resBody = state.body as {authenticated: boolean; user: Record<string, unknown>}
      expect(resBody.authenticated).toBe(true)
      expect(resBody.user).toBeDefined()
      expect(resBody.user.id).toBe(userId)
      expect(resBody.user.email).toBe('mimar@birim.com')
      expect(resBody.user.fullName).toBe('Selin Mimar')
      expect(resBody.user.role).toBe('architect')
      expect(resBody.user.architectVerificationStatus).toBe('approved')
      // No raw tokens or secrets in response
      expect(resBody.user).not.toHaveProperty('token')
      expect(resBody.user).not.toHaveProperty('jwt')
      expect(resBody.user).not.toHaveProperty('secret')
      expect(resBody.user).not.toHaveProperty('password')
    })

    it('resolves updated DB status even if JWT claim is stale (Profile Freshness)', async () => {
      const userId = 'usr-fresh-check'
      // Old token claims role is consumer/member
      const staleToken = createToken({sub: userId, email: 'updated@birim.com', role: 'consumer'})

      // DB has been updated by admin to architect + approved
      const updatedProfile = {
        id: userId,
        email: 'updated@birim.com',
        name: 'Can Mimar',
        role: 'architect',
        architect_verification_status: 'approved',
        is_verified: true,
        created_at: '2026-09-01T10:00:00Z',
      }

      const mockSupabaseAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({data: updatedProfile, error: null}),
            }),
          }),
        }),
      }

      vi.spyOn(supabaseAdminModule, 'getSafeSupabaseAdmin').mockReturnValue(
        mockSupabaseAdmin as unknown as import('@supabase/supabase-js').SupabaseClient
      )

      const {res, state} = createMockRes()
      const req = createMockReq({
        query: {action: 'session'},
        url: '/api/auth/session',
        headers: {cookie: `birim_token=${staleToken}`},
      })

      await authHandler(req, res)

      expect(state.statusCode).toBe(200)
      const resBody = state.body as {authenticated: boolean; user: Record<string, unknown>}
      expect(resBody.authenticated).toBe(true)
      expect(resBody.user.role).toBe('architect')
      expect(resBody.user.architectVerificationStatus).toBe('approved')
    })
  })

  describe('4. Strict Order Ownership & Spoofing Protection', () => {
    const validCheckout = {
      customerType: 'INDIVIDUAL' as const,
      customer: {
        firstName: 'Zeynep',
        lastName: 'Kaya',
        email: 'zeynep@example.com',
        phone: '+905559876543',
      },
      shippingAddress: {
        firstName: 'Zeynep',
        lastName: 'Kaya',
        addressLine1: 'Bağdat Cad. No: 45',
        city: 'İstanbul',
        district: 'Kadıköy',
        postalCode: '34728',
        country: 'Türkiye',
      },
      billingAddress: {
        firstName: 'Zeynep',
        lastName: 'Kaya',
        addressLine1: 'Bağdat Cad. No: 45',
        city: 'İstanbul',
        district: 'Kadıköy',
        postalCode: '34728',
        country: 'Türkiye',
      },
      billingSameAsShipping: true,
      corporateBilling: null,
    }

    const mockCatalog = {
      commerce_enabled: true,
      products: [
        {
          id: 'prod-chair-1',
          name: {tr: 'Gala Sandalye'},
          buyable: true,
          price: 12000,
          currency: 'TRY',
          sku: 'BRM-GALA-01',
          sales_mode: 'DIRECT' as const,
          sale_enabled: true,
          variants: [],
        },
      ],
    }

    it('rejects client requests containing user_id or userId via Zod strict schema', () => {
      const tamperedPayload = {
        items: [{productId: 'prod-chair-1', quantity: 1}],
        checkout: validCheckout,
        user_id: 'spoofed-user-id-999',
      }

      const parseResult = createOrderRequestSchema.safeParse(tamperedPayload)
      expect(parseResult.success).toBe(false)
    })

    it('attaches verified session userId to created order on server', async () => {
      const authenticatedUserId = 'auth-user-verified-888'

      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: false,
          order_id: 'order-auth-123',
          order_number: 'BRM-20260917-AUT001',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 12000,
          grand_total: 12000,
        },
        error: null,
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const order = await createCommerceOrder(
        {
          items: [{productId: 'prod-chair-1', quantity: 1}],
          checkout: validCheckout,
        },
        {
          userId: authenticatedUserId,
          catalogBatchOverride: mockCatalog,
          supabaseClientOverride: mockSupabase,
        }
      )

      expect(mockRpc).toHaveBeenCalledWith(
        'create_commerce_order_atomic',
        expect.objectContaining({
          p_order: expect.objectContaining({
            user_id: authenticatedUserId,
            customer_email: 'zeynep@example.com',
          }),
        })
      )
      expect(order.id).toBe('order-auth-123')
      // Authenticated order does not need guestToken
      expect(order.guestToken).toBeUndefined()
    })

    it('sets user_id = null and generates signed guestToken for guest checkout', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          is_existing: false,
          order_id: 'order-guest-456',
          order_number: 'BRM-20260917-GST001',
          status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          currency: 'TRY',
          subtotal: 12000,
          grand_total: 12000,
        },
        error: null,
      })

      const mockSupabase = {
        rpc: mockRpc,
      } as unknown as import('@supabase/supabase-js').SupabaseClient

      const order = await createCommerceOrder(
        {
          items: [{productId: 'prod-chair-1', quantity: 1}],
          checkout: validCheckout,
        },
        {
          userId: null,
          catalogBatchOverride: mockCatalog,
          supabaseClientOverride: mockSupabase,
        }
      )

      expect(mockRpc).toHaveBeenCalledWith(
        'create_commerce_order_atomic',
        expect.objectContaining({
          p_order: expect.objectContaining({
            user_id: null,
          }),
        })
      )
      expect(order.id).toBe('order-guest-456')
      expect(order.guestToken).toBeDefined()
      expect(typeof order.guestToken).toBe('string')
    })
  })

  describe('5. Central Registration Contract & Role Authority Protection', () => {
    it('creates normal user with server-determined role when client sends no role', async () => {
      const generatedUserId = 'sb-auth-user-999'
      let upsertedProfile: Record<string, unknown> | null = null

      const mockSupabaseAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({data: null, error: null}),
            }),
          }),
          upsert: vi.fn().mockImplementation((record: Record<string, unknown>) => {
            upsertedProfile = record
            return Promise.resolve({data: record, error: null})
          }),
        }),
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: generatedUserId,
                  email: 'testcustomer@birim.com',
                },
              },
              error: null,
            }),
          },
        },
      }

      vi.spyOn(supabaseAdminModule, 'getSafeSupabaseAdmin').mockReturnValue(
        mockSupabaseAdmin as unknown as import('@supabase/supabase-js').SupabaseClient
      )

      const {res, state} = createMockRes()
      const req = createMockReq({
        method: 'POST',
        query: {action: 'register'},
        url: '/api/auth/register',
        body: {
          email: 'testcustomer@birim.com',
          password: 'Password123!',
          firstName: 'Leyla',
          lastName: 'Akın',
        },
      })

      await authHandler(req, res)

      expect(state.statusCode).toBe(201)
      expect(upsertedProfile).toBeDefined()
      expect(upsertedProfile?.['id']).toBe(generatedUserId)
      expect(upsertedProfile?.['email']).toBe('testcustomer@birim.com')
      expect(upsertedProfile?.['role']).toBe('user')
      expect(upsertedProfile?.['is_verified']).toBe(false)
      expect(upsertedProfile?.['architect_verification_status']).toBe('none')
    })

    it('blocks role elevation: rejects or ignores role=admin and forces canonical user role', async () => {
      const generatedUserId = 'sb-auth-user-malicious-1'
      let upsertedProfile: Record<string, unknown> | null = null

      const mockSupabaseAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({data: null, error: null}),
            }),
          }),
          upsert: vi.fn().mockImplementation((record: Record<string, unknown>) => {
            upsertedProfile = record
            return Promise.resolve({data: record, error: null})
          }),
        }),
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: generatedUserId,
                  email: 'hacker@birim.com',
                },
              },
              error: null,
            }),
          },
        },
      }

      vi.spyOn(supabaseAdminModule, 'getSafeSupabaseAdmin').mockReturnValue(
        mockSupabaseAdmin as unknown as import('@supabase/supabase-js').SupabaseClient
      )

      const {res, state} = createMockRes()
      const req = createMockReq({
        method: 'POST',
        query: {action: 'register'},
        url: '/api/auth/register',
        body: {
          email: 'hacker@birim.com',
          password: 'Password123!',
          firstName: 'Evil',
          lastName: 'User',
          role: 'admin',
          is_verified: true,
          architect_verification_status: 'approved',
          user_id: 'spoofed-id',
        },
      })

      await authHandler(req, res)

      expect(state.statusCode).toBe(201)
      expect(upsertedProfile?.['id']).toBe(generatedUserId)
      expect(upsertedProfile?.['role']).toBe('user')
      expect(upsertedProfile?.['is_verified']).toBe(false)
      expect(upsertedProfile?.['architect_verification_status']).toBe('none')
    })

    it('handles password reset request endpoint gracefully', async () => {
      const mockSupabaseAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {id: 'usr-reset-1', email: 'registered@birim.com', name: 'Ayşe'},
                error: null,
              }),
            }),
          }),
        }),
        auth: {
          admin: {
            updateUserById: vi.fn().mockResolvedValue({data: {}, error: null}),
          },
        },
      }

      vi.spyOn(supabaseAdminModule, 'getSafeSupabaseAdmin').mockReturnValue(
        mockSupabaseAdmin as unknown as import('@supabase/supabase-js').SupabaseClient
      )

      const {res, state} = createMockRes()
      const req = createMockReq({
        method: 'POST',
        query: {action: 'reset-password'},
        url: '/api/auth/reset-password',
        body: {
          email: 'registered@birim.com',
          action: 'request',
        },
      })

      await authHandler(req, res)

      expect(state.statusCode).toBe(200)
      const body = state.body as {success: boolean; message: string}
      expect(body.success).toBe(true)
    })
  })
})
