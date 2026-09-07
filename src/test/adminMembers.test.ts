import {describe, it, expect, vi, beforeEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'

// Mock Supabase admin
vi.mock('../../lib/server/supabaseAdmin.js', () => ({
  getSafeSupabaseAdmin: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'prof-1',
                email: 'mimar@birim.com',
                name: 'Ahmet Mimar',
                role: 'architect',
                architect_verification_status: 'pending',
                company: 'Birim Mimarlık',
              },
            ],
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'prof-1',
                    architect_verification_status: 'approved',
                    role: 'architect',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {}
    }),
  })),
}))

import membersHandler from '../../api/admin/members'

function createMockReqRes(overrides?: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: unknown
}) {
  const req = {
    method: overrides?.method || 'GET',
    url: overrides?.url || '/api/admin/members',
    query: {},
    headers: overrides?.headers || {},
    body: overrides?.body || {},
    socket: {remoteAddress: '127.0.0.1'},
  } as unknown as VercelRequest

  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    setHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value
      return this
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: unknown) {
      this.body = data
      return this
    },
  } as unknown as VercelResponse

  return {req, res}
}

describe('api/admin/members', () => {
  it('GET /api/admin/members üyeleri listelemeli', async () => {
    const {req, res} = createMockReqRes({
      method: 'GET',
      headers: {
        'x-admin-secret': 'birim-dev-2025',
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect((res.body as any)?.success).toBe(true)
    expect((res.body as any)?.count).toBe(1)
    expect((res.body as any)?.members[0].name).toBe('Ahmet Mimar')
  })

  it('POST /api/admin/members geçerli ID ile mimar statüsünü güncellemeli', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      headers: {
        'x-admin-secret': 'birim-dev-2025',
      },
      body: {
        id: 'prof-1',
        architect_verification_status: 'approved',
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect((res.body as any)?.success).toBe(true)
    expect((res.body as any)?.member.architect_verification_status).toBe('approved')
  })

  it('POST /api/admin/members ID verilmediğinde 400 dönmeli', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      headers: {
        'x-admin-secret': 'birim-dev-2025',
      },
      body: {},
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(400)
    expect((res.body as any)?.error).toContain("ID'si gereklidir")
  })
})
