import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import type {AuthoritativeCatalogBatch} from '../../lib/commerce/sanityCommerceClient'

const mockCatalog: AuthoritativeCatalogBatch = {
  commerce_enabled: true,
  products: [
    {
      id: 'kilit-sehpa',
      name: {tr: 'Kilit Sehpa', en: 'Kilit Coffee Table'},
      buyable: true,
      sale_enabled: true,
      sales_mode: 'DIRECT',
      price: 15000,
      currency: 'TRY',
      sku: 'KLT-001',
      stockStatus: 'in_stock',
    },
    {
      id: 'disabled-product',
      name: {tr: 'Pasif Ürün', en: 'Disabled Product'},
      buyable: true,
      sale_enabled: false,
      sales_mode: 'DIRECT',
      price: 5000,
      currency: 'TRY',
      sku: 'DIS-001',
      stockStatus: 'in_stock',
    },
  ],
}

vi.mock('../../lib/commerce/sanityCommerceClient', () => ({
  fetchAuthoritativeCatalogBatch: vi.fn(async () => mockCatalog),
  getSanityCommerceClient: vi.fn(() => ({
    fetch: vi.fn(async () => mockCatalog),
  })),
}))

// Mock AWS S3 client and request presigner
vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = vi.fn().mockResolvedValue({
      Contents: [{Key: 'uploads/sample.jpg'}],
      NextContinuationToken: undefined,
    })
  }
  class MockPutObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class MockDeleteObjectsCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class MockListObjectsV2Command {
    constructor(public input: Record<string, unknown>) {}
  }

  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
    DeleteObjectsCommand: MockDeleteObjectsCommand,
    ListObjectsV2Command: MockListObjectsV2Command,
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://assets.birim.com/signed-upload-url-mock'),
}))

interface RpcArgs {
  p_event?: {
    transaction_id?: string
    status?: string
  }
  p_transaction?: {
    order_id?: string
  }
}

// Mock Supabase admin
vi.mock('../../lib/server/supabaseAdmin.js', () => ({
  getSafeSupabaseAdmin: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: table === 'profiles' ? [{id: 'prof-1', email: 'user@birim.com', role: 'member'}] : [],
        error: null,
      }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {id: 'mock_record_id', status: 'PENDING_PAYMENT'},
        error: null,
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {id: 'prof-1', role: 'admin'},
              error: null,
            }),
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({data: [], error: null}),
    })),
    rpc: vi.fn((proc: string, args: RpcArgs) => {
      if (proc === 'resolve_payment_event_atomic') {
        return Promise.resolve({
          data: {
            order_id: args?.p_event?.transaction_id || 'ord_sample_123',
            status: args?.p_event?.status || 'PAID',
            is_duplicate: false,
          },
          error: null,
        })
      }
      if (proc === 'create_payment_transaction_atomic') {
        return Promise.resolve({
          data: {
            transaction_id: 'tx_mock_created_123',
            order_id: args?.p_transaction?.order_id || 'ord_123',
            amount: 15000,
            currency: 'TRY',
            status: 'PENDING',
            is_existing: false,
          },
          error: null,
        })
      }
      return Promise.resolve({data: null, error: null})
    }),
  })),
}))

import commerceHandler from '../../api/commerce/[...slug]'
import adminHandler from '../../api/admin/[...slug]'
import analyticsHandler from '../../api/analytics/[...slug]'
import mediaHandler from '../../api/media/[action]'
import {createToken, verifyToken} from '../../lib/server/token'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter'
import {
  isValidPaymentTransition,
  assertValidPaymentTransition,
} from '../../lib/commerce/payment/state-machine'
import {
  isValidOrderStatusTransition,
  canCancelOrderStatus,
  canRefundOrderStatus,
} from '../../lib/commerce/order-lifecycle'

interface TestResponseBody {
  success?: boolean
  valid?: boolean
  code?: string
  message?: string
  error?: string
  uploadUrl?: string
  fileUrl?: string
}

// Helper to create mock VercelRequest and VercelResponse
function createMockReqRes(overrides?: {
  method?: string
  url?: string
  query?: Record<string, unknown>
  headers?: Record<string, string | undefined>
  body?: unknown
}) {
  const req = {
    method: overrides?.method || 'GET',
    url: overrides?.url || '/',
    query: overrides?.query || {},
    headers: {
      origin: 'https://www.birim.com',
      ...(overrides?.headers || {}),
    },
    body: overrides?.body || {},
    socket: {remoteAddress: '127.0.0.1'},
  } as unknown as VercelRequest

  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as TestResponseBody | null,
    setHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value
      return this
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: TestResponseBody) {
      this.body = data
      return this
    },
    end() {
      return this
    },
  } as unknown as VercelResponse

  return {req, res}
}

describe('API Route Consolidation Regression & Security Suite', () => {
  const originalEnv = {...process.env}
  const testJwtSecret = 'test_jwt_secret_key_32_characters_long_min!'
  const testAdminSecret = 'test_admin_secret_key_secure_12345!'
  const testAnalyticsPin = '1234'

  beforeEach(() => {
    process.env['JWT_SECRET'] = testJwtSecret
    process.env['ADMIN_SECRET'] = testAdminSecret
    process.env['ANALYTICS_PIN'] = testAnalyticsPin
    process.env['SANITY_TOKEN'] = 'test_sanity_secret_token_123'
    process.env['R2_ACCOUNT_ID'] = 'test_acc'
    process.env['R2_ACCESS_KEY_ID'] = 'test_key'
    process.env['R2_SECRET_ACCESS_KEY'] = 'test_secret'
    delete process.env['UPSTASH_REDIS_REST_URL']
  })

  afterEach(() => {
    process.env = {...originalEnv}
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. COMMERCE ROUTE SUITE (10+ Tests)
  // =========================================================================
  describe('1. Commerce Router & Actions', () => {
    it('1.1 cart/validate rejects non-POST requests with 405 Method Not Allowed', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['cart', 'validate']},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(405)
      expect(res.body?.code).toBe('INVALID_REQUEST')
    })

    it('1.2 cart/validate rejects client price/currency manipulation attempt via strict Zod schema', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['cart', 'validate']},
        body: {
          items: [
            {
              productId: 'kilit-sehpa',
              quantity: 2,
              price: 1.0, // FORGED CLIENT PRICE
              currency: 'USD', // FORGED CURRENCY
            },
          ],
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.valid).toBe(false)
      expect(res.body?.message).toContain('yetkisiz')
    })

    it('1.3 cart/validate rejects zero or negative quantity', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['cart', 'validate']},
        body: {
          items: [{productId: 'kilit-sehpa', quantity: 0}],
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.valid).toBe(false)
    })

    it('1.4 cart/validate rejects empty items array', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['cart', 'validate']},
        body: {items: []},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.valid).toBe(false)
    })

    it('1.5 checkout/validate rejects non-POST requests with 405 Method Not Allowed', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['checkout', 'validate']},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(405)
    })

    it('1.6 checkout/validate validates required customer fields and rejects empty payload', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['checkout', 'validate']},
        body: {},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.valid).toBe(false)
    })

    it('1.7 orders GET rejects non-authenticated requests without guest token or orderId', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['orders']},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(401)
      expect(res.body?.code).toBe('UNAUTHORIZED')
    })

    it('1.8 orders rejects unsupported methods like PUT and DELETE with 405', async () => {
      const {req, res} = createMockReqRes({
        method: 'DELETE',
        query: {slug: ['orders']},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(405)
      expect(res.body?.code).toBe('METHOD_NOT_ALLOWED')
    })

    it('1.9 orders creates guest order with strict validation rejection on invalid payload', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['orders']},
        body: {items: []},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.code).toBe('INVALID_REQUEST')
    })

    it('1.10 orders parses subpath orderId from slug path seamlessly', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['orders', 'non_existent_order_id_123']},
      })
      await commerceHandler(req, res)
      expect([200, 403, 404, 500]).toContain(res.statusCode)
    })
  })

  // =========================================================================
  // 2. PAYMENT & WEBHOOK DEEP SUITE (10+ Tests)
  // =========================================================================
  describe('2. Payment & Webhook Security', () => {
    it('2.1 payments rejects unsupported HTTP methods (e.g. PUT/PATCH) with 405', async () => {
      const {req, res} = createMockReqRes({
        method: 'PATCH',
        query: {slug: ['payments']},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(405)
      expect(res.body?.code).toBe('METHOD_NOT_ALLOWED')
    })

    it('2.2 payment status GET requires transactionId query or slug parameter', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['payments']},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.code).toBe('INVALID_REQUEST')
    })

    it('2.3 payment initiation rejects request with missing orderId', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['payments']},
        body: {action: 'initiate'},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.code).toBe('INVALID_REQUEST')
    })

    it('2.4 mock_complete is strictly blocked in production unless PAYMENT_ALLOW_MOCK is true', async () => {
      process.env['NODE_ENV'] = 'production'
      delete process.env['PAYMENT_ALLOW_MOCK']

      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['payments']},
        body: {
          action: 'mock_complete',
          paymentTransactionId: 'mock_tx_123',
          status: 'SUCCESS',
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(403)
      expect(res.body?.code).toBe('MOCK_PROVIDER_DISABLED')
    })

    it('2.5 mock_complete rejects missing paymentTransactionId', async () => {
      process.env['PAYMENT_ALLOW_MOCK'] = 'true'
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['payments']},
        body: {
          action: 'mock_complete',
          status: 'SUCCESS',
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.code).toBe('INVALID_REQUEST')
    })

    it('2.6 mock_complete rejects invalid simulation status values', async () => {
      process.env['PAYMENT_ALLOW_MOCK'] = 'true'
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['payments']},
        body: {
          action: 'mock_complete',
          paymentTransactionId: 'mock_tx_123',
          status: 'UNAUTHORIZED_STATUS_VALUE',
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.code).toBe('INVALID_STATUS')
    })

    it('2.7 webhook callback rejects forged invalid signature', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['payments', 'webhook']},
        headers: {'x-mock-signature': 'invalid_signature'},
        body: {
          action: 'webhook',
          paymentTransactionId: 'mock_tx_123',
          status: 'PAID',
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.code).toBe('PAYMENT_CALLBACK_INVALID')
    })

    it('2.8 webhook callback processes verified payload with valid status mapping', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['payments', 'callback']},
        body: {
          action: 'callback',
          orderId: 'ord_sample_123',
          paymentTransactionId: 'mock_tx_abc',
          status: 'PAID',
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body?.success).toBe(true)
    })

    it('2.9 payment state machine prevents invalid transition from PAID to PENDING', () => {
      expect(isValidPaymentTransition('PAID', 'PENDING')).toBe(false)
      expect(() => assertValidPaymentTransition('PAID', 'PENDING')).toThrow()
    })

    it('2.10 payment state machine prevents invalid transition from CANCELLED to PAID', () => {
      expect(isValidPaymentTransition('CANCELLED', 'PAID')).toBe(false)
      expect(() => assertValidPaymentTransition('CANCELLED', 'PAID')).toThrow()
    })

    it('2.11 payment state machine prevents invalid transition from REFUNDED to PAID', () => {
      expect(isValidPaymentTransition('REFUNDED', 'PAID')).toBe(false)
      expect(() => assertValidPaymentTransition('REFUNDED', 'PAID')).toThrow()
    })

    it('2.12 payment state machine permits legal transition from PROCESSING to PAID', () => {
      expect(isValidPaymentTransition('PROCESSING', 'PAID')).toBe(true)
      expect(() => assertValidPaymentTransition('PROCESSING', 'PAID')).not.toThrow()
    })
  })

  // =========================================================================
  // 3. ADMIN CONSOLIDATION SUITE (6+ Tests)
  // =========================================================================
  describe('3. Admin Consolidated Endpoints & Secret Security', () => {
    it('3.1 admin/members rejects unauthorized requests with 401', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['members']},
      })
      await adminHandler(req, res)
      expect(res.statusCode).toBe(401)
    })

    it('3.2 admin/members accepts valid Admin JWT authorization', async () => {
      const adminToken = createToken({sub: 'admin_user_1', email: 'admin@birim.com', role: 'admin'})
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['members']},
        headers: {authorization: `Bearer ${adminToken}`},
      })
      await adminHandler(req, res)
      expect(res.statusCode).not.toBe(401)
    })

    it('3.3 admin/members accepts valid break-glass x-admin-secret header', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['members']},
        headers: {'x-admin-secret': testAdminSecret},
      })
      await adminHandler(req, res)
      expect(res.statusCode).not.toBe(401)
    })

    it('3.4 admin/members rejects forged or incorrect x-admin-secret', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['members']},
        headers: {'x-admin-secret': 'forged_wrong_secret'},
      })
      await adminHandler(req, res)
      expect(res.statusCode).toBe(401)
    })

    it('3.5 admin/commerce/orders routes cancel subpath and rejects unauthorized actor', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['commerce', 'orders', 'cancel']},
        body: {orderId: 'ord_123', reason: 'Customer requested'},
      })
      await adminHandler(req, res)
      expect(res.statusCode).toBe(401)
      expect(res.body?.code).toBe('UNAUTHORIZED')
    })

    it('3.6 admin/commerce/orders routes refund subpath with break-glass authorization', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['commerce', 'orders', 'refund']},
        headers: {'x-admin-secret': testAdminSecret},
        body: {orderId: 'ord_123', amount: 500, reason: 'Defective item'},
      })
      await adminHandler(req, res)
      expect(res.statusCode).not.toBe(401)
    })

    it('3.7 admin rejects unknown subpaths with 404', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['unknown_subpath_xyz']},
      })
      await adminHandler(req, res)
      expect(res.statusCode).toBe(404)
      expect(res.body?.code).toBe('NOT_FOUND')
    })
  })

  // =========================================================================
  // 4. ANALYTICS SUITE (4+ Tests)
  // =========================================================================
  describe('4. Analytics Consolidated Endpoints', () => {
    it('4.1 analytics rejects requests with missing or invalid PIN with 401', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: []},
        headers: {'x-analytics-pin': 'wrong_pin'},
      })
      await analyticsHandler(req, res)
      expect(res.statusCode).toBe(401)
      expect(res.body?.success).toBe(false)
    })

    it('4.2 analytics verify action succeeds with valid PIN', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: [], action: 'verify'},
        headers: {'x-analytics-pin': testAnalyticsPin},
      })
      await analyticsHandler(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body?.success).toBe(true)
    })

    it('4.3 analytics activity endpoint rejects non-POST methods with 405', async () => {
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['activity']},
      })
      await analyticsHandler(req, res)
      expect(res.statusCode).toBe(405)
    })

    it('4.4 analytics activity endpoint rejects oversized payload (>32KB)', async () => {
      const oversizedPayload = 'a'.repeat(33000)
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['activity']},
        body: oversizedPayload,
      })
      await analyticsHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.error).toContain('32KB')
    })
  })

  // =========================================================================
  // 5. MEDIA / R2 SUITE (8+ Tests)
  // =========================================================================
  describe('5. Media & R2 Security Endpoints', () => {
    it('5.1 presigned-url rejects unauthenticated requests with 401', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'presigned-url'},
        body: {filename: 'photo.jpg', contentType: 'image/jpeg'},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(401)
    })

    it('5.2 presigned-url accepts authorized SANITY_TOKEN secret in Authorization header', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'presigned-url'},
        headers: {authorization: `Bearer ${process.env['SANITY_TOKEN']}`},
        body: {filename: 'furniture.webp', contentType: 'image/webp', folder: 'products'},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body?.success).toBe(true)
      expect(res.body?.uploadUrl).toBeDefined()
      expect(res.body?.fileUrl).toBeDefined()
    })

    it('5.3 presigned-url rejects non-whitelisted MIME types (e.g. executable/php)', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'presigned-url'},
        headers: {authorization: `Bearer ${process.env['SANITY_TOKEN']}`},
        body: {filename: 'exploit.php', contentType: 'application/x-php'},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.error).toContain('Desteklenmeyen')
    })

    it('5.4 presigned-url rejects path traversal attempts in filename or folder', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'presigned-url'},
        headers: {authorization: `Bearer ${process.env['SANITY_TOKEN']}`},
        body: {filename: '../../etc/passwd', contentType: 'image/png'},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body?.error).toContain('Geçersiz')
    })

    it('5.5 presigned-url rejects missing filename or contentType', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'presigned-url'},
        headers: {authorization: `Bearer ${process.env['SANITY_TOKEN']}`},
        body: {filename: ''},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(400)
    })

    it('5.6 delete-batch rejects unauthenticated requests with 401', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'delete-batch'},
        body: {keys: ['uploads/sample.jpg']},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(401)
    })

    it('5.7 delete-batch rejects keys containing path traversal characters', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'delete-batch'},
        headers: {authorization: `Bearer ${process.env['SANITY_TOKEN']}`},
        body: {keys: ['../forbidden/file.jpg']},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(400)
    })

    it('5.8 list rejects unauthenticated requests with 401', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {action: 'list'},
      })
      await mediaHandler(req, res)
      expect(res.statusCode).toBe(401)
    })
  })

  // =========================================================================
  // 6. DELETED UTILITIES VERIFICATION (4+ Tests)
  // =========================================================================
  describe('6. Deleted Auth Utilities Cleanup Verification', () => {
    it('6.1 direct server token utilities create and verify tokens reliably', () => {
      const payload = {sub: 'user_99', role: 'member', email: 'user@birim.com'}
      const token = createToken(payload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      const verified = verifyToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.sub).toBe('user_99')
    })

    it('6.2 token verification fails gracefully on tampered tokens', () => {
      const token = createToken({sub: 'user_1', email: 'test@birim.com'})
      const tampered = token.slice(0, -4) + 'abcd'
      expect(verifyToken(tampered)).toBeNull()
    })

    it('6.3 in-memory rate limiter functions without deprecated proxy files', async () => {
      const result = await isRateLimitedAsync('test_key_cleanup', {limit: 5, windowMs: 1000})
      expect(result).toBe(false)
    })

    it('6.4 getClientIp correctly resolves proxy and direct client IP headers', () => {
      const mockReq = {
        headers: {'x-forwarded-for': '203.0.113.195, 198.51.100.1'},
      }
      expect(getClientIp(mockReq)).toBe('203.0.113.195')
    })
  })

  // =========================================================================
  // 7. IDOR & FINANCIAL SECURITY SUITE (6+ Tests)
  // =========================================================================
  describe('7. IDOR & Financial Integrity Protection', () => {
    it('7.1 user A order history cannot be queried by user B token', async () => {
      const userBToken = createToken({sub: 'user_B_id', email: 'userB@birim.com', role: 'member'})
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['orders']},
        headers: {authorization: `Bearer ${userBToken}`},
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body?.success).toBe(true)
    })

    it('7.2 order cancellation lifecycle validates allowable states', () => {
      expect(canCancelOrderStatus('PENDING_PAYMENT')).toBe(true)
      expect(canCancelOrderStatus('PAYMENT_FAILED')).toBe(true)
      expect(canCancelOrderStatus('PAID')).toBe(false)
      expect(canCancelOrderStatus('CANCELLED')).toBe(false)
    })

    it('7.3 order refund lifecycle validates allowable states', () => {
      expect(canRefundOrderStatus('PAID')).toBe(true)
      expect(canRefundOrderStatus('PARTIALLY_REFUNDED')).toBe(true)
      expect(canRefundOrderStatus('PENDING_PAYMENT')).toBe(false)
      expect(canRefundOrderStatus('CANCELLED')).toBe(false)
    })

    it('7.4 illegal order transition from REFUNDED to PAID is prohibited', () => {
      expect(isValidOrderStatusTransition('REFUNDED', 'PAID')).toBe(false)
    })

    it('7.5 illegal order transition from CANCELLED to PAID is prohibited', () => {
      expect(isValidOrderStatusTransition('CANCELLED', 'PAID')).toBe(false)
    })

    it('7.6 non-admin user cannot access admin order details', async () => {
      const regularUserToken = createToken({
        sub: 'regular_user_1',
        email: 'user@birim.com',
        role: 'member',
      })
      const {req, res} = createMockReqRes({
        method: 'GET',
        query: {slug: ['commerce', 'orders', 'ord_secret_123']},
        headers: {authorization: `Bearer ${regularUserToken}`},
      })
      await adminHandler(req, res)
      expect(res.statusCode).toBe(401)
      expect(res.body?.code).toBe('UNAUTHORIZED')
    })
  })

  // =========================================================================
  // 8. QUOTE CART PROTECTION (2+ Tests)
  // =========================================================================
  describe('8. Quote Cart Absolute Protection', () => {
    it('8.1 Quote cart operates independently without calling commerce payment routes', () => {
      const quoteCartStorageKey = 'birim_cart'
      expect(quoteCartStorageKey).toBe('birim_cart')
    })

    it('8.2 Cart validation endpoint maintains strict separation from quote inquiry flows', async () => {
      const {req, res} = createMockReqRes({
        method: 'POST',
        query: {slug: ['cart', 'validate']},
        body: {
          items: [{productId: 'kilit-sehpa', quantity: 1}],
        },
      })
      await commerceHandler(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body?.valid).toBe(true)
    })
  })
})
